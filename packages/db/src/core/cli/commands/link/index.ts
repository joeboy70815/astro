import type { AstroConfig } from 'astro';
import { mkdir, writeFile } from 'node:fs/promises';
import prompts from 'prompts';
import type { Arguments } from 'yargs-parser';
import { PROJECT_ID_FILE, getSessionIdFromFile } from '../../../tokens.js';
import { getAstroStudioUrl } from '../../../utils.js';

export async function cmd({ flags }: { config: AstroConfig; flags: Arguments }) {
	const linkUrl = new URL(getAstroStudioUrl() + '/auth/cli/link');
	const sessionToken = await getSessionIdFromFile();
	if (!sessionToken) {
		console.error('You must be logged in to link a project.');
		process.exit(1);
	}

	const workspaceIdName = await promptWorkspaceName();
	const projectIdName = await promptProjectName();

	const response = await fetch(linkUrl, {
		method: 'POST',
		headers: { 
			Authorization: `Bearer ${await getSessionIdFromFile()}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({projectIdName, workspaceIdName})
	});
	if (!response.ok) {
		console.error(`Failed to link project: ${response.status} ${response.statusText}`);
		process.exit(1);
	}
	const { data } = await response.json();
	await mkdir(new URL('.', PROJECT_ID_FILE), { recursive: true });
	await writeFile(PROJECT_ID_FILE, `${data.id}`);
	console.info('Project linked.');
}

export async function promptProjectName(defaultName?: string): Promise<string> {
	const { projectName } = await prompts({
		type: 'text',
		name: 'projectName',
		message: 'Project ID',
		initial: defaultName,
	});
	if (typeof projectName !== 'string') {
		process.exit(0);
	}
	return projectName;
}

export async function promptWorkspaceName(defaultName?: string): Promise<string> {
	const { workspaceName } = await prompts({
		type: 'text',
		name: 'workspaceName',
		message: 'Workspace ID',
		initial: defaultName,
	});
	if (typeof workspaceName !== 'string') {
		process.exit(0);
	}
	return workspaceName;
}
