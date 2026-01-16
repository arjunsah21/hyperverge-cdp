# HyperVerge E-Commerce Dashboard

A modern, full-stack e-commerce admin dashboard built with **React** (frontend) and **FastAPI** (backend), featuring a sleek dark theme inspired by professional admin interfaces.

![Dashboard Preview](https://via.placeholder.com/800x400?text=HyperVerge+Dashboard)

## ✨ Features

- **Dashboard Overview** - Key metrics, charts, top products, and intelligence feed
- **Customer Management** - Search, filter, sort, and paginate through customers
- **Order Tracking** - Filter orders by status (Pending, Shipped, Cancelled)
- **Inventory Management** - Stock levels, low stock alerts, and predicted needs
- **Dark Theme UI** - Modern, professional design with smooth animations
- **RESTful API** - Clean API architecture with FastAPI and SQLite

## 📁 Project Structure

```
e-comm/
├── backend/                    # FastAPI Backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py            # FastAPI app entry point
│   │   ├── database.py        # SQLite database configuration
│   │   ├── models.py          # SQLAlchemy ORM models
│   │   ├── schemas.py         # Pydantic schemas
│   │   ├── seed_data.py       # Dummy data generator
│   │   └── routers/
│   │       ├── __init__.py
│   │       ├── dashboard.py   # Dashboard stats endpoints
│   │       ├── customers.py   # Customer CRUD endpoints
│   │       ├── orders.py      # Orders endpoints
│   │       └── inventory.py   # Inventory endpoints
│   └── requirements.txt       # Python dependencies
│
├── frontend/                   # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── MetricCard.jsx
│   │   │   ├── StatusBadge.jsx
│   │   │   └── Pagination.jsx
│   │   ├── pages/             # Page components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Customers.jsx
│   │   │   ├── Orders.jsx
│   │   │   └── Inventory.jsx
│   │   ├── services/          # API service layer
│   │   │   └── api.js
│   │   ├── styles/            # CSS stylesheets
│   │   │   └── index.css
│   │   ├── App.jsx            # Main app with routing
│   │   └── main.jsx           # React entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

## 🚀 Quick Start

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

3. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Start the FastAPI server:**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

   The API will be available at: `http://localhost:8000`
   
   - **API Documentation:** `http://localhost:8000/docs` (Swagger UI)
   - **Alternative Docs:** `http://localhost:8000/redoc`

> **Note:** The database is automatically created and seeded with dummy data on first run.

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

## 📊 Dummy Data

The application comes pre-seeded with:
- **60 customers** with varied statuses (VIP, Active, Regular, New)
- **200+ orders** linked to customers
- **50 products** across multiple categories
- **6 intelligence insights** for the dashboard feed

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
