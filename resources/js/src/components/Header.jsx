import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { getProducts } from '../services/api';
import { formatJOD } from '../utils/currency';

export default function Header({ user, onLogout }) {
    const { items, itemsCount, subtotal, updateQuantity, removeItem } = useCart();
    const { t, toggleLanguage, isArabic, language } = useLanguage();
    const [accountOpen, setAccountOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const accountMenuRef = useRef(null);

    // Cart and Search Drawer States
    const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
    const [searchDrawerOpen, setSearchDrawerOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);

    // Sync body overflow when drawers are open
    useEffect(() => {
        if (cartDrawerOpen || searchDrawerOpen || mobileMenuOpen) {
            document.body.classList.add('overflow-hidden');
        } else {
            document.body.classList.remove('overflow-hidden');
        }
    }, [cartDrawerOpen, searchDrawerOpen, mobileMenuOpen]);

    // Listen to custom open-cart-drawer event
    useEffect(() => {
        const handleOpenCart = () => setCartDrawerOpen(true);
        window.addEventListener('open-cart-drawer', handleOpenCart);
        return () => window.removeEventListener('open-cart-drawer', handleOpenCart);
    }, []);

    // Instant Search debounced API call
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        const delayDebounce = setTimeout(() => {
            setSearchLoading(true);
            getProducts({ q: searchQuery, per_page: 5 })
                .then((res) => {
                    setSearchResults(res.data || []);
                })
                .catch(() => {
                    setSearchResults([]);
                })
                .finally(() => setSearchLoading(false));
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [searchQuery]);

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
        <>
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
                    
                    {/* Search Icon */}
                    <button 
                        type="button"
                        onClick={() => setSearchDrawerOpen(true)}
                        className="group flex h-10 w-10 items-center justify-center rounded-full border border-white/5 bg-white/5 transition-all duration-300 hover:border-[#f6eace]/30 hover:bg-[#f6eace]/10 hover:shadow-[0_0_15px_rgba(246,234,206,0.2)]"
                        title={t('shop_search') || 'Search'}
                    >
                        <svg className="h-4 w-4 text-white/80 transition-colors duration-300 group-hover:text-[#f6eace]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </button>

                    {/* Cart Icon (Always visible) */}
                    <button 
                        type="button"
                        onClick={() => setCartDrawerOpen(true)}
                        className="group relative flex h-10 w-10 items-center justify-center rounded-full border border-white/5 bg-white/5 transition-all duration-300 hover:border-[#f6eace]/30 hover:bg-[#f6eace]/10 hover:shadow-[0_0_15px_rgba(246,234,206,0.2)]"
                    >
                        <svg className="h-4 w-4 text-white/80 transition-colors duration-300 group-hover:text-[#f6eace]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        {itemsCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#f6eace] text-[9px] font-black text-black ring-2 ring-[#04080f] animate-in zoom-in duration-300">
                                {itemsCount}
                            </span>
                        )}
                    </button>

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
        </header>

        {/* Mobile Sidebar Menu Drawer */}
            <div className={`fixed inset-0 z-[100] lg:hidden transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                {/* Backdrop */}
                <div onClick={() => setMobileMenuOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                
                {/* Drawer Panel */}
                <div className={`absolute top-0 bottom-0 w-80 max-w-[85vw] bg-[#04080f]/95 backdrop-blur-2xl shadow-2xl flex flex-col transition-transform duration-300 ${
                    isArabic 
                        ? (mobileMenuOpen ? 'right-0 translate-x-0' : 'right-0 translate-x-full') 
                        : (mobileMenuOpen ? 'left-0 translate-x-0' : 'left-0 -translate-x-full')
                }`}>
                    {/* Header of Drawer */}
                    <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 shrink-0">
                        <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3">
                            <img src="/images/icon.png?v=1" alt="Logo" className="h-10 w-10 object-contain brightness-125" />
                            <span className="text-lg font-black uppercase tracking-[0.25em] text-[#f6eace]">SIRIUS</span>
                        </Link>
                        <button onClick={() => setMobileMenuOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white transition-colors">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    {/* Nav Items */}
                    <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
                        <nav className="flex flex-col gap-2">
                            {navItems.map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    end={item.end}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={({ isActive }) => 
                                        `rounded-xl px-5 py-2.5 text-xs font-black uppercase transition-all duration-300 ${isArabic ? 'tracking-normal' : 'tracking-[0.2em]'} ${
                                            isActive 
                                            ? 'bg-[#f6eace]/10 text-[#f6eace] border border-[#f6eace]/20 shadow-[0_0_15px_rgba(246,234,206,0.05)]' 
                                            : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
                                        }`
                                    }
                                >
                                    {item.label}
                                </NavLink>
                            ))}
                        </nav>

                        {/* Bottom Actions */}
                        <div className="mt-auto flex flex-col gap-2 pt-4 border-t border-white/10 shrink-0">
                            <button
                                onClick={() => {
                                    toggleLanguage();
                                    setMobileMenuOpen(false);
                                }}
                                className={`flex items-center justify-between rounded-xl px-5 py-2.5 text-xs font-black uppercase text-white/80 hover:bg-white/5 hover:text-white transition-all border border-white/5 bg-white/5 ${isArabic ? 'tracking-normal' : 'tracking-[0.2em]'}`}
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
                                    className={`flex items-center justify-between rounded-xl px-5 py-2.5 text-xs font-black uppercase text-red-400 hover:bg-red-500/10 transition-all border border-red-500/10 bg-red-500/5 ${isArabic ? 'tracking-normal' : 'tracking-[0.2em]'}`}
                                >
                                    <span>{t('logout')} ({displayUser.split(' ')[0]})</span>
                                    <span>🚪</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Cart Drawer */}
            <div className={`fixed inset-0 z-[110] transition-opacity duration-300 ${cartDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                {/* Backdrop */}
                <div onClick={() => setCartDrawerOpen(false)} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
                
                {/* Drawer Panel */}
                <div className={`absolute top-0 bottom-0 w-96 max-w-[90vw] bg-[#04080f]/95 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col transition-transform duration-300 border-l border-white/5 ${
                    isArabic 
                        ? (cartDrawerOpen ? 'left-0 translate-x-0' : 'left-0 -translate-x-full') 
                        : (cartDrawerOpen ? 'right-0 translate-x-0' : 'right-0 translate-x-full')
                }`}>
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 shrink-0">
                        <div className="flex items-center gap-2">
                            <span className="text-base font-black uppercase tracking-wider text-white">{t('cart_title') || 'Shopping Cart'}</span>
                            <span className="rounded-full bg-[#f6eace]/15 px-2.5 py-0.5 text-xs font-black text-[#f6eace]">{itemsCount}</span>
                        </div>
                        <button onClick={() => setCartDrawerOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white transition-colors">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    {/* Cart Items List */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {items.length === 0 ? (
                            <div className="flex h-full flex-col items-center justify-center text-center space-y-4">
                                <span className="text-4xl">🛒</span>
                                <p className="text-xs font-black uppercase tracking-widest text-slate-500">{t('cart_empty') || 'Your cart is empty'}</p>
                                <Link to="/shop" onClick={() => setCartDrawerOpen(false)} className="rounded-xl bg-[#f6eace] px-6 py-3 text-[10px] font-black uppercase tracking-wider text-black transition-all hover:opacity-90">
                                    {t('explore_shop') || 'Shop Now'}
                                </Link>
                            </div>
                        ) : (
                            items.map((item) => (
                                <div key={`${item.product_id}-${item.size || ''}`} className="flex gap-4 border-b border-white/5 pb-6 last:border-0 last:pb-0">
                                    <div className="h-20 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/40">
                                        <img src={item.image || '/images/product-placeholder.svg'} alt={item.name} className="h-full w-full object-cover" />
                                    </div>
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div>
                                            <h4 className="text-xs font-black text-white line-clamp-1">{item.name}</h4>
                                            <p className="mt-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                                {item.category} {item.size && `• Size: ${item.size}`}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between mt-2">
                                            {/* Qty controller */}
                                            <div className="flex items-center gap-3 bg-white/5 rounded-lg px-2.5 py-1 border border-white/5">
                                                <button onClick={() => updateQuantity(item.product_id, item.size, item.quantity - 1)} className="text-white/60 hover:text-white text-xs">-</button>
                                                <span className="text-[11px] font-black text-white w-4 text-center">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.product_id, item.size, item.quantity + 1)} className="text-white/60 hover:text-white text-xs">+</button>
                                            </div>
                                            <span className="text-xs font-black text-[#f6eace]">{formatJOD(item.price * item.quantity, language)}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => removeItem(item.product_id, item.size)} className="text-slate-500 hover:text-red-400 self-start transition-colors">
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {items.length > 0 && (
                        <div className="border-t border-white/10 p-6 bg-black/40 shrink-0 space-y-4">
                            <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-400">
                                <span>{t('subtotal') || 'Subtotal'}</span>
                                <span className="text-sm text-[#f6eace]">{formatJOD(subtotal, language)}</span>
                            </div>
                            <div className="grid gap-2">
                                <Link to="/cart" onClick={() => setCartDrawerOpen(false)} className="w-full rounded-xl border border-white/10 bg-white/5 py-3.5 text-center text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all">
                                    {t('nav_cart') || 'View Full Cart'}
                                </Link>
                                <Link to="/checkout" onClick={() => setCartDrawerOpen(false)} className="w-full rounded-xl bg-[#f6eace] py-3.5 text-center text-[10px] font-black uppercase tracking-widest text-black hover:opacity-90 transition-all shadow-[0_4px_20px_rgba(246,234,206,0.15)]">
                                    {t('checkout') || 'Checkout'}
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Search Drawer */}
            <div className={`fixed inset-0 z-[110] transition-opacity duration-300 ${searchDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                {/* Backdrop */}
                <div onClick={() => { setSearchDrawerOpen(false); setSearchQuery(''); }} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                
                {/* Drawer Panel */}
                <div className={`absolute top-0 left-0 right-0 bg-[#04080f]/95 border-b border-white/10 shadow-2xl p-6 transition-all duration-300 transform ${
                    searchDrawerOpen ? 'translate-y-0' : '-translate-y-full'
                }`}>
                    <div className="mx-auto max-w-3xl space-y-6">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={t('shop_search') || 'Search Products...'}
                                    className="w-full rounded-xl border border-white/10 bg-black/40 pl-11 pr-4 py-3.5 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-[#f6eace]/40"
                                    autoFocus={searchDrawerOpen}
                                />
                                {searchQuery && (
                                    <button 
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                            <button 
                                onClick={() => { setSearchDrawerOpen(false); setSearchQuery(''); }}
                                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black uppercase text-white hover:bg-white/10"
                            >
                                {t('admin_cancel') || 'Cancel'}
                            </button>
                        </div>

                        {/* Search Results Display */}
                        <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-4">
                            {searchLoading && (
                                <div className="text-center py-8">
                                    <span className="inline-block animate-pulse text-xs font-black text-slate-500 uppercase tracking-widest">
                                        Searching...
                                    </span>
                                </div>
                            )}

                            {!searchLoading && searchQuery && searchResults.length === 0 && (
                                <div className="text-center py-8">
                                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest">
                                        No products found
                                    </p>
                                </div>
                            )}

                            {!searchLoading && searchResults.map((product) => (
                                <Link 
                                    key={product.id}
                                    to={`/shop/${product.id}`}
                                    onClick={() => { setSearchDrawerOpen(false); setSearchQuery(''); }}
                                    className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-3 transition-all hover:border-white/15 hover:bg-white/[0.04] group"
                                >
                                    <div className="h-16 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-black/30 border border-white/5">
                                        <img src={product.image || '/images/product-placeholder.svg'} alt={product.name} className="h-full w-full object-cover" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-xs font-black text-white group-hover:text-[#f6eace] transition-colors">{product.name}</h4>
                                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-1">{product.category}</p>
                                    </div>
                                    <span className="text-xs font-black text-[#f6eace]">{formatJOD(product.price, language)}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

