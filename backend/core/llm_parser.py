import os
import json
from typing import List, Dict, Any
import openai
from openai import OpenAI
from models.schemas import Transition, TransitionSource

class LLMParser:
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
    def parse_scenarios(self, scenarios: List[str]) -> List[Transition]:
        """Parse natural language scenarios into FSM transitions using LLM."""
        
        prompt = self._create_parsing_prompt(scenarios)
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are a requirements parser that converts natural language scenarios into finite state machine transitions."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,
                response_format={ "type": "json_object" }
            )
            
            result = json.loads(response.choices[0].message.content)
            transitions = []
            
            for t in result.get("transitions", []):
                transition = Transition(
                    state=t["state"],
                    event=t["event"],
                    guard=t.get("guard"),
                    action=t["action"],
                    next_state=t["next_state"],
                    source=TransitionSource.USER
                )
                transitions.append(transition)
                
            return transitions
            
        except Exception as e:
            print(f"Error parsing scenarios: {e}")
            return []
    
    def suggest_missing_transitions(self, fsm_json: Dict[str, Any]) -> List[Transition]:
        """Suggest missing transitions to complete the FSM."""
        
        prompt = self._create_gap_filler_prompt(fsm_json)
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are an FSM expert that identifies missing transitions to make state machines complete and robust."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                response_format={ "type": "json_object" }
            )
            
            result = json.loads(response.choices[0].message.content)
            suggestions = []
            
            for t in result.get("suggestions", []):
                transition = Transition(
                    state=t["state"],
                    event=t["event"],
                    guard=t.get("guard"),
                    action=t["action"],
                    next_state=t["next_state"],
                    source=TransitionSource.LLM_INFERRED
                )
                suggestions.append(transition)
                
            return suggestions
            
        except Exception as e:
            print(f"Error suggesting transitions: {e}")
            return []
    
    def _create_parsing_prompt(self, scenarios: List[str]) -> str:
        """Create the prompt for parsing scenarios."""
        
        scenarios_text = "\n".join(f"{i+1}. {s}" for i, s in enumerate(scenarios))
        
        return f"""Convert the following scenarios into a JSON array of FSM transitions.
Each transition should have: state, event, guard (optional), action, next_state.

Format the response as a JSON object with a "transitions" array.

Example format:
{{
    "transitions": [
        {{
            "state": "idle",
            "event": "start_button_pressed",
            "guard": null,
            "action": "initialize_system",
            "next_state": "running"
        }}
    ]
}}

SCENARIOS:
{scenarios_text}

Extract states, events, actions, and transitions from these scenarios. 
For "given/when/then" format:
- "Given" typically indicates the current state
- "When" indicates the event
- "Then" indicates the action and next state

Be precise and consistent with state and event naming."""
    
    def _create_gap_filler_prompt(self, fsm_json: Dict[str, Any]) -> str:
        """Create the prompt for suggesting missing transitions."""
        
        return f"""Given this partial FSM, suggest up to 5 additional transitions that would make it more complete and robust.

Current FSM:
{json.dumps(fsm_json, indent=2)}

Consider:
1. Error handling transitions
2. Unreachable states that need incoming transitions
3. States missing common events (like reset, cancel, error)
4. Security/safety considerations mentioned in the original scenarios

Format the response as a JSON object with a "suggestions" array and "explanations" object:
{{
    "suggestions": [
        {{
            "state": "...",
            "event": "...",
            "guard": null,
            "action": "...",
            "next_state": "...",
            "rationale": "Brief explanation"
        }}
    ]
}}""" 