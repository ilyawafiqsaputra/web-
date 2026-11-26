import React, { useState } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { formatDateFullWithDayID } from '../../utils/formatters';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, resetDemoData } = useLibrary();

  const [maxLoans, setMaxLoans] = useState(String(settings.maxLoansPerMember));
  const [defaultDays, setDefaultDays] = useState(String(settings.defaultLoanDays));
  const [fineRate, setFineRate] = useState(String(settings.dailyFineRate));
  const [serviceHours, setServiceHours] = useState(settings.serviceHours);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      ...settings,
      maxLoansPerMember: Math.max(1, parseInt(maxLoans, 10) || 3),
      defaultLoanDays: Math.max(1, parseInt(defaultDays, 10) || 7),
      dailyFineRate: Math.max(0, parseInt(fineRate, 10) || 1000),
      serviceHours: serviceHours.trim() || '08.00 - 16.00 WIB',
    });
  };

  return (
    <div className="flex flex-col w-full max-w-3xl pb-8 gap-6">
      <div>
        <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-semibold">
          Konfigurasi Perpustakaan
        </span>
        <h1 className="font-display text-2xl sm:text-[28px] font-bold text-on-surface tracking-tight mt-0.5">
          Pengaturan Sistem Sirkulasi
        </h1>
        <p className="text-[14px] text-on-surface-variant mt-0.5">
          Atur batas maksimal peminjaman per anggota, durasi pinjam standar, dan tarif denda keterlambatan.
        </p>
      </div>

      <form
        onSubmit={handleSave}
        className="bg-surface-container-lowest rounded-xl p-6 shadow-xs border border-outline-variant/20 space-y-5"
      >
        <div className="p-3 rounded-lg bg-surface-container-low flex items-center justify-between text-[13px]">
          <span className="text-on-surface-variant font-medium">
            Tanggal Sistem Aktif (Sinkron Otomatis)
          </span>
          <span className="font-semibold text-primary">
            {formatDateFullWithDayID(settings.currentDate)}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[12px] font-semibold text-on-surface mb-1">
              Batas Maks. Pinjam (Buku)
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={maxLoans}
              onChange={(e) => setMaxLoans(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-[13.5px] font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-on-surface mb-1">
              Durasi Standar (Hari)
            </label>
            <input
              type="number"
              min="1"
              max="30"
              value={defaultDays}
              onChange={(e) => setDefaultDays(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-[13.5px] font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-on-surface mb-1">
              Denda per Hari (Rp)
            </label>
            <input
              type="number"
              min="0"
              step="500"
              value={fineRate}
              onChange={(e) => setFineRate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-[13.5px] font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        <div>
          <label className="block text-[12px] font-semibold text-on-surface mb-1">
            Jam Operasional Layanan
          </label>
          <input
            type="text"
            value={serviceHours}
            onChange={(e) => setServiceHours(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-[13.5px] focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="pt-3 border-t border-surface-container flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={resetDemoData}
            className="px-4 py-2 rounded-lg bg-error-container/50 text-error text-[13px] font-semibold hover:bg-error-container transition-colors cursor-pointer"
          >
            Reset Semua Data Demo
          </button>

          <button
            type="submit"
            className="px-5 py-2 rounded-lg bg-primary text-on-primary text-[13px] font-semibold hover:bg-primary-container transition-colors shadow-xs cursor-pointer"
          >
            Simpan Pengaturan
          </button>
        </div>
      </form>
    </div>
  );
};
