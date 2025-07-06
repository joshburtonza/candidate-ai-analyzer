import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Trash2, Download, Users } from 'lucide-react';
import { CVUpload } from '@/types/candidate';
import { useDeleteCandidate } from '@/hooks/useDeleteCandidate';
import { useExport } from '@/hooks/useExport';
import { useToast } from '@/hooks/use-toast';

interface BulkActionsProps {
  uploads: CVUpload[];
  onBulkDelete: (deletedIds: string[]) => void;
}

export const BulkActions = ({ uploads, onBulkDelete }: BulkActionsProps) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const { exportToCSV } = useExport();

  const validCandidates = uploads || [];

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(validCandidates.map(candidate => candidate.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectCandidate = (candidateId: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, candidateId]);
    } else {
      setSelectedIds(prev => prev.filter(id => id !== candidateId));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    setIsDeleting(true);
    try {
      // For now, just call the callback function since we're working with original structure
      onBulkDelete(selectedIds);
      
      toast({
        title: "Candidates Deleted",
        description: `Successfully deleted ${selectedIds.length} candidate(s)`,
      });
      
      setSelectedIds([]);
    } catch (error) {
      console.error('Error deleting candidates:', error);
      toast({
        title: "Error",
        description: "Failed to delete candidates",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkExport = () => {
    const selectedCandidates = validCandidates.filter(candidate => 
      selectedIds.includes(candidate.id)
    );
    
    if (selectedCandidates.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select candidates to export",
        variant: "destructive",
      });
      return;
    }

    // Convert to the format expected by exportToCSV
    const convertedCandidates = selectedCandidates.map(upload => {
      const candidateData = upload.extracted_json as any || {};
      return {
        ...upload,
        extracted_json: candidateData
      };
    });

    exportToCSV(convertedCandidates, 'selected_candidates');
    
    toast({
      title: "Export Started",
      description: `Exporting ${selectedCandidates.length} candidate(s)`,
    });
  };

  if (validCandidates.length === 0) {
    return null;
  }

  return (
    <div className="glass-card elegant-border p-6 rounded-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Checkbox
            checked={selectedIds.length === validCandidates.length && validCandidates.length > 0}
            onCheckedChange={handleSelectAll}
            className="border-slate-400"
          />
          <span className="text-white font-medium">
            Select All ({validCandidates.length} candidates)
          </span>
          {selectedIds.length > 0 && (
            <Badge variant="secondary" className="bg-brand-gradient text-slate-800">
              {selectedIds.length} selected
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <>
              <Button
                onClick={handleBulkExport}
                variant="outline"
                size="sm"
                className="border-green-500/30 text-green-400 hover:bg-green-500/10"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Selected ({selectedIds.length})
              </Button>
              
              <Button
                onClick={handleBulkDelete}
                disabled={isDeleting}
                variant="outline"
                size="sm"
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                {isDeleting ? (
                  <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Delete Selected ({selectedIds.length})
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Individual Selection */}
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {validCandidates.map((candidate) => {
          const candidateData = candidate.extracted_json as any || {};
          const candidateName = candidateData.candidate_name || 'Unknown';
          const email = candidateData.email_address || 'No email';
          const score = parseFloat(candidateData.score || '0');
          const displayScore = score > 10 ? Math.round(score / 10) : Math.round(score);

          return (
            <div key={candidate.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/30">
              <Checkbox
                checked={selectedIds.includes(candidate.id)}
                onCheckedChange={(checked) => handleSelectCandidate(candidate.id, checked as boolean)}
                className="border-slate-400"
              />
              <div className="flex-1 min-w-0">
                <span className="text-white font-medium truncate block">
                  {candidateName}
                </span>
                <span className="text-sm text-gray-400 truncate block">
                  {email}
                </span>
              </div>
              {score > 0 && (
                <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                  {displayScore}/10
                </Badge>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};