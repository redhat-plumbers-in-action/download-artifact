import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { action } from '../src/action';
import { exec } from 'child_process';

function setDefaultInputs() {
  // Name of artifact
  vi.stubEnv('INPUT_NAME', 'artifact_name');
  // Downloaded artifact archive will be extracted to this destination. Default is artifact name.
  vi.stubEnv('INPUT_PATH', 'artifact_path');
  // Remove downloaded artifact archive
  vi.stubEnv('INPUT_REMOVE-ARCHIVE', 'true');
  // Remove extracted artifact content. It will be still accessible by Action outputs
  vi.stubEnv('INPUT_REMOVE-EXTRACTED-FILES', 'true');
  // Delete downloaded artifact from GitHub
  vi.stubEnv('INPUT_DELETE-ARTIFACT', 'false');
  // Set workflow_run id, This defaults to {{ github.event.workflow_run.id }}
  vi.stubEnv('INPUT_RUN-ID', '123');
}

const mocks = vi.hoisted(() => {
  return {
    request: vi.fn(),
    exec: vi.fn(),
    readFileSync: vi.fn(),
    readdirSync: vi.fn(),
    writeFileSync: vi.fn(),
  };
});

vi.mock('fs', () => {
  return {
    readFileSync: mocks.readFileSync,
    readdirSync: mocks.readdirSync,
    writeFileSync: mocks.writeFileSync,
  };
});

// Mock @octokit/core module
vi.mock('@octokit/core', () => {
  const Octokit = vi.fn(() => ({
    request: mocks.request,
  }));
  return { Octokit };
});

// Mock @actions/core module
vi.mock('@actions/core', async () => {
  const actual = await vi.importActual('@actions/core');
  return {
    ...(actual as any),
    error: vi.fn(),
    setOutput: vi.fn().mockImplementation((name, value) => {
      process.env[`OUTPUT_${name.toUpperCase()}`] = value;
    }),
  };
});

vi.mock('@actions/exec', () => {
  return {
    exec: mocks.exec,
  };
});

describe('Test action()', () => {
  beforeEach(() => {
    // Mock Action environment
    vi.stubEnv('RUNNER_DEBUG', '1');
    vi.stubEnv(
      'GITHUB_REPOSITORY',
      'redhat-plumbers-in-action/download-artifact'
    );
    vi.stubEnv('INPUT_GITHUB_TOKEN', 'mock-token');

    vi.mocked(mocks.readdirSync).mockImplementation(path => [
      'artifact_file1.txt',
      'artifact_file2.txt',
    ]);
    vi.mocked(mocks.readFileSync).mockImplementation(path => {
      switch (path) {
        case 'artifact_path/artifact_file1.txt':
          return 'file1 content';
        case 'artifact_path/artifact_file2.txt':
          return 'file2 content';
        default:
          throw new Error(`Unexpected file: ${path}`);
      }
    });

    // Mock GitHub API
    vi.mocked(mocks.request).mockImplementation(path => {
      switch (path) {
        case 'GET /repos/{owner}/{repo}/actions/runs/{run_id}/artifacts':
          return {
            status: 200,
            data: {
              artifacts: [
                {
                  id: 1233,
                  name: 'qwerty',
                  expired: false,
                },
                {
                  id: 1234,
                  name: 'artifact_name',
                  expired: false,
                },
              ],
            },
          };

        case 'GET /repos/{owner}/{repo}/actions/artifacts/{artifact_id}/{archive_format}':
          return {
            status: 200,
            data: new Uint8Array([1, 2, 3]).buffer,
          };

        case 'DELETE /repos/{owner}/{repo}/actions/artifacts/{artifact_id}':
          return {
            status: 200,
            data: {},
          };

        default:
          throw new Error(`Unexpected endpoint: ${path}`);
      }
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
    vi.unstubAllEnvs();
  });

  test('basic', async () => {
    setDefaultInputs();
    vi.stubEnv('INPUT_TOKEN', 'mock-token');

    await action();
    expect(mocks.request).toHaveBeenCalledTimes(2);

    expect(mocks.writeFileSync).toHaveBeenCalledWith(
      'artifact_name.zip',
      Buffer.from([1, 2, 3])
    );

    expect(mocks.exec).toHaveBeenNthCalledWith(1, 'unzip', [
      'artifact_name.zip',
      '-d',
      'artifact_path',
    ]);

    expect(mocks.exec).toHaveBeenNthCalledWith(2, 'rm', ['artifact_name.zip']);

    expect(process.env['OUTPUT_ARTIFACT_FILE1-TXT']).toMatchInlineSnapshot(
      `"file1 content"`
    );
    expect(process.env['OUTPUT_ARTIFACT_FILE2-TXT']).toMatchInlineSnapshot(
      `"file2 content"`
    );
  });
});
