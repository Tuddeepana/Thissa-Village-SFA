export type Role = 'ADMIN' | 'CASHIER' | 'STEWARD';
export type ProfileType = 'Restaurant' | 'Bar';

export interface User {
	id: string;
	email: string;
	name: string;
	nic: string;
	role: Role;
	status: string;
	profileType?: ProfileType | null;
	createdAt?: string;
	updatedAt?: string;
}

export interface AuthResponse {
	user: User;
	token: string;
}

export interface LoginPayload {
	email: string;
	password: string;
}

export interface ApiResponse<T> {
	success: boolean;
	message?: string;
	data: T;
	timestamp?: string;
}

// Backend query and payload types for user operations
export type ListUsersQuery = {
	search?: string;
	role?: Role;
	status?: string; // 'Active' | 'Inactive'
	page?: number;
	limit?: number;
};

export type RegisterUserPayload = {
	email: string;
	password: string;
	name: string;
	nic: string;
	role?: Role; // defaults to CASHIER on backend
	profileType?: ProfileType | null;
};

export type UpdateUserPayload = Partial<{
	email: string;
	password: string;
	name: string;
	nic: string;
	role: Role;
	status: string; // 'Active' | 'Inactive'
	profileType?: ProfileType | null;
}>;

