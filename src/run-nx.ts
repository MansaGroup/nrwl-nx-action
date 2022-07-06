import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as github from '@actions/github';
// eslint-disable-next-line import/no-unresolved
import { PullRequest, PushEvent } from '@octokit/webhooks-types';

import { CommandWrapper } from './command-builder';
import { Inputs } from './inputs';

async function retrieveGitBoundaries(): Promise<[base: string, head: string]> {
  if (github.context.eventName === 'pull_request') {
    const prPayload = github.context.payload.pull_request as PullRequest;
    return [prPayload.base.sha, prPayload.head.sha];
  } else if (github.context.eventName === 'push') {
    const pushPayload = github.context.payload as PushEvent;
    return [pushPayload.before, pushPayload.after];
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

async function runNxAll(
  inputs: Inputs,
  nx: CommandWrapper,
  args: string[],
): Promise<void> {
  for (const target of inputs.targets) {
    await nx(['run-many', `--target=${target}`, '--all', ...args]);
  }
}

async function runNxProjects(
  inputs: Inputs,
  nx: CommandWrapper,
  args: string[],
): Promise<void> {
  for (const project of inputs.projects) {
    for (const target of inputs.targets) {
      await nx([target, project, ...args]);
    }
  }
}

async function runNxAffected(
  inputs: Inputs,
  nx: CommandWrapper,
  args: string[],
): Promise<void> {
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

export async function runNx(inputs: Inputs, nx: CommandWrapper): Promise<void> {
  const args = inputs.args;

  if (inputs.nxCloud) {
    args.push('--scan');
    process.env.NX_RUN_GROUP = github.context.runId.toString();

    if (github.context.eventName === 'pull_request') {
      const prPayload = github.context.payload.pull_request as PullRequest;
      process.env.NX_BRANCH = prPayload.number.toString();
    }
  }

  if (inputs.parallel) {
    args.push(`--parallel=${inputs.parallel}`);
  }

  if (inputs.all === true || inputs.affected === false) {
    return runNxAll(inputs, nx, args);
  } else if (inputs.projects.length > 0) {
    return runNxProjects(inputs, nx, args);
  } else {
    return runNxAffected(inputs, nx, args);
  }
}
