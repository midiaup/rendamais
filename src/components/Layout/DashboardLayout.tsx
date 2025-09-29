'use client';

import { useEffect, useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useProfileStore } from '@/stores/profileStore';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user } = useAuth();
  const { fetchProfile, profile, loading } = useProfileStore();

  useEffect(() => {
    if (user?.id) {
      fetchProfile(user.id);
    }
  }, [user?.id, fetchProfile]);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  return (
    <div className="flex h-screen bg-gray-900">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header toggleSidebar={toggleSidebar} profileLoading={loading} profile={profile} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-900 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
