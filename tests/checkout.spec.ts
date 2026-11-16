import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { ExcelHelper, EvidenceItem } from '../utils/ExcelHelper';

const checkoutCases = ExcelHelper.readTestData('data-checkout.xlsx');
const evidenceList: EvidenceItem[] = [];

test.describe.configure({ mode: 'serial' });

test.describe('Data-Driven E2E Checkout Test (POM)', () => {
  for (const data of checkoutCases) {
    test(`${data.testCase} - ${data.deskripsi}`, async ({ page }) => {
      const loginPage = new LoginPage(page);
      const inventoryPage = new InventoryPage(page);
      const checkoutPage = new CheckoutPage(page);
      const capturedImages: { label: string; buffer: Buffer }[] = [];
      let testStatus = 'PASSED';

      try {
        await loginPage.goto();
        await loginPage.login(String(data.username), String(data.password));
        await inventoryPage.verifyLoaded();

        const daftarProduk = String(data.produk)
          .split(',')
          .map((item) => item.trim())
          .filter((item) => item.length > 0);

        await inventoryPage.addProductsToCart(daftarProduk);
        capturedImages.push({
          label: `1. Produk Ditambahkan ke Keranjang (${daftarProduk.length} item)`,
          buffer: await page.screenshot({ fullPage: false }),
        });

        await inventoryPage.openCart();
        capturedImages.push({
          label: '2. Halaman Keranjang Belanja (Your Cart)',
          buffer: await page.screenshot({ fullPage: false }),
        });

        await checkoutPage.startCheckout();
        await checkoutPage.fillShippingInfo(
          String(data.firstName),
          String(data.lastName),
          String(data.postalCode)
        );
        capturedImages.push({
          label: '3. Form Informasi Pengiriman Terisi',
          buffer: await page.screenshot({ fullPage: false }),
        });

        await checkoutPage.continueToOverview();

        if (String(data.expected).toLowerCase() === 'sukses') {
          await expect(page).toHaveURL(/checkout-step-two\.html/, { timeout: 10000 });
          capturedImages.push({
            label: '4. Ringkasan Pesanan & Total Harga (Overview)',
            buffer: await page.screenshot({ fullPage: false }),
          });

          await checkoutPage.verifyOverviewAndFinish();
          capturedImages.push({
            label: '5. Pesanan Berhasil (Checkout Complete)',
            buffer: await page.screenshot({ fullPage: false }),
          });
        } else {
          await expect(checkoutPage.errorMessage).toBeVisible({ timeout: 10000 });
          capturedImages.push({
            label: '4. Validasi Gagal (Pesan Error Muncul)',
            buffer: await page.screenshot({ fullPage: false }),
          });
        }
      } catch (error: any) {
        testStatus = `FAILED (${error.message.split('\n')[0]})`;
        try {
          capturedImages.push({
            label: 'Kondisi Terakhir Saat Error',
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
    await ExcelHelper.generateEvidenceReport(evidenceList, 'Laporan-Evidence-Checkout');
  });
});