import type { ConfigScreenModel, ConfigMsg, Command } from '../../types.js';
import { Cmd } from '../../types.js';
import { config } from '../../../storage/config.js';
import { DEFAULT_LEETCODE_SITE, normalizeLeetCodeSiteInput } from '../../../utils/site.js';
import { normalizeThemeInput, SUPPORTED_THEMES } from '../../theme.js';

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
      id: 'site',
      label: 'LeetCode Site',
      description: 'Target site for API operations (leetcode.com or leetcode.cn)',
      value: currentConfig.site || DEFAULT_LEETCODE_SITE,
    },
    {
      id: 'theme',
      label: 'Color Theme',
      description: `Color palette for the TUI (${SUPPORTED_THEMES.join(', ')})`,
      value: currentConfig.theme ?? 'auto',
    },
    {
      id: 'editor',
      label: 'Editor Command',
      description: 'Command used to open files (example: code, zed, vim, nano)',
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
  if (option.id === 'site' && !normalizeLeetCodeSiteInput(trimmed)) {
    return 'Site must be leetcode.com or leetcode.cn';
  }
  if (option.id === 'theme' && !normalizeThemeInput(trimmed)) {
    return `Theme must be one of: ${SUPPORTED_THEMES.join(', ')}`;
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
    showSiteConfirm: false,
    pendingSite: null,
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
    showSiteConfirm: false,
  };
}

export function update(msg: ConfigMsg, model: ConfigScreenModel): [ConfigScreenModel, Command] {
  switch (msg.type) {
    case 'CONFIG_OPTION_UP':
      if (model.isEditing || model.showSiteConfirm) return [model, Cmd.none()];
      return [withSelectedOption(model, model.selectedOption - 1), Cmd.none()];

    case 'CONFIG_OPTION_DOWN':
      if (model.isEditing || model.showSiteConfirm) return [model, Cmd.none()];
      return [withSelectedOption(model, model.selectedOption + 1), Cmd.none()];

    case 'CONFIG_FOCUS_LIST':
      if (model.showSiteConfirm) return [model, Cmd.none()];
      return [{ ...model, paneFocus: 'list', isEditing: false, isDirty: false }, Cmd.none()];

    case 'CONFIG_FOCUS_EDITOR':
      if (model.showSiteConfirm) return [model, Cmd.none()];
      return [{ ...model, paneFocus: 'editor' }, Cmd.none()];

    case 'CONFIG_TOGGLE_FOCUS':
      if (model.showSiteConfirm) return [model, Cmd.none()];
      return [{ ...model, paneFocus: model.paneFocus === 'list' ? 'editor' : 'list' }, Cmd.none()];

    case 'CONFIG_EDIT_START': {
      if (model.showSiteConfirm) return [model, Cmd.none()];
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

      if (option.id === 'site' && model.draftValue !== option.value) {
        return [
          {
            ...model,
            isEditing: false,
            showSiteConfirm: true,
            pendingSite: model.draftValue,
          },
          Cmd.none(),
        ];
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

    case 'CONFIG_SITE_CONFIRM': {
      if (!model.showSiteConfirm || !model.pendingSite) return [model, Cmd.none()];

      const option = getSelectedOption(model);
      const newOptions = [...model.options];
      newOptions[model.selectedOption] = { ...option, value: model.pendingSite };

      return [
        {
          ...model,
          options: newOptions,
          showSiteConfirm: false,
          pendingSite: null,
          draftValue: model.pendingSite,
        },
        Cmd.batch(Cmd.saveConfig(option.id, model.pendingSite), Cmd.logout()),
      ];
    }

    case 'CONFIG_SITE_CANCEL': {
      if (!model.showSiteConfirm) return [model, Cmd.none()];

      const option = getSelectedOption(model);
      return [
        {
          ...model,
          showSiteConfirm: false,
          pendingSite: null,
          draftValue: option.value,
        },
        Cmd.none(),
      ];
    }

    default:
      return [model, Cmd.none()];
  }
}
