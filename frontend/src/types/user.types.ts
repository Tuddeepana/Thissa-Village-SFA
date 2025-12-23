export type Role = 'ADMIN' | 'CASHIER';

export interface User {
	id: string;
	email: string;
	name: string;
	nic: string;
	role: Role;
	status: string;
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

