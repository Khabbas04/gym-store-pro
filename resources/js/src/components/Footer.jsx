import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function Footer() {
    const { t, language } = useLanguage();

    return (
        <footer className="mt-40 border-t border-white/5 bg-black/35 backdrop-blur-lg pb-12 pt-24">
            <div className="mx-auto max-w-[1600px] px-6 sm:px-12">
                <div className="grid gap-16 lg:grid-cols-4">
                    <div className="lg:col-span-2">
                        <Link to="/" className="flex items-center gap-4">
                            <img src="/images/icon.png?v=1" alt="Logo" className="h-16 w-16 sm:h-20 sm:w-20 object-contain" />
                            <span className="text-3xl font-black uppercase tracking-[0.3em] text-white">SIRIUS</span>
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
                        </ul>
                    </div>
 
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#f6eace]">
                            {language === 'ar' ? 'تابعنا' : 'Follow Us'}
                        </h4>
                        <ul className="mt-8 space-y-4">
                            <li>
                                <a 
                                    href="https://www.instagram.com/sirius.jo_/" 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-sm font-medium text-slate-400 transition-colors hover:text-[#f6eace] flex items-center gap-3 group"
                                >
                                    <svg className="w-5 h-5 fill-current text-slate-400 group-hover:text-[#f6eace] transition-colors" viewBox="0 0 24 24">
                                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0 3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                                    </svg>
                                    <span className="font-bold tracking-wider">sirius.jo_</span>
                                </a>
                            </li>
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

