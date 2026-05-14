import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';

const LEGACY_CART_KEY = 'sirius_cart_items';
const CARTS_KEY = 'sirius_cart_items_by_owner';
const CartContext = createContext(null);

function readCartMap() {
    try {
        const map = JSON.parse(localStorage.getItem(CARTS_KEY) || '{}');
        if (map && typeof map === 'object' && !Array.isArray(map)) {
            return map;
        }
    } catch {
        // ignore parse errors
    }

    // One-time migration from legacy single-cart storage.
    try {
        const legacyItems = JSON.parse(localStorage.getItem(LEGACY_CART_KEY) || '[]');
        if (Array.isArray(legacyItems) && legacyItems.length) {
            const migrated = { guest: legacyItems };
            localStorage.setItem(CARTS_KEY, JSON.stringify(migrated));
            localStorage.removeItem(LEGACY_CART_KEY);
            return migrated;
        }
    } catch {
        // ignore legacy parse errors
    }

    return {};
}

export function CartProvider({ children }) {
    const { user } = useAuth();
    const ownerKey = user?.id ? `user_${user.id}` : 'guest';
    const [items, setItems] = useState(() => {
        const map = readCartMap();
        return Array.isArray(map[ownerKey]) ? map[ownerKey] : [];
    });

    useEffect(() => {
        const map = readCartMap();
        setItems(Array.isArray(map[ownerKey]) ? map[ownerKey] : []);
    }, [ownerKey]);

    useEffect(() => {
        const map = readCartMap();
        map[ownerKey] = items;
        localStorage.setItem(CARTS_KEY, JSON.stringify(map));
    }, [items, ownerKey]);

    const value = useMemo(() => {
        const itemsCount = items.reduce((sum, item) => sum + item.quantity, 0);
        const subtotal = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
        const shippingFee = subtotal === 0 ? 0 : 3;
        const total = subtotal + shippingFee;

        return {
            items,
            itemsCount,
            subtotal,
            shippingFee,
            total,
            addItem(product, quantity = 1, size = null) {
                setItems((previous) => {
                    const targetSize = size || '';
                    const index = previous.findIndex((entry) => entry.product_id === product.id && (entry.size || '') === targetSize);

                    if (index === -1) {
                        return [
                            ...previous,
                            {
                                product_id: product.id,
                                name: product.name,
                                slug: product.slug,
                                image: product.image,
                                category: product.category || null,
                                price: Number(product.price),
                                size: size || null,
                                quantity,
                            },
                        ];
                    }

                    const next = [...previous];
                    next[index] = {
                        ...next[index],
                        quantity: Math.min(next[index].quantity + quantity, 20),
                    };
                    return next;
                });
            },
            updateQuantity(productId, size, quantity) {
                setItems((previous) => previous.map((entry) => {
                    if (entry.product_id === productId && (entry.size || '') === (size || '')) {
                        return {
                            ...entry,
                            quantity: Math.max(1, Math.min(quantity, 20)),
                        };
                    }

                    return entry;
                }));
            },
            removeItem(productId, size) {
                setItems((previous) => previous.filter((entry) => !(entry.product_id === productId && (entry.size || '') === (size || ''))));
            },
            clearCart() {
                setItems([]);
            },
        };
    }, [items]);

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
    const context = useContext(CartContext);

    if (!context) {
        throw new Error('useCart must be used within CartProvider');
    }

    return context;
}
