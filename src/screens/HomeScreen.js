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
  // const { isDark } = require('../context/ThemeContext').useTheme();
  const isDark = false;
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [personalizedProducts, setPersonalizedProducts] = useState([]);
  const [recentClicks, setRecentClicks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('');
  const [activeTab, setActiveTab] = useState('For You');

  const fetchData = async () => {
    try {
      // Fetch Banners
      const bannersRes = await apiCall('/api/banners');
      if (bannersRes.ok && bannersRes.data.success) {
        setBanners(bannersRes.data.data);
      }

      // Fetch Categories
      const categoriesRes = await apiCall('/api/admin/categories');
      if (categoriesRes.ok && categoriesRes.data.success) {
        const allCats = categoriesRes.data.data.categories || [];
        const activeCats = allCats.filter(c => c.status === 'active');
        setCategories(activeCats);
      }

      // Fetch Personalized Products (Suggestions)
      const personalizedRes = await apiCall('/api/products/personalized');
      if (personalizedRes.ok && personalizedRes.data.success) {
        setPersonalizedProducts(personalizedRes.data.data?.SearchResult?.Items || []);
      }

      // Fetch Recent Clicks (Actual History)
      const clicksRes = await apiCall('/api/analytics/my-clicks');
      if (clicksRes.ok && clicksRes.data.success) {
        const historyProducts = clicksRes.data.data.map(click => ({
          ASIN: click.asin,
          ItemInfo: { Title: { DisplayValue: click.productName } },
          Images: { Primary: { Large: { URL: click.imageUrl } } },
          DetailPageURL: click.productUrl,
        }));
        setRecentClicks(historyProducts);
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

  const renderSearchHeader = () => (
    <View style={styles.topContainer}>
      <View style={styles.searchBarWrapper}>
        <TouchableOpacity
          style={styles.searchBar}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('Products', { focusSearch: true })}
        >
          <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
          <Text style={styles.searchText}>Search products...</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
        {[
          { name: 'For You', icon: 'shopping-bag' },
          ...categories.map(cat => ({
            name: cat.name,
            icon: cat.amazonSearchIndex === 'Electronics' ? 'smartphone' :
              cat.amazonSearchIndex === 'Fashion' ? 'checkroom' :
                cat.amazonSearchIndex === 'Automotive' ? 'directions-car' :
                  cat.amazonSearchIndex === 'Appliances' ? 'tv' :
                    cat.amazonSearchIndex === 'Beauty' ? 'spa' : 'grid-view'
          }))
        ].map((tab, i) => (
          <TouchableOpacity
            key={i}
            style={styles.tabItem}
            onPress={() => setActiveTab(tab.name)}
          >
            <View style={[styles.tabIconContainer, activeTab === tab.name && styles.activeTabIcon]}>
              <Icon name={tab.icon} size={24} color={activeTab === tab.name ? "#2B3990" : "#fff"} />
            </View>
            <Text numberOfLines={1} style={[styles.tabText, activeTab === tab.name && styles.activeTabText]}>{tab.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  if (loading) {
    return (
      <CustomLoader text="Loading fresh finds..." />
    );
  }

  // Filter content based on active tab
  const filteredCategories = activeTab === 'For You'
    ? [] // For You shows special rows
    : categories.filter(c => c.name.toLowerCase().includes(activeTab.toLowerCase()) || (c.amazonSearchIndex || '').toLowerCase().includes(activeTab.toLowerCase()));

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: '#2B3990' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#2B3990" />

      {renderSearchHeader()}

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: '#fff' }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2B3990', '#76BA1B']} tintColor='#2B3990' />
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Banners Section */}
        {banners.length > 0 && (
          <BannerCarousel banners={banners} />
        )}

        {/* Categories Section */}
        <View style={styles.categoriesContainer}>
          {activeTab === 'For You' && (
            <>
              {recentClicks.length > 0 && (
                <CategoryRow
                  category={{
                    name: 'Recently Viewed',
                    _id: 'recent-clicks',
                    amazonSearchIndex: 'All'
                  }}
                  initialProducts={recentClicks}
                />
              )}

              {personalizedProducts.length > 0 && (
                <CategoryRow
                  category={{
                    name: 'Recommended for You',
                    _id: 'personalized',
                    amazonSearchIndex: 'All'
                  }}
                  initialProducts={personalizedProducts}
                />
              )}

              {/* Show all categories */}
              {categories.map((category) => (
                <CategoryRow key={category._id} category={category} />
              ))}
            </>
          )}

          {activeTab !== 'For You' && filteredCategories.map((category) => (
            <CategoryRow key={category._id} category={category} />
          ))}

          {activeTab !== 'For You' && filteredCategories.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No {activeTab} categories found</Text>
            </View>
          )}
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
  topContainer: {
    backgroundColor: '#2B3990', // Brand blue
    paddingTop: 8,
    paddingBottom: 16,
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchBar: {
    flex: 1,
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchText: {
    flex: 1,
    color: '#666',
    fontSize: 16,
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scanButton: {
    marginLeft: 12,
    padding: 8,
  },
  tabsRow: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  tabItem: {
    alignItems: 'center',
    marginRight: 24,
    width: 65,
  },
  tabIconContainer: {
    width: 55,
    height: 55,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeTabIcon: {
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  tabText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
    textAlign: 'center',
  },
  activeTabText: {
    fontWeight: '700',
    opacity: 1,
  },
  categoriesContainer: {
    marginTop: 12,
  },
  emptyState: {
    padding: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default HomeScreen;
