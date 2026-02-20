import React, { useState, useContext, useEffect, useRef } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, StyleSheet, 
    ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, 
    Dimensions, StatusBar, Animated, Image, Vibration, Modal 
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../api/client'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

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

const LoginScreen = () => {
    const navigation = useNavigation();
    const [emailOrId, setEmailOrId] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(null); 
    
    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [modalContent, setModalContent] = useState({ title: '', message: '', type: 'error' });

    const { setUser } = useContext(AuthContext);

    // Animation Refs
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(40)).current;
    const scaleAnim = useRef(new Animated.Value(0.92)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
            Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true })
        ]).start();
    }, []);

    const triggerModal = (title, message, type = 'error') => {
        // Haptic feedback per instructions
        Vibration.vibrate(type === 'error' ? [0, 80, 50, 80] : 60);
        setModalContent({ title, message, type });
        setModalVisible(true);
    };

    const handleLogin = async () => {
    if (!emailOrId || !password) {
        Vibration.vibrate(40);
        return triggerModal("Required Fields", "Please enter your credentials to access your account.", "error");
    }
    setLoading(true); 
    try {
        // ⚡ Clear old storage before login
        await AsyncStorage.multiRemove(['token', 'userData']);

        const res = await apiClient.post('/auth/login', { emailOrId, password });
        if (res.data.token) {
            await AsyncStorage.setItem('token', res.data.token);
            await AsyncStorage.setItem('userData', JSON.stringify(res.data.user));
            setUser(res.data.user); 
        }
    } catch (error) {
        triggerModal("Access Denied", error.response?.data?.message || "Verification failed. Please check your credentials.", "error");
    } finally {
        setLoading(false); 
    }
};


    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={styles.mainContainer}
        >
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            {/* --- THEMED PREMIUM MODAL --- */}
            <Modal
                transparent
                visible={modalVisible}
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.premiumModal}>
                        <View style={[styles.modalStatus, { backgroundColor: modalContent.type === 'error' ? COLORS.error : COLORS.success }]} />
                        <Text style={styles.modalTitleText}>{modalContent.title}</Text>
                        <Text style={styles.modalSubText}>{modalContent.message}</Text>
                        <TouchableOpacity 
                            activeOpacity={0.8}
                            style={styles.modalCloseBtn} 
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={styles.modalCloseText}>Dismiss</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <ScrollView 
                contentContainerStyle={styles.scrollContainer}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Header Section */}
                <Animated.View style={[
                    styles.headerSection, 
                    { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }
                ]}>
                    <View style={styles.logoBadge}>
                        <Image 
                            source={require('../../assets/logo.png')} 
                            style={styles.actualLogo} 
                            resizeMode="contain"
                        />
                    </View>
                    <Text style={styles.logoText}>VidyaSetu</Text>
                    <Text style={styles.subtitle}>The bridge to your academic excellence</Text>
                </Animated.View>

                {/* Form Card */}
                <Animated.View style={[
                    styles.formCard,
                    { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
                ]}>
                    <Text style={styles.label}>Identifier</Text>
                    <TextInput
                        style={[styles.input, isFocused === 'email' && styles.inputFocused]}
                        placeholder="Email or Student ID"
                        placeholderTextColor={COLORS.placeholder}
                        value={emailOrId}
                        onChangeText={setEmailOrId}
                        autoCapitalize="none"
                        onFocus={() => setIsFocused('email')}
                        onBlur={() => setIsFocused(null)}
                    />

                    <Text style={styles.label}>Password</Text>
                    <TextInput
                        style={[styles.input, isFocused === 'password' && styles.inputFocused]}
                        placeholder="Password"
                        placeholderTextColor={COLORS.placeholder}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        onFocus={() => setIsFocused('password')}
                        onBlur={() => setIsFocused(null)}
                    />

                    <TouchableOpacity 
                        onPress={() => navigation.navigate('ForgotPassword')} 
                        style={styles.forgotContainer}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.forgotText}>Forgot Password?</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.button, loading && styles.buttonDisabled]} 
                        onPress={handleLogin}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                            <Text style={styles.buttonText}>Sign In</Text>
                        )}
                    </TouchableOpacity>
                </Animated.View>

                {/* Footer Attribution */}
                <View style={styles.footer}>
                    <Text style={styles.madeWithText}>Powered by </Text>
                    <Text style={styles.devName}>Nirankar Gangwar</Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: COLORS.background },
    scrollContainer: { 
        flexGrow: 1, 
        justifyContent: 'center', 
        paddingHorizontal: 28, 
        paddingBottom: 40,
        paddingTop: Platform.OS === 'ios' ? 0 : 20 
    },
    headerSection: { alignItems: 'center', marginBottom: 40 },
    logoBadge: {
        width: 100, height: 100,
        backgroundColor: COLORS.cardBg,
        borderRadius: 30,
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 20,
        shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.12, shadowRadius: 20, elevation: 12,
    },
    actualLogo: { width: 70, height: 70 },
    logoText: { fontSize: 34, fontWeight: '900', color: COLORS.midnight, letterSpacing: -1 },
    subtitle: { fontSize: 15, color: COLORS.textSecondary, marginTop: 10, textAlign: 'center', lineHeight: 22, paddingHorizontal: 20 },
    formCard: { 
        backgroundColor: COLORS.cardBg, borderRadius: 32, padding: 30, 
        width: '100%', borderWidth: 1, borderColor: COLORS.border,
        shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.03, shadowRadius: 15, elevation: 4 
    },
    label: { fontSize: 11, fontWeight: '800', color: COLORS.textSecondary, marginBottom: 10, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 1.2 },
    input: { backgroundColor: COLORS.background, paddingHorizontal: 20, paddingVertical: 18, borderRadius: 18, marginBottom: 20, borderWidth: 1.5, borderColor: COLORS.border, fontSize: 16, color: COLORS.textPrimary, fontWeight: '600' },
    inputFocused: { borderColor: COLORS.primary, backgroundColor: COLORS.cardBg },
    forgotContainer: { alignSelf: 'flex-end', marginBottom: 35 },
    forgotText: { color: COLORS.primary, fontWeight: '700', fontSize: 14 },
    button: { backgroundColor: COLORS.primary, paddingVertical: 18, borderRadius: 20, alignItems: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 },
    buttonDisabled: { backgroundColor: COLORS.placeholder },
    buttonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 50, alignItems: 'center' },
    madeWithText: { color: COLORS.textSecondary, fontSize: 13 },
    devName: { color: COLORS.textPrimary, fontWeight: '800', fontSize: 13 },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(30, 27, 75, 0.75)', justifyContent: 'center', alignItems: 'center', padding: 25 },
    premiumModal: { backgroundColor: COLORS.cardBg, borderRadius: 28, padding: 35, width: '100%', alignItems: 'center', elevation: 20 },
    modalStatus: { width: 60, height: 5, borderRadius: 10, marginBottom: 25 },
    modalTitleText: { fontSize: 24, fontWeight: '900', color: COLORS.midnight, marginBottom: 12 },
    modalSubText: { fontSize: 16, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: 30 },
    modalCloseBtn: { backgroundColor: COLORS.midnight, paddingVertical: 15, paddingHorizontal: 40, borderRadius: 15 },
    modalCloseText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 }
});

export default LoginScreen;