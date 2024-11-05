import { Octokit } from '@octokit/core';
import { Endpoints } from '@octokit/types';
export declare function getArtifactDetails(name: string, request: {
    repo: string;
    owner: string;
    run_id: number;
}, octokit: Octokit, mock?: {
    listWorkflowRunArtifactsMock: unknown;
}): Promise<Endpoints['GET /repos/{owner}/{repo}/actions/runs/{run_id}/artifacts']['response']['data']['artifacts'][number]>;
export declare function downloadArtifact(name: string, request: {
    repo: string;
    owner: string;
    artifact_id: number;
}, octokit: Octokit, mock?: {
    downloadArtifactMock: unknown;
}): Promise<string>;
