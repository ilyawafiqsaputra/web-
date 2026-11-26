export type BookCategory =
  | 'Sastra & Fiksi'
  | 'Teknologi & Komputer'
  | 'Sains & Pengetahuan'
  | 'Sejarah & Budaya'
  | 'Pengembangan Diri'
  | 'Bisnis & Self-Help';

export interface Buku {
  id: string;
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  year: number;
  category: BookCategory;
  rackLocation: string;
  ddcCode: string;
  totalStock: number;
  availableStock: number;
  coverUrl: string;
  isPopular?: boolean;
}

export type MemberRole = 'Siswa Reguler' | 'Pengajar' | 'Peneliti Tamu' | 'Mahasiswa';

export interface Anggota {
  id: string;
  name: string;
  nisNisn: string;
  classOrUnit: string;
  majorOrFaculty: string;
  role: MemberRole;
  email: string;
  phone: string;
  joinedDate: string;
  validUntil: string;
  avatarUrl: string;
  onTimeRate: number;
  status: 'AKTIF' | 'DIBLOKIR';
  blockReason?: string;
  blockNote?: string;
  blockedAt?: string;
  qrTokenHash: string;
  lastGateTap: string;
}

export type LoanStatus = 'AKTIF' | 'TENGGAT_HARI_INI' | 'TERLAMBAT' | 'DIKEMBALIKAN';

export interface Peminjaman {
  id: string;
  refBarcode: string;
  memberId: string;
  bookId: string;
  borrowDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  returnDate?: string; // YYYY-MM-DD
  returnTime?: string; // HH:mm WIB
  librarian: string;
  notes?: string;
  status: LoanStatus;
  lateDays: number;
  fineAmount: number;
  finePaid: boolean;
  receiptNo?: string;
  academicYear: string;
  extendedCount?: number;
}

export interface LibrarySettings {
  libraryName: string;
  schoolName: string;
  address: string;
  phone: string;
  email: string;
  serviceHours: string;
  maxLoansPerMember: number;
  defaultLoanDays: number;
  dailyFineRate: number;
  currentDate: string; // Dynamic current library date (YYYY-MM-DD)
}

export type ActiveView =
  | 'dashboard-ringkasan'
  | 'katalog-inventaris-buku'
  | 'sirkulasi-transaksi'
  | 'daftar-anggota'
  | 'detail-anggota'
  | 'kartu-digital'
  | 'cetak-struk'
  | 'pengaturan-sistem';
