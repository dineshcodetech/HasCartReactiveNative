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
import { apiCall } from '../services/api';
import DatePickerModal from '../components/DatePickerModal';

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
    upiId: '',
    accountNumber: '',
    ifsc: '',
    branch: '',
    holderName: '',
  });

  const [filters, setFilters] = useState({
    startDate: '', // YYYY-MM-DD
    endDate: '',   // YYYY-MM-DD
    status: '',    // 'pending', 'approved', 'rejected'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [activeDateField, setActiveDateField] = useState(null);

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
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          setUser(JSON.parse(userData));
        }
        setLoading(false);
        return;
      }

      const response = await apiCall('/api/auth/me', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok && response.data.success) {
        const userData = response.data.data;
        setUser(userData);
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
      } else {
        const userData = await AsyncStorage.getItem('userData');
        if (userData) setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWithdrawals = async (filtersOverride = null) => {
    try {
      setLoadingWithdrawals(true);
      const token = await AsyncStorage.getItem('authToken');
      const activeFilters = filtersOverride || filters;

      const params = new URLSearchParams();
      if (activeFilters.startDate) params.append('startDate', activeFilters.startDate);
      if (activeFilters.endDate) params.append('endDate', activeFilters.endDate);
      if (activeFilters.status) params.append('status', activeFilters.status);

      const response = await apiCall(`/api/withdrawals?${params.toString()}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
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

    let paymentDetails = {};
    if (formData.paymentMethod === 'UPI') {
      if (!formData.upiId) return Alert.alert('Error', 'Please enter UPI ID');
      paymentDetails = { upiId: formData.upiId };
    } else {
      if (!formData.accountNumber || !formData.ifsc || !formData.holderName) {
        return Alert.alert('Error', 'Please fill all bank details');
      }
      paymentDetails = {
        accountNumber: formData.accountNumber,
        ifsc: formData.ifsc,
        branch: formData.branch,
        accountHolderName: formData.holderName,
      };
    }

    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await apiCall('/api/withdrawals', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          amount: parseFloat(formData.amount),
          paymentMethod: formData.paymentMethod,
          paymentDetails: JSON.stringify(paymentDetails),
        }),
      });

      if (response.ok && response.data.success) {
        Alert.alert('Success', 'Withdrawal request submitted.');
        setFormData({ amount: '', paymentMethod: '', upiId: '', accountNumber: '', ifsc: '', branch: '', holderName: '' });
        loadWithdrawals();
        loadUserData();
      } else {
        Alert.alert('Error', response.data?.message || 'Failed to submit request');
      }
    } catch (error) {
      Alert.alert('Error', 'Connection failed');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#10b981';
      case 'rejected': return '#ef4444';
      case 'pending': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      case 'pending': return 'Reviewing';
      default: return status;
    }
  };

  const handleDateSelect = (date) => {
    const formattedDate = date.toISOString().split('T')[0];
    setFilters(prev => ({ ...prev, [activeDateField]: formattedDate }));
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2B3990" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>Withdraw</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>₹{parseFloat(user?.balance || 0).toFixed(2)}</Text>
        </View>

        {/* Form */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>New Request</Text>
          <TextInput
            style={styles.input}
            placeholder="Amount (₹)"
            value={formData.amount}
            onChangeText={(t) => setFormData({ ...formData, amount: t })}
            keyboardType="numeric"
          />

          <View style={styles.methodRow}>
            {['UPI', 'Bank Transfer'].map(m => (
              <TouchableOpacity
                key={m}
                onPress={() => setFormData({ ...formData, paymentMethod: m })}
                style={[styles.methodBtn, formData.paymentMethod === m && styles.methodBtnActive]}
              >
                <Text style={[styles.methodText, formData.paymentMethod === m && styles.methodTextActive]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {formData.paymentMethod === 'UPI' && (
            <TextInput
              style={styles.input}
              placeholder="UPI ID"
              value={formData.upiId}
              onChangeText={(t) => setFormData({ ...formData, upiId: t })}
            />
          )}

          {formData.paymentMethod === 'Bank Transfer' && (
            <View style={{ gap: 10 }}>
              <TextInput style={styles.input} placeholder="Account Holder" value={formData.holderName} onChangeText={t => setFormData({ ...formData, holderName: t })} />
              <TextInput style={styles.input} placeholder="Account Number" value={formData.accountNumber} onChangeText={t => setFormData({ ...formData, accountNumber: t })} keyboardType="numeric" />
              <TextInput style={styles.input} placeholder="IFSC" value={formData.ifsc} onChangeText={t => setFormData({ ...formData, ifsc: t.toUpperCase() })} />
            </View>
          )}

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Submit Request</Text>}
          </TouchableOpacity>
        </View>

        {/* History & Filters */}
        <View style={styles.card}>
          <View style={styles.historyHeader}>
            <Text style={styles.cardTitle}>History</Text>
            <TouchableOpacity onPress={() => setShowFilters(!showFilters)} style={styles.filterToggle}>
              <Icon name="filter-list" size={20} color="#2B3990" />
            </TouchableOpacity>
          </View>

          {showFilters && (
            <View style={styles.filterSection}>
              <View style={styles.filterRow}>
                <View style={{ flex: 1.5, marginRight: 12 }}>
                  <Text style={styles.filterLabel}>Dates</Text>
                  <View style={styles.dateInputs}>
                    <TouchableOpacity style={styles.miniInput} onPress={() => { setActiveDateField('startDate'); setDatePickerVisible(true); }}>
                      <Text style={styles.miniInputText} numberOfLines={1}>{filters.startDate || 'Start'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.miniInput} onPress={() => { setActiveDateField('endDate'); setDatePickerVisible(true); }}>
                      <Text style={styles.miniInputText} numberOfLines={1}>{filters.endDate || 'End'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={{ flex: 2 }}>
                  <Text style={styles.filterLabel}>Status</Text>
                  <View style={styles.chipRow}>
                    {['pending', 'approved', 'rejected'].map(s => (
                      <TouchableOpacity key={s} onPress={() => setFilters({ ...filters, status: filters.status === s ? '' : s })} style={[styles.chip, filters.status === s && styles.chipActive]}>
                        <Text style={[styles.chipText, filters.status === s && styles.chipTextActive]}>{getStatusLabel(s)}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
              <View style={styles.filterActions}>
                <TouchableOpacity onPress={() => { const e = { startDate: '', endDate: '', status: '' }; setFilters(e); loadWithdrawals(e); }}><Text style={styles.clearText}>Clear All</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => loadWithdrawals()} style={styles.applyBtn}><Text style={styles.applyText}>Apply</Text></TouchableOpacity>
              </View>
            </View>
          )}

          {withdrawals.map(w => (
            <View key={w._id} style={styles.historyItem}>
              <View style={styles.itemRow}>
                <Text style={styles.itemAmount}>₹{w.amount.toFixed(2)}</Text>
                <View style={[styles.itemBadge, { backgroundColor: getStatusColor(w.status) + '20' }]}>
                  <Text style={[styles.itemBadgeText, { color: getStatusColor(w.status) }]}>{getStatusLabel(w.status)}</Text>
                </View>
              </View>
              <Text style={styles.itemMeta}>{w.paymentMethod} • {new Date(w.createdAt).toLocaleDateString()}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
      <DatePickerModal visible={datePickerVisible} onClose={() => setDatePickerVisible(false)} onSelect={handleDateSelect} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  balanceCard: { backgroundColor: '#2B3990', margin: 16, padding: 24, borderRadius: 16, alignItems: 'center' },
  balanceLabel: { color: '#ffffff90', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  balanceAmount: { color: '#fff', fontSize: 32, fontWeight: '800' },
  card: { backgroundColor: '#fff', margin: 16, marginTop: 0, padding: 20, borderRadius: 16, borderClasses: 'border border-gray-100' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 16 },
  input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#f3f4f6', borderRadius: 8, padding: 12, fontSize: 14, marginBottom: 16 },
  methodRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  methodBtn: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#f3f4f6', alignItems: 'center', backgroundColor: '#f9fafb' },
  methodBtnActive: { backgroundColor: '#2B3990', borderColor: '#2B3990' },
  methodText: { fontSize: 13, color: '#6b7280', fontWeight: '600' },
  methodTextActive: { color: '#fff' },
  submitBtn: { backgroundColor: '#2B3990', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  submitBtnText: { color: '#fff', fontWeight: 'bold' },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  filterToggle: { padding: 8, backgroundColor: '#f0f4ff', borderRadius: 8 },
  filterSection: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', marginBottom: 16 },
  filterRow: { flexDirection: 'row' },
  filterLabel: { fontSize: 10, fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', marginBottom: 8 },
  dateInputs: { flexDirection: 'row', gap: 4 },
  miniInput: { flex: 1, backgroundColor: '#f9fafb', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#f3f4f6', alignItems: 'center' },
  miniInputText: { fontSize: 11, color: '#111827', fontWeight: '600' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#f3f4f6' },
  chipActive: { backgroundColor: '#2B3990', borderColor: '#2B3990' },
  chipText: { fontSize: 11, color: '#6b7280' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  filterActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginTop: 16 },
  clearText: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  applyBtn: { backgroundColor: '#2B3990', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  applyText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  historyItem: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f9fafb' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  itemAmount: { fontSize: 15, fontWeight: '700', color: '#111827' },
  itemBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  itemBadgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  itemMeta: { fontSize: 11, color: '#9ca3af' }
});

export default WithdrawalScreen;
