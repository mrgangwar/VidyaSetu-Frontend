import React, { useState, useRef, useEffect } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, StyleSheet, Modal,
    ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
    StatusBar, SafeAreaView, Dimensions, Animated, Vibration
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../api/client';

const { width } = Dimensions.get('window');

// --- DESIGN SYSTEM CONSTANTS (Source of Truth) ---
const COLORS = {
    background: '#F8FAFC',    // Soft White
    cardBg: '#FFFFFF',        // White
    primary: '#2563EB',       // Royal Blue
    midnight: '#1E1B4B',      // Midnight Blue
    textPrimary: '#1E293B',   // Charcoal Gray
    textSecondary: '#64748B', // Slate Gray
    border: '#E2E8F0',        // Light Gray
    success: '#10B981',       // Emerald Green
    error: '#DC2626',         // Crimson Red
    placeholder: '#94A3B8'
};

const ForgotPasswordScreen = ({ navigation }) => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isFocused, setIsFocused] = useState(null);
    const [loading, setLoading] = useState(false);

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [modalConfig, setModalConfig] = useState({ title: '', message: '', type: 'error' });

    // Entrance Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true })
        ]).start();
    }, [step]);

    const triggerAlert = (title, message, type = 'error') => {
        // Distinct vibration patterns per instructions
        Vibration.vibrate(type === 'error' ? [0, 80, 50, 80] : 70);
        setModalConfig({ title, message, type });
        setModalVisible(true);
    };

    const handleSendOTP = async () => {
        if (!email) {
            Vibration.vibrate(50);
            return triggerAlert("Input Required", "Please enter your registered email address.", "error");
        }
        setLoading(true);
        try {
            await apiClient.post('/auth/send-otp', { email });
            setStep(2);
            triggerAlert("Code Sent", "A secure verification code has been dispatched to your email.", "success");
        } catch (err) {
            triggerAlert("Request Failed", err.response?.data?.message || "We could not send the verification code at this time.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async () => {
        if (!otp || !newPassword) {
            Vibration.vibrate(50);
            return triggerAlert("Incomplete Form", "Please provide both the verification code and your new password.", "error");
        }
        setLoading(true);
        try {
            await apiClient.post('/auth/reset-password', { email, otp, newPassword });
            triggerAlert("Success", "Your password has been securely updated. You may now log in.", "success");
            setTimeout(() => {
                setModalVisible(false);
                navigation.navigate('Login');
            }, 2000);
        } catch (err) {
            triggerAlert("Verification Error", "The code provided is invalid or has expired.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
            
            {/* Custom Premium Modal */}
            <Modal transparent visible={modalVisible} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.premiumModal}>
                        <View style={[styles.modalBar, { backgroundColor: modalConfig.type === 'error' ? COLORS.error : COLORS.success }]} />
                        <Text style={styles.modalTitle}>{modalConfig.title}</Text>
                        <Text style={styles.modalMessage}>{modalConfig.message}</Text>
                        <TouchableOpacity 
                            activeOpacity={0.8}
                            style={styles.modalBtn} 
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={styles.modalBtnText}>Acknowledge</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                style={styles.container}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    {/* Back Navigation */}
                    <TouchableOpacity 
                        style={styles.backButton} 
                        onPress={() => step === 2 ? setStep(1) : navigation.goBack()}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="arrow-back" size={24} color={COLORS.midnight} />
                    </TouchableOpacity>

                    {/* Branding/Header */}
                    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                        <View style={styles.header}>
                            <Text style={styles.title}>
                                {step === 1 ? "Restore Access" : "Secure Verification"}
                            </Text>
                            <Text style={styles.subtitle}>
                                {step === 1 
                                    ? "Provide your professional email to receive a secure authentication code." 
                                    : `We have dispatched a security code to your inbox at ${email}`}
                            </Text>
                        </View>

                        {/* Progress Indicator */}
                        <View style={styles.stepIndicatorContainer}>
                            <View style={[styles.stepLine, styles.stepLineActive]} />
                            <View style={[styles.stepLine, step >= 2 ? styles.stepLineActive : styles.stepLineInactive]} />
                        </View>

                        {/* Form Card */}
                        <View style={styles.formCard}>
                            {step === 1 ? (
                                <>
                                    <Text style={styles.label}>Email Address</Text>
                                    <View style={[styles.inputWrapper, isFocused === 'email' && styles.inputFocused]}>
                                        <Ionicons name="mail-outline" size={20} color={COLORS.placeholder} style={{marginRight: 10}} />
                                        <TextInput 
                                            style={styles.input} 
                                            placeholder="e.g. user123@gmail.com" 
                                            placeholderTextColor={COLORS.placeholder}
                                            value={email} 
                                            onChangeText={setEmail}
                                            onFocus={() => setIsFocused('email')}
                                            onBlur={() => setIsFocused(null)}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                        />
                                    </View>
                                    <TouchableOpacity 
                                        activeOpacity={0.8}
                                        style={styles.primaryBtn} 
                                        onPress={handleSendOTP} 
                                        disabled={loading}
                                    >
                                        {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryBtnText}>Initialize Recovery</Text>}
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <>
                                    <Text style={styles.label}>Security Code</Text>
                                    <View style={[styles.inputWrapper, isFocused === 'otp' && styles.inputFocused]}>
                                        <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.placeholder} style={{marginRight: 10}} />
                                        <TextInput 
                                            style={styles.input} 
                                            placeholder="Enter 6-digit OTP" 
                                            placeholderTextColor={COLORS.placeholder}
                                            value={otp} 
                                            onChangeText={setOtp}
                                            keyboardType="number-pad"
                                            onFocus={() => setIsFocused('otp')}
                                            onBlur={() => setIsFocused(null)}
                                        />
                                    </View>

                                    <Text style={styles.label}>New Password</Text>
                                    <View style={[styles.inputWrapper, isFocused === 'pass' && styles.inputFocused]}>
                                        <Ionicons name="lock-closed-outline" size={20} color={COLORS.placeholder} style={{marginRight: 10}} />
                                        <TextInput 
                                            style={styles.input} 
                                            placeholder="Min. 8 characters" 
                                            placeholderTextColor={COLORS.placeholder}
                                            secureTextEntry 
                                            value={newPassword} 
                                            onChangeText={setNewPassword}
                                            onFocus={() => setIsFocused('pass')}
                                            onBlur={() => setIsFocused(null)}
                                        />
                                    </View>

                                    <TouchableOpacity 
                                        activeOpacity={0.8}
                                        style={styles.primaryBtn} 
                                        onPress={handleReset} 
                                        disabled={loading}
                                    >
                                        {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryBtnText}>Update Credentials</Text>}
                                    </TouchableOpacity>

                                    <TouchableOpacity 
                                        activeOpacity={0.6}
                                        style={styles.secondaryBtn} 
                                        onPress={handleSendOTP}
                                    >
                                        <Text style={styles.secondaryBtnText}>Request New Code</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.background },
    container: { flex: 1 },
    scrollContent: { padding: 28, flexGrow: 1 },
    backButton: {
        width: 50, height: 50, borderRadius: 16,
        backgroundColor: COLORS.cardBg, justifyContent: 'center', alignItems: 'center',
        marginBottom: 35, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
    },
    header: { marginBottom: 35 },
    title: { fontSize: 32, fontWeight: '900', color: COLORS.midnight, letterSpacing: -1 },
    subtitle: { fontSize: 16, color: COLORS.textSecondary, lineHeight: 24, marginTop: 10 },
    stepIndicatorContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 },
    stepLine: { height: 6, width: '48%', borderRadius: 10 },
    stepLineActive: { backgroundColor: COLORS.primary },
    stepLineInactive: { backgroundColor: COLORS.border },
    formCard: { 
        backgroundColor: COLORS.cardBg, borderRadius: 32, padding: 30,
        shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05, shadowRadius: 20, elevation: 4,
        borderWidth: 1, borderColor: COLORS.border
    },
    label: { fontSize: 11, fontWeight: '800', color: COLORS.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1.2 },
    inputWrapper: { 
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: COLORS.background, paddingHorizontal: 18, 
        borderRadius: 18, marginBottom: 22, borderWidth: 1.5, borderColor: COLORS.border
    },
    input: { flex: 1, paddingVertical: 18, fontSize: 16, color: COLORS.textPrimary, fontWeight: '600' },
    inputFocused: { borderColor: COLORS.primary, backgroundColor: COLORS.cardBg },
    primaryBtn: { 
        backgroundColor: COLORS.primary, paddingVertical: 18, borderRadius: 20, 
        alignItems: 'center', marginTop: 10, shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8
    },
    primaryBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },
    secondaryBtn: { marginTop: 25, alignItems: 'center' },
    secondaryBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 15 },
    
    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(30, 27, 75, 0.75)', justifyContent: 'center', alignItems: 'center', padding: 25 },
    premiumModal: { backgroundColor: COLORS.cardBg, borderRadius: 28, padding: 35, width: '100%', alignItems: 'center', elevation: 20 },
    modalBar: { width: 45, height: 5, borderRadius: 10, marginBottom: 25 },
    modalTitle: { fontSize: 24, fontWeight: '900', color: COLORS.midnight, marginBottom: 12 },
    modalMessage: { fontSize: 16, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: 30 },
    modalBtn: { backgroundColor: COLORS.midnight, paddingVertical: 15, paddingHorizontal: 40, borderRadius: 15 },
    modalBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 }
});

export default ForgotPasswordScreen;