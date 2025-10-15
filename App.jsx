import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import AppNavigation from './src/navigation/navigation';
import { useEffect } from 'react';
import { Provider } from 'react-redux';
import store from './src/redux/store';
import { configureGoogleSignIn } from './src/services/auth';
import { initDB } from './src/db/dbconfiguration';
import { networkService } from './src/services/networkService';

function App() {
  useEffect(() => {
    configureGoogleSignIn(); //
    initDB();
    // Initialize network service
    networkService.setupNetworkListener();
  }, []);

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" />
        <AppNavigation />
      </SafeAreaProvider>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
