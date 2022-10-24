import * as core from '@actions/core';

import { CommandBuilder } from './command-builder';
import { parseInputs } from './inputs';
import { runNx } from './run-nx';

async function main(): Promise<void> {
  const inputs = parseInputs();

  if (inputs.workingDirectory && inputs.workingDirectory.length > 0) {
    core.info(`🏃 Working in custom directory: ${inputs.workingDirectory}`);
    process.chdir(inputs.workingDirectory);
  }

  const commandWrapper = new CommandBuilder()
    .withCommand('npx')
    .withArgs('nx')
    .build();

  return runNx(inputs, commandWrapper).catch((err: Error) => {
    core.setFailed(err);
  });
}

void main();
