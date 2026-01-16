// API service for communicating with the backend

const API_BASE_URL = '/api';

// Helper function for API calls
async function fetchAPI(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const response = await fetch(url, { ...defaultOptions, ...options });

    if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
}

// Dashboard API
export const dashboardAPI = {
    getStats: () => fetchAPI('/dashboard/stats'),
    getInsights: () => fetchAPI('/dashboard/insights'),
};

// Customers API
export const customersAPI = {
    getAll: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.page) searchParams.append('page', params.page);
        if (params.per_page) searchParams.append('per_page', params.per_page);
        if (params.search) searchParams.append('search', params.search);
        if (params.status) searchParams.append('status', params.status);
        if (params.sort_by) searchParams.append('sort_by', params.sort_by);
        if (params.sort_order) searchParams.append('sort_order', params.sort_order);

        const queryString = searchParams.toString();
        return fetchAPI(`/customers${queryString ? `?${queryString}` : ''}`);
    },
    getById: (id) => fetchAPI(`/customers/${id}`),
    create: (data) => fetchAPI('/customers', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
};

// Orders API
export const ordersAPI = {
    getAll: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.page) searchParams.append('page', params.page);
        if (params.per_page) searchParams.append('per_page', params.per_page);
        if (params.search) searchParams.append('search', params.search);
        if (params.status) searchParams.append('status', params.status);
        if (params.sort_by) searchParams.append('sort_by', params.sort_by);
        if (params.sort_order) searchParams.append('sort_order', params.sort_order);

        const queryString = searchParams.toString();
        return fetchAPI(`/orders${queryString ? `?${queryString}` : ''}`);
    },
    getById: (id) => fetchAPI(`/orders/${id}`),
};

// Inventory API
export const inventoryAPI = {
    getStats: () => fetchAPI('/inventory/stats'),
    getCategories: () => fetchAPI('/inventory/categories'),
    getAll: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.page) searchParams.append('page', params.page);
        if (params.per_page) searchParams.append('per_page', params.per_page);
        if (params.search) searchParams.append('search', params.search);
        if (params.status) searchParams.append('status', params.status);
        if (params.category) searchParams.append('category', params.category);
        if (params.sort_by) searchParams.append('sort_by', params.sort_by);
        if (params.sort_order) searchParams.append('sort_order', params.sort_order);

        const queryString = searchParams.toString();
        return fetchAPI(`/inventory${queryString ? `?${queryString}` : ''}`);
    },
    getById: (id) => fetchAPI(`/inventory/${id}`),
};

export default {
    dashboard: dashboardAPI,
    customers: customersAPI,
    orders: ordersAPI,
    inventory: inventoryAPI,
};
