import React, { useMemo, useState } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { MemberRole } from '../../types/library';
import { formatDateShortID, getCurrentYear } from '../../utils/formatters';
import { SafeImage } from '../SafeImage';

export const MembersDirectoryView: React.FC = () => {
  const {
    members,
    settings,
    getMemberActiveLoans,
    openMemberDetail,
    openDigitalCard,
    startQuickLoan,
    addMember,
  } = useLibrary();

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'AKTIF' | 'DIBLOKIR'>('all');
  const [addModalOpen, setAddModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [nisNisn, setNisNisn] = useState('');
  const [classOrUnit, setClassOrUnit] = useState('XI RPL 2');
  const [majorOrFaculty, setMajorOrFaculty] = useState('Rekayasa Perangkat Lunak (RPL)');
  const [role, setRole] = useState<MemberRole>('Siswa Reguler');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((m) => {
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;
      if (q) {
        return (
          m.id.toLowerCase().includes(q) ||
          m.name.toLowerCase().includes(q) ||
          m.nisNisn.toLowerCase().includes(q) ||
          m.classOrUnit.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [members, query, statusFilter]);

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const currentYear = getCurrentYear();
    addMember({
      name: name.trim(),
      nisNisn: nisNisn.trim() || `${currentYear}-NEW`,
      classOrUnit: classOrUnit.trim(),
      majorOrFaculty: majorOrFaculty.trim(),
      role,
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@smkmuhpakem.sch.id`,
      phone: phone.trim() || '+62 812-0000-0000',
      joinedDate: formatDateShortID(settings.currentDate),
      validUntil: `30 Juni ${currentYear + 3}`,
      avatarUrl: '',
    });
    setName('');
    setNisNisn('');
    setEmail('');
    setPhone('');
    setAddModalOpen(false);
  };

  return (
    <div className="flex flex-col w-full pb-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-semibold">
            Direktori Keanggotaan
          </span>
          <h1 className="font-display text-2xl sm:text-[28px] font-bold text-on-surface tracking-tight mt-0.5">
            Daftar Anggota Perpustakaan
          </h1>
          <p className="text-[14px] text-on-surface-variant mt-0.5">
            Kelola profil anggota, pantau kuota peminjaman aktif, dan akses Kartu Digital SmartPass.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-on-primary text-[13px] font-semibold hover:bg-primary-container shadow-sm transition-colors cursor-pointer self-start lg:self-auto"
        >
          <span className="material-symbols-outlined text-base">person_add</span>
          <span>Daftarkan Anggota Baru</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-outline-variant/20 mb-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
            search
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari ID anggota (ANG-0842), nama, atau kelas..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-surface-container-low text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/25"
          />
        </div>

        <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-lg">
          {[
            { id: 'all', label: `Semua (${members.length})` },
            {
              id: 'AKTIF',
              label: `Aktif (${members.filter((m) => m.status === 'AKTIF').length})`,
            },
            {
              id: 'DIBLOKIR',
              label: `Diblokir (${members.filter((m) => m.status === 'DIBLOKIR').length})`,
            },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setStatusFilter(t.id as typeof statusFilter)}
              className={`px-3 py-1.5 rounded text-[12px] font-semibold cursor-pointer transition-colors ${
                statusFilter === t.id
                  ? 'bg-surface-container-lowest text-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((m) => {
          const activeLoans = getMemberActiveLoans(m.id);
          const isBlocked = m.status === 'DIBLOKIR';
          return (
            <div
              key={m.id}
              className="bg-surface-container-lowest rounded-xl p-5 shadow-xs border border-outline-variant/20 flex flex-col justify-between gap-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <SafeImage
                    src={m.avatarUrl}
                    alt={m.name}
                    className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                    fallbackType="avatar"
                    fallbackLabel={m.name}
                  />
                  <div className="min-w-0">
                    <h3 className="font-display text-[16px] font-bold text-on-surface truncate">
                      {m.name}
                    </h3>
                    <div className="font-mono text-[11.5px] text-primary font-semibold">
                      {m.id} · {m.classOrUnit}
                    </div>
                    <div className="text-[12px] text-on-surface-variant truncate">
                      {m.role} · {m.majorOrFaculty}
                    </div>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold flex-shrink-0 ${
                    isBlocked
                      ? 'bg-error-container text-error'
                      : 'bg-tertiary-fixed text-tertiary-container'
                  }`}
                >
                  {isBlocked ? 'DIBLOKIR' : 'AKTIF'}
                </span>
              </div>

              <div className="bg-surface-container-low rounded-lg p-3 flex items-center justify-between text-[12px]">
                <span className="text-on-surface-variant">Kuota Pinjaman Aktif</span>
                <span className="font-mono font-bold text-primary tabular-nums">
                  {activeLoans.length} / {settings.maxLoansPerMember} Buku
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => openMemberDetail(m.id)}
                  className="px-2.5 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface text-[12px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">history</span>
                  <span>Riwayat</span>
                </button>
                <button
                  type="button"
                  onClick={() => openDigitalCard(m.id)}
                  className="px-2.5 py-2 rounded-lg bg-surface-container-highest hover:bg-primary-fixed text-primary text-[12px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">badge</span>
                  <span>Kartu ID</span>
                </button>
                <button
                  type="button"
                  disabled={isBlocked}
                  onClick={() => startQuickLoan({ memberId: m.id })}
                  className={`px-2.5 py-2 rounded-lg text-[12px] font-semibold flex items-center justify-center gap-1 transition-colors ${
                    isBlocked
                      ? 'bg-surface-container text-outline cursor-not-allowed opacity-60'
                      : 'bg-primary text-on-primary hover:bg-primary-container cursor-pointer'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  <span>Pinjam</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Member Modal */}
      {addModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/50 backdrop-blur-sm p-4"
          onClick={() => setAddModalOpen(false)}
        >
          <div
            className="bg-surface-container-lowest rounded-xl max-w-lg w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-surface-container">
              <h3 className="font-display text-[17px] font-bold text-on-surface">
                Daftarkan Anggota Perpustakaan Baru
              </h3>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="p-1 rounded-lg hover:bg-surface-container"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleAddMember} className="space-y-3 py-4">
              <div>
                <label className="block text-[12px] font-semibold mb-1">
                  Nama Lengkap <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama siswa atau pengajar..."
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 text-[13px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold mb-1">NIS / NIP</label>
                  <input
                    type="text"
                    value={nisNisn}
                    onChange={(e) => setNisNisn(e.target.value)}
                    placeholder={`${getCurrentYear()}-0911`}
                    className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold mb-1">Peran</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as MemberRole)}
                    className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 text-[13px]"
                  >
                    <option value="Siswa Reguler">Siswa Reguler</option>
                    <option value="Pengajar">Pengajar</option>
                    <option value="Peneliti Tamu">Peneliti Tamu</option>
                    <option value="Mahasiswa">Mahasiswa</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold mb-1">
                    Kelas / Unit
                  </label>
                  <input
                    type="text"
                    value={classOrUnit}
                    onChange={(e) => setClassOrUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold mb-1">
                    Kompetensi / Jurusan
                  </label>
                  <input
                    type="text"
                    value={majorOrFaculty}
                    onChange={(e) => setMajorOrFaculty(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 text-[13px]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@smkmuhpakem.sch.id"
                    className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold mb-1">
                    WhatsApp
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+62 812-..."
                    className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 text-[13px]"
                  />
                </div>
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-surface-container text-[13px] font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-primary text-on-primary text-[13px] font-semibold cursor-pointer"
                >
                  Simpan Anggota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
