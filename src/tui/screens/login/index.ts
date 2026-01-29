import { AppModel, Cmd, Command, LoginScreenModel, LoginMsg } from '../../types.js';
import { leetcodeClient } from '../../../api/client.js';
import { credentials } from '../../../storage/credentials.js';

export { view } from './view.js';

export function init(): [LoginScreenModel, Command] {
    const model: LoginScreenModel = {
        step: 'instructions',
        sessionToken: '',
        csrfToken: '',
        focusedField: 'session',
        error: null
    };
    return [model, Cmd.none()];
}

export function update(msg: LoginMsg, model: LoginScreenModel): [LoginScreenModel, Command] {
    switch (msg.type) {
        case 'LOGIN_SESSION_INPUT':
            return [{ ...model, sessionToken: msg.value }, Cmd.none()];
            
        case 'LOGIN_CSRF_INPUT':
            return [{ ...model, csrfToken: msg.value }, Cmd.none()];
            
        case 'LOGIN_SWITCH_FOCUS':
            return [{ ...model, focusedField: model.focusedField === 'session' ? 'csrf' : 'session' }, Cmd.none()];

        case 'LOGIN_SET_FOCUS':
            return [{ ...model, focusedField: msg.field }, Cmd.none()];
            
        case 'LOGIN_BACK':
            return [{ ...model, step: 'instructions', focusedField: 'session', error: null }, Cmd.none()];

        case 'LOGIN_SUBMIT':
            if (model.step === 'instructions') {
                return [{ ...model, step: 'input', focusedField: 'session' }, Cmd.none()];
            }
            if (!model.sessionToken || !model.csrfToken) {
                return [{ ...model, error: 'Both fields are required' }, Cmd.none()];
            }
            return [
                { ...model, step: 'verifying', error: null },
                Cmd.login(model.sessionToken, model.csrfToken)
            ];

        case 'LOGIN_SUCCESS':
            return [{ ...model, step: 'success' }, Cmd.none()];

        case 'LOGIN_ERROR':
            return [{ ...model, step: 'input', error: msg.error }, Cmd.none()];
    }
    return [model, Cmd.none()];
}
