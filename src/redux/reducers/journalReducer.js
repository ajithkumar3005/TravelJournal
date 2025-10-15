import {
  ADD_ENTRY,
  SET_ENTRIES,
  UPDATE_ENTRY,
  REMOVE_ENTRY,
} from '../actions/action';

const initialState = {
  entries: [],
};

export default function journalReducer(state = initialState, action) {
  switch (action.type) {
    case SET_ENTRIES:
      return {
        ...state,
        entries: action.payload,
      };

    case ADD_ENTRY:
      return {
        ...state,
        entries: [...state.entries, action.payload],
      };

    case UPDATE_ENTRY:
      return {
        ...state,
        entries: state.entries.map(entry =>
          entry.id === action.payload.id ? action.payload : entry,
        ),
      };

    case REMOVE_ENTRY:
      return {
        ...state,
        entries: state.entries.filter(entry => entry.id !== action.payload),
      };

    default:
      return state;
  }
}
