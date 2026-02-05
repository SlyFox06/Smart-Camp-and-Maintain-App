# Smart Campus Maintenance System

A full-stack modern web application for managing campus maintenance complaints using QR codes and AI.

## Features

- 📱 **QR Code Integration**: Scan asset QR codes to instantly report issues
- 🏷️ **Asset Management**: Admin portal to register assets and generate printable QR codes
- 🔧 **Smart Assignment**: Auto-assigns technicians based on expertise (with manual override)
- 🤖 **AI Severity Classification**: Auto-detects urgency based on complaint description
- 📸 **Proof of Repair**: Technicians must upload evidence before closing tickets
- 🔐 **OTP Verification**: Secure verification for complaint closure
- 📊 **Role-Based Dashboards**:
  - **Student**: Report & Track (Mobile friendly)
  - **Technician**: Manage Tasks & Updates
  - **Admin**: Asset Management, Analytics & Oversight
- 🔍 **Audit Trail**: Full system logging for all actions
- 🎨 **Modern UI**: Glassmorphism design with responsive layout

## Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Styling**: Tailwind CSS (v3), Lucide React Icons
- **State/Data**: React Query (ready), Mock Data (current)

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Development Server**
   ```bash
   npm run dev
   ```

3. **Open Application**
   Navigate to `http://localhost:5173`

## Project Structure

- `/src/components` - UI Components (Dashboards, Forms, Scanners)
- `/src/data` - Mock data for simulation
- `/src/utils` - Helper functions (AI logic, Formatters)
- `/src/types` - TypeScript definitions

## Future Improvements

- Connect to real backend (Node.js/Express)
- Integrate TensorFlow.js for image-based severity detection
- Add push notifications
