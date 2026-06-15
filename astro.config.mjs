// @ts-check
import os from 'node:os';
import path from 'node:path';
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

const isLocalOneDriveWorkspace =
  !process.env.CI &&
  !process.env.VERCEL &&
  process.cwd().toLowerCase().includes('onedrive');

const localBuildOutDir = path.join(os.tmpdir(), 'mk-stock-lab-astro-dist');

// https://astro.build/config
export default defineConfig({
  output: 'server',
  outDir: isLocalOneDriveWorkspace ? localBuildOutDir : './dist',
  adapter: vercel(),
});
