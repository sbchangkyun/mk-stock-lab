import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root = process.cwd();
const outputRoot = path.join(root, '.vercel', 'output');
const staticOutput = path.join(outputRoot, 'static');
const configPath = path.join(outputRoot, 'config.json');

const candidateClientDirs = [
  path.join(os.tmpdir(), 'mk-stock-lab-astro-dist', 'client'),
  path.join(root, 'dist', 'client'),
  path.join(root, 'dist'),
];

const hasFiles = (dir) => existsSync(dir) && readdirSync(dir).length > 0;

const copyDirectory = (source, destination) => {
  mkdirSync(destination, { recursive: true });

  for (const entry of readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, destinationPath);
      continue;
    }

    if (entry.isFile() || statSync(sourcePath).isFile()) {
      copyFileSync(sourcePath, destinationPath);
    }
  }
};

if (existsSync(configPath) && !hasFiles(staticOutput)) {
  const clientDir = candidateClientDirs.find(hasFiles);

  if (!clientDir) {
    throw new Error('Vercel output static directory is empty and no client build directory was found.');
  }

  rmSync(staticOutput, { recursive: true, force: true });
  mkdirSync(staticOutput, { recursive: true });
  copyDirectory(clientDir, staticOutput);
  console.log('Repaired Vercel static output from generated client assets.');
}
