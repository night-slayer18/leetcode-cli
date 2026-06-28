import { Cmd, Command, LoginScreenModel, LoginMsg } from '../../types.js';
import { config } from '../../../storage/config.js';
import { DEFAULT_LEETCODE_SITE, normalizeLeetCodeSiteInput } from '../../../utils/site.js';

export { view } from './view.js';

function getConfiguredSite() {
  return (
    normalizeLeetCodeSiteInput(config.getSite?.() ?? config.getConfig?.().site ?? '') ??
    DEFAULT_LEETCODE_SITE
  );
}

export function init(): [LoginScreenModel, Command] {
  const model: LoginScreenModel = {
    step: 'instructions',
    site: getConfiguredSite(),
    sessionToken: '',
    csrfToken: '',
    focusedField: 'session',
    error: null,
  };
  return [model, Cmd.none()];
}

export function update(msg: LoginMsg, model: LoginScreenModel): [LoginScreenModel, Command] {
  switch (msg.type) {
    case 'LOGIN_SWITCH_SITE':
      return [
        {
          ...model,
          site: model.site === 'leetcode.cn' ? 'leetcode.com' : 'leetcode.cn',
          error: null,
        },
        Cmd.none(),
      ];

    case 'LOGIN_SESSION_INPUT':
      return [{ ...model, sessionToken: msg.value }, Cmd.none()];

    case 'LOGIN_CSRF_INPUT':
      return [{ ...model, csrfToken: msg.value }, Cmd.none()];

    case 'LOGIN_SWITCH_FOCUS':
      return [
        { ...model, focusedField: model.focusedField === 'session' ? 'csrf' : 'session' },
        Cmd.none(),
      ];

    case 'LOGIN_SET_FOCUS':
      return [{ ...model, focusedField: msg.field }, Cmd.none()];

    case 'LOGIN_BACK':
      if (model.step === 'input' || model.step === 'error' || model.step === 'verifying') {
        return [{ ...model, step: 'site', focusedField: 'session', error: null }, Cmd.none()];
      }
      return [{ ...model, step: 'instructions', focusedField: 'session', error: null }, Cmd.none()];

    case 'LOGIN_SUBMIT':
      if (model.step === 'instructions') {
        return [{ ...model, step: 'site', focusedField: 'session', error: null }, Cmd.none()];
      }
      if (model.step === 'site') {
        return [{ ...model, step: 'input', focusedField: 'session', error: null }, Cmd.none()];
      }
      if (!model.sessionToken || !model.csrfToken) {
        return [{ ...model, error: 'Both fields are required' }, Cmd.none()];
      }
      return [
        { ...model, step: 'verifying', error: null },
        Cmd.login(model.sessionToken, model.csrfToken, model.site),
      ];

    case 'LOGIN_SUCCESS':
      return [{ ...model, step: 'success' }, Cmd.none()];

    case 'LOGIN_ERROR':
      return [{ ...model, step: 'input', error: msg.error }, Cmd.none()];
  }
  return [model, Cmd.none()];
}
