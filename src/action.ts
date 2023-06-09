// SPDX-License-Identifier: MIT
// Hugely inspired by work of @marocchino in https://github.com/marocchino/on_artifact

import { readFileSync, readdirSync, writeFileSync } from 'fs';

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

export async function action() {
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

  const artifacts = (
    await octokit.request(
      'GET /repos/{owner}/{repo}/actions/runs/{run_id}/artifacts',
      { owner, repo, run_id: runId }
    )
  ).data.artifacts;

  debug(`Looking for artifact '${name}'`);
  const matchArtifact = artifacts.filter(artifact => artifact.name === name)[0];

  if (!matchArtifact) {
    throw new Error(`Artifact '${name}' not found`);
  }
  debug(`Found artifact '${name}' with id '${matchArtifact.id}'`);

  debug(`Downloading artifact '${name}'`);
  const download = (
    await octokit.request(
      'GET /repos/{owner}/{repo}/actions/artifacts/{artifact_id}/{archive_format}',
      { owner, repo, artifact_id: matchArtifact.id, archive_format: 'zip' }
    )
  ).data;

  const filePath = `${name}.zip`;
  writeFileSync(filePath, Buffer.from(download as string));

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
    debug(`'delete-artifact' input is set to '${deleteArtifact}'`);
    info(`Deleting artifact '${name}'`);
    await octokit.request(
      'DELETE /repos/{owner}/{repo}/actions/artifacts/{artifact_id}',
      { owner, repo, artifact_id: matchArtifact.id }
    );
  }
}
