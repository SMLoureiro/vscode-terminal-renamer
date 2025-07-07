const sinon      = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

// ── stub minimal vscode API we use ────────────────────────────────────────────
function createVscodeStub() {
  const terminalEvents = [];
  const debugEvents    = [];

  const vscode = {
    window: {
      activeTerminal: null,
      onDidOpenTerminal: handler => {
        terminalEvents.push(handler);
        return { dispose() {} };
      }
    },
    debug: {
      onDidStartDebugSession: handler => {
        debugEvents.push(handler);
        return { dispose() {} };
      }
    },
    commands: { executeCommand: sinon.stub() }
  };

  return { vscode, terminalEvents, debugEvents };
}

// helper to create a fake terminal object
let id = 0;
function makeTerminal() {
  const t = { id: ++id, name: 'Python Debug Console' };
  return t;
}

describe('rename-debug-terminal extension', () => {
  let vscode, terminalEvents, debugEvents;

  /** load extension with fresh stubs for each test */
  function loadExtension() {
    ({ vscode, terminalEvents, debugEvents } = createVscodeStub());
    proxyquire('../extension', { vscode });
  }

  beforeEach(() => {
    sinon.restore();
    loadExtension();
  });

  it('renames reused active terminal immediately', () => {
    const term = makeTerminal();
    vscode.window.activeTerminal = term;

    // fire debug-session start
    debugEvents[0]({ name: 'Backend Tests' });

    sinon.assert.calledWithMatch(
      vscode.commands.executeCommand,
      'workbench.action.terminal.renameWithArg',
      { terminal: term, name: '🧪 Backend Tests' }
    );
  });

  it('queues name until new terminal opens', () => {
    // start session BEFORE terminal exists
    debugEvents[0]({ name: 'Database Tests' });

    // extension should not have renamed anything yet
    sinon.assert.notCalled(vscode.commands.executeCommand);

    // now VS Code opens the terminal
    const term = makeTerminal();
    terminalEvents[0](term);

    sinon.assert.calledWithMatch(
      vscode.commands.executeCommand,
      sinon.match.any,
      { terminal: term, name: '🧪 Database Tests' }
    );
  });

  it('never renames the same tab twice', () => {
    const term = makeTerminal();
    vscode.window.activeTerminal = term;

    // first session renames
    debugEvents[0]({ name: 'Operator Tests' });

    // second session reuses same tab
    debugEvents[0]({ name: 'Workflow Tests' });

    // should still be renamed only once
    sinon.assert.calledOnce(vscode.commands.executeCommand);
    sinon.assert.calledWithMatch(
      vscode.commands.executeCommand,
      sinon.match.any,
      { terminal: term, name: '🧪 Operator Tests' }
    );
  });
});
