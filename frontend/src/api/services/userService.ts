import api from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { ApiResponse, User } from '@/types/user.types';

export const userService = {
	async getMe() {
		const res = await api.get<ApiResponse<User>>(ENDPOINTS.users.me);
		return res.data.data;
	},
};

