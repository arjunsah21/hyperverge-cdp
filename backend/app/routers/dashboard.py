# Dashboard API endpoints

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import Customer, Order, Product, Insight
from app.schemas import DashboardStats, InsightListResponse, InsightResponse

router = APIRouter()


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(db: Session = Depends(get_db)):
    """Get dashboard overview statistics"""
    
    # Customer stats
    total_customers = db.query(Customer).count()
    customers_last_month = int(total_customers * 0.91)  # Simulated previous month
    customers_change = round(((total_customers - customers_last_month) / customers_last_month) * 100, 1) if customers_last_month > 0 else 0
    
    # Revenue stats
    total_revenue = db.query(func.sum(Order.total_amount)).scalar() or 0
    revenue_change = 18.0  # Simulated change percentage
    
    # Order stats
    total_orders = db.query(Order).count()
    average_order_value = round(total_revenue / total_orders, 2) if total_orders > 0 else 0
    aov_change = 4.50  # Simulated AOV change
    
    # Customer retention (simulated)
    returning_customers = int(total_customers * 0.68)
    new_customers = total_customers - returning_customers
    customer_retention = 68.0
    
    # Top selling product (simulated based on products)
    top_product_data = db.query(Product).order_by(Product.price.desc()).first()
    top_product = {
        "name": top_product_data.name if top_product_data else "Hyper Buds Pro",
        "units_sold": 2480,
        "price": top_product_data.price if top_product_data else 199.00,
        "image_url": top_product_data.image_url if top_product_data else None
    }
    
    # Top regions (simulated)
    top_regions = [
        {"name": "United States", "percentage": 65},
        {"name": "Canada", "percentage": 22},
        {"name": "Mexico", "percentage": 13}
    ]
    
    # Inventory stats
    total_skus = db.query(Product).count()
    low_stock_alerts = db.query(Product).filter(Product.status == "LOW_STOCK").count()
    out_of_stock = db.query(Product).filter(Product.status == "OUT_OF_STOCK").count()
    inventory_value = db.query(func.sum(Product.price * Product.stock_level)).scalar() or 0
    
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
        inventory_value=round(inventory_value, 2)
    )


@router.get("/insights", response_model=InsightListResponse)
async def get_insights(db: Session = Depends(get_db)):
    """Get intelligence feed insights"""
    
    insights = db.query(Insight).order_by(Insight.created_at.desc()).all()
    
    return InsightListResponse(
        insights=[
            InsightResponse(
                id=insight.id,
                title=insight.title,
                description=insight.description,
                type=insight.type,
                icon=insight.icon,
                time_ago=insight.time_ago
            )
            for insight in insights
        ]
    )
