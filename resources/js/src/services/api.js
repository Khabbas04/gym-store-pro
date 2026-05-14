const JSON_HEADERS = { Accept: 'application/json' };

function withAuthHeaders(headers = {}, token) {
    const storedToken = token || localStorage.getItem('sirius_auth_token');

    if (!storedToken) {
        return headers;
    }

    return {
        ...headers,
        Authorization: `Bearer ${storedToken}`,
    };
}

async function request(url, options = {}) {
    const response = await fetch(url, options);

    if (response.status === 204) {
        return null;
    }

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
        const firstError = Object.values(payload.errors || {})[0]?.[0];
        throw new Error(firstError || payload.message || 'Request failed.');
    }

    return payload;
}

export function getProducts(params = {}) {
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            query.set(key, String(value));
        }
    });

    const url = query.toString() ? `/api/products?${query.toString()}` : '/api/products';
    return request(url, { headers: JSON_HEADERS });
}

export function getProduct(id) {
    return request(`/api/products/${id}`, { headers: JSON_HEADERS });
}

export function createProduct(data) {
    return request('/api/products', {
        method: 'POST',
        headers: withAuthHeaders({
            ...JSON_HEADERS,
            'Content-Type': 'application/json',
        }),
        body: JSON.stringify(data),
    });
}

export function updateProduct(id, data) {
    return request(`/api/products/${id}`, {
        method: 'PUT',
        headers: withAuthHeaders({
            ...JSON_HEADERS,
            'Content-Type': 'application/json',
        }),
        body: JSON.stringify(data),
    });
}

export function updateAdminProductInventory(productId, data) {
    return request(`/api/admin/products/${productId}/inventory`, {
        method: 'PATCH',
        headers: withAuthHeaders({
            ...JSON_HEADERS,
            'Content-Type': 'application/json',
        }),
        body: JSON.stringify(data),
    });
}

export function deleteProduct(id) {
    return request(`/api/products/${id}`, {
        method: 'DELETE',
        headers: withAuthHeaders(JSON_HEADERS),
    });
}

export function getCategories() {
    return request('/api/categories', { headers: JSON_HEADERS });
}

export function getHomepageSections() {
    return request('/api/homepage/sections', { headers: JSON_HEADERS });
}

export function getDashboardSummary() {
    return request('/api/dashboard/summary', { headers: withAuthHeaders(JSON_HEADERS) });
}

export function checkoutOrder(data) {
    return request('/api/checkout', {
        method: 'POST',
        headers: withAuthHeaders({
            ...JSON_HEADERS,
            'Content-Type': 'application/json',
        }),
        body: JSON.stringify(data),
    });
}

export function getMyOrders(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            query.set(key, String(value));
        }
    });

    const url = query.toString() ? `/api/orders/my?${query.toString()}` : '/api/orders/my';
    return request(url, { headers: withAuthHeaders(JSON_HEADERS) });
}

export function getMyWishlist(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            query.set(key, String(value));
        }
    });

    const url = query.toString() ? `/api/wishlist?${query.toString()}` : '/api/wishlist';
    return request(url, { headers: withAuthHeaders(JSON_HEADERS) });
}

export function toggleWishlist(productId) {
    return request(`/api/wishlist/${productId}`, {
        method: 'POST',
        headers: withAuthHeaders(JSON_HEADERS),
    });
}

export function getProductReviews(productId, params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            query.set(key, String(value));
        }
    });

    const url = query.toString() ? `/api/products/${productId}/reviews?${query.toString()}` : `/api/products/${productId}/reviews`;
    return request(url, { headers: JSON_HEADERS });
}

export function upsertProductReview(productId, data) {
    return request(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: withAuthHeaders({
            ...JSON_HEADERS,
            'Content-Type': 'application/json',
        }),
        body: JSON.stringify(data),
    });
}

export function markRecentlyViewed(productId) {
    return request(`/api/products/${productId}/recently-viewed`, {
        method: 'POST',
        headers: withAuthHeaders(JSON_HEADERS),
    });
}

export function getRecentlyViewed() {
    return request('/api/recently-viewed', { headers: withAuthHeaders(JSON_HEADERS) });
}

export function getAdminDashboard() {
    return request('/api/admin/dashboard', { headers: withAuthHeaders(JSON_HEADERS) });
}

export function getAdminOrders(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            query.set(key, String(value));
        }
    });

    const url = query.toString() ? `/api/admin/orders?${query.toString()}` : '/api/admin/orders';
    return request(url, { headers: withAuthHeaders(JSON_HEADERS) });
}

export function updateAdminOrderStatus(orderId, status) {
    return request(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: withAuthHeaders({
            ...JSON_HEADERS,
            'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ status }),
    });
}

export function updateAdminOrder(orderId, data) {
    return request(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: withAuthHeaders({
            ...JSON_HEADERS,
            'Content-Type': 'application/json',
        }),
        body: JSON.stringify(data),
    });
}

export function deleteAdminOrder(orderId) {
    return request(`/api/admin/orders/${orderId}`, {
        method: 'DELETE',
        headers: withAuthHeaders(JSON_HEADERS),
    });
}

export function getAdminUsers(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            query.set(key, String(value));
        }
    });

    const url = query.toString() ? `/api/admin/users?${query.toString()}` : '/api/admin/users';
    return request(url, { headers: withAuthHeaders(JSON_HEADERS) });
}

export function getAdminActivityLogs(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            query.set(key, String(value));
        }
    });

    const url = query.toString() ? `/api/admin/activity-logs?${query.toString()}` : '/api/admin/activity-logs';
    return request(url, { headers: withAuthHeaders(JSON_HEADERS) });
}

export function registerAuth(data) {
    return request('/api/auth/register', {
        method: 'POST',
        headers: {
            ...JSON_HEADERS,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
}

export function loginAuth(data) {
    return request('/api/auth/login', {
        method: 'POST',
        headers: {
            ...JSON_HEADERS,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
}

export function meAuth(token) {
    return request('/api/auth/me', { headers: withAuthHeaders(JSON_HEADERS, token) });
}

export function logoutAuth(token) {
    return request('/api/auth/logout', {
        method: 'POST',
        headers: withAuthHeaders(JSON_HEADERS, token),
    });
}
