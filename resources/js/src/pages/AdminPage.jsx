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
        <div className="space-y-6">
            {error && <p className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
            {message && <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-200">{message}</p>}

            {section === 'overview' && (
                <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
                    <div className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Metric label={t('admin_metric_revenue')} value={formatJOD(stats.total_revenue || 0, language)} />
                            <Metric label={t('admin_metric_orders')} value={stats.total_orders ?? 0} />
                            <Metric label={t('admin_metric_pending')} value={stats.pending_orders ?? 0} />
                            <Metric label={t('admin_metric_today')} value={stats.orders_today ?? 0} />
                            <Metric label={t('admin_metric_products')} value={stats.total_products ?? 0} />
                            <Metric label={t('admin_metric_users')} value={stats.total_users ?? 0} />
                        </div>

                        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                            <h3 className="text-lg font-semibold text-[#fff4dd]">{t('admin_sales_last_7_days')}</h3>
                            <div className="mt-4 grid grid-cols-7 gap-2">
                                {(dashboard?.sales_last_7_days || []).map((day) => {
                                    const max = Math.max(...(dashboard?.sales_last_7_days || []).map((x) => x.total), 1);
                                    const height = Math.max(12, (day.total / max) * 96);
                                    return (
                                        <div key={day.date} className="text-center">
                                            <div className="mx-auto w-full max-w-[26px] rounded-t bg-[#f6eace]" style={{ height }} />
                                            <p className="mt-2 text-[10px] text-slate-400">{day.date.slice(5)}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                        <h3 className="text-lg font-semibold text-[#fff4dd]">{t('admin_recent_orders')}</h3>
                        <div className="mt-4 space-y-2">
                            {(dashboard?.recent_orders || []).map((order) => (
                                <div key={order.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="font-medium text-[#fff4dd]">{order.order_number}</p>
                                        <span className="text-sm text-[#f6eace]">{formatJOD(order.total, language)}</span>
                                    </div>
                                    <p className="text-xs text-slate-400">{order.customer_name} - {statusLabel(order.status, t)}</p>
                                </div>
                            ))}
                            {!dashboard?.recent_orders?.length && <p className="text-sm text-slate-400">{t('admin_no_orders_yet')}</p>}
                        </div>
                    </div>
                </section>
            )}

            {section === 'orders' && (
                <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                        <input
                            value={ordersQuery.q}
                            onChange={(event) => setOrdersQuery((prev) => ({ ...prev, q: event.target.value }))}
                            placeholder={t('admin_search_order_customer')}
                            className="min-w-[220px] flex-1 rounded-xl border border-white/15 bg-black/30 px-4 py-2 outline-none"
                        />
                        <select
                            value={ordersQuery.status}
                            onChange={(event) => setOrdersQuery((prev) => ({ ...prev, status: event.target.value }))}
                            className="rounded-xl border border-white/15 bg-black/30 px-4 py-2 outline-none"
                        >
                            <option value="">{t('admin_all_status')}</option>
                            <option value="pending">{t('status_pending')}</option>
                            <option value="confirmed">{t('status_confirmed')}</option>
                            <option value="shipped">{t('status_shipped')}</option>
                            <option value="delivered">{t('status_delivered')}</option>
                            <option value="cancelled">{t('status_cancelled')}</option>
                        </select>
                        <button onClick={reload} className="rounded-xl border border-[#f6eace]/40 px-4 py-2 text-[#f6eace]">{t('admin_refresh')}</button>
                    </div>

                    <div className="space-y-2">
                        {orders.map((order) => (
                            <article key={order.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <p className="font-semibold text-[#fff4dd]">{order.order_number}</p>
                                        <p className="text-xs text-slate-400">{order.customer_name} ({order.customer_email})</p>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-end gap-2">
                                        <span className="rounded-full border border-white/20 px-3 py-1 text-xs text-slate-300">{order.city || '-'}</span>
                                        <span className="text-sm font-semibold text-[#f6eace]">{formatJOD(order.total, language)}</span>
                                        <select
                                            value={order.status}
                                            onChange={(event) => onUpdateOrderStatus(order.id, event.target.value)}
                                            className="rounded-lg border border-white/15 bg-black/30 px-3 py-1 text-sm outline-none"
                                        >
                                            <option value="pending">{t('status_pending')}</option>
                                            <option value="confirmed">{t('status_confirmed')}</option>
                                            <option value="shipped">{t('status_shipped')}</option>
                                            <option value="delivered">{t('status_delivered')}</option>
                                            <option value="cancelled">{t('status_cancelled')}</option>
                                        </select>
                                        <button type="button" onClick={() => openOrderEditor(order)} className="rounded-lg border border-blue-200/30 px-3 py-1 text-xs text-blue-100 hover:bg-blue-500/10">{t('admin_edit')}</button>
                                        <button type="button" onClick={() => onDeleteOrder(order.id)} className="rounded-lg border border-red-300/30 px-3 py-1 text-xs text-red-200 hover:bg-red-500/10">{t('admin_delete_order')}</button>
                                    </div>
                                </div>
                                <p className="mt-1 text-xs text-slate-500">{t('admin_items_count', { count: order.items_count })} | {new Date(order.created_at).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}</p>
                            </article>
                        ))}

                        {!orders.length && <p className="text-sm text-slate-400">{t('admin_no_orders_found')}</p>}
                    </div>

                    {editingOrderId && (
                        <form onSubmit={onSaveOrderEdits} className="mt-5 rounded-2xl border border-blue-200/20 bg-blue-200/5 p-4">
                            <h3 className="mb-3 text-base font-semibold text-[#fff4dd]">{t('admin_edit_order_title')}</h3>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <input name="customer_name" value={orderForm.customer_name} onChange={onOrderFormChange} placeholder={t('full_name')} className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 outline-none" required />
                                <input name="customer_email" value={orderForm.customer_email} onChange={onOrderFormChange} placeholder={t('email')} type="email" className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 outline-none" required />
                                <input name="phone" value={orderForm.phone} onChange={onOrderFormChange} placeholder={t('phone')} className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 outline-none" required />
                                <input name="city" value={orderForm.city} onChange={onOrderFormChange} placeholder={t('governorate')} className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 outline-none" required />
                                <input name="address_line" value={orderForm.address_line} onChange={onOrderFormChange} placeholder={t('address_line')} className="sm:col-span-2 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 outline-none" required />
                                <select name="payment_method" value={orderForm.payment_method} onChange={onOrderFormChange} className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 outline-none">
                                    <option value="cod">{t('cash_on_delivery')}</option>
                                    <option value="card">{t('credit_card')}</option>
                                    <option value="bank">{t('bank_transfer')}</option>
                                </select>
                                <select name="status" value={orderForm.status} onChange={onOrderFormChange} className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 outline-none">
                                    <option value="pending">{t('status_pending')}</option>
                                    <option value="confirmed">{t('status_confirmed')}</option>
                                    <option value="shipped">{t('status_shipped')}</option>
                                    <option value="delivered">{t('status_delivered')}</option>
                                    <option value="cancelled">{t('status_cancelled')}</option>
                                </select>
                                <textarea name="notes" value={orderForm.notes} onChange={onOrderFormChange} placeholder={t('notes_optional')} rows={3} className="sm:col-span-2 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 outline-none" />
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <button type="submit" className="rounded-xl bg-[#f6eace] px-4 py-2 text-sm font-semibold text-slate-900">{t('admin_save')}</button>
                                <button type="button" onClick={closeOrderEditor} className="rounded-xl border border-white/20 px-4 py-2 text-sm text-slate-200">{t('back')}</button>
                            </div>
                        </form>
                    )}
                </section>
            )}

            {section === 'products' && (
                <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
                    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                        <h2 className="mb-4 text-xl font-semibold text-[#fff4dd]">{t('admin_manage_products')}</h2>
                        <div className="max-h-[560px] space-y-3 overflow-auto pr-2">
                            {products.map((product) => (
                                <div key={product.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 p-3">
                                    <div className="flex items-center gap-3">
                                        <img src={product.image || '/images/product-placeholder.svg'} alt={product.name} className="h-12 w-12 rounded-lg object-cover" />
                                        <div>
                                            <p className="font-medium text-[#fff4dd]">{product.name}</p>
                                            <p className="text-xs text-slate-400">{product.category} - {formatJOD(product.price, language)}</p>
                                            <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-300">
                                                <span className={`rounded-full border px-2 py-0.5 ${Number(product.stock_quantity) <= 5 ? 'border-amber-300/40 text-amber-100' : 'border-white/20'}`}>
                                                    {t('admin_stock')}: {Number(product.stock_quantity || 0)}
                                                </span>
                                                {product.is_popular ? <span className="rounded-full border border-emerald-300/40 px-2 py-0.5 text-emerald-100">{t('admin_popular')}</span> : null}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min="0"
                                            value={productDrafts[product.id]?.stock_quantity ?? Number(product.stock_quantity || 0)}
                                            className="w-20 rounded-lg border border-white/15 bg-black/30 px-2 py-1 text-xs"
                                            onChange={(event) => onProductDraftChange(product.id, {
                                                stock_quantity: Math.max(0, Number(event.target.value || 0)),
                                            })}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => onProductDraftChange(product.id, {
                                                is_popular: !Boolean(productDrafts[product.id]?.is_popular ?? product.is_popular),
                                            })}
                                            className={`rounded-lg border px-3 py-1 text-xs ${Boolean(productDrafts[product.id]?.is_popular ?? product.is_popular) ? 'border-emerald-300/50 bg-emerald-500/10 text-emerald-100' : 'border-emerald-300/20 text-emerald-200'}`}
                                        >
                                            {t('admin_popular')}
                                        </button>
                                        <button
                                            type="button"
                                            disabled={
                                                savingProductId === product.id
                                                || (
                                                    Number(productDrafts[product.id]?.stock_quantity ?? Number(product.stock_quantity || 0)) === Number(product.stock_quantity || 0)
                                                    && Boolean(productDrafts[product.id]?.is_popular ?? product.is_popular) === Boolean(product.is_popular)
                                                )
                                            }
                                            onClick={() => onQuickUpdateProduct(product.id)}
                                            className="rounded-lg border border-blue-300/30 px-3 py-1 text-xs text-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {savingProductId === product.id ? `${t('admin_save')}...` : t('admin_save')}
                                        </button>
                                        <button onClick={() => onDelete(product.id)} className="rounded-lg border border-red-300/20 px-3 py-1 text-xs text-red-200">{t('admin_delete')}</button>
                                    </div>
                                </div>
                            ))}

                            {!products.length && <p className="text-sm text-slate-400">{t('admin_no_products_yet')}</p>}
                        </div>
                    </section>

                    <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
                        <h2 className="text-xl font-semibold text-[#fff4dd]">{t('admin_create_product')}</h2>
                        <form onSubmit={onCreate} className="mt-5 space-y-3">
                            <input name="name" value={form.name} onChange={onInputChange} placeholder={t('admin_name')} className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-2 outline-none" required />
                            <textarea name="description" value={form.description} onChange={onInputChange} placeholder={t('admin_description')} rows={3} className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-2 outline-none" />
                            <div className="grid gap-3 sm:grid-cols-2">
                                <input name="price" value={form.price} onChange={onInputChange} type="number" step="0.01" placeholder={t('admin_price')} className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-2 outline-none" required />
                                <input name="category" value={form.category} onChange={onInputChange} placeholder={t('admin_category')} className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-2 outline-none" required />
                            </div>
                            <input name="stock_quantity" value={form.stock_quantity || ''} onChange={onInputChange} type="number" min="0" placeholder={t('admin_stock')} className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-2 outline-none" />
                            <input name="sizes" value={form.sizes} onChange={onInputChange} placeholder={t('admin_sizes_placeholder')} className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-2 outline-none" />
                            <input name="image" value={form.image} onChange={onInputChange} placeholder={t('admin_image_url')} className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-2 outline-none" />
                            <label className="flex items-center gap-2 text-sm text-slate-300">
                                <input name="featured" type="checkbox" checked={form.featured} onChange={onInputChange} /> {t('admin_featured')}
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-300">
                                <input name="is_popular" type="checkbox" checked={Boolean(form.is_popular)} onChange={onInputChange} /> {t('admin_popular')}
                            </label>
                            <button className="w-full rounded-xl bg-[#f6eace] px-4 py-3 font-semibold text-slate-900">{t('admin_create_product_btn')}</button>
                        </form>
                    </section>
                </div>
            )}

            {section === 'users' && (
                <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                        <input
                            value={usersQuery}
                            onChange={(event) => setUsersQuery(event.target.value)}
                            placeholder={t('admin_search_users')}
                            className="min-w-[220px] flex-1 rounded-xl border border-white/15 bg-black/30 px-4 py-2 outline-none"
                        />
                        <button onClick={reload} className="rounded-xl border border-[#f6eace]/40 px-4 py-2 text-[#f6eace]">{t('admin_refresh')}</button>
                    </div>

                    <div className="space-y-2">
                        {users.map((account) => (
                            <div key={account.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 p-3">
                                <div>
                                    <p className="font-medium text-[#fff4dd]">{account.name}</p>
                                    <p className="text-xs text-slate-400">{account.email}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs uppercase tracking-[0.2em] text-slate-300">{account.role === 'admin' ? t('role_admin') : t('role_user')}</p>
                                    <p className="text-xs text-slate-500">{t('admin_orders_count', { count: account.orders_count })}</p>
                                </div>
                            </div>
                        ))}

                        {!users.length && <p className="text-sm text-slate-400">{t('admin_no_users_found')}</p>}
                    </div>
                </section>
            )}

            {section === 'activity' && (
                <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-semibold text-[#fff4dd]">{t('admin_activity_title')}</h2>
                        <input
                            value={activityQuery}
                            onChange={(event) => setActivityQuery(event.target.value)}
                            placeholder="Search action"
                            className="min-w-[220px] flex-1 rounded-xl border border-white/15 bg-black/30 px-4 py-2 outline-none"
                        />
                    </div>

                    <div className="space-y-2">
                        {activityLogs.map((log) => (
                            <div key={log.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-sm font-semibold text-[#fff4dd]">{log.action}</p>
                                    <p className="text-xs text-slate-400">{new Date(log.created_at).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}</p>
                                </div>
                                <p className="mt-1 text-xs text-slate-400">{log.actor?.name || 'System'} - {log.actor?.email || '-'}</p>
                            </div>
                        ))}

                        {!activityLogs.length && <p className="text-sm text-slate-400">{t('admin_activity_empty')}</p>}
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

function Metric({ label, value }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
            <p className="mt-2 text-2xl font-black text-[#fff4dd]">{value}</p>
        </div>
    );
}
