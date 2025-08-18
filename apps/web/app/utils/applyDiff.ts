export function applyDiff(originalContent: string, diffContent: string): string {
  /**
   * Parse diff_content and apply to original_content
   */
  // Split original file by lines
  const lines = originalContent.split(/\r?\n/);

  // Match diff blocks
  const pattern = /(?<!\\)<<<<<<< SEARCH\n([\s\S]*?)\n=======\n([\s\S]*?)\n>>>>>>> REPLACE/gm;

  // Store results
  const modifiedLines = [...lines];

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(diffContent)) !== null) {
    const [searchBlock, replaceBlock] = match.slice(1);
    const searchLines = searchBlock.split(/\r?\n/);
    const replaceLines = replaceBlock.split(/\r?\n/);

    // Content search mode
    let found = false;
    for (let i = 0; i <= modifiedLines.length - searchLines.length; i++) {
      if (modifiedLines.slice(i, i + searchLines.length).every((line, j) => line === searchLines[j])) {
        modifiedLines.splice(i, searchLines.length, ...replaceLines);
        found = true;
        break;
      }
    }
    
    if (!found) {
      throw new Error(`SEARCH block not found:\n${searchBlock}`);
    }
  }

  return modifiedLines.join("\n");
}