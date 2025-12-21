import React, { useRef, useState, useEffect } from 'react';
import { View, Image, Dimensions, ScrollView, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { getOptimizedImageSource } from '../utils/imageUtils';

const { width } = Dimensions.get('window');
const BANNER_HEIGHT = 200;

const BannerCarousel = ({ banners = [] }) => {
    // const { isDark } = require('../context/ThemeContext').useTheme();
    const isDark = false;
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollRef = useRef(null);

    if (!banners || banners.length === 0) {
        return null;
    }

    // Auto-scroll logic
    useEffect(() => {
        if (banners.length <= 1) return;

        const interval = setInterval(() => {
            const nextIndex = (activeIndex + 1) % banners.length;
            setActiveIndex(nextIndex);

            // Calculate offset: Card width is (width - 32) + 8 margin = width - 24 roughly?
            // Actually snapToInterval is {width - 32}.
            // Let's use the layout details from ScrollView or just approximate.
            // Best is to track exact offset if possible, but strict math works:
            // The item width including margin seems to be what we need.
            // width - 32 for card. margin 8. Total = ?
            // In the styles: slide width = width - 32. marginRight = 8.
            // So total span per item = (width - 32) + 8 = width - 24.
            const itemWidth = (width - 32) + 8;

            if (scrollRef.current) {
                scrollRef.current.scrollTo({
                    x: nextIndex * itemWidth,
                    animated: true,
                });
            }
        }, 5000); // 5 seconds

        return () => clearInterval(interval);
    }, [activeIndex, banners.length]);

    const handleScroll = (event) => {
        const slideSize = event.nativeEvent.layoutMeasurement.width;
        const index = event.nativeEvent.contentOffset.x / slideSize;
        const roundIndex = Math.round(index);
        // Only update if significantly changed to avoid fighting with auto-scroll state
        if (roundIndex !== activeIndex) {
            setActiveIndex(roundIndex);
        }
    };

    // Use the shared utility function for image optimization
    // This now uses the backend proxy for reliable Google Drive image loading

    return (
        <View style={styles.container}>
            <ScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                decelerationRate="fast"
                snapToInterval={width - 32} // Card width + margin
                snapToAlignment="center"
                contentContainerStyle={{ paddingHorizontal: 16 }} // Center active item
            >
                {banners.map((banner, index) => (
                    <TouchableOpacity
                        key={banner._id || index}
                        activeOpacity={0.9}
                        style={[styles.slide, isDark && { backgroundColor: '#111' }]}
                    >
                        <Image
                            source={getOptimizedImageSource(banner.imageUrl, 800)}
                            style={styles.image}
                            resizeMode="cover"
                        />
                        {/* Optional Overlay Title - Removed for cleaner look */}
                        {/* {banner.title && (
                            <View style={styles.textOverlay}>
                                <Text style={styles.titleText}>{banner.title}</Text>
                            </View>
                        )} */}
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Pagination Dots */}
            <View style={styles.pagination}>
                {banners.map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.dot,
                            { backgroundColor: index === activeIndex ? (isDark ? '#fff' : '#2B3990') : (isDark ? '#444' : '#E0E0E0') }
                        ]}
                    />
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 16,
        marginBottom: 8,
    },
    slide: {
        width: width - 32, // Full width minus padding
        height: BANNER_HEIGHT,
        borderRadius: 16,
        marginRight: 8, // Gap between items if we weren't paging strictly, but with paging helps spacing
        overflow: 'hidden',
        backgroundColor: '#fff',
        // Shadow for depth
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 12,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
    },
    textOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 12,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    titleText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default BannerCarousel;
