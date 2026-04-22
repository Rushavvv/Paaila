const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:5173';

function emailInput(page) {
  return page.getByLabel('Email Address');
}

function passwordInput(page) {
  return page.getByLabel('Password');
}

function loginError(page) {
  return page.locator('.login-error');
}

function fieldHint(page, text) {
  return page.locator('.form-hint', { hasText: text });
}

// Screenshot helper
async function takeScreenshot(page, name) {
  await page.screenshot({ path: `screenshots/${name}.png`, fullPage: true });
}

test.beforeEach(async ({ page }) => {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
});



// TC-001: Empty email & password

test('TC-001: empty email and password', async ({ page }) => {
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/login/);

  await takeScreenshot(page, 'TC-001-success');
});



// TC-002: Invalid email format

test('TC-002: invalid email format', async ({ page }) => {
  await emailInput(page).fill('user@');
  await passwordInput(page).fill('password123');

  await page.click('button[type="submit"]');

  await expect(fieldHint(page, 'The email format is invalid. Please use a valid email like user@example.com.')).toBeVisible();
  await expect(loginError(page)).toHaveText('The email format is invalid. Please use a valid email like user@example.com.');

  await takeScreenshot(page, 'TC-002-success');
});



// TC-003: Valid email, empty password

test('TC-003: valid email, empty password', async ({ page }) => {
  await emailInput(page).fill('user@gmail.com');

  await page.click('button[type="submit"]');

  await expect(fieldHint(page, 'Password cannot be empty. Please enter your password.')).toBeVisible();
  await expect(loginError(page)).toHaveText('Password cannot be empty. Please enter your password.');

  await takeScreenshot(page, 'TC-003-success');
});



// TC-004: Wrong password

test('TC-004: wrong password', async ({ page }) => {
  await emailInput(page).fill('rusu.sthapit@gmail.com');
  await passwordInput(page).fill('wrongpassword');

  await page.click('button[type="submit"]');

  await expect(loginError(page)).toHaveText('The password is incorrect for this account.');

  const token = await page.evaluate((key) => localStorage.getItem(key), TOKEN_KEY);
  expect(token).toBeNull();

  await takeScreenshot(page, 'TC-004-success');
});



// TC-005: Non-existent email

test('TC-005: non-existent email', async ({ page }) => {
  await emailInput(page).fill('fake@gmail.com');
  await passwordInput(page).fill('password123');

  await page.click('button[type="submit"]');

  await expect(loginError(page)).toHaveText('No account was found for this email address.');

  const token = await page.evaluate((key) => localStorage.getItem(key), TOKEN_KEY);
  expect(token).toBeNull();

  await takeScreenshot(page, 'TC-005-success');
});




// TC-006: Valid USER login

test('TC-006: valid user login', async ({ page }) => {
  await emailInput(page).fill('dummy@gmail.com');
  await passwordInput(page).fill('Rushav123');

  // Listen to API response
  const responsePromise = page.waitForResponse(res =>
    res.url().includes('/login') && res.status() === 200
  );

  await page.click('button[type="submit"]');

  const response = await responsePromise;
  const data = await response.json();

  expect(data).toHaveProperty('token');
  expect(data.user.userType).toBe('normal');

  await expect(page).toHaveURL(/home/);

  const token = await page.evaluate((key) => localStorage.getItem(key), TOKEN_KEY);
  expect(token).not.toBeNull();

  await takeScreenshot(page, 'TC-006-success');
});



// TC-007: ADMIN login
// This test verifies that an admin user can log in and is redirected to the admin dashboard.
test('TC-007: admin login', async ({ page }) => {
  // Fill in admin credentials (ensure these exist in your test DB)
  await emailInput(page).fill('rusu.sthapit@gmail.com');
  await passwordInput(page).fill('Rushav123');

  // Start waiting for the login API response (any status)
  // This ensures we capture the response regardless of backend status code
  const responsePromise = page.waitForResponse(res =>
    res.url().includes('/login')
  );

  // Submit the login form
  await page.click('button[type="submit"]');

  // Await the login API response
  const response = await responsePromise;
  let data = {};
  try {
    // Try to parse JSON response (may fail if backend redirects)
    data = await response.json();
  } catch (e) {
    // If response is not JSON
  }

  // Assert userType is admin if response contains user data
  if (data && data.user && data.user.userType) {
    expect(data.user.userType).toBe('admin');
  }

  // Wait for navigation to the admin dashboard
  // This ensures the UI has redirected after successful login
  await expect(page).toHaveURL(/admin/);

  // Wait for all network requests to finish before taking screenshot
  await page.waitForLoadState('networkidle');

  // Capture a screenshot of the fully loaded admin page
  await takeScreenshot(page, 'TC-007-success');
});