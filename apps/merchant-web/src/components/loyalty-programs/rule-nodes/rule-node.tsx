import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardContent, CardHeader, CardTitle } from '@loyaltystudio/ui';

export interface RuleNodeData {
  type: 'FIXED' | 'PERCENTAGE' | 'DYNAMIC';
  label: string;
  description?: string;
  points: number;
  maxPoints?: number;
  minAmount?: number;
  categoryRules?: Record<string, any>;
  timeRules?: Record<string, any>;
  conditions: Record<string, any>;
  metadata?: Record<string, any>;
  isActive: boolean;
}

export const RuleNode = memo(({ data, isConnectable }: NodeProps<RuleNodeData>) => {
  return (
    <Card className="w-[250px] shadow-md">
      <CardHeader className="p-3">
        <CardTitle className="text-sm font-medium">{data.label}</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="space-y-2 text-xs">
          {data.description && (
            <p className="text-muted-foreground">{data.description}</p>
          )}
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Type:</span>
            <span className="font-medium">{data.type}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Points:</span>
            <span className="font-medium">{data.points}</span>
          </div>
          {data.maxPoints && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Max Points:</span>
              <span className="font-medium">{data.maxPoints}</span>
            </div>
          )}
          {data.minAmount && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Min Amount:</span>
              <span className="font-medium">${data.minAmount}</span>
            </div>
          )}
          {Object.keys(data.conditions).length > 0 && (
            <div className="pt-2 border-t">
              <p className="text-muted-foreground mb-1">Conditions:</p>
              <ul className="list-disc list-inside space-y-1">
                {Object.entries(data.conditions).map(([key, value]) => (
                  <li key={key} className="text-muted-foreground">
                    {key}: {JSON.stringify(value)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-primary"
      />
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-primary"
      />
    </Card>
  );
}); 