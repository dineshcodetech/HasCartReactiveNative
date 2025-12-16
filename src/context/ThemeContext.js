import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'nativewind';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const { colorScheme, toggleColorScheme, setColorScheme } = useColorScheme();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadTheme = async () => {
            try {
                const savedTheme = await AsyncStorage.getItem('appTheme');
                if (savedTheme) {
                    setColorScheme(savedTheme);
                }
            } catch (error) {
                console.error('Failed to load theme', error);
            } finally {
                setLoading(false);
            }
        };
        loadTheme();
    }, []);

    const toggleTheme = async () => {
        const newTheme = colorScheme === 'dark' ? 'light' : 'dark';
        setColorScheme(newTheme);
        await AsyncStorage.setItem('appTheme', newTheme);
    };

    return (
        <ThemeContext.Provider value={{ isDark: colorScheme === 'dark', toggleTheme, theme: colorScheme }}>
            {!loading && children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
