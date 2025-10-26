import React, { useState, useCallback, useEffect, useRef } from 'react';

const LOCAL_STORAGE_KEY = 'writtai-canvas-flow';

// Default nodes to guide the user
const initialNodes = [
  { id: '1', type: 'input', data: { label: 'My Awesome Book' }, position: { x: 250, y: 5 } },
  { id: '2', data: { label: 'Chapter 1: The Beginning' }, position: { x: 100, y: 100 } },
  { id: '3', data: { label: 'Main Character Arc' }, position: { x: 400, y: 100 } },
  { id: '4', type: 'output', data: { label: 'The Exciting Climax!' }, position: { x: 250, y: 250 } },
];

// Default edges connecting the initial nodes
const initialEdges = [
    { id: 'e1-2', source: '1', target: '2' }, 
    { id: 'e1-3', source: '1', target: '3' },
    { id: 'e2-4', source: '2', target: '4', animated: true },
    { id: 'e3-4', source: '3', target: '4', animated: true },
];

const CanvasScreen = () => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [rfInstance, setRfInstance] = useState(null);

  // Safely access ReactFlow from the window object loaded by the UMD script
  const ReactFlow = (window as any).ReactFlow?.default;
  const { addEdge, applyNodeChanges, applyEdgeChanges, Controls, MiniMap, Background } = (window as any).ReactFlow || {};

  // Load state from localStorage on initial render
  useEffect(() => {
    const storedFlow = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedFlow) {
      const { nodes: storedNodes, edges: storedEdges } = JSON.parse(storedFlow);
      if (storedNodes && storedNodes.length > 0) {
        setNodes(storedNodes);
        setEdges(storedEdges || []);
      } else {
        setNodes(initialNodes);
        setEdges(initialEdges);
      }
    } else {
       setNodes(initialNodes);
       setEdges(initialEdges);
    }
  }, []);

  // Save state to localStorage whenever nodes or edges change
  useEffect(() => {
    if (nodes.length > 0) { // Only save if there are nodes
        const flow = { nodes, edges };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(flow));
    }
  }, [nodes, edges]);

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );
  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );
  const onConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const onPaneDoubleClick = useCallback((event) => {
    if (!rfInstance) return;
    const position = rfInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
    });
    const newNode = {
      id: `node-${+new Date()}`,
      position,
      data: { label: `New Note` },
    };
    setNodes((nds) => nds.concat(newNode));
  }, [rfInstance]);

  if (!ReactFlow) {
    return (
      <div className="fixed inset-0 bg-red-100 flex items-center justify-center z-50">
        <p className="text-red-700">Error: Canvas library failed to load.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[75vh] bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-lg">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setRfInstance}
        onPaneDoubleClick={onPaneDoubleClick}
        fitView
        className="bg-slate-50 dark:bg-slate-800/50"
      >
        <Controls />
        <MiniMap nodeStrokeWidth={3} zoomable pannable />
        <Background variant="dots" gap={16} size={1} />
      </ReactFlow>
    </div>
  );
};

export default CanvasScreen;