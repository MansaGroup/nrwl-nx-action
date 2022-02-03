export interface Inputs {
  targets: string[];
  projects: string[];
  all: boolean;
  affected: boolean;
  parallel: boolean;
  maxParallel: number;
  args: string[];
  nxCloud: boolean;
  workingDirectory: string;
  affectedBaseNonPR: string;
}
