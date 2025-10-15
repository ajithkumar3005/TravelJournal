import { combineReducers } from 'redux';
import journalReducer from './journal';
import authReducer from './auth';

const rootReducer = combineReducers({
  journal: journalReducer,
  auth: authReducer,
});

export default rootReducer;
