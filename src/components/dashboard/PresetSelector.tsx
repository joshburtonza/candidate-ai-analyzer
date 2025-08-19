import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Filter } from 'lucide-react';
import { BUILT_IN_PRESETS } from '@/config/filterPresets';
import { useVertical } from '@/context/VerticalContext';

const PresetSelector: React.FC = () => {
  const { currentPreset, setPreset, currentVertical } = useVertical();

  // Filter presets by current vertical
  const availablePresets = Object.values(BUILT_IN_PRESETS).filter(
    preset => preset.verticalId === currentVertical.id || preset.verticalId === 'generic'
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Filter className="w-4 h-4 mr-2" />
          {currentPreset.name}
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {availablePresets.map((preset, index) => (
          <React.Fragment key={preset.id}>
            {index > 0 && preset.verticalId !== availablePresets[index - 1].verticalId && (
              <DropdownMenuSeparator />
            )}
            <DropdownMenuItem
              onClick={() => setPreset(preset.id)}
              className={currentPreset.id === preset.id ? 'bg-accent' : ''}
            >
              <div className="flex flex-col items-start">
                <span className="font-medium">{preset.name}</span>
                <span className="text-xs text-muted-foreground">
                  {preset.description}
                </span>
              </div>
            </DropdownMenuItem>
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default PresetSelector;