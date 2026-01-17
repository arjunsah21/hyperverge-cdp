# HyperVerge E-Commerce Dashboard

A modern, full-stack e-commerce admin dashboard built with **React** (frontend) and **FastAPI** (backend), featuring a sleek dark theme inspired by professional admin interfaces.

![Dashboard Preview](https://via.placeholder.com/800x400?text=HyperVerge+Dashboard)

## ✨ Features

- **Dashboard Overview** - Key metrics, real-time charts, and insights
- **Customer Management** - Search, filter, edit, and tier-based segmentation (Diamond, Platinum, etc.)
- **Order Tracking** - Status tracking, order details, and history
- **Inventory Management** - Stock levels, low stock alerts, and categorization
- **Customer Segments** - Create dynamic groups based on rules (e.g., "High Spenders from Texas")
- **AI Rule Generator** 🧠 - Turn natural language queries like "VIPs from NY" into complex segment rules instantly
- **Email Flows** - Automated email sequences triggered by segments or events
- **User Management** 👥 - Role-Based Access Control (Super Admin, Admin, Viewer) with user editing and deletion.
- **Theme Support** 🌓 - Fully supported Light and Dark modes with a system-wide toggle.
- **Dark Theme UI** - Modern, professional design with consistent side-panel navigation
- **RESTful API** - Scalable API architecture with FastAPI

## 📁 Project Structure

```
e-comm/
├── backend/                    # FastAPI Backend
│   ├── app/
│   │   ├── ...
│   │   ├── models.py          # Extended Customer, Order, Segment, Flow models
│   │   └── routers/
│   │       ├── ...
│   │       ├── segments.py    # Segments endpoints
│   │       └── flows.py       # Email Flows endpoints
│
├── frontend/                   # React Frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── CustomerDetailsPanel.jsx  # Standardized customer view
│   │   │   ├── OrderDetailsPanel.jsx     # Standardized order view
│   │   │   ├── Sidebar.jsx
│   │   │   └── ...
│   │   ├── pages/
│   │   │   ├── Segments.jsx
│   │   │   ├── Flows.jsx
│   │   │   └── ...
```

## � Documentation

For a deeper dive into the system's architecture and logic, refer to the following documents:

- **[DESIGN.md](./DESIGN.md)**
  - **Purpose**: Technical blueprint and architectural overview.
  - **Contents**:
    - **Frontend Architecture**: Component hierarchy, state management (Drawers, Context), and key UI patterns.
    - **Backend Design**: API schema, database relationship diagrams (ERD), and directory structure.
    - **AI Architecture**: Details on the OpenAI integration, prompt engineering strategies (`flow_prompt.j2`), and the "AI Proxy" service layer.

- **[BUSINESS_LOGIC.md](./BUSINESS_LOGIC.md)**
  - **Purpose**: functional specifications and business rules.
  - **Contents**:
    - **Core Metrics**: Formulas for CLV (Customer Lifetime Value), AOV, and Churn Rate.
    - **Customer Tiers**: Logic defining VIP, Active, and Churned statuses.
    - **Segment Rules**: Detailed criteria for dynamic customer grouping (e.g., "High Spenders from CA").
    - **Flow Logic**: step-by-step execution rules for email sequences and delay handling.

## �🚀 Quick Start

### Prerequisites

- **Python 3.9+** - For the backend
- **Node.js 18+** - For the frontend
- **npm** or **yarn** - Package manager

### Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment (recommended):**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Configure Environment Variables:**
   Copy the example file and add your OpenAI credentials:
   ```bash
   cp .env.example .env
   # Edit .env with your OPENAI_API_KEY
   ```

4. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Start the FastAPI server:**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

   The API will be available at: `http://localhost:8000`
   
   - **API Documentation:** `http://localhost:8000/docs` (Swagger UI)
   - **Alternative Docs:** `http://localhost:8000/redoc`

> **Note:** On first run, the system **automatically** performs database migrations and seeds demo data. No manual setup required!


### 🔐 Default Super Admin Credentials

After starting the backend, you can login with:

| Field | Value |
|-------|-------|
| **Email** | `admin@hyperverge.co` |
| **Password** | `admin123` |

> ⚠️ **Security Note:** Change these credentials in production!

### Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

   The app will be available at: `http://localhost:5173`

## 📡 API Endpoints

### Dashboard
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/dashboard/stats` | GET | Get dashboard overview statistics |
| `/api/dashboard/insights` | GET | Get intelligence feed insights |

### Customers
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/customers` | GET | Get paginated list of customers |
| `/api/customers/{id}` | GET | Get single customer by ID |
| `/api/customers` | POST | Create a new customer |

**Query Parameters for `/api/customers`:**
- `page` - Page number (default: 1)
- `per_page` - Items per page (default: 10, max: 100)
- `search` - Search by name or email
- `status` - Filter by status (VIP, ACTIVE, REGULAR, NEW)
- `sort_by` - Sort field (total_spend, total_orders, name, created_at)
- `sort_order` - Sort direction (asc, desc)

### Orders
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/orders` | GET | Get paginated list of orders |
| `/api/orders/{id}` | GET | Get single order by ID |

**Query Parameters for `/api/orders`:**
- `page`, `per_page`, `search`, `sort_by`, `sort_order`
- `status` - Filter by status (Pending, Shipped, Cancelled)

### Inventory
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/inventory/stats` | GET | Get inventory statistics |
| `/api/inventory/categories` | GET | Get product categories |
| `/api/inventory` | GET | Get paginated list of products |
| `/api/inventory/{id}` | GET | Get single product by ID |

**Query Parameters for `/api/inventory`:**
- `page`, `per_page`, `search`, `sort_by`, `sort_order`
- `status` - Filter by stock status (IN_STOCK, LOW_STOCK, OUT_OF_STOCK)
- `category` - Filter by product category

## 🎨 Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Lucide React** - Icon library
- **Vanilla CSS** - Custom design system

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM for database operations
- **SQLite** - Lightweight database
- **Pydantic** - Data validation
- **Uvicorn** - ASGI server

## 📊 Demo Data (Auto-Seeded)

On first startup, the backend automatically seeds the database with:

| Entity | Count | Description |
|--------|-------|-------------|
| **Super Admin** | 1 | Default admin user for login |
| **Customers** | 150 | Varied statuses (VIP, Active, Regular, New, Churned) |
| **Orders** | 1,200 | With order items linked to products |
| **Products** | 20 | Electronics, Audio, Wearables, Accessories, Storage |
| **Segments** | 5 | High-Value, Texas, Gmail Users, Recent Buyers, VIP |
| **Flows** | 3 | Welcome Series, Abandoned Cart, Re-engagement |
| **Insights** | 6 | Dashboard intelligence feed alerts |

The seeding is **idempotent** - running the backend multiple times won't duplicate data.

## 🔧 Development

### Backend Development
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

### Frontend Development
```bash
cd frontend
npm run dev
```

### Build for Production
```bash
# Frontend
cd frontend
npm run build
```

## 📝 License

This project is open source and available under the MIT License.
