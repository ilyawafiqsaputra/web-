import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLibrary } from '../context/LibraryContext';
import { LIBRARIAN_AVATAR_URL, SCHOOL_LOGO_URL } from '../data/seedData';
import { ActiveView } from '../types/library';
import { formatDateFullWithDayID } from '../utils/formatters';
import { SafeImage } from './SafeImage';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const {
    books,
    members,
    transactions,
    settings,
    activeView,
    setActiveView,
    openMemberDetail,
    openReceiptView,
    startQuickLoan,
    startQuickReturn,
    getActiveLoanCount,
    toast,
    dismissToast,
  } = useLibrary();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [globalQuery, setGlobalQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const activeLoanCount = getActiveLoanCount();
  const overdueLoans = useMemo(
    () => transactions.filter((t) => t.status === 'TERLAMBAT'),
    [transactions]
  );
  const outOfStockBooks = useMemo(
    () => books.filter((b) => b.availableStock === 0),
    [books]
  );
  const alertCount = overdueLoans.length + outOfStockBooks.length;

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setSearchFocused(false);
        setNotifOpen(false);
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchBoxRef.current &&
        !searchBoxRef.current.contains(e.target as Node)
      ) {
        setSearchFocused(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const searchResults = useMemo(() => {
    const q = globalQuery.trim().toLowerCase();
    if (!q) return { books: [], members: [], transactions: [] };
    return {
      books: books
        .filter(
          (b) =>
            b.id.toLowerCase().includes(q) ||
            b.title.toLowerCase().includes(q) ||
            b.author.toLowerCase().includes(q) ||
            b.isbn.toLowerCase().includes(q)
        )
        .slice(0, 4),
      members: members
        .filter(
          (m) =>
            m.id.toLowerCase().includes(q) ||
            m.name.toLowerCase().includes(q) ||
            m.nisNisn.toLowerCase().includes(q)
        )
        .slice(0, 3),
      transactions: transactions
        .filter(
          (t) =>
            t.id.toLowerCase().includes(q) ||
            t.refBarcode.toLowerCase().includes(q)
        )
        .slice(0, 3),
    };
  }, [globalQuery, books, members, transactions]);

  const hasSearchResults =
    searchResults.books.length > 0 ||
    searchResults.members.length > 0 ||
    searchResults.transactions.length > 0;

  const isNavActive = (path: ActiveView) => {
    if (path === 'daftar-anggota') {
      return (
        activeView === 'daftar-anggota' ||
        activeView === 'detail-anggota' ||
        activeView === 'kartu-digital'
      );
    }
    if (path === 'sirkulasi-transaksi') {
      return (
        activeView === 'sirkulasi-transaksi' || activeView === 'cetak-struk'
      );
    }
    return activeView === path;
  };

  const navItems: {
    id: ActiveView;
    label: string;
    icon: string;
    badge?: number;
  }[] = [
    { id: 'dashboard-ringkasan', label: 'Dashboard & Ringkasan', icon: 'grid_view' },
    { id: 'katalog-inventaris-buku', label: 'Katalog & Inventaris Buku', icon: 'menu_book' },
    {
      id: 'sirkulasi-transaksi',
      label: 'Sirkulasi & Transaksi',
      icon: 'sync_alt',
      badge: activeLoanCount,
    },
    { id: 'daftar-anggota', label: 'Daftar Anggota', icon: 'group' },
    { id: 'pengaturan-sistem', label: 'Pengaturan Sistem', icon: 'settings' },
  ];

  const handleNavigate = (view: ActiveView) => {
    setActiveView(view);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      {/* Mobile backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-inverse-surface/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 flex flex-col justify-between transition-transform duration-200 lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col">
          {/* Brand Header */}
          <div className="h-16 px-4 flex items-center justify-between bg-surface-container-lowest">
            <button
              type="button"
              onClick={() => handleNavigate('dashboard-ringkasan')}
              className="flex items-center gap-2.5 text-left min-w-0 cursor-pointer"
            >
              <SafeImage
                src={SCHOOL_LOGO_URL}
                alt="Perpustakaan SMK Muhammadiyah Pakem"
                className="h-8 w-8 object-contain flex-shrink-0"
                fallbackType="logo"
              />
              <div className="flex flex-col min-w-0">
                <span className="font-display text-[15px] text-primary leading-none font-bold truncate">
                  {settings.libraryName}
                </span>
                <span className="text-[11px] text-on-surface-variant leading-none mt-1 font-semibold truncate">
                  {settings.schoolName}
                </span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1 rounded text-on-surface-variant hover:bg-surface-container"
              aria-label="Tutup menu"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          {/* Staff Profile Card */}
          <div className="px-4 py-2">
            <div className="p-2.5 bg-surface-container-low rounded-xl flex items-center gap-2.5">
              <div className="relative flex-shrink-0">
                <SafeImage
                  src={LIBRARIAN_AVATAR_URL}
                  alt="Siti Rahma"
                  className="w-8 h-8 rounded-full object-cover"
                  fallbackType="avatar"
                  fallbackLabel="Siti Rahma"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-tertiary-container rounded-full ring-2 ring-surface-container-lowest" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[13px] font-semibold text-on-surface truncate">
                  Siti Rahma
                </span>
                <span className="text-[12px] text-on-surface-variant flex items-center gap-1 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary-container flex-shrink-0" />
                  Online · Pustakawan
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1 px-4 py-2" aria-label="Menu Utama">
            {navItems.map((item) => {
              const active = isNavActive(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavigate(item.id)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-left transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-primary-container text-on-primary font-semibold shadow-xs'
                      : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="material-symbols-outlined text-[19px] flex-shrink-0">
                      {item.icon}
                    </span>
                    <span className="text-[13.5px] truncate">{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[11px] font-semibold tabular-nums flex-shrink-0 ${
                        active
                          ? 'bg-on-primary/20 text-on-primary'
                          : 'bg-surface-container-highest text-primary'
                      }`}
                    >
                      {item.badge} Aktif
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Help Card */}
        <button
          type="button"
          onClick={() => setGuideOpen(true)}
          className="p-3.5 bg-surface-container-low hover:bg-surface-container transition-colors mx-4 mb-4 rounded-xl text-left cursor-pointer"
        >
          <div className="flex items-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-base text-primary">
              help_outline
            </span>
            <span className="text-[13px] font-semibold text-on-surface">
              Pusat Panduan
            </span>
          </div>
          <p className="text-[12px] text-on-surface-variant mt-1 leading-snug">
            Bantuan sirkulasi buku dan aturan katalog digital.
          </p>
        </button>
      </aside>

      {/* Main Column */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Top Fixed Header */}
        <header className="fixed top-0 left-0 lg:left-64 right-0 h-16 bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 px-4 lg:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high"
              aria-label="Buka menu navigasi"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>

            {/* Global Search */}
            <div className="relative w-full" ref={searchBoxRef}>
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
                search
              </span>
              <input
                ref={searchInputRef}
                type="text"
                value={globalQuery}
                onFocus={() => setSearchFocused(true)}
                onChange={(e) => {
                  setGlobalQuery(e.target.value);
                  setSearchFocused(true);
                }}
                placeholder="Cari judul buku, pengarang, ISBN, atau nama anggota..."
                className="w-full pl-9 pr-12 py-2 rounded-lg bg-surface-container-lowest text-on-surface text-[13px] placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/25 shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
              />
              <span className="hidden sm:inline-block absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-surface-container font-mono text-[11px] text-on-surface-variant">
                ⌘K
              </span>

              {/* Global Search Popover */}
              {searchFocused && globalQuery.trim().length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant/40 overflow-hidden z-50 max-h-96 overflow-y-auto">
                  {!hasSearchResults ? (
                    <div className="p-4 text-center text-[13px] text-on-surface-variant">
                      Tidak ditemukan buku, anggota, atau transaksi untuk &ldquo;{globalQuery}&rdquo;.
                    </div>
                  ) : (
                    <div className="divide-y divide-surface-container">
                      {searchResults.books.length > 0 && (
                        <div className="p-2">
                          <div className="px-2 py-1 text-[11px] font-semibold text-outline uppercase tracking-wider">
                            Koleksi Buku
                          </div>
                          {searchResults.books.map((book) => (
                            <button
                              key={book.id}
                              type="button"
                              onClick={() => {
                                startQuickLoan({ bookId: book.id });
                                setSearchFocused(false);
                                setGlobalQuery('');
                              }}
                              className="w-full flex items-center justify-between gap-3 px-2.5 py-2 rounded-lg hover:bg-surface-container-low text-left transition-colors"
                            >
                              <div className="min-w-0">
                                <p className="text-[13px] font-semibold text-on-surface truncate">
                                  {book.title}
                                </p>
                                <p className="text-[11px] text-on-surface-variant font-mono">
                                  {book.id} · {book.author}
                                </p>
                              </div>
                              <span
                                className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                                  book.availableStock > 0
                                    ? 'bg-tertiary-fixed text-tertiary-container'
                                    : 'bg-error-container text-error'
                                }`}
                              >
                                Stok: {book.availableStock}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}

                      {searchResults.members.length > 0 && (
                        <div className="p-2">
                          <div className="px-2 py-1 text-[11px] font-semibold text-outline uppercase tracking-wider">
                            Anggota Perpustakaan
                          </div>
                          {searchResults.members.map((member) => (
                            <button
                              key={member.id}
                              type="button"
                              onClick={() => {
                                openMemberDetail(member.id);
                                setSearchFocused(false);
                                setGlobalQuery('');
                              }}
                              className="w-full flex items-center justify-between gap-3 px-2.5 py-2 rounded-lg hover:bg-surface-container-low text-left transition-colors"
                            >
                              <div className="min-w-0">
                                <p className="text-[13px] font-semibold text-on-surface truncate">
                                  {member.name}
                                </p>
                                <p className="text-[11px] text-on-surface-variant font-mono">
                                  {member.id} · {member.classOrUnit}
                                </p>
                              </div>
                              <span className="text-[11px] font-semibold text-primary">
                                Lihat Profil
                              </span>
                            </button>
                          ))}
                        </div>
                      )}

                      {searchResults.transactions.length > 0 && (
                        <div className="p-2">
                          <div className="px-2 py-1 text-[11px] font-semibold text-outline uppercase tracking-wider">
                            Transaksi Sirkulasi
                          </div>
                          {searchResults.transactions.map((tx) => (
                            <button
                              key={tx.id}
                              type="button"
                              onClick={() => {
                                if (tx.status === 'DIKEMBALIKAN') {
                                  openReceiptView(tx.id);
                                } else {
                                  startQuickReturn(tx.id);
                                }
                                setSearchFocused(false);
                                setGlobalQuery('');
                              }}
                              className="w-full flex items-center justify-between gap-3 px-2.5 py-2 rounded-lg hover:bg-surface-container-low text-left transition-colors"
                            >
                              <span className="font-mono text-[12px] font-semibold text-primary">
                                {tx.id} ({tx.refBarcode})
                              </span>
                              <span className="text-[11px] text-on-surface-variant">
                                {tx.status === 'DIKEMBALIKAN' ? 'Buka Struk' : 'Proses Kembali'}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            <div className="hidden xl:flex items-center gap-2 text-on-surface-variant text-[12px]">
              <span className="material-symbols-outlined text-base text-outline">
                calendar_today
              </span>
              <span>{formatDateFullWithDayID(settings.currentDate)}</span>
              <span className="text-outline">·</span>
              <span className="text-tertiary-container font-semibold bg-tertiary-fixed px-2.5 py-0.5 rounded-full text-[11px]">
                {settings.serviceHours}
              </span>
            </div>

            <div className="h-4 w-px bg-surface-container-highest hidden xl:block" />

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotifOpen((prev) => !prev)}
                className="relative p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                aria-label="Notifikasi Perpustakaan"
              >
                <span className="material-symbols-outlined text-lg">notifications</span>
                {alertCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error ring-2 ring-surface" />
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant/40 overflow-hidden z-50">
                  <div className="px-4 py-3 bg-surface-container-low flex items-center justify-between">
                    <span className="text-[13px] font-bold text-on-surface">
                      Peringatan Sirkulasi & Stok
                    </span>
                    <span className="text-[11px] font-mono font-semibold text-error">
                      {alertCount} Perhatian
                    </span>
                  </div>
                  <div className="divide-y divide-surface-container max-h-72 overflow-y-auto">
                    {overdueLoans.map((tx) => {
                      const m = members.find((mem) => mem.id === tx.memberId);
                      const b = books.find((bk) => bk.id === tx.bookId);
                      return (
                        <button
                          key={tx.id}
                          type="button"
                          onClick={() => {
                            startQuickReturn(tx.id);
                            setNotifOpen(false);
                          }}
                          className="w-full p-3 text-left hover:bg-surface-container-low transition-colors flex items-start gap-2.5"
                        >
                          <span className="material-symbols-outlined text-error text-base mt-0.5">
                            warning
                          </span>
                          <div className="min-w-0">
                            <p className="text-[12px] font-semibold text-on-surface truncate">
                              Terlambat: {m?.name} ({tx.id})
                            </p>
                            <p className="text-[11px] text-on-surface-variant truncate">
                              {b?.title} · {tx.lateDays} hari terlambat
                            </p>
                          </div>
                        </button>
                      );
                    })}
                    {outOfStockBooks.map((bk) => (
                      <button
                        key={bk.id}
                        type="button"
                        onClick={() => {
                          setActiveView('katalog-inventaris-buku');
                          setNotifOpen(false);
                        }}
                        className="w-full p-3 text-left hover:bg-surface-container-low transition-colors flex items-start gap-2.5"
                      >
                        <span className="material-symbols-outlined text-secondary text-base mt-0.5">
                          inventory_2
                        </span>
                        <div className="min-w-0">
                          <p className="text-[12px] font-semibold text-on-surface truncate">
                            Stok Habis: {bk.title}
                          </p>
                          <p className="text-[11px] text-on-surface-variant">
                            {bk.id} · 0 dari {bk.totalStock} eksemplar tersedia
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => startQuickLoan()}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-lg text-[13px] font-medium hover:bg-primary-container transition-colors shadow-sm whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">add</span>
              <span>Transaksi Cepat</span>
            </button>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="w-full pt-20 px-4 lg:px-6 flex-1 bg-surface pb-12">
          {children}
        </main>
      </div>

      {/* Global Toast */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 bg-inverse-surface text-inverse-on-surface px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 max-w-md border border-white/10"
        >
          <span
            className={`material-symbols-outlined text-lg ${
              toast.variant === 'success'
                ? 'text-tertiary-fixed'
                : toast.variant === 'warning'
                ? 'text-secondary-container'
                : 'text-error-container'
            }`}
          >
            {toast.variant === 'success'
              ? 'check_circle'
              : toast.variant === 'warning'
              ? 'warning'
              : 'error'}
          </span>
          <span className="text-[13px] leading-snug flex-1">{toast.message}</span>
          <button
            type="button"
            onClick={dismissToast}
            className="text-inverse-on-surface/70 hover:text-inverse-on-surface p-0.5"
            aria-label="Tutup notifikasi"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      )}

      {/* Help Guide Modal */}
      {guideOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/60 backdrop-blur-sm"
          onClick={() => setGuideOpen(false)}
        >
          <div
            className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-outline-variant/30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-3 border-b border-surface-container">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-primary-fixed text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined">menu_book</span>
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-on-surface">
                    Panduan Sistem Perpustakaan (SIPus)
                  </h3>
                  <p className="text-[12px] text-on-surface-variant">
                    Aturan operasional Perpustakaan SMK Muhammadiyah Pakem
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGuideOpen(false)}
                className="p-1 rounded-lg hover:bg-surface-container text-on-surface-variant"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <ul className="mt-4 space-y-2.5 text-[13px] text-on-surface-variant leading-relaxed">
              <li>
                <strong className="text-on-surface">1. Katalog Buku:</strong> Tambah koleksi baru, cari berdasarkan ID (<code className="font-mono text-primary">BK-001</code>) atau judul, dan pantau ketersediaan stok fisik secara real-time.
              </li>
              <li>
                <strong className="text-on-surface">2. Validasi Peminjaman:</strong> Buku dengan stok fisik <strong>0</strong> otomatis ditolak. Setiap anggota maksimal meminjam <strong>{settings.maxLoansPerMember} buku</strong> aktif.
              </li>
              <li>
                <strong className="text-on-surface">3. Pengembalian Tercatat:</strong> Pengembalian hanya diproses untuk ID transaksi aktif yang tercatat, otomatis memulihkan stok (+1), dan menerbitkan struk denda bila terlambat.
              </li>
              <li>
                <strong className="text-on-surface">4. Kartu Digital & Pemblokiran:</strong> Lihat kartu SmartPass siswa, uji simulasi tap RFID, atau blokir kartu sementara dengan notifikasi multi-channel.
              </li>
            </ul>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setGuideOpen(false)}
                className="px-4 py-2 rounded-lg bg-primary text-on-primary text-[13px] font-semibold hover:bg-primary-container transition-colors"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
