# Flows API endpoints

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models import Flow, FlowStep, Segment
from app.schemas import (
    FlowCreate, FlowUpdate, FlowResponse, FlowListResponse,
    FlowStepCreate, FlowStepUpdate, FlowStepResponse
)

router = APIRouter()


def flow_to_response(flow: Flow) -> FlowResponse:
    """Convert Flow model to response"""
    return FlowResponse(
        id=flow.id,
        name=flow.name,
        description=flow.description,
        trigger_type=flow.trigger_type,
        segment_id=flow.segment_id,
        status=flow.status,
        total_sent=flow.total_sent,
        total_opened=flow.total_opened,
        total_clicked=flow.total_clicked,
        steps=[
            FlowStepResponse(
                id=s.id,
                flow_id=s.flow_id,
                order=s.order,
                step_type=s.step_type,
                subject=s.subject,
                content=s.content,
                delay_days=s.delay_days,
                delay_hours=s.delay_hours,
                sent_count=s.sent_count,
                open_count=s.open_count,
                click_count=s.click_count,
                created_at=s.created_at
            ) for s in sorted(flow.steps, key=lambda x: x.order)
        ],
        created_at=flow.created_at,
        updated_at=flow.updated_at
    )


@router.get("", response_model=FlowListResponse)
async def get_flows(
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all flows"""
    
    query = db.query(Flow)
    
    if status:
        query = query.filter(Flow.status == status)
    
    flows = query.order_by(Flow.created_at.desc()).all()
    
    return FlowListResponse(
        flows=[flow_to_response(f) for f in flows],
        total=len(flows)
    )


@router.get("/{flow_id}", response_model=FlowResponse)
async def get_flow(flow_id: int, db: Session = Depends(get_db)):
    """Get a single flow by ID"""
    
    flow = db.query(Flow).filter(Flow.id == flow_id).first()
    
    if not flow:
        raise HTTPException(status_code=404, detail="Flow not found")
    
    return flow_to_response(flow)


@router.post("", response_model=FlowResponse)
async def create_flow(flow_data: FlowCreate, db: Session = Depends(get_db)):
    """Create a new flow with optional steps"""
    
    # Validate segment if provided
    if flow_data.segment_id:
        segment = db.query(Segment).filter(Segment.id == flow_data.segment_id).first()
        if not segment:
            raise HTTPException(status_code=400, detail="Invalid segment_id")
    
    flow = Flow(
        name=flow_data.name,
        description=flow_data.description,
        trigger_type=flow_data.trigger_type.value,
        segment_id=flow_data.segment_id,
        status=flow_data.status.value
    )
    
    db.add(flow)
    db.flush()
    
    # Add steps
    for step_data in flow_data.steps:
        step = FlowStep(
            flow_id=flow.id,
            order=step_data.order,
            step_type=step_data.step_type,
            subject=step_data.subject,
            content=step_data.content,
            delay_days=step_data.delay_days,
            delay_hours=step_data.delay_hours
        )
        db.add(step)
    
    db.commit()
    db.refresh(flow)
    
    return flow_to_response(flow)


@router.put("/{flow_id}", response_model=FlowResponse)
async def update_flow(
    flow_id: int,
    flow_data: FlowUpdate,
    db: Session = Depends(get_db)
):
    """Update a flow"""
    
    flow = db.query(Flow).filter(Flow.id == flow_id).first()
    
    if not flow:
        raise HTTPException(status_code=404, detail="Flow not found")
    
    # Update fields
    if flow_data.name is not None:
        flow.name = flow_data.name
    if flow_data.description is not None:
        flow.description = flow_data.description
    if flow_data.trigger_type is not None:
        flow.trigger_type = flow_data.trigger_type.value
    if flow_data.segment_id is not None:
        # Validate segment
        segment = db.query(Segment).filter(Segment.id == flow_data.segment_id).first()
        if not segment:
            raise HTTPException(status_code=400, detail="Invalid segment_id")
        flow.segment_id = flow_data.segment_id
    if flow_data.status is not None:
        flow.status = flow_data.status.value
    
    db.commit()
    db.refresh(flow)
    
    return flow_to_response(flow)


@router.delete("/{flow_id}")
async def delete_flow(flow_id: int, db: Session = Depends(get_db)):
    """Delete a flow"""
    
    flow = db.query(Flow).filter(Flow.id == flow_id).first()
    
    if not flow:
        raise HTTPException(status_code=404, detail="Flow not found")
    
    db.delete(flow)
    db.commit()
    
    return {"message": "Flow deleted successfully"}


# ============== FLOW STEPS ==============

@router.post("/{flow_id}/steps", response_model=FlowStepResponse)
async def add_flow_step(
    flow_id: int,
    step_data: FlowStepCreate,
    db: Session = Depends(get_db)
):
    """Add a step to a flow"""
    
    flow = db.query(Flow).filter(Flow.id == flow_id).first()
    
    if not flow:
        raise HTTPException(status_code=404, detail="Flow not found")
    
    step = FlowStep(
        flow_id=flow_id,
        order=step_data.order,
        step_type=step_data.step_type,
        subject=step_data.subject,
        content=step_data.content,
        delay_days=step_data.delay_days,
        delay_hours=step_data.delay_hours
    )
    
    db.add(step)
    db.commit()
    db.refresh(step)
    
    return FlowStepResponse(
        id=step.id,
        flow_id=step.flow_id,
        order=step.order,
        step_type=step.step_type,
        subject=step.subject,
        content=step.content,
        delay_days=step.delay_days,
        delay_hours=step.delay_hours,
        sent_count=step.sent_count,
        open_count=step.open_count,
        click_count=step.click_count,
        created_at=step.created_at
    )


@router.put("/{flow_id}/steps/{step_id}", response_model=FlowStepResponse)
async def update_flow_step(
    flow_id: int,
    step_id: int,
    step_data: FlowStepUpdate,
    db: Session = Depends(get_db)
):
    """Update a flow step"""
    
    step = db.query(FlowStep).filter(
        FlowStep.id == step_id,
        FlowStep.flow_id == flow_id
    ).first()
    
    if not step:
        raise HTTPException(status_code=404, detail="Step not found")
    
    if step_data.order is not None:
        step.order = step_data.order
    if step_data.step_type is not None:
        step.step_type = step_data.step_type
    if step_data.subject is not None:
        step.subject = step_data.subject
    if step_data.content is not None:
        step.content = step_data.content
    if step_data.delay_days is not None:
        step.delay_days = step_data.delay_days
    if step_data.delay_hours is not None:
        step.delay_hours = step_data.delay_hours
    
    db.commit()
    db.refresh(step)
    
    return FlowStepResponse(
        id=step.id,
        flow_id=step.flow_id,
        order=step.order,
        step_type=step.step_type,
        subject=step.subject,
        content=step.content,
        delay_days=step.delay_days,
        delay_hours=step.delay_hours,
        sent_count=step.sent_count,
        open_count=step.open_count,
        click_count=step.click_count,
        created_at=step.created_at
    )


@router.delete("/{flow_id}/steps/{step_id}")
async def delete_flow_step(
    flow_id: int,
    step_id: int,
    db: Session = Depends(get_db)
):
    """Delete a flow step"""
    
    step = db.query(FlowStep).filter(
        FlowStep.id == step_id,
        FlowStep.flow_id == flow_id
    ).first()
    
    if not step:
        raise HTTPException(status_code=404, detail="Step not found")
    
    db.delete(step)
    db.commit()
    
    return {"message": "Step deleted successfully"}
