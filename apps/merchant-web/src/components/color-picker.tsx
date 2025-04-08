'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@loyaltystudio/ui';
import { Popover, PopoverContent, PopoverTrigger } from '@loyaltystudio/ui';
import { cn } from '@loyaltystudio/ui';

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentColor, setCurrentColor] = useState(value || '#000000');
  const colorInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrentColor(value);
  }, [value]);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setCurrentColor(newColor);
    onChange(newColor);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newColor = e.target.value;
    
    // Add # if missing
    if (newColor && !newColor.startsWith('#')) {
      newColor = `#${newColor}`;
    }
    
    // Validate hex color
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(newColor)) {
      setCurrentColor(newColor);
      onChange(newColor);
    } else {
      setCurrentColor(newColor);
    }
  };

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="w-10 h-10 rounded-md border border-input shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            style={{ backgroundColor: currentColor }}
            aria-label="Pick a color"
          />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" align="start">
          <div className="flex flex-col gap-2">
            <input
              ref={colorInputRef}
              type="color"
              value={currentColor}
              onChange={handleColorChange}
              className="w-32 h-32 cursor-pointer border-0 p-0 m-0"
              style={{ appearance: 'auto' }}
            />
            <div className="text-xs text-center text-muted-foreground">
              Click to select a color
            </div>
          </div>
        </PopoverContent>
      </Popover>
      <Input
        value={currentColor}
        onChange={handleInputChange}
        className="w-24 font-mono text-sm"
        maxLength={7}
      />
    </div>
  );
}
