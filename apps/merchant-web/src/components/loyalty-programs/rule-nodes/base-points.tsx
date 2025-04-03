import { Handle, Position } from 'reactflow';
import { RuleNode } from './rule-node';

interface BasePointsData {
  label: string;
  description?: string;
  points: number;
  minAmount: number;
  isActive: boolean;
}

interface BasePointsProps {
  id: string;
  data: BasePointsData;
  selected: boolean;
}

export function BasePoints({ id, data, selected }: BasePointsProps) {
  return (
    <RuleNode
      type="basePoints"
      label={data.label}
      description={data.description}
      points={data.points}
      minAmount={data.minAmount}
      isActive={data.isActive}
      selected={selected}
    >
      <Handle
        type="source"
        position={Position.Right}
        id={`${id}-right`}
        style={{ background: '#555' }}
      />
    </RuleNode>
  );
} 