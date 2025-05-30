from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from models.schemas import GenerationRequest, GeneratedCode, FSMModel
from core.database import get_db, FSMRecord
from core.code_generator import CodeGenerator

router = APIRouter()

@router.post("/generate", response_model=GeneratedCode)
async def generate_code(request: GenerationRequest, db: Session = Depends(get_db)):
    """Generate code from FSM."""
    
    # Get FSM from database
    record = db.query(FSMRecord).filter(FSMRecord.id == request.fsm_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="FSM not found")
    
    fsm = FSMModel(**record.fsm_data)
    
    # Generate code
    generator = CodeGenerator()
    try:
        generated = generator.generate_code(fsm, request.template, request.options or {})
        return generated
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/download/{fsm_id}/{template}")
async def download_code(fsm_id: str, template: str, db: Session = Depends(get_db)):
    """Download generated code as file."""
    
    # Get FSM from database
    record = db.query(FSMRecord).filter(FSMRecord.id == fsm_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="FSM not found")
    
    fsm = FSMModel(**record.fsm_data)
    
    # Generate code
    generator = CodeGenerator()
    try:
        generated = generator.generate_code(fsm, template)
        
        # Return as file download
        return Response(
            content=generated.content,
            media_type="application/octet-stream",
            headers={
                "Content-Disposition": f"attachment; filename={generated.filename}"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/templates")
async def list_templates():
    """List available code generation templates."""
    
    return {
        "templates": [
            {
                "id": "python_class",
                "name": "Python Class",
                "description": "Object-oriented Python implementation with unit tests",
                "language": "python"
            },
            {
                "id": "yaml_policy",
                "name": "YAML Policy",
                "description": "YAML-based access control policy for RBAC systems",
                "language": "yaml"
            },
            {
                "id": "c_state_machine",
                "name": "C State Machine",
                "description": "C implementation suitable for embedded systems",
                "language": "c"
            }
        ]
    } 