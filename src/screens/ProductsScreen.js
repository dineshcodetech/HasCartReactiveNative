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
import { styled } from 'nativewind';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48 - 16) / 2; // (Screen - Padding - Gap) / 2

// Default "All" filter
const DEFAULT_FILTER = { id: 'all', label: 'All', query: 'trending products', searchIndex: 'All' };

const ProductsScreen = () => {
  const navigation = useNavigation();
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

  useEffect(() => {
    // Initial fetch based on default filter
    fetchProducts(DEFAULT_FILTER.query, DEFAULT_FILTER.searchIndex);
  }, []);


  const handleFilterPress = (filter) => {
    setActiveFilterId(filter.id);
    setCurrentPage(1);
    setHasMore(true);
    fetchProducts(filter.query, filter.searchIndex, 1, false);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setActiveFilterId('search');
      setCurrentPage(1);
      setHasMore(true);
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
        <ActivityIndicator size="small" color="#000" />
      </View>
    );
  };

  const renderProduct = ({ item }) => {
    const imageUrl = item.Images?.Primary?.Large?.URL || item.Images?.Primary?.URL;
    const title = item.ItemInfo?.Title?.DisplayValue || item.Title || 'Product';
    const priceObj = item.Offers?.Listings?.[0]?.Price;
    const formatPrice = (priceObj) => {
      if (!priceObj?.Amount) return '';
      return `₹${priceObj.Amount.toFixed(0)}`;
    };
    const price = formatPrice(priceObj);
    const brand = item.ItemInfo?.ByLineInfo?.Brand?.DisplayValue;

    return (
      <TouchableOpacity
        style={{ width: CARD_WIDTH }}
        className="mb-6 mr-4"
        onPress={() => navigation.navigate('ProductDetail', { asin: item.ASIN, product: item })}
      >
        <View className="w-full aspect-[3/4] bg-gray-50 rounded-lg overflow-hidden mb-3 relative shadow-sm header-image">
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} className="w-full h-full object-cover" />
          ) : (
            <View className="flex-1 items-center justify-center bg-gray-100">
              <Icon name="image" size={24} color="#ccc" />
            </View>
          )}
          <TouchableOpacity className="absolute bottom-3 right-3 w-8 h-8 bg-white rounded-full items-center justify-center shadow-md">
            <Icon name="add" size={18} color="#000" />
          </TouchableOpacity>
        </View>

        <View>
          {brand && <Text numberOfLines={1} className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">{brand}</Text>}
          <Text numberOfLines={2} className="text-xs font-semibold text-black leading-4 mb-1 h-8">{title}</Text>
          <Text className="text-sm font-bold text-black">{price}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="px-6 pt-14 pb-2 bg-white z-10">
        <Text className="text-3xl font-light tracking-wide text-black mb-6">
          Archive.
        </Text>

        {/* Search Bar */}
        <View className="flex-row items-center bg-gray-50 rounded-full px-4 py-3 mb-4">
          <Icon name="search" size={20} color="#999" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search collection..."
            placeholderTextColor="#999"
            className="flex-1 text-base text-black font-medium p-0"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>

        {/* Filters */}
        <View>
          {categoriesLoading ? (
            <ActivityIndicator size="small" color="#000" style={{ marginVertical: 8 }} />
          ) : (
            <FlatList
              horizontal
              data={categories}
              keyExtractor={item => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 8 }}
              extraData={activeFilterId}
              renderItem={({ item }) => {
                const isActive = activeFilterId === item.id;
                return (
                  <TouchableOpacity
                    onPress={() => handleFilterPress(item)}
                    className={`mr-3 px-5 py-2 rounded-full border ${isActive ? 'bg-black border-black' : 'bg-transparent border-gray-200'} `}
                  >
                    <Text className={`text-xs font-bold tracking-wide ${isActive ? 'text-white' : 'text-black'} `}>
                      {item.label.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </View>

      {/* Grid Content */}
      <View className="flex-1 px-6">
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator color="#000" />
          </View>
        ) : error ? (
          <View className="flex-1 justify-center items-center">
            <Icon name="cloud-off" size={32} color="#000" />
            <Text className="text-gray-400 mt-4">{error}</Text>
            <TouchableOpacity onPress={() => fetchProducts(searchQuery || DEFAULT_FILTER.query, DEFAULT_FILTER.searchIndex)} className="mt-4 border-b border-black">
              <Text className="text-black font-bold">RELOAD</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={products}
            renderItem={renderProduct}
            keyExtractor={(item, index) => item.ASIN + index || index.toString()}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 20, paddingBottom: 100 }}
            columnWrapperStyle={{ justifyContent: 'space-between' }}
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
