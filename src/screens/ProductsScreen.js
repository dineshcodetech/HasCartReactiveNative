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

const FILTERS = [
  { id: 'all', label: 'All', query: 'minimalist design' },
  { id: 'decor', label: 'Decor', query: 'minimalist home decor' },
  { id: 'furniture', label: 'Furniture', query: 'modern furniture' },
  { id: 'lighting', label: 'Lighting', query: 'designer lighting' },
  { id: 'art', label: 'Art', query: 'abstract wall art' },
];

const ProductsScreen = () => {
  const navigation = useNavigation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilterId, setActiveFilterId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchProducts = useCallback(async (query) => {
    try {
      setLoading(true);
      setError(null);
      // In a real app, you might pass category params. Here we use search queries for the mock/API.
      const response = await apiCall(
        `/api/products?keywords=${encodeURIComponent(query)}&itemCount=20`,
        { method: 'GET' }
      );

      if (response.ok && response.data.success) {
        setProducts(response.data.data?.SearchResult?.Items || []);
      } else {
        // Fallback for demo if API fails or returns empty
        setError('No items found.');
      }
    } catch (err) {
      setError('Check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch based on default filter
    const initialQuery = FILTERS[0].query;
    fetchProducts(initialQuery);
  }, [fetchProducts]);

  const handleFilterPress = (filter) => {
    setActiveFilterId(filter.id);
    fetchProducts(filter.query);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setActiveFilterId('search');
      fetchProducts(searchQuery.trim());
    }
  };

  const renderProduct = ({ item }) => {
    const imageUrl = item.Images?.Primary?.Large?.URL || item.Images?.Primary?.URL;
    const title = item.ItemInfo?.Title?.DisplayValue || item.Title || 'Product';
    const priceObj = item.Offers?.Listings?.[0]?.Price;
    const formatPrice = (priceObj) => {
      if (!priceObj?.Amount) return '';
      return `₹${(priceObj.Amount / 100).toFixed(0)}`;
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
        <View className="flex-row">
          <FlatList
            horizontal
            data={FILTERS}
            keyExtractor={item => item.id}
            showsHorizontalScrollIndicator={false}
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
            <TouchableOpacity onPress={() => fetchProducts(searchQuery || FILTERS[0].query)} className="mt-4 border-b border-black">
              <Text className="text-black font-bold">RELOAD</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={products}
            renderItem={renderProduct}
            keyExtractor={(item, index) => item.ASIN || index.toString()}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 20, paddingBottom: 100 }}
            columnWrapperStyle={{ justifyContent: 'space-between' }}
          />
        )}
      </View>
    </View>
  );
};

export default ProductsScreen;
