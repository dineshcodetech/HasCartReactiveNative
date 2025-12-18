import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, ActivityIndicator, View, Text, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import './global.css';

import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import CategoriesScreen from './src/screens/CategoriesScreen';
import ProductsScreen from './src/screens/ProductsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ProductDetailScreen from './src/screens/ProductDetailScreen';
import AboutUsScreen from './src/screens/AboutUsScreen';
import SupportScreen from './src/screens/SupportScreen';
import Icon from './src/components/Icon';
import { IconNames } from './src/config/icons';
// import { ThemeProvider } from './src/context/ThemeContext';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TabBarIcon = ({ label, focused }) => {
  const iconMap = {
    Home: IconNames.Home,
    Categories: 'grid-view', // Valid MaterialIcon
    Products: IconNames.Products,
    Profile: IconNames.Profile,
  };

  return (
    <Icon
      name={iconMap[label] || label}
      size={24}
      color={focused ? '#2B3990' : '#999'}
    />
  );
};

// Main Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        // We can access theme here if we move MainTabs inside ThemeProvider
        // But MainTabs is inside ThemeProvider in App()
        // We can use a hook here? No, must be inside component.
        // Forcing light mode for navigation
        const isDark = false;

        return {
          tabBarIcon: ({ focused }) => (
            <TabBarIcon label={route.name} focused={focused} />
          ),
          tabBarActiveTintColor: '#2B3990',
          tabBarInactiveTintColor: '#999',
          tabBarStyle: {
            ...styles.tabBar,
            backgroundColor: '#fff',
            borderTopColor: '#e0e0e0',
          },
          tabBarLabelStyle: styles.tabLabel,
          headerStyle: {
            ...styles.header,
            backgroundColor: '#2B3990',
          },
          headerTintColor: '#fff',
          headerTitleStyle: styles.headerTitle,
        };
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Categories"
        component={CategoriesScreen}
        options={{
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
}



export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    // Artificial minimum delay to show branding (Splash Screen)
    const minLoadTime = 2500;
    const start = Date.now();

    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      const end = Date.now();
      const elapsed = end - start;
      const delay = Math.max(0, minLoadTime - elapsed);

      setTimeout(() => {
        setIsLoading(false);
      }, delay);
    }
  };

  // Export function to update auth state (for LoginScreen)
  global.setAppAuthState = (value) => {
    setIsAuthenticated(value);
  };

  if (isLoading) {
    return (
      <View style={styles.splashContainer}>
        {/* Center Logo */}
        <View style={styles.splashLogoContainer}>
          <Image
            source={require('./assets/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Bottom Branding */}
        <View style={styles.splashFooter}>
          <Text style={styles.splashFromText}>from</Text>
          <View style={styles.splashBrandRow}>
            <Icon name="local-shipping" size={20} color="#FF9900" />
            <Text style={styles.splashBrandName}> Amazon</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName={isAuthenticated ? 'MainTabs' : 'Login'}>
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ animationEnabled: false }}
        />
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{ animationEnabled: false }}
        />
        <Stack.Screen
          name="ProductDetail"
          component={ProductDetailScreen}
          options={{
            headerShown: false,
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="Products"
          component={ProductsScreen}
          options={{
            headerShown: true, // Show header for back button
            title: 'Products',
            headerBackTitleVisible: false,
            headerStyle: {
              backgroundColor: '#fff',
            },
            headerTintColor: '#000',
          }}
        />
        <Stack.Screen
          name="AboutUs"
          component={AboutUsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Support"
          component={SupportScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabIcon: {
    fontSize: 24,
  },
  tabIconFocused: {
    transform: [{ scale: 1.1 }],
  },
  header: {
    backgroundColor: '#2B3990',
    elevation: 0,
    shadowOpacity: 0,
  },
  headerTitle: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  splashContainer: {
    flex: 1,
    justifyContent: 'center', // Vertically center main content
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  splashLogoContainer: {
    alignItems: 'center',
    marginBottom: 40,
    width: '80%',
    height: 200,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  splashTitle: {
    fontSize: 32,
    fontWeight: '300',
    letterSpacing: 8,
    color: '#000',
    marginTop: 16,
  },
  splashFooter: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
  },
  splashFromText: {
    fontSize: 12,
    color: '#666',
    letterSpacing: 1,
    marginBottom: 4,
  },
  splashBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  splashBrandName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginLeft: 4,
    letterSpacing: 0.5,
  },
});
