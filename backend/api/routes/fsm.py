from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from models.schemas import FSMModel, Transition, TransitionSource
from core.database import get_db, FSMRecord
from core.llm_parser import LLMParser
from core.fsm_builder import FSMBuilder

router = APIRouter()

@router.post("/{fsm_id}/suggest-transitions", response_model=List[Transition])
async def suggest_transitions(fsm_id: str, db: Session = Depends(get_db)):
    """Suggest missing transitions for the FSM."""
    
    # Get FSM from database
    record = db.query(FSMRecord).filter(FSMRecord.id == fsm_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="FSM not found")
    
    fsm = FSMModel(**record.fsm_data)
    
    # Get suggestions from LLM
    parser = LLMParser()
    suggestions = parser.suggest_missing_transitions(fsm.dict())
    
    return suggestions

@router.post("/{fsm_id}/accept-transition")
async def accept_transition(fsm_id: str, transition: Transition, db: Session = Depends(get_db)):
    """Accept a suggested transition and add it to the FSM."""
    
    # Get FSM from database
    record = db.query(FSMRecord).filter(FSMRecord.id == fsm_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="FSM not found")
    
    fsm = FSMModel(**record.fsm_data)
    
    # Add transition
    transition.source = TransitionSource.LLM_INFERRED
    fsm.transitions.append(transition)
    
    # Update states if new ones are introduced
    if transition.state not in fsm.states:
        fsm.states.append(transition.state)
    if transition.next_state not in fsm.states:
        fsm.states.append(transition.next_state)
    
    # Update metadata
    fsm.metadata["edge_count"] = len(fsm.transitions)
    fsm.metadata["node_count"] = len(fsm.states)
    
    # Save back to database
    record.fsm_data = fsm.dict()
    db.commit()
    
    return {"message": "Transition accepted", "fsm": fsm}

@router.post("/{fsm_id}/reject-transition")
async def reject_transition(fsm_id: str, transition: Transition, db: Session = Depends(get_db)):
    """Reject a suggested transition."""
    
    # Get FSM from database
    record = db.query(FSMRecord).filter(FSMRecord.id == fsm_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="FSM not found")
    
    fsm = FSMModel(**record.fsm_data)
    
    # Remove transition if it exists
    fsm.transitions = [t for t in fsm.transitions 
                      if not (t.state == transition.state and 
                             t.event == transition.event and 
                             t.guard == transition.guard)]
    
    # Update metadata
    fsm.metadata["edge_count"] = len(fsm.transitions)
    
    # Save back to database
    record.fsm_data = fsm.dict()
    db.commit()
    
    return {"message": "Transition rejected", "fsm": fsm}

@router.put("/{fsm_id}/transitions")
async def update_transitions(fsm_id: str, transitions: List[Transition], db: Session = Depends(get_db)):
    """Update all transitions for an FSM."""
    
    # Get FSM from database
    record = db.query(FSMRecord).filter(FSMRecord.id == fsm_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="FSM not found")
    
    fsm = FSMModel(**record.fsm_data)
    
    # Update transitions
    fsm.transitions = transitions
    
    # Rebuild states list
    builder = FSMBuilder()
    fsm.states = list(builder._extract_states(transitions))
    
    # Update metadata
    fsm.metadata["edge_count"] = len(fsm.transitions)
    fsm.metadata["node_count"] = len(fsm.states)
    
    # Save back to database
    record.fsm_data = fsm.dict()
    db.commit()
    
    return fsm 