import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Info } from 'lucide-react';
import { useFeatureFlags } from '@/context/FeatureFlagsContext';

const FeatureFlagSettings: React.FC = () => {
  const { flags, updateFlag, resetFlags } = useFeatureFlags();

  return (
    <div className="space-y-6">
      <Card className="bg-white/10 backdrop-blur-xl border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Feature Flags</CardTitle>
          <CardDescription className="text-slate-300">
            Enable experimental features. These can be disabled at any time.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="border-amber-500/20 bg-amber-500/10">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-amber-200">
              These are experimental features. They can be disabled at any time without affecting core functionality.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="verticals" className="text-white font-medium">
                  Vertical Specializations
                </Label>
                <p className="text-sm text-slate-300">
                  Switch between different industry verticals (Education, Tech, Healthcare, etc.)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  Beta
                </Badge>
                <Switch
                  id="verticals"
                  checked={flags.enableVerticals}
                  onCheckedChange={(checked) => updateFlag('enableVerticals', checked)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="presets" className="text-white font-medium">
                  Filter Presets
                </Label>
                <p className="text-sm text-slate-300">
                  Create and manage custom filter presets for different hiring scenarios
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  Beta
                </Badge>
                <Switch
                  id="presets"
                  checked={flags.enableFilterPresets}
                  onCheckedChange={(checked) => updateFlag('enableFilterPresets', checked)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="dynamic" className="text-white font-medium">
                  Dynamic Ingestion Rules
                </Label>
                <p className="text-sm text-slate-300">
                  Configure ingestion rules per organization (requires backend changes)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Coming Soon
                </Badge>
                <Switch
                  id="dynamic"
                  checked={flags.enableDynamicIngestion}
                  onCheckedChange={(checked) => updateFlag('enableDynamicIngestion', checked)}
                  disabled
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="advanced-filters" className="text-white font-medium">
                  Advanced Filters
                </Label>
                <p className="text-sm text-slate-300">
                  Enhanced search and filtering with source email, date range, and more options
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  Beta
                </Badge>
                <Switch
                  id="advanced-filters"
                  checked={flags.enableAdvancedFilters}
                  onCheckedChange={(checked) => updateFlag('enableAdvancedFilters', checked)}
                />
              </div>
            </div>
          </div>

          <Alert className="border-blue-500/20 bg-blue-500/10">
            <Info className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-blue-200">
              URL parameters can override these settings: ?verticals=true&presets=true
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeatureFlagSettings;