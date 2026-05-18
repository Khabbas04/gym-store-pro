import React, { useEffect, useMemo, useState } from 'react';
import {
    createProduct,
    deleteAdminOrder,
    deleteProduct,
    getAdminActivityLogs,
    getAdminDashboard,
    getAdminOrders,
    getAdminUsers,
    getProducts,
    updateAdminOrder,
    updateAdminOrderStatus,
    updateAdminProductInventory,
} from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { formatJOD } from '../utils/currency';

const INITIAL_FORM = {
    name: '',
    description: '',
    price: '',
    image: '',
    category: '',
    sizes: '',
    featured: false,
    stock_quantity: 24,
    is_popular: false,
};

export default function AdminPage({ section = 'overview' }) {
    const { t, language } = useLanguage();
    const [dashboard, setDashboard] = useState(null);
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [users, setUsers] = useState([]);
    const [activityLogs, setActivityLogs] = useState([]);
    const [productDrafts, setProductDrafts] = useState({});
    const [savingProductId, setSavingProductId] = useState(null);
    const [form, setForm] = useState(INITIAL_FORM);
    const [ordersQuery, setOrdersQuery] = useState({ q: '', status: '' });
    const [usersQuery, setUsersQuery] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [editingOrderId, setEditingOrderId] = useState(null);
    const [orderForm, setOrderForm] = useState({
        status: 'pending',
        customer_name: '',
        customer_email: '',
        phone: '',
        city: '',
        address_line: '',
        payment_method: 'cod',
        notes: '',
    });
    const [activityQuery, setActivityQuery] = useState('');
    const stats = useMemo(() => dashboard?.stats ?? {}, [dashboard]);

    useEffect(() => {
        reload();
    }, [ordersQuery, usersQuery, activityQuery, section]);

    useEffect(() => {
        const nextDrafts = {};

        products.forEach((product) => {
            nextDrafts[product.id] = {
                stock_quantity: Number(product.stock_quantity || 0),
                is_popular: Boolean(product.is_popular),
            };
        });

        setProductDrafts(nextDrafts);
    }, [products]);

    async function reload() {
        setError('');

        try {
            const [dashboardResult, productsResult, ordersResult, usersResult] = await Promise.allSettled([
                getAdminDashboard(),
                getProducts({ per_page: 50 }),
                getAdminOrders({ per_page: 15, ...ordersQuery }),
                getAdminUsers({ q: usersQuery, per_page: 15 }),
            ]);

            if (dashboardResult.status === 'fulfilled') {
                setDashboard(dashboardResult.value);
            }

            if (productsResult.status === 'fulfilled') {
                setProducts(productsResult.value.data || []);
            }

            if (ordersResult.status === 'fulfilled') {
                setOrders(ordersResult.value.data || []);
            }

            if (usersResult.status === 'fulfilled') {
                setUsers(usersResult.value.data || []);
            }

            if (section === 'activity') {
                try {
                    const activityData = await getAdminActivityLogs({ q: activityQuery, per_page: 15 });
                    setActivityLogs(activityData.data || []);
                } catch {
                    setActivityLogs([]);
                }
            }

            if (
                dashboardResult.status === 'rejected'
                && productsResult.status === 'rejected'
                && ordersResult.status === 'rejected'
                && usersResult.status === 'rejected'
            ) {
                setError(t('admin_error_load_dashboard'));
            }
        } catch {
            setError(t('admin_error_load_dashboard'));
        }
    }

    function onInputChange(event) {
        const { name, value, type, checked } = event.target;
        setForm((previous) => ({
            ...previous,
            [name]: type === 'checkbox' ? checked : value,
        }));
    }

    async function onCreate(event) {
        event.preventDefault();
        setError('');
        setMessage('');

        try {
            await createProduct(form);
            setMessage(t('admin_msg_product_created'));
            setForm(INITIAL_FORM);
            await reload();
        } catch (e) {
            setError(e.message || t('admin_error_create_failed'));
        }
    }

    async function onDelete(productId) {
        setError('');
        setMessage('');

        try {
            await deleteProduct(productId);
            setMessage(t('admin_msg_product_deleted'));
            await reload();
        } catch (e) {
            setError(e.message || t('admin_error_delete_failed'));
        }
    }

    function onProductDraftChange(productId, changes) {
        setProductDrafts((previous) => ({
            ...previous,
            [productId]: {
                ...(previous[productId] || {}),
                ...changes,
            },
        }));
    }

    async function onQuickUpdateProduct(productId) {
        setError('');
        setMessage('');

        const draft = productDrafts[productId] || { stock_quantity: 0, is_popular: false };

        try {
            setSavingProductId(productId);
            await updateAdminProductInventory(productId, {
                stock_quantity: Math.max(0, Number(draft.stock_quantity || 0)),
                is_popular: Boolean(draft.is_popular),
            });

            setProducts((previous) => previous.map((item) => {
                if (item.id !== productId) {
                    return item;
                }

                return {
                    ...item,
                    stock_quantity: Math.max(0, Number(draft.stock_quantity || 0)),
                    is_popular: Boolean(draft.is_popular),
                };
            }));

            setMessage(t('admin_save'));
        } catch (e) {
            setError(e.message || t('admin_error_create_failed'));
        } finally {
            setSavingProductId(null);
        }
    }

    async function onUpdateOrderStatus(orderId, status) {
        setError('');
        setMessage('');

        try {
            await updateAdminOrderStatus(orderId, status);
            setMessage(t('admin_msg_order_status_updated'));
            await reload();
        } catch (e) {
            setError(e.message || t('admin_error_update_order_status'));
        }
    }

    function openOrderEditor(order) {
        setEditingOrderId(order.id);
        setOrderForm({
            status: order.status || 'pending',
            customer_name: order.customer_name || '',
            customer_email: order.customer_email || '',
            phone: order.phone || '',
            city: order.city || '',
            address_line: order.address_line || '',
            payment_method: order.payment_method || 'cod',
            notes: order.notes || '',
        });
    }

    function closeOrderEditor() {
        setEditingOrderId(null);
    }

    function onOrderFormChange(event) {
        const { name, value } = event.target;
        setOrderForm((previous) => ({ ...previous, [name]: value }));
    }

    async function onSaveOrderEdits(event) {
        event.preventDefault();
        if (!editingOrderId) {
            return;
        }

        setError('');
        setMessage('');

        try {
            await updateAdminOrder(editingOrderId, orderForm);
            setMessage(t('admin_order_updated'));
            closeOrderEditor();
            await reload();
        } catch (e) {
            setError(e.message || t('admin_order_update_failed'));
        }
    }

    async function onDeleteOrder(orderId) {
        if (!window.confirm(t('admin_confirm_delete_order'))) {
            return;
        }

        setError('');
        setMessage('');

        try {
            await deleteAdminOrder(orderId);
            setMessage(t('admin_order_deleted'));
            if (editingOrderId === orderId) {
                closeOrderEditor();
            }
            await reload();
        } catch (e) {
            setError(e.message || t('admin_order_delete_failed'));
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {error && (
                <div className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200 shadow-lg">
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    <p className="font-medium">{error}</p>
                </div>
            )}
            {message && (
                <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-200 shadow-lg">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="font-medium">{message}</p>
                </div>
            )}

            {section === 'overview' && (
                <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="space-y-6">
                        {/* Metrics Grid */}
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <Metric label={t('admin_metric_revenue')} value={formatJOD(stats.total_revenue || 0, language)} icon="💰" />
                            <Metric label={t('admin_metric_orders')} value={stats.total_orders ?? 0} icon="📦" />
                            <Metric label={t('admin_metric_pending')} value={stats.pending_orders ?? 0} icon="⏳" highlight={stats.pending_orders > 0} />
                            <Metric label={t('admin_metric_today')} value={stats.orders_today ?? 0} icon="🔥" />
                            <Metric label={t('admin_metric_products')} value={stats.total_products ?? 0} icon="👟" />
                            <Metric label={t('admin_metric_users')} value={stats.total_users ?? 0} icon="👥" />
                        </div>

                        {/* Sales Chart */}
                        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.01] p-6 backdrop-blur-2xl">
                            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#f6eace]/20 to-transparent" />
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#f6eace]">{t('admin_sales_last_7_days')}</h3>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Live Metrics</span>
                            </div>
                            
                            <div className="mt-12 grid grid-cols-7 gap-2 items-end h-44 px-2">
                                {(dashboard?.sales_last_7_days || []).map((day) => {
                                    const max = Math.max(...(dashboard?.sales_last_7_days || []).map((x) => x.total), 1);
                                    const height = Math.max(12, (day.total / max) * 110);
                                    return (
                                        <div key={day.date} className="text-center flex flex-col items-center justify-end h-full group relative">
                                            {/* Beautiful Tooltip */}
                                            <div className="pointer-events-none absolute bottom-[125px] z-20 scale-90 rounded-lg border border-white/10 bg-black/95 px-3 py-1.5 text-[10px] font-black text-[#f6eace] opacity-0 shadow-2xl transition-all duration-200 group-hover:translate-y-[-4px] group-hover:scale-100 group-hover:opacity-100 whitespace-nowrap">
                                                {formatJOD(day.total, language)}
                                            </div>
                                            <div 
                                                className="w-full max-w-[28px] rounded-t-lg bg-gradient-to-t from-[#f6eace]/20 to-[#f6eace] transition-all duration-300 group-hover:from-[#f6eace] group-hover:to-white group-hover:shadow-[0_0_15px_rgba(246,234,206,0.4)]" 
                                                style={{ height: `${height}px` }} 
                                            />
                                            <p className="mt-3 text-[9px] font-black uppercase tracking-wider text-slate-500">{day.date.slice(5)}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Recent Orders */}
                    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.01] p-6 backdrop-blur-2xl">
                        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#f6eace]/20 to-transparent" />
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#f6eace] mb-6">{t('admin_recent_orders')}</h3>
                        <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                            {(dashboard?.recent_orders || []).map((order) => (
                                <div key={order.id} className="group relative rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-all duration-300 hover:border-white/10 hover:bg-white/[0.04]">
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-widest text-white group-hover:text-[#f6eace] transition-colors">{order.order_number}</p>
                                            <p className="mt-1 text-[11px] font-semibold text-slate-400">{order.customer_name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-black text-[#f6eace]">{formatJOD(order.total, language)}</p>
                                            <div className="mt-1.5">
                                                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${getStatusBadgeClass(order.status)}`}>
                                                    {statusLabel(order.status, t)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {!dashboard?.recent_orders?.length && (
                                <div className="text-center py-12">
                                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">{t('admin_no_orders_yet')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {section === 'orders' && (
                <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.01] p-6 backdrop-blur-2xl">
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#f6eace]/20 to-transparent" />
                    <div className="mb-8 flex flex-wrap items-center gap-4">
                        <input
                            value={ordersQuery.q}
                            onChange={(event) => setOrdersQuery((prev) => ({ ...prev, q: event.target.value }))}
                            placeholder={t('admin_search_order_customer')}
                            className="min-w-[240px] flex-1 rounded-xl border border-white/10 bg-black/45 px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-white outline-none focus:border-[#f6eace]/40 transition-all"
                        />
                        <select
                            value={ordersQuery.status}
                            onChange={(event) => setOrdersQuery((prev) => ({ ...prev, status: event.target.value }))}
                            className="rounded-xl border border-white/10 bg-black/45 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-slate-300 outline-none focus:border-[#f6eace]/40 transition-all cursor-pointer"
                        >
                            <option value="">{t('admin_all_status')}</option>
                            <option value="pending">{t('status_pending')}</option>
                            <option value="confirmed">{t('status_confirmed')}</option>
                            <option value="shipped">{t('status_shipped')}</option>
                            <option value="delivered">{t('status_delivered')}</option>
                            <option value="cancelled">{t('status_cancelled')}</option>
                        </select>
                        <button onClick={reload} className="rounded-xl border border-[#f6eace]/40 bg-[#f6eace]/5 hover:bg-[#f6eace]/10 px-5 py-2.5 text-xs font-black uppercase tracking-[0.2em] text-[#f6eace] transition-all">{t('admin_refresh')}</button>
                    </div>

                    <div className="space-y-3">
                        {orders.map((order) => (
                            <article key={order.id} className="group relative rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-all duration-300 hover:border-white/10 hover:bg-white/[0.04]">
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-3">
                                            <p className="text-xs font-black uppercase tracking-widest text-white group-hover:text-[#f6eace] transition-colors">{order.order_number}</p>
                                            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest ${getStatusBadgeClass(order.status)}`}>
                                                {statusLabel(order.status, t)}
                                            </span>
                                        </div>
                                        <p className="text-[11px] font-semibold text-slate-400">{order.customer_name} ({order.customer_email})</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                            {t('admin_items_count', { count: order.items_count })} | {new Date(order.created_at).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-300">{order.city || '-'}</span>
                                        <span className="text-sm font-black text-[#f6eace] mr-2">{formatJOD(order.total, language)}</span>
                                        
                                        <select
                                            value={order.status}
                                            onChange={(event) => onUpdateOrderStatus(order.id, event.target.value)}
                                            className="rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-xs font-black uppercase tracking-widest text-slate-300 outline-none cursor-pointer hover:border-white/20 transition-all"
                                        >
                                            <option value="pending">{t('status_pending')}</option>
                                            <option value="confirmed">{t('status_confirmed')}</option>
                                            <option value="shipped">{t('status_shipped')}</option>
                                            <option value="delivered">{t('status_delivered')}</option>
                                            <option value="cancelled">{t('status_cancelled')}</option>
                                        </select>
                                        
                                        <button type="button" onClick={() => openOrderEditor(order)} className="rounded-xl border border-blue-400/20 bg-blue-400/5 hover:bg-blue-400/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-blue-300 transition-all">{t('admin_edit')}</button>
                                        <button type="button" onClick={() => onDeleteOrder(order.id)} className="rounded-xl border border-red-400/20 bg-red-400/5 hover:bg-red-400/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-red-300 transition-all">{t('admin_delete_order')}</button>
                                    </div>
                                </div>
                            </article>
                        ))}

                        {!orders.length && (
                            <div className="text-center py-16">
                                <p className="text-xs font-black uppercase tracking-widest text-slate-500">{t('admin_no_orders_found')}</p>
                            </div>
                        )}
                    </div>

                    {editingOrderId && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-6 backdrop-blur-md animate-in fade-in duration-300">
                            <form onSubmit={onSaveOrderEdits} className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-[#0d131f] p-8 shadow-2xl">
                                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#f6eace]/30 to-transparent" />
                                <h3 className="mb-6 text-lg font-black uppercase tracking-[0.15em] text-[#f6eace]">{t('admin_edit_order_title')}</h3>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <input name="customer_name" value={orderForm.customer_name} onChange={onOrderFormChange} placeholder={t('full_name')} className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-xs text-white outline-none focus:border-[#f6eace]/40 transition-all" required />
                                    <input name="customer_email" value={orderForm.customer_email} onChange={onOrderFormChange} placeholder={t('email')} type="email" className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-xs text-white outline-none focus:border-[#f6eace]/40 transition-all" required />
                                    <input name="phone" value={orderForm.phone} onChange={onOrderFormChange} placeholder={t('phone')} className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-xs text-white outline-none focus:border-[#f6eace]/40 transition-all" required />
                                    <input name="city" value={orderForm.city} onChange={onOrderFormChange} placeholder={t('governorate')} className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-xs text-white outline-none focus:border-[#f6eace]/40 transition-all" required />
                                    <input name="address_line" value={orderForm.address_line} onChange={onOrderFormChange} placeholder={t('address_line')} className="sm:col-span-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-xs text-white outline-none focus:border-[#f6eace]/40 transition-all" required />
                                    <select name="payment_method" value={orderForm.payment_method} onChange={onOrderFormChange} className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-slate-300 outline-none cursor-pointer focus:border-[#f6eace]/40 transition-all">
                                        <option value="cod">{t('cash_on_delivery')}</option>
                                        <option value="card">{t('credit_card')}</option>
                                        <option value="bank">{t('bank_transfer')}</option>
                                    </select>
                                    <select name="status" value={orderForm.status} onChange={onOrderFormChange} className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-slate-300 outline-none cursor-pointer focus:border-[#f6eace]/40 transition-all">
                                        <option value="pending">{t('status_pending')}</option>
                                        <option value="confirmed">{t('status_confirmed')}</option>
                                        <option value="shipped">{t('status_shipped')}</option>
                                        <option value="delivered">{t('status_delivered')}</option>
                                        <option value="cancelled">{t('status_cancelled')}</option>
                                    </select>
                                    <textarea name="notes" value={orderForm.notes} onChange={onOrderFormChange} placeholder={t('notes_optional')} rows={3} className="sm:col-span-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-xs text-white outline-none focus:border-[#f6eace]/40 transition-all" />
                                </div>
                                <div className="mt-8 flex flex-wrap justify-end gap-3">
                                    <button type="button" onClick={closeOrderEditor} className="rounded-xl border border-white/10 hover:bg-white/5 px-6 py-3 text-xs font-black uppercase tracking-[0.2em] text-white transition-all">{t('back')}</button>
                                    <button type="submit" className="rounded-xl bg-[#f6eace] hover:bg-white px-8 py-3 text-xs font-black uppercase tracking-[0.2em] text-black transition-all">{t('admin_save')}</button>
                                </div>
                            </form>
                        </div>
                    )}
                </section>
            )}

            {section === 'products' && (
                <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
                    {/* Products Management List */}
                    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.01] p-6 backdrop-blur-2xl">
                        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#f6eace]/20 to-transparent" />
                        <h2 className="mb-6 text-sm font-black uppercase tracking-[0.2em] text-[#f6eace]">{t('admin_manage_products')}</h2>
                        <div className="max-h-[620px] space-y-3 overflow-y-auto pr-2">
                            {products.map((product) => {
                                const isPopular = Boolean(productDrafts[product.id]?.is_popular ?? product.is_popular);
                                const draftStock = productDrafts[product.id]?.stock_quantity ?? Number(product.stock_quantity || 0);
                                const hasUnsavedChanges = Number(product.stock_quantity || 0) !== Number(draftStock) || Boolean(product.is_popular) !== isPopular;

                                return (
                                    <div key={product.id} className={`group relative flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-white/[0.02] p-4 transition-all duration-300 hover:bg-white/[0.04] ${hasUnsavedChanges ? 'border-amber-400/20 shadow-[0_0_15px_rgba(251,191,36,0.05)]' : 'border-white/5 hover:border-white/10'}`}>
                                        <div className="flex items-center gap-4">
                                            <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-black/40">
                                                <img src={product.image || '/images/product-placeholder.svg'} alt={product.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black uppercase tracking-widest text-[#f6eace] group-hover:text-white transition-colors">{product.name}</p>
                                                <p className="mt-1 text-[11px] font-semibold text-slate-400">{product.category} - <span className="font-bold text-[#f6eace]">{formatJOD(product.price, language)}</span></p>
                                                <div className="mt-2 flex flex-wrap gap-2 text-[9px] font-black uppercase tracking-wider">
                                                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 ${Number(product.stock_quantity) <= 5 ? 'border-amber-500/30 bg-amber-500/10 text-amber-300' : 'border-white/10 bg-white/5 text-slate-300'}`}>
                                                        {t('admin_stock')}: {Number(product.stock_quantity || 0)}
                                                    </span>
                                                    {product.is_popular && (
                                                        <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                                                            {t('admin_popular')}
                                                        </span>
                                                    )}
                                                    {product.featured && (
                                                        <span className="inline-flex items-center rounded-full border border-[#f6eace]/30 bg-[#f6eace]/10 text-[#f6eace]">
                                                            {t('admin_featured')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3">
                                            {/* Stock Input */}
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Inventory</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={draftStock}
                                                    className="w-16 rounded-xl border border-white/10 bg-black/40 px-2 py-1.5 text-center text-xs font-black text-white focus:border-[#f6eace]/40 outline-none transition-all"
                                                    onChange={(event) => onProductDraftChange(product.id, {
                                                        stock_quantity: Math.max(0, Number(event.target.value || 0)),
                                                    })}
                                                />
                                            </div>

                                            {/* Popular Toggle Button */}
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Popular</span>
                                                <button
                                                    type="button"
                                                    onClick={() => onProductDraftChange(product.id, {
                                                        is_popular: !isPopular,
                                                    })}
                                                    className={`rounded-xl border px-3 py-1.5 text-xs font-black uppercase tracking-widest transition-all ${isPopular ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'}`}
                                                >
                                                    🔥
                                                </button>
                                            </div>

                                            {/* Save Button */}
                                            <button
                                                type="button"
                                                disabled={savingProductId === product.id || !hasUnsavedChanges}
                                                onClick={() => onQuickUpdateProduct(product.id)}
                                                className="rounded-xl border border-blue-400/20 bg-blue-400/5 hover:bg-blue-400/15 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-blue-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-blue-400/5"
                                            >
                                                {savingProductId === product.id ? '...' : t('admin_save')}
                                            </button>

                                            {/* Delete Button */}
                                            <button onClick={() => onDelete(product.id)} className="rounded-xl border border-red-400/20 bg-red-400/5 hover:bg-red-400/15 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-red-300 transition-all">
                                                ❌
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}

                            {!products.length && (
                                <div className="text-center py-20 bg-white/[0.01] rounded-2xl border border-white/5">
                                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">No products found. Use the form to create your first product.</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Create Product Form */}
                    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-6 backdrop-blur-2xl">
                        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#f6eace]/20 to-transparent" />
                        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[#f6eace]">{t('admin_create_product')}</h2>
                        <form onSubmit={onCreate} className="mt-6 space-y-4">
                            <div className="space-y-1">
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{t('admin_name')}</span>
                                <input name="name" value={form.name} onChange={onInputChange} placeholder="e.g. Kinetic Performance Tee" className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-xs text-white outline-none focus:border-[#f6eace]/40 transition-all" required />
                            </div>

                            <div className="space-y-1">
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{t('admin_description')}</span>
                                <textarea name="description" value={form.description} onChange={onInputChange} placeholder="Describe product fabric, fit, and model sizing..." rows={3} className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-xs text-white outline-none focus:border-[#f6eace]/40 transition-all" />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{t('admin_price')} (JD)</span>
                                    <input name="price" value={form.price} onChange={onInputChange} type="number" step="0.01" placeholder="24.99" className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-xs text-white outline-none focus:border-[#f6eace]/40 transition-all" required />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{t('admin_category')}</span>
                                    <input name="category" value={form.category} onChange={onInputChange} placeholder="Men, Women, Accessories..." className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-xs text-white outline-none focus:border-[#f6eace]/40 transition-all" required />
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{t('admin_stock')}</span>
                                    <input name="stock_quantity" value={form.stock_quantity || ''} onChange={onInputChange} type="number" min="0" placeholder="50" className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-xs text-white outline-none focus:border-[#f6eace]/40 transition-all" />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Sizes</span>
                                    <input name="sizes" value={form.sizes} onChange={onInputChange} placeholder="S, M, L, XL" className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-xs text-white outline-none focus:border-[#f6eace]/40 transition-all" />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{t('admin_image_url')}</span>
                                <input name="image" value={form.image} onChange={onInputChange} placeholder="https://..." className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-xs text-white outline-none focus:border-[#f6eace]/40 transition-all" />
                            </div>

                            <div className="pt-2 grid grid-cols-2 gap-4">
                                <label className="flex items-center gap-3 rounded-xl border border-white/5 bg-black/25 px-4 py-3 text-xs text-slate-300 cursor-pointer hover:bg-black/40 transition-all select-none">
                                    <input name="featured" type="checkbox" checked={form.featured} onChange={onInputChange} className="h-4 w-4 rounded border-white/10 bg-black/50 text-[#f6eace] focus:ring-0 cursor-pointer" />
                                    <span className="font-bold uppercase tracking-widest text-[9px]">{t('admin_featured')}</span>
                                </label>
                                <label className="flex items-center gap-3 rounded-xl border border-white/5 bg-black/25 px-4 py-3 text-xs text-slate-300 cursor-pointer hover:bg-black/40 transition-all select-none">
                                    <input name="is_popular" type="checkbox" checked={Boolean(form.is_popular)} onChange={onInputChange} className="h-4 w-4 rounded border-white/10 bg-black/50 text-[#f6eace] focus:ring-0 cursor-pointer" />
                                    <span className="font-bold uppercase tracking-widest text-[9px]">{t('admin_popular')}</span>
                                </label>
                            </div>

                            <button className="w-full rounded-xl bg-[#f6eace] hover:bg-white py-4 font-black uppercase tracking-[0.25em] text-black transition-transform duration-150 active:scale-[0.98] shadow-lg hover:shadow-[0_0_25px_rgba(246,234,206,0.35)] mt-4">
                                {t('admin_create_product_btn')}
                            </button>
                        </form>
                    </section>
                </div>
            )}

            {section === 'users' && (
                <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.01] p-6 backdrop-blur-2xl">
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#f6eace]/20 to-transparent" />
                    <div className="mb-6 flex flex-wrap items-center gap-3">
                        <input
                            value={usersQuery}
                            onChange={(event) => setUsersQuery(event.target.value)}
                            placeholder={t('admin_search_users')}
                            className="min-w-[240px] flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-xs text-white outline-none focus:border-[#f6eace]/40 transition-all"
                        />
                        <button onClick={reload} className="rounded-xl border border-[#f6eace]/40 bg-[#f6eace]/5 hover:bg-[#f6eace]/10 px-5 py-2.5 text-xs font-black uppercase tracking-[0.2em] text-[#f6eace] transition-all">{t('admin_refresh')}</button>
                    </div>

                    <div className="space-y-3">
                        {users.map((account) => (
                            <div key={account.id} className="group relative flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-all duration-300 hover:border-white/10 hover:bg-white/[0.04]">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-[#f6eace] group-hover:text-white transition-colors">{account.name}</p>
                                    <p className="mt-1 text-[11px] font-semibold text-slate-400">{account.email}</p>
                                </div>
                                <div className="text-right">
                                    <span className={`inline-flex rounded-full border px-3 py-0.5 text-[9px] font-black uppercase tracking-widest ${account.role === 'admin' ? 'border-[#f6eace]/30 bg-[#f6eace]/10 text-[#f6eace]' : 'border-white/10 bg-white/5 text-slate-400'}`}>
                                        {account.role === 'admin' ? t('role_admin') : t('role_user')}
                                    </span>
                                    <p className="mt-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">{t('admin_orders_count', { count: account.orders_count })}</p>
                                </div>
                            </div>
                        ))}

                        {!users.length && (
                            <div className="text-center py-16">
                                <p className="text-xs font-black uppercase tracking-widest text-slate-500">{t('admin_no_users_found')}</p>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {section === 'activity' && (
                <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.01] p-6 backdrop-blur-2xl">
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#f6eace]/20 to-transparent" />
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[#f6eace]">{t('admin_activity_title')}</h2>
                        <input
                            value={activityQuery}
                            onChange={(event) => setActivityQuery(event.target.value)}
                            placeholder="Filter actions..."
                            className="min-w-[240px] rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-xs text-white outline-none focus:border-[#f6eace]/40 transition-all"
                        />
                    </div>

                    <div className="space-y-3">
                        {activityLogs.map((log) => (
                            <div key={log.id} className="relative rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                                <div className="flex items-center justify-between gap-4">
                                    <p className="text-xs font-black uppercase tracking-widest text-white">{log.action}</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{new Date(log.created_at).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}</p>
                                </div>
                                <p className="mt-1 text-[11px] font-semibold text-slate-400">{log.actor?.name || 'System'} - {log.actor?.email || '-'}</p>
                            </div>
                        ))}

                        {!activityLogs.length && (
                            <div className="text-center py-16">
                                <p className="text-xs font-black uppercase tracking-widest text-slate-500">{t('admin_activity_empty')}</p>
                            </div>
                        )}
                    </div>
                </section>
            )}
        </div>
    );
}

function statusLabel(status, t) {
    const key = `status_${String(status || '').toLowerCase()}`;
    const translated = t(key);
    return translated === key ? status : translated;
}

function getStatusBadgeClass(status) {
    switch (String(status || '').toLowerCase()) {
        case 'pending':
            return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
        case 'confirmed':
            return 'border-sky-500/30 bg-sky-500/10 text-sky-300';
        case 'shipped':
            return 'border-blue-500/30 bg-blue-500/10 text-blue-300';
        case 'delivered':
            return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
        case 'cancelled':
            return 'border-red-500/30 bg-red-500/10 text-red-300';
        default:
            return 'border-white/10 bg-white/5 text-slate-300';
    }
}

function Metric({ label, value, icon, highlight }) {
    return (
        <div className={`relative overflow-hidden rounded-2xl border p-5 backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)] ${highlight ? 'border-[#f6eace]/30 bg-gradient-to-br from-[#f6eace]/10 to-[#f6eace]/5' : 'border-white/10 bg-gradient-to-br from-white/5 to-white/[0.01]'}`}>
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#f6eace]/25 to-transparent" />
            <div className="flex items-center justify-between">
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400">{label}</p>
                <span className="text-base">{icon}</span>
            </div>
            <p className={`mt-3 text-2xl font-black tracking-tight ${highlight ? 'text-[#f6eace]' : 'text-white'}`}>{value}</p>
        </div>
    );
}
