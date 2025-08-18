export function applyDiff(originalContent: string, diffContent: string): string {
  const lines = originalContent.split(/\r?\n/);

  const pattern = /(?<!\\)<<<<<<< SEARCH\n([\s\S]*?)\n=======\n([\s\S]*?)\n>>>>>>> REPLACE/gm;

  const modifiedLines = [...lines];

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(diffContent)) !== null) {
    const searchBlock = match[1];
    const replaceBlock = match[2];

    const searchLines = searchBlock.split(/\r?\n/);
    const replaceLines = replaceBlock.split(/\r?\n/);

    let found = false;
    for (let i = 0; i <= modifiedLines.length - searchLines.length; i++) {
      let matchAll = true;
      for (let j = 0; j < searchLines.length; j++) {
        if (modifiedLines[i + j] !== searchLines[j]) {
          matchAll = false;
          break;
        }
      }
      if (matchAll) {
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