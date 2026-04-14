import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';

const Header = ({ 
  title, 
  onNotificationPress, 
  onProfilePress, 
  showIcons = true,
  showBackButton = false,
  onBackPress,
  headerType = 'default', // 'default', 'page', 'minimal'
  subtitle,
  rightComponent
}) => {
  const insets = useSafeAreaInsets();
  
  const renderHeaderContent = () => {
    switch (headerType) {
      case 'page':
        return (
          <View style={styles.pageHeaderContent}>
            {showBackButton && (
              <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
                <FontAwesome5 name="arrow-left" size={18} color="#000" />
              </TouchableOpacity>
            )}
            <View style={styles.titleContainer}>
              <Text style={styles.pageTitle}>{title}</Text>
              {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
            {rightComponent || (
              showIcons && (
                <View style={styles.headerIcons}>
                  <TouchableOpacity style={styles.iconButton} onPress={onNotificationPress}>
                    <FontAwesome5 name="bell" size={18} color="#000" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconButton} onPress={onProfilePress}>
                    <FontAwesome5 name="user" size={18} color="#000" />
                  </TouchableOpacity>
                </View>
              )
            )}
          </View>
        );
      
      case 'minimal':
        return (
          <View style={styles.minimalHeaderContent}>
            {showBackButton && (
              <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
                <FontAwesome5 name="arrow-left" size={18} color="#000" />
              </TouchableOpacity>
            )}
            <Text style={styles.minimalTitle}>{title}</Text>
          </View>
        );
      
      default:
        return (
          <View style={styles.defaultHeaderContent}>
            <Text style={styles.logo}>{title || 'Folinko'}</Text>
            {rightComponent || (
              showIcons && (
                <View style={styles.headerIcons}>
                  <TouchableOpacity style={styles.iconButton} onPress={onNotificationPress}>
                    <FontAwesome5 name="bell" size={18} color="#000" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconButton} onPress={onProfilePress}>
                    <FontAwesome5 name="user" size={18} color="#000" />
                  </TouchableOpacity>
                </View>
              )
            )}
          </View>
        );
    }
  };
  
  return (
    <View style={[styles.header, { paddingTop: 10 }]}>
      {renderHeaderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 100,
    // backgroundColor: 'red'
  },
  // Default header styles
  defaultHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  // Page header styles
  pageHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  // Minimal header styles
  minimalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  minimalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginLeft: 15,
    flex: 1,
  },
  // Common styles
  headerIcons: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 15,
    padding: 5,
  },
});

export default Header;
