import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { apiCall } from '../services/api';
import Icon from './Icon';

const ProductCard = ({ product, onPress, isDark }) => {
    // Extract image URL safely
    const validImage =
        product.Images?.Primary?.Large?.URL ||
        product.Images?.Primary?.Medium?.URL ||
        product.LargeImage?.URL ||
        product.MediumImage?.URL ||
        'https://via.placeholder.com/150';

    return (
        <TouchableOpacity style={[styles.card, isDark && { backgroundColor: '#111', borderColor: '#333' }]} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.imageContainer}>
                <Image
                    source={{ uri: validImage }}
                    style={[styles.image, isDark && { backgroundColor: '#222', borderRadius: 8 }]}
                    resizeMode="contain"
                />
            </View>
            <View style={styles.info}>
                <Text numberOfLines={2} style={[styles.title, isDark && { color: '#fff' }]}>
                    {product.ItemInfo?.Title?.DisplayValue || 'Unknown Product'}
                </Text>
                {/* Price and Add button removed for cleaner look as requested */}
            </View>
        </TouchableOpacity>
    );
};

const CategoryRow = ({ category }) => {
    const navigation = useNavigation();
    const { isDark } = require('../context/ThemeContext').useTheme();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProducts();
    }, [category._id]);

    const fetchProducts = async () => {
        try {
            const keyword = category.searchQuery || category.name || 'Best Sellers';
            const endpoint = `/api/products/category/${category.amazonSearchIndex || 'All'}?keywords=${encodeURIComponent(keyword)}&itemCount=6`;

            const response = await apiCall(endpoint);

            if (response.ok && response.data && response.data.data && response.data.data.SearchResult && response.data.data.SearchResult.Items) {
                setProducts(response.data.data.SearchResult.Items);
            }
        } catch (error) {
            console.log(`Failed to fetch products for ${category.name}`, error);
        } finally {
            setLoading(false);
        }
    };

    const handleSeeAll = () => {
        navigation.navigate('Products', { category: category.amazonSearchIndex });
    };

    const handleProductPress = (product) => {
        navigation.navigate('ProductDetail', { product });
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#0ecb81" />
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
                        isDark={isDark}
                    />
                ))}

                <TouchableOpacity style={[styles.seeAllCard, isDark && { backgroundColor: '#111', borderColor: '#333' }]} onPress={handleSeeAll}>
                    <View style={[styles.seeAllCircle, isDark && { backgroundColor: '#0d2d46' }]}>
                        <Icon name="arrow-forward" size={24} color="#0ecb81" />
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
        color: '#0ecb81', // Blinkit green-ish
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
        borderColor: '#0ecb81',
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    addBtnText: {
        color: '#0ecb81',
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
        backgroundColor: '#f0fdf4',
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
