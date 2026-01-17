// API service for communicating with the CDP backend

const API_BASE_URL = '/api';

// Helper function for API calls
async function fetchAPI(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    // Get token from localStorage
    const token = localStorage.getItem('token');

    const headers = {
        // Only set Content-Type if body is not FormData or URLSearchParams
        ...((options.body instanceof FormData || options.body instanceof URLSearchParams) ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers
    };

    const config = {
        ...options,
        headers
    };

    const response = await fetch(url, config);

    if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('token');
        // Ideally redirect to login, but let consumer handle it or reload
        // window.location.href = '/login'; 
    }

    if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
}

const api = {
    get: (endpoint) => fetchAPI(endpoint, { method: 'GET' }),
    post: (endpoint, body, options = {}) => {
        const isFormData = body instanceof FormData || body instanceof URLSearchParams;
        return fetchAPI(endpoint, {
            method: 'POST',
            body: isFormData ? body : JSON.stringify(body),
            ...options
        });
    },
    put: (endpoint, body) => {
        const isFormData = body instanceof FormData || body instanceof URLSearchParams;
        return fetchAPI(endpoint, {
            method: 'PUT',
            body: isFormData ? body : JSON.stringify(body)
        });
    },
    delete: (endpoint) => fetchAPI(endpoint, { method: 'DELETE' }),
    // expose raw fetch for special cases
    fetch: fetchAPI
};

export default api;

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
    getDetails: (id) => fetchAPI(`/customers/${id}/details`),
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
        if (params.min_price) searchParams.append('min_price', params.min_price);
        if (params.max_price) searchParams.append('max_price', params.max_price);
        if (params.predicted_need) searchParams.append('predicted_need', params.predicted_need);
        if (params.sort_by) searchParams.append('sort_by', params.sort_by);
        if (params.sort_order) searchParams.append('sort_order', params.sort_order);

        const queryString = searchParams.toString();
        return fetchAPI(`/inventory${queryString ? `?${queryString}` : ''}`);
    },
    getById: (id) => fetchAPI(`/inventory/${id}`),
    create: (data) => fetchAPI('/inventory', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id, data) => fetchAPI(`/inventory/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    delete: (id) => fetchAPI(`/inventory/${id}`, {
        method: 'DELETE',
    }),
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
    generateFromAI: (prompt) => fetchAPI('/segments/ai-generate', {
        method: 'POST',
        body: JSON.stringify({ prompt }),
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
    aiGenerate: (prompt) => fetchAPI('/flows/ai-generate', {
        method: 'POST',
        body: JSON.stringify({ prompt }),
    }),
};

// export default api; // Removed duplicate
