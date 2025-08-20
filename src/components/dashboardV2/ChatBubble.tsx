// Dashboard V2 Chat Bubble Component

import React from 'react';
import { ChatMessage } from '@/types/dashboardV2';

interface ChatBubbleProps {
  message: ChatMessage;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.who === 'me';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div 
        className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
          isUser 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-secondary text-secondary-foreground'
        }`}
      >
        <div>{message.text}</div>
        <div className="mt-1 text-[11px] opacity-70">{message.when}</div>
      </div>
    </div>
  );
}