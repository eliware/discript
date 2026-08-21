import { execFileSync } from 'node:child_process';
import { gunzipSync } from 'node:zlib';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
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
  const normalizedArchiveFiles = listTarEntries(readFileSync(tarball));
  if (!normalizedArchiveFiles.includes('package/docs/README.md')) throw new Error('Packaged documentation is missing docs/README.md.');
  for (const required of ['package/SPEC.md', 'package/docs/examples/README.md', 'package/docs/mcp/deployment-examples.md', 'package/src/mcp/client.mjs', 'package/src/mcp/server.mjs']) {
    if (!normalizedArchiveFiles.includes(required)) throw new Error(`Packaged MCP artifact is missing ${required}.`);
  }
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

function listTarEntries(gzipTarball) {
  const archive = gunzipSync(gzipTarball);
  const entries = [];
  for (let offset = 0; offset + 512 <= archive.length;) {
    const header = archive.subarray(offset, offset + 512);
    if (header.every(byte => byte === 0)) break;
    const name = header.toString('utf8', 0, 100).replace(/\0.*$/, '');
    const prefix = header.toString('utf8', 345, 500).replace(/\0.*$/, '');
    if (name) entries.push(`${prefix ? `${prefix}/` : ''}${name}`.replaceAll('\\', '/'));
    const sizeText = header.toString('ascii', 124, 136).replace(/\0.*$/, '').trim();
    const size = Number.parseInt(sizeText || '0', 8);
    offset += 512 + Math.ceil(size / 512) * 512;
  }
  return entries;
}
