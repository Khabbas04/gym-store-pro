import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';

export default function Header({ user, onLogout }) {
    const { itemsCount } = useCart();
    const { t, toggleLanguage } = useLanguage();
    const [accountOpen, setAccountOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const accountMenuRef = useRef(null);

    const navItems = useMemo(() => {
        const baseItems = [
            { to: '/', label: t('nav_home'), end: true },
            { to: '/shop', label: t('nav_shop') },
        ];

        if (user) {
            baseItems.push({ to: '/wishlist', label: t('nav_wishlist') });
            baseItems.push({ to: '/orders', label: t('nav_orders') });
        }

        if (user?.role === 'admin') {
            baseItems.push({ to: '/admin', label: t('nav_dashboard') });
        }

        return baseItems;
    }, [t, user]);

    useEffect(() => {
        function onPointerDown(event) {
            if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) {
                setAccountOpen(false);
            }
        }

        document.addEventListener('mousedown', onPointerDown);
        return () => document.removeEventListener('mousedown', onPointerDown);
    }, []);

    const displayUser = user?.name || user?.email || 'User';

    return (
        <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#04080f]/80 backdrop-blur-xl shadow-lg">
            <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-3 sm:px-8">
                
                {/* 1. Brand (Left) */}
                <div className="flex items-center justify-start lg:w-1/3">
                    <Link to="/" className="group flex items-center gap-3">
                        <img
                            src="/images/icon.png?v=1"
                            alt="Logo"
                            className="h-10 w-10 sm:h-16 sm:w-16 object-contain brightness-125 transition-transform duration-500 group-hover:scale-110"
                        />
                        <span className="text-xl sm:text-2xl font-black uppercase tracking-[0.25em] text-white transition-colors duration-300 group-hover:text-[#f6eace]">SIRIUS</span>
                    </Link>
                </div>

                {/* 2. Navigation (Center) */}
                <div className="hidden lg:flex w-1/3 items-center justify-center">
                    <nav className="flex items-center gap-2 rounded-full border border-white/5 bg-black/40 px-3 py-2 shadow-inner">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.end}
                                className={({ isActive }) => 
                                    `relative rounded-full px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                                        isActive 
                                        ? 'bg-white/10 text-[#f6eace] shadow-sm' 
                                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                    }`
                                }
                            >
                                {item.label}
                            </NavLink>
                        ))}
                    </nav>
                </div>

                {/* 3. Actions (Right) */}
                <div className="flex items-center justify-end gap-2 sm:gap-3 lg:w-1/3" ref={accountMenuRef}>
                    
                    {/* Cart Icon (Always visible) */}
                    <Link to="/cart" className="group relative flex h-10 w-10 items-center justify-center rounded-full border border-white/5 bg-white/5 transition-all duration-300 hover:border-[#f6eace]/30 hover:bg-[#f6eace]/10 hover:shadow-[0_0_15px_rgba(246,234,206,0.2)]">
                        <svg className="h-4 w-4 text-white/80 transition-colors duration-300 group-hover:text-[#f6eace]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        {itemsCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#f6eace] text-[9px] font-black text-black ring-2 ring-[#04080f] animate-in zoom-in duration-300">
                                {itemsCount}
                            </span>
                        )}
                    </Link>

                    {/* Language Toggle (Desktop only) */}
                    <button
                        onClick={toggleLanguage}
                        className="hidden lg:flex h-10 w-10 items-center justify-center rounded-full border border-white/5 bg-white/5 transition-all duration-300 hover:border-white/20 hover:bg-white/10"
                        title={t('language')}
                    >
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/70">
                            {t('language') === 'English' ? 'EN' : 'AR'}
                        </span>
                    </button>

                    {/* User Menu (Desktop only) */}
                    {user ? (
                        <div className="relative hidden lg:block">
                            <button
                                onClick={() => setAccountOpen(!accountOpen)}
                                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 transition-all duration-300 hover:border-white/20 hover:bg-white/10"
                            >
                                <span className="text-[10px] font-black uppercase tracking-[0.1em] text-white">
                                    {displayUser.split(' ')[0]}
                                </span>
                                <svg className={`h-3 w-3 text-slate-400 transition-transform duration-300 ${accountOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {accountOpen && (
                                <div className="absolute right-0 mt-3 w-48 overflow-hidden rounded-2xl border border-white/10 bg-[#0a1019]/95 backdrop-blur-xl p-1 shadow-[0_10px_40px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="px-4 py-3 border-b border-white/5 bg-white/[0.02]">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                                            {user.role === 'admin' ? t('role_admin') : t('role_user')}
                                        </p>
                                    </div>
                                    <div className="p-1">
                                        <button
                                            onClick={() => {
                                                setAccountOpen(false);
                                                onLogout();
                                            }}
                                            className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-red-500/10 transition-colors"
                                        >
                                            {t('logout')}
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : null}

                    {/* Mobile Hamburger Menu Toggle */}
                    <button
                        onClick={() => setMobileMenuOpen(true)}
                        className="flex lg:hidden h-10 w-10 items-center justify-center rounded-full border border-white/5 bg-white/5 transition-all duration-300 hover:border-white/20 hover:bg-white/10"
                    >
                        <svg className="h-5 w-5 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Mobile Fullscreen Drawer */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-[100] flex flex-col bg-[#04080f]/95 backdrop-blur-3xl animate-in slide-in-from-bottom-5 fade-in duration-300 lg:hidden">
                    <div className="flex items-center justify-between px-4 py-4 sm:px-8 border-b border-white/10">
                        <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3">
                            <img src="/images/icon.png?v=1" alt="Logo" className="h-12 w-12 object-contain brightness-125" />
                            <span className="text-xl font-black uppercase tracking-[0.25em] text-[#f6eace]">SIRIUS</span>
                        </Link>
                        <button onClick={() => setMobileMenuOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white transition-colors">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col gap-6">
                        <nav className="flex flex-col gap-3">
                            {navItems.map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    end={item.end}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={({ isActive }) => 
                                        `rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                                            isActive 
                                            ? 'bg-white/10 text-[#f6eace] border border-[#f6eace]/20 shadow-[0_0_15px_rgba(246,234,206,0.05)]' 
                                            : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
                                        }`
                                    }
                                >
                                    {item.label}
                                </NavLink>
                            ))}
                        </nav>

                        <div className="mt-auto flex flex-col gap-3 pt-6 border-t border-white/10">
                            <button
                                onClick={() => {
                                    toggleLanguage();
                                    setMobileMenuOpen(false);
                                }}
                                className="flex items-center justify-between rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-[0.2em] text-white/80 hover:bg-white/5 hover:text-white transition-all border border-white/5 bg-white/5"
                            >
                                <span>{t('language') === 'English' ? 'Switch to Arabic' : 'التبديل للانجليزية'}</span>
                                <span>🌐</span>
                            </button>

                            {user && (
                                <button
                                    onClick={() => {
                                        setMobileMenuOpen(false);
                                        onLogout();
                                    }}
                                    className="flex items-center justify-between rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-[0.2em] text-red-400 hover:bg-red-500/10 transition-all border border-red-500/10 bg-red-500/5"
                                >
                                    <span>{t('logout')} ({displayUser.split(' ')[0]})</span>
                                    <span>🚪</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}

