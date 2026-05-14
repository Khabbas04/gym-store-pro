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
    const orderCount = orders.length;
    const pendingCount = useMemo(
        () => orders.filter((order) => String(order.status || '').toLowerCase() === 'pending').length,
        [orders]
    );
    const totalSpent = useMemo(
        () => orders.reduce((sum, order) => sum + Number(order.total || 0), 0),
        [orders]
    );

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
            <div className="bg-[#02040a] text-white">
                <section className="bg-white/5 py-24">
                    <div className="mx-auto max-w-[1600px] px-6 sm:px-12">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#f6eace]">{t('nav_orders')}</span>
                        <h1 className="mt-4 text-4xl font-black uppercase tracking-tight sm:text-7xl">{t('my_orders')}</h1>
                    </div>
                </section>
                <section className="mx-auto max-w-[1600px] px-6 py-32 sm:px-12">
                    <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-600">{t('please_login_orders')}</p>
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

