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
  return <header className="glass-card border-b border-white/10 sticky top-0 z-50 elegant-border">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl shadow-lg">
                <Brain className="w-7 h-7 text-black" />
              </div>
              <h1 className="text-2xl font-bold text-white text-elegant tracking-wider">SA RECRUITMENT INTERNAL</h1>
            </div>
            {profile?.is_admin && <span className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black text-xs rounded-full font-semibold text-elegant tracking-wider">
                ADMIN
              </span>}
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-4 h-4" />
              <Input placeholder="Search candidates..." value={searchQuery} onChange={e => onSearchChange(e.target.value)} className="w-64 pl-10 glass-card border-white/20 text-white placeholder:text-white/60 focus:border-yellow-400/50 focus:ring-yellow-400/20" />
            </div>

            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger className="w-32 glass-card border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-card border-white/20 text-white">
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="score">Score</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex glass-card rounded-lg p-1 border-white/20">
              <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="sm" onClick={() => onViewModeChange('grid')} className={`text-white ${viewMode === 'grid' ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black' : 'hover:bg-white/10'}`}>
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" onClick={() => onViewModeChange('list')} className={`text-white ${viewMode === 'list' ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black' : 'hover:bg-white/10'}`}>
                <List className="w-4 h-4" />
              </Button>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="p-0 hover:bg-white/10">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-gradient-to-br from-yellow-400 to-yellow-600 text-black font-semibold">
                      {profile?.full_name?.[0] || profile?.email?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-card border-white/20 text-white">
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