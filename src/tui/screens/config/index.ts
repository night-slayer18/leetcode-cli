import type { ConfigScreenModel, ConfigMsg, Command } from '../../types.js';
import { Cmd } from '../../types.js';
import { config } from '../../../storage/config.js';

type ConfigOption = ConfigScreenModel['options'][number];

function buildOptions(currentConfig: ReturnType<typeof config.getConfig>): ConfigOption[] {
  return [
    {
      id: 'language',
      label: 'Default Language',
      description: 'Language for new solutions (example: typescript, python3, sql)',
      value: currentConfig.language,
    },
    {
      id: 'editor',
      label: 'Editor Command',
      description: 'Command used to open files (example: code, vim, nano)',
      value: currentConfig.editor || '',
    },
    {
      id: 'workdir',
      label: 'Working Directory',
      description: 'Directory where solution files are generated',
      value: currentConfig.workDir,
    },
    {
      id: 'repo',
      label: 'Sync Repository',
      description: 'Git repository URL used for sync operations',
      value: currentConfig.repo || '',
    },
  ];
}

function getSelectedOption(model: ConfigScreenModel): ConfigOption {
  return model.options[model.selectedOption];
}

function validate(option: ConfigOption, value: string): string | null {
  const trimmed = value.trim();
  if (option.id === 'language' && !trimmed) {
    return 'Language cannot be empty';
  }
  if (option.id === 'workdir' && !trimmed) {
    return 'Working directory cannot be empty';
  }
  return null;
}

export function createInitialModel(): ConfigScreenModel {
  const currentConfig = config.getConfig();
  const options = buildOptions(currentConfig);
  return {
    selectedOption: 0,
    options,
    paneFocus: 'list',
    isEditing: false,
    draftValue: options[0]?.value ?? '',
    validationError: null,
    isDirty: false,
    config: currentConfig,
  };
}

export function init(): [ConfigScreenModel, Command] {
  return [createInitialModel(), Cmd.none()];
}

function withSelectedOption(model: ConfigScreenModel, selectedOption: number): ConfigScreenModel {
  const index = (selectedOption + model.options.length) % model.options.length;
  const option = model.options[index];
  return {
    ...model,
    selectedOption: index,
    draftValue: option.value,
    isEditing: false,
    isDirty: false,
    validationError: null,
  };
}

export function update(msg: ConfigMsg, model: ConfigScreenModel): [ConfigScreenModel, Command] {
  switch (msg.type) {
    case 'CONFIG_OPTION_UP':
      if (model.isEditing) return [model, Cmd.none()];
      return [withSelectedOption(model, model.selectedOption - 1), Cmd.none()];

    case 'CONFIG_OPTION_DOWN':
      if (model.isEditing) return [model, Cmd.none()];
      return [withSelectedOption(model, model.selectedOption + 1), Cmd.none()];

    case 'CONFIG_FOCUS_LIST':
      return [{ ...model, paneFocus: 'list', isEditing: false, isDirty: false }, Cmd.none()];

    case 'CONFIG_FOCUS_EDITOR':
      return [{ ...model, paneFocus: 'editor' }, Cmd.none()];

    case 'CONFIG_TOGGLE_FOCUS':
      return [{ ...model, paneFocus: model.paneFocus === 'list' ? 'editor' : 'list' }, Cmd.none()];

    case 'CONFIG_EDIT_START': {
      const option = getSelectedOption(model);
      return [
        {
          ...model,
          paneFocus: 'editor',
          isEditing: true,
          draftValue: option.value,
          validationError: null,
          isDirty: false,
        },
        Cmd.none(),
      ];
    }

    case 'CONFIG_EDIT_INPUT':
      if (!model.isEditing) return [model, Cmd.none()];
      return [
        {
          ...model,
          draftValue: model.draftValue + msg.char,
          validationError: null,
          isDirty: true,
        },
        Cmd.none(),
      ];

    case 'CONFIG_EDIT_BACKSPACE':
      if (!model.isEditing) return [model, Cmd.none()];
      return [
        {
          ...model,
          draftValue: model.draftValue.slice(0, -1),
          validationError: null,
          isDirty: true,
        },
        Cmd.none(),
      ];

    case 'CONFIG_EDIT_CANCEL': {
      const option = getSelectedOption(model);
      return [
        {
          ...model,
          isEditing: false,
          isDirty: false,
          draftValue: option.value,
          validationError: null,
        },
        Cmd.none(),
      ];
    }

    case 'CONFIG_EDIT_SAVE': {
      if (!model.isEditing) return [model, Cmd.none()];
      const option = getSelectedOption(model);
      const error = validate(option, model.draftValue);
      if (error) {
        return [{ ...model, validationError: error }, Cmd.none()];
      }

      const newOptions = [...model.options];
      newOptions[model.selectedOption] = { ...option, value: model.draftValue };

      return [
        {
          ...model,
          options: newOptions,
          isEditing: false,
          isDirty: false,
          validationError: null,
        },
        Cmd.saveConfig(option.id, model.draftValue),
      ];
    }

    default:
      return [model, Cmd.none()];
  }
}
