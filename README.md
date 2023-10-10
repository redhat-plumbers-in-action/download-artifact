<!-- markdownlint-disable MD033 MD041 -->
<p align="center">
  <img src="https://github.com/redhat-plumbers-in-action/team/blob/70f67465cc46e02febb16aaa1cace2ceb82e6e5c/members/black-plumber.png" width="100" />
  <h1 align="center">Download Artifact on workflow_run event</h1>
</p>

[![GitHub Marketplace][market-status]][market] [![Lint Code Base][linter-status]][linter] [![Unit Tests][test-status]][test] [![CodeQL][codeql-status]][codeql] [![Check dist/][check-dist-status]][check-dist]

[![Demo][demo-status]][demo] [![codecov][codecov-status]][codecov]

<!-- Status links -->

[market]: https://github.com/marketplace/actions/download-artifact
[market-status]: https://img.shields.io/badge/Marketplace-Typescript%20Action-blue.svg?colorA=24292e&colorB=0366d6&style=flat&longCache=true&logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAM6wAADOsB5dZE0gAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAERSURBVCiRhZG/SsMxFEZPfsVJ61jbxaF0cRQRcRJ9hlYn30IHN/+9iquDCOIsblIrOjqKgy5aKoJQj4O3EEtbPwhJbr6Te28CmdSKeqzeqr0YbfVIrTBKakvtOl5dtTkK+v4HfA9PEyBFCY9AGVgCBLaBp1jPAyfAJ/AAdIEG0dNAiyP7+K1qIfMdonZic6+WJoBJvQlvuwDqcXadUuqPA1NKAlexbRTAIMvMOCjTbMwl1LtI/6KWJ5Q6rT6Ht1MA58AX8Apcqqt5r2qhrgAXQC3CZ6i1+KMd9TRu3MvA3aH/fFPnBodb6oe6HM8+lYHrGdRXW8M9bMZtPXUji69lmf5Cmamq7quNLFZXD9Rq7v0Bpc1o/tp0fisAAAAASUVORK5CYII=

[linter]: https://github.com/redhat-plumbers-in-action/download-artifact/actions/workflows/lint.yml
[linter-status]: https://github.com/redhat-plumbers-in-action/download-artifact/actions/workflows/lint.yml/badge.svg

[test]: https://github.com/redhat-plumbers-in-action/download-artifact/actions/workflows/unit-tests.yml
[test-status]: https://github.com/redhat-plumbers-in-action/download-artifact/actions/workflows/unit-tests.yml/badge.svg

[codeql]: https://github.com/redhat-plumbers-in-action/download-artifact/actions/workflows/codeql-analysis.yml
[codeql-status]: https://github.com/redhat-plumbers-in-action/download-artifact/actions/workflows/codeql-analysis.yml/badge.svg

[check-dist]: https://github.com/redhat-plumbers-in-action/download-artifact/actions/workflows/check-dist.yml
[check-dist-status]: https://github.com/redhat-plumbers-in-action/download-artifact/actions/workflows/check-dist.yml/badge.svg

[demo]: https://github.com/redhat-plumbers-in-action/artifact-automation/tree/main/.github/workflows
[demo-status]: https://img.shields.io/badge/Demo-Artifact%20Automation-blue

[codecov]: https://codecov.io/gh/redhat-plumbers-in-action/download-artifact
[codecov-status]: https://codecov.io/gh/redhat-plumbers-in-action/download-artifact/branch/main/graph/badge.svg

<!-- -->

Hugely inspired by work of [@marocchino](https://github.com/marocchino) in [marocchino/on_artifact](https://github.com/marocchino/on_artifact).

## Usage

```yml
name: Upload Artifact
on:
  pull_request:

permissions:
  contents: read

jobs:
  upload-artifact:
    runs-on: ubuntu-latest

    permissions:
      # only required for workflows in private repositories
      actions: read

    steps:
      - name: Repository checkout
        uses: actions/checkout@v3

      - name: Upload artifact
        uses: actions/upload-artifact@v3
        with:
          name: README as Artifact
          path: README.md
```

```yml
name: Download Artifact
on:
  workflow_run:
    workflows: [ Upload Artifact ]
    types:
      - completed

permissions:
  contents: read

jobs:
  download-artifact:
    if: >
      github.event.workflow_run.event == 'pull_request' &&
      github.event.workflow_run.conclusion == 'success'
    runs-on: ubuntu-latest

    permissions:
      # required for all workflows when deleting artifact
      actions: write

    steps:
      - id: Artifact
        name: Download Artifact
        uses: redhat-plumbers-in-action/download-artifact@main
        with:
          name: README as Artifact

      - name: Log Artifact data
        run: |
          echo "::warning::${{ steps.Artifact.outputs.README-md }}"
```

## Configuration options

Action currently accepts the following options:

```yml
# ...

- uses: redhat-plumbers-in-action/download-artifact@v1
  with:
    name: <name of artifact>
    path: <relative path>
    remove-archive: <boolean>
    remove-extracted-files: <boolean>
    delete-artifact: <boolean>
    run-id: <id>
    token: <GITHUB_TOKEN or PAT>

# ...
```

### name

Name of artifact.

* default value: `undefined`
* requirements: `required`

### path

Downloaded artifact archive will be extracted to this destination. Default value is artifact name. Make sure that specified path exist.

* default value: `name of artifact`
* requirements: `optional`

### remove-archive

When set to `true`, downloaded artifact archive will be removed from VM once it's extracted.

* default value: `true`
* requirements: `optional`

### remove-extracted-files

When set to `true`, files extracted form artifact will be removed from VM. They will be still accessible by GitHub Action outputs.

* default value: `false`
* requirements: `optional`

### delete-artifact

When set to `true`, GitHub Action will delete artifact from GitHub after it has been processed.

* default value: `false`
* requirements: `optional`

### run-id

Identification of workflow with artifact that we want to download.

* default value: `${{ github.event.workflow_run.id }}`
* requirements: `optional`

### token

GitHub token used access GitHub API.

* default value: `${{ github.token }}`
* requirements: `optional`
