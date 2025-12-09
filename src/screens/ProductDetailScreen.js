import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Dimensions,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { apiCall } from '../services/api';
import Icon from '../components/Icon';
import { IconNames } from '../config/icons';

const ProductDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { asin, product } = route.params || {};

  const [productDetail, setProductDetail] = useState(product || null);
  const [loading, setLoading] = useState(!product);
  const [error, setError] = useState(null);

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

    // Get Primary images (all sizes)
    if (item?.Images?.Primary) {
      if (item.Images.Primary.Large?.URL) images.push(item.Images.Primary.Large.URL);
      if (item.Images.Primary.Medium?.URL) images.push(item.Images.Primary.Medium.URL);
      if (item.Images.Primary.Small?.URL) images.push(item.Images.Primary.Small.URL);
      if (item.Images.Primary.URL && !images.includes(item.Images.Primary.URL)) {
        images.push(item.Images.Primary.URL);
      }
    }

    // Get Variant images
    if (item?.Images?.Variants) {
      item.Images.Variants.forEach((variant) => {
        if (variant.Large?.URL && !images.includes(variant.Large.URL)) {
          images.push(variant.Large.URL);
        } else if (variant.Medium?.URL && !images.includes(variant.Medium.URL)) {
          images.push(variant.Medium.URL);
        } else if (variant.Small?.URL && !images.includes(variant.Small.URL)) {
          images.push(variant.Small.URL);
        }
      });
    }

    // Remove duplicates and return
    return [...new Set(images)];
  };

  const getProductImage = (item) => {
    const allImages = getAllProductImages(item);
    return allImages.length > 0 ? allImages[0] : null;
  };

  const getProductTitle = (item) => {
    return item?.ItemInfo?.Title?.DisplayValue || item?.Title || 'Product';
  };

  const formatPrice = (priceObj) => {
    if (!priceObj) return 'Price not available';
    const amount = priceObj.Amount || priceObj.amount;
    // const currency = priceObj.Currency || priceObj.currency || 'INR'; // Ignore currency code for now
    if (amount) {
      return `₹${(amount / 100).toFixed(2)}`;
    }
    return 'Price not available';
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

  const openAmazonLink = () => {
    const url = productDetail?.DetailPageURL || `https://www.amazon.in/dp/${asin}`;
    Linking.openURL(url).catch((err) =>
      console.error('Error opening URL:', err)
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading product details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name={IconNames.Help} size={48} color="#999" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchProductDetails}>
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
  const imageUrl = allImages.length > 0 ? allImages[0] : null;
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const imageScrollRef = React.useRef(null);
  const thumbnailScrollRef = React.useRef(null);
  const title = getProductTitle(productDetail);
  const price = formatPrice(productDetail.Offers?.Listings?.[0]?.Price);
  const features = getFeatures(productDetail);
  const productInfo = getProductInfo(productDetail);
  const condition = productDetail.Offers?.Listings?.[0]?.Condition?.Value;
  const isPrime = productDetail.Offers?.Listings?.[0]?.DeliveryInfo?.IsPrimeEligible;

  const screenWidth = Dimensions.get('window').width;

  const scrollToImage = (index) => {
    setSelectedImageIndex(index);
    if (imageScrollRef.current) {
      imageScrollRef.current.scrollTo({
        x: index * screenWidth,
        animated: true,
      });
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name={IconNames.ArrowLeft} size={24} color="#fff" style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.imageContainer}>
        {allImages.length > 0 ? (
          <>
            <ScrollView
              ref={imageScrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(event) => {
                const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
                setSelectedImageIndex(index);
              }}
              style={styles.imageScrollView}>
              {allImages.map((url, index) => (
                <Image
                  key={index}
                  source={{ uri: url }}
                  style={[styles.productImage, { width: screenWidth }]}
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
            {allImages.length > 1 && (
              <View style={styles.imageThumbnails}>
                <ScrollView
                  ref={thumbnailScrollRef}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.thumbnailContainer}>
                  {allImages.map((url, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => scrollToImage(index)}
                      style={[
                        styles.thumbnail,
                        index === selectedImageIndex && styles.thumbnailActive,
                      ]}>
                      <Image
                        source={{ uri: url }}
                        style={styles.thumbnailImage}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </>
        ) : (
          <View style={styles.imagePlaceholder}>
            <Icon name={IconNames.ProductPlaceholder} size={64} color="#999" />
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>

        <View style={styles.priceContainer}>
          <Text style={styles.price}>{price}</Text>
          {productDetail.Offers?.Listings?.[0]?.Price?.Savings && (
            <View style={styles.savingsContainer}>
              <Text style={styles.savings}>
                Save {productDetail.Offers.Listings[0].Price.Savings.DisplayAmount}
              </Text>
            </View>
          )}
        </View>

        {condition && (
          <View style={styles.badgeContainer}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{condition}</Text>
            </View>
            {isPrime && (
              <View style={[styles.badge, styles.primeBadge]}>
                <Text style={styles.badgeText}>Prime</Text>
              </View>
            )}
          </View>
        )}

        {productInfo.color && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Color:</Text>
            <Text style={styles.infoValue}>{productInfo.color}</Text>
          </View>
        )}

        {productInfo.size && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Size:</Text>
            <Text style={styles.infoValue}>{productInfo.size}</Text>
          </View>
        )}

        {productInfo.weight && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Weight:</Text>
            <Text style={styles.infoValue}>
              {productInfo.weight} {productInfo.unit || ''}
            </Text>
          </View>
        )}

        {features.length > 0 && (
          <View style={styles.featuresContainer}>
            <Text style={styles.sectionTitle}>Features</Text>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Icon name={IconNames.Add} size={16} color="#4CAF50" style={styles.featureIcon} />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.buyButton} onPress={openAmazonLink}>
          <Icon name={IconNames.ShoppingCart} size={20} color="#fff" style={styles.buyIcon} />
          <Text style={styles.buyButtonText}>View on Amazon</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4CAF50',
    padding: 15,
    paddingTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 5,
  },
  backIcon: {
    color: '#fff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 34,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  imageContainer: {
    width: '100%',
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  imageScrollView: {
    height: 350,
  },
  productImage: {
    height: 350,
  },
  imagePlaceholder: {
    width: '100%',
    height: 350,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  imageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
  },
  indicatorActive: {
    backgroundColor: '#4CAF50',
    width: 24,
  },
  imageThumbnails: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
  },
  thumbnailContainer: {
    paddingHorizontal: 5,
  },
  thumbnail: {
    width: 60,
    height: 60,
    marginRight: 10,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  thumbnailActive: {
    borderColor: '#4CAF50',
    borderWidth: 3,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 15,
    lineHeight: 30,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    color: '#4CAF50',
    marginRight: 10,
  },
  savingsContainer: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  savings: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
  },
  badgeContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  badge: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  primeBadge: {
    backgroundColor: '#FFD700',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    width: 80,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  featuresContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 15,
  },
  featureItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  featureIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  buyButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buyIcon: {
    marginRight: 8,
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default ProductDetailScreen;

