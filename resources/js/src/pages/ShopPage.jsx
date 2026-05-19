import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PageHeader, { StatChip } from '../components/ui/PageHeader';
import SkeletonCard from '../components/ui/SkeletonCard';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { getCategories, getProducts } from '../services/api';
import { formatJOD } from '../utils/currency';

export default function ShopPage() {
    const { t, language } = useLanguage();
    const { addItem } = useCart();
    const { pushToast } = useToast();
    const [searchParams, setSearchParams] = useSearchParams();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [meta, setMeta] = useState(null);
    const [loading, setLoading] = useState(true);

    const query = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const sort = searchParams.get('sort') || 'latest';
    const featured = searchParams.get('featured') || '';
    const page = Number(searchParams.get('page') || 1);
    const totalResults = meta?.total ?? products.length;
    const hasActiveFilters = Boolean(query || category || featured);

    const handleMouseMove = (e) => {
        const card = e.currentTarget;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
    };

    const handleQuickAdd = (e, product, size = null) => {
        e.preventDefault();
        e.stopPropagation();
        addItem(product, 1, size);
        pushToast(t('added_to_cart'), 'success');
        window.dispatchEvent(new Event('open-cart-drawer'));
    };

    useEffect(() => {
        getCategories().then(setCategories).catch(() => {});
    }, []);

    useEffect(() => {
        setLoading(true);
        getProducts({ q: query, category, sort, featured, page, per_page: 9 }).then((res) => {
            setProducts(res.data || []);
            setMeta(res.meta || null);
        }).catch(() => {
            setProducts([]);
            setMeta(null);
        }).finally(() => setLoading(false));
    }, [query, category, sort, featured, page]);

    function patchParams(next) {
        const merged = {
            q: query,
            category,
            sort,
            featured,
            page: 1,
            ...next,
        };

        Object.keys(merged).forEach((key) => {
            if (!merged[key]) {
                delete merged[key];
            }
        });

        setSearchParams(merged);
    }

    function clearFilters() {
        setSearchParams({});
    }

    return (
        <div className="bg-[#02040a] text-white min-h-screen relative overflow-hidden">
            {/* Ambient Background Lights */}
            <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full bg-[#f6eace]/5 blur-[120px] pointer-events-none -z-10" />
            <div className="absolute top-1/2 left-1/4 w-[600px] h-[600px] rounded-full bg-white/[0.02] blur-[150px] pointer-events-none -z-10" />

            {/* Immersive Premium Header */}
            <PageHeader
                eyebrow={t('nav_shop')}
                title={t('shop_title')}
                subtitle={t('shop_subtitle')}
                watermark="SHOP"
            />

            {/* Filter Section - Premium Glass Panel */}
            <section className="mx-auto max-w-[1600px] px-6 py-8 sm:px-12">
                <div className="rounded-3xl border border-white/5 bg-white/[0.01] p-8 backdrop-blur-md space-y-10">
                    
                    {/* Top Row: Search and Quick Sorting */}
                    <div className="flex flex-col lg:flex-row gap-6 justify-between items-stretch lg:items-center">
                        {/* Premium Search Input */}
                        <div className="flex-1 relative">
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
                            <input
                                value={query}
                                onChange={(e) => patchParams({ q: e.target.value })}
                                placeholder={t('shop_search')}
                                className="w-full rounded-2xl border border-white/10 bg-black/40 pl-12 pr-5 py-4 text-sm font-bold placeholder-slate-500 outline-none transition-all focus:border-[#f6eace]/40 focus:ring-1 focus:ring-[#f6eace]/40"
                            />
                            {query && (
                                <button 
                                    onClick={() => patchParams({ q: '' })}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-black"
                                >
                                    CLEAR
                                </button>
                            )}
                        </div>

                        {/* Dropdowns & Toggles */}
                        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                            {/* Sort Dropdown */}
                            <div className="relative min-w-[160px]">
                                <select 
                                    value={sort} 
                                    onChange={(e) => patchParams({ sort: e.target.value })} 
                                    className="w-full appearance-none rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-xs font-black uppercase tracking-widest outline-none cursor-pointer hover:border-white/20 transition-all text-white/80"
                                >
                                    <option value="latest" className="bg-[#0a1019] text-white">{t('latest')}</option>
                                    <option value="price_asc" className="bg-[#0a1019] text-white">{t('price_low')}</option>
                                    <option value="price_desc" className="bg-[#0a1019] text-white">{t('price_high')}</option>
                                </select>
                                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-[10px]">▼</span>
                            </div>

                            {/* Featured Filter Toggle Button */}
                            <button
                                type="button"
                                onClick={() => patchParams({ featured: featured ? '' : '1' })}
                                className={`rounded-2xl border px-6 py-4 text-xs font-black uppercase tracking-widest transition-all ${
                                    featured 
                                        ? 'border-[#f6eace] bg-[#f6eace] text-black shadow-[0_4px_20px_rgba(246,234,206,0.15)]' 
                                        : 'border-white/10 bg-black/40 text-slate-400 hover:border-white/20 hover:text-white'
                                }`}
                            >
                                {t('featured_only')}
                            </button>

                            {/* Clear All Filters */}
                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="rounded-2xl border border-red-500/10 bg-red-500/5 px-6 py-4 text-xs font-black uppercase tracking-widest text-red-400 hover:border-red-500/20 hover:bg-red-500/10 transition-all"
                                >
                                    {t('shop_clear_filters')}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Bottom Row: Category Horizontal Glass Navigation */}
                    <div className="border-t border-white/5 pt-8">
                        <div className="flex items-center gap-4 overflow-x-auto pb-4 scrollbar-none">
                            <button
                                onClick={() => patchParams({ category: '' })}
                                className={`flex-shrink-0 rounded-full px-6 py-2.5 text-xs font-black uppercase tracking-widest transition-all ${
                                    !category 
                                        ? 'bg-[#f6eace] text-black shadow-md' 
                                        : 'border border-white/10 bg-white/5 text-slate-300 hover:border-white/20'
                                }`}
                            >
                                {t('all_categories')}
                            </button>
                            {categories.map((item) => (
                                <button
                                    key={item}
                                    onClick={() => patchParams({ category: item })}
                                    className={`flex-shrink-0 rounded-full px-6 py-2.5 text-xs font-black uppercase tracking-widest transition-all ${
                                        category === item 
                                            ? 'bg-[#f6eace] text-black shadow-md' 
                                            : 'border border-white/10 bg-white/5 text-slate-300 hover:border-white/20'
                                    }`}
                                >
                                    {item}
                                </button>
                            ))}
                        </div>
                    </div>

                </div>
            </section>

            {/* Products Grid */}
            <section className="mx-auto max-w-[1600px] px-6 py-12 sm:px-12">
                {/* Result count metadata header */}
                <div className="mb-16 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                    <span className="bg-white/5 px-4 py-1.5 rounded-full border border-white/5">{totalResults} {t('items')}</span>
                    <span className="hidden sm:block bg-white/5 px-4 py-1.5 rounded-full border border-white/5">{t('page_of', { current: meta?.current_page || 1, last: meta?.last_page || 1 })}</span>
                </div>

                <div className="grid gap-x-8 gap-y-24 sm:grid-cols-2 lg:grid-cols-3">
                    {loading && Array.from({ length: 6 }).map((_, idx) => (
                        <div key={`skeleton-${idx}`} className="aspect-[3/4] rounded-3xl animate-pulse bg-white/5 border border-white/5" />
                    ))}

                    {!loading && products.map((product) => (
                        <div key={product.id} className="group relative flex flex-col">
                            {/* Product Detail Link Wrapper */}
                            <Link to={`/shop/${product.id}`} className="block relative aspect-[3/4] overflow-hidden bg-[#0a1019] rounded-3xl border border-white/10 transition-all duration-500 group-hover:border-[#f6eace]/35 group-hover:shadow-[0_15px_30px_rgba(246,234,206,0.06)] spotlight-card">
                                <img
                                    src={product.image || '/images/product-placeholder.svg'}
                                    alt={product.name}
                                    className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                    onMouseMove={handleMouseMove}
                                />
                                <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
                                
                                {/* Badges */}
                                <div className="absolute left-6 top-6 flex flex-wrap gap-3">
                                    {product.featured && (
                                        <span className="bg-[#f6eace] px-3 py-1 text-[9px] font-black uppercase tracking-widest text-black rounded-lg">
                                            {t('badge_featured')}
                                        </span>
                                    )}
                                </div>

                                {/* Modern Quick Add to Cart sizes drawer panel on hover */}
                                <div className="absolute left-4 right-4 bottom-4 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 z-20">
                                    <div className="bg-black/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 space-y-3">
                                        <p className="text-[9px] font-black text-center text-slate-400 uppercase tracking-widest">
                                            {product.sizes && product.sizes.length > 0 ? t('select_size') || 'Quick Add Size' : t('add_to_cart')}
                                        </p>
                                        <div className="flex flex-wrap justify-center gap-2">
                                            {product.sizes && product.sizes.length > 0 ? (
                                                product.sizes.map((sz) => (
                                                    <button
                                                        key={sz}
                                                        onClick={(e) => handleQuickAdd(e, product, sz)}
                                                        className="min-w-[40px] bg-white/5 border border-white/10 hover:border-[#f6eace] hover:bg-[#f6eace] hover:text-black transition-all rounded-lg py-1.5 text-[9px] font-black uppercase"
                                                    >
                                                        {sz}
                                                    </button>
                                                ))
                                            ) : (
                                                <button
                                                    onClick={(e) => handleQuickAdd(e, product, null)}
                                                    className="w-full bg-[#f6eace] text-black hover:opacity-90 transition-all rounded-lg py-2 text-[9px] font-black uppercase tracking-wider"
                                                >
                                                    {t('add_to_cart')}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Link>

                            {/* Card Footer details */}
                            <div className="mt-8 px-2 space-y-3">
                                <div className="flex items-center justify-between gap-4">
                                    <Link to={`/shop/${product.id}`} className="text-sm font-black uppercase tracking-widest text-white hover:text-[#f6eace] transition-colors line-clamp-1">
                                        {product.name}
                                    </Link>
                                    <p className="text-sm font-black text-[#f6eace] shrink-0">
                                        {formatJOD(product.price, language)}
                                    </p>
                                </div>
                                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                    <span>{product.category}</span>
                                    {/* Stars review mock for luxury aesthetics */}
                                    <span className="text-[#f6eace]/60">★★★★★</span>
                                </div>
                            </div>
                        </div>
                    ))}

                    {!loading && !products.length && (
                        <div className="col-span-full rounded-3xl border border-dashed border-white/10 py-40 text-center space-y-6">
                            <div className="text-5xl">🔍</div>
                            <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                                {t('no_products') || 'No products found'}
                            </p>
                            <button
                                onClick={clearFilters}
                                className="rounded-xl border border-[#f6eace]/30 bg-[#f6eace]/5 hover:bg-[#f6eace]/10 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-[#f6eace] transition-all"
                            >
                                {t('shop_clear_filters')}
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {/* Pagination */}
            <section className="mx-auto max-w-[1600px] px-6 py-24 sm:px-12">
                <div className="flex items-center justify-between border-t border-white/5 pt-16 text-[10px] font-black uppercase tracking-[0.4em]">
                    <span className="text-slate-500">{t('page_of', { current: meta?.current_page || 1, last: meta?.last_page || 1 })}</span>
                    <div className="flex gap-8">
                        <button 
                            onClick={() => patchParams({ page: Math.max(1, page - 1) })} 
                            disabled={page <= 1} 
                            className="rounded-xl border border-white/10 px-5 py-3 hover:border-[#f6eace] hover:text-[#f6eace] disabled:opacity-20 transition-all"
                        >
                            {t('prev')}
                        </button>
                        <button 
                            onClick={() => patchParams({ page: (meta?.last_page && page < meta.last_page) ? page + 1 : page })} 
                            disabled={meta?.last_page ? page >= meta.last_page : true} 
                            className="rounded-xl border border-white/10 px-5 py-3 hover:border-[#f6eace] hover:text-[#f6eace] disabled:opacity-20 transition-all"
                        >
                            {t('next')}
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}



function FilterChip({ text }) {
    return (
        <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold text-slate-200">
            {text}
        </span>
    );
}
