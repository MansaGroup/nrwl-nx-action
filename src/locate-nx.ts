import * as core from '@actions/core';
import { promises as fsPromises } from 'fs';

import { CommandBuilder, CommandWrapper } from './command-builder';

interface PackageJsonLike {
  scripts?: Record<string, string>;
}

async function loadPackageJson(): Promise<PackageJsonLike> {
  return JSON.parse(
    await fsPromises.readFile('package.json', 'utf8'),
  ) as PackageJsonLike;
}

async function assertHasNxPackageScript(): Promise<void> {
  const packageJson = await loadPackageJson().catch(() => {
    throw new Error(
      "Failed to load the 'package.json' file, did you setup your project correctly?",
    );
  });

  core.info('Found package.json file');

  if (typeof packageJson.scripts?.nx !== 'string')
    throw new Error(
      "Failed to locate the 'nx' script in package.json, did you setup your project with Nx's CLI?",
    );

  core.info("Found 'nx' script inside package.json file");
}

async function tryLocate(
  entries: [pmName: string, filePath: string, factory: () => CommandWrapper][],
): Promise<CommandWrapper> {
  if (entries.length === 0) {
    throw new Error(
      'Failed to detect your package manager, are you using npm or yarn?',
    );
  }

  const [entry, ...rest] = entries;

  return fsPromises
    .stat(entry[1])
    .then(() => {
      core.info(`Using ${entry[0]} as package manager`);
      return entry[2]();
    })
    .catch(() => tryLocate(rest));
}

export async function locateNx(): Promise<CommandWrapper> {
  await assertHasNxPackageScript();

  return tryLocate([
    [
      'npm',
      'package-lock.json',
      () =>
        new CommandBuilder()
          .withCommand('npm')
          .withArgs('run', 'nx', '--')
          .build(),
    ],
    [
      'yarn',
      'yarn.lock',
      () => new CommandBuilder().withCommand('yarn').withArgs('nx').build(),
    ],
    [
      'pnpm',
      'pnpm-lock.yaml',
      () =>
        new CommandBuilder()
          .withCommand('pnpm')
          .withArgs('run', 'nx', '--')
          .build(),
    ],
  ]);
}
