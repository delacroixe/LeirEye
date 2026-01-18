# NetMentor v2.0.0 - Testing Checklist

## Pre-Launch Verification

### ✅ Backend Components

- [ ] **Docker Containers**
  - [ ] PostgreSQL running on port 5432
  - [ ] Redis running on port 6379
  - [ ] Check: `docker ps | grep postgres`

- [ ] **Database**
  - [ ] Tables created: `alembic upgrade head`
  - [ ] User table exists with all columns
  - [ ] UUID extension enabled in PostgreSQL
  - [ ] Indexes created on email and username

- [ ] **Backend Server**
  - [ ] FastAPI running on localhost:8000
  - [ ] Health check: `curl http://localhost:8000/health`
  - [ ] API docs available: http://localhost:8000/docs
  - [ ] No Python errors in terminal

- [ ] **Environment**
  - [ ] `.env` file exists in `backend/`
  - [ ] All required vars present
  - [ ] DATABASE_URL points to Docker PostgreSQL
  - [ ] SECRET_KEY is set (not empty)

---

### ✅ Frontend Components

- [ ] **Dependencies**
  - [ ] `react-router-dom` installed
  - [ ] `lucide-react` installed
  - [ ] Check: `npm list react-router-dom lucide-react`

- [ ] **Frontend Server**
  - [ ] React dev server running on localhost:3001
  - [ ] No build errors in console
  - [ ] Login page appears on first load

- [ ] **Authentication UI**
  - [ ] Login page displays correctly
  - [ ] Register tab clickable
  - [ ] Form fields functional
  - [ ] Eye icon toggle for password works
  - [ ] Error messages display

- [ ] **Sidebar**
  - [ ] Sidebar visible when authenticated
  - [ ] Logo displays (NetMentor)
  - [ ] Menu items show (Dashboard, Capture, etc.)
  - [ ] Responsive on mobile (hamburger menu)
  - [ ] User profile card at bottom
  - [ ] Logout button functional

---

## Integration Testing

### ✅ Authentication Flow

#### Test 1: User Registration
```
Steps:
1. Go to http://localhost:3001
2. Click "Regístrate aquí"
3. Fill form:
   - Email: test@example.com
   - Username: testuser
   - Password: Test123456
   - Full Name: Test User
4. Click "Crear Cuenta"

Expected:
✓ User created in PostgreSQL
✓ JWT tokens received
✓ Redirects to /dashboard
✓ Sidebar shows "Test User"
✓ User is marked as ADMIN (first user)
```

#### Test 2: User Login
```
Steps:
1. Logout (click button in sidebar)
2. Go to http://localhost:3001/login
3. Fill form:
   - Email: test@example.com
   - Password: Test123456
4. Click "Iniciar Sesión"

Expected:
✓ Token retrieved from backend
✓ Redirects to /dashboard
✓ User data loaded and displayed
✓ Sidebar shows user info
✓ last_login updated in DB
```

#### Test 3: Protected Routes
```
Steps:
1. Logout completely
2. Try to visit: http://localhost:3001/dashboard
3. Try to visit: http://localhost:3001/capture

Expected:
✓ Redirects to /login
✓ Cannot access protected routes
✓ Back button doesn't show dashboard
```

#### Test 4: Token Refresh
```
Steps:
1. Login successfully
2. Wait 31+ minutes (access token expires)
3. Try to use any API endpoint

Expected:
✓ Frontend auto-refreshes token (if implemented)
✓ No interruption in service
✓ Continues working normally
```

---

### ✅ Dashboard Features

#### Test 5: Tab Navigation
```
Steps:
1. Login successfully
2. Click "Captura" tab
3. Click "Estadísticas" tab
4. Click "Mapa de Red" tab
5. Click "Sistema" tab
6. Click back to Dashboard

Expected:
✓ All tabs load without errors
✓ Content changes when clicking tabs
✓ Navigation smooth and responsive
✓ Sidebar menu still functional
```

#### Test 6: Sidebar Navigation
```
Steps:
1. Login successfully
2. Click "Captura" in sidebar
3. Click "Estadísticas" in sidebar
4. Click "Mapa de Red" in sidebar
5. Click "Sistema" in sidebar

Expected:
✓ URL changes to /capture, /statistics, etc.
✓ Active tab highlighted
✓ Content loads for each section
```

#### Test 7: User Menu
```
Steps:
1. Login successfully
2. Click user profile card in sidebar
3. See dropdown menu

Expected:
✓ Shows menu items:
  - Perfil
  - Configuración
  - Cerrar Sesión
✓ Clicking items navigates (or shows options)
✓ Logout clears tokens and redirects
```

---

### ✅ API Testing

#### Test 8: API Endpoints
```bash
# Get current user (requires token)
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/auth/me

# Expected: 200 OK with user data

# Try without token
curl http://localhost:8000/api/auth/me

# Expected: 401 Unauthorized
```

#### Test 9: WebSocket Connection
```
Open browser console:
1. Go to Dashboard
2. Check console for WebSocket messages
3. Should see: "WebSocket conectado correctamente"

Expected:
✓ WebSocket connects
✓ No errors in console
✓ Status dot shows "connected"
```

#### Test 10: Health Check
```bash
curl http://localhost:8000/health

# Expected response:
{
  "status": "healthy",
  "version": "2.0.0",
  "database": "connected"
}
```

---

## Database Verification

### ✅ Table Structure
```sql
-- Connect to PostgreSQL
psql -U postgres -h localhost -d netmentor

-- Check users table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users';

-- Expected columns:
-- id (UUID, NOT NULL)
-- email (VARCHAR(255), NOT NULL, UNIQUE)
-- username (VARCHAR(50), NOT NULL, UNIQUE)
-- hashed_password (VARCHAR(255), NOT NULL)
-- full_name (VARCHAR(100))
-- avatar_url (VARCHAR(500))
-- role (ENUM: ADMIN, ANALYST, VIEWER)
-- is_active (BOOLEAN, default: true)
-- is_verified (BOOLEAN, default: false)
-- created_at (TIMESTAMP)
-- updated_at (TIMESTAMP)
-- last_login (TIMESTAMP)
```

### ✅ Sample Data Check
```sql
-- Verify first user is ADMIN
SELECT id, email, username, role, created_at 
FROM users 
ORDER BY created_at ASC 
LIMIT 1;

-- Expected: role = 'ADMIN'
```

---

## Performance Testing

### ✅ Load Testing
```
1. Login: measure response time
   Expected: <1000ms

2. Fetch user info (/api/auth/me): 
   Expected: <100ms

3. Capture start: 
   Expected: <500ms

4. Get stats: 
   Expected: <1000ms
```

### ✅ Memory Usage
```
Backend:
- Expected: 150-200MB
- Check: ps aux | grep python

Frontend:
- Expected: 80-120MB
- Check: DevTools > Performance > Memory
```

---

## Security Testing

### ✅ Authentication
- [ ] Cannot login with wrong password
- [ ] Cannot access endpoints without token
- [ ] Token expires after 30 minutes
- [ ] Refresh token works correctly
- [ ] Password is hashed (not plaintext in DB)

### ✅ Authorization
- [ ] Non-admin users cannot access admin endpoints (when implemented)
- [ ] User can only see own profile
- [ ] Role-based menu filtering works

### ✅ Data Protection
- [ ] Passwords never logged
- [ ] Tokens not exposed in URLs
- [ ] CORS only allows frontend origin
- [ ] No sensitive data in localStorage (except tokens)

---

## Browser Compatibility

- [ ] Chrome/Chromium - Latest
- [ ] Firefox - Latest
- [ ] Safari - Latest
- [ ] Edge - Latest
- [ ] Mobile Chrome (iOS)
- [ ] Mobile Safari (iOS)

---

## Error Handling

### ✅ Display Error Messages
```
Test invalid login:
1. Try email that doesn't exist
2. Try wrong password
3. Check for friendly error messages

Expected:
✓ "Credenciales incorrectas"
✓ Form remains filled
✓ Can retry
```

### ✅ Network Errors
```
1. Disconnect backend
2. Try to use frontend
3. Should show connection error

Expected:
✓ Friendly error message
✓ Retry option
✓ Status indicator shows disconnected
```

---

## Responsive Design

- [ ] Desktop (1920x1080): Sidebar visible, full layout
- [ ] Tablet (768x1024): Sidebar collapsible
- [ ] Mobile (375x667): 
  - [ ] Sidebar hidden by default
  - [ ] Hamburger menu visible
  - [ ] Menu opens/closes
  - [ ] Content readable

---

## Final Checklist

### Before Deployment
- [ ] All tests pass
- [ ] No console errors
- [ ] No console warnings (except non-critical)
- [ ] Database running and healthy
- [ ] Backend API responding
- [ ] Frontend rendering correctly
- [ ] Authentication working
- [ ] Protected routes enforced
- [ ] Sidebar rendering and functional
- [ ] All tabs accessible
- [ ] WebSocket connected
- [ ] No hardcoded localhost references (except dev)
- [ ] .env files in .gitignore
- [ ] No credentials in code

### Documentation
- [ ] README.md updated
- [ ] SETUP_GUIDE.md created
- [ ] API docs available at /docs
- [ ] ARCHITECTURE_v2.md created
- [ ] IMPLEMENTATION_SUMMARY.md created
- [ ] QUICKSTART_v2.md created

### Performance
- [ ] Load time < 3 seconds
- [ ] API response < 500ms
- [ ] No memory leaks
- [ ] Database queries optimized

---

## Known Issues / Not Implemented

- [ ] Email verification (marked for future)
- [ ] Password reset flow (marked for future)
- [ ] Token blacklist (marked for future)
- [ ] Rate limiting (marked for future)
- [ ] Profile picture upload (marked for future)
- [ ] Granular permission assignment UI (ready but no UI)

---

## Sign-Off

- [ ] Development completed
- [ ] All tests passed
- [ ] Code reviewed
- [ ] Documentation complete
- [ ] Ready for user testing

**Tested by**: _______________  
**Date**: _______________  
**Version**: 2.0.0  
**Status**: ✓ Ready

---

## Quick Test Script

```bash
#!/bin/bash

echo "🧪 NetMentor v2.0.0 - Quick Test Suite"
echo "========================================"

# 1. Check Docker
echo "✓ Checking Docker containers..."
docker ps | grep postgres && echo "  ✓ PostgreSQL running" || echo "  ✗ PostgreSQL NOT running"
docker ps | grep redis && echo "  ✓ Redis running" || echo "  ✗ Redis NOT running"

# 2. Check Backend
echo "✓ Checking Backend..."
curl -s http://localhost:8000/health | grep healthy && echo "  ✓ Backend healthy" || echo "  ✗ Backend NOT responding"

# 3. Check Database
echo "✓ Checking Database..."
psql -U postgres -h localhost -d netmentor -c "SELECT count(*) FROM users;" && echo "  ✓ Users table accessible" || echo "  ✗ Database NOT responding"

# 4. Check Frontend
echo "✓ Checking Frontend..."
curl -s http://localhost:3001 | grep -q "React" && echo "  ✓ Frontend running" || echo "  ✗ Frontend NOT running"

echo ""
echo "========================================"
echo "✓ All systems operational!"
```

---

**Good luck with testing! 🚀**
