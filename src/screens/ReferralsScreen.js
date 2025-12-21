import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import Icon from '../components/Icon';
import { apiCall } from '../services/api';

const ReferralsScreen = () => {
    const navigation = useNavigation();
    const [referrals, setReferrals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        fetchReferrals();
    }, []);

    const fetchReferrals = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('authToken');

            // Fetch stats and actual list of users using apiCall for consistency
            const [statsRes, listRes] = await Promise.all([
                apiCall('/api/referral/stats', { headers: { 'Authorization': `Bearer ${token}` } }),
                apiCall('/api/referral/my-referrals', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (statsRes.ok) setStats(statsRes.data.data);
            if (listRes.ok) setReferrals(listRes.data.data);
        } catch (error) {
            console.error('[Referrals] Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const ReferralItem = ({ item }) => (
        <View className="bg-white p-4 rounded-xl mb-3 border border-gray-100 flex-row items-center">
            <View className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center mr-4">
                <Icon name="person" size={20} color="#666" />
            </View>
            <View className="flex-1">
                <Text className="text-sm font-bold text-black">{item.name}</Text>
                <Text className="text-[9px] text-gray-500">{item.mobile || 'No mobile'}</Text>
                <Text className="text-[8px] text-gray-400 uppercase mt-0.5">{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
            <View className="bg-green-50 px-2 py-1 rounded">
                <Text className="text-[8px] font-black text-green-600 uppercase">Active</Text>
            </View>
        </View>
    );

    const Header = () => (
        <View>
            <View className="bg-black p-6 rounded-3xl mb-8 shadow-xl">
                <Text className="text-gray-400 text-[10px] uppercase font-black tracking-widest mb-1">Total Network</Text>
                <Text className="text-white text-3xl font-black mb-4">{stats?.totalReferrals || 0} Users</Text>

                <View className="h-[1px] bg-white/10 mb-4" />

                <View className="flex-row justify-between">
                    <View>
                        <Text className="text-gray-500 text-[8px] uppercase font-black">Total Clicks</Text>
                        <Text className="text-white text-lg font-bold">{stats?.totalClicks || 0}</Text>
                    </View>
                    <View className="items-end">
                        <Text className="text-gray-500 text-[8px] uppercase font-black">Network Balance</Text>
                        <Text className="text-secondary text-lg font-black">₹{stats?.agent?.balance?.toFixed(2) || '0.00'}</Text>
                    </View>
                </View>
            </View>

            <Text className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-4">Referral History</Text>
        </View>
    );

    const Footer = () => (
        <View className="mt-8 bg-blue-50/50 p-6 rounded-3xl border border-blue-100 mb-20">
            <Text className="text-blue-900 font-black text-xs uppercase tracking-widest mb-4">How it works</Text>

            <View className="flex-row items-center mb-4">
                <View className="w-6 h-6 bg-blue-100 rounded-full items-center justify-center mr-3">
                    <Text className="text-blue-600 font-bold text-[10px]">1</Text>
                </View>
                <Text className="text-blue-800/70 text-[11px] font-medium flex-1">Share your unique Referral Code with your network.</Text>
            </View>

            <View className="flex-row items-center mb-4">
                <View className="w-6 h-6 bg-blue-100 rounded-full items-center justify-center mr-3">
                    <Text className="text-blue-600 font-bold text-[10px]">2</Text>
                </View>
                <Text className="text-blue-800/70 text-[11px] font-medium flex-1">When they register using your code, they join your network.</Text>
            </View>

           
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="px-6 py-4 flex-row items-center border-b border-gray-50">
                <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
                    <Icon name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text className="text-xl font-black text-primary">My Referrals<Text className="text-secondary">.</Text></Text>
            </View>

            {loading ? (
                <ActivityIndicator color="#000" style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={referrals}
                    keyExtractor={item => item._id}
                    renderItem={({ item }) => <ReferralItem item={item} />}
                    ListHeaderComponent={Header}
                    ListFooterComponent={Footer}
                    ListEmptyComponent={() => (
                        <View className="items-center py-20 bg-gray-50 rounded-3xl mb-4">
                            <Text className="text-gray-300 text-4xl mb-2">📭</Text>
                            <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider">No referrals yet</Text>
                        </View>
                    )}
                    contentContainerStyle={{ padding: 24 }}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
};

export default ReferralsScreen;
