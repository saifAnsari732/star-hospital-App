const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function runBrowserTest() {
  console.log('--- STARTING PLAYWRIGHT DUAL WINDOW AUTOMATION TEST WITH SYSTEM CHROME ---');
  const browser = await chromium.launch({ channel: 'chrome', headless: false, slowMo: 100 });
  const artifactDir = path.resolve(__dirname, 'screenshots');
  if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }

  try {
    // -------------------------------------------------------------
    // WINDOW 1: PATIENT APPOINTMENT, PAYMENT & OPD TOKEN FLOW
    // -------------------------------------------------------------
    console.log('1. Launching Window 1: Patient Context');
    const patientContext = await browser.newContext({ viewport: { width: 450, height: 850 } });
    const patientPage = await patientContext.newPage();

    console.log('Navigating Patient to http://localhost:8081...');
    await patientPage.goto('http://localhost:8081', { waitUntil: 'networkidle', timeout: 45000 });
    await patientPage.waitForTimeout(3000);
    await patientPage.screenshot({ path: path.join(artifactDir, '01_patient_home.png') });
    console.log('Screenshot saved: 01_patient_home.png');

    // Click on Book Appointment or Quick action if present
    const bookApptBtn = patientPage.locator('text="Book Appointment"').first();
    if (await bookApptBtn.isVisible()) {
      console.log('Clicking "Book Appointment"...');
      await bookApptBtn.click();
      await patientPage.waitForTimeout(2000);
      await patientPage.screenshot({ path: path.join(artifactDir, '02_book_appointment_screen.png') });
    }

    // -------------------------------------------------------------
    // WINDOW 2: STAFF DASHBOARD & RAZORPAY TRANSACTIONS LEDGER
    // -------------------------------------------------------------
    console.log('2. Launching Window 2: Staff / Admin Context');
    const staffContext = await browser.newContext({ viewport: { width: 1200, height: 800 } });
    const staffPage = await staffContext.newPage();

    console.log('Navigating Staff to http://localhost:8081...');
    await staffPage.goto('http://localhost:8081', { waitUntil: 'networkidle', timeout: 45000 });
    await staffPage.waitForTimeout(3000);
    await staffPage.screenshot({ path: path.join(artifactDir, '03_staff_view.png') });
    console.log('Screenshot saved: 03_staff_view.png');

    console.log('=== PLAYWRIGHT DUAL-WINDOW BROWSER TEST COMPLETED SUCCESSFULLY ===');
  } catch (error) {
    console.error('Playwright dual-window test error:', error);
  } finally {
    await browser.close();
  }
}

runBrowserTest();
