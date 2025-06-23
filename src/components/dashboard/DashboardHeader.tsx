
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
  const { signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="header-bg sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500 rounded-lg">
                <Brain className="w-6 h-6 text-black" />
              </div>
              <h1 className="text-xl font-semibold text-white">SA RECRUITMENT INTERNAL</h1>
            </div>
            {profile?.is_admin && (
              <span className="px-3 py-1 bg-orange-500 text-black text-xs rounded-full font-medium">
                ADMIN
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-4 h-4" />
              <Input 
                placeholder="Search candidates..." 
                value={searchQuery} 
                onChange={e => onSearchChange(e.target.value)} 
                className="w-64 pl-10 bg-gray-800 border-gray-600 text-white placeholder:text-white/60 focus:border-orange-500"
              />
            </div>

            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger className="w-32 bg-gray-800 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600 text-white">
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="score">Score</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-600">
              <Button 
                variant={viewMode === 'grid' ? 'default' : 'ghost'} 
                size="sm" 
                onClick={() => onViewModeChange('grid')} 
                className={`text-white ${viewMode === 'grid' ? 'bg-orange-500 text-black' : 'hover:bg-gray-700'}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button 
                variant={viewMode === 'list' ? 'default' : 'ghost'} 
                size="sm" 
                onClick={() => onViewModeChange('list')} 
                className={`text-white ${viewMode === 'list' ? 'bg-orange-500 text-black' : 'hover:bg-gray-700'}`}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="p-0 hover:bg-gray-700">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-orange-500 text-black font-semibold">
                      {profile?.full_name?.[0] || profile?.email?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gray-800 border-gray-600 text-white">
                <DropdownMenuItem onClick={() => navigate('/account')} className="hover:bg-gray-700">
                  <User className="w-4 h-4 mr-2" />
                  Account Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut} className="hover:bg-gray-700">
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
