// SPDX-License-Identifier: MIT

import { setFailed } from '@actions/core';

import { action } from './action';

const run = async (mock?: {
  listWorkflowRunArtifactsMock: unknown;
  downloadArtifactMock: unknown;
  deleteArtifactMock?: unknown;
}) => {
  try {
    await action(mock);
  } catch (error) {
    let message: string;

    if (error instanceof Error) {
      message = error.message;
    } else {
      message = JSON.stringify(error);
    }

    setFailed(message);
  }
};

run();

export default run;
