import React from 'react';
import { 
  Box, Globe, Cylinder, Square, CircleDot, Cone,
  Calculator, Plus, Minus, X, Divide,
  Move, RotateCcw, Scale, Grid3X3,
  Clock, Play, Pause, SkipForward,
  GitBranch, GitMerge, Combine, Split,
  MapPin, Target, Layers, Copy,
  Settings, Sliders, ToggleLeft, Monitor,
  Waves, Mountain, Building, Shapes, Sparkles
} from 'lucide-react';
import { IconType } from '../types/nodeSystem';

// Icon registry mapping string identifiers to React components
export const ICON_REGISTRY: Record<IconType, React.ComponentType<any>> = {
  // Geometry icons
  'box': Box,
  'sphere': Globe,
  'cylinder': Cylinder,
  'plane': Square,
  'cone': CircleDot,
  'torus': CircleDot,
  
  // Math icons
  'calculator': Calculator,
  'plus': Plus,
  'minus': Minus,
  'x': X,
  'divide': Divide,
  
  // Transform icons
  'move': Move,
  'rotate-3d': RotateCcw,
  'scale': Scale,
  'grid-3x3': Grid3X3,
  
  // Time icons
  'clock': Clock,
  'play': Play,
  'pause': Pause,
  'skip-forward': SkipForward,
  
  // Vector/Combine icons
  'git-branch': GitBranch,
  'git-merge': GitMerge,
  'combine': Combine,
  'split': Split,
  
  // Points/Instance icons
  'map-pin': MapPin,
  'target': Target,
  'layers': Layers,
  'copy': Copy,
  
  // Utility icons
  'settings': Settings,
  'sliders': Sliders,
  'toggles': ToggleLeft,
  'monitor': Monitor,
  
  // Procedural icons
  'waves': Waves,
  'mountain': Mountain,
  'building': Building,
  'shapes': Shapes,
  'sparkles': Sparkles
};

// Utility function to get icon component from string identifier
export function getIconComponent(iconType?: IconType): React.ComponentType<any> | undefined {
  if (!iconType) return undefined;
  return ICON_REGISTRY[iconType];
}

// Function to get all available icon types
export function getAvailableIcons(): IconType[] {
  return Object.keys(ICON_REGISTRY) as IconType[];
} 