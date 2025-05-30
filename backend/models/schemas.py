from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from enum import Enum

class TransitionSource(str, Enum):
    USER = "user"
    LLM_INFERRED = "llm_inferred"

class Transition(BaseModel):
    state: str = Field(..., description="Current state")
    event: str = Field(..., description="Triggering event")
    guard: Optional[str] = Field(None, description="Guard condition")
    action: str = Field(..., description="Action to perform")
    next_state: str = Field(..., description="Next state after transition")
    source: TransitionSource = Field(TransitionSource.USER, description="Source of the transition")

class ScenarioSpec(BaseModel):
    title: str = Field(..., description="Title of the scenario specification")
    language: Literal["en"] = Field("en", description="Language of scenarios")
    scenarios: List[str] = Field(..., description="List of scenario descriptions")

class FSMModel(BaseModel):
    id: Optional[str] = None
    title: str
    states: List[str]
    initial_state: str
    transitions: List[Transition]
    metadata: Optional[dict] = {}

class VerificationResult(BaseModel):
    is_deterministic: bool
    is_complete: bool
    unreachable_states: List[str]
    missing_transitions: List[dict]
    warnings: List[str]
    errors: List[str]

class GeneratedCode(BaseModel):
    language: str
    filename: str
    content: str
    
class GenerationRequest(BaseModel):
    fsm_id: str
    template: Literal["python_class", "yaml_policy", "c_state_machine"]
    options: Optional[dict] = {}

class SimulationStep(BaseModel):
    current_state: str
    event: str
    next_state: str
    action: str
    guard_evaluated: Optional[bool] = None

class SimulationRequest(BaseModel):
    fsm_id: str
    events: List[str]
    initial_state: Optional[str] = None 