
import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  StatusBar,
  SafeAreaView,
  Alert,
} from 'react-native';
import { styled } from 'nativewind';
import Icon from '../components/Icon';

const { width } = Dimensions.get('window');

// Mock Data for "Hyper-Personalization"
const CURRENT_USER = {
  name: 'Alex',
  affinity: 'Tech & Minimalist',
};

const FEATURED_PRODUCT = {
  id: '1',
  name: 'Eames Lounge Chair',
  subtitle: 'Limited Matte Black Edition',
  price: '₹6,495',
  rating: 4.9,
  reviews: 128,
  image: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?q=80&w=2787&auto=format&fit=crop', // High quality furniture placeholder
  verifiedAffiliate: true,
};

const STORIES = [
  { id: '1', title: 'Work From Home', image: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&auto=format&fit=crop' },
  { id: '2', title: 'Minimalist Setups', image: 'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=800&auto=format&fit=crop' },
  { id: '3', title: 'Audio Gear', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop' },
];

const HomeScreen = ({ navigation }) => {
  const scrollY = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse Animation for CTA
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
  }, [pulseAnim]);

  const handleARSimulate = () => {
    Alert.alert('AR Experience', 'Launching Virtual Try-On... (Simulation)');
  };

  const StickyHeader = () => (
    <View className="flex-row justify-between items-center px-6 py-4 bg-white/90 blur-sm absolute top-0 left-0 right-0 z-50 pt-12">
      <TouchableOpacity>
        <Icon name="menu" size={24} color="#000" />
      </TouchableOpacity>
      <Text className="text-xl font-bold tracking-widest text-black">HASCART</Text>
      <TouchableOpacity>
        <Icon name="shopping-bag" size={24} color="#000" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      <StickyHeader />

      <Animated.ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Spacer for Fixed Header */}
        <View className="h-24" />

        {/* Personalized Greeting */}
        <View className="px-6 mb-8 mt-4">
          <Text className="text-gray-400 text-sm uppercase tracking-widest mb-1">
            Curated for {CURRENT_USER.name}
          </Text>
          <Text className="text-4xl font-light text-black">
            Discover <Text className="font-bold">Excellence</Text>
          </Text>
        </View>

        {/* Hero Product Section - The "Showcase" */}
        <View className="px-6 mb-12">
          <View className="w-full aspect-[4/5] bg-gray-50 rounded-3xl overflow-hidden relative shadow-2xl shadow-gray-200">
            <Image
              source={{ uri: FEATURED_PRODUCT.image }}
              className="w-full h-full object-cover"
            />

            {/* Overlay Elements */}
            <View className="absolute top-4 right-4 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full flex-row items-center border border-gray-100">
              <Icon name="star" size={12} color="#000" style={{ marginRight: 4 }} />
              <Text className="text-xs font-bold">{FEATURED_PRODUCT.rating}</Text>
            </View>

            {/* 3D/AR Trigger Button */}
            <TouchableOpacity
              onPress={handleARSimulate}
              className="absolute bottom-6 right-6 w-14 h-14 bg-white rounded-full items-center justify-center shadow-lg border border-gray-100"
            >
              <Icon name="view-in-ar" size={24} color="#000" />
            </TouchableOpacity>

            <View className="absolute bottom-6 left-6">
              <View className="flex-row items-center mb-2">
                {FEATURED_PRODUCT.verifiedAffiliate && (
                  <View className="bg-black px-2 py-0.5 rounded flex-row items-center">
                    <Icon name="check" size={10} color="#fff" style={{ marginRight: 4 }} />
                    <Text className="text-white text-[10px] font-bold uppercase tracking-wider">Verified</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <View className="mt-6 flex-row justify-between items-end">
            <View>
              <Text className="text-2xl font-bold text-black mb-1">{FEATURED_PRODUCT.name}</Text>
              <Text className="text-gray-500 font-light">{FEATURED_PRODUCT.subtitle}</Text>
            </View>
            <Text className="text-2xl font-serif italic text-black">{FEATURED_PRODUCT.price}</Text>
          </View>

          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity className="mt-8 w-full bg-black py-5 rounded-full items-center shadow-lg shadow-gray-300 active:bg-gray-900">
              <Text className="text-white font-bold text-lg tracking-widest uppercase">Purchase Now</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Scrolling Storytelling Section */}
        <View className="mb-12">
          <Text className="px-6 text-xl font-bold mb-6 text-black">Your Design Story</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24 }}
            className="flex-row"
          >
            {STORIES.map((story) => (
              <TouchableOpacity key={story.id} className="mr-5 w-40">
                <View className="h-56 w-full rounded-2xl overflow-hidden bg-gray-100 mb-3 relative">
                  <Image
                    source={{ uri: story.image }}
                    className="w-full h-full object-cover"
                  />
                  <View className="absolute inset-0 bg-black/10" />
                </View>
                <Text className="text-sm font-semibold text-black">{story.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Trust Factors / Social Proof */}
        <View className="px-6 pb-8">
          <View className="flex-row justify-between border-t border-gray-100 pt-8">
            <View className="items-center w-1/3">
              <Icon name="verified-user" size={24} color="#000" style={{ marginBottom: 8 }} />
              <Text className="text-xs text-center text-gray-500">Verified Authentic</Text>
            </View>
            <View className="items-center w-1/3 border-l border-gray-100 border-r">
              <Icon name="local-shipping" size={24} color="#000" style={{ marginBottom: 8 }} />
              <Text className="text-xs text-center text-gray-500">Premium Shipping</Text>
            </View>
            <View className="items-center w-1/3">
              <Icon name="favorite-border" size={24} color="#000" style={{ marginBottom: 8 }} />
              <Text className="text-xs text-center text-gray-500">Concierge Support</Text>
            </View>
          </View>
        </View>

      </Animated.ScrollView>
    </View>
  );
};

export default HomeScreen;

