import React from 'react';
import { SimpleTierManager } from './simple-tier-manager';

// Define the tier types that match our form schema
interface TierWithOptionalBenefits {
  id?: string;
  name: string;
  description?: string;
  pointsThreshold: number;
  benefits?: string[];
}

interface TierWithRequiredBenefits {
  id?: string;
  name: string;
  description?: string;
  pointsThreshold: number;
  benefits: string[];
}

interface TierManagerWrapperProps {
  tiers: TierWithOptionalBenefits[];
  onTiersChange: (tiers: TierWithOptionalBenefits[]) => void;
}

export function TierManagerWrapper({ tiers, onTiersChange }: TierManagerWrapperProps) {
  // Convert tiers with optional benefits to tiers with required benefits
  const tiersWithBenefits: TierWithRequiredBenefits[] = tiers.map(tier => ({
    ...tier,
    benefits: tier.benefits || []
  }));

  // Handle changes from the SimpleTierManager
  const handleTiersChange = (updatedTiers: TierWithRequiredBenefits[]) => {
    // Pass the updated tiers back to the parent component
    onTiersChange(updatedTiers);
  };

  return (
    <SimpleTierManager
      tiers={tiersWithBenefits}
      onTiersChange={handleTiersChange}
    />
  );
}
