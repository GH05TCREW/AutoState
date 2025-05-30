import React, { useState } from 'react';
import { api } from '../api/client';
import { VerificationResult } from '../types';

interface VerificationPanelProps {
  fsmId: string;
}

export const VerificationPanel: React.FC<VerificationPanelProps> = ({ fsmId }) => {
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  
  const runVerification = async () => {
    setLoading(true);
    try {
      const result = await api.verifyFSM(fsmId);
      setVerificationResult(result);
    } catch (error) {
      console.error('Verification failed:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-white shadow rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification</h3>
      
      <button
        onClick={runVerification}
        disabled={loading}
        className="mb-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? 'Verifying...' : 'Run Verification'}
      </button>
      
      {verificationResult && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Deterministic:</span>
            <span className={`px-2 py-1 rounded text-xs ${
              verificationResult.is_deterministic 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {verificationResult.is_deterministic ? 'Yes' : 'No'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Complete:</span>
            <span className={`px-2 py-1 rounded text-xs ${
              verificationResult.is_complete 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {verificationResult.is_complete ? 'Yes' : 'No'}
            </span>
          </div>
          
          {verificationResult.unreachable_states.length > 0 && (
            <div>
              <p className="text-sm font-medium text-red-600">Unreachable States:</p>
              <ul className="mt-1 text-sm text-gray-600">
                {verificationResult.unreachable_states.map((state, idx) => (
                  <li key={idx}>• {state}</li>
                ))}
              </ul>
            </div>
          )}
          
          {verificationResult.errors.length > 0 && (
            <div>
              <p className="text-sm font-medium text-red-600">Errors:</p>
              <ul className="mt-1 text-sm text-red-600">
                {verificationResult.errors.map((error, idx) => (
                  <li key={idx}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
          
          {verificationResult.warnings.length > 0 && (
            <div>
              <p className="text-sm font-medium text-yellow-600">Warnings:</p>
              <ul className="mt-1 text-sm text-yellow-600">
                {verificationResult.warnings.map((warning, idx) => (
                  <li key={idx}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}
          
          {verificationResult.missing_transitions.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700">Missing Transitions:</p>
              <ul className="mt-1 text-sm text-gray-600">
                {verificationResult.missing_transitions.map((missing, idx) => (
                  <li key={idx}>
                    • State "{missing.state}" missing handler for "{missing.event}" ({missing.reason})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 