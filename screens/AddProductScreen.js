import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Linking
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { inventory } from "../services/api";
import { Ionicons } from "@expo/vector-icons";

const COLORS = {
  bg: "#f9fafb",
  card: "#ffffff",
  border: "#e5e7eb",
  textPrimary: "#111827",
  textSecondary: "#4b5563",
  textMuted: "#6b7280",
};

const BestPractices = ()=>{
  return (
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
  )
}
const PreviewCard = ({ imageUrl }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.smallTitle}>Preview</Text>

      <View style={styles.previewWrapper}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.previewImage}
        />
      </View>
    </View>
  );
};

const PostMetricsCard = ({ shares = 0, images = 0, onOpenLink }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.smallTitle}>Post metrics</Text>

      {/* METRICS ROW */}
      <View style={styles.metricsRow}>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>Shares</Text>
          <Text style={styles.metricValue}>{shares}</Text>
        </View>

        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>Images</Text>
          <Text style={styles.metricValue}>{images}</Text>
        </View>
      </View>

      {/* ACTION */}
      <TouchableOpacity style={styles.secondaryButton} onPress={onOpenLink}>
        <Text style={styles.secondaryButtonText}>
          Open social link
        </Text>
        <Feather name="arrow-right" size={16} />
      </TouchableOpacity>

    </View>
  );
};

export default function AddPostScreen({ route }) {
  const navigation = useNavigation();
  const { post } = route.params || {};
  const isEditMode = !!post;
  const [url, setUrl] = useState(post?.social_url || "");
  const [title, setTitle] = useState(post?.title || "");
  const [material, setMaterial] = useState(post?.material || "");
  const [price, setPrice] = useState(post?.price?.toString() || "");
  const [delivery, setDelivery] = useState(post?.attributes?.delivery_fee_amount?.toString() || "");
  const [color, setColor] = useState(post?.attributes?.color || "");
  const [size, setSize] = useState(post?.attributes?.size || "");
  const [caption, setCaption] = useState(post?.caption || "");
  const [imageUrl, setImageUrl] = useState("");
  const [imageUrls, setImageUrls] = useState(post?.images?.length > 0 ? post.images.map(img => img.url) : [""]);
  const [selectedPlatform, setSelectedPlatform] = useState(post?.social_platform || "instagram");
  const [showPlatformDropdown, setShowPlatformDropdown] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("fashion");
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreatePost = async () => {
    // Validation
    if (!url.trim()) {
      Alert.alert('Error', 'Please enter a social post URL');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    if (!price.trim()) {
      Alert.alert('Error', 'Please enter a price');
      return;
    }

    try {
      setLoading(true);
      
      // Filter out empty image URLs and create images array
      const validImageUrls = imageUrls.filter(url => url.trim() !== "");
      const images = validImageUrls.map((url, index) => ({
        url: url.trim(),
        sort_order: index + 1
      }));
      
      const postData = {
        title: title,
        price: parseFloat(price),
        attributes: {
          color: color || "",
          size: size || "",
          delivery_fee_amount: delivery ? parseFloat(delivery) : 0
        },
        images: images,
        caption: caption || "",
        material: material || "",
      };

      let response;
      if (isEditMode) {
        response = await inventory.updatePost(post.id, postData);
      } else {
        postData.social_platform = selectedPlatform;
        postData.social_url = url;

        response = await inventory.createPost(postData);
      }
      
      Alert.alert(
        'Success',
        isEditMode ? 'Post updated successfully!' : 'Post created successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
      
      // Reset form only if not in edit mode
      if (!isEditMode) {
        setUrl("");
        setTitle("");
        setMaterial("");
        setPrice("");
        setDelivery("");
        setColor("");
        setSize("");
        setCaption("");
        setImageUrls([""]);
      }
      
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', `Failed to ${isEditMode ? 'update' : 'create'} post. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async () => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await inventory.deletePost(post.id);
              Alert.alert(
                'Success',
                'Post deleted successfully!',
                [
                  {
                    text: 'OK',
                    onPress: () => navigation.goBack()
                  }
                ]
              );
            } catch (error) {
              console.error('Error deleting post:', error);
              Alert.alert('Error', 'Failed to delete post. Please try again.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const addImageUrl = () => {
    setImageUrls([...imageUrls, ""]);
  };

  const removeImageUrl = (index) => {
    const newImageUrls = imageUrls.filter((_, i) => i !== index);
    setImageUrls(newImageUrls.length > 0 ? newImageUrls : [""]);
  };

  const updateImageUrl = (index, value) => {
    const newImageUrls = [...imageUrls];
    newImageUrls[index] = value;
    setImageUrls(newImageUrls);
  };

  const platforms = [
    { value: "instagram", label: "Instagram" },
    { value: "pinterest", label: "Pinterest" },
    { value: "facebook", label: "Facebook" },

  ];

  const templates = [
    { value: "fashion", label: "Fashion" },
    { value: "grocery", label: "Grocery" },
    { value: "electronics", label: "Electronics" }
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.customHeader}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditMode ? 'Edit post' : 'Create post'}</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <View style={{ padding: 20 }}>
          {/* Create Post */}

          <View style={styles.card}>

            <View style={styles.rowBetween}>
              <View>
                <Text style={styles.smallTitle}>Visual Inventory</Text>
                <Text style={styles.title}>{isEditMode ? 'Edit post' : 'Create post'}</Text>
              </View>
              <View style={styles.rowActions}>
                {/* <Feather name="plus" size={22} /> */}
                {isEditMode && (
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={handleDeletePost}
                    disabled={loading}
                  >
                    <Feather name="trash-2" size={16} color="#dc2626" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <Text style={styles.description}>
              {isEditMode ? post.social_url : 'Paste your social link, then add structured details like price and material.'}
            </Text>
            {
              !isEditMode &&
              <>
                <Text style={styles.label}>Platform</Text>
                <View style={styles.dropdownContainer}>
                  <TouchableOpacity 
                    style={styles.dropdown}
                    onPress={() => setShowPlatformDropdown(!showPlatformDropdown)}
                  >
                    <Text>
                      {platforms.find(p => p.value === selectedPlatform)?.label || "Instagram"}
                    </Text>
                    <Feather name="chevron-down" size={18} />
                  </TouchableOpacity>
                  {showPlatformDropdown && (
                    <View style={styles.dropdownList}>
                      {platforms.map((platform) => (
                        <TouchableOpacity
                          key={platform.value}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setSelectedPlatform(platform.value);
                            setShowPlatformDropdown(false);
                          }}
                        >
                          <Text style={styles.dropdownItemText}>{platform.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </>
            }
            {
              !isEditMode &&
              <>
                <Text style={styles.label}>Template</Text>

                <View style={styles.dropdownContainer}>
                  <TouchableOpacity 
                    style={styles.dropdown}
                    onPress={() => setShowTemplateDropdown(!showTemplateDropdown)}
                  >
                    <Text>
                      {templates.find(t => t.value === selectedTemplate)?.label || "Fashion"}
                    </Text>
                    <Feather name="chevron-down" size={18} />
                  </TouchableOpacity>

                  {showTemplateDropdown && (
                    <View style={styles.dropdownList}>
                      {templates.map((template) => (
                        <TouchableOpacity
                          key={template.value}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setSelectedTemplate(template.value);
                            setShowTemplateDropdown(false);
                          }}
                        >
                          <Text style={styles.dropdownItemText}>{template.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </>  
            }
            {
              !isEditMode &&
              <>  
                <Text style={styles.label}>Social post / reel URL</Text>

                <TextInput
                  style={styles.input}
                  placeholder="https://www.instagram.com/reel/..."
                  value={url}
                  onChangeText={setUrl}
                />
              </>
            }


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

                <TouchableOpacity style={styles.addButton} onPress={addImageUrl}>
                  <Text>Add</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.helperText}>
                Paste image URLs for now. Later we'll add uploads to Google Cloud Storage.
              </Text>

              {imageUrls.map((imageUrl, index) => (
                <View key={index} style={styles.imageInputContainer}>
                  <TextInput
                    style={[styles.input, {width: '80%'}]}
                    placeholder={`https://... image url ${index + 1}`}
                    value={imageUrl}
                    onChangeText={(value) => updateImageUrl(index, value)}
                  />
                  {imageUrls.length > 1 && (
                    <TouchableOpacity 
                      style={styles.removeButton}
                      onPress={() => removeImageUrl(index)}
                    >
                      <Feather name="x" size={16} color="#666" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}

            </View>


            {/* Buttons */}

            <View style={styles.buttonRow}>

              <TouchableOpacity 
                style={styles.createButton}
                onPress={handleCreatePost}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.createText}>{isEditMode ? 'Update' : 'Create'}</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => navigation.goBack()}
                disabled={loading}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>

            </View>

          </View>

          {
            isEditMode && 
            <PostMetricsCard 
              shares={post.share_count} 
              images={post.inventory_image_count} 
              onOpenLink={()=>{
                Linking.openURL(post.social_url).catch(err => {});
              }} 
            />
          }
          {isEditMode && <PreviewCard imageUrl={imageUrls?.[0]} />}
          {!isEditMode && <BestPractices />}      


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
    alignItems: "center",
    marginBottom: 8
  },

  rowActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },

  deleteButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#ddd"
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
    // marginVertical: 12,
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
    fontSize: 16,
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

  dropdownContainer: {
    position: "relative"
  },

  dropdownList: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    marginTop: 4,
    zIndex: 1000,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },

  dropdownItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6"
  },

  dropdownItemText: {
    fontSize: 16,
    color: "#374151"
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

  imageInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8
  },

  removeButton: {
    marginLeft: 10,
    padding: 8,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd"
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
  },
  metricsRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  marginTop: 12,
},

  metricBox: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 10,
  },

  metricLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  metricValue: {
    fontSize: 32,
    fontWeight: "700",
    marginTop: 6,
    color: COLORS.textPrimary,
  },
    secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    marginVertical: 10,
    gap: 6,
  },

  secondaryButtonText: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  previewWrapper: {
    marginTop: 12,
    borderRadius: 20,
    overflow: "hidden",
  },

  previewImage: {
    width: "100%",
    height: 350, // adjust based on your UI
    resizeMode: "cover",
  },
});