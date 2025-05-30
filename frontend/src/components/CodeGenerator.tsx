import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { GeneratedCode } from '../types';

interface CodeGeneratorProps {
  fsmId: string;
}

export const CodeGenerator: React.FC<CodeGeneratorProps> = ({ fsmId }) => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    loadTemplates();
  }, []);
  
  const loadTemplates = async () => {
    try {
      const response = await api.getTemplates();
      setTemplates(response.templates);
      if (response.templates.length > 0) {
        setSelectedTemplate(response.templates[0].id);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };
  
  const generateCode = async () => {
    if (!selectedTemplate) return;
    
    setLoading(true);
    try {
      const code = await api.generateCode({
        fsm_id: fsmId,
        template: selectedTemplate as any,
        options: {}
      });
      setGeneratedCode(code);
    } catch (error) {
      console.error('Failed to generate code:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const downloadCode = async () => {
    if (!selectedTemplate) return;
    
    try {
      const blob = await api.downloadCode(fsmId, selectedTemplate);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = generatedCode?.filename || 'generated_code.txt';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download code:', error);
    }
  };
  
  const copyToClipboard = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode.content);
    }
  };
  
  return (
    <div className="bg-white shadow rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Code Generation</h3>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Template
        </label>
        <select
          value={selectedTemplate}
          onChange={(e) => setSelectedTemplate(e.target.value)}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name} - {template.description}
            </option>
          ))}
        </select>
      </div>
      
      <div className="flex gap-2 mb-4">
        <button
          onClick={generateCode}
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Generate Code'}
        </button>
        
        {generatedCode && (
          <>
            <button
              onClick={downloadCode}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Download
            </button>
            <button
              onClick={copyToClipboard}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Copy
            </button>
          </>
        )}
      </div>
      
      {generatedCode && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              {generatedCode.filename}
            </span>
            <span className="text-sm text-gray-500">
              {generatedCode.language}
            </span>
          </div>
          <pre className="bg-gray-50 p-4 rounded overflow-x-auto text-sm">
            <code>{generatedCode.content}</code>
          </pre>
        </div>
      )}
    </div>
  );
}; 