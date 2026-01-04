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
  Image,
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
    referralCode: '',
  });
  const [referringAgent, setReferringAgent] = useState(null);
  const [isValidatingReferral, setIsValidatingReferral] = useState(false);

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

  // Real-time Referral Code Validation
  useEffect(() => {
    const validateCode = async () => {
      const codeToValidate = formData.referralCode ? formData.referralCode.trim() : '';
      if (codeToValidate && codeToValidate.length >= 3) {
        setIsValidatingReferral(true);
        try {
          const response = await fetch(`${API_BASE_URL}/api/referral/validate/${codeToValidate}`);
          const data = await response.json();
          if (data.success && data.data.valid) {
            setReferringAgent(data.data.agentName);
          } else {
            setReferringAgent(null);
          }
        } catch (error) {
          console.error('Referral validation error:', error);
          setReferringAgent(null);
        } finally {
          setIsValidatingReferral(false);
        }
      } else {
        setReferringAgent(null);
        setIsValidatingReferral(false);
      }
    };

    if (!isLogin && formData.referralCode) {
      const timeoutId = setTimeout(validateCode, 600);
      return () => clearTimeout(timeoutId);
    } else {
      setReferringAgent(null);
    }
  }, [formData.referralCode, isLogin]);

  const handleInputChange = (field, value) => {
    let finalValue = value;

    // Numeric only for mobile
    if (field === 'mobile') {
      finalValue = value.replace(/[^0-9]/g, '');
    }

    setFormData(prev => ({
      ...prev,
      [field]: finalValue,
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
      if (!formData.name || formData.name.trim().length < 2) {
        Alert.alert('Invalid Name', 'Please enter a valid name (at least 2 characters).');
        return false;
      }
      if (!formData.mobile || formData.mobile.length !== 10) {
        Alert.alert('Invalid Mobile', 'Mobile number must be exactly 10 digits.');
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
          mobile: formData.mobile,
          referralCode: formData.referralCode ? formData.referralCode.trim() : ''
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
            <View className="w-24 h-24 items-center justify-center mb-6">
              <Image
                source={require('../../assets/logo.png')}
                style={{ width: '100%', height: '100%' }}
                resizeMode="contain"
              />
            </View>
            <Text className="text-3xl font-bold tracking-[0.2em] text-primary">
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
                  autoCapitalize="words"
                />
              </View>
            )}

            {!isLogin && (
              <View>
                <TextInput
                  placeholder="Mobile Number (10 Digits)"
                  placeholderTextColor="#9ca3af"
                  className="w-full border-b border-gray-200 py-3 text-base text-black font-medium tracking-wide"
                  value={formData.mobile}
                  onChangeText={value => handleInputChange('mobile', value)}
                  keyboardType="number-pad"
                  maxLength={10}
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
              {isLogin && (
                <TouchableOpacity
                  onPress={() => navigation.navigate('ForgotPassword')}
                  className="mt-2 items-end"
                >
                  <Text className="text-gray-400 text-[10px] tracking-widest font-bold uppercase">Forgot Password?</Text>
                </TouchableOpacity>
              )}
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

            {!isLogin && (
              <View>
                <TextInput
                  placeholder="REFERRAL CODE (OPTIONAL)"
                  placeholderTextColor="#9ca3af"
                  className="w-full border-b border-gray-200 py-3 text-base text-black font-medium tracking-wide"
                  value={formData.referralCode}
                  onChangeText={value => handleInputChange('referralCode', value.toUpperCase())}
                  autoCapitalize="none"
                  autoCorrect={false}
                  spellCheck={false}
                />
                {isValidatingReferral && (
                  <Text className="text-[10px] text-gray-400 mt-1 italic">Validating code...</Text>
                )}
                {referringAgent && (
                  <Text className="text-[10px] text-green-600 mt-1 font-bold">
                    ✓ Referred by {referringAgent}
                  </Text>
                )}
                {!isValidatingReferral && formData.referralCode.length >= 3 && !referringAgent && (
                  <Text className="text-[10px] text-red-400 mt-1">Invalid referral code</Text>
                )}
              </View>
            )}

            <TouchableOpacity
              className="w-full bg-primary py-5 mt-8 items-center active:bg-blue-900 rounded-lg shadow-md"
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
                <Text className="text-secondary text-xs font-bold tracking-wide border-b border-secondary">
                  {isLogin ? 'REGISTER' : 'SIGN IN'}
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

