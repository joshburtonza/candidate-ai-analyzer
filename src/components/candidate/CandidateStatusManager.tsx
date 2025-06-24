
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CVUpload } from '@/types/candidate';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { User, MessageSquare, Tag, Calendar, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

interface CandidateStatusManagerProps {
  upload: CVUpload;
  onUpdate: () => void;
}

const CANDIDATE_STATUSES = [
  { value: 'new', label: 'New', color: 'bg-blue-500' },
  { value: 'reviewing', label: 'Reviewing', color: 'bg-yellow-500' },
  { value: 'shortlisted', label: 'Shortlisted', color: 'bg-green-500' },
  { value: 'interviewed', label: 'Interviewed', color: 'bg-purple-500' },
  { value: 'hired', label: 'Hired', color: 'bg-emerald-500' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-500' },
];

const NOTE_TYPES = [
  { value: 'general', label: 'General Note' },
  { value: 'interview', label: 'Interview Note' },
  { value: 'feedback', label: 'Feedback' },
  { value: 'follow-up', label: 'Follow-up' },
];

export const CandidateStatusManager = ({ upload, onUpdate }: CandidateStatusManagerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState(upload.candidate_status || 'new');
  const [notes, setNotes] = useState(upload.notes || '');
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState('general');
  const [newTag, setNewTag] = useState('');
  const [candidateNotes, setCandidateNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const loadCandidateNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('candidate_notes')
        .select('*')
        .eq('upload_id', upload.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCandidateNotes(data || []);
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    loadCandidateNotes();
  };

  const updateCandidateStatus = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('cv_uploads')
        .update({
          candidate_status: status,
          notes: notes,
          last_updated_by: user.id,
        })
        .eq('id', upload.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Candidate status updated successfully",
      });
      
      onUpdate();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update candidate status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addNote = async () => {
    if (!user || !newNote.trim()) return;

    try {
      const { error } = await supabase
        .from('candidate_notes')
        .insert({
          upload_id: upload.id,
          user_id: user.id,
          note_text: newNote,
          note_type: noteType,
        });

      if (error) throw error;

      setNewNote('');
      setNoteType('general');
      await loadCandidateNotes();
      
      toast({
        title: "Success",
        description: "Note added successfully",
      });
    } catch (error: any) {
      console.error('Error adding note:', error);
      toast({
        title: "Error",
        description: "Failed to add note",
        variant: "destructive",
      });
    }
  };

  const addTag = async () => {
    if (!user || !newTag.trim()) return;

    const currentTags = upload.tags || [];
    if (currentTags.includes(newTag)) {
      toast({
        title: "Error",
        description: "Tag already exists",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('cv_uploads')
        .update({
          tags: [...currentTags, newTag],
          last_updated_by: user.id,
        })
        .eq('id', upload.id);

      if (error) throw error;

      setNewTag('');
      onUpdate();
      
      toast({
        title: "Success",
        description: "Tag added successfully",
      });
    } catch (error: any) {
      console.error('Error adding tag:', error);
      toast({
        title: "Error",
        description: "Failed to add tag",
        variant: "destructive",
      });
    }
  };

  const removeTag = async (tagToRemove: string) => {
    if (!user) return;

    try {
      const currentTags = upload.tags || [];
      const { error } = await supabase
        .from('cv_uploads')
        .update({
          tags: currentTags.filter(tag => tag !== tagToRemove),
          last_updated_by: user.id,
        })
        .eq('id', upload.id);

      if (error) throw error;

      onUpdate();
      
      toast({
        title: "Success",
        description: "Tag removed successfully",
      });
    } catch (error: any) {
      console.error('Error removing tag:', error);
      toast({
        title: "Error",
        description: "Failed to remove tag",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (statusValue: string) => {
    const statusConfig = CANDIDATE_STATUSES.find(s => s.value === statusValue);
    return statusConfig || CANDIDATE_STATUSES[0];
  };

  const currentStatus = getStatusBadge(upload.candidate_status || 'new');

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          onClick={handleOpen}
          className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
        >
          <User className="w-4 h-4 mr-2" />
          Manage Candidate
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-gray-700 max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <User className="w-5 h-5" />
            Manage Candidate: {upload.extracted_json?.candidate_name || 'Unknown'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Status & Actions */}
          <div className="space-y-6">
            <Card className="bg-gray-800/50 border-gray-700 p-4">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Status Management
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-white">Current Status</Label>
                  <div className="mt-2">
                    <Badge className={`${currentStatus.color} text-white`}>
                      {currentStatus.label}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-white">Update Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      {CANDIDATE_STATUSES.map((statusOption) => (
                        <SelectItem key={statusOption.value} value={statusOption.value} className="text-white">
                          {statusOption.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-white">General Notes</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add general notes about this candidate..."
                    className="bg-gray-800 border-gray-600 text-white mt-2"
                    rows={4}
                  />
                </div>

                <Button
                  onClick={updateCandidateStatus}
                  disabled={loading}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-black font-semibold"
                >
                  {loading ? 'Updating...' : 'Update Candidate'}
                </Button>
              </div>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700 p-4">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Tags
              </h3>
              
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {(upload.tags || []).map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="bg-orange-500/20 text-orange-400 cursor-pointer"
                      onClick={() => removeTag(tag)}
                    >
                      {tag} ×
                    </Badge>
                  ))}
                  {(!upload.tags || upload.tags.length === 0) && (
                    <p className="text-gray-400 text-sm">No tags added</p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add tag..."
                    className="bg-gray-800 border-gray-600 text-white"
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  />
                  <Button
                    onClick={addTag}
                    variant="outline"
                    className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                  >
                    Add
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Notes */}
          <div className="space-y-6">
            <Card className="bg-gray-800/50 border-gray-700 p-4">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Add New Note
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-white">Note Type</Label>
                  <Select value={noteType} onValueChange={setNoteType}>
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      {NOTE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value} className="text-white">
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-white">Note</Label>
                  <Textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a detailed note..."
                    className="bg-gray-800 border-gray-600 text-white mt-2"
                    rows={4}
                  />
                </div>

                <Button
                  onClick={addNote}
                  disabled={!newNote.trim()}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-black font-semibold"
                >
                  Add Note
                </Button>
              </div>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700 p-4">
              <h3 className="text-white font-semibold mb-4">Notes History</h3>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {candidateNotes.length === 0 ? (
                  <p className="text-gray-400 text-sm">No notes added yet</p>
                ) : (
                  candidateNotes.map((note, index) => (
                    <motion.div
                      key={note.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-gray-700 p-3 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-xs">
                          {NOTE_TYPES.find(t => t.value === note.note_type)?.label || note.note_type}
                        </Badge>
                        <span className="text-xs text-gray-400">
                          {new Date(note.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-white text-sm">{note.note_text}</p>
                    </motion.div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
