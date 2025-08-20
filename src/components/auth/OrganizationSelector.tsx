import { useState } from 'react';
import { Building2, Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface OrganizationSelectorProps {
  selectedRole: 'manager' | 'recruiter';
  onOrganizationSelect: (orgData: { action: 'create' | 'join'; name?: string; slug?: string }) => void;
}

export const OrganizationSelector = ({ selectedRole, onOrganizationSelect }: OrganizationSelectorProps) => {
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');
  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');

  const handleCreateOrg = () => {
    if (orgName.trim()) {
      onOrganizationSelect({ 
        action: 'create', 
        name: orgName.trim(),
        slug: orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      });
    }
  };

  const handleJoinOrg = () => {
    if (orgSlug.trim()) {
      onOrganizationSelect({ 
        action: 'join', 
        slug: orgSlug.trim()
      });
    }
  };

  if (mode === 'select') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-white mb-2">
            Organization Setup
          </h3>
          <p className="text-white/70">
            {selectedRole === 'manager' 
              ? "Create your organization or join an existing one"
              : "Join your organization"
            }
          </p>
        </div>

        <div className="space-y-4">
          {selectedRole === 'manager' && (
            <button
              onClick={() => setMode('create')}
              className="w-full p-6 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-all duration-200 text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="text-white font-medium">Create Organization</h4>
                  <p className="text-white/70 text-sm">Start a new organization and invite team members</p>
                </div>
              </div>
            </button>
          )}

          <button
            onClick={() => setMode('join')}
            className="w-full p-6 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-all duration-200 text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center group-hover:bg-secondary/30 transition-colors">
                <Users className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <h4 className="text-white font-medium">Join Organization</h4>
                <p className="text-white/70 text-sm">Join an existing organization with an invite code</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'create') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-white mb-2">
            Create Organization
          </h3>
          <p className="text-white/70">
            Give your organization a name to get started
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="orgName" className="text-white">Organization Name</Label>
            <Input
              id="orgName"
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Enter organization name"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => setMode('select')}
              variant="outline"
              className="flex-1 bg-transparent border-white/20 text-white hover:bg-white/10"
            >
              Back
            </Button>
            <Button
              onClick={handleCreateOrg}
              disabled={!orgName.trim()}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-white mb-2">
          Join Organization
        </h3>
        <p className="text-white/70">
          Enter your organization's invite code or slug
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="orgSlug" className="text-white">Organization Code</Label>
          <Input
            id="orgSlug"
            type="text"
            value={orgSlug}
            onChange={(e) => setOrgSlug(e.target.value)}
            placeholder="Enter organization code"
            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
          />
        </div>

        <div className="flex gap-3">
          <Button
            onClick={() => setMode('select')}
            variant="outline"
            className="flex-1 bg-transparent border-white/20 text-white hover:bg-white/10"
          >
            Back
          </Button>
          <Button
            onClick={handleJoinOrg}
            disabled={!orgSlug.trim()}
            className="flex-1 bg-secondary hover:bg-secondary/90"
          >
            <Users className="w-4 h-4 mr-2" />
            Join
          </Button>
        </div>
      </div>
    </div>
  );
};