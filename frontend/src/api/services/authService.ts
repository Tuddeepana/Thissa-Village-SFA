import api from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { ApiResponse, AuthResponse, LoginPayload, User } from '@/types/user.types';

export const authService = {
	async login(payload: LoginPayload) {
		const res = await api.post<ApiResponse<AuthResponse>>(ENDPOINTS.users.login, payload);
		return res.data.data;
	},
	async me() {
		const res = await api.get<ApiResponse<User>>(ENDPOINTS.users.me);
		return res.data.data;
	},
};

