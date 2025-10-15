import { GoogleSignin } from '@react-native-google-signin/google-signin';
import {
  saveUserSession,
  clearUserSession,
  getUserSession,
} from './secureStore';

const WEB_CLIENT_ID =
  '62939137999-064ss0dmogcfj2oo67r9u2cvk6qepfrq.apps.googleusercontent.com'; //web
// '62939137999-6etnhvfcmt9sp542g13vtpiqcok4v3dm.apps.googleusercontent.com'; // debug
// const WEB_CLIENT_ID = '62939137999-3pf2bj9ef8nrf6np6heiefinmlok2qf1.apps.googleusercontent.com'; // release

export function configureGoogleSignIn() {
  GoogleSignin.configure({
    webClientId: WEB_CLIENT_ID,
    // offlineAccess: false,
  });
}

export async function signInWithGoogle() {
  try {
    await GoogleSignin.hasPlayServices({
      showPlayServicesUpdateDialog: true,
    });
    const userInfo = await GoogleSignin.signIn();
    const tokens = await GoogleSignin.getTokens();
    console.log('tokens', tokens);
    console.log('User Info:', userInfo);
    await saveUserSession(userInfo.data.user, tokens.accessToken);
    return { success: true, user: userInfo.user };
  } catch (error) {
    console.log('Google sign-in error:', error);
    return { success: false, error };
  }
}

export async function signOutGoogle() {
  try {
    await GoogleSignin.signOut();
    await clearUserSession();
    return { success: true };
  } catch (error) {
    console.warn('Sign-out error:', error);
    return { success: false, error };
  }
}

export async function getCachedUser() {
  return await getUserSession();
}
