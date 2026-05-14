import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageHeader, { StatChip } from '../components/ui/PageHeader';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { getMyWishlist, getProduct, getProductReviews, markRecentlyViewed, toggleWishlist, upsertProductReview } from '../services/api';
import { formatJOD } from '../utils/currency';

export default function ProductPage() {
    const { id } = useParams();
    const { user } = useAuth();
    const { addItem } = useCart();
    const { t, language } = useLanguage();
    const { pushToast } = useToast();
    const [product, setProduct] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [error, setError] = useState('');
    const [size, setSize] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [message, setMessage] = useState('');
    const [wishlisted, setWishlisted] = useState(false);
    const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
    const [reviewBusy, setReviewBusy] = useState(false);
    const stockQuantity = Number(product?.stock_quantity);
    const isInStock = !product || Number.isNaN(stockQuantity) ? true : stockQuantity > 0;
    const relatedProducts = product?.related_products || [];
    const alsoBoughtProducts = product?.customers_also_bought || [];

    useEffect(() => {
        Promise.all([
            getProduct(id),
            getProductReviews(id).catch(() => ({ data: [] })),
        ])
            .then(([result, reviewsResult]) => {
                setProduct(result);
                setReviews(reviewsResult.data || []);
                const firstSize = result?.sizes?.[0] || '';
                setSize(firstSize);

                const key = 'sirius_recently_viewed';
                const current = JSON.parse(localStorage.getItem(key) || '[]');
                const next = [result.id, ...current.filter((entry) => entry !== result.id)].slice(0, 8);
                localStorage.setItem(key, JSON.stringify(next));

                if (user) {
                    markRecentlyViewed(result.id).catch(() => {});
                    getMyWishlist({ per_page: 100 }).then((wishlistResult) => {
                        const exists = (wishlistResult.data || []).some((entry) => entry.id === result.id);
                        setWishlisted(exists);
                    }).catch(() => setWishlisted(false));
                }
            })
                .catch(() => setError(t('error_product_not_found')));
            }, [id, t, user]);

    if (error) {
        return <p className="rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-red-200">{error}</p>;
    }

    if (!product) {
        return <p className="text-slate-300">{t('loading_product')}</p>;
    }

    return (
        <div className="bg-[#02040a] text-white">
            {/* Minimalist Breadcrumb Section */}
            <section className="bg-white/5 py-20">
                <div className="mx-auto max-w-[1600px] px-6 sm:px-12">
                    <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.4em] text-[#f6eace]">
                        <Link to="/shop" className="hover:text-white transition-colors">{t('nav_shop')}</Link>
                        <span className="text-white/20">/</span>
                        <span className="text-white/40">{product.category}</span>
                    </div>
                </div>
            </section>

            {/* Product Details Section */}
            <section className="mx-auto max-w-[1600px] px-6 py-32 sm:px-12">
                <div className="grid gap-24 lg:grid-cols-2">
                    {/* Image Gallery */}
                    <div className="aspect-[3/4] overflow-hidden bg-[#0a1019]">
                        <img 
                            src={product.image || '/images/product-placeholder.svg'} 
                            alt={product.name} 
                            className="h-full w-full object-cover" 
                        />
                    </div>

                    {/* Info */}
                    <div className="flex flex-col">
                        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-[#f6eace]">
                            {product.category}
                            <span className="h-1 w-1 rounded-full bg-white/20" />
                            {isInStock ? (
                                <span className="text-emerald-400">{t('in_stock') || 'In Stock'}</span>
                            ) : (
                                <span className="text-red-400">{t('out_of_stock')}</span>
                            )}
                        </div>

                        <h1 className="mt-8 text-4xl font-black uppercase tracking-tight sm:text-7xl leading-tight">
                            {product.name}
                        </h1>
                        
                        <p className="mt-10 text-3xl font-black text-[#f6eace]">
                            {formatJOD(product.price, language)}
                        </p>

                        <div className="mt-16 space-y-12 border-y border-white/5 py-16">
                            {/* Sizes */}
                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">{t('size')}</h4>
                                <div className="flex flex-wrap gap-4">
                                    {(product.sizes || []).map((optionSize) => (
                                        <button
                                            key={optionSize}
                                            onClick={() => setSize(optionSize)}
                                            className={`min-w-[70px] border px-6 py-4 text-[11px] font-black uppercase tracking-widest transition-all ${
                                                size === optionSize 
                                                ? 'border-[#f6eace] bg-[#f6eace] text-black' 
                                                : 'border-white/10 text-white hover:border-white/30'
                                            }`}
                                        >
                                            {optionSize}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Quantity */}
                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">{t('qty')}</h4>
                                <div className="flex items-center gap-8">
                                    <button 
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="text-2xl font-light text-white/40 hover:text-white transition-colors"
                                    >
                                        -
                                    </button>
                                    <span className="text-sm font-black w-10 text-center">{quantity}</span>
                                    <button 
                                        onClick={() => setQuantity(Math.min(20, quantity + 1))}
                                        className="text-2xl font-light text-white/40 hover:text-white transition-colors"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-16 flex flex-col gap-6">
                            <button
                                disabled={!isInStock}
                                onClick={() => {
                                    addItem(product, quantity, size || null);
                                    pushToast(t('added_to_cart'), 'success');
                                }}
                                className="w-full bg-[#f6eace] py-6 text-sm font-black uppercase tracking-[0.2em] text-black transition-transform active:scale-95 disabled:opacity-50"
                            >
                                {isInStock ? t('add_to_cart') : t('out_of_stock')}
                            </button>
                            
                            {user && (
                                <button
                                    onClick={async () => {
                                        try {
                                            const result = await toggleWishlist(product.id);
                                            setWishlisted(Boolean(result.wishlisted));
                                            pushToast(result.wishlisted ? t('wishlist_added') : t('wishlist_removed'), 'success');
                                        } catch {
                                            pushToast(t('wishlist_update_failed'), 'error');
                                        }
                                    }}
                                    className={`w-full border py-6 text-sm font-black uppercase tracking-[0.2em] transition-all ${
                                        wishlisted ? 'border-[#f6eace] text-[#f6eace]' : 'border-white/10 text-white hover:border-white/30'
                                    }`}
                                >
                                    {wishlisted ? t('wishlisted') : t('add_to_wishlist')}
                                </button>
                            )}
                        </div>

                        {/* Description */}
                        <div className="mt-20 space-y-8">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">{t('admin_description')}</h4>
                            <p className="text-lg leading-relaxed text-slate-400 font-medium">
                                {product.description}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Reviews Section */}
            <section className="bg-white/5 py-40">
                <div className="mx-auto max-w-[1600px] px-6 sm:px-12">
                    <div className="mb-24">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#f6eace]">{t('reviews')}</span>
                        <h2 className="mt-4 text-4xl font-black uppercase tracking-tight sm:text-6xl">{t('customers_feedback') || 'Customer Feedback'}</h2>
                    </div>

                    <div className="grid gap-24 lg:grid-cols-2">
                        {/* Review List */}
                        <div className="space-y-16">
                            {reviews.map((review) => (
                                <div key={review.id} className="border-b border-white/5 pb-16 last:border-0">
                                    <div className="flex items-center justify-between mb-8">
                                        <h4 className="text-sm font-black uppercase tracking-widest text-white">
                                            {review.user?.name || t('customer')}
                                        </h4>
                                        <div className="flex gap-2">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <div key={i} className={`h-1 w-6 ${i < review.rating ? 'bg-[#f6eace]' : 'bg-white/5'}`} />
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-sm font-medium leading-relaxed text-slate-400">
                                        {review.comment}
                                    </p>
                                </div>
                            ))}
                            {!reviews.length && <p className="text-[11px] font-black uppercase tracking-widest text-slate-600">{t('no_reviews_yet')}</p>}
                        </div>

                        {/* Review Form */}
                        {user && (
                            <div className="bg-white/5 p-16">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white">{t('write_your_review')}</h4>
                                <form
                                    className="mt-12 space-y-10"
                                    onSubmit={async (e) => {
                                        e.preventDefault();
                                        setReviewBusy(true);
                                        try {
                                            await upsertProductReview(product.id, reviewForm);
                                            const latest = await getProductReviews(product.id);
                                            setReviews(latest.data || []);
                                            setReviewForm({ rating: 5, comment: '' });
                                            pushToast(t('review_saved'), 'success');
                                        } finally {
                                            setReviewBusy(false);
                                        }
                                    }}
                                >
                                    <div className="space-y-4">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">{t('rating') || 'Rating'}</label>
                                        <select
                                            value={reviewForm.rating}
                                            onChange={(e) => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}
                                            className="w-full border-b border-white/10 bg-transparent py-4 text-sm outline-none transition-colors focus:border-[#f6eace] cursor-pointer"
                                        >
                                            {[5, 4, 3, 2, 1].map((s) => <option key={s} value={s} className="bg-[#0a1019]">{s} / 5</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">{t('write_your_review')}</label>
                                        <textarea
                                            value={reviewForm.comment}
                                            onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                                            rows={4}
                                            className="w-full border-b border-white/10 bg-transparent py-4 text-sm outline-none transition-colors focus:border-[#f6eace] placeholder:text-slate-700"
                                            placeholder={t('review_placeholder') || 'Share your thoughts...'}
                                        />
                                    </div>
                                    <button 
                                        disabled={reviewBusy}
                                        className="w-full bg-[#f6eace] py-6 text-sm font-black uppercase tracking-[0.2em] text-black transition-transform active:scale-95 disabled:opacity-50"
                                    >
                                        {reviewBusy ? t('saving') : t('submit_review')}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Recommendations */}
            <section className="mx-auto max-w-[1600px] px-6 py-40 sm:px-12">
                <div className="mb-24">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#f6eace]">{t('featured')}</span>
                    <h2 className="mt-4 text-4xl font-black uppercase tracking-tight sm:text-6xl">{t('related_products')}</h2>
                </div>
                
                <div className="grid gap-x-8 gap-y-24 sm:grid-cols-2 lg:grid-cols-4">
                    {relatedProducts.slice(0, 4).map((item) => (
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
            </section>
        </div>
    );
}


