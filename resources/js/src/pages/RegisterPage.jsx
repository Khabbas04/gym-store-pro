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
        <div className="space-y-6">
            <PageHeader
                eyebrow={t('signup')}
                title={t('create_account')}
                subtitle={t('register_subtitle')}
                actions={(
                    <Link to="/shop" className="btn-ghost px-5 py-2 text-sm">
                        {t('explore_shop')}
                    </Link>
                )}
            />

            <div className="surface-card mx-auto max-w-md rounded-3xl p-8">
                {error && <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}

                <form onSubmit={onSubmit} className="mt-6 space-y-4">
                    <input name="name" value={form.name} onChange={onInputChange} placeholder={t('full_name')} className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 outline-none" required />
                    <input name="email" type="email" value={form.email} onChange={onInputChange} placeholder={t('email')} className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 outline-none" required />
                    <input name="password" type="password" value={form.password} onChange={onInputChange} placeholder={t('password')} className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 outline-none" required />
                    <input name="password_confirmation" type="password" value={form.password_confirmation} onChange={onInputChange} placeholder={t('confirm_password')} className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 outline-none" required />
                    <button disabled={loading} className="w-full rounded-xl bg-[#f6eace] px-4 py-3 font-semibold text-slate-900 disabled:opacity-60">{loading ? t('creating') : t('register')}</button>
                </form>

                <p className="mt-5 text-sm text-slate-400">{t('already_account')} <Link className="text-[#f6eace]" to="/login">{t('login')}</Link></p>
            </div>
        </div>
    );
}
