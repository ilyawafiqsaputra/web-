import React, { useMemo } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { formatDateShortID, formatRupiah } from '../../utils/formatters';
import { SafeImage } from '../SafeImage';

export const DashboardView: React.FC = () => {
  const {
    books,
    members,
    transactions,
    settings,
    setActiveView,
    openMemberDetail,
    openDigitalCard,
    openReceiptView,
    startQuickLoan,
    startQuickReturn,
  } = useLibrary();

  const totalTitles = books.length;
  const totalCopies = useMemo(
    () => books.reduce((s, b) => s + b.totalStock, 0),
    [books]
  );
  const totalAvailable = useMemo(
    () => books.reduce((s, b) => s + b.availableStock, 0),
    [books]
  );
  const activeLoans = useMemo(
    () => transactions.filter((t) => t.status !== 'DIKEMBALIKAN'),
    [transactions]
  );
  const overdueLoans = useMemo(
    () => transactions.filter((t) => t.status === 'TERLAMBAT'),
    [transactions]
  );
  const outOfStockBooks = useMemo(
    () => books.filter((b) => b.availableStock === 0),
    [books]
  );
  const latestReturnedTx = useMemo(
    () => transactions.find((t) => t.status === 'DIKEMBALIKAN') ?? transactions[0],
    [transactions]
  );

  return (
    <div className="flex flex-col w-full pb-8 gap-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-semibold">
            Ringkasan Operasional
          </span>
          <h1 className="font-display text-2xl sm:text-[28px] font-bold text-on-surface tracking-tight mt-0.5">
            Dashboard {settings.libraryName} {settings.schoolName}
          </h1>
          <p className="text-[14px] text-on-surface-variant mt-0.5">
            Pantau statistik koleksi buku, sirkulasi peminjaman aktif, dan status anggota secara terpusat.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveView('katalog-inventaris-buku')}
            className="px-4 py-2 rounded-lg bg-surface-container-lowest text-on-surface border border-outline-variant/25 text-[13px] font-semibold hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            Kelola Katalog
          </button>
          <button
            type="button"
            onClick={() => startQuickLoan()}
            className="px-4 py-2 rounded-lg bg-primary text-on-primary text-[13px] font-semibold hover:bg-primary-container transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">sync_alt</span>
            <span>Buka Meja Sirkulasi</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest p-5 rounded-xl shadow-xs border border-outline-variant/20">
          <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
            Koleksi Judul / Eksemplar
          </span>
          <div className="font-display text-3xl font-bold text-on-surface mt-1 tabular-nums">
            {totalTitles}{' '}
            <span className="text-[15px] font-normal text-on-surface-variant">
              / {totalCopies} Eks
            </span>
          </div>
          <p className="text-[12px] text-tertiary-container font-medium mt-2 tabular-nums">
            {totalAvailable} eksemplar siap dipinjam di rak
          </p>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-xl shadow-xs border border-outline-variant/20">
          <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
            Sirkulasi Aktif
          </span>
          <div className="font-display text-3xl font-bold text-primary mt-1 tabular-nums">
            {activeLoans.length}
          </div>
          <p className="text-[12px] text-on-surface-variant mt-2">
            Sedang dipinjam oleh anggota terdaftar
          </p>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-xl shadow-xs border border-outline-variant/20">
          <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
            Anggota Terdaftar
          </span>
          <div className="font-display text-3xl font-bold text-on-surface mt-1 tabular-nums">
            {members.length}
          </div>
          <p className="text-[12px] text-tertiary-container font-medium mt-2 tabular-nums">
            {members.filter((m) => m.status === 'AKTIF').length} aktif ·{' '}
            {members.filter((m) => m.status === 'DIBLOKIR').length} diblokir
          </p>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-xl shadow-xs border border-outline-variant/20">
          <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
            Perlu Perhatian
          </span>
          <div className="font-display text-3xl font-bold text-error mt-1 tabular-nums">
            {overdueLoans.length + outOfStockBooks.length}
          </div>
          <p className="text-[12px] text-error font-medium mt-2 tabular-nums">
            {overdueLoans.length} terlambat · {outOfStockBooks.length} stok habis
          </p>
        </div>
      </div>

      {/* Main Split */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Recent Active Loans */}
        <div className="xl:col-span-8 bg-surface-container-lowest rounded-xl p-5 shadow-xs border border-outline-variant/20">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-surface-container">
            <h2 className="font-display text-[17px] font-bold text-on-surface">
              Transaksi Sirkulasi Terkini
            </h2>
            <button
              type="button"
              onClick={() => setActiveView('sirkulasi-transaksi')}
              className="text-[12.5px] font-semibold text-primary hover:underline cursor-pointer"
            >
              Lihat Semua →
            </button>
          </div>
          <div className="divide-y divide-surface-container">
            {transactions.slice(0, 5).map((tx) => {
              const m = members.find((mem) => mem.id === tx.memberId);
              const b = books.find((bk) => bk.id === tx.bookId);
              return (
                <div
                  key={tx.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-12 rounded overflow-hidden bg-surface-container flex-shrink-0">
                      <SafeImage
                        src={b?.coverUrl}
                        alt={b?.title ?? tx.bookId}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-semibold text-on-surface truncate">
                        {b?.title ?? tx.bookId}
                      </div>
                      <div className="text-[12px] text-on-surface-variant">
                        <button
                          type="button"
                          onClick={() => m && openMemberDetail(m.id)}
                          className="text-primary hover:underline font-medium cursor-pointer"
                        >
                          {m?.name ?? tx.memberId}
                        </button>{' '}
                        · <span className="font-mono">{tx.id}</span> · Tenggat{' '}
                        {formatDateShortID(tx.dueDate)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        tx.status === 'DIKEMBALIKAN'
                          ? 'bg-tertiary-fixed text-tertiary-container'
                          : tx.status === 'TERLAMBAT'
                          ? 'bg-error-container text-error'
                          : 'bg-primary-fixed text-primary'
                      }`}
                    >
                      {tx.status === 'DIKEMBALIKAN'
                        ? 'Dikembalikan'
                        : tx.status === 'TERLAMBAT'
                        ? `Terlambat (${formatRupiah(tx.fineAmount)})`
                        : 'Aktif'}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        tx.status === 'DIKEMBALIKAN'
                          ? openReceiptView(tx.id)
                          : startQuickReturn(tx.id)
                      }
                      className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-[12px] font-medium cursor-pointer"
                    >
                      {tx.status === 'DIKEMBALIKAN' ? 'Struk' : 'Proses'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Quick Access Panel */}
        <div className="xl:col-span-4 flex flex-col gap-5">
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-xs border border-outline-variant/20">
            <h2 className="font-display text-[16px] font-bold text-on-surface mb-3">
              Akses Cepat Layanan
            </h2>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => openMemberDetail('ANG-0842')}
                className="w-full p-3 rounded-xl bg-surface-container-low hover:bg-surface-container flex items-center justify-between text-left cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-primary">
                    person_search
                  </span>
                  <div>
                    <div className="text-[13px] font-semibold">
                      Detail Riwayat: Dimas Pratama
                    </div>
                    <div className="text-[11px] text-on-surface-variant">
                      ANG-0842 · XII RPL 1
                    </div>
                  </div>
                </div>
                <span className="material-symbols-outlined text-sm text-outline">
                  chevron_right
                </span>
              </button>

              <button
                type="button"
                onClick={() => openDigitalCard('ANG-0842')}
                className="w-full p-3 rounded-xl bg-surface-container-low hover:bg-surface-container flex items-center justify-between text-left cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-primary">
                    badge
                  </span>
                  <div>
                    <div className="text-[13px] font-semibold">
                      Kartu Anggota Digital (SmartPass)
                    </div>
                    <div className="text-[11px] text-on-surface-variant">
                      Pratinjau ID Card, Tap RFID &amp; Blokir
                    </div>
                  </div>
                </div>
                <span className="material-symbols-outlined text-sm text-outline">
                  chevron_right
                </span>
              </button>

              <button
                type="button"
                onClick={() => latestReturnedTx && openReceiptView(latestReturnedTx.id)}
                className="w-full p-3 rounded-xl bg-surface-container-low hover:bg-surface-container flex items-center justify-between text-left cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-tertiary-container">
                    receipt_long
                  </span>
                  <div>
                    <div className="text-[13px] font-semibold">
                      Cetak Struk Pengembalian &amp; Denda
                    </div>
                    <div className="text-[11px] text-on-surface-variant">
                      Simulasi Thermal 80mm (#{latestReturnedTx?.id ?? '-'})
                    </div>
                  </div>
                </div>
                <span className="material-symbols-outlined text-sm text-outline">
                  chevron_right
                </span>
              </button>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-xs border border-outline-variant/20">
            <h2 className="font-display text-[15px] font-bold text-error mb-2">
              Koleksi Stok Habis (0 Tersedia)
            </h2>
            {outOfStockBooks.length === 0 ? (
              <p className="text-[12.5px] text-on-surface-variant">
                Semua judul buku memiliki stok tersedia.
              </p>
            ) : (
              <div className="space-y-2">
                {outOfStockBooks.map((b) => (
                  <div
                    key={b.id}
                    className="p-2.5 rounded-lg bg-error-container/20 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="text-[12.5px] font-semibold text-on-surface truncate">
                        {b.title}
                      </div>
                      <div className="font-mono text-[11px] text-error">
                        {b.id} · 0/{b.totalStock} Unit
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveView('katalog-inventaris-buku')}
                      className="text-[11px] font-semibold text-primary hover:underline flex-shrink-0 cursor-pointer"
                    >
                      Lihat
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
