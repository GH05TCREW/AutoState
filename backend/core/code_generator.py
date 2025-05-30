from jinja2 import Template
from typing import Dict, Any
from models.schemas import FSMModel, GeneratedCode
import os

class CodeGenerator:
    def __init__(self):
        self.templates_dir = "templates"
        self._load_templates()
    
    def _load_templates(self):
        """Load code generation templates."""
        self.templates = {
            "python_class": self._get_python_template(),
            "yaml_policy": self._get_yaml_template(),
            "c_state_machine": self._get_c_template()
        }
    
    def generate_code(self, fsm: FSMModel, template_type: str, options: Dict[str, Any] = {}) -> GeneratedCode:
        """Generate code from FSM model using specified template."""
        
        if template_type not in self.templates:
            raise ValueError(f"Unknown template type: {template_type}")
        
        template = self.templates[template_type]
        
        # Prepare context for template
        context = self._prepare_context(fsm, options)
        
        # Generate code
        content = template.render(**context)
        
        # Determine filename
        filename = self._get_filename(fsm.title, template_type)
        
        return GeneratedCode(
            language=self._get_language(template_type),
            filename=filename,
            content=content
        )
    
    def _prepare_context(self, fsm: FSMModel, options: Dict[str, Any]) -> Dict[str, Any]:
        """Prepare context variables for template rendering."""
        
        # Group transitions by state for easier template processing
        transitions_by_state = {}
        for t in fsm.transitions:
            if t.state not in transitions_by_state:
                transitions_by_state[t.state] = []
            transitions_by_state[t.state].append(t)
        
        # Extract unique events
        events = sorted(set(t.event for t in fsm.transitions))
        
        return {
            "fsm": fsm,
            "title": fsm.title,
            "states": fsm.states,
            "events": events,
            "initial_state": fsm.initial_state,
            "transitions": fsm.transitions,
            "transitions_by_state": transitions_by_state,
            "class_name": self._to_class_name(fsm.title),
            "options": options
        }
    
    def _to_class_name(self, title: str) -> str:
        """Convert title to valid class name."""
        return "".join(word.capitalize() for word in title.split())
    
    def _get_filename(self, title: str, template_type: str) -> str:
        """Generate appropriate filename based on template type."""
        
        base_name = title.lower().replace(" ", "_")
        
        extensions = {
            "python_class": ".py",
            "yaml_policy": ".yaml",
            "c_state_machine": ".c"
        }
        
        return base_name + extensions.get(template_type, ".txt")
    
    def _get_language(self, template_type: str) -> str:
        """Get programming language for template type."""
        
        languages = {
            "python_class": "python",
            "yaml_policy": "yaml",
            "c_state_machine": "c"
        }
        
        return languages.get(template_type, "text")
    
    def _get_python_template(self) -> Template:
        """Python class template for FSM."""
        
        template_str = '''from enum import Enum, auto
from typing import Optional, Dict, Callable

class State(Enum):
    {% for state in states -%}
    {{ state.upper().replace(" ", "_") }} = auto()
    {% endfor %}

class Event(Enum):
    {% for event in events -%}
    {{ event.upper().replace(" ", "_") }} = auto()
    {% endfor %}

class {{ class_name }}FSM:
    """{{ title }} - Generated Finite State Machine"""
    
    def __init__(self):
        self.current_state = State.{{ initial_state.upper().replace(" ", "_") }}
        self.transitions = self._setup_transitions()
        self.actions = self._setup_actions()
        
    def _setup_transitions(self) -> Dict:
        """Define state transitions."""
        transitions = {}
        {% for t in transitions %}
        # {{ t.state }} --[{{ t.event }}]--> {{ t.next_state }}
        transitions[(State.{{ t.state.upper().replace(" ", "_") }}, Event.{{ t.event.upper().replace(" ", "_") }})] = {
            'next_state': State.{{ t.next_state.upper().replace(" ", "_") }},
            'action': '{{ t.action }}',
            {% if t.guard %}'guard': '{{ t.guard }}',{% endif %}
        }
        {% endfor %}
        return transitions
    
    def _setup_actions(self) -> Dict[str, Callable]:
        """Setup action handlers."""
        return {
            {% for t in transitions | unique(attribute='action') %}
            '{{ t.action }}': self._{{ t.action.lower().replace(" ", "_") }},
            {% endfor %}
        }
    
    def handle_event(self, event: Event) -> bool:
        """Handle an event and transition if valid."""
        key = (self.current_state, event)
        
        if key in self.transitions:
            transition = self.transitions[key]
            
            # Check guard condition if present
            if 'guard' in transition:
                if not self._evaluate_guard(transition['guard']):
                    return False
            
            # Execute action
            action_name = transition['action']
            if action_name in self.actions:
                self.actions[action_name]()
            
            # Transition to next state
            self.current_state = transition['next_state']
            return True
        
        return False
    
    def _evaluate_guard(self, guard: str) -> bool:
        """Evaluate guard condition."""
        # TODO: Implement guard evaluation logic
        return True
    
    # Action methods
    {% for t in transitions | unique(attribute='action') %}
    def _{{ t.action.lower().replace(" ", "_") }}(self):
        """Action: {{ t.action }}"""
        # TODO: Implement {{ t.action }}
        print(f"Executing: {{ t.action }}")
    {% endfor %}
    
    def get_current_state(self) -> State:
        """Get current state."""
        return self.current_state

# Unit tests
import unittest

class Test{{ class_name }}FSM(unittest.TestCase):
    def setUp(self):
        self.fsm = {{ class_name }}FSM()
    
    def test_initial_state(self):
        self.assertEqual(self.fsm.get_current_state(), State.{{ initial_state.upper().replace(" ", "_") }})
    
    def test_transitions(self):
        """Test all defined transitions."""
        # TODO: Add comprehensive transition tests
        pass

if __name__ == "__main__":
    unittest.main()
'''
        
        return Template(template_str)
    
    def _get_yaml_template(self) -> Template:
        """YAML policy template for RBAC."""
        
        template_str = '''# {{ title }} - Access Control Policy
# Generated from FSM specification

policy:
  name: {{ title | lower | replace(" ", "_") }}_policy
  version: "1.0.0"
  
states:
  {% for state in states -%}
  - name: {{ state }}
    {% if state == initial_state %}initial: true{% endif %}
  {% endfor %}

events:
  {% for event in events -%}
  - {{ event }}
  {% endfor %}

transitions:
  {% for t in transitions %}
  - from: {{ t.state }}
    to: {{ t.next_state }}
    on: {{ t.event }}
    {% if t.guard %}guard: {{ t.guard }}{% endif %}
    action: {{ t.action }}
  {% endfor %}

# Role-based access control mapping
rbac:
  roles:
    {% for state in states %}
    - name: {{ state }}_role
      permissions:
        {% for t in transitions_by_state.get(state, []) %}
        - action: {{ t.action }}
          resource: {{ t.next_state }}
        {% endfor %}
    {% endfor %}
'''
        
        return Template(template_str)
    
    def _get_c_template(self) -> Template:
        """C state machine template."""
        
        template_str = '''#include <stdio.h>
#include <stdbool.h>

/* {{ title }} - Generated State Machine */

/* States */
typedef enum {
    {% for state in states -%}
    STATE_{{ state.upper().replace(" ", "_") }},
    {% endfor %}
    STATE_COUNT
} State;

/* Events */
typedef enum {
    {% for event in events -%}
    EVENT_{{ event.upper().replace(" ", "_") }},
    {% endfor %}
    EVENT_COUNT
} Event;

/* State machine structure */
typedef struct {
    State current_state;
} {{ class_name }}FSM;

/* Function prototypes */
void fsm_init({{ class_name }}FSM* fsm);
bool fsm_handle_event({{ class_name }}FSM* fsm, Event event);
const char* get_state_name(State state);
const char* get_event_name(Event event);

/* Action functions */
{% for t in transitions | unique(attribute='action') %}
void action_{{ t.action.lower().replace(" ", "_") }}(void);
{% endfor %}

/* Initialize FSM */
void fsm_init({{ class_name }}FSM* fsm) {
    fsm->current_state = STATE_{{ initial_state.upper().replace(" ", "_") }};
}

/* Handle events */
bool fsm_handle_event({{ class_name }}FSM* fsm, Event event) {
    State next_state = fsm->current_state;
    bool transition_found = false;
    
    switch (fsm->current_state) {
        {% for state, trans in transitions_by_state.items() %}
        case STATE_{{ state.upper().replace(" ", "_") }}:
            switch (event) {
                {% for t in trans %}
                case EVENT_{{ t.event.upper().replace(" ", "_") }}:
                    action_{{ t.action.lower().replace(" ", "_") }}();
                    next_state = STATE_{{ t.next_state.upper().replace(" ", "_") }};
                    transition_found = true;
                    break;
                {% endfor %}
                default:
                    break;
            }
            break;
        {% endfor %}
        default:
            break;
    }
    
    if (transition_found) {
        printf("Transition: %s --[%s]--> %s\\n",
               get_state_name(fsm->current_state),
               get_event_name(event),
               get_state_name(next_state));
        fsm->current_state = next_state;
    }
    
    return transition_found;
}

/* Get state name */
const char* get_state_name(State state) {
    static const char* state_names[] = {
        {% for state in states -%}
        "{{ state }}",
        {% endfor %}
    };
    return (state < STATE_COUNT) ? state_names[state] : "UNKNOWN";
}

/* Get event name */
const char* get_event_name(Event event) {
    static const char* event_names[] = {
        {% for event in events -%}
        "{{ event }}",
        {% endfor %}
    };
    return (event < EVENT_COUNT) ? event_names[event] : "UNKNOWN";
}

/* Action implementations */
{% for t in transitions | unique(attribute='action') %}
void action_{{ t.action.lower().replace(" ", "_") }}(void) {
    printf("Action: {{ t.action }}\\n");
    /* TODO: Implement {{ t.action }} */
}
{% endfor %}

/* Example usage */
int main() {
    {{ class_name }}FSM fsm;
    fsm_init(&fsm);
    
    printf("{{ title }} - State Machine Example\\n");
    printf("Initial state: %s\\n", get_state_name(fsm.current_state));
    
    /* TODO: Add test event sequence */
    
    return 0;
}
'''
        
        return Template(template_str) 