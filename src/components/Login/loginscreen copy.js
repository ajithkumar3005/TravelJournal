import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import {
  configureGoogleSignIn,
  signInWithGoogle,
  getCachedUser,
} from '../../services/auth';
import { useDispatch } from 'react-redux';
import { setUserAction } from '../../redux/actions/authaction';
import { useNavigation } from '@react-navigation/native';

export default function LoginScreen() {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    const result = await signInWithGoogle();
    setLoading(false);

    if (result.success) {
      dispatch(setUserAction(result.user));
      navigation.replace('Home');
    } else {
      Alert.alert('Login Failed', result.error?.message || 'Unable to login');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Image
          source={require('../../assets/logo2.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.header}>New Journal Entry</Text>
      </View>

      <TouchableOpacity
        style={[styles.googleButton, loading && styles.googleButtonDisabled]}
        onPress={handleGoogleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.googleButtonText}>Sign In with Google</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#003B46', // Deep Teal background
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF', // White text for contrast
    marginBottom: 40,
    textAlign: 'center',
  },
  googleButton: {
    backgroundColor: '#66A5AD', // Muted Cyan
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 8,
    elevation: 3,
  },
  googleButtonDisabled: {
    backgroundColor: '#07575B', // Teal - darker shade when loading
  },
  googleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 10,
    borderRadius: 50,
  },
});
