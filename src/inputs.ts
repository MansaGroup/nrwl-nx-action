import * as core from '@actions/core';

export type Inputs = {
  targets: string[];
  projects: string[];
  all: boolean;
  affected: boolean;
  parallel: number;
  args: string;
  nxCloud: boolean;
  workingDirectory: string;
};

export function parseInputs(): Inputs {
  return {
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
    parallel: Number.isNaN(parseInt(core.getInput('parallel')))
      ? 3
      : parseInt(core.getInput('parallel')),
    args: core.getInput('args'),
    nxCloud: core.getInput('nxCloud') === 'true',
    workingDirectory: core.getInput('workingDirectory'),
  };
}
