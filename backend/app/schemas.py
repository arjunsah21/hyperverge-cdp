# Pydantic Schemas for API request/response validation

from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List
from enum import Enum


# Enums
class CustomerStatusEnum(str, Enum):
    VIP = "VIP"
    ACTIVE = "ACTIVE"
    REGULAR = "REGULAR"
    NEW = "NEW"


class OrderStatusEnum(str, Enum):
    PENDING = "Pending"
    SHIPPED = "Shipped"
    CANCELLED = "Cancelled"


class StockStatusEnum(str, Enum):
    IN_STOCK = "IN_STOCK"
    LOW_STOCK = "LOW_STOCK"
    OUT_OF_STOCK = "OUT_OF_STOCK"


# Customer Schemas
class CustomerBase(BaseModel):
    name: str
    email: str
    avatar_url: Optional[str] = None
    status: CustomerStatusEnum = CustomerStatusEnum.NEW


class CustomerCreate(CustomerBase):
    pass


class CustomerResponse(CustomerBase):
    id: int
    total_orders: int
    total_spend: float
    created_at: datetime

    class Config:
        from_attributes = True


class CustomerListResponse(BaseModel):
    customers: List[CustomerResponse]
    total: int
    page: int
    per_page: int


# Order Schemas
class OrderBase(BaseModel):
    order_id: str
    customer_id: int
    status: OrderStatusEnum = OrderStatusEnum.PENDING
    total_amount: float


class OrderCreate(OrderBase):
    pass


class OrderResponse(BaseModel):
    id: int
    order_id: str
    customer_id: int
    customer_name: str
    customer_initials: str
    date: datetime
    status: str
    total_amount: float

    class Config:
        from_attributes = True


class OrderListResponse(BaseModel):
    orders: List[OrderResponse]
    total: int
    page: int
    per_page: int


# Product/Inventory Schemas
class ProductBase(BaseModel):
    name: str
    sku: str
    image_url: Optional[str] = None
    stock_level: int
    price: float
    status: StockStatusEnum = StockStatusEnum.IN_STOCK
    predicted_need: Optional[str] = None
    category: Optional[str] = None


class ProductCreate(ProductBase):
    pass


class ProductResponse(ProductBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ProductListResponse(BaseModel):
    products: List[ProductResponse]
    total: int
    page: int
    per_page: int


# Dashboard Schemas
class DashboardStats(BaseModel):
    total_customers: int
    customers_change: float
    customers_last_month: int
    total_revenue: float
    revenue_change: float
    total_orders: int
    average_order_value: float
    aov_change: float
    customer_retention: float
    returning_customers: int
    new_customers: int
    top_product: dict
    top_regions: List[dict]
    total_skus: int
    low_stock_alerts: int
    out_of_stock: int
    inventory_value: float


class InsightResponse(BaseModel):
    id: int
    title: str
    description: str
    type: str
    icon: Optional[str]
    time_ago: str

    class Config:
        from_attributes = True


class InsightListResponse(BaseModel):
    insights: List[InsightResponse]


# Inventory Stats Schema
class InventoryStats(BaseModel):
    total_skus: int
    skus_change: float
    low_stock_alerts: int
    out_of_stock: int
    inventory_value: float
