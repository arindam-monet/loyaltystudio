import { Card, CardContent, CardHeader, CardTitle } from '@loyaltystudio/ui';

interface RuleNodeType {
  type: string;
  label: string;
  description: string;
  category: 'basic' | 'advanced';
}

const NODE_TYPES: RuleNodeType[] = [
  // Basic Rules
  {
    type: 'basePoints',
    label: 'Base Points',
    description: 'Award points based on spend amount',
    category: 'basic',
  },
  {
    type: 'categoryMultiplier',
    label: 'Category Multiplier',
    description: 'Multiply points for specific categories',
    category: 'basic',
  },
  {
    type: 'minimumPurchase',
    label: 'Minimum Purchase',
    description: 'Set minimum purchase amount for points',
    category: 'basic',
  },
  {
    type: 'maximumPoints',
    label: 'Maximum Points',
    description: 'Cap maximum points per transaction',
    category: 'basic',
  },
  // Advanced Rules
  {
    type: 'timePeriod',
    label: 'Time Period',
    description: 'Time-based rules (happy hours, seasonal)',
    category: 'advanced',
  },
  {
    type: 'customerSegment',
    label: 'Customer Segment',
    description: 'Rules for specific customer segments',
    category: 'advanced',
  },
  {
    type: 'bonusPoints',
    label: 'Bonus Points',
    description: 'Award bonus points for specific actions',
    category: 'advanced',
  },
  {
    type: 'specialRewards',
    label: 'Special Rewards',
    description: 'Special reward-specific rules',
    category: 'advanced',
  },
  {
    type: 'purchasePattern',
    label: 'Purchase Pattern',
    description: 'Rules based on purchase patterns',
    category: 'advanced',
  },
];

interface RuleSidebarProps {
  onDragStart: (event: React.DragEvent, nodeType: string) => void;
}

export function RuleSidebar({ onDragStart }: RuleSidebarProps) {
  const basicNodes = NODE_TYPES.filter(node => node.category === 'basic');
  const advancedNodes = NODE_TYPES.filter(node => node.category === 'advanced');

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Basic Rules</CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <div className="space-y-2">
            {basicNodes.map((node) => (
              <Card
                key={node.type}
                draggable
                onDragStart={(event) => onDragStart(event, node.type)}
                className="cursor-move hover:border-primary transition-colors"
              >
                <CardContent className="p-3">
                  <h3 className="font-medium text-sm">{node.label}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {node.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Advanced Rules</CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <div className="space-y-2">
            {advancedNodes.map((node) => (
              <Card
                key={node.type}
                draggable
                onDragStart={(event) => onDragStart(event, node.type)}
                className="cursor-move hover:border-primary transition-colors"
              >
                <CardContent className="p-3">
                  <h3 className="font-medium text-sm">{node.label}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {node.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 