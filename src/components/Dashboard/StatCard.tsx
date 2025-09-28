// src/components/Dashboard/StatCard.tsx
'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';

// Tipos para as props do componente
type StatCardProps = {
  icon: React.ReactNode;
  title: string;
  isCurrency?: boolean; // Define se o card deve ter a funcionalidade de troca de moeda
  valueBRL?: number;
  valueUSD?: number;
  value?: React.ReactNode; // Para cards que não são de moeda (Nível, Ciclos)
  subtitle?: string; // Subtítulo opcional para exibir abaixo do valor
};

export default function StatCard({
  icon,
  title,
  isCurrency = false,
  valueBRL = 0,
  valueUSD = 0,
  value,
  subtitle,
}: StatCardProps) {
  const locale = useLocale();
  const [primaryCurrency, setPrimaryCurrency] = useState<'BRL' | 'USD'>('BRL');

  const formatCurrency = (value: number, currency: 'BRL' | 'USD') => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(value || 0);
  };

  const handleToggleCurrency = () => {
    if (!isCurrency) return;
    setPrimaryCurrency(prev => (prev === 'BRL' ? 'USD' : 'BRL'));
  };

  const primaryValue = primaryCurrency === 'BRL' ? formatCurrency(valueBRL, 'BRL') : formatCurrency(valueUSD, 'USD');
  const secondaryValue = primaryCurrency === 'BRL' ? formatCurrency(valueUSD, 'USD') : formatCurrency(valueBRL, 'BRL');

  return (
    <div
      className={`bg-gray-800 p-5 rounded-lg shadow-md flex items-center space-x-4 animate-pulse-neon-shadow ${isCurrency ? 'cursor-pointer hover:bg-gray-700 transition-colors' : ''}`}
      onClick={handleToggleCurrency}
    >
      <div className="flex-shrink-0 bg-gray-900 h-12 w-12 rounded-full flex items-center justify-center">
        {icon}
      </div>
      <div className="flex-grow">
        <p className="text-sm text-gray-400">{title}</p>
        
        {isCurrency ? (
          <div>
            <p className="text-2xl font-bold text-white">{primaryValue}</p>
            <p className="text-xs text-gray-500">{secondaryValue}</p>
          </div>
        ) : (
          <div>
            <p className="text-2xl font-bold text-white">{value}</p>
            {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
          </div>
        )}
      </div>
    </div>
  );
}