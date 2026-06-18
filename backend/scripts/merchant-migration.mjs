#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const mode = process.argv[2];
if (!mode || !['generate', 'create'].includes(mode)) {
  console.error('Usage: node scripts/merchant-migration.mjs <generate|create>');
  process.exit(1);
}

const rootDir = process.cwd();
const migrationsDir = path.join(rootDir, 'apps/merchant-service/src/database/migrations');

const formatToday = () => {
  const now = new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
};

const extractSequence = (fileName) => {
  const matchNew = fileName.match(/^(?:\d+-)?(\d{3})-MG-\d{8}\.ts$/);
  if (matchNew) return Number(matchNew[1]);

  const matchPrev = fileName.match(/^(?:\d+-)?MG-(\d{3})-\d{8}\.ts$/);
  if (matchPrev) return Number(matchPrev[1]);

  return null;
};

const allMigrationFiles = readdirSync(migrationsDir).filter((name) => name.endsWith('.ts'));
const allSequences = allMigrationFiles
  .map(extractSequence)
  .filter((value) => value !== null)
  .map((value) => Number(value));

const nextSequence = (allSequences.length ? Math.max(...allSequences) : 0) + 1;
const sequencePart = String(nextSequence).padStart(3, '0');
const today = formatToday();
const baseName = `${sequencePart}-MG-${today}`;
const targetPath = path.join(migrationsDir, `${baseName}.ts`);

const runCommand = () => {
  if (mode === 'generate') {
    execFileSync(
      'pnpm',
      [
        'exec',
        'typeorm-ts-node-commonjs',
        '-d',
        './typeorm/merchant.datasource.ts',
        'migration:generate',
        `./apps/merchant-service/src/database/migrations/${baseName}`,
      ],
      { stdio: 'inherit', cwd: rootDir },
    );
    return;
  }

  execFileSync(
    'pnpm',
    ['exec', 'typeorm-ts-node-commonjs', 'migration:create', `./apps/merchant-service/src/database/migrations/${baseName}`],
    { stdio: 'inherit', cwd: rootDir },
  );
};

const resolveGeneratedFilePath = () => {
  const filesAfter = readdirSync(migrationsDir).filter((name) => name.endsWith(`-${baseName}.ts`) || name === `${baseName}.ts`);

  if (!filesAfter.length) {
    throw new Error(`Could not find generated migration for ${baseName}`);
  }

  filesAfter.sort((a, b) => a.localeCompare(b));
  return path.join(migrationsDir, filesAfter[filesAfter.length - 1]);
};

const normalizeFileNameAndClass = (generatedPath) => {
  const generatedFileName = path.basename(generatedPath);
  const timestampMatch = generatedFileName.match(/^(\d+)-/);
  const timestamp = timestampMatch ? timestampMatch[1] : String(Date.now());

  if (generatedPath !== targetPath) {
    renameSync(generatedPath, targetPath);
  }

  const className = `MG${sequencePart}${today}${timestamp}`;
  const fileContent = readFileSync(targetPath, 'utf8');

  let updated = fileContent.replace(
    /export\s+class\s+[A-Za-z0-9_]+\s+implements\s+MigrationInterface/,
    `export class ${className} implements MigrationInterface`,
  );

  if (/\n\s*name\s*=\s*'[^']*'\s*\n/.test(updated)) {
    updated = updated.replace(/name\s*=\s*'[^']*'/, `name = '${className}'`);
  }

  writeFileSync(targetPath, updated, 'utf8');
  console.log(`Migration ready: apps/merchant-service/src/database/migrations/${baseName}.ts`);
};

try {
  runCommand();
  const generatedPath = resolveGeneratedFilePath();
  normalizeFileNameAndClass(generatedPath);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
