import { NodeDefinition } from '../../types/nodeSystem';
import { Palette, Sparkles, Gem, Zap } from 'lucide-react';
import * as THREE from 'three';

// Helper function to convert color inputs to RGB objects
function parseColorInput(colorInput: any): { r: number; g: number; b: number } {
  // If it's already an RGB object, return it
  if (colorInput && typeof colorInput === 'object' && 'r' in colorInput) {
    return {
      r: colorInput.r ?? 1,
      g: colorInput.g ?? 1,
      b: colorInput.b ?? 1
    };
  }
  
  // If it's a hex string, convert it
  if (typeof colorInput === 'string' && colorInput.startsWith('#')) {
    const hex = colorInput.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    return { r, g, b };
  }
  
  // If it's a THREE.Color, convert it
  if (colorInput && colorInput.isColor) {
    return { r: colorInput.r, g: colorInput.g, b: colorInput.b };
  }
  
  // Default to white
  return { r: 1, g: 1, b: 1 };
}

// STANDARD MATERIAL NODE - PBR material with roughness/metalness workflow
export const standardMaterialNodeDefinition: NodeDefinition = {
  type: 'standard-material',
  name: 'Standard Material',
  description: 'Physically Based Rendering material with metalness/roughness workflow',
  category: 'materials',
  color: {
    primary: '#78716c',
    secondary: '#57534e'
  },
  inputs: [
    {
      id: 'color',
      name: 'Base Color',
      type: 'color',
      defaultValue: '#ffffff',
      description: 'Base diffuse color'
    },
    {
      id: 'metalness',
      name: 'Metalness',
      type: 'number',
      defaultValue: 0.0,
      min: 0,
      max: 1,
      step: 0.01,
      description: 'How metallic the material appears'
    },
    {
      id: 'roughness',
      name: 'Roughness',
      type: 'number',
      defaultValue: 0.5,
      min: 0,
      max: 1,
      step: 0.01,
      description: 'How rough/smooth the surface is'
    },
    {
      id: 'emissive',
      name: 'Emissive',
      type: 'color',
      defaultValue: '#000000',
      description: 'Emissive (light-emitting) color'
    },
    {
      id: 'emissiveIntensity',
      name: 'Emissive Intensity',
      type: 'number',
      defaultValue: 1.0,
      min: 0,
      max: 10,
      step: 0.1,
      description: 'Strength of emissive color'
    },
    {
      id: 'transparency',
      name: 'Transparency',
      type: 'number',
      defaultValue: 0.0,
      min: 0,
      max: 1,
      step: 0.01,
      description: 'Material transparency (0 = opaque, 1 = transparent)'
    }
  ],
  outputs: [
    {
      id: 'material',
      name: 'Material',
      type: 'material',
      description: 'Standard PBR material'
    }
  ],
  parameters: [],
  ui: {
    icon: Palette,
    width: 250
  },
  execute: (inputs, parameters) => {
    const colorInput = inputs.color || '#ffffff';
    const emissiveInput = inputs.emissive || '#000000';
    
    const color = parseColorInput(colorInput);
    const emissive = parseColorInput(emissiveInput);
    
    const metalness = inputs.metalness ?? 0.0;
    const roughness = inputs.roughness ?? 0.5;
    const emissiveIntensity = inputs.emissiveIntensity ?? 1.0;
    const transparency = inputs.transparency ?? 0.0;

    console.log('Standard Material inputs:', {
      colorInput,
      emissiveInput,
      parsedColor: color,
      parsedEmissive: emissive,
      metalness,
      roughness,
      emissiveIntensity,
      transparency
    });

    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color.r, color.g, color.b),
      metalness,
      roughness,
      emissive: new THREE.Color(emissive.r, emissive.g, emissive.b),
      emissiveIntensity,
      transparent: transparency > 0,
      opacity: 1 - transparency,
      side: THREE.DoubleSide
    });

    console.log('Created Standard Material:', {
      color: material.color.getHexString(),
      emissive: material.emissive.getHexString(),
      metalness: material.metalness,
      roughness: material.roughness
    });

    return { material };
  }
};

// BASIC MATERIAL NODE - Simple non-PBR material
export const basicMaterialNodeDefinition: NodeDefinition = {
  type: 'basic-material',
  name: 'Basic Material',
  description: 'Simple material not affected by lights',
  category: 'materials',
  color: {
    primary: '#78716c',
    secondary: '#57534e'
  },
  inputs: [
    {
      id: 'color',
      name: 'Color',
      type: 'color',
      defaultValue: '#ffffff',
      description: 'Material color'
    },
    {
      id: 'transparency',
      name: 'Transparency',
      type: 'number',
      defaultValue: 0.0,
      min: 0,
      max: 1,
      step: 0.01,
      description: 'Material transparency'
    },
    {
      id: 'wireframe',
      name: 'Wireframe',
      type: 'boolean',
      defaultValue: false,
      description: 'Render as wireframe'
    }
  ],
  outputs: [
    {
      id: 'material',
      name: 'Material',
      type: 'material',
      description: 'Basic unlit material'
    }
  ],
  parameters: [],
  ui: {
    icon: Sparkles,
    width: 200
  },
  execute: (inputs, parameters) => {
    const colorInput = inputs.color || '#ffffff';
    const color = parseColorInput(colorInput);
    
    const transparency = inputs.transparency ?? 0.0;
    const wireframe = inputs.wireframe ?? false;

    console.log('Basic Material inputs:', {
      colorInput,
      parsedColor: color,
      transparency,
      wireframe
    });

    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color.r, color.g, color.b),
      transparent: transparency > 0,
      opacity: 1 - transparency,
      wireframe,
      side: THREE.DoubleSide
    });

    return { material };
  }
};

// PHYSICAL MATERIAL NODE - Advanced PBR material
export const physicalMaterialNodeDefinition: NodeDefinition = {
  type: 'physical-material',
  name: 'Physical Material',
  description: 'Advanced physically based material with additional properties',
  category: 'materials',
  color: {
    primary: '#78716c',
    secondary: '#57534e'
  },
  inputs: [
    {
      id: 'color',
      name: 'Base Color',
      type: 'color',
      defaultValue: '#ffffff',
      description: 'Base diffuse color'
    },
    {
      id: 'metalness',
      name: 'Metalness',
      type: 'number',
      defaultValue: 0.0,
      min: 0,
      max: 1,
      step: 0.01,
      description: 'How metallic the material appears'
    },
    {
      id: 'roughness',
      name: 'Roughness',
      type: 'number',
      defaultValue: 0.5,
      min: 0,
      max: 1,
      step: 0.01,
      description: 'How rough/smooth the surface is'
    },
    {
      id: 'clearcoat',
      name: 'Clearcoat',
      type: 'number',
      defaultValue: 0.0,
      min: 0,
      max: 1,
      step: 0.01,
      description: 'Clearcoat layer intensity'
    },
    {
      id: 'clearcoatRoughness',
      name: 'Clearcoat Roughness',
      type: 'number',
      defaultValue: 0.0,
      min: 0,
      max: 1,
      step: 0.01,
      description: 'Roughness of clearcoat layer'
    },
    {
      id: 'transmission',
      name: 'Transmission',
      type: 'number',
      defaultValue: 0.0,
      min: 0,
      max: 1,
      step: 0.01,
      description: 'Light transmission (glass-like effect)'
    },
    {
      id: 'thickness',
      name: 'Thickness',
      type: 'number',
      defaultValue: 0.0,
      min: 0,
      max: 5,
      step: 0.01,
      description: 'Material thickness for volume rendering'
    }
  ],
  outputs: [
    {
      id: 'material',
      name: 'Material',
      type: 'material',
      description: 'Advanced physical material'
    }
  ],
  parameters: [],
  ui: {
    icon: Gem,
    width: 280,
    advanced: ['clearcoat', 'clearcoatRoughness', 'transmission', 'thickness']
  },
  execute: (inputs, parameters) => {
    const colorInput = inputs.color || '#ffffff';
    const color = parseColorInput(colorInput);
    
    const metalness = inputs.metalness ?? 0.0;
    const roughness = inputs.roughness ?? 0.5;
    const clearcoat = inputs.clearcoat ?? 0.0;
    const clearcoatRoughness = inputs.clearcoatRoughness ?? 0.0;
    const transmission = inputs.transmission ?? 0.0;
    const thickness = inputs.thickness ?? 0.0;

    console.log('Physical Material inputs:', {
      colorInput,
      parsedColor: color,
      metalness,
      roughness,
      clearcoat,
      transmission
    });

    const material = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(color.r, color.g, color.b),
      metalness,
      roughness,
      clearcoat,
      clearcoatRoughness,
      transmission,
      thickness,
      side: THREE.DoubleSide
    });

    return { material };
  }
};

// EMISSIVE MATERIAL NODE - Glowing material
export const emissiveMaterialNodeDefinition: NodeDefinition = {
  type: 'emissive-material',
  name: 'Emissive Material',
  description: 'Self-illuminating material that emits light',
  category: 'materials',
  color: {
    primary: '#78716c',
    secondary: '#57534e'
  },
  inputs: [
    {
      id: 'color',
      name: 'Emissive Color',
      type: 'color',
      defaultValue: '#ffffff',
      description: 'Color of emitted light'
    },
    {
      id: 'intensity',
      name: 'Intensity',
      type: 'number',
      defaultValue: 1.0,
      min: 0,
      max: 10,
      step: 0.1,
      description: 'Emission intensity'
    },
    {
      id: 'baseColor',
      name: 'Base Color',
      type: 'color',
      defaultValue: '#1a1a1a',
      description: 'Base material color'
    }
  ],
  outputs: [
    {
      id: 'material',
      name: 'Material',
      type: 'material',
      description: 'Emissive material'
    }
  ],
  parameters: [],
  ui: {
    icon: Zap,
    width: 220
  },
  execute: (inputs, parameters) => {
    const colorInput = inputs.color || '#ffffff';
    const baseColorInput = inputs.baseColor || '#1a1a1a';
    
    const color = parseColorInput(colorInput);
    const baseColor = parseColorInput(baseColorInput);
    const intensity = inputs.intensity ?? 1.0;

    console.log('Emissive Material inputs:', {
      colorInput,
      baseColorInput,
      parsedEmissive: color,
      parsedBase: baseColor,
      intensity
    });

    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(baseColor.r, baseColor.g, baseColor.b),
      emissive: new THREE.Color(color.r, color.g, color.b),
      emissiveIntensity: intensity,
      roughness: 0.5,
      metalness: 0.0,
      side: THREE.DoubleSide
    });

    return { material };
  }
}; 