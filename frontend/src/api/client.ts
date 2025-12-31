import axios from 'axios';
import { loadingStore } from '@/state/loadingStore';

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

	const meta = (config as any).meta as { showLoader?: 'global'|'local'|'none'; loaderKey?: string } | undefined;
	const show = meta?.showLoader ?? 'none';
	if (show === 'global') {
		( config as any).__loader = { type: 'global' };
		loadingStore.incrementGlobal();
	} else if (show === 'local' && meta?.loaderKey) {
		( config as any).__loader = { type: 'local', key: meta.loaderKey };
		loadingStore.incrementLocal(meta.loaderKey);
	} else {
		( config as any).__loader = { type: 'none' };
	}
	return config;
});

api.interceptors.response.use(
	(res) => {
		const loader = (res.config as any).__loader;
		if (loader?.type === 'global') loadingStore.decrementGlobal();
		else if (loader?.type === 'local' && loader?.key) loadingStore.decrementLocal(loader.key);
		return res;
	},
	(err) => {
		const loader = (err.config as any)?.__loader;
		if (loader?.type === 'global') loadingStore.decrementGlobal();
		else if (loader?.type === 'local' && loader?.key) loadingStore.decrementLocal(loader.key);

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

