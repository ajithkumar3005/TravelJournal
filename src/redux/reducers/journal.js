import { SET_ENTRIES, ADD_ENTRY } from '../actions/action';

const initialState = {
  entries: [],
};
export default function journalReducer(state = initialState, action) {
  switch (action.type) {
    case SET_ENTRIES:
      return { ...state, entries: action.payload };
    case ADD_ENTRY:
      return { ...state, entries: [...state.entries, action.payload] };
    default:
      return state;
  }
}
