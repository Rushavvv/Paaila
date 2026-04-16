const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:8000';

// Helper to create an expired JWT token (payload with exp in the past)
function createExpiredToken() {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    sub: 'test@example.com',
    exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
  }));
  const signature = 'fake_signature';
  return `${header}.${payload}.${signature}`;
}

// Helper to set token in localStorage
async function setToken(page, token) {
  await page.evaluate((t) => {
    localStorage.setItem('token', t);
  }, token);
}

// Helper to clear localStorage
async function clearLocalStorage(page) {
  await page.evaluate(() => {
    localStorage.clear();
  });
}

// Screenshot helper
async function takeScreenshot(page, name) {
  await page.screenshot({ path: `screenshots/${name}.png`, fullPage: true });
}

// TC-017: Access protected route (/home) with no token
test('TC-017: Access protected route with no token', async ({ page }) => {
  // Navigate to login first to establish page context, then clear localStorage
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await clearLocalStorage(page);

  // Navigate to /home (protected route)
  await page.goto(`${BASE_URL}/home`, { waitUntil: 'domcontentloaded' });

  // Should redirect to /login
  await expect(page).toHaveURL(/login/);

  await takeScreenshot(page, 'TC-017-success');
});

// TC-018: Access protected route with expired JWT
test('TC-018: Access protected route with expired JWT', async ({ page }) => {
  // Set an expired token in localStorage
  const expiredToken = createExpiredToken();
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await setToken(page, expiredToken);

  // Navigate to /home (protected route)
  await page.goto(`${BASE_URL}/home`, { waitUntil: 'domcontentloaded' });

  // Should redirect to /login
  await expect(page).toHaveURL(/login/);

  // Token should be cleared from localStorage
  const token = await page.evaluate(() => localStorage.getItem('token'));
  expect(token).toBeNull();

  // Check if session-expired alert is displayed (if implemented)
  const alertExists = await page.locator('text=/session.*expired|token.*expired/i').isVisible().catch(() => false);
  if (alertExists) {
    await takeScreenshot(page, 'TC-018-alert');
  }

  await takeScreenshot(page, 'TC-018-success');
});

// TC-019: Call /api/user without Authorization header
test('TC-019: Call /api/user without Authorization header', async ({ page }) => {
  // Navigate to a page first to have something to screenshot
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });

  // Make a direct API call without Authorization header
  const response = await page.request.get(`${API_URL}/api/user`);

  // Should return 401 Unauthorized
  expect(response.status()).toBe(401);

  const data = await response.json();
  expect(data).toBeDefined();

  await takeScreenshot(page, 'TC-019-success');
});

// TC-020: Call /api/user with malformed bearer token
test('TC-020: Call /api/user with malformed bearer token', async ({ page }) => {
  // Navigate to a page first to have something to screenshot
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });

  // Make a direct API call with malformed bearer token
  const malformedToken = 'Bearer invalid_token_format';

  const response = await page.request.get(`${API_URL}/api/user`, {
    headers: {
      'Authorization': malformedToken,
    },
  });

  // Should return 401 Unauthorized
  expect(response.status()).toBe(401);

  const data = await response.json();
  expect(data).toBeDefined();

  await takeScreenshot(page, 'TC-020-success');
});
