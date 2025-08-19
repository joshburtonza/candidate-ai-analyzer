import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { VERTICALS } from '@/config/verticals';
import { useVertical } from '@/context/VerticalContext';

const VerticalSelector: React.FC = () => {
  const { currentVertical, setVertical } = useVertical();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          {currentVertical.name}
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {Object.values(VERTICALS).map((vertical) => (
          <DropdownMenuItem
            key={vertical.id}
            onClick={() => setVertical(vertical.id)}
            className={currentVertical.id === vertical.id ? 'bg-accent' : ''}
          >
            {vertical.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default VerticalSelector;