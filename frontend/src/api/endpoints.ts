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
	tables: '/tables',
	rooms: '/rooms',
	roomBookings: '/room-bookings',
	products: '/products',
	salesSummary: '/sales-summary',
	expenses: {
		base: '/expenses',
		types: '/expenses/types',
		bulk: '/expenses/bulk',
		pnl: '/expenses/pnl',
		byId: (id: string) => `/expenses/${id}`,
		typeById: (id: string) => `/expenses/types/${id}`,
		restoreType: (id: string) => `/expenses/types/${id}/restore`,
	},
	orders: {
		base: '/orders',
		stats: '/orders/stats',
		tableStatus: '/orders/table-status',
		byId: (id: string) => `/orders/${id}`,
		status: (id: string) => `/orders/${id}/status`,
		addItems: (id: string) => `/orders/${id}/items`,
	},
	kot: {
		base: '/kot',
	},
	printers: {
		base: '/printers',
		byId: (id: string) => `/printers/${id}`,
		test: (id: string) => `/printers/${id}/test`,
		printKot: '/printers/print-kot',
	},
	config: {
		byKey: (key: string) => `/config/${key}`,
		base: '/config',
	},
	roomTypes: '/room-types',
};

