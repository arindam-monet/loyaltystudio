import { create } from 'zustand';
import { Node, Edge } from 'reactflow';

interface Rule {
  id: string;
  name: string;
  description?: string;
  nodes: Node[];
  edges: Edge[];
  createdAt: Date;
  updatedAt: Date;
}

interface RuleStore {
  rules: Rule[];
  selectedRule: Rule | null;
  setSelectedRule: (rule: Rule | null) => void;
  saveRule: (rule: Omit<Rule, 'id' | 'createdAt' | 'updatedAt'>) => void;
  loadRule: (id: string) => void;
  deleteRule: (id: string) => void;
}

export const useRuleStore = create<RuleStore>((set, get) => ({
  rules: [],
  selectedRule: null,

  setSelectedRule: (rule) => set({ selectedRule: rule }),

  saveRule: (ruleData) => {
    const newRule: Rule = {
      ...ruleData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    set((state) => ({
      rules: [...state.rules, newRule],
    }));
  },

  loadRule: (id) => {
    const rule = get().rules.find((r) => r.id === id);
    if (rule) {
      set({ selectedRule: rule });
    }
  },

  deleteRule: (id) => {
    set((state) => ({
      rules: state.rules.filter((r) => r.id !== id),
      selectedRule: state.selectedRule?.id === id ? null : state.selectedRule,
    }));
  },
})); 