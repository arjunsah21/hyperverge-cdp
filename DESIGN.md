# Design Documentation

## High Level Design (HLD)

### Architecture Overview
The application follows a modern 3-tier architecture:
- **Frontend**: React.js Single Page Application (SPA) utilizing functional components, hooks, and React Router for navigation.
- **Backend**: FastAPI (Python) providing RESTful APIs.
- **Database**: PostgreSQL (SQLAlchemy ORM) for data persistence.

### Component Diagram
```mermaid
graph TD
    User[User] --> Frontend[React Frontend]
    Frontend --> Router[React Router]
    
    subgraph "Frontend Layer"
        Router --> Dashboard[Dashboard Page]
        Router --> Customers[Customers Page]
        Router --> Segments[Segments Page]
        Router --> Flows[Email Flows Page]
        Router --> Orders[Orders Page]
        Router --> Inventory[Inventory Page]
        
        Customers & Orders --> DetailsPanel[Shared Details Panels]
    end
    
    Frontend -->|REST API| Backend[FastAPI Backend]
    
    subgraph "Backend Layer"
        Backend --> APIRouter[API Router]
        APIRouter --> CustomerSVC[Customer Service]
        APIRouter --> OrderSVC[Order Service]
        APIRouter --> SegmentSVC[Segment Service]
        APIRouter --> FlowSVC[Flow Service]

        APIRouter --> AnalyticsSVC[Analytics Service]
        APIRouter --> AISVC[AI Service]
        
        AISVC --> OpenAI[OpenAI API / Proxy]
        CustomerSVC & OrderSVC & SegmentSVC & FlowSVC --> ORM[SQLAlchemy ORM]
    end
    
    ORM --> DB[(PostgreSQL Database)]

    EmailService[Email Service]
    Frontend -->|OTP Verification| APIRouter
    APIRouter --> EmailService -->|SMTP| SMTP[SMTP Server]
```

### Data Flow
1. **User Interaction**: User interacts with the React frontend.
2. **API Request**: Frontend makes async HTTP requests using the `api.js` service layer.
3. **Request Handling**: FastAPI router receives request, validates data using Pydantic models.
4. **Business Logic**: Service layer executes business rules (e.g., segment evaluation, tier calculation).
5. **Data Access**: SQLAlchemy translates operations to SQL queries.
6. **Response**: Data is returned to frontend and state is updated.

### Database Migration Strategy
The application uses **Alembic** for handling database schema migrations. This allows for:
- Version control of the database schema.
- Automatic generation of migration scripts from SQLAlchemy models.
- Safe upgrades and downgrades of the database structure.

### Authentication & Security
The authentication system is built on **OAuth2 with Password Flow (Bearer Token)** and **JWT**.

#### verification Flow (OTP)
1.  **Sign Up**: User submits details -> Backend generates random 6-digit code -> Sends via SMTP -> User remains `is_active=False`.
2.  **Verify**: User enters code -> Backend matches `verification_code` -> User becomes `is_active=True`.
3.  **Login**: Only active users can obtain a JWT access token.
4.  **Password Reset**: Request -> OTP sent -> Verify & Reset Password.

#### Role Based Access Control (RBAC)
- **Super Admin**: Full system access (User Management).
- **Admin**: Dashboard & Store operations (cannot delete users).
- **Viewer**: Read-only access to Dashboard.

---

## Low Level Design (LLD)

### Database Schema
```mermaid
erDiagram
    CUSTOMER {
        int id
        string first_name
        string last_name
        string email
        string phone
        string status
        decimal total_spend
        int total_orders
    }
    
    ORDER {
        int id
        int customer_id
        string order_id
        datetime date
        string status
        decimal total_amount
    }
    
    ORDER_ITEM {
        int id
        int order_id
        int product_id
        int quantity
        decimal price
    }
    
    PRODUCT {
        int id
        string name
        string sku
        decimal price
        int stock
        string category
    }
    
    SEGMENT {
        int id
        string name
        string description
        string criteria_logic
    }
    
    SEGMENT_RULE {
        int id
        int segment_id
        string field
        string operator
        string value
    }

    CUSTOMER ||--o{ ORDER : places
    ORDER ||--o{ ORDER_ITEM : contains
    product ||--o{ ORDER_ITEM : includes
    SEGMENT ||--o{ SEGMENT_RULE : defined_by
```

### Frontend Component Architecture

#### reusable Components
- **`CustomerDetailsPanel`**: 
  - **Props**: `customerId`, `isOpen`, `onClose`, `onOrderClick`
  - **Functionality**: Fetches and displays customer profile, stats, tiers, and order history. 
  - **Key Feature**: Bi-directional navigation to Order Details.
- **`OrderDetailsPanel`**:
  - **Props**: `orderId`, `isOpen`, `onClose`, `onCustomerClick`
  - **Functionality**: Fetches and displays order summary, items, and shipping info.
  - **Key Feature**: Bi-directional navigation to Customer Details.
- **`StatusBadge`**: Visual indicator for order/customer status.
- **`Pagination`**: Handles table pagination logic.

#### Key Pages
- **`Customers.jsx`**:
  - State: `customers`, `search`, `filters`, `selectedCustomerId`, `selectedOrderId`
  - Features: Filtering, Searching, Editing, Viewing Details.
- **`Orders.jsx`**:
  - State: `orders`, `search`, `tabs`, `selectedOrderId`, `selectedCustomerId`
  - Features: Status Tabs, Order Lookup, Detail View.
- **`Segments.jsx`**:
  - Features: Rule builder for creating dynamic customer segments.
  - **AI Integration**: Natural language input via `AIInput` component in `Drawer`.
- **`Flows.jsx`**:
  - Features: Email sequence builder (Subject, Content, Delays).
  - **AI Integration**: Context-aware generation of full flow structure including segment selection.
- **`Dashboard.jsx`**:
  - Features: Real-time metrics visualization (Sales, AOV, Active Customers).
- **`Inventory.jsx`**:
  - Features: 
    - **CSV Export**: Download full product list for external analysis.
    - **Advanced Filtering**: Filter by Price Range and AI-Predicted Need via `Drawer`.
    - **Advanced Filtering**: Filter by Price Range and AI-Predicted Need via `Drawer`.
    - **Metrics**: Stock alerts and inventory valuation.
- **`UserManagement.jsx`** (Super Admin Only):
  - Features:
    - **User Table**: List users with badges for status and roles.
    - **CRUD Operations**: Edit user details (Modal), Delete users (Confirmation), Change roles.
    - **RBAC**: Protected route, accessible only to `SUPER_ADMIN`.
  - **Login.jsx**:
    - Features: Authentication, Sign Up, Forgot Password flows.
    - **Theme Support**: System-wide dark/light mode toggle.
    - **Security**: Password visibility toggle, branded UI.

### Backend API Design

#### Customer Endpoints
- `GET /api/customers`: List customers with filtering/sorting.
- `GET /api/customers/{id}/details`: Get comprehensive customer view (Profile + Orders + Insights).
- `POST /api/customers`: Create new customer.
- `PUT /api/customers/{id}`: Update customer details.

#### Order Endpoints
- `GET /api/orders`: List orders with pagination.
- `GET /api/orders/{id}`: Get full order details.

#### Segment Endpoints

- `POST /api/segments/preview`: Preview customers matching specific rules (Dynamic Evaluation).
- `POST /api/segments/ai-generate`: Transform natural language to segment rules.

- `POST /api/segments/ai-generate`: Transform natural language to segment rules.

#### Inventory Endpoints
- `GET /api/inventory`: List products with pagination and advanced filtering (Price, Predicted Need).
- `GET /api/inventory/stats`: Get inventory overview metrics.
- `GET /api/inventory/{id}`: Get single product details.

#### Flow Endpoints
- `POST /api/flows/ai-generate`: Generate flow structure (Name, Steps, Segment) from prompt.

#### Admin Endpoints (Super Admin)
- `GET /admin/users`: List all system users.
- `PUT /admin/users/{id}`: Update user details (Name, Email, Role, Active Status).
- `PUT /admin/users/{id}/role`: Update user role specific shortcut.
- `DELETE /admin/users/{id}`: Delete a user account.

#### Authentication Endpoints (`/api/auth`)
- `POST /register`: Register new user and send OTP.
- `POST /verify`: Verify email with OTP.
- `POST /token`: Login to get access token.
- `POST /forgot-password`: Initiate password reset flow.
- `POST /reset-password`: Complete password reset with OTP.

### AI Architecture
- **Service Layer**: `ai_service.py` handles LLM interactions.
- **Prompt Engineering**: Jinja2 (`segment_prompt.j2`) ensures consistent JSON output.
- **Resilience**:
  - **Type Coercion**: Numerics from LLM forced to strings for DB compatibility.
  - **Fallback**: Graceful error handling returns empty rule sets.

### Security Considerations
- **CORS**: Configured to allow frontend-backend communication.
- **Input Validation**: Pydantic models ensure semantic correctness of incoming data.
- **Error Handling**: Standardized HTTP error responses.
