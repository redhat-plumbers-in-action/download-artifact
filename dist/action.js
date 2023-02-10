// SPDX-License-Identifier: MIT
// Hugely inspired by work of @marocchino in https://github.com/marocchino/on_artifact
import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { debug, getBooleanInput, getInput, info, setOutput, isDebug, group, } from '@actions/core';
import { exec } from '@actions/exec';
import { events } from './events';
const action = (probot) => {
    probot.on(events.workflow_run, async (context) => {
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
        const artifacts = (await context.octokit.rest.actions.listWorkflowRunArtifacts(context.repo({
            run_id: runId,
        }))).data.artifacts;
        const matchArtifact = artifacts.filter(artifact => artifact.name === name)[0];
        const download = (await context.octokit.rest.actions.downloadArtifact(context.repo({
            artifact_id: matchArtifact.id,
            archive_format: 'zip',
        }))).data;
        const filePath = `${name}.zip`;
        writeFileSync(filePath, Buffer.from(download));
        await exec('unzip', [filePath, '-d', path]);
        if (removeArchive) {
            debug(`'remove-archive' input is set to '${removeArchive}'`);
            info(`Removing archive '${filePath}'`);
            await exec('rm', [filePath]);
        }
        if (isDebug()) {
            await group(`Extracted artifact directory structure - path './${path}'`, async () => await exec('tree', [path]));
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
            await context.octokit.rest.actions.deleteArtifact(context.repo({
                artifact_id: matchArtifact.id,
            }));
        }
    });
};
export default action;
//# sourceMappingURL=action.js.map