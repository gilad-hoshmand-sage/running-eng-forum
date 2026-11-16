/** Runtime configuration: config.json fetched at startup, then URL query overrides. */
export interface GameConfig {
  deploymentLabel: string;
  serverUrl: string | null;
}

export interface LoadedConfig {
  values: GameConfig;
  /** Where the values came from, for the diagnostics overlay. */
  source: string;
  /** Keys overridden by query parameters. */
  overrides: string[];
  /** Initial visibility of the diagnostics overlay (?diag=1). */
  showDiagnostics: boolean;
}

const DEFAULTS: GameConfig = { deploymentLabel: 'unlabelled', serverUrl: null };

export function dataUrl(file: string): string {
  return new URL(file, document.baseURI).href;
}

export async function loadConfig(): Promise<LoadedConfig> {
  const values: GameConfig = { ...DEFAULTS };
  let source = 'config.json';
  try {
    const res = await fetch(dataUrl('config.json'));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw: unknown = await res.json();
    if (typeof raw !== 'object' || raw === null) throw new Error('not an object');
    const o = raw as Record<string, unknown>;
    if (typeof o.deploymentLabel === 'string') values.deploymentLabel = o.deploymentLabel;
    if (typeof o.serverUrl === 'string' || o.serverUrl === null) values.serverUrl = o.serverUrl;
  } catch (err) {
    console.warn('config.json could not be loaded; using defaults', err);
    source = 'defaults (config.json failed to load)';
  }

  const query = new URLSearchParams(location.search);
  const overrides: string[] = [];
  const label = query.get('deploymentLabel');
  if (label !== null) {
    values.deploymentLabel = label;
    overrides.push('deploymentLabel');
  }
  const server = query.get('serverUrl');
  if (server !== null) {
    values.serverUrl = server === '' || server === 'null' ? null : server;
    overrides.push('serverUrl');
  }
  const diag = query.get('diag');
  return { values, source, overrides, showDiagnostics: diag === '1' || diag === 'true' };
}

export interface VersionInfo {
  buildId: string;
  commit: string;
  builtAt: string;
}

/** version.json as currently served; null if it cannot be fetched. */
export async function fetchVersion(): Promise<VersionInfo | null> {
  try {
    const res = await fetch(dataUrl('version.json'));
    if (!res.ok) return null;
    const o = (await res.json()) as Record<string, unknown>;
    return {
      buildId: String(o.buildId ?? 'unknown'),
      commit: String(o.commit ?? 'unknown'),
      builtAt: String(o.builtAt ?? 'unknown'),
    };
  } catch {
    return null;
  }
}
