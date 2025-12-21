import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from '../components/Icon';
import { API_BASE_URL, apiCall } from '../services/api';

const WithdrawalScreen = () => {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false);
  
  const [formData, setFormData] = useState({
    amount: '',
    paymentMethod: '',
    paymentDetails: '',
  });

  useFocusEffect(
    useCallback(() => {
      loadUserData();
      loadWithdrawals();
    }, [])
  );

  const loadUserData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        // Fallback to AsyncStorage if no token
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          const parsed = JSON.parse(userData);
          setUser(parsed);
        }
        setLoading(false);
        return;
      }

      // First try to get from API
      try {
        const response = await apiCall('/api/auth/me', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok && response.data.success) {
          // The /api/auth/me endpoint returns user in data field
          const userData = response.data.data || response.data;
          console.log('User data from API:', userData);
          
          if (userData) {
            setUser(userData);
            await AsyncStorage.setItem('userData', JSON.stringify(userData));
            
            // If user is agent, also fetch stats to get updated balance
            if (userData.role === 'agent' || userData.role === 'admin') {
              await fetchAgentBalance(token);
            }
          }
        } else {
          console.log('API response not successful, using AsyncStorage');
          // Fallback to AsyncStorage
          const userData = await AsyncStorage.getItem('userData');
          if (userData) {
            const parsed = JSON.parse(userData);
            setUser(parsed);
            // Still try to get updated balance
            if (parsed.role === 'agent' || parsed.role === 'admin') {
              await fetchAgentBalance(token);
            }
          }
        }
      } catch (apiError) {
        console.error('Error fetching user from API:', apiError);
        // Fallback to AsyncStorage
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          const parsed = JSON.parse(userData);
          setUser(parsed);
          // Still try to get updated balance
          if (parsed.role === 'agent' || parsed.role === 'admin') {
            await fetchAgentBalance(token);
          }
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgentBalance = async (token) => {
    try {
      const response = await apiCall('/api/referral/stats', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok && response.data.success) {
        const agentData = response.data.data.agent;
        if (agentData && agentData.balance !== undefined) {
          // Update user with latest balance from stats
          setUser(prevUser => ({
            ...prevUser,
            balance: agentData.balance
          }));
          // Also update AsyncStorage
          const userData = await AsyncStorage.getItem('userData');
          if (userData) {
            const parsed = JSON.parse(userData);
            parsed.balance = agentData.balance;
            await AsyncStorage.setItem('userData', JSON.stringify(parsed));
          }
        }
      }
    } catch (error) {
      console.error('Error fetching agent balance:', error);
    }
  };

  const refreshUserBalance = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;

      // Get updated user data from auth/me endpoint
      const response = await apiCall('/api/auth/me', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok && response.data.success) {
        // The /api/auth/me endpoint returns user in data field
        const updatedUser = response.data.data || response.data;
        if (updatedUser) {
          setUser(updatedUser);
          await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
          
          // Also fetch agent stats for updated balance
          if (updatedUser.role === 'agent' || updatedUser.role === 'admin') {
            await fetchAgentBalance(token);
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing user balance:', error);
      // Fallback: reload user data
      await loadUserData();
    }
  };

  const loadWithdrawals = async () => {
    try {
      setLoadingWithdrawals(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;

      const response = await apiCall('/api/withdrawals', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok && response.data.success) {
        setWithdrawals(response.data.data.withdrawals || []);
      }
    } catch (error) {
      console.error('Error loading withdrawals:', error);
    } finally {
      setLoadingWithdrawals(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid withdrawal amount');
      return;
    }

    if (!formData.paymentMethod) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    if (!formData.paymentDetails) {
      Alert.alert('Error', 'Please enter payment details');
      return;
    }

    const amount = parseFloat(formData.amount);
    const balance = user?.balance !== undefined && user?.balance !== null 
      ? parseFloat(user.balance) 
      : 0;

    if (balance < amount) {
      Alert.alert('Error', `Insufficient balance. Available: ₹${balance.toFixed(2)}`);
      return;
    }

    try {
      setSubmitting(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('Error', 'Please login to continue');
        navigation.navigate('Login');
        return;
      }

      console.log('Submitting withdrawal request:', {
        amount: parseFloat(formData.amount),
        paymentMethod: formData.paymentMethod,
        paymentDetails: formData.paymentDetails,
      });

      const response = await apiCall('/api/withdrawals', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: parseFloat(formData.amount),
          paymentMethod: formData.paymentMethod,
          paymentDetails: formData.paymentDetails,
        }),
      });

      console.log('Withdrawal response:', response);

      if (response.ok && response.data.success) {
        Alert.alert('Success', 'Withdrawal request submitted successfully. Admin will review your request.', [
          {
            text: 'OK',
            onPress: async () => {
              setFormData({ amount: '', paymentMethod: '', paymentDetails: '' });
              await loadWithdrawals();
              await loadUserData();
              // Refresh user data from API to get updated balance
              await refreshUserBalance();
            },
          },
        ]);
      } else {
        const errorMessage = response.data?.message || response.data?.error || 'Failed to submit withdrawal request';
        console.error('Withdrawal submission error:', response.data);
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      console.error('Withdrawal error:', error);
      Alert.alert('Error', error.message || 'Failed to submit withdrawal request. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return '#10b981';
      case 'rejected':
        return '#ef4444';
      case 'pending':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'pending':
        return 'Under Review';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (!user || user.role !== 'agent') {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Only agents can request withdrawals</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>Withdraw Earnings</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceContent}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceAmount}>
              ₹{user?.balance !== undefined && user?.balance !== null 
                ? parseFloat(user.balance).toFixed(2) 
                : '0.00'}
            </Text>
            {user?.balance === undefined && (
              <Text style={styles.balanceLoading}>Loading...</Text>
            )}
          </View>
        </View>

      {/* Withdrawal Form */}
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Request Withdrawal</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Amount (₹)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter amount"
            value={formData.amount}
            onChangeText={(text) => setFormData({ ...formData, amount: text })}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Payment Method</Text>
          <View style={styles.paymentMethodContainer}>
            {['UPI', 'Bank Transfer'].map((method) => (
              <TouchableOpacity
                key={method}
                style={[
                  styles.paymentMethodButton,
                  formData.paymentMethod === method && styles.paymentMethodButtonActive,
                ]}
                onPress={() => setFormData({ ...formData, paymentMethod: method })}
              >
                <Text
                  style={[
                    styles.paymentMethodText,
                    formData.paymentMethod === method && styles.paymentMethodTextActive,
                  ]}
                >
                  {method}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Payment Details</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter UPI ID, Account Number, or other payment details"
            value={formData.paymentDetails}
            onChangeText={(text) => setFormData({ ...formData, paymentDetails: text })}
            multiline
            numberOfLines={3}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Request</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Withdrawal History */}
      <View style={styles.historyCard}>
        <Text style={styles.historyTitle}>Withdrawal History</Text>
        {loadingWithdrawals ? (
          <ActivityIndicator size="small" color="#000" style={styles.loader} />
        ) : withdrawals.length === 0 ? (
          <Text style={styles.emptyText}>No withdrawal requests yet</Text>
        ) : (
          withdrawals.map((withdrawal) => (
            <View key={withdrawal._id} style={styles.withdrawalItem}>
              <View style={styles.withdrawalHeader}>
                <Text style={styles.withdrawalAmount}>₹{withdrawal.amount.toFixed(2)}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(withdrawal.status) },
                  ]}
                >
                  <Text style={styles.statusText}>{getStatusLabel(withdrawal.status)}</Text>
                </View>
              </View>
              <Text style={styles.withdrawalMethod}>{withdrawal.paymentMethod}</Text>
              <Text style={styles.withdrawalDate}>
                {new Date(withdrawal.createdAt).toLocaleDateString()}
              </Text>
              {withdrawal.adminNotes && (
                <Text style={styles.adminNotes}>Note: {withdrawal.adminNotes}</Text>
              )}
            </View>
          ))
        )}
      </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
    textAlign: 'center',
  },
  balanceCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 8,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  balanceContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  balanceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#10b981',
    letterSpacing: -1,
  },
  balanceLoading: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  formCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#000',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  paymentMethodContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  paymentMethodButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    backgroundColor: '#f9f9f9',
    minWidth: 80,
    alignItems: 'center',
  },
  paymentMethodButtonActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  paymentMethodText: {
    fontSize: 14,
    color: '#666',
  },
  paymentMethodTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  historyCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#000',
  },
  loader: {
    marginVertical: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginVertical: 20,
  },
  withdrawalItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  withdrawalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  withdrawalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  withdrawalMethod: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  withdrawalDate: {
    fontSize: 12,
    color: '#999',
  },
  adminNotes: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
  },
});

export default WithdrawalScreen;

