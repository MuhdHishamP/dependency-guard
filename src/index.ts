#!/usr/bin/env node

// ──────────────────────────────────────────────
// Dependency Guard — CLI Entry Point
// ──────────────────────────────────────────────

import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import fs from 'node:fs/promises';
import { validatePackage } from './validator.js';
import * as logger from './utils/logger.js';
import type { RiskAction } from './types.js';

const program = new Command();

program
  .name('dependency-guard')
  .description(
    'Validate npm packages before installation — check peer dependency compatibility, deprecation, security vulnerabilities, and risk scoring.',
  )
  .version('0.1.0');

// ─── Helper: Report Results ──────────────────

function reportResult(result: any, dryRun: boolean) {
  const { packageName, compatibility, packageInfo, security, riskScore, action } = result;

  // 1. Compatibility Section
  logger.logSection('COMPATIBILITY');
  if (compatibility.checks.length === 0) {
    logger.logSuccess('No peer dependencies to check.');
  } else {
    compatibility.checks.forEach((check: any) => {
      console.log(logger.formatPeerStatus(check.name, check.required, check.installed, check.status));
    });

    const fixCommand = compatibility.checks.find((c: any) => c.fixCommand)?.fixCommand;
    if (fixCommand) {
      console.log('\n' + chalk.bold('💡 Run this to fix:'));
      console.log(chalk.cyan(`  ${fixCommand}`));
    }
  }

  // 2. Security Section
  logger.logSection('SECURITY');
  if (security.vulnerabilities.length === 0) {
    logger.logSuccess('No known vulnerabilities.');
  } else {
    security.vulnerabilities.forEach((v: any) => {
      const color = v.severity === 'CRITICAL' || v.severity === 'HIGH' ? chalk.red : chalk.yellow;
      console.log(`${color(`  [${v.severity}]`)} ${v.summary}`);
      console.log(chalk.dim(`    ID: ${v.id} | Affected: ${v.affectedVersions}`));
      if (v.url) console.log(chalk.dim(`    Link: ${v.url}`));
    });
  }

  // 3. NPM Info Section
  logger.logSection('PACKAGE INFO');
  if (!packageInfo) {
    logger.logWarning('Could not fetch package information from npm.');
  } else {
    if (packageInfo.deprecated) {
      logger.logError(`DEPRECATED: ${packageInfo.deprecated}`);
    } else {
      logger.logSuccess('Not deprecated.');
    }
    console.log(chalk.dim(`  Version: ${packageInfo.version} | License: ${packageInfo.license}`));
    console.log(chalk.dim(`  Downloads: ${packageInfo.weeklyDownloads.toLocaleString()} weekly`));
  }

  // 4. Final Risk Score
  logger.logSection('SUMMARY');
  const boxType = action === 'ALLOW' ? 'success' : action === 'WARN' ? 'warning' : 'error';
  const actionText = action === 'BLOCK' ? chalk.red.bold('BLOCK (High Risk)') : 
                     action === 'WARN' ? chalk.yellow.bold('WARN (Medium Risk)') : 
                     chalk.green.bold('ALLOW (Low Risk)');

  const summaryContent = [
    `Package: ${packageName}`,
    `Risk Score: ${riskScore.score}/100`,
    `Recommendation: ${actionText}`,
    '',
    ...riskScore.factors.map((f: any) => `${f.score}/${f.maxScore} - ${f.name}: ${f.reason}`)
  ].join('\n');

  logger.renderResultBox(summaryContent, boxType);

  // 5. Exit if needed
  if (!dryRun && action === 'BLOCK') {
    process.exit(1);
  }
}

// ─── check <package> ─────────────────────────

program
  .command('check <package>')
  .description('Validate a single npm package before installing')
  .option('--dry-run', 'Report only, do not exit with error code', false)
  .option('--no-cache', 'Bypass the local cache')
  .option(
    '--project-path <dir>',
    'Path to the project root (defaults to cwd)',
    '.',
  )
  .action(async (pkg: string, options) => {
    const spinner = ora(`Validating package ${chalk.bold(pkg)}...`).start();
    try {
      const result = await validatePackage(pkg, options.projectPath);
      spinner.stop();
      reportResult(result, options.dryRun);
    } catch (error: any) {
      spinner.fail(`Validation failed: ${error.message}`);
      process.exit(1);
    }
  });

// ─── check-file <path> ──────────────────────

program
  .command('check-file <path>')
  .description('Scan all dependencies in a package.json')
  .option('--dry-run', 'Report only, do not exit with error code', false)
  .option('--no-cache', 'Bypass the local cache')
  .action(async (filePath: string, options) => {
    const spinner = ora(`Reading ${chalk.bold(filePath)}...`).start();
    try {
      const raw = await fs.readFile(filePath, 'utf-8');
      const pkgJson = JSON.parse(raw);
      const deps = { ...pkgJson.dependencies, ...pkgJson.devDependencies };
      const pkgNames = Object.keys(deps);

      spinner.text = `Validating ${pkgNames.length} packages...`;
      
      let hasBlock = false;
      for (const pkg of pkgNames) {
        spinner.text = `Validating ${chalk.bold(pkg)} (${pkgNames.indexOf(pkg) + 1}/${pkgNames.length})...`;
        const result = await validatePackage(pkg);
        // For file check, we might want a more compact report, 
        // but for now, let's use the standard report.
        console.log(`\n${'='.repeat(40)}`);
        reportResult(result, true); // Don't exit early on file check
        if (result.action === 'BLOCK') hasBlock = true;
      }

      spinner.succeed('Scan complete.');
      if (!options.dryRun && hasBlock) {
        process.exit(1);
      }
    } catch (error: any) {
      spinner.fail(`Scan failed: ${error.message}`);
      process.exit(1);
    }
  });

program.parse();
