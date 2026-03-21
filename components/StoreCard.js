import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function StoreCard({ store, horizontal = false }) {
  const navigation = useNavigation();
  const hasImage = !!store.cover_image_url;
  const isVerified = store.verified ?? store.verification_status === "VERIFIED";
  const trustScore = store.trustScore ?? Number(store?.trust_meter?.score);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={[styles.card, horizontal && styles.horizontal]}
      onPress={() => navigation.navigate("storeDetail", { shopSlug: store.slug, store })}
    >
      {/* Image */}
      {hasImage ? (
        <Image source={{ uri: store.cover_image_url }} style={styles.image} />
      ) : (
        <View style={styles.noImage}>
          <Text style={styles.noImageText}>No photo</Text>
        </View>
      )}

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.name}>{store.name}</Text>

        <Text style={styles.location}>{store.city}</Text>

        {/* Verified */}
        {isVerified && (
          <View style={styles.verifiedRow}>
            <Text style={styles.verified}>✔ Verified</Text>
          </View>
        )}

        {/* Trust Meter */}
        {Number.isFinite(trustScore) && (
          <View style={styles.trustRow}>
            <Text style={styles.trustLabel}>Trust</Text>

            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.max(0, Math.min(trustScore, 100))}%` },
                ]}
              />
            </View>

            <Text style={styles.trustValue}>{trustScore}</Text>
          </View>
        )}

        {/* Listings */}
        <Text style={styles.listings}>
          {store.post_count} listings
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 16,
    overflow: "hidden",
  },

  horizontal: {
    width: 220,
    marginRight: 10,
  },

  image: {
    height: 150,
    width: "100%",
  },

  noImage: {
    height: 150,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#eee",
  },

  noImageText: {
    color: "#999",
  },

  info: {
    padding: 12,
  },

  name: {
    fontWeight: "bold",
    fontSize: 16,
  },

  location: {
    color: "#666",
    marginTop: 2,
  },

  verifiedRow: {
    marginTop: 6,
  },

  verified: {
    color: "#16a34a",
    fontSize: 12,
    fontWeight: "500",
  },

  trustRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },

  trustLabel: {
    fontSize: 12,
    color: "#666",
    marginRight: 6,
  },

  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: "#e5e5e5",
    borderRadius: 10,
    marginHorizontal: 6,
  },

  progressFill: {
    height: 6,
    backgroundColor: "#22c55e",
    borderRadius: 10,
  },

  trustValue: {
    fontSize: 12,
    color: "#333",
  },

  listings: {
    marginTop: 8,
    fontSize: 12,
    color: "#666",
  },
});