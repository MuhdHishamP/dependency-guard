// ──────────────────────────────────────────────
// Dependency Guard — Deprecated Package Alternatives
// ──────────────────────────────────────────────

/**
 * Maps well-known deprecated (or effectively-deprecated) packages
 * to their recommended modern alternatives.
 *
 * This list is intentionally conservative — only packages with widely
 * accepted replacements are included.
 */
export const DEPRECATED_ALTERNATIVES: Readonly<Record<string, readonly string[]>> = {
    // Date / time
    moment: ['date-fns', 'luxon', 'dayjs'],
    'moment-timezone': ['luxon', 'date-fns-tz'],

    // HTTP clients
    request: ['axios', 'node-fetch', 'undici', 'got'],
    'request-promise': ['axios', 'node-fetch', 'undici', 'got'],
    'request-promise-native': ['axios', 'node-fetch', 'undici', 'got'],

    // Utility belts
    lodash: ['lodash-es', 'radash', 'remeda'],
    underscore: ['lodash-es', 'radash', 'remeda'],

    // Promises
    bluebird: ['native Promise', 'p-map', 'p-limit'],
    q: ['native Promise', 'p-defer'],

    // Async flow control
    async: ['p-queue', 'p-limit', 'p-map'],

    // Crypto
    'crypto-js': ['Web Crypto API', 'noble-ciphers'],

    // CLI
    colors: ['chalk', 'picocolors', 'kleur'],
    'colors.js': ['chalk', 'picocolors', 'kleur'],

    // Testing
    istanbul: ['c8', 'nyc'],

    // Bundlers / task runners
    gulp: ['Vite', 'esbuild', 'Rollup'],
    bower: ['npm', 'pnpm', 'yarn'],

    // UUID
    uuid: ['crypto.randomUUID()', 'nanoid'],

    // Misc
    querystring: ['URLSearchParams (built-in)'],
    'node-uuid': ['crypto.randomUUID()', 'nanoid'],
    nomnom: ['commander', 'yargs', 'citty'],
    optimist: ['commander', 'yargs', 'citty'],
};

/**
 * Returns modern alternatives for a given (possibly deprecated) package.
 * An empty array means no known alternatives are on file.
 */
export const getAlternatives = (packageName: string): readonly string[] => {
    return DEPRECATED_ALTERNATIVES[packageName] ?? [];
};

/**
 * Quick check if the package is in our known-deprecated list.
 * Note: this does NOT hit the npm registry — it's a local heuristic only.
 */
export const isKnownDeprecated = (packageName: string): boolean => {
    return packageName in DEPRECATED_ALTERNATIVES;
};
