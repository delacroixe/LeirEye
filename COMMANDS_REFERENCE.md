# ⚡ NetMentor v2.0.0 - Command Reference

Quick command reference for common development tasks.

---

## 🚀 Starting the Application

### Terminal 1: Ollama (AI Engine)
```bash
ollama serve
# Pulls llama3.2:3b automatically on first run
# Runs on http://localhost:11434
```

### Terminal 2: Docker Services
```bash
cd /Users/antuan/Dev/sec/networking
docker-compose up -d

# Verify services
docker-compose ps
# Should see: postgres UP, redis UP

# Check PostgreSQL
psql -h localhost -U postgres -d netmentor
# (password: postgres)
```

### Terminal 3: Backend API
```bash
cd /Users/antuan/Dev/sec/networking/backend

# Activate virtual environment
source venv/bin/activate

# Initialize database (FIRST TIME ONLY)
alembic upgrade head
# Creates users table and indexes

# Run server
python run.py
# Server runs on http://localhost:8000
# API docs available at http://localhost:8000/docs
```

### Terminal 4: Frontend
```bash
cd /Users/antuan/Dev/sec/networking/frontend

# Install dependencies (if needed)
npm install

# Start React development server
npm start
# Opens http://localhost:3001 automatically
```

---

## 🛑 Stopping the Application

### Stop Frontend
```bash
# In frontend terminal: Ctrl+C
```

### Stop Backend
```bash
# In backend terminal: Ctrl+C
```

### Stop Docker Services
```bash
docker-compose down
# Add -v to remove volumes and data: docker-compose down -v
```

### Stop Ollama
```bash
# In ollama terminal: Ctrl+C
```

---

## 🔑 First User Setup

### 1. Access Application
```
Open browser: http://localhost:3001
```

### 2. Register First User
```
Click: "Regístrate aquí"
Email: your-email@example.com
Username: your_username
Password: Password123 (must have uppercase, lowercase, numbers, 8+ chars)
Full Name: Your Full Name
```

### 3. Auto-Promotion
```
First registered user is automatically ADMIN
Can manage system and create other users
```

### 4. Create Additional Users
```
Login as ADMIN
Go to System tab
(User management UI in progress)
```

---

## 🗄️ Database Operations

### PostgreSQL Connection
```bash
# Connect to database
psql -h localhost -U postgres -d netmentor

# List tables
\dt

# Check users table
SELECT * FROM users;

# Reset database (caution!)
alembic downgrade base  # Undo all migrations
alembic upgrade head     # Reapply all migrations
```

### Create New Migration
```bash
cd backend
source venv/bin/activate
alembic revision --autogenerate -m "description of changes"
# Edit alembic/versions/xxx_description.py
alembic upgrade head  # Apply migration
```

---

## 🔍 Development Commands

### Backend

#### Run in Development Mode
```bash
cd backend
source venv/bin/activate
python run.py
# Hot-reloads on file changes
```

#### Run Tests (when available)
```bash
cd backend
source venv/bin/activate
pytest
# Or specific file:
pytest tests/test_auth.py
```

#### Check Linting
```bash
cd backend
source venv/bin/activate
flake8 app/
# Or
pylint app/
```

#### Type Checking
```bash
cd backend
source venv/bin/activate
mypy app/
```

### Frontend

#### Start Dev Server
```bash
cd frontend
npm start
# Opens http://localhost:3001
# Hot-reloads on file changes
```

#### Build for Production
```bash
cd frontend
npm run build
# Output in: frontend/build/
```

#### Run Tests
```bash
cd frontend
npm test
# Watch mode, press 'a' for all tests
```

#### Check TypeScript
```bash
cd frontend
npm run tsc
# Type checking without building
```

#### Lint Code
```bash
cd frontend
npm run lint
# Or ESLint directly:
npm run eslint src/
```

---

## 🔐 Authentication Endpoints

### Register
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "username",
    "password": "Password123",
    "full_name": "Full Name"
  }'
```

### Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123"
  }'
```

### Get Current User
```bash
curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Refresh Token
```bash
curl -X POST http://localhost:8000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "YOUR_REFRESH_TOKEN"
  }'
```

### Change Password
```bash
curl -X POST http://localhost:8000/api/auth/change-password \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "current_password": "OldPassword123",
    "new_password": "NewPassword456"
  }'
```

---

## 📦 Dependency Management

### Backend Dependencies

#### Install All
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

#### Add New Package
```bash
source venv/bin/activate
pip install package-name
pip freeze > requirements.txt  # Update requirements
```

#### List Installed
```bash
source venv/bin/activate
pip list
```

### Frontend Dependencies

#### Install All
```bash
cd frontend
npm install
```

#### Add New Package
```bash
npm install package-name
# Or dev dependency:
npm install --save-dev package-name
```

#### Update Packages
```bash
npm update
# Check for outdated:
npm outdated
```

#### List Installed
```bash
npm list
# Or tree view:
npm list --depth=0
```

---

## 🐛 Debugging

### Backend

#### Enable Debug Mode
```bash
cd backend
source venv/bin/activate
DEBUG=True python run.py
```

#### View Server Logs
```bash
# In running terminal or:
tail -f logs/app.log  # if logging enabled
```

#### Database Debugging
```bash
# Check current queries
psql -h localhost -U postgres -d netmentor
SELECT pid, query FROM pg_stat_activity WHERE datname = 'netmentor';
```

### Frontend

#### Browser DevTools
```
Press F12 or Cmd+Option+I
Check:
- Console for errors
- Network for API calls
- Application > LocalStorage for tokens
- React DevTools tab (if installed)
```

#### React Query Debugger
```bash
# Install browser extension or use:
npm install --save-dev @tanstack/react-query-devtools
# Displays in development mode
```

---

## 🗂️ File Structure Reference

```
/Users/antuan/Dev/sec/networking/
├── backend/
│   ├── app/
│   │   ├── core/           # Config, DB, Security
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── routes/         # API endpoints
│   │   ├── dependencies/   # FastAPI dependencies
│   │   └── main.py         # FastAPI app
│   ├── alembic/            # Database migrations
│   ├── run.py              # Server entry point
│   ├── requirements.txt
│   ├── .env                # Configuration
│   └── .env.example        # Template
│
├── frontend/
│   ├── src/
│   │   ├── pages/          # Page components
│   │   ├── components/     # Reusable components
│   │   ├── contexts/       # React Context
│   │   ├── services/       # API services
│   │   ├── App.tsx         # Root component
│   │   └── index.tsx       # Entry point
│   ├── package.json
│   └── tsconfig.json
│
├── docker-compose.yml      # Docker services
├── docker/                 # Docker init scripts
├── QUICKSTART_v2.md        # Start here
├── SETUP_GUIDE.md          # Detailed setup
└── CHANGELOG_v2.md         # This file
```

---

## 🧪 Testing Procedures

### Quick Health Check
```bash
# Backend health
curl http://localhost:8000/health

# Frontend loads
curl http://localhost:3001

# Database ready
curl http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer invalid"
```

### Full Test Suite
See `TESTING_CHECKLIST.md` for comprehensive testing procedures.

### Automated Test Script
```bash
cd backend
source venv/bin/activate
python -c "
import requests
import json

base_url = 'http://localhost:8000'

# Test register
resp = requests.post(f'{base_url}/api/auth/register', json={
    'email': 'test@example.com',
    'username': 'testuser',
    'password': 'Test1234',
    'full_name': 'Test User'
})
print(f'Register: {resp.status_code}')

# Test login
resp = requests.post(f'{base_url}/api/auth/login', json={
    'email': 'test@example.com',
    'password': 'Test1234'
})
if resp.status_code == 200:
    token = resp.json()['access_token']
    print(f'Login: {resp.status_code} (token obtained)')
else:
    print(f'Login: {resp.status_code}')
"
```

---

## 📊 Monitoring

### Check Docker Containers
```bash
docker-compose ps
docker-compose logs postgres
docker-compose logs redis
```

### Monitor Server
```bash
# Check process
ps aux | grep python
ps aux | grep node

# Check ports
lsof -i :8000      # Backend
lsof -i :3001      # Frontend
lsof -i :5432      # PostgreSQL
lsof -i :6379      # Redis
```

### Database Size
```bash
psql -h localhost -U postgres -d netmentor -c "
  SELECT pg_size_pretty(pg_database_size('netmentor'));"
```

---

## 🚨 Troubleshooting

### Port Already in Use
```bash
# Kill process on port
lsof -i :8000
kill -9 <PID>

# Or change port
# Backend: Edit backend/run.py uvicorn port
# Frontend: export PORT=3002 && npm start
```

### Database Connection Failed
```bash
# Check PostgreSQL running
docker-compose ps
# Should show postgres UP

# Verify connection
psql -h localhost -U postgres
```

### Module Not Found
```bash
# Backend
cd backend && source venv/bin/activate
pip install -r requirements.txt

# Frontend
cd frontend && npm install
```

### TypeScript Errors
```bash
cd frontend
npm run tsc
# Check output for errors
```

### CORS Error
```
Check backend/.env
CORS_ORIGINS includes "http://localhost:3001"
Check that backend is running
```

---

## 📝 Development Workflow

### Making Changes

#### Backend
1. Edit Python files in `backend/app/`
2. Server hot-reloads automatically
3. Check `http://localhost:8000/docs` for API changes
4. Test with cURL or Postman

#### Frontend
1. Edit TypeScript/React files in `frontend/src/`
2. Browser automatically refreshes
3. Check console for TypeScript errors
4. Test user flows

#### Database
1. Edit models in `backend/app/models/`
2. Create migration: `alembic revision --autogenerate`
3. Apply: `alembic upgrade head`
4. Verify in psql

### Git Workflow
```bash
git add .
git commit -m "Brief description"
git push origin main

# or create branch:
git checkout -b feature/my-feature
# Make changes
git push -u origin feature/my-feature
# Create PR
```

---

## 🎯 Common Tasks

### Reset Everything
```bash
# Stop all services
docker-compose down -v

# Restart
docker-compose up -d

# Reinitialize DB
cd backend
source venv/bin/activate
alembic downgrade base
alembic upgrade head
```

### Create Test Data
```bash
cd backend
source venv/bin/activate

# Use auth endpoints to register test users
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "analyst@test.com",
    "username": "analyst_user",
    "password": "Test1234",
    "full_name": "Test Analyst"
  }'
```

### Backup Database
```bash
pg_dump -h localhost -U postgres netmentor > backup.sql

# Restore
psql -h localhost -U postgres netmentor < backup.sql
```

---

## 📚 Documentation Links

- **Quick Start**: `QUICKSTART_v2.md` (5 minutes)
- **Setup Guide**: `SETUP_GUIDE.md` (15 minutes)
- **Architecture**: `ARCHITECTURE_v2.md` (detailed design)
- **Testing**: `TESTING_CHECKLIST.md` (QA procedures)
- **Changes**: `CHANGELOG_v2.md` (all modifications)
- **API Docs**: `http://localhost:8000/docs` (auto-generated)

---

## 🆘 Getting Help

### Check Logs
```bash
# Backend errors
# Check terminal running 'python run.py'

# Frontend errors
# Check browser console (F12)

# Database errors
# Check terminal running 'docker-compose'
```

### Review Documentation
1. QUICKSTART_v2.md - Common issues
2. SETUP_GUIDE.md - Detailed instructions
3. TESTING_CHECKLIST.md - Validation procedures
4. ARCHITECTURE_v2.md - Design decisions

### Check API Status
```bash
curl -s http://localhost:8000/health | python -m json.tool
```

---

**Last Updated**: January 18, 2026  
**Version**: 2.0.0
