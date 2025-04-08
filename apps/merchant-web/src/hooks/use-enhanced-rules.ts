import { useState, useCallback, useEffect } from 'react';
import { toast } from '@loyaltystudio/ui';
import { apiClient } from '@/lib/api-client';

// Define types for our rule structure
export interface RuleCondition {
  type: string;
  operator: string;
  value: string;
}

export interface RuleEffect {
  type: string;
  value: string;
  formula?: string;
}

export interface Rule {
  name: string;
  description?: string;
  isActive: boolean;
  conditions: RuleCondition[];
  effects: RuleEffect[];
}

// Convert our UI-friendly rule format to the API format
const convertToApiFormat = (rules: Rule[]) => {
  return rules.map(rule => {
    // Determine the rule type based on the first effect
    const primaryEffect = rule.effects[0];
    let ruleType = 'FIXED';

    if (primaryEffect.formula === 'percentage') {
      ruleType = 'PERCENTAGE';
    } else if (primaryEffect.type === 'applyDiscount') {
      ruleType = 'PERCENTAGE';
    }

    // Extract points value from effects
    let points = 0;
    let maxPoints = undefined;
    let minAmount = undefined;

    // Process effects
    for (const effect of rule.effects) {
      if (effect.type === 'addPoints') {
        points = parseInt(effect.value) || 0;
      }
    }

    // Process conditions
    const conditionsObj: Record<string, any> = {};
    const categoryRules: Record<string, any> = {};
    const timeRules: Record<string, any> = {};

    for (const condition of rule.conditions) {
      if (condition.type === 'cartValue' && condition.operator === 'greaterThan') {
        minAmount = parseFloat(condition.value) || 0;
      } else if (condition.type === 'cartValue' && condition.operator === 'lessThan') {
        maxPoints = parseInt(condition.value) || 1000;
      } else if (condition.type === 'purchaseCategory') {
        categoryRules[condition.value] = { multiplier: 1.5 };
      } else if (condition.type === 'dayOfWeek' || condition.type === 'timeOfDay') {
        if (!timeRules.dayOfWeek) timeRules.dayOfWeek = [];
        if (condition.type === 'dayOfWeek') {
          timeRules.dayOfWeek.push(condition.value.toUpperCase());
        }
      }

      // Add to general conditions object
      conditionsObj[condition.type] = {
        operator: condition.operator,
        value: condition.value
      };
    }

    // Create the API-compatible rule object
    return {
      name: rule.name,
      description: rule.description || '',
      type: ruleType,
      conditions: conditionsObj,
      points,
      maxPoints,
      minAmount,
      categoryRules: Object.keys(categoryRules).length > 0 ? categoryRules : undefined,
      timeRules: Object.keys(timeRules).length > 0 ? timeRules : undefined,
      isActive: rule.isActive
    };
  });
};

// Convert from API format to our UI-friendly format
const convertFromApiFormat = (apiRules: any[]): Rule[] => {
  return apiRules.map(apiRule => {
    const conditions: RuleCondition[] = [];
    const effects: RuleEffect[] = [];

    // Process conditions
    if (apiRule.conditions) {
      // Handle minAmount condition
      if (apiRule.minAmount) {
        conditions.push({
          type: 'cartValue',
          operator: 'greaterThan',
          value: apiRule.minAmount.toString()
        });
      }

      // Handle category rules
      if (apiRule.categoryRules) {
        Object.keys(apiRule.categoryRules).forEach(category => {
          conditions.push({
            type: 'purchaseCategory',
            operator: 'equals',
            value: category
          });
        });
      }

      // Handle time rules
      if (apiRule.timeRules && apiRule.timeRules.dayOfWeek) {
        apiRule.timeRules.dayOfWeek.forEach((day: string) => {
          conditions.push({
            type: 'dayOfWeek',
            operator: 'equals',
            value: day
          });
        });
      }

      // Add a default condition if none were created
      if (conditions.length === 0) {
        conditions.push({
          type: 'cartValue',
          operator: 'greaterThan',
          value: '0'
        });
      }
    }

    // Process effects - always add points effect
    effects.push({
      type: 'addPoints',
      value: apiRule.points.toString(),
      formula: apiRule.type === 'PERCENTAGE' ? 'percentage' : 'fixed'
    });

    return {
      name: apiRule.name,
      description: apiRule.description || '',
      isActive: apiRule.isActive !== false, // Default to true if not specified
      conditions,
      effects
    };
  });
};

export function useEnhancedRules(programId: string) {
  const [rules, setRules] = useState<Rule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load rules from API
  const loadRules = useCallback(async () => {
    if (!programId) {
      console.error('Cannot load rules: programId is missing');
      return;
    }

    console.log('Loading rules for program:', programId);
    setIsLoading(true);
    setError(null);

    try {
      console.log(`Making API call to /loyalty-programs/${programId}`);
      const response = await apiClient.get(`/loyalty-programs/${programId}`);
      console.log('API response:', response);
      const program = response.data;

      if (program.pointsRules && program.pointsRules.length > 0) {
        console.log('Found rules in program:', program.pointsRules);
        const convertedRules = convertFromApiFormat(program.pointsRules);
        console.log('Converted rules to UI format:', convertedRules);
        setRules(convertedRules);
      } else {
        console.log('No rules found, setting empty array');
        // Set empty rules array if no rules exist
        setRules([]);
      }
    } catch (err: any) {
      console.error('Error loading rules:', err);
      setError(err.message || 'Failed to load rules');
      toast({
        title: 'Error',
        description: 'Failed to load rules. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [programId]);

  // Save rules to API
  const saveRules = useCallback(async (updatedRules: Rule[]) => {
    if (!programId) {
      console.error('Cannot save rules: programId is missing');
      return false;
    }

    console.log('Saving rules for program:', programId, updatedRules);
    setIsLoading(true);
    setError(null);

    try {
      const apiRules = convertToApiFormat(updatedRules);
      console.log('Converted rules to API format:', apiRules);

      // Update the loyalty program with the new rules using the dedicated endpoint
      console.log(`Making API call to /loyalty-programs/${programId}/points-rules`);
      const response = await apiClient.put(`/loyalty-programs/${programId}/points-rules`, {
        pointsRules: apiRules
      });
      console.log('API response:', response);

      setRules(updatedRules);

      toast({
        title: 'Success',
        description: 'Rules saved successfully',
        variant: 'default'
      });

      return true;
    } catch (err: any) {
      console.error('Error saving rules:', err);
      setError(err.message || 'Failed to save rules');
      toast({
        title: 'Error',
        description: 'Failed to save rules. Please try again.',
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [programId]);

  // Load rules on initial render
  useEffect(() => {
    if (programId) {
      loadRules();
    }
  }, [programId, loadRules]);

  return {
    rules,
    isLoading,
    error,
    loadRules,
    saveRules
  };
}
