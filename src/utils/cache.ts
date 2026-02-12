// ──────────────────────────────────────────────
// Dependency Guard — File-based JSON Cache
// ──────────────────────────────────────────────

import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';

import type { CacheEntry } from '../types.js';

// ─── Constants ──────────────────────────────

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Resolve the cache directory.
 * Uses `~/.dependency-guard/cache/` by default, overridable via env.
 */
const getCacheDir = (): string => {
    const base =
        process.env['DEPENDENCY_GUARD_CACHE_DIR'] ??
        path.join(os.homedir(), '.dependency-guard', 'cache');
    return base;
};

/**
 * Convert an arbitrary cache key into a safe filename.
 * Uses a short SHA-256 hash to avoid path-length / special-char issues.
 */
const keyToFilename = (key: string): string => {
    const hash = crypto.createHash('sha256').update(key).digest('hex').slice(0, 16);
    // Prefix with the sanitised key for human readability
    const safe = key.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
    return `${safe}__${hash}.json`;
};

// ─── Cache class ────────────────────────────

export class Cache {
    private readonly cacheDir: string;

    constructor(cacheDir?: string) {
        this.cacheDir = cacheDir ?? getCacheDir();
    }

    // ── Directory bootstrap ──────────────────

    async ensureDir(): Promise<void> {
        await fs.mkdir(this.cacheDir, { recursive: true });
    }

    // ── Read ─────────────────────────────────

    async get<T>(key: string): Promise<T | null> {
        await this.ensureDir();
        const filePath = path.join(this.cacheDir, keyToFilename(key));

        try {
            const raw = await fs.readFile(filePath, 'utf-8');
            const entry: CacheEntry<T> = JSON.parse(raw) as CacheEntry<T>;

            const age = Date.now() - entry.timestamp;
            if (age > entry.ttl) {
                // Expired — remove silently
                await fs.unlink(filePath).catch(() => { });
                return null;
            }

            return entry.data;
        } catch {
            // File missing or corrupt — treat as cache miss
            return null;
        }
    }

    // ── Write ────────────────────────────────

    async set<T>(key: string, data: T, ttl: number = DEFAULT_TTL_MS): Promise<void> {
        await this.ensureDir();
        const filePath = path.join(this.cacheDir, keyToFilename(key));

        const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
            ttl,
        };

        await fs.writeFile(filePath, JSON.stringify(entry, null, 2), 'utf-8');
    }

    // ── Delete single key ────────────────────

    async del(key: string): Promise<void> {
        const filePath = path.join(this.cacheDir, keyToFilename(key));
        await fs.unlink(filePath).catch(() => { });
    }

    // ── Purge all cached data ────────────────

    async clear(): Promise<void> {
        try {
            const files = await fs.readdir(this.cacheDir);
            await Promise.all(
                files
                    .filter((f) => f.endsWith('.json'))
                    .map((f) => fs.unlink(path.join(this.cacheDir, f)).catch(() => { })),
            );
        } catch {
            // Directory may not exist — that's fine
        }
    }
}

// ─── Singleton for convenience ──────────────

export const cache = new Cache();
