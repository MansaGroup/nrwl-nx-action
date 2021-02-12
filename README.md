![Banner](.github/assets/banner-thin.png)

# Nrwl Nx Action

![License](https://img.shields.io/github/license/MansaGroup/nrwl-nx-action) ![GitHub Issues](https://img.shields.io/github/issues/mansagroup/nrwl-nx-action) ![GitHub Stars](https://img.shields.io/github/stars/MansaGroup/nrwl-nx-action)

The action wraps the usage of the [Nrwl Nx](https://nx.dev/) monorepo development toolkit.

Nx manages multiple **projects** linked each other with a dependecy graph. One of its key
features is to permit to run one or more **tasks** only on the projects affected by our
changes (by checking the difference between two Git references).

GitHub Action's workflows provide some information about the Git references concerned
by the workflow, in a _pull request context_, we have the current commit and the last
one from the base branch. Combined with Nx, we can determine the projects affected
by the whole pull request.

> It's more than useful in a **CI/CD** context: we are able to _lint_, _build_ and _deploy_
> only the projects affected by a _pull request_ for instance.

Copy-pasting the bash code to compute the reference bounds for Nx is not that
maintenable. That's why we are open-sourcing this action to do the trick for you.

## Usage

By default, the action will try to run the provided tasks only on the affected projects.
This behavior can be modified using the different inputs (see below).

> workflow.yml

```yaml
---
- uses: mansagroup/nrwl-nx-action@v1
  with:
    targets: lint,build,deploy
```

This simple step will run three targets: `lint`, `build` and `deploy`, sequentially
only on the affected projects. Nothing more. Simple. More examples below.

## Inputs

This GitHub action can take several inputs to configure its behaviors:

| Name             | Type                 | Default | Example            | Description                                                                        |
| ---------------- | -------------------- | ------- | ------------------ | ---------------------------------------------------------------------------------- |
| targets          | Comma-separated list | ø       | `lint,test,build`  | List of targets to execute                                                         |
| projects         | Comma-separated list | ø       | `frontend,backend` | List of projects to use (more below)                                               |
| all              | Boolean              | `false` | `true`             | Run the targets on all the projects of the Nx workspace                            |
| affected         | Boolean              | `true`  | `true`             | Run the targets on the affected projects since the last modifications (more below) |
| parallel         | Boolean              | `false` | `true`             | Run the tasks in parallel (can be expensive)                                       |
| maxParallel      | Number               | `3`     | `3`                | Number of tasks to execute in parallel (can be expensive)                          |
| args             | String               | ø       | `--key="value"`    | Optional args to append to the Nx commands                                         |
| workingDirectory | String               | ø       | `myNxFolder`       | Path to the Nx workspace, needed if not the repository root                        |

**Note:** `all` and `affected` are mutually exclusive.

### `projects`

When defined, will skip the `all` and `affected` inputs.

### `affected`

When set to `true`, the affected detection will depend on the event type
of the workflow:

- Inside a **pull request** context, the action will use the base and head Git
  references
- Otherwise, will compute the difference between the `HEAD` and the last
  commit

## Examples

### Run one target on all the affected projects (default)

This will run the `build` target on all the affected projects.
**This is the default behavior.**

> workflow.yml

```yaml
---
- uses: mansagroup/nrwl-nx-action@v1
  with:
    targets: build
    affected: 'true' # Defaults to true, therefore optional
```

### Run multiple targets to all projects

This will run three targets: `lint`, `test` and `build` to all the
projects of the workspace.

> workflow.yml

```yaml
---
- uses: mansagroup/nrwl-nx-action@v1
  with:
    targets: lint,test,build
    all: 'true'
```

### Run one target on some projects

This will run the `build` target on the `frontend` and `backend` projects
only.

> workflow.yml

```yaml
---
- uses: mansagroup/nrwl-nx-action@v1
  with:
    targets: build
    projects: frontend,backend
```

### Run one target on all the projects in parallel

This will run the `lint` target on all the projects of the workspace
in parallel.

> workflow.yml

```yaml
---
- uses: mansagroup/nrwl-nx-action@v1
  with:
    targets: lint
    all: 'true'
    parallel: 'true'
```

### Run one target on a Nx workspace located in another folder

This will run the `build` target on all the affected projects of a
Nx workspace located in another folder than the repository root.

> workflow.yml

```yaml
---
- uses: mansagroup/nrwl-nx-action@v1
  with:
    targets: build
    workingDirectory: my-nx-subfolder
```

## License

This project is [MIT licensed](LICENSE.txt).

## Authors

|                                                      Jérémy Levilain                                                       |
| :------------------------------------------------------------------------------------------------------------------------: |
| ![Jérémy Levilain](https://avatars2.githubusercontent.com/u/6763873?s=100&u=556a37811b42f5528fba0b224e321269c0d77c92&v=4)  |
| [GitHub](https://github.com/iamblueslime) - [Website](https://jeremylvln.fr) - [Twitter](https://twitter.com/iamblueslime) |
