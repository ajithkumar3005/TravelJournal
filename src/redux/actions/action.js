export const SET_ENTRIES = 'SET_ENTRIES';
export const ADD_ENTRY = 'ADD_ENTRY';
export const SET_USER = 'SET_USER';
export const LOGOUT_USER = 'LOGOUT_USER';
export const UPDATE_ENTRY = 'UPDATE_ENTRY';
export const REMOVE_ENTRY = 'REMOVE_ENTRY';

// Action Creators
export const setEntries = entries => ({
  type: SET_ENTRIES,
  payload: entries,
});

export const addEntry = entry => ({
  type: ADD_ENTRY,
  payload: entry,
});

export const updateEntry = entry => ({
  type: UPDATE_ENTRY,
  payload: entry,
});

export const removeEntry = id => ({
  type: REMOVE_ENTRY,
  payload: id,
});
