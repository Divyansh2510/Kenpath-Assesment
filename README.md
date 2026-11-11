# Sweety – Blood Glucose Tracker

> A simple web application for diabetes patients to track daily glucose readings and view reports.

## About

Sweety helps diabetes patients track up to 4 glucose readings per day (Morning fasting, After breakfast, After lunch, After dinner) and provides Daily, Month-to-date, and Previous-month reports with key statistics (highest, lowest, average, count).

## Tech Stack

**Backend:**
- Node.js 20+
- Express
- PostgreSQL 15+
- node-postgres (pg)
- bcrypt (password hashing)
- jsonwebtoken (JWT authentication)
- zod (validation)
- helmet, cors, dotenv

**Frontend:**
- React 18 + Vite
- React Router
- Axios
- Recharts (bonus: charts)

**Testing:**
- Backend: Jest + Supertest
- Frontend: Vitest + React Testing Library (bonus)

## Prerequisites

- Node.js 20 or higher
- PostgreSQL 15 or higher
- npm or yarn

## Installation

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

## Environment Setup

### Server (.env)
Copy `server/.env.example` to `server/.env` and configure:

```
PORT=5000
DATABASE_URL=postgresql://<db-user>:<url-encoded-password>@localhost:5432/sweety
DATABASE_URL_TEST=postgresql://<db-user>:<url-encoded-password>@localhost:5432/sweety_test
JWT_SECRET=<replace-with-a-long-random-secret>
JWT_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=10
CLIENT_ORIGIN=http://localhost:5173
APP_TIMEZONE=Asia/Kolkata
```

### Client (.env)
Copy `client/.env.example` to `client/.env`:

```
VITE_API_URL=http://localhost:5000/api
```

## Database Setup

Create the databases:
```bash
createdb sweety
createdb sweety_test
```

Run migrations:
```bash
cd server
npm run db:migrate
```

### Docker database (optional)

Set `POSTGRES_USER` and a unique `POSTGRES_PASSWORD` in your shell or in a
root `.env` file (ignored by Git), then start the database:

```bash
docker compose up -d db
```

Compose binds PostgreSQL to localhost only and requires a password instead of
using a built-in default. Set `DATABASE_URL` in `server/.env` to the same
database credentials; URL-encode any special characters in the password.

## Seed Data

Load sample data with a demo user:
```bash
cd server
npm run seed
```

**Demo credentials:**
- Email: `demo@sweety.test`
- Password: `Demo@1234`

## Running the Application

### Development Mode

**Server:**
```bash
cd server
npm run dev
```
Server runs on http://localhost:5000

**Client:**
```bash
cd client
npm run dev
```
Client runs on http://localhost:5173

## Testing

**Backend tests:**
```bash
cd server
npm test
```

**Frontend validation:**
```bash
cd client
npm run build
npm run lint
```

Frontend automated tests are not currently configured.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user (requires auth)

### Readings (all require auth)
- `POST /api/readings` - Create reading
- `GET /api/readings` - List readings (optional: ?date=YYYY-MM-DD)
- `GET /api/readings/:id` - Get single reading
- `PUT /api/readings/:id` - Update reading
- `DELETE /api/readings/:id` - Delete reading

### Reports (require auth)
- `GET /api/reports/daily?date=YYYY-MM-DD` - Daily report
- `GET /api/reports/month-to-date?date=YYYY-MM-DD` - Month-to-date report
- `GET /api/reports/monthly?date=YYYY-MM-DD` - Previous month report

### Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Value must be between 40 and 600 mg/dl.",
    "fields": { "value": "Value must be between 40 and 600 mg/dl." }
  }
}
```

## Screenshots

Screenshots and demo recording are submitted separately from this repository.

## Notes

### Assumptions
- Database is PostgreSQL (not MongoDB as mentioned in "MERN")
- Password minimum length: 8 characters
- "Today" is computed in `APP_TIMEZONE` (default: Asia/Kolkata)
- Month-to-date and monthly reports are relative to the selected date
- "Previous month" means the whole month before the selected date's month
- When a day has 4 readings, adding another shows "max 4 readings" error before duplicate-slot error
- Average values rounded to 1 decimal place
- JWT tokens stored in localStorage (client-side)
- Users can only see their own data (404 for other users' readings)

### What I'd Improve With More Time
- Refresh tokens and httpOnly cookies for better security
- Rate limiting and account lockout after failed login attempts
- Email verification and password reset functionality
- ORM/migration tool (Prisma or Knex) for better schema management
- E2E tests with Playwright
- Visual glucose range highlighting and trend analysis
- CSV/PDF export of readings and reports
- CI/CD pipeline setup
- Production deployment with proper logging and monitoring
- Redis caching for frequently accessed reports
- Doctor/caregiver role with patient management
