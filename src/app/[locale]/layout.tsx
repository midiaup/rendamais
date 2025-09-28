// src/app/[locale]/layout.tsx

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { AuthProvider } from "@/components/Auth/AuthProvider";
import { NextIntlClientProvider } from 'next-intl';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RENDA MAIS",
  description: "Plataforma de doação entre amigos",
};

// Gera os parâmetros estáticos para os locales suportados
export function generateStaticParams() {
  return [
    { locale: 'pt' },
    { locale: 'en' },
    { locale: 'es' }
  ];
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  // CORREÇÃO: Aguardar params antes de usar suas propriedades (Next.js 15)
  const { locale } = await params;
  
  // Validar se o locale é suportado - usa 'pt' como fallback
  const supportedLocales = ['pt', 'en', 'es'];
  const validLocale = supportedLocales.includes(locale) ? locale : 'pt';
  
  // CORREÇÃO: Carregando as mensagens diretamente no Servidor
  let messages;
  try {
    // O caminho sobe dois níveis (de /app/[locale]) para encontrar a pasta /messages
    messages = (await import(`../../messages/${validLocale}.json`)).default;
  } catch (error) {
    console.error(`Erro ao carregar mensagens para locale ${validLocale}:`, error);
    // Fallback para português se houver erro
    messages = (await import(`../../messages/pt.json`)).default;
  }

  return (
    <NextIntlClientProvider locale={validLocale} messages={messages}>
      <AuthProvider>{children}</AuthProvider>
    </NextIntlClientProvider>
  );
}