import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import VideoPlayer from "../components/VideoPlayer";
import { API_BASE, feed } from "../services/api";

/* ===================== TOKENS ===================== */
const COLORS = {
  bg: "#f4efe9",
  white: "#fff",
  textPrimary: "#111827",
  textSecondary: "#4b5563",
  textMuted: "#6b7280",
  border: "#e5e7eb",
  light: "#f3f4f6",
};

const SPACING = {
  sm: 8,
  md: 12,
  lg: 16,
};

/* ===================== BASE ===================== */
const base = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    margin: SPACING.md,
    padding: SPACING.lg,
    borderRadius: 20,
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },

  text: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
});

/* ===================== COMPONENTS ===================== */

const BannerCard = () => (
  <View style={base.card}>
    <Text style={styles.smallLabel}>Business Console</Text>
    <Text style={styles.bannerTitle}>
      Build a verified, video-first storefront
    </Text>

    <TouchableOpacity style={styles.qrBtn}>
      <Ionicons name="qr-code-outline" size={18} />
      <Text>QR</Text>
    </TouchableOpacity>
  </View>
);

const UpdateHeaderCard = () => (
  <View style={base.card}>
    <View style={base.rowBetween}>
      <View>
        <View style={styles.row}>
          <View style={styles.dot} />
          <Text style={styles.smallLabel}>Updates</Text>
        </View>

        <Text style={styles.feedTitle}>Folinko Feed</Text>
        <Text style={styles.desc}>
          Announcements, tutorials, and growth tips from the Folinko team.
        </Text>
      </View>

      {/* <View style={styles.iconCircle}>
        <Ionicons name="wifi-outline" size={18} />
      </View> */}
    </View>
  </View>
);

const FeedPostCard = ({ post }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const hasThumbnail = !!post?.thumbnail_url;
  const hasVideo = !!post?.video_url;

  return (
    <View style={base.card}>
      <Text style={styles.postTitle}>{post?.title || 'Untitled'}</Text>

      <Text style={styles.meta}>
        {new Date(post?.created_at).toLocaleDateString()} • Folinko
      </Text>

      <Text style={styles.desc}>
        {post?.body || 'No content available'}
      </Text>

      {/* IMAGE/VIDEO PREVIEW */}
      {hasVideo ? (
        isPlaying || !hasThumbnail ? (
          <View style={styles.videoWrapper}>
            <View style={styles.videoContainer}>
              <VideoPlayer url={`${API_BASE}${post.video_url}`}  autoPlay={true}/>
              {/* {hasThumbnail && (
                <TouchableOpacity
                  style={styles.videoCloseButton}
                  onPress={() => setIsPlaying(false)}
                >
                  <Ionicons name="close" size={18} color="#111827" />
                </TouchableOpacity>
              )} */}
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.mediaWrapper}
            activeOpacity={0.9}
            onPress={() => setIsPlaying(true)}
          >
            <Image
              source={{ uri: `${API_BASE}${post.thumbnail_url}` }}
              style={styles.thumbnailImage}
              resizeMode="cover"
            />
            <View style={styles.playOverlay}>
              <View style={styles.playIconContainer}>
                <Ionicons name="play" size={20} color="#111827" />
              </View>
            </View>
          </TouchableOpacity>
        )
      ) : (
        hasThumbnail && (
          <View style={styles.mediaWrapper}>
            <Image
              source={{ uri: `${API_BASE}${post.thumbnail_url}` }}
              style={styles.thumbnailImage}
              resizeMode="cover"
            />
          </View>
        )
      )}

      {/* CTA BUTTON */}
      {post?.cta_text && (
        <TouchableOpacity style={styles.ctaButton}>
          <Text style={styles.ctaButtonText}>{post.cta_text}</Text>
        </TouchableOpacity>
      )}

      {/* FOOTER */}
      <View style={[base.rowBetween, { marginTop: 10 }]}>
        <Text style={styles.meta}>Post #{post?.id}</Text>
        <Text style={styles.meta}>
          Updated {new Date(post?.updated_at).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );
};

const HowToCard = () => (
  <View style={base.card}>
    <Text style={styles.smallLabel}>How to use</Text>

    <View style={styles.listItem}>
      <Ionicons name="sparkles-outline" size={18} />
      <Text style={styles.listText}>
        Watch tutorials to improve your storefront conversion.
      </Text>
    </View>

    <View style={styles.listItem}>
      <Ionicons name="videocam-outline" size={18} />
      <Text style={styles.listText}>
        New features will be announced here first.
      </Text>
    </View>

    <View style={styles.listItem}>
      <Ionicons name="shield-checkmark-outline" size={18} />
      <Text style={styles.listText}>
        Verification and best practices are shared regularly.
      </Text>
    </View>
  </View>
);

/* ===================== MAIN SCREEN ===================== */

export default function FeedScreen() {
  const [feedData, setFeedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchFeedData();
  }, []);

  const fetchFeedData = async () => {
    try {
      if (!refreshing) {
        setLoading(true);
      }
      const response = await feed.getFeed();
      setFeedData(response?.posts || []);
    } catch (error) {
      console.error('Error fetching feed data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchFeedData();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}  edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent || "#f59e0b"} />
          <Text style={styles.loadingText}>Loading feed...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* <BannerCard /> */}
        <UpdateHeaderCard />
        
        {/* Render feed posts */}
        {feedData.map((post) => (
          <FeedPostCard key={post.id} post={post} />
        ))}
        
        <HowToCard />

        <Text style={styles.footer}>
          © 2026 Social Commerce SaaS • Business Console
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ===================== STYLES ===================== */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  smallLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
  },

  bannerTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 4,
    color: COLORS.textPrimary,
  },

  qrBtn: {
    position: "absolute",
    right: 16,
    top: 16,
    flexDirection: "row",
    gap: 6,
    backgroundColor: COLORS.light,
    padding: 10,
    borderRadius: 14,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 10,
    backgroundColor: "#fb923c",
  },

  feedTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 6,
    color: COLORS.textPrimary,
  },

  desc: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: 6,
    lineHeight: 22,
  },

  iconCircle: {
    backgroundColor: COLORS.light,
    padding: 12,
    borderRadius: 30,
  },

  postTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },

  meta: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
  },

  videoWrapper: {
    marginTop: 12,
    borderRadius: 20,
    // overflow: "hidden",
  },

  videoContainer: {
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
  },

  videoCloseButton: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },

  video: {
    width: "100%",
    height: 300,
  },

  videoOverlay: {
    position: "absolute",
    bottom: 10,
    left: 10,
  },

  videoText: {
    color: "#fff",
    fontSize: 13,
  },

  listItem: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
    alignItems: "flex-start",
  },

  listText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textSecondary,
  },

  footer: {
    textAlign: "center",
    color: COLORS.textMuted,
    fontSize: 12,
    padding: 20,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.textSecondary,
  },

  mediaWrapper: {
    marginVertical: 12,
    borderRadius: 12,
    overflow: "hidden",
  },

  playOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },

  playIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },

  thumbnailImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
  },

  ctaButton: {
    backgroundColor: COLORS.accent || "#f59e0b",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 12,
  },

  ctaButtonText: {
    color: COLORS.white,
    fontWeight: "600",
    fontSize: 16,
  },
});