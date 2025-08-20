
import React from 'react';
import { Check } from 'lucide-react';

interface RoleSelectorProps {
  selectedRole: 'manager' | 'recruiter' | null;
  onRoleSelect: (role: 'manager' | 'recruiter') => void;
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({ selectedRole, onRoleSelect }) => {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-v2-muted-foreground block">Select your role</label>
      
      <div className="space-y-2">
        <div 
          onClick={() => onRoleSelect('manager')}
          className={`p-3 rounded-lg border cursor-pointer transition-all ${
            selectedRole === 'manager' 
              ? 'border-v2-primary bg-v2-primary/10' 
              : 'border-v2-border bg-v2-card/50 hover:bg-v2-card'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-v2-foreground font-medium">Manager</div>
              <div className="text-v2-muted-foreground text-sm">Access analytics and team insights</div>
            </div>
            {selectedRole === 'manager' && (
              <Check className="w-5 h-5 text-v2-primary" />
            )}
          </div>
        </div>
        
        <div 
          onClick={() => onRoleSelect('recruiter')}
          className={`p-3 rounded-lg border cursor-pointer transition-all ${
            selectedRole === 'recruiter' 
              ? 'border-v2-primary bg-v2-primary/10' 
              : 'border-v2-border bg-v2-card/50 hover:bg-v2-card'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-v2-foreground font-medium">Recruiter</div>
              <div className="text-v2-muted-foreground text-sm">Manage candidates and applications</div>
            </div>
            {selectedRole === 'recruiter' && (
              <Check className="w-5 h-5 text-v2-primary" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
