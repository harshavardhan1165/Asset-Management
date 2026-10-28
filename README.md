# AssetFlow — Enterprise Asset & Equipment Allocation System

A full-stack, enterprise-grade equipment allocation and inventory custody management platform built with React 19, TypeScript, Express.js, MongoDB Atlas, Cloudinary CDN, and secure HttpOnly cookie authentication.

---

## 🌟 Key Features

### For Employees (Borrowers):
- **Live Equipment Catalog:** Filter by category, real-time stock indicators, and debounced instant search.
- **Allocation Request Desk:** Submit asset requests with duration and optional sanction documentation.
- **Custody Tracking:** Track active custody with return initiation.
- **Proof Photo Uploads:** Upload handover and return condition proof photos directly to Cloudinary cloud storage.

### For Administrators:
- **Executive Analytics Dashboard:** Real-time hardware utilization charts, low-stock watchlists, and key performance indicators.
- **Inventory Operations Desk:** Add, edit, and adjust stock with Cloudinary media integration. Built-in system guards prevent deleting equipment with active borrowers.
- **Approval Queue:** Review, approve, reject (with reason modal), and issue equipment allocations.
- **Return Inspection Desk:** Interactive Photo Lightbox modal with zoom and multi-image keyboard navigation (`Esc`, `←`, `→`). Verify condition and automatically restock items into the live catalog.

---

## 🛠️ Technology Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v3, React Router v7, Axios, Lucide React, React Hot Toast.
- **Backend:** Node.js, Express.js, TypeScript, tsx, Zod, Swagger UI, Helmet, CORS, Express Rate Limit.
- **Database:** MongoDB Atlas (Cloud NoSQL) via Mongoose v8.
- **Cloud Media:** Cloudinary CDN + Multer.
- **Security:** HttpOnly, SameSite=Lax Cookie Sessions, JWT, Bcrypt.js password hashing, RBAC (Role-Based Access Control).

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18+ recommended)
- **MongoDB Atlas** account (or local MongoDB instance)
- **Cloudinary** account (for cloud media storage)

### 2. Backend Setup
1. Open a terminal and navigate to the backend:
   ```bash
   cd backend
   npm install
   ```
2. Configure your environment variables:
   ```bash
   cp .env.example .env
   ```
   Fill in your `MONGO_URI`, `JWT_SECRET`, and `CLOUDINARY_*` credentials.
3. *(Optional)* Seed initial sample equipment and accounts:
   ```bash
   npm run seed
   ```
4. Start the backend development server:
   ```bash
   npm run dev
   ```
   The backend API will run on **http://localhost:5000** with interactive Swagger documentation at **http://localhost:5000/api-docs**.

### 3. Frontend Setup
1. Open a second terminal and navigate to the frontend:
   ```bash
   cd frontend
   npm install
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
   Open your browser at **http://localhost:5173**.

---

## 🔑 Default Accounts (Post-Seed)

| Role | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **Admin** | System Administrator | `admin@assetflow.com` | `Admin@123456` |
| **Employee** | John Doe | `john@assetflow.com` | `User@123456` |
| **Employee** | Jane Smith | `jane@assetflow.com` | `User@123456` |

---

## 📂 Project Structure

```text
Asset_Management/
├── backend/
│   ├── src/
│   │   ├── config/          # DB, Cloudinary, Swagger, Environment
│   │   ├── constants/       # Roles, Request State Machine
│   │   ├── controllers/     # Auth, Product, Request Controllers
│   │   ├── middlewares/     # Auth, Error, Rate Limiting, Validation
│   │   ├── models/          # User, Product, AssetRequest Mongoose Models
│   │   ├── routes/          # RESTful Express Routes
│   │   ├── services/        # Business Logic Layer
│   │   └── validations/     # Zod Schemas
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios API Client & Service Modules
│   │   ├── components/      # UI Primitives, Modals, Lightbox
│   │   ├── context/         # AuthContext (Pure HttpOnly Cookie Session)
│   │   ├── hooks/           # useAuth, useDebounce, useClickOutside
│   │   ├── layouts/         # AppLayout, AdminLayout, Navbar
│   │   ├── pages/           # Catalog, Login, Custody, Admin Desks
│   │   └── types/           # Shared TypeScript Interfaces
│   └── package.json
└── README.md
```
