import { Handle, Position } from 'reactflow';
import { RuleNode } from './rule-node';

interface CategoryMultiplierData {
  label: string;
  description?: string;
  multiplier: number;
  category: string;
  isActive: boolean;
}

interface CategoryMultiplierProps {
  id: string;
  data: CategoryMultiplierData;
  selected: boolean;
}

export function CategoryMultiplier({ id, data, selected }: CategoryMultiplierProps) {
  return (
    <RuleNode
      type="categoryMultiplier"
      label={data.label}
      description={data.description}
      metadata={{
        multiplier: data.multiplier,
        category: data.category,
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