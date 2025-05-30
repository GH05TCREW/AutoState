import networkx as nx
from typing import List, Dict, Set, Optional, Tuple
from models.schemas import Transition, FSMModel, VerificationResult
import uuid

class FSMBuilder:
    def __init__(self):
        self.graph = nx.DiGraph()
        
    def build_fsm(self, transitions: List[Transition], title: str) -> FSMModel:
        """Build an FSM model from a list of transitions."""
        
        # Extract unique states
        states = self._extract_states(transitions)
        
        # Build the graph
        self._build_graph(transitions)
        
        # Determine initial state (first state mentioned or explicit)
        initial_state = self._determine_initial_state(transitions, states)
        
        # Create FSM model
        fsm = FSMModel(
            id=str(uuid.uuid4()),
            title=title,
            states=list(states),
            initial_state=initial_state,
            transitions=transitions,
            metadata={
                "node_count": len(states),
                "edge_count": len(transitions)
            }
        )
        
        return fsm
    
    def merge_transitions(self, existing: List[Transition], new: List[Transition]) -> List[Transition]:
        """Merge new transitions with existing ones, avoiding duplicates."""
        
        # Create a set of existing transition keys
        existing_keys = set()
        for t in existing:
            key = (t.state, t.event, t.guard)
            existing_keys.add(key)
        
        # Add new transitions that don't conflict
        merged = existing.copy()
        for t in new:
            key = (t.state, t.event, t.guard)
            if key not in existing_keys:
                merged.append(t)
        
        return merged
    
    def verify_fsm(self, fsm: FSMModel) -> VerificationResult:
        """Verify the FSM for determinism, completeness, and reachability."""
        
        warnings = []
        errors = []
        
        # Check determinism
        is_deterministic, determinism_errors = self._check_determinism(fsm.transitions)
        errors.extend(determinism_errors)
        
        # Check reachability
        unreachable = self._find_unreachable_states(fsm)
        if unreachable:
            warnings.append(f"Unreachable states found: {', '.join(unreachable)}")
        
        # Check completeness
        is_complete, missing = self._check_completeness(fsm)
        
        # Security/safety checks
        security_warnings = self._security_checks(fsm)
        warnings.extend(security_warnings)
        
        return VerificationResult(
            is_deterministic=is_deterministic,
            is_complete=is_complete,
            unreachable_states=unreachable,
            missing_transitions=missing,
            warnings=warnings,
            errors=errors
        )
    
    def _extract_states(self, transitions: List[Transition]) -> Set[str]:
        """Extract all unique states from transitions."""
        states = set()
        for t in transitions:
            states.add(t.state)
            states.add(t.next_state)
        return states
    
    def _build_graph(self, transitions: List[Transition]):
        """Build a directed graph from transitions."""
        self.graph.clear()
        
        for t in transitions:
            self.graph.add_edge(
                t.state, 
                t.next_state,
                event=t.event,
                guard=t.guard,
                action=t.action
            )
    
    def _determine_initial_state(self, transitions: List[Transition], states: Set[str]) -> str:
        """Determine the initial state of the FSM."""
        
        # Look for common initial state names
        common_initial = ["idle", "init", "start", "initial", "ready"]
        for state in states:
            if state.lower() in common_initial:
                return state
        
        # Return the first state mentioned
        if transitions:
            return transitions[0].state
        
        # Default
        return "initial"
    
    def _check_determinism(self, transitions: List[Transition]) -> Tuple[bool, List[str]]:
        """Check if the FSM is deterministic."""
        
        errors = []
        seen = set()
        
        for t in transitions:
            key = (t.state, t.event, t.guard)
            if key in seen:
                errors.append(f"Non-deterministic transition: state='{t.state}', event='{t.event}', guard='{t.guard}'")
            seen.add(key)
        
        return len(errors) == 0, errors
    
    def _find_unreachable_states(self, fsm: FSMModel) -> List[str]:
        """Find states that cannot be reached from the initial state."""
        
        if not fsm.states:
            return []
        
        # Build graph for reachability analysis
        G = nx.DiGraph()
        for t in fsm.transitions:
            G.add_edge(t.state, t.next_state)
        
        # Find reachable states
        reachable = set()
        if fsm.initial_state in G:
            reachable = nx.descendants(G, fsm.initial_state)
            reachable.add(fsm.initial_state)
        
        # Find unreachable states
        all_states = set(fsm.states)
        unreachable = list(all_states - reachable)
        
        return unreachable
    
    def _check_completeness(self, fsm: FSMModel) -> Tuple[bool, List[Dict]]:
        """Check if all states handle common events."""
        
        # Extract all events
        all_events = set(t.event for t in fsm.transitions)
        
        # Check which states are missing which events
        missing = []
        state_events = {}
        
        # Build state-event mapping
        for t in fsm.transitions:
            if t.state not in state_events:
                state_events[t.state] = set()
            state_events[t.state].add(t.event)
        
        # Check for missing common events
        common_events = {"error", "reset", "timeout"} & all_events
        
        for state in fsm.states:
            state_handled = state_events.get(state, set())
            for event in common_events:
                if event not in state_handled:
                    missing.append({
                        "state": state,
                        "event": event,
                        "reason": "Common event not handled"
                    })
        
        return len(missing) == 0, missing
    
    def _security_checks(self, fsm: FSMModel) -> List[str]:
        """Perform security-specific checks on the FSM."""
        
        warnings = []
        
        # Check for unauthorized access patterns
        for t in fsm.transitions:
            if "unauthorized" in t.next_state.lower() or "denied" in t.next_state.lower():
                # Check if this state has a recovery path
                recovery_found = False
                for t2 in fsm.transitions:
                    if t2.state == t.next_state and ("auth" in t2.event.lower() or "login" in t2.event.lower()):
                        recovery_found = True
                        break
                
                if not recovery_found:
                    warnings.append(f"Security: State '{t.next_state}' may need an authentication recovery path")
        
        # Check for potential infinite loops
        try:
            cycles = list(nx.simple_cycles(self.graph))
            if len(cycles) > 5:
                warnings.append(f"Found {len(cycles)} cycles in FSM - verify these are intentional")
        except:
            pass
        
        return warnings 