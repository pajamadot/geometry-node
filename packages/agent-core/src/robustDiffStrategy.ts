/**
 * Robust Diff Strategy - Inspired by KiloCode's approach
 * Implements fuzzy matching, multi-hunk support, and granular error reporting
 */

export interface DiffHunk {
  id: string;
  searchContent: string;
  replaceContent: string;
  startLine?: number;
  endLine?: number;
}

export interface DiffResult {
  success: boolean;
  content?: string;
  failedParts: DiffFailure[];
  appliedParts: DiffSuccess[];
}

export interface DiffFailure {
  hunk: DiffHunk;
  reason: string;
  suggestion?: string;
}

export interface DiffSuccess {
  hunk: DiffHunk;
  matchedLines: { start: number; end: number };
  appliedAt: { start: number; end: number };
}

export interface FuzzyMatch {
  lines: string[];
  startIndex: number;
  endIndex: number;
  similarity: number;
}

export class RobustDiffStrategy {
  private fuzzyThreshold: number;
  private maxSearchWindow: number;
  private preserveIndentation: boolean;

  constructor(options: {
    fuzzyThreshold?: number;
    maxSearchWindow?: number;
    preserveIndentation?: boolean;
  } = {}) {
    this.fuzzyThreshold = options.fuzzyThreshold ?? 0.85;
    this.maxSearchWindow = options.maxSearchWindow ?? 80; // ±40 lines
    this.preserveIndentation = options.preserveIndentation ?? true;
  }

  /**
   * Apply multiple SEARCH/REPLACE blocks with fuzzy matching
   */
  async applyDiff(originalContent: string, diffContent: string): Promise<DiffResult> {
    // First, validate the diff content syntax
    const validationResult = this.validateMarkerSequencing(diffContent);
    if (!validationResult.isValid) {
      return {
        success: false,
        failedParts: [{
          hunk: { id: 'validation', searchContent: '', replaceContent: '' },
          reason: validationResult.error || 'Invalid diff format',
          suggestion: 'Use proper <<<<<<< SEARCH ... ======= ... >>>>>>> REPLACE format'
        }],
        appliedParts: []
      };
    }

    // Parse hunks from diff content
    const hunks = this.parseHunks(diffContent);
    
    if (hunks.length === 0) {
      return {
        success: false,
        failedParts: [{
          hunk: { id: 'parse', searchContent: '', replaceContent: '' },
          reason: 'No valid diff hunks found',
          suggestion: 'Ensure your diff contains <<<<<<< SEARCH ... ======= ... >>>>>>> REPLACE blocks'
        }],
        appliedParts: []
      };
    }

    // Apply hunks sequentially with line delta tracking
    let workingContent = originalContent;
    const contentLines = workingContent.split('\n');
    const failedParts: DiffFailure[] = [];
    const appliedParts: DiffSuccess[] = [];
    let lineOffset = 0; // Track line number changes

    for (const hunk of hunks) {
      try {
        const result = this.applyHunk(contentLines, hunk, lineOffset);
        
        if (result.success) {
          // Update working content
          contentLines.splice(
            result.matchStart,
            result.matchEnd - result.matchStart + 1,
            ...result.replacementLines
          );
          
          // Update line offset for subsequent hunks
          lineOffset += result.replacementLines.length - (result.matchEnd - result.matchStart + 1);
          
          appliedParts.push({
            hunk,
            matchedLines: { start: result.originalMatchStart, end: result.originalMatchEnd },
            appliedAt: { start: result.matchStart, end: result.matchStart + result.replacementLines.length - 1 }
          });
        } else {
                   failedParts.push({
           hunk,
           reason: result.reason || 'Unknown error',
           suggestion: result.suggestion
         });
        }
      } catch (error) {
        failedParts.push({
          hunk,
          reason: `Unexpected error: ${error}`,
          suggestion: 'Check that the search content matches the original exactly'
        });
      }
    }

    const finalContent = contentLines.join('\n');
    
    return {
      success: failedParts.length === 0,
      content: finalContent,
      failedParts,
      appliedParts
    };
  }

  /**
   * Validate SEARCH/REPLACE marker sequencing
   */
  private validateMarkerSequencing(content: string): { isValid: boolean; error?: string } {
    const lines = content.split('\n');
    let state: 'start' | 'in_search' | 'in_replace' = 'start';
    let blockCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('<<<<<<< SEARCH')) {
        if (state !== 'start') {
          return { 
            isValid: false, 
            error: `Unexpected SEARCH marker at line ${i + 1}. Found inside another block.` 
          };
        }
        state = 'in_search';
        blockCount++;
      } else if (line === '=======') {
        if (state !== 'in_search') {
          return { 
            isValid: false, 
            error: `Unexpected separator at line ${i + 1}. Missing SEARCH marker.` 
          };
        }
        state = 'in_replace';
      } else if (line.startsWith('>>>>>>> REPLACE')) {
        if (state !== 'in_replace') {
          return { 
            isValid: false, 
            error: `Unexpected REPLACE marker at line ${i + 1}. Missing separator.` 
          };
        }
        state = 'start';
      } else if (line.includes('<<<<<<<') || line.includes('>>>>>>>')) {
        // Check for unescaped conflict markers
        return {
          isValid: false,
          error: `Unescaped conflict marker at line ${i + 1}. Use \\< or \\> to escape.`
        };
      }
    }
    
    if (state !== 'start') {
      return { 
        isValid: false, 
        error: `Incomplete diff block. Expected REPLACE marker to close the last block.` 
      };
    }
    
    if (blockCount === 0) {
      return { 
        isValid: false, 
        error: `No SEARCH/REPLACE blocks found.` 
      };
    }
    
    return { isValid: true };
  }

  /**
   * Parse SEARCH/REPLACE hunks from diff content
   */
  private parseHunks(content: string): DiffHunk[] {
    const hunks: DiffHunk[] = [];
    const lines = content.split('\n');
    let currentHunk: Partial<DiffHunk> | null = null;
    let searchLines: string[] = [];
    let replaceLines: string[] = [];
    let state: 'search' | 'replace' | 'none' = 'none';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.trim().startsWith('<<<<<<< SEARCH')) {
        // Start new hunk
        currentHunk = { id: `hunk-${hunks.length}` };
        searchLines = [];
        replaceLines = [];
        state = 'search';
      } else if (line.trim() === '=======') {
        state = 'replace';
      } else if (line.trim().startsWith('>>>>>>> REPLACE')) {
        if (currentHunk) {
          currentHunk.searchContent = searchLines.join('\n');
          currentHunk.replaceContent = replaceLines.join('\n');
          hunks.push(currentHunk as DiffHunk);
        }
        currentHunk = null;
        state = 'none';
      } else if (state === 'search') {
        searchLines.push(line);
      } else if (state === 'replace') {
        replaceLines.push(line);
      }
    }
    
    return hunks;
  }

  /**
   * Apply a single hunk with fuzzy matching
   */
  private applyHunk(contentLines: string[], hunk: DiffHunk, lineOffset: number): {
    success: boolean;
    matchStart: number;
    matchEnd: number;
    originalMatchStart: number;
    originalMatchEnd: number;
    replacementLines: string[];
    reason?: string;
    suggestion?: string;
  } {
    const searchLines = hunk.searchContent.split('\n');
    const replaceLines = hunk.replaceContent.split('\n');
    
    // Try exact match first
    const exactMatch = this.findExactMatch(contentLines, searchLines, lineOffset);
    if (exactMatch) {
      const indentedReplacement = this.preserveIndentation 
        ? this.applyIndentation(replaceLines, this.detectIndentation(contentLines, exactMatch.start))
        : replaceLines;
        
      return {
        success: true,
        matchStart: exactMatch.start,
        matchEnd: exactMatch.end,
        originalMatchStart: exactMatch.start - lineOffset,
        originalMatchEnd: exactMatch.end - lineOffset,
        replacementLines: indentedReplacement
      };
    }
    
    // Try fuzzy match if exact match fails
    const fuzzyMatch = this.findFuzzyMatch(contentLines, searchLines, lineOffset);
    if (fuzzyMatch && fuzzyMatch.similarity >= this.fuzzyThreshold) {
      const indentedReplacement = this.preserveIndentation 
        ? this.applyIndentation(replaceLines, this.detectIndentation(contentLines, fuzzyMatch.startIndex))
        : replaceLines;
        
      return {
        success: true,
        matchStart: fuzzyMatch.startIndex,
        matchEnd: fuzzyMatch.endIndex,
        originalMatchStart: fuzzyMatch.startIndex - lineOffset,
        originalMatchEnd: fuzzyMatch.endIndex - lineOffset,
        replacementLines: indentedReplacement
      };
    }
    
    // Generate helpful failure message
    const similarity = fuzzyMatch?.similarity ?? 0;
    const threshold = this.fuzzyThreshold;
    
    return {
      success: false,
      matchStart: -1,
      matchEnd: -1,
      originalMatchStart: -1,
      originalMatchEnd: -1,
      replacementLines: [],
      reason: `No suitable match found. Best similarity: ${(similarity * 100).toFixed(1)}% (threshold: ${(threshold * 100).toFixed(1)}%)`,
      suggestion: similarity > 0.5 
        ? `Consider adjusting the search content. Close match found but below threshold.`
        : `Search content may have changed significantly. Try updating the search pattern.`
    };
  }

  /**
   * Find exact string match
   */
  private findExactMatch(contentLines: string[], searchLines: string[], lineOffset: number): { start: number; end: number } | null {
    if (searchLines.length === 0) return null;
    
    for (let i = 0; i <= contentLines.length - searchLines.length; i++) {
      let matches = true;
      
      for (let j = 0; j < searchLines.length; j++) {
        if (contentLines[i + j] !== searchLines[j]) {
          matches = false;
          break;
        }
      }
      
      if (matches) {
        return { start: i, end: i + searchLines.length - 1 };
      }
    }
    
    return null;
  }

  /**
   * Find fuzzy match using Levenshtein distance
   */
  private findFuzzyMatch(contentLines: string[], searchLines: string[], lineOffset: number): FuzzyMatch | null {
    if (searchLines.length === 0) return null;
    
    let bestMatch: FuzzyMatch | null = null;
    const searchWindow = Math.min(this.maxSearchWindow, contentLines.length);
    
    // Search within a reasonable window around the expected position
    const startSearch = Math.max(0, lineOffset - Math.floor(searchWindow / 2));
    const endSearch = Math.min(contentLines.length - searchLines.length, startSearch + searchWindow);
    
    for (let i = startSearch; i <= endSearch; i++) {
      const candidateLines = contentLines.slice(i, i + searchLines.length);
      const similarity = this.calculateSimilarity(searchLines, candidateLines);
      
      if (!bestMatch || similarity > bestMatch.similarity) {
        bestMatch = {
          lines: candidateLines,
          startIndex: i,
          endIndex: i + searchLines.length - 1,
          similarity
        };
      }
    }
    
    return bestMatch;
  }

  /**
   * Calculate similarity between two sets of lines using Levenshtein distance
   */
  private calculateSimilarity(lines1: string[], lines2: string[]): number {
    if (lines1.length !== lines2.length) return 0;
    
    let totalDistance = 0;
    let totalLength = 0;
    
    for (let i = 0; i < lines1.length; i++) {
      const distance = this.levenshteinDistance(lines1[i], lines2[i]);
      const maxLength = Math.max(lines1[i].length, lines2[i].length);
      
      totalDistance += distance;
      totalLength += maxLength;
    }
    
    if (totalLength === 0) return 1; // Both empty
    return 1 - (totalDistance / totalLength);
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Detect indentation pattern from matched lines
   */
  private detectIndentation(contentLines: string[], matchStart: number): string {
    if (matchStart >= contentLines.length) return '';
    
    const line = contentLines[matchStart];
    const match = line.match(/^(\s*)/);
    return match ? match[1] : '';
  }

  /**
   * Apply indentation to replacement lines
   */
  private applyIndentation(lines: string[], baseIndentation: string): string[] {
    if (!lines.length || !baseIndentation) return lines;
    
    // Detect if the replacement lines already have indentation
    const firstNonEmptyLine = lines.find(line => line.trim().length > 0);
    if (!firstNonEmptyLine) return lines;
    
    const existingIndentation = firstNonEmptyLine.match(/^(\s*)/)?.[1] || '';
    
    return lines.map(line => {
      if (line.trim().length === 0) return line; // Preserve empty lines
      
      // Remove existing indentation and apply base indentation
      const withoutIndent = line.replace(/^\s*/, '');
      return baseIndentation + withoutIndent;
    });
  }
} 