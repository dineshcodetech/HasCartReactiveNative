import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from '../components/Icon';
// import { useTheme } from '../context/ThemeContext';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

const SupportScreen = () => {
    const navigation = useNavigation();
    // const { isDark } = useTheme();
    const isDark = false;
    const [expandedFaq, setExpandedFaq] = useState(null);

    const toggleFaq = (index) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedFaq(expandedFaq === index ? null : index);
    };

    const handleEmail = () => {
        Linking.openURL('mailto:support@hascart.com?subject=HasCart Support');
    };

    const handleCall = () => {
        Linking.openURL('tel:+919966141950');
    };

    const ContactOption = ({ icon, label, value, onPress, isPrimary = false }) => (
        <TouchableOpacity
            onPress={onPress}
            className={`flex-1 p-4 rounded-xl border ${isPrimary ? 'bg-primary border-primary dark:bg-white dark:border-white' : 'bg-white border-gray-100 dark:bg-gray-900 dark:border-gray-800'} items-center mr-3 last:mr-0`}
        >
            <Icon name={icon} size={24} color={isPrimary ? (isDark ? '#000' : '#fff') : (isDark ? '#fff' : '#000')} />
            <Text className={`mt-3 font-bold ${isPrimary ? 'text-white dark:text-black' : 'text-black dark:text-white'}`}>{label}</Text>
            <Text className={`text-xs mt-1 ${isPrimary ? 'text-gray-300 dark:text-gray-600' : 'text-gray-500'}`}>{value}</Text>
        </TouchableOpacity>
    );

    const FAQItem = ({ index, question, answer }) => {
        const isExpanded = expandedFaq === index;
        return (
            <View className="mb-4 bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden">
                <TouchableOpacity
                    onPress={() => toggleFaq(index)}
                    className="flex-row items-center justify-between p-4"
                >
                    <Text className="flex-1 font-bold text-gray-800 dark:text-gray-200 text-base">{question}</Text>
                    <Icon name={isExpanded ? "remove" : "add"} size={20} color={isDark ? '#999' : '#666'} />
                </TouchableOpacity>
                {isExpanded && (
                    <View className="px-4 pb-4">
                        <Text className="text-gray-600 dark:text-gray-400 leading-5">{answer}</Text>
                    </View>
                )}
            </View>
        );
    };

    return (
        <View className="flex-1 bg-white dark:bg-black">
            {/* Header */}
            <View className="flex-row items-center px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 mr-2">
                    <Icon name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
                </TouchableOpacity>
                <Text className="text-lg font-bold text-black dark:text-white">Customer Support</Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: 24 }}>
                <Text className="text-2xl font-bold text-black dark:text-white mb-2">How can we help?</Text>
                <Text className="text-gray-500 dark:text-gray-400 mb-8">Our team is available Mon-Fri, 9am - 6pm.</Text>

                <View className="flex-row mb-10">
                    <ContactOption
                        icon="mail"
                        label="Email Us"
                        value="support@hascart.com"
                        onPress={handleEmail}
                        isPrimary={true}
                    />
                    <ContactOption
                        icon="phone"
                        label="Call Us"
                        value="+1 (996) 614-1950"
                        onPress={handleCall}
                    />
                </View>

                <Text className="text-lg font-bold text-black dark:text-white mb-4">Frequently Asked Questions</Text>

                <FAQItem
                    index={0}
                    question="Where is my order?"
                    answer="You can track your order status in the 'My Orders' section of your profile. Generally, orders are processed within 24 hours."
                />
                <FAQItem
                    index={1}
                    question="How do I return an item?"
                    answer="Go to your order history, select the order, and tap 'Return Item'. Returns are accepted within 30 days of purchase for most items."
                />
                <FAQItem
                    index={2}
                    question="Do you ship internationally?"
                    answer="Currently, we ship to the US, Canada, and select European countries. Check our shipping policy for more details."
                />
                <FAQItem
                    index={3}
                    question="How do I change my password?"
                    answer="To change your password, please log out and use the 'Forgot Password' link on the login screen to reset it."
                />

            </ScrollView>
        </View>
    );
};

export default SupportScreen;
