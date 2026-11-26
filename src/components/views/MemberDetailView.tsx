import React, { useMemo, useState } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import {
  diffDays,
  downloadCSV,
  formatDateShortID,
  formatRupiah,
  getAcademicYear,
  getPreviousAcademicYear,
} from '../../utils/formatters';
import { SafeImage } from '../SafeImage';

export const MemberDetailView: React.FC = () => {
  const {
    members,
    books,
    transactions,
    settings,
    selectedMemberId,
    setActiveView,
    openDigitalCard,
    openReceiptView,
    startQuickLoan,
    returnBook,
    extendLoan,
    showToast,
  } = useLibrary();

  const member = useMemo(
    () => members.find((m) => m.id === selectedMemberId) ?? members[0],
    [members, selectedMemberId]
  );

  const memberTransactions = useMemo(
    () => transactions.filter((t) => t.memberId === member.id),
    [transactions, member.id]
  );

  const activeLoans = useMemo(
    () => memberTransactions.filter((t) => t.status !== 'DIKEMBALIKAN'),
    [memberTransactions]
  );

  const returnedOnTime = useMemo(
    () =>
      memberTransactions.filter(
        (t) => t.status === 'DIKEMBALIKAN' && t.lateDays === 0
      ),
    [memberTransactions]
  );

  const fineHistory = useMemo(
    () => memberTransactions.filter((t) => t.fineAmount > 0),
    [memberTransactions]
  );

  const [historyTab, setHistoryTab] = useState<'all' | 'active' | 'returned' | 'fine'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [academicYear, setAcademicYear] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const academicYearOptions = useMemo(() => {
    const set = new Set<string>([
      getAcademicYear(settings.currentDate),
      getPreviousAcademicYear(settings.currentDate),
    ]);
    memberTransactions.forEach((t) => {
      if (t.academicYear) set.add(t.academicYear);
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [memberTransactions, settings.currentDate]);

  const filteredHistory = useMemo(() => {
    let list = memberTransactions;
    if (historyTab === 'active') {
      list = list.filter((t) => t.status !== 'DIKEMBALIKAN');
    } else if (historyTab === 'returned') {
      list = list.filter((t) => t.status === 'DIKEMBALIKAN');
    } else if (historyTab === 'fine') {
      list = list.filter((t) => t.fineAmount > 0);
    }

    if (academicYear !== 'all') {
      list = list.filter((t) => t.academicYear === academicYear);
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((t) => {
        const b = books.find((bk) => bk.id === t.bookId);
        return (
          t.id.toLowerCase().includes(q) ||
          (b?.title.toLowerCase().includes(q) ?? false) ||
          (b?.author.toLowerCase().includes(q) ?? false) ||
          (b?.isbn.toLowerCase().includes(q) ?? false)
        );
      });
    }
    return list;
  }, [memberTransactions, historyTab, academicYear, searchQuery, books]);

  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / pageSize));
  const paginatedHistory = filteredHistory.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const primaryActiveLoan = activeLoans[0];
  const primaryActiveBook = books.find((b) => b.id === primaryActiveLoan?.bookId);

  const totalFinesPaid = fineHistory.reduce((acc, t) => acc + t.fineAmount, 0);
  const remainingSlots = Math.max(0, settings.maxLoansPerMember - activeLoans.length);

  const handleExportHistory = () => {
    const rows = filteredHistory.map((tx) => {
      const b = books.find((bk) => bk.id === tx.bookId);
      return [
        tx.id,
        b?.title ?? tx.bookId,
        b?.author ?? '',
        tx.borrowDate,
        tx.returnDate ?? tx.dueDate,
        tx.librarian,
        tx.status,
        tx.fineAmount,
      ];
    });
    downloadCSV(
      `riwayat_${member.id}.csv`,
      ['ID Transaksi', 'Judul Buku', 'Penulis', 'Tgl Pinjam', 'Tgl Kembali/Tenggat', 'Pustakawan', 'Status', 'Denda'],
      rows
    );
    showToast(`Riwayat sirkulasi ${member.name} berhasil diekspor.`);
  };

  return (
    <div className="flex flex-col w-full pb-8">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-on-surface-variant text-[12px] flex-wrap">
            <button
              type="button"
              onClick={() => setActiveView('daftar-anggota')}
              className="hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span>Daftar Anggota</span>
            </button>
            <span className="text-outline">/</span>
            <span>Profil &amp; Riwayat Peminjaman</span>
            <span className="text-outline">/</span>
            <span className="text-primary font-semibold">
              {member.name} ({member.id})
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <h1 className="font-display text-2xl sm:text-[28px] text-on-surface font-bold tracking-tight">
              Detail Sirkulasi Anggota
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-[11px] font-semibold shadow-xs ${
                member.status === 'AKTIF'
                  ? 'bg-tertiary-fixed text-tertiary-container'
                  : 'bg-error-container text-error'
              }`}
            >
              {member.status === 'AKTIF' ? 'Member Aktif' : 'Kartu Diblokir'}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => openDigitalCard(member.id)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface-container-highest text-primary hover:bg-primary-fixed transition-colors text-[13px] font-semibold cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">badge</span>
            <span>Kartu Digital ID</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container-high transition-colors shadow-xs text-[13px] font-medium cursor-pointer border border-outline-variant/25"
          >
            <span className="material-symbols-outlined text-base">print</span>
            <span className="hidden sm:inline">Cetak Kartu Riwayat</span>
          </button>
          <button
            type="button"
            onClick={() => startQuickLoan({ memberId: member.id })}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-colors shadow-sm text-[13px] font-semibold cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">bookmark_add</span>
            <span>Catat Peminjaman Baru</span>
          </button>
        </div>
      </div>

      {/* Member Profile & Quota Bento */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 mt-2">
        {/* Left 8 Cols */}
        <div className="xl:col-span-8 bg-surface-container-lowest rounded-xl p-5 sm:p-6 shadow-xs border border-outline-variant/20 flex flex-col justify-between relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 relative z-10">
            <div className="relative">
              <SafeImage
                src={member.avatarUrl}
                alt={member.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl object-cover shadow-md ring-4 ring-surface-container"
                fallbackType="avatar"
                fallbackLabel={member.name}
              />
              <span className="absolute -bottom-1 -right-1 bg-tertiary-container text-on-tertiary px-2 py-0.5 rounded font-mono text-[11px] font-bold shadow-sm">
                {member.classOrUnit}
              </span>
            </div>

            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="font-display text-[22px] text-on-surface font-bold truncate">
                  {member.name}
                </h2>
                <span className="px-2 py-0.5 rounded bg-surface-container font-mono text-[12px] text-primary font-semibold">
                  {member.id}
                </span>
                <span className="px-2 py-0.5 rounded bg-surface-container-high text-[11px] text-on-surface-variant font-medium">
                  NIS/ID: {member.nisNisn}
                </span>
              </div>
              <p className="text-[14px] text-on-surface-variant flex items-center gap-1.5 mb-3">
                <span className="material-symbols-outlined text-base text-primary">
                  school
                </span>
                {member.role} · {settings.schoolName} ({member.majorOrFaculty})
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-2 gap-x-4 text-on-surface-variant text-[12.5px]">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="material-symbols-outlined text-base text-outline">
                    mail
                  </span>
                  <span className="truncate">{member.email}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base text-outline">
                    call
                  </span>
                  <span>{member.phone}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base text-outline">
                    calendar_month
                  </span>
                  <span>Sejak {member.joinedDate}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 flex flex-wrap items-center justify-between gap-3 bg-surface-container-low p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-tertiary-fixed flex items-center justify-center text-tertiary-container">
                <span className="material-symbols-outlined text-lg">verified_user</span>
              </div>
              <div>
                <div className="text-[13px] text-on-surface font-semibold">
                  {member.status === 'DIBLOKIR'
                    ? `Kartu Diblokir (${member.blockReason ?? 'Keamanan'})`
                    : 'Bebas Tunggakan Denda'}
                </div>
                <div className="text-[12px] text-on-surface-variant">
                  {member.status === 'DIBLOKIR'
                    ? 'Akses peminjaman sedang ditangguhkan'
                    : 'Tidak ada sanksi administratif aktif'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10.5px] text-on-surface-variant uppercase tracking-wide block font-semibold">
                  Tingkat Pengembalian Tepat
                </span>
                <span className="font-display text-[17px] font-bold text-tertiary-container tabular-nums">
                  {member.onTimeRate}%{' '}
                  <span className="text-[11px] font-normal text-on-surface-variant">
                    (Sangat Baik)
                  </span>
                </span>
              </div>
              <div className="w-12 h-12 flex-shrink-0">
                <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-surface-container-highest"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                  />
                  <path
                    className="text-tertiary-container"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray={`${member.onTimeRate}, 100`}
                    strokeLinecap="round"
                    strokeWidth="3.5"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Quota Gauge */}
        <div className="xl:col-span-4 bg-surface-container-lowest rounded-xl p-5 sm:p-6 shadow-xs border border-outline-variant/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] uppercase tracking-wider text-outline font-semibold">
                Aturan Kuota Anggota
              </span>
              <span className="px-2 py-0.5 rounded bg-primary-fixed text-primary font-mono text-[11px] font-bold">
                Maks. {settings.maxLoansPerMember} Buku
              </span>
            </div>
            <h3 className="font-display text-[16px] text-on-surface font-semibold">
              Status Kuota Peminjaman
            </h3>
            <p className="text-[12px] text-on-surface-variant mt-1">
              Kapasitas peminjaman aktif yang diizinkan untuk anggota {settings.schoolName}.
            </p>
          </div>

          <div className="my-4">
            <div className="flex items-baseline justify-between mb-2">
              <div className="flex items-baseline gap-1 tabular-nums">
                <span className="font-display text-4xl text-primary font-bold">
                  {activeLoans.length}
                </span>
                <span className="font-display text-lg text-outline">
                  / {settings.maxLoansPerMember}
                </span>
                <span className="text-[12px] text-on-surface-variant ml-1 font-medium">
                  Buku Terpakai
                </span>
              </div>
              <span className="text-[12px] text-tertiary-container font-semibold bg-tertiary-fixed/50 px-2.5 py-0.5 rounded tabular-nums">
                Sisa {remainingSlots} Kuota
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: settings.maxLoansPerMember }).map((_, idx) => (
                <div
                  key={idx}
                  className={`h-3 rounded-full ${
                    idx < activeLoans.length ? 'bg-primary' : 'bg-surface-container-high'
                  }`}
                />
              ))}
            </div>

            <div className="flex justify-between font-mono text-[11px] text-outline mt-1.5">
              {Array.from({ length: settings.maxLoansPerMember }).map((_, idx) => (
                <span key={idx}>
                  Slot {idx + 1} ({idx < activeLoans.length ? 'Terisi' : 'Tersedia'})
                </span>
              ))}
            </div>
          </div>

          <div className="bg-surface-container-low rounded-lg p-3 flex items-center justify-between">
            <span className="text-[12px] text-on-surface font-medium">
              Batas Waktu Pinjam Standar
            </span>
            <span className="text-[13px] text-on-surface font-semibold tabular-nums">
              {settings.defaultLoanDays} Hari Kalender
            </span>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-outline-variant/20 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-surface-container-high flex items-center justify-center text-primary flex-shrink-0">
            <span className="material-symbols-outlined text-2xl">history_edu</span>
          </div>
          <div>
            <span className="text-[10.5px] text-on-surface-variant uppercase tracking-wider font-semibold block">
              Total Peminjaman
            </span>
            <span className="font-display text-[18px] text-on-surface font-bold tabular-nums">
              {memberTransactions.length} Transaksi
            </span>
            <span className="text-[12px] text-outline block">Sepanjang masa terdaftar</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-outline-variant/20 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-primary-fixed flex items-center justify-center text-primary flex-shrink-0">
            <span className="material-symbols-outlined text-2xl">auto_stories</span>
          </div>
          <div>
            <span className="text-[10.5px] text-primary uppercase tracking-wider font-semibold block">
              Sedang Dipinjam
            </span>
            <span className="font-display text-[18px] text-primary font-bold tabular-nums">
              {activeLoans.length} Buku Aktif
            </span>
            <span className="text-[12px] text-on-surface-variant block">
              {primaryActiveLoan
                ? `Tenggat: ${formatDateShortID(primaryActiveLoan.dueDate)}`
                : 'Tidak ada pinjaman aktif'}
            </span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-outline-variant/20 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-tertiary-fixed flex items-center justify-center text-tertiary-container flex-shrink-0">
            <span className="material-symbols-outlined text-2xl">task_alt</span>
          </div>
          <div>
            <span className="text-[10.5px] text-on-surface-variant uppercase tracking-wider font-semibold block">
              Selesai Tepat Waktu
            </span>
            <span className="font-display text-[18px] text-tertiary-container font-bold tabular-nums">
              {returnedOnTime.length} Buku
            </span>
            <span className="text-[12px] text-on-surface-variant block">
              Disiplin pengembalian terjaga
            </span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-outline-variant/20 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-secondary-fixed flex items-center justify-center text-secondary flex-shrink-0">
            <span className="material-symbols-outlined text-2xl">receipt_long</span>
          </div>
          <div>
            <span className="text-[10.5px] text-on-surface-variant uppercase tracking-wider font-semibold block">
              Riwayat Terlambat
            </span>
            <span className="font-display text-[18px] text-secondary font-bold tabular-nums">
              {fineHistory.length} Kali Denda
            </span>
            <span className="text-[12px] text-on-surface-variant block tabular-nums">
              {formatRupiah(totalFinesPaid)} (Telah Lunas)
            </span>
          </div>
        </div>
      </div>

      {/* Active Loan Callout */}
      {primaryActiveLoan && primaryActiveBook && (
        <div className="mt-6 bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/20 overflow-hidden">
          <div className="bg-primary px-5 py-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-on-primary">
              <span className="material-symbols-outlined text-xl text-tertiary-fixed">
                lock_clock
              </span>
              <span className="font-display text-[15px] font-semibold">
                Buku yang Sedang Dipinjam (Sirkulasi Berjalan)
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-primary-container text-on-primary font-mono text-[11px] font-semibold">
              {primaryActiveLoan.id}
            </span>
          </div>

          <div className="p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
            <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
              <div className="relative w-20 h-28 sm:w-24 sm:h-32 flex-shrink-0 rounded-lg overflow-hidden shadow-md bg-surface-container">
                <SafeImage
                  src={primaryActiveBook.coverUrl}
                  alt={primaryActiveBook.title}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-1 left-1 bg-surface-container-lowest/95 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-on-surface">
                  {primaryActiveBook.id}
                </span>
              </div>

              <div className="flex flex-col min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded bg-primary-fixed text-primary text-[11px] font-semibold">
                    Aktif Dipinjam
                  </span>
                  <span className="px-2 py-0.5 rounded bg-surface-container font-mono text-[11px] text-on-surface-variant font-medium">
                    DDC {primaryActiveBook.ddcCode}
                  </span>
                </div>
                <h3 className="font-display text-[18px] text-on-surface font-bold truncate">
                  {primaryActiveBook.title}
                </h3>
                <p className="text-[13.5px] text-on-surface-variant">
                  Penulis: {primaryActiveBook.author} · {primaryActiveBook.publisher} (
                  {primaryActiveBook.year})
                </p>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3 text-[12px] text-on-surface-variant">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-outline">
                      event_available
                    </span>
                    <span>
                      Pinjam:{' '}
                      <strong className="text-on-surface">
                        {formatDateShortID(primaryActiveLoan.borrowDate)}
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-error">
                      event_busy
                    </span>
                    <span>
                      Tenggat:{' '}
                      <strong className="text-error">
                        {formatDateShortID(primaryActiveLoan.dueDate)}
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-primary">
                      shelves
                    </span>
                    <span>Lokasi: {primaryActiveBook.rackLocation}</span>
                  </div>
                  <span className="font-semibold text-tertiary-container bg-tertiary-fixed/60 px-2.5 py-0.5 rounded-full">
                    {(() => {
                      const left = diffDays(settings.currentDate, primaryActiveLoan.dueDate);
                      return left >= 0
                        ? `Tersisa ${left} Hari Lagi`
                        : `Terlambat ${Math.abs(left)} Hari`;
                    })()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
              <button
                type="button"
                onClick={() => extendLoan(primaryActiveLoan.id, 7)}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-surface-container text-primary text-[13px] font-semibold hover:bg-surface-container-high transition-colors cursor-pointer whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-base">update</span>
                <span>Perpanjang (7 Hari)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const res = returnBook(primaryActiveLoan.id);
                  if (res.ok && res.data) {
                    openReceiptView(res.data.id);
                  }
                }}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-tertiary-container text-on-tertiary text-[13px] font-semibold hover:bg-tertiary shadow-xs transition-colors cursor-pointer whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-base">
                  assignment_turned_in
                </span>
                <span>Proses Pengembalian</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Historical Circulation Table */}
      <div className="mt-7 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-[18px] text-on-surface font-bold">
              Catatan Riwayat Sirkulasi Peminjaman
            </h2>
            <p className="text-[12.5px] text-on-surface-variant">
              Log transaksi peminjaman, pengembalian, dan penalti sejak awal keanggotaan.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-surface-container p-1 rounded-xl overflow-x-auto">
            {[
              { id: 'all', label: `Semua Riwayat (${memberTransactions.length})` },
              { id: 'active', label: `Sedang Dipinjam (${activeLoans.length})` },
              {
                id: 'returned',
                label: `Sudah Kembali (${
                  memberTransactions.filter((t) => t.status === 'DIKEMBALIKAN').length
                })`,
              },
              { id: 'fine', label: `Riwayat Denda (${fineHistory.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setHistoryTab(tab.id as typeof historyTab);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                  historyTab === tab.id
                    ? 'bg-surface-container-lowest text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search & Academic Year Filter */}
        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-outline-variant/20 flex flex-col lg:flex-row items-center justify-between gap-3">
          <div className="relative w-full lg:max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Cari judul buku, ISBN, atau ID transaksi..."
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-surface-container-low text-on-surface text-[13px] placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/25"
            />
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
            <select
              value={academicYear}
              onChange={(e) => {
                setAcademicYear(e.target.value);
                setPage(1);
              }}
              className="bg-surface-container-low px-3 py-2 rounded-lg text-[13px] text-on-surface focus:outline-none cursor-pointer"
            >
              <option value="all">Semua Tahun Akademik</option>
              {academicYearOptions.map((yr) => (
                <option key={yr} value={yr}>
                  Tahun Akademik {yr}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleExportHistory}
              className="p-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant transition-colors cursor-pointer"
              title="Export CSV"
            >
              <span className="material-symbols-outlined text-base">download</span>
            </button>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant text-[11px] font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">ID Transaksi</th>
                  <th className="py-3 px-4">Buku &amp; Pengarang</th>
                  <th className="py-3 px-4">Tgl Pinjam</th>
                  <th className="py-3 px-4">Tgl Kembali / Tenggat</th>
                  <th className="py-3 px-4">Pustakawan</th>
                  <th className="py-3 px-4">Status Peminjaman</th>
                  <th className="py-3 px-4 text-right">Struk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container text-[13px]">
                {paginatedHistory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-on-surface-variant">
                      Tidak ada riwayat transaksi yang cocok.
                    </td>
                  </tr>
                ) : (
                  paginatedHistory.map((tx) => {
                    const b = books.find((bk) => bk.id === tx.bookId);
                    const isReturned = tx.status === 'DIKEMBALIKAN';
                    const isLate = tx.lateDays > 0 || tx.fineAmount > 0;
                    return (
                      <tr key={tx.id} className="hover:bg-surface-container-low/70 transition-colors">
                        <td className="py-3 px-4 font-mono text-[12px] font-semibold text-primary whitespace-nowrap">
                          {tx.id}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5 min-w-[220px]">
                            <div className="w-9 h-12 rounded overflow-hidden shadow-xs flex-shrink-0 bg-surface-container">
                              <SafeImage
                                src={b?.coverUrl}
                                alt={b?.title ?? tx.bookId}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-on-surface truncate max-w-[220px]">
                                {b?.title ?? tx.bookId}
                              </span>
                              <span className="text-[12px] text-on-surface-variant truncate">
                                {b?.author ?? ''}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap font-medium tabular-nums">
                          {formatDateShortID(tx.borrowDate)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap tabular-nums">
                          {isReturned ? (
                            <span className={isLate ? 'text-secondary font-semibold' : ''}>
                              {formatDateShortID(tx.returnDate ?? tx.dueDate)}
                            </span>
                          ) : (
                            <span className="text-error font-semibold">
                              {formatDateShortID(tx.dueDate)} (Tenggat)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-on-surface-variant whitespace-nowrap">
                          {tx.librarian}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold inline-flex items-center ${
                              !isReturned
                                ? 'bg-primary-fixed text-primary'
                                : isLate
                                ? 'bg-secondary-fixed text-secondary'
                                : 'bg-tertiary-fixed text-tertiary-container'
                            }`}
                          >
                            {!isReturned
                              ? 'Aktif Dipinjam'
                              : isLate
                              ? `Terlambat ${tx.lateDays} Hari (Denda ${formatRupiah(
                                  tx.fineAmount
                                )} Lunas)`
                              : 'Kembali Tepat Waktu'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => openReceiptView(tx.id)}
                            className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                            title="Lihat Struk / Bukti"
                          >
                            <span className="material-symbols-outlined text-lg">
                              {isLate ? 'receipt_long' : 'receipt'}
                            </span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3 bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-2 text-[12px] text-on-surface-variant">
            <div className="flex items-center gap-2 tabular-nums">
              <span>
                Menampilkan <strong>{paginatedHistory.length}</strong> dari{' '}
                <strong>{filteredHistory.length}</strong> riwayat
              </span>
              <span>·</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-surface-container-lowest text-on-surface px-2 py-1 rounded text-[12px]"
              >
                <option value={5}>5 baris / hal</option>
                <option value={10}>10 baris / hal</option>
              </select>
            </div>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`w-7 h-7 rounded font-semibold cursor-pointer ${
                    page === p
                      ? 'bg-primary text-on-primary'
                      : 'hover:bg-surface-container text-on-surface'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
