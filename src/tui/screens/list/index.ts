

import type { ListScreenModel, ListMsg, Command, Problem } from '../../types.js';
import { Cmd } from '../../types.js';
import { bookmarks } from '../../../storage/bookmarks.js';

const PAGE_SIZE = 50;

export function createInitialModel(): ListScreenModel {
  return {
    problems: [],
    total: 0,
    cursor: 0,
    scrollOffset: 0,
    page: 0,
    loading: true,
    loadingMore: false,
    error: null,
    searchQuery: '',
    searchMode: false,
    searchBuffer: '',
    difficultyFilter: null,
    statusFilter: null,
    bookmarkFilter: false,
  };
}

export function init(): [ListScreenModel, Command] {
  const model = createInitialModel();
  const filters = { limit: PAGE_SIZE, skip: 0 };
  return [model, Cmd.fetchProblems(filters, false)];
}

export function update(
  msg: ListMsg,
  model: ListScreenModel,
  terminalHeight: number
): [ListScreenModel, Command] {
  
  const listHeight = Math.max(3, terminalHeight - 13);

  switch (msg.type) {

    case 'LIST_CURSOR_DOWN': {
      if (model.problems.length === 0) return [model, Cmd.none()];

      const nextCursor = Math.min(model.cursor + 1, model.problems.length - 1);
      let nextOffset = model.scrollOffset;

      if (nextCursor >= model.scrollOffset + listHeight) {
        nextOffset = nextCursor - listHeight + 1;
      }

      const shouldFetchMore =
        nextCursor >= model.problems.length - 5 &&
        model.problems.length < model.total &&
        !model.loadingMore &&
        !model.loading;

      if (shouldFetchMore) {
        const filters = buildFilters(model, model.page + 1);
        return [
          { ...model, cursor: nextCursor, scrollOffset: nextOffset, loadingMore: true },
          Cmd.fetchProblems(filters, true),
        ];
      }

      return [{ ...model, cursor: nextCursor, scrollOffset: nextOffset }, Cmd.none()];
    }

    case 'LIST_CURSOR_UP': {
      if (model.problems.length === 0) return [model, Cmd.none()];

      const nextCursor = Math.max(model.cursor - 1, 0);
      let nextOffset = model.scrollOffset;

      if (nextCursor < model.scrollOffset) {
        nextOffset = nextCursor;
      }

      return [{ ...model, cursor: nextCursor, scrollOffset: nextOffset }, Cmd.none()];
    }

    case 'LIST_PAGE_DOWN': {
      const nextCursor = Math.min(model.cursor + listHeight, model.problems.length - 1);
      const nextOffset = Math.min(model.scrollOffset + listHeight, Math.max(0, model.problems.length - listHeight));
      return [{ ...model, cursor: nextCursor, scrollOffset: nextOffset }, Cmd.none()];
    }

    case 'LIST_PAGE_UP': {
      const nextCursor = Math.max(model.cursor - listHeight, 0);
      const nextOffset = Math.max(model.scrollOffset - listHeight, 0);
      return [{ ...model, cursor: nextCursor, scrollOffset: nextOffset }, Cmd.none()];
    }

    case 'LIST_GO_TOP':
      return [{ ...model, cursor: 0, scrollOffset: 0 }, Cmd.none()];

    case 'LIST_GO_BOTTOM': {
      const lastIndex = Math.max(0, model.problems.length - 1);
      const newOffset = Math.max(0, model.problems.length - listHeight);
      return [{ ...model, cursor: lastIndex, scrollOffset: newOffset }, Cmd.none()];
    }

    case 'LIST_SELECT':
      
      return [model, Cmd.none()];

    case 'LIST_SEARCH_START':
      return [{ ...model, searchMode: true, searchBuffer: model.searchQuery }, Cmd.none()];

    case 'LIST_SEARCH_INPUT':
      return [{ ...model, searchBuffer: model.searchBuffer + msg.char }, Cmd.none()];

    case 'LIST_SEARCH_BACKSPACE':
      return [{ ...model, searchBuffer: model.searchBuffer.slice(0, -1) }, Cmd.none()];

    case 'LIST_SEARCH_SUBMIT': {
      const filters = buildFilters({ ...model, searchQuery: model.searchBuffer }, 0);
      return [
        { ...model, searchMode: false, searchQuery: model.searchBuffer, loading: true, cursor: 0, scrollOffset: 0 },
        Cmd.fetchProblems(filters, false),
      ];
    }

    case 'LIST_SEARCH_CANCEL':
      return [{ ...model, searchMode: false, searchBuffer: '' }, Cmd.none()];

    case 'LIST_FILTER_DIFFICULTY': {
      const newFilter = msg.difficulty;
      const filters = buildFilters({ ...model, difficultyFilter: newFilter }, 0);
      return [
        { ...model, difficultyFilter: newFilter, loading: true, cursor: 0, scrollOffset: 0 },
        Cmd.fetchProblems(filters, false),
      ];
    }

    case 'LIST_FILTER_STATUS': {
      const newFilter = msg.status;
      const filters = buildFilters({ ...model, statusFilter: newFilter }, 0);
      return [
        { ...model, statusFilter: newFilter, loading: true, cursor: 0, scrollOffset: 0 },
        Cmd.fetchProblems(filters, false),
      ];
    }

    case 'LIST_FILTER_BOOKMARKS': {
      const newFilter = !model.bookmarkFilter;
      const filters = buildFilters({ ...model, bookmarkFilter: newFilter }, 0);
      return [
        { ...model, bookmarkFilter: newFilter, loading: true, cursor: 0, scrollOffset: 0 },
        Cmd.fetchProblems(filters, false),
      ];
    }

    case 'LIST_CLEAR_FILTERS': {
      const filters = { limit: PAGE_SIZE, skip: 0 };
      return [
        { ...model, difficultyFilter: null, statusFilter: null, searchQuery: '', bookmarkFilter: false, loading: true, cursor: 0, scrollOffset: 0 },
        Cmd.fetchProblems(filters, false),
      ];
    }

    case 'LIST_REFRESH': {
      const filters = buildFilters(model, 0);
      return [
        { ...model, loading: true, cursor: 0, scrollOffset: 0 },
        Cmd.fetchProblems(filters, false),
      ];
    }

    case 'LIST_FETCH_START':
      return [{ ...model, loading: true, error: null }, Cmd.none()];

    case 'LIST_FETCH_SUCCESS': {
      let newProblems = msg.append
        ? [...model.problems, ...msg.problems]
        : msg.problems;

      if (model.bookmarkFilter) {
        newProblems = newProblems.filter(p => bookmarks.has(p.questionFrontendId));
      }

      return [
        {
          ...model,
          problems: newProblems,
          total: model.bookmarkFilter ? newProblems.length : msg.total,
          loading: false,
          loadingMore: false,
          page: msg.append ? model.page + 1 : 0,
          error: null,
        },
        Cmd.none(),
      ];
    }

    case 'LIST_FETCH_ERROR':
      return [{ ...model, loading: false, loadingMore: false, error: msg.error }, Cmd.none()];

    default:
      return [model, Cmd.none()];
  }
}

function buildFilters(model: ListScreenModel, page: number): import('../../types.js').ProblemListFilters {
  const filters: import('../../types.js').ProblemListFilters = {
    limit: PAGE_SIZE,
    skip: page * PAGE_SIZE,
  };

  if (model.difficultyFilter) {
    filters.difficulty = model.difficultyFilter.toUpperCase() as 'EASY' | 'MEDIUM' | 'HARD';
  }

  if (model.statusFilter) {
    const statusMap: Record<string, 'NOT_STARTED' | 'AC' | 'TRIED'> = {
      solved: 'AC',
      attempted: 'TRIED',
      todo: 'NOT_STARTED',
    };
    filters.status = statusMap[model.statusFilter];
  }

  if (model.searchQuery) {
    filters.searchKeywords = model.searchQuery;
  }

  return filters;
}

export function getSelectedProblem(model: ListScreenModel): Problem | null {
  return model.problems[model.cursor] ?? null;
}
