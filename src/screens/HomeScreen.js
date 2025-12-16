import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StatusBar,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { apiCall } from '../services/api';
import BannerCarousel from '../components/BannerCarousel';
import CategoryRow from '../components/CategoryRow';
import Icon from '../components/Icon';
import CustomLoader from '../components/CustomLoader';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HomeScreen = ({ navigation }) => {
  const { isDark } = require('../context/ThemeContext').useTheme();
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('');

  const fetchData = async () => {
    try {
      // Fetch Banners
      const bannersRes = await apiCall('/api/banners');
      if (bannersRes.ok && bannersRes.data.success) {
        setBanners(bannersRes.data.data);
      }

      // Fetch Categories
      // Using admin categories endpoint but strictly it should be a public endpoint. 
      // Assuming /api/admin/categories might be protected, but let's try. 
      // Ideally there should be a public /api/categories. checking permissions...
      // The implementation plan used /api/admin/categories. If it fails due to 401, we might need to fallback or fix backend.
      // Wait, categoryRoutes has router.get('/', getAllCategories) as Public! 
      // And in server.js: app.use('/api/admin/categories', categoryRoutes);
      // So /api/admin/categories/ is actually public for GET. Confusing naming but works.
      const categoriesRes = await apiCall('/api/admin/categories');
      if (categoriesRes.ok && categoriesRes.data.success) {
        // Response structure is data.data.categories
        const allCats = categoriesRes.data.data.categories || [];
        // Filter only active categories
        const activeCats = allCats.filter(c => c.status === 'active');
        setCategories(activeCats);
      }

      // Get user name
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsed = JSON.parse(userData);
        setUserName(parsed.name?.split(' ')[0] || '');
      }

    } catch (error) {
      console.error('Home fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  const renderHeader = () => (
    <View style={[styles.header, isDark && { backgroundColor: '#000' }]}>
      <View>
        <Text style={[styles.greeting, isDark && { color: '#bbb' }]}>Hello, {userName || 'Guest'}</Text>
        <Text style={[styles.appTitle, isDark && { color: '#fff' }]}>HasCart Premium</Text>
      </View>
      <TouchableOpacity
        style={styles.cartButton}
        onPress={() => navigation.navigate('Products')} // Or Cart if it existed
      >
        <Icon name="shopping-bag" size={24} color={isDark ? "#fff" : "#000"} />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <CustomLoader text="Loading fresh finds..." />
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, isDark && { backgroundColor: '#000' }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#000" : "#fff"} />

      {renderHeader()}

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[isDark ? '#fff' : '#4CAF50']} tintColor={isDark ? '#fff' : '#4CAF50'} />
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Banners Section */}
        {banners.length > 0 && (
          <BannerCarousel banners={banners} />
        )}

        {/* Categories Section */}
        <View style={styles.categoriesContainer}>
          {categories.map((category) => (
            <CategoryRow key={category._id} category={category} />
          ))}
        </View>

        {categories.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No categories available</Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  greeting: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    letterSpacing: 0.5,
  },
  cartButton: {
    padding: 8,
  },
  categoriesContainer: {
    marginTop: 24,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  },
});

export default HomeScreen;
