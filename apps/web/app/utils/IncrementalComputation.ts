/**
 * Incremental Computation Engine
 *
 * Tracks dependencies between computation cells and only
 * re-evaluates cells whose inputs have changed. Used by the
 * optimized executor and self-evolving pipeline to avoid
 * redundant work.
 *
 * Key concepts:
 * - Cell: A unit of computation with inputs and an output
 * - Dependency graph: Tracks which cells depend on which
 * - Dirty propagation: When a cell's value changes, all dependents are marked dirty
 * - Lazy evaluation: Cells are only recomputed when their value is read
 */

// ============================================
// Types
// ============================================

export type CellId = string;

export interface ComputationCell<T = any> {
  id: CellId;
  /** The compute function that produces the cell's value */
  compute: (deps: Record<string, any>) => T;
  /** IDs of cells this cell depends on */
  dependencies: CellId[];
  /** Last computed value */
  value: T | undefined;
  /** Whether this cell needs recomputation */
  dirty: boolean;
  /** Generation counter for cycle detection */
  generation: number;
}

export interface IncrementalStats {
  totalCells: number;
  dirtyCells: number;
  recomputations: number;
  cacheHits: number;
  lastEvaluationMs: number;
}

// ============================================
// Incremental Computation Engine
// ============================================

export class IncrementalComputation {
  private cells = new Map<CellId, ComputationCell>();
  private dependents = new Map<CellId, Set<CellId>>(); // reverse dependency map
  private generation = 0;
  private stats: IncrementalStats = {
    totalCells: 0,
    dirtyCells: 0,
    recomputations: 0,
    cacheHits: 0,
    lastEvaluationMs: 0,
  };

  /**
   * Define a new computation cell.
   */
  defineCell<T>(
    id: CellId,
    compute: (deps: Record<string, any>) => T,
    dependencies: CellId[] = []
  ): void {
    // Remove old reverse dependencies if cell already exists
    const existing = this.cells.get(id);
    if (existing) {
      for (const depId of existing.dependencies) {
        this.dependents.get(depId)?.delete(id);
      }
    }

    const cell: ComputationCell<T> = {
      id,
      compute,
      dependencies,
      value: undefined,
      dirty: true,
      generation: 0,
    };

    this.cells.set(id, cell);

    // Register reverse dependencies
    for (const depId of dependencies) {
      if (!this.dependents.has(depId)) {
        this.dependents.set(depId, new Set());
      }
      this.dependents.get(depId)!.add(id);
    }

    this.stats.totalCells = this.cells.size;
  }

  /**
   * Set a cell's value directly (for input cells).
   * Marks all dependents as dirty.
   */
  setValue<T>(id: CellId, value: T): void {
    let cell = this.cells.get(id);
    if (!cell) {
      // Auto-create an input cell
      cell = {
        id,
        compute: () => value,
        dependencies: [],
        value,
        dirty: false,
        generation: this.generation,
      };
      this.cells.set(id, cell);
      this.stats.totalCells = this.cells.size;
    } else {
      cell.value = value;
      cell.dirty = false;
      cell.generation = this.generation;
    }

    this.propagateDirty(id);
  }

  /**
   * Get a cell's value. Recomputes if dirty (lazy evaluation).
   */
  getValue<T>(id: CellId): T | undefined {
    const cell = this.cells.get(id);
    if (!cell) return undefined;

    if (cell.dirty) {
      this.recompute(id);
    } else {
      this.stats.cacheHits++;
    }

    return cell.value as T;
  }

  /**
   * Evaluate all dirty cells in dependency order.
   */
  evaluateAll(): void {
    const start = performance.now();
    const order = this.topologicalOrder();

    for (const cellId of order) {
      const cell = this.cells.get(cellId);
      if (cell?.dirty) {
        this.recompute(cellId);
      }
    }

    this.stats.lastEvaluationMs = performance.now() - start;
  }

  /**
   * Remove a cell and clean up its dependencies.
   */
  removeCell(id: CellId): void {
    const cell = this.cells.get(id);
    if (!cell) return;

    // Remove from reverse dependencies
    for (const depId of cell.dependencies) {
      this.dependents.get(depId)?.delete(id);
    }

    // Remove as a dependency source
    this.dependents.delete(id);

    this.cells.delete(id);
    this.stats.totalCells = this.cells.size;
  }

  /**
   * Check if a cell exists.
   */
  hasCell(id: CellId): boolean {
    return this.cells.has(id);
  }

  /**
   * Check if a cell is dirty.
   */
  isDirty(id: CellId): boolean {
    return this.cells.get(id)?.dirty ?? false;
  }

  /**
   * Get all cell IDs.
   */
  getCellIds(): CellId[] {
    return Array.from(this.cells.keys());
  }

  /**
   * Get current statistics.
   */
  getStats(): IncrementalStats {
    this.stats.dirtyCells = Array.from(this.cells.values()).filter(c => c.dirty).length;
    return { ...this.stats };
  }

  /**
   * Clear all cells and reset state.
   */
  clear(): void {
    this.cells.clear();
    this.dependents.clear();
    this.generation = 0;
    this.stats = {
      totalCells: 0,
      dirtyCells: 0,
      recomputations: 0,
      cacheHits: 0,
      lastEvaluationMs: 0,
    };
  }

  // ---- Internal ----

  /**
   * Recompute a single cell by gathering its dependencies and calling compute.
   */
  private recompute(id: CellId): void {
    const cell = this.cells.get(id);
    if (!cell) return;

    // Detect cycles
    this.generation++;
    if (cell.generation === this.generation) {
      console.warn(`Cycle detected at cell '${id}', skipping`);
      cell.dirty = false;
      return;
    }
    cell.generation = this.generation;

    // Ensure dependencies are up-to-date first
    const deps: Record<string, any> = {};
    for (const depId of cell.dependencies) {
      const depCell = this.cells.get(depId);
      if (depCell?.dirty) {
        this.recompute(depId);
      }
      deps[depId] = depCell?.value;
    }

    // Compute new value
    try {
      cell.value = cell.compute(deps);
    } catch (error) {
      console.warn(`Cell '${id}' computation failed:`, error);
    }

    cell.dirty = false;
    this.stats.recomputations++;
  }

  /**
   * Mark all cells that depend on the given cell as dirty.
   */
  private propagateDirty(id: CellId): void {
    const deps = this.dependents.get(id);
    if (!deps) return;

    for (const depId of deps) {
      const cell = this.cells.get(depId);
      if (cell && !cell.dirty) {
        cell.dirty = true;
        this.propagateDirty(depId);
      }
    }
  }

  /**
   * Return cells in topological order (dependencies first).
   */
  private topologicalOrder(): CellId[] {
    const visited = new Set<CellId>();
    const order: CellId[] = [];

    const visit = (id: CellId) => {
      if (visited.has(id)) return;
      visited.add(id);

      const cell = this.cells.get(id);
      if (cell) {
        for (const depId of cell.dependencies) {
          visit(depId);
        }
      }
      order.push(id);
    };

    for (const id of this.cells.keys()) {
      visit(id);
    }

    return order;
  }
}

// Singleton
let computationInstance: IncrementalComputation | null = null;

export function getIncrementalComputation(): IncrementalComputation {
  if (!computationInstance) {
    computationInstance = new IncrementalComputation();
  }
  return computationInstance;
}
