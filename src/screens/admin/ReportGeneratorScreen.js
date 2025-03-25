import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ReportGeneratorScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Report Generator Screen</Text>
      <Text style={styles.subtext}>Coming soon...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtext: {
    fontSize: 16,
    color: '#666',
  },
});

export default ReportGeneratorScreen;