import { chromium } from 'playwright';

const TEST_URL = 'http://localhost:3333/tests';
const TIMEOUT = 60000;

async function run() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Collect console output
  const logs = [];
  page.on('console', (msg) => {
    logs.push(`[${msg.type()}] ${msg.text()}`);
  });

  page.on('pageerror', (err) => {
    logs.push(`[PAGE ERROR] ${err.message}`);
  });

  console.log(`Navigating to ${TEST_URL}...`);
  await page.goto(TEST_URL, { waitUntil: 'networkidle', timeout: 30000 });

  // Wait for tests to complete - look for the summary banner
  console.log('Waiting for tests to complete...');
  try {
    await page.waitForSelector('text=/ALL PASSED|FAILED/', { timeout: TIMEOUT });
  } catch (e) {
    console.log('Timeout waiting for test results, capturing current state...');
  }

  // Small extra wait for final rendering
  await page.waitForTimeout(1000);

  // Capture results
  const summaryEl = await page.$('div[style*="border-radius: 8px"] span[style*="font-weight: bold"]');
  const summaryText = summaryEl ? await summaryEl.textContent() : 'NO SUMMARY FOUND';

  // Get all test results
  const testElements = await page.$$('div[style*="padding: 4px 16px"]');
  const results = [];
  for (const el of testElements) {
    const text = await el.textContent();
    results.push(text?.trim());
  }

  // Screenshot
  await page.screenshot({ path: 'test-results.png', fullPage: true });
  console.log('\nScreenshot saved to test-results.png');

  // Print results
  console.log('\n' + '='.repeat(60));
  console.log('TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`Summary: ${summaryText}`);
  console.log(`Tests found: ${results.length}`);
  console.log('-'.repeat(60));

  for (const r of results) {
    if (r) console.log(r);
  }

  // Print any page errors
  const errors = logs.filter(l => l.includes('ERROR') || l.includes('error'));
  if (errors.length > 0) {
    console.log('\n--- Page Errors ---');
    for (const e of errors) console.log(e);
  }

  console.log('='.repeat(60));

  await browser.close();

  // Exit with error code if tests failed
  if (summaryText?.includes('FAILED')) {
    process.exit(1);
  }
}

run().catch((e) => {
  console.error('Runner error:', e);
  process.exit(1);
});
