import React, { useEffect, useState, useRef } from 'react';
import { 
    View, Text, FlatList, StyleSheet, TouchableOpacity, 
    Linking, ActivityIndicator, RefreshControl, StatusBar, 
    Vibration, Animated, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons'; 
import apiClient from '../../api/client';

// --- GLOBAL DESIGN SYSTEM COLORS ---
const COLORS = {
    background: '#F8FAFC', 
    cardBg: '#FFFFFF',
    primaryText: '#1E293B', 
    secondaryText: '#64748B', 
    placeholder: '#CBD5E1', 
    primary: '#2563EB', // Royal Blue
    midnight: '#0F172A', 
    success: '#10B981', // Emerald Green
    error: '#EF4444', 
    border: '#E2E8F0',
};

const TeacherBroadcastScreen = () => {
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Custom Alert States
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'error' });
    const alertAnim = useRef(new Animated.Value(0)).current;

    const showAlert = (title, message, type = 'error') => {
        setAlertConfig({ title, message, type });
        setAlertVisible(true);
        Vibration.vibrate(type === 'error' ? [0, 50, 100, 50] : 10);
        Animated.spring(alertAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 8 }).start();
    };

    const hideAlert = () => {
        Animated.timing(alertAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => setAlertVisible(false));
    };

    const fetchBroadcasts = async () => {
        try {
            const response = await apiClient.get('/teacher/broadcasts');
            if (response.data.success) {
                setNotices(response.data.notices);
            }
        } catch (error) {
            console.error("Broadcast Fetch Error:", error.response?.data || error.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchBroadcasts();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchBroadcasts();
    };

    const handleDownload = (url) => {
        if (url) {
            Linking.openURL(url).catch(err => showAlert("Connection Error", "Unable to open the requested link.", "error"));
        }
    };

    const renderItem = ({ item }) => {
        const isUpdate = item.type === 'UPDATE';

        return (
            <View style={[styles.card, isUpdate ? styles.updateCard : styles.noticeCard]}>
                <View style={styles.headerRow}>
                    <View style={[styles.badgeContainer, { borderColor: isUpdate ? '#D1FAE5' : '#DBEAFE' }]}>
                        <Ionicons 
                            name={isUpdate ? "rocket-sharp" : "megaphone-sharp"} 
                            size={12} 
                            color={isUpdate ? COLORS.success : COLORS.primary} 
                        />
                        <Text style={[styles.badge, { color: isUpdate ? COLORS.success : COLORS.primary }]}>
                            {item.type}
                        </Text>
                    </View>
                    {item.version && (
                        <View style={styles.versionBadge}>
                            <Text style={styles.versionText}>v{item.version}</Text>
                        </View>
                    )}
                </View>
                
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.description}>{item.description}</Text>
                
                {isUpdate && item.downloadLink && (
                    <TouchableOpacity 
                        activeOpacity={0.8}
                        style={styles.downloadBtn} 
                        onPress={() => handleDownload(item.downloadLink)}
                    >
                        <Ionicons name="cloud-download" size={18} color="#fff" />
                        <Text style={styles.downloadText}>Install Update</Text>
                    </TouchableOpacity>
                )}
                
                <View style={styles.footer}>
                    <Ionicons name="time-outline" size={14} color={COLORS.placeholder} />
                    <Text style={styles.date}>
                        {new Date(item.createdAt).toLocaleDateString('en-GB', {
                            day: '2-digit', month: 'short', year: 'numeric'
                        })}
                    </Text>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingCenter}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Syncing broadcasts...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
            
            <View style={styles.headerSection}>
                <View>
                    <Text style={styles.headerLabel}>Communication</Text>
                    <Text style={styles.screenTitle}>Broadcasts</Text>
                </View>
                <TouchableOpacity onPress={onRefresh} style={styles.syncBtn}>
                    <Ionicons name="refresh" size={20} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={notices}
                keyExtractor={(item) => item._id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl 
                        refreshing={refreshing} 
                        onRefresh={onRefresh} 
                        tintColor={COLORS.primary}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconCircle}>
                            <Ionicons name="notifications-off-outline" size={40} color={COLORS.placeholder} />
                        </View>
                        <Text style={styles.emptyTitle}>Quiet here...</Text>
                        <Text style={styles.emptySub}>Official announcements from the administration will appear here.</Text>
                    </View>
                }
            />

            {/* Custom Alert Dialog */}
            <Modal transparent visible={alertVisible} animationType="none">
                <View style={styles.alertOverlay}>
                    <Animated.View style={[styles.alertBox, { transform: [{ scale: alertAnim }] }]}>
                        <View style={[styles.alertBar, { backgroundColor: COLORS.error }]} />
                        <View style={styles.alertContent}>
                            <Text style={styles.alertTitle}>{alertConfig.title}</Text>
                            <Text style={styles.alertMessage}>{alertConfig.message}</Text>
                            <TouchableOpacity style={styles.alertDismissBtn} onPress={hideAlert}>
                                <Text style={styles.alertDismissText}>Got it</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
    loadingText: { marginTop: 12, color: COLORS.secondaryText, fontWeight: '600' },
    headerSection: { 
        paddingHorizontal: 24, paddingVertical: 20, 
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' 
    },
    headerLabel: { fontSize: 12, fontWeight: '800', color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 1.5 },
    screenTitle: { fontSize: 32, fontWeight: '900', color: COLORS.primaryText, letterSpacing: -0.5 },
    syncBtn: { backgroundColor: '#EEF2FF', padding: 12, borderRadius: 15 },
    listContainer: { paddingHorizontal: 20, paddingBottom: 40 },
    card: { 
        padding: 22, borderRadius: 28, backgroundColor: COLORS.cardBg, marginBottom: 16, 
        borderWidth: 1, borderColor: COLORS.border, elevation: 4, 
        shadowColor: COLORS.midnight, shadowOpacity: 0.04, shadowRadius: 12, shadowOffset: { width: 0, height: 8 }
    },
    updateCard: { borderTopWidth: 4, borderTopColor: COLORS.success },
    noticeCard: { borderTopWidth: 4, borderTopColor: COLORS.primary },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    badgeContainer: { 
        flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, 
        paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 
    },
    badge: { fontSize: 10, fontWeight: '800', marginLeft: 6, textTransform: 'uppercase' },
    versionBadge: { backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    versionText: { fontSize: 11, color: COLORS.success, fontWeight: '800' },
    title: { fontSize: 20, fontWeight: '800', color: COLORS.primaryText, lineHeight: 26 },
    description: { fontSize: 15, color: COLORS.secondaryText, marginTop: 10, lineHeight: 22, fontWeight: '500' },
    downloadBtn: { 
        flexDirection: 'row', backgroundColor: COLORS.midnight, paddingVertical: 14, 
        borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 20 
    },
    downloadText: { color: '#FFFFFF', fontWeight: '700', marginLeft: 10, fontSize: 15 },
    footer: { 
        flexDirection: 'row', alignItems: 'center', marginTop: 18, 
        borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12 
    },
    date: { fontSize: 12, color: COLORS.placeholder, marginLeft: 6, fontWeight: '600' },
    emptyContainer: { alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
    emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.border, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.primaryText, marginBottom: 8 },
    emptySub: { textAlign: 'center', color: COLORS.secondaryText, fontSize: 14, lineHeight: 20 },
    // Alert Styles
    alertOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 30 },
    alertBox: { width: '100%', backgroundColor: COLORS.cardBg, borderRadius: 28, overflow: 'hidden', elevation: 24 },
    alertBar: { height: 6 },
    alertContent: { padding: 25, alignItems: 'center' },
    alertTitle: { fontSize: 20, fontWeight: '900', color: COLORS.midnight, marginBottom: 10 },
    alertMessage: { fontSize: 15, color: COLORS.secondaryText, textAlign: 'center', marginBottom: 20, lineHeight: 22 },
    alertDismissBtn: { backgroundColor: COLORS.background, paddingVertical: 12, paddingHorizontal: 35, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border },
    alertDismissText: { color: COLORS.midnight, fontWeight: '800', fontSize: 14 }
});

export default TeacherBroadcastScreen;