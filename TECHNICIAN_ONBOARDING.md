# 🔧 Technician Onboarding System

The technician onboarding system allows admins to register technicians, automatically send them credentials, and enforces security policies.

## 🚀 Features

1.  **Admin Registration**: Admins can register technicians with specific skills and assigned areas.
2.  **Auto-Generated Credentials**: A secure 8-character temporary password is generated automatically.
3.  **Communication**: Credentials are sent via Email and SMS (Mocked to console in dev).
4.  **Forced Password Change**: Technicians MUST change their password upon first login.
5.  **Audit Logging**: All actions are logged.

## 📝 How to Use

### 1. Register a Technician (Admin)
1.  Log in as Admin (`admin@campus.edu`).
2.  Go to the **Technicians** tab.
3.  Click **Register Technician**.
4.  Enter details (Name, Email, Skills, etc.).
5.  Click Register.

> **Note:** Since we don't have a real email server, check the **Backend Terminal** to see the "Email Sent" log with the temporary password.

### 2. Technician First Login
1.  Log in with the Technician email and the temporary password from the console log.
2.  You will see a **"Security Update Required"** screen.
3.  Enter a new secure password.
4.  You will be automatically logged in and redirected to the dashboard.

## 🛠️ Technical Details

### Database Changes
Added fields to `User` model:
- `skillType`
- `assignedArea`
- `requiresPasswordChange`

### API Endpoints
- `POST /api/auth/technicians` (Admin only)
- `POST /api/auth/change-password` (Authenticated)

### Security
- Passwords are hashed using `bcrypt`.
- JWT tokens are used for authentication.
- Temporary passwords expire immediately after first use (due to forced change).

---

## 🧪 Testing Credentials

**Admin:**
- Email: `admin@campus.edu`
- Pass: `admin123`

**Technician (Example after registration):**
- Email: `tech@campus.edu` (or whatever you entered)
- Pass: *Check server console logs*
