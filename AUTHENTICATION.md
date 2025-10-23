# Authentication System

## Overview

The Football Tournament Management System now includes a comprehensive authentication system with role-based access control.

## Features

### 1. User Roles
- **Admin**: Full access to create, edit, and delete tournaments, teams, and matches
- **Guest** (No login): Can view tournaments, matches, standings, and team information

### 2. Public Pages (No Authentication Required)
- Home page
- Tournament list and details
- Team list and details
- Match list and fixture
- Standings

### 3. Protected Pages (Admin Only)
- Create/Edit/Delete Tournaments
- Create/Edit/Delete Teams  
- Add/Remove Players
- Generate Fixtures
- Update Match Scores
- Enter Match Statistics

## Getting Started

### Step 1: Create Initial Admin User

After starting the backend server, create an initial admin account:

```bash
# Using curl (PowerShell)
curl -X POST http://localhost:5004/api/auth/init-admin

# Using browser
# Navigate to: http://localhost:5004/api/auth/init-admin
```

**Default Admin Credentials:**
- Username: `admin`
- Password: `admin123`

⚠️ **Important**: Change the default password immediately after first login!

### Step 2: Login

1. Navigate to http://localhost:3005/login
2. Enter credentials:
   - Username: `admin`
   - Password: `admin123`
3. Click "Giriş Yap"

### Step 3: Use the System

Once logged in as admin, you can:
- Create tournaments
- Manage teams
- Generate fixtures
- Enter match scores
- View all statistics

### Creating Additional Users

Users can register themselves at http://localhost:3005/register

**Registration Fields:**
- Username (required, unique)
- Name (required)
- Email (required, unique)
- Password (min 6 characters)

New users will have "user" role by default (view-only access).

## Guest Access

Guests can access the application without logging in and view:
- All tournaments
- Match fixtures
- Standings
- Team information

They will see "Ziyaretçi olarak devam et" (Continue as Guest) link on the login page.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)
- `POST /api/auth/init-admin` - Create initial admin

### Protected Endpoints (Admin Only)
- `POST /api/tournaments` - Create tournament
- `PUT /api/tournaments/:id` - Update tournament
- `DELETE /api/tournaments/:id` - Delete tournament
- `POST /api/tournaments/:id/fixture` - Generate fixture
- `POST /api/teams` - Create team
- `PUT /api/matches/:id/score` - Update score

### Public Endpoints
- `GET /api/tournaments` - List tournaments
- `GET /api/tournaments/:id` - Get tournament details
- `GET /api/matches` - List matches
- `GET /api/matches/standings/:tournamentId` - Get standings
- `GET /api/teams` - List teams

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Token expiration (7 days)
- Automatic token refresh
- Role-based access control
- Protected routes

## Frontend Features

- Login/Register pages
- Authentication context
- Automatic token management
- Conditional UI rendering based on role
- Logout functionality
- Guest mode support

## Technical Details

### Backend
- JWT Secret stored in `.env` file
- Token expiration: 7 days
- Password minimum length: 6 characters
- Bcrypt hash rounds: 10

### Frontend
- Token stored in localStorage
- Automatic token injection in API requests
- Auto-redirect on 401 responses
- Protected route components

## Troubleshooting

### Cannot login
1. Ensure backend is running on port 5004
2. Check if MongoDB is running
3. Verify JWT_SECRET is set in backend .env
4. Clear browser localStorage and try again

### 401 Unauthorized errors
1. Token might be expired - logout and login again
2. Token might be invalid - clear localStorage
3. Backend JWT_SECRET might have changed

### Admin creation fails
1. Admin user might already exist
2. Check MongoDB connection
3. Verify backend logs for errors

## Next Steps

Future enhancements:
- Password reset functionality
- Email verification
- Multi-factor authentication
- User profile management
- Password change feature
- Session management
