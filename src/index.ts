import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as github from '@actions/github';
import * as Webhooks from '@octokit/webhooks';

import { CommandWrapper } from './command-builder';
import { locateNx } from './locate-nx';

interface Inputs {
  targets: string[];
  projects: string[];
  all: boolean;
  affected: boolean;
  parallel: boolean;
  maxParallel: number;
  args: string[];
}

async function retrieveGitBoundaries(): Promise<[base: string, head: string]> {
  if (github.context.eventName === 'pull_request') {
    const prPayload = github.context
      .payload as Webhooks.EventPayloads.WebhookPayloadPullRequest;
    return [prPayload.pull_request.base.sha, prPayload.pull_request.head.sha];
  } else {
    let base = '';
    await exec.exec('git', ['rev-parse', 'HEAD~1'], {
      listeners: {
        stdout: (data: Buffer) => (base += data.toString()),
      },
    });

    let head = '';
    await exec.exec('git', ['rev-parse', 'HEAD'], {
      listeners: {
        stdout: (data: Buffer) => (head += data.toString()),
      },
    });

    return [
      base.replace(/(\r\n|\n|\r)/gm, ''),
      head.replace(/(\r\n|\n|\r)/gm, ''),
    ];
  }
}

async function runNx(inputs: Inputs, nx: CommandWrapper): Promise<void> {
  const args = inputs.args;
  if (inputs.parallel) {
    args.push('--parallel', `--maxParallel=${inputs.maxParallel}`);
  }

  if (inputs.all === true || inputs.affected === false) {
    for (const target of inputs.targets) {
      await nx(['run-many', `--target=${target}`, '--all', ...args]);
    }
  } else if (inputs.projects.length > 0) {
    for (const project of inputs.projects) {
      for (const target of inputs.targets) {
        await nx([target, project, ...args]);
      }
    }
  } else {
    const boundaries = await core.group(
      '🏷 Retrieving Git boundaries (affected command)',
      () =>
        retrieveGitBoundaries().then((boundaries) => {
          core.info(`Base boundary: ${boundaries[0]}`);
          core.info(`Head boundary: ${boundaries[1]}`);
          return boundaries;
        }),
    );

    for (const target of inputs.targets) {
      await nx([
        'affected',
        `--target=${target}`,
        `--base=${boundaries[0]}`,
        `--head=${boundaries[1]}`,
        ...args,
      ]);
    }
  }
}

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
    parallel: core.getInput('parallel') === 'true',
    maxParallel:
      parseInt(core.getInput('maxParallel')) === NaN
        ? 3
        : parseInt(core.getInput('maxParallel')),
    args: core
      .getInput('args')
      .split(' ')
      .filter((arg) => arg.length > 0),
  };

  const nx = await core.group<CommandWrapper>(
    '🔍 Ensuring Nx is available',
    locateNx,
  );
  return runNx(inputs, nx);
}

void main();
