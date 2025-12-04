import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function HomeScreen() {
    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Welcome to HasCart! 🛒</Text>
                <Text style={styles.subtitle}>Your Shopping Companion</Text>
                <Text>this is some thing heer </Text>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Home Screen</Text>
                    <Text style={styles.cardText}>
                        This is the home screen of your React Native app.
                        You can add your main content here.
                    </Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Getting Started</Text>
                    <Text style={styles.cardText}>
                        • Browse products in the Explore tab{'\n'}
                        • Manage your settings in the Profile tab{'\n'}
                        • Start building your features!
                    </Text>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    content: {
        padding: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 18,
        color: '#666',
        marginBottom: 24,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#007AFF',
        marginBottom: 12,
    },
    cardText: {
        fontSize: 16,
        color: '#555',
        lineHeight: 24,
    },
});
