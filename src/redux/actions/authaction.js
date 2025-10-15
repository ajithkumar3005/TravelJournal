import { LOGOUT_USER, SET_USER } from './action';

export const setUserAction = user => ({ type: SET_USER, payload: user });
export const logoutUserAction = () => ({ type: LOGOUT_USER });
