# SQLAlchemy Models

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.database import Base


class CustomerStatus(str, enum.Enum):
    VIP = "VIP"
    ACTIVE = "ACTIVE"
    REGULAR = "REGULAR"
    NEW = "NEW"


class OrderStatus(str, enum.Enum):
    PENDING = "Pending"
    SHIPPED = "Shipped"
    CANCELLED = "Cancelled"


class StockStatus(str, enum.Enum):
    IN_STOCK = "IN_STOCK"
    LOW_STOCK = "LOW_STOCK"
    OUT_OF_STOCK = "OUT_OF_STOCK"


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    avatar_url = Column(String, nullable=True)
    status = Column(String, default=CustomerStatus.NEW)
    total_orders = Column(Integer, default=0)
    total_spend = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    orders = relationship("Order", back_populates="customer")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String, unique=True, nullable=False)  # HV-XXXX format
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    date = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default=OrderStatus.PENDING)
    total_amount = Column(Float, nullable=False)

    customer = relationship("Customer", back_populates="orders")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    sku = Column(String, unique=True, nullable=False)
    image_url = Column(String, nullable=True)
    stock_level = Column(Integer, default=0)
    price = Column(Float, nullable=False)
    status = Column(String, default=StockStatus.IN_STOCK)
    predicted_need = Column(String, nullable=True)  # e.g., "Restock in 3d", "Healthy", "Order Now"
    category = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Insight(Base):
    __tablename__ = "insights"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    type = Column(String, nullable=False)  # positive, warning, info
    icon = Column(String, nullable=True)
    time_ago = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
