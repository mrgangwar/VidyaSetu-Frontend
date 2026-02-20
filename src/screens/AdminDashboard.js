import React, { useState, useContext, useEffect, useRef } from 'react';
import { 
    View, Text, StyleSheet, TouchableOpacity, ScrollView, 
    StatusBar, Dimensions, Platform, Modal, Animated, Vibration 
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scale = (size) => (SCREEN_WIDTH / 375) * size;

const AdminDashboardContent = ({ navigation }) => {
    const { user, setUser } = useContext(AuthContext);
    const insets = useSafeAreaInsets();
    
    // UI States
    const [logoutVisible, setLogoutVisible] = useState(false);
    
    // Animation Refs
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideUp = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.spring(slideUp, { toValue: 0, friction: 6, useNativeDriver: true })
        ]).start();
    }, []);

    const performLogout = async () => {
        try {
            await AsyncStorage.multiRemove(['token', 'userData']);
            setUser(null); 
        } catch (e) {
            Vibration.vibrate(100);
            setLogoutVisible(false);
        }
    };

    return (
        <View style={styles.mainWrapper}>
            <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />
            
            {/* --- PREMIUM LOGOUT MODAL --- */}
            <Modal transparent visible={logoutVisible} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.premiumModal}>
                        <View style={styles.modalAccent} />
                        <Text style={styles.modalTitle}>Terminate Session?</Text>
                        <Text style={styles.modalSub}>You will need to re-authenticate to access the Admin Control Center.</Text>
                        <View style={styles.modalActionRow}>
                            <TouchableOpacity 
                                style={styles.cancelBtn} 
                                onPress={() => setLogoutVisible(false)}
                            >
                                <Text style={styles.cancelBtnText}>Stay</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={styles.confirmBtn} 
                                onPress={performLogout}
                            >
                                <Text style={styles.confirmBtnText}>Logout</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Header Section */}
            <View style={[styles.topHeader, { paddingTop: Math.max(insets.top, 20) }]}>
                <View style={styles.headerRow}>
                    <View>
                        <Text style={styles.brandTitle}>VidyaSetu</Text>
                        <Text style={styles.brandSubtitle}>Super Admin Control</Text>
                    </View>
                    <TouchableOpacity 
                        onPress={() => { Vibration.vibrate(50); setLogoutVisible(true); }} 
                        style={styles.headerLogout}
                    >
                        <Text style={styles.headerLogoutText}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView 
                contentContainerStyle={[styles.scrollContainer, { paddingBottom: insets.bottom + 30 }]}
                showsVerticalScrollIndicator={false}
            >
                <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideUp }] }}>
                    
                    {/* Profile Welcome */}
                    <View style={styles.welcomeSection}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'A'}</Text>
                        </View>
                        <View style={styles.welcomeTexts}>
                            <Text style={styles.welcomeLabel}>Authorized Administrator</Text>
                            <Text style={styles.userName}>{user?.name || 'Admin User'}</Text>
                        </View>
                    </View>

                    <Text style={styles.sectionTitle}>Academic Management</Text>
                    
                    {/* Management Grid */}
                    <View style={styles.grid}>
                        {[
                            { title: 'Create Teacher', icon: '👤', color: '#EEF2FF', nav: 'CreateTeacher' },
                            { title: 'Teacher List', icon: '📋', color: '#ECFDF5', nav: 'TeacherList' },
                            { title: 'Admin Profile', icon: '⚙️', color: '#FFF7ED', nav: 'AdminProfile' },
                            { title: 'Analytics', icon: '📊', color: '#F5F3FF', nav: null }
                        ].map((item, index) => (
                            <TouchableOpacity 
                                key={index}
                                style={styles.card} 
                                onPress={() => item.nav && navigation.navigate(item.nav)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.iconCircle, { backgroundColor: item.color }]}>
                                    <Text style={styles.cardIcon}>{item.icon}</Text>
                                </View>
                                <Text style={styles.cardText}>{item.title}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.sectionTitle}>Strategic Actions</Text>
                    
                    {/* Broadcast Banner */}
                    <TouchableOpacity 
                        style={styles.broadcastBanner} 
                        onPress={() => navigation.navigate('Broadcast')}
                        activeOpacity={0.9}
                    >
                        <View style={styles.broadcastMain}>
                            <View style={styles.broadcastIconBg}>
                                <Text style={styles.megaIcon}>📢</Text>
                            </View>
                            <View style={styles.broadcastTexts}>
                                <Text style={styles.broadcastTitle}>Global Broadcast</Text>
                                <Text style={styles.broadcastSub}>Issue emergency notices to all users</Text>
                            </View>
                        </View>
                        <Text style={styles.arrowIcon}>→</Text>
                    </TouchableOpacity>

                    {/* Secondary Action */}
                    <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.7}>
                        <Text style={styles.secondaryButtonText}>Affiliated Institutions Directory</Text>
                    </TouchableOpacity>

                </Animated.View>
            </ScrollView>
        </View>
    );
};

const AdminDashboard = (props) => (
    <SafeAreaProvider>
        <AdminDashboardContent {...props} />
    </SafeAreaProvider>
);

const styles = StyleSheet.create({
    mainWrapper: { flex: 1, backgroundColor: '#F8FAFC' },
    topHeader: {
        backgroundColor: '#4F46E5',
        paddingHorizontal: scale(26),
        paddingBottom: scale(32),
        borderBottomLeftRadius: scale(35),
        borderBottomRightRadius: scale(35),
        shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.25, shadowRadius: 15, elevation: 10,
    },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    brandTitle: { fontSize: scale(26), fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.8 },
    brandSubtitle: { fontSize: scale(11), color: 'rgba(255,255,255,0.7)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
    headerLogout: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: scale(16), paddingVertical: scale(8), borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    headerLogoutText: { color: '#FFFFFF', fontSize: scale(13), fontWeight: '800' },
    scrollContainer: { paddingHorizontal: scale(22), paddingTop: scale(26) },
    welcomeSection: { 
        flexDirection: 'row', alignItems: 'center', marginBottom: scale(30), 
        backgroundColor: '#FFFFFF', padding: scale(20), borderRadius: 28,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 
    },
    avatar: { width: scale(56), height: scale(56), borderRadius: 20, backgroundColor: '#6366F1', justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: '#FFFFFF', fontSize: scale(24), fontWeight: '900' },
    welcomeTexts: { flex: 1, marginLeft: scale(18) },
    welcomeLabel: { fontSize: scale(11), color: '#94A3B8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
    userName: { fontSize: scale(20), fontWeight: '900', color: '#0F172A', marginTop: 2 },
    sectionTitle: { fontSize: scale(13), fontWeight: '900', color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: scale(18), marginLeft: scale(6) },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: scale(25) },
    card: { 
        backgroundColor: '#FFFFFF', width: (SCREEN_WIDTH - scale(60)) / 2, padding: scale(22), 
        borderRadius: 30, marginBottom: scale(16), alignItems: 'center',
        borderWidth: 1, borderColor: '#F1F5F9'
    },
    iconCircle: { width: scale(58), height: scale(58), borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: scale(15) },
    cardIcon: { fontSize: scale(26) },
    cardText: { fontSize: scale(14), fontWeight: '800', color: '#334155' },
    broadcastBanner: { 
        backgroundColor: '#FFFFFF', padding: scale(22), borderRadius: 30, 
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
        borderWidth: 1.5, borderColor: '#EEF2FF', elevation: 4, marginBottom: scale(25) 
    },
    broadcastMain: { flexDirection: 'row', alignItems: 'center' },
    broadcastIconBg: { width: scale(54), height: scale(54), borderRadius: 20, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginRight: scale(16) },
    megaIcon: { fontSize: scale(26) },
    broadcastTitle: { fontSize: scale(17), fontWeight: '900', color: '#4338CA' },
    broadcastSub: { fontSize: scale(12), color: '#6366F1', fontWeight: '600', marginTop: 2 },
    arrowIcon: { fontSize: scale(22), color: '#4338CA', fontWeight: '900' },
    secondaryButton: { padding: scale(20), borderRadius: 24, alignItems: 'center', borderWidth: 2, borderColor: '#E2E8F0', borderStyle: 'dashed' },
    secondaryButtonText: { color: '#94A3B8', fontWeight: '800', fontSize: scale(14) },

    // Modal Engineering
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.85)', justifyContent: 'center', alignItems: 'center', padding: 30 },
    premiumModal: { backgroundColor: '#FFFFFF', borderRadius: 32, padding: 35, width: '100%', alignItems: 'center' },
    modalAccent: { width: 40, height: 4, backgroundColor: '#EF4444', borderRadius: 10, marginBottom: 25 },
    modalTitle: { fontSize: scale(22), fontWeight: '900', color: '#0F172A', textAlign: 'center' },
    modalSub: { fontSize: scale(15), color: '#64748B', textAlign: 'center', lineHeight: 22, marginTop: 12, marginBottom: 30 },
    modalActionRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between' },
    cancelBtn: { flex: 1, paddingVertical: 16, alignItems: 'center', borderRadius: 16, backgroundColor: '#F1F5F9', marginRight: 10 },
    cancelBtnText: { color: '#475569', fontWeight: '800', fontSize: 16 },
    confirmBtn: { flex: 1, paddingVertical: 16, alignItems: 'center', borderRadius: 16, backgroundColor: '#0F172A', marginLeft: 10 },
    confirmBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 }
});

export default AdminDashboard;