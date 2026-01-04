import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
    ActivityIndicator,
    Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { apiCall } from '../services/api';

const ForgotPasswordScreen = () => {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSendOTP = async () => {
        if (!email) {
            Alert.alert('Error', 'Please enter your email address');
            return;
        }

        setLoading(true);
        try {
            console.log('[ForgotPassword] Requesting OTP for:', email.trim().toLowerCase());

            const res = await apiCall('/api/auth/forgot-password', {
                method: 'POST',
                body: JSON.stringify({ email: email.trim().toLowerCase() }),
            });

            if (res.ok && res.data?.success) {
                Alert.alert('Success', 'Verification code sent to your email.');
                setStep(2);
            } else {
                Alert.alert('Error', res.data?.message || 'Failed to send verification code.');
            }
        } catch (error) {
            console.error('[ForgotPassword] OTP Error:', error);
            Alert.alert('Error', 'Unable to reach server. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!otp || !newPassword || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            console.log('[ForgotPassword] Resetting password...');

            const res = await apiCall('/api/auth/reset-password', {
                method: 'POST',
                body: JSON.stringify({ otp: otp.trim(), password: newPassword }),
            });

            if (res.ok && res.data?.success) {
                Alert.alert('Success', 'Password reset successful. Please login with your new password.', [
                    { text: 'OK', onPress: () => navigation.navigate('Login') }
                ]);
            } else {
                Alert.alert('Error', res.data?.message || 'Failed to reset password.');
            }
        } catch (error) {
            console.error('[ForgotPassword] Reset Error:', error);
            Alert.alert('Error', 'Unable to reach server. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1, backgroundColor: '#fff' }}
        >
            <ScrollView
                contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 32 }}
            >
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={{ position: 'absolute', top: 50, left: 20, zIndex: 10 }}
                >
                    <Text style={{ fontSize: 16, color: '#2B3990', fontWeight: 'bold' }}>Back</Text>
                </TouchableOpacity>

                <View style={{ alignItems: 'center', marginBottom: 40 }}>
                    <Image
                        source={require('../../assets/logo.png')}
                        style={{ width: 80, height: 80, marginBottom: 20 }}
                        resizeMode="contain"
                    />
                    <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#2B3990', letterSpacing: 2 }}>
                        RESET PASSWORD
                    </Text>
                    <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 8, textAlign: 'center' }}>
                        {step === 1
                            ? 'Enter your registered email to receive a verification OTP'
                            : 'Enter the 6-digit OTP sent to your email and your new password'}
                    </Text>
                </View>

                {step === 1 ? (
                    <View>
                        <TextInput
                            placeholder="EMAIL ADDRESS"
                            placeholderTextColor="#9ca3af"
                            style={{ width: '100%', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingVertical: 12, fontSize: 16, color: '#000' }}
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                        <TouchableOpacity
                            style={{ width: '100%', backgroundColor: '#2B3990', paddingVertical: 18, marginTop: 32, borderRadius: 8, alignItems: 'center' }}
                            onPress={handleSendOTP}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold', letterSpacing: 1.5 }}>
                                    SEND CODE
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View>
                        <TextInput
                            placeholder="6-DIGIT OTP"
                            placeholderTextColor="#9ca3af"
                            style={{ width: '100%', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingVertical: 12, fontSize: 16, color: '#000', marginBottom: 20 }}
                            value={otp}
                            onChangeText={setOtp}
                            keyboardType="number-pad"
                            maxLength={6}
                        />
                        <TextInput
                            placeholder="NEW PASSWORD"
                            placeholderTextColor="#9ca3af"
                            style={{ width: '100%', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingVertical: 12, fontSize: 16, color: '#000', marginBottom: 20 }}
                            value={newPassword}
                            onChangeText={setNewPassword}
                            secureTextEntry
                        />
                        <TextInput
                            placeholder="CONFIRM NEW PASSWORD"
                            placeholderTextColor="#9ca3af"
                            style={{ width: '100%', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingVertical: 12, fontSize: 16, color: '#000', marginBottom: 20 }}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                        />
                        <TouchableOpacity
                            style={{ width: '100%', backgroundColor: '#2B3990', paddingVertical: 18, marginTop: 12, borderRadius: 8, alignItems: 'center' }}
                            onPress={handleResetPassword}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold', letterSpacing: 1.5 }}>
                                    RESET PASSWORD
                                </Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setStep(1)}
                            style={{ marginTop: 20, alignItems: 'center' }}
                        >
                            <Text style={{ color: '#9ca3af', fontSize: 12 }}>Didn't receive code? Change Email</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default ForgotPasswordScreen;
