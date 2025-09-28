'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useEffect, useState } from "react";

interface RecentDonation {
  donator_username: string;
  donator_country: string;
  receiver_username: string;
  receiver_country: string;
  amount: number;
  currency: string;
  created_at: string;
}

export default function GlobalActivityFeed() {
  const [donations, setDonations] = useState<RecentDonation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchInitialDonations = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase.rpc('get_recent_donations', { limit_count: 15 });
        
        if (error) {
          console.error("Error fetching recent donations:", error);
          setError("Erro ao carregar atividades recentes");
        } else {
          setDonations(data as RecentDonation[]);
        }
      } catch (err) {
        console.error("Unexpected error fetching recent donations:", err);
        setError("Erro inesperado ao carregar atividades recentes");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialDonations();

    const channel = supabase
      .channel('realtime-global-donations')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'donations' },
        (payload) => {
          // This is a simplified approach. For a production app,
          // you'd want to fetch the full donation details with usernames and countries.
          // For now, we will just refetch the list.
          fetchInitialDonations();
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'donations' },
        (payload) => {
          if (payload.new.status === 'confirmed' && payload.old.status !== 'confirmed') {
            // Refetch the list to show the newly confirmed donation at the top.
            fetchInitialDonations();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg mt-8">
      <h2 className="text-2xl font-bold text-white mb-4">Atividade Global Recente</h2>
      {loading ? (
        <p className="text-gray-400">Carregando atividades...</p>
      ) : error ? (
        <p className="text-red-400">{error}</p>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {donations.map((donation, index) => (
            <div key={index} className="bg-gray-700 p-3 rounded-lg flex justify-between items-center animate-fade-in-down">
              <div>
                <p className="text-sm text-white">
                  <span className="font-bold">{donation.donator_username}</span> ({donation.donator_country}) doou para <span className="font-bold">{donation.receiver_username}</span> ({donation.receiver_country})
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-400">{donation.amount} {donation.currency}</p>
                <p className="text-xs text-gray-500">{new Date(donation.created_at).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
