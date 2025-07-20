import { NodeDefinition } from '../types/nodeSystem';

// Template definition for compound data structures
export interface DataTemplate {
  name: string;
  description: string;
  components: {
    [key: string]: {
      type: 'number' | 'vector' | 'string' | 'boolean';
      defaultValue: any;
      description: string;
    };
  };
  category: string;
  color: {
    primary: string;
    secondary: string;
  };
}

// Built-in templates
export const BUILTIN_TEMPLATES: Record<string, DataTemplate> = {
  vector: {
    name: 'Vector',
    description: '3D vector with X, Y, Z components',
    components: {
      x: { type: 'number', defaultValue: 0, description: 'X component' },
      y: { type: 'number', defaultValue: 0, description: 'Y component' },
      z: { type: 'number', defaultValue: 0, description: 'Z component' }
    },
    category: 'vector',
    color: { primary: '#3b82f6', secondary: '#1d4ed8' }
  },
  
  quaternion: {
    name: 'Quaternion',
    description: '4D quaternion with X, Y, Z, W components',
    components: {
      x: { type: 'number', defaultValue: 0, description: 'X component' },
      y: { type: 'number', defaultValue: 0, description: 'Y component' },
      z: { type: 'number', defaultValue: 0, description: 'Z component' },
      w: { type: 'number', defaultValue: 1, description: 'W component' }
    },
    category: 'vector',
    color: { primary: '#8b5cf6', secondary: '#7c3aed' }
  },
  
  transform: {
    name: 'Transform',
    description: '3D transform with position, rotation, scale',
    components: {
      position: { type: 'vector', defaultValue: { x: 0, y: 0, z: 0 }, description: 'Position' },
      rotation: { type: 'vector', defaultValue: { x: 0, y: 0, z: 0 }, description: 'Rotation' },
      scale: { type: 'vector', defaultValue: { x: 1, y: 1, z: 1 }, description: 'Scale' }
    },
    category: 'vector',
    color: { primary: '#2563eb', secondary: '#1d4ed8' }
  },
  
  color: {
    name: 'Color',
    description: 'RGBA color with R, G, B, A components',
    components: {
      r: { type: 'number', defaultValue: 0, description: 'Red component' },
      g: { type: 'number', defaultValue: 0, description: 'Green component' },
      b: { type: 'number', defaultValue: 0, description: 'Blue component' },
      a: { type: 'number', defaultValue: 1, description: 'Alpha component' }
    },
    category: 'utilities',
    color: { primary: '#ec4899', secondary: '#be185d' }
  },
  
  matrix: {
    name: 'Matrix',
    description: '4x4 transformation matrix',
    components: {
      m00: { type: 'number', defaultValue: 1, description: 'Matrix element 0,0' },
      m01: { type: 'number', defaultValue: 0, description: 'Matrix element 0,1' },
      m02: { type: 'number', defaultValue: 0, description: 'Matrix element 0,2' },
      m03: { type: 'number', defaultValue: 0, description: 'Matrix element 0,3' },
      m10: { type: 'number', defaultValue: 0, description: 'Matrix element 1,0' },
      m11: { type: 'number', defaultValue: 1, description: 'Matrix element 1,1' },
      m12: { type: 'number', defaultValue: 0, description: 'Matrix element 1,2' },
      m13: { type: 'number', defaultValue: 0, description: 'Matrix element 1,3' },
      m20: { type: 'number', defaultValue: 0, description: 'Matrix element 2,0' },
      m21: { type: 'number', defaultValue: 0, description: 'Matrix element 2,1' },
      m22: { type: 'number', defaultValue: 1, description: 'Matrix element 2,2' },
      m23: { type: 'number', defaultValue: 0, description: 'Matrix element 2,3' },
      m30: { type: 'number', defaultValue: 0, description: 'Matrix element 3,0' },
      m31: { type: 'number', defaultValue: 0, description: 'Matrix element 3,1' },
      m32: { type: 'number', defaultValue: 0, description: 'Matrix element 3,2' },
      m33: { type: 'number', defaultValue: 1, description: 'Matrix element 3,3' }
    },
    category: 'vector',
    color: { primary: '#059669', secondary: '#047857' }
  }
};

// Template system for generating Make/Break nodes
export class TemplateSystem {
  private static instance: TemplateSystem;
  private customTemplates = new Map<string, DataTemplate>();

  private constructor() {}

  static getInstance(): TemplateSystem {
    if (!TemplateSystem.instance) {
      TemplateSystem.instance = new TemplateSystem();
    }
    return TemplateSystem.instance;
  }

  // Register a custom template
  registerTemplate(name: string, template: DataTemplate) {
    this.customTemplates.set(name, template);
  }

  // Get all available templates
  getAllTemplates(): Record<string, DataTemplate> {
    return { ...BUILTIN_TEMPLATES, ...Object.fromEntries(this.customTemplates) };
  }

  // Generate a Make node definition from a template
  generateMakeNode(templateName: string): NodeDefinition | null {
    const template = this.getAllTemplates()[templateName];
    if (!template) return null;

    const inputs = Object.entries(template.components).map(([key, component]) => ({
      id: key,
      name: key.toUpperCase(),
      type: component.type,
      defaultValue: component.defaultValue,
      description: component.description
    }));

    return {
      type: `make-${templateName}`,
      name: `Make ${template.name}`,
      description: `Create a ${template.name.toLowerCase()} from components`,
      category: template.category as any,
      color: template.color,
      inputs,
      outputs: [{
        id: 'result',
        name: template.name,
        type: templateName as any,
        description: `Combined ${template.name.toLowerCase()}`
      }],
      parameters: [],
      ui: {
        width: 220,
        icon: undefined
      },
      execute: (inputs, parameters) => {
        const result: any = {};
        Object.keys(template.components).forEach(key => {
          result[key] = inputs[key] || template.components[key].defaultValue;
        });
        return { result };
      }
    };
  }

  // Generate a Break node definition from a template
  generateBreakNode(templateName: string): NodeDefinition | null {
    const template = this.getAllTemplates()[templateName];
    if (!template) return null;

    const outputs = Object.entries(template.components).map(([key, component]) => ({
      id: key,
      name: key.toUpperCase(),
      type: component.type,
      description: component.description
    }));

    return {
      type: `break-${templateName}`,
      name: `Break ${template.name}`,
      description: `Extract components from a ${template.name.toLowerCase()}`,
      category: template.category as any,
      color: template.color,
      inputs: [{
        id: 'input',
        name: template.name,
        type: templateName as any,
        required: true,
        description: `Input ${template.name.toLowerCase()}`
      }],
      outputs,
      parameters: [],
      ui: {
        width: 220,
        icon: undefined
      },
      execute: (inputs, parameters) => {
        const input = inputs.input;
        if (!input) {
          const result: any = {};
          Object.keys(template.components).forEach(key => {
            result[key] = template.components[key].defaultValue;
          });
          return result;
        }

        const result: any = {};
        Object.keys(template.components).forEach(key => {
          result[key] = input[key] || template.components[key].defaultValue;
        });
        return result;
      }
    };
  }

  // Generate all Make/Break nodes for all templates
  generateAllNodes(): NodeDefinition[] {
    const nodes: NodeDefinition[] = [];
    const templates = this.getAllTemplates();

    console.log('TemplateSystem: Generating nodes for templates:', Object.keys(templates));

    Object.keys(templates).forEach(templateName => {
      const makeNode = this.generateMakeNode(templateName);
      const breakNode = this.generateBreakNode(templateName);
      
      if (makeNode) {
        console.log('TemplateSystem: Generated Make node:', makeNode.type);
        nodes.push(makeNode);
      }
      if (breakNode) {
        console.log('TemplateSystem: Generated Break node:', breakNode.type);
        nodes.push(breakNode);
      }
    });

    console.log('TemplateSystem: Total generated nodes:', nodes.length);
    return nodes;
  }
}

// Export singleton instance
export const templateSystem = TemplateSystem.getInstance(); 