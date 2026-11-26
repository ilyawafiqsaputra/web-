# SIPus — Sistem Informasi Perpustakaan SMK Muhammadiyah Pakem

Aplikasi web manajemen perpustakaan berbasis React, TypeScript, Vite, dan Tailwind CSS v4.

## Cara Membuka dan Menjalankan di Visual Studio Code

1. **Unduh Proyek**: Klik tombol **Download** (ikon unduh / ekspor zip) di pojok kanan atas Google AI Studio, lalu ekstrak file `.zip` ke folder di komputer Anda.
2. **Buka di VS Code**:
   - Buka **Visual Studio Code**
   - Pilih **File → Open Folder...** dan arahkan ke folder hasil ekstrak (atau jalankan `code .` di terminal dalam folder proyek).
3. **Instal Dependensi**:
   Buka terminal di VS Code (`Ctrl + ~` atau **Terminal → New Terminal**), lalu jalankan:
   ```bash
   npm install
   ```
4. **Jalankan Aplikasi**:
   ```bash
   npm run dev
   ```
   Lalu buka `http://localhost:3000` di browser (atau tekan `F5` di VS Code jika menggunakan ekstensi browser debugger).

## Perintah Penting
- `npm run dev` — Menjalankan server pengembangan di port `3000`
- `npm run build` — Membangun file produksi ke folder `dist/`
- `npm run lint` — Memeriksa tipe TypeScript (`tsc --noEmit`)

## Struktur Proyek
- `src/App.tsx` — Router tampilan utama aplikasi
- `src/context/LibraryContext.tsx` — State manajemen sirkulasi, katalog, anggota, dan aturan bisnis (`localStorage`)
- `src/data/seedData.ts` — Data awal buku, anggota, dan transaksi
- `src/components/AppShell.tsx` — Sidebar, header, pencarian global, dan notifikasi
- `src/components/views/` — Seluruh halaman modul aplikasi (Sirkulasi, Katalog, Anggota, Kartu Digital, Cetak Struk, Pengaturan)
- `.vscode/` — Konfigurasi workspace Visual Studio Code (`settings.json`, `extensions.json`, `tasks.json`, `launch.json`)
