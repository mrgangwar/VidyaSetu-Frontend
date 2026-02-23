import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use environment variable for API URL, fallback to production URL for development
const baseURL = process.env.EXPO_PUBLIC_API_URL || 'https://vidyasetu-backend-n7ob.onrender.com/api';

const apiClient = axios.create({
    baseURL: baseURL,
    timeout: 10000, 
});

apiClient.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // FormData check for file uploads
        if (config.data instanceof FormData) {
            config.headers['Content-Type'] = 'multipart/form-data';
        }

        return config;
    },
    (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        return Promise.reject(error);
    }
);

export default apiClient;