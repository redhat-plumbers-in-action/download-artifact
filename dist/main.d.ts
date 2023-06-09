declare const run: (mock?: {
    listWorkflowRunArtifactsMock: unknown;
    downloadArtifactMock: unknown;
    deleteArtifactMock?: unknown;
}) => Promise<void>;
export default run;
