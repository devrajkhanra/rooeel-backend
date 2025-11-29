# Local PostgreSQL Setup Guide

This guide will help you set up PostgreSQL locally on Windows 10 for the Rooeel Backend project.

## Step 1: Install PostgreSQL

1. **Download PostgreSQL:**
   - Go to https://www.postgresql.org/download/windows/
   - Download the latest PostgreSQL installer (recommended: PostgreSQL 15 or 16)

2. **Run the installer:**
   - Double-click the downloaded `.exe` file
   - Follow the installation wizard
   - **Important settings:**
     - Port: `5432` (default)
     - Superuser password: Choose a strong password and **remember it**
     - Locale: Default
   - Install the additional tools (pgAdmin, Stack Builder) - recommended

3. **Verify installation:**
   - Open Command Prompt or PowerShell
   - Run: `psql --version`
   - You should see the PostgreSQL version number

## Step 2: Create Database

After installation, create a database for your project:

### Option A: Using pgAdmin (GUI)
1. Open **pgAdmin** (installed with PostgreSQL)
2. Connect to your local server (localhost)
3. Right-click on **Databases** → **Create** → **Database**
4. Database name: `rooeel_db`
5. Owner: `postgres`
6. Click **Save**

### Option B: Using Command Line
1. Open Command Prompt or PowerShell
2. Run the following commands:

```bash
# Connect to PostgreSQL (enter your password when prompted)
psql -U postgres

# Create the database
CREATE DATABASE rooeel_db;

# Exit psql
\q
```

## Step 3: Update Your .env File

Update your `.env` file with the local PostgreSQL connection string:

```env
# Local PostgreSQL connection
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/rooeel_db"
```

**Replace `YOUR_PASSWORD` with the password you set during PostgreSQL installation.**

### Example:
If your password is `mypassword123`, your `.env` should look like:
```env
DATABASE_URL="postgresql://postgres:mypassword123@localhost:5432/rooeel_db"
```

> **Note:** If your password contains special characters (like `@`, `#`, `!`, etc.), you need to URL-encode them:
> - `@` becomes `%40`
> - `#` becomes `%23`
> - `!` becomes `%21`
> - etc.

## Step 4: Run Prisma Migrations

After updating your `.env` file, run these commands in your project directory:

```bash
# Generate Prisma Client
npx prisma generate

# Push the schema to your database (creates tables)
npx prisma db push

# (Optional) Open Prisma Studio to view your database
npx prisma studio
```

## Step 5: Start Your Application

Now you can start your NestJS application:

```bash
npm run start:dev
```

Your application should now connect to your local PostgreSQL database successfully!

## Troubleshooting

### Issue: "psql: command not found"
**Solution:** Add PostgreSQL to your PATH:
1. Find your PostgreSQL installation directory (usually `C:\Program Files\PostgreSQL\15\bin`)
2. Add it to your system PATH environment variable
3. Restart your terminal

### Issue: "Connection refused" or "Can't reach database server"
**Solution:**
- Make sure PostgreSQL service is running:
  - Open **Services** (Win + R, type `services.msc`)
  - Find **postgresql-x64-15** (or your version)
  - Make sure it's **Running**
  - If not, right-click and select **Start**

### Issue: "password authentication failed"
**Solution:**
- Double-check your password in the `.env` file
- Make sure special characters are URL-encoded
- Try resetting the postgres user password using pgAdmin

## Useful Commands

```bash
# Check if PostgreSQL is running
Get-Service postgresql*

# Start PostgreSQL service
Start-Service postgresql-x64-15

# Stop PostgreSQL service
Stop-Service postgresql-x64-15

# Connect to database via psql
psql -U postgres -d rooeel_db
```

## Next Steps

Once your local PostgreSQL is set up and working:
1. ✅ Your database tables are created via `npx prisma db push`
2. ✅ Your NestJS app can connect to the database
3. ✅ You can use Prisma Studio to view/edit data: `npx prisma studio`

---

**Need help?** Check the [PostgreSQL Documentation](https://www.postgresql.org/docs/) or the [Prisma Documentation](https://www.prisma.io/docs/).
