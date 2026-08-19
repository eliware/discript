import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const directory = mkdtempSync(join(tmpdir(), 'discript-package-check-'));
try {
  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const spawnOptions = { stdio: 'pipe', ...(process.platform === 'win32' ? { shell: true } : {}) };
  execFileSync(npmCommand, ['pack', '--pack-destination', directory], spawnOptions);
  const tarballName = readdirSync(directory).find(name => name.endsWith('.tgz'));
  const tarball = tarballName ? join(directory, tarballName) : '';
  if (!tarball) throw new Error('npm pack did not produce a tarball.');
  execFileSync(npmCommand, ['install', '--ignore-scripts', '--no-audit', '--no-fund', tarball], { ...spawnOptions, cwd: directory });
  const binary = join(directory, 'node_modules', '.bin', process.platform === 'win32' ? 'discript.cmd' : 'discript');
  const help = execFileSync(binary, ['--help'], {
    ...spawnOptions,
    cwd: directory,
    encoding: 'utf8'
  });
  if (!help.includes('Usage: discript')) throw new Error('Packaged CLI did not return help output.');
  console.log('Package install smoke check passed.');
} finally {
  rmSync(directory, { recursive: true, force: true });
}
