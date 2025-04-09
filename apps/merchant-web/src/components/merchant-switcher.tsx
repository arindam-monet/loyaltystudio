'use client';

import * as React from 'react';
import {
  cn,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
  Popover,
  PopoverContent,
  PopoverTrigger,
  CaretSortIcon,
  CheckIcon,
} from '@loyaltystudio/ui';
import { useMerchants } from '@/hooks/use-merchants';
import { useMerchantStore } from '@/lib/stores/merchant-store';
import { AddMerchantButton } from '@/components/add-merchant-button';

type PopoverTriggerProps = React.ComponentPropsWithoutRef<typeof PopoverTrigger>

interface MerchantSwitcherProps extends PopoverTriggerProps {
  className?: string;
}

export default function MerchantSwitcher({
  className,
}: MerchantSwitcherProps) {
  const { data: merchants = [], isLoading, refetch } = useMerchants();
  const [open, setOpen] = React.useState(false);
  const { selectedMerchant, setSelectedMerchant } = useMerchantStore();
  // We don't need sidebarOpen anymore since we're using a placeholder for no merchants
  // const { open: sidebarOpen } = useSidebar();
  const [localSelectedMerchant, setLocalSelectedMerchant] = React.useState<typeof merchants[0] | null>(null);

  // Update selected merchant when merchants data loads
  React.useEffect(() => {
    if (merchants.length === 0) return;

    // Only run this effect when merchants change or when there's no selected merchant
    if (!selectedMerchant) {
      // If no merchant is selected, select the default or first one
      const defaultMerchant = merchants.find((m) => m.isDefault) || merchants[0];
      console.log('No merchant selected, selecting default:', defaultMerchant.name);
      setLocalSelectedMerchant(defaultMerchant);
      setSelectedMerchant(defaultMerchant);
      return;
    }

    // Check if the selected merchant exists in the merchants list
    const currentMerchant = merchants.find(m => m.id === selectedMerchant.id);
    if (!currentMerchant) {
      // If the selected merchant is not in the list, select the default or first one
      const defaultMerchant = merchants.find((m) => m.isDefault) || merchants[0];
      console.log('Selected merchant not found, selecting default:', defaultMerchant.name);
      setLocalSelectedMerchant(defaultMerchant);
      setSelectedMerchant(defaultMerchant);
    } else {
      // Just update the local state to match the current merchant
      // This won't trigger an infinite loop since we're not updating selectedMerchant
      setLocalSelectedMerchant(currentMerchant);
    }
  }, [merchants, selectedMerchant?.id, setSelectedMerchant]);

  const handleMerchantSelect = (merchant: typeof merchants[0]) => {
    setLocalSelectedMerchant(merchant);
    setSelectedMerchant(merchant);
    setOpen(false);
  };

  // Removed unused handleCreateMerchant function

  const handleOnboardingSuccess = () => {
    console.log('Merchant created successfully, refreshing merchants list');
    // Use refetch instead of window.location.reload() to avoid a full page refresh
    if (typeof refetch === 'function') {
      refetch();
    } else {
      console.warn('refetch is not a function, falling back to page reload');
      window.location.reload();
    }
  };

  if (isLoading) {
    return (
      <Button
        variant="ghost"
        className={cn('w-full justify-between px-2', className)}
        disabled
      >
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 animate-pulse rounded-full bg-muted" />
          <div className="flex flex-col items-start gap-1">
            <div className="h-4 w-20 animate-pulse rounded bg-muted" />
            <div className="h-3 w-16 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </Button>
    );
  }

  // If there are no merchants, show a placeholder button that doesn't do anything
  // The actual Add Merchant button will be shown in the warning message in the sidebar
  if (merchants.length === 0) {
    return (
      <Button
        variant="ghost"
        className={cn(
          'w-full justify-between px-2',
          className
        )}
        disabled
      >
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
            <span className="text-xs text-muted-foreground">?</span>
          </div>
          <div className="flex flex-col items-start text-sm">
            <span className="font-medium text-muted-foreground">No Merchants</span>
          </div>
        </div>
      </Button>
    );
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            role="combobox"
            aria-expanded={open}
            aria-label="Select a merchant"
            className={cn(
              'w-full justify-between px-2',
              className
            )}
          >
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage
                  src={(selectedMerchant || localSelectedMerchant)?.branding?.logoUrl || ''}
                  alt={(selectedMerchant || localSelectedMerchant)?.name || ''}
                />
                <AvatarFallback className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary">
                  {(selectedMerchant || localSelectedMerchant)?.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start text-sm">
                <span className="font-medium text-primary dark:text-primary">{(selectedMerchant || localSelectedMerchant)?.name}</span>
                {(selectedMerchant || localSelectedMerchant)?.isDefault && (
                  <span className="text-xs text-muted-foreground">Enterprise</span>
                )}
              </div>
            </div>
            <CaretSortIcon className="ml-auto h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandList>
              <CommandGroup>
                {merchants.map((merchant) => (
                  <CommandItem
                    key={merchant.id}
                    onSelect={() => handleMerchantSelect(merchant)}
                    className="text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage
                          src={merchant.branding?.logoUrl || ''}
                          alt={merchant.name}
                        />
                        <AvatarFallback className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary">
                          {merchant.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{merchant.name}</span>
                    </div>
                    <CheckIcon
                      className={cn(
                        "ml-auto h-4 w-4",
                        selectedMerchant?.id === merchant.id
                          ? 'opacity-100'
                          : 'opacity-0'
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <div className="p-2">
                  <AddMerchantButton
                    variant="outline"
                    className="w-full justify-start"
                    onSuccess={handleOnboardingSuccess}
                  />
                </div>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Debug button removed */}
    </>
  );
}
