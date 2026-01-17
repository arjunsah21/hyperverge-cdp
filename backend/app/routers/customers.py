# Customers API endpoints with CDP fields

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional

from app.database import get_db
from app.models import Customer
from app.schemas import CustomerResponse, CustomerListResponse, CustomerCreate, CustomerUpdate

router = APIRouter()


def customer_to_response(customer: Customer) -> CustomerResponse:
    """Convert Customer model to response"""
    name = None
    if customer.first_name and customer.last_name:
        name = f"{customer.first_name} {customer.last_name}"
    elif customer.first_name:
        name = customer.first_name
    elif customer.last_name:
        name = customer.last_name
    
    return CustomerResponse(
        id=customer.id,
        email=customer.email,
        first_name=customer.first_name,
        last_name=customer.last_name,
        name=name,
        phone=customer.phone,
        avatar_url=customer.avatar_url,
        city=customer.city,
        state=customer.state,
        country=customer.country,
        zip_code=customer.zip_code,
        status=customer.status,
        total_orders=customer.total_orders,
        total_spend=customer.total_spend,
        lifetime_value=customer.lifetime_value,
        average_order_value=customer.average_order_value,
        first_order_date=customer.first_order_date,
        last_order_date=customer.last_order_date,
        email_opt_in=customer.email_opt_in,
        sms_opt_in=customer.sms_opt_in,
        source=customer.source,
        tags=customer.tags or [],
        created_at=customer.created_at,
        updated_at=customer.updated_at
    )


@router.get("", response_model=CustomerListResponse)
async def get_customers(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    status: Optional[str] = None,
    state: Optional[str] = None,
    source: Optional[str] = None,
    email_opt_in: Optional[bool] = None,
    sort_by: str = Query("total_spend", regex="^(total_spend|total_orders|created_at|last_order_date|lifetime_value)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    db: Session = Depends(get_db)
):
    """Get paginated list of customers with optional filters"""
    
    query = db.query(Customer)
    
    # Apply search filter
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Customer.first_name.ilike(search_term),
                Customer.last_name.ilike(search_term),
                Customer.email.ilike(search_term),
                Customer.phone.ilike(search_term)
            )
        )
    
    # Apply filters
    if status:
        query = query.filter(Customer.status == status)
    if state:
        query = query.filter(Customer.state == state)
    if source:
        query = query.filter(Customer.source == source)
    if email_opt_in is not None:
        query = query.filter(Customer.email_opt_in == email_opt_in)
    
    # Get total count before pagination
    total = query.count()
    
    # Apply sorting
    sort_column = getattr(Customer, sort_by)
    if sort_order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())
    
    # Apply pagination
    offset = (page - 1) * per_page
    customers = query.offset(offset).limit(per_page).all()
    
    return CustomerListResponse(
        customers=[customer_to_response(c) for c in customers],
        total=total,
        page=page,
        per_page=per_page
    )


@router.get("/states")
async def get_customer_states(db: Session = Depends(get_db)):
    """Get list of unique states for filtering"""
    states = db.query(Customer.state).distinct().filter(Customer.state.isnot(None)).all()
    return [s[0] for s in states if s[0]]


@router.get("/sources")
async def get_customer_sources(db: Session = Depends(get_db)):
    """Get list of unique sources for filtering"""
    sources = db.query(Customer.source).distinct().filter(Customer.source.isnot(None)).all()
    return [s[0] for s in sources if s[0]]


@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer(customer_id: int, db: Session = Depends(get_db)):
    """Get a single customer by ID"""
    
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    return customer_to_response(customer)


@router.get("/{customer_id}/details")
async def get_customer_details(customer_id: int, db: Session = Depends(get_db)):
    """Get detailed customer data with orders and insights"""
    from app.models import Order, OrderItem, Product
    from sqlalchemy import func, desc
    
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Get customer orders
    orders = db.query(Order).filter(Order.customer_id == customer_id).order_by(desc(Order.date)).all()
    
    # Get order items for each order
    orders_data = []
    for order in orders:
        items = db.query(
            OrderItem.quantity,
            OrderItem.price_at_purchase,
            Product.name.label('product_name'),
            Product.image_url
        ).join(Product).filter(OrderItem.order_id == order.id).all()
        
        orders_data.append({
            "id": order.id,
            "order_id": order.order_id,
            "date": order.date.isoformat() if order.date else None,
            "status": order.status,
            "total_amount": order.total_amount,
            "items": [
                {
                    "product_name": item.product_name,
                    "quantity": item.quantity,
                    "price": item.price_at_purchase,
                    "image_url": item.image_url
                }
                for item in items
            ]
        })
    
    # Customer insights
    insights = {}
    
    # 1. Top purchased products by quantity
    top_products_by_qty = db.query(
        Product.name,
        func.sum(OrderItem.quantity).label('total_qty')
    ).join(OrderItem).join(Order).filter(
        Order.customer_id == customer_id
    ).group_by(Product.name).order_by(desc(func.sum(OrderItem.quantity))).limit(3).all()
    
    insights['top_products_by_quantity'] = [
        {"name": p.name, "quantity": int(p.total_qty)}
        for p in top_products_by_qty
    ]
    
    # 2. Top purchased products by value
    top_products_by_value = db.query(
        Product.name,
        func.sum(OrderItem.quantity * OrderItem.price_at_purchase).label('total_value')
    ).join(OrderItem).join(Order).filter(
        Order.customer_id == customer_id
    ).group_by(Product.name).order_by(desc(func.sum(OrderItem.quantity * OrderItem.price_at_purchase))).limit(3).all()
    
    insights['top_products_by_value'] = [
        {"name": p.name, "value": round(float(p.total_value), 2)}
        for p in top_products_by_value
    ]
    
    # 3. Order count by status
    order_status_counts = db.query(
        Order.status,
        func.count(Order.id).label('count')
    ).filter(Order.customer_id == customer_id).group_by(Order.status).all()
    
    insights['order_status_breakdown'] = {
        status: count for status, count in order_status_counts
    }
    
    # 4. Monthly spending trend (last 6 months)
    from datetime import datetime, timedelta
    six_months_ago = datetime.utcnow() - timedelta(days=180)
    
    # Use PostgreSQL to_char instead of SQLite strftime
    monthly_spending = db.query(
        func.to_char(Order.date, 'YYYY-MM').label('month'),
        func.sum(Order.total_amount).label('total')
    ).filter(
        Order.customer_id == customer_id,
        Order.date >= six_months_ago
    ).group_by(func.to_char(Order.date, 'YYYY-MM')).order_by('month').all()
    
    insights['monthly_spending'] = [
        {"month": m.month, "amount": round(float(m.total), 2)}
        for m in monthly_spending
    ]
    
    # 5. Customer engagement metrics
    insights['engagement'] = {
        "days_since_first_order": (datetime.utcnow() - customer.first_order_date).days if customer.first_order_date else None,
        "days_since_last_order": (datetime.utcnow() - customer.last_order_date).days if customer.last_order_date else None,
        "order_frequency": round(customer.total_orders / max((datetime.utcnow() - customer.created_at).days / 30, 1), 2) if customer.total_orders else 0,
        "email_engaged": customer.email_opt_in,
        "sms_engaged": customer.sms_opt_in
    }
    
    # 6. Customer tier based on spending
    if customer.total_spend >= 50000:
        tier = "Diamond"
    elif customer.total_spend >= 20000:
        tier = "Platinum"
    elif customer.total_spend >= 5000:
        tier = "Gold"
    elif customer.total_spend >= 1000:
        tier = "Silver"
    else:
        tier = "Bronze"
    
    insights['tier'] = tier
    
    return {
        "customer": customer_to_response(customer),
        "orders": orders_data,
        "insights": insights
    }


@router.post("", response_model=CustomerResponse)
async def create_customer(customer_data: CustomerCreate, db: Session = Depends(get_db)):
    """Create a new customer"""
    
    # Check if email already exists
    existing = db.query(Customer).filter(Customer.email == customer_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    db_customer = Customer(
        email=customer_data.email,
        first_name=customer_data.first_name,
        last_name=customer_data.last_name,
        phone=customer_data.phone,
        avatar_url=customer_data.avatar_url,
        address_line1=customer_data.address_line1,
        address_line2=customer_data.address_line2,
        city=customer_data.city,
        state=customer_data.state,
        country=customer_data.country,
        zip_code=customer_data.zip_code,
        status=customer_data.status.value,
        email_opt_in=customer_data.email_opt_in,
        sms_opt_in=customer_data.sms_opt_in,
        source=customer_data.source,
        tags=customer_data.tags,
        notes=customer_data.notes
    )
    
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    
    return customer_to_response(db_customer)


@router.put("/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: int,
    customer_data: CustomerUpdate,
    db: Session = Depends(get_db)
):
    """Update a customer"""
    
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Update fields if provided
    update_fields = customer_data.model_dump(exclude_unset=True)
    for field, value in update_fields.items():
        if value is not None:
            if field == "status" and hasattr(value, 'value'):
                setattr(customer, field, value.value)
            else:
                setattr(customer, field, value)
    
    db.commit()
    db.refresh(customer)
    
    return customer_to_response(customer)


@router.delete("/{customer_id}")
async def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    """Delete a customer"""
    
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    db.delete(customer)
    db.commit()
    
    return {"message": "Customer deleted successfully"}
