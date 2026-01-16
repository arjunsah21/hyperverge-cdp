# Orders API endpoints

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional

from app.database import get_db
from app.models import Order, Customer
from app.schemas import OrderResponse, OrderListResponse

router = APIRouter()


def get_customer_name(customer: Customer) -> str:
    """Get full name from customer"""
    if customer.first_name and customer.last_name:
        return f"{customer.first_name} {customer.last_name}"
    elif customer.first_name:
        return customer.first_name
    elif customer.last_name:
        return customer.last_name
    return customer.email.split('@')[0]


def get_initials(first_name: str = None, last_name: str = None) -> str:
    """Get initials from first and last name"""
    if first_name and last_name:
        return f"{first_name[0]}{last_name[0]}".upper()
    elif first_name:
        return first_name[0:2].upper()
    elif last_name:
        return last_name[0:2].upper()
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
                Customer.first_name.ilike(search_term),
                Customer.last_name.ilike(search_term),
                Customer.email.ilike(search_term)
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
                customer_name=get_customer_name(o.customer),
                customer_initials=get_initials(o.customer.first_name, o.customer.last_name),
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


@router.get("/{order_id}")
async def get_order_details(order_id: int, db: Session = Depends(get_db)):
    """Get detailed order by ID with items and customer info"""
    from app.models import OrderItem, Product
    
    order = db.query(Order).join(Customer).filter(Order.id == order_id).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Get order items with product details
    items = db.query(
        OrderItem.quantity,
        OrderItem.price_at_purchase,
        Product.id.label('product_id'),
        Product.name.label('product_name'),
        Product.image_url,
        Product.sku
    ).join(Product).filter(OrderItem.order_id == order.id).all()
    
    items_data = [
        {
            "product_id": item.product_id,
            "product_name": item.product_name,
            "sku": item.sku,
            "quantity": item.quantity,
            "price": item.price_at_purchase,
            "total": round(item.quantity * item.price_at_purchase, 2),
            "image_url": item.image_url
        }
        for item in items
    ]
    
    return {
        "id": order.id,
        "order_id": order.order_id,
        "date": order.date.isoformat() if order.date else None,
        "status": order.status,
        "total_amount": order.total_amount,
        "shipping_address": order.shipping_address,
        "items": items_data,
        "items_count": len(items_data),
        "customer": {
            "id": order.customer.id,
            "name": get_customer_name(order.customer),
            "email": order.customer.email,
            "phone": order.customer.phone,
            "avatar_url": order.customer.avatar_url,
            "status": order.customer.status,
            "initials": get_initials(order.customer.first_name, order.customer.last_name)
        }
    }
