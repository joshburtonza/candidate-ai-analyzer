
import { Search, Grid3X3, List, User, LogOut, Brain, CalendarDays, TrendingDown, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Profile } from '@/types/candidate';

interface DashboardHeaderProps {
  profile: Profile | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  sortBy: 'date' | 'score' | 'name';
  onSortChange: (sort: 'date' | 'score' | 'name') => void;
  onDateRangeChange: (startDate: Date | null, endDate: Date | null) => void;
}

export const DashboardHeader = ({
  profile,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  sortBy,
  onSortChange
}: DashboardHeaderProps) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const isJoshuaAdmin = profile?.email === 'joshuaburton096@gmail.com' && profile?.is_admin;

  return (
    <header className="bg-white/5 backdrop-blur-xl border-b border-slate-400/30 sticky top-0 z-50 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-gradient rounded-lg shadow-lg shadow-slate-400/25">
                <Brain className="w-6 h-6 text-slate-800" />
              </div>
              <h1 className="text-xl font-semibold text-white">APPLICHUB</h1>
            </div>
            {isJoshuaAdmin && (
              <span className="px-3 py-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full font-medium shadow-lg shadow-red-500/25 border border-red-400/30">
                JOSHUA ADMIN
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-white/70 text-sm font-medium">Sort by:</span>
              <Select value={sortBy} onValueChange={onSortChange}>
                <SelectTrigger className="w-40 bg-white/5 backdrop-blur-xl border border-slate-400/30 text-white">
                  <div className="flex items-center gap-2">
                    {sortBy === 'date' && <CalendarDays className="w-4 h-4" />}
                    {sortBy === 'score' && <TrendingUp className="w-4 h-4" />}
                    {sortBy === 'name' && <User className="w-4 h-4" />}
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-slate-400/30 text-white">
                  <SelectItem value="date">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4" />
                      Date (Newest First)
                    </div>
                  </SelectItem>
                  <SelectItem value="score">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Score (Highest First)
                    </div>
                  </SelectItem>
                  <SelectItem value="name">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Name (A-Z)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex bg-white/5 backdrop-blur-xl rounded-lg p-1 border border-slate-400/30">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('grid')}
                className={`text-white ${
                  viewMode === 'grid'
                    ? 'bg-brand-gradient text-slate-800 shadow-lg shadow-slate-400/25'
                    : 'hover:bg-white/10'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('list')}
                className={`text-white ${
                  viewMode === 'list'
                    ? 'bg-brand-gradient text-slate-800 shadow-lg shadow-slate-400/25'
                    : 'hover:bg-white/10'
                }`}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="p-0 hover:bg-white/10">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-brand-gradient text-slate-800 font-semibold">
                      {profile?.full_name?.[0] || profile?.email?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gray-800 border-slate-400/30 text-white">
                <DropdownMenuItem onClick={() => navigate('/account')} className="hover:bg-white/10">
                  <User className="w-4 h-4 mr-2" />
                  Account Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut} className="hover:bg-white/10">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};
