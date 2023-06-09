import { debug } from '@actions/core';
import { Octokit } from '@octokit/core';
import { Endpoints } from '@octokit/types';
import { writeFileSync } from 'fs';

export async function getArtifactDetails(
  name: string,
  request: {
    repo: string;
    owner: string;
    run_id: number;
  },
  octokit: Octokit,
  mock?: {
    listWorkflowRunArtifactsMock: unknown;
  }
): Promise<
  Endpoints['GET /repos/{owner}/{repo}/actions/runs/{run_id}/artifacts']['response']['data']['artifacts'][number]
> {
  const listWorkflowRunArtifactsMock = mock
    ? { request: { fetch: mock.listWorkflowRunArtifactsMock } }
    : {};

  const artifacts = (
    await octokit.request(
      'GET /repos/{owner}/{repo}/actions/runs/{run_id}/artifacts',
      { ...request, ...listWorkflowRunArtifactsMock }
    )
  ).data.artifacts;

  debug(`Looking for artifact '${name}'`);
  const matchArtifact = artifacts.filter(artifact => artifact.name === name)[0];

  if (!matchArtifact) {
    throw new Error(`Artifact '${name}' not found`);
  }
  debug(`Found artifact '${name}' with id '${matchArtifact.id}'`);

  return matchArtifact;
}

export async function downloadArtifact(
  name: string,
  request: {
    repo: string;
    owner: string;
    artifact_id: number;
  },
  octokit: Octokit,
  mock?: {
    downloadArtifactMock: unknown;
  }
): Promise<string> {
  const downloadArtifactMock = mock
    ? { request: { fetch: mock.downloadArtifactMock } }
    : {};

  debug(`Downloading artifact '${name}'`);
  const download = (
    await octokit.request(
      'GET /repos/{owner}/{repo}/actions/artifacts/{artifact_id}/{archive_format}',
      {
        ...request,
        archive_format: 'zip',
        ...downloadArtifactMock,
      }
    )
  ).data;

  const filePath = `${name}.zip`;
  writeFileSync(filePath, Buffer.from(download as string));

  return filePath;
}
