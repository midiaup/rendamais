'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Bars3Icon, PaperAirplaneIcon, LanguageIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { Link, usePathname, useRouter } from '@/lib/navigation';
import type { Profile } from '@/stores/profileStore';
import Notifications from './Notifications';

type HeaderProps = {
  toggleSidebar: () => void;
  profileLoading: boolean;
  profile: Profile | null;
};

export default function Header({ toggleSidebar, profileLoading, profile }: HeaderProps) {
  const t = useTranslations('Header');
  const referralUsername = profile?.username || t('loading');
  const referralLink = `https://comunidaderm.com/ref/${referralUsername}`;
  const [isLangDropdownOpen, setLangDropdownOpen] = useState(false);
  const [isProfileOpen, setProfileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      alert(t('copySuccess'));
    });
  };

  const switchLocale = (nextLocale: string) => {
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <header className="bg-gray-800 text-white p-4 shadow-md">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={toggleSidebar} className="mr-4 text-gray-300 hover:text-white">
              <Bars3Icon className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-bold text-green-400 hidden md:block">{t('title')}</h1>
          </div>

          <div className="flex items-center space-x-5">
            <Notifications />
            <a
              href="https://t.me/rendamais_oficial"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-white"
            >
              <PaperAirplaneIcon className="h-6 w-6" />
            </a>

            <div className="relative">
              <button onClick={() => setLangDropdownOpen((prev) => !prev)} className="text-gray-300 hover:text-white">
                <LanguageIcon className="h-6 w-6" />
              </button>
              {isLangDropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-gray-700 rounded-md shadow-lg z-20">
                  <button
                    onClick={() => switchLocale('pt')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-green-500"
                  >
                    {t('languages.pt')}
                  </button>
                  <button
                    onClick={() => switchLocale('en')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-green-500"
                  >
                    {t('languages.en')}
                  </button>
                  <button
                    onClick={() => switchLocale('es')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-green-500"
                  >
                    {t('languages.es')}
                  </button>
                </div>
              )}
            </div>

            <div className="relative">
              <button onClick={() => setProfileOpen((prev) => !prev)} className="flex items-center space-x-2">
                <UserCircleIcon className="h-8 w-8 text-gray-300" />
                <span className="hidden sm:block text-sm font-medium text-gray-200">
                  {profileLoading ? t('loading') : profile?.name || profile?.username || t('loading')}
                </span>
              </button>
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-gray-700 rounded-md shadow-lg z-20 p-4 space-y-2">
                  {profileLoading ? (
                    <p className="text-sm text-gray-400">{t('loading')}</p>
                  ) : profile ? (
                    <div className="space-y-2 text-sm">
                      <p className="font-semibold text-white">{profile.name}</p>
                      <p className="text-gray-300">@{profile.username}</p>
                      <p className="text-gray-300">{profile.email}</p>
                      <p className="text-gray-300">{profile.whatsapp}</p>
                      <Link
                        href="/dashboard/settings"
                        className="block text-center bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-md mt-2"
                        onClick={() => setProfileOpen(false)}
                      >
                        {t('goToSettings')}
                      </Link>
                    </div>
                  ) : (
                    <p className="text-sm text-red-400">{t('profileError', { error: 'Not found' })}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-gray-700 p-3 rounded-lg flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex flex-col md:flex-row md:items-center md:gap-3">
            <span className="text-sm md:text-base">{t('referralLink')}:</span>
            <div className="bg-gray-900 px-3 py-1 rounded-md flex items-center gap-3">
              <span className="text-green-400 font-mono text-xs md:text-sm truncate">{referralLink}</span>
              <button onClick={copyToClipboard} className="text-gray-400 hover:text-white text-xs">
                {t('copy')}
              </button>
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:gap-3 text-xs md:text-sm text-gray-200">
            <span>{t('walletPrompt')}</span>
            <Link
              href="/dashboard/settings"
              className="inline-flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-md"
            >
              {t('walletButton')}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
