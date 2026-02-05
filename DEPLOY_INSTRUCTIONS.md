# Deployment & Mobile Testing Guide

## 1. Environment Setup

Ensure your PostgreSQL database is running.

### Backend (Server)
1. Navigate to the server directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run database migrations:
   ```bash
   npx prisma migrate dev --name init
   ```
4. Start the backend server:
   ```bash
   npm run dev
   ```
   *Server should be running on http://localhost:5000 (or configured port)*

### Frontend (Client)
1. Navigate to the root project directory (new terminal).
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server with host access:
   ```bash
   npm run dev -- --host
   ```
   *This exposes the app to your local network.*

---

## 2. Testing on Mobile

To test the mobile-optimized Admin Dashboard and other views on your phone:

1. **Find your Computer's Local IP Address:**
   - **Windows**: Open Command Prompt and type `ipconfig`. Look for `IPv4 Address` (e.g., `192.168.1.15`).
   - **Mac/Linux**: Open Terminal and type `ifconfig` or `ip a`.

2. **Connect Mobile Device:**
   - Ensure your mobile phone is connected to the **same Wi-Fi network** as your computer.

3. **Open in Browser:**
   - Open Chrome/Safari on your phone.
   - Navigate to: `http://<YOUR_IP_ADDRESS>:5173` (e.g., `http://192.168.1.15:5173`).

### 📱 Features to Test on Mobile
*   **Admin Dashboard**: Check the stacked header layout and the responsive stats grid.
*   **Technician Dashboard**: Verify the card layout and "Update Status" modal responsiveness.
*   **Complaint Details**: Ensure the modal fits on the screen and buttons are tapable.

---

## 3. SLA Monitoring System

To start the automatic SLA breach detection:

```bash
# In the server directory
npx ts-node src/scripts/checkSLA.ts
```

*For production, this should be set up as a Cron Job to run every hour.*
