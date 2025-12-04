import React from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView } from 'react-native';

export default function ExploreScreen() {
    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Explore</Text>

                <View style={styles.searchContainer}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search for products..."
                        placeholderTextColor="#999"
                    />
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>🔍 Search & Discover</Text>
                    <Text style={styles.cardText}>
                        Find the products you need. This is where you can add:
                        {'\n\n'}
                        • Product listings{'\n'}
                        • Categories{'\n'}
                        • Filters{'\n'}
                        • Search functionality
                    </Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>📦 Featured Products</Text>
                    <Text style={styles.cardText}>
                        Display your featured or trending products here.
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
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
    },
    searchContainer: {
        marginBottom: 20,
    },
    searchInput: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#ddd',
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
