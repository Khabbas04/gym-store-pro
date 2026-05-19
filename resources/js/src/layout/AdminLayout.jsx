import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const SECTIONS = ['overview', 'orders', 'products', 'collections', 'users', 'reviews', 'activity'];

export default function AdminLayout({ user, onLogout, section, onSectionChange, children }) {
    const { t, isArabic } = useLanguage();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="flex h-screen w-full overflow-hidden bg-[#04080f] text-white selection:bg-[#f6eace] selection:text-black relative">
            {/* Ambient Background Effects */}
            <div className="pointer-events-none fixed inset-0 -z-10">
                <div className="absolute top-[-20%] left-[-10%] h-[40%] w-[40%] rounded-full bg-[#f6eace]/5 blur-[150px]" />
                <div className="absolute bottom-[-20%] right-[-10%] h-[40%] w-[40%] rounded-full bg-blue-500/5 blur-[150px]" />
                <div className="absolute top-[30%] left-[40%] h-[20%] w-[20%] rounded-full bg-emerald-500/5 blur-[150px]" />
            </div>

            {/* Sidebar (Desktop & Mobile) */}
            <aside className={`fixed inset-y-0 ${isArabic ? 'right-0' : 'left-0'} z-50 flex w-72 flex-col border-white/10 bg-black/95 backdrop-blur-2xl transition-transform duration-300 lg:static lg:bg-black/40 lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : isArabic ? 'translate-x-full' : '-translate-x-full'} ${isArabic ? 'border-l' : 'border-r'}`}>
                {/* Brand / Logo */}
                <div className="flex items-center justify-between border-b border-white/10 px-8 py-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 shadow-[0_0_15px_rgba(246,234,206,0.1)]">
                            <img src="/images/icon.png?v=1" alt="Logo" className="h-7 w-7 object-contain brightness-125" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black uppercase tracking-[0.2em] text-white">SIRIUS</h1>
                            <span className="text-[9px] font-black uppercase tracking-widest text-[#f6eace]">Admin Panel</span>
                        </div>
                    </div>
                    {/* Mobile Close Button */}
                    <button 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="lg:hidden text-white/50 hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto px-4 py-8 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                    <p className="mb-4 px-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">{t('admin_navigation') || 'Menu'}</p>
                    <div className="space-y-2">
                        {SECTIONS.map((item) => {
                            const isActive = section === item;
                            return (
                                <button
                                    key={item}
                                    type="button"
                                    onClick={() => {
                                        onSectionChange(item);
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className={`group flex w-full items-center gap-3 rounded-2xl px-5 py-3.5 text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                                        isActive 
                                        ? 'bg-gradient-to-r from-[#f6eace]/10 to-transparent text-[#f6eace] border-l-2 border-[#f6eace]' 
                                        : 'text-slate-400 hover:bg-white/5 hover:text-white border-l-2 border-transparent'
                                    }`}
                                >
                                    <span className={`text-base transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                                        {item === 'overview' && '📊'}
                                        {item === 'orders' && '📦'}
                                        {item === 'products' && '👟'}
                                        {item === 'collections' && '✨'}
                                        {item === 'users' && '👥'}
                                        {item === 'reviews' && '⭐'}
                                        {item === 'activity' && '⚡'}
                                    </span>
                                    <span>{t(`admin_tab_${item}`)}</span>
                                </button>
                            );
                        })}
                    </div>
                </nav>

                {/* User Section (Bottom) */}
                <div className="border-t border-white/10 p-6">
                    <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#f6eace] to-yellow-600 text-black shadow-lg">
                            <span className="text-sm font-black">{user?.name?.charAt(0) || 'A'}</span>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="truncate text-xs font-bold text-white">{user?.name || 'Admin'}</p>
                            <p className="truncate text-[9px] font-black uppercase tracking-widest text-slate-500">{user?.role || 'Administrator'}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Main Content Area */}
            <main className="flex flex-1 flex-col overflow-hidden relative">
                {/* Top Header */}
                <header className="flex h-16 sm:h-20 shrink-0 items-center justify-between border-b border-white/10 bg-black/20 px-4 sm:px-8 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="lg:hidden text-white/80 hover:text-white p-2"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                        </button>
                        <h2 className="text-sm sm:text-lg font-black uppercase tracking-[0.1em] text-white">
                            {t(`admin_tab_${section}`)}
                        </h2>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4">
                        <Link 
                            to="/" 
                            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 sm:px-5 py-2 sm:py-2.5 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-300 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
                        >
                            <span>🏠</span> <span className="hidden sm:inline">{t('nav_home')}</span>
                        </Link>
                        <button 
                            onClick={onLogout} 
                            className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 sm:px-5 py-2 sm:py-2.5 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-red-400 transition-all hover:bg-red-500/20 hover:text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                        >
                            <span>🚪</span> <span className="hidden sm:inline">{t('logout')}</span>
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                    <div className="p-4 sm:p-8 pb-24">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
