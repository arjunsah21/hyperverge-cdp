# SQLAlchemy Models for Customer Data Platform

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.database import Base


# ============== ENUMS ==============

class CustomerStatus(str, enum.Enum):
    VIP = "VIP"
    ACTIVE = "ACTIVE"
    REGULAR = "REGULAR"
    NEW = "NEW"
    CHURNED = "CHURNED"


class OrderStatus(str, enum.Enum):
    PENDING = "Pending"
    SHIPPED = "Shipped"
    DELIVERED = "Delivered"
    CANCELLED = "Cancelled"


class StockStatus(str, enum.Enum):
    IN_STOCK = "IN_STOCK"
    LOW_STOCK = "LOW_STOCK"
    OUT_OF_STOCK = "OUT_OF_STOCK"


class SegmentLogic(str, enum.Enum):
    AND = "AND"
    OR = "OR"


class FlowStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    ARCHIVED = "archived"


class FlowTrigger(str, enum.Enum):
    SEGMENT = "segment"
    EVENT = "event"
    MANUAL = "manual"


# ============== CUSTOMER MODEL (Extended for CDP) ==============

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    
    # Basic Info
    email = Column(String, unique=True, nullable=False, index=True)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    
    # Address Information
    address_line1 = Column(String, nullable=True)
    address_line2 = Column(String, nullable=True)
    city = Column(String, nullable=True, index=True)
    state = Column(String, nullable=True, index=True)
    country = Column(String, nullable=True, default="USA")
    zip_code = Column(String, nullable=True)
    
    # Customer Status & Metrics
    status = Column(String, default=CustomerStatus.NEW, index=True)
    total_orders = Column(Integer, default=0)
    total_spend = Column(Float, default=0.0)
    lifetime_value = Column(Float, default=0.0)
    average_order_value = Column(Float, default=0.0)
    
    # Dates
    first_order_date = Column(DateTime, nullable=True)
    last_order_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Marketing
    email_opt_in = Column(Boolean, default=True)
    sms_opt_in = Column(Boolean, default=False)
    source = Column(String, nullable=True)  # organic, paid_search, social, referral, email
    
    # Custom Tags (stored as JSON array)
    tags = Column(JSON, default=list)
    
    # Notes
    notes = Column(Text, nullable=True)

    # Relationships
    orders = relationship("Order", back_populates="customer")


# ============== ORDER MODEL ==============

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String, unique=True, nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    date = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default=OrderStatus.PENDING)
    total_amount = Column(Float, nullable=False)
    shipping_address = Column(Text, nullable=True)
    
    customer = relationship("Customer", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


# ============== ORDER ITEM MODEL (for tracking product sales) ==============

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, default=1)
    price_at_purchase = Column(Float, nullable=False)
    
    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")


# ============== PRODUCT MODEL ==============

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    sku = Column(String, unique=True, nullable=False)
    image_url = Column(String, nullable=True)
    stock_level = Column(Integer, default=0)
    price = Column(Float, nullable=False)
    status = Column(String, default=StockStatus.IN_STOCK)
    predicted_need = Column(String, nullable=True)
    category = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship to track sales
    order_items = relationship("OrderItem", back_populates="product")


# ============== SEGMENT MODEL (CDP Feature) ==============

class Segment(Base):
    __tablename__ = "segments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    logic = Column(String, default=SegmentLogic.AND)  # AND/OR for combining rules
    is_dynamic = Column(Boolean, default=True)  # Auto-update based on rules
    customer_count = Column(Integer, default=0)  # Cached count
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    rules = relationship("SegmentRule", back_populates="segment", cascade="all, delete-orphan")


class SegmentRule(Base):
    __tablename__ = "segment_rules"

    id = Column(Integer, primary_key=True, index=True)
    segment_id = Column(Integer, ForeignKey("segments.id", ondelete="CASCADE"), nullable=False)
    
    field = Column(String, nullable=False)  # e.g., "state", "total_spend", "email"
    operator = Column(String, nullable=False)  # equals, not_equals, contains, greater_than, less_than, within_days
    value = Column(String, nullable=False)  # The comparison value
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    segment = relationship("Segment", back_populates="rules")


# ============== FLOW MODEL (Email Marketing) ==============

class Flow(Base):
    __tablename__ = "flows"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    trigger_type = Column(String, default=FlowTrigger.SEGMENT)  # segment, event, manual
    segment_id = Column(Integer, ForeignKey("segments.id"), nullable=True)
    status = Column(String, default=FlowStatus.DRAFT)
    
    # Metrics
    total_sent = Column(Integer, default=0)
    total_opened = Column(Integer, default=0)
    total_clicked = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    steps = relationship("FlowStep", back_populates="flow", cascade="all, delete-orphan", order_by="FlowStep.order")


class FlowStep(Base):
    __tablename__ = "flow_steps"

    id = Column(Integer, primary_key=True, index=True)
    flow_id = Column(Integer, ForeignKey("flows.id", ondelete="CASCADE"), nullable=False)
    order = Column(Integer, nullable=False)  # Step order in the flow
    
    # Step configuration
    step_type = Column(String, default="email")  # email, delay, condition
    subject = Column(String, nullable=True)  # Email subject
    content = Column(Text, nullable=True)  # Email body/template
    delay_days = Column(Integer, default=0)  # Days to wait before this step
    delay_hours = Column(Integer, default=0)  # Hours to wait
    
    # Metrics for this step
    sent_count = Column(Integer, default=0)
    open_count = Column(Integer, default=0)
    click_count = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    flow = relationship("Flow", back_populates="steps")


# ============== INSIGHT MODEL (Dashboard) ==============

class Insight(Base):
    __tablename__ = "insights"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    type = Column(String, nullable=False)  # positive, warning, info
    icon = Column(String, nullable=True)
    time_ago = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
