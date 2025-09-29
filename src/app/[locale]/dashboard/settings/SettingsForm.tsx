'use client';

import { useMemo, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/createSupabaseBrowserClient';

interface Profile {
  id: string;
  name: string;
  username: string;
  email: string;
  whatsapp: string;
}

interface Wallets {
  pix: string;
  usdt: string;
}

interface SettingsFormProps {
  profile: Profile;
  wallets: Wallets;
}

const Input = ({ label, id, ...props }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">
      {label}
    </label>
    <input
      id={id}
      className="w-full bg-gray-900 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-green-500 focus:border-green-500"
      {...props}
    />
  </div>
);

const Button = ({ children, ...props }) => (
  <button
    className="py-2 px-4 bg-green-600 hover:bg-green-700 focus:ring-green-500 focus:ring-offset-gray-800 focus:ring-offset-2 text-white font-semibold rounded-md shadow-sm focus:outline-none focus:ring-2"
    {...props}
  >
    {children}
  </button>
);

export function SettingsForm({ profile, wallets }: SettingsFormProps) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [name, setName] = useState(profile.name || '');
  const [username, setUsername] = useState(profile.username || '');
  const [whatsapp, setWhatsapp] = useState(profile.whatsapp || '');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [pix, setPix] = useState(wallets.pix || '');
  const [usdt, setUsdt] = useState(wallets.usdt || '');

  const [message, setMessage] = useState<{ type: 'error' | 'success' | ''; text: string }>({ type: '', text: '' });

  const handleProfileUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    const { error } = await supabase
      .from('profiles')
      .update({ name, username, whatsapp })
      .eq('id', profile.id);

    if (error) {
      setMessage({ type: 'error', text: `Erro ao atualizar perfil: ${error.message}` });
    } else {
      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas não coincidem.' });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'A senha deve ter no mínimo 6 caracteres.' });
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setMessage({ type: 'error', text: `Erro ao atualizar senha: ${error.message}` });
    } else {
      setMessage({ type: 'success', text: 'Senha atualizada com sucesso! Verifique seu e-mail para confirmação.' });
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleWalletsUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    const walletsToUpsert = [
      { profile_id: profile.id, type: 'PIX', address_or_pix: pix, currency: 'BRL' },
      { profile_id: profile.id, type: 'USDT_BEP20', address_or_pix: usdt, currency: 'USD' },
    ];

    const { error } = await supabase.from('wallets').upsert(walletsToUpsert, { onConflict: 'profile_id,type' });

    if (error) {
      setMessage({ type: 'error', text: `Erro ao atualizar carteiras: ${error.message}` });
    } else {
      setMessage({ type: 'success', text: 'Carteiras atualizadas com sucesso!' });
    }
  };

  return (
    <div className="space-y-8">
      {message.text && (
        <div className={`${message.type === 'error' ? 'bg-red-500' : 'bg-green-500'} text-white p-3 rounded-md`}>
          {message.text}
        </div>
      )}

      <div className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-xl font-bold text-white mb-4">Informações do Perfil</h2>
        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <Input label="Nome" id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Username" id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
          <Input label="Email" id="email" type="email" value={profile.email} disabled className="bg-gray-700 cursor-not-allowed" />
          <Input label="WhatsApp" id="whatsapp" type="text" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
          <div className="text-right">
            <Button type="submit">Salvar Alterações</Button>
          </div>
        </form>
      </div>

      <div className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-xl font-bold text-white mb-4">Alterar Senha</h2>
        <form onSubmit={handlePasswordUpdate} className="space-y-4">
          <Input label="Nova Senha" id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <Input label="Confirmar Nova Senha" id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          <div className="text-right">
            <Button type="submit">Alterar Senha</Button>
          </div>
        </form>
      </div>

      <div className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-xl font-bold text-white mb-4">Carteiras de Pagamento</h2>
        <form onSubmit={handleWalletsUpdate} className="space-y-4">
          <Input label="Chave PIX" id="pix" type="text" value={pix} onChange={(e) => setPix(e.target.value)} placeholder="Sua chave PIX" />
          <Input label="Carteira USDT (BEP-20)" id="usdt" type="text" value={usdt} onChange={(e) => setUsdt(e.target.value)} placeholder="0x..." />
          <div className="text-right">
            <Button type="submit">Salvar Carteiras</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
