# Segments API endpoints

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import Optional
from datetime import datetime, timedelta

from app.database import get_db
from app.models import Segment, SegmentRule, Customer
from app.schemas import (
    SegmentCreate, SegmentUpdate, SegmentResponse, SegmentListResponse,
    SegmentCustomersResponse, SegmentRuleResponse, CustomerResponse,
    AISegmentRequest, AISegmentResponse, SegmentLogicEnum
)
from app.services import ai_service

router = APIRouter()


def evaluate_rule(query, rule: SegmentRule):
    """Apply a single rule to the customer query"""
    field = rule.field
    operator = rule.operator
    value = rule.value
    
    # Map field names to Customer model attributes
    field_map = {
        "email": Customer.email,
        "first_name": Customer.first_name,
        "last_name": Customer.last_name,
        "phone": Customer.phone,
        "city": Customer.city,
        "state": Customer.state,
        "country": Customer.country,
        "zip_code": Customer.zip_code,
        "status": Customer.status,
        "total_orders": Customer.total_orders,
        "total_spend": Customer.total_spend,
        "lifetime_value": Customer.lifetime_value,
        "email_opt_in": Customer.email_opt_in,
        "sms_opt_in": Customer.sms_opt_in,
        "source": Customer.source,
        "last_order_date": Customer.last_order_date,
        "first_order_date": Customer.first_order_date,
        "created_at": Customer.created_at,
    }
    
    if field not in field_map:
        return query  # Skip unknown fields
    
    column = field_map[field]
    
    if operator == "equals":
        if value.lower() == "true":
            return query.filter(column == True)
        elif value.lower() == "false":
            return query.filter(column == False)
        return query.filter(column == value)
    
    elif operator == "not_equals":
        return query.filter(column != value)
    
    elif operator == "contains":
        return query.filter(column.ilike(f"%{value}%"))
    
    elif operator == "greater_than":
        try:
            numeric_value = float(value)
            return query.filter(column > numeric_value)
        except ValueError:
            return query
    
    elif operator == "less_than":
        try:
            numeric_value = float(value)
            return query.filter(column < numeric_value)
        except ValueError:
            return query
    
    elif operator == "within_days":
        try:
            days = int(value)
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            return query.filter(column >= cutoff_date)
        except ValueError:
            return query
    
    elif operator == "before_date":
        try:
            date_value = datetime.fromisoformat(value)
            return query.filter(column < date_value)
        except ValueError:
            return query
    
    return query


def get_segment_customers_query(db: Session, segment: Segment):
    """Build query for customers matching segment rules"""
    query = db.query(Customer)
    
    if not segment.rules:
        return query
    
    if segment.logic == "AND":
        # All rules must match
        for rule in segment.rules:
            query = evaluate_rule(query, rule)
    else:
        # OR logic - any rule can match
        conditions = []
        for rule in segment.rules:
            # Build individual conditions
            sub_query = db.query(Customer.id)
            sub_query = evaluate_rule(sub_query, rule)
            conditions.append(Customer.id.in_(sub_query.subquery()))
        
        if conditions:
            query = query.filter(or_(*conditions))
    
    return query


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


@router.get("", response_model=SegmentListResponse)
async def get_segments(db: Session = Depends(get_db)):
    """Get all segments with customer counts"""
    
    segments = db.query(Segment).order_by(Segment.created_at.desc()).all()
    
    # Update customer counts dynamically
    segment_responses = []
    for segment in segments:
        query = get_segment_customers_query(db, segment)
        customer_count = query.count()
        
        segment_responses.append(SegmentResponse(
            id=segment.id,
            name=segment.name,
            description=segment.description,
            logic=segment.logic,
            is_dynamic=segment.is_dynamic,
            customer_count=customer_count,
            rules=[
                SegmentRuleResponse(
                    id=r.id,
                    segment_id=r.segment_id,
                    field=r.field,
                    operator=r.operator,
                    value=r.value,
                    created_at=r.created_at
                ) for r in segment.rules
            ],
            created_at=segment.created_at,
            updated_at=segment.updated_at
        ))
    
    return SegmentListResponse(
        segments=segment_responses,
        total=len(segment_responses)
    )


@router.get("/{segment_id}", response_model=SegmentResponse)
async def get_segment(segment_id: int, db: Session = Depends(get_db)):
    """Get a single segment by ID"""
    
    segment = db.query(Segment).filter(Segment.id == segment_id).first()
    
    if not segment:
        raise HTTPException(status_code=404, detail="Segment not found")
    
    query = get_segment_customers_query(db, segment)
    customer_count = query.count()
    
    return SegmentResponse(
        id=segment.id,
        name=segment.name,
        description=segment.description,
        logic=segment.logic,
        is_dynamic=segment.is_dynamic,
        customer_count=customer_count,
        rules=[
            SegmentRuleResponse(
                id=r.id,
                segment_id=r.segment_id,
                field=r.field,
                operator=r.operator,
                value=r.value,
                created_at=r.created_at
            ) for r in segment.rules
        ],
        created_at=segment.created_at,
        updated_at=segment.updated_at
    )


@router.get("/{segment_id}/customers", response_model=SegmentCustomersResponse)
async def get_segment_customers(
    segment_id: int,
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get customers matching a segment"""
    
    segment = db.query(Segment).filter(Segment.id == segment_id).first()
    
    if not segment:
        raise HTTPException(status_code=404, detail="Segment not found")
    
    query = get_segment_customers_query(db, segment)
    total = query.count()
    
    offset = (page - 1) * per_page
    customers = query.offset(offset).limit(per_page).all()
    
    segment_response = SegmentResponse(
        id=segment.id,
        name=segment.name,
        description=segment.description,
        logic=segment.logic,
        is_dynamic=segment.is_dynamic,
        customer_count=total,
        rules=[
            SegmentRuleResponse(
                id=r.id,
                segment_id=r.segment_id,
                field=r.field,
                operator=r.operator,
                value=r.value,
                created_at=r.created_at
            ) for r in segment.rules
        ],
        created_at=segment.created_at,
        updated_at=segment.updated_at
    )
    
    return SegmentCustomersResponse(
        segment=segment_response,
        customers=[customer_to_response(c) for c in customers],
        total=total,
        page=page,
        per_page=per_page
    )


@router.post("", response_model=SegmentResponse)
async def create_segment(segment_data: SegmentCreate, db: Session = Depends(get_db)):
    """Create a new segment with rules"""
    
    segment = Segment(
        name=segment_data.name,
        description=segment_data.description,
        logic=segment_data.logic.value,
        is_dynamic=segment_data.is_dynamic
    )
    
    db.add(segment)
    db.flush()
    
    # Add rules
    for rule_data in segment_data.rules:
        rule = SegmentRule(
            segment_id=segment.id,
            field=rule_data.field,
            operator=rule_data.operator,
            value=rule_data.value
        )
        db.add(rule)
    
    db.commit()
    db.refresh(segment)
    
    query = get_segment_customers_query(db, segment)
    customer_count = query.count()
    
    return SegmentResponse(
        id=segment.id,
        name=segment.name,
        description=segment.description,
        logic=segment.logic,
        is_dynamic=segment.is_dynamic,
        customer_count=customer_count,
        rules=[
            SegmentRuleResponse(
                id=r.id,
                segment_id=r.segment_id,
                field=r.field,
                operator=r.operator,
                value=r.value,
                created_at=r.created_at
            ) for r in segment.rules
        ],
        created_at=segment.created_at,
        updated_at=segment.updated_at
    )


@router.put("/{segment_id}", response_model=SegmentResponse)
async def update_segment(
    segment_id: int,
    segment_data: SegmentUpdate,
    db: Session = Depends(get_db)
):
    """Update a segment"""
    
    segment = db.query(Segment).filter(Segment.id == segment_id).first()
    
    if not segment:
        raise HTTPException(status_code=404, detail="Segment not found")
    
    # Update fields
    if segment_data.name is not None:
        segment.name = segment_data.name
    if segment_data.description is not None:
        segment.description = segment_data.description
    if segment_data.logic is not None:
        segment.logic = segment_data.logic.value
    if segment_data.is_dynamic is not None:
        segment.is_dynamic = segment_data.is_dynamic
    
    # Update rules if provided
    if segment_data.rules is not None:
        # Delete existing rules
        db.query(SegmentRule).filter(SegmentRule.segment_id == segment_id).delete()
        
        # Add new rules
        for rule_data in segment_data.rules:
            rule = SegmentRule(
                segment_id=segment.id,
                field=rule_data.field,
                operator=rule_data.operator,
                value=rule_data.value
            )
            db.add(rule)
    
    db.commit()
    db.refresh(segment)
    
    query = get_segment_customers_query(db, segment)
    customer_count = query.count()
    
    return SegmentResponse(
        id=segment.id,
        name=segment.name,
        description=segment.description,
        logic=segment.logic,
        is_dynamic=segment.is_dynamic,
        customer_count=customer_count,
        rules=[
            SegmentRuleResponse(
                id=r.id,
                segment_id=r.segment_id,
                field=r.field,
                operator=r.operator,
                value=r.value,
                created_at=r.created_at
            ) for r in segment.rules
        ],
        created_at=segment.created_at,
        updated_at=segment.updated_at
    )


@router.delete("/{segment_id}")
async def delete_segment(segment_id: int, db: Session = Depends(get_db)):
    """Delete a segment"""
    
    segment = db.query(Segment).filter(Segment.id == segment_id).first()
    
    if not segment:
        raise HTTPException(status_code=404, detail="Segment not found")
    
    db.delete(segment)
    db.commit()
    
    return {"message": "Segment deleted successfully"}
    
    
@router.post("/ai-generate", response_model=AISegmentResponse)
async def generate_segment_ai(request: AISegmentRequest):
    """Generate segment rules from natural language using AI"""
    
    # Call AI Service (Mocked or Real)
    generated_segment = ai_service.generate_segment_from_prompt(request.prompt)
    
    return generated_segment
