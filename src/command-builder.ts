import * as exec from '@actions/exec';

export type CommandWrapper = (
  args?: string[],
  options?: exec.ExecOptions,
) => Promise<number>;

export class CommandBuilder {
  private command: string = '';
  private args: string[] = [];

  build(): CommandWrapper {
    if (!this.command) {
      throw new Error('No command given to CommandWrapper');
    }

    return async (args?: string[], options?: exec.ExecOptions) => {
      return exec.exec(
        this.command,
        [...this.args, ...(args ?? [])]
          .filter((arg) => arg.length > 0)
          .map((arg) => arg.trim()),
        options,
      );
    };
  }

  withCommand(command: string): this {
    this.command = command;
    return this;
  }

  withArgs(...args: string[]): this {
    Array.prototype.push.apply(this.args, args);
    return this;
  }
}
