import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const api = axios.create({
	baseURL: API_BASE_URL,
	headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
	const token = localStorage.getItem('authToken');
	if (token) {
		config.headers = config.headers ?? {} as any;
		(config.headers as any).Authorization = `Bearer ${token}`;
	}
	return config;
});

api.interceptors.response.use(
	(res) => res,
	(err) => {
		if (err.response?.status === 401) {
			localStorage.removeItem('authToken');
			localStorage.removeItem('authUser');
			localStorage.removeItem('isAuthenticated');
			window.location.href = '/auth';
		}
		return Promise.reject(err);
	}
);

export default api;

