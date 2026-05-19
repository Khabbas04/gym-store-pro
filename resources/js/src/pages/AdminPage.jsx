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
    updateProduct,
    getCollections,
    createCollection,
    updateCollection,
    deleteCollection,
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
    const [collections, setCollections] = useState([]);
    const [activityLogs, setActivityLogs] = useState([]);
    const [productDrafts, setProductDrafts] = useState({});
    const [savingProductId, setSavingProductId] = useState(null);
    const [form, setForm] = useState(INITIAL_FORM);
    const [imageSourceType, setImageSourceType] = useState('url');
    const [imageFile, setImageFile] = useState(null);

    // Additional Images for Product Creation
    const [additionalImages, setAdditionalImages] = useState([]);

    // Detailed Order modal
    const [selectedOrder, setSelectedOrder] = useState(null);

    // Product Editing modal states
    const [editingProduct, setEditingProduct] = useState(null);
    const [editingProductForm, setEditingProductForm] = useState(INITIAL_FORM);
    const [editingMainImageSource, setEditingMainImageSource] = useState('url');
    const [editingMainImageFile, setEditingMainImageFile] = useState(null);
    const [editingAdditionalImages, setEditingAdditionalImages] = useState([]);
    const [updatingProductBusy, setUpdatingProductBusy] = useState(false);

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

    // Collections logic
    const [collectionForm, setCollectionForm] = useState({ name: '', description: '', is_active: true });
    const [editingCollection, setEditingCollection] = useState(null);

    async function handleSaveCollection(e) {
        e.preventDefault();
        setError('');
        setMessage('');
        try {
            if (editingCollection) {
                await updateCollection(editingCollection.id, collectionForm);
                setMessage(t('admin_collection_updated') || 'Collection updated');
            } else {
                await createCollection(collectionForm);
                setMessage(t('admin_collection_created') || 'Collection created');
            }
            setCollectionForm({ name: '', description: '', is_active: true });
            setEditingCollection(null);
            await reload();
        } catch (err) {
            setError(err.message || 'Error saving collection');
        }
    }

    async function handleDeleteCollection(id) {
        if (!window.confirm(t('admin_confirm_delete_collection') || 'Are you sure you want to delete this collection?')) return;
        try {
            await deleteCollection(id);
            setMessage(t('admin_collection_deleted') || 'Collection deleted');
            await reload();
        } catch (err) {
            setError(err.message || 'Error deleting collection');
        }
    }

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
            const [dashboardResult, productsResult, ordersResult, usersResult, collectionsResult] = await Promise.allSettled([
                getAdminDashboard(),
                getProducts({ per_page: 50 }),
                getAdminOrders({ per_page: 15, ...ordersQuery }),
                getAdminUsers({ q: usersQuery, per_page: 15 }),
                getCollections(),
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

            if (collectionsResult.status === 'fulfilled') {
                setCollections(collectionsResult.value || []);
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

    function onEditingProductFormChange(event) {
        const { name, value, type, checked } = event.target;
        setEditingProductForm((previous) => ({
            ...previous,
            [name]: type === 'checkbox' ? checked : value,
        }));
    }

    function openProductEditor(product) {
        setEditingProduct(product);
        setEditingProductForm({
            name: product.name || '',
            description: product.description || '',
            price: product.price || '',
            image: product.image || '',
            category: product.category || '',
            sizes: Array.isArray(product.sizes) ? product.sizes.join(', ') : (product.sizes || ''),
            featured: Boolean(product.featured),
            stock_quantity: Number(product.stock_quantity || 0),
            is_popular: Boolean(product.is_popular),
        });
        setEditingMainImageSource('url');
        setEditingMainImageFile(null);
        
        // Populate existing additional images
        const existingImages = (product.images || []).map((imgUrl, idx) => ({
            id: `existing-${idx}-${Date.now()}`,
            type: 'url',
            value: imgUrl,
            file: null
        }));
        setEditingAdditionalImages(existingImages);
    }

    async function onSaveProductEdits(event) {
        event.preventDefault();
        if (!editingProduct) return;

        setError('');
        setMessage('');
        setUpdatingProductBusy(true);

        try {
            let payload;
            const hasFiles = (editingMainImageSource === 'file' && editingMainImageFile) || 
                             editingAdditionalImages.some(img => img.type === 'file' && img.file);

            if (hasFiles) {
                payload = new FormData();
                payload.append('name', editingProductForm.name);
                payload.append('description', editingProductForm.description || '');
                payload.append('price', editingProductForm.price);
                payload.append('category', editingProductForm.category);
                payload.append('sizes', editingProductForm.sizes || '');
                payload.append('featured', editingProductForm.featured ? '1' : '0');
                payload.append('stock_quantity', String(editingProductForm.stock_quantity ?? 24));
                payload.append('is_popular', editingProductForm.is_popular ? '1' : '0');

                if (editingMainImageSource === 'file' && editingMainImageFile) {
                    payload.append('image', editingMainImageFile);
                } else {
                    payload.append('image', editingProductForm.image || '');
                }

                editingAdditionalImages.forEach((img, idx) => {
                    if (img.type === 'file' && img.file) {
                        payload.append(`images[${idx}]`, img.file);
                    } else if (img.type === 'url' && img.value) {
                        payload.append(`images[${idx}]`, img.value);
                    }
                });
            } else {
                payload = {
                    ...editingProductForm,
                    images: editingAdditionalImages.filter(img => img.type === 'url' && img.value).map(img => img.value)
                };
            }

            await updateProduct(editingProduct.id, payload);
            setMessage(t('admin_msg_product_updated'));
            setEditingProduct(null);
            await reload();
        } catch (e) {
            setError(e.message || t('admin_error_update_failed'));
        } finally {
            setUpdatingProductBusy(false);
        }
    }

    async function onCreate(event) {
        event.preventDefault();
        setError('');
        setMessage('');

        try {
            let payload;
            const hasFiles = (imageSourceType === 'file' && imageFile) || additionalImages.some(img => img.type === 'file' && img.file);
            
            if (hasFiles) {
                payload = new FormData();
                payload.append('name', form.name);
                payload.append('description', form.description || '');
                payload.append('price', form.price);
                payload.append('category', form.category);
                payload.append('sizes', form.sizes || '');
                payload.append('featured', form.featured ? '1' : '0');
                payload.append('stock_quantity', String(form.stock_quantity ?? 24));
                payload.append('is_popular', form.is_popular ? '1' : '0');
                
                if (imageSourceType === 'file' && imageFile) {
                    payload.append('image', imageFile);
                } else {
                    payload.append('image', form.image || '');
                }

                additionalImages.forEach((img, idx) => {
                    if (img.type === 'file' && img.file) {
                        payload.append(`images[${idx}]`, img.file);
                    } else if (img.type === 'url' && img.value) {
                        payload.append(`images[${idx}]`, img.value);
                    }
                });
            } else {
                payload = { 
                    ...form,
                    images: additionalImages.filter(img => img.type === 'url' && img.value).map(img => img.value)
                };
            }

            await createProduct(payload);
            setMessage(t('admin_msg_product_created'));
            setForm(INITIAL_FORM);
            setImageFile(null);
            setAdditionalImages([]);
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

    const renderAdditionalImagesManager = (imagesArray, setImagesArray) => {
        return (
            <div className="space-y-4 rounded-2xl border border-white/5 bg-black/25 p-4 animate-in fade-in duration-300">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#f6eace]">{t('admin_additional_images')}</span>
                    <button
                        type="button"
                        onClick={() => setImagesArray([...imagesArray, { id: Date.now(), type: 'url', value: '', file: null }])}
                        className="rounded-lg bg-[#f6eace]/10 hover:bg-[#f6eace]/20 px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-[#f6eace] transition-all"
                    >
                        ➕ {t('admin_add_image')}
                    </button>
                </div>
                
                {imagesArray.map((img, idx) => (
                    <div key={img.id} className="relative rounded-xl border border-white/5 bg-black/35 p-3 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold text-slate-500 uppercase">Image #{idx + 1}</span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const next = [...imagesArray];
                                        next[idx].type = next[idx].type === 'url' ? 'file' : 'url';
                                        next[idx].value = '';
                                        next[idx].file = null;
                                        setImagesArray(next);
                                    }}
                                    className="rounded-md border border-white/10 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-slate-400 hover:text-white"
                                >
                                    {img.type === 'url' ? '🌐 URL' : '📁 Upload'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setImagesArray(imagesArray.filter(x => x.id !== img.id))}
                                    className="text-slate-500 hover:text-red-400 text-xs transition-colors"
                                >
                                    ❌
                                </button>
                            </div>
                        </div>

                        {img.type === 'url' ? (
                            <input
                                type="text"
                                value={img.value}
                                onChange={(e) => {
                                    const next = [...imagesArray];
                                    next[idx].value = e.target.value;
                                    setImagesArray(next);
                                }}
                                placeholder="https://..."
                                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white outline-none focus:border-[#f6eace]/30"
                            />
                        ) : (
                            <label className="flex flex-col items-center justify-center w-full h-16 border border-dashed border-white/10 rounded-lg bg-black/25 hover:bg-black/35 cursor-pointer transition-all">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs">📷</span>
                                    <p className="text-[9px] font-black uppercase text-slate-400">
                                        {img.file ? img.file.name : t('admin_select_image_device')}
                                    </p>
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const next = [...imagesArray];
                                        next[idx].file = e.target.files[0];
                                        setImagesArray(next);
                                    }}
                                    className="hidden"
                                />
                            </label>
                        )}

                        {(img.value || img.file) && (
                            <div className="h-12 w-12 overflow-hidden rounded-lg border border-white/10 bg-black/20">
                                <img
                                    src={img.type === 'file' && img.file ? URL.createObjectURL(img.file) : img.value}
                                    alt="Preview"
                                    className="h-full w-full object-cover"
                                    onError={(e) => { e.target.src = '/images/product-placeholder.svg'; }}
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

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

            {section === 'collections' && (
                <section className="space-y-8 animate-in fade-in duration-500">
                    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0a1019] to-black p-8 shadow-2xl">
                        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#f6eace]/30 to-transparent" />
                        <div className="mb-6 flex items-center justify-between border-b border-white/5 pb-4">
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-[0.15em] text-[#f6eace]">
                                    {editingCollection ? t('admin_edit_collection') || 'Edit Collection' : t('admin_create_collection') || 'Create New Collection'}
                                </h3>
                                <p className="mt-1 text-xs text-slate-400">{t('admin_collection_desc') || 'Group your products into beautiful collections.'}</p>
                            </div>
                            {editingCollection && (
                                <button
                                    onClick={() => {
                                        setEditingCollection(null);
                                        setCollectionForm({ name: '', description: '', is_active: true });
                                    }}
                                    className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white"
                                >
                                    {t('admin_cancel') || 'Cancel'}
                                </button>
                            )}
                        </div>

                        <form onSubmit={handleSaveCollection} className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('admin_collection_name') || 'Collection Name'}</label>
                                    <input
                                        required
                                        value={collectionForm.name}
                                        onChange={(e) => setCollectionForm({ ...collectionForm, name: e.target.value })}
                                        className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-all focus:border-[#f6eace]/40"
                                        placeholder="e.g., Summer 2024"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('admin_collection_description') || 'Description'}</label>
                                    <input
                                        value={collectionForm.description}
                                        onChange={(e) => setCollectionForm({ ...collectionForm, description: e.target.value })}
                                        className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-all focus:border-[#f6eace]/40"
                                        placeholder="A brief description"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={collectionForm.is_active}
                                        onChange={(e) => setCollectionForm({ ...collectionForm, is_active: e.target.checked })}
                                        className="h-5 w-5 rounded border-white/20 bg-black/50 text-[#f6eace] focus:ring-[#f6eace]"
                                    />
                                    <span className="text-xs font-black uppercase tracking-widest text-slate-300">{t('admin_active_visible') || 'Active (Visible)'}</span>
                                </label>

                                <button
                                    type="submit"
                                    className="rounded-xl bg-[#f6eace] hover:bg-white px-8 py-3 text-xs font-black uppercase tracking-[0.2em] text-black shadow-lg transition-all hover:shadow-[0_0_20px_rgba(246,234,206,0.3)]"
                                >
                                    {editingCollection ? t('admin_save_changes') || 'Save Changes' : t('admin_create_collection') || 'Create Collection'}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {collections.map(collection => (
                            <div key={collection.id} className={`relative overflow-hidden rounded-3xl border ${collection.is_active ? 'border-white/10' : 'border-red-500/20 opacity-75'} bg-[#0a1019] p-6 shadow-xl transition-all hover:-translate-y-1 hover:border-white/20`}>
                                <div className="flex items-center justify-between mb-4">
                                    <span className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest ${collection.is_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                        {collection.is_active ? t('status_active') || 'Active' : t('status_inactive') || 'Inactive'}
                                    </span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                        {collection.products_count} {t('admin_products') || 'Products'}
                                    </span>
                                </div>
                                <h4 className="text-xl font-black text-white">{collection.name}</h4>
                                {collection.description && <p className="mt-2 text-xs text-slate-400 line-clamp-2">{collection.description}</p>}
                                
                                <div className="mt-6 flex items-center gap-3 border-t border-white/5 pt-4">
                                    <button 
                                        onClick={() => {
                                            setEditingCollection(collection);
                                            setCollectionForm({ name: collection.name, description: collection.description || '', is_active: collection.is_active });
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                        className="flex-1 rounded-xl border border-blue-400/20 bg-blue-400/5 py-2.5 text-center text-[10px] font-black uppercase tracking-widest text-blue-300 transition-all hover:bg-blue-400/15"
                                    >
                                        {t('admin_edit') || 'Edit'}
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteCollection(collection.id)}
                                        className="flex-1 rounded-xl border border-red-400/20 bg-red-400/5 py-2.5 text-center text-[10px] font-black uppercase tracking-widest text-red-300 transition-all hover:bg-red-400/15"
                                    >
                                        {t('admin_delete') || 'Delete'}
                                    </button>
                                </div>
                            </div>
                        ))}

                        {collections.length === 0 && (
                            <div className="col-span-full py-16 text-center rounded-3xl border border-white/5 bg-white/[0.02]">
                                <span className="text-4xl opacity-50">✨</span>
                                <p className="mt-4 text-xs font-black uppercase tracking-widest text-slate-400">{t('admin_no_collections') || 'No collections found'}</p>
                            </div>
                        )}
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
                                    <div onClick={() => setSelectedOrder(order)} className="space-y-1 cursor-pointer hover:opacity-80 transition-opacity">
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
                                        
                                        <button type="button" onClick={() => setSelectedOrder(order)} className="rounded-xl border border-[#f6eace]/25 bg-[#f6eace]/5 hover:bg-[#f6eace]/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-[#f6eace] transition-all">🎫 {t('admin_ticket')}</button>
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
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-6 backdrop-blur-md animate-in fade-in duration-300">
                            <form onSubmit={onSaveOrderEdits} className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#070b13] p-8 shadow-2xl flex flex-col max-h-[90vh]">
                                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#f6eace]/30 to-transparent" />
                                
                                {/* Header */}
                                <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                                    <div>
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#f6eace]">Order Management</span>
                                        <h3 className="text-xl font-black uppercase tracking-widest text-white mt-1">{t('admin_edit_order_title')}</h3>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={closeOrderEditor}
                                        className="text-slate-400 hover:text-white text-lg transition-colors"
                                    >
                                        ✕
                                    </button>
                                </div>

                                {/* Content Grid */}
                                <div className="flex-1 overflow-y-auto space-y-6 pr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                                    <div className="grid gap-6 md:grid-cols-2">
                                        {/* Left Side: Client Information */}
                                        <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-6 space-y-4">
                                            <h4 className="text-xs font-black uppercase tracking-widest text-[#f6eace] border-b border-white/5 pb-2">📋 Customer Details</h4>
                                            
                                            <div className="space-y-4">
                                                <div className="space-y-1">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{t('full_name')}</span>
                                                    <input name="customer_name" value={orderForm.customer_name} onChange={onOrderFormChange} placeholder={t('full_name')} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-xs text-white outline-none focus:border-[#f6eace]/40 transition-all font-bold" required />
                                                </div>

                                                <div className="space-y-1">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{t('phone')}</span>
                                                    <input name="phone" value={orderForm.phone} onChange={onOrderFormChange} placeholder={t('phone')} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-xs text-white outline-none focus:border-[#f6eace]/40 transition-all font-bold text-[#f6eace] tracking-wider" required />
                                                </div>

                                                <div className="grid gap-4 sm:grid-cols-2">
                                                    <div className="space-y-1">
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{t('governorate')}</span>
                                                        <input name="city" value={orderForm.city} onChange={onOrderFormChange} placeholder={t('governorate')} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-xs text-white outline-none focus:border-[#f6eace]/40 transition-all" required />
                                                    </div>

                                                    <div className="space-y-1">
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{t('email')}</span>
                                                        <input name="customer_email" value={orderForm.customer_email} onChange={onOrderFormChange} placeholder={t('email')} type="email" className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-xs text-white outline-none focus:border-[#f6eace]/40 transition-all" required />
                                                    </div>
                                                </div>

                                                <div className="space-y-1">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{t('address_line')}</span>
                                                    <input name="address_line" value={orderForm.address_line} onChange={onOrderFormChange} placeholder={t('address_line')} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-xs text-white outline-none focus:border-[#f6eace]/40 transition-all" required />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Side: Order Configuration & Notes */}
                                        <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-6 space-y-4">
                                            <h4 className="text-xs font-black uppercase tracking-widest text-[#f6eace] border-b border-white/5 pb-2">⚙️ Order settings</h4>
                                            
                                            <div className="space-y-4">
                                                <div className="space-y-1">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Order Status</span>
                                                    <select name="status" value={orderForm.status} onChange={onOrderFormChange} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-300 outline-none cursor-pointer focus:border-[#f6eace]/40 transition-all">
                                                        <option value="pending">{t('status_pending')}</option>
                                                        <option value="confirmed">{t('status_confirmed')}</option>
                                                        <option value="shipped">{t('status_shipped')}</option>
                                                        <option value="delivered">{t('status_delivered')}</option>
                                                        <option value="cancelled">{t('status_cancelled')}</option>
                                                    </select>
                                                </div>

                                                <div className="space-y-1">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Payment Method</span>
                                                    <select name="payment_method" value={orderForm.payment_method} onChange={onOrderFormChange} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-300 outline-none cursor-pointer focus:border-[#f6eace]/40 transition-all">
                                                        <option value="cod">{t('cash_on_delivery')}</option>
                                                        <option value="card">{t('credit_card')}</option>
                                                        <option value="bank">{t('bank_transfer')}</option>
                                                    </select>
                                                </div>

                                                <div className="space-y-1">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{t('notes_optional')}</span>
                                                    <textarea name="notes" value={orderForm.notes} onChange={onOrderFormChange} placeholder="Write special client instructions..." rows={4} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-xs text-white outline-none focus:border-[#f6eace]/40 transition-all font-medium" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Actions */}
                                <div className="mt-8 border-t border-white/10 pt-6 flex flex-wrap justify-end gap-3">
                                    <button type="button" onClick={closeOrderEditor} className="rounded-xl border border-white/10 hover:bg-white/5 px-6 py-3.5 text-xs font-black uppercase tracking-[0.2em] text-white transition-all">{t('back')}</button>
                                    <button type="submit" className="rounded-xl bg-[#f6eace] hover:bg-white px-8 py-3.5 text-xs font-black uppercase tracking-[0.2em] text-black transition-all shadow-lg hover:shadow-[0_0_20px_rgba(246,234,206,0.3)]">{t('admin_save')}</button>
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

                                            {/* Edit Button */}
                                            <button 
                                                type="button" 
                                                onClick={() => openProductEditor(product)} 
                                                className="rounded-xl border border-[#f6eace]/25 bg-[#f6eace]/5 hover:bg-[#f6eace]/15 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-[#f6eace] transition-all"
                                            >
                                                ✏️
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

                            {/* Image Source Selector */}
                            <div className="space-y-2">
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{t('admin_image_source') || 'Image Source'}</span>
                                <div className="grid grid-cols-2 gap-2 rounded-xl bg-black/45 p-1 border border-white/10">
                                    <button
                                        type="button"
                                        onClick={() => setImageSourceType('url')}
                                        className={`rounded-lg py-2 text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${imageSourceType === 'url' ? 'bg-[#f6eace] text-black shadow-[0_0_15px_rgba(246,234,206,0.3)]' : 'text-slate-400 hover:text-white bg-white/5'}`}
                                    >
                                        🌐 {t('admin_image_link_url') || 'Link URL'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setImageSourceType('file')}
                                        className={`rounded-lg py-2 text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${imageSourceType === 'file' ? 'bg-[#f6eace] text-black shadow-[0_0_15px_rgba(246,234,206,0.3)]' : 'text-slate-400 hover:text-white bg-white/5'}`}
                                    >
                                        📁 {t('admin_image_device_upload') || 'Device Upload'}
                                    </button>
                                </div>
                            </div>

                            {imageSourceType === 'url' ? (
                                <div className="space-y-1 animate-in fade-in duration-300">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{t('admin_image_url')}</span>
                                    <input 
                                        name="image" 
                                        value={form.image} 
                                        onChange={onInputChange} 
                                        placeholder="https://..." 
                                        className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-xs text-white outline-none focus:border-[#f6eace]/40 transition-all" 
                                    />
                                </div>
                            ) : (
                                <div className="space-y-1 animate-in fade-in duration-300">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{t('admin_upload_image_file') || 'Upload Image File'}</span>
                                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-white/10 rounded-xl bg-black/30 hover:bg-black/40 hover:border-[#f6eace]/30 cursor-pointer transition-all">
                                        <div className="flex flex-col items-center justify-center pt-3 pb-3">
                                            <span className="text-lg">📷</span>
                                            <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                                {imageFile ? imageFile.name : (t('admin_select_image_device') || 'Select image from device')}
                                            </p>
                                        </div>
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            onChange={(e) => setImageFile(e.target.files[0])} 
                                            className="hidden" 
                                        />
                                    </label>
                                </div>
                            )}

                            <div className="pt-2 grid grid-cols-2 gap-4">
                                <label className="flex items-center gap-3 rounded-xl border border-white/5 bg-[#000000]/25 px-4 py-3 text-xs text-slate-300 cursor-pointer hover:bg-[#000000]/40 transition-all select-none">
                                    <input name="featured" type="checkbox" checked={form.featured} onChange={onInputChange} className="h-4 w-4 rounded border-white/10 bg-[#000000]/50 text-[#f6eace] focus:ring-0 cursor-pointer" />
                                    <span className="font-bold uppercase tracking-widest text-[9px]">{t('admin_featured')}</span>
                                </label>
                                <label className="flex items-center gap-3 rounded-xl border border-white/5 bg-[#000000]/25 px-4 py-3 text-xs text-slate-300 cursor-pointer hover:bg-[#000000]/40 transition-all select-none">
                                    <input name="is_popular" type="checkbox" checked={Boolean(form.is_popular)} onChange={onInputChange} className="h-4 w-4 rounded border-white/10 bg-[#000000]/50 text-[#f6eace] focus:ring-0 cursor-pointer" />
                                    <span className="font-bold uppercase tracking-widest text-[9px]">{t('admin_popular')}</span>
                                </label>
                            </div>

                            {/* Additional Images Manager */}
                            {renderAdditionalImagesManager(additionalImages, setAdditionalImages)}

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

            {/* Detailed Order Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-6 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#070b13] p-8 shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#f6eace]/30 to-transparent" />
                        
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                            <div>
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#f6eace]">Order Ticket</span>
                                <h3 className="text-xl font-black uppercase tracking-widest text-white mt-1">{selectedOrder.order_number}</h3>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${getStatusBadgeClass(selectedOrder.status)}`}>
                                    {statusLabel(selectedOrder.status, t)}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setSelectedOrder(null)}
                                    className="text-slate-400 hover:text-white text-lg transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        {/* Content Area (Scrollable) */}
                        <div className="flex-1 overflow-y-auto space-y-6 pr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                            
                            {/* Status Quick Update */}
                            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 flex flex-wrap items-center justify-between gap-4">
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('admin_update_order_status') || 'Update Status'}</h4>
                                    <p className="text-[11px] text-slate-500 mt-0.5">Quickly toggle delivery progression</p>
                                </div>
                                <select
                                    value={selectedOrder.status}
                                    onChange={async (event) => {
                                        const nextStatus = event.target.value;
                                        await onUpdateOrderStatus(selectedOrder.id, nextStatus);
                                        setSelectedOrder(prev => ({ ...prev, status: nextStatus }));
                                    }}
                                    className="rounded-xl border border-white/15 bg-black/60 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-slate-300 outline-none cursor-pointer hover:border-white/30 transition-all"
                                >
                                    <option value="pending">{t('status_pending')}</option>
                                    <option value="confirmed">{t('status_confirmed')}</option>
                                    <option value="shipped">{t('status_shipped')}</option>
                                    <option value="delivered">{t('status_delivered')}</option>
                                    <option value="cancelled">{t('status_cancelled')}</option>
                                </select>
                            </div>

                            <div className="grid gap-6 md:grid-cols-2">
                                {/* Customer Information */}
                                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-4">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-[#f6eace] border-b border-white/5 pb-2">📋 Customer Details</h4>
                                    <div className="space-y-3 text-xs">
                                        <div>
                                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{t('full_name')}:</span>
                                            <p className="text-white font-bold mt-1 text-sm">{selectedOrder.customer_name}</p>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{t('phone')}:</span>
                                            <p className="text-[#f6eace] font-bold mt-1 text-sm select-all">📞 {selectedOrder.phone}</p>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{t('governorate')}:</span>
                                            <p className="text-white font-semibold mt-1">{selectedOrder.city}</p>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{t('address_line')}:</span>
                                            <p className="text-white leading-relaxed mt-1 font-medium">{selectedOrder.address_line}</p>
                                        </div>
                                        {selectedOrder.customer_email && !selectedOrder.customer_email.includes('guest_') && (
                                            <div>
                                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{t('email')}:</span>
                                                <p className="text-slate-300 mt-1">{selectedOrder.customer_email}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Order Summary & Notes */}
                                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 flex flex-col justify-between space-y-4">
                                    <div>
                                        <h4 className="text-xs font-black uppercase tracking-widest text-[#f6eace] border-b border-white/5 pb-2">📝 Order Notes</h4>
                                        <p className="text-xs font-medium leading-relaxed text-slate-400 mt-3 italic">
                                            {selectedOrder.notes || 'No special instructions provided by customer.'}
                                        </p>
                                    </div>
                                    <div className="space-y-2 border-t border-white/5 pt-4">
                                        <div className="flex justify-between text-xs text-slate-400">
                                            <span>Payment Method:</span>
                                            <span className="font-bold text-white uppercase tracking-wider">{selectedOrder.payment_method || 'COD'}</span>
                                        </div>
                                        <div className="flex justify-between text-xs text-slate-400">
                                            <span>Date:</span>
                                            <span className="text-slate-300">{new Date(selectedOrder.created_at).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Order Items (Products Purchased) */}
                            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-4">
                                <h4 className="text-xs font-black uppercase tracking-widest text-[#f6eace] border-b border-white/5 pb-2">📦 Purchased Products</h4>
                                <div className="space-y-4">
                                    {(selectedOrder.items || []).map((item) => (
                                        <div key={item.id} className="flex items-center justify-between gap-4 border-b border-white/5 pb-4 last:border-0 last:pb-0">
                                            <div className="flex items-center gap-3">
                                                <div className="h-14 w-14 overflow-hidden rounded-xl border border-white/10 bg-black/40">
                                                    <img
                                                        src={item.product?.image || '/images/product-placeholder.svg'}
                                                        alt={item.product?.name || 'Product'}
                                                        className="h-full w-full object-cover"
                                                    />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black uppercase tracking-widest text-[#f6eace]">{item.product?.name || 'Unknown Product'}</p>
                                                    <p className="text-[10px] text-slate-400 mt-1">
                                                        Size: <span className="font-bold text-white">{item.size || 'N/A'}</span>
                                                        <span className="mx-2 text-white/20">|</span>
                                                        Qty: <span className="font-bold text-white">{item.quantity}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-black text-white">{formatJOD(item.price * item.quantity, language)}</p>
                                                <p className="text-[10px] text-slate-500 mt-0.5">{item.quantity} × {formatJOD(item.price, language)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Pricing Grid */}
                                <div className="border-t border-white/10 pt-4 mt-6 space-y-2 text-xs">
                                    <div className="flex justify-between text-slate-400">
                                        <span>Subtotal:</span>
                                        <span>{formatJOD(selectedOrder.subtotal, language)}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-400">
                                        <span>Shipping Fee:</span>
                                        <span>{formatJOD(selectedOrder.shipping_fee, language)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-white/5">
                                        <span className="text-[#f6eace]">Grand Total:</span>
                                        <span className="text-[#f6eace]">{formatJOD(selectedOrder.total, language)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Buttons */}
                        <div className="mt-8 border-t border-white/10 pt-6 flex flex-wrap justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    const itemsText = (selectedOrder.items || []).map(item => `- ${item.product?.name || 'Product'} (Size: ${item.size || 'N/A'}, Qty: ${item.quantity})`).join('\n');
                                    const details = `Order: ${selectedOrder.order_number}\nCustomer: ${selectedOrder.customer_name}\nPhone: ${selectedOrder.phone}\nGovernorate: ${selectedOrder.city}\nAddress: ${selectedOrder.address_line}\n\nProducts:\n${itemsText}\n\nTotal: ${formatJOD(selectedOrder.total, 'en')}`;
                                    navigator.clipboard.writeText(details);
                                    alert('Order details copied to clipboard!');
                                }}
                                className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 hover:bg-emerald-400/15 px-5 py-3 text-xs font-black uppercase tracking-widest text-emerald-300 transition-all"
                            >
                                📋 Copy Details
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedOrder(null)}
                                className="rounded-xl border border-white/10 hover:bg-white/5 px-6 py-3 text-xs font-black uppercase tracking-[0.2em] text-white transition-all"
                            >
                                {t('back')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Product Edit Modal */}
            {editingProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-6 backdrop-blur-md animate-in fade-in duration-300">
                    <form onSubmit={onSaveProductEdits} className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-[#0d131f] p-8 shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#f6eace]/30 to-transparent" />
                        
                        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                            <h3 className="text-lg font-black uppercase tracking-[0.15em] text-[#f6eace]">
                                {t('admin_edit_product_title') || 'Edit Product details'}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setEditingProduct(null)}
                                className="text-slate-400 hover:text-white text-lg transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                            <div className="space-y-1">
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{t('admin_name')}</span>
                                <input name="name" value={editingProductForm.name} onChange={onEditingProductFormChange} placeholder="e.g. Kinetic Performance Tee" className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-xs text-white outline-none focus:border-[#f6eace]/40 transition-all" required />
                            </div>

                            <div className="space-y-1">
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{t('admin_description')}</span>
                                <textarea name="description" value={editingProductForm.description} onChange={onEditingProductFormChange} placeholder="Describe product fabric..." rows={3} className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-xs text-white outline-none focus:border-[#f6eace]/40 transition-all" />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{t('admin_price')} (JD)</span>
                                    <input name="price" value={editingProductForm.price} onChange={onEditingProductFormChange} type="number" step="0.01" placeholder="24.99" className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-xs text-white outline-none focus:border-[#f6eace]/40 transition-all" required />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{t('admin_category')}</span>
                                    <input name="category" value={editingProductForm.category} onChange={onEditingProductFormChange} placeholder="Men, Women, Accessories..." className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-xs text-white outline-none focus:border-[#f6eace]/40 transition-all" required />
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{t('admin_stock')}</span>
                                    <input name="stock_quantity" value={editingProductForm.stock_quantity || ''} onChange={onEditingProductFormChange} type="number" min="0" placeholder="50" className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-xs text-white outline-none focus:border-[#f6eace]/40 transition-all" />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Sizes</span>
                                    <input name="sizes" value={editingProductForm.sizes} onChange={onEditingProductFormChange} placeholder="S, M, L, XL" className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-xs text-white outline-none focus:border-[#f6eace]/40 transition-all" />
                                </div>
                            </div>

                            {/* Main Image Source Selector */}
                            <div className="space-y-2">
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Main Image Source</span>
                                <div className="grid grid-cols-2 gap-2 rounded-xl bg-black/45 p-1 border border-white/10">
                                    <button
                                        type="button"
                                        onClick={() => setEditingMainImageSource('url')}
                                        className={`rounded-lg py-2 text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${editingMainImageSource === 'url' ? 'bg-[#f6eace] text-black shadow-[0_0_15px_rgba(246,234,206,0.35)]' : 'text-slate-400 hover:text-white bg-white/5'}`}
                                    >
                                        🌐 {t('admin_image_link_url') || 'Link URL'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEditingMainImageSource('file')}
                                        className={`rounded-lg py-2 text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${editingMainImageSource === 'file' ? 'bg-[#f6eace] text-black shadow-[0_0_15px_rgba(246,234,206,0.35)]' : 'text-slate-400 hover:text-white bg-white/5'}`}
                                    >
                                        📁 {t('admin_image_device_upload') || 'Device Upload'}
                                    </button>
                                </div>
                            </div>

                            {editingMainImageSource === 'url' ? (
                                <div className="space-y-1 animate-in fade-in duration-300">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{t('admin_image_url')}</span>
                                    <input 
                                        name="image" 
                                        value={editingProductForm.image} 
                                        onChange={onEditingProductFormChange} 
                                        placeholder="https://..." 
                                        className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-xs text-white outline-none focus:border-[#f6eace]/40 transition-all" 
                                    />
                                </div>
                            ) : (
                                <div className="space-y-1 animate-in fade-in duration-300">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{t('admin_upload_image_file') || 'Upload Image File'}</span>
                                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-white/10 rounded-xl bg-black/30 hover:bg-black/40 hover:border-[#f6eace]/30 cursor-pointer transition-all">
                                        <div className="flex flex-col items-center justify-center pt-3 pb-3">
                                            <span className="text-lg">📷</span>
                                            <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                                {editingMainImageFile ? editingMainImageFile.name : (t('admin_select_image_device') || 'Select image from device')}
                                            </p>
                                        </div>
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            onChange={(e) => setEditingMainImageFile(e.target.files[0])} 
                                            className="hidden" 
                                        />
                                    </label>
                                </div>
                            )}

                            <div className="pt-2 grid grid-cols-2 gap-4">
                                <label className="flex items-center gap-3 rounded-xl border border-white/5 bg-[#000000]/25 px-4 py-3 text-xs text-slate-300 cursor-pointer hover:bg-[#000000]/40 transition-all select-none">
                                    <input name="featured" type="checkbox" checked={editingProductForm.featured} onChange={onEditingProductFormChange} className="h-4 w-4 rounded border-white/10 bg-[#000000]/50 text-[#f6eace] focus:ring-0 cursor-pointer" />
                                    <span className="font-bold uppercase tracking-widest text-[9px]">{t('admin_featured')}</span>
                                </label>
                                <label className="flex items-center gap-3 rounded-xl border border-white/5 bg-[#000000]/25 px-4 py-3 text-xs text-slate-300 cursor-pointer hover:bg-[#000000]/40 transition-all select-none">
                                    <input name="is_popular" type="checkbox" checked={Boolean(editingProductForm.is_popular)} onChange={onEditingProductFormChange} className="h-4 w-4 rounded border-white/10 bg-[#000000]/50 text-[#f6eace] focus:ring-0 cursor-pointer" />
                                    <span className="font-bold uppercase tracking-widest text-[9px]">{t('admin_popular')}</span>
                                </label>
                            </div>

                            {/* Additional Images Section */}
                            {renderAdditionalImagesManager(editingAdditionalImages, setEditingAdditionalImages)}
                        </div>

                        <div className="mt-8 border-t border-white/10 pt-6 flex flex-wrap justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setEditingProduct(null)}
                                className="rounded-xl border border-white/10 hover:bg-white/5 px-6 py-3 text-xs font-black uppercase tracking-[0.2em] text-white transition-all"
                            >
                                {t('back')}
                            </button>
                            <button
                                type="submit"
                                disabled={updatingProductBusy}
                                className="rounded-xl bg-[#f6eace] hover:bg-white px-8 py-3 text-xs font-black uppercase tracking-[0.2em] text-black transition-all disabled:opacity-50"
                            >
                                {updatingProductBusy ? 'Saving...' : t('admin_save')}
                            </button>
                        </div>
                    </form>
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
