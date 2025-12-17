# Role-Based Access Control (RBAC) System

This document explains the role-based access control system implemented in the Elite CRM Backend.

## User Roles

1. **Admin**
   - Full access to all system features
   - Can create, read, update, and delete team members
   - Can see all leads (assigned and unassigned)
   - Can assign leads to team members

2. **Manager**
   - Can view all team members
   - Can see all leads (assigned and unassigned)
   - Can assign leads to team members
   - Cannot delete team members

3. **Sales**
   - Can only see leads assigned to them
   - Can update leads assigned to them
   - Can add new leads
   - Cannot see other sales members' leads

4. **Marketing**
   - Has the same permissions as Sales
   - Can only see leads assigned to them
   - Can update leads assigned to them
   - Can add new leads
   - Cannot see other marketing members' leads

5. **Counsellor**
   - Has the same permissions as Sales and Marketing
   - Can only see leads assigned to them
   - Can update leads assigned to them
   - Can add new leads
   - Cannot see other counsellor members' leads

6. **Telecaller**
   - Has the same permissions as Sales and Marketing
   - Can only see leads assigned to them
   - Can update leads assigned to them
   - Can add new leads
   - Cannot see other telecaller members' leads

## API Endpoints

### Authentication
- `POST /auth/login` - Login endpoint for all user roles

### Team Management
- `POST /team/create` - Create a new team member (Admin only)
- `GET /team/get-all` - Get all team members (Admin and Manager only)
- `GET /team/:id` - Get a specific team member (Admin and Manager only)
- `PUT /team/:id` - Update a team member (Admin only)
- `DELETE /team/:id` - Delete a team member (Admin only)

### Lead Management
- `POST /form/create-form` - Create a new lead (All authenticated users)
- `GET /form/read-form` - Get leads based on user role:
  - Admin/Manager: All leads
  - Sales/Marketing/Counsellor/Telecaller: Only leads assigned to them
- `GET /form/read-all-forms` - Get all leads (Admin and Manager only)
- `GET /form/unassigned` - Get unassigned leads (Admin and Manager only)
- `GET /form/assigned/:salesId` - Get leads assigned to a specific sales member (Admin and Manager only)
- `PATCH /form/update/:id` - Update lead details:
  - Admin/Manager: Any lead
  - Sales/Marketing/Counsellor/Telecaller: Only leads assigned to them
- `PATCH /form/:id/read` - Mark lead as read:
  - Admin/Manager: Any lead
  - Sales/Marketing/Counsellor/Telecaller: Only leads assigned to them
- `PATCH /form/:id/status` - Update lead status:
  - Admin/Manager: Any lead
  - Sales/Marketing/Counsellor/Telecaller: Only leads assigned to them
- `PATCH /form/:id/assign` - Assign lead to a team member (Admin and Manager only)

## Environment Variables

To configure the RBAC system, you need to set the following environment variables in your `.env` file:

```
# Admin Credentials
ADMIN_EMAIL=your_admin_email@example.com
ADMIN_PASSWORD=your_admin_password

# Manager Credentials (multiple emails separated by commas)
MANAGER_EMAILS=manager1@example.com,manager2@example.com
MANAGER_PASSWORD=your_manager_password

# JWT Secret
JWT_SECRET=your_jwt_secret_key
```

## Implementation Details

### Authentication Flow
1. Users authenticate via `POST /auth/login` with their email and password
2. Based on the email and password combination, the system determines the user role:
   - If email matches `ADMIN_EMAIL` and password matches `ADMIN_PASSWORD`, role is "admin"
   - If email is in `MANAGER_EMAILS` and password matches `MANAGER_PASSWORD`, role is "manager"
   - If email and password match a team member in the database, role is determined by the team member's role
3. A JWT token is generated with the user's email, role, and ID (for database users)
4. The token is used in the `Authorization` header for all subsequent requests

### Authorization Middleware
- `verifyToken` - Verifies the JWT token and attaches user information to the request
- `isAdmin` - Ensures the user has admin role
- `isAdminOrManager` - Ensures the user has admin or manager role
- `isAuthenticated` - Ensures the user is authenticated

## Role Permissions Summary

| Action | Admin | Manager | Sales | Marketing | Counsellor | Telecaller |
|--------|-------|---------|-------|-----------|------------|------------|
| Create team members | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View all team members | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Update team members | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Delete team members | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View all leads | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| View assigned leads only | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Assign leads | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Update any lead | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Update assigned leads | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Add new leads | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |