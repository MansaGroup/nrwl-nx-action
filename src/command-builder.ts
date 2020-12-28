import * as exec from '@actions/exec';

export type NxCommandWrapper = (
  args?: string[],
  options?: exec.ExecOptions,
) => Promise<void>;

export class CommandBuilder {
  private binary: string = '';
  private args: string[] = [];

  build(): NxCommandWrapper {
    if (!this.binary) {
      throw new Error('Malformed CommandBuilder: no binary defined');
    }

    return async (args?: string[], options?: exec.ExecOptions) => {
      await exec.exec(
        this.binary,
        [...this.args, ...(args ?? [])]
          .filter((arg) => arg.length > 0)
          .map((arg) => arg.trim()),
        options,
      );
    };
  }

  withBinary(binary: string): this {
    this.binary = binary;
    return this;
  }

  withArgs(...args: string[]): this {
    Array.prototype.push.apply(this.args, args);
    return this;
  }
}
