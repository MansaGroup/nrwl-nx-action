import * as core from '@actions/core';

import { CommandWrapper } from './command-builder';
import { Inputs } from './inputs';
import { locateNx } from './locate-nx';
import { runNx } from './run-nx';

async function main(): Promise<void> {
  const inputs: Inputs = {
    targets: core
      .getInput('targets', { required: true })
      .split(',')
      .filter((target) => target.length > 0),
    projects: core
      .getInput('projects', { required: false })
      .split(',')
      .filter((project) => project.length > 0),
    all: core.getInput('all') === 'true',
    affected: core.getInput('affected') === 'true',
    parallel:
      parseInt(core.getInput('parallel')) === NaN
        ? 3
        : parseInt(core.getInput('parallel')),
    args: core
      .getInput('args')
      .split(' ')
      .filter((arg) => arg.length > 0),
    nxCloud: core.getInput('nxCloud') === 'true',
    workingDirectory: core.getInput('workingDirectory'),
  };

  if (inputs.workingDirectory && inputs.workingDirectory.length > 0) {
    core.info(`🏃 Working in custom directory: ${inputs.workingDirectory}`);
    process.chdir(inputs.workingDirectory);
  }

  return core
    .group<CommandWrapper>('🔍 Ensuring Nx is available', locateNx)
    .then((nx) => runNx(inputs, nx))
    .catch((err) => {
      core.setFailed(err);
    });
}

void main();
