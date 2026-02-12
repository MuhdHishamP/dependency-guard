// ──────────────────────────────────────────────
// Dependency Guard — Peer Dependency Compatibility Checker ⭐
// ──────────────────────────────────────────────
//
// PRIMARY differentiator: validates that a target package's
// peerDependencies are satisfied by the user's project BEFORE install.

import fs from 'node:fs/promises';
import path from 'node:path';
import semver from 'semver';
import fetch from 'node-fetch';

import type {
    PeerCheck,
    PeerStatus,
    CompatibilityReport,
} from '../types.js';
import { cache } from '../utils/cache.js';

// ─── Interfaces for raw npm registry data ───

interface NpmVersionData {
    peerDependencies?: Record<string, string>;
    peerDependenciesMeta?: Record<string, { optional?: boolean }>;
}

interface NpmRegistryResponse {
    'dist-tags'?: { latest?: string };
    versions?: Record<string, NpmVersionData>;
}

// ─── package.json discovery ─────────────────

/**
 * Walk up to `maxDepth` parent directories from `startPath`
 * looking for a `package.json`.  Returns the absolute path
 * or `null` if none found.
 */
export async function findPackageJson(
    startPath: string,
    maxDepth: number = 3,
): Promise<string | null> {
    let current = path.resolve(startPath);

    for (let i = 0; i < maxDepth; i++) {
        const candidate = path.join(current, 'package.json');
        try {
            await fs.access(candidate);
            return candidate;
        } catch {
            const parent = path.dirname(current);
            if (parent === current) break; // filesystem root
            current = parent;
        }
    }

    return null;
}

// ─── Read installed deps from user's package.json ───

interface UserPackageJson {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
}

/**
 * Merges `dependencies` + `devDependencies` from the user's
 * `package.json` into a single name→range map.
 */
export async function getInstalledPackages(
    pkgJsonPath: string,
): Promise<Record<string, string>> {
    const raw = await fs.readFile(pkgJsonPath, 'utf-8');
    const pkg = JSON.parse(raw) as UserPackageJson;

    const installed: Record<string, string> = {};
    if (pkg.dependencies) Object.assign(installed, pkg.dependencies);
    if (pkg.devDependencies) Object.assign(installed, pkg.devDependencies);

    return installed;
}

// ─── Fetch peer deps from npm registry ──────

/**
 * Fetches the `peerDependencies` and `peerDependenciesMeta` for a
 * given npm package (at its latest version).
 *
 * Results are cached for 24 h.
 */
export async function fetchPeerDependencies(
    packageName: string,
): Promise<{
    peers: Record<string, string>;
    meta: Record<string, { optional?: boolean }>;
    resolvedVersion: string;
} | null> {
    const cacheKey = `peers:${packageName}`;

    interface CachedPeers {
        peers: Record<string, string>;
        meta: Record<string, { optional?: boolean }>;
        resolvedVersion: string;
    }

    const cached = await cache.get<CachedPeers>(cacheKey);
    if (cached) return cached;

    try {
        const url = `https://registry.npmjs.org/${encodeURIComponent(packageName)}`;
        const res = await fetch(url);

        if (!res.ok) return null;

        const data = (await res.json()) as NpmRegistryResponse;
        const latestTag = data['dist-tags']?.latest;
        if (!latestTag || !data.versions) return null;

        const versionData = data.versions[latestTag];
        if (!versionData) return null;

        const result: CachedPeers = {
            peers: versionData.peerDependencies ?? {},
            meta: versionData.peerDependenciesMeta ?? {},
            resolvedVersion: latestTag,
        };

        await cache.set(cacheKey, result);
        return result;
    } catch {
        return null;
    }
}

// ─── Core compatibility check ───────────────

/**
 * Checks whether the user's project satisfies the peer dependencies
 * of a target npm package.
 *
 * @param packageName  The npm package the user wants to install.
 * @param projectPath  Directory to begin searching for `package.json`.
 *                     Defaults to `process.cwd()`.
 *
 * @returns A `CompatibilityReport` with per-peer results.
 */
export async function checkCompatibility(
    packageName: string,
    projectPath: string = process.cwd(),
): Promise<CompatibilityReport> {
    // ── 1. Locate user's package.json ──────────
    const pkgJsonPath = await findPackageJson(projectPath);

    if (!pkgJsonPath) {
        // No project context — return empty, don't crash
        return { packageName, checks: [], compatible: true };
    }

    const installed = await getInstalledPackages(pkgJsonPath);

    // ── 2. Fetch target's peer deps from npm ───
    const peerData = await fetchPeerDependencies(packageName);

    if (!peerData || Object.keys(peerData.peers).length === 0) {
        // No peer deps declared — nothing to check
        return { packageName, checks: [], compatible: true };
    }

    // ── 3. Compare each peer dep ───────────────
    const checks: PeerCheck[] = [];
    const fixParts: string[] = [];

    for (const [peerName, requiredRange] of Object.entries(peerData.peers)) {
        const isOptional = peerData.meta[peerName]?.optional === true;
        const installedRange = installed[peerName] ?? null;

        let status: PeerStatus;
        let fixCommand: string | undefined;

        if (installedRange === null) {
            // ── Not installed ──
            if (isOptional) {
                status = 'OPTIONAL_MISSING';
                // No fix command for optional peers
            } else {
                status = 'MISSING';
                fixCommand = `npm install ${peerName}@"${requiredRange}"`;
                fixParts.push(`${peerName}@"${requiredRange}"`);
            }
        } else {
            // ── Installed — check range intersection ──
            const compatible = semver.intersects(installedRange, requiredRange);
            if (compatible) {
                status = 'COMPATIBLE';
            } else {
                status = 'INCOMPATIBLE';
                fixCommand = `npm install ${peerName}@"${requiredRange}"`;
                fixParts.push(`${peerName}@"${requiredRange}"`);
            }
        }

        checks.push({
            name: peerName,
            required: requiredRange,
            installed: installedRange,
            status,
            fixCommand,
        });
    }

    // ── 4. Build combined fix command ──────────
    if (fixParts.length > 0) {
        const combinedFix = `npm install ${fixParts.join(' ')}`;
        // Attach the combined command to the first failing check for display
        const firstFailing = checks.find(
            (c) => c.status === 'MISSING' || c.status === 'INCOMPATIBLE',
        );
        if (firstFailing) {
            firstFailing.fixCommand = combinedFix;
        }
    }

    const compatible = checks.every(
        (c) => c.status === 'COMPATIBLE' || c.status === 'OPTIONAL_MISSING',
    );

    return { packageName, checks, compatible };
}
