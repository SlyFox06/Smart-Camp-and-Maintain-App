# Deployment Guide

This guide will help you deploy the Smart Campus Maintenance application to the cloud. We'll use **Render** for the backend (server) and **Vercel** for the frontend (client).

## Prerequisites

1.  A [GitHub](https://github.com/) account.
2.  A [Render](https://render.com/) account.
3.  A [Vercel](https://vercel.com/) account.
4.  Your **Supabase** database connection string (from your `.env` file).

---

## Part 1: Deploy Backend (Render)

1.  **Push your code to GitHub** (if you haven't already).
2.  Log in to **Render** and click **New +** -> **Web Service**.
3.  Connect your GitHub repository.
4.  Configure the service:
    *   **Name**: `smart-campus-server` (or similar)
    *   **Root Directory**: `server` (Important!)
    *   **Environment**: `Node`
    *   **Build Command**: `npm install && npm run build`
    *   **Start Command**: `npm start`
    *   **Plan**: Free (or whichever you prefer)
5.  Scroll down to **Environment Variables** and add:
    *   `DATABASE_URL`: Your Supabase connection string (e.g., `postgresql://postgres:[PASSWORD]@db.your-project.supabase.co:5432/postgres`)
    *   `JWT_SECRET`: A secure random string (e.g., specific long random string)
    *   `PORT`: `10000` (Render adds this automatically, but good to know)
6.  Click **Create Web Service**.
7.  Wait for the deployment to finish. Copy the **Service URL** (e.g., `https://smart-campus-server.onrender.com`). You'll need this for the frontend.

---

## Part 2: Deploy Frontend (Vercel)

1.  Log in to **Vercel** and click **Add New** -> **Project**.
2.  Import your GitHub repository.
3.  Configure the project:
    *   **Framework Preset**: Vite (should be detected automatically)
    *   **Root Directory**: `./` (default)
    *   **Build Command**: `npm run build` (default)
    *   **Output Directory**: `dist` (default)
4.  Expand **Environment Variables** and add:
    *   `VITE_API_URL`: The Backend Service URL from Part 1, appended with `/api` (e.g., `https://smart-campus-server.onrender.com/api`)
5.  Click **Deploy**.
6.  Wait for the deployment to finish. Your app is now live!

---

## Part 3: Verify Deployment

1.  Open your Vercel URL.
2.  Try to log in.
3.  Check if data loads from the backend.
4.  If you face CORS issues, the backend is configured to allow all origins (`app.use(cors())`) so it should work fine.

## Troubleshooting

-   **Database Connection Error**: Ensure your `DATABASE_URL` in Render matches your local `.env` exactly.
-   **API Error**: Check the `VITE_API_URL` in Vercel. It MUST end with `/api`.
-   **404 on Refresh**: Vercel handles this automatically for Vite apps, but we also added a `vercel.json` to ensure it works.
