import React, { useState } from 'react';
import { ScenarioSpec } from '../types';

interface ScenarioEditorProps {
  onSubmit: (spec: ScenarioSpec) => void;
  loading?: boolean;
}

const EXAMPLE_SCENARIOS = [
  "Given the system is idle, when the start button is pressed, then initialize the system and transition to running state",
  "Given the system is running, when an error occurs, then log the error and transition to error state",
  "Given the system is in error state, when reset is pressed, then clear errors and transition to idle state",
  "Given the system is running, when stop is pressed, then shutdown gracefully and transition to idle state"
];

export const ScenarioEditor: React.FC<ScenarioEditorProps> = ({ onSubmit, loading }) => {
  const [title, setTitle] = useState('');
  const [scenarios, setScenarios] = useState<string[]>(['']);
  
  const addScenario = () => {
    setScenarios([...scenarios, '']);
  };
  
  const removeScenario = (index: number) => {
    setScenarios(scenarios.filter((_, i) => i !== index));
  };
  
  const updateScenario = (index: number, value: string) => {
    const updated = [...scenarios];
    updated[index] = value;
    setScenarios(updated);
  };
  
  const loadExample = () => {
    setTitle('System State Machine');
    setScenarios(EXAMPLE_SCENARIOS);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validScenarios = scenarios.filter(s => s.trim() !== '');
    if (title && validScenarios.length > 0) {
      onSubmit({
        title,
        language: 'en',
        scenarios: validScenarios
      });
    }
  };
  
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Scenario Editor</h2>
        <p className="text-gray-600">
          Enter your scenarios in natural language using Given/When/Then format or simple descriptions.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Project Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="e.g., Access Control System"
            required
          />
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Scenarios
            </label>
            <button
              type="button"
              onClick={loadExample}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              Load Example
            </button>
          </div>
          
          {scenarios.map((scenario, index) => (
            <div key={index} className="mb-3 flex gap-2">
              <textarea
                value={scenario}
                onChange={(e) => updateScenario(index, e.target.value)}
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                rows={2}
                placeholder="e.g., Given the door is locked, when a valid keycard is presented, then unlock the door and log access"
                required
              />
              {scenarios.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeScenario(index)}
                  className="px-3 py-1 text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          
          <button
            type="button"
            onClick={addScenario}
            className="w-full py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Add Scenario
          </button>
        </div>
        
        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Generate FSM'}
          </button>
        </div>
      </form>
    </div>
  );
}; 