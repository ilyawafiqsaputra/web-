import React, { useEffect, useMemo, useState } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import {
  addDays,
  diffDays,
  formatDateShortID,
  formatDateWithDayID,
  formatRupiah,
  getCurrentYear,
} from '../../utils/formatters';
import { SafeImage } from '../SafeImage';

export const CirculationView: React.FC = () => {
  const {
    books,
    members,
    transactions,
    settings,
    preselectedBookForLoanId,
    preselectedMemberForLoanId,
    preselectedReturnTxId,
    borrowBook,
    returnBook,
    openMemberDetail,
    openReceiptView,
    showToast,
  } = useLibrary();

  // Banner for latest recorded loan
  const [bannerTxId, setBannerTxId] = useState<string | null>(
    () => transactions.find((t) => t.status !== 'DIKEMBALIKAN')?.id ?? null
  );

  // Step 1: Member selection
  const [selectedMemberId, setSelectedMemberId] = useState<string>(preselectedMemberForLoanId);
  const [memberSearch, setMemberSearch] = useState('');
  const [showMemberPicker, setShowMemberPicker] = useState(false);

  // Step 2: Book selection
  const [selectedBookId, setSelectedBookId] = useState<string>(preselectedBookForLoanId);
  const [bookSearch, setBookSearch] = useState('');
  const [showBookPicker, setShowBookPicker] = useState(false);

  // Step 3: Duration & Notes
  const [durationDays, setDurationDays] = useState<number>(settings.defaultLoanDays);
  const [loanNotes, setLoanNotes] = useState('');

  // Quick Return Lookup
  const [returnQuery, setReturnQuery] = useState<string>(preselectedReturnTxId);

  // Active table filters
  const [tableFilter, setTableFilter] = useState<'all' | 'due_soon' | 'overdue'>('all');
  const [tableQuery, setTableQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 6;

  useEffect(() => {
    setSelectedBookId(preselectedBookForLoanId);
  }, [preselectedBookForLoanId]);

  useEffect(() => {
    setSelectedMemberId(preselectedMemberForLoanId);
  }, [preselectedMemberForLoanId]);

  useEffect(() => {
    setReturnQuery(preselectedReturnTxId);
  }, [preselectedReturnTxId]);

  const selectedMember = useMemo(
    () => members.find((m) => m.id === selectedMemberId) ?? members[0],
    [members, selectedMemberId]
  );

  const selectedBook = useMemo(
    () => books.find((b) => b.id === selectedBookId) ?? books[0],
    [books, selectedBookId]
  );

  const outOfStockDemoBook = useMemo(
    () => books.find((b) => b.availableStock === 0 && b.id !== selectedBook?.id) ?? books.find((b) => b.id === 'BK-003'),
    [books, selectedBook]
  );

  const memberActiveLoans = useMemo(
    () =>
      transactions.filter(
        (t) => t.memberId === selectedMember?.id && t.status !== 'DIKEMBALIKAN'
      ),
    [transactions, selectedMember]
  );

  const isMemberBlocked = selectedMember?.status === 'DIBLOKIR';
  const isQuotaFull = memberActiveLoans.length >= settings.maxLoansPerMember;
  const isBookOutOfStock = (selectedBook?.availableStock ?? 0) <= 0;
  const canBorrow = !isMemberBlocked && !isQuotaFull && !isBookOutOfStock;

  const dueDate = addDays(settings.currentDate, durationDays);

  // Quick Return matching transaction
  const matchedReturnTx = useMemo(() => {
    const q = returnQuery.trim().toLowerCase();
    if (!q) return null;
    return (
      transactions.find(
        (t) =>
          (t.id.toLowerCase() === q ||
            t.refBarcode.toLowerCase() === q ||
            t.id.toLowerCase().includes(q)) &&
          t.status !== 'DIKEMBALIKAN'
      ) ?? null
    );
  }, [transactions, returnQuery]);

  const matchedReturnMember = useMemo(
    () => members.find((m) => m.id === matchedReturnTx?.memberId),
    [members, matchedReturnTx]
  );

  const matchedReturnBook = useMemo(
    () => books.find((b) => b.id === matchedReturnTx?.bookId),
    [books, matchedReturnTx]
  );

  const matchedReturnLateDays = useMemo(() => {
    if (!matchedReturnTx) return 0;
    return Math.max(0, diffDays(matchedReturnTx.dueDate, settings.currentDate));
  }, [matchedReturnTx, settings.currentDate]);

  const matchedReturnFine = matchedReturnLateDays * settings.dailyFineRate;

  // Stats
  const activeTransactions = useMemo(
    () => transactions.filter((t) => t.status !== 'DIKEMBALIKAN'),
    [transactions]
  );

  const borrowedTodayCount = useMemo(
    () => transactions.filter((t) => t.borrowDate === settings.currentDate).length,
    [transactions, settings.currentDate]
  );

  const returnedTodayCount = useMemo(
    () =>
      transactions.filter(
        (t) => t.status === 'DIKEMBALIKAN' && t.returnDate === settings.currentDate
      ).length,
    [transactions, settings.currentDate]
  );

  const overdueTransactions = useMemo(
    () =>
      activeTransactions.filter(
        (t) => diffDays(t.dueDate, settings.currentDate) > 0 || t.status === 'TERLAMBAT'
      ),
    [activeTransactions, settings.currentDate]
  );

  const dueSoonTransactions = useMemo(
    () =>
      activeTransactions.filter((t) => {
        const remaining = diffDays(settings.currentDate, t.dueDate);
        return remaining >= 0 && remaining <= 2;
      }),
    [activeTransactions, settings.currentDate]
  );

  // Distribution stats
  const totalCopies = useMemo(
    () => books.reduce((sum, b) => sum + b.totalStock, 0),
    [books]
  );
  const availableCopies = useMemo(
    () => books.reduce((sum, b) => sum + b.availableStock, 0),
    [books]
  );
  const borrowedCopies = Math.max(0, totalCopies - availableCopies);
  const borrowedPct = totalCopies > 0 ? Math.round((borrowedCopies / totalCopies) * 100) : 0;
  const availablePct = Math.max(0, 100 - borrowedPct);

  const filteredActiveTx = useMemo(() => {
    let list = activeTransactions;
    if (tableFilter === 'due_soon') {
      list = dueSoonTransactions;
    } else if (tableFilter === 'overdue') {
      list = overdueTransactions;
    }
    const q = tableQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((t) => {
        const m = members.find((mem) => mem.id === t.memberId);
        const b = books.find((bk) => bk.id === t.bookId);
        return (
          t.id.toLowerCase().includes(q) ||
          (m?.name.toLowerCase().includes(q) ?? false) ||
          (m?.id.toLowerCase().includes(q) ?? false) ||
          (b?.title.toLowerCase().includes(q) ?? false) ||
          (b?.id.toLowerCase().includes(q) ?? false)
        );
      });
    }
    return list;
  }, [activeTransactions, dueSoonTransactions, overdueTransactions, tableFilter, tableQuery, members, books]);

  const totalPages = Math.max(1, Math.ceil(filteredActiveTx.length / pageSize));
  const paginatedTx = filteredActiveTx.slice((page - 1) * pageSize, page * pageSize);

  const bannerTx = useMemo(
    () => transactions.find((t) => t.id === bannerTxId),
    [transactions, bannerTxId]
  );
  const bannerBook = useMemo(
    () => books.find((b) => b.id === bannerTx?.bookId),
    [books, bannerTx]
  );

  const handleBorrowSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !selectedBook) return;
    const res = borrowBook({
      memberId: selectedMember.id,
      bookId: selectedBook.id,
      durationDays,
      notes: loanNotes,
    });
    if (res.ok && res.data) {
      setBannerTxId(res.data.id);
      setLoanNotes('');
      setReturnQuery(res.data.id);
    }
  };

  const handleProcessReturn = (txId: string) => {
    const res = returnBook(txId);
    if (res.ok && res.data) {
      const nextActive = transactions.find(
        (t) => t.id !== txId && t.status !== 'DIKEMBALIKAN'
      );
      setReturnQuery(nextActive?.id ?? '');
      openReceiptView(res.data.id);
    }
  };

  const filteredMembers = useMemo(() => {
    const q = memberSearch.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        m.id.toLowerCase().includes(q) ||
        m.name.toLowerCase().includes(q) ||
        m.classOrUnit.toLowerCase().includes(q)
    );
  }, [members, memberSearch]);

  const filteredBooks = useMemo(() => {
    const q = bookSearch.trim().toLowerCase();
    if (!q) return books;
    return books.filter(
      (b) =>
        b.id.toLowerCase().includes(q) ||
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q)
    );
  }, [books, bookSearch]);

  return (
    <div className="flex flex-col w-full pb-8">
      {/* Dismissible Toast Banner */}
      {bannerTx && (
        <div className="w-full mb-4 bg-tertiary-container/10 border border-tertiary-container/25 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-tertiary-container text-on-tertiary flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-base">check_circle</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[14px] text-tertiary-container font-semibold">
                Peminjaman Berhasil Dicatat · {bannerTx.id}
              </span>
              <span className="text-[12px] text-on-surface-variant">
                Stok buku <strong>{bannerBook?.title ?? bannerTx.bookId}</strong> ({bannerTx.bookId}) tersisa{' '}
                <strong className="tabular-nums">{bannerBook?.availableStock ?? 0} eksemplar</strong>. Bukti transaksi siap dicetak.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => openReceiptView(bannerTx.id)}
              className="px-3 py-1.5 rounded-lg bg-surface-container-lowest text-primary text-[12px] font-semibold hover:bg-surface-container transition-colors shadow-xs cursor-pointer whitespace-nowrap"
            >
              Cetak Struk
            </button>
            <button
              type="button"
              onClick={() => setBannerTxId(null)}
              className="p-1 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
              aria-label="Tutup banner"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        </div>
      )}

      {/* Page Header & Quick Stats */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2 text-on-surface-variant text-[12px] mb-1">
            <span className="font-mono uppercase tracking-wider text-primary font-semibold">
              Sistem Sirkulasi
            </span>
            <span>·</span>
            <span>Peminjaman, Validasi Stok & Pengembalian</span>
          </div>
          <h1 className="font-display text-2xl sm:text-[28px] font-bold text-on-surface tracking-tight">
            Sirkulasi &amp; Transaksi Perpustakaan
          </h1>
          <p className="text-[14px] text-on-surface-variant mt-0.5">
            Pencatatan peminjaman baru, validasi kuota &amp; stok real-time, serta proses pengembalian buku tercatat.
          </p>
        </div>

        {/* Quick Stats Micro-Bar */}
        <div className="flex flex-wrap items-center gap-2 bg-surface-container-lowest p-2 rounded-xl shadow-xs border border-outline-variant/20">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-low rounded-lg">
            <span className="text-[12px] text-on-surface-variant font-medium">
              Aktif Dipinjam:
            </span>
            <span className="text-[15px] font-bold text-primary tabular-nums">
              {activeTransactions.length}
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-low rounded-lg">
            <span className="text-[12px] text-on-surface-variant font-medium">
              Pinjam Hari Ini:
            </span>
            <span className="text-[15px] font-bold text-primary tabular-nums">
              {borrowedTodayCount}
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-low rounded-lg">
            <span className="text-[12px] text-on-surface-variant font-medium">
              Kembali Hari Ini:
            </span>
            <span className="text-[15px] font-bold text-tertiary-container tabular-nums">
              {returnedTodayCount}
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-error-container/40 rounded-lg">
            <span className="text-[12px] text-error font-semibold">Terlambat:</span>
            <span className="text-[15px] font-bold text-error tabular-nums">
              {overdueTransactions.length}
            </span>
          </div>
        </div>
      </div>

      {/* Institutional Policy Banner */}
      <div className="w-full mb-6 bg-surface-container-high text-on-surface rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-xl flex-shrink-0">
            gavel
          </span>
          <div className="text-[13px] leading-snug">
            <span className="text-primary font-bold uppercase tracking-wide mr-1.5 text-[11px]">
              Aturan Aktif:
            </span>
            Batas maksimal pinjam <strong>{settings.maxLoansPerMember} buku / anggota</strong>. Pengembalian hanya untuk transaksi tercatat. Buku dengan stok fisik <strong>0</strong> otomatis ditolak oleh sistem validasi inventaris.
          </div>
        </div>
        <span className="font-mono text-[12px] text-primary bg-surface-container-lowest px-3 py-1 rounded-full font-medium whitespace-nowrap shadow-xs">
          SLA Pinjam: {settings.defaultLoanDays} Hari Kalender
        </span>
      </div>

      {/* Dual Workstation Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-8">
        {/* LEFT COLUMN (8 cols): Peminjaman Buku Baru */}
        <div className="xl:col-span-8">
          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 p-5 sm:p-6 flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-surface-container">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">book_online</span>
                </div>
                <div>
                  <h2 className="font-display text-[17px] font-bold text-on-surface">
                    Pencatatan Peminjaman Buku Baru
                  </h2>
                  <p className="text-[12px] text-on-surface-variant">
                    Lengkapi data verifikasi 3 tahap di bawah ini secara runut.
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-on-primary bg-primary px-3 py-1 rounded-full tracking-wide">
                Validasi Kuota &amp; Stok
              </span>
            </div>

            <form className="flex flex-col gap-5" onSubmit={handleBorrowSubmit}>
              {/* STEP 1: IDENTITAS ANGGOTA */}
              <div className="p-4 bg-surface-container-low rounded-xl flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary text-on-primary flex items-center justify-center font-mono text-[11px] font-bold">
                      1
                    </span>
                    <label className="text-[13.5px] font-semibold text-on-surface">
                      Identitas &amp; Validasi Kuota Anggota
                    </label>
                  </div>
                  <span className="text-[11px] font-semibold text-tertiary-container bg-tertiary-fixed px-2.5 py-0.5 rounded-full">
                    Batas Maks: {settings.maxLoansPerMember} Eksemplar
                  </span>
                </div>

                {/* Patron Selector */}
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
                    badge
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMemberPicker((v) => !v);
                      setShowBookPicker(false);
                    }}
                    className="w-full pl-9 pr-28 py-2.5 rounded-lg bg-surface-container-lowest text-on-surface text-[13px] text-left shadow-xs border border-outline-variant/30 flex items-center justify-between cursor-pointer hover:border-primary/40 transition-colors"
                  >
                    <span className="font-medium truncate">
                      {selectedMember?.id} - {selectedMember?.name} ({selectedMember?.classOrUnit})
                    </span>
                    <span className="text-primary font-semibold text-[12px] whitespace-nowrap">
                      Ganti Patron
                    </span>
                  </button>

                  {showMemberPicker && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant/40 z-30 p-2">
                      <input
                        type="text"
                        value={memberSearch}
                        onChange={(e) => setMemberSearch(e.target.value)}
                        placeholder="Ketik ID atau nama anggota..."
                        className="w-full px-3 py-1.5 mb-2 rounded-lg bg-surface-container-low text-[13px] focus:outline-none"
                        autoFocus
                      />
                      <div className="max-h-48 overflow-y-auto divide-y divide-surface-container">
                        {filteredMembers.map((m) => {
                          const count = transactions.filter(
                            (t) => t.memberId === m.id && t.status !== 'DIKEMBALIKAN'
                          ).length;
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => {
                                setSelectedMemberId(m.id);
                                setShowMemberPicker(false);
                                setMemberSearch('');
                              }}
                              className="w-full px-3 py-2 flex items-center justify-between hover:bg-surface-container-low rounded-lg text-left transition-colors"
                            >
                              <div>
                                <div className="text-[13px] font-semibold text-on-surface">
                                  {m.name}{' '}
                                  <span className="font-mono text-[11px] text-primary">
                                    ({m.id})
                                  </span>
                                </div>
                                <div className="text-[11px] text-on-surface-variant">
                                  {m.role} · {m.classOrUnit}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[11px] text-on-surface-variant tabular-nums">
                                  {count}/{settings.maxLoansPerMember} Buku
                                </span>
                                {m.status === 'DIBLOKIR' && (
                                  <span className="px-1.5 py-0.5 rounded bg-error-container text-error text-[10px] font-bold">
                                    DIBLOKIR
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Selected Member Preview */}
                {selectedMember && (
                  <div className="bg-surface-container-lowest p-3 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs border border-outline-variant/20">
                    <div className="flex items-center gap-3">
                      <SafeImage
                        src={selectedMember.avatarUrl}
                        alt={selectedMember.name}
                        className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                        fallbackType="avatar"
                        fallbackLabel={selectedMember.name}
                      />
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => openMemberDetail(selectedMember.id)}
                            className="text-[14px] font-bold text-on-surface hover:text-primary transition-colors cursor-pointer"
                          >
                            {selectedMember.name}
                          </button>
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              isMemberBlocked
                                ? 'bg-error-container text-error'
                                : 'bg-tertiary-container/15 text-tertiary-container'
                            }`}
                          >
                            {isMemberBlocked ? 'Kartu Diblokir' : 'Member Aktif'}
                          </span>
                        </div>
                        <span className="font-mono text-[11.5px] text-on-surface-variant truncate">
                          ID: {selectedMember.id} · {selectedMember.majorOrFaculty}
                        </span>
                      </div>
                    </div>

                    {/* Quota Visualizer */}
                    <div className="flex flex-col sm:w-56 bg-surface-container-low p-2.5 rounded-lg">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-on-surface-variant font-medium">
                          Kuota Pinjaman:
                        </span>
                        <span
                          className={`font-bold tabular-nums ${
                            isQuotaFull ? 'text-error' : 'text-primary'
                          }`}
                        >
                          {memberActiveLoans.length} / {settings.maxLoansPerMember} Buku
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-surface-container-highest overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isQuotaFull ? 'bg-error' : 'bg-primary-container'
                          }`}
                          style={{
                            width: `${Math.min(
                              100,
                              (memberActiveLoans.length / settings.maxLoansPerMember) * 100
                            )}%`,
                          }}
                        />
                      </div>
                      <span
                        className={`font-mono text-[11px] font-medium mt-1 ${
                          isQuotaFull ? 'text-error' : 'text-tertiary-container'
                        }`}
                      >
                        {isQuotaFull
                          ? 'Kuota Penuh (Tidak dapat meminjam)'
                          : `Sisa Kuota: ${
                              settings.maxLoansPerMember - memberActiveLoans.length
                            } Buku Tersedia`}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* STEP 2: PEMILIHAN BUKU & VALIDASI STOK */}
              <div className="p-4 bg-surface-container-low rounded-xl flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary text-on-primary flex items-center justify-center font-mono text-[11px] font-bold">
                      2
                    </span>
                    <label className="text-[13.5px] font-semibold text-on-surface">
                      Pemilihan Buku &amp; Validasi Ketersediaan Fisik
                    </label>
                  </div>
                  <span className="text-[11px] text-on-surface-variant">
                    Pilih dari Katalog / Scan Barcode
                  </span>
                </div>

                {/* Book Picker Input */}
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
                    qr_code_scanner
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowBookPicker((v) => !v);
                      setShowMemberPicker(false);
                    }}
                    className="w-full pl-9 pr-24 py-2.5 rounded-lg bg-surface-container-lowest text-on-surface text-[13px] text-left shadow-xs border border-outline-variant/30 flex items-center justify-between cursor-pointer hover:border-primary/40 transition-colors"
                  >
                    <span className="font-medium truncate">
                      {selectedBook?.id} - {selectedBook?.title}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded font-mono text-[11px] font-semibold ${
                        isBookOutOfStock
                          ? 'bg-error-container text-error'
                          : 'bg-surface-container-highest text-primary'
                      }`}
                    >
                      {isBookOutOfStock ? 'Stok Habis' : 'Tersedia'}
                    </span>
                  </button>

                  {showBookPicker && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant/40 z-30 p-2">
                      <input
                        type="text"
                        value={bookSearch}
                        onChange={(e) => setBookSearch(e.target.value)}
                        placeholder="Cari ID buku (BK-002), judul, atau penulis..."
                        className="w-full px-3 py-1.5 mb-2 rounded-lg bg-surface-container-low text-[13px] focus:outline-none"
                        autoFocus
                      />
                      <div className="max-h-56 overflow-y-auto divide-y divide-surface-container">
                        {filteredBooks.map((b) => (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => {
                              setSelectedBookId(b.id);
                              setShowBookPicker(false);
                              setBookSearch('');
                            }}
                            className="w-full px-3 py-2 flex items-center justify-between hover:bg-surface-container-low rounded-lg text-left transition-colors"
                          >
                            <div className="min-w-0 pr-3">
                              <div className="text-[13px] font-semibold text-on-surface truncate">
                                <span className="font-mono text-primary mr-1.5">{b.id}</span>
                                {b.title}
                              </div>
                              <div className="text-[11px] text-on-surface-variant truncate">
                                {b.author} · {b.rackLocation}
                              </div>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded font-mono text-[11px] font-semibold whitespace-nowrap ${
                                b.availableStock > 0
                                  ? 'bg-tertiary-fixed text-tertiary-container'
                                  : 'bg-error-container text-error'
                              }`}
                            >
                              {b.availableStock > 0
                                ? `${b.availableStock} Unit`
                                : 'Habis (0)'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Stock Validation Feedback Bento */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Active Selected Book Feedback */}
                  {selectedBook && (
                    <div
                      className={`bg-surface-container-lowest p-3 rounded-lg flex items-start gap-3 shadow-xs border ${
                        isBookOutOfStock
                          ? 'border-error/40 bg-error-container/10'
                          : 'border-tertiary-container/25'
                      }`}
                    >
                      <div className="w-12 h-16 rounded bg-surface-container flex-shrink-0 overflow-hidden shadow-xs relative">
                        <SafeImage
                          src={selectedBook.coverUrl}
                          alt={selectedBook.title}
                          className={`w-full h-full object-cover ${
                            isBookOutOfStock ? 'grayscale' : ''
                          }`}
                        />
                        {isBookOutOfStock && (
                          <div className="absolute inset-0 bg-inverse-surface/40 flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-base">
                              block
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span
                          className={`text-[11px] font-bold uppercase tracking-wide ${
                            isBookOutOfStock ? 'text-error' : 'text-tertiary-container'
                          }`}
                        >
                          {isBookOutOfStock ? 'Stok Habis (0 Unit)' : 'Stok Siap Dipinjam'}
                        </span>
                        <span className="text-[13.5px] font-semibold text-on-surface truncate mt-0.5">
                          {selectedBook.title}
                        </span>
                        <span className="text-[12px] text-on-surface-variant truncate">
                          {selectedBook.author} · {selectedBook.rackLocation}
                        </span>
                        <div className="mt-1.5 flex items-center justify-between">
                          <span
                            className={`font-mono text-[12px] font-bold tabular-nums ${
                              isBookOutOfStock ? 'text-error' : 'text-primary'
                            }`}
                          >
                            Stok Fisik: {selectedBook.availableStock} Unit
                          </span>
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                              isBookOutOfStock
                                ? 'bg-error-container text-error'
                                : 'bg-tertiary-fixed/70 text-tertiary-container'
                            }`}
                          >
                            {isBookOutOfStock ? 'Ditolak Sistem' : 'Memenuhi Syarat'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Out-of-stock Reference Card (Clickable to verify rejection) */}
                  {outOfStockDemoBook && (
                    <button
                      type="button"
                      onClick={() => setSelectedBookId(outOfStockDemoBook.id)}
                      className="bg-surface-container-lowest p-3 rounded-lg flex items-start gap-3 shadow-xs border border-outline-variant/25 text-left hover:border-error/40 transition-colors cursor-pointer opacity-90"
                    >
                      <div className="w-12 h-16 rounded bg-surface-container flex-shrink-0 overflow-hidden shadow-xs relative">
                        <SafeImage
                          src={outOfStockDemoBook.coverUrl}
                          alt={outOfStockDemoBook.title}
                          className="w-full h-full object-cover grayscale"
                        />
                        <div className="absolute inset-0 bg-inverse-surface/40 flex items-center justify-center">
                          <span className="material-symbols-outlined text-white text-base">
                            block
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-[11px] font-bold uppercase tracking-wide text-error">
                          Contoh Stok Habis (0 Unit)
                        </span>
                        <span className="text-[13.5px] font-semibold text-on-surface truncate mt-0.5">
                          {outOfStockDemoBook.title} ({outOfStockDemoBook.id})
                        </span>
                        <span className="text-[12px] text-on-surface-variant truncate">
                          {outOfStockDemoBook.author}
                        </span>
                        <div className="mt-1.5 flex items-center justify-between">
                          <span className="font-mono text-[11.5px] text-error font-semibold">
                            Peminjaman Ditolak Sistem
                          </span>
                          <span className="text-error text-[11px] font-semibold bg-error-container px-2 py-0.5 rounded">
                            Klik Uji Tolak
                          </span>
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              </div>

              {/* STEP 3: DURASI & TANGGAL TRANSAKSI */}
              <div className="p-4 bg-surface-container-low rounded-xl flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary text-on-primary flex items-center justify-center font-mono text-[11px] font-bold">
                      3
                    </span>
                    <label className="text-[13.5px] font-semibold text-on-surface">
                      Durasi, Jatuh Tempo &amp; Catatan Pustakawan
                    </label>
                  </div>
                  <div className="flex items-center gap-1">
                    {[7, 14].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDurationDays(d)}
                        className={`px-2.5 py-1 rounded text-[11px] font-mono font-semibold cursor-pointer transition-colors ${
                          durationDays === d
                            ? 'bg-primary text-on-primary'
                            : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container'
                        }`}
                      >
                        {d} Hari
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-semibold text-on-surface-variant">
                      Tanggal Pinjam (Hari Ini):
                    </span>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-container-lowest text-on-surface text-[13px] shadow-xs">
                      <span className="material-symbols-outlined text-primary text-base">
                        today
                      </span>
                      <span className="font-medium">
                        {formatDateWithDayID(settings.currentDate)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-semibold text-on-surface-variant">
                      Tanggal Jatuh Tempo Wajib Kembali:
                    </span>
                    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-container-highest text-primary text-[13px] shadow-xs font-semibold">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">
                          event_upcoming
                        </span>
                        <span>{formatDateWithDayID(dueDate)}</span>
                      </div>
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-surface-container-lowest">
                        {durationDays} Hari
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1 mt-1">
                  <label className="text-[11px] font-semibold text-on-surface-variant">
                    Catatan Kondisi Buku / Pesan Tambahan (Opsional):
                  </label>
                  <input
                    type="text"
                    value={loanNotes}
                    onChange={(e) => setLoanNotes(e.target.value)}
                    placeholder="Contoh: Kondisi sampul buku utuh, terdapat plastik pelindung bening..."
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-on-surface text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/25 shadow-xs"
                  />
                </div>
              </div>

              {/* Submission Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2 text-[13px]">
                  <span
                    className={`material-symbols-outlined text-base ${
                      canBorrow ? 'text-tertiary-container' : 'text-error'
                    }`}
                  >
                    {canBorrow ? 'verified' : 'gpp_bad'}
                  </span>
                  <span className={canBorrow ? 'text-on-surface-variant' : 'text-error font-medium'}>
                    {isMemberBlocked
                      ? `Kartu ${selectedMember?.name} sedang diblokir.`
                      : isQuotaFull
                      ? `Kuota pinjaman ${selectedMember?.name} sudah penuh (${settings.maxLoansPerMember}/${settings.maxLoansPerMember}).`
                      : isBookOutOfStock
                      ? `Stok fisik buku "${selectedBook?.title}" habis (0 unit).`
                      : 'Validasi kuota & stok fisik terpenuhi tanpa anomali.'}
                  </span>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMemberId('ANG-0842');
                      setSelectedBookId('BK-002');
                      setDurationDays(settings.defaultLoanDays);
                      setLoanNotes('');
                    }}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg bg-surface-container-low text-on-surface-variant text-[13px] font-medium hover:bg-surface-container-high transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Reset Form
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-semibold transition-all shadow-sm cursor-pointer whitespace-nowrap ${
                      canBorrow
                        ? 'bg-primary-container text-on-primary hover:bg-primary'
                        : 'bg-error/90 text-on-error hover:bg-error'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">
                      {canBorrow ? 'assignment_turned_in' : 'block'}
                    </span>
                    <span>
                      {canBorrow
                        ? 'Proses & Simpan Peminjaman (Stok -1)'
                        : 'Uji Validasi Penolakan Sistem'}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN (4 cols): Verifikasi Pengembalian Cepat */}
        <div className="xl:col-span-4">
          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 p-5 sm:p-6 flex flex-col">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-surface-container">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-tertiary text-on-tertiary flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">
                    assignment_return
                  </span>
                </div>
                <div>
                  <h2 className="font-display text-[16px] font-bold text-on-surface">
                    Verifikasi Pengembalian Cepat
                  </h2>
                  <p className="text-[12px] text-on-surface-variant">
                    Restorasi stok fisik instan.
                  </p>
                </div>
              </div>
              <span className="bg-tertiary-container text-on-tertiary px-2 py-0.5 rounded font-mono text-[11px] font-semibold">
                Tercatat
              </span>
            </div>

            {/* Quick Lookup Box */}
            <div className="flex flex-col gap-1.5 mb-3">
              <label className="text-[12px] font-medium text-on-surface-variant">
                Scan Barcode / Masukkan ID Transaksi:
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
                  barcode_scanner
                </span>
                <input
                  type="text"
                  value={returnQuery}
                  onChange={(e) => setReturnQuery(e.target.value)}
                  placeholder={`Contoh: TR-${getCurrentYear()}-1089`}
                  className="w-full pl-9 pr-10 py-2 rounded-lg bg-surface-container-low text-on-surface font-mono text-[13px] font-semibold focus:outline-none focus:ring-2 focus:ring-primary/25 shadow-xs"
                />
                {returnQuery && (
                  <button
                    type="button"
                    onClick={() => setReturnQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                  >
                    <span className="material-symbols-outlined text-base">close</span>
                  </button>
                )}
              </div>
              {/* Quick-select active transactions */}
              <div className="flex flex-wrap gap-1 mt-1">
                {activeTransactions.slice(0, 4).map((tx) => (
                  <button
                    key={tx.id}
                    type="button"
                    onClick={() => setReturnQuery(tx.id)}
                    className={`px-2 py-0.5 rounded font-mono text-[10.5px] font-semibold cursor-pointer transition-colors ${
                      matchedReturnTx?.id === tx.id
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    {tx.id}
                  </button>
                ))}
              </div>
            </div>

            {/* Instant Verification Card */}
            {matchedReturnTx && matchedReturnMember && matchedReturnBook ? (
              <>
                <div className="p-3.5 bg-surface-container-low rounded-xl flex flex-col gap-2.5 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[12px] font-bold text-primary">
                      {matchedReturnTx.id}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        matchedReturnLateDays > 0
                          ? 'bg-error-container text-error'
                          : 'bg-tertiary-fixed text-tertiary-container'
                      }`}
                    >
                      {matchedReturnLateDays > 0
                        ? `Terlambat ${matchedReturnLateDays} Hari`
                        : 'Tepat Waktu'}
                    </span>
                  </div>

                  {/* Patron Mini Block */}
                  <button
                    type="button"
                    onClick={() => openMemberDetail(matchedReturnMember.id)}
                    className="flex items-center gap-2.5 py-1.5 bg-surface-container-lowest px-2.5 rounded-lg text-left hover:bg-surface-container transition-colors cursor-pointer"
                  >
                    <SafeImage
                      src={matchedReturnMember.avatarUrl}
                      alt={matchedReturnMember.name}
                      className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                      fallbackType="avatar"
                      fallbackLabel={matchedReturnMember.name}
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-[13px] font-semibold text-on-surface truncate">
                        {matchedReturnMember.name}
                      </span>
                      <span className="font-mono text-[11px] text-on-surface-variant">
                        ID: {matchedReturnMember.id} · {matchedReturnMember.role}
                      </span>
                    </div>
                  </button>

                  {/* Book Mini Detail */}
                  <div className="p-2.5 bg-surface-container-lowest rounded-lg flex items-center gap-2.5">
                    <div className="w-10 h-14 rounded bg-surface-container overflow-hidden flex-shrink-0 shadow-xs">
                      <SafeImage
                        src={matchedReturnBook.coverUrl}
                        alt={matchedReturnBook.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-[13px] font-bold text-on-surface truncate">
                        {matchedReturnBook.title}
                      </span>
                      <span className="text-[11.5px] text-on-surface-variant truncate">
                        {matchedReturnBook.author} ({matchedReturnBook.id})
                      </span>
                      <span className="font-mono text-[11px] text-primary">
                        Lokasi: {matchedReturnBook.rackLocation}
                      </span>
                    </div>
                  </div>

                  {/* Schedule Breakdown */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-surface-container-lowest p-2 rounded flex flex-col">
                      <span className="text-[11px] text-on-surface-variant">
                        Dipinjam:
                      </span>
                      <span className="font-mono text-[12px] font-semibold text-on-surface">
                        {formatDateShortID(matchedReturnTx.borrowDate)}
                      </span>
                    </div>
                    <div className="bg-surface-container-lowest p-2 rounded flex flex-col">
                      <span className="text-[11px] text-on-surface-variant">
                        Jatuh Tempo:
                      </span>
                      <span
                        className={`font-mono text-[12px] font-semibold ${
                          matchedReturnLateDays > 0
                            ? 'text-error'
                            : 'text-tertiary-container'
                        }`}
                      >
                        {formatDateShortID(matchedReturnTx.dueDate)}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`p-2.5 rounded-lg text-[12.5px] flex items-center gap-2 ${
                      matchedReturnFine > 0
                        ? 'bg-error-container/50 text-error'
                        : 'bg-tertiary-fixed/40 text-tertiary-container'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">
                      {matchedReturnFine > 0 ? 'payments' : 'savings'}
                    </span>
                    <span>
                      Denda Keterlambatan:{' '}
                      <strong className="font-mono tabular-nums">
                        {matchedReturnFine > 0
                          ? formatRupiah(matchedReturnFine)
                          : 'Rp 0 (Nihil)'}
                      </strong>
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleProcessReturn(matchedReturnTx.id)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-tertiary-container text-on-tertiary text-[13px] font-semibold hover:bg-tertiary transition-all shadow-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">task_alt</span>
                  <span>
                    Verifikasi Pengembalian (+1 Stok Fisik)
                  </span>
                </button>
                <p className="text-[11.5px] text-on-surface-variant text-center mt-2">
                  Stok otomatis disinkronkan dan struk resmi akan langsung terbuka.
                </p>
              </>
            ) : (
              <div className="p-5 bg-surface-container-low rounded-xl text-center flex flex-col items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-3xl text-error/80">
                  search_off
                </span>
                <p className="text-[13px] font-semibold text-on-surface">
                  Transaksi Aktif Tidak Ditemukan
                </p>
                <p className="text-[12px] text-on-surface-variant">
                  Pengembalian hanya dapat dilakukan untuk ID transaksi aktif yang tercatat di sistem.
                </p>
              </div>
            )}

            {/* Real-time Distribution Progress */}
            <div className="mt-5 p-4 bg-surface-container-low rounded-xl flex flex-col gap-2">
              <span className="text-[11px] text-primary uppercase font-bold tracking-wider">
                Arus Distribusi Buku Real-Time
              </span>
              <div className="flex items-center justify-between text-[12px] text-on-surface-variant pt-1 tabular-nums">
                <span>
                  Koleksi Total: <strong className="text-on-surface">{totalCopies}</strong>
                </span>
                <span>
                  Sedang Beredar: <strong className="text-on-surface">{borrowedCopies}</strong>
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-surface-container-highest overflow-hidden flex">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${borrowedPct}%` }}
                />
                <div
                  className="bg-tertiary-fixed-dim h-full transition-all duration-300"
                  style={{ width: `${availablePct}%` }}
                />
              </div>
              <div className="flex items-center justify-between font-mono text-[11px] text-on-surface-variant tabular-nums">
                <span>Dipinjam ({borrowedPct}%)</span>
                <span>Di Rak ({availablePct}%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: DAFTAR TRANSAKSI SIRKULASI AKTIF */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 p-5 sm:p-6 flex flex-col">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 mb-4 border-b border-surface-container">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="font-display text-[18px] font-bold text-on-surface">
                Daftar Transaksi Sirkulasi Aktif
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-primary text-[11px] font-bold tabular-nums">
                {activeTransactions.length} Aktif
              </span>
            </div>
            <p className="text-[13px] text-on-surface-variant mt-0.5">
              Monitoring berkala tenggat waktu pengembalian buku dan status peminjam.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center bg-surface-container-low p-1 rounded-lg">
              <button
                type="button"
                onClick={() => {
                  setTableFilter('all');
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded text-[12px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  tableFilter === 'all'
                    ? 'bg-surface-container-lowest text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Semua Aktif ({activeTransactions.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setTableFilter('due_soon');
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded text-[12px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  tableFilter === 'due_soon'
                    ? 'bg-surface-container-lowest text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Mendekati Tenggat ({dueSoonTransactions.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setTableFilter('overdue');
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded text-[12px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  tableFilter === 'overdue'
                    ? 'bg-error text-on-error shadow-xs'
                    : 'text-error hover:bg-error-container/40'
                }`}
              >
                Terlambat ({overdueTransactions.length})
              </button>
            </div>

            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
                filter_list
              </span>
              <input
                type="text"
                value={tableQuery}
                onChange={(e) => {
                  setTableQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Cari nama / buku..."
                className="pl-8 pr-3 py-1.5 bg-surface-container-low rounded-lg text-[13px] text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant text-[11px] font-semibold tracking-wider uppercase">
                <th className="py-3 px-4 rounded-l-lg">ID Transaksi</th>
                <th className="py-3 px-4">Peminjam</th>
                <th className="py-3 px-4">Buku Dipinjam</th>
                <th className="py-3 px-4">Tanggal Pinjam · Jatuh Tempo</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right rounded-r-lg">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-[13px] divide-y divide-surface-container">
              {paginatedTx.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-on-surface-variant">
                    Tidak ada transaksi aktif yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                paginatedTx.map((tx) => {
                  const m = members.find((mem) => mem.id === tx.memberId);
                  const b = books.find((bk) => bk.id === tx.bookId);
                  const daysLate = Math.max(0, diffDays(tx.dueDate, settings.currentDate));
                  const daysLeft = diffDays(settings.currentDate, tx.dueDate);
                  const isOverdue = daysLate > 0;
                  const isDueToday = daysLeft === 0;
                  const fine = daysLate * settings.dailyFineRate;

                  return (
                    <tr
                      key={tx.id}
                      className={`transition-colors ${
                        isOverdue
                          ? 'bg-error-container/15 hover:bg-error-container/25'
                          : isDueToday
                          ? 'bg-secondary-fixed/15 hover:bg-secondary-fixed/25'
                          : 'hover:bg-surface-container-low/70'
                      }`}
                    >
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`font-mono text-[12.5px] font-semibold ${
                            isOverdue ? 'text-error' : 'text-primary'
                          }`}
                        >
                          {tx.id}
                        </span>
                        <div className="font-mono text-[10.5px] text-on-surface-variant">
                          Ref: {tx.refBarcode}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => m && openMemberDetail(m.id)}
                          className="flex items-center gap-2.5 text-left group cursor-pointer"
                        >
                          <SafeImage
                            src={m?.avatarUrl}
                            alt={m?.name ?? tx.memberId}
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                            fallbackType="avatar"
                            fallbackLabel={m?.name ?? tx.memberId}
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-on-surface group-hover:text-primary transition-colors truncate">
                              {m?.name ?? tx.memberId}
                            </span>
                            <span className="font-mono text-[11px] text-on-surface-variant truncate">
                              {tx.memberId} · {m?.role ?? 'Anggota'}
                            </span>
                          </div>
                        </button>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-11 bg-surface-container rounded overflow-hidden flex-shrink-0 shadow-xs">
                            <SafeImage
                              src={b?.coverUrl}
                              alt={b?.title ?? tx.bookId}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium text-on-surface truncate max-w-[220px]">
                              {b?.title ?? tx.bookId}
                            </span>
                            <span className="font-mono text-[11px] text-on-surface-variant">
                              ID: {tx.bookId} · {b?.author ?? ''}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5 font-medium text-on-surface tabular-nums">
                            <span>{formatDateShortID(tx.borrowDate)}</span>
                            <span className="text-on-surface-variant">→</span>
                            <span
                              className={
                                isOverdue
                                  ? 'font-bold text-error'
                                  : isDueToday
                                  ? 'font-bold text-secondary'
                                  : ''
                              }
                            >
                              {formatDateShortID(tx.dueDate)}
                            </span>
                          </div>
                          <span
                            className={`text-[11px] font-semibold mt-0.5 ${
                              isOverdue
                                ? 'text-error'
                                : isDueToday
                                ? 'text-secondary'
                                : 'text-primary'
                            }`}
                          >
                            {isOverdue
                              ? `Terlambat ${daysLate} Hari`
                              : isDueToday
                              ? 'Jatuh Tempo Hari Ini'
                              : `Sisa ${daysLeft} Hari`}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold inline-flex items-center gap-1.5 tabular-nums ${
                            isOverdue
                              ? 'bg-error-container text-error'
                              : isDueToday
                              ? 'bg-secondary-fixed text-secondary'
                              : 'bg-surface-container-highest text-primary'
                          }`}
                        >
                          {isOverdue
                            ? `Denda: ${formatRupiah(fine)}`
                            : isDueToday
                            ? 'Tenggat Hari Ini'
                            : 'Aktif Dipinjam'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              isOverdue || isDueToday
                                ? showToast(
                                    `Pengingat WhatsApp terkirim ke ${m?.name} untuk pengembalian ${tx.id}.`
                                  )
                                : openReceiptView(tx.id)
                            }
                            className="p-1.5 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors cursor-pointer"
                            title={
                              isOverdue || isDueToday
                                ? 'Kirim Notifikasi Pengingat'
                                : 'Lihat Bukti Peminjaman'
                            }
                          >
                            <span className="material-symbols-outlined text-base">
                              {isOverdue || isDueToday ? 'notifications_active' : 'print'}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleProcessReturn(tx.id)}
                            className={`px-3 py-1.5 rounded text-[12px] font-semibold transition-all shadow-xs cursor-pointer ${
                              isOverdue
                                ? 'bg-error text-on-error hover:opacity-90'
                                : isDueToday
                                ? 'bg-secondary-container text-on-secondary hover:opacity-90'
                                : 'bg-primary-container text-on-primary hover:bg-primary'
                            }`}
                          >
                            {isOverdue ? 'Selesaikan + Denda' : 'Proses Kembali'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 mt-2 border-t border-surface-container">
          <span className="text-[12px] text-on-surface-variant tabular-nums">
            Menampilkan <strong>{paginatedTx.length}</strong> dari{' '}
            <strong>{filteredActiveTx.length}</strong> transaksi sirkulasi aktif
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 rounded bg-surface-container text-on-surface-variant text-[12px] font-medium hover:bg-surface-container-high disabled:opacity-40 cursor-pointer"
            >
              Sebelumnya
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className={`w-7 h-7 rounded text-[12px] font-semibold cursor-pointer ${
                  page === p
                    ? 'bg-primary-container text-on-primary'
                    : 'hover:bg-surface-container text-on-surface'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1 rounded bg-surface-container text-primary text-[12px] font-medium hover:bg-surface-container-high disabled:opacity-40 cursor-pointer"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
