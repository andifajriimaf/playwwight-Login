import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { ExcelHelper, EvidenceItem } from '../utils/ExcelHelper';

const dataUsers = ExcelHelper.readTestData('data-login.xlsx');
const evidenceList: EvidenceItem[] = [];

test.describe.configure({ mode: 'serial' });

test.describe('Data-Driven Login Test (POM)', () => {
  for (const data of dataUsers) {
    test(`${data.testCase} - Login user: "${data.username}" (${data.expected})`, async ({ page }) => {
      const loginPage = new LoginPage(page);
      const inventoryPage = new InventoryPage(page);
      const capturedImages: { label: string; buffer: Buffer }[] = [];
      let testStatus = 'PASSED';

      try {
        await loginPage.goto();
        await loginPage.fillCredentials(String(data.username), String(data.password));

        capturedImages.push({
          label: '1. Form Terisi',
          buffer: await page.screenshot({ fullPage: false }),
        });

        await loginPage.submit();

        if (String(data.expected).toLowerCase() === 'sukses') {
          await inventoryPage.verifyLoaded();
          capturedImages.push({
            label: '2. Berhasil Login (Dashboard Produk)',
            buffer: await page.screenshot({ fullPage: false }),
          });
        } else {
          await expect(loginPage.errorMessage).toBeVisible({ timeout: 10000 });
          capturedImages.push({
            label: '2. Gagal Login (Pesan Error Muncul)',
            buffer: await page.screenshot({ fullPage: false }),
          });
        }
      } catch (error: any) {
        testStatus = `FAILED (${error.message.split('\n')[0]})`;
        try {
          capturedImages.push({
            label: '2. Kondisi Terakhir Saat Error',
            buffer: await page.screenshot({ fullPage: false }),
          });
        } catch {}
      } finally {
        evidenceList.push({
          testCase: String(data.testCase),
          deskripsi: String(data.deskripsi || ''),
          status: testStatus,
          images: capturedImages,
        });
      }
    });
  }

  test.afterAll(async () => {
    await ExcelHelper.generateEvidenceReport(evidenceList, 'Laporan-Evidence-Login');
  });
});