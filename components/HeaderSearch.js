import React from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from "react-native";

export default function HeaderSearch({
  value,
  onChangeText,
  onSearch,
  loading = false,
  errorMessage = "",
}) {
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
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSearch}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
        />
        <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={onSearch} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? "Searching..." : "Search"}</Text>
        </TouchableOpacity>
      </View>

      {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

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
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
  },
  errorText: {
    marginTop: 8,
    color: "#B42318",
    fontSize: 12,
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