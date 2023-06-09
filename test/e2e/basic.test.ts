import fetchMock from 'fetch-mock';
import { describe, expect, it, vi } from 'vitest';

import run from '../../src/main';

describe('Basic e2e tests', () => {
  it.todo('can download artifact', async () => {
    const artifactName = 'artifact_name';
    const runID = '123456789';
    const artifactID = '1234';
    const owner = 'redhat-plumbers-in-action';
    const repo = 'download-artifact';
    const token = '0000000000000000000000000000000000000001';

    process.env['INPUT_NAME'] = artifactName;
    process.env['INPUT_RUN-ID'] = runID;
    process.env['GITHUB_REPOSITORY'] = `${owner}/${repo}`;
    process.env['INPUT_REMOVE-ARCHIVE'] = 'false';
    process.env['INPUT_REMOVE-EXTRACTED-FILES'] = 'false';
    process.env['INPUT_DELETE-ARTIFACT'] = 'false';
    process.env['INPUT_TOKEN'] = token;

    const listWorkflowRunArtifactsMock = fetchMock.sandbox().mock(
      `https://api.github.com/repos/${owner}/${repo}/actions/runs/${runID}/artifacts`,
      {
        artifacts: [
          {
            id: artifactID,
            name: artifactName,
            expired: false,
          },
        ],
      },
      {
        headers: {
          accept: 'application/vnd.github.v3+json',
          authorization: `token ${token}`,
        },
      }
    );

    const downloadArtifactMock = fetchMock
      .sandbox()
      .mock(
        `https://api.github.com/repos/${owner}/${repo}/actions/artifacts/${artifactID}/zip`,
        [
          32, 32, 69, 110, 100, 45, 111, 102, 45, 99, 101, 110, 116, 114, 97,
          108, 45, 100, 105, 114, 101, 99, 116, 111, 114, 121, 32, 115, 105,
          103, 110, 97, 116, 117, 114, 101, 32, 110, 111, 116, 32, 102, 111,
          117, 110, 100, 46, 32, 32, 69, 105, 116, 104, 101, 114, 32, 116, 104,
          105, 115, 32, 102, 105, 108, 101, 32, 105, 115, 32, 110, 111, 116, 10,
          32, 32, 97, 32, 122, 105, 112, 102, 105, 108, 101, 44, 32, 111, 114,
          32, 105, 116, 32, 99, 111, 110, 115, 116, 105, 116, 117, 116, 101,
          115, 32, 111, 110, 101, 32, 100, 105, 115, 107, 32, 111, 102, 32, 97,
          32, 109, 117, 108, 116, 105, 45, 112, 97, 114, 116, 32, 97, 114, 99,
          104, 105, 118, 101, 46, 32, 32, 73, 110, 32, 116, 104, 101, 10, 32,
          32, 108, 97, 116, 116, 101, 114, 32, 99, 97, 115, 101, 32, 116, 104,
          101, 32, 99, 101, 110, 116, 114, 97, 108, 32, 100, 105, 114, 101, 99,
          116, 111, 114, 121, 32, 97, 110, 100, 32, 122, 105, 112, 102, 105,
          108, 101, 32, 99, 111, 109, 109, 101, 110, 116, 32, 119, 105, 108,
          108, 32, 98, 101, 32, 102, 111, 117, 110, 100, 32, 111, 110, 10, 32,
          32, 116, 104, 101, 32, 108, 97, 115, 116, 32, 100, 105, 115, 107, 40,
          115, 41, 32, 111, 102, 32, 116, 104, 105, 115, 32, 97, 114, 99, 104,
          105, 118, 101, 46, 10, 117, 110, 122, 105, 112, 58, 32, 32, 99, 97,
          110, 110, 111, 116, 32, 102, 105, 110, 100, 32, 122, 105, 112, 102,
          105, 108, 101, 32, 100, 105, 114, 101, 99, 116, 111, 114, 121, 32,
          105, 110, 32, 111, 110, 101, 32, 111, 102, 32, 112, 114, 45, 109, 101,
          116, 97, 100, 97, 116, 97, 46, 122, 105, 112, 32, 111, 114, 10, 32,
          32, 32, 32, 32, 32, 32, 32, 112, 114, 45, 109, 101, 116, 97, 100, 97,
          116, 97, 46, 122, 105, 112, 46, 122, 105, 112, 44, 32, 97, 110, 100,
          32, 99, 97, 110, 110, 111, 116, 32, 102, 105, 110, 100, 32, 112, 114,
          45, 109, 101, 116, 97, 100, 97, 116, 97, 46, 122, 105, 112, 46, 90,
          73, 80, 44, 32, 112, 101, 114, 105, 111, 100, 46, 10,
        ],
        {
          headers: {
            accept: 'application/vnd.github.v3+json',
            authorization: `token ${token}`,
          },
        }
      );

    const output: string[] = [];
    const storeOutput = (data: string) => output.push(data);
    const origWrite = process.stdout.write;
    process.stdout.write = vi.fn(storeOutput) as any;

    await run({ listWorkflowRunArtifactsMock, downloadArtifactMock });

    process.stdout.write = origWrite;

    // ! FIXME: ::error::fetch-mock: No fallback response defined for GET to https://api.github.com/repos/redhat-plumbers-in-action/download-artifact/actions/artifacts/1234/zip\n

    expect(output).toStrictEqual([
      `::debug::Looking for artifact 'artifact_name'\n`,
      `::debug::Found artifact 'artifact_name' with id '1234'\n`,
      `::debug::Downloading artifact 'artifact_name'\n`,
      `::error::fetch-mock: No fallback response defined for GET to https://api.github.com/repos/redhat-plumbers-in-action/download-artifact/actions/artifacts/1234/zip\n`,
    ]);
  });
});
