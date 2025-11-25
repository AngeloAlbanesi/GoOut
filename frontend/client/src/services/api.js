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
    loginWithGoogle: (credential) => { return apiClient.post('auth/google', { credential });},
    registerWithGoogle: (payload) => { return apiClient.post('auth/google/register', payload);},
    logout: () =>   {return apiClient.post ('auth/logout'); }, 
    
};
export const userService = {
    mieiDati: () => {return apiClient.get(`users/mieiDati`);}
    ,
    updateProfile: (data) => { return apiClient.patch('users/me', data); }
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