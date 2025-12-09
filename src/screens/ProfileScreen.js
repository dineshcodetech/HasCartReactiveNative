import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from '../components/Icon';
import { styled } from 'nativewind';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const [isDark, setIsDark] = useState(false);

  const StatBox = ({ label, value, icon }) => (
    <View className="items-center justify-center bg-gray-50 p-4 rounded-xl w-[30%] shadow-sm">
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

  return (
    <View className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View className="px-6 pt-16 pb-8 items-center border-b border-gray-100">
          <View className="relative">
            <View className="w-24 h-24 bg-gray-200 rounded-full items-center justify-center overflow-hidden mb-4 border-2 border-white shadow-lg shadow-gray-200">
              <Icon name="person" size={40} color="#999" />
            </View>
            <View className="absolute bottom-4 right-0 bg-black w-8 h-8 rounded-full items-center justify-center border-2 border-white">
              <Icon name="edit" size={14} color="#fff" />
            </View>
          </View>

          <Text className="text-2xl font-bold text-black mb-1">Alex Morgan</Text>
          <Text className="text-gray-400 text-sm mb-4">alex.morgan@example.com</Text>

          <View className="bg-black/5 px-4 py-1.5 rounded-full">
            <Text className="text-[10px] font-bold uppercase tracking-widest text-black/60">Premium Member</Text>
          </View>
        </View>

        {/* Stats Dashboard */}
        <View className="flex-row justify-between px-6 py-8">
          <StatBox label="Orders" value="12" />
          <StatBox label="Wishlist" value="48" />
          <StatBox label="Wallet" value="₹450" />
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
          <MenuItem icon="logout" label="Sign Out" isDestructive={true} />
        </View>
      </ScrollView>
    </View>
  );
};

export default ProfileScreen;

