import { Cmd, Command, WorkspaceScreenModel, WorkspaceMsg } from '../../types.js';
import { workspaceStorage } from '../../../storage/workspaces.js';
export { view } from './view.js';

export function init(): [WorkspaceScreenModel, Command] {
  const workspaces = workspaceStorage.list();
  const active = workspaceStorage.getActive();

  const activeIndex = workspaces.indexOf(active);

  const workspaceModel: WorkspaceScreenModel = {
    workspaces,
    activeWorkspace: active,
    cursor: activeIndex >= 0 ? activeIndex : 0,
    showCreateInput: false,
    newWorkspaceName: '',
    showDeleteConfirm: false,
    error: null,
    success: null,
  };

  return [workspaceModel, Cmd.none()];
}

export function update(
  msg: WorkspaceMsg,
  model: WorkspaceScreenModel
): [WorkspaceScreenModel, Command] {
  switch (msg.type) {
    case 'WORKSPACE_UP':
      return [{ ...model, cursor: Math.max(0, model.cursor - 1), error: null }, Cmd.none()];

    case 'WORKSPACE_DOWN':
      return [
        { ...model, cursor: Math.min(model.workspaces.length - 1, model.cursor + 1), error: null },
        Cmd.none(),
      ];

    case 'WORKSPACE_SELECT': {
      const target = model.workspaces[model.cursor];
      if (target === model.activeWorkspace) {
        return [{ ...model, success: `Already on "${target}"` }, Cmd.none()];
      }
      try {
        workspaceStorage.setActive(target);
        return [
          {
            ...model,
            activeWorkspace: target,
            success: `Switched to "${target}"`,
          },
          Cmd.switchWorkspace(target),
        ];
      } catch (e: any) {
        return [{ ...model, error: e.message }, Cmd.none()];
      }
    }

    case 'WORKSPACE_CREATE_START':
      return [{ ...model, showCreateInput: true, newWorkspaceName: '', error: null }, Cmd.none()];

    case 'WORKSPACE_CREATE_INPUT':
      return [
        { ...model, newWorkspaceName: model.newWorkspaceName + msg.char, error: null },
        Cmd.none(),
      ];

    case 'WORKSPACE_CREATE_BACKSPACE':
      return [
        { ...model, newWorkspaceName: model.newWorkspaceName.slice(0, -1), error: null },
        Cmd.none(),
      ];

    case 'WORKSPACE_CREATE_CANCEL':
      return [{ ...model, showCreateInput: false, newWorkspaceName: '', error: null }, Cmd.none()];

    case 'WORKSPACE_CREATE_SUBMIT': {
      const name = model.newWorkspaceName.trim();
      if (!name) return [{ ...model, error: 'Name cannot be empty' }, Cmd.none()];
      if (workspaceStorage.exists(name))
        return [{ ...model, error: 'Workspace already exists' }, Cmd.none()];

      try {
        workspaceStorage.create(name, { workDir: '', lang: 'typescript' });
        const workspaces = workspaceStorage.list();
        return [
          {
            ...model,
            workspaces,
            showCreateInput: false,
            newWorkspaceName: '',
            cursor: workspaces.indexOf(name),
            success: `Created workspace "${name}"`,
          },
          Cmd.createWorkspace(name),
        ];
      } catch (e: any) {
        return [{ ...model, error: e.message || 'Failed to create workspace' }, Cmd.none()];
      }
    }

    case 'WORKSPACE_DELETE': {
      const toDelete = model.workspaces[model.cursor];
      if (toDelete === 'default')
        return [{ ...model, error: 'Cannot delete default workspace' }, Cmd.none()];
      return [{ ...model, showDeleteConfirm: true, error: null }, Cmd.none()];
    }

    case 'WORKSPACE_DELETE_CANCEL':
      return [{ ...model, showDeleteConfirm: false, error: null }, Cmd.none()];

    case 'WORKSPACE_DELETE_CONFIRM': {
      const target = model.workspaces[model.cursor];
      if (target === 'default')
        return [{ ...model, error: 'Cannot delete default workspace' }, Cmd.none()];

      try {
        workspaceStorage.delete(target);
        const workspaces = workspaceStorage.list();
        const active = workspaceStorage.getActive();
        return [
          {
            ...model,
            workspaces,
            activeWorkspace: active,
            cursor: 0,
            showDeleteConfirm: false,
            success: `Deleted workspace "${target}"`,
          },
          Cmd.deleteWorkspace(target),
        ];
      } catch (e: any) {
        return [{ ...model, error: e.message || 'Failed to delete workspace' }, Cmd.none()];
      }
    }

    default:
      return [model, Cmd.none()];
  }
}
