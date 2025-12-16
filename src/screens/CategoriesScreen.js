import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Image,
    ActivityIndicator,
    Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { apiCall } from '../services/api';
import Icon from '../components/Icon';
import CustomLoader from '../components/CustomLoader';
import { IconNames } from '../config/icons';

const { width, height } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.25; // 25% for sidebar

const CategoriesScreen = () => {
    const navigation = useNavigation();
    const { isDark } = require('../context/ThemeContext').useTheme();
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [loadingCategories, setLoadingCategories] = useState(true);

    // Initial load: Fetch categories
    useEffect(() => {
        fetchCategories();
    }, []);

    // When category changes, fetch products
    useEffect(() => {
        if (selectedCategory) {
            fetchProducts(selectedCategory);
        }
    }, [selectedCategory]);

    const fetchCategories = async () => {
        try {
            const response = await apiCall('/api/admin/categories?status=active');
            if (response.ok && response.data.success) {
                const cats = response.data.data?.categories || [];
                // Add "For You" pseudo-category if desired, or just use first one
                setCategories(cats);
                if (cats.length > 0) {
                    setSelectedCategory(cats[0]);
                }
            }
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        } finally {
            setLoadingCategories(false);
        }
    };

    const fetchProducts = async (category) => {
        try {
            setLoadingProducts(true);
            const keyword = category.searchQuery || category.name || 'Best Sellers';
            const endpoint = `/api/products/category/${category.amazonSearchIndex || 'All'}?keywords=${encodeURIComponent(keyword)}&itemCount=20`;
            const response = await apiCall(endpoint);

            if (response.ok && response.data.data?.SearchResult?.Items) {
                setProducts(response.data.data.SearchResult.Items);
            } else {
                setProducts([]);
            }
        } catch (error) {
            console.error('Failed to fetch products:', error);
            setProducts([]);
        } finally {
            setLoadingProducts(false);
        }
    };

    const getCategoryIcon = (category) => {
        const index = category.amazonSearchIndex || category.name;
        // Map of Amazon Indices/Names to MaterialIcons names
        // Reference: https://oblador.github.io/react-native-vector-icons/
        const iconMap = {
            'Electronics': 'smartphone', // or devices
            'Automotive': 'directions-car',
            'HomeGarden': 'home',
            'Books': 'menu-book',
            'Fashion': 'checkroom', // or local-mall
            'Clothing': 'checkroom',
            'ToysGames': 'toys', // or videogames
            'Beauty': 'face', // or brush
            'Computers': 'computer', // or laptop
            'SportsOutdoors': 'sports-soccer', // or pedal-bike
            'HealthPersonalCare': 'medical-services', // or local-hospital
            'Baby': 'child-care',
            'GroceryGourmetFood': 'restaurant', // or local-grocery-store
            'PetSupplies': 'pets',
            'OfficeProducts': 'work',
            'VideoGames': 'sports-esports',
            'Music': 'music-note',
            'MoviesTV': 'movie',
            'Industrial': 'build',
            'Handmade': 'brush'
        };

        return iconMap[index] || iconMap[category.name] || 'grid-view'; // 'apps' -> 'grid-view' in Material
    };

    const renderSidebarItem = ({ item }) => {
        const isSelected = selectedCategory?._id === item._id;
        const iconName = getCategoryIcon(item);

        return (
            <TouchableOpacity
                style={[styles.sidebarItem, isDark && { borderBottomColor: '#222' }, isSelected && styles.sidebarItemSelected, isSelected && isDark && { backgroundColor: '#000', borderLeftColor: '#2874f0' }]}
                onPress={() => setSelectedCategory(item)}
                activeOpacity={0.8}
            >
                <View style={[styles.sidebarIconContainer, isSelected && styles.sidebarIconSelected, isDark && { backgroundColor: '#333' }, isSelected && isDark && { backgroundColor: '#1a3b5c' }]}>
                    <Icon
                        name={iconName}
                        size={24}
                        color={isSelected ? '#2874f0' : isDark ? '#fff' : '#666'}
                    />
                </View>
                <Text style={[styles.sidebarText, isDark && { color: '#ccc' }, isSelected && styles.sidebarTextSelected]}>
                    {item.name}
                </Text>
            </TouchableOpacity>
        );
    };

    const handleViewAll = () => {
        if (!selectedCategory) return;
        navigation.navigate('Products', {
            category: selectedCategory.name,
            searchQuery: selectedCategory.searchQuery || selectedCategory.name,
            searchIndex: selectedCategory.amazonSearchIndex
        });
    };

    const renderProductItem = ({ item }) => {
        const validImage =
            item.Images?.Primary?.Large?.URL ||
            item.Images?.Primary?.Medium?.URL ||
            item.LargeImage?.URL ||
            'https://via.placeholder.com/150';

        const title = item.ItemInfo?.Title?.DisplayValue || item.Title || 'Product';

        return (
            <TouchableOpacity
                style={styles.circularProductItem}
                onPress={() => navigation.navigate('ProductDetail', { product: item, asin: item.ASIN })}
            >
                <View style={[styles.circularImageContainer, isDark && { backgroundColor: '#333', borderColor: '#444' }]}>
                    <Image source={{ uri: validImage }} style={styles.circularImage} resizeMode="cover" />
                </View>
                <Text numberOfLines={2} style={[styles.circularProductTitle, isDark && { color: '#eee' }]}>{title}</Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, isDark && { backgroundColor: '#000', borderBottomColor: '#222' }]}>
                <Text style={[styles.headerTitle, isDark && { color: '#fff' }]}>All Categories</Text>
                <View style={styles.headerIcons}>
                    <TouchableOpacity style={styles.iconButton}>
                        <Icon name="search" size={24} color={isDark ? '#fff' : '#000'} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.contentContainer}>
                {/* Sidebar */}
                <View style={[styles.sidebar, isDark && { backgroundColor: '#111', borderRightColor: '#222' }]}>
                    {loadingCategories ? (
                        <ActivityIndicator size="small" color="#2874f0" />
                    ) : (
                        <FlatList
                            data={categories}
                            renderItem={renderSidebarItem}
                            keyExtractor={(item) => item._id}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.sidebarList}
                        />
                    )}
                </View>

                {/* Main Content */}
                <View style={[styles.mainContent, isDark && { backgroundColor: '#000' }]}>
                    {loadingProducts ? (
                        <View style={styles.centered}>
                            <CustomLoader text="Loading..." />
                        </View>
                    ) : (
                        <FlatList
                            data={products}
                            renderItem={renderProductItem}
                            keyExtractor={(item, index) => item.ASIN || index.toString()}
                            numColumns={3} // Grid layout 3 columns for circular items
                            columnWrapperStyle={styles.columnWrapper}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.productList}
                            ListHeaderComponent={
                                <View style={styles.categoryHeaderContainer}>
                                    <Text style={[styles.selectedCategoryTitle, isDark && { color: '#fff' }]}>{selectedCategory?.name}</Text>
                                    <TouchableOpacity onPress={handleViewAll}>
                                        <Text style={styles.viewAllText}>View All</Text>
                                    </TouchableOpacity>
                                </View>
                            }
                        />
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff', // Dynamic override handling in render
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 50, // Safe area padding roughly
        paddingBottom: 12,
        backgroundColor: '#fff',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 1 },
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#000',
    },
    headerIcons: {
        flexDirection: 'row',
    },
    iconButton: {
        marginLeft: 16,
    },
    contentContainer: {
        flex: 1,
        flexDirection: 'row',
    },
    sidebar: {
        width: SIDEBAR_WIDTH,
        backgroundColor: '#f0f2f5',
        borderRightWidth: 1,
        borderRightColor: '#e0e0e0',
    },
    sidebarList: {
        paddingBottom: 20,
    },
    sidebarItem: {
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: 'transparent', // Handled logic for separator manually? Or just keep it.
    },
    sidebarItemSelected: {
        backgroundColor: '#fff',
        borderLeftWidth: 4,
        borderLeftColor: '#2874f0', // Flipkart Blue
    },
    sidebarIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#fff', // White circle background
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
        elevation: 1,
    },
    sidebarIconSelected: {
        backgroundColor: '#e6f0ff', // Light blue bg
    },
    sidebarText: {
        fontSize: 11,
        color: '#666',
        textAlign: 'center',
        fontWeight: '500',
    },
    sidebarTextSelected: {
        color: '#2874f0',
        fontWeight: '700',
    },
    mainContent: {
        flex: 1, // Takes remaining width
        backgroundColor: '#fff',
    },
    categoryHeaderContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        paddingBottom: 8,
    },
    selectedCategoryTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#212121',
    },
    viewAllText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2874f0',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    productList: {
        padding: 12,
        paddingTop: 0,
    },
    columnWrapper: {
        justifyContent: 'flex-start',
        gap: 12, // Gap between items
    },
    circularProductItem: {
        width: '30%', // 3 columns roughly
        alignItems: 'center',
        marginBottom: 20,
    },
    circularImageContainer: {
        width: 70,
        height: 70,
        borderRadius: 35, // Circular
        backgroundColor: '#f8f8f8',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    circularImage: {
        width: '80%',
        height: '80%',
        resizeMode: 'contain',
    },
    circularProductTitle: {
        fontSize: 11,
        color: '#333',
        textAlign: 'center',
        lineHeight: 14,
        height: 28, // Fix height for max 2 lines
    },
});

export default CategoriesScreen;
