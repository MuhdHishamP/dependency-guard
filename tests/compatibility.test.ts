import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkCompatibility, findPackageJson } from '../src/checkers/compatibility.js';
import fs from 'node:fs/promises';
import fetch from 'node-fetch';

vi.mock('node-fetch');
vi.mock('node:fs/promises');

describe('Compatibility Checker', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return compatible if no peer dependencies are found', async () => {
        // Mock package.json discovery
        (fs.access as any).mockResolvedValue(undefined);
        (fs.readFile as any).mockResolvedValue(JSON.stringify({
            dependencies: { react: '^18.0.0' }
        }));

        // Mock npm registry response
        (fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({
                'dist-tags': { latest: '1.0.0' },
                versions: {
                    '1.0.0': { peerDependencies: {} }
                }
            })
        });

        const result = await checkCompatibility('some-pkg', './');
        expect(result.compatible).toBe(true);
        expect(result.checks).toHaveLength(0);
    });

    it('should detect missing required peer dependencies', async () => {
        (fs.access as any).mockResolvedValue(undefined);
        (fs.readFile as any).mockResolvedValue(JSON.stringify({
            dependencies: {} // Nothing installed
        }));

        (fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({
                'dist-tags': { latest: '1.0.0' },
                versions: {
                    '1.0.0': { 
                        peerDependencies: { react: '^18.0.0' } 
                    }
                }
            })
        });

        const result = await checkCompatibility('some-pkg', './');
        expect(result.compatible).toBe(false);
        expect(result.checks[0].status).toBe('MISSING');
        expect(result.checks[0].name).toBe('react');
    });

    it('should detect incompatible peer dependencies', async () => {
        (fs.access as any).mockResolvedValue(undefined);
        (fs.readFile as any).mockResolvedValue(JSON.stringify({
            dependencies: { react: '^17.0.0' }
        }));

        (fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({
                'dist-tags': { latest: '1.0.0' },
                versions: {
                    '1.0.0': { 
                        peerDependencies: { react: '^18.0.0' } 
                    }
                }
            })
        });

        const result = await checkCompatibility('some-pkg', './');
        expect(result.compatible).toBe(false);
        expect(result.checks[0].status).toBe('INCOMPATIBLE');
    });

    it('should handle optional missing peer dependencies correctly', async () => {
        (fs.access as any).mockResolvedValue(undefined);
        (fs.readFile as any).mockResolvedValue(JSON.stringify({
            dependencies: {}
        }));

        (fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({
                'dist-tags': { latest: '1.0.0' },
                versions: {
                    '1.0.0': { 
                        peerDependencies: { 'some-optional': '^1.0.0' },
                        peerDependenciesMeta: { 'some-optional': { optional: true } }
                    }
                }
            })
        });

        const result = await checkCompatibility('some-pkg', './');
        expect(result.compatible).toBe(true);
        expect(result.checks[0].status).toBe('OPTIONAL_MISSING');
    });

    it('should handle missing package.json gracefully', async () => {
        // Mock package.json NOT found
        (fs.access as any).mockRejectedValue(new Error('Not found'));

        const result = await checkCompatibility('some-pkg', '/absent/path');
        expect(result.compatible).toBe(true);
        expect(result.checks).toHaveLength(0);
        expect(result.packageName).toBe('some-pkg');
    });
});
