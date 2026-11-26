import React, { useMemo, useState } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { formatDateCompact, formatDateShortID, formatDateSlash, formatRupiah } from '../../utils/formatters';
import { SafeImage } from '../SafeImage';

export const ReturnReceiptView: React.FC = () => {
  const {
    transactions,
    members,
    books,
    settings,
    selectedReceiptTxId,
    setActiveView,
    openMemberDetail,
    showToast,
  } = useLibrary();

  const tx = useMemo(
    () =>
      transactions.find((t) => t.id === selectedReceiptTxId) ??
      transactions.find((t) => t.status === 'DIKEMBALIKAN') ??
      transactions[0],
    [transactions, selectedReceiptTxId]
  );

  const member = useMemo(
    () => members.find((m) => m.id === tx?.memberId) ?? members[0],
    [members, tx]
  );

  const book = useMemo(
    () => books.find((b) => b.id === tx?.bookId) ?? books[0],
    [books, tx]
  );

  const [printFormat, setPrintFormat] = useState<'thermal' | 'a5'>('thermal');
  const [includeStampQr, setIncludeStampQr] = useState(true);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState(member?.email ?? '');
  const [sharePhone, setSharePhone] = useState(member?.phone ?? '');

  if (!tx) return null;

  const isReturned = tx.status === 'DIKEMBALIKAN';
  const lateDays = tx.lateDays;
  const fineAmount = tx.fineAmount;
  const receiptDateCompact = formatDateCompact(tx.returnDate ?? settings.currentDate);
  const receiptNo =
    tx.receiptNo ??
    `STR-${receiptDateCompact.slice(0, 4)}-${receiptDateCompact.slice(4)}-${tx.id.slice(-3)}`;

  return (
    <div className="flex flex-col w-full pb-8">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 no-print">
        <nav className="flex items-center gap-1.5 text-on-surface-variant text-[13px] font-medium">
          <button
            type="button"
            onClick={() => setActiveView('sirkulasi-transaksi')}
            className="hover:text-primary transition-colors cursor-pointer"
          >
            Sirkulasi &amp; Transaksi
          </button>
          <span className="material-symbols-outlined text-sm text-outline">
            chevron_right
          </span>
          <span>Pengembalian Buku</span>
          <span className="material-symbols-outlined text-sm text-outline">
            chevron_right
          </span>
          <span className="text-primary font-semibold">
            Bukti Pengembalian &amp; Cetak Struk (#{tx.id})
          </span>
        </nav>

        <div className="flex items-center gap-1.5 font-mono text-[12px] text-on-surface-variant bg-surface-container px-3 py-1 rounded">
          <span className="material-symbols-outlined text-sm text-tertiary">
            check_circle
          </span>
          <span>NO. BUKTI: {receiptNo}</span>
        </div>
      </div>

      {/* Page Header */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 pb-5 no-print">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-[12px]">
            <span className="px-2.5 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-semibold uppercase tracking-wider text-[11px]">
              {isReturned
                ? fineAmount > 0
                  ? 'Status: Lunas & Restorasi Sukses'
                  : 'Status: Kembali Tepat Waktu'
                : 'Bukti Peminjaman Aktif'}
            </span>
            <span className="text-outline">·</span>
            <span className="font-mono text-on-surface-variant">
              {formatDateShortID(tx.returnDate ?? tx.borrowDate)} · {tx.returnTime ?? '14:32 WIB'}
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-[28px] text-primary font-bold tracking-tight mt-1">
            Bukti Pengembalian &amp; Pelunasan Denda
          </h1>
          <p className="text-[14px] text-on-surface-variant mt-1">
            Verifikasi penyelesaian transaksi pengembalian buku, pemulihan stok inventaris, dan cetak tanda terima denda keterlambatan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveView('sirkulasi-transaksi')}
            className="flex items-center gap-1.5 px-4 py-2 bg-surface-container-lowest text-on-surface rounded-lg text-[13px] font-medium shadow-xs hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            <span>Kembali ke Sirkulasi</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setShareEmail(member.email);
              setSharePhone(member.phone);
              setShareModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-surface-container-highest text-primary font-semibold rounded-lg text-[13px] hover:bg-primary-fixed transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">send</span>
            <span>Kirim ke WhatsApp/Email</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-lg text-[13px] font-semibold hover:bg-primary-container transition-all shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">print</span>
            <span>Cetak Struk Resmi</span>
          </button>
        </div>
      </div>

      {/* Success Banner */}
      {isReturned && (
        <div className="mb-6 p-4 bg-tertiary-fixed rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 no-print">
          <div className="flex items-start md:items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-xl">verified</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-display text-[16px] font-bold text-tertiary">
                  Transaksi Pengembalian Berhasil Diproses
                </span>
                <span className="px-2 py-0.5 bg-tertiary text-on-tertiary rounded text-[11px] font-bold uppercase">
                  Restored +1
                </span>
              </div>
              <p className="text-[12.5px] text-on-tertiary-fixed-variant mt-0.5">
                Stok buku fisik <strong>&ldquo;{book.title}&rdquo; ({book.id})</strong> otomatis dipulihkan ke{' '}
                <strong>{book.rackLocation}</strong>.{' '}
                {fineAmount > 0
                  ? `Pembayaran denda keterlambatan sebesar ${formatRupiah(fineAmount)} telah terverifikasi lunas.`
                  : 'Pengembalian tepat waktu tanpa denda keterlambatan.'}
              </p>
            </div>
          </div>
          <span className="font-mono text-[12px] text-tertiary px-3 py-1 bg-surface-container-lowest/85 rounded self-end md:self-auto flex-shrink-0">
            REF: {receiptNo}
          </span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-5 no-print">
          {/* 3-Step Audit Flow */}
          <div className="bg-surface-container-lowest p-5 rounded-xl shadow-xs border border-outline-variant/20 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
                Alur Audit Transaksi Sirkulasi
              </span>
              <span className="font-mono text-[12px] text-tertiary font-semibold">
                Selesai Tanpa Sengketa
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-surface-container-low">
                <span className="text-[11px] text-on-surface-variant font-medium">
                  1. Pengecekan Fisik
                </span>
                <div className="font-display text-[17px] text-tertiary font-bold mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-base">
                    check_circle
                  </span>
                  Mulus
                </div>
                <span className="text-[11.5px] text-on-surface-variant">
                  Semua halaman &amp; cover utuh
                </span>
              </div>

              <div className="p-3 rounded-lg bg-surface-container-low">
                <span className="text-[11px] text-on-surface-variant font-medium">
                  2. Rekapitulasi Denda
                </span>
                <div className="font-display text-[17px] text-secondary font-bold mt-1 flex items-center gap-1 tabular-nums">
                  <span className="material-symbols-outlined text-base">schedule</span>
                  {lateDays} Hari
                </div>
                <span className="text-[11.5px] text-on-surface-variant tabular-nums">
                  {formatRupiah(settings.dailyFineRate)} / hari keterlambatan
                </span>
              </div>

              <div className="p-3 rounded-lg bg-surface-container-low">
                <span className="text-[11px] text-on-surface-variant font-medium">
                  3. Kasir &amp; Stok
                </span>
                <div className="font-display text-[17px] text-primary font-bold mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-base">task_alt</span>
                  {isReturned ? 'Lunas' : 'Berjalan'}
                </div>
                <span className="text-[11.5px] text-on-surface-variant">
                  {isReturned ? 'Stok +1 & Kas Tercatat' : 'Menunggu pengembalian'}
                </span>
              </div>
            </div>
          </div>

          {/* Member & Circulation Meta */}
          <div className="bg-surface-container-lowest p-5 rounded-xl shadow-xs border border-outline-variant/20 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary font-display text-[16px] font-bold">
                <span className="material-symbols-outlined">badge</span>
                <h2>Informasi Anggota &amp; Rentang Pinjam</h2>
              </div>
              <span className="font-mono text-[12px] bg-surface-container px-2.5 py-0.5 rounded text-primary font-semibold">
                #{tx.id}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-surface-container-low rounded-lg">
              <button
                type="button"
                onClick={() => openMemberDetail(member.id)}
                className="flex items-start gap-3 text-left group cursor-pointer"
              >
                <SafeImage
                  src={member.avatarUrl}
                  alt={member.name}
                  className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                  fallbackType="avatar"
                  fallbackLabel={member.name}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-on-surface group-hover:text-primary transition-colors">
                      {member.name}
                    </span>
                    <span className="material-symbols-outlined text-tertiary text-sm">
                      verified
                    </span>
                  </div>
                  <span className="text-[12px] text-on-surface-variant block">
                    {member.id} · {member.role} ({member.majorOrFaculty})
                  </span>
                  <span className="text-[11.5px] text-outline block mt-0.5 truncate">
                    {member.email}
                  </span>
                </div>
              </button>

              <div className="flex flex-col justify-center gap-1.5 text-[12.5px] text-on-surface-variant md:border-l md:border-surface-container-highest md:pl-4 tabular-nums">
                <div className="flex items-center justify-between">
                  <span>Tanggal Peminjaman:</span>
                  <span className="font-mono font-semibold text-on-surface">
                    {formatDateShortID(tx.borrowDate)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Batas Jatuh Tempo:</span>
                  <span className="font-mono font-semibold text-error">
                    {formatDateShortID(tx.dueDate)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Tanggal Pengembalian:</span>
                  <span className="font-mono font-semibold text-tertiary">
                    {tx.returnDate
                      ? `${formatDateShortID(tx.returnDate)} (${tx.returnTime ?? '14:15 WIB'})`
                      : 'Belum Kembali'}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span>Selisih Keterlambatan:</span>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded font-bold ${
                      lateDays > 0
                        ? 'bg-error-container text-on-error-container'
                        : 'bg-tertiary-fixed text-tertiary-container'
                    }`}
                  >
                    {lateDays > 0 ? `Terlambat ${lateDays} Hari` : 'Tepat Waktu'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Returned Book Details */}
          <div className="bg-surface-container-lowest p-5 rounded-xl shadow-xs border border-outline-variant/20 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary font-display text-[16px] font-bold">
                <span className="material-symbols-outlined">menu_book</span>
                <h2>Rincian Koleksi Buku yang Dikembalikan</h2>
              </div>
              <span className="px-2.5 py-0.5 rounded bg-tertiary-fixed text-tertiary text-[11px] font-semibold">
                1 Eksemplar
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 p-4 bg-surface-container-low rounded-lg">
              <div className="w-24 h-32 flex-shrink-0 rounded shadow-sm overflow-hidden bg-surface-container">
                <SafeImage
                  src={book.coverUrl}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col justify-between flex-1">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11.5px] bg-surface-container-highest text-primary px-2 py-0.5 rounded font-semibold">
                      ID: {book.id}
                    </span>
                    <span className="font-mono text-[11.5px] text-outline">
                      ISBN: {book.isbn}
                    </span>
                    <span className="font-mono text-[11.5px] text-on-surface-variant">
                      Dewey: {book.ddcCode}
                    </span>
                  </div>
                  <h3 className="font-display text-[16px] font-bold text-on-surface mt-1">
                    {book.title}
                  </h3>
                  <p className="text-[12.5px] text-on-surface-variant mt-0.5">
                    Penulis: {book.author}
                  </p>
                  <p className="text-[12px] text-outline">
                    Penerbit: {book.publisher} ({book.year})
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3 bg-surface-container-lowest p-2.5 rounded">
                  <div>
                    <span className="text-[10.5px] text-outline block">Status Fisik</span>
                    <span className="text-[12px] text-tertiary font-semibold">
                      Baik &amp; Utuh
                    </span>
                  </div>
                  <div>
                    <span className="text-[10.5px] text-outline block">Barcode</span>
                    <span className="text-[12px] text-tertiary font-semibold font-mono">
                      {tx.refBarcode}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10.5px] text-outline block">Lokasi Rak</span>
                    <span className="font-mono text-[12px] text-primary font-semibold">
                      {book.rackLocation}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 bg-surface-container rounded-lg">
              <span className="material-symbols-outlined text-primary text-base mt-0.5">
                rate_review
              </span>
              <div>
                <span className="text-[11.5px] font-semibold text-primary block">
                  Catatan Pemeriksaan Pustakawan:
                </span>
                <p className="text-[12.5px] text-on-surface-variant mt-0.5">
                  &ldquo;
                  {tx.notes ||
                    'Pemeriksaan nomor segel barcode RFID lolos uji sensor gerbang masuk. Kondisi fisik buku baik tanpa kerusakan.'}
                  &rdquo;
                </p>
                <span className="font-mono text-[11px] text-outline mt-1 block">
                  Diperiksa oleh: {tx.librarian} (Pustakawan Sirkulasi)
                </span>
              </div>
            </div>
          </div>

          {/* Fine Breakdown */}
          <div className="bg-surface-container-lowest p-5 rounded-xl shadow-xs border border-outline-variant/20 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary font-display text-[16px] font-bold">
                <span className="material-symbols-outlined">calculate</span>
                <h2>Rincian Perhitungan Denda Keterlambatan</h2>
              </div>
              <span className="font-mono text-[11px] text-secondary bg-secondary-fixed px-2.5 py-0.5 rounded font-semibold">
                Tarif Reguler Perpustakaan
              </span>
            </div>

            <div className="bg-surface-container-low rounded-lg p-4 flex flex-col gap-2.5 text-[13.5px] tabular-nums">
              <div className="flex items-center justify-between">
                <span>
                  Keterlambatan Pengembalian ({lateDays} Hari ×{' '}
                  {formatRupiah(settings.dailyFineRate)})
                </span>
                <span className="font-mono font-semibold">
                  {formatRupiah(fineAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Biaya Kerusakan / Pemulihan Fisik Buku</span>
                <span className="font-mono text-tertiary">Rp 0 (Kondisi Baik)</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Biaya Administrasi Sirkulasi</span>
                <span className="font-mono text-tertiary">Rp 0 (Bebas Biaya)</span>
              </div>
              <div className="h-px bg-surface-container-highest my-1" />
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-on-surface block">
                    Total Kewajiban Denda
                  </span>
                  <span className="text-[11.5px] text-outline">
                    Sudah termasuk pembulatan resmi sistem
                  </span>
                </div>
                <span className="font-display text-2xl text-primary font-bold">
                  {formatRupiah(fineAmount)}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-tertiary text-on-tertiary flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-2xl">payments</span>
                </div>
                <div>
                  <span className="text-[10.5px] uppercase tracking-wider text-tertiary font-bold block">
                    Status Pelunasan Kasir
                  </span>
                  <span className="font-display text-[17px] font-bold">
                    {fineAmount > 0 ? 'LUNAS - TUNAI (CASH)' : 'NIHIL - TEPAT WAKTU'}
                  </span>
                  <span className="text-[12px] text-on-tertiary-fixed-variant block tabular-nums">
                    {fineAmount > 0
                      ? `Uang diterima pas ${formatRupiah(fineAmount)} · Kembalian Rp 0`
                      : 'Tidak ada tagihan denda keterlambatan'}
                  </span>
                </div>
              </div>
              <div className="font-mono text-[11.5px] sm:text-right">
                <div className="text-tertiary font-semibold">KASIR: {tx.librarian}</div>
                <div className="text-on-tertiary-fixed-variant">
                  BATCH: {receiptDateCompact}-K01
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (5 Cols): Sticky Thermal Receipt Preview */}
        <div className="lg:col-span-5 flex flex-col gap-4 lg:sticky lg:top-20">
          {/* Format Controls */}
          <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-outline-variant/20 flex flex-col gap-3 no-print">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-primary text-[13px] font-semibold">
                <span className="material-symbols-outlined text-base">
                  settings_ethernet
                </span>
                <span>Konfigurasi Format Cetak</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-surface-container font-mono text-[11px] text-on-surface-variant">
                {printFormat === 'thermal' ? 'Kertas Thermal' : 'Format A5'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPrintFormat('thermal')}
                className={`py-2 px-3 rounded-lg text-[12.5px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                  printFormat === 'thermal'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-sm">receipt</span>
                <span>Thermal 80mm</span>
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat('a5')}
                className={`py-2 px-3 rounded-lg text-[12.5px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                  printFormat === 'a5'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-sm">description</span>
                <span>Kwitansi A5</span>
              </button>
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-[12px] text-on-surface">
              <input
                type="checkbox"
                checked={includeStampQr}
                onChange={(e) => setIncludeStampQr(e.target.checked)}
                className="w-4 h-4 rounded accent-primary"
              />
              <span>Sertakan Stempel Digital &amp; QR Validasi</span>
            </label>
          </div>

          {/* Receipt Paper Simulator */}
          <div
            className={`relative bg-surface-container-lowest rounded-xl shadow-md border border-outline-variant/25 p-6 flex flex-col overflow-hidden transition-all ${
              printFormat === 'a5' ? 'ring-2 ring-primary/15' : ''
            }`}
          >
            {/* Serrated Top Edge */}
            <div className="w-full flex justify-between absolute -top-1.5 left-0 right-0 px-2 overflow-hidden opacity-50 no-print">
              {Array.from({ length: 18 }).map((_, i) => (
                <span
                  key={i}
                  className="w-2.5 h-2.5 bg-surface rounded-full flex-shrink-0"
                />
              ))}
            </div>

            <div className="pt-2 flex flex-col font-mono text-[11.5px] text-on-surface tabular-nums">
              <div className="text-center flex flex-col items-center">
                <span className="font-display text-[14.5px] text-primary font-bold tracking-tight">
                  PERPUSTAKAAN SMK MUHAMMADIYAH PAKEM
                </span>
                <span className="text-[10.5px] text-on-surface-variant font-semibold">
                  UNIT PERPUSTAKAAN &amp; LITERASI DIGITAL
                </span>
                <span className="text-[10.5px] text-outline mt-0.5">
                  {settings.address}
                </span>
                <span className="text-[10.5px] text-outline">
                  Telp: {settings.phone} · {settings.email}
                </span>
                <span className="text-[10px] text-outline mt-0.5">
                  Jam Layanan: Senin - Sabtu {settings.serviceHours}
                </span>
              </div>

              <div className="w-full my-3 border-b border-dashed border-outline-variant" />

              <div className="flex flex-col gap-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-outline">NO. BUKTI :</span>
                  <span className="font-bold">{receiptNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">NO. TRX PINJAM :</span>
                  <span className="font-bold">{tx.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">WAKTU KEMBALI :</span>
                  <span>
                    {formatDateSlash(tx.returnDate ?? settings.currentDate)}{' '}
                    {tx.returnTime ?? '14:32 WIB'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">PUSTAKAWAN :</span>
                  <span>{tx.librarian} (K01)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">ANGGOTA :</span>
                  <span className="font-semibold text-right">
                    {member.name} ({member.id})
                  </span>
                </div>
              </div>

              <div className="w-full my-3 border-b border-dashed border-outline-variant" />

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between font-bold text-[10.5px] text-outline">
                  <span>DESKRIPSI KOLEKSI</span>
                  <span>STATUS</span>
                </div>
                <div className="flex justify-between font-semibold gap-2">
                  <span className="truncate">
                    [{book.id}] {book.title}
                  </span>
                  <span className="text-tertiary flex-shrink-0">
                    {isReturned ? 'DIKEMBALIKAN' : 'DIPINJAM'}
                  </span>
                </div>
                <div className="flex justify-between text-[10.5px] text-on-surface-variant">
                  <span>Qty: 1 Eks (Kondisi: BAIK)</span>
                  <span>{book.rackLocation}</span>
                </div>
              </div>

              <div className="w-full my-3 border-b border-dashed border-outline-variant" />

              <div className="flex flex-col gap-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Tgl Rencana Kembali:</span>
                  <span>{formatDateSlash(tx.dueDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tgl Realisasi:</span>
                  <span>
                    {formatDateSlash(tx.returnDate ?? settings.currentDate)}
                  </span>
                </div>
                <div
                  className={`flex justify-between font-medium ${
                    lateDays > 0 ? 'text-error' : 'text-tertiary'
                  }`}
                >
                  <span>Keterlambatan:</span>
                  <span>{lateDays} Hari Kalender</span>
                </div>
                <div className="flex justify-between text-on-surface-variant">
                  <span>Tarif Denda per Hari:</span>
                  <span>{formatRupiah(settings.dailyFineRate)}</span>
                </div>
                <div className="flex justify-between text-on-surface-variant">
                  <span>Biaya Penggantian/Fisik:</span>
                  <span>Rp 0</span>
                </div>

                <div className="w-full my-1.5 border-b border-dashed border-outline-variant" />

                <div className="flex justify-between text-[13px] font-bold text-primary">
                  <span>TOTAL DENDA:</span>
                  <span>{formatRupiah(fineAmount)}</span>
                </div>
                <div className="flex justify-between font-semibold pt-1">
                  <span>PEMBAYARAN (TUNAI):</span>
                  <span>{formatRupiah(fineAmount)}</span>
                </div>
                <div className="flex justify-between text-on-surface-variant">
                  <span>KEMBALIAN:</span>
                  <span>Rp 0</span>
                </div>
                <div className="flex justify-between text-tertiary font-bold text-[12px] pt-1">
                  <span>STATUS:</span>
                  <span>{fineAmount > 0 ? 'LUNAS (PAID)' : 'SELESAI (NIHIL)'}</span>
                </div>
              </div>

              {includeStampQr && (
                <>
                  <div className="w-full my-3 border-b border-dashed border-outline-variant" />
                  <div className="flex flex-col items-center gap-2 py-1">
                    <div className="p-2 border border-dashed border-tertiary/40 rounded bg-tertiary-fixed/30 text-center w-full">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-tertiary">
                        STEMPEL VALIDASI DIGITAL SISTEM SIRKULASI
                      </span>
                      <span className="block text-[9px] text-on-surface-variant">
                        SECURE-HASH: 8F2A-098B-C119-BB76
                      </span>
                    </div>

                    <div className="flex flex-col items-center justify-center p-2 bg-white rounded shadow-xs w-28 h-28 my-1 border border-surface-container">
                      <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 100 100">
                        <rect fill="#00236f" height="28" rx="3" width="28" x="10" y="10" />
                        <rect fill="#ffffff" height="16" rx="2" width="16" x="16" y="16" />
                        <rect fill="#00236f" height="8" rx="1" width="8" x="20" y="20" />
                        <rect fill="#00236f" height="28" rx="3" width="28" x="62" y="10" />
                        <rect fill="#ffffff" height="16" rx="2" width="16" x="68" y="16" />
                        <rect fill="#00236f" height="8" rx="1" width="8" x="72" y="20" />
                        <rect fill="#00236f" height="28" rx="3" width="28" x="10" y="62" />
                        <rect fill="#ffffff" height="16" rx="2" width="16" x="16" y="68" />
                        <rect fill="#00236f" height="8" rx="1" width="8" x="20" y="72" />
                        <rect fill="#00236f" height="6" width="6" x="44" y="12" />
                        <rect fill="#00236f" height="6" width="6" x="52" y="18" />
                        <rect fill="#00236f" height="6" width="6" x="44" y="28" />
                        <rect fill="#00236f" height="6" width="6" x="12" y="44" />
                        <rect fill="#00236f" height="12" width="12" x="44" y="44" />
                        <rect fill="#00236f" height="6" width="6" x="60" y="44" />
                        <rect fill="#00236f" height="6" width="6" x="80" y="44" />
                        <rect fill="#00236f" height="8" width="8" x="64" y="64" />
                        <rect fill="#00236f" height="8" width="8" x="64" y="80" />
                      </svg>
                    </div>
                  </div>
                </>
              )}

              <p className="text-[10px] text-center text-outline leading-tight px-3 mt-1">
                &ldquo;Buku telah diverifikasi dan masuk kembali ke inventaris. Terima kasih telah menjaga keutuhan koleksi perpustakaan.&rdquo;
              </p>
              <span className="text-[9px] text-center text-outline mt-1">
                *** SIMPAN STRUK INI SEBAGAI BUKTI SAH ***
              </span>
            </div>

            {/* Serrated Bottom Edge */}
            <div className="w-full flex justify-between absolute -bottom-1.5 left-0 right-0 px-2 overflow-hidden opacity-50 no-print">
              {Array.from({ length: 18 }).map((_, i) => (
                <span
                  key={i}
                  className="w-2.5 h-2.5 bg-surface rounded-full flex-shrink-0"
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 no-print">
            <button
              type="button"
              onClick={() =>
                showToast(`Struk ${receiptNo} siap diunduh dalam format PDF.`)
              }
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-surface-container-lowest text-primary rounded-lg text-[13px] font-semibold shadow-xs border border-outline-variant/25 hover:bg-surface-container transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">
                picture_as_pdf
              </span>
              <span>Download PDF</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary text-on-primary rounded-lg text-[13px] font-semibold hover:bg-primary-container transition-colors shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">print</span>
              <span>Print Sekarang</span>
            </button>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {shareModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-inverse-surface/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShareModalOpen(false)}
        >
          <div
            className="bg-surface-container-lowest rounded-xl shadow-2xl max-w-md w-full p-6 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary font-display text-[17px] font-bold">
                <span className="material-symbols-outlined">forward_to_inbox</span>
                <h3>Kirim Salinan Bukti Digital</h3>
              </div>
              <button
                type="button"
                onClick={() => setShareModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="text-[12.5px] text-on-surface-variant">
              Kirim berkas PDF bukti pengembalian dan kwitansi pelunasan denda keterlambatan kepada anggota terdaftar.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-[11.5px] font-semibold mb-1">
                  Email Penerima
                </label>
                <input
                  type="email"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low rounded-lg text-[13px] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11.5px] font-semibold mb-1">
                  Nomor WhatsApp (Aktif)
                </label>
                <input
                  type="text"
                  value={sharePhone}
                  onChange={(e) => setSharePhone(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low rounded-lg text-[13px] focus:outline-none"
                />
              </div>
              <div className="p-2.5 bg-surface-container rounded-lg flex items-center gap-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-tertiary text-base">
                  attach_file
                </span>
                <span className="font-mono text-[11.5px] truncate">
                  Bukti_Pengembalian_{tx.id}.pdf (142 KB)
                </span>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShareModalOpen(false)}
                className="px-4 py-2 rounded-lg text-[13px] bg-surface-container-low hover:bg-surface-container cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setShareModalOpen(false);
                  showToast(
                    `Salinan struk PDF berhasil dikirim ke WhatsApp & Email ${member.name}!`
                  );
                }}
                className="px-4 py-2 rounded-lg text-[13px] bg-primary text-on-primary font-semibold hover:bg-primary-container flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">send</span>
                <span>Kirim Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
