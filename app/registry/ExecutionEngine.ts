import * as THREE from 'three';
import { SerializableExecution, NodeExecutionType } from '../types/nodeSystem';

// Built-in function registry - these are the core operations that can be referenced by name
export const BUILTIN_FUNCTIONS: Record<string, (inputs: Record<string, any>, parameters: Record<string, any>) => Record<string, any>> = {
  // Geometry primitives
  'cube': (inputs, parameters) => {
    const width = inputs.width || parameters.width || 1;
    const height = inputs.height || parameters.height || 1;
    const depth = inputs.depth || parameters.depth || 1;
    
    const geometry = new THREE.BoxGeometry(width, height, depth);
    return { geometry };
  },
  
  'sphere': (inputs, parameters) => {
    const radius = inputs.radius || parameters.radius || 1;
    const widthSegments = inputs.widthSegments || parameters.widthSegments || 32;
    const heightSegments = inputs.heightSegments || parameters.heightSegments || 16;
    
    const geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
    return { geometry };
  },
  
  'cylinder': (inputs, parameters) => {
    const radiusTop = inputs.radiusTop || parameters.radiusTop || 1;
    const radiusBottom = inputs.radiusBottom || parameters.radiusBottom || 1;
    const height = inputs.height || parameters.height || 1;
    const radialSegments = inputs.radialSegments || parameters.radialSegments || 32;
    
    const geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments);
    return { geometry };
  },
  
  // Math operations
  'math_basic': (inputs, parameters) => {
    const valueA = inputs.valueA || parameters.valueA || 0;
    const valueB = inputs.valueB || parameters.valueB || 0;
    const operation = inputs.operation || parameters.operation || 'add';
    
    let result: number;
    switch (operation) {
      case 'add': result = valueA + valueB; break;
      case 'subtract': result = valueA - valueB; break;
      case 'multiply': result = valueA * valueB; break;
      case 'divide': result = valueB !== 0 ? valueA / valueB : 0; break;
      case 'power': result = Math.pow(valueA, valueB); break;
      case 'sin': result = Math.sin(valueA); break;
      case 'cos': result = Math.cos(valueA); break;
      case 'sqrt': result = Math.sqrt(valueA); break;
      case 'abs': result = Math.abs(valueA); break;
      default: result = valueA;
    }
    
    return { result };
  },
  
  // Vector operations
  'vector_make': (inputs, parameters) => {
    const x = inputs.x || parameters.x || 0;
    const y = inputs.y || parameters.y || 0;
    const z = inputs.z || parameters.z || 0;
    
    return { vector: { x, y, z } };
  },
  
  'vector_break': (inputs, parameters) => {
    const vector = inputs.vector || parameters.vector || { x: 0, y: 0, z: 0 };
    
    return { 
      x: vector.x || 0, 
      y: vector.y || 0, 
      z: vector.z || 0 
    };
  },
  
  // Time operations
  'time': (inputs, parameters) => {
    const timeMode = inputs.timeMode || parameters.timeMode || 'seconds';
    const outputType = inputs.outputType || parameters.outputType || 'raw';
    const frequency = inputs.frequency || parameters.frequency || 1;
    const amplitude = inputs.amplitude || parameters.amplitude || 1;
    const offset = inputs.offset || parameters.offset || 0;
    const phase = inputs.phase || parameters.phase || 0;
    
    const currentTime = inputs.currentTime || Date.now() / 1000;
    const timeValue = timeMode === 'frames' ? currentTime * 30 : currentTime; // Default 30 FPS
    const scaledTime = (timeValue * frequency) + phase;
    
    let rawValue: number;
    switch (outputType) {
      case 'raw': rawValue = timeValue; break;
      case 'sine': rawValue = Math.sin(scaledTime); break;
      case 'cosine': rawValue = Math.cos(scaledTime); break;
      case 'sawtooth': rawValue = 2 * (scaledTime / (2 * Math.PI) - Math.floor(scaledTime / (2 * Math.PI) + 0.5)); break;
      case 'triangle': 
        const sawValue = 2 * (scaledTime / (2 * Math.PI) - Math.floor(scaledTime / (2 * Math.PI) + 0.5));
        rawValue = 2 * Math.abs(sawValue) - 1;
        break;
      case 'square': rawValue = Math.sin(scaledTime) >= 0 ? 1 : -1; break;
      default: rawValue = timeValue;
    }
    
    return { result: (rawValue * amplitude) + offset };
  },
  
  // Transform operations
  'transform': (inputs, parameters) => {
    const geometry = inputs.geometry;
    if (!geometry || !geometry.isBufferGeometry) {
      return { geometry: null };
    }
    
    const position = inputs.position || parameters.position || { x: 0, y: 0, z: 0 };
    const rotation = inputs.rotation || parameters.rotation || { x: 0, y: 0, z: 0 };
    const scale = inputs.scale || parameters.scale || { x: 1, y: 1, z: 1 };
    
    const transformedGeometry = geometry.clone();
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(rotation.x, rotation.y, rotation.z)
    );
    matrix.compose(
      new THREE.Vector3(position.x, position.y, position.z),
      quaternion,
      new THREE.Vector3(scale.x, scale.y, scale.z)
    );
    
    transformedGeometry.applyMatrix4(matrix);
    return { geometry: transformedGeometry };
  },
  
  // Output operation
  'output': (inputs, parameters) => {
    const geometry = inputs.geometry;
    return { result: geometry, geometry };
  }
};

// Expression evaluator for mathematical expressions
export class ExpressionEvaluator {
  private static sanitizeExpression(expr: string): string {
    // Remove any potentially dangerous code, keep only safe math operations
    return expr.replace(/[^a-zA-Z0-9\s\+\-\*\/\(\)\.\,\_]/g, '');
  }
  
  static evaluate(expression: string, context: Record<string, any>): any {
    try {
      const sanitized = this.sanitizeExpression(expression);
      const func = new Function(...Object.keys(context), 'Math', `
        "use strict";
        try {
          return ${sanitized};
        } catch (e) {
          return 0;
        }
      `);
      
      return func(...Object.values(context), Math);
    } catch (error) {
      console.error('Expression evaluation failed:', error);
      return 0;
    }
  }
}

// Main execution engine that compiles serializable definitions
export class ExecutionEngine {
  static compileExecution(execution: SerializableExecution): (inputs: Record<string, any>, parameters: Record<string, any>) => Record<string, any> {
    switch (execution.type) {
      case 'builtin':
        return this.compileBuiltinExecution(execution);
      
      case 'expression':
        return this.compileExpressionExecution(execution);
      
      case 'template':
        return this.compileTemplateExecution(execution);
      
      case 'composite':
        return this.compileCompositeExecution(execution);
      
      default:
        console.warn(`Unknown execution type: ${execution.type}`);
        return () => ({});
    }
  }
  
  private static compileBuiltinExecution(execution: SerializableExecution) {
    const functionName = execution.functionName;
    if (!functionName || !BUILTIN_FUNCTIONS[functionName]) {
      console.error(`Unknown builtin function: ${functionName}`);
      return () => ({});
    }
    
    return BUILTIN_FUNCTIONS[functionName];
  }
  
  private static compileExpressionExecution(execution: SerializableExecution) {
    const expressions = execution.expressions || {};
    
    return (inputs: Record<string, any>, parameters: Record<string, any>) => {
      const context = { ...inputs, ...parameters };
      const outputs: Record<string, any> = {};
      
      for (const [outputId, expression] of Object.entries(expressions)) {
        outputs[outputId] = ExpressionEvaluator.evaluate(expression, context);
      }
      
      return outputs;
    };
  }
  
  private static compileTemplateExecution(execution: SerializableExecution) {
    const template = execution.template;
    if (!template) {
      return () => ({});
    }
    
    return (inputs: Record<string, any>, parameters: Record<string, any>) => {
      const context = { ...inputs, ...parameters };
      const outputs: Record<string, any> = {};
      
      // Execute template operations in sequence
      for (const operation of template.operations) {
        const operationInputs: Record<string, any> = {};
        
        // Gather inputs for this operation
        operation.inputs.forEach(inputName => {
          if (context[inputName] !== undefined) {
            operationInputs[inputName] = context[inputName];
          }
        });
        
        // Execute operation (this would be expanded based on operation type)
        const result = this.executeTemplateOperation(operation.operation, operationInputs);
        
        // Store result in context and outputs
        context[operation.output] = result;
        outputs[operation.output] = result;
      }
      
      return outputs;
    };
  }
  
  private static compileCompositeExecution(execution: SerializableExecution) {
    const steps = execution.steps || [];
    
    return (inputs: Record<string, any>, parameters: Record<string, any>) => {
      const context = { ...inputs, ...parameters };
      const outputs: Record<string, any> = {};
      
      // Execute steps in sequence
      for (const step of steps) {
        const stepInputs = { ...step.inputs, ...context };
        const result = this.executeCompositeStep(step.operation, stepInputs);
        
        context[step.output] = result;
        outputs[step.output] = result;
      }
      
      return outputs;
    };
  }
  
  private static executeTemplateOperation(operation: string, inputs: Record<string, any>): any {
    // Template operations are simplified versions of builtin functions
    switch (operation) {
      case 'add': return (inputs.a || 0) + (inputs.b || 0);
      case 'multiply': return (inputs.a || 0) * (inputs.b || 0);
      case 'vector': return { x: inputs.x || 0, y: inputs.y || 0, z: inputs.z || 0 };
      default: return null;
    }
  }
  
  private static executeCompositeStep(operation: string, inputs: Record<string, any>): any {
    // Composite steps are more complex operations
    if (BUILTIN_FUNCTIONS[operation]) {
      return BUILTIN_FUNCTIONS[operation](inputs, {});
    }
    
    return null;
  }
} 