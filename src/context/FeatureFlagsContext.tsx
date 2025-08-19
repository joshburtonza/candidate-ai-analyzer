import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { FeatureFlags, DEFAULT_FEATURE_FLAGS, getEnvironmentFeatureFlags } from '@/config/featureFlags';

interface FeatureFlagsContextType {
  flags: FeatureFlags;
  updateFlag: (flag: keyof FeatureFlags, value: boolean) => void;
  resetFlags: () => void;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType | undefined>(undefined);

export const useFeatureFlags = () => {
  const context = useContext(FeatureFlagsContext);
  if (!context) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagsProvider');
  }
  return context;
};

interface FeatureFlagsProviderProps {
  children: ReactNode;
}

export const FeatureFlagsProvider: React.FC<FeatureFlagsProviderProps> = ({ children }) => {
  const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FEATURE_FLAGS);

  useEffect(() => {
    // Load user preferences from localStorage
    const savedFlags = localStorage.getItem('featureFlags');
    const userFlags = savedFlags ? JSON.parse(savedFlags) : {};
    
    // Combine defaults, environment, and user preferences
    const environmentFlags = getEnvironmentFeatureFlags();
    const combinedFlags = {
      ...DEFAULT_FEATURE_FLAGS,
      ...userFlags,
      ...environmentFlags, // Environment flags have highest priority
    };
    
    setFlags(combinedFlags);
  }, []);

  const updateFlag = (flag: keyof FeatureFlags, value: boolean) => {
    const newFlags = { ...flags, [flag]: value };
    setFlags(newFlags);
    
    // Save to localStorage (but environment flags will override on next load)
    localStorage.setItem('featureFlags', JSON.stringify(newFlags));
  };

  const resetFlags = () => {
    setFlags(DEFAULT_FEATURE_FLAGS);
    localStorage.removeItem('featureFlags');
  };

  return (
    <FeatureFlagsContext.Provider value={{ flags, updateFlag, resetFlags }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};