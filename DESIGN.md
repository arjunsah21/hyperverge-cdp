# Design Documentation

## High Level Design (HLD)

### Architecture Overview
The application follows a modern 3-tier architecture:
- **Frontend**: React.js Single Page Application (SPA) utilizing functional components, hooks, and React Router for navigation.
- **Backend**: FastAPI (Python) providing RESTful APIs.
- **Database**: SQLite (SQLAlchemy ORM) for data persistence.

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
        
        CustomerSVC & OrderSVC & SegmentSVC & FlowSVC --> ORM[SQLAlchemy ORM]
    end
    
    ORM --> DB[(SQLite Database)]
```

### Data Flow
1. **User Interaction**: User interacts with the React frontend.
2. **API Request**: Frontend makes async HTTP requests using the `api.js` service layer.
3. **Request Handling**: FastAPI router receives request, validates data using Pydantic models.
4. **Business Logic**: Service layer executes business rules (e.g., segment evaluation, tier calculation).
5. **Data Access**: SQLAlchemy translates operations to SQL queries.
6. **Response**: Data is returned to frontend and state is updated.

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
- **`Dashboard.jsx`**:
  - Features: Real-time metrics visualization (Sales, AOV, Active Customers).

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

### Security Considerations
- **CORS**: Configured to allow frontend-backend communication.
- **Input Validation**: Pydantic models ensure semantic correctness of incoming data.
- **Error Handling**: Standardized HTTP error responses.
