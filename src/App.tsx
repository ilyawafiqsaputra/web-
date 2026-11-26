/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppShell } from './components/AppShell';
import { CatalogView } from './components/views/CatalogView';
import { CirculationView } from './components/views/CirculationView';
import { DashboardView } from './components/views/DashboardView';
import { DigitalCardView } from './components/views/DigitalCardView';
import { MemberDetailView } from './components/views/MemberDetailView';
import { MembersDirectoryView } from './components/views/MembersDirectoryView';
import { ReturnReceiptView } from './components/views/ReturnReceiptView';
import { SettingsView } from './components/views/SettingsView';
import { LibraryProvider, useLibrary } from './context/LibraryContext';

const ActiveViewRenderer: React.FC = () => {
  const { activeView } = useLibrary();

  switch (activeView) {
    case 'dashboard-ringkasan':
      return <DashboardView />;
    case 'katalog-inventaris-buku':
      return <CatalogView />;
    case 'sirkulasi-transaksi':
      return <CirculationView />;
    case 'daftar-anggota':
      return <MembersDirectoryView />;
    case 'detail-anggota':
      return <MemberDetailView />;
    case 'kartu-digital':
      return <DigitalCardView />;
    case 'cetak-struk':
      return <ReturnReceiptView />;
    case 'pengaturan-sistem':
      return <SettingsView />;
    default:
      return <CirculationView />;
  }
};

export default function App() {
  return (
    <LibraryProvider>
      <AppShell>
        <ActiveViewRenderer />
      </AppShell>
    </LibraryProvider>
  );
}
