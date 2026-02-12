// ──────────────────────────────────────────────
// Dependency Guard — npm Registry Info Checker
// ──────────────────────────────────────────────
//
// Fetches package metadata from the npm registry:
// deprecation status, last publish date, downloads,
// maintainer count, license, etc.

import fetch from 'node-fetch';

import type { PackageInfo } from '../types.js';
import { cache } from '../utils/cache.js';

// ─── Raw npm registry shapes ────────────────

interface NpmRegistryFull {
    name?: string;
    description?: string;
    'dist-tags'?: { latest?: string };
    time?: Record<string, string>;
    license?: string | { type?: string };
    homepage?: string;
    repository?: string | { url?: string };
    maintainers?: Array<{ name?: string }>;
    versions?: Record<string, NpmVersionPayload>;
}

interface NpmVersionPayload {
    deprecated?: string;
    peerDependencies?: Record<string, string>;
    peerDependenciesMeta?: Record<string, { optional?: boolean }>;
}

// ─── Downloads API shape ────────────────────

interface NpmDownloadsResponse {
    downloads?: number;
}

// ─── Public API ─────────────────────────────

/**
 * Fetches comprehensive metadata for an npm package.
 *
 * @param packageName  npm package name (scoped names supported)
 * @returns `PackageInfo` or `null` if the package cannot be found
 */
export async function getPackageInfo(
    packageName: string,
): Promise<PackageInfo | null> {
    const cacheKey = `npminfo:${packageName}`;
    const cached = await cache.get<PackageInfo>(cacheKey);
    if (cached) return cached;

    try {
        // ── 1.  Fetch full packument ──────────────
        const registryUrl = `https://registry.npmjs.org/${encodeURIComponent(packageName)}`;
        const regRes = await fetch(registryUrl);
        if (!regRes.ok) return null;

        const reg = (await regRes.json()) as NpmRegistryFull;
        const latestVersion = reg['dist-tags']?.latest ?? '0.0.0';
        const versionData = reg.versions?.[latestVersion];

        // ── 2.  Fetch weekly downloads ────────────
        let weeklyDownloads = 0;
        try {
            const dlUrl = `https://api.npmjs.org/downloads/point/last-week/${encodeURIComponent(packageName)}`;
            const dlRes = await fetch(dlUrl);
            if (dlRes.ok) {
                const dlData = (await dlRes.json()) as NpmDownloadsResponse;
                weeklyDownloads = dlData.downloads ?? 0;
            }
        } catch {
            // Non-critical — leave at 0
        }

        // ── 3.  Normalize fields ──────────────────
        const deprecated = versionData?.deprecated ?? false;
        const lastPublish = reg.time?.[latestVersion] ?? reg.time?.['modified'] ?? 'unknown';

        const rawLicense = reg.license;
        const license =
            typeof rawLicense === 'string'
                ? rawLicense
                : rawLicense?.type ?? 'unknown';

        const rawRepo = reg.repository;
        const repository =
            typeof rawRepo === 'string'
                ? rawRepo
                : rawRepo?.url?.replace(/^git\+/, '').replace(/\.git$/, '') ?? '';

        const info: PackageInfo = {
            name: reg.name ?? packageName,
            version: latestVersion,
            description: reg.description ?? '',
            deprecated,
            lastPublish,
            weeklyDownloads,
            maintainerCount: reg.maintainers?.length ?? 0,
            license,
            peerDependencies: versionData?.peerDependencies ?? {},
            peerDependenciesMeta: versionData?.peerDependenciesMeta ?? {},
            homepage: reg.homepage ?? '',
            repository,
        };

        await cache.set(cacheKey, info);
        return info;
    } catch {
        return null;
    }
}

// ─── Convenience helpers ────────────────────

/**
 * Quick check: is the package marked deprecated on npm?
 */
export async function isDeprecated(
    packageName: string,
): Promise<{ deprecated: boolean; message: string }> {
    const info = await getPackageInfo(packageName);
    if (!info) return { deprecated: false, message: '' };

    return {
        deprecated: info.deprecated !== false,
        message: typeof info.deprecated === 'string' ? info.deprecated : '',
    };
}

/**
 * Returns the number of days since the package was last published.
 * Returns `Infinity` if the date is unavailable.
 */
export function daysSincePublish(lastPublish: string): number {
    const d = new Date(lastPublish);
    if (isNaN(d.getTime())) return Infinity;
    return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}
