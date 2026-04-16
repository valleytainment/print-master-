import { ProjectFile } from './types';

type SaveProjectFileResult = {
  canceled: boolean;
  filePath?: string;
};

type OpenProjectFileResult = {
  canceled: boolean;
  filePath?: string;
  contents?: string;
};

declare global {
  interface Window {
    electronAPI?: {
      saveProjectFile: (payload: ProjectFile) => Promise<SaveProjectFileResult>;
      openProjectFile: () => Promise<OpenProjectFileResult>;
    };
  }
}

export {};
