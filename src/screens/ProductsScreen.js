import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { apiCall } from '../services/api';
import Icon from '../components/Icon';
import CustomLoader from '../components/CustomLoader';
import { styled } from 'nativewind';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48 - 16) / 2; // (Screen - Padding - Gap) / 2

// Default "All" filter
const DEFAULT_FILTER = { id: 'all', label: 'All', query: 'trending products', searchIndex: 'All' };

const ProductsScreen = ({ route }) => {
  const navigation = useNavigation();
  const { isDark } = require('../context/ThemeContext').useTheme(); // Access global theme
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [activeFilterId, setActiveFilterId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Dynamic categories from backend
  const [categories, setCategories] = useState([DEFAULT_FILTER]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Fetch categories from backend
  const fetchCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true);
      const response = await apiCall('/api/admin/categories?status=active', { method: 'GET' });

      if (response.ok && response.data.success) {
        const backendCategories = response.data.data?.categories || [];
        const mappedCategories = backendCategories.map(cat => ({
          id: cat._id,
          label: cat.name,
          query: cat.searchQuery || cat.name,
          searchIndex: cat.amazonSearchIndex || 'All',
        }));
        setCategories([DEFAULT_FILTER, ...mappedCategories]);

        // Set first category as active if available and no filter selected
        // This logic is now handled by the default 'all' filter
        // if (mappedCategories.length > 0) {
        //   const firstCat = mappedCategories[0];
        //   setActiveFilterId(firstCat.id);
        //   fetchProducts(firstCat.query, firstCat.searchIndex, 1, false);
        // }
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const fetchProducts = useCallback(async (query, searchIndex = 'All', page = 1, shouldAppend = false) => {
    if (!hasMore && shouldAppend) return;

    try {
      if (!shouldAppend) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      const response = await apiCall(
        `/api/products?keywords=${encodeURIComponent(query)}&searchIndex=${searchIndex}&itemCount=10&page=${page}`,
        { method: 'GET' }
      );

      if (response.ok && response.data.success) {
        const newProducts = response.data.data?.SearchResult?.Items || [];

        if (newProducts.length === 0) {
          setHasMore(false);
        }

        if (shouldAppend) {
          setProducts(prev => [...prev, ...newProducts]);
        } else {
          setProducts(newProducts);
        }
      } else {
        if (!shouldAppend) setError('No items found.');
      }
    } catch (err) {
      if (!shouldAppend) setError('Check your connection.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [hasMore]);

  /* Updated to handle route params from Categories screen or others */
  useEffect(() => {
    const params = route.params || {};

    // Update Header Title based on context
    const title = params.category || params.searchQuery || 'Products';
    navigation.setOptions({
      title: title.charAt(0).toUpperCase() + title.slice(1),
      headerStyle: {
        backgroundColor: isDark ? '#000' : '#fff',
      },
      headerTintColor: isDark ? '#fff' : '#000',
    });

    if (params.category || params.searchIndex) {
      // If passed specific category info
      const query = params.searchQuery || params.category || DEFAULT_FILTER.query;
      const index = params.searchIndex || 'All';

      // RESET STATE IMMEDIATELY to avoid showing old data
      setProducts([]);
      setHasMore(true);
      setLoading(true);

      // Find matching filter if exists
      const matchingCat = categories.find(c => c.searchIndex === index) || { id: 'custom' };
      if (matchingCat.id !== 'custom') setActiveFilterId(matchingCat.id);

      fetchProducts(query, index);
    } else {
      // Default behavior
      fetchProducts(DEFAULT_FILTER.query, DEFAULT_FILTER.searchIndex);
    }
  }, [route.params, navigation, categories]);


  const handleFilterPress = (filter) => {
    setActiveFilterId(filter.id);
    setCurrentPage(1);
    setHasMore(true);
    setProducts([]); // Clear current list immediately
    fetchProducts(filter.query, filter.searchIndex, 1, false);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setActiveFilterId('search');
      setCurrentPage(1);
      setHasMore(true);
      setProducts([]); // Also clear for search
      fetchProducts(searchQuery.trim(), 'All', 1, false);
    }
  };

  const loadMore = () => {
    if (!loading && !loadingMore && hasMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);

      let query, searchIndex;
      if (activeFilterId === 'search') {
        query = searchQuery;
        searchIndex = 'All';
      } else {
        const activeCategory = categories.find(c => c.id === activeFilterId) || categories[0];
        if (activeCategory) {
          query = activeCategory.query;
          searchIndex = activeCategory.searchIndex;
        } else {
          return; // No category found, stop
        }
      }

      fetchProducts(query, searchIndex, nextPage, true);
    }
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View className="py-4">
        <ActivityIndicator size="small" color={isDark ? "#fff" : "#000"} />
      </View>
    );
  };

  const renderProduct = ({ item }) => {
    const imageUrl = item.Images?.Primary?.Large?.URL || item.Images?.Primary?.URL;
    const title = item.ItemInfo?.Title?.DisplayValue || item.Title || 'Product';
    const priceObj = item.Offers?.Listings?.[0]?.Price;
    const formatPrice = (priceObj) => {
      if (!priceObj?.Amount) return '';
      return `₹${priceObj.Amount.toLocaleString('en-IN')}`;
    };
    const price = formatPrice(priceObj);
    const brand = item.ItemInfo?.ByLineInfo?.Brand?.DisplayValue;
    const rating = item.CustomerReviews?.StarRating;
    const reviewCount = item.CustomerReviews?.Count;

    // Extract features for chips (Screenshot shows specs like Displacement, Brakes etc.)
    // Amazon API usually returns Features in ItemInfo.Features.DisplayValues (Array of strings)
    // We'll take the first 3-4 feature bullets as "Specs"
    const features = item.ItemInfo?.Features?.DisplayValues || [];
    const specs = features.slice(0, 3).map(f => f.length > 20 ? f.substring(0, 20) + '..' : f);

    return (
      <TouchableOpacity
        className="mb-4 bg-white dark:bg-gray-900 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-gray-800"
        onPress={() => navigation.navigate('ProductDetail', { asin: item.ASIN, product: item })}
        activeOpacity={0.9}
      >
        <View className="flex-row">
          {/* Left: Image */}
          <View className="w-1/3 aspect-square bg-white rounded-lg p-2 items-center justify-center relative">
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} className="w-full h-full" resizeMode="contain" />
            ) : (
              <Icon name="image" size={32} color="#eee" />
            )}
            {/* Coming Soon Tag Style from screenshot */}
            {/* <View className="absolute -bottom-2 bg-green-50 px-2 py-0.5 rounded border border-green-100">
                     <Text className="text-[10px] text-green-700 font-bold">In Stock</Text>
                </View> */}
          </View>

          {/* Right: Info */}
          <View className="flex-1 ml-3 justify-start">
            {brand && <Text className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">{brand}</Text>}
            <Text numberOfLines={2} className="text-sm text-gray-900 dark:text-white font-medium leading-5 mb-1">{title}</Text>

            {/* Rating Row - Only show if rating exists */}
            {rating && (
              <View className="flex-row items-center mb-1">
                <View className="bg-green-700 px-1.5 py-0.5 rounded flex-row items-center mr-2">
                  <Text className="text-white text-[10px] font-bold mr-0.5">{rating}</Text>
                  <Icon name="star" size={8} color="#fff" />
                </View>
                {reviewCount && <Text className="text-gray-400 text-xs">({reviewCount})</Text>}
              </View>
            )}

            <Text className="text-lg font-bold text-gray-900 dark:text-gray-100">{price}</Text>
          </View>

          {/* Wishlist Icon absolute top right */}
          <TouchableOpacity className="absolute top-0 right-0 p-1">
            <Icon name="favorite-border" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* Bottom: Spec Chips */}
        {specs.length > 0 && (
          <View className="flex-row flex-wrap mt-3 pt-3 border-t border-gray-50 dark:border-gray-800">
            {specs.map((spec, index) => (
              <View key={index} className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded px-2 py-1 mr-2 mb-1">
                <Text className="text-[10px] text-gray-600 dark:text-gray-300 font-medium">{spec}</Text>
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Determine if we should show category filters
  // Hide if we are in a specific "Deep Linked" category view AND presumably not searching yet
  const isCategoryView = route.params?.category || route.params?.searchIndex;
  const showFilters = !isCategoryView;

  return (
    <View className="flex-1 bg-gray-50 dark:bg-black">
      {/* Header */}
      <View className="px-4 pt-2 pb-2 bg-white dark:bg-gray-900 z-10 shadow-sm border-b border-gray-100 dark:border-gray-800">

        {/* Removed "Archive." text as per minimalist screenshot preference */}

        {/* Search Bar */}
        <View className="flex-row items-center bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2.5 mb-3">
          <Icon name="search" size={20} color="#999" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search products..."
            placeholderTextColor="#999"
            className="flex-1 text-base text-black dark:text-white font-medium p-0"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>

        {/* Filters - Conditionally Rendered */}
        {showFilters && (
          <View>
            {categoriesLoading ? (
              <ActivityIndicator size="small" color={isDark ? "#fff" : "#000"} style={{ marginVertical: 8 }} />
            ) : (
              <FlatList
                horizontal
                data={categories}
                keyExtractor={item => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 24, paddingBottom: 4 }}
                extraData={activeFilterId}
                renderItem={({ item }) => {
                  const isActive = activeFilterId === item.id;
                  return (
                    <TouchableOpacity
                      onPress={() => handleFilterPress(item)}
                      className={`mr-2 px-4 py-1.5 rounded-full border ${isActive ? 'bg-black border-black dark:bg-white dark:border-white' : 'bg-white border-gray-300 dark:bg-gray-800 dark:border-gray-700'} `}
                    >
                      <Text className={`text-xs font-bold tracking-wide ${isActive ? 'text-white dark:text-black' : 'text-gray-700 dark:text-gray-300'} `}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        )}
      </View>

      {/* List Content */}
      <View className="flex-1 px-3 pt-3">
        {loading ? (
          <CustomLoader text="Loading products..." />
        ) : error ? (
          <View className="flex-1 justify-center items-center">
            <Icon name="cloud-off" size={32} color={isDark ? "#999" : "#000"} />
            <Text className="text-gray-400 mt-4">{error}</Text>
            <TouchableOpacity onPress={() => fetchProducts(searchQuery || DEFAULT_FILTER.query, DEFAULT_FILTER.searchIndex)} className="mt-4 border-b border-black dark:border-white">
              <Text className="text-black dark:text-white font-bold">RELOAD</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={products}
            renderItem={renderProduct}
            keyExtractor={(item, index) => item.ASIN + index || index.toString()}
            // REMOVED numColumns={2} for List View
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
          />
        )}
      </View>
    </View>
  );
};

export default ProductsScreen;
