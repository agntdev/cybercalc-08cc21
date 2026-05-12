import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { buttonLayout, evaluateKeyPress, initialMobileState } from './src/calculatorCore';
import { registerForPushNotificationsAsync } from './src/notifications';
import { platformOptimizations } from './src/platform';

export default function App() {
  const [state, setState] = useState(initialMobileState());
  const optimizations = useMemo(() => platformOptimizations(), []);

  const press = (key) => {
    setState((current) => evaluateKeyPress(current, key));
  };

  const enablePush = async () => {
    const token = await registerForPushNotificationsAsync();
    setState((current) => ({ ...current, pushToken: token || 'unavailable' }));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <View style={styles.shell}>
        <Text style={styles.brand}>CyberCalc</Text>
        <Text style={styles.optimization}>{optimizations.summary}</Text>
        <View style={styles.display}>
          <Text style={styles.expression}>{state.expression}</Text>
          <Text style={styles.value}>{state.value}</Text>
        </View>
        <View style={styles.grid}>
          {buttonLayout.flat().map((key) => (
            <Pressable key={key} style={styles.button} onPress={() => press(key)}>
              <Text style={styles.buttonText}>{key}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable style={styles.push} onPress={enablePush}>
          <Text style={styles.pushText}>Enable push alerts</Text>
        </Pressable>
        <Text style={styles.pushState}>{state.pushToken ? `push: ${state.pushToken}` : 'push: not registered'}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0a0f' },
  shell: { flex: 1, padding: 20, justifyContent: 'center' },
  brand: { color: '#00f0ff', fontFamily: 'Courier', fontSize: 20, letterSpacing: 4, textAlign: 'center' },
  optimization: { color: '#6666aa', fontSize: 12, marginBottom: 14, textAlign: 'center' },
  display: { backgroundColor: '#050510', borderColor: '#00f0ff', borderWidth: 1, borderRadius: 10, padding: 16, marginBottom: 16 },
  expression: { color: '#6666aa', minHeight: 20, textAlign: 'right' },
  value: { color: '#00f0ff', fontSize: 38, fontWeight: '700', textAlign: 'right' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  button: { alignItems: 'center', backgroundColor: '#1a1a2e', borderRadius: 10, paddingVertical: 18, width: '22.9%' },
  buttonText: { color: '#e0e0f0', fontSize: 18, fontWeight: '700' },
  push: { borderColor: '#ff00aa', borderRadius: 8, borderWidth: 1, marginTop: 18, padding: 12 },
  pushText: { color: '#ff00aa', fontWeight: '700', textAlign: 'center' },
  pushState: { color: '#6666aa', fontSize: 11, marginTop: 8, textAlign: 'center' },
});
