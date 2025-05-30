export type TransitionSource = "user" | "llm_inferred";

export interface Transition {
  state: string;
  event: string;
  guard?: string;
  action: string;
  next_state: string;
  source: TransitionSource;
}

export interface ScenarioSpec {
  title: string;
  language: "en";
  scenarios: string[];
}

export interface FSMModel {
  id?: string;
  title: string;
  states: string[];
  initial_state: string;
  transitions: Transition[];
  metadata?: Record<string, any>;
}

export interface VerificationResult {
  is_deterministic: boolean;
  is_complete: boolean;
  unreachable_states: string[];
  missing_transitions: any[];
  warnings: string[];
  errors: string[];
}

export interface GeneratedCode {
  language: string;
  filename: string;
  content: string;
}

export interface GenerationRequest {
  fsm_id: string;
  template: "python_class" | "yaml_policy" | "c_state_machine";
  options?: Record<string, any>;
}

export interface SimulationStep {
  current_state: string;
  event: string;
  next_state: string;
  action: string;
  guard_evaluated?: boolean;
}

export interface SimulationRequest {
  fsm_id: string;
  events: string[];
  initial_state?: string;
} 