import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { signInWithGoogle } from '../../services/auth';
import { useDispatch } from 'react-redux';
import { setUserAction } from '../../redux/actions/authaction';
import Toast from 'react-native-toast-message';

export default function WelcomeScreen({ navigation }) {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    const result = await signInWithGoogle();
    setLoading(false);

    if (result.success) {
      dispatch(setUserAction(result.user));
      Toast.show({
        type: 'success',
        text1: 'Login Successful',
        text2: 'Welcome!',
        visibilityTime: 2000,
        position: 'bottom',
      });
      setTimeout(() => {
        navigation.replace('Home');
      }, 2000);
    } else {
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: result.error?.message || 'Unable to login',
        visibilityTime: 3000,
        position: 'bottom',
      });
    }
  };
  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../assets/logo2.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(4,32,38,0.8)', 'rgba(0,59,70,0.8)']}
          style={styles.overlay}
        >
          <View style={styles.content}>
            <Text style={styles.title}>
              Travel Journal{'\n'}Save Every Step
            </Text>
            <Text style={styles.subtitle}>
              A place to store your trips, memories, and meaningful moments.
            </Text>

            <TouchableOpacity
              style={styles.button}
              onPress={handleGoogleLogin}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Sign In with Google</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </ImageBackground>
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#042026',
  },
  background: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 30,
  },
  content: {
    marginBottom: 60,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 12,
  },
  subtitle: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 22,
    opacity: 0.8,
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#07575B',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  footerText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 14,
  },
  signInText: {
    color: '#66A5AD',
    fontWeight: 'bold',
  },
});
