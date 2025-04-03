import { useCallback, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Edge,
  Node,
  NodeTypes,
  OnConnect,
  OnEdgesChange,
  OnNodesChange,
  Panel,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { BasePoints } from './rule-nodes/base-points';
import { CategoryMultiplier } from './rule-nodes/category-multiplier';
import { MaximumPoints } from './rule-nodes/maximum-points';
import { MinimumPurchase } from './rule-nodes/minimum-purchase';
import { RuleSidebar } from './rule-nodes/rule-sidebar';
import { RuleProperties } from './rule-nodes/rule-properties';

const nodeTypes: NodeTypes = {
  basePoints: BasePoints,
  categoryMultiplier: CategoryMultiplier,
  minimumPurchase: MinimumPurchase,
  maximumPoints: MaximumPoints,
};

interface RuleBuilderProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  onNodeDataChange: (nodeId: string, data: any) => void;
}

export function RuleBuilder({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeDataChange,
}: RuleBuilderProps) {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const { screenToFlowPosition, toObject } = useReactFlow();

  const handleNodesChange = useCallback(
    (changes: any[]) => {
      onNodesChange(changes);
      // Update selected node when selection changes
      const selectionChange = changes.find((change) => change.type === 'select');
      if (selectionChange) {
        const node = nodes.find((n) => n.id === selectionChange.id) ?? null;
        setSelectedNode(selectionChange.selected ? node : null);
      }
    },
    [nodes, onNodesChange]
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: `${type}-${nodes.length + 1}`,
        type,
        position,
        data: {
          label: `New ${type}`,
          description: '',
          isActive: true,
          ...(type === 'basePoints' && { points: 1, minAmount: 0 }),
          ...(type === 'categoryMultiplier' && {
            multiplier: 2,
            category: 'Food & Beverage',
          }),
          ...(type === 'minimumPurchase' && { minAmount: 100 }),
          ...(type === 'maximumPoints' && { maxPoints: 1000 }),
        },
      };

      onNodesChange([{ type: 'add', item: newNode }]);
    },
    [nodes, onNodesChange, screenToFlowPosition]
  );

  return (
    <div className="grid grid-cols-[240px_1fr_320px] gap-4 h-[800px]">
      <RuleSidebar onDragStart={(event, nodeType) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
      }} />

      <div className="border rounded-lg">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          fitView
        >
          <Background />
          <Controls />
          <Panel position="top-right">
            <button
              onClick={() => {
                const elements = toObject();
                console.log(elements);
              }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
            >
              Save Rules
            </button>
          </Panel>
        </ReactFlow>
      </div>

      <RuleProperties
        selectedNode={selectedNode}
        onNodeChange={onNodeDataChange}
      />
    </div>
  );
}