# EV Shop - Final Year Project

Welcome to **EV Shop**, a state-of-the-art e-commerce platform designed exclusively for the Electric Vehicle (EV) market. This project bridges the gap between EV buyers and sellers while integrating advanced financial services and administrative controls.

What sets this platform apart is its integration of **Machine Learning** for predictive analytics, offering users insights into battery health and potential repair costs, and a comprehensive **Admin Dashboard** for complete system oversight.

---

## Table of Contents

1.  [System Overview](#system-overview)
2.  [Key Features](#key-features)
3.  [Technology Stack](#technology-stack)
4.  [System Architecture](#system-architecture)
5.  [Project Structure](#project-structure)
6.  [Installation & Setup](#installation--setup)
7.  [Machine Learning Pipeline](#machine-learning-pipeline)
8.  [API Documentation](#api-documentation)
9.  [Testing](#testing)
10. [License](#license)

---

## System Overview

EV Shop is designed as a multi-role ecosystem:

- **Buyers**: Explore EVs, compare models, book test drives, and make secure purchases.
- **Sellers**: Manage vehicle inventories, schedule test drives, and interact with the community.
- **Financial Staff**: Review and approve loan/financing applications.
- **Admins**: Oversee users, listings, orders, and manage the platform's health via advanced reporting and ML tools.

---

## Key Features

### For Buyers

- **Smart Search**: Advanced filtering by brand, price, range, and battery capacity.
- **Test Drive Booking**: Real-time slot booking with sellers.
- **Secure Checkout**: Integrated cart and payment processing.
- **Community Forum**: Engage with other EV enthusiasts and sellers.
- **Review System**: Rate and review vehicles and sellers.

### For Sellers

- **Inventory Management**: Easy-to-use interface for adding and editing EV listings.
- **Slot Management**: Define availability for test drives.
- **Sales Dashboard**: Track orders and revenue.
- **Customer Interaction**: Reply to reviews and community posts.

### For Admins

- **Executive Dashboard**: Real-time analytics on users, revenue, and listings.
- **Report Generation**: One-click PDF export for all data tables (Users, Orders, Financials, etc.).
- **User Management**: Control access for Buyers, Sellers, and Financial Staff.
- **ML Pipeline Control**: Interface to test predictions and trigger model retraining.

### Machine Learning Integration

- **Battery Health Predictor**: Estimates remaining battery life based on age, mileage, and charging habits.
- **Repair Cost Estimator**: Predicts potential repair costs using vehicle telematics data.

---

## Technology Stack

### Frontend (Client-Side)

- **Core**: React 19, TypeScript, Vite
- **State Management**: Redux Toolkit (Global Store), React Query (Server State)
- **Styling**: Tailwind CSS, Framer Motion (Animations)
- **Maps**: Leaflet / React-Leaflet
- **Data Viz**: Recharts (Dashboard Charts)
- **Reporting**: JSPDF & AutoTable

### Backend (Server-Side)

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB (Mongoose ODM)
- **Caching**: Redis (for session storage and caching)
- **ML Integration**: ONNX Runtime Node, Python (for training)
- **Security**: Helmet, BCrypt, CSURF, Rate Limiting

---

## System Architecture

The project follows a **Microservices-inspired Monolithic Architecture**:

1.  **Client Layer**: A Single Page Application (SPA) built with React.
2.  **API Layer**: Express.js REST API handling requests, validation, and routing.
3.  **Service Layer**: Business logic separated from controllers for modularity.
4.  **Data Layer**: MongoDB for persistent data and Redis for temporary caching.
5.  **ML Layer**: Python scripts for training models -> ONNX format -> Node.js Inference.

---

## Project Structure

```bash
Final-Year-Project-Ev-shop/
├── Backend/
│   ├── ml_models/          # Pre-trained ONNX models
│   ├── scripts/            # (Optional) Python scripts for retraining
│   ├── src/
│   │   ├── config/         # DB, Redis, Env configurations
│   │   ├── modules/        # Feature-based modules (Auth, User, Order, ML, ...)
│   │   ├── shared/         # Shared utils, middleware, constants
│   │   ├── app.ts          # Express app configuration
│   │   └── index.ts        # Backend entry point (server bootstrap)
│   └── package.json
│
├── Frontend/ev-shop/
│   ├── src/
│   │   ├── assets/         # Images, icons, fonts
│   │   ├── components/     # Reusable UI components
│   │   ├── features/       # Role-based feature folders
│   │   │   ├── admin/      # Admin pages & services
│   │   │   ├── buyer/      # Buyer pages & services
│   │   │   ├── seller/     # Seller pages & services
│   │   │   └── auth/       # Authentication logic
│   │   ├── store/          # Redux setup
│   │   └── App.tsx         # Main component with Routing
│   └── package.json
└── README.md
```

---

## Installation & Setup

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (Local or Atlas)
- Redis Server
- Python 3.x (Optional, for retraining)

### 1. Backend Setup

1.  Navigate to `Backend`:
    ```bash
    cd Backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in `Backend` with at least:
    ```env
    PORT=5000
    CLIENT_URL=http://localhost:5173
    MONGO_URI=mongodb://localhost:27017/ev_shop
    REDIS_URL=redis://localhost:6379
    SESSION_SECRET=your_session_secret
    JWT_SECRET=your_jwt_secret
    # Optional: OAuth, email, payment, and AI keys
    # GOOGLE_CLIENT_ID=...
    # GOOGLE_CLIENT_SECRET=...
    # FACEBOOK_CLIENT_ID=...
    # FACEBOOK_CLIENT_SECRET=...
    # EMAIL_HOST=...
    # EMAIL_USER=...
    # EMAIL_PASS=...
    # PAYHERE_MERCHANT_ID=...
    # GEMINI_API_KEY=...
    ```
4.  Run the backend server:
    ```bash
    npm run dev
    ```

### 2. Frontend Setup

1.  Navigate to `Frontend/ev-shop`:
    ```bash
    cd Frontend/ev-shop
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run the dev server:
    ```bash
    npm run dev
    ```
    Access the app at `http://localhost:5173`.

---

## Machine Learning Pipeline

The project features a unique ML pipeline managed directly from the Admin Dashboard.

1.  **Inference**: The backend uses `onnxruntime-node` to load optimized `.onnx` models for fast, low-latency predictions during runtime.
2.  **Retraining** (optional / extendable):
    - Admins can trigger a "Retrain" action from the Admin Dashboard.
    - The backend can spawn Python scripts (e.g., under `Backend/scripts`) to train and export updated models.
    - Newly exported `.onnx` files placed in `Backend/ml_models` are picked up by the Node.js inference layer.

---

## API Documentation (Key Endpoints)

| Module    | Method | Endpoint                         | Description                               |
| :-------- | :----- | :------------------------------- | :---------------------------------------- |
| **Auth**  | POST   | `/api/v1/auth/login`             | User login (JWT)                          |
| **EV**    | GET    | `/api/v1/ev`                     | Get all EV listings                       |
| **Order** | POST   | `/api/v1/order`                  | Place a new order                         |
| **Admin** | GET    | `/api/v1/admin/users`            | Get all users                             |
| **ML**    | POST   | `/api/v1/ml-test/battery-health` | Predict battery health                    |
| **ML**    | POST   | `/api/v1/ml-test/retrain`        | Trigger model retraining (if implemented) |

> _Full, interactive API documentation is available via Swagger at `/api-docs` when the backend is running._

---

## Testing

- **Backend tests**: From the `Backend` folder, run:

```bash
cd Backend
npm test
```

---

## License

This project was created as a **Final Year Project for BIT Semester 6**.

A dedicated open-source license file (e.g., MIT/ISC) has **not** been added at the root of this repository yet.  
Before any public or commercial use, please add an appropriate `LICENSE` file and update the backend `package.json` and Swagger metadata if needed.
