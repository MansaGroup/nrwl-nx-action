import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as github from '@actions/github';
import type { PullRequest, PushEvent } from '@octokit/webhooks-types';

import type { Inputs } from './inputs';

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

async function nx(args: readonly string[]): Promise<void> {
  await exec.exec(`npx nx ${args.join(' ')}`);
}

async function runNxAll(
  inputs: Inputs,
  args: readonly string[],
): Promise<void> {
  return inputs.targets.reduce(
    (lastPromise, target) =>
      lastPromise.then(() =>
        nx(['run-many', `--target=${target}`, '--all', ...args]),
      ),
    Promise.resolve(),
  );
}

async function runNxProjects(
  inputs: Inputs,
  args: readonly string[],
): Promise<void> {
  return inputs.projects
    .flatMap((project) =>
      inputs.targets.map((target): [string, string] => [project, target]),
    )
    .reduce(
      (lastPromise, [project, target]) =>
        lastPromise.then(() => nx([target, project, ...args])),
      Promise.resolve(),
    );
}

async function runNxAffected(
  inputs: Inputs,
  args: readonly string[],
): Promise<void> {
  const [base, head] = await core.group(
    '🏷 Retrieving Git boundaries (affected command)',
    () =>
      retrieveGitBoundaries().then(([base, head]) => {
        core.info(`Base boundary: ${base}`);
        core.info(`Head boundary: ${head}`);
        return [base, head];
      }),
  );

  return inputs.targets.reduce(
    (lastPromise, target) =>
      lastPromise.then(() =>
        nx([
          'affected',
          `--target=${target}`,
          `--base=${base}`,
          `--head=${head}`,
          ...args,
        ]),
      ),
    Promise.resolve(),
  );
}

export async function runNx(inputs: Inputs): Promise<void> {
  if (inputs.nxCloud) {
    process.env['NX_RUN_GROUP'] = github.context.runId.toString();

    if (github.context.eventName === 'pull_request') {
      const prPayload = github.context.payload.pull_request as PullRequest;
      process.env['NX_BRANCH'] = prPayload.number.toString();
    }
  }

  const nxArgs: string[] = [];

  if (inputs.parallel) {
    nxArgs.push(`--parallel=${inputs.parallel}`);
  }

  const args =
    inputs.args.length > 0
      ? ([...nxArgs, '--', inputs.args] as const)
      : ([...nxArgs] as const);

  if (inputs.all === true || inputs.affected === false) {
    return runNxAll(inputs, args);
  } else if (inputs.projects.length > 0) {
    return runNxProjects(inputs, args);
  } else {
    return runNxAffected(inputs, args);
  }
}
