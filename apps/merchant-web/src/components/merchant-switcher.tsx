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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  }[];
  className?: string;
}

export default function MerchantSwitcher({ 
  className,
  merchants = [],
}: MerchantSwitcherProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [showNewMerchantDialog, setShowNewMerchantDialog] = React.useState(false);
  const [selectedMerchant, setSelectedMerchant] = React.useState(merchants[0]);

  const handleMerchantSelect = (merchant: typeof merchants[0]) => {
    setSelectedMerchant(merchant);
    setOpen(false);
  };

  const handleCreateMerchant = () => {
    setShowNewMerchantDialog(false);
    router.push('/onboarding');
  };

  return (
    <Dialog open={showNewMerchantDialog} onOpenChange={setShowNewMerchantDialog}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Select a merchant"
            className={cn('w-[200px] justify-between', className)}
          >
            {selectedMerchant ? (
              <>
                <Avatar className="mr-2 h-5 w-5">
                  <AvatarImage
                    src={selectedMerchant.logo}
                    alt={selectedMerchant.name}
                  />
                  <AvatarFallback>
                    {selectedMerchant.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {selectedMerchant.name}
              </>
            ) : (
              'Select merchant...'
            )}
            <CaretSortIcon className="ml-auto h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandList>
              <CommandInput placeholder="Search merchant..." />
              <CommandEmpty>No merchant found.</CommandEmpty>
              {merchants.length > 0 ? (
                <CommandGroup heading="Merchants">
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
              ) : null}
            </CommandList>
            <CommandSeparator />
            <CommandList>
              <CommandGroup>
                <CommandItem
                  onSelect={() => setShowNewMerchantDialog(true)}
                >
                  <PlusCircledIcon className="mr-2 h-5 w-5" />
                  Create New Merchant
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create merchant</DialogTitle>
          <DialogDescription>
            Add a new merchant to start managing their loyalty program.
          </DialogDescription>
        </DialogHeader>
        <div>
          <Button onClick={handleCreateMerchant}>
            Continue
          </Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowNewMerchantDialog(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 