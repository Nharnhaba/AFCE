import React, { useEffect } from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Onboarding');
    }, 2000);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <LinearGradient
      colors={['#1a1e29', '#0d1017']}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>AFCE</Text>
        <Text style={styles.subtitle}>Media App</Text>
        <ActivityIndicator size="large" color="#00ddff" style={styles.loader} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 18,
    color: '#9ba1b0',
    marginTop: 8,
    letterSpacing: 1,
  },
  loader: {
    marginTop: 40,
  },
});
