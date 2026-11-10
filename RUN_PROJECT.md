# 🚀 How to Run Sweety Project

## Prerequisites Setup

### You Need EITHER Option A OR Option B:

### **Option A: Docker Desktop (Easiest)**
1. Download Docker Desktop for Windows: https://www.docker.com/products/docker-desktop/
2. Install and start Docker Desktop
3. Wait for the whale icon in your taskbar to be steady (not animating)

### **Option B: PostgreSQL Directly**
1. Download PostgreSQL 15+: https://www.postgresql.org/download/windows/
2. During installation:
   - Set username: `postgres`
   - Set password: `postgres` (or update in server/.env)
   - Port: `5432`
3. Create databases:
   ```cmd
   "C:\Program Files\PostgreSQL\15\bin\createdb" sweety
   "C:\Program Files\PostgreSQL\15\bin\createdb" sweety_test
   ```

---

## 🎯 Quick Start (3 Steps)

### Step 1: Start Database

**If using Docker:**
```bash
cd c:\Users\hp\Desktop\Kenpath
docker compose up -d db
```

**If using local PostgreSQL:**
- Just make sure PostgreSQL service is running (check Windows Services)

### Step 2: Start Backend Server

Open **Terminal 1** (PowerShell or CMD):

```bash
cd c:\Users\hp\Desktop\Kenpath\server
npm run db:migrate
npm run seed
npm run dev
```

You should see:
```
🩸 Sweety server running on port 5000
📊 Environment: development
🌍 Client origin: http://localhost:5173
```

### Step 3: Start Frontend

Open **Terminal 2** (new PowerShell or CMD window):

```bash
cd c:\Users\hp\Desktop\Kenpath\client
npm run dev
```

You should see:
```
  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

## 🌐 Access the Application

1. Open your browser to: **http://localhost:5173**

2. **Demo Login:**
   - Email: `demo@sweety.test`
   - Password: `Demo@1234`

3. Or register a new account!

---

## 🔍 Troubleshooting

### "Docker daemon not running"
- Start Docker Desktop application
- Wait 1-2 minutes for it to fully start
- Try the docker compose command again

### "Port 5000 already in use"
- Stop any other apps using port 5000
- Or change `PORT=5001` in `server/.env`
- Update client `VITE_API_URL=http://localhost:5001/api` in `client/.env`

### "Port 5173 already in use"
- The Vite dev server will automatically use the next available port (5174, 5175, etc.)
- Just use the URL shown in the terminal

### "Database connection failed"
- **Docker:** Make sure Docker Desktop is running
- **Local PostgreSQL:** Check Windows Services that PostgreSQL is started
- Verify credentials in `server/.env` match your setup

### "Migration failed"
- Database might not be created yet
- Try: `createdb sweety` (or use pgAdmin to create manually)

---

## 📝 What to Test

Once running, try these features:

### Dashboard (Main Page)
1. ✅ Add a glucose reading (pick date, slot, value)
2. ✅ Try invalid values (39, 601, decimals) - see errors
3. ✅ Try future date - see error
4. ✅ Add multiple readings for same day
5. ✅ Try adding 5th reading - see "max 4" error
6. ✅ Try duplicate slot - see specific error
7. ✅ Edit a reading
8. ✅ Delete a reading (confirms first)

### Reports Page
1. ✅ View daily report with readings list
2. ✅ View month-to-date statistics
3. ✅ View previous month statistics
4. ✅ Change selected date
5. ✅ Check empty states

### Authentication
1. ✅ Logout and login again
2. ✅ Register a new account
3. ✅ Try wrong password - see error
4. ✅ Try duplicate email - see error

---

## 🛑 How to Stop

### Stop the servers:
- In each terminal: Press `Ctrl+C`

### Stop Docker database:
```bash
docker compose down
```

### Keep data for next time:
Just close the terminals - Docker volume persists data

---

## 📱 Expected UI

- **Login/Register:** Clean form with pink branding
- **Dashboard:** Date picker, 4 slot cards, add/edit form below
- **Reports:** 3 cards showing different time periods
- **Navbar:** Logo, Dashboard/Reports links, username, Logout

---

## 🐛 Still Having Issues?

1. Check both terminals for error messages
2. Open browser DevTools (F12) → Console tab
3. Check for red errors
4. Common issues:
   - Database not running
   - Wrong environment variables
   - Port conflicts
   - Node.js version too old (need 20+)

---

## ✅ Success Checklist

- [ ] Database running (Docker or PostgreSQL)
- [ ] Backend terminal shows "server running on port 5000"
- [ ] Frontend terminal shows "Local: http://localhost:5173"
- [ ] Browser opens to login page
- [ ] Can login with demo@sweety.test / Demo@1234
- [ ] Dashboard shows date picker and 4 slots
- [ ] Can add/edit/delete readings
- [ ] Reports page shows statistics

---

## 🎉 You're All Set!

The application is now running locally. Enjoy testing the blood glucose tracker!

**Need help?** Check the logs in the terminals for specific error messages.
