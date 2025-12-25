export const STORAGE_KEYS = {
	token: 'authToken',
	user: 'authUser',
	isAuthenticated: 'isAuthenticated',
	selectedModule: 'selectedModule',
} as const;

export const ROLES = {
  ADMIN: 'ADMIN',
  CASHIER: 'CASHIER',
} as const;

export type RoleValue = typeof ROLES[keyof typeof ROLES];

