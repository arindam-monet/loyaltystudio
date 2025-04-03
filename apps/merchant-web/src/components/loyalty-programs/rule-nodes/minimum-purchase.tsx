import { Handle, Position } from 'reactflow';
import { RuleNode } from './rule-node';

interface MinimumPurchaseData {
  label: string;
  description?: string;
  minAmount: number;
  isActive: boolean;
}

interface MinimumPurchaseProps {
  id: string;
  data: MinimumPurchaseData;
  selected: boolean;
}

export function MinimumPurchase({ id, data, selected }: MinimumPurchaseProps) {
  return (
    <RuleNode
      type="minimumPurchase"
      label={data.label}
      description={data.description}
      metadata={{
        minAmount: data.minAmount,
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