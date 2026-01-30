
// Fixed: Added React import to provide the React namespace for React.ReactNode usage
import React from 'react';

export interface Blueprint {
  id: string;
  deviceModel: string;
  content: string;
  timestamp: number;
}

export interface NavigationSection {
  id: string;
  label: string;
  icon: React.ReactNode;
}
