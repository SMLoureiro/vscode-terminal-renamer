const vscode = require('vscode');

const prefix = '🧪 ';
const pendingNames = [];

/** Rename the given terminal tab */
function rename(term, title) {
  vscode.commands.executeCommand(
    'workbench.action.terminal.renameWithArg',
    { terminal: term, name: title }
  );
}

/** When a debug session starts, rename the current tab or queue a name */
vscode.debug.onDidStartDebugSession(session => {
  const title = prefix + session.name;
  const term  = vscode.window.activeTerminal;

  if (term) {
    // Re-used tab: rename immediately
    rename(term, title);
  } else {
    // New tab will appear shortly
    pendingNames.push(title);
  }
});

/** When VS Code opens a terminal, give it the next queued name (if any) */
vscode.window.onDidOpenTerminal(term => {
  if (pendingNames.length) {
    rename(term, pendingNames.shift());
  }
});

function activate() { /* nothing to do at activation time */ }
function deactivate() { /* no-op */ }

module.exports = { activate, deactivate };
