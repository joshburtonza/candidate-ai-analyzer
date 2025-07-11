import { useState } from 'react';
import { Resume } from '@/types/candidate';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useDeleteCandidate } from '@/hooks/useDeleteCandidate';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Star, 
  GraduationCap, 
  Briefcase, 
  Globe,
  Trash2,
  ExternalLink,
  Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface ResumeListItemProps {
  upload: Resume;
  onDelete?: (deletedId: string) => void;
}

export const ResumeListItem = ({ upload, onDelete }: ResumeListItemProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { deleteCandidate } = useDeleteCandidate();
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!upload.id) return;
    
    setIsDeleting(true);
    try {
      console.log('ResumeListItem: Attempting to delete resume:', upload.id);
      await deleteCandidate(upload.id, 'resumes');
      
      console.log('ResumeListItem: Delete successful, notifying parent');
      if (onDelete) {
        onDelete(upload.id);
      }
      
      toast({
        title: "Candidate Deleted",
        description: `${upload.name} has been removed from your candidates`,
      });
    } catch (error) {
      console.error('ResumeListItem: Delete failed:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete the candidate. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-slate-400';
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBadgeVariant = (score: number | null) => {
    if (!score) return 'secondary';
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const formatSkills = (skills: string[] | null) => {
    if (!skills || skills.length === 0) return 'No skills listed';
    return skills.slice(0, 5).join(', ') + (skills.length > 5 ? '...' : '');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="glass-card elegant-border p-6 hover:scale-[1.01] transition-all duration-300">
      <div className="flex items-start justify-between">
        {/* Main Content */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Name and Title */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-semibold text-white mb-1 text-elegant">
              {upload.name || 'Unknown Candidate'}
            </h3>
            {upload.role_title && (
              <p className="text-brand-gradient text-sm font-medium mb-2">
                {upload.role_title}
              </p>
            )}
            {upload.fit_score && (
              <Badge variant={getScoreBadgeVariant(upload.fit_score)} className="text-xs">
                <Star className="w-3 h-3 mr-1" />
                {upload.fit_score}
              </Badge>
            )}
          </div>

          {/* Contact Info */}
          <div className="lg:col-span-1 space-y-2">
            {upload.email && (
              <div className="flex items-center text-white/80 text-sm">
                <Mail className="w-4 h-4 mr-2 text-brand-gradient flex-shrink-0" />
                <span className="truncate">{upload.email}</span>
              </div>
            )}
            
            {upload.phone && (
              <div className="flex items-center text-white/80 text-sm">
                <Phone className="w-4 h-4 mr-2 text-brand-gradient flex-shrink-0" />
                <span>{upload.phone}</span>
              </div>
            )}
            
            {upload.location && (
              <div className="flex items-center text-white/80 text-sm">
                <MapPin className="w-4 h-4 mr-2 text-brand-gradient flex-shrink-0" />
                <span className="truncate">{upload.location}</span>
              </div>
            )}

            {upload.nationality && (
              <div className="flex items-center text-white/80 text-sm">
                <Globe className="w-4 h-4 mr-2 text-brand-gradient flex-shrink-0" />
                <span>{upload.nationality}</span>
              </div>
            )}
          </div>

          {/* Experience & Education */}
          <div className="lg:col-span-1 space-y-2">
            {upload.experience_years && (
              <div className="flex items-center text-white/70 text-sm">
                <Briefcase className="w-4 h-4 mr-2 text-yellow-400 flex-shrink-0" />
                <span>{upload.experience_years} years</span>
              </div>
            )}
            
            {upload.education_level && (
              <div className="flex items-center text-white/70 text-sm">
                <GraduationCap className="w-4 h-4 mr-2 text-blue-400 flex-shrink-0" />
                <span className="truncate">{upload.education_level}</span>
              </div>
            )}

            <div className="flex items-center text-white/60 text-xs">
              <Calendar className="w-3 h-3 mr-2 flex-shrink-0" />
              <span>{formatDate(upload.created_at)}</span>
            </div>
          </div>

          {/* Skills */}
          <div className="lg:col-span-1">
            <p className="text-white/60 text-xs mb-1">SKILLS</p>
            <p className="text-white/80 text-sm">
              {formatSkills(upload.skills)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 ml-4">
          <Link to={`/candidate/${upload.id}`}>
            <Button 
              variant="outline" 
              size="sm" 
              className="border-brand-gradient/30 text-brand-gradient hover:bg-brand-gradient/10"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View
            </Button>
          </Link>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                disabled={isDeleting}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="glass-card elegant-border">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white">Delete Candidate</AlertDialogTitle>
                <AlertDialogDescription className="text-white/70">
                  Are you sure you want to delete {upload.name}? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-transparent border-white/20 text-white hover:bg-white/10">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
};