# Pydantic Schemas for CDP API

from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, List, Any
from enum import Enum


# ============== ENUMS ==============

class CustomerStatusEnum(str, Enum):
    VIP = "VIP"
    ACTIVE = "ACTIVE"
    REGULAR = "REGULAR"
    NEW = "NEW"
    CHURNED = "CHURNED"


class OrderStatusEnum(str, Enum):
    PENDING = "Pending"
    SHIPPED = "Shipped"
    DELIVERED = "Delivered"
    CANCELLED = "Cancelled"


class StockStatusEnum(str, Enum):
    IN_STOCK = "IN_STOCK"
    LOW_STOCK = "LOW_STOCK"
    OUT_OF_STOCK = "OUT_OF_STOCK"


class SegmentLogicEnum(str, Enum):
    AND = "AND"
    OR = "OR"


class FlowStatusEnum(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    ARCHIVED = "archived"


class FlowTriggerEnum(str, Enum):
    SEGMENT = "segment"
    EVENT = "event"
    MANUAL = "manual"


# ============== CUSTOMER SCHEMAS ==============

class CustomerBase(BaseModel):
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = "USA"
    zip_code: Optional[str] = None
    status: CustomerStatusEnum = CustomerStatusEnum.NEW
    email_opt_in: bool = True
    sms_opt_in: bool = False
    source: Optional[str] = None
    tags: List[str] = []
    notes: Optional[str] = None


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    zip_code: Optional[str] = None
    status: Optional[CustomerStatusEnum] = None
    email_opt_in: Optional[bool] = None
    sms_opt_in: Optional[bool] = None
    source: Optional[str] = None
    tags: Optional[List[str]] = None
    notes: Optional[str] = None


class CustomerResponse(BaseModel):
    id: int
    email: str
    first_name: Optional[str]
    last_name: Optional[str]
    name: Optional[str] = None  # Computed field
    phone: Optional[str]
    avatar_url: Optional[str]
    city: Optional[str]
    state: Optional[str]
    country: Optional[str]
    zip_code: Optional[str]
    status: str
    total_orders: int
    total_spend: float
    lifetime_value: float
    average_order_value: float
    first_order_date: Optional[datetime]
    last_order_date: Optional[datetime]
    email_opt_in: bool
    sms_opt_in: bool
    source: Optional[str]
    tags: List[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CustomerListResponse(BaseModel):
    customers: List[CustomerResponse]
    total: int
    page: int
    per_page: int


# ============== ORDER SCHEMAS ==============

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


# ============== PRODUCT SCHEMAS ==============

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


# ============== SEGMENT SCHEMAS ==============

class SegmentRuleBase(BaseModel):
    field: str  # e.g., "state", "total_spend", "email"
    operator: str  # equals, not_equals, contains, greater_than, less_than, within_days
    value: str


class SegmentRuleCreate(SegmentRuleBase):
    pass


class SegmentRuleResponse(SegmentRuleBase):
    id: int
    segment_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class SegmentBase(BaseModel):
    name: str
    description: Optional[str] = None
    logic: SegmentLogicEnum = SegmentLogicEnum.AND
    is_dynamic: bool = True


class SegmentCreate(SegmentBase):
    rules: List[SegmentRuleCreate] = []


class SegmentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    logic: Optional[SegmentLogicEnum] = None
    is_dynamic: Optional[bool] = None
    rules: Optional[List[SegmentRuleCreate]] = None


class SegmentResponse(SegmentBase):
    id: int
    customer_count: int
    rules: List[SegmentRuleResponse]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SegmentListResponse(BaseModel):
    segments: List[SegmentResponse]
    total: int


class SegmentCustomersResponse(BaseModel):
    segment: SegmentResponse
    customers: List[CustomerResponse]
    total: int
    page: int
    per_page: int


# ============== FLOW SCHEMAS ==============

class FlowStepBase(BaseModel):
    order: int
    step_type: str = "email"
    subject: Optional[str] = None
    content: Optional[str] = None
    delay_days: int = 0
    delay_hours: int = 0


class FlowStepCreate(FlowStepBase):
    pass


class FlowStepUpdate(BaseModel):
    order: Optional[int] = None
    step_type: Optional[str] = None
    subject: Optional[str] = None
    content: Optional[str] = None
    delay_days: Optional[int] = None
    delay_hours: Optional[int] = None


class FlowStepResponse(FlowStepBase):
    id: int
    flow_id: int
    sent_count: int
    open_count: int
    click_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class FlowBase(BaseModel):
    name: str
    description: Optional[str] = None
    trigger_type: FlowTriggerEnum = FlowTriggerEnum.SEGMENT
    segment_id: Optional[int] = None
    status: FlowStatusEnum = FlowStatusEnum.DRAFT


class FlowCreate(FlowBase):
    steps: List[FlowStepCreate] = []


class FlowUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    trigger_type: Optional[FlowTriggerEnum] = None
    segment_id: Optional[int] = None
    status: Optional[FlowStatusEnum] = None


class FlowResponse(FlowBase):
    id: int
    total_sent: int
    total_opened: int
    total_clicked: int
    steps: List[FlowStepResponse]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FlowListResponse(BaseModel):
    flows: List[FlowResponse]
    total: int


# ============== DASHBOARD SCHEMAS ==============

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
    # CDP stats
    total_segments: int
    active_flows: int
    email_opt_in_rate: float


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


class InventoryStats(BaseModel):
    total_skus: int
    skus_change: float
    low_stock_alerts: int
    out_of_stock: int
    inventory_value: float
