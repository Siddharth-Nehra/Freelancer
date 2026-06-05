// API Configuration
const API_BASE_URL = 'http://localhost:5001/api';

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

// API request helper
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
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

    try {
        const response = await fetch(url, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Request failed');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
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
    
    updateProfile: async (profileData) => {
        return await apiRequest('/users/profile', {
            method: 'PUT',
            body: { profile: profileData }
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
    }
};

// Connections API
const connectionsAPI = {
    getMyConnections: async () => {
        return await apiRequest('/connections/my-connections');
    },
    
    getConnection: async (id) => {
        return await apiRequest(`/connections/${id}`);
    }
};

