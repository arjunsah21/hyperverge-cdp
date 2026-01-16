# Seed data generation for CDP with 1000+ orders

import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Customer, Order, OrderItem, Product, Insight, Segment, SegmentRule, Flow, FlowStep


# Sample data for generation
FIRST_NAMES = [
    "Jane", "Robert", "Cameron", "Arlene", "Wade", "John", "Emma", "Michael",
    "Sarah", "David", "Olivia", "James", "Sophia", "William", "Isabella",
    "Benjamin", "Mia", "Lucas", "Charlotte", "Henry", "Amelia", "Alexander",
    "Harper", "Sebastian", "Evelyn", "Jack", "Abigail", "Aiden", "Emily", "Owen",
    "Elizabeth", "Samuel", "Sofia", "Ryan", "Avery", "Nathan", "Ella", "Caleb",
    "Scarlett", "Christian", "Grace", "Dylan", "Chloe", "Isaac", "Victoria",
    "Ethan", "Riley", "Jayden", "Aria", "Liam", "Lily", "Noah", "Aurora",
    "Cody", "Esther", "Alex"
]

LAST_NAMES = [
    "Cooper", "Fox", "Williamson", "McCoy", "Warren", "Smith", "Johnson",
    "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez",
    "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
    "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez",
    "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis",
    "Robinson", "Walker", "Young", "Allen", "King", "Wright", "Scott",
    "Torres", "Nguyen", "Hill", "Flores", "Green", "Adams", "Nelson",
    "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts",
    "Chen", "Fisher", "Howard", "Doe"
]

EMAIL_DOMAINS = ["gmail.com", "outlook.com", "company.co", "example.com", "yahoo.com", "hotmail.com"]

STATES = ["Texas", "California", "New York", "Florida", "Illinois", "Pennsylvania", 
          "Ohio", "Georgia", "North Carolina", "Michigan", "New Jersey", "Virginia",
          "Washington", "Arizona", "Massachusetts", "Tennessee", "Indiana", "Missouri",
          "Maryland", "Wisconsin", "Colorado", "Minnesota", "South Carolina", "Alabama"]

CITIES = {
    "Texas": ["Houston", "Austin", "Dallas", "San Antonio"],
    "California": ["Los Angeles", "San Francisco", "San Diego", "San Jose"],
    "New York": ["New York City", "Buffalo", "Rochester", "Albany"],
    "Florida": ["Miami", "Orlando", "Tampa", "Jacksonville"],
    "Illinois": ["Chicago", "Aurora", "Naperville", "Joliet"],
}

SOURCES = ["organic", "paid_search", "social", "referral", "email", "direct"]

TAGS_POOL = ["high-value", "repeat-buyer", "newsletter", "vip", "at-risk", "new", 
             "holiday-shopper", "mobile-user", "desktop-user", "promotional"]

# Products with higher weights for popular items
PRODUCT_DATA = [
    ("Hyper Buds Pro", "Audio", 149.99, 500, 0.15),  # name, category, price, initial_stock, popularity_weight
    ("HyperPhone Pro 15", "Electronics", 999.99, 200, 0.12),
    ("HyperBook Air M2", "Electronics", 1299.99, 150, 0.08),
    ("Noise Buds Pro", "Audio", 79.99, 600, 0.10),
    ("HyperWatch Elite", "Wearables", 349.99, 300, 0.09),
    ("HyperPad Pro", "Electronics", 799.99, 180, 0.07),
    ("Hyper Watch Ultra", "Wearables", 599.99, 250, 0.06),
    ("SmartSpeaker Max", "Audio", 199.99, 400, 0.05),
    ("Gaming Mouse X1", "Accessories", 69.99, 800, 0.04),
    ("Mechanical Keyboard Pro", "Accessories", 129.99, 500, 0.04),
    ("USB-C Hub Ultra", "Accessories", 49.99, 1000, 0.03),
    ("Wireless Charger Pad", "Accessories", 39.99, 1200, 0.03),
    ("4K Webcam Pro", "Electronics", 149.99, 400, 0.03),
    ("Noise Cancelling Headphones", "Audio", 299.99, 350, 0.03),
    ("Portable SSD 1TB", "Storage", 129.99, 600, 0.02),
    ("Smart Display 10", "Electronics", 249.99, 300, 0.02),
    ("Fitness Tracker Band", "Wearables", 99.99, 700, 0.02),
    ("Smart Ring", "Wearables", 199.99, 400, 0.01),
    ("Bluetooth Speaker Mini", "Audio", 49.99, 900, 0.01),
    ("Laptop Stand Ergonomic", "Accessories", 59.99, 800, 0.01),
]

INSIGHT_DATA = [
    ("Positive Sales Spike", "Hyper Buds Pro sales are up 40% in North America.", "positive", "trending-up", "2m ago"),
    ("Inventory Warning", "Stock for 'Hyper Watch Ultra' is critically low (5 units).", "warning", "alert-triangle", "45m ago"),
    ("New Customer Milestone", "You've reached 12,000+ total customers this month!", "positive", "users", "1h ago"),
    ("Segment Alert", "Your 'High-Value Customers' segment grew by 15% this week.", "positive", "users-plus", "2h ago"),
    ("Flow Performance", "Welcome Series flow has 45% open rate this month.", "positive", "mail", "3h ago"),
    ("Low Stock Alert", "HyperPhone Pro 15 stock is running low (5 units remaining).", "warning", "alert-circle", "3h ago"),
]


def generate_email(first_name: str, last_name: str) -> str:
    domain = random.choice(EMAIL_DOMAINS)
    formats = [
        f"{first_name.lower()}.{last_name.lower()}@{domain}",
        f"{first_name.lower()[0]}.{last_name.lower()}@{domain}",
        f"{first_name.lower()}{last_name.lower()[0]}@{domain}",
        f"{first_name.lower()}_{last_name.lower()}@{domain}",
    ]
    return random.choice(formats)


def generate_phone() -> str:
    return f"+1-{random.randint(200,999)}-{random.randint(200,999)}-{random.randint(1000,9999)}"


def generate_avatar_url(seed: int) -> str:
    return f"https://api.dicebear.com/7.x/avataaars/svg?seed={seed}"


def generate_sku(index: int) -> str:
    return f"SKU-{10000 + index}"


def generate_order_id(index: int) -> str:
    return f"HV-{1000 + index}"


def seed_database():
    db = SessionLocal()
    
    try:
        if db.query(Customer).count() > 0:
            print("Database already seeded, skipping...")
            return
        
        print("Seeding database with CDP data and 1000+ orders...")
        
        # Create products first
        products = []
        for i, (name, category, price, initial_stock, weight) in enumerate(PRODUCT_DATA):
            # Randomize stock slightly
            stock = initial_stock + random.randint(-50, 100)
            if stock <= 0:
                status = "OUT_OF_STOCK"
                predicted_need = "Order Now"
                stock = 0
            elif stock < 50:
                status = "LOW_STOCK"
                predicted_need = f"Restock in {random.randint(2, 7)}d"
            else:
                status = "IN_STOCK"
                predicted_need = random.choice(["Healthy", "Steady"])
            
            product = Product(
                name=name,
                sku=generate_sku(i),
                image_url=f"https://api.dicebear.com/7.x/shapes/svg?seed={name.replace(' ', '')}",
                stock_level=stock,
                price=price,
                status=status,
                predicted_need=predicted_need,
                category=category
            )
            products.append(product)
            db.add(product)
        
        db.commit()
        
        # Get product weights for random selection
        product_weights = [p[4] for p in PRODUCT_DATA]
        
        # Create customers
        customers = []
        used_emails = set()
        
        for i in range(150):  # 150 customers
            first_name = random.choice(FIRST_NAMES)
            last_name = random.choice(LAST_NAMES)
            
            email = generate_email(first_name, last_name)
            attempt = 0
            while email in used_emails and attempt < 10:
                email = generate_email(first_name, last_name)
                attempt += 1
            
            if email in used_emails:
                email = f"{first_name.lower()}{i}@{random.choice(EMAIL_DOMAINS)}"
            
            used_emails.add(email)
            
            # Assign status
            status_weights = [("VIP", 0.10), ("ACTIVE", 0.35), ("REGULAR", 0.35), ("NEW", 0.15), ("CHURNED", 0.05)]
            status = random.choices([s[0] for s in status_weights], weights=[s[1] for s in status_weights])[0]
            
            # Generate location
            state = random.choice(STATES)
            city = random.choice(CITIES.get(state, ["Metro City"]))
            
            # Dates
            created_days_ago = random.randint(1, 730)
            
            customer = Customer(
                email=email,
                first_name=first_name,
                last_name=last_name,
                phone=generate_phone() if random.random() > 0.3 else None,
                avatar_url=generate_avatar_url(i),
                address_line1=f"{random.randint(100, 9999)} {random.choice(['Main St', 'Oak Ave', 'Park Blvd', 'Cedar Ln', 'Elm Dr'])}",
                city=city,
                state=state,
                country="USA",
                zip_code=f"{random.randint(10000, 99999)}",
                status=status,
                total_orders=0,
                total_spend=0,
                lifetime_value=0,
                average_order_value=0,
                email_opt_in=random.random() > 0.15,
                sms_opt_in=random.random() > 0.7,
                source=random.choice(SOURCES),
                tags=random.sample(TAGS_POOL, k=random.randint(0, 3)),
                created_at=datetime.utcnow() - timedelta(days=created_days_ago)
            )
            customers.append(customer)
            db.add(customer)
        
        db.commit()
        
        # Create 1200 orders with order items
        print("Creating 1200 orders with items...")
        order_count = 0
        customer_order_counts = {c.id: 0 for c in customers}
        customer_order_totals = {c.id: 0.0 for c in customers}
        
        for i in range(1200):
            # Select customer (weighted towards active customers)
            customer = random.choice(customers)
            
            # Order date - spread across last 180 days
            order_date = datetime.utcnow() - timedelta(
                days=random.randint(0, 180),
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59)
            )
            
            # Status based on age
            days_old = (datetime.utcnow() - order_date).days
            if days_old > 14:
                status_opts = [("Delivered", 0.7), ("Shipped", 0.2), ("Cancelled", 0.1)]
            elif days_old > 3:
                status_opts = [("Shipped", 0.6), ("Delivered", 0.3), ("Pending", 0.1)]
            else:
                status_opts = [("Pending", 0.5), ("Shipped", 0.4), ("Cancelled", 0.1)]
            
            status = random.choices([s[0] for s in status_opts], weights=[s[1] for s in status_opts])[0]
            
            # Create order
            order = Order(
                order_id=generate_order_id(order_count),
                customer_id=customer.id,
                date=order_date,
                status=status,
                total_amount=0,  # Will calculate from items
                shipping_address=f"{customer.address_line1}, {customer.city}, {customer.state} {customer.zip_code}"
            )
            db.add(order)
            db.flush()  # Get order ID
            
            # Add 1-4 items to order
            num_items = random.randint(1, 4)
            order_total = 0
            
            # Select products based on popularity weights
            selected_products = random.choices(products, weights=product_weights, k=num_items)
            
            for product in selected_products:
                quantity = random.randint(1, 3)
                item_price = product.price * quantity
                order_total += item_price
                
                order_item = OrderItem(
                    order_id=order.id,
                    product_id=product.id,
                    quantity=quantity,
                    price_at_purchase=product.price
                )
                db.add(order_item)
            
            order.total_amount = round(order_total, 2)
            
            # Update customer metrics
            customer_order_counts[customer.id] += 1
            customer_order_totals[customer.id] += order_total
            
            order_count += 1
            
            if order_count % 200 == 0:
                print(f"  Created {order_count} orders...")
                db.commit()
        
        db.commit()
        
        # Update customer metrics
        print("Updating customer metrics...")
        for customer in customers:
            count = customer_order_counts[customer.id]
            total = customer_order_totals[customer.id]
            customer.total_orders = count
            customer.total_spend = round(total, 2)
            customer.lifetime_value = round(total * random.uniform(1.0, 1.3), 2)
            customer.average_order_value = round(total / max(count, 1), 2)
            
            if count > 0:
                # Set first and last order dates
                customer.first_order_date = datetime.utcnow() - timedelta(days=random.randint(30, 365))
                customer.last_order_date = datetime.utcnow() - timedelta(days=random.randint(0, 60))
        
        db.commit()
        
        # Create sample segments
        segments_data = [
            {
                "name": "High-Value Customers",
                "description": "Customers who have spent over $500",
                "rules": [{"field": "total_spend", "operator": "greater_than", "value": "500"}]
            },
            {
                "name": "Texas Customers",
                "description": "All customers located in Texas",
                "rules": [{"field": "state", "operator": "equals", "value": "Texas"}]
            },
            {
                "name": "Gmail Users",
                "description": "Customers with Gmail addresses",
                "rules": [{"field": "email", "operator": "contains", "value": "gmail.com"}]
            },
            {
                "name": "Recent Buyers",
                "description": "Customers who ordered in the last 30 days",
                "rules": [{"field": "last_order_date", "operator": "within_days", "value": "30"}]
            },
            {
                "name": "VIP Segment",
                "description": "VIP customers who opted in for emails",
                "logic": "AND",
                "rules": [
                    {"field": "status", "operator": "equals", "value": "VIP"},
                    {"field": "email_opt_in", "operator": "equals", "value": "true"}
                ]
            },
        ]
        
        for seg_data in segments_data:
            segment = Segment(
                name=seg_data["name"],
                description=seg_data["description"],
                logic=seg_data.get("logic", "AND"),
                customer_count=random.randint(10, 50)
            )
            db.add(segment)
            db.flush()
            
            for rule_data in seg_data["rules"]:
                rule = SegmentRule(
                    segment_id=segment.id,
                    field=rule_data["field"],
                    operator=rule_data["operator"],
                    value=rule_data["value"]
                )
                db.add(rule)
        
        db.commit()
        
        # Create sample flows
        flows_data = [
            {
                "name": "Welcome Series",
                "description": "Onboarding email sequence for new subscribers",
                "trigger_type": "segment",
                "status": "active",
                "steps": [
                    {"order": 1, "subject": "Welcome to HyperVerge!", "delay_days": 0},
                    {"order": 2, "subject": "Getting Started Guide", "delay_days": 2},
                    {"order": 3, "subject": "Your First Purchase Discount", "delay_days": 5},
                ]
            },
            {
                "name": "Abandoned Cart Recovery",
                "description": "Recover abandoned shopping carts",
                "trigger_type": "event",
                "status": "active",
                "steps": [
                    {"order": 1, "subject": "You left something behind!", "delay_hours": 1},
                    {"order": 2, "subject": "Still thinking it over?", "delay_days": 1},
                    {"order": 3, "subject": "Last chance: 10% off your cart", "delay_days": 3},
                ]
            },
            {
                "name": "Re-engagement Campaign",
                "description": "Win back inactive customers",
                "trigger_type": "segment",
                "status": "paused",
                "steps": [
                    {"order": 1, "subject": "We miss you!", "delay_days": 0},
                    {"order": 2, "subject": "Here's what you've been missing", "delay_days": 7},
                    {"order": 3, "subject": "Special offer just for you", "delay_days": 14},
                ]
            },
        ]
        
        for flow_data in flows_data:
            flow = Flow(
                name=flow_data["name"],
                description=flow_data["description"],
                trigger_type=flow_data["trigger_type"],
                status=flow_data["status"],
                total_sent=random.randint(100, 5000),
                total_opened=random.randint(30, 2000),
                total_clicked=random.randint(10, 500)
            )
            db.add(flow)
            db.flush()
            
            for step_data in flow_data["steps"]:
                step = FlowStep(
                    flow_id=flow.id,
                    order=step_data["order"],
                    step_type="email",
                    subject=step_data["subject"],
                    content=f"<p>Email content for: {step_data['subject']}</p>",
                    delay_days=step_data.get("delay_days", 0),
                    delay_hours=step_data.get("delay_hours", 0),
                    sent_count=random.randint(100, 2000),
                    open_count=random.randint(30, 800),
                    click_count=random.randint(10, 200)
                )
                db.add(step)
        
        db.commit()
        
        # Create insights
        for title, description, insight_type, icon, time_ago in INSIGHT_DATA:
            insight = Insight(
                title=title,
                description=description,
                type=insight_type,
                icon=icon,
                time_ago=time_ago
            )
            db.add(insight)
        
        db.commit()
        print(f"Database seeded successfully with {len(customers)} customers and {order_count} orders!")
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
