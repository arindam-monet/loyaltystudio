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
  CommandInput,
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

type PopoverTriggerProps = React.ComponentPropsWithoutRef<typeof PopoverTrigger>

interface MerchantSwitcherProps extends PopoverTriggerProps {
  merchants?: {
    id: string;
    name: string;
    logo?: string;
    isDefault?: boolean;
  }[];
  className?: string;
}

export default function MerchantSwitcher({ 
  className,
  merchants = [
    { id: '1', name: 'Acme Inc', isDefault: true },
    { id: '2', name: 'Acme Corp.' },
    { id: '3', name: 'Evil Corp.' },
  ],
}: MerchantSwitcherProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [selectedMerchant, setSelectedMerchant] = React.useState(
    merchants.find((m) => m.isDefault) || merchants[0]
  );

  const handleMerchantSelect = (merchant: typeof merchants[0]) => {
    setSelectedMerchant(merchant);
    setOpen(false);
  };

  const handleCreateMerchant = () => {
    router.push('/onboarding');
    setOpen(false);
  };

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
                src={selectedMerchant.logo}
                alt={selectedMerchant.name}
              />
              <AvatarFallback>
                {selectedMerchant.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start text-sm">
              <span className="font-medium">{selectedMerchant.name}</span>
              {selectedMerchant.isDefault && (
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
            <CommandInput placeholder="Search team..." />
            <CommandEmpty>No team found.</CommandEmpty>
            <CommandGroup>
              {merchants.map((merchant) => (
                <CommandItem
                  key={merchant.id}
                  onSelect={() => handleMerchantSelect(merchant)}
                  className="text-sm"
                >
                  <Avatar className="mr-2 h-5 w-5">
                    <AvatarImage
                      src={merchant.logo}
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
                Add team
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
} 