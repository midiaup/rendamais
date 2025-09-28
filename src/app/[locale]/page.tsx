// src/app/[locale]/page.tsx

import { useTranslations } from 'next-intl';
import Link from 'next/link';

// Gera os parâmetros estáticos para os locales suportados
export function generateStaticParams() {
  return [
    { locale: 'pt' },
    { locale: 'en' },
    { locale: 'es' }
  ];
}

export default function Home() {
  const t = useTranslations('HomePage');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t.rich('welcome', {
              blue: (chunks) => <span className="text-blue-600">{chunks}</span>
            })}
          </h1>
          <p className="text-gray-600">
            {t('subtitle')}
          </p>
        </div>
        
        <div className="space-y-4">
          <Link 
            href="/pt/login"
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors block text-center"
          >
            {t('login.title')}
          </Link>
          
          <Link 
            href="/pt/register"
            className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors block text-center"
          >
            {t('register.title')}
          </Link>
        </div>
        
        <div className="mt-8 text-center text-sm text-gray-500">
          <p dangerouslySetInnerHTML={{ __html: t('footer') }} />
        </div>
      </div>
    </div>
  );
}
