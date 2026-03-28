import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome5 } from "@expo/vector-icons";
import Header from "../components/Header";
import { orders } from "../services/api";

const FALLBACK_ORDER_IMAGE =
  "https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=900&q=80";

const formatMoney = (amount) => `₹ ${Number(amount || 0)}`;

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toISOString().slice(0, 10);
};

const formatDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const hours24 = date.getHours();
  const hours12 = hours24 % 12 || 12;
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const meridiem = hours24 >= 12 ? "PM" : "AM";
  return `${date.toISOString().slice(0, 10)} ${hours12}:${minutes} ${meridiem}`;
};

const formatStatus = (value) =>
  String(value || "Processing")
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (match) => match.toUpperCase());

const getOrderFromResponse = (response) => response?.order || response?.data?.order || response?.data || response || null;

const getOrderItems = (order) => {
  if (Array.isArray(order?.items)) return order.items;
  if (Array.isArray(order?.order_items)) return order.order_items;
  if (Array.isArray(order?.line_items)) return order.line_items;
  if (Array.isArray(order?.products)) return order.products;
  if (order?.first_item) return [order.first_item];
  return [];
};

const getItemImage = (item) => item?.photo_url || item?.image_url || item?.thumbnail_url || item?.post?.images?.[0]?.url || item?.product?.images?.[0]?.url || FALLBACK_ORDER_IMAGE;
const getItemTitle = (item) => item?.title || item?.name || item?.post?.title || item?.product?.title || "Item";
const getItemSeller = (item) => item?.shop_name || item?.seller_name || item?.shop?.name || item?.post?.shop?.name || item?.product?.shop?.name || "";
const getItemQuantity = (item) => Number(item?.quantity || item?.qty || item?.count || 1);
const getItemAmount = (item) => Number(item?.total_amount || item?.amount || item?.price_amount || item?.price || item?.post?.price || item?.product?.price || 0);
const getItemProductId = (item) => item?.post?.id || item?.product?.id || item?.post_id || item?.product_id || item?.listing_id || "";

const getTrackingNumber = (order) =>
  order?.tracking_number || order?.tracking_id || order?.shipment?.tracking_number || order?.delivery?.tracking_number || "12345";

const getAddress = (order) => order?.address || order?.delivery_address || order?.shipping_address || {};
const getAddressName = (address) => address?.name || address?.full_name || address?.recipient_name || address?.contact_name || "Customer";
const getAddressPhone = (address) => address?.phone || address?.phone_number || address?.mobile || address?.contact_number || "";
const getAddressLines = (address) => [
  address?.line1 || address?.address_line1 || address?.street || address?.street_address || address?.address1,
  address?.line2 || address?.address_line2 || address?.locality || address?.landmark || address?.address2,
  [address?.city, address?.state, address?.postal_code || address?.pincode || address?.zip].filter(Boolean).join(" "),
].filter(Boolean);

const getPaymentMethod = (order) => order?.payment_method || order?.payment || order?.selected_payment_method || {};
const getPaymentTitle = (paymentMethod) => {
  if (paymentMethod?.upi_id) return `UPI · ${paymentMethod.upi_id}`;
  const brand = paymentMethod?.brand || paymentMethod?.card_brand || paymentMethod?.provider || "Card";
  const holder = paymentMethod?.name || paymentMethod?.card_holder_name || paymentMethod?.holder_name || paymentMethod?.nickname || "Saved method";
  return `${brand} · ${holder}`;
};
const getPaymentSubtitle = (paymentMethod) => {
  if (paymentMethod?.upi_id) return paymentMethod?.name || paymentMethod?.provider || "UPI";
  const last4 = paymentMethod?.last4 || paymentMethod?.last_4 || paymentMethod?.card_last4 || paymentMethod?.masked_number;
  return last4 ? `Ending ${last4}` : paymentMethod?.type || paymentMethod?.method_type || "Saved payment method";
};

const getStatusStepIndex = (status) => {
  const value = String(status || "").toUpperCase();
  if (["DELIVERED", "COMPLETED"].includes(value)) return 2;
  if (["SHIPPED", "OUT_FOR_DELIVERY"].includes(value)) return 1;
  if (["PLACED", "CREATED", "CONFIRMED", "PACKED", "PROCESSING"].includes(value)) return 0;
  return -1;
};

export default function OrderDetailScreen({ navigation, route }) {
  const routeOrder = route?.params?.order || null;
  const routeOrderId = route?.params?.orderId || routeOrder?.id || "";
  const [order, setOrder] = useState(routeOrder);
  const [loading, setLoading] = useState(!routeOrder);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrder = async () => {
      if (!routeOrderId) {
        setLoading(false);
        setError("Order not found.");
        return;
      }
      try {
        setLoading(true);
        setError("");
        const response = await orders.getById(routeOrderId);
        const nextOrder = getOrderFromResponse(response);
        if (nextOrder) {
          setOrder(nextOrder);
          return;
        }
        throw new Error("Order not found.");
      } catch (e) {
        if (!routeOrder) {
          setError(e?.message || "Failed to load order details");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [routeOrder, routeOrderId]);

  const orderItems = useMemo(() => getOrderItems(order), [order]);
  const firstItem = orderItems[0] || {};
  const orderStatus = formatStatus(order?.status || order?.order_status || order?.delivery_status);
  const trackingNumber = getTrackingNumber(order);
  const address = getAddress(order);
  const addressLines = getAddressLines(address);
  const paymentMethod = getPaymentMethod(order);
  const currentStepIndex = getStatusStepIndex(order?.status || order?.order_status || order?.delivery_status);
  const deliverySteps = ["Order placed", "Shipped", "Delivered"].map((label, index) => ({ label, done: currentStepIndex >= index }));

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate("orderScreen");
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <FontAwesome5 name="arrow-left" size={12} color="#111827" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order details</Text>
          <View style={styles.headerSpacer} />
        </View>

        {loading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator size="small" color="#111827" />
            <Text style={styles.stateText}>Loading order details...</Text>
          </View>
        ) : null}

        {!loading && !order ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateText}>{error || "Order details unavailable."}</Text>
          </View>
        ) : null}

        {!loading && order ? (
          <>
            <View style={styles.sectionCard}>
              <Text style={styles.kicker}>Order</Text>
              <Text style={styles.orderNumber}>#{order?.id || routeOrderId}</Text>
              <Text style={styles.metaText}>{`${formatDateTime(order?.created_at)} · Qty ${Number(order?.item_count || orderItems.length || 1)}`}</Text>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionLabel}>Tracking</Text>
              <Text style={styles.sectionSubtext}>Shows when a shop marks your order as shipped.</Text>
              <View style={styles.innerCard}>
                <View style={styles.innerRow}>
                  <View style={styles.innerContent}>
                    <Text style={styles.itemTitle}>{getItemTitle(firstItem)}</Text>
                    <View style={styles.trustRow}>
                      <Text style={styles.trustText}>Trust</Text>
                      <View style={styles.progressBar}><View style={styles.progressFill} /></View>
                    </View>
                  </View>
                  <View style={styles.statusPill}><Text style={styles.statusPillText}>{orderStatus}</Text></View>
                </View>
                <Text style={styles.trackingLabel}>Tracking no.</Text>
                <Text style={styles.trackingValue}>{trackingNumber}</Text>
                <TouchableOpacity style={styles.trackButton}><Text style={styles.trackButtonText}>Track shipment</Text></TouchableOpacity>
              </View>
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.rowBetween}>
                <View>
                  <Text style={styles.sectionLabel}>Delivery status</Text>
                  <Text style={styles.sectionSubtext}>Track the latest delivery stage here.</Text>
                </View>
                <View style={styles.statusPill}><Text style={styles.statusPillText}>{orderStatus}</Text></View>
              </View>
              {deliverySteps.map((step) => (
                <View key={step.label} style={styles.stepCard}>
                  <Text style={styles.stepLabel}>{step.label}</Text>
                  <View style={[styles.stepBadge, step.done ? styles.stepBadgeDone : styles.stepBadgePending]}>
                    <Text style={[styles.stepBadgeText, step.done && styles.stepBadgeTextDone]}>{step.done ? "Done" : "Open"}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionLabel}>Items</Text>
              {orderItems.map((item, index) => {
                const productId = getItemProductId(item);
                return (
                  <TouchableOpacity
                    key={String(productId || item?.id || index)}
                    style={styles.itemCard}
                    disabled={!productId}
                    onPress={() => productId && navigation.navigate("productDetail", { productId })}
                  >
                    <Image source={{ uri: getItemImage(item) }} style={styles.itemImage} />
                    <View style={styles.itemInfo}>
                      <View style={styles.rowBetween}>
                        <View style={styles.itemInfoMain}>
                          <Text style={styles.itemTitle} numberOfLines={1}>{getItemTitle(item)}</Text>
                          {!!getItemSeller(item) ? <Text style={styles.itemSeller}>{getItemSeller(item)}</Text> : null}
                        </View>
                      </View>
                      <View style={styles.trustRow}>
                        <Text style={styles.trustText}>Trust</Text>
                        <View style={styles.progressBar}><View style={styles.progressFill} /></View>
                      </View>
                      <Text style={styles.itemMeta}>{`Price ${formatMoney(getItemAmount(item))}`}</Text>
                      <Text style={styles.itemMeta}>{`Quantity ${getItemQuantity(item)}`}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.rowBetween}><Text style={styles.summaryLabel}>Status</Text><View style={styles.statusPill}><Text style={styles.statusPillText}>{orderStatus}</Text></View></View>
              <View style={styles.rowBetween}><Text style={styles.summaryLabel}>Subtotal</Text><Text style={styles.summaryValue}>{formatMoney(order?.subtotal_amount)}</Text></View>
              <View style={styles.rowBetween}><Text style={styles.summaryLabel}>Delivery</Text><Text style={styles.summaryValue}>{formatMoney(order?.delivery_fee_amount)}</Text></View>
              <View style={styles.rowBetween}><Text style={styles.summaryTotalLabel}>Total</Text><Text style={styles.summaryTotalValue}>{formatMoney(order?.total_amount || order?.subtotal_amount)}</Text></View>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionLabel}>Order details</Text>
              <View style={styles.rowBetween}><Text style={styles.summaryLabel}>Order ID</Text><Text style={styles.detailValue}>#{order?.id || routeOrderId}</Text></View>
              <View style={styles.rowBetween}><Text style={styles.summaryLabel}>Placed</Text><Text style={styles.detailValue}>{formatDate(order?.created_at)}</Text></View>
              <View style={styles.rowBetween}><Text style={styles.summaryLabel}>Last updated</Text><Text style={styles.detailValue}>{formatDate(order?.updated_at || order?.created_at)}</Text></View>
              <View style={styles.detailBlock}><Text style={styles.summaryLabel}>Deliver to</Text><Text style={styles.detailValue}>{getAddressName(address)}</Text>{getAddressPhone(address) ? <Text style={styles.detailSubValue}>{getAddressPhone(address)}</Text> : null}{addressLines.map((line) => <Text key={line} style={styles.detailSubValue}>{line}</Text>)}</View>
              <View style={styles.detailBlock}><Text style={styles.summaryLabel}>Payment</Text><Text style={styles.detailValue}>{getPaymentTitle(paymentMethod)}</Text><Text style={styles.detailSubValue}>{getPaymentSubtitle(paymentMethod)}</Text></View>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionLabel}>Next steps</Text>
              <TouchableOpacity style={styles.footerButton} onPress={() => navigation.navigate("Main", { screen: "Feed" })}><Text style={styles.footerButtonText}>Continue shopping</Text></TouchableOpacity>
              <TouchableOpacity style={styles.footerButton} onPress={() => navigation.navigate("userProfile")}><Text style={styles.footerButtonText}>Go to account</Text></TouchableOpacity>
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F6F1E8" },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  backButton: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E5E7EB", gap: 6 },
  backText: { fontSize: 11, fontWeight: "600", color: "#111827" },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  headerSpacer: { width: 72 },
  stateCard: { backgroundColor: "#FFFFFF", borderRadius: 24, padding: 20, alignItems: "center" },
  stateText: { marginTop: 10, color: "#475467", textAlign: "center" },
  sectionCard: { backgroundColor: "#FBF8F3", borderRadius: 24, borderWidth: 1, borderColor: "#E7DDD0", padding: 16, marginBottom: 14 },
  kicker: { fontSize: 12, color: "#667085" },
  orderNumber: { fontSize: 24, fontWeight: "700", color: "#101828", marginTop: 4 },
  metaText: { fontSize: 12, color: "#667085", marginTop: 6 },
  sectionLabel: { fontSize: 13, fontWeight: "600", color: "#344054" },
  sectionSubtext: { fontSize: 11, color: "#667085", marginTop: 4, marginBottom: 12 },
  innerCard: { backgroundColor: "#FFFFFF", borderRadius: 18, borderWidth: 1, borderColor: "#EAE4DA", padding: 14 },
  innerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  innerContent: { flex: 1, marginRight: 12 },
  statusPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: "#ECFDF3", borderWidth: 1, borderColor: "#ABEFC6" },
  statusPillText: { fontSize: 11, fontWeight: "600", color: "#027A48" },
  trackingLabel: { fontSize: 11, color: "#667085", marginTop: 12 },
  trackingValue: { fontSize: 16, fontWeight: "700", color: "#101828", marginTop: 2 },
  trackButton: { marginTop: 12, borderWidth: 1, borderColor: "#D0D5DD", borderRadius: 12, alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "#FFFFFF" },
  trackButtonText: { fontSize: 12, fontWeight: "600", color: "#111827" },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  stepCard: { backgroundColor: "#FFFFFF", borderRadius: 18, borderWidth: 1, borderColor: "#EAE4DA", paddingHorizontal: 14, paddingVertical: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 },
  stepLabel: { fontSize: 13, fontWeight: "600", color: "#101828" },
  stepBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1 },
  stepBadgeDone: { backgroundColor: "#ECFDF3", borderColor: "#ABEFC6" },
  stepBadgePending: { backgroundColor: "#F9FAFB", borderColor: "#D0D5DD" },
  stepBadgeText: { fontSize: 11, fontWeight: "600", color: "#475467" },
  stepBadgeTextDone: { color: "#027A48" },
  itemCard: { flexDirection: "row", backgroundColor: "#FFFFFF", borderRadius: 18, borderWidth: 1, borderColor: "#EAE4DA", padding: 12, marginTop: 10 },
  itemImage: { width: 58, height: 76, borderRadius: 12 },
  itemInfo: { flex: 1, marginLeft: 12 },
  itemInfoMain: { flex: 1, marginRight: 12 },
  itemTitle: { fontSize: 13, fontWeight: "700", color: "#101828" },
  itemSeller: { fontSize: 11, color: "#667085", marginTop: 2 },
  trustRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  trustText: { fontSize: 11, color: "#475467" },
  progressBar: { width: 76, height: 6, borderRadius: 999, backgroundColor: "#E5E7EB", marginLeft: 8, overflow: "hidden" },
  progressFill: { width: "70%", height: "100%", backgroundColor: "#12B76A" },
  itemMeta: { fontSize: 11, color: "#344054", marginTop: 6 },
  summaryLabel: { fontSize: 12, color: "#667085", marginTop: 10 },
  summaryValue: { fontSize: 12, fontWeight: "600", color: "#101828", marginTop: 10 },
  summaryTotalLabel: { fontSize: 13, fontWeight: "700", color: "#101828", marginTop: 12 },
  summaryTotalValue: { fontSize: 14, fontWeight: "700", color: "#101828", marginTop: 12 },
  detailBlock: { marginTop: 12 },
  detailValue: { fontSize: 12, fontWeight: "600", color: "#101828", marginTop: 6 },
  detailSubValue: { fontSize: 11, color: "#667085", marginTop: 2 },
  footerButton: { borderWidth: 1, borderColor: "#D0D5DD", borderRadius: 14, paddingVertical: 12, alignItems: "center", backgroundColor: "#FFFFFF", marginTop: 10 },
  footerButtonText: { fontSize: 12, fontWeight: "600", color: "#111827" },
});
