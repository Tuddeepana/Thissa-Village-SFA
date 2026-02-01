export const ENDPOINTS = {
	users: {
		login: '/users/login',
		me: '/users/me',
		base: '/users',
		register: '/users/register',
		byId: (id: string) => `/users/${id}`,
		permanentDelete: (id: string) => `/users/${id}/permanent`,
	},
	categories: '/categories',
	units: '/units',
	products: '/products',
	salesSummary: '/sales-summary',
};

