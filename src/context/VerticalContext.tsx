import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { VerticalConfig, VERTICALS, DEFAULT_VERTICAL } from '@/config/verticals';
import { FilterPreset, BUILT_IN_PRESETS, DEFAULT_PRESET } from '@/config/filterPresets';
import { useFeatureFlags } from './FeatureFlagsContext';

interface VerticalContextType {
  currentVertical: VerticalConfig;
  currentPreset: FilterPreset;
  setVertical: (verticalId: string) => void;
  setPreset: (presetId: string) => void;
  strictMode: boolean;
  setStrictMode: (strict: boolean) => void;
}

const VerticalContext = createContext<VerticalContextType | undefined>(undefined);

export const useVertical = () => {
  const context = useContext(VerticalContext);
  if (!context) {
    throw new Error('useVertical must be used within a VerticalProvider');
  }
  return context;
};

interface VerticalProviderProps {
  children: ReactNode;
}

export const VerticalProvider: React.FC<VerticalProviderProps> = ({ children }) => {
  const { flags } = useFeatureFlags();
  const [currentVerticalId, setCurrentVerticalId] = useState<string>(DEFAULT_VERTICAL);
  const [currentPresetId, setCurrentPresetId] = useState<string>(DEFAULT_PRESET);
  const [strictMode, setStrictMode] = useState<boolean>(true);

  // Load saved preferences
  useEffect(() => {
    if (flags.enableVerticals) {
      const savedVertical = localStorage.getItem('selectedVertical');
      if (savedVertical && VERTICALS[savedVertical]) {
        setCurrentVerticalId(savedVertical);
      }
    }

    if (flags.enableFilterPresets) {
      const savedPreset = localStorage.getItem('selectedPreset');
      if (savedPreset && BUILT_IN_PRESETS[savedPreset]) {
        setCurrentPresetId(savedPreset);
      }
    }

    const savedStrictMode = localStorage.getItem('strictMode');
    if (savedStrictMode !== null) {
      setStrictMode(JSON.parse(savedStrictMode));
    }
  }, [flags]);

  const setVertical = (verticalId: string) => {
    if (VERTICALS[verticalId]) {
      setCurrentVerticalId(verticalId);
      localStorage.setItem('selectedVertical', verticalId);
    }
  };

  const setPreset = (presetId: string) => {
    if (BUILT_IN_PRESETS[presetId]) {
      setCurrentPresetId(presetId);
      localStorage.setItem('selectedPreset', presetId);
    }
  };

  const handleSetStrictMode = (strict: boolean) => {
    setStrictMode(strict);
    localStorage.setItem('strictMode', JSON.stringify(strict));
  };

  const currentVertical = VERTICALS[currentVerticalId] || VERTICALS[DEFAULT_VERTICAL];
  const currentPreset = BUILT_IN_PRESETS[currentPresetId] || BUILT_IN_PRESETS[DEFAULT_PRESET];

  return (
    <VerticalContext.Provider value={{
      currentVertical,
      currentPreset,
      setVertical,
      setPreset,
      strictMode,
      setStrictMode: handleSetStrictMode,
    }}>
      {children}
    </VerticalContext.Provider>
  );
};