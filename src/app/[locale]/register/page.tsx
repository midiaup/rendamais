'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

// Placeholder icons (same as login)
const EyeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639l4.436-7.18a1.012 1.012 0 0 1 1.618 0l4.436 7.18a1.012 1.012 0 0 1 0 .639l-4.436 7.18a1.012 1.012 0 0 1-1.618 0l-4.436-7.18Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>;
const EyeSlashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.243 4.243-4.243-4.243" /></svg>;

export default function RegisterPage() {
  const t = useTranslations('RegisterPage');
  const countries = t.raw('countries') as Record<string, string>;
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    country: '',
    email: '',
    whatsapp: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError(t('error.passwordsDontMatch'));
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (signUpData.user) {
      const { error: profileError } = await supabase.from('profiles').insert([{
        user_id: signUpData.user.id,
        name: formData.name,
        username: formData.username,
        email: formData.email,
        whatsapp: formData.whatsapp,
        country: formData.country,
      }]);

      if (profileError) {
        setError(profileError.message);
      } else {
        setSuccess(t('successMessage'));
      }
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center py-12">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6 text-green-400">{t('title')}</h1>
        <h2 className="text-xl font-semibold text-center mb-8">{t('subtitle')}</h2>
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label htmlFor="name" className="block mb-2 text-sm font-medium">{t('fullNameLabel')}</label>
            <input type="text" id="name" value={formData.name} onChange={handleChange} className="w-full p-3 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500" required />
          </div>
          <div>
            <label htmlFor="username" className="block mb-2 text-sm font-medium">{t('usernameLabel')}</label>
            <input type="text" id="username" value={formData.username} onChange={handleChange} className="w-full p-3 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500" required />
          </div>
          <div>
            <label htmlFor="country" className="block mb-2 text-sm font-medium">{t('countryLabel')}</label>
            <select id="country" value={formData.country} onChange={handleChange} className="w-full p-3 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500" required>
              <option value="" disabled>{t('selectCountry')}</option>
              {Object.entries(countries).map(([key, name]) => (
                <option key={key} value={name}>{name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="email" className="block mb-2 text-sm font-medium">{t('emailLabel')}</label>
            <input type="email" id="email" value={formData.email} onChange={handleChange} className="w-full p-3 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500" required />
          </div>
          <div>
            <label htmlFor="whatsapp" className="block mb-2 text-sm font-medium">{t('whatsappLabel')}</label>
            <input type="tel" id="whatsapp" value={formData.whatsapp} onChange={handleChange} className="w-full p-3 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500" required />
          </div>
          <div className="relative">
            <label htmlFor="password" className="block mb-2 text-sm font-medium">{t('passwordLabel')}</label>
            <input type={showPassword ? 'text' : 'password'} id="password" value={formData.password} onChange={handleChange} className="w-full p-3 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500" required />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 top-7 pr-3 flex items-center text-gray-400">
              {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
            </button>
          </div>
          <div className="relative">
            <label htmlFor="confirmPassword" className="block mb-2 text-sm font-medium">{t('confirmPasswordLabel')}</label>
            <input type={showConfirmPassword ? 'text' : 'password'} id="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="w-full p-3 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500" required />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 top-7 pr-3 flex items-center text-gray-400">
              {showConfirmPassword ? <EyeSlashIcon /> : <EyeIcon />}
            </button>
          </div>
          {error && <p className="text-red-500 text-center text-sm mt-4">{error}</p>}
          {success && <p className="text-green-500 text-center text-sm mt-4">{success}</p>}
          <button 
            type="submit" 
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-md transition duration-300 mt-2 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? t('loadingButton') : t('submitButton')}
          </button>
        </form>
        <div className="text-center mt-4">
          <p>{t('loginPrompt')} <Link href="/login" className="font-bold text-green-400 hover:underline">{t('loginLink')}</Link></p>
        </div>
      </div>
    </div>
  );
}