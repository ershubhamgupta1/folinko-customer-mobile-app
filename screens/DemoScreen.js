import { useCallback, useState } from 'react';
import { ScrollView, RefreshControl, StyleSheet, View, Text } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";

const DemoScreen = () => {
    const [refreshing, setRefreshing] = useState(false);
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        // fetchPosts();
    }, []);

  return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
            <ScrollView 
                style={styles.container}
                keyboardShouldPersistTaps="handled"
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
            <View>
                <Text>DemoScreen</Text>
            </View>
            </ScrollView>
      </SafeAreaView>
    );
};

const styles = StyleSheet.create({
  safeArea: {
      flex: 1,
      backgroundColor: "#fff"
  },
  container: {
      flex: 1
  },
});

export default DemoScreen;