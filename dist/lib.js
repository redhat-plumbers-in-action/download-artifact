import { debug } from '@actions/core';
import { writeFileSync } from 'fs';
export async function getArtifactDetails(name, request, octokit, mock) {
    const listWorkflowRunArtifactsMock = mock
        ? { request: { fetch: mock.listWorkflowRunArtifactsMock } }
        : {};
    const artifacts = (await octokit.request('GET /repos/{owner}/{repo}/actions/runs/{run_id}/artifacts', Object.assign(Object.assign({}, request), listWorkflowRunArtifactsMock))).data.artifacts;
    debug(`Looking for artifact '${name}'`);
    const matchArtifact = artifacts.filter(artifact => artifact.name === name)[0];
    if (!matchArtifact) {
        throw new Error(`Artifact '${name}' not found`);
    }
    debug(`Found artifact '${name}' with id '${matchArtifact.id}'`);
    return matchArtifact;
}
export async function downloadArtifact(name, request, octokit, mock) {
    const downloadArtifactMock = mock
        ? { request: { fetch: mock.downloadArtifactMock } }
        : {};
    debug(`Downloading artifact '${name}'`);
    const download = (await octokit.request('GET /repos/{owner}/{repo}/actions/artifacts/{artifact_id}/{archive_format}', Object.assign(Object.assign(Object.assign({}, request), { archive_format: 'zip' }), downloadArtifactMock))).data;
    const filePath = `${name}.zip`;
    writeFileSync(filePath, Buffer.from(download));
    return filePath;
}
//# sourceMappingURL=lib.js.map