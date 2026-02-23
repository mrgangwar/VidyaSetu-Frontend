import React, { useState, useCallback, useContext, useEffect, useRef } from 'react';
import { 
    View, Text, StyleSheet, ScrollView, TouchableOpacity, 
    Image, Dimensions, ActivityIndicator, RefreshControl, Animated, 
    Linking, StatusBar, Vibration, Pressable, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PieChart } from 'react-native-chart-kit';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../api/client';
import { useFocusEffect } from '@react-navigation/native';

// Get API base URL from environment variable
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ? process.env.EXPO_PUBLIC_API_URL.replace('/api', '') : 'https://vidyasetu-backend-n7ob.onrender.com';

const { width } = Dimensions.get('window');

const COLORS = {
    background: '#F8FAFC',
    primaryText: '#1F2937',
    secondaryText: '#64748B',
    accent: '#2563EB', // Royal Blue
    cardBg: '#FFFFFF',
    border: '#E2E8F0',
    error: '#DC2626',
    success: '#10B981',
    warning: '#F59E0B',
    midnight: '#1E1B4B'
};

const StudentDashboard = ({ navigation }) => {
    const { logout } = useContext(AuthContext);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [imgLoading, setImgLoading] = useState(true);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    
    const [updateNotice, setUpdateNotice] = useState(null);
    const blinkAnim = useRef(new Animated.Value(1)).current;
    const modalFade = useRef(new Animated.Value(0)).current;

    const fetchDashboard = async () => {
        try {
            const res = await apiClient.get('/student/dashboard');
            if (res.data.success) {
                setData(res.data.data);
                const notices = res.data.data.notices || [];
                const update = notices.find(n => n.type === 'UPDATE');
                setUpdateNotice(update);
            }
        } catch (err) {
            console.log("Dashboard Sync Error:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchDashboard();
        }, [])
    );

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(blinkAnim, { toValue: 0.5, duration: 1200, useNativeDriver: true }),
                Animated.timing(blinkAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, []);

    const onRefresh = () => {
        Vibration.vibrate(10);
        setRefreshing(true);
        fetchDashboard();
    };

    const triggerLogoutModal = () => {
        Vibration.vibrate([0, 20, 50, 20]);
        setShowLogoutModal(true);
        Animated.timing(modalFade, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    };

    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={COLORS.accent} />
                <Text style={styles.loaderText}>Syncing Academy Portal...</Text>
            </View>
        );
    }

    const feeChartData = [
        { name: 'Paid', amount: data?.stats?.totalPaid || 0, color: COLORS.accent, legendFontColor: COLORS.secondaryText, legendFontSize: 12 },
        { name: 'Due', amount: data?.stats?.totalDue || 0, color: COLORS.error, legendFontColor: COLORS.secondaryText, legendFontSize: 12 }
    ];

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.cardBg} />
            
            <ScrollView 
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
                showsVerticalScrollIndicator={false}
            >
                {/* BRAND HEADER */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.welcomeText}>Student Access Portal</Text>
                        <Text style={styles.coachingName} numberOfLines={1}>
                            {data?.profile?.coachingId?.coachingName || 'VIDYA SETU'}
                        </Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity onPress={triggerLogoutModal} style={styles.actionIcon}>
                            <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
                        </TouchableOpacity>
                        <TouchableOpacity 
                            onPress={() => navigation.navigate('MyProfile')}
                            activeOpacity={0.8}
                            style={styles.profileWrapper}
                        >
                            <Image
                                source={data?.profile?.profilePhoto
                                    ? { uri: data.profile.profilePhoto.startsWith('http') ? data.profile.profilePhoto : `https://vidyasetu-backend-n7ob.onrender.com/${data.profile.profilePhoto.replace(/\\/g, '/').replace(/^\//, '')}` }
                                    : { uri: `https://ui-avatars.com/api/?name=${data?.profile?.name}&background=2563EB&color=fff` }}
                                style={styles.profileImg}
                                onLoadEnd={() => setImgLoading(false)}
                            />
                            {imgLoading && <ActivityIndicator size="small" color={COLORS.accent} style={styles.imgLoader} />}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* CRITICAL SYSTEM UPDATE */}
                {updateNotice && (
                    <TouchableOpacity 
                        activeOpacity={0.9}
                        onPress={() => {
                            Vibration.vibrate(10);
                            updateNotice.downloadLink && Linking.openURL(updateNotice.downloadLink);
                        }}
                        style={styles.updateContainer}
                    >
                        <Animated.View style={[styles.updateBanner, { opacity: blinkAnim }]}>
                            <View style={styles.updateIconContainer}>
                                <Ionicons name="cloud-download" size={22} color={COLORS.cardBg} />
                            </View>
                            <View style={styles.updateTextContent}>
                                <Text style={styles.updateTag}>Update Available</Text>
                                <Text style={styles.updateTitleText} numberOfLines={1}>{updateNotice.title}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color={COLORS.accent} />
                        </Animated.View>
                    </TouchableOpacity>
                )}

                {/* ANALYTICS SECTION */}
                <View style={styles.analyticsCard}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>Performance & Fees</Text>
                        <View style={styles.attendanceChip}>
                            <Ionicons name="checkmark-circle" size={12} color={COLORS.success} />
                            <Text style={styles.attendanceValue}>{data?.stats?.attendancePercentage}% Present</Text>
                        </View>
                    </View>

                    <View style={styles.chartWrapper}>
                        <PieChart
                            data={feeChartData}
                            width={width - 80}
                            height={180}
                            chartConfig={{ color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})` }}
                            accessor={"amount"}
                            backgroundColor={"transparent"}
                            paddingLeft={"15"}
                            center={[10, 0]}
                            absolute
                        />
                    </View>

                    <View style={styles.financialSummary}>
                        <View style={styles.summaryBox}>
                            <Text style={styles.summaryLabel}>Total Paid</Text>
                            <Text style={styles.summaryValuePaid}>₹{data?.stats?.totalPaid}</Text>
                        </View>
                        <View style={styles.verticalDivider} />
                        <View style={styles.summaryBox}>
                            <Text style={styles.summaryLabel}>Balance Due</Text>
                            <Text style={styles.summaryValueDue}>₹{data?.stats?.totalDue}</Text>
                        </View>
                    </View>
                </View>

                {/* NOTIFICATION HUB */}
                <View style={styles.sectionHeading}>
                    <Text style={styles.primaryTitle}>Recent Notices</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('AllNotices')}>
                        <Text style={styles.linkText}>See All</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    contentContainerStyle={styles.horizontalScroll}
                >
                    {data?.notices?.filter(n => n.type !== 'UPDATE').length > 0 ? (
                        data.notices.filter(n => n.type !== 'UPDATE').map((notice, index) => (
                            <View 
                                key={index} 
                                style={[
                                    styles.horizontalCard, 
                                    { borderLeftColor: !notice.coachingId ? COLORS.error : COLORS.accent } 
                                ]}
                            >
                                <View style={styles.noticeMeta}>
                                    <Text style={styles.noticeTimestamp}>
                                        {new Date(notice.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                    </Text>
                                    <View style={[styles.originBadge, { backgroundColor: !notice.coachingId ? '#FEE2E2' : '#DBEAFE' }]}>
                                        <Text style={[styles.originText, { color: !notice.coachingId ? COLORS.error : COLORS.accent }]}>
                                            {!notice.coachingId ? 'ADMIN' : 'CAMPUS'}
                                        </Text>
                                    </View>
                                </View>
                                <Text style={styles.itemHeading} numberOfLines={1}>{notice.title}</Text>
                                <Text style={styles.itemContent} numberOfLines={2}>{notice.description || notice.message}</Text>
                            </View>
                        ))
                    ) : (
                        <View style={styles.placeholderContainer}>
                            <Ionicons name="notifications-off-outline" size={32} color={COLORS.border} />
                            <Text style={styles.placeholderText}>No new announcements</Text>
                        </View>
                    )}
                </ScrollView>

                {/* NAVIGATION GRID */}
                <View style={styles.navigationGrid}>
                    <GridItem title="Attendance" icon="calendar" color="#4F46E5" onPress={() => navigation.navigate('MyAttendance')} />
                    <GridItem title="Homework" icon="book" color="#EC4899" onPress={() => navigation.navigate('MyHomework')} />
                    <GridItem title="Fee Ledger" icon="card" color="#10B981" onPress={() => navigation.navigate('MyFees')} />
                    <GridItem title="Profile" icon="person" color={COLORS.accent} onPress={() => navigation.navigate('MyProfile')} />
                    <GridItem title="Teachers" icon="school" color="#F59E0B" onPress={() => navigation.navigate('MyTeachers')} />
                    <GridItem title="Support" icon="help-buoy" color="#64748B" onPress={() => navigation.navigate('ContactDeveloper')} />
                </View>
                
                <View style={{height: 40}} />
            </ScrollView>

            {/* CUSTOM LOGOUT MODAL */}
            <Modal transparent visible={showLogoutModal} animationType="none">
                <View style={styles.modalOverlay}>
                    <Animated.View style={[styles.modalContent, { opacity: modalFade, transform: [{ scale: modalFade }] }]}>
                        <View style={[styles.alertIconCircle, { backgroundColor: '#FEE2E2' }]}>
                            <Ionicons name="power" size={30} color={COLORS.error} />
                        </View>
                        <Text style={styles.modalTitle}>Terminate Session?</Text>
                        <Text style={styles.modalMessage}>Are you sure you want to log out of VidyaSetu?</Text>
                        <View style={styles.modalActionRow}>
                            <TouchableOpacity style={styles.modalBtnSecondary} onPress={() => setShowLogoutModal(false)}>
                                <Text style={styles.modalBtnTextSecondary}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={styles.modalBtnPrimary} 
                                onPress={() => {
                                    setShowLogoutModal(false);
                                    logout();
                                }}
                            >
                                <Text style={styles.modalBtnTextPrimary}>Logout</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const GridItem = ({ title, icon, color, onPress }) => {
    const scaleValue = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => Animated.spring(scaleValue, { toValue: 0.92, useNativeDriver: true }).start();
    const handlePressOut = () => Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();

    return (
        <Pressable 
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={() => {
                Vibration.vibrate(10);
                onPress();
            }} 
            style={styles.gridElementWrapper}
        >
            <Animated.View style={[styles.gridElement, { transform: [{ scale: scaleValue }] }]}>
                <View style={[styles.gridIconBackground, { backgroundColor: color + '15' }]}>
                    <Ionicons name={icon} size={24} color={color} />
                </View>
                <Text style={styles.gridLabel}>{title}</Text>
            </Animated.View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.cardBg },
    loaderText: { marginTop: 15, color: COLORS.secondaryText, fontSize: 14, fontWeight: '600' },
    
    header: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingHorizontal: 24, 
        paddingVertical: 20, 
        backgroundColor: COLORS.cardBg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border
    },
    headerLeft: { flex: 1 },
    welcomeText: { fontSize: 11, color: COLORS.secondaryText, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
    coachingName: { fontSize: 22, fontWeight: '900', color: COLORS.midnight, letterSpacing: -0.5 },
    headerActions: { flexDirection: 'row', alignItems: 'center' },
    actionIcon: { marginRight: 12, backgroundColor: '#F8FAFC', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
    profileWrapper: { position: 'relative' },
    profileImg: { width: 46, height: 46, borderRadius: 14, backgroundColor: COLORS.background, borderWidth: 2, borderColor: COLORS.border },
    imgLoader: { position: 'absolute', top: 13, left: 13 },
    
    updateContainer: { paddingHorizontal: 24, marginVertical: 20 },
    updateBanner: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: COLORS.cardBg, 
        padding: 14, 
        borderRadius: 20, 
        borderWidth: 1, 
        borderColor: COLORS.accent,
        elevation: 4,
        shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8
    },
    updateIconContainer: { width: 42, height: 42, borderRadius: 12, backgroundColor: COLORS.accent, justifyContent: 'center', alignItems: 'center' },
    updateTextContent: { flex: 1, marginLeft: 14 },
    updateTag: { fontSize: 10, fontWeight: '900', color: COLORS.accent, textTransform: 'uppercase' },
    updateTitleText: { fontSize: 14, fontWeight: '700', color: COLORS.primaryText, marginTop: 1 },

    analyticsCard: { 
        backgroundColor: COLORS.cardBg, 
        marginHorizontal: 24, 
        borderRadius: 28, 
        padding: 24, 
        borderWidth: 1,
        borderColor: COLORS.border,
        elevation: 2
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardTitle: { fontSize: 16, fontWeight: '800', color: COLORS.primaryText },
    attendanceChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
    attendanceValue: { color: COLORS.success, fontSize: 10, fontWeight: '800', marginLeft: 4 },
    chartWrapper: { alignItems: 'center', marginVertical: 10 },
    financialSummary: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        marginTop: 10, 
        paddingTop: 20, 
        borderTopWidth: 1, 
        borderTopColor: COLORS.background 
    },
    summaryBox: { flex: 1, alignItems: 'center' },
    summaryLabel: { fontSize: 10, color: COLORS.secondaryText, fontWeight: '800', textTransform: 'uppercase', marginBottom: 4 },
    summaryValuePaid: { fontSize: 20, fontWeight: '900', color: COLORS.accent },
    summaryValueDue: { fontSize: 20, fontWeight: '900', color: COLORS.error },
    verticalDivider: { width: 1, backgroundColor: COLORS.border },

    sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 28, marginTop: 30 },
    primaryTitle: { fontSize: 18, fontWeight: '900', color: COLORS.primaryText },
    linkText: { color: COLORS.accent, fontSize: 12, fontWeight: '800' },
    
    horizontalScroll: { paddingLeft: 24, paddingRight: 10, paddingVertical: 15 },
    horizontalCard: { 
        backgroundColor: COLORS.cardBg, 
        width: 260, 
        padding: 20, 
        borderRadius: 24, 
        marginRight: 15, 
        borderLeftWidth: 5,
        borderWidth: 1,
        borderColor: COLORS.border,
        elevation: 2
    },
    noticeMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    noticeTimestamp: { fontSize: 11, color: COLORS.secondaryText, fontWeight: '700' },
    originBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    originText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
    itemHeading: { fontSize: 15, fontWeight: '800', color: COLORS.primaryText, marginBottom: 4 },
    itemContent: { fontSize: 13, color: COLORS.secondaryText, lineHeight: 18 },
    
    placeholderContainer: { 
        width: width - 48, 
        alignItems: 'center', 
        justifyContent: 'center', 
        paddingVertical: 40, 
        backgroundColor: COLORS.cardBg, 
        borderRadius: 24, 
        borderWidth: 1, 
        borderColor: COLORS.border,
        borderStyle: 'dashed' 
    },
    placeholderText: { marginTop: 12, color: COLORS.secondaryText, fontSize: 13, fontWeight: '700' },

    navigationGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, justifyContent: 'space-between', marginTop: 10 },
    gridElementWrapper: { width: '31%', marginBottom: 15 },
    gridElement: { 
        backgroundColor: COLORS.cardBg, 
        aspectRatio: 1,
        borderRadius: 22, 
        alignItems: 'center', 
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
        elevation: 2
    },
    gridIconBackground: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    gridLabel: { fontSize: 10, fontWeight: '800', color: COLORS.primaryText },

    // MODAL STYLES
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    modalContent: { backgroundColor: COLORS.cardBg, borderRadius: 30, padding: 30, width: '100%', alignItems: 'center', elevation: 20 },
    alertIconCircle: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '900', color: COLORS.midnight, marginBottom: 10 },
    modalMessage: { fontSize: 15, color: COLORS.secondaryText, textAlign: 'center', marginBottom: 30, lineHeight: 22 },
    modalActionRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between' },
    modalBtnSecondary: { flex: 1, paddingVertical: 15, marginRight: 10, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
    modalBtnPrimary: { flex: 1, paddingVertical: 15, marginLeft: 10, borderRadius: 16, alignItems: 'center', backgroundColor: COLORS.error },
    modalBtnTextSecondary: { color: COLORS.primaryText, fontWeight: '700' },
    modalBtnTextPrimary: { color: '#FFF', fontWeight: '700' }
});

export default StudentDashboard;