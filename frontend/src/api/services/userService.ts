import api from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { ApiResponse, User, Role, ListUsersQuery, RegisterUserPayload, UpdateUserPayload } from '@/types/user.types';

export const userService = {
	async getMe() {
		const res = await api.get<ApiResponse<User>>(ENDPOINTS.users.me);
		return res.data.data;
	},

	async listUsers(query: ListUsersQuery = {}) {
		const res = await api.get<ApiResponse<User[]>>(ENDPOINTS.users.base, {
			params: query,
		});
		// Backend returns { success, data: users[], count }
		return {
			users: res.data.data ?? [],
			count: (res.data as any).count as number | undefined,
		};
	},

	async registerUser(payload: RegisterUserPayload) {
		const res = await api.post<ApiResponse<{ user: User; token: string }>>(
			ENDPOINTS.users.register,
			payload,
		);
		return res.data.data.user;
	},

	async updateUser(id: string, payload: UpdateUserPayload) {
		const res = await api.put<ApiResponse<User>>(ENDPOINTS.users.byId(id), payload);
		return res.data.data;
	},

	async deleteUser(id: string) {
		const res = await api.delete<ApiResponse<null>>(ENDPOINTS.users.byId(id));
		return res.data.success;
	},

	async permanentlyDeleteUser(id: string) {
		const res = await api.delete<ApiResponse<null>>(ENDPOINTS.users.permanentDelete(id));
		return res.data.success;
	},
};
