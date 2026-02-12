// ──────────────────────────────────────────────
// Dependency Guard — Risk Scoring Engine
// ──────────────────────────────────────────────
//
// Produces a 0–100 risk score and an ALLOW / WARN / BLOCK
// recommendation.  Compatibility mismatches carry the
// heaviest weight (the tool's primary value proposition).

import type {
    CompatibilityReport,
    PackageInfo,
    SecurityReport,
    RiskScore,
    RiskFactor,
    RiskAction,
} from '../types.js';

// ─── Scoring weights ────────────────────────

const WEIGHT_COMPATIBILITY = 40; // Heaviest — primary differentiator
const WEIGHT_SECURITY = 30;
const WEIGHT_DEPRECATION = 15;
const WEIGHT_MAINTENANCE = 15;

// ─── Thresholds ─────────────────────────────

const THRESHOLD_ALLOW = 75; // score > 75 → ALLOW
const THRESHOLD_WARN = 40; // score > 40 → WARN, else BLOCK

// ─── Factor calculators ─────────────────────

function scoreCompatibility(report: CompatibilityReport): RiskFactor {
    const total = report.checks.length;

    if (total === 0) {
        return {
            name: 'Peer Compatibility',
            score: WEIGHT_COMPATIBILITY,
            maxScore: WEIGHT_COMPATIBILITY,
            reason: 'No peer dependencies declared',
        };
    }

    const missing = report.checks.filter((c) => c.status === 'MISSING').length;
    const incompatible = report.checks.filter((c) => c.status === 'INCOMPATIBLE').length;
    const issues = missing + incompatible;

    // Each issue costs a proportional chunk; cap at 0
    const penalty = Math.min(issues / total, 1);
    const score = Math.round(WEIGHT_COMPATIBILITY * (1 - penalty));

    let reason: string;
    if (issues === 0) {
        reason = 'All peer dependencies satisfied';
    } else {
        const parts: string[] = [];
        if (missing > 0) parts.push(`${missing} missing`);
        if (incompatible > 0) parts.push(`${incompatible} incompatible`);
        reason = `Peer issues: ${parts.join(', ')}`;
    }

    return { name: 'Peer Compatibility', score, maxScore: WEIGHT_COMPATIBILITY, reason };
}

function scoreSecurity(report: SecurityReport): RiskFactor {
    const { vulnerabilities } = report;

    if (vulnerabilities.length === 0) {
        return {
            name: 'Security',
            score: WEIGHT_SECURITY,
            maxScore: WEIGHT_SECURITY,
            reason: 'No known vulnerabilities',
        };
    }

    const critical = vulnerabilities.filter((v) => v.severity === 'CRITICAL').length;
    const high = vulnerabilities.filter((v) => v.severity === 'HIGH').length;
    const moderate = vulnerabilities.filter((v) => v.severity === 'MODERATE').length;

    // Weighted penalty: CRITICAL=15, HIGH=8, MODERATE=3
    const penalty = Math.min(
        (critical * 15 + high * 8 + moderate * 3) / WEIGHT_SECURITY,
        1,
    );
    const score = Math.round(WEIGHT_SECURITY * (1 - penalty));

    const reason = `${vulnerabilities.length} vulnerabilit${vulnerabilities.length === 1 ? 'y' : 'ies'} (${critical} critical, ${high} high)`;

    return { name: 'Security', score, maxScore: WEIGHT_SECURITY, reason };
}

function scoreDeprecation(info: PackageInfo | null): RiskFactor {
    if (!info) {
        return {
            name: 'Deprecation',
            score: WEIGHT_DEPRECATION,
            maxScore: WEIGHT_DEPRECATION,
            reason: 'Package info unavailable — skipped',
        };
    }

    if (info.deprecated !== false) {
        return {
            name: 'Deprecation',
            score: 0,
            maxScore: WEIGHT_DEPRECATION,
            reason: `Deprecated: ${typeof info.deprecated === 'string' ? info.deprecated : 'yes'}`,
        };
    }

    return {
        name: 'Deprecation',
        score: WEIGHT_DEPRECATION,
        maxScore: WEIGHT_DEPRECATION,
        reason: 'Not deprecated',
    };
}

function scoreMaintenance(info: PackageInfo | null): RiskFactor {
    if (!info) {
        return {
            name: 'Maintenance',
            score: WEIGHT_MAINTENANCE,
            maxScore: WEIGHT_MAINTENANCE,
            reason: 'Package info unavailable — skipped',
        };
    }

    let score = WEIGHT_MAINTENANCE;
    const reasons: string[] = [];

    // ── Last publish staleness ─────────────────
    const published = new Date(info.lastPublish);
    if (!isNaN(published.getTime())) {
        const daysSince = Math.floor(
            (Date.now() - published.getTime()) / (1000 * 60 * 60 * 24),
        );
        if (daysSince > 730) {
            // > 2 years
            score -= 10;
            reasons.push(`Last published ${daysSince} days ago`);
        } else if (daysSince > 365) {
            score -= 5;
            reasons.push(`Last published ${daysSince} days ago`);
        }
    }

    // ── Maintainer count ───────────────────────
    if (info.maintainerCount === 0) {
        score -= 5;
        reasons.push('No listed maintainers');
    } else if (info.maintainerCount === 1) {
        score -= 2;
        reasons.push('Single maintainer (bus factor)');
    }

    // ── Downloads (popularity proxy) ──────────
    if (info.weeklyDownloads < 100) {
        score -= 3;
        reasons.push(`Low usage: ${info.weeklyDownloads} weekly downloads`);
    }

    score = Math.max(score, 0);
    const reason = reasons.length > 0 ? reasons.join('; ') : 'Actively maintained';

    return { name: 'Maintenance', score, maxScore: WEIGHT_MAINTENANCE, reason };
}

// ─── Public API ─────────────────────────────

/**
 * Calculates a composite risk score (0–100) from all checker outputs.
 *
 * Higher score = safer package.
 * Returns `ALLOW`, `WARN`, or `BLOCK` recommendation.
 */
export function calculateRiskScore(
    compatibility: CompatibilityReport,
    security: SecurityReport,
    packageInfo: PackageInfo | null,
): RiskScore {
    const factors: RiskFactor[] = [
        scoreCompatibility(compatibility),
        scoreSecurity(security),
        scoreDeprecation(packageInfo),
        scoreMaintenance(packageInfo),
    ];

    const totalScore = factors.reduce((sum, f) => sum + f.score, 0);

    let action: RiskAction;
    if (totalScore > THRESHOLD_ALLOW) {
        action = 'ALLOW';
    } else if (totalScore > THRESHOLD_WARN) {
        action = 'WARN';
    } else {
        action = 'BLOCK';
    }

    return {
        score: totalScore,
        action,
        factors,
    };
}
