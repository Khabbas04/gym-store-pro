import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function Footer() {
    const { t } = useLanguage();

    return (
        <footer className="mt-40 border-t border-white/5 bg-[#02040a] pb-12 pt-24">
            <div className="mx-auto max-w-[1600px] px-6 sm:px-12">
                <div className="grid gap-16 lg:grid-cols-4">
                    <div className="lg:col-span-2">
                        <Link to="/" className="flex items-center gap-3">
                            <img src="/images/icon.png?v=1" alt="Logo" className="h-8 w-8 object-contain" />
                            <span className="text-xl font-black uppercase tracking-[0.3em] text-white">SIRIUS</span>
                        </Link>
                        <p className="mt-8 max-w-sm text-sm font-medium leading-relaxed text-slate-400">
                            {t('footer_desc')}
                        </p>
                    </div>

                    <div>
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#f6eace]">
                            {t('footer_quick_links')}
                        </h4>
                        <ul className="mt-8 space-y-4">
                            <li><Link to="/" className="text-sm font-medium text-slate-400 transition-colors hover:text-white">{t('nav_home')}</Link></li>
                            <li><Link to="/shop" className="text-sm font-medium text-slate-400 transition-colors hover:text-white">{t('nav_shop')}</Link></li>
                            <li><Link to="/cart" className="text-sm font-medium text-slate-400 transition-colors hover:text-white">{t('nav_cart')}</Link></li>
                            <li><Link to="/orders" className="text-sm font-medium text-slate-400 transition-colors hover:text-white">{t('nav_orders')}</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#f6eace]">
                            {t('footer_policy')}
                        </h4>
                        <ul className="mt-8 space-y-4 text-sm font-medium text-slate-400">
                            <li>{t('footer_roles')}</li>
                            <li>{t('footer_secure')}</li>
                            <li>{t('footer_scalable')}</li>
                        </ul>
                    </div>
                </div>

                <div className="mt-24 flex flex-col gap-6 border-t border-white/5 pt-12 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs font-medium text-slate-500">
                        © {new Date().getFullYear()} SIRIUS. {t('footer_rights')}
                    </p>
                    <p className="text-xs font-black uppercase tracking-widest text-[#f6eace]/60">
                        {t('footer_developed_by')}
                    </p>
                </div>
            </div>
        </footer>
    );
}

