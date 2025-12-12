//services/api.js
import axios from 'axios';

const apiClient = axios.create({
    baseURL: 'http://localhost:3001/api',
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true
});

// Flag per evitare loop infiniti di refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Interceptor per gestire automaticamente il refresh del token
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Se l'errore è 401 e non abbiamo già provato a refreshare
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // Se stiamo già facendo il refresh, mettiamo la richiesta in coda
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(() => {
                    return apiClient(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Tenta di rinnovare il token
                await axios.post('http://localhost:3001/api/auth/refresh-token', {}, {
                    withCredentials: true
                });

                processQueue(null);
                return apiClient(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError);
                // Il refresh è fallito, l'utente deve rifare il login
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);


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
    
    // Public Profile
    getPublicProfile: (id) => { return apiClient.get(`users/${id}`); },

    // Funzionalità Avatar e Password (Mantenuti da HEAD)
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
    getPublicUser: (id) => apiClient.get(`users/${id}`),
    followUser: (id) => apiClient.post(`users/${id}/follow`),
    unfollowUser: (id) => apiClient.delete(`users/${id}/follow`),
};

export const eventService = {
    createEvent: (eventData) => apiClient.post('events', eventData),
    updateEvent: (id, eventData) => apiClient.put(`events/${id}`, eventData),
    deleteEvent: (id) => apiClient.delete(`events/${id}`),
    participate: (id) => apiClient.post(`events/${id}/participate`),
    cancelParticipation: (id) => apiClient.delete(`events/${id}/participate`),
    getMyEvents: () => apiClient.get('events/my-events'),
    getMyParticipations: () => apiClient.get('events/my-participations'),
    getEventDetails: (id) => apiClient.get(`events/${id}`),
    getEventParticipants: (id) => apiClient.get(`events/${id}/participants`),
    getEventsFromFollowedUsers: (page = 1, limit = 10) => apiClient.get('events/from-followed', { params: { page, limit } }),
};

export async function fetchFutureEvents(page = 1, limit = 10) {
    const res = await apiClient.get('events/future', { params: { page, limit } });
    return res.data; // { page, limit, total, events: [...] }
};