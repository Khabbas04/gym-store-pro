import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { JORDAN_GOVERNORATES, getGovernorateShippingFee } from '../constants/governorates';
import PageHeader, { StatChip } from '../components/ui/PageHeader';
import { checkoutOrder } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { formatJOD } from '../utils/currency';

const INITIAL_FORM = {
    customer_name: '',
    customer_email: '',
    phone: '',
    address_line: '',
    city: '',
    payment_method: 'cod',
    notes: '',
};

export default function CheckoutPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { t, language, isArabic } = useLanguage();
    const { items, subtotal, clearCart } = useCart();
    const [form, setForm] = useState({
        ...INITIAL_FORM,
        customer_name: user?.name || '',
        customer_email: user?.email || '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const activeShippingFee = items.length ? getGovernorateShippingFee(form.city) : 0;
    const total = subtotal + activeShippingFee;

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    function onInputChange(event) {
        const { name, value } = event.target;
        setForm((previous) => ({ ...previous, [name]: value }));
    }

    async function onSubmit(event) {
        event.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            const payload = {
                ...form,
                items: items.map((item) => ({
                    product_id: item.product_id,
                    quantity: item.quantity,
                    size: item.size,
                })),
            };

            const order = await checkoutOrder(payload);
            clearCart();
            navigate('/orders', { state: { orderNumber: order.order_number } });
        } catch (e) {
            setError(e.message || t('error_checkout_failed'));
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="bg-[#02040a] text-white">
            {/* Minimalist Title Section */}
            <section className="bg-white/5 py-24">
                <div className="mx-auto max-w-[1600px] px-6 sm:px-12">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#f6eace]">{t('checkout')}</span>
                    <h1 className="mt-4 text-4xl font-black uppercase tracking-tight sm:text-7xl">{t('checkout')}</h1>
                </div>
            </section>

            <section className="mx-auto max-w-[1600px] px-6 py-32 sm:px-12">
                <div className="grid gap-24 lg:grid-cols-[1fr_450px]">
                    {/* Checkout Form */}
                    <div className="space-y-20">
                        <div className="border-b border-white/5 pb-10">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white">{t('checkout_subtitle')}</h2>
                        </div>

                        {error && (
                            <div className="border border-red-500/10 bg-red-500/5 px-10 py-8">
                                <p className="text-[11px] font-black uppercase tracking-widest text-red-400">{error}</p>
                            </div>
                        )}

                        <form onSubmit={onSubmit} className="grid gap-x-16 gap-y-12 sm:grid-cols-2">
                            <div className="space-y-4">
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">{t('full_name')}</label>
                                <input name="customer_name" value={form.customer_name} onChange={onInputChange} className="w-full border-b border-white/10 bg-transparent py-4 text-sm outline-none transition-colors focus:border-[#f6eace]" required />
                            </div>
                            <div className="space-y-4">
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">{t('email')}</label>
                                <input name="customer_email" type="email" value={form.customer_email} onChange={onInputChange} className="w-full border-b border-white/10 bg-transparent py-4 text-sm outline-none transition-colors focus:border-[#f6eace]" required />
                            </div>
                            <div className="space-y-4">
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">{t('phone')}</label>
                                <input name="phone" value={form.phone} onChange={onInputChange} className="w-full border-b border-white/10 bg-transparent py-4 text-sm outline-none transition-colors focus:border-[#f6eace]" required />
                            </div>
                            <div className="space-y-4">
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">{t('city')}</label>
                                <select name="city" value={form.city} onChange={onInputChange} className="w-full border-b border-white/10 bg-transparent py-4 text-sm outline-none transition-colors focus:border-[#f6eace] cursor-pointer" required>
                                    <option value="" className="bg-[#0a1019]">{t('select_governorate')}</option>
                                    {JORDAN_GOVERNORATES.map((gov) => (
                                        <option key={gov.value} value={gov.value} className="bg-[#0a1019]">
                                            {isArabic ? gov.labelAr : gov.labelEn}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="sm:col-span-2 space-y-4">
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">{t('address_line')}</label>
                                <input name="address_line" value={form.address_line} onChange={onInputChange} className="w-full border-b border-white/10 bg-transparent py-4 text-sm outline-none transition-colors focus:border-[#f6eace]" required />
                            </div>
                            <div className="sm:col-span-2 space-y-4">
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">{t('notes_optional')}</label>
                                <textarea name="notes" value={form.notes} onChange={onInputChange} rows={3} className="w-full border-b border-white/10 bg-transparent py-4 text-sm outline-none transition-colors focus:border-[#f6eace]" />
                            </div>

                            <div className="sm:col-span-2 mt-12">
                                <div className="mb-10 bg-amber-500/5 border border-amber-500/10 px-8 py-6">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-amber-200/40 leading-relaxed">
                                        {t('shipping_rule_hint')}
                                    </p>
                                </div>
                                <button
                                    disabled={submitting || !items.length}
                                    className="w-full bg-[#f6eace] py-6 text-sm font-black uppercase tracking-[0.2em] text-black transition-transform active:scale-95 disabled:opacity-50"
                                >
                                    {submitting ? t('placing_order') : t('place_order')}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Order Summary Summary */}
                    <aside>
                        <div className="bg-white/5 p-12">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white border-b border-white/5 pb-8">{t('order_summary')}</h2>
                            <div className="mt-12 space-y-8">
                                <div className="flex justify-between text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                                    <span>{t('items')}</span>
                                    <span>{items.length}</span>
                                </div>
                                <div className="flex justify-between text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                                    <span>{t('subtotal')}</span>
                                    <span>{formatJOD(subtotal, language)}</span>
                                </div>
                                <div className="flex justify-between text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                                    <span>{t('shipping')}</span>
                                    <span>{formatJOD(activeShippingFee, language)}</span>
                                </div>
                                <div className="border-t border-white/5 pt-10 flex justify-between text-2xl font-black uppercase tracking-widest text-white">
                                    <span>{t('total')}</span>
                                    <span className="text-[#f6eace]">{formatJOD(total, language)}</span>
                                </div>
                            </div>

                            <div className="mt-12 space-y-4">
                                <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">
                                    <div className="h-1.5 w-1.5 rounded-full bg-[#f6eace]" />
                                    {t('cash_on_delivery')}
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </section>
        </div>
    );
}


