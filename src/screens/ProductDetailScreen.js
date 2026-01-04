import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Share,
  Dimensions,
  Linking,
  StatusBar,
  Alert,
  Clipboard,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiCall, trackProductClick, WEB_BASE_URL } from '../services/api';

import Icon from '../components/Icon';
import CustomLoader from '../components/CustomLoader';
import { IconNames } from '../config/icons';
import { getOptimizedImageSource } from '../utils/imageUtils';
// import { useTheme } from '../context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ProductDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  // const { isDark } = useTheme();
  const isDark = false;
  const { asin, product, categoryContext } = route.params || {};

  const [productDetail, setProductDetail] = useState(product || null);
  const [loading, setLoading] = useState(!product);
  const [error, setError] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const [user, setUser] = useState(null);

  const imageScrollRef = useRef(null);

  useEffect(() => {
    loadUser();
    if (!product && asin) {
      fetchProductDetails();
    }
  }, [asin]);

  const loadUser = async () => {
    const userData = await AsyncStorage.getItem('userData');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  };

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const payload = {
        ItemIds: [asin],
        ItemIdType: 'ASIN',
        PartnerTag: 'hasdeals9966-21',
        PartnerType: 'Associates',
        Marketplace: 'www.amazon.in',
        Resources: [
          'Images.Primary.Small',
          'Images.Primary.Medium',
          'Images.Primary.Large',
          'Images.Variants.Small',
          'Images.Variants.Medium',
          'Images.Variants.Large',
          'ItemInfo.Title',
          'ItemInfo.Features',
          'ItemInfo.ContentInfo',
          'ItemInfo.TechnicalInfo',
          'ItemInfo.ProductInfo',
          'ItemInfo.ByLineInfo',
          'ItemInfo.ByLineInfo',
          'ItemInfo.Classifications',
          'BrowseNodeInfo.BrowseNodes',
          'Offers.Listings.Price',
          'Offers.Listings.Condition',
          'Offers.Listings.DeliveryInfo.IsPrimeEligible',
        ],
      };

      const response = await apiCall('/api/amazon/items', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (response.ok && response.data.success) {
        const items = response.data.ItemsResult?.Items || [];
        if (items.length > 0) {
          setProductDetail(items[0]);
        } else {
          setError('Product details not found');
        }
      } else {
        setError(
          response.data?.message ||
          response.data?.error ||
          'Failed to fetch product details'
        );
      }
    } catch (err) {
      console.error('Error fetching product details:', err);
      setError('Failed to load product details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getAllProductImages = (item) => {
    const images = [];
    if (item?.Images?.Primary) {
      if (item.Images.Primary.Large?.URL) images.push(item.Images.Primary.Large.URL);
      else if (item.Images.Primary.Medium?.URL) images.push(item.Images.Primary.Medium.URL);
    }
    if (item?.Images?.Variants) {
      item.Images.Variants.forEach((variant) => {
        const url = variant.Large?.URL || variant.Medium?.URL;
        if (url && !images.includes(url)) {
          images.push(url);
        }
      });
    }
    return images;
  };

  const getProductTitle = (item) => item?.ItemInfo?.Title?.DisplayValue || item?.Title || 'Product';
  const getBrand = (item) => item?.ItemInfo?.ByLineInfo?.Brand?.DisplayValue || null;
  const getFeatures = (item) => item?.ItemInfo?.Features?.DisplayValues || [];

  const getPriceInfo = (item) => {
    const listing = item?.Offers?.Listings?.[0];
    if (!listing?.Price) return null;
    const price = listing.Price;
    return {
      amount: price.Amount,
      displayAmount: price.DisplayAmount || `₹${price.Amount?.toFixed(0)}`,
      savings: price.Savings ? {
        percentage: price.Savings.Percentage,
        amount: price.Savings.Amount
      } : null,
      originalPrice: price.Savings ? price.Amount + price.Savings.Amount : null,
    };
  };

  const openAmazonLink = async () => {
    const url = productDetail?.DetailPageURL || `https://www.amazon.in/dp/${asin}`;
    console.log('[ProductDetail] Opening Amazon link:', url);

    // Track click before opening URL
    try {
      const token = await AsyncStorage.getItem('authToken');
      console.log("here", productDetail);

      if (productDetail) {
        // PRIORITY 1: Use specific category name from navigation context (matches our DB exactly)
        // PRIORITY 2: Use Amazon Search Index from context
        // PRIORITY 3: Fall back to product's Amazon metadata
        const detectedCategory = categoryContext?.name ||
          categoryContext?.amazonSearchIndex ||
          productDetail.BrowseNodeInfo?.BrowseNodes?.[0]?.DisplayName ||
          productDetail.ItemInfo?.Classifications?.ProductGroup?.DisplayValue ||
          'Unknown';

        const productData = {
          asin: asin || productDetail.ASIN,
          productName: getProductTitle(productDetail),
          category: detectedCategory,
          price: priceInfo?.amount || 0,
          imageUrl: allImages[0] || '',
          productUrl: url,
        };
        console.log('[ProductDetail] Tracking click with category:', detectedCategory);
        console.log('[ProductDetail] Category source:', categoryContext ? 'Navigation Context' : 'Product Metadata');
        console.log('[ProductDetail] With token:', token ? 'YES' : 'NO');
        await trackProductClick(productData, token);

      }
    } catch (trackErr) {
      console.log('Click tracking failed:', trackErr);
    }

    Linking.openURL(url).catch((err) => console.error('[ProductDetail] Error opening URL:', err));
  };

  const handleShare = async () => {
    try {
      const title = getProductTitle(productDetail);
      const referralCode = user?.referralCode || '';
      const agentId = user?._id || user?.id || ''; // Get the agent's ID (handle both _id and id)

      console.log('[ProductDetail] Sharing with attribution:', { referralCode, agentId });
      let shareUrl = `${WEB_BASE_URL}/product/${asin || productDetail?.ASIN}`;
      const params = [];
      if (referralCode) params.push(`ref=${referralCode}`);
      if (agentId) params.push(`agentId=${agentId}`); // Redundant agent ID

      if (params.length > 0) {
        shareUrl += `?${params.join('&')}`;
      }

      const message = `${title}\n\nCheck this out on HasCart: ${shareUrl}`;

      Alert.alert(
        'Share Product',
        'Share this product (Sales will be attributed to you).',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Copy Link',
            onPress: () => {
              Clipboard.setString(shareUrl);
              Alert.alert('Copied!', 'link copied to clipboard.');
            }
          },
          {
            text: 'Share',
            onPress: async () => {
              try {
                await Share.share({
                  message,
                  url: shareUrl, // iOS
                  title: 'HasCart Product'
                });
              } catch (e) { console.error('Share error:', e); }
            }
          }
        ]
      );
    } catch (error) { console.error('Error sharing:', error); }
  };

  if (loading) return <CustomLoader text="Fetching details..." />;

  if (error || !productDetail) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Product not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchProductDetails}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const allImages = getAllProductImages(productDetail);
  const title = getProductTitle(productDetail);
  const priceInfo = getPriceInfo(productDetail);
  const features = getFeatures(productDetail);
  const isPrime = productDetail?.Offers?.Listings?.[0]?.DeliveryInfo?.IsPrimeEligible;
  const promotions = productDetail?.Offers?.Listings?.[0]?.Promotions || [];
  const displayedFeatures = showAllFeatures ? features : features.slice(0, 4);

  return (
    <View style={[styles.container, isDark && { backgroundColor: '#000' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#2B3990" />

      {/* Header - Brand Blue Background */}
      <View style={[styles.header, isDark && { backgroundColor: '#1A237E' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name={IconNames.ArrowLeft} size={28} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          {/* <Icon name={IconNames.Search} size={26} color="#fff" style={{ marginRight: 16 }} /> */}
          {(user?.role === 'agent' || user?.role === 'admin') ? (
            <TouchableOpacity onPress={handleShare}>
              <Icon name="share" size={26} color="#fff" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* Image Gallery */}
        <View style={[styles.imageContainer, isDark && { backgroundColor: '#111' }]}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => setSelectedImageIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH))}
          >
            {allImages.map((url, index) => (
              <View key={index} style={{ width: SCREEN_WIDTH, alignItems: 'center', padding: 20 }}>
                <Image source={getOptimizedImageSource(url, 800)} style={styles.productImage} resizeMode="contain" />
              </View>
            ))}
          </ScrollView>
          {/* Thumbnails/dots */}
          <View style={styles.pagination}>
            {allImages.map((_, i) => (
              <View key={i} style={[styles.dot, i === selectedImageIndex && styles.activeDot]} />
            ))}
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Title */}
          <Text style={[styles.title, isDark && { color: '#fff' }]}>{title}</Text>

          {/* Price */}
          {priceInfo && (
            <View style={styles.priceContainer}>
              <Text style={[styles.price, isDark && { color: '#fff' }]}>
                ₹{priceInfo.amount?.toLocaleString('en-IN')}
              </Text>
              {priceInfo.originalPrice && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 10 }}>
                  <Text style={styles.mrp}>₹{priceInfo.originalPrice?.toLocaleString('en-IN')}</Text>
                  <View style={styles.discountTag}>
                    <Text style={styles.discountText}>{priceInfo.savings?.percentage}% OFF</Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Delivery Info - Dynamic */}
          <View style={styles.deliveryInfo}>
            {isPrime && (
              <View style={styles.checkItem}>
                <Icon name="check-circle" size={16} color="#76BA1B" />
                <Text style={[styles.checkText, isDark && { color: '#ccc' }]}> Free Delivery (Prime)</Text>
              </View>
            )}
            <View style={styles.checkItem}>
              <Icon name="check-circle" size={16} color="#76BA1B" />
              <Text style={[styles.checkText, isDark && { color: '#ccc' }]}> Inclusive of all taxes</Text>
            </View>
          </View>

          {/* Key Features Section */}
          {features.length > 0 && (
            <View style={styles.featuresContainer}>
              <View style={styles.featuresHeader}>
                <Icon name="memory" size={20} color="#fff" />
                <Text style={styles.featuresTitle}> Key Features:</Text>
              </View>
              <View style={[styles.featuresBody, isDark && { backgroundColor: '#1a1a1a' }]}>
                {displayedFeatures.map((feat, i) => (
                  <View key={i} style={styles.featureRow}>
                    <Icon name="check" size={16} color="#76BA1B" style={{ marginTop: 2 }} />
                    <Text style={[styles.featureText, isDark && { color: '#ddd' }]}>{feat}</Text>
                  </View>
                ))}

                {features.length > 4 && (
                  <TouchableOpacity
                    onPress={() => setShowAllFeatures(!showAllFeatures)}
                    style={styles.viewMoreFeatures}
                  >
                    <Text style={styles.viewMoreText}>
                      {showAllFeatures ? 'Show Less' : `View ${features.length - 4} More Features`}
                    </Text>
                    <Icon
                      name={showAllFeatures ? "expand-less" : "expand-more"}
                      size={20}
                      color="#2B3990"
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Offers Section - Dynamic */}
          {promotions.length > 0 && (
            <View style={[styles.offersContainer, isDark && { backgroundColor: '#111', borderColor: '#333' }]}>
              <View style={styles.offersHeader}>
                <Icon name="local-offer" size={18} color="#76BA1B" />
                <Text style={[styles.offersTitle, isDark && { color: '#fff' }]}> Offers</Text>
              </View>
              {promotions.map((promo, idx) => (
                <View key={idx} style={styles.offerItem}>
                  <Icon name="credit-card" size={16} color="#2B3990" />
                  <Text style={[styles.offerText, isDark && { color: '#ccc' }]}> {promo.Description || promo.DiscountAmount}</Text>
                </View>
              ))}
              <TouchableOpacity>
                <Text style={styles.viewAllOffers}>View All Offers {'>'}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Trust Banner */}
          <View style={styles.trustBanner}>
            <Text style={styles.trustText}>🛡️ 100% Genuine & Secure | Easy Returns</Text>
          </View>

        </View>
      </ScrollView>

      {/* Fixed Bottom CTA */}
      <View style={[styles.bottomBar, isDark && { backgroundColor: '#000', borderTopColor: '#333' }]}>
        <TouchableOpacity style={styles.amazonButton} onPress={openAmazonLink}>
          <Text style={styles.amazonButtonText}>View on Amazon  {'>'}</Text>
        </TouchableOpacity>
        <Text style={styles.redirectText}>* You will be redirected to Amazon.in</Text>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 12, paddingBottom: 15, paddingHorizontal: 16,
    backgroundColor: '#2B3990',
  },
  headerRight: { flexDirection: 'row' },
  imageContainer: { width: SCREEN_WIDTH, height: 320, backgroundColor: '#fff', paddingVertical: 10 },
  productImage: { width: SCREEN_WIDTH - 40, height: 280 },
  pagination: { flexDirection: 'row', justifyContent: 'center', marginTop: -20 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ddd', marginHorizontal: 4 },
  activeDot: { backgroundColor: '#2B3990', width: 24 },
  content: { padding: 16 },
  title: { fontSize: 18, color: '#000', fontWeight: 'bold', lineHeight: 26, marginBottom: 12 },
  priceContainer: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 8 },
  price: { fontSize: 28, fontWeight: 'bold', color: '#000' },
  mrp: { fontSize: 16, color: '#777', textDecorationLine: 'line-through' },
  discountTag: { backgroundColor: '#76BA1B', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
  discountText: { fontSize: 12, fontWeight: 'bold', color: '#fff' },
  deliveryInfo: { marginBottom: 20 },
  checkItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  checkText: { fontSize: 13, color: '#333', marginLeft: 6 },
  featuresContainer: { borderRadius: 8, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: '#2B3990' },
  featuresHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2B3990', padding: 10 },
  featuresTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginLeft: 8 },
  featuresBody: { padding: 12, backgroundColor: '#f0f4ff' },
  featureRow: { flexDirection: 'row', marginBottom: 8 },
  featureText: { fontSize: 13, color: '#333', marginLeft: 8, flex: 1, lineHeight: 18 },
  offersContainer: { padding: 12, borderWidth: 1, borderColor: '#eee', borderRadius: 8, marginBottom: 20 },
  offersHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  offersTitle: { fontSize: 16, fontWeight: 'bold', color: '#000', marginLeft: 6 },
  offerItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  offerText: { fontSize: 13, color: '#444', marginLeft: 8 },
  viewAllOffers: { fontSize: 12, color: '#007bff', marginTop: 4, fontWeight: 'bold' },
  trustBanner: { backgroundColor: '#f5f5f5', padding: 10, borderRadius: 4, alignItems: 'center' },
  trustText: { fontSize: 10, color: '#666' },
  bottomBar: { padding: 16, borderTopWidth: 1, borderTopColor: '#f0f0f0', backgroundColor: '#fff' },
  amazonButton: {
    backgroundColor: '#76BA1B', borderRadius: 25, paddingVertical: 14,
    alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, elevation: 3
  },
  amazonButtonText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  redirectText: { textAlign: 'center', fontSize: 10, color: '#999', marginTop: 8 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { marginBottom: 20 },
  retryButton: { backgroundColor: '#2B3990', padding: 10, borderRadius: 5 },
  retryButtonText: { color: '#fff' },
  viewMoreFeatures: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  viewMoreText: {
    fontSize: 13,
    color: '#2B3990',
    fontWeight: 'bold',
    marginRight: 4,
  },
});

export default ProductDetailScreen;
