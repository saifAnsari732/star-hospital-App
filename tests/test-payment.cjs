const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testPaymentAndLedger() {
  console.log('=== TEST 2: INTERACTING WITH RAZORPAY PAYMENT & TOKEN MODAL ===');
  const browser = await chromium.launch({ channel: 'chrome', headless: false, slowMo: 120 });
  const artifactDir = path.resolve(__dirname, 'screenshots');

  try {
    const context = await browser.newContext({ viewport: { width: 450, height: 900 } });
    const page = await context.newPage();

    // 1. Login as Patient
    await page.goto('http://localhost:8081', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const patChip = page.locator('text="PAT-1001"').first();
    await patChip.click();
    await page.waitForTimeout(3000);

    // 2. Go to Book Appointment
    console.log('Opening Book Appointment...');
    const bookBtn = page.locator('text="Book Appointment"').first();
    await bookBtn.click();
    await page.waitForTimeout(2500);

    // 3. Select first doctor and confirm slot
    const selectDocBtn = page.locator('text="Book Appointment"').first();
    if (await selectDocBtn.isVisible()) {
      await selectDocBtn.click();
      await page.waitForTimeout(2000);
    }

    // Pick first available slot chip
    const slotChip = page.locator('text="10:00 AM"').first();
    if (await slotChip.isVisible()) {
      await slotChip.click();
      await page.waitForTimeout(1000);
    }

    // Confirm Booking
    const confirmBtn = page.locator('text="Confirm Booking"').first();
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: path.join(artifactDir, '04_booking_confirmation.png') });
      console.log('Captured: 04_booking_confirmation.png');

      // Click "Pay Online & Get Instant Token"
      const payOnlineBtn = page.locator('text="Pay Online & Get Instant Token"').first();
      if (await payOnlineBtn.isVisible()) {
        console.log('Clicking "Pay Online & Get Instant Token"...');
        await payOnlineBtn.click();
        await page.waitForTimeout(3000);
        await page.screenshot({ path: path.join(artifactDir, '05_razorpay_payment_details.png') });
        console.log('Captured: 05_razorpay_payment_details.png');

        // Click "Pay Now"
        const payNowBtn = page.locator('text="Pay Now"').first();
        if (await payNowBtn.isVisible()) {
          console.log('Executing Razorpay Payment...');
          await payNowBtn.click();
          await page.waitForTimeout(4000);
          await page.screenshot({ path: path.join(artifactDir, '06_instant_opd_token_popup.png') });
          console.log('Captured: 06_instant_opd_token_popup.png');
        }
      }
    }
  } catch (err) {
    console.error('Error in testPaymentAndLedger:', err);
  } finally {
    await browser.close();
  }
}

testPaymentAndLedger();
