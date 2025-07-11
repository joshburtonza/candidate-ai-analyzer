
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Trash2, Download, Users } from 'lucide-react';
import { Resume } from '@/types/candidate';
import { useDeleteCandidate } from '@/hooks/useDeleteCandidate';
import { useExport } from '@/hooks/useExport';
import { useToast } from '@/hooks/use-toast';

interface BulkActionsProps {
  uploads: Resume[];
  onBulkDelete: (deletedIds: string[]) => void;
}

export const BulkActions = ({ uploads, onBulkDelete }: BulkActionsProps) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { deleteCandidate, isDeleting } = useDeleteCandidate();
  const { exportToCSV } = useExport();
  const { toast } = useToast();

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === uploads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(uploads.map(u => u.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    
    const idsToDelete = Array.from(selectedIds);
    let successCount = 0;
    
    for (const id of idsToDelete) {
      const upload = uploads.find(u => u.id === id);
      if (upload) {
        const success = await deleteCandidate(id, upload.name || 'Unknown');
        if (success) successCount++;
      }
    }
    
    if (successCount > 0) {
      onBulkDelete(idsToDelete.slice(0, successCount));
      setSelectedIds(new Set());
      
      toast({
        title: "Bulk Delete Completed",
        description: `Successfully deleted ${successCount} candidate${successCount > 1 ? 's' : ''}`,
      });
    }
  };

  const handleBulkExport = () => {
    if (selectedIds.size === 0) return;
    
    const selectedUploads = uploads.filter(u => selectedIds.has(u.id));
    exportToCSV(selectedUploads, 'selected_candidates');
  };

  if (uploads.length === 0) return null;

  return (
    <div className="glass p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedIds.size === uploads.length}
              onCheckedChange={toggleSelectAll}
              className="border-brand/50 data-[state=checked]:bg-brand-gradient"
            />
            <span className="text-white/80 text-sm">
              Select All ({uploads.length})
            </span>
          </div>
          
          {selectedIds.size > 0 && (
            <Badge variant="secondary" className="glass text-brand border-brand/30">
              <Users className="w-3 h-3 mr-1" />
              {selectedIds.size} selected
            </Badge>
          )}
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <Button
              onClick={handleBulkExport}
              variant="outline"
              size="sm"
              className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover-lift"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Selected
            </Button>
            
            <Button
              onClick={handleBulkDelete}
              variant="outline"
              size="sm"
              disabled={isDeleting}
              className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover-lift"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Selected
            </Button>
          </div>
        )}
      </div>

      {/* Selection indicators for each candidate */}
      <div className="mt-4 grid grid-cols-1 gap-2 max-h-32 overflow-auto">
        {uploads.map(upload => (
          <div key={upload.id} className="flex items-center gap-2 p-2 rounded-lgx glass">
            <Checkbox
              checked={selectedIds.has(upload.id)}
              onCheckedChange={() => toggleSelection(upload.id)}
              className="border-brand/50 data-[state=checked]:bg-brand-gradient"
            />
            <span className="text-white/80 text-sm truncate">
              {upload.name || 'Unknown Candidate'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
