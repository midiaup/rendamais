
'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useEffect, useState } from "react";

export default function CommunityStats() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [totalDonations, setTotalDonations] = useState(0);

  useEffect(() => {
    const fetchInitialTotal = async () => {
      const { data, error } = await supabase
        .from('donations')
        .select('amount')
        .eq('status', 'confirmed');
      
      if (error) {
        console.error("Error fetching initial donations:", error);
        return;
      }

      const total = data.reduce((acc, curr) => acc + curr.amount, 0);
      setTotalDonations(total);
    };

    fetchInitialTotal();

    const channel = supabase
      .channel('realtime-donations')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'donations' },
        (payload) => {
          if (payload.new.status === 'confirmed') {
            setTotalDonations(currentTotal => currentTotal + payload.new.amount);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'donations' },
        (payload) => {
          if (payload.new.status === 'confirmed' && payload.old.status !== 'confirmed') {
            setTotalDonations(currentTotal => currentTotal + payload.new.amount);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center"><h3 className="text-gray-400 text-lg font-medium">Total da Comunidade</h3><p className="text-4xl font-bold text-green-400 mt-2">R$ {totalDonations.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p><p className="text-sm text-gray-500 mt-1">*Valor total de doações confirmadas na plataforma.</p></div>
  );
}
