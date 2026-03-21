import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { FontAwesome5 } from '@expo/vector-icons';
import Octicons from '@expo/vector-icons/Octicons';

import OrdersScreen from '../screens/OrdersScreen';
import LoginScreen from '../screens/LoginScreen';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import FeedScreen from '../screens/FeedScreen';
import WishListScreen from '../screens/WishListScreen';
import CartScreen from '../screens/CartScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import StoreDetailScreen from '../screens/StoreDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const MainTabs = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          if (route.name === 'Home') {
            iconName = 'home';
            return <FontAwesome5 name={iconName} size={20} color={color} />;
          } else if (route.name === 'Orders') {
            iconName = 'box-open';
            return <FontAwesome5 name={iconName} size={20} color={color} />;
          } else if (route.name === 'Add') {
            iconName = 'plus';
            return <FontAwesome5 name={iconName} size={20} color={color} />;
          } else if (route.name === 'Analytics') {
            iconName = 'graph';
            return <Octicons name={iconName} size={20} color={color} />;
          } else if (route.name === 'Settings') {
            iconName = 'cog';
            return <FontAwesome5 name={iconName} size={20} color={color} />;
          }
          
          return <FontAwesome5 name={iconName} size={20} color={color} />;
        },
        tabBarActiveTintColor: '#000',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: [styles.tabBar, { marginBottom: Math.max(insets.bottom, 5) }],
        tabBarLabelStyle: styles.tabLabel,
        tabBarShowLabel: true,
        headerStyle: styles.header,
        headerTitleStyle: styles.headerTitle,
      })}
    >
      <Tab.Screen 
        name="Feed" 
        component={FeedScreen}
        options={{ 
          headerShown: false,
          tabBarLabel: 'Feed',
          tabBarIcon: ({ focused, color, size }) => (
            <View style={[styles.addButton, focused && styles.addButtonFocused, { marginBottom: 24 }]}>
              <FontAwesome5 name="play" size={20} color={focused ? '#fff' : color} />
            </View>
          )
        }}
      />
      <Tab.Screen 
        name="Wishlist" 
        component={WishListScreen}
        options={{ 
          headerShown: false,
          tabBarLabel: 'Wishlist',
          tabBarIcon: ({ focused, color, size }) => (
            <View style={[styles.addButton, focused && styles.addButtonFocused, { marginBottom: 24 }]}>
              <FontAwesome5 name="heart" size={20} color={focused ? '#fff' : color} />
            </View>
          )
        }}
      />
      <Tab.Screen 
        name="cart" 
        component={CartScreen}
        options={{ 
          headerShown: false,
          tabBarLabel: 'Cart',
          tabBarIcon: ({ focused, color, size }) => (
            <View style={[styles.addButton, focused && styles.addButtonFocused, { marginBottom: 24 }]}>
              <FontAwesome5 name="shopping-bag" size={20} color={focused ? '#fff' : color} />
            </View>
          )
        }}
      />
      <Tab.Screen 
        name="Orders" 
        component={OrdersScreen}
        options={{ 
          headerShown: false,
          tabBarLabel: 'Orders',
          tabBarIcon: ({ focused, color, size }) => (
            <View style={[styles.addButton, focused && styles.addButtonFocused, { marginBottom: 24 }]}>
              <FontAwesome5 name="dollar-sign" size={20} color={focused ? '#fff' : color} />
            </View>
          )
        }}
      />
    </Tab.Navigator>
  );
};


const AppNavigator = () => {
    const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }
  if (!isAuthenticated) {
    return <LoginScreen />;
  }
  return (
    // <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="orderScreen" component={OrdersScreen} />
        {/* <Stack.Screen name="orderDetailsScreen" component={OrderDetailScreen} /> */}

        {/* <Stack.Screen name="shopProfile" component={ShopProfileScreen} />
        <Stack.Screen name="trustMeter" component={TrustMeterScreen} />
        <Stack.Screen name="dashboard" component={DashboardScreen} /> */}
        {/* <Stack.Screen name="payoutHistory" component={PayoutHistoryScreen} /> */}
        <Stack.Screen name="userProfile" component={UserProfileScreen} />
        {/* <Stack.Screen name="addPost" component={AddProductScreen} /> */}
        <Stack.Screen name="feedScreen" component={FeedScreen} />
        <Stack.Screen name="productDetail" component={ProductDetailScreen} />
        <Stack.Screen name="storeDetail" component={StoreDetailScreen} />

        <Stack.Screen name="Login" component={LoginScreen} />

      </Stack.Navigator>
    // </NavigationContainer>
  );
};


// const AppNavigator = () => {
//   const { isAuthenticated, loading } = useAuth();

//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#000" />
//       </View>
//     );
//   }

//   if (!isAuthenticated) {
//     return <LoginScreen />;
//   }

//   return <MainTabs />;
// };

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 0,
  },
  headerTitle: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  tabBar: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    height: 80,
    paddingBottom: 5,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 4,
    marginBottom: 4,
    color: '#000',
  },
  tabIcon: {
    fontSize: 24,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 28,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  addButtonFocused: {
    backgroundColor: '#000',
  },
  addIcon: {
    fontWeight: 'bold',
  },
});

export default AppNavigator;
