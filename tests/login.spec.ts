import { test, expect } from '@playwright/test';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';

// Menggunakan situs demo publik (SauceDemo) agar aman untuk portofolio GitHub
const LOGIN_URL = 'https://www.saucedemo.com/';

const workbookInput = XLSX.readFile('data-login.xlsx');
const sheetName = workbookInput.SheetNames[0];
const dataUsers: any[] = XLSX.utils.sheet_to_json(workbookInput.Sheets[sheetName], { defval: '' });

const evidenceList: {
  testCase: string;
  deskripsi: string;
  status: string;
  images: { label: string; buffer: Buffer }[];
}[] = [];

test.describe.configure({ mode: 'serial' });

test.describe('Data-Driven Login Test + Auto Report Excel', () => {

  for (const data of dataUsers) {
    test(`${data.testCase} - Login user: "${data.username}" (${data.expected})`, async ({ page }) => {
      const capturedImages: { label: string; buffer: Buffer }[] = [];
      let testStatus = 'PASSED';

      try {
        await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded' });

        // Selector untuk halaman login SauceDemo
        const usernameInput = page.locator('#user-name');
        const passwordInput = page.locator('#password');
        await expect(usernameInput).toBeVisible({ timeout: 10000 });

        await usernameInput.fill(String(data.username));
        await passwordInput.fill(String(data.password));

        capturedImages.push({
          label: '1. Form Terisi',
          buffer: await page.screenshot({ fullPage: false }),
        });

        await page.locator('#login-button').click();

        if (String(data.expected).toLowerCase() === 'sukses') {
          // Verifikasi berhasil masuk ke halaman produk (/inventory.html)
          await expect(page).toHaveURL(/inventory\.html/, { timeout: 10000 });

          capturedImages.push({
            label: '2. Berhasil Login (Dashboard Produk)',
            buffer: await page.screenshot({ fullPage: false }),
          });
        } else {
          // Verifikasi gagal login (muncul pesan error & tetap di halaman login)
          await expect(page.locator('[data-test="error"]')).toBeVisible({ timeout: 10000 });

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

    let outputFileName = 'Laporan-Evidence-Login.xlsx';
    try {
      await reportWorkbook.xlsx.writeFile(outputFileName);
    } catch (err: any) {
      if (err.code === 'EBUSY') {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        outputFileName = `Laporan-Evidence-Login-${timestamp}.xlsx`;
        await reportWorkbook.xlsx.writeFile(outputFileName);
      } else {
        throw err;
      }
    }
    console.log(`\n✅ Laporan Excel berhasil dibuat: ${outputFileName}`);
  });

});