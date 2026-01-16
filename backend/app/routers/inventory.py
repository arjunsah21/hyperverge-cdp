# Inventory API endpoints

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import Optional

from app.database import get_db
from app.models import Product
from app.schemas import ProductResponse, ProductListResponse, InventoryStats

router = APIRouter()


@router.get("/stats", response_model=InventoryStats)
async def get_inventory_stats(db: Session = Depends(get_db)):
    """Get inventory overview statistics"""
    
    total_skus = db.query(Product).count()
    low_stock_alerts = db.query(Product).filter(Product.status == "LOW_STOCK").count()
    out_of_stock = db.query(Product).filter(Product.status == "OUT_OF_STOCK").count()
    inventory_value = db.query(func.sum(Product.price * Product.stock_level)).scalar() or 0
    
    return InventoryStats(
        total_skus=total_skus,
        skus_change=2.5,  # Simulated
        low_stock_alerts=low_stock_alerts,
        out_of_stock=out_of_stock,
        inventory_value=round(inventory_value, 2)
    )


@router.get("", response_model=ProductListResponse)
async def get_products(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    status: Optional[str] = None,
    category: Optional[str] = None,
    sort_by: str = Query("created_at", regex="^(created_at|price|stock_level|name)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    db: Session = Depends(get_db)
):
    """Get paginated list of products with optional filters"""
    
    query = db.query(Product)
    
    # Apply search filter
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Product.name.ilike(search_term),
                Product.sku.ilike(search_term)
            )
        )
    
    # Apply status filter
    if status:
        query = query.filter(Product.status == status)
    
    # Apply category filter
    if category:
        query = query.filter(Product.category == category)
    
    # Get total count before pagination
    total = query.count()
    
    # Apply sorting
    sort_column = getattr(Product, sort_by)
    if sort_order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())
    
    # Apply pagination
    offset = (page - 1) * per_page
    products = query.offset(offset).limit(per_page).all()
    
    return ProductListResponse(
        products=[
            ProductResponse(
                id=p.id,
                name=p.name,
                sku=p.sku,
                image_url=p.image_url,
                stock_level=p.stock_level,
                price=p.price,
                status=p.status,
                predicted_need=p.predicted_need,
                category=p.category,
                created_at=p.created_at
            )
            for p in products
        ],
        total=total,
        page=page,
        per_page=per_page
    )


@router.get("/categories")
async def get_categories(db: Session = Depends(get_db)):
    """Get list of unique product categories"""
    
    categories = db.query(Product.category).distinct().all()
    return {"categories": [c[0] for c in categories if c[0]]}


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: int, db: Session = Depends(get_db)):
    """Get a single product by ID"""
    
    product = db.query(Product).filter(Product.id == product_id).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return ProductResponse(
        id=product.id,
        name=product.name,
        sku=product.sku,
        image_url=product.image_url,
        stock_level=product.stock_level,
        price=product.price,
        status=product.status,
        predicted_need=product.predicted_need,
        category=product.category,
        created_at=product.created_at
    )
