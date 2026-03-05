import React from 'react';
import { View, StyleSheet } from 'react-native';
import Header from './Header';

const StickyHeader = ({ children, ...headerProps }) => {
  return (
    <View style={styles.container}>
      <Header {...headerProps} />
      {children && <View style={styles.content}>{children}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    backgroundColor: '#fff',
  },
  content: {
    // Additional content below header if needed
  },
});

export default StickyHeader;
