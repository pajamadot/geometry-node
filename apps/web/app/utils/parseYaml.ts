import yaml from 'js-yaml';

export function parseYamlToDict(content: string): Record<string, any> | null {
  let str = content.trim();

  if (str.startsWith('```yaml')) {
    str = str.slice(7).trim();
  } else if (str.startsWith('```yml')) {
    str = str.slice(6).trim();
  }

  if (str.endsWith('```')) {
    str = str.slice(0, -3).trim();
  }

  str = str.replace(/\\n/g, '\n');

  try {
    return yaml.load(str) as Record<string, any>;
  } catch (err) {
    return null;
  }
}
