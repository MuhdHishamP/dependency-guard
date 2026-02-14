#!/usr/bin/env node

// ──────────────────────────────────────────────
// Dependency Guard — CLI Entry Point
// ──────────────────────────────────────────────

import { Command } from 'commander';

const program = new Command();

program
  .name('dependency-guard')
  .description(
    'Validate npm packages before installation — check peer dependency compatibility, deprecation, security vulnerabilities, and risk scoring.',
  )
  .version('0.1.0');

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
    // TODO: Phase 4 — wire up validator
    console.log(`[stub] Checking package: ${pkg}`);
    console.log(`[stub] Options:`, options);
  });

// ─── check-file <path> ──────────────────────

program
  .command('check-file <path>')
  .description('Scan all dependencies in a package.json')
  .option('--dry-run', 'Report only, do not exit with error code', false)
  .option('--no-cache', 'Bypass the local cache')
  .action(async (filePath: string, options) => {
    // TODO: Phase 4 — wire up validator
    console.log(`[stub] Scanning file: ${filePath}`);
    console.log(`[stub] Options:`, options);
  });

program.parse();
