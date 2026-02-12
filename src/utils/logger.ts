// ──────────────────────────────────────────────
// Dependency Guard — Logger Utilities
// ──────────────────────────────────────────────

import chalk from 'chalk';
import boxen, { type Options as BoxenOptions } from 'boxen';

// ─── Simple log helpers ─────────────────────

export const logSuccess = (msg: string): void => {
  console.log(chalk.green('✓') + ' ' + msg);
};

export const logWarning = (msg: string): void => {
  console.log(chalk.yellow('⚠') + ' ' + chalk.yellow(msg));
};

export const logError = (msg: string): void => {
  console.error(chalk.red('✗') + ' ' + chalk.red(msg));
};

export const logInfo = (msg: string): void => {
  console.log(chalk.blue('ℹ') + ' ' + msg);
};

// ─── Boxed result rendering ─────────────────

type ResultType = 'success' | 'warning' | 'error';

const BORDER_COLORS: Record<ResultType, string> = {
  success: 'green',
  warning: 'yellow',
  error: 'red',
};

export const renderResultBox = (content: string, type: ResultType): void => {
  const borderColor = BORDER_COLORS[type];
  const options: BoxenOptions = {
    padding: 1,
    borderStyle: 'round',
    borderColor,
  };
  console.log(boxen(content, options));
};

// ─── Section headers ────────────────────────

export const logSection = (title: string): void => {
  console.log('\n' + chalk.bold.underline(title));
};

// ─── Peer dependency status formatting ──────

export const formatPeerStatus = (
  name: string,
  required: string,
  installed: string | null,
  status: string,
): string => {
  switch (status) {
    case 'MISSING':
      return chalk.red(`  ❌ Missing: ${name}`) + `\n     Required: ${required}`;
    case 'INCOMPATIBLE':
      return (
        chalk.yellow(`  ⚠️  Incompatible: ${name}`) +
        `\n     Required: ${required}` +
        `\n     You have: ${installed ?? 'unknown'}`
      );
    case 'OPTIONAL_MISSING':
      return chalk.dim(`  • ${name}: ${required}`);
    case 'COMPATIBLE':
      return chalk.green(`  ✓ ${name}: ${installed ?? required}`);
    default:
      return `  ? ${name}: ${status}`;
  }
};
