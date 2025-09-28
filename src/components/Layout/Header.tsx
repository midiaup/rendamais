'use client';

import { useProfileStore } from "@/stores/profileStore";
// CORREÇÃO: Importando da configuração de navegação local
import { Link, usePathname, useRouter } from '@/lib/navigation';
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  Bars3Icon,
  BellIcon,
  PaperAirplaneIcon,
  LanguageIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

export default function Header({ toggleSidebar }: { toggleSidebar: () => void }) {
  const { profile } = useProfileStore();
  const t = useTranslations('Header');
  const username = profile?.username || t('loading');
  const referralLink = `https://comunidaderm.com/ref/${username}`;
  const [isLangDropdownOpen, setLangDropdownOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      alert(t('copySuccess'));
    });
  };

  const switchLocale = (nextLocale: string) => {
    // Preserva a rota atual ao trocar de idioma
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <header className="bg-gray-800 text-white p-4 shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button onClick={toggleSidebar} className="mr-4 text-gray-300 hover:text-white">
            <Bars3Icon className="h-6 w-6" />
          </button>
          
          <h1 className="text-xl font-bold text-green-400 hidden md:block">{t('title')}</h1>
        </div>

        <div className="flex items-center space-x-5">
          <Link href="/dashboard/notifications" className="text-gray-300 hover:text-white"><BellIcon className="h-6 w-6" /></Link>
          <a href="https://t.me/rendamais_oficial" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white"><PaperAirplaneIcon className="h-6 w-6" /></a>
          
          <div className="relative">
            <button onClick={() => setLangDropdownOpen(!isLangDropdownOpen)} className="text-gray-300 hover:text-white">
              <LanguageIcon className="h-6 w-6" />
            </button>
            {isLangDropdownOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-gray-700 rounded-md shadow-lg z-20">
                <button onClick={() => switchLocale('pt')} className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-green-500">{t('languages.pt')}</button>
                <button onClick={() => switchLocale('en')} className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-green-500">{t('languages.en')}</button>
                <button onClick={() => switchLocale('es')} className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-green-500">{t('languages.es')}</button>
              </div>
            )}
          </div>

          <Link href="/dashboard/settings" className="text-gray-300 hover:text-white"><UserCircleIcon className="h-6 w-6" /></Link>
        </div>
      </div>

      <div className="mt-4 bg-gray-700 p-2 rounded-lg flex flex-col md:flex-row items-center justify-center text-center">
        <span className="text-sm md:text-base mb-2 md:mb-0 md:mr-4">{t('referralLink')}:</span>
        <div className="bg-gray-900 px-3 py-1 rounded-md flex items-center">
          <span className="text-green-400 font-mono text-xs md:text-sm truncate">{referralLink}</span>
          <button onClick={copyToClipboard} className="ml-3 text-gray-400 hover:text-white text-xs">{t('copy')}</button>
        </div>
      </div>
    </header>
  );
}