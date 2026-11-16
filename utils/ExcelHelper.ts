import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';

export interface EvidenceItem {
  testCase: string;
  deskripsi: string;
  status: string;
  images: { label: string; buffer: Buffer }[];
}

export class ExcelHelper {
  static readTestData<T = any>(filePath: string): T[] {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    return XLSX.utils.sheet_to_json<T>(workbook.Sheets[sheetName], { defval: '' });
  }

  static async generateEvidenceReport(evidenceList: EvidenceItem[], baseFileName: string): Promise<void> {
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

    let outputFileName = `${baseFileName}.xlsx`;
    try {
      await reportWorkbook.xlsx.writeFile(outputFileName);
    } catch (err: any) {
      if (err.code === 'EBUSY') {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        outputFileName = `${baseFileName}-${timestamp}.xlsx`;
        await reportWorkbook.xlsx.writeFile(outputFileName);
      } else {
        throw err;
      }
    }
    console.log(`\n✅ Laporan Excel berhasil dibuat: ${outputFileName}`);
  }
}