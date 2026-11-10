# Reset PostgreSQL Password on Windows

## Method 1: Using pgAdmin (GUI - Easiest)

1. Open **pgAdmin** from Start menu
2. When it asks for "Master Password", try common passwords:
   - (blank - just press Enter)
   - `admin`
   - `postgres`
   - `password`
3. If you get in, right-click on **PostgreSQL 17** → **Properties**
4. Go to **Definition** tab
5. Set new password: `postgres`
6. Click **Save**

## Method 2: Using Command Line

1. Open PowerShell as **Administrator**
2. Run these commands:

```powershell
# Stop PostgreSQL service
Stop-Service postgresql-x64-17

# Find pg_hba.conf file (usually in C:\Program Files\PostgreSQL\17\data)
cd "C:\Program Files\PostgreSQL\17\data"

# Backup the file
Copy-Item pg_hba.conf pg_hba.conf.backup

# Edit pg_hba.conf
notepad pg_hba.conf
```

3. In Notepad, find this line:
   ```
   host    all             all             127.0.0.1/32            scram-sha-256
   ```

4. Change `scram-sha-256` to `trust`:
   ```
   host    all             all             127.0.0.1/32            trust
   ```

5. Save and close Notepad

6. Start PostgreSQL service:
   ```powershell
   Start-Service postgresql-x64-17
   ```

7. Now reset password:
   ```powershell
   cd "C:\Program Files\PostgreSQL\17\bin"
   .\psql.exe -U postgres
   ```

8. In psql prompt, type:
   ```sql
   ALTER USER postgres WITH PASSWORD 'postgres';
   \q
   ```

9. Restore pg_hba.conf:
   ```powershell
   cd "C:\Program Files\PostgreSQL\17\data"
   Copy-Item pg_hba.conf.backup pg_hba.conf
   Restart-Service postgresql-x64-17
   ```

## Method 3: Simplest - Use No Password Authentication (Development Only)

Edit the .env file in your project to connect without password:

```
DATABASE_URL=postgresql://postgres@localhost:5432/sweety?sslmode=disable
```

Then modify `pg_hba.conf` to allow local connections without password (trust method).
