# 🚀 NetMentor v2.0.0 - Quick Start

## What's New?

Your NetMentor project has been upgraded with professional features:

✅ **PostgreSQL Database** - Persistent user data  
✅ **JWT Authentication** - Secure login system  
✅ **Professional Sidebar** - Modern navigation UI  
✅ **React Router** - Multi-page application  
✅ **User Roles** - ADMIN, ANALYST, VIEWER with permissions  
✅ **Production-Ready** - Best practices implemented  

---

## Installation & Running

### Backend Setup (First Time Only)

```bash
# 1. Start Docker containers
docker-compose up -d

# 2. Navigate to backend
cd backend

# 3. Create virtual environment
python3 -m venv venv
source venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Initialize database
alembic upgrade head
```

### Frontend Setup (First Time Only)

```bash
# 1. Navigate to frontend
cd frontend

# 2. Install dependencies
npm install
```

---

## Running the Application

Keep 4 terminals open:

```bash
# Terminal 1: Ollama (AI Engine)
ollama serve

# Terminal 2: Docker Containers
docker-compose up

# Terminal 3: Backend Server
cd backend && source venv/bin/activate && python run.py
# Running on http://localhost:8000

# Terminal 4: Frontend
cd frontend && npm start
# Opens http://localhost:3001
```

---

## First Login

1. **Create your account** (first user = ADMIN automatically)
   - Email: your-email@example.com
   - Username: your_username
   - Password: Must have uppercase, lowercase, numbers (min 8 chars)

2. **Login** with your credentials

3. **Explore the dashboard**
   - Sidebar shows all available sections
   - Your role and username in bottom user card

---

## Project Structure

### Backend
```
backend/
├── app/
│   ├── core/           # Config, Database, Security
│   ├── models/         # User model (extensible)
│   ├── routes/         # API endpoints
│   ├── schemas/        # Request/Response models
│   ├── services/       # Business logic
│   └── dependencies/   # Auth middleware
├── alembic/            # Database migrations
└── run.py              # Entry point
```

### Frontend
```
frontend/
├── src/
│   ├── components/     # React components
│   ├── pages/          # Full pages (Login, Dashboard)
│   ├── contexts/       # Auth context
│   ├── services/       # API calls
│   ├── App.tsx         # Router setup
│   └── index.tsx       # Entry point
└── public/             # Static files
```

---

## Key Features

### Authentication
- **Register**: Create account (first user is ADMIN)
- **Login**: Email + Password
- **Tokens**: Auto-refresh, JWT-based
- **Roles**: ADMIN, ANALYST, VIEWER with permissions

### Dashboard
- **Captura**: Real-time packet capture
- **Estadísticas**: Traffic analysis & charts
- **Mapa de Red**: Interactive network visualization
- **Sistema**: System & device information

### API
- **Documentation**: http://localhost:8000/docs
- **Protected Routes**: All require JWT token
- **Role-Based Access**: Endpoints check user permissions

---

## Environment Variables

### Backend (.env)
Already created at `backend/.env`

Key settings:
- `DATABASE_URL` - PostgreSQL connection
- `SECRET_KEY` - JWT signing key (change in production!)
- `CORS_ORIGINS` - Frontend URL

### Frontend
Uses default `http://localhost:8000` for API

---

## Database

### Tables
- **users** - User accounts with roles & permissions

### Migrations
Run with: `alembic upgrade head`  
Create new: `alembic revision --autogenerate -m "description"`

---

## Common Issues

### Port Already in Use?
```bash
lsof -i :8000  # Backend
lsof -i :3001  # Frontend
kill -9 <PID>
```

### Database Connection Error?
```bash
docker-compose ps     # Check if running
docker-compose up -d  # Start if needed
```

### Ollama Not Running?
```bash
ollama serve
```

### Frontend Build Issues?
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm start
```

---

## Next Steps

1. **Register and Login** - Test the auth system
2. **Explore Sidebar** - Navigate different sections
3. **Capture Packets** - Start analyzing network traffic
4. **View Stats** - Check the statistics page
5. **Check Map** - See network visualization

---

## Architecture Highlights

```
User → Login Page → JWT Token → Protected Routes
                         ↓
                    Sidebar Nav
                  ↙ ↓ ↓ ↓ ↘
              Dashboard with Tabs
              (Capture/Stats/Map/System)
                  ↓
           WebSocket for Real-Time
              ↓ Backend API ↓
         PostgreSQL Database
         + Ollama AI Engine
```

---

## Security Notes

✅ **Implemented**:
- Bcrypt password hashing
- JWT tokens with expiration
- Role-based access control
- CORS protection

⚠️ **For Production**:
- Change `SECRET_KEY`
- Use HTTPS only
- Enable email verification
- Add rate limiting
- Use httpOnly cookies (not localStorage)
- Implement refresh token rotation

---

## Performance Tips

- **Sidebar**: Responsive and lazy-loaded
- **Packets**: Last 200 kept in memory
- **AI**: Patterns cached to reduce API calls
- **Database**: Indexes on email/username

---

## Support

- **Docs**: http://localhost:8000/docs (API)
- **ReDoc**: http://localhost:8000/redoc (API)
- **Logs**: Check terminal output for errors

---

## Version Info

- **NetMentor**: v2.0.0
- **Backend**: FastAPI + PostgreSQL + SQLAlchemy
- **Frontend**: React 19 + TypeScript + React Router
- **AI**: Ollama + llama3.2:3b

---

**Ready to go!** 🎉

If you run into any issues, check the logs in the terminals where services are running.

Good luck! 🚀
