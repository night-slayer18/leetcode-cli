import { Cmd, Command, WorkspaceScreenModel, WorkspaceMsg } from '../../types.js';
import { workspaceStorage } from '../../../storage/workspaces.js';

export { view } from './view.js';

type EditableWorkspaceConfig = {
  lang: string;
  workDir: string;
  editor: string;
  syncRepo: string;
};

const EDIT_FIELDS: Array<keyof EditableWorkspaceConfig> = ['lang', 'workDir', 'editor', 'syncRepo'];

function toEditableConfig(config: ReturnType<typeof workspaceStorage.getConfig>): EditableWorkspaceConfig {
  return {
    lang: config.lang ?? '',
    workDir: config.workDir ?? '',
    editor: config.editor ?? '',
    syncRepo: config.syncRepo ?? '',
  };
}

function loadWorkspaceConfig(name: string | null): EditableWorkspaceConfig | null {
  if (!name) return null;
  return toEditableConfig(workspaceStorage.getConfig(name));
}

function syncSelection(
  model: WorkspaceScreenModel,
  nextWorkspaces: readonly string[],
  nextCursor: number
): WorkspaceScreenModel {
  const cursor = Math.max(0, Math.min(nextCursor, Math.max(0, nextWorkspaces.length - 1)));
  const selectedWorkspace = nextWorkspaces[cursor] ?? null;
  const selectedConfig = loadWorkspaceConfig(selectedWorkspace);

  return {
    ...model,
    workspaces: nextWorkspaces,
    cursor,
    selectedWorkspace,
    selectedConfig,
    draftConfig: selectedConfig ? { ...selectedConfig } : null,
    isDirty: false,
    isEditing: false,
  };
}

export function init(): [WorkspaceScreenModel, Command] {
  const workspaces = workspaceStorage.list();
  const activeWorkspace = workspaceStorage.getActive();
  const activeIndex = Math.max(0, workspaces.indexOf(activeWorkspace));
  const selectedWorkspace = workspaces[activeIndex] ?? null;
  const selectedConfig = loadWorkspaceConfig(selectedWorkspace);

  const workspaceModel: WorkspaceScreenModel = {
    workspaces,
    activeWorkspace,
    cursor: activeIndex,
    paneFocus: 'list',
    selectedField: 'lang',
    selectedWorkspace,
    selectedConfig,
    draftConfig: selectedConfig ? { ...selectedConfig } : null,
    isEditing: false,
    isDirty: false,
    showCreateInput: false,
    newWorkspaceName: '',
    showDeleteConfirm: false,
    error: null,
    success: null,
  };

  return [workspaceModel, Cmd.none()];
}

function updateDraftField(
  model: WorkspaceScreenModel,
  updater: (value: string) => string
): WorkspaceScreenModel {
  if (!model.draftConfig) return model;
  const field = model.selectedField;
  const nextDraft = { ...model.draftConfig, [field]: updater(model.draftConfig[field]) };
  return { ...model, draftConfig: nextDraft, isDirty: true, error: null, success: null };
}

export function update(
  msg: WorkspaceMsg,
  model: WorkspaceScreenModel
): [WorkspaceScreenModel, Command] {
  switch (msg.type) {
    case 'WORKSPACE_UP':
      if (model.isEditing) return [model, Cmd.none()];
      return [
        syncSelection(model, model.workspaces, model.cursor - 1),
        Cmd.none(),
      ];

    case 'WORKSPACE_DOWN':
      if (model.isEditing) return [model, Cmd.none()];
      return [
        syncSelection(model, model.workspaces, model.cursor + 1),
        Cmd.none(),
      ];

    case 'WORKSPACE_SELECT': {
      if (model.isEditing || model.showCreateInput || model.showDeleteConfirm) return [model, Cmd.none()];
      const target = model.workspaces[model.cursor];
      if (!target) return [model, Cmd.none()];
      if (target === model.activeWorkspace) {
        return [{ ...model, success: `Already on "${target}"`, error: null }, Cmd.none()];
      }
      const switched = workspaceStorage.setActive(target);
      if (!switched) {
        return [{ ...model, error: `Failed to switch to "${target}"`, success: null }, Cmd.none()];
      }
      return [
        { ...model, activeWorkspace: target, success: `Switched to "${target}"`, error: null },
        Cmd.switchWorkspace(target),
      ];
    }

    case 'WORKSPACE_FOCUS_LIST':
      return [{ ...model, paneFocus: 'list', isEditing: false, isDirty: false, error: null }, Cmd.none()];

    case 'WORKSPACE_FOCUS_EDITOR':
      return [{ ...model, paneFocus: 'editor', error: null }, Cmd.none()];

    case 'WORKSPACE_TOGGLE_FOCUS':
      return [
        {
          ...model,
          paneFocus: model.paneFocus === 'list' ? 'editor' : 'list',
          isEditing: false,
          isDirty: false,
          error: null,
        },
        Cmd.none(),
      ];

    case 'WORKSPACE_FIELD_UP': {
      if (model.paneFocus !== 'editor' || model.isEditing) return [model, Cmd.none()];
      const index = Math.max(0, EDIT_FIELDS.indexOf(model.selectedField) - 1);
      return [{ ...model, selectedField: EDIT_FIELDS[index] }, Cmd.none()];
    }

    case 'WORKSPACE_FIELD_DOWN': {
      if (model.paneFocus !== 'editor' || model.isEditing) return [model, Cmd.none()];
      const index = Math.min(EDIT_FIELDS.length - 1, EDIT_FIELDS.indexOf(model.selectedField) + 1);
      return [{ ...model, selectedField: EDIT_FIELDS[index] }, Cmd.none()];
    }

    case 'WORKSPACE_EDIT_START':
      if (model.paneFocus !== 'editor' || !model.draftConfig) return [model, Cmd.none()];
      return [{ ...model, isEditing: true, error: null, success: null }, Cmd.none()];

    case 'WORKSPACE_EDIT_INPUT':
      if (!model.isEditing) return [model, Cmd.none()];
      return [updateDraftField(model, (value) => value + msg.char), Cmd.none()];

    case 'WORKSPACE_EDIT_BACKSPACE':
      if (!model.isEditing) return [model, Cmd.none()];
      return [updateDraftField(model, (value) => value.slice(0, -1)), Cmd.none()];

    case 'WORKSPACE_EDIT_CANCEL':
      return [
        {
          ...model,
          draftConfig: model.selectedConfig ? { ...model.selectedConfig } : null,
          isEditing: false,
          isDirty: false,
          error: null,
        },
        Cmd.none(),
      ];

    case 'WORKSPACE_EDIT_SAVE': {
      if (!model.isEditing || !model.selectedWorkspace || !model.draftConfig) return [model, Cmd.none()];
      const nextDraft = {
        lang: model.draftConfig.lang.trim(),
        workDir: model.draftConfig.workDir.trim(),
        editor: model.draftConfig.editor.trim(),
        syncRepo: model.draftConfig.syncRepo.trim(),
      };

      if (!nextDraft.lang) {
        return [{ ...model, error: 'Language is required' }, Cmd.none()];
      }
      if (!nextDraft.workDir) {
        return [{ ...model, error: 'Working directory is required' }, Cmd.none()];
      }

      workspaceStorage.setConfig(
        {
          lang: nextDraft.lang,
          workDir: nextDraft.workDir,
          editor: nextDraft.editor || undefined,
          syncRepo: nextDraft.syncRepo || undefined,
        },
        model.selectedWorkspace
      );

      return [
        {
          ...model,
          selectedConfig: nextDraft,
          draftConfig: { ...nextDraft },
          isEditing: false,
          isDirty: false,
          error: null,
          success: `Saved "${model.selectedWorkspace}" properties`,
        },
        Cmd.none(),
      ];
    }

    case 'WORKSPACE_CREATE_START':
      return [
        {
          ...model,
          showCreateInput: true,
          newWorkspaceName: '',
          error: null,
          success: null,
          paneFocus: 'list',
        },
        Cmd.none(),
      ];

    case 'WORKSPACE_CREATE_INPUT':
      if (!model.showCreateInput) return [model, Cmd.none()];
      return [{ ...model, newWorkspaceName: model.newWorkspaceName + msg.char, error: null }, Cmd.none()];

    case 'WORKSPACE_CREATE_BACKSPACE':
      if (!model.showCreateInput) return [model, Cmd.none()];
      return [{ ...model, newWorkspaceName: model.newWorkspaceName.slice(0, -1), error: null }, Cmd.none()];

    case 'WORKSPACE_CREATE_CANCEL':
      return [{ ...model, showCreateInput: false, newWorkspaceName: '', error: null }, Cmd.none()];

    case 'WORKSPACE_CREATE_SUBMIT': {
      if (!model.showCreateInput) return [model, Cmd.none()];
      const name = model.newWorkspaceName.trim();
      if (!name) return [{ ...model, error: 'Name cannot be empty' }, Cmd.none()];
      if (workspaceStorage.exists(name)) {
        return [{ ...model, error: 'Workspace already exists' }, Cmd.none()];
      }

      const created = workspaceStorage.create(name, {
        workDir: '',
        lang: 'typescript',
      });
      if (!created) {
        return [{ ...model, error: 'Failed to create workspace' }, Cmd.none()];
      }

      const workspaces = workspaceStorage.list();
      const synced = syncSelection(
        { ...model, showCreateInput: false, newWorkspaceName: '' },
        workspaces,
        workspaces.indexOf(name)
      );
      return [
        {
          ...synced,
          success: `Created workspace "${name}"`,
          paneFocus: 'list',
        },
        Cmd.createWorkspace(name),
      ];
    }

    case 'WORKSPACE_DELETE': {
      const toDelete = model.workspaces[model.cursor];
      if (!toDelete) return [model, Cmd.none()];
      if (toDelete === 'default') {
        return [{ ...model, error: 'Cannot delete default workspace' }, Cmd.none()];
      }
      return [{ ...model, showDeleteConfirm: true, error: null, success: null }, Cmd.none()];
    }

    case 'WORKSPACE_DELETE_CANCEL':
      return [{ ...model, showDeleteConfirm: false, error: null }, Cmd.none()];

    case 'WORKSPACE_DELETE_CONFIRM': {
      const target = model.workspaces[model.cursor];
      if (!target) return [model, Cmd.none()];
      if (target === 'default') {
        return [{ ...model, error: 'Cannot delete default workspace' }, Cmd.none()];
      }

      const deleted = workspaceStorage.delete(target);
      if (!deleted) {
        return [{ ...model, error: `Failed to delete "${target}"` }, Cmd.none()];
      }

      const workspaces = workspaceStorage.list();
      const activeWorkspace = workspaceStorage.getActive();
      const synced = syncSelection(
        { ...model, showDeleteConfirm: false, activeWorkspace },
        workspaces,
        Math.min(model.cursor, Math.max(0, workspaces.length - 1))
      );
      return [{ ...synced, success: `Deleted workspace "${target}"` }, Cmd.deleteWorkspace(target)];
    }

    default:
      return [model, Cmd.none()];
  }
}
