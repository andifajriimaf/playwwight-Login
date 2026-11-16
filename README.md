\# Playwright Data-Driven Login Automation \& Excel Evidence Report



Proyek otomasi pengujian \*end-to-end\* (E2E) menggunakan \*\*Playwright\*\* dan \*\*TypeScript\*\* dengan pendekatan \*\*Data-Driven Testing (DDT)\*\* dari file Excel, dilengkapi generator laporan bukti pengujian (\*Test Evidence Report\*) otomatis ke dalam file Excel multi-tab beserta penyematan \*screenshot\* tiap langkah.



\## Fitur Utama

\- \*\*Data-Driven Testing (`xlsx`):\*\* Membaca skenario pengujian positif \& negatif secara dinamis dari `data-login.xlsx` tanpa perlu mengubah kode skrip.

\- \*\*Automated Excel Evidence Report (`exceljs`):\*\* Menghasilkan file `Laporan-Evidence-Login.xlsx` secara otomatis di akhir eksekusi, dengan \*\*1 tab per Test Case\*\*, header status warna (`PASSED` / `FAILED`), serta tangkapan layar (\*screenshot\*) setiap langkah pengujian.

\- \*\*Defensive Execution:\*\* Menggunakan eksekusi berurutan (`serial`) dan blok `try...finally` sehingga seluruh skenario tetap berjalan tuntas dan terdokumentasi meskipun ada skenario yang gagal.



\## Teknologi yang Digunakan

\- \[Playwright](https://playwright.dev/) (TypeScript)

\- \[SheetJS (`xlsx`)](https://www.npmjs.com/package/xlsx) — Membaca dataset pengujian dari Excel

\- \[ExcelJS (`exceljs`)](https://www.npmjs.com/package/exceljs) — Membuat laporan multi-tab \& menyematkan gambar bukti tes



\## Cara Menjalankan Proyek



1\. \*\*Clone repositori ini:\*\*

&#x20;  ```bash

&#x20;  git clone \[https://github.com/USERNAME\_ANDA/NAMA\_REPO\_ANDA.git](https://github.com/USERNAME\_ANDA/NAMA\_REPO\_ANDA.git)

&#x20;  cd NAMA\_REPO\_ANDA

