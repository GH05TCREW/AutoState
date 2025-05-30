import React, { useState, useEffect } from 'react';
import { ScenarioEditor } from './components/ScenarioEditor';
import { FSMGraph } from './components/FSMGraph';
import { TransitionsList } from './components/TransitionsList';
import { CodeGenerator } from './components/CodeGenerator';
import { VerificationPanel } from './components/VerificationPanel';
import { api } from './api/client';
import { FSMModel, Transition, ScenarioSpec } from './types';

function App() {
  const [currentFSM, setCurrentFSM] = useState<FSMModel | null>(null);
  const [graphData, setGraphData] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<Transition[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'verify' | 'generate'>('edit');
  
  useEffect(() => {
    if (currentFSM?.id) {
      loadGraphData(currentFSM.id);
    }
  }, [currentFSM]);
  
  const handleScenarioSubmit = async (spec: ScenarioSpec) => {
    setLoading(true);
    try {
      const fsm = await api.parseScenarios(spec);
      setCurrentFSM(fsm);
      
      // Get suggestions
      if (fsm.id) {
        const suggestions = await api.suggestTransitions(fsm.id);
        setSuggestions(suggestions);
      }
    } catch (error) {
      console.error('Failed to parse scenarios:', error);
      alert('Failed to parse scenarios. Please check your input.');
    } finally {
      setLoading(false);
    }
  };
  
  const loadGraphData = async (fsmId: string) => {
    try {
      const data = await api.getFSMGraph(fsmId);
      setGraphData(data);
    } catch (error) {
      console.error('Failed to load graph data:', error);
    }
  };
  
  const handleAcceptTransition = async (transition: Transition) => {
    if (!currentFSM?.id) return;
    
    try {
      const result = await api.acceptTransition(currentFSM.id, transition);
      setCurrentFSM(result.fsm);
      setSuggestions(suggestions.filter(s => s !== transition));
    } catch (error) {
      console.error('Failed to accept transition:', error);
    }
  };
  
  const handleRejectTransition = async (transition: Transition) => {
    setSuggestions(suggestions.filter(s => s !== transition));
  };
  
  const handleEditTransitions = async (transitions: Transition[]) => {
    if (!currentFSM?.id) return;
    
    try {
      const updatedFSM = await api.updateTransitions(currentFSM.id, transitions);
      setCurrentFSM(updatedFSM);
    } catch (error) {
      console.error('Failed to update transitions:', error);
    }
  };
  
  const resetWorkspace = () => {
    setCurrentFSM(null);
    setGraphData(null);
    setSuggestions([]);
    setActiveTab('edit');
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">AutoState</h1>
            <p className="text-sm text-gray-600">Natural Language → FSM → Code</p>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!currentFSM ? (
          <ScenarioEditor onSubmit={handleScenarioSubmit} loading={loading} />
        ) : (
          <>
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">{currentFSM.title}</h2>
              <button
                onClick={resetWorkspace}
                className="px-4 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                New Project
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {graphData && <FSMGraph graphData={graphData} />}
              
              <TransitionsList
                transitions={currentFSM.transitions}
                suggestions={suggestions}
                onAccept={handleAcceptTransition}
                onReject={handleRejectTransition}
                onEdit={handleEditTransitions}
              />
            </div>
            
            <div className="bg-white shadow rounded-lg">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex">
                  <button
                    onClick={() => setActiveTab('edit')}
                    className={`py-2 px-4 border-b-2 font-medium text-sm ${
                      activeTab === 'edit'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Edit FSM
                  </button>
                  <button
                    onClick={() => setActiveTab('verify')}
                    className={`py-2 px-4 border-b-2 font-medium text-sm ${
                      activeTab === 'verify'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Verify
                  </button>
                  <button
                    onClick={() => setActiveTab('generate')}
                    className={`py-2 px-4 border-b-2 font-medium text-sm ${
                      activeTab === 'generate'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Generate Code
                  </button>
                </nav>
              </div>
              
              <div className="p-4">
                {activeTab === 'edit' && (
                  <div className="text-gray-600">
                    <p>Use the transitions table above to edit your FSM. Accept or reject LLM suggestions to refine your state machine.</p>
                  </div>
                )}
                {activeTab === 'verify' && currentFSM.id && (
                  <VerificationPanel fsmId={currentFSM.id} />
                )}
                {activeTab === 'generate' && currentFSM.id && (
                  <CodeGenerator fsmId={currentFSM.id} />
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
