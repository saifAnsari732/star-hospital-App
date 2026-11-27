const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testDualFlow() {
  const screenshotDir = path.join(__dirname, 'test-artifacts');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  console.log('Launching browser with Chrome...');
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });

  let page1, page2;

  try {
    // ==========================================
    // WINDOW 1: Patient Flow
    // ==========================================
    console.log('\n--- STARTING WINDOW 1: PATIENT FLOW ---');
    const context1 = await browser.newContext({
      viewport: { width: 1280, height: 900 }
    });
    page1 = await context1.newPage();

    console.log('Navigating Window 1 to http://localhost:8081 ...');
    await page1.goto('http://localhost:8081', { waitUntil: 'load', timeout: 45000 });
    await page1.waitForTimeout(3000);

    // Click Login on Welcome screen
    console.log('Clicking Login button on Welcome screen...');
    await page1.getByRole('button', { name: 'Login' }).click();
    await page1.waitForTimeout(3000);

    // Click Patient Demo Account Card
    console.log('Clicking Patient Demo Account card...');
    await page1.getByText('Patient (Default Role)').click();
    await page1.waitForTimeout(4000);

    await page1.screenshot({ path: path.join(screenshotDir, '02_patient_home.png'), timeout: 5000 });
    console.log('Screenshot 02_patient_home captured.');

    // Click Find Doctors button in Home Banner
    console.log('Clicking Find Doctors...');
    await page1.getByText('Find Doctors').first().click();
    await page1.waitForTimeout(3000);

    // Click Doctor card Dr. Amit Sharma
    console.log('Clicking Doctor card Dr. Amit Sharma...');
    const doctorCard = page1.locator('[aria-label*="Dr. Amit Sharma"]').first();
    await doctorCard.click();
    await page1.waitForTimeout(3000);

    await page1.screenshot({ path: path.join(screenshotDir, '04_doctor_profile.png'), timeout: 5000 });
    console.log('Screenshot 04_doctor_profile captured.');

    // Click bottom bar Book Appointment button with force: true
    console.log('Clicking bottom bar Book Appointment button...');
    const bottomBookBtn = page1.locator('[role="button"]:has-text("Book Appointment")').last();
    await bottomBookBtn.click({ force: true });
    await page1.waitForTimeout(3500);

    await page1.screenshot({ path: path.join(screenshotDir, '04b_select_slot.png'), timeout: 5000 });
    console.log('Screenshot 04b_select_slot captured.');

    // Click slot if available
    console.log('Selecting slot...');
    const slotBtn = page1.locator('[role="button"]:has-text("AM"), [role="button"]:has-text("PM")').first();
    if (await slotBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await slotBtn.click({ force: true });
      await page1.waitForTimeout(1000);
    }

    // Click "Confirm Appointment"
    console.log('Clicking Confirm Appointment button...');
    const confirmApptBtn = page1.locator('[aria-label="Proceed to confirmation"], [role="button"]:has-text("Confirm Appointment")').first();
    await confirmApptBtn.click({ force: true });
    await page1.waitForTimeout(4000);

    await page1.screenshot({ path: path.join(screenshotDir, '05_booking_confirmation.png'), timeout: 5000 });
    console.log('Screenshot 05_booking_confirmation captured.');

    // Step 1: Click "Pay ₹1,500 & Confirm Appointment" in BookingConfirmation
    console.log('Locating and clicking Pay Consultation Fee button in BookingConfirmation...');
    const payApptBtn = page1.locator('[aria-label="Pay Consultation Fee and Confirm Appointment"]').first();
    await payApptBtn.waitFor({ state: 'attached', timeout: 15000 });
    console.log('Clicking Pay & Confirm Appointment button...');
    await payApptBtn.click({ force: true });
    await page1.waitForTimeout(3000);

    // In Razorpay Modal: click "Pay ₹1,000.00" button
    console.log('Checking for Razorpay Modal checkout button...');
    const razorpayModalPayBtn = page1.locator('button:has-text("Pay ₹"), [role="button"]:has-text("Pay ₹")').last();
    if (await razorpayModalPayBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('Clicking Razorpay modal Pay button...');
      await razorpayModalPayBtn.click({ force: true });
      await page1.waitForTimeout(4000);
    }

    // Step 2: Instant OPD Token Generation Popup / Confirmation
    await page1.screenshot({ path: path.join(screenshotDir, '07_instant_token_popup.png'), timeout: 5000 });
    console.log('Screenshot 07_instant_token_popup captured.');

    const popupContent = await page1.innerText('body');
    console.log('Popup Verification Findings:');
    console.log('- Token generated:', /Token|TOKEN/i.test(popupContent));
    console.log('- Chamber displayed:', /Chamber|CHAMBER|Room/i.test(popupContent));
    console.log('- Queue position displayed:', /Queue|Position|Ahead|Patients/i.test(popupContent));

    // Open receipt
    const receiptBtn = page1.locator('text=View Official Payment Receipt, text=View Official Medical Receipt, text=Receipt, [role="button"]:has-text("Receipt")').first();
    if (await receiptBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('Clicking View Official Medical / Payment Receipt...');
      await receiptBtn.click({ force: true });
      await page1.waitForTimeout(3000);
      await page1.screenshot({ path: path.join(screenshotDir, '08_payment_receipt.png'), timeout: 5000 });
      console.log('Screenshot 08_payment_receipt captured.');
      
      // Go back or navigate to live queue tracker
      await page1.goBack().catch(() => {});
      await page1.waitForTimeout(2000);
    }

    // Navigate to live queue tracker
    const queueTrackerBtn = page1.locator('[aria-label="Open Live OPD Queue Tracker"], [role="button"]:has-text("Live OPD Queue"), [role="button"]:has-text("Live Queue"), [role="button"]:has-text("Track Queue")').first();
    if (await queueTrackerBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
      console.log('Clicking Live Queue Tracker...');
      await queueTrackerBtn.click({ force: true });
      await page1.waitForTimeout(3000);
      await page1.screenshot({ path: path.join(screenshotDir, '09_live_queue_tracker.png'), timeout: 5000 });
      console.log('Screenshot 09_live_queue_tracker captured.');
    }


    // ==========================================
    // WINDOW 2: Staff / Admin Flow
    // ==========================================
    console.log('\n--- STARTING WINDOW 2: STAFF / ADMIN FLOW ---');
    const context2 = await browser.newContext({
      viewport: { width: 1280, height: 900 }
    });
    page2 = await context2.newPage();

    console.log('Navigating Window 2 to http://localhost:8081 ...');
    await page2.goto('http://localhost:8081', { waitUntil: 'load', timeout: 45000 });
    await page2.waitForTimeout(3000);

    // Sign in as Hospital Admin
    console.log('Signing in as Hospital Admin...');
    await page2.getByText('Hospital Admin (Assigns Roles)').click();
    await page2.waitForTimeout(4000);

    await page2.screenshot({ path: path.join(screenshotDir, '10_staff_dashboard.png'), timeout: 5000 });
    console.log('Screenshot 10_staff_dashboard captured.');

    // Access Razorpay Ledger
    console.log('Locating Razorpay Ledger action in Permitted Workflows...');
    const ledgerAction = page2.locator('text=Razorpay Ledger').first();
    await ledgerAction.scrollIntoViewIfNeeded({ timeout: 10000 }).catch(async () => {
      await page2.evaluate(() => {
        const el = Array.from(document.querySelectorAll('*')).find(e => e.textContent && e.textContent.includes('Razorpay Ledger'));
        if (el) el.scrollIntoView();
      });
    });
    await page2.waitForTimeout(1000);
    await ledgerAction.click({ force: true });
    await page2.waitForTimeout(3500);

    await page2.screenshot({ path: path.join(screenshotDir, '11_staff_transactions_dashboard.png'), timeout: 5000 });
    console.log('Screenshot 11_staff_transactions_dashboard captured.');

    // Verify KPI metrics & transaction list
    const staffBody = await page2.innerText('body');
    const hasTotalCollections = /TOTAL SETTLED|₹|collection/i.test(staffBody);
    const hasRefundedKPI = /REFUNDED/i.test(staffBody);
    const hasTxnList = /TXN-|RAZORPAY|₹|Rs|Receipt/i.test(staffBody);
    console.log(`Staff Dashboard KPI Verification -> Total Settled: ${hasTotalCollections}, Refunded: ${hasRefundedKPI}`);
    console.log(`Staff Dashboard Transaction List reflected: ${hasTxnList}`);

    // Test Refund trigger dialog
    console.log('Testing refund trigger dialog...');
    const refundBtn = page2.locator('text=Initiate Refund').first();
    await refundBtn.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
    if (await refundBtn.isVisible().catch(() => false)) {
      console.log('Clicking Initiate Refund button...');
      await refundBtn.click({ force: true });
      await page2.waitForTimeout(2000);
      await page2.screenshot({ path: path.join(screenshotDir, '12_refund_dialog.png'), timeout: 5000 });
      console.log('Screenshot 12_refund_dialog captured.');

      // Fill in reason and test submit
      const reasonInput = page2.locator('textarea, input[placeholder*="Doctor cancelled"]').first();
      if (await reasonInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await reasonInput.fill('Patient requested cancellation prior to consult');
      }
      await page2.screenshot({ path: path.join(screenshotDir, '13_refund_dialog_filled.png'), timeout: 5000 });
      console.log('Screenshot 13_refund_dialog_filled captured.');
    } else {
      console.log('Initiate Refund button not visible directly, searching all matching...');
      await page2.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('*')).find(e => e.textContent && e.textContent.trim() === 'Initiate Refund');
        if (btn) btn.click();
      });
      await page2.waitForTimeout(2000);
      await page2.screenshot({ path: path.join(screenshotDir, '12_refund_dialog.png'), timeout: 5000 });
    }

    console.log('\n=============================================');
    console.log('ALL DUAL WINDOW BROWSER TESTS FULLY EXECUTED!');
    console.log('=============================================');

  } catch (err) {
    console.error('Test execution failed:', err);
    if (page1) await page1.screenshot({ path: path.join(screenshotDir, 'err_page1.png'), timeout: 5000 }).catch(() => {});
    if (page2) await page2.screenshot({ path: path.join(screenshotDir, 'err_page2.png'), timeout: 5000 }).catch(() => {});
  } finally {
    await browser.close();
  }
}

testDualFlow();
