# 🗄️ Database Guide (Supabase Edition)

Your application is now using **PostgreSQL** hosted on **Supabase**.

## 🔌 Connection Details

**Project:** `wscebfgtxwjihwatigxk`
**Type:** PostgreSQL (via Supabase)
**Connection String:** `postgresql://postgres:[PASSWORD]@db.wscebfgtxwjihwatigxk.supabase.co:5432/postgres`

## 🛠️ Management Commands

### 1. View Data
You can view your data in two ways:
1.  **Supabase Dashboard:** Go to your project -> Table Editor.
2.  **Prisma Studio:** Run `npx prisma studio` locally.

### 2. Making Schema Changes
If you modify `prisma/schema.prisma`:
```bash
npx prisma migrate dev --name describe_change
```

### 3. Resetting Database
To wipe all data and start fresh:
```bash
npx prisma migrate reset
```

## 🔐 Credentials
The database has been seeded with:
- **Admin:** `admin@campus.edu` / `admin123`

## ⚠️ Important Notes
- The `.env` file contains your database password. **DO NOT COMMIT .env TO GITHUB**.
- If you share the project, provide the `.env.example` file instead.
