import { Search, Grid3X3, List, User, LogOut, Settings, Brain } from 'lucide-react';
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
  const {
    signOut
  } = useAuth();
  const navigate = useNavigate();
  return <header className="bg-white/5 backdrop-blur-xl border-b border-orange-500/30 sticky top-0 z-50 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg shadow-orange-500/25">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-white">APPLICHUB</h1>
            </div>
            {profile?.is_admin && <span className="px-3 py-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs rounded-full font-medium shadow-lg shadow-orange-500/25">
                ADMIN
              </span>}
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-4 h-4" />
              <Input placeholder="Search candidates..." value={searchQuery} onChange={e => onSearchChange(e.target.value)} className="w-64 pl-10 bg-white/5 backdrop-blur-xl border border-orange-500/30 text-white placeholder:text-white/60 focus:border-orange-500" />
            </div>

            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger className="w-32 bg-white/5 backdrop-blur-xl border border-orange-500/30 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-orange-500/30 text-white">
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="score">Score</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex bg-white/5 backdrop-blur-xl rounded-lg p-1 border border-orange-500/30">
              <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="sm" onClick={() => onViewModeChange('grid')} className={`text-white ${viewMode === 'grid' ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25' : 'hover:bg-white/10'}`}>
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" onClick={() => onViewModeChange('list')} className={`text-white ${viewMode === 'list' ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25' : 'hover:bg-white/10'}`}>
                <List className="w-4 h-4" />
              </Button>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="p-0 hover:bg-white/10">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold">
                      {profile?.full_name?.[0] || profile?.email?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gray-800 border-orange-500/30 text-white">
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
    </header>;
};