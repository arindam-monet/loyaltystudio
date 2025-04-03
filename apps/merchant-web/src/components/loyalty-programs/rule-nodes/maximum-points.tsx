import { Handle, Position } from 'reactflow';
import { RuleNode } from './rule-node';

interface MaximumPointsData {
  label: string;
  description?: string;
  maxPoints: number;
  isActive: boolean;
}

interface MaximumPointsProps {
  id: string;
  data: MaximumPointsData;
  selected: boolean;
}

export function MaximumPoints({ id, data, selected }: MaximumPointsProps) {
  return (
    <RuleNode
      type="maximumPoints"
      label={data.label}
      description={data.description}
      metadata={{
        maxPoints: data.maxPoints,
      }}
      isActive={data.isActive}
      selected={selected}
    >
      <Handle
        type="target"
        position={Position.Left}
        id={`${id}-left`}
        style={{ background: '#555' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id={`${id}-right`}
        style={{ background: '#555' }}
      />
    </RuleNode>
  );
} 