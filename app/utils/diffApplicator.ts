import { distance } from "fastest-levenshtein"
import { JsonNodeDefinition } from '../types/jsonNodes';

interface DiffResult {
  success: boolean;
  content?: string;
  error?: string;
  failParts?: DiffResult[];
}

interface DiffStrategy {
  getName(): string;
  applyDiff(
    originalContent: string,
    diffContent: string,
    paramStartLine?: number,
    paramEndLine?: number,
  ): Promise<DiffResult>;
}

const BUFFER_LINES = 40;

function getSimilarity(original: string, search: string): number {
  if (search === "") {
    return 0;
  }

  // Simple normalization - could be enhanced
  const normalizedOriginal = original.toLowerCase().trim();
  const normalizedSearch = search.toLowerCase().trim();

  if (normalizedOriginal === normalizedSearch) {
    return 1;
  }

  const dist = distance(normalizedOriginal, normalizedSearch);
  const maxLength = Math.max(normalizedOriginal.length, normalizedSearch.length);
  return 1 - dist / maxLength;
}

function fuzzySearch(lines: string[], searchChunk: string, startIndex: number, endIndex: number) {
  let bestScore = 0;
  let bestMatchIndex = -1;
  let bestMatchContent = "";
  const searchLen = searchChunk.split(/\r?\n/).length;

  const midPoint = Math.floor((startIndex + endIndex) / 2);
  let leftIndex = midPoint;
  let rightIndex = midPoint + 1;

  while (leftIndex >= startIndex || rightIndex <= endIndex - searchLen) {
    if (leftIndex >= startIndex) {
      const originalChunk = lines.slice(leftIndex, leftIndex + searchLen).join("\n");
      const similarity = getSimilarity(originalChunk, searchChunk);
      if (similarity > bestScore) {
        bestScore = similarity;
        bestMatchIndex = leftIndex;
        bestMatchContent = originalChunk;
      }
      leftIndex--;
    }

    if (rightIndex <= endIndex - searchLen) {
      const originalChunk = lines.slice(rightIndex, rightIndex + searchLen).join("\n");
      const similarity = getSimilarity(originalChunk, searchChunk);
      if (similarity > bestScore) {
        bestScore = similarity;
        bestMatchIndex = rightIndex;
        bestMatchContent = originalChunk;
      }
      rightIndex++;
    }
  }

  return { bestScore, bestMatchIndex, bestMatchContent };
}

class SimpleDiffStrategy implements DiffStrategy {
  private fuzzyThreshold: number;

  constructor(fuzzyThreshold: number = 0.8) {
    this.fuzzyThreshold = fuzzyThreshold;
  }

  getName(): string {
    return "SimpleDiff";
  }

  async applyDiff(originalContent: string, diffContent: string): Promise<DiffResult> {
    // Parse the diff format: <<<<<<< SEARCH ... ======= ... >>>>>>> REPLACE
    const matches = [...diffContent.matchAll(
      /(?:^|\n)<<<<<<< SEARCH\s*\n([\s\S]*?)(?:\n)?(?:(?<=\n)=======\s*\n)([\s\S]*?)(?:\n)?(?:(?<=\n)>>>>>>> REPLACE)(?=\n|$)/g
    )];

    if (matches.length === 0) {
      return {
        success: false,
        error: "Invalid diff format - missing required SEARCH/REPLACE sections"
      };
    }

    const lineEnding = originalContent.includes("\r\n") ? "\r\n" : "\n";
    let resultLines = originalContent.split(/\r?\n/);
    
    for (const match of matches) {
      const searchContent = match[1].trim();
      const replaceContent = match[2].trim();

      if (searchContent === replaceContent) {
        continue; // Skip if no actual change
      }

      const searchLines = searchContent.split(/\r?\n/);
      const replaceLines = replaceContent.split(/\r?\n/);
      const searchChunk = searchLines.join("\n");

      // Find the best match using fuzzy search
      const { bestScore, bestMatchIndex } = fuzzySearch(
        resultLines, 
        searchChunk, 
        0, 
        resultLines.length
      );

      if (bestMatchIndex === -1 || bestScore < this.fuzzyThreshold) {
        return {
          success: false,
          error: `No sufficiently similar match found (${Math.floor(bestScore * 100)}% similar, needs ${Math.floor(this.fuzzyThreshold * 100)}%)`
        };
      }

      // Apply the replacement
      const beforeMatch = resultLines.slice(0, bestMatchIndex);
      const afterMatch = resultLines.slice(bestMatchIndex + searchLines.length);
      resultLines = [...beforeMatch, ...replaceLines, ...afterMatch];
    }

    return {
      success: true,
      content: resultLines.join(lineEnding)
    };
  }
}

/**
 * Applies AI-generated diffs to JSON content (nodes or scenes)
 */
export class DiffApplicator {
  private diffStrategy: DiffStrategy;

  constructor(fuzzyThreshold: number = 0.8) {
    this.diffStrategy = new SimpleDiffStrategy(fuzzyThreshold);
  }

  /**
   * Apply a diff to a node JSON definition
   */
  async applyNodeDiff(
    originalNode: JsonNodeDefinition, 
    diffContent: string
  ): Promise<{ success: boolean; node?: JsonNodeDefinition; error?: string }> {
    try {
      const originalJSON = JSON.stringify(originalNode, null, 2);
      const result = await this.diffStrategy.applyDiff(originalJSON, diffContent);
      
      if (!result.success) {
        return { success: false, error: result.error };
      }

      // Parse the modified JSON
      const modifiedNode = JSON.parse(result.content!);
      
      // Validate it's still a valid JsonNodeDefinition
      if (!this.validateNodeStructure(modifiedNode)) {
        return { 
          success: false, 
          error: "Modified JSON does not match required node structure" 
        };
      }

      return { success: true, node: modifiedNode };
    } catch (error) {
      return { 
        success: false, 
        error: `Failed to apply node diff: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  }

  /**
   * Apply a diff to a scene JSON definition
   */
  async applySceneDiff(
    originalScene: { nodes: any[], edges: any[] }, 
    diffContent: string
  ): Promise<{ success: boolean; scene?: { nodes: any[], edges: any[] }; error?: string }> {
    try {
      const originalJSON = JSON.stringify(originalScene, null, 2);
      const result = await this.diffStrategy.applyDiff(originalJSON, diffContent);
      
      if (!result.success) {
        return { success: false, error: result.error };
      }

      // Parse the modified JSON
      const modifiedScene = JSON.parse(result.content!);
      
      // Validate it's still a valid scene structure
      if (!this.validateSceneStructure(modifiedScene)) {
        return { 
          success: false, 
          error: "Modified JSON does not match required scene structure" 
        };
      }

      return { success: true, scene: modifiedScene };
    } catch (error) {
      return { 
        success: false, 
        error: `Failed to apply scene diff: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  }

  private validateNodeStructure(node: any): boolean {
    return (
      node &&
      typeof node === 'object' &&
      typeof node.type === 'string' &&
      typeof node.name === 'string' &&
      typeof node.description === 'string' &&
      Array.isArray(node.inputs) &&
      Array.isArray(node.outputs) &&
      Array.isArray(node.parameters) &&
      typeof node.executeCode === 'string'
    );
  }

  private validateSceneStructure(scene: any): boolean {
    return (
      scene &&
      typeof scene === 'object' &&
      Array.isArray(scene.nodes) &&
      Array.isArray(scene.edges)
    );
  }
}

/**
 * Helper function to create a diff template for common modifications
 */
export function createDiffTemplate(
  searchContent: string, 
  replaceContent: string
): string {
  return `<<<<<<< SEARCH
${searchContent}
=======
${replaceContent}
>>>>>>> REPLACE`;
}

export { DiffStrategy, DiffResult }; 