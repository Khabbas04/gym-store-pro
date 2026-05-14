import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader, { StatChip } from '../components/ui/PageHeader';
import SkeletonCard from '../components/ui/SkeletonCard';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { getMyWishlist, toggleWishlist } from '../services/api';
import { formatJOD } from '../utils/currency';

export default function WishlistPage() {
    const { user } = useAuth();
    const { t, language } = useLanguage();
    const { pushToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]);
    const categoryCount = useMemo(
        () => new Set(items.map((item) => item.category).filter(Boolean)).size,
        [items]
    );

    async function loadWishlist() {
        setLoading(true);
        try {
            const result = await getMyWishlist({ per_page: 30 });
            setItems(result.data || []);
        } catch {
            setItems([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        loadWishlist();
    }, [user]);

    if (!user) {
        return (
            <div className="bg-[#02040a] text-white">
                <section className="bg-white/5 py-24">
                    <div className="mx-auto max-w-[1600px] px-6 sm:px-12">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#f6eace]">{t('nav_wishlist')}</span>
                        <h1 className="mt-4 text-4xl font-black uppercase tracking-tight sm:text-7xl">{t('wishlist_title')}</h1>
                    </div>
                </section>
                <section className="mx-auto max-w-[1600px] px-6 py-32 sm:px-12">
                    <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-600">{t('wishlist_login_required')}</p>
                </section>
            </div>
        );
    }

    return (
        <div className="bg-[#02040a] text-white">
            {/* Minimalist Title Section */}
            <section className="bg-white/5 py-24">
                <div className="mx-auto max-w-[1600px] px-6 sm:px-12">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#f6eace]">{t('nav_wishlist')}</span>
                    <h1 className="mt-4 text-4xl font-black uppercase tracking-tight sm:text-7xl">{t('wishlist_title')}</h1>
                </div>
            </section>

            <section className="mx-auto max-w-[1600px] px-6 py-32 sm:px-12">
                <div className="mb-16 border-b border-white/5 pb-10 text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">
                    <span>{items.length} {t('items')}</span>
                </div>

                <div className="grid gap-x-8 gap-y-24 sm:grid-cols-2 lg:grid-cols-3">
                    {loading && Array.from({ length: 3 }).map((_, idx) => (
                        <div key={`wl-s-${idx}`} className="aspect-[3/4] animate-pulse bg-white/5" />
                    ))}

                    {!loading && items.map((product) => (
                        <div key={product.id} className="group block">
                            <div className="relative aspect-[3/4] overflow-hidden bg-[#0a1019]">
                                <Link to={`/shop/${product.id}`}>
                                    <img src={product.image || '/images/product-placeholder.svg'} alt={product.name} className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                                </Link>
                                <div className="absolute right-6 top-6">
                                    <button
                                        onClick={async () => {
                                            await toggleWishlist(product.id);
                                            setItems((prev) => prev.filter((entry) => entry.id !== product.id));
                                            pushToast(t('wishlist_removed'), 'success');
                                        }}
                                        className="h-10 w-10 bg-black/60 text-white backdrop-blur-md transition-colors hover:bg-red-500 hover:text-white flex items-center justify-center font-light text-xl"
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                            <div className="mt-10 space-y-3">
                                <h3 className="text-sm font-black uppercase tracking-widest text-white group-hover:text-[#f6eace] transition-colors">{product.name}</h3>
                                <p className="text-sm font-black text-[#f6eace]">{formatJOD(product.price, language)}</p>
                            </div>
                        </div>
                    ))}

                    {!loading && !items.length && (
                        <div className="col-span-full py-40 text-center">
                            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-600">{t('wishlist_empty')}</p>
                            <Link to="/shop" className="mt-12 inline-block border-b-2 border-[#f6eace] pb-2 text-[11px] font-black uppercase tracking-[0.4em] text-white">
                                {t('continue_browsing')}
                            </Link>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}


