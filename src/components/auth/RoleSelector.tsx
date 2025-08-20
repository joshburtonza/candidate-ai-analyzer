
import React from 'react';
import { Check } from 'lucide-react';

interface RoleSelectorProps {
  selectedRole: 'manager' | 'recruiter' | null;
  onRoleSelect: (role: 'manager' | 'recruiter') => void;
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({ selectedRole, onRoleSelect }) => {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-300 block">Select your role</label>
      
      <div className="space-y-2">
        <div 
          onClick={() => onRoleSelect('manager')}
          className={`p-3 rounded-lg border cursor-pointer transition-all ${
            selectedRole === 'manager' 
              ? 'border-brand-primary bg-brand-primary/10' 
              : 'border-slate-500/30 bg-white/5 hover:bg-white/10'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-medium">Manager</div>
              <div className="text-gray-400 text-sm">Access analytics and team insights</div>
            </div>
            {selectedRole === 'manager' && (
              <Check className="w-5 h-5 text-brand-primary" />
            )}
          </div>
        </div>
        
        <div 
          onClick={() => onRoleSelect('recruiter')}
          className={`p-3 rounded-lg border cursor-pointer transition-all ${
            selectedRole === 'recruiter' 
              ? 'border-brand-primary bg-brand-primary/10' 
              : 'border-slate-500/30 bg-white/5 hover:bg-white/10'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-medium">Recruiter</div>
              <div className="text-gray-400 text-sm">Manage candidates and applications</div>
            </div>
            {selectedRole === 'recruiter' && (
              <Check className="w-5 h-5 text-brand-primary" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
