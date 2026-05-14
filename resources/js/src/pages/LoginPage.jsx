import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../components/ui/PageHeader';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const { t } = useLanguage();
    const [form, setForm] = useState({ email: '', password: '' });
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
            const user = await login(form);
            navigate(user.role === 'admin' ? '/admin' : '/shop');
        } catch (e) {
            setError(e.message || t('error_login_failed'));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="relative -mt-10 mb-[-40px] w-screen overflow-hidden bg-[#02040a] text-white" style={{ marginInline: 'calc(50% - 50vw)' }}>
            <section className="mx-auto flex min-h-[80vh] max-w-[1600px] flex-col items-center justify-center px-6 py-24 sm:px-12">
                <div className="w-full max-w-sm">
                    <div className="mb-12 text-center">
                        <span className="text-xs font-black uppercase tracking-[0.4em] text-[#f6eace]">{t('login')}</span>
                        <h1 className="mt-4 text-4xl font-black uppercase tracking-tight">{t('welcome_back')}</h1>
                    </div>

                    {error && (
                        <div className="mb-8 border border-red-500/20 bg-red-500/10 px-6 py-4">
                            <p className="text-[11px] font-black uppercase tracking-widest text-red-400">{error}</p>
                        </div>
                    )}

                    <form onSubmit={onSubmit} className="space-y-6">
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

                        <button
                            disabled={loading}
                            className="mt-12 w-full bg-[#f6eace] py-5 text-sm font-black uppercase tracking-[0.2em] text-black transition-transform active:scale-95 disabled:opacity-50"
                        >
                            {loading ? t('signing_in') : t('login')}
                        </button>
                    </form>

                    <div className="mt-12 text-center">
                        <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                            {t('no_account')} <Link className="text-white hover:text-[#f6eace] transition-colors" to="/register">{t('create_one')}</Link>
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}

