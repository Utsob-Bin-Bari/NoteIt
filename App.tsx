
import { StatusBar, StyleSheet, View, Text } from 'react-native';

function App() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle={'dark-content'} />
      <Text>Let's Build a React Native App!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
