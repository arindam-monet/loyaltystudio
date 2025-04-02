'use client';

import * as React from 'react';
import {
  cn,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
  Popover,
  PopoverContent,
  PopoverTrigger,
  CaretSortIcon,
  CheckIcon,
  PlusCircledIcon,
} from '@loyaltystudio/ui';
import { useRouter } from 'next/navigation';
import { useMerchants } from '@/hooks/use-merchants';

type PopoverTriggerProps = React.ComponentPropsWithoutRef<typeof PopoverTrigger>

interface MerchantSwitcherProps extends PopoverTriggerProps {
  className?: string;
}

export default function MerchantSwitcher({ 
  className,
}: MerchantSwitcherProps) {
  const router = useRouter();
  const { data: merchants = [], isLoading } = useMerchants();
  const [open, setOpen] = React.useState(false);
  const [selectedMerchant, setSelectedMerchant] = React.useState(
    merchants.find((m) => m.isDefault) || merchants[0]
  );

  // Update selected merchant when merchants data loads
  React.useEffect(() => {
    if (merchants.length > 0) {
      setSelectedMerchant(merchants.find((m) => m.isDefault) || merchants[0]);
    }
  }, [merchants]);

  const handleMerchantSelect = (merchant: typeof merchants[0]) => {
    setSelectedMerchant(merchant);
    setOpen(false);
  };

  const handleCreateMerchant = () => {
    router.push('/onboarding');
    setOpen(false);
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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          aria-label="Select a merchant"
          className={cn('w-full justify-between px-2', className)}
        >
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage
                src={selectedMerchant?.branding?.logo}
                alt={selectedMerchant?.name}
              />
              <AvatarFallback>
                {selectedMerchant?.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start text-sm">
              <span className="font-medium">{selectedMerchant?.name}</span>
              {selectedMerchant?.isDefault && (
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
                  <Avatar className="mr-2 h-5 w-5">
                    <AvatarImage
                      src={merchant.branding?.logo}
                      alt={merchant.name}
                    />
                    <AvatarFallback>
                      {merchant.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {merchant.name}
                  <CheckIcon
                    className={cn(
                      'ml-auto h-4 w-4',
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
              <CommandItem
                onSelect={handleCreateMerchant}
              >
                <PlusCircledIcon className="mr-2 h-5 w-5" />
                Add Merchant
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
} 