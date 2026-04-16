const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:5173';
// Field selectors
function firstNameInput(page) {
  return page.getByLabel('First Name');
}

function lastNameInput(page) {
  return page.getByLabel('Last Name');
}

function emailInput(page) {
  return page.getByLabel('Email Address');
}

function phoneInput(page) {
  return page.getByLabel('Phone Number');
}

function passwordInput(page) {
  return page.locator('#password');
}

function confirmPasswordInput(page) {
  return page.locator('#confirmPassword');
}

function registerError(page) {
  return page.locator('.register-error');
}

function fieldHint(page, text) {
  return page.locator('.form-hint', { hasText: text });
}

// Screenshot helper
async function takeScreenshot(page, name) {
  await page.screenshot({ path: `screenshots/${name}.png`, fullPage: true });
}

// Navigate before each test
test.beforeEach(async ({ page }) => {
  await page.goto(`${BASE_URL}/register`, { waitUntil: 'domcontentloaded' });
});


// TC-008: All fields empty
test('TC-008: register with all fields empty', async ({ page }) => {
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/register/);

  await takeScreenshot(page, 'TC-008-success');
});


// TC-009: Invalid email format
test('TC-009: invalid email format', async ({ page }) => {
  await firstNameInput(page).fill('Rushav');
  await lastNameInput(page).fill('Sthapit');
  await emailInput(page).fill('abc');
  await phoneInput(page).fill('9800000000');
  await passwordInput(page).fill('Password123');
  await confirmPasswordInput(page).fill('Password123');

  // Frontend validation should show email error hint
  await expect(fieldHint(page, 'Enter a valid email address')).toBeVisible({ timeout: 2000 });

  await takeScreenshot(page, 'TC-009-success');
});


// TC-010: Password length < 8
test('TC-010: password too short', async ({ page }) => {
  await firstNameInput(page).fill('Rushav');
  await lastNameInput(page).fill('Sthapit');
  await emailInput(page).fill('test123@gmail.com');
  await phoneInput(page).fill('9800000000');
  await passwordInput(page).fill('12345');
  await confirmPasswordInput(page).fill('12345');

  // Frontend validation should show password error hint
  await expect(fieldHint(page, 'Password must be at least 8 characters')).toBeVisible({ timeout: 2000 });

  await takeScreenshot(page, 'TC-010-success');
});


// TC-011: Confirm password mismatch
test('TC-011: password mismatch', async ({ page }) => {
  await firstNameInput(page).fill('Rushav');
  await lastNameInput(page).fill('Sthapit');
  await emailInput(page).fill('test@gmail.com');
  await phoneInput(page).fill('9800000000');
  await passwordInput(page).fill('Password123');
  await confirmPasswordInput(page).fill('Different123');

  // Submit is disabled while validation errors exist, so assert inline hint directly.
  await expect(fieldHint(page, 'Passwords do not match')).toBeVisible({ timeout: 2000 });

  await takeScreenshot(page, 'TC-011-success');
});


// TC-012: Whitespace-only names
test('TC-012: whitespace-only names', async ({ page }) => {
  await firstNameInput(page).fill('   ');
  await lastNameInput(page).fill('   ');
  await emailInput(page).fill('test@gmail.com');
  await phoneInput(page).fill('9800000000');
  await passwordInput(page).fill('Password123');
  await confirmPasswordInput(page).fill('Password123');

  // Frontend validation should show name error hints (names are required)
  await expect(fieldHint(page, 'First name is required')).toBeVisible({ timeout: 2000 });

  await takeScreenshot(page, 'TC-012-success');
});


// TC-013: Whitespace-only phone number
test('TC-013: whitespace-only phone', async ({ page }) => {
  await firstNameInput(page).fill('Rushav');
  await lastNameInput(page).fill('Sthapit');
  await emailInput(page).fill('test@gmail.com');
  await phoneInput(page).fill('   ');
  await passwordInput(page).fill('Password123');
  await confirmPasswordInput(page).fill('Password123');

  // Frontend validation should show phone error hint (phone is required)
  await expect(fieldHint(page, 'Phone number is required')).toBeVisible({ timeout: 2000 });

  await takeScreenshot(page, 'TC-013-success');
});


// TC-014: Duplicate email
test('TC-014: duplicate email', async ({ page }) => {
  await firstNameInput(page).fill('Rushav');
  await lastNameInput(page).fill('Sthapit');
  await emailInput(page).fill('dummy@gmail.com'); // already exists
  await phoneInput(page).fill('9800000000');
  await passwordInput(page).fill('Rushav123');
  await confirmPasswordInput(page).fill('Rushav123');

  // Wait for API response (all frontend validation passes)
  const responsePromise = page.waitForResponse(res =>
    res.url().includes('/register')
  );

  await page.click('button[type="submit"]');

  const response = await responsePromise;
  // Backend should return error status for duplicate email
  expect([400, 409, 422]).toContain(response.status());

  await takeScreenshot(page, 'TC-014-success');
});




// TC-015: Script injection
test('TC-015: script injection in name', async ({ page }) => {
  const script = '<script>alert(1)</script>';

  await firstNameInput(page).fill(script);
  await lastNameInput(page).fill(script);
  await emailInput(page).fill('inject@gmail.com');
  await phoneInput(page).fill('9800000000');
  await passwordInput(page).fill('Rushav123');
  await confirmPasswordInput(page).fill('Rushav123');

  // Both first and last name should show this validation message.
  await expect(fieldHint(page, 'First name can only contain letters and hyphens')).toBeVisible({ timeout: 2000 });
  await expect(fieldHint(page, 'Last name can only contain letters and hyphens')).toBeVisible({ timeout: 2000 });

  await takeScreenshot(page, 'TC-015-success');
});


// TC-016: Successful registration
test('TC-016: successful registration', async ({ page }) => {
  const uniqueEmail = `user${Date.now()}@test.com`; // unique email

  await firstNameInput(page).fill('John');
  await lastNameInput(page).fill('Doe');
  await emailInput(page).fill(uniqueEmail);
  await phoneInput(page).fill('9800000000');
  await passwordInput(page).fill('TestPass123');
  await confirmPasswordInput(page).fill('TestPass123');

  const responsePromise = page.waitForResponse(res =>
    res.url().includes('/register') && res.status() === 200
  );

  await page.click('button[type="submit"]');

  const response = await responsePromise;
  const data = await response.json();

  expect(data).toHaveProperty('token');
  expect(data).toHaveProperty('user');

  await takeScreenshot(page, 'TC-016-success');
});