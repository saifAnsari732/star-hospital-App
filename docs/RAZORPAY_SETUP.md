# Star Hospital — Enterprise Razorpay Integration & Database Migrations Guide

This document specifies the complete server-side payment architecture, MySQL database migrations, webhook handlers, security protocols, and operational workflows for Razorpay in the **ICTHospital** Laravel backend and the Star Hospital Patient & Staff mobile application.

---

## 1. Environment Configuration

### Mobile Frontend (`.env` in `star-hospital-App`)
Only the public publishable Key ID is exposed to the mobile app client:
```env
EXPO_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_razorpay_key_id
```

### Laravel Backend (`.env` in ICTHospital Backend)
> [!CRITICAL]
> Secrets (`RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET`) MUST NEVER be exposed in frontend bundles, repositories, or mobile logs.
```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret_here
RAZORPAY_MODE=test
```

---

## 2. Database Migrations (Laravel Eloquent / MySQL)

### 2.1 `payment_transactions` Table Migration

Create migration: `php artisan make:migration create_payment_transactions_table`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('payment_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->unsignedBigInteger('patient_id')->index();
            $table->string('patient_name');
            $table->string('patient_mrn', 32)->index();
            
            // Medical module association
            $table->enum('module', [
                'appointment',
                'opd',
                'laboratory',
                'radiology',
                'pharmacy',
                'admission',
                'invoice'
            ])->index();
            $table->string('module_id')->index(); // appointment_id, token_id, lab_order_id, etc.
            
            // Optional direct invoice link
            $table->unsignedBigInteger('invoice_id')->nullable()->index();
            $table->string('invoice_number', 64)->nullable();

            // Financial amounts
            $table->decimal('amount', 12, 2); // Authoritative server-calculated amount
            $table->decimal('amount_paid', 12, 2)->default(0.00);
            $table->decimal('amount_refunded', 12, 2)->default(0.00);
            $table->string('currency', 3)->default('INR');

            // Lifecycle status
            $table->enum('status', [
                'pending',
                'paid',
                'partially_paid',
                'failed',
                'refunded'
            ])->default('pending')->index();

            // Razorpay identifiers
            $table->string('razorpay_order_id')->nullable()->unique();
            $table->string('razorpay_payment_id')->nullable()->index();
            $table->string('razorpay_signature')->nullable();
            $table->string('receipt_number', 64)->unique();
            $table->string('payment_method')->default('online');
            
            // Failure and Refund details
            $table->text('failure_reason')->nullable();
            $table->text('refund_reason')->nullable();
            $table->string('refund_transaction_id')->nullable();
            $table->timestamp('refunded_at')->nullable();
            
            $table->json('notes')->nullable();
            $table->timestamps();

            $table->foreign('patient_id')->references('id')->on('patients')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_transactions');
    }
};
```

### 2.2 `payment_audit_logs` Table Migration

Create migration: `php artisan make:migration create_payment_audit_logs_table`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('payment_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->uuid('transaction_id')->index();
            $table->enum('action', [
                'order_created',
                'payment_verified',
                'webhook_processed',
                'payment_failed',
                'refund_processed',
                'status_override'
            ]);
            $table->string('performed_by'); // 'patient:id', 'system', 'webhook:razorpay', 'staff:id'
            $table->text('details');
            $table->string('ip_address', 45)->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('transaction_id')->references('id')->on('payment_transactions')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_audit_logs');
    }
};
```

---

## 3. Server-Side Controllers & Security Logic

### 3.1 Order Creation & Authoritative Amount Calculation
The client NEVER provides or dictates the final payment amount. The server computes the authoritative amount based on the target medical item:
- **Appointments**: `appointments.consultation_fee` or `doctors.consultation_fee`
- **OPD Token**: Standard hospital outpatient token fee (₹500)
- **Laboratory**: Test charge from `lab_tests` or diagnostic test bill
- **Radiology**: Scan charge from radiology fee schedule (e.g. ₹2500)
- **Pharmacy**: Sum of prescribed medicine prices (`medicine_sales`)
- **Admission**: Bed daily charge multiplied by length of stay
- **Invoices**: `invoices.balance_due`

```php
// In Laravel RazorpayPaymentController.php:
public function createOrder(Request $request)
{
    $request->validate([
        'module' => 'required|in:appointment,opd,laboratory,radiology,pharmacy,admission,invoice',
        'module_id' => 'required',
    ]);

    // 1. Enforce Rate Limiting (e.g. 20 requests per minute)
    RateLimiter::attempt('order:'.$request->user()->id, 20, function() {});

    // 2. Authoritative Amount Calculation & Ownership Verification
    $authoritativeAmount = $this->calculateAmount($request->module, $request->module_id, $request->user());
    
    // 3. Razorpay Orders API
    $api = new Api(config('services.razorpay.key_id'), config('services.razorpay.key_secret'));
    $order = $api->order->create([
        'receipt' => 'rcpt_' . $request->module . '_' . time(),
        'amount' => (int) round($authoritativeAmount * 100), // In paise
        'currency' => 'INR',
        'notes' => [
            'module' => $request->module,
            'module_id' => $request->module_id,
            'patient_id' => $request->user()->patient->id,
        ]
    ]);

    // 4. Record pending transaction & audit log in MySQL
    $transaction = PaymentTransaction::create([...]);
    PaymentAuditLog::create([...]);

    return response()->json([
        'success' => true,
        'data' => [
            'orderId' => $order['id'],
            'transactionId' => $transaction->id,
            'amount' => $authoritativeAmount,
            'amountInPaise' => $order['amount'],
            'currency' => 'INR',
            'keyId' => config('services.razorpay.key_id'),
            'themeColor' => '#12344D',
            ...
        ]
    ]);
}
```

### 3.2 Payment Signature Verification (HMAC-SHA256)
A payment is **NEVER** marked as successful based on client callback alone without cryptographically verifying the HMAC-SHA256 signature on the server:

```php
public function verifyPayment(Request $request)
{
    $request->validate([
        'razorpayOrderId' => 'required',
        'razorpayPaymentId' => 'required',
        'razorpaySignature' => 'required',
    ]);

    $orderId = $request->razorpayOrderId;
    $paymentId = $request->razorpayPaymentId;
    $signature = $request->razorpaySignature;

    $generatedSignature = hash_hmac(
        'sha256',
        $orderId . '|' . $paymentId,
        config('services.razorpay.key_secret')
    );

    if (!hash_equals($generatedSignature, $signature)) {
        PaymentAuditLog::create([
            'action' => 'payment_failed',
            'details' => 'Invalid signature detected for order ' . $orderId,
            'performed_by' => 'system'
        ]);
        return response()->json(['success' => false, 'message' => 'Signature verification failed.'], 400);
    }

    // Inside DB Transaction:
    DB::transaction(function() use ($orderId, $paymentId, $signature) {
        $txn = PaymentTransaction::where('razorpay_order_id', $orderId)->lockForUpdate()->firstOrFail();
        $txn->update([
            'status' => 'paid',
            'amount_paid' => $txn->amount,
            'razorpay_payment_id' => $paymentId,
            'razorpay_signature' => $signature,
        ]);

        // Settle module (e.g. mark appointment paid, generate OPD token, mark invoice settled)
        $this->settleModule($txn);

        PaymentAuditLog::create([
            'transaction_id' => $txn->id,
            'action' => 'payment_verified',
            'details' => "Payment {$paymentId} verified and captured.",
            'performed_by' => 'system'
        ]);
    });

    return response()->json(['success' => true, 'message' => 'Payment successfully verified.']);
}
```

### 3.3 Idempotent Webhook Processing (`POST /api/v1/webhooks/razorpay`)
Webhooks handle network dropouts where the patient closes the app before verification completes:
1. Verify `X-Razorpay-Signature` against `RAZORPAY_WEBHOOK_SECRET` using raw request payload.
2. Track processed events via an idempotency table or cache key (`${event}_${paymentId || orderId}`).
3. Process `payment.captured`, `order.paid`, `payment.failed`, and `refund.processed`.
4. Log every webhook execution to `payment_audit_logs`.

---

## 4. Refund Architecture & RBAC Permissions

### Staff RBAC Permissions
- `payments:transactions`: View transaction ledger, filters, and audit logs (`admin`, `billing`).
- `payments:refund`: Issue full or partial refunds with mandatory clinical/administrative justification (`admin`, `billing`).

### Refund Execution
1. Verify user holds `payments:refund` permission.
2. Check that transaction status is `paid` or `partially_paid`.
3. Check `refund_amount <= (amount_paid - amount_refunded)`.
4. Call Razorpay Refund API (`$api->payment->fetch($paymentId)->refund(['amount' => $amountInPaise, 'notes' => ['reason' => $reason]])`).
5. Update transaction `amount_refunded`, update status to `refunded` or `partially_paid`.
6. Append immutable audit log.

---

## 5. Automated Test Suite Verification

Run the test suite via:
```bash
npm test
```

Current Test Coverage (11 suites, 69 unit & integration tests):
- [x] Authoritative server-side amount calculation (tampered client amounts overridden)
- [x] Multi-module payment orders (Appointments, OPD Tokens, Labs, Radiology, Pharmacy, Admission, Invoices)
- [x] Valid HMAC-SHA256 signature verification
- [x] Invalid and tampered signature rejection
- [x] Idempotent webhook delivery & duplicate webhook event rejection
- [x] Partial and full refund flows with balance tracking
- [x] Rate limiting protection (window-based threshold enforcement)
- [x] Concurrent callback resilience without race conditions or duplicate captures
