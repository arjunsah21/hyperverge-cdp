# Inventory API endpoints

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import Optional

from app.database import get_db
from app.models import Product
from app.schemas import ProductResponse, ProductListResponse, InventoryStats, ProductCreate, ProductUpdate

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
    per_page: int = Query(10, ge=1, le=10000),
    search: Optional[str] = None,
    status: Optional[str] = None,
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    predicted_need: Optional[str] = None,
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
        
    # Apply price filters
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)
        
    # Apply predicted need filter
    if predicted_need:
        if predicted_need == "Order Now":
            query = query.filter(Product.stock_level < 20)
        elif predicted_need == "Restock Soon":
            query = query.filter(Product.stock_level >= 20, Product.stock_level <= 50)
        elif predicted_need == "Healthy":
            query = query.filter(Product.stock_level > 50)
        else:
            # Fallback to direct match if it's some other string (legacy)
            query = query.filter(Product.predicted_need == predicted_need)
    
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
    
    # Helper to calculate predicted need dynamically
    def get_predicted_need(stock):
        if stock < 20:
            return "Order Now"
        if stock <= 50:
            return "Restock Soon"
        return "Healthy"
    
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
                predicted_need=get_predicted_need(p.stock_level),
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
        
    # Helper to calculate predicted need dynamically
    def get_predicted_need(stock):
        if stock < 20:
            return "Order Now"
        if stock <= 50:
            return "Restock Soon"
        return "Healthy"
    
    return ProductResponse(
        id=product.id,
        name=product.name,
        sku=product.sku,
        image_url=product.image_url,
        stock_level=product.stock_level,
        price=product.price,
        status=product.status,
        predicted_need=get_predicted_need(product.stock_level),
        category=product.category,
        created_at=product.created_at
    )


@router.post("", response_model=ProductResponse)
async def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    """Create a new product"""
    
    # Check if SKU already exists
    if db.query(Product).filter(Product.sku == product.sku).first():
        raise HTTPException(status_code=400, detail="Product with this SKU already exists")
    
    db_product = Product(**product.dict())
    
    # Auto-calculate predicted need based on correct logic
    if db_product.stock_level < 20:
        db_product.predicted_need = "Order Now"
    elif db_product.stock_level <= 50:
        db_product.predicted_need = "Restock Soon"
    else:
        db_product.predicted_need = "Healthy"
        
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    
    return db_product


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(product_id: int, product_update: ProductUpdate, db: Session = Depends(get_db)):
    """Update an existing product"""
    
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    # Check SKU uniqueness if being updated
    if product_update.sku and product_update.sku != db_product.sku:
        if db.query(Product).filter(Product.sku == product_update.sku).first():
            raise HTTPException(status_code=400, detail="Product with this SKU already exists")
    
    # Update fields
    update_data = product_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_product, key, value)
        
    # Recalculate predicted need if stock level changed
    if 'stock_level' in update_data:
        if db_product.stock_level < 20:
            db_product.predicted_need = "Order Now"
        elif db_product.stock_level <= 50:
            db_product.predicted_need = "Restock Soon"
        else:
            db_product.predicted_need = "Healthy"
    
    db.commit()
    db.refresh(db_product)
    
    return db_product


@router.delete("/{product_id}")
async def delete_product(product_id: int, db: Session = Depends(get_db)):
    """Delete a product"""
    
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    db.delete(db_product)
    db.commit()
    
    return {"message": "Product deleted successfully"}
