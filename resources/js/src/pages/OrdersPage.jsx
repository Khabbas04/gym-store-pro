import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import PageHeader, { StatChip } from '../components/ui/PageHeader';
import { getMyOrders } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { formatJOD } from '../utils/currency';

export default function OrdersPage() {
    const location = useLocation();
    const { user } = useAuth();
    const { t, language } = useLanguage();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const orderCount = orders.length;
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
                <section className="bg-white/5 py-24">
                    <div className="mx-auto max-w-[1600px] px-6 sm:px-12">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#f6eace]">{t('nav_orders')}</span>
                        <h1 className="mt-4 text-4xl font-black uppercase tracking-tight sm:text-7xl">{t('my_orders')}</h1>
                    </div>
                </section>
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
                                            ? `رقم طلبك هو: ${location.state.orderNumber}. لقد فتحنا صفحة الإنستغرام الخاصة بنا sirius.jo_ في تبويب جديد لتأكيد طلبك.`
                                            : `Your order number is: ${location.state.orderNumber}. We have opened our Instagram page sirius.jo_ in a new tab to confirm your order.`}
                                    </p>
                                    <p className="text-sm text-slate-400 font-medium leading-relaxed">
                                        {language === 'ar'
                                            ? 'الرجاء نسخ تفاصيل الطلب أدناه وإرسالها لنا في رسالة خاصة (DM) على إنستغرام لتأكيد طلبك وتوصيله فوراً!'
                                            : 'Please copy the order details below and send them to us in a direct message (DM) on Instagram to confirm your order for fast delivery!'}
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
            {/* Minimalist Title Section */}
            <section className="bg-white/5 py-24">
                <div className="mx-auto max-w-[1600px] px-6 sm:px-12">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#f6eace]">{t('nav_orders')}</span>
                    <h1 className="mt-4 text-4xl font-black uppercase tracking-tight sm:text-7xl">{t('my_orders')}</h1>
                </div>
            </section>

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
                            <div key={order.id} className="grid gap-12 py-12 lg:grid-cols-[300px_1fr_200px] items-center">
                                <div>
                                    <p className="text-sm font-black uppercase tracking-[0.2em] text-white">{order.order_number}</p>
                                    <p className="mt-4 text-[10px] font-black uppercase tracking-[0.1em] text-slate-600">
                                        {new Date(order.created_at).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-slate-400">{order.city} - {order.address_line}</p>
                                    <span className="inline-block text-[9px] font-black uppercase tracking-[0.3em] text-[#f6eace]/40">
                                        {statusLabel(order.status, t)}
                                    </span>
                                </div>
                                <div className="lg:text-right">
                                    <p className="text-xl font-black text-[#f6eace]">{formatJOD(order.total, language)}</p>
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
        </div>
    );
}

function statusLabel(status, t) {
    const key = `status_${String(status || '').toLowerCase()}`;
    const translated = t(key);
    return translated === key ? status : translated;
}

