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
import CustomLoader from '../components/CustomLoader';
import { API_BASE_URL } from '../services/api';


// import { useTheme } from '../context/ThemeContext';


const ProfileScreen = () => {
  // const navigation = useNavigation();
  const isDark = false; // Forced to light mode
  const toggleTheme = () => { }; // No-op
  // const { isDark, toggleTheme } = useTheme();
  const navigation = useNavigation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [agentStats, setAgentStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Check auth status when screen is focused
  useFocusEffect(
    useCallback(() => {
      checkAuthStatus();
      // loadThemePreference(); // Handled by context now
    }, [])
  );

  // loadThemePreference removed

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      const userData = await AsyncStorage.getItem('userData');

      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        setIsLoggedIn(true);
        setUser(parsedUser);
        if (parsedUser.role === 'agent' || parsedUser.role === 'admin') {
          fetchAgentStats(token);
        }
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

  const fetchAgentStats = async (token) => {
    try {
      setStatsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/referral/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setAgentStats(data.data);
      }
    } catch (error) {
      console.error('[Profile] Fetch agent stats error:', error);
    } finally {
      setStatsLoading(false);
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
              if (global.setAppAuthState) global.setAppAuthState(false);
              navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
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
      className="flex-row items-center py-4 border-b border-gray-50 dark:border-gray-800 active:bg-gray-50 dark:active:bg-gray-900"
    >
      <View className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${isDestructive ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
        <Icon name={icon} size={20} color={isDestructive ? '#ef4444' : isDark ? '#fff' : '#000'} />
      </View>
      <Text className={`flex-1 text-base font-medium ${isDestructive ? 'text-red-500' : 'text-black dark:text-white'}`}>{label}</Text>
      {showArrow && <Icon name="chevron-right" size={20} color={isDark ? '#444' : '#ccc'} />}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <CustomLoader text="Checking profile..." />
    );
  }

  // Not logged in - show login prompt
  if (!isLoggedIn) {
    return (
      <View className="flex-1 bg-white dark:bg-black justify-center items-center px-8">
        <View className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full items-center justify-center mb-6">
          <Icon name="person" size={40} color="#999" />
        </View>
        <Text className="text-2xl font-bold text-black dark:text-white mb-2">Welcome</Text>
        <Text className="text-gray-400 text-center mb-8">
          Sign in to access your profile, orders, and exclusive deals
        </Text>
        <TouchableOpacity
          onPress={handleLogin}
          className="w-full bg-primary py-4 rounded-lg items-center"
        >
          <Text className="text-white font-bold text-base tracking-wide uppercase">SIGN IN</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLogin} className="mt-4">
          <Text className="text-gray-500 text-sm">New here? <Text className="text-black dark:text-white font-bold">Create Account</Text></Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Logged in - show profile
  return (
    <View className="flex-1 bg-white dark:bg-black">
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View className="px-6 pt-16 pb-8 items-center border-b border-gray-100 dark:border-gray-800">
          <View className="relative">
            <View className="w-24 h-24 bg-gray-200 dark:bg-gray-800 rounded-full items-center justify-center overflow-hidden mb-4 border-2 border-white dark:border-gray-900 shadow-lg">
              <Icon name="person" size={40} color="#999" />
            </View>
            <View className="absolute bottom-4 right-0 bg-primary w-8 h-8 rounded-full items-center justify-center border-2 border-white dark:border-black">
              <Icon name="edit" size={14} color="#fff" />
            </View>
          </View>

          <Text className="text-2xl font-bold text-black dark:text-white mb-1">
            {user?.name || 'User'}
          </Text>
          <Text className="text-gray-400 text-sm mb-4">
            {user?.email || 'No email'}
          </Text>

          {user?.role && (
            <View className="bg-black/5 dark:bg-white/10 px-4 py-1.5 rounded-full">
              <Text className="text-[10px] font-bold uppercase tracking-widest text-black/60 dark:text-white/70">
                {user.role === 'user' ? 'Member' : user.role}
              </Text>
            </View>
          )}
        </View>

        {/* Agent Dashboard Section */}
        {(user?.role === 'agent' || user?.role === 'admin') && (
          <View className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">Agent Dashboard</Text>

            {statsLoading ? (
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <View className="flex-row justify-between mb-4">
                <StatBox label="Referral Code" value={agentStats?.agent?.referralCode || '...'} />
                <StatBox label="Referred Users" value={agentStats?.totalReferrals || 0} />
                <StatBox label="Total Clicks" value={agentStats?.totalClicks || 0} />
              </View>
            )}

            <TouchableOpacity
              className="bg-black py-3 rounded-lg flex-row items-center justify-center"
              onPress={() => {
                const code = agentStats?.agent?.referralCode;
                if (code) {
                  Alert.alert('Referral Code', `Share your code: ${code}\nLink: https://hascart.club/join?ref=${code}`);
                }
              }}
            >
              <Icon name="share" size={16} color="#fff" />
              <Text className="text-white font-bold ml-2 text-xs uppercase tracking-widest">Share Referrals</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Menu Sections */}
        <View className="px-6 pt-6">

          <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4 mt-2">Support</Text>
          <MenuItem
            icon="headset-mic"
            label="Concierge Support"
            onPress={() => navigation.navigate('Support')}
          />
          <MenuItem
            icon="info"
            label="About Us"
            onPress={() => navigation.navigate('AboutUs')}
          />
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
