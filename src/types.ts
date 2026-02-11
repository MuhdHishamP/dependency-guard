// ──────────────────────────────────────────────
// Dependency Guard — Shared TypeScript Interfaces
// ──────────────────────────────────────────────

// ─── Peer Dependency Compatibility ───────────

export type PeerStatus =
  | 'COMPATIBLE'
  | 'INCOMPATIBLE'
  | 'MISSING'
  | 'OPTIONAL_MISSING';

export interface PeerCheck {
  /** Peer dependency package name */
  name: string;
  /** Semver range required by the target package */
  required: string;
  /** Version range currently in the user's package.json, or null if absent */
  installed: string | null;
  /** Compatibility status */
  status: PeerStatus;
  /** Copy-paste npm install command to fix the issue */
  fixCommand?: string;
}

export interface CompatibilityReport {
  /** The package being checked */
  packageName: string;
  /** Individual peer dependency results */
  checks: PeerCheck[];
  /** Whether all required peers are compatible */
  compatible: boolean;
}

// ─── npm Registry ────────────────────────────

export interface PackageInfo {
  name: string;
  version: string;
  description: string;
  deprecated: string | false;
  lastPublish: string;
  weeklyDownloads: number;
  maintainerCount: number;
  license: string;
  peerDependencies: Record<string, string>;
  peerDependenciesMeta: Record<string, { optional?: boolean }>;
  homepage: string;
  repository: string;
}

// ─── Security (OSV.dev) ──────────────────────

export interface SecurityVulnerability {
  id: string;
  summary: string;
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  affectedVersions: string;
  url: string;
}

export interface SecurityReport {
  packageName: string;
  vulnerabilities: SecurityVulnerability[];
  hasCritical: boolean;
}

// ─── Risk Scoring ────────────────────────────

export type RiskAction = 'ALLOW' | 'WARN' | 'BLOCK';

export interface RiskScore {
  /** 0–100 numeric score */
  score: number;
  /** Recommended action based on the score */
  action: RiskAction;
  /** Individual factor breakdown */
  factors: RiskFactor[];
}

export interface RiskFactor {
  name: string;
  score: number;
  maxScore: number;
  reason: string;
}

// ─── Validation Result (Combined) ────────────

export interface ValidationResult {
  packageName: string;
  compatibility: CompatibilityReport;
  packageInfo: PackageInfo | null;
  security: SecurityReport;
  riskScore: RiskScore;
  action: RiskAction;
}

// ─── Cache ───────────────────────────────────

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// ─── Config ──────────────────────────────────

export interface Config {
  cacheTtlMs: number;
  cacheDir: string;
  projectPath: string;
  noCache: boolean;
  dryRun: boolean;
}
