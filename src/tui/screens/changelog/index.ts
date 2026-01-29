import { AppModel, Cmd, Command, ChangelogScreenModel, ChangelogMsg } from '../../types.js';
import { parseReleases } from './parser.js';

export { view } from './view.js';

export function init(model?: AppModel): [ChangelogScreenModel, Command] {
    const screensModel: ChangelogScreenModel = {
        entries: [],
        scrollOffset: 0,
        loading: true,
        error: null
    };

    return [screensModel, Cmd.fetchChangelog()];
}

export function update(msg: ChangelogMsg, model: ChangelogScreenModel, height: number): [ChangelogScreenModel, Command] {
    const visibleHeight = height - 4; 

    switch (msg.type) {
        case 'CHANGELOG_SCROLL_UP':
            return [{ ...model, scrollOffset: Math.max(0, model.scrollOffset - 1) }, Cmd.none()];
            
        case 'CHANGELOG_SCROLL_DOWN':
            
            return [{ ...model, scrollOffset: model.scrollOffset + 1 }, Cmd.none()];

        case 'CHANGELOG_FETCH_START':
            return [{ ...model, loading: true, error: null }, Cmd.none()];

        case 'CHANGELOG_FETCH_SUCCESS':
            const entries = parseReleases(msg.content);
            return [{ ...model, loading: false, entries: entries, error: null }, Cmd.none()];

        case 'CHANGELOG_FETCH_ERROR':
            return [{ ...model, loading: false, error: msg.error }, Cmd.none()];
            
        default:
            return [model, Cmd.none()];
    }
}
