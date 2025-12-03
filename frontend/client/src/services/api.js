//services/api.js
import axios from 'axios';

const apiClient = axios.create({
    baseURL: 'http://localhost:3001/api',
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true
});


export const authService = {
    register: (userData) => { return apiClient.post('auth/register', userData); },
    login: (loginData) => { return apiClient.post('auth/login', loginData); },
    logout: () => { return apiClient.post('auth/logout'); },
    
    // Google Auth (da HEAD)
    loginWithGoogle: (credential) => { return apiClient.post('auth/google', { credential }); },
    registerWithGoogle: (payload) => { return apiClient.post('auth/google/register', payload); },
};

export const userService = {
    mieiDati: () => { return apiClient.get(`users/mieiDati`); },
    getProfile: () => { return apiClient.get('users/mieiDati'); }, // Aggiunto per compatibilità col branch feature
    
    updateProfile: (data) => { return apiClient.patch('users/me', data); },
    
    // Search (da HEAD)
    searchUsers: (query) => { return apiClient.get('users/search', { params: { q: query } }); },

    // Avatar & Password (da branch feature)
    uploadAvatar: (file) => {
        const formData = new FormData();
        formData.append('avatar', file);
        return apiClient.post('users/me/avatar', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
    removeAvatar: () => { return apiClient.delete('users/me/avatar'); },
    changePassword: (data) => { return apiClient.patch('users/me/password', data); },
};

export const eventService = {
    createEvent: (eventData) => apiClient.post('events', eventData),
    updateEvent: (id, eventData) => apiClient.put(`events/${id}`, eventData),
    deleteEvent: (id) => apiClient.delete(`events/${id}`),
    participate: (id) => apiClient.post(`events/${id}/participate`),
    cancelParticipation: (id) => apiClient.delete(`events/${id}/participate`),
    getMyEvents: () => apiClient.get('events/my-events'),
    getMyParticipations: () => apiClient.get('events/my-participations')
};

export async function fetchFutureEvents(page = 1, limit = 10) {
    const res = await apiClient.get('events/future', { params: { page, limit } });
    return res.data; // { page, limit, total, events: [...] }
};