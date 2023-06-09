// SPDX-License-Identifier: MIT
// Hugely inspired by work of @marocchino in https://github.com/marocchino/on_artifact

import { readFileSync, readdirSync } from 'fs';

import {
  debug,
  getBooleanInput,
  getInput,
  info,
  setOutput,
  isDebug,
  group,
} from '@actions/core';
import { exec } from '@actions/exec';
import { Octokit } from '@octokit/core';
import { z } from 'zod';
import { downloadArtifact, getArtifactDetails } from './lib';

export async function action(mock?: {
  listWorkflowRunArtifactsMock: unknown;
  downloadArtifactMock: unknown;
  deleteArtifactMock?: unknown;
}) {
  const name = getInput('name', { required: true });
  const path = getInput('path') || name;
  const removeArchive = getBooleanInput('remove-archive', {
    required: true,
  });
  const removeExtracted = getBooleanInput('remove-extracted-files', {
    required: true,
  });
  const deleteArtifact = getBooleanInput('delete-artifact', {
    required: true,
  });
  const runId = +getInput('run-id', { required: true });

  const octokit = new Octokit({ auth: getInput('token', { required: true }) });

  const owner = z
    .string()
    .min(1)
    .parse(process.env.GITHUB_REPOSITORY?.split('/')[0]);
  const repo = z
    .string()
    .min(1)
    .parse(process.env.GITHUB_REPOSITORY?.split('/')[1]);

  const matchArtifact = await getArtifactDetails(
    name,
    { repo, owner, run_id: runId },
    octokit,
    mock
  );

  const filePath = await downloadArtifact(
    name,
    { repo, owner, artifact_id: matchArtifact.id },
    octokit,
    mock
  );

  await exec('unzip', [filePath, '-d', path]);

  if (removeArchive) {
    debug(`'remove-archive' input is set to '${removeArchive}'`);
    info(`Removing archive '${filePath}'`);
    await exec('rm', [filePath]);
  }

  if (isDebug()) {
    await group(
      `Extracted artifact directory structure - path './${path}'`,
      async () => await exec('tree', [path])
    );
  }

  const fileNames = readdirSync(path);

  await group(`Setting outputs`, async () => {
    for (const fileName of fileNames) {
      const fileNameOutput = fileName.split('.').join('-');
      info(`Setting output ${fileNameOutput}`);
      setOutput(fileNameOutput, readFileSync(`${path}/${fileName}`).toString());
      if (removeExtracted) {
        debug(`'remove-extracted-files' input is set to '${removeExtracted}'`);
        debug(`Removing file '${path}/${fileName}'`);
        await exec('rm', [`${path}/${fileName}`]);
      }
    }
  });

  if (deleteArtifact) {
    const deleteArtifactMock = mock?.deleteArtifactMock
      ? { request: { fetch: mock.deleteArtifactMock } }
      : {};

    debug(`'delete-artifact' input is set to '${deleteArtifact}'`);
    info(`Deleting artifact '${name}'`);
    await octokit.request(
      'DELETE /repos/{owner}/{repo}/actions/artifacts/{artifact_id}',
      { owner, repo, artifact_id: matchArtifact.id, ...deleteArtifactMock }
    );
  }
}
