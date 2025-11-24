//services/api.js
import axios from 'axios';

const apiClient = axios.create({ baseURL: 'http://localhost:3001/api',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                withCredentials:true 
});


export const authService = {
    register: (userData) => { return apiClient.post('auth/register', userData);},
    login: (loginData) => { return apiClient.post('auth/login',loginData);},
    logout: () =>   {return apiClient.post ('auth/logout'); }, 
    
};

export const userService = {
    mieiDati: () => {return apiClient.get(`users/mieiDati`);}
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
    const res = await fetch(`/api/events/future?page=${page}&limit=${limit}`, {
        headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || res.statusText);
    }
    return res.json(); // { page, limit, total, events: [...] }
};