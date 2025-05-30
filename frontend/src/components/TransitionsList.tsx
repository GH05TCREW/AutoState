import React from 'react';
import { Transition } from '../types';

interface TransitionsListProps {
  transitions: Transition[];
  suggestions?: Transition[];
  onAccept?: (transition: Transition) => void;
  onReject?: (transition: Transition) => void;
  onEdit?: (transitions: Transition[]) => void;
}

export const TransitionsList: React.FC<TransitionsListProps> = ({
  transitions,
  suggestions = [],
  onAccept,
  onReject,
  onEdit
}) => {
  const [editMode, setEditMode] = React.useState(false);
  const [editedTransitions, setEditedTransitions] = React.useState(transitions);
  
  React.useEffect(() => {
    setEditedTransitions(transitions);
  }, [transitions]);
  
  const handleSaveEdit = () => {
    if (onEdit) {
      onEdit(editedTransitions);
      setEditMode(false);
    }
  };
  
  const updateTransition = (index: number, field: keyof Transition, value: string) => {
    const updated = [...editedTransitions];
    (updated[index] as any)[field] = value;
    setEditedTransitions(updated);
  };
  
  return (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Transitions</h3>
        {onEdit && (
          <button
            onClick={() => editMode ? handleSaveEdit() : setEditMode(true)}
            className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            {editMode ? 'Save' : 'Edit'}
          </button>
        )}
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">State</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Guard</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Next State</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {editMode ? (
              editedTransitions.map((transition, index) => (
                <tr key={index}>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={transition.state}
                      onChange={(e) => updateTransition(index, 'state', e.target.value)}
                      className="w-full text-sm border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={transition.event}
                      onChange={(e) => updateTransition(index, 'event', e.target.value)}
                      className="w-full text-sm border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={transition.guard || ''}
                      onChange={(e) => updateTransition(index, 'guard', e.target.value)}
                      className="w-full text-sm border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={transition.action}
                      onChange={(e) => updateTransition(index, 'action', e.target.value)}
                      className="w-full text-sm border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={transition.next_state}
                      onChange={(e) => updateTransition(index, 'next_state', e.target.value)}
                      className="w-full text-sm border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-2 py-2 text-sm text-gray-500">{transition.source}</td>
                </tr>
              ))
            ) : (
              transitions.map((transition, index) => (
                <tr key={index} className={transition.source === 'llm_inferred' ? 'bg-orange-50' : ''}>
                  <td className="px-2 py-2 text-sm">{transition.state}</td>
                  <td className="px-2 py-2 text-sm">{transition.event}</td>
                  <td className="px-2 py-2 text-sm text-gray-500">{transition.guard || '-'}</td>
                  <td className="px-2 py-2 text-sm">{transition.action}</td>
                  <td className="px-2 py-2 text-sm">{transition.next_state}</td>
                  <td className="px-2 py-2 text-sm">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      transition.source === 'user' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {transition.source}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {suggestions.length > 0 && (
        <div className="mt-6">
          <h4 className="text-md font-semibold text-gray-900 mb-2">Suggested Transitions</h4>
          <div className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <div key={index} className="bg-yellow-50 p-3 rounded border border-yellow-200">
                <div className="text-sm">
                  <span className="font-medium">{suggestion.state}</span> →[{suggestion.event}]→ 
                  <span className="font-medium"> {suggestion.next_state}</span>
                  <div className="text-gray-600 mt-1">Action: {suggestion.action}</div>
                </div>
                <div className="mt-2 flex gap-2">
                  {onAccept && (
                    <button
                      onClick={() => onAccept(suggestion)}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Accept
                    </button>
                  )}
                  {onReject && (
                    <button
                      onClick={() => onReject(suggestion)}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Reject
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 