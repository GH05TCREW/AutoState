import React, { useEffect, useRef, useState } from 'react';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';

interface FSMGraphProps {
  graphData: {
    nodes: any[];
    edges: any[];
    options?: any;
  };
  onNodeSelect?: (nodeId: string) => void;
}

type LayoutType = 'force-directed' | 'hierarchical' | 'circular' | 'tree';

// Helper function to abbreviate long transition labels
const abbreviateLabel = (label: string): string => {
  const abbreviations: { [key: string]: string } = {
    'start_button_pressed': 'start_btn',
    'stop_button_pressed': 'stop_btn',
    'reset_pressed': 'reset_btn',
    'error_occurs': 'error',
    'timeout_occurs': 'timeout',
    'shutdown_gracefully': 'shutdown',
    'initialize_system': 'init_sys',
    'log_error': 'log_err',
    'clear_errors': 'clear_err',
    'display_error_message': 'show_err',
    'pause_operations': 'pause_ops',
    'verify_system': 'verify_sys',
    'perform_shutdown': 'shutdown'
  };

  // Split label by newlines to handle multi-line labels
  return label.split('\n').map(line => {
    // Check if this line matches any abbreviation
    const trimmed = line.trim();
    return abbreviations[trimmed] || (trimmed.length > 12 ? trimmed.substring(0, 10) + '...' : trimmed);
  }).join('\n');
};

// Helper function to format edge labels for better readability
const formatEdgeLabel = (edge: any): string => {
  let label = '';
  
  // Add event (abbreviated)
  if (edge.label) {
    const lines = edge.label.split('\n');
    const event = lines[0] || '';
    label += abbreviateLabel(event);
    
    // Add guard if present (usually in [brackets])
    const guardLine = lines.find((line: string) => line.includes('[') && line.includes(']'));
    if (guardLine) {
      label += '\n' + guardLine;
    }
    
    // Add action (usually after /)
    const actionLine = lines.find((line: string) => line.includes('/'));
    if (actionLine) {
      const action = actionLine.replace('/', '').trim();
      label += '\n/' + abbreviateLabel(action);
    }
  }
  
  return label;
};

// Layout configuration options
const layoutOptions = {
  'force-directed': {
    layout: {
      hierarchical: {
        enabled: false
      }
    },
    physics: {
      enabled: true,
      barnesHut: {
        gravitationalConstant: -3000,
        centralGravity: 0.2,
        springLength: 150,
        springConstant: 0.02,
        damping: 0.1,
        avoidOverlap: 0.8
      },
      stabilization: {
        enabled: true,
        iterations: 200,
        updateInterval: 10
      }
    }
  },
  'hierarchical': {
    layout: {
      hierarchical: {
        enabled: true,
        direction: 'LR', // Left to Right for better flow
        sortMethod: 'directed',
        levelSeparation: 200,
        nodeSpacing: 150,
        treeSpacing: 200,
        blockShifting: true,
        edgeMinimization: true,
        parentCentralization: true
      }
    },
    physics: {
      enabled: false
    }
  },
  'circular': {
    layout: {
      hierarchical: {
        enabled: false
      }
    },
    physics: {
      enabled: true,
      barnesHut: {
        gravitationalConstant: -5000,
        centralGravity: 0.6,
        springLength: 180,
        springConstant: 0.03,
        damping: 0.08,
        avoidOverlap: 0.3
      },
      stabilization: {
        enabled: true,
        iterations: 300
      }
    }
  },
  'tree': {
    layout: {
      hierarchical: {
        enabled: true,
        direction: 'UD', // Up-Down for tree structure
        sortMethod: 'directed',
        levelSeparation: 140,
        nodeSpacing: 120,
        treeSpacing: 180,
        blockShifting: true,
        edgeMinimization: true
      }
    },
    physics: {
      enabled: false
    }
  }
};

// Network options generator
const getNetworkOptions = (layout: LayoutType) => {
  const baseOptions = {
    nodes: {
      shape: 'box',
      font: {
        size: 16,
        color: '#000000',
        face: 'Arial',
        strokeWidth: 2,
        strokeColor: 'white'
      },
      borderWidth: 2,
      shadow: {
        enabled: true,
        color: 'rgba(0,0,0,0.2)',
        size: 8,
        x: 2,
        y: 2
      },
      margin: { top: 12, right: 15, bottom: 12, left: 15 },
      widthConstraint: {
        minimum: 80,
        maximum: 150
      }
    },
    edges: {
      arrows: {
        to: {
          enabled: true,
          scaleFactor: 1.2,
          type: 'arrow'
        }
      },
      font: {
        size: 11,
        align: 'horizontal',
        background: 'rgba(255, 255, 255, 0.9)',
        strokeWidth: 1,
        strokeColor: 'white',
        face: 'Arial'
      },
      smooth: {
        enabled: true,
        type: layout === 'hierarchical' || layout === 'tree' ? 'cubicBezier' : 'curvedCW',
        roundness: layout === 'hierarchical' || layout === 'tree' ? 0.3 : 0.8,
        forceDirection: layout === 'hierarchical' ? 'horizontal' : 'none'
      },
      color: {
        inherit: false
      },
      width: 2,
      selectionWidth: 3
    },
    interaction: {
      hover: true,
      tooltipDelay: 200,
      zoomView: true,
      dragView: true,
      selectConnectedEdges: false
    }
  };

  return { ...baseOptions, ...layoutOptions[layout] };
};

export const FSMGraph: React.FC<FSMGraphProps> = ({ graphData, onNodeSelect }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);
  const [selectedLayout, setSelectedLayout] = useState<LayoutType>('hierarchical'); // Default to hierarchical for better readability
  const [isExporting, setIsExporting] = useState(false);
  
  const handleLayoutChange = (layout: LayoutType) => {
    setSelectedLayout(layout);
    if (networkRef.current && graphData) {
      const options = getNetworkOptions(layout);
      networkRef.current.setOptions(options);
      
      // Trigger re-layout with animation
      setTimeout(() => {
        if (networkRef.current) {
          if (layout === 'hierarchical' || layout === 'tree') {
            networkRef.current.fit({ animation: { duration: 1000, easingFunction: 'easeInOutCubic' } });
          } else {
            networkRef.current.stabilize();
            setTimeout(() => {
              if (networkRef.current) {
                networkRef.current.fit({ animation: { duration: 800, easingFunction: 'easeInOutCubic' } });
              }
            }, 500);
          }
        }
      }, 100);
    }
  };

  const handleZoomIn = () => {
    if (networkRef.current) {
      const scale = networkRef.current.getScale();
      networkRef.current.moveTo({ 
        scale: scale * 1.3,
        animation: { duration: 300, easingFunction: 'easeInOutCubic' }
      });
    }
  };

  const handleZoomOut = () => {
    if (networkRef.current) {
      const scale = networkRef.current.getScale();
      networkRef.current.moveTo({ 
        scale: scale * 0.7,
        animation: { duration: 300, easingFunction: 'easeInOutCubic' }
      });
    }
  };

  const handleFitView = () => {
    if (networkRef.current) {
      networkRef.current.fit({ 
        animation: { duration: 600, easingFunction: 'easeInOutCubic' }
      });
    }
  };

  const handleExportImage = async () => {
    if (!networkRef.current || !containerRef.current) return;
    
    setIsExporting(true);
    try {
      // Get the canvas from vis-network
      const canvas = containerRef.current.querySelector('canvas') as HTMLCanvasElement;
      if (canvas) {
        // Create download link
        const link = document.createElement('a');
        link.download = 'fsm-diagram.png';
        link.href = canvas.toDataURL('image/png');
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export image. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };
  
  useEffect(() => {
    if (!containerRef.current || !graphData) return;
    
    // Process and improve edge labels
    const processedEdges = graphData.edges.map((edge: any) => ({
      ...edge,
      label: formatEdgeLabel(edge),
      title: edge.label // Keep original as tooltip
    }));
    
    // Create datasets
    const nodes = new DataSet(graphData.nodes);
    const edges = new DataSet(processedEdges);
    
    // Create network
    const data = { nodes, edges };
    const options = getNetworkOptions(selectedLayout);
    
    networkRef.current = new Network(containerRef.current, data, options);
    
    // Add event listeners
    if (onNodeSelect) {
      networkRef.current.on('selectNode', (params) => {
        if (params.nodes.length > 0) {
          onNodeSelect(params.nodes[0]);
        }
      });
    }
    
    // Auto-fit after initial render
    setTimeout(() => {
      if (networkRef.current) {
        networkRef.current.fit({ animation: { duration: 1000, easingFunction: 'easeInOutCubic' } });
      }
    }, 500);
    
    // Cleanup
    return () => {
      if (networkRef.current) {
        networkRef.current.destroy();
      }
    };
  }, [graphData, selectedLayout, onNodeSelect]);
  
  return (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">FSM Visualization</h3>
        
        {/* Controls */}
        <div className="flex items-center space-x-4">
          {/* Layout Selector */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Layout:</label>
            <select
              value={selectedLayout}
              onChange={(e) => handleLayoutChange(e.target.value as LayoutType)}
              className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[140px]"
            >
              <option value="hierarchical">Hierarchical</option>
              <option value="tree">Tree</option>
              <option value="force-directed">Force-Directed</option>
              <option value="circular">Circular</option>
            </select>
          </div>
          
          {/* Zoom Controls */}
          <div className="flex items-center space-x-1">
            <button
              onClick={handleZoomIn}
              className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              title="Zoom In"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              title="Zoom Out"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <button
              onClick={handleFitView}
              className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              title="Fit to View"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          </div>
          
          {/* Export Button */}
          <button
            onClick={handleExportImage}
            disabled={isExporting}
            className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
            title="Export as PNG"
          >
            {isExporting ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Export</span>
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Graph Container */}
      <div 
        ref={containerRef} 
        className="w-full h-96 border border-gray-200 rounded bg-gray-50"
      />
      
      {/* Legend */}
      <div className="mt-3 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>Initial state</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-1 bg-green-500"></div>
              <span>User transitions</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-1 bg-orange-500"></div>
              <span>AI suggestions</span>
            </div>
          </div>
        </div>
        
        {/* Layout Description */}
        <div className="text-xs text-gray-500">
          {selectedLayout === 'force-directed' && 'Physics-based automatic positioning'}
          {selectedLayout === 'hierarchical' && 'Left-to-right structured flow'}
          {selectedLayout === 'circular' && 'Circular arrangement with clustering'}
          {selectedLayout === 'tree' && 'Top-down branching structure'}
        </div>
      </div>
    </div>
  );
}; 