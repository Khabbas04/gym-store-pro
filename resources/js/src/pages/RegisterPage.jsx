import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../components/ui/PageHeader';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function RegisterPage() {
    const navigate = useNavigate();
    const { register } = useAuth();
    const { t } = useLanguage();
    const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    function onInputChange(event) {
        const { name, value } = event.target;
        setForm((previous) => ({ ...previous, [name]: value }));
    }

    async function onSubmit(event) {
        event.preventDefault();
        setError('');
        setLoading(true);

        try {
            await register(form);
            navigate('/shop');
        } catch (e) {
            setError(e.message || t('error_register_failed'));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="bg-[#02040a] text-white min-h-screen">
            <PageHeader
                eyebrow={t('signup')}
                title={t('create_account')}
                subtitle={t('register_subtitle')}
                watermark="SIGNUP"
            />

            <section className="mx-auto max-w-[1600px] px-6 py-20 sm:px-12">
                <div className="mx-auto max-w-md rounded-3xl border border-white/5 bg-white/[0.01] p-10 backdrop-blur-md space-y-8 shadow-2xl">
                    {error && (
                        <div className="border border-red-500/20 bg-red-500/10 px-6 py-4 rounded-xl">
                            <p className="text-[11px] font-black uppercase tracking-widest text-red-400">{error}</p>
                        </div>
                    )}

                    <form onSubmit={onSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('full_name')}</label>
                            <input
                                name="name"
                                value={form.name}
                                onChange={onInputChange}
                                className="w-full border-b border-white/10 bg-transparent py-2 text-sm outline-none transition-colors focus:border-[#f6eace]"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('email')}</label>
                            <input
                                name="email"
                                type="email"
                                value={form.email}
                                onChange={onInputChange}
                                className="w-full border-b border-white/10 bg-transparent py-2 text-sm outline-none transition-colors focus:border-[#f6eace]"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('password')}</label>
                            <input
                                name="password"
                                type="password"
                                value={form.password}
                                onChange={onInputChange}
                                className="w-full border-b border-white/10 bg-transparent py-2 text-sm outline-none transition-colors focus:border-[#f6eace]"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('confirm_password')}</label>
                            <input
                                name="password_confirmation"
                                type="password"
                                value={form.password_confirmation}
                                onChange={onInputChange}
                                className="w-full border-b border-white/10 bg-transparent py-2 text-sm outline-none transition-colors focus:border-[#f6eace]"
                                required
                            />
                        </div>

                        <button
                            disabled={loading}
                            className="w-full bg-[#f6eace] py-4 text-xs font-black uppercase tracking-[0.2em] text-black transition-transform active:scale-95 disabled:opacity-50 rounded-xl mt-8"
                        >
                            {loading ? t('creating') : t('register')}
                        </button>
                    </form>

                    <div className="text-center pt-4 border-t border-white/5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                            {t('already_account')} <Link className="text-white hover:text-[#f6eace] transition-colors" to="/login">{t('login')}</Link>
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}
