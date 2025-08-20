// Types for Dashboard V2 - adapted from example design

export interface DashboardCandidate {
  id: string;
  name: string;
  title: string;
  location: string;
  experience: number;
  availability: string;
  salary: string;
  skills: string[];
  email: string;
  phone: string;
  remote: boolean;
  lastCompany: string;
  verified: boolean;
  current: {
    role: string;
    org: string;
    dates: string;
  };
  education: string[];
  fitScore: number;
  scoreJustification?: string;
  receivedAt: string;
  summary: string;
  avatar: string;
}

export interface DashboardKPI {
  label: string;
  value: number;
  delta: number;
}

export interface ChatMessage {
  text: string;
  when: string;
  who: 'ai' | 'me';
}