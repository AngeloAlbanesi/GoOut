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