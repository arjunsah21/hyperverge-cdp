# Customers API endpoints

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional

from app.database import get_db
from app.models import Customer
from app.schemas import CustomerResponse, CustomerListResponse, CustomerCreate

router = APIRouter()


@router.get("", response_model=CustomerListResponse)
async def get_customers(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    status: Optional[str] = None,
    sort_by: str = Query("total_spend", regex="^(total_spend|total_orders|name|created_at)$"),
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
                Customer.name.ilike(search_term),
                Customer.email.ilike(search_term)
            )
        )
    
    # Apply status filter
    if status:
        query = query.filter(Customer.status == status)
    
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
        customers=[
            CustomerResponse(
                id=c.id,
                name=c.name,
                email=c.email,
                avatar_url=c.avatar_url,
                status=c.status,
                total_orders=c.total_orders,
                total_spend=c.total_spend,
                created_at=c.created_at
            )
            for c in customers
        ],
        total=total,
        page=page,
        per_page=per_page
    )


@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer(customer_id: int, db: Session = Depends(get_db)):
    """Get a single customer by ID"""
    
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    return CustomerResponse(
        id=customer.id,
        name=customer.name,
        email=customer.email,
        avatar_url=customer.avatar_url,
        status=customer.status,
        total_orders=customer.total_orders,
        total_spend=customer.total_spend,
        created_at=customer.created_at
    )


@router.post("", response_model=CustomerResponse)
async def create_customer(customer: CustomerCreate, db: Session = Depends(get_db)):
    """Create a new customer"""
    
    # Check if email already exists
    existing = db.query(Customer).filter(Customer.email == customer.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    db_customer = Customer(
        name=customer.name,
        email=customer.email,
        avatar_url=customer.avatar_url,
        status=customer.status.value
    )
    
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    
    return CustomerResponse(
        id=db_customer.id,
        name=db_customer.name,
        email=db_customer.email,
        avatar_url=db_customer.avatar_url,
        status=db_customer.status,
        total_orders=db_customer.total_orders,
        total_spend=db_customer.total_spend,
        created_at=db_customer.created_at
    )
