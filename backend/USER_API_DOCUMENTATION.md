# User API Documentation

## Overview
This document provides comprehensive documentation for the User CRUD and Authentication API endpoints.

## Base URL
```
http://localhost:5000/api/users
```

## Authentication
Most endpoints require authentication via JWT token. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Endpoints

### 1. Login (Public)
**POST** `/api/users/login`

Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "nic": "123456789V",
      "role": "CASHIER",
      "status": "Active"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Validation Rules:**
- `email`: Must be a valid email format (required)
- `password`: Minimum 1 character (required)

---

### 2. Register User (Admin Only)
**POST** `/api/users/register`

Create a new user account. Requires Admin authentication.

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "name": "Jane Smith",
  "nic": "987654321V",
  "role": "CASHIER" // Optional: ADMIN or CASHIER, defaults to CASHIER
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "newuser@example.com",
      "name": "Jane Smith",
      "nic": "987654321V",
      "role": "CASHIER",
      "status": "Active"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Validation Rules:**
- `email`: Valid email format (required)
- `password`: Minimum 6 characters (required)
- `name`: Minimum 2 characters (required)
- `nic`: Minimum 9 characters (required)
- `role`: Must be either "ADMIN" or "CASHIER" (optional)

---

### 3. Get Current User Profile (Authenticated)
**GET** `/api/users/me`

Get the profile of the currently logged-in user.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "nic": "123456789V",
    "role": "CASHIER",
    "status": "Active",
    "createdAt": "2025-12-13T10:00:00.000Z",
    "updatedAt": "2025-12-13T10:00:00.000Z"
  }
}
```

---

### 4. Update Current User Profile (Authenticated)
**PUT** `/api/users/me`

Update the profile of the currently logged-in user. Users can only update their own name, email, password, and NIC (not role or status).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body (all fields optional):**
```json
{
  "email": "newemail@example.com",
  "password": "newpassword123",
  "name": "John Updated",
  "nic": "111222333V"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "uuid",
    "email": "newemail@example.com",
    "name": "John Updated",
    "nic": "111222333V",
    "role": "CASHIER",
    "status": "Active",
    "createdAt": "2025-12-13T10:00:00.000Z",
    "updatedAt": "2025-12-13T11:00:00.000Z"
  }
}
```

---

### 5. Get All Users (Admin Only)
**GET** `/api/users`

Get a list of all users with optional filtering.

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Query Parameters (all optional):**
- `role`: Filter by role (ADMIN or CASHIER)
- `status`: Filter by status (Active or Inactive)
- `search`: Search in name, email, or NIC

**Example:**
```
GET /api/users?role=CASHIER&status=Active&search=john
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "nic": "123456789V",
      "role": "CASHIER",
      "status": "Active",
      "createdAt": "2025-12-13T10:00:00.000Z",
      "updatedAt": "2025-12-13T10:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

### 6. Get User by ID (Admin Only)
**GET** `/api/users/:id`

Get details of a specific user by their ID.

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "nic": "123456789V",
    "role": "CASHIER",
    "status": "Active",
    "createdAt": "2025-12-13T10:00:00.000Z",
    "updatedAt": "2025-12-13T10:00:00.000Z"
  }
}
```

---

### 7. Update User (Admin Only)
**PUT** `/api/users/:id`

Update any user's details. Admins can update all fields including role and status.

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Request Body (all fields optional):**
```json
{
  "email": "updated@example.com",
  "password": "newpassword123",
  "name": "Updated Name",
  "nic": "999888777V",
  "role": "ADMIN",
  "status": "Inactive"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "id": "uuid",
    "email": "updated@example.com",
    "name": "Updated Name",
    "nic": "999888777V",
    "role": "ADMIN",
    "status": "Inactive",
    "createdAt": "2025-12-13T10:00:00.000Z",
    "updatedAt": "2025-12-13T12:00:00.000Z"
  }
}
```

---

### 8. Delete User - Soft Delete (Admin Only)
**DELETE** `/api/users/:id`

Soft delete a user by setting their status to "Inactive". The user data is retained in the database.

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

### 9. Permanently Delete User (Admin Only)
**DELETE** `/api/users/:id/permanent`

Permanently delete a user from the database. This action cannot be undone.

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "User permanently deleted successfully"
}
```

---

## Error Responses

### Validation Error (400 Bad Request)
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "code": "too_small",
      "minimum": 6,
      "type": "string",
      "inclusive": true,
      "exact": false,
      "message": "Password must be at least 6 characters",
      "path": ["password"]
    }
  ]
}
```

### Authentication Error (401 Unauthorized)
```json
{
  "success": false,
  "message": "No token provided. Please authenticate."
}
```

### Authorization Error (403 Forbidden)
```json
{
  "success": false,
  "message": "You do not have permission to access this resource",
  "requiredRoles": ["ADMIN"],
  "userRole": "CASHIER"
}
```

### Not Found (404 Not Found)
```json
{
  "success": false,
  "message": "User not found"
}
```

### Server Error (500 Internal Server Error)
```json
{
  "success": false,
  "message": "Authentication failed",
  "error": "Error message details"
}
```

---

## Security Features

### Password Security
- Passwords are hashed using bcrypt with 10 salt rounds
- Passwords are never returned in API responses
- Minimum password length: 6 characters

### JWT Token
- Tokens expire after 7 days
- Tokens include user ID, email, and role
- JWT secret is stored in environment variables

### Role-Based Access Control (RBAC)
- **Public**: Login endpoint
- **Authenticated**: Get own profile, update own profile
- **Admin Only**: Register users, manage all users, delete users

### Input Validation
- All inputs are validated using Zod schemas
- Email format validation
- Minimum length requirements
- Unique constraints on email and NIC

---

## Testing the API

### Using cURL

**Login:**
```bash
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'
```

**Get Profile:**
```bash
curl -X GET http://localhost:5000/api/users/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Register User (Admin):**
```bash
curl -X POST http://localhost:5000/api/users/register \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "password123",
    "name": "New User",
    "nic": "123456789V",
    "role": "CASHIER"
  }'
```

---

## Environment Variables Required

```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:root@localhost:5432/vinopos_db?schema=public"
JWT_SECRET=your-secret-key-change-this-in-production
CORS_ORIGIN=http://localhost:5173
```

**Important:** Change `JWT_SECRET` to a strong, random string in production!

---

## Next Steps

1. Start the server: `npm run dev`
2. Test the database connection: `GET http://localhost:5000/api/test-db`
3. Create your first admin user (use Prisma Studio or seed script)
4. Login and get a JWT token
5. Use the token to access protected endpoints
