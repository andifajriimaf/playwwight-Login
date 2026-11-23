# Playwright Data-Driven E2E Automation with Excel Evidence Report

[![Playwright Tests](https://github.com/andifajriimaf/playwwight-Login/actions/workflows/playwright.yml/badge.svg)](https://github.com/andifajriimaf/playwwight-Login/actions/workflows/playwright.yml)

End-to-end test automation for [Sauce Demo](https://www.saucedemo.com) built with **Playwright + TypeScript**.
Test scenarios are read from Excel files (data-driven testing), and every run produces an
Excel **test evidence report** with one tab per test case, a PASSED/FAILED status header,
and a screenshot of each step.

## Features

- **Data-driven testing**: positive and negative scenarios live in `data-login.xlsx` and
  `data-checkout.xlsx`. Add a row to add a test case, with no code changes.
- **Page Object Model**: locators and actions are kept in `pages/`, so tests stay short and readable.
- **Automatic Excel evidence report**: `Laporan-Evidence-Login.xlsx` and
  `Laporan-Evidence-Checkout.xlsx` are generated after each run, ready to attach to a test report.
- **Resilient execution**: tests run serially and use `try...finally`, so every scenario is
  documented even when one of them fails.
- **CI with GitHub Actions**: the suite runs on every push and pull request on Chromium,
  Firefox, and WebKit.

## Test coverage

| Suite | Scenarios |
| --- | --- |
| Login (`tests/login.spec.ts`), 8 cases | Valid login, locked-out user, wrong password, unregistered username, empty username/password, SQL injection input |
| Checkout E2E (`tests/checkout.spec.ts`), 5 cases | Single and multi-product checkout through order confirmation; required-field validation for first name, last name, and postal code |

## Tech stack

- [Playwright](https://playwright.dev/) with TypeScript
- [SheetJS (`xlsx`)](https://www.npmjs.com/package/xlsx) to read test data from Excel
- [ExcelJS](https://www.npmjs.com/package/exceljs) to build the multi-tab evidence report with screenshots
- GitHub Actions for CI

## Project structure

```
pages/        Page objects (LoginPage, InventoryPage, CheckoutPage)
tests/        Test suites (login, checkout)
utils/        ExcelHelper: reads test data and writes the evidence report
data-*.xlsx   Test data, one row per test case
Laporan-Evidence-*.xlsx   Generated evidence reports
```

## Getting started

Requirements: Node.js 18 or newer.

```bash
git clone https://github.com/andifajriimaf/playwwight-Login.git
cd playwwight-Login
npm ci
npx playwright install
```

Run the tests:

```bash
npm test                                # all browsers
npx playwright test --project=chromium  # Chromium only
npx playwright test tests/login.spec.ts # a single suite
npx playwright show-report              # open the HTML report
```

## Adding a test case

Open `data-login.xlsx` or `data-checkout.xlsx` and add a row. Login data columns:

| testCase | username | password | expected | deskripsi |
| --- | --- | --- | --- | --- |
| TC01-Valid | standard_user | secret_sauce | sukses | Successful login with valid credentials |

`expected` is `sukses` (success) or `gagal` (failure). The checkout file also has `produk`
(comma-separated product names), `firstName`, `lastName`, and `postalCode`.
