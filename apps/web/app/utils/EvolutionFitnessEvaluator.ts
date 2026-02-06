/**
 * Evolution Fitness Evaluator
 *
 * Scores node definitions across multiple dimensions to drive the
 * self-evolving pipeline's selection process. Higher scores = better nodes.
 *
 * Fitness dimensions:
 * - Structural quality (inputs/outputs/parameters completeness)
 * - Performance (execution speed, memory footprint)
 * - Robustness (error handling, edge-case resilience)
 * - Usability (parameter ranges, descriptions, defaults)
 * - Compatibility (socket diversity, connection potential)
 */

import { NodeDefinition, ParameterDefinition, SocketDefinition, SOCKET_METADATA } from '../types/nodes';

// ============================================
// Types
// ============================================

export interface FitnessScore {
  /** Overall fitness 0-1 (weighted combination) */
  overall: number;
  /** Structural quality of the definition */
  structural: number;
  /** Estimated execution performance */
  performance: number;
  /** Error handling and edge-case robustness */
  robustness: number;
  /** Usability of parameters and UI */
  usability: number;
  /** Connection compatibility with other nodes */
  compatibility: number;
  /** Detailed breakdown of individual checks */
  breakdown: FitnessBreakdown;
}

export interface FitnessBreakdown {
  hasDescription: boolean;
  hasAllParameterDefaults: boolean;
  hasAllParameterRanges: boolean;
  hasAllParameterDescriptions: boolean;
  inputCount: number;
  outputCount: number;
  parameterCount: number;
  hasColorDefined: boolean;
  executeWorks: boolean;
  executionTimeMs: number;
  socketTypeDiversity: number;
  compatibleNodeCount: number;
}

export interface FitnessProfile {
  definition: NodeDefinition;
  score: FitnessScore;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

// Weights for combining dimension scores into overall fitness
const FITNESS_WEIGHTS = {
  structural: 0.25,
  performance: 0.20,
  robustness: 0.15,
  usability: 0.25,
  compatibility: 0.15,
};

// ============================================
// Fitness Evaluator
// ============================================

export class EvolutionFitnessEvaluator {
  private executionTimeout: number;
  private executionCache = new Map<string, FitnessScore>();

  constructor(executionTimeout = 5000) {
    this.executionTimeout = executionTimeout;
  }

  /**
   * Evaluate a node definition and return a fitness score.
   */
  evaluate(definition: NodeDefinition): FitnessScore {
    const cached = this.executionCache.get(definition.type);
    if (cached) return cached;

    const structural = this.evaluateStructural(definition);
    const performance = this.evaluatePerformance(definition);
    const robustness = this.evaluateRobustness(definition);
    const usability = this.evaluateUsability(definition);
    const compatibility = this.evaluateCompatibility(definition);

    const overall =
      structural * FITNESS_WEIGHTS.structural +
      performance * FITNESS_WEIGHTS.performance +
      robustness * FITNESS_WEIGHTS.robustness +
      usability * FITNESS_WEIGHTS.usability +
      compatibility * FITNESS_WEIGHTS.compatibility;

    const breakdown = this.buildBreakdown(definition);

    const score: FitnessScore = {
      overall: Math.round(overall * 1000) / 1000,
      structural,
      performance,
      robustness,
      usability,
      compatibility,
      breakdown,
    };

    this.executionCache.set(definition.type, score);
    return score;
  }

  /**
   * Generate a full fitness profile with strengths, weaknesses, and suggestions.
   */
  profileNode(definition: NodeDefinition): FitnessProfile {
    const score = this.evaluate(definition);
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const suggestions: string[] = [];

    // Structural
    if (score.structural >= 0.8) {
      strengths.push('Well-structured definition with complete metadata');
    } else {
      if (!definition.description || definition.description.length < 10) {
        weaknesses.push('Missing or too-short description');
        suggestions.push('Add a detailed description (20+ characters)');
      }
      if (definition.inputs.length === 0 && definition.outputs.length === 0) {
        weaknesses.push('No inputs or outputs defined');
      }
    }

    // Performance
    if (score.performance >= 0.8) {
      strengths.push('Fast execution performance');
    } else if (score.performance < 0.5) {
      weaknesses.push('Slow execution performance');
      suggestions.push('Consider caching intermediate results or simplifying the execute function');
    }

    // Robustness
    if (score.robustness >= 0.8) {
      strengths.push('Robust error handling');
    } else {
      weaknesses.push('Execute function may crash on edge-case inputs');
      suggestions.push('Add input validation and error boundaries in execute()');
    }

    // Usability
    if (score.usability >= 0.8) {
      strengths.push('Good parameter UX with ranges and descriptions');
    } else {
      const missingRanges = definition.parameters.filter(
        p => isNumericType(p.type) && (p.min === undefined || p.max === undefined)
      );
      if (missingRanges.length > 0) {
        weaknesses.push(`${missingRanges.length} numeric parameters missing min/max ranges`);
        suggestions.push('Add min/max ranges to all numeric parameters for slider support');
      }
      const missingDescs = definition.parameters.filter(p => !p.description);
      if (missingDescs.length > 0) {
        suggestions.push(`Add descriptions to ${missingDescs.length} parameters`);
      }
    }

    // Compatibility
    if (score.compatibility >= 0.8) {
      strengths.push('High socket compatibility with other nodes');
    } else if (score.compatibility < 0.4) {
      weaknesses.push('Low connection potential with other node types');
      suggestions.push('Consider adding geometry or material pass-through sockets');
    }

    return { definition, score, strengths, weaknesses, suggestions };
  }

  /**
   * Clear the evaluation cache (useful when definitions change).
   */
  clearCache(): void {
    this.executionCache.clear();
  }

  // ---- Dimension Evaluators ----

  /**
   * Structural: Is the definition complete and well-formed?
   */
  private evaluateStructural(def: NodeDefinition): number {
    let score = 0;
    let checks = 0;

    // Has name
    checks++;
    if (def.name && def.name.length > 0) score++;

    // Has description
    checks++;
    if (def.description && def.description.length >= 10) score++;
    else if (def.description && def.description.length > 0) score += 0.5;

    // Has category
    checks++;
    if (def.category) score++;

    // Has color
    checks++;
    if (def.color?.primary && def.color?.secondary) score++;

    // Has at least one output
    checks++;
    if (def.outputs.length > 0) score++;

    // Has execute function
    checks++;
    if (typeof def.execute === 'function') score++;

    // All outputs have names
    checks++;
    if (def.outputs.length > 0 && def.outputs.every(o => o.name)) score++;

    // All inputs have names
    checks++;
    if (def.inputs.length === 0 || def.inputs.every(i => i.name)) score++;

    // Type is well-formed (kebab-case, no spaces)
    checks++;
    if (def.type && /^[a-z][a-z0-9-]*$/.test(def.type)) score++;
    else if (def.type) score += 0.5;

    return checks > 0 ? score / checks : 0;
  }

  /**
   * Performance: How fast does the execute function run?
   */
  private evaluatePerformance(def: NodeDefinition): number {
    if (typeof def.execute !== 'function') return 0;

    try {
      // Build minimal inputs
      const inputs = this.buildMinimalInputs(def);
      const parameters = this.buildDefaultParameters(def);

      const start = performance.now();
      def.execute(inputs, parameters);
      const elapsed = performance.now() - start;

      // Score based on execution time
      if (elapsed < 1) return 1.0;
      if (elapsed < 5) return 0.9;
      if (elapsed < 16) return 0.8; // Within one frame
      if (elapsed < 50) return 0.6;
      if (elapsed < 100) return 0.4;
      if (elapsed < this.executionTimeout) return 0.2;
      return 0.1;
    } catch {
      // If it crashes, we still give partial credit for having an execute function
      return 0.15;
    }
  }

  /**
   * Robustness: Does the execute function handle edge cases?
   */
  private evaluateRobustness(def: NodeDefinition): number {
    if (typeof def.execute !== 'function') return 0;

    let score = 0;
    let checks = 0;

    // Test with empty inputs
    checks++;
    try {
      def.execute({}, this.buildDefaultParameters(def));
      score++;
    } catch {
      // Crashed on empty inputs
    }

    // Test with null/undefined values
    checks++;
    try {
      const nullInputs: Record<string, any> = {};
      for (const input of def.inputs) {
        nullInputs[input.id] = null;
      }
      def.execute(nullInputs, this.buildDefaultParameters(def));
      score++;
    } catch {
      // Crashed on null inputs
    }

    // Test with default parameters
    checks++;
    try {
      const inputs = this.buildMinimalInputs(def);
      const result = def.execute(inputs, this.buildDefaultParameters(def));
      if (result && typeof result === 'object') score++;
    } catch {
      // Crashed on normal run
    }

    // Test with zero-value numeric parameters
    checks++;
    try {
      const inputs = this.buildMinimalInputs(def);
      const zeroParams: Record<string, any> = {};
      for (const param of def.parameters) {
        if (isNumericType(param.type)) {
          zeroParams[param.id] = 0;
        } else {
          zeroParams[param.id] = param.defaultValue;
        }
      }
      def.execute(inputs, zeroParams);
      score++;
    } catch {
      // Crashed on zero params
    }

    // Test with extreme values
    checks++;
    try {
      const inputs = this.buildMinimalInputs(def);
      const extremeParams: Record<string, any> = {};
      for (const param of def.parameters) {
        if (isNumericType(param.type)) {
          extremeParams[param.id] = param.max ?? 999999;
        } else {
          extremeParams[param.id] = param.defaultValue;
        }
      }
      def.execute(inputs, extremeParams);
      score++;
    } catch {
      // Crashed on extreme params
    }

    return checks > 0 ? score / checks : 0;
  }

  /**
   * Usability: Are parameters well-defined with good UX?
   */
  private evaluateUsability(def: NodeDefinition): number {
    if (def.parameters.length === 0) {
      // No parameters means it's a simple node - that's fine
      return def.description && def.description.length >= 10 ? 0.8 : 0.5;
    }

    let score = 0;
    let checks = 0;

    for (const param of def.parameters) {
      // Has a descriptive name
      checks++;
      if (param.name && param.name.length > 1) score++;

      // Has description
      checks++;
      if (param.description && param.description.length > 5) score++;
      else if (param.description) score += 0.3;

      // Has default value
      checks++;
      if (param.defaultValue !== undefined) score++;

      // Numeric types have ranges
      if (isNumericType(param.type)) {
        checks++;
        if (param.min !== undefined && param.max !== undefined) score++;
        else if (param.min !== undefined || param.max !== undefined) score += 0.5;

        // Has step size
        checks++;
        if (param.step !== undefined) score++;
      }

      // Select/enum types have options
      if (param.type === 'select' || param.type === 'enum') {
        checks++;
        if (param.options && param.options.length >= 2) score++;
      }
    }

    return checks > 0 ? score / checks : 0;
  }

  /**
   * Compatibility: How many other node types can connect?
   */
  private evaluateCompatibility(def: NodeDefinition): number {
    // Collect all socket types used by this node
    const inputTypes = new Set(def.inputs.map(i => i.type));
    const outputTypes = new Set(def.outputs.map(o => o.type));

    if (inputTypes.size === 0 && outputTypes.size === 0) return 0.1;

    let score = 0;
    let checks = 0;

    // Diversity of socket types (more types = more flexible)
    const allTypes = new Set([...inputTypes, ...outputTypes]);
    checks++;
    score += Math.min(1, allTypes.size / 4); // 4 different types = max

    // Has geometry socket (most connectable type)
    checks++;
    if (inputTypes.has('geometry') || outputTypes.has('geometry')) score++;

    // Has both inputs and outputs (can be mid-chain)
    checks++;
    if (def.inputs.length > 0 && def.outputs.length > 0) score++;

    // Output types that match common input types
    checks++;
    const commonTypes = ['geometry', 'number', 'vector', 'material'];
    const hasCommonOutput = commonTypes.some(t => outputTypes.has(t as any));
    if (hasCommonOutput) score++;

    // Inputs accept common output types
    checks++;
    const hasCommonInput = commonTypes.some(t => inputTypes.has(t as any));
    if (hasCommonInput) score++;

    return checks > 0 ? score / checks : 0;
  }

  // ---- Helpers ----

  private buildBreakdown(def: NodeDefinition): FitnessBreakdown {
    const inputTypes = new Set(def.inputs.map(i => i.type));
    const outputTypes = new Set(def.outputs.map(o => o.type));
    const allTypes = new Set([...inputTypes, ...outputTypes]);

    let executeWorks = false;
    let executionTimeMs = -1;

    try {
      const inputs = this.buildMinimalInputs(def);
      const params = this.buildDefaultParameters(def);
      const start = performance.now();
      def.execute(inputs, params);
      executionTimeMs = performance.now() - start;
      executeWorks = true;
    } catch {
      executeWorks = false;
    }

    // Count how many registered socket types are compatible
    const socketTypes = Object.keys(SOCKET_METADATA);
    let compatibleCount = 0;
    for (const st of socketTypes) {
      const meta = SOCKET_METADATA[st as keyof typeof SOCKET_METADATA];
      if (!meta) continue;
      const hasMatch = [...outputTypes].some(ot => meta.compatibleWith.includes(ot as any)) ||
        [...inputTypes].some(it => meta.compatibleWith.includes(it as any));
      if (hasMatch) compatibleCount++;
    }

    return {
      hasDescription: !!def.description && def.description.length >= 10,
      hasAllParameterDefaults: def.parameters.every(p => p.defaultValue !== undefined),
      hasAllParameterRanges: def.parameters
        .filter(p => isNumericType(p.type))
        .every(p => p.min !== undefined && p.max !== undefined),
      hasAllParameterDescriptions: def.parameters.every(p => !!p.description),
      inputCount: def.inputs.length,
      outputCount: def.outputs.length,
      parameterCount: def.parameters.length,
      hasColorDefined: !!def.color?.primary && !!def.color?.secondary,
      executeWorks,
      executionTimeMs: Math.round(executionTimeMs * 100) / 100,
      socketTypeDiversity: allTypes.size,
      compatibleNodeCount: compatibleCount,
    };
  }

  private buildMinimalInputs(def: NodeDefinition): Record<string, any> {
    const inputs: Record<string, any> = {};
    for (const input of def.inputs) {
      if (input.defaultValue !== undefined) {
        inputs[input.id] = input.defaultValue;
      } else {
        inputs[input.id] = getTypeDefault(input.type);
      }
    }
    return inputs;
  }

  private buildDefaultParameters(def: NodeDefinition): Record<string, any> {
    const params: Record<string, any> = {};
    for (const param of def.parameters) {
      params[param.id] = param.defaultValue ?? getTypeDefault(param.type);
    }
    return params;
  }
}

// ============================================
// Utility Functions
// ============================================

function isNumericType(type: string): boolean {
  return type === 'number' || type === 'integer' || type === 'numeric';
}

function getTypeDefault(type: string): any {
  switch (type) {
    case 'number':
    case 'integer':
    case 'numeric':
      return 0;
    case 'boolean':
      return false;
    case 'string':
      return '';
    case 'color':
      return '#ffffff';
    case 'vector':
      return { x: 0, y: 0, z: 0 };
    case 'transform':
      return {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      };
    case 'geometry':
      return {
        vertices: new Float32Array(0),
        indices: new Uint32Array(0),
        normals: new Float32Array(0),
      };
    case 'material':
      return { type: 'standard', color: '#cccccc' };
    case 'select':
    case 'enum':
      return '';
    default:
      return null;
  }
}
