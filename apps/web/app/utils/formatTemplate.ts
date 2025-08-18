export type TemplateVars = Record<string, any>;

export function formatTemplate(template: string, vars: TemplateVars): string {
  return template.replace(/\$\{([\w.]+)(?::([^}]+))?\}/g, (_, keyPath, defaultValue) => {
    const keys = keyPath.split('.');
    let value: any = vars;

    for (const k of keys) {
      if (value && k in value) {
        value = value[k];
      } else {
        value = undefined;
        break;
      }
    }

    if (value === undefined || value === null) {
      return defaultValue ?? '';
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  });
}