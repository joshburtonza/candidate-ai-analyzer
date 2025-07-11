import { useState } from 'react';
import { motion } from 'framer-motion';
import { Resume } from '@/types/candidate';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface ResumeCardProps {
  upload: Resume;
  onDelete?: (deletedId: string) => void;
}

export const ResumeCard = ({ upload, onDelete }: ResumeCardProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { deleteCandidate } = useDeleteCandidate();
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!upload.id) return;
    
    setIsDeleting(true);
    try {
      console.log('ResumeCard: Attempting to delete resume:', upload.id);
      await deleteCandidate(upload.id, 'resumes');
      
      console.log('ResumeCard: Delete successful, notifying parent');
      if (onDelete) {
        onDelete(upload.id);
      }
      
      toast({
        title: "Candidate Deleted",
        description: `${upload.name} has been removed from your candidates`,
      });
    } catch (error) {
      console.error('ResumeCard: Delete failed:', error);
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
    return skills.slice(0, 3).join(', ') + (skills.length > 3 ? '...' : '');
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <Card className="glass-card elegant-border overflow-hidden group hover:scale-[1.02] transition-all duration-300 h-full flex flex-col">
        <div className="p-6 flex-1 flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-white mb-2 text-elegant">
                {upload.name || 'Unknown Candidate'}
              </h3>
              {upload.role_title && (
                <p className="text-brand-gradient text-sm font-medium">
                  {upload.role_title}
                </p>
              )}
            </div>
            
            {upload.fit_score && (
              <Badge variant={getScoreBadgeVariant(upload.fit_score)} className="ml-2">
                <Star className="w-3 h-3 mr-1" />
                {upload.fit_score}
              </Badge>
            )}
          </div>

          {/* Contact Info */}
          <div className="space-y-3 mb-4 flex-1">
            {upload.email && (
              <div className="flex items-center text-white/80 text-sm">
                <Mail className="w-4 h-4 mr-2 text-brand-gradient" />
                <span className="truncate">{upload.email}</span>
              </div>
            )}
            
            {upload.phone && (
              <div className="flex items-center text-white/80 text-sm">
                <Phone className="w-4 h-4 mr-2 text-brand-gradient" />
                <span>{upload.phone}</span>
              </div>
            )}
            
            {upload.location && (
              <div className="flex items-center text-white/80 text-sm">
                <MapPin className="w-4 h-4 mr-2 text-brand-gradient" />
                <span className="truncate">{upload.location}</span>
              </div>
            )}

            {upload.nationality && (
              <div className="flex items-center text-white/80 text-sm">
                <Globe className="w-4 h-4 mr-2 text-brand-gradient" />
                <span>{upload.nationality}</span>
              </div>
            )}
          </div>

          {/* Experience & Education */}
          <div className="space-y-2 mb-4">
            {upload.experience_years && (
              <div className="flex items-center text-white/70 text-sm">
                <Briefcase className="w-4 h-4 mr-2 text-yellow-400" />
                <span>{upload.experience_years} years experience</span>
              </div>
            )}
            
            {upload.education_level && (
              <div className="flex items-center text-white/70 text-sm">
                <GraduationCap className="w-4 h-4 mr-2 text-blue-400" />
                <span className="truncate">{upload.education_level}</span>
              </div>
            )}
          </div>

          {/* Skills */}
          {upload.skills && upload.skills.length > 0 && (
            <div className="mb-4">
              <p className="text-white/60 text-xs mb-2">SKILLS</p>
              <p className="text-white/80 text-sm truncate">
                {formatSkills(upload.skills)}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t border-white/10 mt-auto">
            <Link to={`/candidate/${upload.id}`} className="flex-1">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full border-brand-gradient/30 text-brand-gradient hover:bg-brand-gradient/10"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Details
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
      </Card>
    </motion.div>
  );
};