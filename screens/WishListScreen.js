import { useCallback, useState } from "react";
import {
  ScrollView,
  RefreshControl,
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const mockData = [
  {
    id: 1,
    name: "Jeans1",
    price: 2499,
    seller: "Sharma Sarees6",
    image:
      "https://images.unsplash.com/photo-1603252109303-2751441dd157",
  },
  {
    id: 2,
    name: "Silk Saree",
    price: 1499,
    seller: "Sharma Sarees6",
    image:
      "https://images.unsplash.com/photo-1593030761757-71fae45fa0e7",
  },
];

const WishListScreen = () => {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
      style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Wishlist</Text>
          <Text style={styles.subtitle}>
            Items you saved for later
          </Text>
        </View>

        {/* Wishlist Items */}
        {mockData.map((item) => (
          <View key={item.id} style={styles.card}>
            <Image source={{ uri: item.image }} style={styles.image} />

            <View style={styles.content}>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.seller}>{item.seller}</Text>

              <Text style={styles.price}>₹ {item.price}</Text>

              {/* Actions */}
              <View style={styles.actions}>
                <TouchableOpacity style={styles.addBtn}>
                  <Text style={styles.addText}>Add</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.removeBtn}>
                  <Text>Remove</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.removeBtn}>
                  <Text>View</Text>
                </TouchableOpacity>
              </View>

            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f7f7f7",
  },

  container: {
    flex: 1,
  },

  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
  },

  subtitle: {
    color: "#666",
    marginTop: 4,
  },

  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    overflow: "hidden",
  },

  image: {
    width: "100%",
    height: 420,
  },

  content: {
    padding: 14,
  },

  productName: {
    fontSize: 18,
    fontWeight: "600",
  },

  seller: {
    color: "#666",
    marginTop: 4,
  },

  price: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 8,
  },

  actions: {
    flexDirection: "row",
    marginTop: 12,
  },

  addBtn: {
    backgroundColor: "#f5a623",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
  },

  addText: {
    color: "#fff",
    fontWeight: "600",
  },

  removeBtn: {
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
  },
});

export default WishListScreen;