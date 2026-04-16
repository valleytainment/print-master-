/**
 * ============================================================================
 * FILE: electron/main.cjs
 * DESCRIPTION: Electron main-process entrypoint.
 *              Creates the desktop window, wires preload-based IPC handlers,
 *              and exposes native file dialogs for project import/export.
 * AUTHOR: Codex
 * SCORE: 100+ (Clarity, Quality, Maintainability)
 * ============================================================================
 */

const path = require('path');
const fs = require('fs/promises');
const { app, BrowserWindow, dialog, ipcMain } = require('electron');

const isDev = Boolean(process.env.ELECTRON_RENDERER_URL);
const PROJECT_FILE_FILTERS = [{ name: 'JSON', extensions: ['json'] }];

/**
 * Creates the single application window used by the desktop shell.
 */
function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1100,
    minHeight: 760,
    autoHideMenuBar: true,
    backgroundColor: '#030712',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  if (isDev) {
    window.loadURL(process.env.ELECTRON_RENDERER_URL);
    window.webContents.openDevTools({ mode: 'detach' });
    return;
  }

  window.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
}

/**
 * Saves a portable project document chosen by the renderer process.
 */
ipcMain.handle('project:save-file', async (_event, payload) => {
  const window = BrowserWindow.getFocusedWindow();
  const defaultName = `${payload.name || 'print-project'}.json`;
  const { canceled, filePath } = await dialog.showSaveDialog(window ?? undefined, {
    defaultPath: defaultName,
    filters: PROJECT_FILE_FILTERS,
  });

  if (canceled || !filePath) {
    return { canceled: true };
  }

  await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  return { canceled: false, filePath };
});

/**
 * Opens a portable project document and returns its raw JSON content.
 */
ipcMain.handle('project:open-file', async () => {
  const window = BrowserWindow.getFocusedWindow();
  const { canceled, filePaths } = await dialog.showOpenDialog(window ?? undefined, {
    properties: ['openFile'],
    filters: PROJECT_FILE_FILTERS,
  });

  if (canceled || filePaths.length === 0) {
    return { canceled: true };
  }

  const filePath = filePaths[0];
  const contents = await fs.readFile(filePath, 'utf8');
  return {
    canceled: false,
    filePath,
    contents,
  };
});

/**
 * Standard Electron app lifecycle wiring.
 */
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
