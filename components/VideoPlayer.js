import React, { useRef, useState } from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import { Video, ResizeMode } from "expo-av";
import { Ionicons } from "@expo/vector-icons";

export default function VideoPlayer({ url, autoPlay = false }) {
  const videoRef = useRef(null);
  const [status, setStatus] = useState();

  const togglePlay = async () => {
    if (status?.isPlaying) {
      await videoRef.current?.pauseAsync();
    } else {
      await videoRef.current?.playAsync();
    }
  };
  return (
    <View style={styles.container}>
      {/* VIDEO */}
      <Video
        ref={videoRef}
        style={styles.video}
        
        source={{
          uri: url
          // uri: "https://business.folinko.com/uploads/feed/ba074101703543099db1d5fb627dfe10.mp4", // sample video
        }}
        shouldPlay={autoPlay}
        useNativeControls={false}
        resizeMode={ResizeMode.COVER}
        isLooping
        onPlaybackStatusUpdate={(status) => setStatus(status)}
      />

      {/* OVERLAY CONTROLS */}
      <TouchableOpacity style={styles.overlay} onPress={togglePlay}>
        <Ionicons
          name={status?.isPlaying ? "pause" : "play"}
          size={40}
          color="#fff"
        />
      </TouchableOpacity>

      {/* BOTTOM INFO */}
      <View style={styles.bottomBar}>
        <Text style={styles.time}>
          {formatTime(status?.positionMillis)} /{" "}
          {formatTime(status?.durationMillis)}
        </Text>
      </View>
    </View>
  );
}

/* ---------- HELPERS ---------- */
const formatTime = (millis) => {
  if (!millis) return "0:00";
  const totalSeconds = Math.floor(millis / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
};

/* ---------- STYLES ---------- */
const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: "hidden",
    marginTop: 12,
  },

  video: {
    width: "100%",
    height: 300,
    backgroundColor: "#000",
  },

  overlay: {
    position: "absolute",
    top: "40%",
    left: "45%",
  },

  bottomBar: {
    position: "absolute",
    bottom: 10,
    left: 10,
  },

  time: {
    color: "#fff",
    fontSize: 12,
  },
});