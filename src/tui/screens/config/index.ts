

import type { ConfigScreenModel, ConfigMsg, Command } from '../../types.js';
import { Cmd } from '../../types.js';
import { config } from '../../../storage/config.js';

export function createInitialModel(): ConfigScreenModel {
  const currentConfig = config.getConfig();
  
  return {
    selectedOption: 0,
    editMode: false,
    config: currentConfig,
    options: [
      { 
        id: 'language', 
        label: 'Default Language', 
        description: 'Language for new solutions (e.g. typescript, python3)',
        value: currentConfig.language
      },
      { 
        id: 'editor', 
        label: 'Editor Command', 
        description: 'Command to open files (e.g. code, vim, nano)',
        value: currentConfig.editor || ''
      },
      { 
        id: 'workdir', 
        label: 'Working Directory', 
        description: 'Where solution files are saved',
        value: currentConfig.workDir
      },
      { 
        id: 'repo', 
        label: 'Sync Repository', 
        description: 'Git repository for syncing solutions',
        value: currentConfig.repo || ''
      }
    ]
  };
}

export function init(): [ConfigScreenModel, Command] {
  return [createInitialModel(), Cmd.none()];
}

export function update(msg: ConfigMsg, model: ConfigScreenModel): [ConfigScreenModel, Command] {
  switch (msg.type) {
    case 'CONFIG_OPTION_UP':
      if (model.editMode) return [model, Cmd.none()];
      return [{
        ...model,
        selectedOption: (model.selectedOption - 1 + model.options.length) % model.options.length
      }, Cmd.none()];

    case 'CONFIG_OPTION_DOWN':
      if (model.editMode) return [model, Cmd.none()];
      return [{
        ...model,
        selectedOption: (model.selectedOption + 1) % model.options.length
      }, Cmd.none()];

    case 'CONFIG_OPTION_SELECT':
      return [{ ...model, editMode: true }, Cmd.none()];
    
    case 'CONFIG_CANCEL_EDIT':
      
      return [createInitialModel(), Cmd.none()];

    case 'CONFIG_INPUT': {
      if (!model.editMode) return [model, Cmd.none()];
      
      const newOptions = [...model.options];
      const option = newOptions[model.selectedOption];

      newOptions[model.selectedOption] = {
        ...option,
        value: option.value + msg.char
      };

      return [{ ...model, options: newOptions }, Cmd.none()];
    }

    case 'CONFIG_BACKSPACE': {
      if (!model.editMode) return [model, Cmd.none()];

      const newOptions = [...model.options];
      const option = newOptions[model.selectedOption];
      
      newOptions[model.selectedOption] = {
        ...option,
        value: option.value.slice(0, -1)
      };

      return [{ ...model, options: newOptions }, Cmd.none()];
    }

    case 'CONFIG_SAVE_VALUE': {
      if (!model.editMode) return [model, Cmd.none()];
      
      const option = model.options[model.selectedOption];

      if ((option.id === 'language' || option.id === 'workdir') && !option.value.trim()) {
         return [createInitialModel(), Cmd.none()]; 
      }

      return [
        { ...model, editMode: false }, 
        Cmd.saveConfig(option.id, option.value)
      ];
    }

    default:
      return [model, Cmd.none()];
  }
}
