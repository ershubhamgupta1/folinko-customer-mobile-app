import React from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from "react-native";

export default function HeaderSearch() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Shop local. Buy with confidence.</Text>
      <Text style={styles.subtitle}>
        Discover fresh listings from verified sellers.
      </Text>

      <View style={styles.searchBox}>
        <TextInput
          placeholder="Paste social post link"
          style={styles.input}
        />
        <TouchableOpacity style={styles.button}>
          <Text style={{ color: "#fff" }}>Search</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tags}>
        <Text style={styles.tag}>✔ Verified sellers</Text>
        <Text style={styles.tag}>🚚 Delivery shown</Text>
        <Text style={styles.tag}>💬 Orders tracking</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    margin: 16,
  },
  title: { fontSize: 20, fontWeight: "bold" },
  subtitle: { color: "#666", marginVertical: 6 },

  searchBox: {
    flexDirection: "row",
    marginTop: 10,
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    padding: 6,
  },
  input: { flex: 1, padding: 8 },
  button: {
    backgroundColor: "#f5a623",
    paddingHorizontal: 14,
    justifyContent: "center",
    borderRadius: 10,
  },

  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
    gap: 6,
  },
  tag: {
    backgroundColor: "#eee",
    padding: 6,
    borderRadius: 10,
    fontSize: 12,
  },
});