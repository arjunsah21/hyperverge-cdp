# HyperVerge CDP - Business Logic Documentation

This document explains the core business logic, calculations, and features of the Customer Data Platform.

---

## Dashboard Metrics

The dashboard displays 6 key performance indicators calculated from real database data.

### 1. Total Customers

**What it shows:** Total number of customers in the system.

**Calculation:**
```
total_customers = COUNT(customers table)
change = ((new_customers_this_month / customers_last_month) * 100)
```

**Data source:** `customers` table

---

### 2. 30 Days Revenue

**What it shows:** Total revenue from orders in the last 30 days.

**Calculation:**
```
total_revenue = SUM(orders.total_amount) WHERE order.date >= (now - 30 days)
revenue_change = ((current_30d_revenue - previous_30d_revenue) / previous_30d_revenue) * 100
```

**Data source:** `orders` table

---

### 3. Top Selling Product

**What it shows:** Product with highest sales (estimated by lowest stock level, assuming products started with similar stock).

**Calculation:**
```
top_product = Product with lowest stock_level (excluding OUT_OF_STOCK)
estimated_units_sold = 200 - current_stock_level
```

**Data source:** `products` table

---

### 4. Top Ordering Region

**What it shows:** Geographic distribution of customers by state.

**Calculation:**
```
regions = GROUP BY customers.state
         ORDER BY COUNT(customers.id) DESC
         LIMIT 3
percentage = (state_count / total_customers_with_state) * 100
```

**Data source:** `customers.state` field

---

### 5. Average Order Value (AOV)

**What it shows:** Average amount per order in the last 30 days.

**Calculation:**
```
aov = total_revenue / total_orders
aov_change = current_aov - previous_30d_aov
```

**Data source:** `orders` table

---

### 6. Customer Retention

**What it shows:** Percentage of customers who have made more than one purchase.

**Calculation:**
```
returning_customers = COUNT(customers WHERE total_orders > 1)
new_customers = COUNT(customers WHERE total_orders <= 1)
retention_rate = (returning_customers / total_customers) * 100
```

**Data source:** `customers.total_orders` field

---

## Customer Segments

### What is a Segment?

A **segment** is a dynamic subset of customers defined by one or more rules. Segments automatically update as customer data changes.

### Creating a Segment

1. Go to **Segments** page
2. Click **Create Segment**
3. Define:
   - **Name**: e.g., "High-Value Texas Customers"
   - **Description**: Optional explanation
   - **Logic**: AND (all rules must match) or OR (any rule matches)
   - **Rules**: One or more filter conditions

### Segment Rules

Each rule has three parts:

| Component | Description | Example |
|-----------|-------------|---------|
| **Field** | Customer attribute to filter | `state`, `total_spend`, `email` |
| **Operator** | Comparison type | `equals`, `greater_than`, `contains` |
| **Value** | Value to compare against | `"Texas"`, `500`, `"gmail.com"` |

### Supported Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `equals` | Exact match | `state equals "Texas"` |
| `not_equals` | Not equal to | `status not_equals "CHURNED"` |
| `contains` | Contains substring | `email contains "gmail.com"` |
| `greater_than` | Greater than number | `total_spend greater_than 500` |
| `less_than` | Less than number | `total_orders less_than 5` |
| `within_days` | Date within N days of now | `last_order_date within_days 30` |

### Example Segments

**High-Value Customers:**
```
Rules (AND):
  - total_spend greater_than 500
```

**Texas Gmail Users:**
```
Rules (AND):
  - state equals "Texas"
  - email contains "gmail.com"
```

**Recent Active Buyers:**
```
Rules (AND):
  - last_order_date within_days 30
  - email_opt_in equals "true"
```

---

## Email Flows

### What is a Flow?

A **flow** is an automated sequence of emails sent to customers based on triggers and delays.

### Creating a Flow

1. Go to **Email Flows** page
2. Click **Create Flow**
3. Define:
   - **Name**: e.g., "Welcome Series"
   - **Description**: What the flow does
   - **Trigger Type**: What starts the flow
   - **Target Segment**: Which customers receive it (for segment triggers)
   - **Steps**: The emails and delays

### Flow Triggers

| Trigger | Description |
|---------|-------------|
| **Segment** | Triggered when customer enters a segment |
| **Event** | Triggered by customer action (e.g., cart abandonment) |
| **Manual** | Manually started by admin |

### Flow Steps

Each step defines an email to send:

| Field | Description |
|-------|-------------|
| **Subject** | Email subject line |
| **Delay Days** | Days to wait before sending |
| **Delay Hours** | Hours to wait before sending |

### Flow Statuses

| Status | Description |
|--------|-------------|
| **Draft** | Being created, not active |
| **Active** | Running and sending emails |
| **Paused** | Temporarily stopped |
| **Archived** | Completed/retired |

### Example Flow: Welcome Series

```
Flow: Welcome Series
Trigger: Segment entry (New Customers)

Step 1: "Welcome to HyperVerge!" (Delay: 0 days)
Step 2: "Getting Started Guide" (Delay: 2 days)
Step 3: "Your First Purchase Discount" (Delay: 5 days)
```

### Flow Metrics

| Metric | Calculation |
|--------|-------------|
| **Open Rate** | (total_opened / total_sent) * 100 |
| **Click Rate** | (total_clicked / total_sent) * 100 |

---

## Customer Data Model

### Core Customer Fields

| Field | Type | Description |
|-------|------|-------------|
| `email` | String | Primary identifier (unique) |
| `first_name` | String | Customer's first name |
| `last_name` | String | Customer's last name |
| `phone` | String | Phone number |
| `status` | Enum | VIP, ACTIVE, REGULAR, NEW, CHURNED |

### Address Fields

| Field | Type | Description |
|-------|------|-------------|
| `city` | String | City name |
| `state` | String | State/province |
| `country` | String | Country (default: USA) |
| `zip_code` | String | Postal code |

### Metrics (Auto-calculated)

| Field | Type | Description |
|-------|------|-------------|
| `total_orders` | Integer | Number of orders placed |
| `total_spend` | Float | Total $ spent |
| `lifetime_value` | Float | Estimated LTV |
| `average_order_value` | Float | Average $ per order |
| `first_order_date` | DateTime | First purchase date |
| `last_order_date` | DateTime | Most recent purchase |

### Marketing Fields

| Field | Type | Description |
|-------|------|-------------|
| `email_opt_in` | Boolean | Subscribed to emails |
| `sms_opt_in` | Boolean | Subscribed to SMS |
| `source` | String | Acquisition channel |
| `tags` | JSON Array | Custom labels |

---

## API Overview

### Dashboard
- `GET /api/dashboard/stats` - Get all 6 dashboard metrics

### Customers
- `GET /api/customers` - List with filters/pagination
- `GET /api/customers/{id}` - Single customer
- `POST /api/customers` - Create customer
- `PUT /api/customers/{id}` - Update customer
- `DELETE /api/customers/{id}` - Delete customer

### Segments
- `GET /api/segments` - List all segments
- `GET /api/segments/{id}` - Segment details
- `GET /api/segments/{id}/customers` - Matching customers
- `POST /api/segments` - Create segment
- `PUT /api/segments/{id}` - Update segment
- `DELETE /api/segments/{id}` - Delete segment

### Flows
- `GET /api/flows` - List all flows
- `GET /api/flows/{id}` - Flow with steps
- `POST /api/flows` - Create flow
- `PUT /api/flows/{id}` - Update flow
- `DELETE /api/flows/{id}` - Delete flow
- `POST /api/flows/{id}/steps` - Add step
- `PUT /api/flows/{id}/steps/{step_id}` - Update step
- `DELETE /api/flows/{id}/steps/{step_id}` - Delete step
