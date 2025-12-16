import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Linking, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from '../components/Icon';
import { useTheme } from '../context/ThemeContext';

const AboutUsScreen = () => {
    const navigation = useNavigation();
    const { isDark } = useTheme();

    const openLink = (url) => {
        Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
    };

    const LinkItem = ({ icon, label, url }) => (
        <TouchableOpacity
            onPress={() => openLink(url)}
            className="flex-row items-center py-4 border-b border-gray-100 dark:border-gray-800"
        >
            <View className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-800 items-center justify-center mr-3">
                <Icon name={icon} size={18} color={isDark ? '#fff' : '#000'} />
            </View>
            <Text className="flex-1 text-base text-gray-700 dark:text-gray-300 font-medium">{label}</Text>
            <Icon name="chevron-right" size={20} color={isDark ? '#444' : '#ccc'} />
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-white dark:bg-black">
            {/* Header */}
            <View className="flex-row items-center px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 mr-2">
                    <Icon name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
                </TouchableOpacity>
                <Text className="text-lg font-bold text-black dark:text-white">About Us</Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: 24 }}>
                <View className="items-center mb-10 mt-4">
                    <View className="w-24 h-24 bg-black dark:bg-white rounded-2xl items-center justify-center mb-4 shadow-lg">
                        <Icon name="shopping-bag" size={48} color={isDark ? '#000' : '#fff'} />
                    </View>
                    <Text className="text-2xl font-bold text-black dark:text-white mb-2">HasCart Premium</Text>
                    <Text className="text-gray-500 dark:text-gray-400 font-medium">Version 1.0.0</Text>
                </View>

                <Text className="text-gray-600 dark:text-gray-300 text-base leading-6 text-center mb-10">
                    HasCart is reimagining the way you shop. We bring you the best products at unbeatable prices, delivered with speed and care. Experience the future of quick commerce today.
                </Text>

                <View className="mb-8">
                    <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Connect With Us</Text>
                    <LinkItem icon="language" label="Website" url="https://hascart.com" />
                    <LinkItem icon="favorite" label="Instagram" url="https://instagram.com" />
                    <LinkItem icon="thumb-up" label="Twitter" url="https://twitter.com" />
                </View>

                <View>
                    <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Legal</Text>
                    <LinkItem icon="lock" label="Privacy Policy" url="https://hascart.com/privacy" />
                    <LinkItem icon="description" label="Terms of Service" url="https://hascart.com/terms" />
                </View>

                <View className="mt-12 items-center">
                    <Text className="text-gray-400 text-sm">© 2025 CodeTech. All rights reserved.</Text>
                </View>
            </ScrollView>
        </View>
    );
};

export default AboutUsScreen;
