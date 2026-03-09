import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

export default function AddPostScreen() {
  const navigation = useNavigation();

  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [material, setMaterial] = useState("");
  const [price, setPrice] = useState("");
  const [delivery, setDelivery] = useState("");
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.customHeader}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create post</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView style={styles.container}>
        <View style={{ padding: 20 }}>
          {/* Create Post */}

          <View style={styles.card}>

            <View style={styles.rowBetween}>
              <View>
                <Text style={styles.smallTitle}>Visual Inventory</Text>
                <Text style={styles.title}>Create post</Text>
              </View>

              <Feather name="plus" size={22} />
            </View>

            <Text style={styles.description}>
              Paste your social link, then add structured details like price and material.
            </Text>


            {/* Platform */}

            <Text style={styles.label}>Platform</Text>

            <View style={styles.dropdown}>
              <Text>Instagram</Text>
              <Feather name="chevron-down" size={18} />
            </View>


            {/* Template */}

            <Text style={styles.label}>Template</Text>

            <View style={styles.dropdown}>
              <Text>Default</Text>
              <Feather name="chevron-down" size={18} />
            </View>


            {/* URL */}

            <Text style={styles.label}>Social post / reel URL</Text>

            <TextInput
              style={styles.input}
              placeholder="https://www.instagram.com/reel/..."
              value={url}
              onChangeText={setUrl}
            />

            <Text style={styles.helperText}>
              We store the link and build structured inventory around it.
            </Text>


            {/* Title */}

            <Text style={styles.label}>Title</Text>

            <TextInput
              style={styles.input}
              placeholder="e.g., Product name"
              value={title}
              onChangeText={setTitle}
            />


            {/* Material */}

            <Text style={styles.label}>Material</Text>

            <TextInput
              style={styles.input}
              placeholder="e.g., Cotton"
              value={material}
              onChangeText={setMaterial}
            />


            {/* Price */}

            <Text style={styles.label}>Price (₹)</Text>

            <TextInput
              style={styles.input}
              placeholder="1499"
              keyboardType="numeric"
              value={price}
              onChangeText={setPrice}
            />


            {/* Delivery */}

            <Text style={styles.label}>Delivery fee (₹)</Text>

            <TextInput
              style={styles.input}
              placeholder="0"
              keyboardType="numeric"
              value={delivery}
              onChangeText={setDelivery}
            />


            {/* Color */}

            <Text style={styles.label}>Color</Text>

            <TextInput
              style={styles.input}
              placeholder="e.g., Black"
              value={color}
              onChangeText={setColor}
            />


            {/* Size */}

            <Text style={styles.label}>Size</Text>

            <TextInput
              style={styles.input}
              placeholder="e.g., M / L / Free"
              value={size}
              onChangeText={setSize}
            />


            {/* Caption */}

            <Text style={styles.label}>Caption (optional)</Text>

            <TextInput
              style={styles.textarea}
              placeholder="Write details customers care about..."
              value={caption}
              onChangeText={setCaption}
              multiline
            />


            {/* Images */}

            <View style={styles.imageCard}>

              <View style={styles.rowBetween}>
                <Text style={styles.imageTitle}>Images</Text>

                <TouchableOpacity style={styles.addButton}>
                  <Text>Add</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.helperText}>
                Paste image URLs for now. Later we'll add uploads to Google Cloud Storage.
              </Text>

              <TextInput
                style={styles.input}
                placeholder="https://... image url"
                value={imageUrl}
                onChangeText={setImageUrl}
              />

            </View>


            {/* Buttons */}

            <View style={styles.buttonRow}>

              <TouchableOpacity style={styles.createButton}>
                <Text style={styles.createText}>Create</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelButton}>
                <Text>Cancel</Text>
              </TouchableOpacity>

            </View>

          </View>


          {/* Best Practices */}

          <View style={styles.card}>

            <Text style={styles.smallTitle}>Best practices</Text>

            <Text style={styles.bestTitle}>
              For maximum conversion:
            </Text>

            <Text style={styles.bestItem}>
              1. Add price (kills friction)
            </Text>

            <Text style={styles.bestItem}>
              2. Add key details (builds trust)
            </Text>

            <Text style={styles.bestItem}>
              3. Add 3 images (boosts intent)
            </Text>

          </View>


          <Text style={styles.footer}>
            © 2026 Social Commerce SaaS · Business Console
          </Text>

        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  card: {
    backgroundColor: "#f4f4f4",
    borderRadius: 22,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb"
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },

  smallTitle: {
    fontSize: 14,
    color: "#6b7280"
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827"
  },

  description: {
    fontSize: 15,
    color: "#4b5563",
    marginVertical: 12,
  },

  label: {
    fontSize: 14,
    color: "#4b5563",
    marginTop: 14,
    marginBottom: 6
  },

  input: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    fontSize: 16
  },

  dropdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e5e7eb"
  },

  textarea: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    height: 120,
    textAlignVertical: "top"
  },

  helperText: {
    fontSize: 13,
    color: "#6b7280",
    marginVertical: 6
  },

  imageCard: {
    marginTop: 20,
    backgroundColor: "#f8f8f8",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb"
  },

  imageTitle: {
    fontSize: 16,
    fontWeight: "600"
  },

  addButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20
  },

  buttonRow: {
    flexDirection: "row",
    marginTop: 20,
    gap: 12
  },

  createButton: {
    backgroundColor: "#f59e0b",
    paddingVertical: 14,
    paddingHorizontal: 26,
    borderRadius: 30
  },

  createText: {
    fontWeight: "600",
    fontSize: 16
  },

  cancelButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30
  },

  bestTitle: {
    marginTop: 10,
    marginBottom: 10,
    fontWeight: "600"
  },

  bestItem: {
    color: "#6b7280",
    marginBottom: 6
  },

  footer: {
    textAlign: "center",
    color: "#9ca3af",
    marginBottom: 40
  },

  qrButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6
  },

  customHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0"
  },

  backButton: {
    padding: 5
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333"
  },

  headerSpacer: {
    width: 34
  },

  qrText: {
    marginLeft: 6
  }

});