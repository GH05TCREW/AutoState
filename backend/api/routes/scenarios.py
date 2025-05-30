from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from models.schemas import ScenarioSpec, FSMModel, Transition
from core.database import get_db, FSMRecord
from core.llm_parser import LLMParser
from core.fsm_builder import FSMBuilder

router = APIRouter()

@router.post("/parse", response_model=FSMModel)
async def parse_scenarios(spec: ScenarioSpec, db: Session = Depends(get_db)):
    """Parse natural language scenarios into an FSM."""
    
    try:
        # Initialize parser and builder
        parser = LLMParser()
        builder = FSMBuilder()
        
        # Parse scenarios to transitions
        transitions = parser.parse_scenarios(spec.scenarios)
        
        if not transitions:
            raise HTTPException(status_code=400, detail="Failed to parse scenarios into transitions")
        
        # Build FSM
        fsm = builder.build_fsm(transitions, spec.title)
        
        # Save to database
        record = FSMRecord(
            id=fsm.id,
            title=fsm.title,
            scenarios=spec.scenarios,
            fsm_data=fsm.dict()
        )
        db.add(record)
        db.commit()
        
        return fsm
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{fsm_id}", response_model=FSMModel)
async def get_fsm(fsm_id: str, db: Session = Depends(get_db)):
    """Get FSM by ID."""
    
    record = db.query(FSMRecord).filter(FSMRecord.id == fsm_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="FSM not found")
    
    return FSMModel(**record.fsm_data)

@router.get("/", response_model=List[dict])
async def list_fsms(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """List all FSMs."""
    
    records = db.query(FSMRecord).offset(skip).limit(limit).all()
    return [{"id": r.id, "title": r.title, "created_at": r.created_at} for r in records]

@router.delete("/{fsm_id}")
async def delete_fsm(fsm_id: str, db: Session = Depends(get_db)):
    """Delete FSM by ID."""
    
    record = db.query(FSMRecord).filter(FSMRecord.id == fsm_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="FSM not found")
    
    db.delete(record)
    db.commit()
    
    return {"message": "FSM deleted successfully"} 