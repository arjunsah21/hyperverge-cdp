# Seed data generation for the database

import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Customer, Order, Product, Insight, CustomerStatus, OrderStatus, StockStatus


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

PRODUCT_NAMES = [
    ("HyperPhone Pro 15", "Electronics"),
    ("HyperBook Air M2", "Electronics"),
    ("Noise Buds Pro", "Audio"),
    ("HyperWatch Elite", "Wearables"),
    ("HyperPad Pro", "Electronics"),
    ("Hyper Buds Pro", "Audio"),
    ("Hyper Watch Ultra", "Wearables"),
    ("SmartSpeaker Max", "Audio"),
    ("Gaming Mouse X1", "Accessories"),
    ("Mechanical Keyboard Pro", "Accessories"),
    ("USB-C Hub Ultra", "Accessories"),
    ("Wireless Charger Pad", "Accessories"),
    ("4K Webcam Pro", "Electronics"),
    ("Noise Cancelling Headphones", "Audio"),
    ("Portable SSD 1TB", "Storage"),
    ("Smart Display 10", "Electronics"),
    ("Fitness Tracker Band", "Wearables"),
    ("Smart Ring", "Wearables"),
    ("Bluetooth Speaker Mini", "Audio"),
    ("Laptop Stand Ergonomic", "Accessories"),
    ("Monitor Light Bar", "Accessories"),
    ("Smart Plug Set", "Smart Home"),
    ("Security Camera Indoor", "Smart Home"),
    ("Smart Thermostat", "Smart Home"),
    ("Robot Vacuum Pro", "Smart Home"),
    ("Air Purifier HEPA", "Appliances"),
    ("Coffee Maker Smart", "Appliances"),
    ("Electric Kettle Pro", "Appliances"),
    ("Desk Lamp LED", "Office"),
    ("Ergonomic Chair", "Office"),
    ("Standing Desk Mat", "Office"),
    ("Cable Management Kit", "Accessories"),
    ("Power Bank 20000mAh", "Accessories"),
    ("Car Charger Dual", "Accessories"),
    ("Screen Protector Glass", "Accessories"),
    ("Phone Case Premium", "Accessories"),
    ("Tablet Sleeve 12\"", "Accessories"),
    ("Laptop Backpack", "Accessories"),
    ("Wireless Earbuds Sport", "Audio"),
    ("Studio Microphone USB", "Audio"),
    ("Streaming Light Kit", "Accessories"),
    ("Green Screen Backdrop", "Accessories"),
    ("Camera Tripod Pro", "Accessories"),
    ("Memory Card 256GB", "Storage"),
    ("External HDD 2TB", "Storage"),
    ("NAS Drive 4TB", "Storage"),
    ("WiFi Router Mesh", "Networking"),
    ("Ethernet Switch 8-Port", "Networking"),
    ("Smart Doorbell Video", "Smart Home"),
    ("Smart Lock Fingerprint", "Smart Home"),
]

INSIGHT_DATA = [
    ("Positive Sales Spike", "Hyper Buds Pro sales are up 40% in North America.", "positive", "trending-up", "2m ago"),
    ("Inventory Warning", "Stock for 'Hyper Watch Ultra' is critically low (5 units).", "warning", "alert-triangle", "45m ago"),
    ("New Customer Milestone", "You've reached 12,000+ total customers this month!", "positive", "users", "1h ago"),
    ("Order Volume Increase", "Order volume increased by 25% compared to last week.", "positive", "package", "2h ago"),
    ("Low Stock Alert", "HyperPhone Pro 15 stock is running low (5 units remaining).", "warning", "alert-circle", "3h ago"),
    ("Revenue Target", "You're 85% towards your monthly revenue target.", "info", "target", "4h ago"),
]


def generate_email(first_name: str, last_name: str) -> str:
    """Generate a realistic email address"""
    domain = random.choice(EMAIL_DOMAINS)
    formats = [
        f"{first_name.lower()}.{last_name.lower()}@{domain}",
        f"{first_name.lower()[0]}.{last_name.lower()}@{domain}",
        f"{first_name.lower()}{last_name.lower()[0]}@{domain}",
        f"{first_name.lower()}_{last_name.lower()}@{domain}",
    ]
    return random.choice(formats)


def generate_avatar_url(seed: int) -> str:
    """Generate a placeholder avatar URL"""
    return f"https://api.dicebear.com/7.x/avataaars/svg?seed={seed}"


def generate_sku() -> str:
    """Generate a random SKU"""
    return f"SKU-{random.randint(10000, 99999)}"


def generate_order_id(index: int) -> str:
    """Generate order ID in HV-XXXX format"""
    return f"HV-{1024 + index}"


def seed_database():
    """Seed the database with dummy data"""
    db = SessionLocal()
    
    try:
        # Check if data already exists
        if db.query(Customer).count() > 0:
            print("Database already seeded, skipping...")
            return
        
        print("Seeding database with dummy data...")
        
        # Create customers
        customers = []
        used_emails = set()
        
        for i in range(60):
            first_name = random.choice(FIRST_NAMES)
            last_name = random.choice(LAST_NAMES)
            
            # Ensure unique email
            email = generate_email(first_name, last_name)
            attempt = 0
            while email in used_emails and attempt < 10:
                email = generate_email(first_name, last_name)
                attempt += 1
            
            if email in used_emails:
                email = f"{first_name.lower()}{i}@{random.choice(EMAIL_DOMAINS)}"
            
            used_emails.add(email)
            
            # Assign status with weighted distribution
            status_weights = [
                (CustomerStatus.VIP, 0.15),
                (CustomerStatus.ACTIVE, 0.35),
                (CustomerStatus.REGULAR, 0.35),
                (CustomerStatus.NEW, 0.15),
            ]
            status = random.choices(
                [s[0] for s in status_weights],
                weights=[s[1] for s in status_weights]
            )[0]
            
            total_orders = random.randint(1, 150) if status != CustomerStatus.NEW else random.randint(1, 5)
            total_spend = round(random.uniform(100, 30000) if status == CustomerStatus.VIP else random.uniform(50, 5000), 2)
            
            customer = Customer(
                name=f"{first_name} {last_name}",
                email=email,
                avatar_url=generate_avatar_url(i),
                status=status.value,
                total_orders=total_orders,
                total_spend=total_spend,
                created_at=datetime.utcnow() - timedelta(days=random.randint(1, 365))
            )
            customers.append(customer)
            db.add(customer)
        
        db.commit()
        
        # Create orders
        for i, customer in enumerate(customers):
            num_orders = random.randint(1, 8)
            for j in range(num_orders):
                order_index = i * 10 + j
                status_choices = [OrderStatus.SHIPPED, OrderStatus.PENDING, OrderStatus.CANCELLED]
                status_weights = [0.6, 0.3, 0.1]
                status = random.choices(status_choices, weights=status_weights)[0]
                
                order = Order(
                    order_id=generate_order_id(order_index),
                    customer_id=customer.id,
                    date=datetime.utcnow() - timedelta(days=random.randint(0, 90)),
                    status=status.value,
                    total_amount=round(random.uniform(50, 2000), 2)
                )
                db.add(order)
        
        db.commit()
        
        # Create products
        for i, (name, category) in enumerate(PRODUCT_NAMES):
            stock = random.randint(0, 200)
            if stock == 0:
                status = StockStatus.OUT_OF_STOCK
                predicted_need = "Order Now"
            elif stock < 20:
                status = StockStatus.LOW_STOCK
                predicted_need = f"Restock in {random.randint(2, 7)}d"
            else:
                status = StockStatus.IN_STOCK
                predicted_need = random.choice(["Healthy", "Steady", "Healthy"])
            
            product = Product(
                name=name,
                sku=generate_sku(),
                image_url=f"https://api.dicebear.com/7.x/shapes/svg?seed={name.replace(' ', '')}",
                stock_level=stock,
                price=round(random.uniform(49, 1500), 2),
                status=status.value,
                predicted_need=predicted_need,
                category=category,
                created_at=datetime.utcnow() - timedelta(days=random.randint(1, 180))
            )
            db.add(product)
        
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
        print("Database seeded successfully!")
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
