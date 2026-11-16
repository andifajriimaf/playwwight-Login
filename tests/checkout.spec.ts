import { test, expect } from '@playwright/test';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';

const LOGIN_URL = 'https://www.saucedemo.com/';

// Baca dataset E2E Checkout dari data-checkout.xlsx
const workbookInput = XLSX.readFile('data-checkout.xlsx');
const sheetName = workbookInput.SheetNames[0];
const checkoutCases: any[] = XLSX.utils.sheet_to_json(workbookInput.Sheets[sheetName], { defval: '' });

const evidenceList: {
  testCase: string;
  deskripsi: string;
  status: string;
  images: { label: string; buffer: Buffer }[];
}[] = [];

test.describe.configure({ mode: 'serial' });

test.describe('Data-Driven E2E Checkout Test + Auto Report Excel', () => {

  for (const data of checkoutCases) {
    test(`${data.testCase} - ${data.deskripsi}`, async ({ page }) => {
      const capturedImages: { label: string; buffer: Buffer }[] = [];
      let testStatus = 'PASSED';

      try {
        // 1. Login
        await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded' });
        await page.locator('#user-name').fill(String(data.username));
        await page.locator('#password').fill(String(data.password));
        await page.locator('#login-button').click();
        await expect(page).toHaveURL(/inventory\.html/, { timeout: 10000 });

        // 2. Pilih Produk (bisa 1 atau lebih dipisahkan koma)
        const daftarProduk = String(data.produk)
          .split(',')
          .map((item) => item.trim())
          .filter((item) => item.length > 0);

        for (const namaProduk of daftarProduk) {
          const itemCard = page.locator('.inventory_item').filter({ hasText: namaProduk });
          await itemCard.locator('button:has-text("Add to cart")').click();
        }

        // Verifikasi angka badge keranjang sesuai jumlah produk
        const cartBadge = page.locator('.shopping_cart_badge');
        await expect(cartBadge).toHaveText(String(daftarProduk.length));

        capturedImages.push({
          label: `1. Produk Ditambahkan ke Keranjang (${daftarProduk.length} item)`,
          buffer: await page.screenshot({ fullPage: false }),
        });

        // 3. Buka Keranjang & Klik Checkout
        await page.locator('.shopping_cart_link').click();
        await expect(page).toHaveURL(/cart\.html/);

        capturedImages.push({
          label: '2. Halaman Keranjang Belanja (Your Cart)',
          buffer: await page.screenshot({ fullPage: false }),
        });

        await page.locator('#checkout').click();
        await expect(page).toHaveURL(/checkout-step-one\.html/);

        // 4. Isi Informasi Pengiriman (First Name, Last Name, Postal Code)
        await page.locator('#first-name').fill(String(data.firstName));
        await page.locator('#last-name').fill(String(data.lastName));
        await page.locator('#postal-code').fill(String(data.postalCode));

        capturedImages.push({
          label: '3. Form Informasi Pengiriman Terisi',
          buffer: await page.screenshot({ fullPage: false }),
        });

        await page.locator('#continue').click();

        // 5. Verifikasi Hasil Sesuai Expected
        if (String(data.expected).toLowerCase() === 'sukses') {
          // Masuk ke halaman Ringkasan Pesanan (Checkout: Overview)
          await expect(page).toHaveURL(/checkout-step-two\.html/, { timeout: 10000 });

          capturedImages.push({
            label: '4. Ringkasan Pesanan & Total Harga (Overview)',
            buffer: await page.screenshot({ fullPage: false }),
          });

          // Klik Finish untuk menyelesaikan pesanan
          await page.locator('#finish').click();
          await expect(page).toHaveURL(/checkout-complete\.html/, { timeout: 10000 });
          await expect(page.locator('.complete-header')).toHaveText('Thank you for your order!');

          capturedImages.push({
            label: '5. Pesanan Berhasil (Checkout Complete)',
            buffer: await page.screenshot({ fullPage: false }),
          });
        } else {
          // Skenario Negatif: Harus muncul pesan error validasi form
          const errorMsg = page.locator('[data-test="error"]');
          await expect(errorMsg).toBeVisible({ timeout: 10000 });

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

  // Generate Laporan Excel Multi-Tab
  test.afterAll(async () => {
    const reportWorkbook = new ExcelJS.Workbook();

    for (const item of evidenceList) {
      const safeTabName = item.testCase.replace(/[\\/?*[\]:]/g, '').substring(0, 31);
      const sheet = reportWorkbook.addWorksheet(safeTabName);

      sheet.mergeCells('A1:I1');
      const titleCell = sheet.getCell('A1');
      titleCell.value = `${item.testCase} | ${item.deskripsi} [Status: ${item.status}]`;
      titleCell.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };

      const isPassed = item.status === 'PASSED';
      titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isPassed ? 'FF1F4E78' : 'FFC00000' },
      };
      titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      sheet.getRow(1).height = 28;

      let currentRow = 3;
      for (const img of item.images) {
        const labelCell = sheet.getCell(`A${currentRow}`);
        labelCell.value = img.label;
        labelCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF1F4E78' } };
        currentRow += 1;

        const imageId = reportWorkbook.addImage({
          buffer: img.buffer,
          extension: 'png',
        });

        sheet.addImage(imageId, {
          tl: { col: 0, row: currentRow - 1 },
          ext: { width: 720, height: 405 },
        });

        currentRow += 23;
      }
    }

    let outputFileName = 'Laporan-Evidence-Checkout.xlsx';
    try {
      await reportWorkbook.xlsx.writeFile(outputFileName);
    } catch (err: any) {
      if (err.code === 'EBUSY') {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        outputFileName = `Laporan-Evidence-Checkout-${timestamp}.xlsx`;
        await reportWorkbook.xlsx.writeFile(outputFileName);
      } else {
        throw err;
      }
    }
    console.log(`\n✅ Laporan Excel E2E Checkout berhasil dibuat: ${outputFileName}`);
  });

});