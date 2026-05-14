import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const SECTIONS = ['overview', 'orders', 'products', 'users', 'activity'];

export default function AdminLayout({ user, onLogout, section, onSectionChange, children }) {
    const { t } = useLanguage();

    return (
        <div className="app-shell-bg min-h-screen text-white">
            <div className="pointer-events-none fixed inset-0 -z-10">
                <div className="aurora-layer h-full w-full" />
                <div className="constellation-layer" />
            </div>

            <div className="mx-auto max-w-7xl px-5 py-8">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                    <div>
                        <h1 className="text-2xl font-black text-[#fff4dd]">{t('admin_dashboard_title')}</h1>
                        <p className="text-xs text-slate-400">{t('admin_dashboard_subtitle')}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-slate-300">{user?.name || 'Admin'}</span>
                        <Link to="/" className="btn-ghost px-4 py-2 text-sm">{t('nav_home')}</Link>
                        <button onClick={onLogout} className="rounded-full border border-red-300/30 px-4 py-2 text-sm text-red-200 hover:bg-red-500/10">{t('logout')}</button>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
                    <main>{children}</main>

                    <aside className="rounded-3xl border border-white/10 bg-white/[0.05] p-4 lg:sticky lg:top-6 lg:h-fit">
                        <h2 className="mb-3 px-2 text-sm font-semibold text-slate-300">{t('admin_navigation')}</h2>
                        <div className="space-y-2">
                            {SECTIONS.map((item) => (
                                <button
                                    key={item}
                                    type="button"
                                    onClick={() => onSectionChange(item)}
                                    className={`w-full rounded-xl px-4 py-2 text-sm text-start transition ${section === item ? 'bg-[#f6eace] text-slate-900' : 'border border-white/20 text-slate-300 hover:border-[#f6eace]/50 hover:text-[#f6eace]'}`}
                                >
                                    {t(`admin_tab_${item}`)}
                                </button>
                            ))}
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
