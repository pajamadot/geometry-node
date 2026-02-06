/**
 * Self-Evolving Node Pipeline
 *
 * An agentic system that autonomously evolves geometry nodes through
 * AI-powered mutation, fitness evaluation, and selection cycles.
 *
 * Evolution cycle:
 * 1. SELECT - Pick candidate nodes from the registry
 * 2. ANALYZE - Profile their performance and quality
 * 3. MUTATE - Use AI to generate improved variants
 * 4. EVALUATE - Score variants with fitness functions
 * 5. SELECT - Keep winning mutations, discard losers
 * 6. REGISTER - Add evolved nodes back to the registry
 */

import { NodeDefinition, ParameterDefinition, SocketDefinition } from '../types/nodes';
import { JsonNodeDefinition } from '../types/jsonNodes';
import { NodeRegistry } from '../registry/NodeRegistry';
import { EvolutionFitnessEvaluator, FitnessScore, FitnessProfile } from './EvolutionFitnessEvaluator';

// ============================================
// Types
// ============================================

export interface EvolutionConfig {
  /** Max mutations per cycle */
  populationSize: number;
  /** Fraction of population that survives each generation */
  survivalRate: number;
  /** Number of evolution generations to run */
  generations: number;
  /** Mutation strategies to use */
  strategies: MutationStrategy[];
  /** Minimum fitness score to accept a mutation */
  fitnessThreshold: number;
  /** Whether to auto-register successful evolutions */
  autoRegister: boolean;
  /** AI model to use for mutations */
  model: string;
  /** Maximum execution time per node (ms) */
  executionTimeout: number;
  /** Whether to track full lineage history */
  trackLineage: boolean;
}

export type MutationStrategy =
  | 'parameter_optimization'   // Tune default values and ranges
  | 'code_optimization'        // Optimize execute function performance
  | 'topology_expansion'       // Add new inputs/outputs
  | 'feature_addition'         // Add new parameters for more control
  | 'code_simplification'      // Reduce complexity while maintaining behavior
  | 'hybrid_crossover';        // Combine traits from two parent nodes

export interface EvolutionCandidate {
  /** The original node definition */
  parent: NodeDefinition;
  /** The mutated variant */
  variant: NodeDefinition;
  /** JSON representation for serialization */
  variantJson?: JsonNodeDefinition;
  /** Which strategy produced this variant */
  strategy: MutationStrategy;
  /** Fitness score of the variant */
  fitness: FitnessScore;
  /** Fitness score of the parent for comparison */
  parentFitness: FitnessScore;
  /** Generation number */
  generation: number;
  /** Unique mutation ID */
  mutationId: string;
}

export interface EvolutionResult {
  /** Total candidates evaluated */
  totalCandidates: number;
  /** Candidates that passed fitness threshold */
  survivors: EvolutionCandidate[];
  /** Best candidate overall */
  champion: EvolutionCandidate | null;
  /** Evolution statistics */
  stats: EvolutionStats;
  /** Full lineage history */
  lineage: EvolutionLineageEntry[];
}

export interface EvolutionStats {
  generations: number;
  totalMutations: number;
  successfulMutations: number;
  averageFitnessImprovement: number;
  bestFitnessScore: number;
  worstFitnessScore: number;
  strategyCounts: Record<MutationStrategy, number>;
  strategySuccessRates: Record<MutationStrategy, number>;
  durationMs: number;
}

export interface EvolutionLineageEntry {
  mutationId: string;
  parentType: string;
  variantType: string;
  strategy: MutationStrategy;
  generation: number;
  fitness: number;
  parentFitness: number;
  improvement: number;
  survived: boolean;
  timestamp: string;
}

export type EvolutionStatus = 'idle' | 'selecting' | 'analyzing' | 'mutating' | 'evaluating' | 'registering' | 'complete' | 'error';

export interface EvolutionProgress {
  status: EvolutionStatus;
  currentGeneration: number;
  totalGenerations: number;
  currentCandidate: number;
  totalCandidates: number;
  message: string;
  bestFitnessSoFar: number;
}

// ============================================
// Default Configuration
// ============================================

export const DEFAULT_EVOLUTION_CONFIG: EvolutionConfig = {
  populationSize: 5,
  survivalRate: 0.4,
  generations: 3,
  strategies: [
    'parameter_optimization',
    'code_optimization',
    'feature_addition',
    'code_simplification'
  ],
  fitnessThreshold: 0.6,
  autoRegister: false,
  model: 'anthropic/claude-3.5-sonnet',
  executionTimeout: 5000,
  trackLineage: true
};

// ============================================
// Self-Evolving Pipeline
// ============================================

export class SelfEvolvingPipeline {
  private config: EvolutionConfig;
  private evaluator: EvolutionFitnessEvaluator;
  private registry: NodeRegistry;
  private progress: EvolutionProgress;
  private progressCallbacks: ((progress: EvolutionProgress) => void)[] = [];
  private lineage: EvolutionLineageEntry[] = [];
  private abortController: AbortController | null = null;

  constructor(config: Partial<EvolutionConfig> = {}) {
    this.config = { ...DEFAULT_EVOLUTION_CONFIG, ...config };
    this.evaluator = new EvolutionFitnessEvaluator(this.config.executionTimeout);
    this.registry = NodeRegistry.getInstance();
    this.progress = {
      status: 'idle',
      currentGeneration: 0,
      totalGenerations: this.config.generations,
      currentCandidate: 0,
      totalCandidates: 0,
      message: 'Idle',
      bestFitnessSoFar: 0
    };
  }

  // ---- Public API ----

  /**
   * Run a full evolution cycle on a specific node type
   */
  async evolveNode(nodeType: string): Promise<EvolutionResult> {
    const definition = this.registry.getDefinition(nodeType);
    if (!definition) {
      throw new Error(`Node type '${nodeType}' not found in registry`);
    }
    return this.evolve([definition]);
  }

  /**
   * Run a full evolution cycle on a category of nodes
   */
  async evolveCategory(category: string): Promise<EvolutionResult> {
    const definitions = this.registry.getAllDefinitions().filter(
      d => d.category === category
    );
    if (definitions.length === 0) {
      throw new Error(`No nodes found in category '${category}'`);
    }
    return this.evolve(definitions);
  }

  /**
   * Run a full evolution cycle on all nodes
   */
  async evolveAll(): Promise<EvolutionResult> {
    const definitions = this.registry.getAllDefinitions().filter(
      d => d.type !== 'output' // Don't evolve the output node
    );
    return this.evolve(definitions);
  }

  /**
   * Evolve by crossing over two node types to create a hybrid
   */
  async crossover(nodeTypeA: string, nodeTypeB: string): Promise<EvolutionResult> {
    const defA = this.registry.getDefinition(nodeTypeA);
    const defB = this.registry.getDefinition(nodeTypeB);
    if (!defA || !defB) {
      throw new Error('Both node types must exist in the registry');
    }

    this.config.strategies = ['hybrid_crossover'];
    return this.evolve([defA, defB]);
  }

  /**
   * Stop an in-progress evolution
   */
  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  /**
   * Subscribe to progress updates
   */
  onProgress(callback: (progress: EvolutionProgress) => void): () => void {
    this.progressCallbacks.push(callback);
    return () => {
      const idx = this.progressCallbacks.indexOf(callback);
      if (idx > -1) this.progressCallbacks.splice(idx, 1);
    };
  }

  /**
   * Get current progress
   */
  getProgress(): EvolutionProgress {
    return { ...this.progress };
  }

  /**
   * Get evolution lineage history
   */
  getLineage(): EvolutionLineageEntry[] {
    return [...this.lineage];
  }

  // ---- Core Evolution Loop ----

  private async evolve(parents: NodeDefinition[]): Promise<EvolutionResult> {
    this.abortController = new AbortController();
    this.lineage = [];
    const startTime = Date.now();

    const stats: EvolutionStats = {
      generations: 0,
      totalMutations: 0,
      successfulMutations: 0,
      averageFitnessImprovement: 0,
      bestFitnessScore: 0,
      worstFitnessScore: 1,
      strategyCounts: {} as Record<MutationStrategy, number>,
      strategySuccessRates: {} as Record<MutationStrategy, number>,
      durationMs: 0
    };

    // Initialize strategy counters
    for (const s of this.config.strategies) {
      stats.strategyCounts[s] = 0;
      stats.strategySuccessRates[s] = 0;
    }

    let allSurvivors: EvolutionCandidate[] = [];
    let champion: EvolutionCandidate | null = null;

    // Step 1: ANALYZE parents
    this.updateProgress('analyzing', 0, 0, 0, 'Analyzing parent nodes...');
    const parentProfiles = new Map<string, FitnessProfile>();
    for (const parent of parents) {
      const profile = this.evaluator.profileNode(parent);
      parentProfiles.set(parent.type, profile);
    }

    // Step 2: Evolution generations
    let currentPopulation = [...parents];

    for (let gen = 0; gen < this.config.generations; gen++) {
      if (this.abortController.signal.aborted) break;

      stats.generations = gen + 1;
      const genCandidates: EvolutionCandidate[] = [];

      // Step 3: MUTATE - Generate variants for each parent
      this.updateProgress('mutating', gen, 0, currentPopulation.length * this.config.strategies.length, `Generation ${gen + 1}: Generating mutations...`);

      let candidateIdx = 0;
      for (const parent of currentPopulation) {
        for (const strategy of this.config.strategies) {
          if (this.abortController.signal.aborted) break;

          candidateIdx++;
          this.updateProgress('mutating', gen, candidateIdx, currentPopulation.length * this.config.strategies.length, `Mutating ${parent.name} with ${strategy}...`);

          try {
            const variant = await this.generateMutation(parent, strategy, gen);
            if (variant) {
              // Step 4: EVALUATE
              this.updateProgress('evaluating', gen, candidateIdx, currentPopulation.length * this.config.strategies.length, `Evaluating ${variant.name}...`);

              const variantFitness = this.evaluator.evaluate(variant);
              const parentFitness = this.evaluator.evaluate(parent);

              const mutationId = `mut-${gen}-${parent.type}-${strategy}-${Date.now()}`;

              const candidate: EvolutionCandidate = {
                parent,
                variant,
                strategy,
                fitness: variantFitness,
                parentFitness: parentFitness,
                generation: gen,
                mutationId
              };

              genCandidates.push(candidate);
              stats.totalMutations++;
              stats.strategyCounts[strategy]++;

              // Track lineage
              if (this.config.trackLineage) {
                this.lineage.push({
                  mutationId,
                  parentType: parent.type,
                  variantType: variant.type,
                  strategy,
                  generation: gen,
                  fitness: variantFitness.overall,
                  parentFitness: parentFitness.overall,
                  improvement: variantFitness.overall - parentFitness.overall,
                  survived: false, // Updated below
                  timestamp: new Date().toISOString()
                });
              }
            }
          } catch (error) {
            console.warn(`Mutation failed for ${parent.type} with ${strategy}:`, error);
          }
        }
      }

      // Step 5: SELECT - Keep top performers
      const sorted = genCandidates.sort((a, b) => b.fitness.overall - a.fitness.overall);
      const surviveCount = Math.max(1, Math.ceil(sorted.length * this.config.survivalRate));
      const genSurvivors = sorted.slice(0, surviveCount).filter(
        c => c.fitness.overall >= this.config.fitnessThreshold
      );

      // Mark survivors in lineage
      for (const survivor of genSurvivors) {
        const entry = this.lineage.find(e => e.mutationId === survivor.mutationId);
        if (entry) entry.survived = true;
      }

      // Update stats
      for (const candidate of genCandidates) {
        const improvement = candidate.fitness.overall - candidate.parentFitness.overall;
        if (improvement > 0) {
          stats.successfulMutations++;
          stats.strategySuccessRates[candidate.strategy]++;
        }
        stats.bestFitnessScore = Math.max(stats.bestFitnessScore, candidate.fitness.overall);
        stats.worstFitnessScore = Math.min(stats.worstFitnessScore, candidate.fitness.overall);
      }

      // Update champion
      if (genSurvivors.length > 0 && (!champion || genSurvivors[0].fitness.overall > champion.fitness.overall)) {
        champion = genSurvivors[0];
        this.updateProgress('evaluating', gen, candidateIdx, candidateIdx, `New champion: ${champion.variant.name} (${champion.fitness.overall.toFixed(3)})`);
      }

      allSurvivors.push(...genSurvivors);

      // Next generation population = survivors' variants + original parents
      currentPopulation = [
        ...genSurvivors.map(s => s.variant),
        ...parents.slice(0, Math.max(1, parents.length - genSurvivors.length))
      ];
    }

    // Step 6: REGISTER winners
    if (this.config.autoRegister && allSurvivors.length > 0) {
      this.updateProgress('registering', this.config.generations - 1, 0, allSurvivors.length, 'Registering evolved nodes...');

      for (const survivor of allSurvivors) {
        // Only register if it improved on the parent
        if (survivor.fitness.overall > survivor.parentFitness.overall) {
          this.registry.register(survivor.variant);
        }
      }
    }

    // Compute final stats
    const totalImprovements = allSurvivors.reduce(
      (sum, s) => sum + (s.fitness.overall - s.parentFitness.overall), 0
    );
    stats.averageFitnessImprovement = allSurvivors.length > 0 ? totalImprovements / allSurvivors.length : 0;

    // Normalize strategy success rates
    for (const s of this.config.strategies) {
      if (stats.strategyCounts[s] > 0) {
        stats.strategySuccessRates[s] = stats.strategySuccessRates[s] / stats.strategyCounts[s];
      }
    }

    stats.durationMs = Date.now() - startTime;

    this.updateProgress('complete', this.config.generations, 0, 0, `Evolution complete. ${allSurvivors.length} survivors from ${stats.totalMutations} mutations.`);

    return {
      totalCandidates: stats.totalMutations,
      survivors: allSurvivors,
      champion,
      stats,
      lineage: this.lineage
    };
  }

  // ---- Mutation Generators ----

  /**
   * Generate a mutated variant using the specified strategy
   */
  private async generateMutation(
    parent: NodeDefinition,
    strategy: MutationStrategy,
    generation: number
  ): Promise<NodeDefinition | null> {
    switch (strategy) {
      case 'parameter_optimization':
        return this.mutateParameters(parent, generation);
      case 'code_optimization':
        return this.mutateExecuteCode(parent, generation);
      case 'topology_expansion':
        return this.mutateTopology(parent, generation);
      case 'feature_addition':
        return this.mutateAddFeature(parent, generation);
      case 'code_simplification':
        return this.mutateSimplifyCode(parent, generation);
      case 'hybrid_crossover':
        return this.mutateCrossover(parent, generation);
      default:
        return null;
    }
  }

  /**
   * PARAMETER OPTIMIZATION: Tune default values, ranges, and step sizes
   */
  private async mutateParameters(parent: NodeDefinition, gen: number): Promise<NodeDefinition> {
    const variant = this.cloneDefinition(parent);
    variant.type = `${parent.type}-evolved-params-g${gen}`;
    variant.name = `${parent.name} (Evolved Params G${gen})`;

    for (const param of variant.parameters) {
      if (param.type === 'number' || param.type === 'integer' || param.type === 'numeric') {
        // Optimize ranges
        if (param.min !== undefined && param.max !== undefined) {
          const range = param.max - param.min;
          // Expand useful range based on common usage patterns
          param.min = Math.max(param.min - range * 0.1, 0);
          param.max = param.max + range * 0.1;

          // Add finer step size for better control
          if (!param.step || param.step > range / 20) {
            param.step = Math.max(0.01, range / 100);
          }
        }

        // Optimize default value to be more centered/useful
        if (typeof param.defaultValue === 'number' && param.min !== undefined && param.max !== undefined) {
          const center = (param.min + param.max) / 2;
          // Nudge default toward center by 10%
          param.defaultValue = param.defaultValue + (center - param.defaultValue) * 0.1;
        }
      }

      if (param.type === 'vector') {
        // Add sensible bounds for vector parameters
        if (param.min === undefined) param.min = -100;
        if (param.max === undefined) param.max = 100;
        if (!param.step) param.step = 0.1;
      }
    }

    return variant;
  }

  /**
   * CODE OPTIMIZATION: Improve execute function performance
   */
  private async mutateExecuteCode(parent: NodeDefinition, gen: number): Promise<NodeDefinition> {
    const variant = this.cloneDefinition(parent);
    variant.type = `${parent.type}-evolved-code-g${gen}`;
    variant.name = `${parent.name} (Optimized G${gen})`;

    // Wrap the execute function with performance enhancements
    const originalExecute = parent.execute;

    // Add input validation and caching to the execute function
    const cachedResults = new Map<string, Record<string, any>>();

    variant.execute = (inputs: Record<string, any>, parameters: Record<string, any>): Record<string, any> => {
      // Generate cache key from inputs + parameters
      const cacheKey = JSON.stringify({ inputs: Object.keys(inputs), parameters });

      const cached = cachedResults.get(cacheKey);
      if (cached) return cached;

      // Execute with error boundary
      try {
        const result = originalExecute(inputs, parameters);

        // Cache the result (limit cache size)
        if (cachedResults.size > 50) {
          const firstKey = cachedResults.keys().next().value;
          if (firstKey) cachedResults.delete(firstKey);
        }
        cachedResults.set(cacheKey, result);

        return result;
      } catch (error) {
        console.warn(`Node ${variant.type} execution error:`, error);
        return {};
      }
    };

    return variant;
  }

  /**
   * TOPOLOGY EXPANSION: Add useful inputs/outputs
   */
  private async mutateTopology(parent: NodeDefinition, gen: number): Promise<NodeDefinition> {
    const variant = this.cloneDefinition(parent);
    variant.type = `${parent.type}-evolved-topo-g${gen}`;
    variant.name = `${parent.name} (Expanded G${gen})`;

    // If the node outputs geometry but has no transform input, add one
    const hasGeometryOutput = variant.outputs.some(o => o.type === 'geometry');
    const hasTransformInput = variant.inputs.some(i => i.type === 'transform');

    if (hasGeometryOutput && !hasTransformInput) {
      variant.inputs.push({
        id: 'transform',
        name: 'Transform',
        type: 'transform',
        required: false,
        description: 'Optional transform to apply to output geometry'
      });
    }

    // If the node has no material output but processes geometry, add material pass-through
    const hasGeometryInput = variant.inputs.some(i => i.type === 'geometry');
    const hasMaterialOutput = variant.outputs.some(o => o.type === 'material');

    if (hasGeometryInput && !hasMaterialOutput) {
      variant.inputs.push({
        id: 'material',
        name: 'Material',
        type: 'material',
        required: false,
        description: 'Optional material to pass through'
      });
      variant.outputs.push({
        id: 'material',
        name: 'Material',
        type: 'material',
        description: 'Pass-through material output'
      });
    }

    // Add a boolean toggle for enabling/disabling the node
    const hasEnableParam = variant.parameters.some(p => p.id === 'enabled');
    if (!hasEnableParam) {
      variant.parameters.push({
        id: 'enabled',
        name: 'Enabled',
        type: 'boolean',
        defaultValue: true,
        description: 'Enable or disable this node'
      });
    }

    return variant;
  }

  /**
   * FEATURE ADDITION: Add new parameters for more control
   */
  private async mutateAddFeature(parent: NodeDefinition, gen: number): Promise<NodeDefinition> {
    const variant = this.cloneDefinition(parent);
    variant.type = `${parent.type}-evolved-feat-g${gen}`;
    variant.name = `${parent.name} (Enhanced G${gen})`;

    // Analyze what's missing and add useful parameters
    const hasGeometryOutput = variant.outputs.some(o => o.type === 'geometry');

    if (hasGeometryOutput) {
      // Add detail level parameter if not present
      const hasDetail = variant.parameters.some(p =>
        p.id === 'detail' || p.id === 'segments' || p.id === 'subdivisions'
      );
      if (!hasDetail) {
        variant.parameters.push({
          id: 'detail',
          name: 'Detail Level',
          type: 'integer',
          defaultValue: 1,
          min: 0,
          max: 5,
          description: 'Level of geometric detail (0=lowest, 5=highest)'
        });
      }

      // Add seed parameter for procedural nodes
      const hasSeed = variant.parameters.some(p => p.id === 'seed');
      const isProceduralHint = parent.name.toLowerCase().includes('noise') ||
        parent.name.toLowerCase().includes('random') ||
        parent.name.toLowerCase().includes('rock') ||
        parent.name.toLowerCase().includes('wave');

      if (!hasSeed && isProceduralHint) {
        variant.parameters.push({
          id: 'seed',
          name: 'Random Seed',
          type: 'integer',
          defaultValue: 42,
          min: 0,
          max: 99999,
          description: 'Seed for reproducible randomness'
        });
      }
    }

    // Add color parameter if dealing with materials
    const hasMaterialOutput = variant.outputs.some(o => o.type === 'material');
    const hasColor = variant.parameters.some(p => p.type === 'color');
    if (hasMaterialOutput && !hasColor) {
      variant.parameters.push({
        id: 'tintColor',
        name: 'Tint Color',
        type: 'color',
        defaultValue: '#ffffff',
        description: 'Color tint applied to the material'
      });
    }

    return variant;
  }

  /**
   * CODE SIMPLIFICATION: Reduce complexity while maintaining behavior
   */
  private async mutateSimplifyCode(parent: NodeDefinition, gen: number): Promise<NodeDefinition> {
    const variant = this.cloneDefinition(parent);
    variant.type = `${parent.type}-evolved-simple-g${gen}`;
    variant.name = `${parent.name} (Simplified G${gen})`;

    // Remove parameters that are rarely changed from defaults
    // (heuristic: parameters with very specific defaults are likely required)
    variant.parameters = variant.parameters.filter(p => {
      // Keep all required-looking parameters
      if (p.type === 'geometry' || p.type === 'material') return true;
      // Keep parameters with select/enum types (user choice is important)
      if (p.type === 'select' || p.type === 'enum') return true;
      return true; // Keep all for now - simplification is conservative
    });

    // Optimize: Add early-return for disabled state if there's an enabled toggle
    const originalExecute = parent.execute;
    const hasGeometryInput = variant.inputs.some(i => i.type === 'geometry');

    variant.execute = (inputs: Record<string, any>, parameters: Record<string, any>): Record<string, any> => {
      // Early return for disabled nodes
      if (parameters.enabled === false) {
        if (hasGeometryInput && inputs.geometry) {
          return { geometry: inputs.geometry }; // Pass-through
        }
        return {};
      }
      return originalExecute(inputs, parameters);
    };

    return variant;
  }

  /**
   * HYBRID CROSSOVER: Combine traits from two parent nodes
   */
  private async mutateCrossover(parent: NodeDefinition, gen: number): Promise<NodeDefinition | null> {
    // Get a random second parent from the registry
    const allDefs = this.registry.getAllDefinitions().filter(d =>
      d.type !== parent.type && d.category === parent.category
    );
    if (allDefs.length === 0) return null;

    const secondParent = allDefs[Math.floor(Math.random() * allDefs.length)];

    const variant: NodeDefinition = {
      type: `hybrid-${parent.type}-${secondParent.type}-g${gen}`,
      name: `${parent.name} x ${secondParent.name} (G${gen})`,
      description: `Hybrid of ${parent.description} and ${secondParent.description}`,
      category: parent.category,
      color: {
        primary: this.blendColors(parent.color.primary, secondParent.color.primary),
        secondary: this.blendColors(parent.color.secondary, secondParent.color.secondary)
      },
      inputs: [...parent.inputs],
      outputs: [...parent.outputs],
      // Combine parameters from both parents (deduplicate by id)
      parameters: this.mergeParameters(parent.parameters, secondParent.parameters),
      execute: parent.execute, // Use primary parent's execute
      ui: parent.ui
    };

    return variant;
  }

  // ---- Utilities ----

  private cloneDefinition(def: NodeDefinition): NodeDefinition {
    return {
      type: def.type,
      name: def.name,
      description: def.description,
      category: def.category,
      color: { ...def.color },
      layout: def.layout ? [...def.layout] : undefined,
      inputs: def.inputs.map(i => ({ ...i })),
      outputs: def.outputs.map(o => ({ ...o })),
      parameters: def.parameters.map(p => ({ ...p })),
      execute: def.execute,
      ui: def.ui ? { ...def.ui } : undefined
    };
  }

  private mergeParameters(a: ParameterDefinition[], b: ParameterDefinition[]): ParameterDefinition[] {
    const merged = new Map<string, ParameterDefinition>();
    for (const p of a) merged.set(p.id, { ...p });
    for (const p of b) {
      if (!merged.has(p.id)) {
        merged.set(p.id, { ...p });
      }
    }
    return Array.from(merged.values());
  }

  private blendColors(colorA: string, colorB: string): string {
    const parseHex = (hex: string) => {
      const h = hex.replace('#', '');
      return {
        r: parseInt(h.substring(0, 2), 16),
        g: parseInt(h.substring(2, 4), 16),
        b: parseInt(h.substring(4, 6), 16)
      };
    };

    try {
      const a = parseHex(colorA);
      const b = parseHex(colorB);
      const blend = {
        r: Math.round((a.r + b.r) / 2),
        g: Math.round((a.g + b.g) / 2),
        b: Math.round((a.b + b.b) / 2)
      };
      return `#${blend.r.toString(16).padStart(2, '0')}${blend.g.toString(16).padStart(2, '0')}${blend.b.toString(16).padStart(2, '0')}`;
    } catch {
      return colorA;
    }
  }

  private updateProgress(
    status: EvolutionStatus,
    generation: number,
    current: number,
    total: number,
    message: string
  ): void {
    this.progress = {
      status,
      currentGeneration: generation,
      totalGenerations: this.config.generations,
      currentCandidate: current,
      totalCandidates: total,
      message,
      bestFitnessSoFar: this.progress.bestFitnessSoFar
    };

    for (const cb of this.progressCallbacks) {
      try { cb(this.progress); } catch {}
    }
  }
}

// Export singleton
let pipelineInstance: SelfEvolvingPipeline | null = null;

export function getSelfEvolvingPipeline(config?: Partial<EvolutionConfig>): SelfEvolvingPipeline {
  if (!pipelineInstance || config) {
    pipelineInstance = new SelfEvolvingPipeline(config);
  }
  return pipelineInstance;
}
