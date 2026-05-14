import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PageHeader, { StatChip } from '../components/ui/PageHeader';
import SkeletonCard from '../components/ui/SkeletonCard';
import { useLanguage } from '../context/LanguageContext';
import { getCategories, getProducts } from '../services/api';
import { formatJOD } from '../utils/currency';

export default function ShopPage() {
    const { t, language } = useLanguage();
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
        <div className="bg-[#02040a] text-white">
            {/* Minimalist Title Section */}
            <section className="bg-white/5 py-32">
                <div className="mx-auto max-w-[1600px] px-6 sm:px-12">
                    <span className="text-xs font-black uppercase tracking-[0.4em] text-[#f6eace]">{t('nav_shop')}</span>
                    <h1 className="mt-4 text-4xl font-black uppercase tracking-tight sm:text-7xl">{t('shop_title')}</h1>
                    <p className="mt-8 max-w-2xl text-[11px] font-black uppercase tracking-[0.2em] leading-relaxed text-slate-500">{t('shop_subtitle')}</p>
                </div>
            </section>

            {/* Filter Section - Minimalist */}
            <section className="mx-auto max-w-[1600px] px-6 py-20 sm:px-12">
                <div className="flex flex-wrap items-center gap-10 border-b border-white/5 pb-20">
                    <div className="min-w-[320px] flex-1">
                        <input
                            value={query}
                            onChange={(e) => patchParams({ q: e.target.value })}
                            placeholder={t('shop_search')}
                            className="w-full border-b border-white/10 bg-transparent py-4 text-sm uppercase tracking-widest outline-none transition-colors focus:border-[#f6eace]"
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-10">
                        <div className="flex flex-col gap-2">
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{t('categories')}</span>
                            <select value={category} onChange={(e) => patchParams({ category: e.target.value })} className="bg-transparent text-[11px] font-black uppercase tracking-widest outline-none cursor-pointer hover:text-[#f6eace]">
                                <option value="" className="bg-[#0a1019]">{t('all_categories')}</option>
                                {categories.map((item) => <option key={item} value={item} className="bg-[#0a1019]">{item}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{t('sort_by')}</span>
                            <select value={sort} onChange={(e) => patchParams({ sort: e.target.value })} className="bg-transparent text-[11px] font-black uppercase tracking-widest outline-none cursor-pointer hover:text-[#f6eace]">
                                <option value="latest" className="bg-[#0a1019]">{t('latest')}</option>
                                <option value="price_asc" className="bg-[#0a1019]">{t('price_low')}</option>
                                <option value="price_desc" className="bg-[#0a1019]">{t('price_high')}</option>
                            </select>
                        </div>
                        <button
                            type="button"
                            onClick={() => patchParams({ featured: featured ? '' : '1' })}
                            className={`text-[11px] font-black uppercase tracking-widest transition-colors self-end pb-1 ${featured ? 'text-[#f6eace] border-b border-[#f6eace]' : 'text-slate-400 hover:text-white'}`}
                        >
                            {t('featured_only')}
                        </button>
                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="text-[11px] font-black uppercase tracking-widest text-red-400/80 hover:text-red-400 self-end pb-1"
                            >
                                {t('shop_clear_filters')}
                            </button>
                        )}
                    </div>
                </div>
            </section>

            {/* Products Grid */}
            <section className="mx-auto max-w-[1600px] px-6 py-12 sm:px-12">
                <div className="mb-16 flex items-center justify-between text-[11px] font-black uppercase tracking-[0.3em] text-slate-600">
                    <span>{totalResults} {t('items')}</span>
                    <span className="hidden sm:block">{t('page_of', { current: meta?.current_page || 1, last: meta?.last_page || 1 })}</span>
                </div>

                <div className="grid gap-x-8 gap-y-24 sm:grid-cols-2 lg:grid-cols-3">
                    {loading && Array.from({ length: 6 }).map((_, idx) => (
                        <div key={`skeleton-${idx}`} className="aspect-[3/4] animate-pulse bg-white/5" />
                    ))}

                    {products.map((product) => (
                        <Link key={product.id} to={`/shop/${product.id}`} className="group block">
                            <div className="relative aspect-[3/4] overflow-hidden bg-[#0a1019]">
                                <img
                                    src={product.image || '/images/product-placeholder.svg'}
                                    alt={product.name}
                                    className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
                                <div className="absolute left-6 top-6 flex flex-wrap gap-3">
                                    {product.featured && (
                                        <span className="bg-[#f6eace] px-3 py-1 text-[9px] font-black uppercase tracking-widest text-black">
                                            {t('badge_featured')}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="mt-10 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-white group-hover:text-[#f6eace] transition-colors">
                                        {product.name}
                                    </h3>
                                    <p className="text-sm font-black text-[#f6eace]">
                                        {formatJOD(product.price, language)}
                                    </p>
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                    {product.category}
                                </p>
                            </div>
                        </Link>
                    ))}

                    {!loading && !products.length && (
                        <div className="col-span-full border border-dashed border-white/5 py-40 text-center text-[11px] font-black uppercase tracking-widest text-slate-600">
                            {t('no_products')}
                        </div>
                    )}
                </div>
            </section>

            {/* Pagination */}
            <section className="mx-auto max-w-[1600px] px-6 py-32 sm:px-12">
                <div className="flex items-center justify-between border-t border-white/5 pt-16 text-[11px] font-black uppercase tracking-[0.4em]">
                    <span className="text-slate-600">{t('page_of', { current: meta?.current_page || 1, last: meta?.last_page || 1 })}</span>
                    <div className="flex gap-12">
                        <button 
                            onClick={() => patchParams({ page: Math.max(1, page - 1) })} 
                            disabled={page <= 1} 
                            className="transition-colors hover:text-[#f6eace] disabled:opacity-20"
                        >
                            {t('prev')}
                        </button>
                        <button 
                            onClick={() => patchParams({ page: (meta?.last_page && page < meta.last_page) ? page + 1 : page })} 
                            disabled={meta?.last_page ? page >= meta.last_page : true} 
                            className="transition-colors hover:text-[#f6eace] disabled:opacity-20"
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
