import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from '../components/Icon';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const [isDark, setIsDark] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check auth status when screen is focused
  useFocusEffect(
    useCallback(() => {
      checkAuthStatus();
    }, [])
  );

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      const userData = await AsyncStorage.getItem('userData');
      console.log(userData, token, "herererer");

      console.log('[Profile] Auth check - Token:', token ? 'Found' : 'Not found');

      if (token && userData) {
        setIsLoggedIn(true);
        setUser(JSON.parse(userData));
      } else {
        setIsLoggedIn(false);
        setUser(null);
      }
    } catch (error) {
      console.error('[Profile] Auth check error:', error);
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('authToken');
              await AsyncStorage.removeItem('userData');
              setIsLoggedIn(false);
              setUser(null);

              // Reset navigation to Login
              if (global.setAppAuthState) {
                global.setAppAuthState(false);
              }
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.error('[Profile] Logout error:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const StatBox = ({ label, value }) => (
    <View className="items-center justify-center bg-gray-50 p-4 rounded-xl w-[30%]">
      <Text className="text-xl font-bold text-black mb-1">{value}</Text>
      <Text className="text-[10px] text-gray-400 uppercase tracking-wider">{label}</Text>
    </View>
  );

  const MenuItem = ({ icon, label, onPress, showArrow = true, isDestructive = false }) => (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center py-4 border-b border-gray-50 active:bg-gray-50"
    >
      <View className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${isDestructive ? 'bg-red-50' : 'bg-gray-100'}`}>
        <Icon name={icon} size={20} color={isDestructive ? '#ef4444' : '#000'} />
      </View>
      <Text className={`flex-1 text-base font-medium ${isDestructive ? 'text-red-500' : 'text-black'}`}>{label}</Text>
      {showArrow && <Icon name="chevron-right" size={20} color="#ccc" />}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  // Not logged in - show login prompt
  if (!isLoggedIn) {
    return (
      <View className="flex-1 bg-white justify-center items-center px-8">
        <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-6">
          <Icon name="person" size={40} color="#999" />
        </View>
        <Text className="text-2xl font-bold text-black mb-2">Welcome</Text>
        <Text className="text-gray-400 text-center mb-8">
          Sign in to access your profile, orders, and exclusive deals
        </Text>
        <TouchableOpacity
          onPress={handleLogin}
          className="w-full bg-black py-4 rounded-lg items-center"
        >
          <Text className="text-white font-bold text-base tracking-wide">SIGN IN</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLogin} className="mt-4">
          <Text className="text-gray-500 text-sm">New here? <Text className="text-black font-bold">Create Account</Text></Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Logged in - show profile
  return (
    <View className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View className="px-6 pt-16 pb-8 items-center border-b border-gray-100">
          <View className="relative">
            <View className="w-24 h-24 bg-gray-200 rounded-full items-center justify-center overflow-hidden mb-4 border-2 border-white shadow-lg">
              <Icon name="person" size={40} color="#999" />
            </View>
            <View className="absolute bottom-4 right-0 bg-black w-8 h-8 rounded-full items-center justify-center border-2 border-white">
              <Icon name="edit" size={14} color="#fff" />
            </View>
          </View>

          <Text className="text-2xl font-bold text-black mb-1">
            {user?.name || 'User'}
          </Text>
          <Text className="text-gray-400 text-sm mb-4">
            {user?.email || 'No email'}
          </Text>

          {user?.role && (
            <View className="bg-black/5 px-4 py-1.5 rounded-full">
              <Text className="text-[10px] font-bold uppercase tracking-widest text-black/60">
                {user.role === 'user' ? 'Member' : user.role}
              </Text>
            </View>
          )}
        </View>

        {/* Stats Dashboard */}
        <View className="flex-row justify-between px-6 py-8">
          <StatBox label="Orders" value="0" />
          <StatBox label="Wishlist" value="0" />
          <StatBox label="Wallet" value="₹0" />
        </View>

        {/* Menu Sections */}
        <View className="px-6">
          <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4 mt-2">Account Settings</Text>
          <MenuItem icon="shopping-bag" label="My Orders" />
          <MenuItem icon="location-on" label="Shipping Addresses" />
          <MenuItem icon="payment" label="Payment Methods" />

          <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4 mt-8">App Preferences</Text>
          <MenuItem icon="notifications" label="Notifications" />
          <View className="flex-row items-center py-4 border-b border-gray-50">
            <View className="w-10 h-10 rounded-full items-center justify-center mr-4 bg-gray-100">
              <Icon name="brightness-6" size={20} color="#000" />
            </View>
            <Text className="flex-1 text-base font-medium text-black">Dark Mode</Text>
            <Switch
              value={isDark}
              onValueChange={setIsDark}
              trackColor={{ false: "#e9e9e9", true: "#000" }}
            />
          </View>

          <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4 mt-8">Support</Text>
          <MenuItem icon="headset-mic" label="Concierge Support" />
          <MenuItem icon="info" label="About Us" />
          <MenuItem
            icon="logout"
            label="Sign Out"
            isDestructive={true}
            onPress={handleLogout}
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default ProfileScreen;
