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

export default function ProfileScreen() {
  const navigation = useNavigation();

  const [email, setEmail] = useState("smridh@tandev.us");
  const [name, setName] = useState("Arvind Sharma");
  const [phone, setPhone] = useState("9876543210");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const handleSave = () => {
    console.log("Saved profile", { email, name, phone });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.customHeader}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Profile</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView style={styles.container}>
        {/* Profile Card */}

        <View style={styles.card}>

          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.smallTitle}>Account settings</Text>
              <Text style={styles.title}>Profile</Text>
            </View>

            <Feather name="user" size={20} />
          </View>

          <Text style={styles.description}>
            Update your personal details and manage your password.
          </Text>

          {/* Email */}

          <Text style={styles.label}>Email</Text>

          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
          />

          {/* Full Name */}

          <Text style={styles.label}>Full name</Text>

          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
          />

          {/* Phone */}

          <Text style={styles.label}>Phone</Text>

          <TextInput
            style={styles.input}
            value={phone}
            keyboardType="phone-pad"
            onChangeText={setPhone}
          />

          {/* Save Button */}

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveText}>Save profile</Text>
          </TouchableOpacity>

        </View>
        <View style={styles.card}>

          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.smallTitle}>Security</Text>
              <Text style={styles.title}>Change password</Text>
            </View>

            <Feather name="lock" size={20} />
          </View>

          <Text style={styles.description}>
            Use a strong password (8+ characters).
          </Text>

          {/* Current password */}

          <Text style={styles.label}>Current password</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            value={currentPassword}
            onChangeText={setCurrentPassword}
          />

          {/* New password */}

          <Text style={styles.label}>New password</Text>

          <TextInput
            style={styles.input}
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />

          {/* Confirm password */}

          <Text style={styles.label}>Confirm new password</Text>

          <TextInput
            style={styles.input}
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Update password</Text>
          </TouchableOpacity>

        </View>
        <View style={styles.card}>

          <Text style={styles.smallTitle}>Tips</Text>

          <View style={styles.tipRow}>
            <Feather name="shield" size={20} color="#4b5563" />

            <Text style={styles.tipText}>
              Use a unique password you don’t reuse elsewhere.
            </Text>
          </View>

          <View style={styles.tipRow}>
            <Feather name="phone" size={20} color="#4b5563" />

            <Text style={styles.tipText}>
              Keep your phone updated so buyers can reach you.
            </Text>
          </View>

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
    padding: 20
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
    color: "#6b7280",
    marginBottom: 4
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827"
  },

  description: {
    fontSize: 15,
    color: "#4b5563",
    marginVertical: 14
  },

  label: {
    fontSize: 14,
    color: "#4b5563",
    marginTop: 10,
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

  qrButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6
  },

  qrText: {
    marginLeft: 6
  },

  saveButton: {
    marginTop: 20,
    alignSelf: "flex-start",
    backgroundColor: "#f59e0b",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 30
  },

  saveText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827"
  },
  secondaryButton: {
    marginTop: 20,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#d1d5db",
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 30,
    backgroundColor: "#f8f8f8"
  },

  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827"
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginTop: 14
  },

  tipText: {
    flex: 1,
    fontSize: 16,
    color: "#374151",
    lineHeight: 22
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
  }
});