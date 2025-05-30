import axios from 'axios';
import { 
  ScenarioSpec, 
  FSMModel, 
  Transition, 
  VerificationResult,
  GeneratedCode,
  GenerationRequest,
  SimulationStep,
  SimulationRequest
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Scenarios
  parseScenarios: async (spec: ScenarioSpec): Promise<FSMModel> => {
    const response = await client.post('/api/scenarios/parse', spec);
    return response.data;
  },
  
  getFSM: async (fsmId: string): Promise<FSMModel> => {
    const response = await client.get(`/api/scenarios/${fsmId}`);
    return response.data;
  },
  
  listFSMs: async (): Promise<Array<{id: string, title: string, created_at: string}>> => {
    const response = await client.get('/api/scenarios/');
    return response.data;
  },
  
  deleteFSM: async (fsmId: string): Promise<void> => {
    await client.delete(`/api/scenarios/${fsmId}`);
  },
  
  // FSM Management
  suggestTransitions: async (fsmId: string): Promise<Transition[]> => {
    const response = await client.post(`/api/fsm/${fsmId}/suggest-transitions`);
    return response.data;
  },
  
  acceptTransition: async (fsmId: string, transition: Transition): Promise<any> => {
    const response = await client.post(`/api/fsm/${fsmId}/accept-transition`, transition);
    return response.data;
  },
  
  rejectTransition: async (fsmId: string, transition: Transition): Promise<any> => {
    const response = await client.post(`/api/fsm/${fsmId}/reject-transition`, transition);
    return response.data;
  },
  
  updateTransitions: async (fsmId: string, transitions: Transition[]): Promise<FSMModel> => {
    const response = await client.put(`/api/fsm/${fsmId}/transitions`, transitions);
    return response.data;
  },
  
  // Code Generation
  generateCode: async (request: GenerationRequest): Promise<GeneratedCode> => {
    const response = await client.post('/api/generator/generate', request);
    return response.data;
  },
  
  downloadCode: async (fsmId: string, template: string): Promise<Blob> => {
    const response = await client.post(`/api/generator/download/${fsmId}/${template}`, {}, {
      responseType: 'blob'
    });
    return response.data;
  },
  
  getTemplates: async (): Promise<any> => {
    const response = await client.get('/api/generator/templates');
    return response.data;
  },
  
  // Verification
  verifyFSM: async (fsmId: string): Promise<VerificationResult> => {
    const response = await client.get(`/api/verification/${fsmId}/verify`);
    return response.data;
  },
  
  simulateFSM: async (fsmId: string, request: SimulationRequest): Promise<SimulationStep[]> => {
    const response = await client.post(`/api/verification/${fsmId}/simulate`, request);
    return response.data;
  },
  
  getFSMGraph: async (fsmId: string): Promise<any> => {
    const response = await client.get(`/api/verification/${fsmId}/graph`);
    return response.data;
  },
}; 