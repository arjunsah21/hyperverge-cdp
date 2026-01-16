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

## Inventory Management

### Predicted Need Logic

The system automatically categorizes products based on their stock levels to assist in inventory planning.

| Status | Criteria | Description |
|--------|----------|-------------|
| **Order Now** | `stock_level < 20` | Critical low stock, immediate action required |
| **Restock Soon** | `20 <= stock_level <= 50` | Low stock warning, plan purchasing |
| **Healthy** | `stock_level > 50` | Sufficient inventory |

This logic is applied dynamically when viewing inventory or filtering products.

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

---

## Customer Status Definitions

Customers are assigned a status based on their engagement and purchase behavior:

### Status Types

| Status | Definition | Criteria |
|--------|------------|----------|
| **VIP** | Most valuable customers | Manually assigned OR total_spend >= $5,000 |
| **ACTIVE** | Regular engaged buyers | Made purchase in last 60 days AND total_orders >= 3 |
| **REGULAR** | Normal customers | Made purchase in last 90 days |
| **NEW** | Recent signups | Created within last 30 days OR total_orders <= 1 |
| **CHURNED** | Inactive customers | No purchase in last 120 days |

### Status Transitions

```
NEW → REGULAR (after first purchase, 30+ days old)
NEW → ACTIVE (after 3+ purchases while still engaged)
REGULAR → ACTIVE (reaches 3+ purchases, still buying)
ACTIVE → REGULAR (no purchase in 60 days, but within 90)
REGULAR → CHURNED (no purchase in 120+ days)
CHURNED → ACTIVE (makes new purchase, has 3+ orders)
Any → VIP (manually upgraded OR hits $5,000 spend)
```

### Status Badge Colors

| Status | Color |
|--------|-------|
| VIP | Purple (`#8b5cf6`) |
| ACTIVE | Green (`#22c55e`) |
| REGULAR | Blue (`#3b82f6`) |
| NEW | Cyan (`#06b6d4`) |
| CHURNED | Gray (`#6b7280`) |

---

## Customer Tier System

Customers are assigned a tier based on their lifetime spending:

### Tier Definitions

| Tier | Spending Threshold | Benefits/Meaning |
|------|-------------------|------------------|
| **Diamond** | $5,000+ | Top 1% customers |
| **Platinum** | $2,000 - $4,999 | High-value customers |
| **Gold** | $500 - $1,999 | Solid customers |
| **Silver** | $100 - $499 | Growing customers |
| **Bronze** | $0 - $99 | New/low-spend customers |

### Tier Calculation

```python
if total_spend >= 5000:
    tier = "Diamond"
elif total_spend >= 2000:
    tier = "Platinum"
elif total_spend >= 500:
    tier = "Gold"
elif total_spend >= 100:
    tier = "Silver"
else:
    tier = "Bronze"
```

### Tier Badge Colors

| Tier | Color |
|------|-------|
| Diamond | Light Blue (`#b9f2ff`) |
| Platinum | Silver (`#e5e4e2`) |
| Gold | Gold (`#ffd700`) |
| Silver | Silver (`#c0c0c0`) |
| Bronze | Bronze (`#cd7f32`) |

---

## Customer Insights (Detail View)

When viewing a customer's details, the following insights are calculated:

### Top Products by Quantity

```sql
SELECT product.name, SUM(order_items.quantity) as total_qty
FROM products 
JOIN order_items ON order_items.product_id = products.id
JOIN orders ON orders.id = order_items.order_id
WHERE orders.customer_id = {customer_id}
GROUP BY product.name
ORDER BY total_qty DESC
LIMIT 3
```

### Top Products by Value

```sql
SELECT product.name, SUM(order_items.quantity * order_items.price_at_purchase) as total_value
FROM products 
JOIN order_items ON order_items.product_id = products.id
JOIN orders ON orders.id = order_items.order_id
WHERE orders.customer_id = {customer_id}
GROUP BY product.name
ORDER BY total_value DESC
LIMIT 3
```

### Engagement Metrics

| Metric | Calculation |
|--------|-------------|
| Days Since Last Order | `today - last_order_date` |
| Days Since First Order | `today - first_order_date` |
| Order Frequency | `total_orders / (months_as_customer)` |
| Email Engaged | `email_opt_in = true` |
| SMS Engaged | `sms_opt_in = true` |

---

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

## UI Flow Documentation

### Customer & Order Navigation

The application implements a bi-directional navigation pattern between Customer Details and Order Details to keep users in context without full page reloads.

#### Pattern
- **Side Panel Architecture**: Both Customer Details and Order Details are implemented as overlay side panels.
- **Context Preservation**: The underlying page (Customers list or Orders list) remains visible and maintains its state (scroll position, filters).

#### Interaction Flows

**1. From Customers Page:**
- Click Customer Name -> Opens **Customer Details Panel**
- In Customer Panel, Click Order ID -> Closes Customer Panel -> Opens **Order Details Panel**
- In Order Panel, Click Customer Name -> Closes Order Panel -> Opens **Customer Details Panel**

**2. From Orders Page:**
- Click Order ID -> Opens **Order Details Panel**
- In Order Panel, Click Customer Name -> Closes Order Panel -> Opens **Customer Details Panel**
- In Customer Panel, Click Order ID -> Closes Customer Panel -> Opens **Order Details Panel**

This circular navigation allows seamless exploration of relationships:
`Customer -> Their Order -> That Customer -> Another Order...`

---

## AI & System Architecture

### AI Segment Generation logic

The system uses OpenAI's GPT models to translate natural language into structured segment rules.

- **Input**: User Query (e.g., "VIP customers in NY")
- **Process**:
    1.  The query is injected into a **Jinja2 System Prompt** (`segment_prompt.j2`).
    2.  The prompt defines the Schema (Fields, Operators) and forces JSON output.
    3.  The LLM infers intent (e.g., "VIP" -> `total_spend > 5000` or `status = 'VIP'`).
    4.  Values are strictly type-coerced to strings to match the database schema.
- **Output**: JSON payload with `name`, `description`, `logic`, and `rules`.

### AI Flow Generation logic

The system uses OpenAI to design entire email marketing flows.

- **Input**: User Query + List of existing DB Segments (JSON context).
- **Process**:
    1.  **Context Injection**: The `flow_prompt.j2` template receives a lightweight list of all available segments `[{id, name, description}]`.
    2.  **Intent Analysis**: The LLM determines if the user wants to target a specific existing segment or needs a new context.
    3.  **Content Generation**: The LLM writes "Subject Lines" and "Email Body" content appropriate for the goal.
    4.  **Structure Generation**: Returns a JSON object with `FlowCreate` schema (Steps, Delays, Trigger).
- **Output**: JSON payload validated against Pydantic schema.

### Logging Strategy

To ensure reliability and debuggability, the backend implements a specialized logging strategy:

- **Library**: `logging` with `colorlog` for console readability.
- **File Storage**: Logs are stored in `backend/logs/`.
- **Active Log**: The current day's log is always named `backend_api.log`.
- **Rotation Policy**:
    -   **Frequency**: Daily (Midnight).
    -   **Retention**: 30 days.
    -   **Naming**: Rotated files are appended with the date (e.g., `backend_api.log.2023-10-25`).
- **Granularity**: Logs include timestamp, log level, file path, line number, and function name.
