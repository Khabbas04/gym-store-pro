import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import PageHeader, { StatChip } from '../components/ui/PageHeader';
import { getMyOrders, upsertProductReview } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { formatJOD } from '../utils/currency';

export default function OrdersPage() {
    const location = useLocation();
    const { user } = useAuth();
    const { t, language } = useLanguage();
    const { pushToast } = useToast();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const orderCount = orders.length;

    // Review Modal States
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [activeProductId, setActiveProductId] = useState(null);
    const [activeProductName, setActiveProductName] = useState('');
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);

    const handleOpenReviewModal = (productId, productName) => {
        setActiveProductId(productId);
        setActiveProductName(productName);
        setRating(5);
        setComment('');
        setReviewModalOpen(false);
        setTimeout(() => setReviewModalOpen(true), 50);
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!comment.trim()) {
            pushToast(language === 'ar' ? 'الرجاء كتابة تعليقك' : 'Please enter your comment', 'error');
            return;
        }
        setSubmittingReview(true);
        try {
            await upsertProductReview(activeProductId, { rating, comment });
            pushToast(language === 'ar' ? 'تم إرسال تقييمك للأدمن للموافقة عليه بنجاح!' : 'Your review was submitted for admin approval!', 'success');
            setReviewModalOpen(false);
        } catch (err) {
            pushToast(err.message || (language === 'ar' ? 'فشل إرسال التقييم' : 'Failed to submit review'), 'error');
        } finally {
            setSubmittingReview(false);
        }
    };

    const pendingCount = useMemo(
        () => orders.filter((order) => String(order.status || '').toLowerCase() === 'pending').length,
        [orders]
    );
    const totalSpent = useMemo(
        () => orders.reduce((sum, order) => sum + Number(order.total || 0), 0),
        [orders]
    );

    const orderDetails = location.state?.orderDetails;
    const orderText = useMemo(() => {
        if (!orderDetails) return '';
        const itemsList = (orderDetails.items || []).map(
            item => `• ${item.product_name || item.name} (${item.size || 'N/A'}) x${item.quantity}`
        ).join('\n');

        return language === 'ar' ? (
            `مرحباً SIRIUS، أود تأكيد طلبي:\n\n` +
            `📦 *رقم الطلب:* ${orderDetails.order_number}\n` +
            `👤 *الاسم:* ${orderDetails.customer_name}\n` +
            `📞 *الهاتف:* ${orderDetails.phone}\n` +
            `📍 *المحافظة:* ${orderDetails.city}\n` +
            `🏠 *العنوان:* ${orderDetails.address_line}\n\n` +
            `🛍️ *المنتجات:*\n${itemsList}\n\n` +
            `💵 *المجموع الإجمالي:* ${orderDetails.total} JOD\n` +
            (orderDetails.notes ? `📝 *ملاحظات:* ${orderDetails.notes}\n` : '') +
            `\nشكراً لكم!`
        ) : (
            `Hello SIRIUS, I'd like to confirm my order:\n\n` +
            `📦 *Order Number:* ${orderDetails.order_number}\n` +
            `👤 *Name:* ${orderDetails.customer_name}\n` +
            `📞 *Phone:* ${orderDetails.phone}\n` +
            `📍 *Governorate:* ${orderDetails.city}\n` +
            `🏠 *Address:* ${orderDetails.address_line}\n\n` +
            `🛍️ *Products:*\n${itemsList}\n\n` +
            `💵 *Total Price:* ${orderDetails.total} JOD\n` +
            (orderDetails.notes ? `📝 *Notes:* ${orderDetails.notes}\n` : '') +
            `\nThank you!`
        );
    }, [orderDetails, language]);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        getMyOrders().then((result) => {
            setOrders(result.data || []);
        }).catch((e) => {
            setError(e.message || t('error_fetch_orders_failed'));
        }).finally(() => setLoading(false));
    }, [user, t]);

    if (!user) {
        return (
            <div className="bg-transparent text-white">
                <PageHeader
                    eyebrow={t('nav_orders')}
                    title={t('my_orders')}
                    subtitle={t('orders_subtitle')}
                    watermark="ORDERS"
                />
                <section className="mx-auto max-w-[1600px] px-6 py-32 sm:px-12">
                    {location.state?.orderNumber ? (
                        <div className="space-y-12 max-w-2xl mx-auto">
                            <div className="bg-[#f6eace]/5 border border-[#f6eace]/10 p-8 sm:p-10 rounded-2xl space-y-8 backdrop-blur-md">
                                <div className="space-y-4 text-center sm:text-right">
                                    <h3 className="text-2xl font-black uppercase tracking-[0.1em] text-[#f6eace]">
                                        {language === 'ar' ? 'تم تقديم طلبك بنجاح! 🎉' : 'Order Placed Successfully! 🎉'}
                                    </h3>
                                    <p className="text-sm text-slate-300 leading-relaxed">
                                        {language === 'ar'
                                            ? `رقم طلبك هو: ${location.state.orderNumber}. لتأكيد طلبك وتجهيزه سريعاً للشحن، يرجى نسخ تفاصيل الطلب بالأسفل ومشاركتها معنا عبر رسائل حساب إنستغرام الخاص بنا.`
                                            : `Your order number is: ${location.state.orderNumber}. To confirm your order and secure fast shipping, please copy the order details below and share them with us via Direct Message (DM) on our Instagram.`}
                                    </p>
                                    <p className="text-sm text-slate-400 font-medium leading-relaxed">
                                        {language === 'ar'
                                            ? 'اضغط على زر النسخ بالأسفل لنسخ رقم وتفاصيل الطلب، ثم انقر على "افتح إنستغرام" لتأكيده معنا مباشرة!'
                                            : 'Click the copy button below to copy your ticket details, then click "Open Instagram" to message us and confirm directly!'}
                                    </p>
                                </div>

                                {orderText && (
                                    <div className="relative group rounded-xl overflow-hidden border border-white/10 bg-black/50 p-6">
                                        <pre className="text-xs font-mono text-[#f6eace] whitespace-pre-wrap select-all pr-12 leading-relaxed text-right dir-rtl">
                                            {orderText}
                                        </pre>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(orderText);
                                                setCopied(true);
                                                setTimeout(() => setCopied(false), 2000);
                                            }}
                                            className="absolute left-4 top-4 bg-[#f6eace] text-black px-4 py-2 rounded-lg font-bold text-xs hover:bg-[#fff2d6] transition-all hover:scale-105 active:scale-95 shadow-md"
                                        >
                                            {copied ? (language === 'ar' ? '✓ تم النسخ' : '✓ Copied') : (language === 'ar' ? 'نسخ التفاصيل' : 'Copy Details')}
                                        </button>
                                    </div>
                                )}

                                <div className="pt-4 flex justify-center">
                                    <a
                                        href="https://www.instagram.com/sirius.jo_/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-primary px-8 py-3.5 text-sm uppercase tracking-wider font-black flex items-center gap-3 bg-[#f6eace] hover:bg-[#fff2d6] text-black rounded-full transition-transform hover:scale-105"
                                    >
                                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                                        </svg>
                                        {language === 'ar' ? 'افتح إنستغرام sirius.jo_' : 'Open Instagram sirius.jo_'}
                                    </a>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-600">{t('please_login_orders')}</p>
                    )}
                </section>
            </div>
        );
    }

    return (
        <div className="bg-[#02040a] text-white">
            <PageHeader
                eyebrow={t('nav_orders')}
                title={t('my_orders')}
                subtitle={t('orders_subtitle')}
                watermark="ORDERS"
            />

            <section className="mx-auto max-w-[1600px] px-6 py-32 sm:px-12">
                <div className="mb-16 border-b border-white/5 pb-10 text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">
                    <span>{orderCount} {t('nav_orders')}</span>
                </div>

                <div className="space-y-10">
                    {location.state?.orderNumber && (
                        <div className="bg-emerald-500/5 border border-emerald-500/10 px-10 py-8 mb-16">
                            <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-400">
                                {t('order_success', { orderNumber: location.state.orderNumber })}
                            </p>
                        </div>
                    )}

                    {error && <p className="text-red-400 font-black uppercase tracking-widest text-[11px]">{error}</p>}
                    {loading && <p className="text-slate-600 font-black uppercase tracking-widest text-[11px]">{t('loading_orders')}</p>}

                    <div className="divide-y divide-white/5">
                        {!loading && orders.map((order) => (
                            <div key={order.id} className="py-12 space-y-8 border-b border-white/5 last:border-0">
                                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 items-center">
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">{language === 'ar' ? 'رقم الطلب' : 'Order Number'}</h4>
                                        <p className="text-sm font-black uppercase tracking-[0.2em] text-white">{order.order_number}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">{language === 'ar' ? 'التاريخ' : 'Date'}</h4>
                                        <p className="text-xs font-black uppercase tracking-[0.1em] text-slate-300">
                                            {new Date(order.created_at).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">{language === 'ar' ? 'الحالة' : 'Status'}</h4>
                                        <span className="inline-block text-[10px] font-black uppercase tracking-[0.3em] text-[#f6eace]">
                                            {statusLabel(order.status, t)}
                                        </span>
                                    </div>
                                    <div className="sm:text-right">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">{language === 'ar' ? 'المجموع' : 'Total'}</h4>
                                        <p className="text-xl font-black text-[#f6eace]">{formatJOD(order.total, language)}</p>
                                    </div>
                                </div>

                                <div className="space-y-4 bg-white/[0.02] border border-white/5 p-6 sm:p-8 rounded-3xl">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4">{language === 'ar' ? 'المنتجات المطلوبة' : 'Ordered Items'}</h4>
                                    <div className="divide-y divide-white/5">
                                        {order.items?.map((item) => (
                                            <div key={item.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 py-6 first:pt-0 last:pb-0">
                                                <div className="flex items-center gap-4">
                                                    <img src={item.image || '/images/product-placeholder.svg'} alt={item.product_name} className="h-16 w-16 object-cover rounded-2xl border border-white/10" />
                                                    <div className="space-y-1">
                                                        <h5 className="text-sm font-black text-white">{item.product_name}</h5>
                                                        <p className="text-[10px] text-slate-500 font-medium">
                                                            {item.size ? `${language === 'ar' ? 'المقاس' : 'Size'}: ${item.size} | ` : ''}{language === 'ar' ? 'الكمية' : 'Qty'}: {item.quantity}
                                                        </p>
                                                    </div>
                                                </div>
                                                
                                                <button
                                                    onClick={() => handleOpenReviewModal(item.product_id, item.product_name)}
                                                    className="sm:self-center bg-white/5 hover:bg-[#f6eace] hover:text-black border border-white/10 text-white transition-all text-[10px] font-black uppercase tracking-[0.2em] px-6 py-3 rounded-xl active:scale-95 text-center"
                                                >
                                                    {language === 'ar' ? 'تقييم المنتج' : 'Review Product'}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {!loading && !orders.length && (
                            <div className="py-40 text-center">
                                <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-700">{t('no_orders')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Review Modal */}
            {reviewModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/85 backdrop-blur-md">
                    <div className="relative w-full max-w-lg bg-[#0a1019]/95 border border-white/10 p-8 sm:p-12 rounded-3xl shadow-[0_20px_50px_rgba(246,234,206,0.05)] text-right animate-fade-in" style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}>
                        <button 
                            onClick={() => setReviewModalOpen(false)}
                            className="absolute top-6 left-6 text-slate-400 hover:text-white transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div className="space-y-8">
                            <div className="space-y-3">
                                <span className="text-[9px] font-black uppercase tracking-widest text-[#f6eace] block">
                                    {language === 'ar' ? 'تقييم المنتج' : 'Product Review'}
                                </span>
                                <h3 className="text-xl font-black text-white uppercase tracking-tight">
                                    {activeProductName}
                                </h3>
                            </div>

                            <form onSubmit={handleSubmitReview} className="space-y-8">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">
                                        {language === 'ar' ? 'التقييم بالنجوم' : 'Star Rating'}
                                    </label>
                                    <div className={`flex gap-3 ${language === 'ar' ? 'justify-end' : 'justify-start'}`}>
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setRating(star)}
                                                className="text-2xl transition-transform active:scale-90"
                                            >
                                                <span className={star <= rating ? 'text-[#f6eace]' : 'text-white/10'}>
                                                    ★
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">
                                        {language === 'ar' ? 'رأيك بالمنتج' : 'Your Review'}
                                    </label>
                                    <textarea
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        rows={4}
                                        className="w-full border-b border-white/10 bg-transparent py-4 text-sm outline-none transition-colors focus:border-[#f6eace] placeholder:text-slate-700 text-white"
                                        placeholder={language === 'ar' ? 'شاركونا تفاصيل تجربتكم ورأيكم بالخامة والمقاس...' : 'Share your feedback about quality, fit...'}
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={submittingReview}
                                    className="w-full bg-[#f6eace] py-5 text-xs font-black uppercase tracking-[0.2em] text-black transition-transform active:scale-95 disabled:opacity-50 rounded-xl"
                                >
                                    {submittingReview 
                                        ? (language === 'ar' ? 'جاري الإرسال...' : 'Submitting...') 
                                        : (language === 'ar' ? 'إرسال التقييم' : 'Submit Review')}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function statusLabel(status, t) {
    const key = `status_${String(status || '').toLowerCase()}`;
    const translated = t(key);
    return translated === key ? status : translated;
}
