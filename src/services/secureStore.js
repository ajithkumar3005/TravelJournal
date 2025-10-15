import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

const USER_KEY = 'TRAVEL_JOURNAL_USER';

export async function saveUserSession(user, token) {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  if (token)
    await Keychain.setGenericPassword('google', token, { service: 'google' });
}

export async function getUserSession() {
  const userJSON = await AsyncStorage.getItem(USER_KEY);
  const tokenData = await Keychain.getGenericPassword({ service: 'google' });
  const token = tokenData ? tokenData.password : null;
  return userJSON ? { user: JSON.parse(userJSON), token } : null;
}

export async function clearUserSession() {
  await AsyncStorage.removeItem(USER_KEY);
  await Keychain.resetGenericPassword({ service: 'google' });
}
