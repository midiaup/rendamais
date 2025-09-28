
'use client';

import { useState, useEffect, useRef, useCallback, ChangeEvent } from 'react';
import { supabase } from '@/lib/supabaseClient';
// CORREÇÃO: Importando useAuthStore em vez de useAuth
import { useAuthStore } from '@/stores/authStore';
// CORREÇÃO: Importando da configuração de navegação local
import { Link } from '@/lib/navigation';
import { useTranslations } from 'next-intl';
import {
    ArrowLeftIcon,
    ArrowUpTrayIcon,
    ArrowDownTrayIcon,
    WalletIcon,
    ClipboardIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';

// Types
interface RecipientInfo {
    donation_id: string;
    receiver_name: string;
    receiver_username: string;
    receiver_whatsapp: string;
    amount: number;
    currency: string;
    plan: string;
    wallet_type: string;
    wallet_address: string;
}

interface Donation {
    id: string;
    amount: number;
    currency: string;
    plan: string;
    status: string;
    created_at: string;
    to_profile?: { name: string; username: string };
    from_profile?: { name: string; username: string };
}

const PLANS = ['RENDA_10', 'RENDA_50', 'RENDA_100'];

const PLANS_AMOUNTS = {
    RENDA_10: { BRL: '10,00', USD: '10.00' },
    RENDA_50: { BRL: '50,00', USD: '50.00' },
    RENDA_100: { BRL: '100,00', USD: '100.00' },
};

// Sub-components
const TabButton = ({ label, icon, active, onClick }: {
    label: string;
    icon: React.ReactNode;
    active: boolean;
    onClick: () => void;
}) => (
    <button
        onClick={onClick}
        className={`${
            active
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
    >
        {icon}
        <span>{label}</span>
    </button>
);

const FilterButton = ({ label, active, onClick }: {
    label: string;
    active: boolean;
    onClick: () => void;
}) => (
    <button
        onClick={onClick}
        className={`${
            active
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
        } px-3 py-1 rounded-md text-sm font-medium`}
    >
        {label}
    </button>
);

const DonationCard = ({ plan, onDonate, loadingPlan, t }: {
    plan: keyof typeof PLANS_AMOUNTS;
    onDonate: (plan: string, currency: string) => void;
    loadingPlan: string | null;
    t: (key: string) => string;
}) => (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">{plan}</h3>
        <div className="flex space-x-4">
            <button
                onClick={() => onDonate(plan, 'BRL')}
                disabled={loadingPlan === `${plan}_BRL`}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 disabled:bg-gray-400"
            >
                {loadingPlan === `${plan}_BRL` ? t('searching') : `R$ ${PLANS_AMOUNTS[plan].BRL}`}
            </button>
            <button
                onClick={() => onDonate(plan, 'USD')}
                disabled={loadingPlan === `${plan}_USD`}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 disabled:bg-gray-400"
            >
                {loadingPlan === `${plan}_USD` ? t('searching') : `$ ${PLANS_AMOUNTS[plan].USD}`}
            </button>
        </div>
    </div>
);

const DonationList = ({ donations, type, onConfirm, t }: {
    donations: Donation[];
    type: 'sent' | 'received';
    onConfirm?: (id: string) => void;
    t: (key: string) => string;
}) => {
    if (donations.length === 0) {
        return <p className="text-gray-500 text-center py-4">{t('noDonationsFound')}</p>;
    }

    return (
        <ul role="list" className="space-y-4">
            {donations.map(donation => (
                <li key={donation.id} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900 flex items-center justify-between space-x-4">
                    <div className="flex items-center space-x-3">
                        <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-gray-800 ${
                            donation.status === 'confirmed' ? 'bg-green-500' : 
                            donation.status === 'donor_confirmed' ? 'bg-blue-500' : 'bg-yellow-500'
                        }`}>
                            {type === 'sent' ? <ArrowUpTrayIcon className="h-4 w-4 text-white" /> : <ArrowDownTrayIcon className="h-4 w-4 text-white" />}
                        </span>
                        <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {type === 'sent' ? `${t('to')}: ${donation.to_profile?.name}` : `${t('from')}: ${donation.from_profile?.name}`}
                            </p>
                            <p className="text-sm text-gray-500">
                                {donation.plan} - {new Intl.NumberFormat('pt-BR', { 
                                    style: 'currency', 
                                    currency: donation.currency 
                                }).format(donation.amount)}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            donation.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                            {t(donation.status)}
                        </p>
                        <p className="text-sm text-gray-500">
                            <time dateTime={donation.created_at}>
                                {new Date(donation.created_at).toLocaleDateString()}
                            </time>
                        </p>
                        {type === 'received' && donation.status === 'donor_confirmed' && onConfirm && (
                            <button
                                onClick={() => onConfirm(donation.id)}
                                className="mt-2 text-xs bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-2 rounded flex items-center space-x-1"
                            >
                                <CheckCircleIcon className="h-3 w-3" />
                                <span>{t('confirm')}</span>
                            </button>
                        )}
                    </div>
                </li>
            ))}
        </ul>
    );
};

export default function DonatePage() {
    const t = useTranslations('DonatePage');
    // CORREÇÃO: Usando useAuthStore em vez de useAuth
    const { session } = useAuthStore();
    const user = session?.user || null;
    const authLoading = false; // Zustand não tem loading state por padrão
    const [recipientInfo, setRecipientInfo] = useState<RecipientInfo | null>(null);
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [isConfirming, setIsConfirming] = useState(false);
    const [donationProofText, setDonationProofText] = useState('');
    const [proofFile, setProofFile] = useState<File | null>(null);
    const historyRef = useRef<HTMLDivElement>(null);
    const [activeTab, setActiveTab] = useState('sent');
    const [sentDonations, setSentDonations] = useState<Donation[]>([]);
    const [receivedDonations, setReceivedDonations] = useState<Donation[]>([]);
    const [planFilter, setPlanFilter] = useState('all');
    const [isHistoryLoading, setIsHistoryLoading] = useState(true);

    const findAndCreateDonation = async (plan: string, currency: string) => {
        if (!user) return;
        
        setLoadingPlan(`${plan}_${currency}`);
        setStatusMessage(null);
        
        try {
            const { data, error } = await supabase.rpc('create_donation_for_plan', {
                p_user_id: user.id,
                p_plan: plan,
                p_currency: currency
            });
    
            if (error) throw error;
    
            const result = data?.[0];
            if (result && result.status_message === 'TARGET_FOUND') {
                setRecipientInfo(result);
                fetchDonationHistory(planFilter);
            } else if (result && result.status_message === 'ALREADY_ACTIVE_OR_PENDING') {
                setStatusMessage(t('pendingDonationFound'));
                
                const { data: pendingData, error: pendingError } = await supabase.rpc('get_user_pending_donation_for_plan', {
                    p_user_id: user.id,
                    p_plan: plan,
                    p_currency: currency
                });
    
                if (pendingError) throw pendingError;
    
                if (pendingData && pendingData.length > 0) {
                    setRecipientInfo(pendingData[0]);
                }
            } else {
                const message = result.status_message === 'NO_TARGET_AVAILABLE'
                    ? t('noRecipientAvailable')
                    : t('errorFindingRecipient');
                setStatusMessage(message);
                setRecipientInfo(null);
            }
        } catch (err: any) {
            console.error("Erro na chamada RPC:", err);
            setStatusMessage(t('errorFindingRecipientConsole'));
        } finally {
            setLoadingPlan(null);
        }
    };

    const handleCancelDonation = () => {
        setRecipientInfo(null);
        setStatusMessage(t('operationCanceled'));
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setProofFile(e.target.files[0]);
        }
    };

    const handleDonorConfirmation = async () => {
        if (!recipientInfo || !user || (!donationProofText && !proofFile)) {
            setStatusMessage(t('provideProof'));
            return;
        }

        setIsConfirming(true);
        let finalProofUrl = donationProofText;

        try {
            if (proofFile) {
                const fileExt = proofFile.name.split('.').pop();
                const fileName = `${user.id}-${Date.now()}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('donation-proofs')
                    .upload(filePath, proofFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('donation-proofs')
                    .getPublicUrl(filePath);

                finalProofUrl = publicUrl;
            }

            const { error: rpcError } = await supabase.rpc('donor_confirm_donation', {
                p_donation_id: recipientInfo.donation_id,
                p_proof: finalProofUrl,
                p_actor: user.id
            });

            if (rpcError) throw rpcError;

            setStatusMessage(t('confirmationSent'));
            setRecipientInfo(null);
            setProofFile(null);
            setDonationProofText('');
            fetchDonationHistory(planFilter);
        } catch (err: any) {
            console.error("Erro na confirmação:", err);
            setStatusMessage(`${t('errorConfirmingDonation')} ${err.message}`);
        } finally {
            setIsConfirming(false);
        }
    };

    const handleReceiverConfirmation = async (donationId: string) => {
        if (!user) return;

        try {
            const { error } = await supabase.rpc('receiver_confirm_donation', {
                p_donation_id: donationId,
                p_actor: user.id
            });

            if (error) throw error;

            setStatusMessage(t('donationConfirmedSuccess'));
            fetchDonationHistory(planFilter);
        } catch (err: any) {
            setStatusMessage(t('errorConfirmingReceipt'));
        }
    };

    const fetchDonationHistory = useCallback(async (filter: string) => {
        if (!user) return;

        setIsHistoryLoading(true);

        const fetchTable = async (table: 'sent' | 'received'): Promise<Donation[]> => {
            try {
                const isSent = table === 'sent';
                let query = supabase
                    .from('donations')
                    .select(`
                        id, amount, currency, plan, status, created_at,
                        ${
                            isSent 
                                ? 'to_profile:profiles!donations_to_profile_id_fkey(name, username)' 
                                : 'from_profile:profiles!donations_from_profile_id_fkey(name, username)'
                        }
                    `)
                    .eq(isSent ? 'from_profile_id' : 'to_profile_id', user.id);

                if (filter !== 'all') {
                    query = query.eq('plan', filter);
                }

                const { data, error } = await query.order('created_at', { ascending: false });

                if (error) throw error;

                return data || [];
            } catch (error) {
                console.error(`Error fetching ${table} donations:`, error);
                return [];
            }
        };

        const [sent, received] = await Promise.all([
            fetchTable('sent'),
            fetchTable('received')
        ]);

        setSentDonations(sent);
        setReceivedDonations(received);
        setIsHistoryLoading(false);
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchDonationHistory(planFilter);
        }
    }, [user, planFilter, fetchDonationHistory]);

    useEffect(() => {
        if (statusMessage) {
            const timer = setTimeout(() => {
                setStatusMessage(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [statusMessage]);

    const copyToClipboard = useCallback((text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            // Usando setTimeout para evitar setState durante render
            setTimeout(() => setStatusMessage(t('copied')), 0);
        });
    }, [t]);

    useEffect(() => {
        if (recipientInfo) {
            setTimeout(() => {
                historyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    }, [recipientInfo]);

    if (authLoading) {
        return (
            <div className="p-8 text-center">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-300 rounded w-1/3 mx-auto mb-4"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">{t('title')}</h1>
                <Link href="/dashboard" className="flex items-center text-sm font-medium text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors">
                    <ArrowLeftIcon className="h-4 w-4 mr-2" />
                    {t('backToHome')}
                </Link>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">{t('makeDonation')}</h2>
                {!recipientInfo ? (
                    <div className="space-y-6">
                        <p className="text-center text-gray-600 dark:text-gray-300">
                            {t('choosePlan')}
                        </p>
                        {PLANS.map(plan => (
                            <DonationCard 
                                key={plan}
                                plan={plan as keyof typeof PLANS_AMOUNTS}
                                onDonate={findAndCreateDonation} 
                                loadingPlan={loadingPlan}
                                t={t}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="animate-fade-in space-y-4">
                        <div>
                            <p className="text-gray-600 dark:text-gray-300 mb-4">
                                {t('depositToRecipient')} <strong>{recipientInfo.plan}</strong>.
                            </p>
                            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg space-y-3">
                                <p><strong>{t('recipient')}:</strong> {recipientInfo.receiver_name} (@{recipientInfo.receiver_username})</p>
                                <p><strong>{t('amount')}:</strong> <span className="font-bold text-green-500">
                                    {new Intl.NumberFormat('pt-BR', { 
                                        style: 'currency', 
                                        currency: recipientInfo.currency 
                                    }).format(recipientInfo.amount)}
                                </span></p>
                                <p><strong>{t('whatsapp')}:</strong> 
                                    <a 
                                        href={`https://wa.me/${recipientInfo.receiver_whatsapp}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-blue-500 hover:underline ml-2"
                                    >
                                        {recipientInfo.receiver_whatsapp}
                                    </a>
                                </p>
                                <div className="flex items-center">
                                    <p><strong><WalletIcon className="inline h-4 w-4 mr-1" /> {recipientInfo.wallet_type?.toUpperCase()}:</strong></p>
                                    <div className="ml-2 flex items-center bg-gray-200 dark:bg-gray-600 p-2 rounded">
                                        <span className="font-mono text-sm break-all">{recipientInfo.wallet_address}</span>
                                        <button 
                                            onClick={() => copyToClipboard(recipientInfo.wallet_address)} 
                                            className="ml-2 text-gray-500 hover:text-gray-800 dark:hover:text-white"
                                        >
                                            <ClipboardIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                                {t('proofOfPayment')}
                            </label>
                            <input 
                                type="file" 
                                onChange={handleFileChange} 
                                accept="image/png, image/jpeg, image/jpg" 
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                            />
                            {proofFile && <p className="text-xs text-gray-500">{t('fileSelected')}: {proofFile.name}</p>}
                            <p className="text-center text-sm text-gray-500 my-2">{t('or')}</p>
                            <input 
                                type="text" 
                                value={donationProofText} 
                                onChange={(e) => setDonationProofText(e.target.value)} 
                                placeholder={t('pasteTransactionHash')}
                                className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" 
                            />
                            <div className="flex items-center space-x-4 pt-2">
                                <button 
                                    onClick={handleCancelDonation} 
                                    className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
                                >
                                    {t('cancel')}
                                </button>
                                <button 
                                    onClick={handleDonorConfirmation} 
                                    disabled={isConfirming || (!donationProofText && !proofFile)} 
                                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 disabled:bg-gray-400"
                                >
                                    {isConfirming ? t('sending') : t('iPaid')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {statusMessage && (
                    <div className="fixed bottom-4 right-4 bg-blue-500 text-white py-2 px-4 rounded-lg shadow-lg animate-fade-in-up z-50">
                        {statusMessage}
                    </div>
                )}
            </div>

            <div ref={historyRef} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">{t('donationHistory')}</h2>
                <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        <TabButton 
                            label={t('sent')}
                            icon={<ArrowUpTrayIcon className="h-4 w-4" />} 
                            active={activeTab === 'sent'} 
                            onClick={() => setActiveTab('sent')} 
                        />
                        <TabButton 
                            label={t('received')}
                            icon={<ArrowDownTrayIcon className="h-4 w-4" />} 
                            active={activeTab === 'received'} 
                            onClick={() => setActiveTab('received')} 
                        />
                        <div className="flex-grow" />
                        <div className="flex items-center space-x-2">
                            <FilterButton 
                                label={t('all')}
                                active={planFilter === 'all'} 
                                onClick={() => setPlanFilter('all')} 
                            />
                            {PLANS.map(plan => (
                                <FilterButton 
                                    key={plan} 
                                    label={plan} 
                                    active={planFilter === plan} 
                                    onClick={() => setPlanFilter(plan)} 
                                />
                            ))}
                        </div>
                    </nav>
                </div>
                <div className="mt-6">
                    {isHistoryLoading ? (
                        <p>{t('loadingHistory')}</p>
                    ) : (
                        activeTab === 'sent' ? (
                            <DonationList donations={sentDonations} type="sent" t={t} />
                        ) : (
                            <DonationList 
                                donations={receivedDonations} 
                                type="received" 
                                onConfirm={handleReceiverConfirmation}
                                t={t}
                            />
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
