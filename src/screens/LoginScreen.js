import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { API_BASE_URL } from '../services/api';
import Icon from '../components/Icon';
import { IconNames } from '../config/icons';
import { styled } from 'nativewind';

const LoginScreen = () => {
  const navigation = useNavigation();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    mobile: '',
    confirmPassword: '',
  });

  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(20);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      Alert.alert('Incomplete', 'Please fill in all fields.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Invalid Email', 'Please check your email address.');
      return false;
    }

    if (!isLogin) {
      if (!formData.name) {
        Alert.alert('Incomplete', 'Please tell us your name.');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        Alert.alert('Mismatch', 'Passwords do not match.');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const payload = isLogin
        ? { email: formData.email, password: formData.password }
        : {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          mobile: formData.mobile
        };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log('[Login] Success, storing auth data');
        if (data.token) {
          await AsyncStorage.setItem('authToken', data.token);
          console.log('[Login] Token stored');
        }
        // Backend returns user info in data.data, not data.user
        if (data.data) {
          await AsyncStorage.setItem('userData', JSON.stringify(data.data));
          console.log('[Login] User data stored:', data.data.name);
        }
        if (global.setAppAuthState) global.setAppAuthState(true);
        navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
      } else {
        Alert.alert('Error', data.message || 'Authentication failed.');
      }
    } catch (error) {
      Alert.alert('Connection Error', `Unable to reach server. \n${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        keyboardShouldPersistTaps="handled"
        className="px-8"
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* Minimalist Logo Area */}
          <View className="items-center mb-12">
            <View className="w-16 h-16 bg-black rounded-sm items-center justify-center mb-6">
              <Icon name="shopping-bag" size={28} color="#fff" />
            </View>
            <Text className="text-3xl font-light tracking-[0.2em] text-black">
              HASCART
            </Text>
            <Text className="text-xs text-gray-400 mt-2 tracking-widest uppercase">
              {isLogin ? 'Members Entry' : 'Join the Club'}
            </Text>
          </View>

          {/* Form Fields */}
          <View className="space-y-6">
            {!isLogin && (
              <View>
                <TextInput
                  placeholder="Name"
                  placeholderTextColor="#9ca3af"
                  className="w-full border-b border-gray-200 py-3 text-base text-black font-medium tracking-wide"
                  value={formData.name}
                  onChangeText={value => handleInputChange('name', value)}
                />
              </View>
            )}

            {!isLogin && (
              <View>
                <TextInput
                  placeholder="Mobile Number"
                  placeholderTextColor="#9ca3af"
                  className="w-full border-b border-gray-200 py-3 text-base text-black font-medium tracking-wide"
                  value={formData.mobile}
                  onChangeText={value => handleInputChange('mobile', value)}
                  keyboardType="phone-pad"
                />
              </View>
            )}

            <View>
              <TextInput
                placeholder="EMAIL ADDRESS"
                placeholderTextColor="#9ca3af"
                className="w-full border-b border-gray-200 py-3 text-base text-black font-medium tracking-wide"
                value={formData.email}
                onChangeText={value => handleInputChange('email', value)}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View>
              <TextInput
                placeholder="PASSWORD"
                placeholderTextColor="#9ca3af"
                className="w-full border-b border-gray-200 py-3 text-base text-black font-medium tracking-wide"
                value={formData.password}
                onChangeText={value => handleInputChange('password', value)}
                secureTextEntry
              />
            </View>

            {!isLogin && (
              <View>
                <TextInput
                  placeholder="CONFIRM PASSWORD"
                  placeholderTextColor="#9ca3af"
                  className="w-full border-b border-gray-200 py-3 text-base text-black font-medium tracking-wide"
                  value={formData.confirmPassword}
                  onChangeText={value => handleInputChange('confirmPassword', value)}
                  secureTextEntry
                />
              </View>
            )}

            <TouchableOpacity
              className="w-full bg-black py-5 mt-8 items-center active:bg-gray-800"
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white text-sm font-bold tracking-[0.15em] uppercase">
                  {isLogin ? 'Enter' : 'Create Account'}
                </Text>
              )}
            </TouchableOpacity>

            <View className="flex-row justify-center mt-6">
              <Text className="text-gray-400 text-xs tracking-wide">
                {isLogin ? 'New here?' : 'Member?'}
              </Text>
              <TouchableOpacity onPress={() => setIsLogin(!isLogin)} className="ml-2">
                <Text className="text-black text-xs font-bold tracking-wide border-b border-black">
                  {isLogin ? 'APPLY FOR ACCESS' : 'SIGN IN'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

