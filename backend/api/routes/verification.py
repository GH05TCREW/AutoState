from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from models.schemas import VerificationResult, FSMModel, SimulationRequest, SimulationStep
from core.database import get_db, FSMRecord
from core.fsm_builder import FSMBuilder
from typing import List

router = APIRouter()

@router.get("/{fsm_id}/verify", response_model=VerificationResult)
async def verify_fsm(fsm_id: str, db: Session = Depends(get_db)):
    """Verify FSM for determinism, completeness, and safety."""
    
    # Get FSM from database
    record = db.query(FSMRecord).filter(FSMRecord.id == fsm_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="FSM not found")
    
    fsm = FSMModel(**record.fsm_data)
    
    # Perform verification
    builder = FSMBuilder()
    result = builder.verify_fsm(fsm)
    
    return result

@router.post("/{fsm_id}/simulate", response_model=List[SimulationStep])
async def simulate_fsm(fsm_id: str, request: SimulationRequest, db: Session = Depends(get_db)):
    """Simulate FSM execution with given event sequence."""
    
    # Get FSM from database
    record = db.query(FSMRecord).filter(FSMRecord.id == fsm_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="FSM not found")
    
    fsm = FSMModel(**record.fsm_data)
    
    # Build transition lookup
    transitions_map = {}
    for t in fsm.transitions:
        key = (t.state, t.event)
        if key not in transitions_map:
            transitions_map[key] = []
        transitions_map[key].append(t)
    
    # Simulate
    current_state = request.initial_state or fsm.initial_state
    steps = []
    
    for event in request.events:
        key = (current_state, event)
        
        if key in transitions_map:
            # For now, take the first matching transition (ignoring guards)
            transition = transitions_map[key][0]
            
            step = SimulationStep(
                current_state=current_state,
                event=event,
                next_state=transition.next_state,
                action=transition.action,
                guard_evaluated=True if transition.guard else None
            )
            steps.append(step)
            
            current_state = transition.next_state
        else:
            # No valid transition
            step = SimulationStep(
                current_state=current_state,
                event=event,
                next_state=current_state,  # Stay in same state
                action="NO_TRANSITION",
                guard_evaluated=False
            )
            steps.append(step)
    
    return steps

@router.get("/{fsm_id}/graph")
async def get_fsm_graph(fsm_id: str, db: Session = Depends(get_db)):
    """Get FSM graph data for visualization."""
    
    # Get FSM from database
    record = db.query(FSMRecord).filter(FSMRecord.id == fsm_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="FSM not found")
    
    fsm = FSMModel(**record.fsm_data)
    
    # Build graph data for visualization
    nodes = []
    edges = []
    
    # Create nodes
    for state in fsm.states:
        nodes.append({
            "id": state,
            "label": state,
            "color": "#3498db" if state == fsm.initial_state else "#95a5a6"
        })
    
    # Create edges
    for t in fsm.transitions:
        label = f"{t.event}"
        if t.guard:
            label += f"\n[{t.guard}]"
        label += f"\n/{t.action}"
        
        edges.append({
            "from": t.state,
            "to": t.next_state,
            "label": label,
            "color": "#27ae60" if t.source == "user" else "#f39c12"
        })
    
    return {
        "nodes": nodes,
        "edges": edges,
        "options": {
            "layout": {
                "hierarchical": {
                    "enabled": False
                }
            },
            "physics": {
                "enabled": True,
                "stabilization": {
                    "iterations": 100
                }
            }
        }
    } 