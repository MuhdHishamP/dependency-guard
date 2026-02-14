// ──────────────────────────────────────────────
// Dependency Guard — Orchestrator (Validator)
// ──────────────────────────────────────────────

import { checkCompatibility } from './checkers/compatibility.js';
import { getPackageInfo } from './checkers/npm.js';
import { checkSecurity } from './checkers/security.js';
import { calculateRiskScore } from './checkers/scoring.js';
import type { ValidationResult } from './types.js';

/**
 * Orchestrates the full validation flow for a single package.
 * 
 * 1. Checks peer dependency compatibility with the local project.
 * 2. Fetches metadata from npm (deprecation, maintainers, etc.).
 * 3. Checks for security vulnerabilities via OSV.dev.
 * 4. Calculates a final risk score and recommendation.
 *
 * @param packageName  The npm package to validate.
 * @param projectPath  Optional path to the project root (for compatibility checking).
 * @returns A comprehensive ValidationResult.
 */
export async function validatePackage(
    packageName: string,
    projectPath?: string,
): Promise<ValidationResult> {
    // 1. Run all checks in parallel for performance
    const [compatibility, packageInfo] = await Promise.all([
        checkCompatibility(packageName, projectPath),
        getPackageInfo(packageName),
    ]);

    // 2. Security check requires the resolved version from packageInfo (if available)
    const version = packageInfo?.version ?? 'latest';
    const security = await checkSecurity(packageName, version);

    // 3. Calculate final risk score
    const riskScore = calculateRiskScore(compatibility, security, packageInfo);

    return {
        packageName,
        compatibility,
        packageInfo,
        security,
        riskScore,
        action: riskScore.action,
    };
}
