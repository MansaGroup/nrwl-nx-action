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

export async function locateNx(): Promise<CommandWrapper> {
  await assertHasNxPackageScript();

  return fsPromises
    .stat('package-lock.json')
    .then(() => {
      core.info('Using npm as package manager');
      return new CommandBuilder()
        .withCommand('npm')
        .withArgs('run', 'nx', '--')
        .build();
    })
    .catch(() => {
      return fsPromises
        .stat('yarn.lock')
        .then(() => {
          core.info('Using yarn as package manager');
          return new CommandBuilder()
            .withCommand('yarn')
            .withArgs('nx')
            .build();
        })
        .catch(() => {
          return fsPromises
            .stat('pnpm-lock.yaml')
            .then(() => {
              core.info('Using pnpm as package manager');
              return new CommandBuilder()
                .withCommand('pnpm')
                .withArgs('run', 'nx', '--')
                .build();
              })
              .catch(() => {
                throw new Error(
                  'Failed to detect your package manager, are you using npm or yarn?',
                );
            });
        });
    });
}
