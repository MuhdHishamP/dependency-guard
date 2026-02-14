import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validatePackage } from '../src/validator.js';
import * as compatibility from '../src/checkers/compatibility.js';
import * as npm from '../src/checkers/npm.js';
import * as security from '../src/checkers/security.js';
import * as scoring from '../src/checkers/scoring.js';

vi.mock('../src/checkers/compatibility.js');
vi.mock('../src/checkers/npm.js');
vi.mock('../src/checkers/security.js');
vi.mock('../src/checkers/scoring.js');

describe('Validator Orchestrator', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should orchestrate all checks and return a combined result', async () => {
        const mockCompatibility = { packageName: 'test-pkg', checks: [], compatible: true };
        const mockPackageInfo = { name: 'test-pkg', version: '1.0.0', deprecated: false } as any;
        const mockSecurity = { packageName: 'test-pkg', vulnerabilities: [], hasCritical: false };
        const mockRiskScore = { score: 100, action: 'ALLOW', factors: [] } as any;

        vi.mocked(compatibility.checkCompatibility).mockResolvedValue(mockCompatibility);
        vi.mocked(npm.getPackageInfo).mockResolvedValue(mockPackageInfo);
        vi.mocked(security.checkSecurity).mockResolvedValue(mockSecurity);
        vi.mocked(scoring.calculateRiskScore).mockReturnValue(mockRiskScore);

        const result = await validatePackage('test-pkg');

        expect(result.packageName).toBe('test-pkg');
        expect(result.compatibility).toEqual(mockCompatibility);
        expect(result.packageInfo).toEqual(mockPackageInfo);
        expect(result.security).toEqual(mockSecurity);
        expect(result.riskScore).toEqual(mockRiskScore);
        expect(result.action).toBe('ALLOW');

        expect(compatibility.checkCompatibility).toHaveBeenCalledWith('test-pkg', undefined);
        expect(security.checkSecurity).toHaveBeenCalledWith('test-pkg', '1.0.0');
    });

    it('should use "latest" as fallback version for security check if package info is missing', async () => {
        vi.mocked(npm.getPackageInfo).mockResolvedValue(null);
        vi.mocked(compatibility.checkCompatibility).mockResolvedValue({} as any);
        vi.mocked(security.checkSecurity).mockResolvedValue({} as any);
        vi.mocked(scoring.calculateRiskScore).mockReturnValue({ action: 'ALLOW' } as any);

        await validatePackage('missing-pkg');

        expect(security.checkSecurity).toHaveBeenCalledWith('missing-pkg', 'latest');
    });
});
