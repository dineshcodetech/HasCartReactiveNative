import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
import Icon from './Icon';
// import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

const FloatingItem = ({ icon, delay, duration, startX, isDark }) => {
    const slideAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animate = () => {
            slideAnim.setValue(0);
            fadeAnim.setValue(0);

            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 1,
                    duration: duration,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                    delay: delay,
                }),
                Animated.sequence([
                    Animated.timing(fadeAnim, {
                        toValue: 1,
                        duration: duration * 0.2, // Fade in quickly
                        useNativeDriver: true,
                        delay: delay,
                    }),
                    Animated.timing(fadeAnim, {
                        toValue: 1,
                        duration: duration * 0.5, // Stay visible
                        useNativeDriver: true,
                    }),
                    Animated.timing(fadeAnim, {
                        toValue: 0,
                        duration: duration * 0.3, // Fade out
                        useNativeDriver: true,
                    })
                ])
            ]).start(() => animate()); // Loop
        };

        animate();
    }, []);

    const translateY = slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [50, -100], // Float up from below center to above
    });

    const translateX = slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [startX, startX * 1.5], // Slight horizontal drift
    });

    const rotate = slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '45deg'],
    });

    const scale = slideAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0.5, 1, 0.8],
    });

    return (
        <Animated.View
            style={{
                position: 'absolute',
                transform: [
                    { translateY },
                    { translateX },
                    { rotate },
                    { scale }
                ],
                opacity: fadeAnim,
            }}
        >
            <View style={[styles.iconContainer, isDark && styles.iconContainerDark]}>
                <Icon name={icon} size={28} color={isDark ? '#fff' : '#000'} />
            </View>
        </Animated.View>
    );
};

const CustomLoader = ({ text = "Loading..." }) => {
    // const { isDark } = useTheme();
    const isDark = false;

    return (
        <View style={[styles.container, isDark && styles.containerDark]}>
            {/* Center Content */}
            <View style={styles.centerContainer}>
                <View style={styles.floatingArea}>
                    {/* Floating Items with different delays and positions */}
                    <FloatingItem
                        icon="shopping-bag"
                        delay={0}
                        duration={2000}
                        startX={-60}
                        isDark={isDark}
                    />
                    <FloatingItem
                        icon="checkroom"
                        delay={600}
                        duration={2200}
                        startX={60}
                        isDark={isDark}
                    />
                    <FloatingItem
                        icon="devices"
                        delay={1200}
                        duration={2400}
                        startX={-30}
                        isDark={isDark}
                    />
                    <FloatingItem
                        icon="watch"
                        delay={1800}
                        duration={2100}
                        startX={30}
                        isDark={isDark}
                    />
                </View>

                {/* Main Logo/Text */}
                <View style={styles.logoContainer}>
                    <Icon name="shopping-bag" size={50} color={isDark ? '#fff' : '#2B3990'} />
                    <Text style={[styles.logoText, { color: '#2B3990' }, isDark && styles.logoTextDark]}>HASCART</Text>
                </View>

                {/* Loading Text */}
                <Text style={[styles.loadingText, isDark && styles.loadingTextDark]}>{text}</Text>

            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    containerDark: {
        backgroundColor: '#000',
    },
    centerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    floatingArea: {
        height: 150,
        width: 200,
        alignItems: 'center',
        justifyContent: 'center',
        // backgroundColor: 'rgba(255,0,0,0.1)', // Debug
    },
    logoContainer: {
        alignItems: 'center',
        marginTop: 20,
    },
    logoText: {
        fontSize: 24,
        fontWeight: 'bold',
        letterSpacing: 4,
        color: '#000',
        marginTop: 10,
    },
    logoTextDark: {
        color: '#fff',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 14,
        color: '#888',
        fontWeight: '500',
        letterSpacing: 1,
    },
    loadingTextDark: {
        color: '#666',
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#f5f5f5',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 2,
    },
    iconContainerDark: {
        backgroundColor: '#222',
        borderWidth: 1,
        borderColor: '#333',
    }
});

export default CustomLoader;
