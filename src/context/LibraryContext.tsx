import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  INITIAL_BOOKS,
  INITIAL_MEMBERS,
  INITIAL_SETTINGS,
  INITIAL_TRANSACTIONS,
} from '../data/seedData';
import {
  ActiveView,
  Anggota,
  Buku,
  LibrarySettings,
  Peminjaman,
} from '../types/library';
import {
  addDays,
  diffDays,
  formatDateCompact,
  getAcademicYear,
  getCurrentDateTimeID,
  getCurrentTimeWIB,
  getCurrentYear,
  getTodayISO,
} from '../utils/formatters';

interface ToastState {
  id: number;
  message: string;
  variant: 'success' | 'warning' | 'error';
}

interface BorrowPayload {
  memberId: string;
  bookId: string;
  durationDays: number;
  notes?: string;
}

interface ActionResult<T = unknown> {
  ok: boolean;
  message: string;
  data?: T;
}

interface LibraryContextValue {
  books: Buku[];
  members: Anggota[];
  transactions: Peminjaman[];
  settings: LibrarySettings;
  activeView: ActiveView;
  selectedMemberId: string;
  selectedReceiptTxId: string;
  preselectedBookForLoanId: string;
  preselectedMemberForLoanId: string;
  preselectedReturnTxId: string;
  toast: ToastState | null;
  setActiveView: (view: ActiveView) => void;
  openMemberDetail: (memberId: string) => void;
  openDigitalCard: (memberId: string) => void;
  openReceiptView: (txId: string) => void;
  startQuickLoan: (opts?: { bookId?: string; memberId?: string }) => void;
  startQuickReturn: (txId: string) => void;
  showToast: (message: string, variant?: 'success' | 'warning' | 'error') => void;
  dismissToast: () => void;
  addBook: (
    book: Omit<Buku, 'id' | 'availableStock'> & { availableStock?: number }
  ) => ActionResult<Buku>;
  updateBook: (book: Buku) => void;
  addMember: (
    member: Omit<Anggota, 'id' | 'status' | 'qrTokenHash' | 'lastGateTap' | 'onTimeRate'>
  ) => ActionResult<Anggota>;
  borrowBook: (payload: BorrowPayload) => ActionResult<Peminjaman>;
  returnBook: (transactionId: string, notes?: string) => ActionResult<Peminjaman>;
  extendLoan: (transactionId: string, days?: number) => ActionResult<Peminjaman>;
  blockMemberCard: (memberId: string, reason: string, note?: string) => void;
  unblockMemberCard: (memberId: string) => void;
  regenerateMemberQrToken: (memberId: string) => string;
  updateSettings: (next: LibrarySettings) => void;
  resetDemoData: () => void;
  getMemberActiveLoans: (memberId: string) => Peminjaman[];
  getActiveLoanCount: () => number;
}

const STORAGE_KEY = 'sipus_smk_muh_pakem_v2';

const LibraryContext = createContext<LibraryContextValue | null>(null);

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [books, setBooks] = useState<Buku[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.books)) return parsed.books;
      }
    } catch {
      // ignore storage errors
    }
    return INITIAL_BOOKS;
  });

  const [members, setMembers] = useState<Anggota[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.members)) return parsed.members;
      }
    } catch {
      // ignore
    }
    return INITIAL_MEMBERS;
  });

  const [transactions, setTransactions] = useState<Peminjaman[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.transactions)) return parsed.transactions;
      }
    } catch {
      // ignore
    }
    return INITIAL_TRANSACTIONS;
  });

  const [settings, setSettings] = useState<LibrarySettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.settings) {
          return { ...parsed.settings, currentDate: getTodayISO() };
        }
      }
    } catch {
      // ignore
    }
    return { ...INITIAL_SETTINGS, currentDate: getTodayISO() };
  });

  const [activeView, setActiveView] = useState<ActiveView>('sirkulasi-transaksi');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('ANG-0842');
  const [selectedReceiptTxId, setSelectedReceiptTxId] = useState<string>(
    () => transactions.find((t) => t.status === 'DIKEMBALIKAN')?.id ?? INITIAL_TRANSACTIONS[5].id
  );
  const [preselectedBookForLoanId, setPreselectedBookForLoanId] = useState<string>('BK-002');
  const [preselectedMemberForLoanId, setPreselectedMemberForLoanId] = useState<string>('ANG-0842');
  const [preselectedReturnTxId, setPreselectedReturnTxId] = useState<string>(
    () => transactions.find((t) => t.status !== 'DIKEMBALIKAN')?.id ?? INITIAL_TRANSACTIONS[2].id
  );
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ books, members, transactions, settings })
      );
    } catch {
      // ignore quota errors
    }
  }, [books, members, transactions, settings]);

  const showToast = (
    message: string,
    variant: 'success' | 'warning' | 'error' = 'success'
  ) => {
    const id = Date.now();
    setToast({ id, message, variant });
    window.setTimeout(() => {
      setToast((curr) => (curr?.id === id ? null : curr));
    }, 3600);
  };

  const dismissToast = () => setToast(null);

  const getMemberActiveLoans = (memberId: string) =>
    transactions.filter(
      (t) => t.memberId === memberId && t.status !== 'DIKEMBALIKAN'
    );

  const getActiveLoanCount = () =>
    transactions.filter((t) => t.status !== 'DIKEMBALIKAN').length;

  const openMemberDetail = (memberId: string) => {
    setSelectedMemberId(memberId);
    setActiveView('detail-anggota');
  };

  const openDigitalCard = (memberId: string) => {
    setSelectedMemberId(memberId);
    setActiveView('kartu-digital');
  };

  const openReceiptView = (txId: string) => {
    setSelectedReceiptTxId(txId);
    setActiveView('cetak-struk');
  };

  const startQuickLoan = (opts?: { bookId?: string; memberId?: string }) => {
    if (opts?.bookId) setPreselectedBookForLoanId(opts.bookId);
    if (opts?.memberId) setPreselectedMemberForLoanId(opts.memberId);
    setActiveView('sirkulasi-transaksi');
  };

  const startQuickReturn = (txId: string) => {
    setPreselectedReturnTxId(txId);
    setActiveView('sirkulasi-transaksi');
  };

  const addBook = (
    bookData: Omit<Buku, 'id' | 'availableStock'> & { availableStock?: number }
  ): ActionResult<Buku> => {
    const maxNum = books.reduce((acc, b) => {
      const m = b.id.match(/BK-(\d+)/);
      return m ? Math.max(acc, parseInt(m[1], 10)) : acc;
    }, 0);
    const nextId = `BK-${String(maxNum + 1).padStart(3, '0')}`;
    const newBook: Buku = {
      ...bookData,
      id: nextId,
      availableStock:
        bookData.availableStock !== undefined
          ? Math.min(bookData.availableStock, bookData.totalStock)
          : bookData.totalStock,
    };
    setBooks((prev) => [newBook, ...prev]);
    showToast(`Buku "${newBook.title}" (${newBook.id}) berhasil ditambahkan ke katalog.`);
    return { ok: true, message: 'Buku berhasil ditambahkan', data: newBook };
  };

  const updateBook = (updated: Buku) => {
    setBooks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    showToast(`Data buku ${updated.id} berhasil diperbarui.`);
  };

  const addMember = (
    memberData: Omit<Anggota, 'id' | 'status' | 'qrTokenHash' | 'lastGateTap' | 'onTimeRate'>
  ): ActionResult<Anggota> => {
    const maxNum = members.reduce((acc, m) => {
      const match = m.id.match(/ANG-(\d+)/);
      return match ? Math.max(acc, parseInt(match[1], 10)) : acc;
    }, 842);
    const nextId = `ANG-${String(maxNum + 1).padStart(4, '0')}`;
    const newMember: Anggota = {
      ...memberData,
      id: nextId,
      status: 'AKTIF',
      onTimeRate: 100,
      qrTokenHash: `HMAC-SHA256-${Math.random().toString(16).slice(2, 10).toUpperCase()}`,
      lastGateTap: 'Baru terdaftar hari ini',
    };
    setMembers((prev) => [newMember, ...prev]);
    showToast(`Anggota baru ${newMember.name} (${newMember.id}) berhasil didaftarkan.`);
    return { ok: true, message: 'Anggota berhasil ditambahkan', data: newMember };
  };

  const borrowBook = ({
    memberId,
    bookId,
    durationDays,
    notes,
  }: BorrowPayload): ActionResult<Peminjaman> => {
    const member = members.find((m) => m.id === memberId);
    if (!member) {
      return { ok: false, message: 'Anggota tidak ditemukan dalam sistem.' };
    }
    if (member.status === 'DIBLOKIR') {
      showToast(
        `Peminjaman ditolak: Kartu ${member.name} (${member.id}) sedang DIBLOKIR.`,
        'error'
      );
      return {
        ok: false,
        message: `Kartu anggota ${member.name} berstatus DIBLOKIR dan tidak dapat meminjam buku.`,
      };
    }

    const activeLoans = getMemberActiveLoans(memberId);
    if (activeLoans.length >= settings.maxLoansPerMember) {
      showToast(
        `Kuota penuh: ${member.name} sudah meminjam ${activeLoans.length}/${settings.maxLoansPerMember} buku.`,
        'error'
      );
      return {
        ok: false,
        message: `Batas maksimal peminjaman (${settings.maxLoansPerMember} buku) telah tercapai.`,
      };
    }

    const book = books.find((b) => b.id === bookId);
    if (!book) {
      return { ok: false, message: 'Buku tidak ditemukan di katalog.' };
    }
    if (book.availableStock <= 0) {
      showToast(
        `Stok habis: "${book.title}" (${book.id}) memiliki stok fisik 0 unit.`,
        'error'
      );
      return {
        ok: false,
        message: `Buku "${book.title}" tidak dapat dipinjam karena stok fisik habis (0 unit).`,
      };
    }

    const currentYear = getCurrentYear();
    const nextSeq =
      transactions.reduce((acc, t) => {
        const m = t.id.match(/TR-\d{4}-(\d+)/);
        return m ? Math.max(acc, parseInt(m[1], 10)) : acc;
      }, 1092) + 1;

    const txId = `TR-${currentYear}-${nextSeq}`;
    const borrowDate = getTodayISO();
    const dueDate = addDays(borrowDate, durationDays || settings.defaultLoanDays);

    const newTx: Peminjaman = {
      id: txId,
      refBarcode: `BAR-${88900 + nextSeq - 1080}`,
      memberId: member.id,
      bookId: book.id,
      borrowDate,
      dueDate,
      librarian: 'Siti Rahma',
      notes: notes?.trim() || undefined,
      status: durationDays === 0 ? 'TENGGAT_HARI_INI' : 'AKTIF',
      lateDays: 0,
      fineAmount: 0,
      finePaid: false,
      academicYear: getAcademicYear(borrowDate),
    };

    setBooks((prev) =>
      prev.map((b) =>
        b.id === book.id
          ? { ...b, availableStock: Math.max(0, b.availableStock - 1) }
          : b
      )
    );
    setTransactions((prev) => [newTx, ...prev]);

    return {
      ok: true,
      message: `Peminjaman ${txId} berhasil dicatat. Stok ${book.id} berkurang menjadi ${book.availableStock - 1} unit.`,
      data: newTx,
    };
  };

  const returnBook = (
    transactionId: string,
    notes?: string
  ): ActionResult<Peminjaman> => {
    const tx = transactions.find((t) => t.id === transactionId);
    if (!tx) {
      showToast(`Transaksi ${transactionId} tidak tercatat di sistem.`, 'error');
      return {
        ok: false,
        message: 'Pengembalian hanya dapat dilakukan untuk transaksi yang tercatat.',
      };
    }
    if (tx.status === 'DIKEMBALIKAN') {
      showToast(`Transaksi ${transactionId} sudah pernah dikembalikan sebelumnya.`, 'warning');
      return {
        ok: false,
        message: 'Transaksi ini sudah diselesaikan sebelumnya.',
      };
    }

    const today = getTodayISO();
    const lateDays = Math.max(0, diffDays(tx.dueDate, today));
    const fineAmount = lateDays * settings.dailyFineRate;
    const compactToday = formatDateCompact(today);
    const receiptNo = `STR-${compactToday.slice(0, 4)}-${compactToday.slice(4)}-${String(Math.floor(100 + Math.random() * 899))}`;

    const updatedTx: Peminjaman = {
      ...tx,
      returnDate: today,
      returnTime: getCurrentTimeWIB(),
      status: 'DIKEMBALIKAN',
      lateDays,
      fineAmount,
      finePaid: true,
      receiptNo,
      notes:
        notes?.trim() ||
        tx.notes ||
        'Pemeriksaan nomor segel barcode RFID lolos uji sensor gerbang masuk. Kondisi fisik buku baik dan utuh.',
    };

    setTransactions((prev) =>
      prev.map((t) => (t.id === tx.id ? updatedTx : t))
    );
    setBooks((prev) =>
      prev.map((b) =>
        b.id === tx.bookId
          ? { ...b, availableStock: Math.min(b.totalStock, b.availableStock + 1) }
          : b
      )
    );

    showToast(
      `Pengembalian ${tx.id} diverifikasi. Stok buku dipulihkan (+1).`,
      'success'
    );
    return {
      ok: true,
      message: 'Pengembalian berhasil diproses.',
      data: updatedTx,
    };
  };

  const extendLoan = (
    transactionId: string,
    days = 7
  ): ActionResult<Peminjaman> => {
    const tx = transactions.find((t) => t.id === transactionId);
    if (!tx || tx.status === 'DIKEMBALIKAN') {
      return { ok: false, message: 'Transaksi aktif tidak ditemukan.' };
    }
    const nextDue = addDays(tx.dueDate, days);
    const updated: Peminjaman = {
      ...tx,
      dueDate: nextDue,
      status: 'AKTIF',
      lateDays: 0,
      fineAmount: 0,
      extendedCount: (tx.extendedCount ?? 0) + 1,
    };
    setTransactions((prev) => prev.map((t) => (t.id === tx.id ? updated : t)));
    showToast(`Masa pinjam ${tx.id} diperpanjang ${days} hari hingga ${nextDue}.`);
    return { ok: true, message: 'Perpanjangan berhasil', data: updated };
  };

  const blockMemberCard = (memberId: string, reason: string, note?: string) => {
    setMembers((prev) =>
      prev.map((m) =>
        m.id === memberId
          ? {
              ...m,
              status: 'DIBLOKIR',
              blockReason: reason,
              blockNote: note,
              blockedAt: getCurrentDateTimeID(),
            }
          : m
      )
    );
  };

  const unblockMemberCard = (memberId: string) => {
    setMembers((prev) =>
      prev.map((m) =>
        m.id === memberId
          ? {
              ...m,
              status: 'AKTIF',
              blockReason: undefined,
              blockNote: undefined,
              blockedAt: undefined,
            }
          : m
      )
    );
    showToast('Kartu diaktifkan kembali: Hak akses sirkulasi normal kembali.', 'success');
  };

  const regenerateMemberQrToken = (memberId: string): string => {
    const newHash = `HMAC-SHA256-${Math.random().toString(16).slice(2, 10).toUpperCase()}`;
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, qrTokenHash: newHash } : m))
    );
    showToast('Token QR berhasil diperbarui dengan Hash HMAC-256 baru.');
    return newHash;
  };

  const updateSettings = (next: LibrarySettings) => {
    setSettings(next);
    showToast('Pengaturan kebijakan sirkulasi perpustakaan disimpan.');
  };

  const resetDemoData = () => {
    setBooks(INITIAL_BOOKS);
    setMembers(INITIAL_MEMBERS);
    setTransactions(INITIAL_TRANSACTIONS);
    setSettings(INITIAL_SETTINGS);
    localStorage.removeItem(STORAGE_KEY);
    showToast('Data demo Perpustakaan SMK Muhammadiyah Pakem berhasil direset.');
  };

  return (
    <LibraryContext.Provider
      value={{
        books,
        members,
        transactions,
        settings,
        activeView,
        selectedMemberId,
        selectedReceiptTxId,
        preselectedBookForLoanId,
        preselectedMemberForLoanId,
        preselectedReturnTxId,
        toast,
        setActiveView,
        openMemberDetail,
        openDigitalCard,
        openReceiptView,
        startQuickLoan,
        startQuickReturn,
        showToast,
        dismissToast,
        addBook,
        updateBook,
        addMember,
        borrowBook,
        returnBook,
        extendLoan,
        blockMemberCard,
        unblockMemberCard,
        regenerateMemberQrToken,
        updateSettings,
        resetDemoData,
        getMemberActiveLoans,
        getActiveLoanCount,
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
};

export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error('useLibrary must be used within LibraryProvider');
  return ctx;
}
