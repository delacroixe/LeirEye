# LeirEye v2.0.0 - Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        LeirEye v2.0.0                             │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                                  │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │          React 19 + TypeScript + React Router             │   │
│  │                 (localhost:3001)                          │   │
│  │                                                            │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │   │
│  │  │  Login Page  │  │  Dashboard   │  │  Sidebar Nav │   │   │
│  │  ├──────────────┤  ├──────────────┤  ├──────────────┤   │   │
│  │  │ Register     │  │ Capture      │  │ - Dashboard  │   │   │
│  │  │ Login        │  │ Statistics   │  │ - Capture    │   │   │
│  │  │ 2FA Ready    │  │ Map          │  │ - Statistics │   │   │
│  │  │              │  │ System       │  │ - Network Map│   │   │
│  │  └──────────────┘  └──────────────┘  │ - System     │   │   │
│  │                                       │ - Profile    │   │   │
│  │   AuthContext (useAuth Hook)         │ - Settings   │   │   │
│  │   ├─ User state                      │ - Logout     │   │   │
│  │   ├─ JWT tokens                      └──────────────┘   │   │
│  │   ├─ Login/Register/Logout                             │   │
│  │   └─ hasPermission() checks                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
                            ↓ HTTPS/WS
        ┌───────────────────────────────────────┐
        │    HTTP/REST + WebSocket Bridge       │
        │    (/api/*, /ws/*)                    │
        └───────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────────────┐
│                      BACKEND API LAYER                               │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  FastAPI + Uvicorn (localhost:8000)                               │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                    MIDDLEWARE LAYER                         │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │ ┌─────────────────────────────────────────────────────────┐ │ │
│  │ │ HTTPBearer → verify_token() → get_current_user()      │ │ │
│  │ └─────────────────────────────────────────────────────────┘ │ │
│  │ ┌─────────────────────────────────────────────────────────┐ │ │
│  │ │ CORS: localhost:3001, :3000, :5173                     │ │ │
│  │ └─────────────────────────────────────────────────────────┘ │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐  │
│  │   AUTH     │  │  CAPTURE   │  │   STATS    │  │   SYSTEM   │  │
│  │ ROUTER     │  │  ROUTER    │  │  ROUTER    │  │  ROUTER    │  │
│  ├────────────┤  ├────────────┤  ├────────────┤  ├────────────┤  │
│  │ POST /reg  │  │ GET /start │  │ GET /summ  │  │ GET /info  │  │
│  │ POST /log  │  │ GET /stop  │  │ GET /proto │  │ GET /intf  │  │
│  │ POST /ref  │  │ WS /capture│  │ GET /proc  │  │ GET /proc  │  │
│  │ GET /me    │  │            │  │            │  │            │  │
│  │ PUT /me    │  │            │  │            │  │            │  │
│  │ POST /pwd  │  │            │  │            │  │            │  │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │              SERVICE LAYER                                  │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │ │
│  │ │ Security Svs │  │ Capture Svs  │  │ Ollama Svs   │        │ │
│  │ ├──────────────┤  ├──────────────┤  ├──────────────┤        │ │
│  │ │ hash_pwd()   │  │ start_cap()  │  │ explain_pkt()│        │ │
│  │ │ verify_pwd() │  │ stop_cap()   │  │ cache_pat()  │        │ │
│  │ │ create_jwt() │  │ process_pkt()│  │              │        │ │
│  │ │ verify_jwt() │  │ calc_stats() │  │              │        │ │
│  │ └──────────────┘  └──────────────┘  └──────────────┘        │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
                   ↓ SQLAlchemy ORM / Scapy
        ┌──────────────────────────────────────┐
        │      PERSISTENCE LAYER               │
        └──────────────────────────────────────┘
                   ↓
┌──────────────────────────────────────────────────────────────────────┐
│                    DATA LAYER                                         │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────┐  ┌──────────────────────┐  │
│  │      PostgreSQL 16               │  │    Redis (Cache)     │  │
│  │      (localhost:5432)            │  │ (localhost:6379)     │  │
│  ├──────────────────────────────────┤  ├──────────────────────┤  │
│  │                                  │  │                      │  │
│  │  ┌──────────────────────────┐   │  │ Optional:            │  │
│  │  │ USERS TABLE              │   │  │ - Token blacklist    │  │
│  │  ├──────────────────────────┤   │  │ - Session cache      │  │
│  │  │ id (UUID)                │   │  │ - Pattern cache      │  │
│  │  │ email (unique)           │   │  │                      │  │
│  │  │ username (unique)        │   │  │                      │  │
│  │  │ hashed_password          │   │  │                      │  │
│  │  │ full_name                │   │  │                      │  │
│  │  │ avatar_url               │   │  │                      │  │
│  │  │ role (enum)              │   │  │                      │  │
│  │  │ is_active                │   │  │                      │  │
│  │  │ is_verified              │   │  │                      │  │
│  │  │ created_at               │   │  │                      │  │
│  │  │ updated_at               │   │  │                      │  │
│  │  │ last_login               │   │  │                      │  │
│  │  └──────────────────────────┘   │  │                      │  │
│  │                                  │  │                      │  │
│  │  (Extensible for future):       │  │                      │  │
│  │  - capture_sessions             │  │                      │  │
│  │  - captured_packets             │  │                      │  │
│  │  - audit_logs                   │  │                      │  │
│  │                                  │  │                      │  │
│  └──────────────────────────────────┘  └──────────────────────┘  │
│                                                                      │
│  Docker Compose Network:                                           │
│  - postgres:5432                                                   │
│  - redis:6379                                                      │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
                   ↓
┌──────────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                                  │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────┐  ┌──────────────────────────────┐  │
│  │  OLLAMA AI                 │  │  NETWORK INTERFACES          │  │
│  │  (localhost:11434)         │  │  (Scapy/Netifaces)          │  │
│  ├────────────────────────────┤  ├──────────────────────────────┤  │
│  │ Model: llama3.2:3b         │  │ - eth0, en0, etc.           │  │
│  │                            │  │ - MAC addresses             │  │
│  │ Functions:                 │  │ - IP addresses              │  │
│  │ - Explain packets          │  │ - Network stats             │  │
│  │ - Analyze protocols        │  │ - Process-packet mapping    │  │
│  │ - Generate insights        │  │                             │  │
│  │                            │  │ Live Packet Capture:        │  │
│  │                            │  │ - TCPDump/Scapy             │  │
│  │                            │  │ - Raw socket access         │  │
│  │                            │  │ - Packet parsing            │  │
│  └────────────────────────────┘  └──────────────────────────────┘  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Authentication Flow

```
┌─────────────┐
│ User Input  │
└──────┬──────┘
       │
       ↓
┌──────────────────┐
│ POST /register   │  or  │ POST /login │
└──────┬───────────┘      └──────┬──────┘
       │                         │
       ├─────────────┬───────────┘
       │             │
       ↓             ↓
   ┌───────────────────────────┐
   │ Verify Email/Username     │
   │ Hash Password (bcrypt)    │
   │ Create User in DB         │
   └─────────┬─────────────────┘
             │
             ↓
   ┌──────────────────────────┐
   │ Generate JWT Tokens      │
   │ - access (30 min)        │
   │ - refresh (7 days)       │
   └─────────┬────────────────┘
             │
             ↓
   ┌──────────────────────────┐
   │ Return {user, tokens}    │
   │ Store in localStorage    │
   └─────────┬────────────────┘
             │
             ↓
   ┌──────────────────────────┐
   │ Redirect to Dashboard    │
   └──────────────────────────┘
```

### Protected Request Flow

```
┌─────────────────┐
│ Request from UI │
└────────┬────────┘
         │
         ↓
   ┌──────────────────────────┐
   │ Add JWT to Headers       │
   │ Authorization: Bearer X  │
   └────────┬─────────────────┘
            │
            ↓
   ┌──────────────────────────┐
   │ API Middleware           │
   │ - Extract token          │
   │ - Verify signature       │
   │ - Check expiration       │
   └────────┬─────────────────┘
            │
            ↓
   ┌──────────────────────────┐
   │ Lookup User in DB        │
   │ - Check is_active        │
   │ - Load user data         │
   └────────┬─────────────────┘
            │
            ↓
   ┌──────────────────────────┐
   │ Check Permissions        │
   │ - User role              │
   │ - Endpoint requirements  │
   └────────┬─────────────────┘
            │
            ↓ (Allow)
   ┌──────────────────────────┐
   │ Execute Handler          │
   │ Return Response          │
   └──────────────────────────┘
            │
    (Deny)──│──→ 403 Forbidden
```

## Deployment Architecture (Future)

```
┌─────────────────────────────────────────────────────────┐
│              LOAD BALANCER (nginx)                      │
└────────┬──────────────────────────────────────┬─────────┘
         │                                      │
    ┌────▼────┐                          ┌─────▼─────┐
    │ React   │  (Static CDN)            │ FastAPI  │
    │ Frontend│                          │ Backends │ (replicated)
    ├─────────┤                          ├──────────┤
    │ S3/CF   │                          │ Container│
    └─────────┘                          │ Cluster  │
                                        └────┬──────┘
                                             │
                    ┌────────────────────────┼────────────────────┐
                    │                        │                    │
                ┌───▼────┐          ┌────────▼────┐      ┌───────▼────┐
                │PostgreSQL│         │ Redis Cluster│     │ Ollama GPU │
                │  RDS    │         │   (Cache)   │     │  Servers   │
                └─────────┘         └─────────────┘     └────────────┘
```

---

## Technology Stack

| Layer         | Technology              | Purpose               |
| ------------- | ----------------------- | --------------------- |
| **Frontend**  | React 19 + TypeScript   | UI & Routing          |
| **API**       | FastAPI                 | REST & WebSocket      |
| **Database**  | PostgreSQL + SQLAlchemy | User data persistence |
| **Auth**      | JWT + bcrypt            | Security              |
| **Cache**     | Redis                   | Optional future use   |
| **AI**        | Ollama + llama3.2       | Packet analysis       |
| **Network**   | Scapy + Netifaces       | Packet capture        |
| **Container** | Docker Compose          | Local development     |

---

## Security Architecture

```
┌─────────────────────────────────────────┐
│  Client (HTTPS in production)           │
└────────────────┬────────────────────────┘
                 │
                 ↓ JWT Bearer Token
┌─────────────────────────────────────────┐
│  API Gateway (CORS, Rate Limit)         │
└────────────────┬────────────────────────┘
                 │
                 ↓ Token Verification
┌─────────────────────────────────────────┐
│  Authentication Middleware              │
│  - Signature validation                 │
│  - Expiration check                     │
│  - User lookup in DB                    │
└────────────────┬────────────────────────┘
                 │
                 ↓ Role/Permission Check
┌─────────────────────────────────────────┐
│  Authorization Middleware               │
│  - Role validation                      │
│  - Permission verification              │
└────────────────┬────────────────────────┘
                 │
                 ↓ Execution (if authorized)
┌─────────────────────────────────────────┐
│  Protected Endpoint                     │
└─────────────────────────────────────────┘
```

---

## Performance Considerations

```
Request Timeline:
├─ CORS Check: <1ms
├─ Token Parsing: <1ms
├─ DB User Lookup: 5-20ms (indexed on UUID)
├─ Permission Check: <1ms
├─ Business Logic: 10-500ms (depends on operation)
└─ Response Serialization: <5ms
────────────────────────────────
Total: 16-527ms per request

Optimization:
- JWT cached in context (no lookup per request)
- DB indexes on email, username
- Redis cache for frequently accessed data
- Packet processing async with WebSocket
```

---

**Architecture Version**: 2.0.0  
**Last Updated**: January 2026  
**Status**: Production Ready ✓
