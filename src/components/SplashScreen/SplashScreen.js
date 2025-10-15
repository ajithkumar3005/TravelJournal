import React, { useEffect, useRef } from 'react';
import { StyleSheet, Dimensions, Text, Animated } from 'react-native';
import LottieView from 'lottie-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch } from 'react-redux';
import { setUserAction } from '../../redux/actions/authaction';
import { configureGoogleSignIn, getCachedUser } from '../../services/auth';
const { width, height } = Dimensions.get('window');

const SplashScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const animationRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Start animations
    animationRef.current?.play();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();

    // // Check authentication and navigate
    const checkAuthAndNavigate = async () => {
      try {
        await configureGoogleSignIn();
        const cached = await getCachedUser();

        setTimeout(() => {
          if (cached?.user) {
            dispatch(setUserAction(cached.user));
            navigation.replace('Home');
          } else {
            navigation.replace('Login');
          }
        }, 3000);
      } catch (error) {
        console.error('Auth check failed:', error);
        setTimeout(() => navigation.replace('Login'), 3000);
      }
    };

    checkAuthAndNavigate();

    // Cleanup timeout on unmount
    return () => clearTimeout();
  }, [navigation, dispatch]);
  // useEffect(() => {
  //   configureGoogleSignIn();
  //   (async () => {
  //     const cached = await getCachedUser();
  //     if (cached?.user) {
  //       dispatch(setUserAction(cached.user));
  //       navigation.replace('Home');
  //     } else {
  //       navigation.replace('Login');
  //     }
  //   })();
  // }, []);
  return (
    <LinearGradient
      colors={['#003B46', '#07575B']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <LottieView
        ref={animationRef}
        source={require('../../assets/lottieAnimation/loading.json')}
        style={styles.splashAnimation}
        autoPlay
        loop={false}
      />
      <Animated.Text
        style={[
          styles.appName,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        Travel Journal
      </Animated.Text>
    </LinearGradient>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.9,
  },
  splashAnimation: {
    width: width * 0.6,
    height: height * 0.35,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFF',
  },
});
