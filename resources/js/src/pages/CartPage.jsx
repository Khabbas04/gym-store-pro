import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader, { StatChip } from '../components/ui/PageHeader';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { getProducts } from '../services/api';
import { formatJOD } from '../utils/currency';

export default function CartPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { t, language } = useLanguage();
    const { items, subtotal, shippingFee, total, updateQuantity, removeItem } = useCart();
    const [recommendations, setRecommendations] = useState([]);

    const preferredCategories = useMemo(
        () => [...new Set(items.map((item) => item.category).filter(Boolean))],
        [items]
    );
    const totalItems = useMemo(
        () => items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
        [items]
    );
    const minQty = 1;
    const maxQty = 20;

    function clampQuantity(value) {
        const next = Number(value);
        if (Number.isNaN(next)) {
            return minQty;
        }

        return Math.min(maxQty, Math.max(minQty, next));
    }

    useEffect(() => {
        getProducts({ per_page: 30 }).then((res) => {
            const products = res.data || [];
            const cartIds = new Set(items.map((item) => item.product_id));

            const smartSorted = products
                .filter((product) => !cartIds.has(product.id))
                .sort((a, b) => {
                    const aScore = (preferredCategories.includes(a.category) ? 2 : 0) + (a.featured ? 1 : 0);
                    const bScore = (preferredCategories.includes(b.category) ? 2 : 0) + (b.featured ? 1 : 0);
                    return bScore - aScore;
                })
                .slice(0, 4);

            setRecommendations(smartSorted);
        }).catch(() => setRecommendations([]));
    }, [items, preferredCategories]);

    return (
        <div className="bg-[#02040a] text-white">
            {/* Minimalist Title Section */}
            <section className="bg-white/5 py-24">
                <div className="mx-auto max-w-[1600px] px-6 sm:px-12">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#f6eace]">{t('nav_cart')}</span>
                    <h1 className="mt-4 text-4xl font-black uppercase tracking-tight sm:text-7xl">{t('your_cart')}</h1>
                </div>
            </section>

            <section className="mx-auto max-w-[1600px] px-6 py-32 sm:px-12">
                <div className="grid gap-24 lg:grid-cols-[1fr_450px]">
                    {/* Cart Items */}
                    <div className="space-y-16">
                        <div className="flex items-center justify-between border-b border-white/5 pb-10 text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">
                            <span>{t('items')} ({totalItems})</span>
                            <Link to="/shop" className="hover:text-[#f6eace] transition-colors">{t('continue_browsing')}</Link>
                        </div>

                        <div className="divide-y divide-white/5">
                            {items.map((item) => {
                                return (
                                    <div key={`${item.product_id}-${item.size || 'nosize'}`} className="grid gap-10 py-16 sm:grid-cols-[220px_1fr]">
                                        <div className="aspect-[3/4] overflow-hidden bg-[#0a1019]">
                                            <img src={item.image || '/images/product-placeholder.svg'} alt={item.name} className="h-full w-full object-cover" />
                                        </div>
                                        <div className="flex flex-col justify-between py-2">
                                            <div className="space-y-4">
                                                <div className="flex items-start justify-between">
                                                    <h3 className="text-xl font-black uppercase tracking-widest text-white leading-tight">{item.name}</h3>
                                                    <p className="text-xl font-black text-[#f6eace]">{formatJOD(item.price, language)}</p>
                                                </div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">{t('size')}: {item.size || t('standard')}</p>
                                            </div>

                                            <div className="mt-12 flex items-center justify-between">
                                                <div className="flex items-center gap-10">
                                                    <button
                                                        onClick={() => updateQuantity(item.product_id, item.size, clampQuantity(item.quantity - 1))}
                                                        className="text-white/40 hover:text-white transition-colors text-xl font-light"
                                                    >
                                                        -
                                                    </button>
                                                    <span className="text-sm font-black w-10 text-center">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.product_id, item.size, clampQuantity(item.quantity + 1))}
                                                        className="text-white/40 hover:text-white transition-colors text-xl font-light"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={() => removeItem(item.product_id, item.size)}
                                                    className="text-[10px] font-black uppercase tracking-widest text-red-400/40 hover:text-red-400 transition-colors"
                                                >
                                                    {t('remove')}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {!items.length && (
                                <div className="py-32 text-center">
                                    <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-600">{t('cart_empty')}</p>
                                    <Link to="/shop" className="mt-12 inline-block border-b-2 border-[#f6eace] pb-2 text-[11px] font-black uppercase tracking-[0.4em] text-white">
                                        {t('continue_browsing')}
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Order Summary */}
                    <aside>
                        <div className="bg-white/5 p-12">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white border-b border-white/5 pb-8">{t('order_summary')}</h2>
                            <div className="mt-12 space-y-8">
                                <div className="flex justify-between text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                                    <span>{t('subtotal')}</span>
                                    <span>{formatJOD(subtotal, language)}</span>
                                </div>
                                <div className="flex justify-between text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                                    <span>{t('shipping')}</span>
                                    <span>{formatJOD(shippingFee, language)}</span>
                                </div>
                                <div className="border-t border-white/5 pt-10 flex justify-between text-2xl font-black uppercase tracking-widest text-white">
                                    <span>{t('total')}</span>
                                    <span className="text-[#f6eace]">{formatJOD(total, language)}</span>
                                </div>
                            </div>

                            <button
                                disabled={!items.length}
                                onClick={() => navigate(user ? '/checkout' : '/login')}
                                className="mt-16 w-full bg-[#f6eace] py-6 text-sm font-black uppercase tracking-[0.2em] text-black transition-transform active:scale-95 disabled:opacity-50"
                            >
                                {t('proceed_checkout')}
                            </button>

                            <div className="mt-10 pt-10 border-t border-white/5">
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 leading-relaxed">
                                    {t('shipping_rule_hint')}
                                </p>
                            </div>
                        </div>
                    </aside>
                </div>
            </section>

            {/* Recommendations */}
            {recommendations.length > 0 && (
                <section className="bg-white/5 py-40">
                    <div className="mx-auto max-w-[1600px] px-6 sm:px-12">
                        <div className="mb-24">
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#f6eace]">{t('featured')}</span>
                            <h2 className="mt-4 text-4xl font-black uppercase tracking-tight sm:text-6xl">{t('based_on_cart')}</h2>
                        </div>
                        
                        <div className="grid gap-x-8 gap-y-24 sm:grid-cols-2 lg:grid-cols-4">
                            {recommendations.map((item) => (
                                <Link key={item.id} to={`/shop/${item.id}`} className="group block">
                                    <div className="aspect-[3/4] overflow-hidden bg-[#0a1019]">
                                        <img src={item.image || '/images/product-placeholder.svg'} alt={item.name} className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                                    </div>
                                    <div className="mt-10 space-y-3">
                                        <h3 className="text-sm font-black uppercase tracking-widest text-white group-hover:text-[#f6eace] transition-colors">{item.name}</h3>
                                        <p className="text-sm font-black text-[#f6eace]/80">{formatJOD(item.price, language)}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}



function Line({ label, value, strong = false }) {
    return (
        <div className={`flex items-center justify-between ${strong ? 'border-t border-white/10 pt-3 text-base font-semibold text-[#fff4dd]' : 'text-slate-300'}`}>
            <span>{label}</span>
            <span>{value}</span>
        </div>
    );
}

