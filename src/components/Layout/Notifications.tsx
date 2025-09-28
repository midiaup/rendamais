'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { BellIcon } from '@heroicons/react/24/outline';
import type { SupabaseClient } from '@supabase/supabase-js';
import { useTranslations } from 'next-intl';

type Notification = {
  id: string;
  created_at: string;
  message: string;
  read: boolean;
};

async function getNotifications(supabase: SupabaseClient): Promise<Notification[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }

  return data || [];
}

export default function Notifications() {
  const t = useTranslations('Notifications');
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const fetchNotifications = async () => {
      const notifs = await getNotifications(supabase);
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);
    };

    fetchNotifications();

    const channel = supabase
      .channel('realtime-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mounted]);

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);

    if (!error) {
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount(prev => prev > 0 ? prev - 1 : 0);
    }
  };

  if (!mounted) {
    return (
      <div className="relative">
        <div className="animate-pulse">
          <div className="h-6 w-6 bg-gray-600 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="relative text-gray-300 hover:text-white">
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-gray-700 rounded-md shadow-lg z-20 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-gray-600">
            <h3 className="text-lg font-semibold text-white">{t('title')}</h3>
          </div>
          {notifications.length > 0 ? (
            <ul>
              {notifications.map(notif => (
                <li
                  key={notif.id}
                  className={`p-4 border-b border-gray-600 ${!notif.read ? 'bg-gray-800' : ''}`}
                >
                  <p className="text-sm text-gray-300">{notif.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(notif.created_at).toLocaleString()}
                  </p>
                  {!notif.read && (
                    <button
                      onClick={() => markAsRead(notif.id)}
                      className="text-xs text-green-400 hover:text-green-300 mt-2"
                    >
                      {t('markAsRead')}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-4 text-sm text-gray-400">{t('noNotifications')}</p>
          )}
        </div>
      )}
    </div>
  );
}
