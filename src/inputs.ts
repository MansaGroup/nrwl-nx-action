export interface Inputs {
  targets: string[];
  projects: string[];
  all: boolean;
  affected: boolean;
  parallel: number;
  args: string[];
  nxCloud: boolean;
  workingDirectory: string;
}
