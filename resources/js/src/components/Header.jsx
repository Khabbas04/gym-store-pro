import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';

export default function Header({ user, onLogout }) {
    const { itemsCount } = useCart();
    const { t, toggleLanguage } = useLanguage();
    const [accountOpen, setAccountOpen] = useState(false);
    const accountMenuRef = useRef(null);

    const navItems = useMemo(() => {
        const baseItems = [
            { to: '/', label: t('nav_home'), end: true },
            { to: '/shop', label: t('nav_shop') },
            { to: '/cart', label: t('nav_cart'), badge: itemsCount },
            { to: '/wishlist', label: t('nav_wishlist') },
            { to: '/orders', label: t('nav_orders') },
        ];

        if (user?.role === 'admin') {
            baseItems.push({ to: '/admin', label: t('nav_dashboard') });
        }

        return baseItems;
    }, [itemsCount, t, user]);

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
        <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-black/60 backdrop-blur-2xl">
            <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-4 sm:px-12">
                <div className="flex items-center gap-12">
                    <Link to="/" className="flex items-center gap-3">
                        <img
                            src="/images/icon.png?v=1"
                            alt="Logo"
                            className="h-10 w-10 object-contain brightness-110"
                        />
                        <span className="text-xl font-black uppercase tracking-[0.3em] text-white">SIRIUS</span>
                    </Link>

                    <nav className="hidden lg:flex items-center gap-8">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.end}
                                className={({ isActive }) => 
                                    `text-[11px] font-black uppercase tracking-[0.2em] transition-colors hover:text-[#f6eace] ${
                                        isActive ? 'text-[#f6eace]' : 'text-slate-400'
                                    }`
                                }
                            >
                                {item.label}
                                {item.badge ? (
                                    <span className="ml-2 rounded-full bg-[#f6eace] px-1.5 py-0.5 text-[9px] font-black text-black">
                                        {item.badge}
                                    </span>
                                ) : null}
                            </NavLink>
                        ))}
                    </nav>
                </div>

                <div className="flex items-center gap-6" ref={accountMenuRef}>
                    <button
                        onClick={toggleLanguage}
                        className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 hover:text-white"
                    >
                        {t('language')}
                    </button>

                    {user ? (
                        <div className="relative">
                            <button
                                onClick={() => setAccountOpen(!accountOpen)}
                                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 transition-colors hover:bg-white/10"
                            >
                                <span className="text-[10px] font-black uppercase tracking-[0.1em] text-white">
                                    {displayUser}
                                </span>
                                <svg className={`h-3 w-3 text-slate-400 transition-transform ${accountOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {accountOpen && (
                                <div className="absolute right-0 mt-3 w-48 rounded-xl border border-white/10 bg-[#0a1019] p-2 shadow-2xl">
                                    <div className="px-3 py-2 border-b border-white/5 mb-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                            {user.role === 'admin' ? t('role_admin') : t('role_user')}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setAccountOpen(false);
                                            onLogout();
                                        }}
                                        className="w-full rounded-lg px-3 py-2 text-right text-[11px] font-black uppercase tracking-widest text-red-400 hover:bg-red-400/10"
                                    >
                                        {t('logout')}
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <Link to="/login" className="text-[10px] font-black uppercase tracking-[0.2em] text-white hover:text-[#f6eace]">
                                {t('login')}
                            </Link>
                            <Link to="/register" className="rounded-full bg-white px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-black transition-transform hover:scale-105 active:scale-95">
                                {t('signup')}
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

