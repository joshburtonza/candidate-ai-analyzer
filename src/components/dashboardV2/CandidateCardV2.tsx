// Dashboard V2 Candidate Card Component

import React from 'react';
import { motion } from 'framer-motion';
import { 
  BadgeCheck, 
  Mail, 
  Phone, 
  ChevronDown, 
  ChevronUp, 
  Eye, 
  BookmarkCheck, 
  MessageSquare, 
  Calendar, 
  CheckCircle2 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashCard, DashButton, DashBadge, Progress } from './DashboardV2Atoms';
import { DashboardCandidate } from '@/types/dashboardV2';

interface CandidateCardV2Props {
  candidate: DashboardCandidate;
  onShortlist: (id: string) => void;
  open: boolean;
  onToggle: () => void;
}

export function CandidateCardV2({ candidate, onShortlist, open, onToggle }: CandidateCardV2Props) {
  const navigate = useNavigate();

  const handleViewProfile = () => {
    navigate(`/candidate/${candidate.id}`);
  };

  const handleMessage = () => {
    // TODO: Implement messaging system
    console.log('Message candidate:', candidate.name);
  };

  const handleSchedule = () => {
    // TODO: Implement scheduling system  
    console.log('Schedule interview with:', candidate.name);
  };

  return (
    <DashCard className="p-0 overflow-hidden hover-lift">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 p-5">
        <div className="flex items-start gap-4">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-secondary">
            <img 
              alt={`${candidate.name} avatar`} 
              src={candidate.avatar} 
              className="h-full w-full object-cover" 
              onError={(e) => {
                e.currentTarget.src = '/placeholder.svg';
              }}
            />
            {candidate.verified && (
              <BadgeCheck className="absolute -right-1 -bottom-1 h-4 w-4 rounded-full bg-card text-green-500" />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-base font-semibold text-foreground">{candidate.name}</div>
              <DashBadge>{candidate.location}</DashBadge>
              <DashBadge>{candidate.experience} yrs</DashBadge>
              <DashBadge>{candidate.receivedAt}</DashBadge>
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {candidate.title} • Expected <span className="text-foreground">{candidate.salary}</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-foreground">
              <span className="inline-flex items-center gap-2">
                <Mail className="h-4 w-4 opacity-70" /> 
                {candidate.email}
              </span>
              <span className="inline-flex items-center gap-2">
                <Phone className="h-4 w-4 opacity-70" /> 
                {candidate.phone}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-secondary border border-border">
            <span className="text-base font-semibold text-foreground">{candidate.fitScore}</span>
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">Score</div>
          <button 
            onClick={onToggle} 
            aria-expanded={open} 
            className="mt-2 inline-flex items-center gap-1 text-xs text-foreground hover:text-primary transition-colors"
          >
            {open ? 'Hide details' : 'View details'} 
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Fit score bar (always visible) */}
      <div className="px-5 pb-3">
        <div className="text-xs text-muted-foreground">Fit score</div>
        <Progress value={candidate.fitScore * 10} />
      </div>

      {/* Collapsible details */}
      <motion.div 
        initial={false} 
        animate={{ 
          height: open ? 'auto' : 0, 
          opacity: open ? 1 : 0 
        }} 
        transition={{ duration: 0.2 }}
        style={{ overflow: 'hidden' }}
      >
        <div className="space-y-5 border-t border-border p-5">
          {/* Current Employment */}
          <div>
            <div className="mb-1 text-xs font-semibold tracking-wider text-foreground">CURRENT EMPLOYMENT</div>
            <div className="text-sm font-medium text-foreground">{candidate.current.role}</div>
            <div className="text-sm text-muted-foreground">{candidate.current.org}</div>
            <div className="text-xs text-muted-foreground">{candidate.current.dates}</div>
          </div>

          {/* Education */}
          <div>
            <div className="mb-1 text-xs font-semibold tracking-wider text-foreground">EDUCATION</div>
            <div className="text-sm font-medium text-foreground">{candidate.education[0]}</div>
            {candidate.education[1] && (
              <div className="text-xs text-muted-foreground">{candidate.education[1]}</div>
            )}
          </div>

          {/* Skills */}
          <div>
            <div className="mb-1 text-xs font-semibold tracking-wider text-foreground">SKILLS</div>
            <div className="flex gap-2 overflow-x-auto whitespace-nowrap rounded-xl p-2 border border-border bg-secondary/50">
              {candidate.skills.map((skill) => (
                <span 
                  key={skill} 
                  className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs border border-border bg-card text-foreground"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> 
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Score justification */}
          {candidate.scoreJustification && (
            <div>
              <div className="mb-1 text-xs font-semibold tracking-wider text-foreground">SCORE JUSTIFICATION</div>
              <p className="text-sm leading-relaxed text-foreground">{candidate.scoreJustification}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <DashButton variant="primary" className="!px-3" onClick={handleViewProfile}>
              <Eye className="h-4 w-4" /> View profile
            </DashButton>
            <DashButton className="!px-3" onClick={() => onShortlist(candidate.id)}>
              <BookmarkCheck className="h-4 w-4" /> Shortlist
            </DashButton>
            <DashButton variant="soft" className="!px-3" onClick={handleMessage}>
              <MessageSquare className="h-4 w-4" /> Message
            </DashButton>
            <DashButton variant="soft" className="!px-3" onClick={handleSchedule}>
              <Calendar className="h-4 w-4" /> Schedule
            </DashButton>
          </div>
        </div>
      </motion.div>
    </DashCard>
  );
}