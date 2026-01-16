// API service for communicating with the CDP backend

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
        if (params.state) searchParams.append('state', params.state);
        if (params.source) searchParams.append('source', params.source);
        if (params.sort_by) searchParams.append('sort_by', params.sort_by);
        if (params.sort_order) searchParams.append('sort_order', params.sort_order);

        const queryString = searchParams.toString();
        return fetchAPI(`/customers${queryString ? `?${queryString}` : ''}`);
    },
    getById: (id) => fetchAPI(`/customers/${id}`),
    getStates: () => fetchAPI('/customers/states'),
    getSources: () => fetchAPI('/customers/sources'),
    create: (data) => fetchAPI('/customers', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id, data) => fetchAPI(`/customers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    delete: (id) => fetchAPI(`/customers/${id}`, {
        method: 'DELETE',
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

// Segments API
export const segmentsAPI = {
    getAll: () => fetchAPI('/segments'),
    getById: (id) => fetchAPI(`/segments/${id}`),
    getCustomers: (id, params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.page) searchParams.append('page', params.page);
        if (params.per_page) searchParams.append('per_page', params.per_page);
        const queryString = searchParams.toString();
        return fetchAPI(`/segments/${id}/customers${queryString ? `?${queryString}` : ''}`);
    },
    create: (data) => fetchAPI('/segments', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id, data) => fetchAPI(`/segments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    delete: (id) => fetchAPI(`/segments/${id}`, {
        method: 'DELETE',
    }),
};

// Flows API
export const flowsAPI = {
    getAll: (status = null) => {
        const params = status ? `?status=${status}` : '';
        return fetchAPI(`/flows${params}`);
    },
    getById: (id) => fetchAPI(`/flows/${id}`),
    create: (data) => fetchAPI('/flows', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id, data) => fetchAPI(`/flows/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    delete: (id) => fetchAPI(`/flows/${id}`, {
        method: 'DELETE',
    }),
    addStep: (flowId, stepData) => fetchAPI(`/flows/${flowId}/steps`, {
        method: 'POST',
        body: JSON.stringify(stepData),
    }),
    updateStep: (flowId, stepId, stepData) => fetchAPI(`/flows/${flowId}/steps/${stepId}`, {
        method: 'PUT',
        body: JSON.stringify(stepData),
    }),
    deleteStep: (flowId, stepId) => fetchAPI(`/flows/${flowId}/steps/${stepId}`, {
        method: 'DELETE',
    }),
};

export default {
    dashboard: dashboardAPI,
    customers: customersAPI,
    orders: ordersAPI,
    inventory: inventoryAPI,
    segments: segmentsAPI,
    flows: flowsAPI,
};
