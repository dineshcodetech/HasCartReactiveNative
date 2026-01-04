import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Share } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiCall, WEB_BASE_URL } from '../services/api';
import Icon from './Icon';
import { getOptimizedImageSource } from '../utils/imageUtils';

const ProductCard = ({ product, onPress, onShare, isDark, isAgent }) => {
    // Extract image URL safely
    const rawImageUrl =
        product.Images?.Primary?.Large?.URL ||
        product.Images?.Primary?.Medium?.URL ||
        product.LargeImage?.URL ||
        product.MediumImage?.URL ||
        'https://via.placeholder.com/150';

    // Get optimized source (handles Google Drive URLs)
    const validImageSource = getOptimizedImageSource(rawImageUrl, 400);

    return (
        <TouchableOpacity style={[styles.card, isDark && { backgroundColor: '#111', borderColor: '#333' }]} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.imageContainer}>
                <Image
                    source={validImageSource}
                    style={[styles.image, isDark && { backgroundColor: '#222', borderRadius: 8 }]}
                    resizeMode="contain"
                />
                {isAgent && (
                    <TouchableOpacity
                        style={styles.cardShareBtn}
                        onPress={(e) => {
                            e.stopPropagation();
                            onShare(product);
                        }}
                    >
                        <Icon name="share" size={16} color="#2B3990" />
                    </TouchableOpacity>
                )}
            </View>
            <View style={styles.info}>
                <Text numberOfLines={2} style={[styles.title, isDark && { color: '#fff' }]}>
                    {product.ItemInfo?.Title?.DisplayValue || 'Unknown Product'}
                </Text>
            </View>
        </TouchableOpacity>
    );
};

const CategoryRow = ({ category, initialProducts = [] }) => {
    const navigation = useNavigation();
    // const { isDark } = require('../context/ThemeContext').useTheme();
    const isDark = false;
    const [products, setProducts] = useState(initialProducts || []);
    const [loading, setLoading] = useState(!initialProducts || initialProducts.length === 0);
    const [hasFetched, setHasFetched] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const loadUser = async () => {
            const userData = await AsyncStorage.getItem('userData');
            if (userData) {
                setUser(JSON.parse(userData));
            }
        };
        loadUser();
    }, []);

    useEffect(() => {
        // If we were given products, use them and don't fetch
        if (initialProducts && initialProducts.length > 0) {
            setProducts(initialProducts);
            setLoading(false);
            return;
        }

        // Only fetch if we haven't fetched for this specific category ID yet
        if (!hasFetched && (!initialProducts || initialProducts.length === 0)) {
            fetchProducts();
            setHasFetched(true);
        }
    }, [category._id, initialProducts?.length]);

    // Reset fetch state if category ID changes
    useEffect(() => {
        setHasFetched(false);
    }, [category._id]);

    const fetchProducts = async () => {
        try {
            let fetchedProducts = [];

            // 1. First check for curated products (selectedProducts)
            if (category.selectedProducts && category.selectedProducts.length > 0) {
                const curatedResponse = await apiCall('/api/products/items', {
                    method: 'POST',
                    body: JSON.stringify({ itemIds: category.selectedProducts.slice(0, 10) })
                });

                if (curatedResponse.ok && curatedResponse.data?.data?.ItemsResult?.Items) {
                    fetchedProducts = curatedResponse.data.data.ItemsResult.Items;
                }
            }

            // 2. If no curated products or we want to mix, fill with search
            if (fetchedProducts.length < 6) {
                const keyword = (category.searchQueries && category.searchQueries.length > 0)
                    ? category.searchQueries[0]
                    : (category.searchQuery || category.name || 'Best Sellers');

                const endpoint = `/api/products/category/${category.amazonSearchIndex || 'All'}?keywords=${encodeURIComponent(keyword)}&itemCount=${10 - fetchedProducts.length}`;

                const searchResponse = await apiCall(endpoint);

                if (searchResponse.ok && searchResponse.data?.data?.SearchResult?.Items) {
                    const searchItems = searchResponse.data.data.SearchResult.Items;
                    // Filter out already fetched curated products to avoid duplicates
                    const existingAsins = new Set(fetchedProducts.map(p => p.ASIN));
                    const newItems = searchItems.filter(p => !existingAsins.has(p.ASIN));

                    fetchedProducts = [...fetchedProducts, ...newItems];
                }
            }

            setProducts(fetchedProducts.slice(0, 10));
        } catch (error) {
            console.log(`Failed to fetch products for ${category.name}`, error);
        } finally {
            setLoading(false);
        }
    };

    const handleSeeAll = () => {
        let query = (category.searchQueries && category.searchQueries.length > 0)
            ? category.searchQueries[0]
            : (category.searchQuery || category.name);

        // Special handling for pseudo-categories to ensure they redirect to something useful
        if (category._id === 'recent-clicks') {
            query = 'trending products';
        } else if (category._id === 'personalized') {
            query = 'best sellers';
        }

        navigation.navigate('Products', {
            category: category.name,
            searchQuery: query,
            searchIndex: category.amazonSearchIndex || 'All'
        });
    };

    const handleProductPress = (product) => {
        // Pass both product AND category context for accurate click tracking
        navigation.navigate('ProductDetail', {
            product,
            categoryContext: {
                name: category.name,
                amazonSearchIndex: category.amazonSearchIndex,
                _id: category._id
            }
        });
    };

    const handleShare = async (product) => {
        try {
            const title = product.ItemInfo?.Title?.DisplayValue || 'Product';
            const asin = product.ASIN;
            const referralCode = user?.referralCode || '';
            const agentId = user?._id || user?.id || '';

            // Construct URL with both parameters for redundancy
            let shareUrl = `${WEB_BASE_URL}/product/${asin}`;
            const params = [];
            if (referralCode) params.push(`ref=${referralCode}`);
            if (agentId) params.push(`agentId=${agentId}`);

            if (params.length > 0) {
                shareUrl += `?${params.join('&')}`;
            }

            console.log('[CategoryRow] Sharing with attribution:', { referralCode, agentId });

            await Share.share({
                message: `${title}\n\nCheck this out on HasCart: ${shareUrl}`,
            });
        } catch (error) {
            console.error('Error sharing product:', error);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#76BA1B" />
            </View>
        );
    }

    if (products.length === 0) {
        return null;
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={[styles.headerTitle, isDark && { color: '#fff' }]}>{category.name}</Text>
                <TouchableOpacity onPress={handleSeeAll} style={styles.seeAllButton}>
                    <Text style={styles.seeAllText}>see all</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
            >
                {products.map((product, index) => (
                    <ProductCard
                        key={product.ASIN || index}
                        product={product}
                        onPress={() => handleProductPress(product)}
                        onShare={handleShare}
                        isDark={isDark}
                        isAgent={user?.role === 'agent' || user?.role === 'admin'}
                    />
                ))}

                <TouchableOpacity style={[styles.seeAllCard, isDark && { backgroundColor: '#111', borderColor: '#333' }]} onPress={handleSeeAll}>
                    <View style={[styles.seeAllCircle, isDark && { backgroundColor: '#1A237E' }]}>
                        <Icon name="arrow-forward" size={24} color="#76BA1B" />
                    </View>
                    <Text style={styles.seeAllCardText}>See All</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    loadingContainer: {
        height: 180,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000',
    },
    seeAllButton: {
        padding: 4,
    },
    seeAllText: {
        fontSize: 14,
        color: '#76BA1B',
        fontWeight: '600',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    card: {
        width: 130, // Narrower card like blinkit
        marginRight: 12,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 8,
        // Very subtle shadow/border
        borderWidth: 1,
        borderColor: '#f0f0f0',
        elevation: 0,
    },
    imageContainer: {
        width: '100%',
        height: 100,
        marginBottom: 8,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    shareOverlay: {
        position: 'absolute',
        top: 5,
        right: 5,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 15,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardShareBtn: {
        position: 'absolute',
        bottom: -5,
        right: -5,
        backgroundColor: '#fff',
        borderRadius: 15,
        width: 28,
        height: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    info: {
        justifyContent: 'space-between',
    },
    title: {
        fontSize: 13,
        color: '#1c1c1c',
        fontWeight: '500',
        marginBottom: 8,
        height: 36, // Fixed height for 2 lines
        lineHeight: 18,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    price: {
        fontSize: 13,
        fontWeight: '700',
        color: '#000',
    },
    addBtnPlaceholder: {
        backgroundColor: '#f0fdf4',
        borderWidth: 1,
        borderColor: '#76BA1B',
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    addBtnText: {
        color: '#76BA1B',
        fontSize: 11,
        fontWeight: '700',
    },
    seeAllCard: {
        width: 130,
        height: 180,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    seeAllCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f0fff4', // Light brand green
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    seeAllCardText: {
        color: '#0ecb81',
        fontWeight: '600',
        fontSize: 13,
    },
});

export default CategoryRow;
