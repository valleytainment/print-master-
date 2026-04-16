import { get, set } from 'idb-keyval';
import { LayoutConfig, ProductTemplate } from '../types';

const WORKSPACE_STORAGE_KEY = 'workspace_state_v1';

export type WorkspaceState = {
  config: LayoutConfig;
  customTemplates: ProductTemplate[];
  isDarkMode: boolean;
};

export async function loadWorkspaceState(): Promise<WorkspaceState | null> {
  const workspace = await get<WorkspaceState>(WORKSPACE_STORAGE_KEY);
  return workspace ?? null;
}

export async function saveWorkspaceState(workspace: WorkspaceState): Promise<void> {
  await set(WORKSPACE_STORAGE_KEY, workspace);
}
