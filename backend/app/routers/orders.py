# Orders API endpoints

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional

from app.database import get_db
from app.models import Order, Customer
from app.schemas import OrderResponse, OrderListResponse

router = APIRouter()


def get_initials(name: str) -> str:
    """Get initials from a name"""
    parts = name.split()
    if len(parts) >= 2:
        return f"{parts[0][0]}{parts[-1][0]}".upper()
    elif len(parts) == 1:
        return parts[0][0:2].upper()
    return "??"


@router.get("", response_model=OrderListResponse)
async def get_orders(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    status: Optional[str] = None,
    sort_by: str = Query("date", regex="^(date|total_amount|order_id)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    db: Session = Depends(get_db)
):
    """Get paginated list of orders with optional filters"""
    
    query = db.query(Order).join(Customer)
    
    # Apply search filter
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Order.order_id.ilike(search_term),
                Customer.name.ilike(search_term)
            )
        )
    
    # Apply status filter
    if status:
        query = query.filter(Order.status == status)
    
    # Get total count before pagination
    total = query.count()
    
    # Apply sorting
    sort_column = getattr(Order, sort_by)
    if sort_order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())
    
    # Apply pagination
    offset = (page - 1) * per_page
    orders = query.offset(offset).limit(per_page).all()
    
    return OrderListResponse(
        orders=[
            OrderResponse(
                id=o.id,
                order_id=o.order_id,
                customer_id=o.customer_id,
                customer_name=o.customer.name,
                customer_initials=get_initials(o.customer.name),
                date=o.date,
                status=o.status,
                total_amount=o.total_amount
            )
            for o in orders
        ],
        total=total,
        page=page,
        per_page=per_page
    )


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(order_id: int, db: Session = Depends(get_db)):
    """Get a single order by ID"""
    
    order = db.query(Order).join(Customer).filter(Order.id == order_id).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return OrderResponse(
        id=order.id,
        order_id=order.order_id,
        customer_id=order.customer_id,
        customer_name=order.customer.name,
        customer_initials=get_initials(order.customer.name),
        date=order.date,
        status=order.status,
        total_amount=order.total_amount
    )
