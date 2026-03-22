import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome5 } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { addresses, cart, orders, paymentMethods } from "../services/api";

const FALLBACK_CART_IMAGE =
  "https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=900&q=80";

const isFailedResponse = (response) => {
  return response === undefined || response?.error || response?.errors || response?.success === false;
};

const getAddressItems = (response) => {
  if (Array.isArray(response?.addresses)) return response.addresses;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.saved_addresses)) return response.saved_addresses;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

const getPaymentMethodItems = (response) => {
  if (Array.isArray(response?.payment_methods)) return response.payment_methods;
  if (Array.isArray(response?.methods)) return response.methods;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

const formatMoney = (amount) => {
  if (amount === null || amount === undefined) return "₹ 0";
  return `₹ ${amount}`;
};

const getAddressLabel = (address) => {
  return address?.label || address?.type || address?.tag || "Address";
};

const getAddressName = (address) => {
  return address?.name || address?.full_name || address?.recipient_name || address?.contact_name || "Choose address";
};

const getAddressPhone = (address) => {
  return address?.phone || address?.phone_number || address?.mobile || address?.contact_number || "";
};

const getAddressLines = (address) => {
  const lineOne =
    address?.line1 ||
    address?.address_line1 ||
    address?.street ||
    address?.street_address ||
    address?.address1 ||
    "";
  const lineTwo =
    address?.line2 ||
    address?.address_line2 ||
    address?.locality ||
    address?.landmark ||
    address?.address2 ||
    "";
  const lineThree = [address?.city, address?.state, address?.postal_code || address?.pincode || address?.zip]
    .filter(Boolean)
    .join(" ");

  return [lineOne, lineTwo, lineThree].filter(Boolean);
};

const getPaymentTitle = (paymentMethod) => {
  if (paymentMethod?.upi_id) return `UPI · ${paymentMethod.upi_id}`;

  const brand = paymentMethod?.brand || paymentMethod?.card_brand || paymentMethod?.provider || "Card";
  const holder =
    paymentMethod?.name || paymentMethod?.card_holder_name || paymentMethod?.holder_name || paymentMethod?.nickname || "Saved method";
  return `${brand} · ${holder}`;
};

const getPaymentSubtitle = (paymentMethod) => {
  if (paymentMethod?.upi_id) return paymentMethod?.name || paymentMethod?.provider || "UPI";

  const last4 = paymentMethod?.last4 || paymentMethod?.last_4 || paymentMethod?.card_last4 || paymentMethod?.masked_number;
  const expiry = [paymentMethod?.exp_month, paymentMethod?.exp_year].filter(Boolean).join("/");

  if (last4 && expiry) return `Visa ending ${last4} · exp ${expiry}`;
  if (last4) return `Ending ${last4}`;
  if (expiry) return `Exp ${expiry}`;
  return paymentMethod?.type || paymentMethod?.method_type || "Saved payment method";
};

const getDigits = (value = "") => String(value).replace(/\D/g, "");

const inferCardBrand = (cardNumber) => {
  const digits = getDigits(cardNumber);

  if (/^4/.test(digits)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "Mastercard";
  if (/^3[47]/.test(digits)) return "Amex";
  if (/^6(?:011|5)/.test(digits)) return "Discover";

  return "Card";
};

const normalizeExpiryYear = (value = "") => {
  const digits = getDigits(value);

  if (digits.length === 2) return `20${digits}`;

  return digits.slice(0, 4);
};

const getCreatedPaymentMethodId = (response) => {
  return (
    response?.payment_method?.id ||
    response?.method?.id ||
    response?.data?.id ||
    response?.id ||
    ""
  );
};

export default function CheckoutScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [savingCard, setSavingCard] = useState(false);
  const [savingUpi, setSavingUpi] = useState(false);
  const [error, setError] = useState("");
  const [cartItems, setCartItems] = useState([]);
  const [subtotalAmount, setSubtotalAmount] = useState(0);
  const [addressItems, setAddressItems] = useState([]);
  const [paymentMethodItems, setPaymentMethodItems] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState("");
  const [showAddCardForm, setShowAddCardForm] = useState(false);
  const [showAddUpiForm, setShowAddUpiForm] = useState(false);
  const [cardFormError, setCardFormError] = useState("");
  const [cardFormSuccess, setCardFormSuccess] = useState("");
  const [upiFormError, setUpiFormError] = useState("");
  const [upiFormSuccess, setUpiFormSuccess] = useState("");
  const [cardForm, setCardForm] = useState({
    holderName: "",
    cardNumber: "",
    expMonth: "",
    expYear: "",
  });
  const [upiForm, setUpiForm] = useState({
    label: "",
    upiId: "",
  });

  const fetchCheckoutData = useCallback(async ({ isRefresh, preferredPaymentMethodId } = {}) => {
    if (!isRefresh) {
      setLoading(true);
    }

    setError("");

    const [cartResult, addressResult, paymentResult] = await Promise.allSettled([
      cart.get(),
      addresses.list(),
      paymentMethods.list(),
    ]);

    try {
      if (cartResult.status !== "fulfilled" || isFailedResponse(cartResult.value)) {
        throw new Error(cartResult.status === "fulfilled" ? cartResult.value?.message || "Failed to load checkout" : "Failed to load checkout");
      }

      const cartResponse = cartResult.value;
      const nextCartItems = Array.isArray(cartResponse?.items) ? cartResponse.items : [];
      const nextSubtotal = Number(cartResponse?.subtotal_amount || 0);
      const nextAddresses =
        addressResult.status === "fulfilled" && !isFailedResponse(addressResult.value)
          ? getAddressItems(addressResult.value)
          : [];
      const nextPaymentMethods =
        paymentResult.status === "fulfilled" && !isFailedResponse(paymentResult.value)
          ? getPaymentMethodItems(paymentResult.value)
          : [];

      setCartItems(nextCartItems);
      setSubtotalAmount(nextSubtotal);
      setAddressItems(nextAddresses);
      setPaymentMethodItems(nextPaymentMethods);
      setSelectedAddressId((current) => {
        if (current && nextAddresses.some((item) => String(item?.id) === String(current))) {
          return current;
        }
        return String(nextAddresses[0]?.id || "");
      });
      setSelectedPaymentMethodId((current) => {
        if (
          preferredPaymentMethodId &&
          nextPaymentMethods.some((item) => String(item?.id) === String(preferredPaymentMethodId))
        ) {
          return String(preferredPaymentMethodId);
        }

        if (current && nextPaymentMethods.some((item) => String(item?.id) === String(current))) {
          return current;
        }
        return String(nextPaymentMethods[0]?.id || "");
      });
    } catch (e) {
      setCartItems([]);
      setSubtotalAmount(0);
      setAddressItems([]);
      setPaymentMethodItems([]);
      setSelectedAddressId("");
      setSelectedPaymentMethodId("");
      setError(e?.message || "Failed to load checkout");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCheckoutData();
  }, [fetchCheckoutData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCheckoutData({ isRefresh: true });
  }, [fetchCheckoutData]);

  const handleCardFieldChange = (field, value) => {
    let nextValue = value;

    if (field === "cardNumber") {
      nextValue = getDigits(value).slice(0, 19);
    }

    if (field === "expMonth") {
      nextValue = getDigits(value).slice(0, 2);
    }

    if (field === "expYear") {
      nextValue = getDigits(value).slice(0, 4);
    }

    setCardForm((current) => ({
      ...current,
      [field]: nextValue,
    }));

    if (cardFormError) {
      setCardFormError("");
    }

    if (cardFormSuccess) {
      setCardFormSuccess("");
    }
  };

  const handleToggleAddCardForm = () => {
    setShowAddCardForm((current) => !current);
    setCardFormError("");
    setCardFormSuccess("");
  };

  const handleUpiFieldChange = (field, value) => {
    const nextValue = field === "upiId" ? value.replace(/\s/g, "").toLowerCase() : value;

    setUpiForm((current) => ({
      ...current,
      [field]: nextValue,
    }));

    if (upiFormError) {
      setUpiFormError("");
    }

    if (upiFormSuccess) {
      setUpiFormSuccess("");
    }
  };

  const handleToggleAddUpiForm = () => {
    setShowAddUpiForm((current) => !current);
    setUpiFormError("");
    setUpiFormSuccess("");
  };

  const handleBackToCart = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate("Main", { screen: "cart" });
  };

  const deliveryAmount = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      return sum + Number(item?.post?.delivery_fee_amount || item?.delivery_fee_amount || 0);
    }, 0);
  }, [cartItems]);

  const totalAmount = useMemo(() => {
    return Number(subtotalAmount || 0) + Number(deliveryAmount || 0);
  }, [subtotalAmount, deliveryAmount]);

  const handleAddCard = async () => {
    const holderName = cardForm.holderName.trim();
    const cardNumber = getDigits(cardForm.cardNumber);
    const expMonth = getDigits(cardForm.expMonth);
    const expYear = normalizeExpiryYear(cardForm.expYear);
    const monthNumber = Number(expMonth);

    if (!holderName) {
      setCardFormError("Enter the name on the card.");
      return;
    }

    if (cardNumber.length < 12) {
      setCardFormError("Enter a valid card number.");
      return;
    }

    if (!monthNumber || monthNumber < 1 || monthNumber > 12) {
      setCardFormError("Enter a valid expiry month.");
      return;
    }

    if (expYear.length !== 4) {
      setCardFormError("Enter a valid expiry year.");
      return;
    }

    try {
      setSavingCard(true);
      setCardFormError("");
      setCardFormSuccess("");

      const brand = inferCardBrand(cardNumber);
      const response = await paymentMethods.create({
        type: "card",
        name: holderName,
        holder_name: holderName,
        card_holder_name: holderName,
        brand,
        card_brand: brand,
        card_number: cardNumber,
        last4: cardNumber.slice(-4),
        exp_month: String(monthNumber).padStart(2, "0"),
        exp_year: expYear,
      });

      if (isFailedResponse(response)) {
        throw new Error(response?.message || "Failed to add card");
      }

      const createdPaymentMethodId = getCreatedPaymentMethodId(response);

      await fetchCheckoutData({
        isRefresh: true,
        preferredPaymentMethodId: createdPaymentMethodId,
      });

      setCardForm({
        holderName: "",
        cardNumber: "",
        expMonth: "",
        expYear: "",
      });
      setShowAddCardForm(false);
      setCardFormSuccess("Card added successfully.");
    } catch (e) {
      setCardFormError(e?.message || "Failed to add card");
    } finally {
      setSavingCard(false);
    }
  };

  const handleAddUpi = async () => {
    const label = upiForm.label.trim();
    const upiId = upiForm.upiId.trim().toLowerCase();

    if (!label) {
      setUpiFormError("Enter a label for this UPI account.");
      return;
    }

    if (!upiId || !upiId.includes("@")) {
      setUpiFormError("Enter a valid UPI ID.");
      return;
    }

    try {
      setSavingUpi(true);
      setUpiFormError("");
      setUpiFormSuccess("");

      const response = await paymentMethods.create({
        type: "upi",
        method_type: "upi",
        name: label,
        label,
        provider: "UPI",
        upi_id: upiId,
      });

      if (isFailedResponse(response)) {
        throw new Error(response?.message || "Failed to add UPI");
      }

      const createdPaymentMethodId = getCreatedPaymentMethodId(response);

      await fetchCheckoutData({
        isRefresh: true,
        preferredPaymentMethodId: createdPaymentMethodId,
      });

      setUpiForm({
        label: "",
        upiId: "",
      });
      setShowAddUpiForm(false);
      setUpiFormSuccess("UPI added successfully.");
    } catch (e) {
      setUpiFormError(e?.message || "Failed to add UPI");
    } finally {
      setSavingUpi(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    if (!selectedAddressId) {
      setError("Select a delivery address to continue.");
      return;
    }

    if (!selectedPaymentMethodId) {
      setError("Select a payment method to continue.");
      return;
    }

    try {
      setPlacingOrder(true);
      setError("");

      const response = await orders.checkout({
        address_id: selectedAddressId,
        payment_method_id: selectedPaymentMethodId,
      });

      if (isFailedResponse(response)) {
        throw new Error(response?.message || "Failed to place order");
      }

      navigation.navigate("orderScreen");
    } catch (e) {
      setError(e?.message || "Failed to place order");
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.shell}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backButton} onPress={handleBackToCart}>
              <FontAwesome5 name="arrow-left" size={12} color="#111827" />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Checkout</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.pageHeader}>
            <View style={styles.pageHeaderContent}>
              <Text style={styles.kicker}>Secure checkout</Text>
              <Text style={styles.pageSubtitle}>
                Review your order, choose a delivery address, and select a payment method.
              </Text>
            </View>

            <TouchableOpacity style={styles.cartShortcut} onPress={() => navigation.navigate("Main", { screen: "cart" })}>
              <FontAwesome5 name="shopping-cart" size={14} color="#344054" />
              <Text style={styles.cartShortcutText}>Cart</Text>
            </TouchableOpacity>
          </View>

          {!!error ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {loading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="small" color="#111827" />
              <Text style={styles.loadingText}>Loading checkout...</Text>
            </View>
          ) : null}

          {!loading ? (
            <>
              <View style={styles.sectionCard}>
                <Text style={styles.sectionKicker}>Delivery address</Text>
                <Text style={styles.sectionTitle}>Choose where to deliver</Text>

                {addressItems.length === 0 ? (
                  <View style={styles.emptyStateBox}>
                    <Text style={styles.emptyStateText}>No saved addresses found.</Text>
                  </View>
                ) : (
                  addressItems.map((address) => {
                    const addressId = String(address?.id || "");
                    const isSelected = selectedAddressId === addressId;
                    const addressLines = getAddressLines(address);

                    return (
                      <TouchableOpacity
                        key={addressId}
                        style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                        onPress={() => setSelectedAddressId(addressId)}
                      >
                        <View style={styles.radioRow}>
                          <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                            {isSelected ? <View style={styles.radioInner} /> : null}
                          </View>

                          <View style={styles.optionContent}>
                            <Text style={styles.optionTitle}>{getAddressName(address)} <Text style={styles.optionMeta}>({getAddressLabel(address)})</Text></Text>
                            {!!getAddressPhone(address) ? <Text style={styles.optionSubtext}>{getAddressPhone(address)}</Text> : null}
                            {addressLines.map((line) => (
                              <Text key={`${addressId}-${line}`} style={styles.optionSubtext}>{line}</Text>
                            ))}
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}

                <TouchableOpacity style={styles.addRowBtn}>
                  <Text style={styles.addRowText}>Add a new address</Text>
                  <FontAwesome5 name="chevron-down" size={12} color="#98A2B3" />
                </TouchableOpacity>
              </View>

              <View style={styles.sectionCard}>
                <Text style={styles.sectionKicker}>Payment method</Text>
                <Text style={styles.sectionTitle}>Choose how you want to pay</Text>

                {paymentMethodItems.length === 0 ? (
                  <View style={styles.emptyStateBox}>
                    <Text style={styles.emptyStateText}>No saved payment methods found.</Text>
                  </View>
                ) : (
                  paymentMethodItems.map((paymentMethod) => {
                    const paymentMethodId = String(paymentMethod?.id || "");
                    const isSelected = selectedPaymentMethodId === paymentMethodId;

                    return (
                      <TouchableOpacity
                        key={paymentMethodId}
                        style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                        onPress={() => setSelectedPaymentMethodId(paymentMethodId)}
                      >
                        <View style={styles.radioRow}>
                          <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                            {isSelected ? <View style={styles.radioInner} /> : null}
                          </View>

                          <View style={styles.optionContent}>
                            <Text style={styles.optionTitle}>{getPaymentTitle(paymentMethod)}</Text>
                            <Text style={styles.optionSubtext}>{getPaymentSubtitle(paymentMethod)}</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}

                <TouchableOpacity style={styles.addRowBtn} onPress={handleToggleAddCardForm}>
                  <Text style={styles.addRowText}>{showAddCardForm ? "Hide card form" : "Add card (secure)"}</Text>
                  <FontAwesome5
                    name={showAddCardForm ? "chevron-up" : "chevron-down"}
                    size={12}
                    color="#98A2B3"
                  />
                </TouchableOpacity>

                {showAddCardForm ? (
                  <View style={styles.formCard}>
                    <TextInput
                      style={styles.formInput}
                      placeholder="Name on card"
                      placeholderTextColor="#98A2B3"
                      value={cardForm.holderName}
                      onChangeText={(value) => handleCardFieldChange("holderName", value)}
                      autoCapitalize="words"
                    />
                    <TextInput
                      style={styles.formInput}
                      placeholder="Card number"
                      placeholderTextColor="#98A2B3"
                      value={cardForm.cardNumber}
                      onChangeText={(value) => handleCardFieldChange("cardNumber", value)}
                      keyboardType="number-pad"
                      maxLength={19}
                    />

                    <View style={styles.expiryRow}>
                      <TextInput
                        style={[styles.formInput, styles.expiryInput]}
                        placeholder="MM"
                        placeholderTextColor="#98A2B3"
                        value={cardForm.expMonth}
                        onChangeText={(value) => handleCardFieldChange("expMonth", value)}
                        keyboardType="number-pad"
                        maxLength={2}
                      />
                      <TextInput
                        style={[styles.formInput, styles.expiryInput]}
                        placeholder="YYYY"
                        placeholderTextColor="#98A2B3"
                        value={cardForm.expYear}
                        onChangeText={(value) => handleCardFieldChange("expYear", value)}
                        keyboardType="number-pad"
                        maxLength={4}
                      />
                    </View>

                    {!!cardFormError ? <Text style={styles.formErrorText}>{cardFormError}</Text> : null}
                    {!!cardFormSuccess ? <Text style={styles.formSuccessText}>{cardFormSuccess}</Text> : null}

                    <TouchableOpacity
                      style={[styles.addCardButton, savingCard && styles.placeOrderBtnDisabled]}
                      onPress={handleAddCard}
                      disabled={savingCard}
                    >
                      <Text style={styles.addCardButtonText}>{savingCard ? "Saving card..." : "Save card"}</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}

                {!showAddCardForm && !!cardFormSuccess ? (
                  <Text style={styles.formSuccessText}>{cardFormSuccess}</Text>
                ) : null}

                <TouchableOpacity style={styles.addRowBtn} onPress={handleToggleAddUpiForm}>
                  <Text style={styles.addRowText}>{showAddUpiForm ? "Hide UPI form" : "Add UPI"}</Text>
                  <FontAwesome5
                    name={showAddUpiForm ? "chevron-up" : "chevron-down"}
                    size={12}
                    color="#98A2B3"
                  />
                </TouchableOpacity>

                {showAddUpiForm ? (
                  <View style={styles.formCard}>
                    <TextInput
                      style={styles.dropdownLikeInput}
                      placeholder="Add UPI"
                      placeholderTextColor="#98A2B3"
                      value="Add UPI"
                      editable={false}
                    />
                    <TextInput
                      style={styles.formInput}
                      placeholder="Label (Personal/Business)"
                      placeholderTextColor="#98A2B3"
                      value={upiForm.label}
                      onChangeText={(value) => handleUpiFieldChange("label", value)}
                    />
                    <TextInput
                      style={styles.formInput}
                      placeholder="UPI ID (name@bank)"
                      placeholderTextColor="#98A2B3"
                      value={upiForm.upiId}
                      onChangeText={(value) => handleUpiFieldChange("upiId", value)}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />

                    {!!upiFormError ? <Text style={styles.formErrorText}>{upiFormError}</Text> : null}
                    {!!upiFormSuccess ? <Text style={styles.formSuccessText}>{upiFormSuccess}</Text> : null}

                    <TouchableOpacity
                      style={[styles.upiButton, savingUpi && styles.placeOrderBtnDisabled]}
                      onPress={handleAddUpi}
                      disabled={savingUpi}
                    >
                      <Text style={styles.upiButtonText}>{savingUpi ? "Saving UPI..." : "Save UPI"}</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}

                {!showAddUpiForm && !!upiFormSuccess ? (
                  <Text style={styles.formSuccessText}>{upiFormSuccess}</Text>
                ) : null}
              </View>

              <View style={styles.sectionCard}>
                <Text style={styles.sectionKicker}>Items</Text>

                {cartItems.length === 0 ? (
                  <View style={styles.emptyStateBox}>
                    <Text style={styles.emptyStateText}>No items in your cart.</Text>
                  </View>
                ) : (
                  cartItems.map((item) => {
                    const post = item?.post || {};
                    const imageUrl = post?.images?.[0]?.url || post?.cover_image_url || FALLBACK_CART_IMAGE;
                    const quantity = Number(item?.quantity || 1);

                    return (
                      <View key={String(item?.id || post?.id)} style={styles.itemCard}>
                        <Image source={{ uri: imageUrl }} style={styles.itemImage} />

                        <View style={styles.itemContent}>
                          <View style={styles.itemTopRow}>
                            <Text style={styles.itemName} numberOfLines={1}>{post?.title || "Item"}</Text>
                            <Text style={styles.itemPrice}>{formatMoney(post?.price)}</Text>
                          </View>

                          <Text style={styles.itemSeller} numberOfLines={1}>{`Sold by ${post?.shop?.name || "Seller"}`}</Text>
                          <Text style={styles.itemQty}>{`Qty ${quantity}`}</Text>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>

              <View style={styles.sectionCard}>
                <Text style={styles.sectionKicker}>Order summary</Text>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Items</Text>
                  <Text style={styles.summaryValue}>{formatMoney(subtotalAmount)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Delivery</Text>
                  <Text style={styles.summaryValue}>{formatMoney(deliveryAmount)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.totalLabel}>Order total</Text>
                  <Text style={styles.totalValue}>{formatMoney(totalAmount)}</Text>
                </View>

                <TouchableOpacity style={[styles.placeOrderBtn, placingOrder && styles.placeOrderBtnDisabled]} onPress={handlePlaceOrder} disabled={placingOrder}>
                  <Text style={styles.placeOrderText}>{placingOrder ? "Placing order..." : "Place order"}</Text>
                </TouchableOpacity>

                <Text style={styles.policyText}>By placing your order you agree to our policies (MWP).</Text>
              </View>

              <View style={styles.sectionCard}>
                <Text style={styles.sectionKicker}>Need to change items?</Text>
                <TouchableOpacity style={styles.editCartBtn} onPress={() => navigation.navigate("Main", { screen: "cart" })}>
                  <Text style={styles.editCartText}>Edit cart</Text>
                  <FontAwesome5 name="arrow-right" size={12} color="#344054" />
                </TouchableOpacity>
              </View>
            </>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7F0E6",
  },
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 10,
  },
  brandWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 8,
    backgroundColor: "#F59E0B",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  brandTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#111827",
  },
  brandSubtitle: {
    fontSize: 10,
    color: "#6B7280",
    marginTop: 1,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E4E7EC",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  logoutText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: "500",
    color: "#344054",
  },
  shell: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 8,
    marginBottom: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E6E0D6",
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 6,
  },
  backText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#111827",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  headerSpacer: {
    width: 74,
  },
  pageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  pageHeaderContent: {
    flex: 1,
    paddingRight: 12,
  },
  kicker: {
    fontSize: 10,
    color: "#6B7280",
    marginBottom: 4,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#101828",
  },
  pageSubtitle: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    color: "#667085",
  },
  cartShortcut: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E7EC",
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  cartShortcutText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: "500",
    color: "#344054",
  },
  errorCard: {
    borderRadius: 16,
    backgroundColor: "#FEF3F2",
    borderWidth: 1,
    borderColor: "#FECDCA",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  errorText: {
    color: "#B42318",
    fontSize: 12,
    lineHeight: 18,
  },
  loadingCard: {
    backgroundColor: "#FFFDF9",
    borderWidth: 1,
    borderColor: "#EFE4D3",
    borderRadius: 18,
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: "#475467",
  },
  sectionCard: {
    backgroundColor: "#FFFDF9",
    borderWidth: 1,
    borderColor: "#EFE4D3",
    borderRadius: 18,
    padding: 12,
    marginTop: 12,
  },
  sectionKicker: {
    fontSize: 10,
    color: "#6B7280",
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#101828",
    marginBottom: 10,
  },
  emptyStateBox: {
    borderWidth: 1,
    borderColor: "#EAECF0",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  emptyStateText: {
    fontSize: 12,
    color: "#667085",
  },
  optionCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EAECF0",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 8,
  },
  optionCardSelected: {
    borderColor: "#D0D5DD",
  },
  radioRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  radioOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#98A2B3",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  radioOuterSelected: {
    borderColor: "#2563EB",
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2563EB",
  },
  optionContent: {
    flex: 1,
    marginLeft: 10,
  },
  optionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#101828",
    lineHeight: 18,
  },
  optionMeta: {
    fontSize: 10,
    color: "#667085",
    fontWeight: "400",
  },
  optionSubtext: {
    fontSize: 10,
    color: "#667085",
    marginTop: 2,
    lineHeight: 15,
  },
  addRowBtn: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EAECF0",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  addRowText: {
    fontSize: 12,
    color: "#667085",
  },
  formCard: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#EAECF0",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    padding: 12,
  },
  formInput: {
    borderWidth: 1,
    borderColor: "#EAECF0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 12,
    color: "#101828",
    marginTop: 8,
  },
  dropdownLikeInput: {
    borderWidth: 1,
    borderColor: "#EAECF0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 12,
    color: "#344054",
    backgroundColor: "#FFFFFF",
  },
  expiryRow: {
    flexDirection: "row",
    gap: 10,
  },
  expiryInput: {
    flex: 1,
  },
  formErrorText: {
    marginTop: 8,
    fontSize: 11,
    color: "#B42318",
  },
  formSuccessText: {
    marginTop: 8,
    fontSize: 11,
    color: "#166534",
  },
  addCardButton: {
    marginTop: 12,
    backgroundColor: "#111827",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  addCardButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  upiButton: {
    marginTop: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#D0D5DD",
  },
  upiButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EAECF0",
    borderRadius: 16,
    padding: 10,
    marginTop: 8,
  },
  itemImage: {
    width: 42,
    height: 54,
    borderRadius: 10,
  },
  itemContent: {
    flex: 1,
    marginLeft: 10,
  },
  itemTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemName: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: "#101828",
    marginRight: 8,
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: "700",
    color: "#101828",
  },
  itemSeller: {
    marginTop: 4,
    fontSize: 10,
    color: "#667085",
  },
  itemQty: {
    marginTop: 2,
    fontSize: 10,
    color: "#475467",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#475467",
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#101828",
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#101828",
    marginTop: 2,
  },
  totalValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#101828",
    marginTop: 2,
  },
  placeOrderBtn: {
    backgroundColor: "#F5A623",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginTop: 14,
  },
  placeOrderBtnDisabled: {
    opacity: 0.7,
  },
  placeOrderText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
  },
  policyText: {
    marginTop: 10,
    fontSize: 10,
    color: "#98A2B3",
    lineHeight: 15,
  },
  editCartBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#D0D5DD",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    minWidth: 96,
  },
  editCartText: {
    fontSize: 12,
    color: "#344054",
    fontWeight: "500",
    marginRight: 8,
  },
});
