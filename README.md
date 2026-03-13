# INKORA - Deployment & Setup Guide

INKORA is a premium e-book platform built with React, Express, and SQLite. This guide provides instructions for local setup and production deployment.

## 🚀 Quick Start (Local Setup)

1.  **Install Dependencies**:
    ```bash
    npm install
    ```
2.  **Start Development Server**:
    ```bash
    npm run dev
    ```
    The app will be available at `http://localhost:3000`.

## 📦 Production Deployment

### 1. Database Persistence (CRITICAL)
INKORA uses **SQLite** (`inkora.db`) for data storage. This means all your data (users, orders, sales, profiles) is stored in a single file in the root directory.

**Important for Cloud Hosting:**
If you deploy to a platform like **Google Cloud Run** or **Heroku**, the file system is "ephemeral" (it resets every time the app restarts). To keep your data permanently, you must:
-   **Option A (Recommended)**: Use a persistent volume (like Google Cloud Storage or AWS EFS) to store the `inkora.db` file.
-   **Option B**: Migrate to a managed database like **PostgreSQL** or **MySQL** (requires code changes to `server.ts`).

### 2. Environment Variables
Create a `.env` file in production with the following:
-   `NODE_ENV=production`
-   `PORT=3000`

### 3. Build & Start
```bash
# Build the frontend
npm run build

# Start the production server
npm start
```

## 🛡️ Admin Access
To access the Admin Dashboard:
1.  Go to the `/admin` route.
2.  Login with an account that has `isAdmin` set to `1` in the database.
3.  *Note: You can manually set a user as admin by editing the `inkora.db` file using a SQLite viewer.*

## 🛠️ Tech Stack
-   **Frontend**: React 18, Tailwind CSS, Framer Motion, Lucide Icons.
-   **Backend**: Node.js, Express.
-   **Database**: SQLite (via `better-sqlite3`).
-   **Build Tool**: Vite.

## 📁 Data Storage Assurance
All critical data is stored in the `inkora.db` file:
-   **Users**: Emails (case-insensitive), hashed passwords, profile details.
-   **Orders**: Customer info, items purchased, total price, order status.
-   **Products**: Books and Bundles metadata.

As long as you back up the `inkora.db` file, you will never lose your data.
