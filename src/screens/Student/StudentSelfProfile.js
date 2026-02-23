import React, { useState, useCallback, useContext } from 'react';
import { 
    View, Text, StyleSheet, Image, ScrollView, Modal,
    TouchableOpacity, ActivityIndicator, RefreshControl, StatusBar, Vibration 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import apiClient from '../../api/client';
import { useFocusEffect } from '@react-navigation/native';

// Get API base URL from environment variable
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ? process.env.EXPO_PUBLIC_API_URL.replace('/api', '') : 'https://vidyasetu-backend-n7ob.onrender.com';

// GLOBAL DESIGN SYSTEM CONSTANTS
const COLORS = {
    background: '#F8FAFC',
    cardBg: '#FFFFFF',
    primary: '#2563EB',      // Royal Blue
    midnight: '#1E1B4B',     // Midnight Blue
    textPrimary: '#1E293B',  // Charcoal Gray
    textSecondary: '#64748B', // Slate Gray
    border: '#E2E8F0',
    success: '#10B981',      // Emerald Green
    error: '#DC2626',        // Crimson Red
};

const StudentSelfProfile = () => {
    const { logout } = useContext(AuthContext);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    // CUSTOM ALERT STATE
    const [alertVisible, setAlertVisible] = useState(false);

    const fetchProfile = async () => {
        try {
            const res = await apiClient.get('/student/dashboard');
            if (res.data.success) {
                setProfile(res.data.data.profile);
            }
        } catch (err) {
            Vibration.vibrate(100);
            // In a real production app, you'd use the custom alert here too
            console.log("Profile Fetch Error:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchProfile();
        }, [])
    );

    const onRefresh = () => {
        Vibration.vibrate(10);
        setRefreshing(true);
        fetchProfile();
    };

    const triggerLogoutAlert = () => {
        Vibration.vibrate([0, 50]); // Feel the alert pop
        setAlertVisible(true);
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.syncText}>Synchronizing Profile...</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.background }}>
            <ScrollView 
                style={styles.container} 
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl 
                        refreshing={refreshing} 
                        onRefresh={onRefresh} 
                        tintColor={COLORS.primary} 
                        colors={[COLORS.primary]}
                    />
                }
            >
                <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
                
                {/* PROFILE HEADER SECTION */}
                <View style={styles.headerCard}>
                    <View style={styles.avatarContainer}>
                        <Image
                            key={profile?.profilePhoto}
                            source={profile?.profilePhoto
                                ? { uri: profile.profilePhoto.startsWith('http') ? profile.profilePhoto : `https://vidyasetu-backend-n7ob.onrender.com/${profile.profilePhoto.replace(/\\/g, '/').replace(/^\//, '')}` }
                                : require('../../assets/default-avatar.png')}
                            style={styles.avatar}
                        />
                    </View>
                    <Text style={styles.userName}>{profile?.name}</Text>
                    <Text style={styles.userLoginId}>Student ID: {profile?.studentLoginId}</Text>
                    <View style={styles.statusBadge}>
                        <View style={styles.statusDot} />
                        <Text style={styles.statusText}>VERIFIED ACCOUNT</Text>
                    </View>
                </View>

                {/* INFO SECTIONS */}
                <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>Academic Information</Text>
                    <InfoRow icon="school" label="Institution" value={profile?.collegeName} />
                    <InfoRow icon="time" label="Batch Timing" value={profile?.batchTime} />
                    <InfoRow icon="calendar" label="Academic Session" value={profile?.session} />
                    <InfoRow icon="wallet" label="Monthly Fees" value={`INR ${profile?.monthlyFees}`} color={COLORS.success} />
                </View>

                <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>Family Information</Text>
                    <InfoRow icon="people" label="Guardian Name" value={profile?.fatherName} />
                    <InfoRow icon="call" label="Emergency Contact" value={profile?.parentMobile} />
                </View>

                <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>Contact & Residence</Text>
                    <InfoRow icon="mail" label="Email Address" value={profile?.email} />
                    <InfoRow icon="logo-whatsapp" label="WhatsApp" value={profile?.whatsappNumber || profile?.mobileNumber} />
                    <InfoRow icon="location" label="Residential Address" value={profile?.address} />
                </View>

                {/* ACTION SECTION */}
                <TouchableOpacity 
                    style={styles.logoutBtn} 
                    onPress={triggerLogoutAlert}
                    activeOpacity={0.8}
                >
                    <Ionicons name="log-out-outline" size={22} color="#fff" />
                    <Text style={styles.logoutText}>Logout Session</Text>
                </TouchableOpacity>
                
                <Text style={styles.versionText}>App Version 1.0.2 • {profile?.coachingName || 'Vidya Setu'}</Text>
                <View style={{ height: 40 }} />
            </ScrollView>

            {/* --- CUSTOM DESIGNED ALERT DIALOG --- */}
            <Modal
                transparent={true}
                visible={alertVisible}
                animationType="fade"
                onRequestClose={() => setAlertVisible(false)}
            >
                <View style={styles.alertOverlay}>
                    <View style={styles.alertBox}>
                        <View style={styles.alertHeader}>
                            <Ionicons name="alert-circle" size={32} color={COLORS.primary} />
                            <Text style={styles.alertTitle}>Confirm Logout</Text>
                        </View>
                        
                        <Text style={styles.alertMessage}>
                            Are you sure you want to sign out of your account? You will need to login again to access your data.
                        </Text>
                        
                        <View style={styles.alertActions}>
                            <TouchableOpacity 
                                style={styles.cancelBtn} 
                                onPress={() => setAlertVisible(false)}
                            >
                                <Text style={styles.cancelText}>Stay Logged In</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={styles.confirmBtn} 
                                onPress={async () => {
                                    setAlertVisible(false);
                                    Vibration.vibrate(20);
                                    await logout();
                                }}
                            >
                                <Text style={styles.confirmText}>Logout</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const InfoRow = ({ icon, label, value, color = COLORS.primary }) => (
    <View style={styles.infoRow}>
        <View style={[styles.iconBox, { backgroundColor: color + '12' }]}>
            <Ionicons name={icon} size={20} color={color} />
        </View>
        <View style={styles.textDetails}>
            <Text style={styles.labelTitle}>{label}</Text>
            <Text style={styles.valueTitle}>{value || 'Not Disclosed'}</Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
    syncText: { marginTop: 12, color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },
    
    headerCard: { 
        backgroundColor: COLORS.cardBg, 
        alignItems: 'center', 
        paddingTop: 50,
        paddingBottom: 40, 
        borderBottomLeftRadius: 40, 
        borderBottomRightRadius: 40, 
        elevation: 6,
        shadowColor: COLORS.primary,
        shadowOpacity: 0.08,
        shadowRadius: 20
    },
    avatarContainer: {
        padding: 4,
        backgroundColor: COLORS.background,
        borderRadius: 65,
        borderWidth: 2,
        borderColor: COLORS.border,
        marginBottom: 15
    },
    avatar: { width: 110, height: 110, borderRadius: 55 },
    userName: { fontSize: 28, fontWeight: '900', color: COLORS.textPrimary, letterSpacing: -0.5 },
    userLoginId: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600', marginTop: 4 },
    statusBadge: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#F0FDF4', 
        paddingHorizontal: 16, 
        paddingVertical: 8, 
        borderRadius: 20, 
        marginTop: 16,
        borderWidth: 1,
        borderColor: COLORS.success + '20'
    },
    statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.success, marginRight: 8 },
    statusText: { color: COLORS.success, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
    
    infoSection: { 
        backgroundColor: COLORS.cardBg, 
        marginHorizontal: 20, 
        marginTop: 20, 
        borderRadius: 24, 
        padding: 24, 
        borderWidth: 1,
        borderColor: COLORS.border,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.02
    },
    sectionTitle: { fontSize: 12, fontWeight: '900', color: COLORS.primary, marginBottom: 20, textTransform: 'uppercase', letterSpacing: 1.2 },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 22 },
    iconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    textDetails: { marginLeft: 16, flex: 1 },
    labelTitle: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '700', textTransform: 'uppercase' },
    valueTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginTop: 2 },
    
    logoutBtn: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        marginHorizontal: 20, 
        marginTop: 32, 
        paddingVertical: 18, 
        borderRadius: 20, 
        backgroundColor: COLORS.error,
        elevation: 8,
        shadowColor: COLORS.error,
        shadowOpacity: 0.3,
        shadowRadius: 15
    },
    logoutText: { marginLeft: 12, color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },
    versionText: { textAlign: 'center', marginTop: 30, color: COLORS.textSecondary, fontSize: 12, fontWeight: '600', letterSpacing: 0.3 },

    // --- CUSTOM ALERT STYLES ---
    alertOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.6)', // Deep Slate Overlay
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24
    },
    alertBox: {
        width: '100%',
        backgroundColor: COLORS.cardBg,
        borderRadius: 30,
        padding: 24,
        elevation: 20,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 15
    },
    alertHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16
    },
    alertTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: COLORS.midnight,
        marginLeft: 12
    },
    alertMessage: {
        fontSize: 15,
        color: COLORS.textSecondary,
        lineHeight: 22,
        marginBottom: 28,
        fontWeight: '500'
    },
    alertActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end'
    },
    cancelBtn: {
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 14,
        marginRight: 8
    },
    cancelText: {
        color: COLORS.textSecondary,
        fontWeight: '700',
        fontSize: 15
    },
    confirmBtn: {
        backgroundColor: COLORS.primary,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 14,
        elevation: 4,
        shadowColor: COLORS.primary,
        shadowOpacity: 0.2,
        shadowRadius: 8
    },
    confirmText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 15
    }
});

export default StudentSelfProfile;