import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    SafeAreaView,
    RefreshControl,
    StyleSheet,
    StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import Icon from '../components/Icon';
import { apiCall } from '../services/api';

const AgentClicksScreen = () => {
    const navigation = useNavigation();
    const [clicks, setClicks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

    const fetchClicks = async (pageNum = 1, isRefresh = false) => {
        try {
            if (!isRefresh) setLoading(true);
            const token = await AsyncStorage.getItem('authToken');
            const res = await apiCall(`/api/analytics/my-clicks?page=${pageNum}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok && res.data?.success && res.data?.data) {
                if (pageNum === 1) {
                    setClicks(res.data.data.clicks || []);
                } else {
                    setClicks(prev => [...prev, ...(res.data.data.clicks || [])]);
                }
                if (res.data.data.pagination) {
                    setPagination(res.data.data.pagination);
                }
            } else {
                console.warn('[AgentClicks] Unexpected response format:', res);
            }
        } catch (error) {
            console.error('[AgentClicks] Fetch error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchClicks();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchClicks(1, true);
    };

    const loadMore = () => {
        if (pagination && pagination.page < pagination.totalPages) {
            fetchClicks(pagination.page + 1);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return { bg: '#fff7ed', text: '#c2410c' }; // orange-50/600
            case 'completed': return { bg: '#f0fdf4', text: '#16a34a' }; // green-50/600
            case 'failed': return { bg: '#fef2f2', text: '#dc2626' }; // red-50/600
            default: return { bg: '#f9fafb', text: '#9ca3af' }; // gray-50/400
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'pending': return 'Pending';
            case 'completed': return 'Accepted';
            case 'failed': return 'Rejected';
            default: return 'Untracked';
        }
    }

    const ClickItem = ({ item }) => {
        const statusStyle = getStatusColor(item.commissionStatus);

        return (
            <View style={styles.card}>
                <View style={styles.iconContainer}>
                    <Icon name="touch-app" size={20} color="#666" />
                </View>
                <View style={styles.infoContainer}>
                    <Text style={styles.productName} numberOfLines={1}>{item.productName}</Text>
                    <Text style={styles.details}>ASIN: {item.asin} • ₹{item.price}</Text>
                    <Text style={styles.date}>{new Date(item.createdAt).toLocaleString()}</Text>
                </View>
                <View style={styles.amountContainer}>
                    <Text style={styles.amount}>₹{item.commissionAmount?.toFixed(2) || '0.00'}</Text>
                    <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
                        <Text style={[styles.badgeText, { color: statusStyle.text }]}>
                            {getStatusLabel(item.commissionStatus)}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    Earnings Log<Text style={styles.headerDot}>.</Text>
                </Text>
            </View>

            {loading && !refreshing ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#2B3990" />
                </View>
            ) : (
                <FlatList
                    data={clicks}
                    keyExtractor={item => item._id}
                    renderItem={({ item }) => <ClickItem item={item} />}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2B3990']} />
                    }
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.5}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={() => (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>📉</Text>
                            <Text style={styles.emptyText}>No clicks recorded yet</Text>
                        </View>
                    )}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    backButton: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#2B3990',
    },
    headerDot: {
        color: '#76BA1B',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 20,
        paddingBottom: 100,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#f3f4f6',
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f9fafb',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    infoContainer: {
        flex: 1,
        marginRight: 12,
    },
    productName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    details: {
        fontSize: 11,
        color: '#6b7280',
        marginBottom: 4,
    },
    date: {
        fontSize: 10,
        color: '#9ca3af',
        fontWeight: '500',
        textTransform: 'uppercase',
    },
    amountContainer: {
        alignItems: 'flex-end',
        minWidth: 70,
    },
    amount: {
        fontSize: 14,
        fontWeight: '900',
        color: '#111827',
        marginBottom: 6,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingTop: 80,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#9ca3af',
        textTransform: 'uppercase',
        letterSpacing: 1,
    }
});

export default AgentClicksScreen;
