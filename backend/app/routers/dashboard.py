# Dashboard API endpoints with real CDP statistics from database

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from app.database import get_db
from app.models import Customer, Order, OrderItem, Product, Segment, Flow
from app.schemas import DashboardStats

router = APIRouter()


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(db: Session = Depends(get_db)):
    """Get dashboard overview statistics calculated from real database data"""
    
    # Time ranges
    now = datetime.utcnow()
    thirty_days_ago = now - timedelta(days=30)
    sixty_days_ago = now - timedelta(days=60)
    
    # Customer stats
    total_customers = db.query(Customer).count()
    
    # Customers created before 30 days ago (existing customers last month)
    customers_last_month = db.query(Customer).filter(Customer.created_at < thirty_days_ago).count()
    new_customers_this_month = total_customers - customers_last_month
    customers_change = round((new_customers_this_month / max(customers_last_month, 1)) * 100, 1)
    
    # Revenue stats (sum of all orders in last 30 days)
    total_revenue = db.query(func.sum(Order.total_amount)).filter(
        Order.date >= thirty_days_ago,
        Order.status != "Cancelled"
    ).scalar() or 0
    
    # Previous 30 days revenue for change calculation
    prev_revenue = db.query(func.sum(Order.total_amount)).filter(
        Order.date >= sixty_days_ago,
        Order.date < thirty_days_ago,
        Order.status != "Cancelled"
    ).scalar() or 0
    
    revenue_change = round(((total_revenue - prev_revenue) / max(prev_revenue, 1)) * 100, 1) if prev_revenue > 0 else 0
    
    # Order stats for last 30 days
    total_orders = db.query(Order).filter(
        Order.date >= thirty_days_ago,
        Order.status != "Cancelled"
    ).count()
    average_order_value = round(total_revenue / max(total_orders, 1), 2)
    
    # Calculate AOV change
    prev_orders = db.query(Order).filter(
        Order.date >= sixty_days_ago,
        Order.date < thirty_days_ago,
        Order.status != "Cancelled"
    ).count()
    prev_aov = round(prev_revenue / max(prev_orders, 1), 2)
    aov_change = round(average_order_value - prev_aov, 2)
    
    # Customer retention (customers with more than 1 order)
    returning_customers = db.query(Customer).filter(Customer.total_orders > 1).count()
    new_customers = db.query(Customer).filter(Customer.total_orders <= 1).count()
    customer_retention = round((returning_customers / max(total_customers, 1)) * 100, 1)
    
    # Top selling product (calculated from actual OrderItems)
    top_product_result = db.query(
        Product.id,
        Product.name,
        Product.price,
        Product.image_url,
        func.sum(OrderItem.quantity).label('units_sold')
    ).join(
        OrderItem, OrderItem.product_id == Product.id
    ).join(
        Order, Order.id == OrderItem.order_id
    ).filter(
        Order.date >= thirty_days_ago,
        Order.status != "Cancelled"
    ).group_by(
        Product.id, Product.name, Product.price, Product.image_url
    ).order_by(
        func.sum(OrderItem.quantity).desc()
    ).first()
    
    if top_product_result:
        top_product = {
            "name": top_product_result.name,
            "units_sold": int(top_product_result.units_sold),
            "price": top_product_result.price,
            "image_url": top_product_result.image_url
        }
    else:
        # Fallback if no orders
        first_product = db.query(Product).first()
        top_product = {
            "name": first_product.name if first_product else "No products",
            "units_sold": 0,
            "price": first_product.price if first_product else 0,
            "image_url": first_product.image_url if first_product else None
        }
    
    # Top regions from customer states
    state_counts = db.query(
        Customer.state, 
        func.count(Customer.id).label('count')
    ).filter(
        Customer.state.isnot(None)
    ).group_by(Customer.state).order_by(func.count(Customer.id).desc()).limit(3).all()
    
    total_with_state = sum([s[1] for s in state_counts]) or 1
    top_regions = [
        {"name": state, "percentage": round((count / total_with_state) * 100)}
        for state, count in state_counts
    ]
    
    # Inventory stats
    total_skus = db.query(Product).count()
    low_stock_alerts = db.query(Product).filter(Product.status == "LOW_STOCK").count()
    out_of_stock = db.query(Product).filter(Product.status == "OUT_OF_STOCK").count()
    inventory_value = db.query(func.sum(Product.price * Product.stock_level)).scalar() or 0
    
    # CDP specific stats
    total_segments = db.query(Segment).count()
    active_flows = db.query(Flow).filter(Flow.status == "active").count()
    
    # Email opt-in rate
    opted_in = db.query(Customer).filter(Customer.email_opt_in == True).count()
    email_opt_in_rate = round((opted_in / max(total_customers, 1)) * 100, 1)
    
    return DashboardStats(
        total_customers=total_customers,
        customers_change=customers_change,
        customers_last_month=customers_last_month,
        total_revenue=round(total_revenue, 2),
        revenue_change=revenue_change,
        total_orders=total_orders,
        average_order_value=average_order_value,
        aov_change=aov_change,
        customer_retention=customer_retention,
        returning_customers=returning_customers,
        new_customers=new_customers,
        top_product=top_product,
        top_regions=top_regions,
        total_skus=total_skus,
        low_stock_alerts=low_stock_alerts,
        out_of_stock=out_of_stock,
        inventory_value=round(inventory_value, 2),
        total_segments=total_segments,
        active_flows=active_flows,
        email_opt_in_rate=email_opt_in_rate
    )
