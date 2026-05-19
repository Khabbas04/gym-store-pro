import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getProducts, getCollections } from '../services/api';
import { formatJOD } from '../utils/currency';

export default function HomePage() {
    const { user } = useAuth();
    const { t, language } = useLanguage();

    const [featured, setFeatured] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    const [collections, setCollections] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            getProducts({ per_page: 20 }),
            getCollections()
        ]).then(([productsRes, collectionsRes]) => {
            const items = productsRes.data || [];
            setAllProducts(items);
            setFeatured(items.filter(item => item.featured).slice(0, 8));
            
            // Only show active collections on the homepage
            setCollections((collectionsRes || []).filter(c => c.is_active));
        }).finally(() => {
            setLoading(false);
        });
    }, []);

    const categories = useMemo(() => {
        const cats = Array.from(new Set(allProducts.map(p => p.category).filter(Boolean)));
        return cats.slice(0, 4);
    }, [allProducts]);

    const heroProduct = useMemo(() => {
        return featured[0] || allProducts[0];
    }, [featured, allProducts]);

    const handleMouseMove = (e) => {
        const card = e.currentTarget;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
    };

    return (
        <div className="bg-[#02040a] text-white overflow-x-hidden">
            {/* Hero Section - Full Immersive */}
            <section className="relative h-screen w-full">
                <div className="absolute inset-0">
                    <img 
                        src="/images/hero-luxury-v2.png" 
                        alt="Sirius Luxury Gym" 
                        className="h-full w-full object-cover"
                    />
                    {/* Multi-layered overlay for depth */}
                    <div className="absolute inset-0 bg-black/40" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[#02040a]" />
                </div>
                
                <div className="relative flex h-full flex-col items-center justify-center px-6 text-center">
                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        <span className="mb-6 block text-[11px] font-black uppercase tracking-[0.6em] text-[#f6eace] opacity-80">
                            {t('home_hero_caption')}
                        </span>
                        <h1 className="max-w-6xl text-5xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-[#f6eace] to-white sm:text-7xl lg:text-[9rem] leading-[1.15] py-3 animate-in zoom-in-95 duration-1000">
                            {t('home_title')}
                        </h1>
                        <p className="mx-auto mt-12 max-w-2xl text-sm font-medium uppercase tracking-[0.2em] text-slate-400 leading-relaxed">
                            {t('home_brand_subtitle')}
                        </p>
                        <div className="mt-16 flex flex-wrap justify-center gap-8">
                            <Link to="/shop" className="group relative overflow-hidden bg-[#f6eace] px-16 py-6 text-xs font-black uppercase tracking-[0.3em] text-black transition-transform active:scale-95">
                                <span className="relative z-10">{t('explore_shop')}</span>
                                <div className="absolute inset-0 -translate-x-full bg-white transition-transform duration-500 group-hover:translate-x-0" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Scroll hint indicator */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 opacity-30">
                    <div className="h-16 w-[1px] bg-white animate-pulse" />
                </div>
            </section>

            {/* Collections / Categories Grid */}
            <section className="relative overflow-hidden mx-auto max-w-[1600px] px-6 py-40 sm:px-12 border-b border-white/5">
                {/* Background Watermark and Glow */}
                <div className="absolute top-1/4 left-1/10 w-[300px] h-[300px] rounded-full bg-[#f6eace]/5 blur-[120px] pointer-events-none -z-10" />
                <div className="absolute select-none pointer-events-none font-black text-white/[0.015] uppercase leading-none tracking-[0.1em] -z-10 text-[9vw] sm:text-[10vw] right-6 top-16 hidden md:block">
                    COLLECTIONS
                </div>

                <div className="mb-24 flex gap-6 items-start">
                    {/* Vertical Glowing Accent Bar */}
                    <div className="w-[3px] bg-gradient-to-b from-[#f6eace] via-[#f6eace]/50 to-transparent h-16 self-stretch rounded-full" />
                    
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#f6eace] shadow-[0_0_8px_#f6eace]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#f6eace]">
                                {t('categories')}
                            </span>
                        </div>
                        <h2 className="text-3xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-[#f6eace] sm:text-5xl py-2">
                            {t('shop_by_collection')}
                        </h2>
                    </div>
                </div>
                
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                    {collections.map((col, idx) => (
                        <Link 
                            key={col.id} 
                            to={`/shop?collection=${col.id}`} 
                            onMouseMove={handleMouseMove}
                            className="group relative aspect-[3/4] overflow-hidden bg-white/5 rounded-3xl border border-white/10 transition-all hover:border-[#f6eace]/30 spotlight-card"
                        >
                            {col.image ? (
                                <div className="absolute inset-0">
                                    <img 
                                        src={col.image} 
                                        alt={col.name} 
                                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                    />
                                    {/* Overlay for legibility */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent transition-opacity duration-500 group-hover:opacity-90" />
                                </div>
                            ) : (
                                <>
                                    <div className="absolute inset-0 flex items-center justify-center text-8xl font-black text-white/5 transition-transform duration-700 group-hover:scale-150">
                                        {idx + 1}
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                                </>
                            )}
                            
                            <div className="absolute inset-0 flex flex-col items-center justify-end p-8 pb-12 z-10">
                                <h3 className="text-xl font-black uppercase tracking-widest text-center transition-transform duration-500 group-hover:-translate-y-2 text-white">{col.name}</h3>
                                {col.description && (
                                    <p className="mt-4 text-[10px] text-center text-slate-300 opacity-0 transition-all duration-500 group-hover:opacity-100 line-clamp-2">
                                        {col.description}
                                    </p>
                                )}
                                <span className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-[#f6eace] opacity-0 transition-all duration-500 group-hover:opacity-100">{t('view_collection')}</span>
                            </div>
                        </Link>
                    ))}
                    
                    {collections.length === 0 && (
                        <div className="col-span-full text-center text-slate-500 text-xs font-black uppercase tracking-widest py-10">
                            {t('admin_no_collections')}
                        </div>
                    )}
                </div>
            </section>

            {/* Featured Selection - High Contrast Gallery */}
            <section className="relative overflow-hidden py-40 border-b border-white/5">
                {/* Background Watermark and Glow */}
                <div className="absolute top-1/4 right-1/10 w-[300px] h-[300px] rounded-full bg-white/[0.01] blur-[150px] pointer-events-none -z-10" />
                <div className="absolute select-none pointer-events-none font-black text-white/[0.015] uppercase leading-none tracking-[0.1em] -z-10 text-[9vw] sm:text-[10vw] left-6 top-16 hidden md:block">
                    FEATURED
                </div>

                <div className="mx-auto max-w-[1600px] px-6 sm:px-12">
                    <div className="mb-24 flex gap-6 items-start">
                        {/* Vertical Glowing Accent Bar */}
                        <div className="w-[3px] bg-gradient-to-b from-[#f6eace] via-[#f6eace]/50 to-transparent h-16 self-stretch rounded-full" />
                        
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#f6eace] shadow-[0_0_8px_#f6eace]" />
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#f6eace]">
                                    {t('featured')}
                                </span>
                            </div>
                            <h2 className="text-3xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-[#f6eace] sm:text-5xl">
                                {t('featured_picks')}
                            </h2>
                        </div>
                    </div>

                    <div className="grid gap-x-8 gap-y-20 sm:grid-cols-2 lg:grid-cols-4">
                        {featured.map((product) => (
                            <Link key={product.id} to={`/shop/${product.id}`} className="group block">
                                <div 
                                    onMouseMove={handleMouseMove}
                                    className="relative aspect-[4/5] overflow-hidden bg-[#0a1019] rounded-3xl border border-white/10 transition-all duration-500 group-hover:border-[#f6eace]/35 group-hover:shadow-[0_15px_30px_rgba(246,234,206,0.06)] spotlight-card"
                                >
                                    <img 
                                        src={product.image || '/images/product-placeholder.svg'} 
                                        alt={product.name} 
                                        className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                                    />
                                    <div className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-transparent" />
                                    {product.featured && (
                                        <div className="absolute left-6 top-6 bg-[#f6eace] px-3 py-1 text-[9px] font-black uppercase tracking-widest text-black rounded-lg">
                                            {t('badge_featured')}
                                        </div>
                                    )}
                                </div>
                                <div className="mt-8 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-black uppercase tracking-widest text-white group-hover:text-[#f6eace] transition-colors">{product.name}</h3>
                                        <p className="text-sm font-black text-[#f6eace]">{formatJOD(product.price, language)}</p>
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{product.category}</p>
                                </div>
                            </Link>
                        ))}
                    </div>

                    <div className="mt-32 text-center">
                        <Link to="/shop" className="inline-block border-b-2 border-[#f6eace] pb-2 text-[11px] font-black uppercase tracking-[0.4em] text-white hover:text-[#f6eace] transition-colors">
                            {t('view_all')}
                        </Link>
                    </div>
                </div>
            </section>

            {/* Stats - Minimalist Row */}
            <section className="relative overflow-hidden py-32 border-b border-white/5">
                {/* Background Watermark */}
                <div className="absolute select-none pointer-events-none font-black text-white/[0.012] uppercase leading-none tracking-[0.1em] -z-10 text-[9vw] sm:text-[10vw] right-6 top-1/2 -translate-y-1/2 hidden md:block">
                    STATS
                </div>
                <div className="mx-auto max-w-[1600px] px-6 sm:px-12">
                    <div className="grid grid-cols-1 gap-16 sm:grid-cols-3">
                        <div className="text-center">
                            <p className="text-4xl font-black text-white">50+</p>
                            <p className="mt-4 text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">{t('happy_customers')}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-4xl font-black text-white">100%</p>
                            <p className="mt-4 text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">{t('premium_quality')}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-4xl font-black text-white">24h</p>
                            <p className="mt-4 text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">{t('fast_delivery')}</p>
                        </div>
                    </div>
                </div>
            </section>

            {loading && (
                <div className="fixed bottom-12 right-12 z-50">
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#f6eace] border-t-transparent" />
                </div>
            )}
        </div>
    );
}



