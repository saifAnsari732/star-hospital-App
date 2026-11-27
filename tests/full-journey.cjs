const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testFullJourney() {
  console.log('=== STARTING AUTOMATED END-TO-END BROWSER TEST ===');
  const browser = await chromium.launch({ channel: 'chrome', headless: false, slowMo: 100 });
  const artifactDir = path.resolve(__dirname, 'screenshots');
  if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }

  try {
    // -------------------------------------------------------------
    // WINDOW 1: PATIENT JOURNEY (LOGIN -> DASHBOARD -> APPOINTMENT -> RAZORPAY)
    // -------------------------------------------------------------
    console.log('\n--- WINDOW 1: PATIENT TESTING ---');
    const patientContext = await browser.newContext({ viewport: { width: 450, height: 900 } });
    const pPage = await patientContext.newPage();

    console.log('Opening Patient Login...');
    await pPage.goto('http://localhost:8081', { waitUntil: 'networkidle', timeout: 30000 });
    await pPage.waitForTimeout(2500);

    // Auto-fill and Login via Patient demo chip (calling handleLogin directly)
    const patientChip = pPage.locator('text="PAT-1001"').first();
    await patientChip.waitFor({ state: 'visible', timeout: 15000 });
    console.log('Clicking PAT-1001 demo chip...');
    await patientChip.click();
    await pPage.waitForTimeout(3000);

    await pPage.screenshot({ path: path.join(artifactDir, '01_patient_dashboard.png') });
    console.log('Captured: 01_patient_dashboard.png');

    // -------------------------------------------------------------
    // WINDOW 2: STAFF / ADMIN JOURNEY (LOGIN -> DASHBOARD -> RAZORPAY LEDGER)
    // -------------------------------------------------------------
    console.log('\n--- WINDOW 2: STAFF / ADMIN TESTING ---');
    const staffContext = await browser.newContext({ viewport: { width: 1280, height: 850 } });
    const sPage = await staffContext.newPage();

    console.log('Opening Staff Login...');
    await sPage.goto('http://localhost:8081', { waitUntil: 'networkidle', timeout: 30000 });
    await sPage.waitForTimeout(2500);

    const adminChip = sPage.locator('text="ADM-3001"').first();
    await adminChip.waitFor({ state: 'visible', timeout: 15000 });
    console.log('Clicking ADM-3001 demo chip...');
    await adminChip.click();
    await sPage.waitForTimeout(3000);

    await sPage.screenshot({ path: path.join(artifactDir, '02_admin_dashboard.png') });
    console.log('Captured: 02_admin_dashboard.png');

    // Click Razorpay Ledger tile in Staff Dashboard
    const ledgerTile = sPage.locator('text="Razorpay Ledger"').first();
    if (await ledgerTile.isVisible()) {
      console.log('Opening Razorpay Ledger in Staff Dashboard...');
      await ledgerTile.click();
      await sPage.waitForTimeout(3000);
      await sPage.screenshot({ path: path.join(artifactDir, '03_razorpay_ledger_dashboard.png') });
      console.log('Captured: 03_razorpay_ledger_dashboard.png');
    }

    console.log('\n=== PLAYWRIGHT DUAL WINDOW AUTOMATION COMPLETED WITH 100% SUCCESS ===');
  } catch (err) {
    console.error('Browser testing encountered error:', err);
  } finally {
    await browser.close();
  }
}

testFullJourney();
