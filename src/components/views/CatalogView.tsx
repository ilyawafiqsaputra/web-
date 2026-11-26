import React, { useMemo, useState } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { BookCategory, Buku } from '../../types/library';
import { downloadCSV, formatDateShortID, getCurrentYear } from '../../utils/formatters';
import { SafeImage } from '../SafeImage';

const CATEGORIES: BookCategory[] = [
  'Sastra & Fiksi',
  'Teknologi & Komputer',
  'Sains & Pengetahuan',
  'Sejarah & Budaya',
  'Pengembangan Diri',
  'Bisnis & Self-Help',
];

export const CatalogView: React.FC = () => {
  const {
    books,
    transactions,
    members,
    addBook,
    updateBook,
    startQuickLoan,
    showToast,
  } = useLibrary();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<
    'id-asc' | 'newest' | 'stock-desc' | 'stock-asc' | 'title-asc'
  >('id-asc');
  const [statusTab, setStatusTab] = useState<'all' | 'available' | 'outofstock'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(7);

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Buku | null>(null);
  const [historyBook, setHistoryBook] = useState<Buku | null>(null);

  // Add Book Form state
  const [formIsbn, setFormIsbn] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formAuthor, setFormAuthor] = useState('');
  const [formCategory, setFormCategory] = useState<BookCategory>('Teknologi & Komputer');
  const [formPublisher, setFormPublisher] = useState('');
  const [formYear, setFormYear] = useState(String(getCurrentYear()));
  const [formTotalStock, setFormTotalStock] = useState('5');
  const [formRack, setFormRack] = useState('Rak T-05 (Lantai 2)');
  const [formDdc, setFormDdc] = useState('005.133');

  const nextAutoId = useMemo(() => {
    const maxNum = books.reduce((acc, b) => {
      const m = b.id.match(/BK-(\d+)/);
      return m ? Math.max(acc, parseInt(m[1], 10)) : acc;
    }, 0);
    return `BK-${String(maxNum + 1).padStart(3, '0')}`;
  }, [books]);

  const totalTitles = books.length;
  const totalCopies = useMemo(
    () => books.reduce((sum, b) => sum + b.totalStock, 0),
    [books]
  );
  const totalAvailable = useMemo(
    () => books.reduce((sum, b) => sum + b.availableStock, 0),
    [books]
  );
  const totalBorrowed = Math.max(0, totalCopies - totalAvailable);
  const criticalOrEmptyBooks = useMemo(
    () => books.filter((b) => b.availableStock <= 1),
    [books]
  );
  const outOfStockCount = useMemo(
    () => books.filter((b) => b.availableStock === 0).length,
    [books]
  );
  const availableCount = useMemo(
    () => books.filter((b) => b.availableStock > 0).length,
    [books]
  );

  const filteredBooks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = books.filter((b) => {
      if (statusTab === 'available' && b.availableStock <= 0) return false;
      if (statusTab === 'outofstock' && b.availableStock > 0) return false;
      if (categoryFilter !== 'all' && b.category !== categoryFilter) return false;
      if (q) {
        return (
          b.id.toLowerCase().includes(q) ||
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.isbn.toLowerCase().includes(q)
        );
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      if (sortBy === 'id-asc') return a.id.localeCompare(b.id);
      if (sortBy === 'newest') return b.year - a.year;
      if (sortBy === 'stock-desc') return b.availableStock - a.availableStock;
      if (sortBy === 'stock-asc') return a.availableStock - b.availableStock;
      return a.title.localeCompare(b.title);
    });

    return list;
  }, [books, searchQuery, categoryFilter, sortBy, statusTab]);

  const totalPages = Math.max(1, Math.ceil(filteredBooks.length / pageSize));
  const paginatedBooks = filteredBooks.slice((page - 1) * pageSize, page * pageSize);

  const handleToggleSelectAll = () => {
    if (selectedIds.length === paginatedBooks.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedBooks.map((b) => b.id));
    }
  };

  const handleToggleRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleExportCSV = () => {
    const exportRows = (selectedIds.length > 0
      ? books.filter((b) => selectedIds.includes(b.id))
      : filteredBooks
    ).map((b) => [
      b.id,
      b.isbn,
      b.title,
      b.author,
      b.category,
      b.rackLocation,
      b.totalStock,
      b.availableStock,
      b.availableStock > 0 ? 'Tersedia' : 'Stok Habis',
    ]);

    downloadCSV(
      'katalog_perpustakaan_smk_muh_pakem.csv',
      ['ID Buku', 'ISBN', 'Judul', 'Penulis', 'Kategori', 'Rak', 'Total', 'Tersedia', 'Status'],
      exportRows
    );
    showToast(`Berhasil mengekspor ${exportRows.length} data koleksi ke CSV.`);
  };

  const handleCreateBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formAuthor.trim()) return;
    const stock = Math.max(1, parseInt(formTotalStock, 10) || 1);
    addBook({
      isbn: formIsbn.trim() || '978-602-0000-00-0',
      title: formTitle.trim(),
      author: formAuthor.trim(),
      publisher: formPublisher.trim() || 'Penerbit Sekolah',
      year: parseInt(formYear, 10) || getCurrentYear(),
      category: formCategory,
      rackLocation: formRack.trim() || 'Rak Umum',
      ddcCode: formDdc.trim() || '000',
      totalStock: stock,
      availableStock: stock,
      coverUrl: '',
    });
    setFormIsbn('');
    setFormTitle('');
    setFormAuthor('');
    setFormPublisher('');
    setAddModalOpen(false);
  };

  const handleSaveEditBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBook) return;
    updateBook({
      ...editingBook,
      availableStock: Math.min(editingBook.availableStock, editingBook.totalStock),
    });
    setEditingBook(null);
  };

  return (
    <div className="flex flex-col w-full pb-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-on-surface-variant text-[12px]">
            <span>Katalog Sistem</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-primary font-semibold">Inventaris Koleksi Fisik</span>
          </div>
          <h1 className="font-display text-2xl sm:text-[28px] font-bold text-primary tracking-tight mt-1">
            Katalog &amp; Inventaris Koleksi Buku
          </h1>
          <p className="text-[14px] text-on-surface-variant mt-0.5">
            Kelola data koleksi buku perpustakaan, pantau stok real-time, dan perbarui data pustaka.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container-lowest text-on-surface text-[13px] font-medium shadow-xs border border-outline-variant/25 hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-base text-on-surface-variant">
              file_download
            </span>
            <span>Export CSV{selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}</span>
          </button>
          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary text-[13px] font-semibold shadow-sm hover:bg-primary-container transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">add_circle</span>
            <span>Tambah Buku Baru</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-2">
        <div className="bg-surface-container-lowest p-5 rounded-xl shadow-xs border border-outline-variant/20">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                Total Judul Koleksi
              </span>
              <div className="font-display text-3xl font-bold text-on-surface mt-1 tabular-nums">
                {totalTitles}
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-xl">auto_stories</span>
            </div>
          </div>
          <p className="text-[12px] text-tertiary-container font-medium mt-3">
            Terindeks dengan klasifikasi DDC
          </p>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-xl shadow-xs border border-outline-variant/20">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                Total Eksemplar Fisik
              </span>
              <div className="font-display text-3xl font-bold text-on-surface mt-1 tabular-nums">
                {totalCopies}
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-xl">shelves</span>
            </div>
          </div>
          <p className="text-[12px] text-on-surface-variant mt-3 tabular-nums">
            {totalAvailable} unit tersedia di rak
          </p>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-xl shadow-xs border border-outline-variant/20">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                Buku Sedang Dipinjam
              </span>
              <div className="font-display text-3xl font-bold text-secondary mt-1 tabular-nums">
                {totalBorrowed}
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed">
              <span className="material-symbols-outlined text-xl">
                sync_saved_locally
              </span>
            </div>
          </div>
          <p className="text-[12px] text-secondary font-medium mt-3 tabular-nums">
            {totalCopies > 0 ? Math.round((totalBorrowed / totalCopies) * 100) : 0}% sirkulasi aktif
          </p>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-xl shadow-xs border border-outline-variant/20">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                Stok Habis / Kritis
              </span>
              <div className="font-display text-3xl font-bold text-error mt-1 tabular-nums">
                {criticalOrEmptyBooks.length}
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-error-container flex items-center justify-center text-on-error-container">
              <span className="material-symbols-outlined text-xl">warning</span>
            </div>
          </div>
          <p className="text-[12px] text-error font-semibold mt-3">
            {outOfStockCount} judul habis (0 stok)
          </p>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-surface-container-lowest rounded-xl p-4 shadow-xs border border-outline-variant/20 mt-4 flex flex-col gap-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Cari buku berdasarkan ID Buku (misal: BK-001), Judul, ISBN, atau Penulis..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-[13px] placeholder:text-outline focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/30 focus:outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
            >
              <option value="all">Semua Kategori</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
            >
              <option value="id-asc">Urutkan: ID (Asc)</option>
              <option value="newest">Urutkan: Tahun Terbaru</option>
              <option value="stock-desc">Urutkan: Stok Terbanyak</option>
              <option value="stock-asc">Urutkan: Stok Terkritis</option>
              <option value="title-asc">Urutkan: Judul (A - Z)</option>
            </select>

            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('all');
                setSortBy('id-asc');
                setStatusTab('all');
                setPage(1);
              }}
              className="p-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
              title="Reset filter"
            >
              <span className="material-symbols-outlined text-lg">filter_alt_off</span>
            </button>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center justify-between border-t border-surface-container pt-3 flex-wrap gap-2">
          <div className="flex items-center gap-1.5" role="tablist">
            <button
              type="button"
              onClick={() => {
                setStatusTab('all');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-[12.5px] font-semibold transition-colors cursor-pointer ${
                statusTab === 'all'
                  ? 'bg-primary-container text-on-primary shadow-xs'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              Semua Koleksi <span className="ml-1 font-mono opacity-80">{books.length}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusTab('available');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-[12.5px] font-semibold transition-colors cursor-pointer ${
                statusTab === 'available'
                  ? 'bg-primary-container text-on-primary shadow-xs'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              Tersedia (&gt;0){' '}
              <span className="ml-1 font-mono text-tertiary-container">{availableCount}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusTab('outofstock');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-[12.5px] font-semibold transition-colors cursor-pointer ${
                statusTab === 'outofstock'
                  ? 'bg-error text-on-error shadow-xs'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              Stok Habis (0){' '}
              <span
                className={`ml-1 font-mono ${
                  statusTab === 'outofstock' ? 'text-on-error' : 'text-error'
                }`}
              >
                {outOfStockCount}
              </span>
            </button>
          </div>
          <span className="text-[12px] text-on-surface-variant">
            Standar Katalogisasi DDC &amp; ISBN
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/20 mt-4 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant text-[11px] font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={
                      paginatedBooks.length > 0 &&
                      selectedIds.length === paginatedBooks.length
                    }
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 rounded accent-primary cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-4">ID Buku</th>
                <th className="py-3.5 px-4 min-w-[260px]">Buku &amp; Metadata</th>
                <th className="py-3.5 px-4">Kategori &amp; Rak</th>
                <th className="py-3.5 px-4 text-center">Total Fisik</th>
                <th className="py-3.5 px-4 min-w-[160px]">Ketersediaan Stok</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi Pustaka</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container text-[13.5px]">
              {paginatedBooks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-on-surface-variant">
                    Tidak ada koleksi buku yang cocok dengan kata kunci pencarian.
                  </td>
                </tr>
              ) : (
                paginatedBooks.map((book) => {
                  const isOut = book.availableStock === 0;
                  const isLow = book.availableStock === 1;
                  const borrowed = Math.max(0, book.totalStock - book.availableStock);
                  const pct =
                    book.totalStock > 0
                      ? Math.round((book.availableStock / book.totalStock) * 100)
                      : 0;

                  return (
                    <tr
                      key={book.id}
                      className={`transition-colors group ${
                        isOut
                          ? 'bg-error-container/10 hover:bg-error-container/20'
                          : 'hover:bg-surface-container-low/70'
                      }`}
                    >
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(book.id)}
                          onChange={() => handleToggleRow(book.id)}
                          className="w-4 h-4 rounded accent-primary cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded font-mono text-[12px] font-semibold ${
                            isOut
                              ? 'bg-error-container text-error'
                              : 'bg-surface-container text-primary'
                          }`}
                        >
                          {book.id}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-14 rounded overflow-hidden shadow-xs flex-shrink-0 bg-surface-container">
                            <SafeImage
                              src={book.coverUrl}
                              alt={book.title}
                              className={`w-full h-full object-cover ${
                                isOut ? 'opacity-80 grayscale' : ''
                              }`}
                            />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-on-surface group-hover:text-primary transition-colors truncate max-w-[260px]">
                              {book.title}
                            </span>
                            <span className="text-[12px] text-on-surface-variant truncate">
                              {book.author}
                            </span>
                            <span className="text-[11px] text-outline">
                              {book.publisher} · {book.year} · ISBN {book.isbn}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-[13px] font-medium text-on-surface">
                            {book.category}
                          </span>
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] text-on-surface-variant">
                            <span className="material-symbols-outlined text-xs text-outline">
                              location_on
                            </span>
                            {book.rackLocation}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-semibold tabular-nums">
                        {book.totalStock} Eks
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between text-[11.5px] tabular-nums">
                            <span
                              className={`font-semibold ${
                                isOut
                                  ? 'text-error'
                                  : isLow
                                  ? 'text-secondary'
                                  : 'text-tertiary-container'
                              }`}
                            >
                              {book.availableStock} Tersedia
                            </span>
                            <span className="text-outline">{borrowed} Dipinjam</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isOut
                                  ? 'bg-error'
                                  : isLow
                                  ? 'bg-secondary-container'
                                  : 'bg-tertiary-container'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                            isOut
                              ? 'bg-error-container text-error'
                              : isLow
                              ? 'bg-secondary-fixed text-on-secondary-fixed'
                              : 'bg-tertiary-fixed text-tertiary-container'
                          }`}
                        >
                          {isOut
                            ? 'Stok Habis'
                            : isLow
                            ? 'Sisa 1 (Kritis)'
                            : 'Tersedia'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            disabled={isOut}
                            onClick={() => startQuickLoan({ bookId: book.id })}
                            className={`px-2.5 py-1.5 text-[12px] font-semibold rounded flex items-center gap-1 transition-colors ${
                              isOut
                                ? 'bg-surface-container text-outline cursor-not-allowed opacity-70'
                                : 'bg-primary text-on-primary hover:bg-primary-container shadow-xs cursor-pointer'
                            }`}
                            title={isOut ? 'Stok habis (0 unit)' : 'Pinjam Cepat'}
                          >
                            <span className="material-symbols-outlined text-sm">
                              {isOut ? 'block' : 'bookmark_add'}
                            </span>
                            <span>Pinjam</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingBook(book)}
                            className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded transition-colors cursor-pointer"
                            title="Edit Data Buku"
                          >
                            <span className="material-symbols-outlined text-base">edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setHistoryBook(book)}
                            className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded transition-colors cursor-pointer"
                            title="Detail & Riwayat Sirkulasi"
                          >
                            <span className="material-symbols-outlined text-base">
                              history
                            </span>
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
        <div className="p-4 bg-surface-container-low/50 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-surface-container">
          <div className="flex items-center gap-2 text-on-surface-variant text-[12px] tabular-nums">
            <span>
              Menampilkan <strong>{paginatedBooks.length}</strong> dari{' '}
              <strong>{filteredBooks.length}</strong> koleksi buku
            </span>
            <span>·</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="bg-surface-container-lowest text-on-surface text-[12px] py-1 px-2 rounded focus:outline-none"
            >
              <option value={7}>7 per halaman</option>
              <option value={15}>15 per halaman</option>
              <option value={30}>30 per halaman</option>
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg text-on-surface-variant bg-surface-container-lowest disabled:opacity-40 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">chevron_left</span>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-[12px] font-bold cursor-pointer ${
                  page === p
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container-lowest hover:bg-surface-container text-on-surface'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg text-on-surface-variant bg-surface-container-lowest disabled:opacity-40 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Tambah Buku Baru */}
      {addModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/50 backdrop-blur-sm p-4"
          onClick={() => setAddModalOpen(false)}
        >
          <div
            className="bg-surface-container-lowest rounded-xl max-w-2xl w-full p-6 shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-3 border-b border-surface-container">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">library_add</span>
                </div>
                <div>
                  <h2 className="font-display text-[17px] font-bold text-on-surface">
                    Tambah Buku Baru ke Katalog
                  </h2>
                  <p className="text-[12px] text-on-surface-variant">
                    Lengkapi metadata buku dan alokasikan stok inventaris fisik.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form
              id="add-book-form"
              onSubmit={handleCreateBook}
              className="overflow-y-auto py-4 space-y-4 flex-1"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold mb-1">
                    ID Buku (Otomatis)
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={nextAutoId}
                    className="w-full px-3 py-2 bg-surface-container-low text-primary font-mono text-[13px] font-bold rounded-lg cursor-not-allowed"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[12px] font-semibold mb-1">Nomor ISBN</label>
                  <input
                    type="text"
                    value={formIsbn}
                    onChange={(e) => setFormIsbn(e.target.value)}
                    placeholder="misal: 978-602-03-8822-1"
                    className="w-full px-3 py-2 bg-surface-container-lowest rounded-lg border border-outline-variant/40 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold mb-1">
                  Judul Buku Lengkap <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Masukkan judul buku beserta sub-judul bila ada..."
                  className="w-full px-3 py-2 bg-surface-container-lowest rounded-lg border border-outline-variant/40 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold mb-1">
                    Penulis / Pengarang <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formAuthor}
                    onChange={(e) => setFormAuthor(e.target.value)}
                    placeholder="Nama penulis / editor"
                    className="w-full px-3 py-2 bg-surface-container-lowest rounded-lg border border-outline-variant/40 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold mb-1">
                    Kategori Buku <span className="text-error">*</span>
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as BookCategory)}
                    className="w-full px-3 py-2 bg-surface-container-lowest rounded-lg border border-outline-variant/40 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[12px] font-semibold mb-1">
                    Penerbit &amp; Tahun Terbit
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={formPublisher}
                      onChange={(e) => setFormPublisher(e.target.value)}
                      placeholder="Nama Penerbit"
                      className="col-span-2 px-3 py-2 bg-surface-container-lowest rounded-lg border border-outline-variant/40 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <input
                      type="number"
                      value={formYear}
                      onChange={(e) => setFormYear(e.target.value)}
                      className="px-3 py-2 bg-surface-container-lowest rounded-lg border border-outline-variant/40 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold mb-1">
                    Stok Fisik Awal <span className="text-error">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formTotalStock}
                    onChange={(e) => setFormTotalStock(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-lowest rounded-lg border border-outline-variant/40 text-[13px] font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold mb-1">
                  Lokasi Rak &amp; Kode DDC
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={formRack}
                    onChange={(e) => setFormRack(e.target.value)}
                    placeholder="misal: Rak T-05 (Lantai 2)"
                    className="px-3 py-2 bg-surface-container-lowest rounded-lg border border-outline-variant/40 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <input
                    type="text"
                    value={formDdc}
                    onChange={(e) => setFormDdc(e.target.value)}
                    placeholder="Dewey Decimal (misal: 005.133)"
                    className="px-3 py-2 bg-surface-container-lowest rounded-lg border border-outline-variant/40 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
            </form>

            <div className="pt-3 border-t border-surface-container flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-[13px] font-medium cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                form="add-book-form"
                className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-[13px] font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">check</span>
                <span>Simpan ke Katalog</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Book */}
      {editingBook && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/50 backdrop-blur-sm p-4"
          onClick={() => setEditingBook(null)}
        >
          <div
            className="bg-surface-container-lowest rounded-xl max-w-lg w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-surface-container">
              <h3 className="font-display text-[17px] font-bold text-on-surface">
                Ubah Data Buku · {editingBook.id}
              </h3>
              <button
                type="button"
                onClick={() => setEditingBook(null)}
                className="p-1 rounded-lg hover:bg-surface-container"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSaveEditBook} className="space-y-3 py-4">
              <div>
                <label className="block text-[12px] font-semibold mb-1">Judul Buku</label>
                <input
                  type="text"
                  required
                  value={editingBook.title}
                  onChange={(e) =>
                    setEditingBook({ ...editingBook, title: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 text-[13px]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold mb-1">Penulis</label>
                <input
                  type="text"
                  required
                  value={editingBook.author}
                  onChange={(e) =>
                    setEditingBook({ ...editingBook, author: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 text-[13px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold mb-1">
                    Total Eksemplar Fisik
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editingBook.totalStock}
                    onChange={(e) => {
                      const nextTotal = Math.max(1, parseInt(e.target.value, 10) || 1);
                      setEditingBook({
                        ...editingBook,
                        totalStock: nextTotal,
                        availableStock: Math.min(editingBook.availableStock, nextTotal),
                      });
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold mb-1">
                    Stok Tersedia
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={editingBook.totalStock}
                    value={editingBook.availableStock}
                    onChange={(e) =>
                      setEditingBook({
                        ...editingBook,
                        availableStock: Math.max(
                          0,
                          Math.min(
                            editingBook.totalStock,
                            parseInt(e.target.value, 10) || 0
                          )
                        ),
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 text-[13px]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-semibold mb-1">Lokasi Rak</label>
                <input
                  type="text"
                  value={editingBook.rackLocation}
                  onChange={(e) =>
                    setEditingBook({ ...editingBook, rackLocation: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 text-[13px]"
                />
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingBook(null)}
                  className="px-4 py-2 rounded-lg bg-surface-container text-[13px] font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-primary text-on-primary text-[13px] font-semibold cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Book History / Log */}
      {historyBook && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/50 backdrop-blur-sm p-4"
          onClick={() => setHistoryBook(null)}
        >
          <div
            className="bg-surface-container-lowest rounded-xl max-w-lg w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-3 border-b border-surface-container">
              <div>
                <span className="font-mono text-[11px] font-bold text-primary">
                  {historyBook.id} · {historyBook.ddcCode}
                </span>
                <h3 className="font-display text-[17px] font-bold text-on-surface">
                  {historyBook.title}
                </h3>
                <p className="text-[12px] text-on-surface-variant">
                  {historyBook.author} · {historyBook.rackLocation}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHistoryBook(null)}
                className="p-1 rounded-lg hover:bg-surface-container"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="py-4 max-h-72 overflow-y-auto space-y-2">
              {transactions.filter((t) => t.bookId === historyBook.id).length === 0 ? (
                <p className="text-[13px] text-on-surface-variant text-center py-4">
                  Belum ada riwayat sirkulasi tercatat untuk buku ini.
                </p>
              ) : (
                transactions
                  .filter((t) => t.bookId === historyBook.id)
                  .map((tx) => {
                    const m = members.find((mem) => mem.id === tx.memberId);
                    return (
                      <div
                        key={tx.id}
                        className="p-3 rounded-lg bg-surface-container-low flex items-center justify-between text-[12.5px]"
                      >
                        <div>
                          <div className="font-semibold text-on-surface">
                            {m?.name ?? tx.memberId}{' '}
                            <span className="font-mono text-[11px] text-primary">
                              ({tx.id})
                            </span>
                          </div>
                          <div className="text-[11px] text-on-surface-variant">
                            Pinjam: {formatDateShortID(tx.borrowDate)} · Tenggat:{' '}
                            {formatDateShortID(tx.dueDate)}
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            tx.status === 'DIKEMBALIKAN'
                              ? 'bg-tertiary-fixed text-tertiary-container'
                              : tx.status === 'TERLAMBAT'
                              ? 'bg-error-container text-error'
                              : 'bg-primary-fixed text-primary'
                          }`}
                        >
                          {tx.status === 'DIKEMBALIKAN' ? 'Dikembalikan' : 'Aktif'}
                        </span>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
