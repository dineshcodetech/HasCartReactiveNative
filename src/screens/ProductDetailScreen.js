import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Share,
  Dimensions,
  Linking,
  StatusBar,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiCall, trackProductClick } from '../services/api';
import Icon from '../components/Icon';
import CustomLoader from '../components/CustomLoader';
import { IconNames } from '../config/icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ProductDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { isDark } = require('../context/ThemeContext').useTheme();
  const { asin, product } = route.params || {};

  const [productDetail, setProductDetail] = useState(product || null);
  const [loading, setLoading] = useState(!product);
  const [error, setError] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showAllFeatures, setShowAllFeatures] = useState(false);

  const imageScrollRef = useRef(null);

  useEffect(() => {
    if (!product && asin) {
      fetchProductDetails();
    }
  }, [asin]);

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
      else if (item.Images.Primary.Small?.URL) images.push(item.Images.Primary.Small.URL);
    }
    if (item?.Images?.Variants) {
      item.Images.Variants.forEach((variant) => {
        const url = variant.Large?.URL || variant.Medium?.URL || variant.Small?.URL;
        if (url && !images.includes(url)) {
          images.push(url);
        }
      });
    }
    return images;
  };

  const getProductTitle = (item) => {
    return item?.ItemInfo?.Title?.DisplayValue || item?.Title || 'Product';
  };

  const getBrand = (item) => {
    return item?.ItemInfo?.ByLineInfo?.Brand?.DisplayValue || null;
  };

  const getPriceInfo = (item) => {
    const listing = item?.Offers?.Listings?.[0];
    if (!listing?.Price) return null;

    const price = listing.Price;
    return {
      amount: price.Amount,
      displayAmount: price.DisplayAmount || `₹${price.Amount?.toFixed(0)}`,
      savings: price.Savings ? {
        amount: price.Savings.Amount,
        displayAmount: price.Savings.DisplayAmount,
        percentage: price.Savings.Percentage,
      } : null,
      originalPrice: price.Savings ? price.Amount + price.Savings.Amount : null,
    };
  };

  const getFeatures = (item) => {
    return item?.ItemInfo?.Features?.DisplayValues || [];
  };

  const getProductInfo = (item) => {
    const productInfo = item?.ItemInfo?.ProductInfo || {};
    return {
      color: productInfo.Color?.DisplayValue,
      size: productInfo.Size?.DisplayValue,
      weight: productInfo.ItemDimensions?.Weight?.DisplayValue,
      unit: productInfo.ItemDimensions?.Weight?.Unit,
      releaseDate: productInfo.ReleaseDate?.DisplayValue,
    };
  };

  const openAmazonLink = async () => {
    const url = productDetail?.DetailPageURL || `https://www.amazon.in/dp/${asin}`;

    console.log('[ProductDetail] Opening Amazon link:', url);

    try {
      // Debug: List all keys in AsyncStorage
      const allKeys = await AsyncStorage.getAllKeys();
      console.log('[ProductDetail] All AsyncStorage keys:', allKeys);

      const token = await AsyncStorage.getItem('authToken');
      console.log('[ProductDetail] Raw token value:', token);
      console.log('[ProductDetail] User token:', token ? 'Found' : 'Not found');

      if (token) {
        const title = getProductTitle(productDetail);
        const priceInfo = getPriceInfo(productDetail);
        const allImages = getAllProductImages(productDetail);

        const clickData = {
          asin: asin,
          productName: title,
          category: productDetail?.BrowseNodeInfo?.BrowseNodes?.[0]?.DisplayName || 'All',
          price: priceInfo?.amount || 0,
          imageUrl: allImages[0] || '',
          productUrl: url,
        };

        console.log('[ProductDetail] Tracking click with data:', JSON.stringify(clickData));

        const response = await trackProductClick(clickData, token);
        console.log('[ProductDetail] Track click response:', JSON.stringify(response));

        if (!response.ok) {
          console.warn('[ProductDetail] Click tracking failed:', response.data?.message || 'Unknown error');
        }
      } else {
        console.log('[ProductDetail] Skipping click tracking - user not logged in');
      }
    } catch (err) {
      console.error('[ProductDetail] Click tracking error:', err.message);
    }

    // Always open the Amazon link regardless of tracking success
    console.log("5555555===================");

    Linking.openURL(url).catch((err) =>
      console.error('[ProductDetail] Error opening URL:', err)
    );
  };

  const handleShare = async () => {
    try {
      const title = getProductTitle(productDetail);
      const url = productDetail?.DetailPageURL || `https://www.amazon.in/dp/${asin}`;
      const message = `${title}\n\nCheck this out on HasCart: ${url}`;

      await Share.share({
        message,
        url, // iOS only
        title: 'Share Product', // Android only
      });
    } catch (error) {
      console.error('Error sharing product:', error.message);
    }
  };

  if (loading) {
    return (
      <CustomLoader text="Fetching details..." />
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name={IconNames.Help} size={48} color="#999" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchProductDetails}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!productDetail) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Product not found</Text>
      </View>
    );
  }

  const allImages = getAllProductImages(productDetail);
  const title = getProductTitle(productDetail);
  const brand = getBrand(productDetail);
  const priceInfo = getPriceInfo(productDetail);
  const features = getFeatures(productDetail);
  const productInfo = getProductInfo(productDetail);
  const condition = productDetail.Offers?.Listings?.[0]?.Condition?.Value;
  const isPrime = productDetail.Offers?.Listings?.[0]?.DeliveryInfo?.IsPrimeEligible;

  const displayedFeatures = showAllFeatures ? features : features.slice(0, 3);

  return (
    <View style={[styles.container, isDark && { backgroundColor: '#000' }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#000" : "#fff"} />

      {/* Header */}
      <View style={[styles.header, isDark && { backgroundColor: '#000' }]}>
        <TouchableOpacity style={[styles.headerButton, isDark && { backgroundColor: '#222' }]} onPress={() => navigation.goBack()}>
          <Icon name={IconNames.ArrowLeft} size={24} color={isDark ? "#fff" : "#000"} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.headerButton, isDark && { backgroundColor: '#222' }]} onPress={handleShare}>
          <Icon name={IconNames.Share} size={22} color={isDark ? "#fff" : "#000"} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Image Gallery */}
        <View style={styles.imageContainer}>
          {allImages.length > 0 ? (
            <>
              <ScrollView
                ref={imageScrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(event) => {
                  const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                  setSelectedImageIndex(index);
                }}
              >
                {allImages.map((url, index) => (
                  <Image
                    key={index}
                    source={{ uri: url }}
                    style={[styles.productImage, isDark && { backgroundColor: '#111' }]}
                    resizeMode="contain"
                  />
                ))}
              </ScrollView>

              {allImages.length > 1 && (
                <View style={styles.imageIndicators}>
                  {allImages.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.indicator,
                        index === selectedImageIndex && styles.indicatorActive,
                      ]}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={[styles.imagePlaceholder, isDark && { backgroundColor: '#111' }]}>
              <Icon name={IconNames.ProductPlaceholder} size={64} color={isDark ? "#555" : "#ccc"} />
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Brand */}
          {brand && (
            <Text style={styles.brand}>{brand.toUpperCase()}</Text>
          )}

          {/* Title */}
          <Text style={[styles.title, isDark && { color: '#fff' }]} numberOfLines={3}>{title}</Text>

          {/* Price Section */}
          {priceInfo && (
            <View style={styles.priceSection}>
              <View style={styles.priceRow}>
                <Text style={[styles.price, isDark && { color: '#fff' }]}>₹{priceInfo.amount?.toFixed(0)}</Text>

                {priceInfo.savings && (
                  <>
                    <Text style={styles.originalPrice}>
                      ₹{priceInfo.originalPrice?.toFixed(0)}
                    </Text>
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>
                        {priceInfo.savings.percentage}% OFF
                      </Text>
                    </View>
                  </>
                )}
              </View>

              {priceInfo.savings && (
                <Text style={styles.savingsText}>
                  You save ₹{priceInfo.savings.amount?.toFixed(0)}
                </Text>
              )}
            </View>
          )}

          {/* Badges */}
          <View style={styles.badgeContainer}>
            {condition && (
              <View style={[styles.badge, isDark && { backgroundColor: '#222' }]}>
                <Text style={[styles.badgeText, isDark && { color: '#ccc' }]}>{condition}</Text>
              </View>
            )}
            {isPrime && (
              <View style={[styles.badge, styles.primeBadge, isDark && { backgroundColor: '#0d2d46' }]}>
                <Text style={styles.primeText}>✓ Prime</Text>
              </View>
            )}
          </View>

          {/* Product Info Pills */}
          {(productInfo.color || productInfo.size) && (
            <View style={styles.infoPills}>
              {productInfo.color && (
                <View style={[styles.infoPill, isDark && { backgroundColor: '#111', borderColor: '#333' }]}>
                  <Text style={styles.infoPillLabel}>Color</Text>
                  <Text style={[styles.infoPillValue, isDark && { color: '#eee' }]}>{productInfo.color}</Text>
                </View>
              )}
              {productInfo.size && (
                <View style={[styles.infoPill, isDark && { backgroundColor: '#111', borderColor: '#333' }]}>
                  <Text style={styles.infoPillLabel}>Size</Text>
                  <Text style={[styles.infoPillValue, isDark && { color: '#eee' }]}>{productInfo.size}</Text>
                </View>
              )}
              {productInfo.weight && (
                <View style={[styles.infoPill, isDark && { backgroundColor: '#111', borderColor: '#333' }]}>
                  <Text style={styles.infoPillLabel}>Weight</Text>
                  <Text style={[styles.infoPillValue, isDark && { color: '#eee' }]}>
                    {productInfo.weight} {productInfo.unit || ''}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Features Section */}
          {features.length > 0 && (
            <View style={styles.featuresSection}>
              <Text style={[styles.sectionTitle, isDark && { color: '#fff' }]}>Highlights</Text>

              {displayedFeatures.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <View style={[styles.featureBullet, isDark && { backgroundColor: '#fff' }]} />
                  <Text style={[styles.featureText, isDark && { color: '#ccc' }]}>{feature}</Text>
                </View>
              ))}

              {features.length > 3 && (
                <TouchableOpacity
                  style={styles.showMoreButton}
                  onPress={() => setShowAllFeatures(!showAllFeatures)}
                >
                  <Text style={[styles.showMoreText, isDark && { color: '#fff' }]}>
                    {showAllFeatures ? 'Show Less' : `Show ${features.length - 3} More`}
                  </Text>
                  <Icon
                    name={showAllFeatures ? IconNames.ChevronUp : IconNames.ChevronDown}
                    size={16}
                    color={isDark ? "#fff" : "#000"}
                  />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Fixed Bottom CTA */}
      <View style={[styles.bottomCTA, isDark && { backgroundColor: '#000', borderTopColor: '#333' }]}>
        <TouchableOpacity style={[styles.buyButton, isDark && { backgroundColor: '#fff' }]} onPress={openAmazonLink}>
          <Text style={[styles.buyButtonText, isDark && { color: '#000' }]}>View on Amazon</Text>
          <Icon name={IconNames.ExternalLink} size={18} color={isDark ? "#000" : "#fff"} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: '#fff',
    zIndex: 10,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    letterSpacing: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#000',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    backgroundColor: '#fafafa',
  },
  productImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    gap: 6,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  indicatorActive: {
    backgroundColor: '#000',
    width: 20,
  },
  content: {
    padding: 24,
  },
  brand: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    letterSpacing: 2,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000',
    lineHeight: 30,
    marginBottom: 16,
  },
  priceSection: {
    marginBottom: 20,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
  },
  originalPrice: {
    fontSize: 18,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  discountText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2e7d32',
  },
  savingsText: {
    fontSize: 14,
    color: '#2e7d32',
    marginTop: 6,
    fontWeight: '500',
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  badge: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  primeBadge: {
    backgroundColor: '#e3f2fd',
  },
  primeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1565c0',
  },
  infoPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  infoPill: {
    backgroundColor: '#fafafa',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  infoPillLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoPillValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  featuresSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    marginBottom: 14,
    alignItems: 'flex-start',
  },
  featureBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#000',
    marginTop: 7,
    marginRight: 12,
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  bottomCTA: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  buyButton: {
    backgroundColor: '#000',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ProductDetailScreen;
