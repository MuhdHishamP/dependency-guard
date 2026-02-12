// ──────────────────────────────────────────────
// Dependency Guard — Security Vulnerability Checker
// ──────────────────────────────────────────────
//
// Queries the OSV.dev API for known CVEs / advisories
// affecting a specific package + version.

import fetch from 'node-fetch';

import type { SecurityVulnerability, SecurityReport } from '../types.js';
import { cache } from '../utils/cache.js';

// ─── OSV API shapes ─────────────────────────

interface OsvQueryBody {
    package: { name: string; ecosystem: string };
    version: string;
}

interface OsvSeverityEntry {
    type?: string;
    score?: string;
}

interface OsvAffectedRange {
    type?: string;
    events?: Array<{ introduced?: string; fixed?: string }>;
}

interface OsvAffected {
    ranges?: OsvAffectedRange[];
}

interface OsvVuln {
    id?: string;
    summary?: string;
    severity?: OsvSeverityEntry[];
    affected?: OsvAffected[];
    references?: Array<{ type?: string; url?: string }>;
}

interface OsvResponse {
    vulns?: OsvVuln[];
}

// ─── Severity normalisation ─────────────────

type NormalizedSeverity = SecurityVulnerability['severity'];

/**
 * Map an OSV CVSS score string to our severity tiers.
 * Falls back to 'MODERATE' when the score is unparseable.
 */
function normalizeSeverity(sevEntries?: OsvSeverityEntry[]): NormalizedSeverity {
    if (!sevEntries || sevEntries.length === 0) return 'MODERATE';

    // Prefer CVSS_V3 if present
    const cvss = sevEntries.find((s) => s.type === 'CVSS_V3') ?? sevEntries[0];
    const scoreStr = cvss?.score;
    if (!scoreStr) return 'MODERATE';

    // CVSS scores → severity mapping (NIST thresholds)
    const num = parseFloat(scoreStr);
    if (isNaN(num)) return 'MODERATE';
    if (num >= 9.0) return 'CRITICAL';
    if (num >= 7.0) return 'HIGH';
    if (num >= 4.0) return 'MODERATE';
    return 'LOW';
}

/**
 * Extract a concise affected version string from OSV ranges.
 */
function extractAffectedVersions(affected?: OsvAffected[]): string {
    if (!affected || affected.length === 0) return 'unknown';

    const parts: string[] = [];
    for (const entry of affected) {
        for (const range of entry.ranges ?? []) {
            for (const event of range.events ?? []) {
                if (event.introduced) parts.push(`>=${event.introduced}`);
                if (event.fixed) parts.push(`<${event.fixed}`);
            }
        }
    }

    return parts.length > 0 ? parts.join(', ') : 'unknown';
}

/**
 * Pick the best reference URL from OSV references.
 */
function pickUrl(refs?: Array<{ type?: string; url?: string }>): string {
    if (!refs || refs.length === 0) return '';
    const advisory = refs.find((r) => r.type === 'ADVISORY');
    return advisory?.url ?? refs[0]?.url ?? '';
}

// ─── Public API ─────────────────────────────

const SECURITY_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Query OSV.dev for vulnerabilities affecting `packageName@version`.
 *
 * @returns A `SecurityReport` with the list of vulns and a flag
 *          indicating whether any CRITICAL-severity issue exists.
 */
export async function checkSecurity(
    packageName: string,
    version: string,
): Promise<SecurityReport> {
    const cacheKey = `security:${packageName}@${version}`;
    const cached = await cache.get<SecurityReport>(cacheKey);
    if (cached) return cached;

    const emptyReport: SecurityReport = {
        packageName,
        vulnerabilities: [],
        hasCritical: false,
    };

    try {
        const body: OsvQueryBody = {
            package: { name: packageName, ecosystem: 'npm' },
            version,
        };

        const res = await fetch('https://api.osv.dev/v1/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!res.ok) return emptyReport;

        const data = (await res.json()) as OsvResponse;

        if (!data.vulns || data.vulns.length === 0) {
            await cache.set(cacheKey, emptyReport, SECURITY_CACHE_TTL_MS);
            return emptyReport;
        }

        const vulnerabilities: SecurityVulnerability[] = data.vulns.map((v) => ({
            id: v.id ?? 'UNKNOWN',
            summary: v.summary ?? 'No description available',
            severity: normalizeSeverity(v.severity),
            affectedVersions: extractAffectedVersions(v.affected),
            url: pickUrl(v.references),
        }));

        const hasCritical = vulnerabilities.some((v) => v.severity === 'CRITICAL');

        const report: SecurityReport = {
            packageName,
            vulnerabilities,
            hasCritical,
        };

        await cache.set(cacheKey, report, SECURITY_CACHE_TTL_MS);
        return report;
    } catch {
        // Network error — fail open, don't block install
        return emptyReport;
    }
}
