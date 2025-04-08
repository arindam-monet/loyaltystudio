'use client';

import React, { useState } from 'react';
import { Button } from '@loyaltystudio/ui';
import { PlusCircledIcon } from '@loyaltystudio/ui';
import { MerchantOnboardingDialog } from './merchant-onboarding-dialog';

interface AddMerchantButtonProps {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  onSuccess?: () => void;
}

export function AddMerchantButton({ 
  variant = 'default', 
  size = 'default',
  className,
  onSuccess 
}: AddMerchantButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleOpenDialog = () => {
    console.log('Opening merchant dialog from AddMerchantButton');
    setIsDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    console.log(`Dialog open state changed to: ${open}`);
    setIsDialogOpen(open);
  };

  const handleSuccess = () => {
    console.log('Merchant created successfully');
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleOpenDialog}
      >
        <PlusCircledIcon className="mr-2 h-5 w-5" />
        Add Merchant
      </Button>

      <MerchantOnboardingDialog
        open={isDialogOpen}
        onOpenChange={handleDialogOpenChange}
        onSuccess={handleSuccess}
      />
    </>
  );
}
