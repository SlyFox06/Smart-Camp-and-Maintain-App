# 🔐 Admin Credentials

## Default Admin Account

**Email:** `admin@campus.edu`  
**Password:** `admin123`

**Role:** Admin  
**Name:** Super Admin  
**Department:** Administration  
**Phone:** +91 00000 00000

---

## Login Endpoint

```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "admin@campus.edu",
  "password": "admin123"
}
```

### cURL Example:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@campus.edu","password":"admin123"}'
```

### Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "admin@campus.edu",
    "name": "Super Admin",
    "role": "admin",
    "department": "Administration"
  }
}
```

---

## Using the Token

After login, use the token in the Authorization header for all protected endpoints:

```bash
curl http://localhost:5000/api/admin/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Frontend Login

In your React app, you can login like this:

```typescript
const response = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@campus.edu',
    password: 'admin123'
  })
});

const { token, user } = await response.json();

// Store token
localStorage.setItem('token', token);
localStorage.setItem('user', JSON.stringify(user));
```

---

## Creating Additional Users

### Create Student:
```bash
POST /api/auth/register
{
  "email": "student@campus.edu",
  "password": "student123",
  "name": "John Doe",
  "role": "student",
  "department": "Computer Science",
  "phone": "+91 98765 43210"
}
```

### Create Technician (Admin only):
```bash
POST /api/auth/users
Authorization: Bearer ADMIN_TOKEN
{
  "email": "tech@campus.edu",
  "password": "tech123",
  "name": "Tech Support",
  "role": "technician",
  "department": "Maintenance",
  "phone": "+91 98765 43211"
}
```

---

## Database Seeding

The admin user is automatically created when you run:

```bash
npm run seed
```

Or when you run migrations:

```bash
npx prisma migrate dev
```

The seed script is located at: `server/prisma/seed.ts`

---

## Security Notes

⚠️ **Important:** Change the default admin password in production!

To change password programmatically:
```typescript
import bcrypt from 'bcryptjs';

const hashedPassword = await bcrypt.hash('new_password', 10);
await prisma.user.update({
  where: { email: 'admin@campus.edu' },
  data: { password: hashedPassword }
});
```

---

## Quick Test

Test if login works:

```bash
# 1. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@campus.edu","password":"admin123"}'

# 2. Copy the token from response

# 3. Test protected endpoint
curl http://localhost:5000/api/admin/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Database Location

The SQLite database is located at:
```
e:\Hackthon\server\dev.db
```

You can view/edit it using:
```bash
npx prisma studio
```

This will open a GUI at `http://localhost:5555`
