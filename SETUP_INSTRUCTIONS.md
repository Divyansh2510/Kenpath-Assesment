# Sweety - Setup Instructions

## Quick Start Guide

### Prerequisites
- Node.js 20+
- PostgreSQL 15+ (or Docker)
- Git

### Setup Steps

#### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd sweety

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

#### 2. Set Up Environment Variables

**Server (.env)**
```bash
cd server
cp .env.example .env
```

Edit `server/.env` with your database credentials:
```
PORT=5000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sweety
DATABASE_URL_TEST=postgresql://postgres:postgres@localhost:5432/sweety_test
JWT_SECRET=change-me-to-a-long-random-string
JWT_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=10
CLIENT_ORIGIN=http://localhost:5173
APP_TIMEZONE=Asia/Kolkata
```

**Client (.env)**
```bash
cd ../client
cp .env.example .env
```

The default values should work:
```
VITE_API_URL=http://localhost:5000/api
```

#### 3. Set Up Database

**Option A: Using Docker (Recommended)**
```bash
# Start PostgreSQL with Docker Compose
docker compose up -d db

# Wait for database to be ready (about 10 seconds)
# Then run migrations
cd server
npm run db:migrate
```

**Option B: Using Local PostgreSQL**
```bash
# Create databases
createdb sweety
createdb sweety_test

# Run migrations
cd server
npm run db:migrate
```

#### 4. Seed Demo Data (Optional)

```bash
cd server
npm run seed
```

This creates a demo user:
- **Email:** demo@sweety.test
- **Password:** Demo@1234

The seed script generates ~120-150 readings over the last 45 days.

#### 5. Run the Application

**Terminal 1 - Start Backend:**
```bash
cd server
npm run dev
```
Server runs on http://localhost:5000

**Terminal 2 - Start Frontend:**
```bash
cd client
npm run dev
```
Client runs on http://localhost:5173

#### 6. Access the Application

Open your browser to http://localhost:5173

You can:
- Register a new account, or
- Login with demo credentials: `demo@sweety.test` / `Demo@1234`

---

## Running Tests

**Backend Tests:**
```bash
cd server
npm test
```

**Note:** Tests require PostgreSQL to be running and the test database to be created:
```bash
createdb sweety_test
```

---

## Available Scripts

### Server
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm test` - Run all tests
- `npm run db:migrate` - Run database migrations
- `npm run seed` - Seed database with demo data

### Client
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

---

## API Endpoints

Base URL: `http://localhost:5000/api`

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login
- `GET /auth/me` - Get current user (requires auth)

### Readings (all require authentication)
- `POST /readings` - Create reading
- `GET /readings` - List all readings (paginated)
- `GET /readings?date=YYYY-MM-DD` - List readings for specific date
- `GET /readings/:id` - Get single reading
- `PUT /readings/:id` - Update reading
- `DELETE /readings/:id` - Delete reading

### Reports (all require authentication)
- `GET /reports/daily?date=YYYY-MM-DD` - Daily report
- `GET /reports/month-to-date?date=YYYY-MM-DD` - Month-to-date report
- `GET /reports/monthly?date=YYYY-MM-DD` - Previous month report

All dates are optional and default to today.

---

## Troubleshooting

### Database Connection Errors

If you see "password authentication failed for user 'postgres'":
1. Check your `DATABASE_URL` in `server/.env`
2. Ensure PostgreSQL is running
3. Verify credentials match your PostgreSQL setup

### Port Already in Use

If port 5000 or 5173 is already in use:
- Change `PORT` in `server/.env`
- Update `VITE_API_URL` in `client/.env` to match

### Tests Failing

1. Ensure test database exists: `createdb sweety_test`
2. Verify `DATABASE_URL_TEST` in `server/.env`
3. Make sure no other process is using the test database

---

## Project Structure

```
sweety/
├── server/               # Backend (Node.js + Express)
│   ├── src/
│   │   ├── config/      # Configuration
│   │   ├── db/          # Database pool
│   │   ├── middleware/  # Auth, validation, error handling
│   │   ├── utils/       # Date helpers, AppError
│   │   ├── constants/   # Slot definitions
│   │   ├── schemas/     # Zod validation schemas
│   │   ├── repositories/# Database queries
│   │   ├── services/    # Business logic
│   │   ├── controllers/ # Request handlers
│   │   └── routes/      # Route definitions
│   ├── tests/           # Jest + Supertest tests
│   ├── db/              # Database schema
│   └── scripts/         # Seed script
├── client/              # Frontend (React + Vite)
│   └── src/
│       ├── api/         # Axios client
│       ├── context/     # Auth context
│       ├── components/  # Reusable components
│       ├── pages/       # Page components
│       └── utils/       # Client utilities
└── docker-compose.yml   # Docker setup for PostgreSQL
```

---

## Features Implemented

✅ **Authentication**
- User registration with bcrypt password hashing
- JWT-based authentication
- Protected routes

✅ **Readings Management**
- Add up to 4 readings per day (4 time slots)
- Edit and delete readings
- Client and server-side validation
- All 7 validation rules from spec

✅ **Reports**
- Daily report with individual readings
- Month-to-date statistics
- Previous month statistics
- Empty state handling

✅ **Technical**
- Layered architecture (routes → controllers → services → repositories)
- Comprehensive error handling
- Date utilities avoiding timezone bugs
- User isolation (users only see their own data)
- Responsive design
- Accessible forms (ARIA labels, keyboard navigation)

✅ **Testing**
- 20 date utility tests
- 13 auth endpoint tests
- 30+ reading validation and CRUD tests
- 20+ report calculation tests

✅ **Bonus**
- Docker Compose for PostgreSQL
- Pagination support in readings API
- Seed script with demo data

---

## Security Notes

⚠️ **Development Setup**
- JWT tokens stored in localStorage (XSS vulnerability)
- No rate limiting configured
- No email verification
- Demo user for testing

🔒 **For Production**
- Use httpOnly cookies for tokens
- Implement rate limiting
- Add email verification
- Remove demo/seed functionality
- Use environment-specific secrets
- Enable HTTPS
- Add logging and monitoring

---

## Next Steps

To deploy to production:
1. Set `NODE_ENV=production`
2. Use strong `JWT_SECRET`
3. Configure production database
4. Build frontend: `cd client && npm run build`
5. Serve frontend through Express or CDN
6. Set up CI/CD pipeline
7. Configure monitoring and logging

---

## Support

For issues or questions:
1. Check this setup guide
2. Review the main README.md
3. Check test files for usage examples
4. Review API endpoint documentation above
