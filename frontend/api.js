// API Configuration with Intelligent Fallback (Local & Cloud)
function getPrimaryApiUrl() {
    if (window.API_BASE_URL) return window.API_BASE_URL;
    const stored = localStorage.getItem('API_BASE_URL');
    if (stored) return stored;
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        return 'http://localhost:5001/api';
    }
    return 'https://freelancer-5y96.onrender.com/api';
}

function getFallbackApiUrl() {
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        return 'https://freelancer-5y96.onrender.com/api';
    }
    return 'http://localhost:5001/api';
}

let activeApiBaseUrl = getPrimaryApiUrl();
const API_BASE_URL = activeApiBaseUrl; // For backwards compatibility

// Helper function to get auth token
function getAuthToken() {
    return localStorage.getItem('authToken');
}

// Helper function to set auth token
function setAuthToken(token) {
    localStorage.setItem('authToken', token);
}

// Helper function to remove auth token
function removeAuthToken() {
    localStorage.removeItem('authToken');
}

// API request helper with automatic local-to-cloud fallback
async function apiRequest(endpoint, options = {}) {
    const token = getAuthToken();
    
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        },
        ...options
    };

    if (options.body && typeof options.body === 'object') {
        config.body = JSON.stringify(options.body);
    }

    // Try primary active URL first
    try {
        const url = `${activeApiBaseUrl}${endpoint}`;
        const response = await fetch(url, config);
        const data = await response.json().catch(() => ({}));
        
        if (!response.ok) {
            throw new Error(data.message || 'Request failed');
        }
        
        return data;
    } catch (primaryError) {
        // If it's a network connection error, attempt the fallback URL
        const fallbackUrl = activeApiBaseUrl === getPrimaryApiUrl() ? getFallbackApiUrl() : getPrimaryApiUrl();
        if (fallbackUrl && fallbackUrl !== activeApiBaseUrl) {
            try {
                const retryUrl = `${fallbackUrl}${endpoint}`;
                const response = await fetch(retryUrl, config);
                const data = await response.json().catch(() => ({}));
                if (response.ok) {
                    activeApiBaseUrl = fallbackUrl; // Switch active base URL for future calls
                    return data;
                }
            } catch (fallbackError) {
                // Both failed, rethrow primary error
            }
        }
        console.error('API Error:', primaryError);
        throw primaryError;
    }
}

// Auth API
const authAPI = {
    register: async (userData) => {
        return await apiRequest('/auth/register', {
            method: 'POST',
            body: userData
        });
    },
    
    login: async (email, password) => {
        return await apiRequest('/auth/login', {
            method: 'POST',
            body: { email, password }
        });
    },
    
    getCurrentUser: async () => {
        return await apiRequest('/auth/me');
    }
};

// Users API
const usersAPI = {
    getFreelancers: async (search = '', skill = '') => {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (skill) params.append('skill', skill);
        const query = params.toString() ? `?${params.toString()}` : '';
        return await apiRequest(`/users/freelancers${query}`);
    },
    
    getUser: async (id) => {
        return await apiRequest(`/users/${id}`);
    },
    
    updateProfile: async (profileData, extra = {}) => {
        return await apiRequest('/users/profile', {
            method: 'PUT',
            body: { profile: profileData, ...extra }
        });
    }
};

// Jobs API
const jobsAPI = {
    getJobs: async () => {
        return await apiRequest('/jobs');
    },
    
    getJob: async (id) => {
        return await apiRequest(`/jobs/${id}`);
    },
    
    createJob: async (jobData) => {
        return await apiRequest('/jobs', {
            method: 'POST',
            body: jobData
        });
    },
    
    getMyJobs: async () => {
        return await apiRequest('/jobs/client/my-jobs');
    },

    updateJob: async (id, jobData) => {
        return await apiRequest(`/jobs/${id}`, {
            method: 'PUT',
            body: jobData
        });
    },

    closeJob: async (id) => {
        return await apiRequest(`/jobs/${id}/close`, {
            method: 'POST'
        });
    },

    deleteJob: async (id) => {
        return await apiRequest(`/jobs/${id}`, {
            method: 'DELETE'
        });
    }
};

// Contact Requests API
const contactRequestsAPI = {
    createRequest: async (requestData) => {
        return await apiRequest('/contact-requests', {
            method: 'POST',
            body: requestData
        });
    },
    
    getFreelancerRequests: async () => {
        return await apiRequest('/contact-requests/freelancer/my-requests');
    },
    
    getClientRequests: async () => {
        return await apiRequest('/contact-requests/client/my-requests');
    },
    
    acceptRequest: async (requestId) => {
        return await apiRequest(`/contact-requests/${requestId}/accept`, {
            method: 'POST'
        });
    }
};

// Job Applications API
const jobApplicationsAPI = {
    applyToJob: async (jobId) => {
        return await apiRequest('/job-applications', {
            method: 'POST',
            body: { jobId }
        });
    },
    
    getMyApplications: async () => {
        return await apiRequest('/job-applications/freelancer/my-applications');
    },

    getClientApplications: async () => {
        return await apiRequest('/job-applications/client/my-applications');
    },

    acceptApplication: async (applicationId) => {
        return await apiRequest(`/job-applications/${applicationId}/accept`, {
            method: 'POST'
        });
    }
};

// Connections API
const connectionsAPI = {
    getMyConnections: async () => {
        return await apiRequest('/connections/my-connections');
    },
    
    getConnection: async (id) => {
        return await apiRequest(`/connections/${id}`);
    },

    emergencyQuit: async (id, workUrl, reason) => {
        return await apiRequest(`/connections/${id}/emergency-quit`, {
            method: 'POST',
            body: { workUrl, reason }
        });
    }
};

// Platform Statistics & Live Activity Feed API
const statsAPI = {
    getStats: async () => {
        return await apiRequest('/stats');
    },
    getActivity: async () => {
        return await apiRequest('/stats/activity');
    }
};

// Interactive AI Assistant API
const aiAPI = {
    ask: async (query, history = []) => {
        return await apiRequest('/ai/assistant', {
            method: 'POST',
            body: { query, history }
        });
    }
};

