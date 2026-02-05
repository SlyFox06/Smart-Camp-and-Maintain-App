# 🤝 Collaboration Guide

This project is now git-initialized and ready for GitHub! Follow these steps to share it with your friends.

## 1. Create a Repository on GitHub
1. Go to [github.com/new](https://github.com/new).
2. Enter a name (e.g., `smart-campus-maintenance`).
3. **Important:** Do NOT check "Initialize with README", ".gitignore", or "License" (we already have these).
4. Click **Create repository**.

## 2. Push Your Code
Copy the commands GitHub shows you under **"…or push an existing repository from the command line"** and run them in your terminal here:

```bash
git remote add origin https://github.com/YOUR_USERNAME/smart-campus-maintenance.git
git branch -M main
git push -u origin main
```

## 3. Invite Your Friends
1. Go to your new GitHub repository page.
2. Click **Settings** (top tab) -> **Collaborators** (left menu).
3. Click **Add people** and enter your friends' GitHub usernames or emails.

---

## 🚀 How Friends Can Run the Project

Once they accept the invite, they should follow these steps:

### 1. Clone the Repo
```bash
git clone https://github.com/YOUR_USERNAME/smart-campus-maintenance.git
cd smart-campus-maintenance
```

### 2. Setup Frontend
```bash
npm install
```

### 3. Setup Backend
```bash
cd server
npm install
```

### 4. Database Setup (Important!)
Since the database file is ignored (for security), they need to create their own local copy:

```bash
# In the server/ directory
npx prisma migrate dev --name init
npm run seed
```

### 5. Run the Project
They will need two terminals:

**Terminal 1 (Frontend):**
```bash
# Root folder
npm run dev
```

**Terminal 2 (Backend):**
```bash
# server/ folder
npm run dev
```

## 📝 Credentials
The default admin login for their local database will be:
- **Email:** `admin@campus.edu`
- **Password:** `admin123`
