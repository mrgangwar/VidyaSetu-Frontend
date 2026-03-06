import React, { useContext, useEffect, useState, useRef, useCallback } from 'react';
import { 
    View, Text, StyleSheet, TouchableOpacity, ScrollView, 
    StatusBar, ActivityIndicator, Animated, Image, Dimensions, 
    Linking, Platform, LayoutAnimation, UIManager, Vibration, Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../api/client'; 
import { registerForPushNotificationsAsync } from '../utils/notificationHelper';
import { Ionicons } from '@expo/vector-icons';

// Get API base URL from environment variable
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ? process.env.EXPO_PUBLIC_API_URL.replace('/api', '') : 'https://vidyasetu-backend-n7ob.onrender.com'; 

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const COLORS = {
    background: '#F8FAFC',
    primaryText: '#1F2937',
    secondaryText: '#64748B',
    accent: '#2563EB',
    cardBg: '#FFFFFF',
    border: '#E2E8F0',
    error: '#DC2626',
    success: '#10B981',
    warning: '#F59E0B'
};

const TeacherDashboard = ({ navigation }) => {
    const { user, logout, updateUser } = useContext(AuthContext);
    const [stats, setStats] = useState({ totalStudents: 0, totalCollected: 0 });
    const [loading, setLoading] = useState(true);
    const [notice, setNotice] = useState(null); 
    const [imgLoading, setImgLoading] = useState(true);

    const blinkAnim = useRef(new Animated.Value(0.4)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const fetchDashboardData = async () => {
        try {
            const [studentsRes, feeStatsRes, noticeRes] = await Promise.allSettled([
                apiClient.get('/teacher/my-students'),
                apiClient.get('/teacher/fee-stats'),
                apiClient.get('/teacher/broadcasts')
            ]);

            let totalStudentsCount = 0;
            let totalCollectedAmount = 0;

            if (studentsRes.status === 'fulfilled') {
                totalStudentsCount = studentsRes.value.data.students?.length || 0;
            }
            if (feeStatsRes.status === 'fulfilled' && feeStatsRes.value.data.success) {
                totalCollectedAmount = feeStatsRes.value.data.stats?.totalCollected || 0;
            }

            setStats({ totalStudents: totalStudentsCount, totalCollected: totalCollectedAmount });

            if (noticeRes.status === 'fulfilled' && noticeRes.value.data.success) {
                const allNotices = noticeRes.value.data.notices;
                setNotice(allNotices && allNotices.length > 0 ? allNotices[0] : null);
            }
        } catch (err) {
            console.log("Dashboard Sync Error:", err.message);
        } finally {
            setLoading(false);
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        }
    };

    const fetchLatestProfile = async () => {
        try {
            const res = await apiClient.get('/teacher/profile'); 
            if (res.data.success) {
                updateUser(res.data.user); 
            }
        } catch (err) {
            console.log("Profile Sync Error:", err.message);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchDashboardData();
            fetchLatestProfile(); 
        }, [])
    );

    useEffect(() => {
        const setupPush = async () => {
            try {
                const token = await registerForPushNotificationsAsync();
                if (token) {
                    await apiClient.post('/auth/update-push-token', { pushToken: token });
                }
            } catch (pushErr) {
                console.log("Push registration bypassed");
            }
        };
        setupPush();

        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(blinkAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
                Animated.timing(blinkAnim, { toValue: 0.4, duration: 1000, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const profilePicSource = user?.profilePhoto 
        ? { uri: user.profilePhoto.startsWith('http') ? user.profilePhoto : `${API_BASE_URL}/${user.profilePhoto.replace(/\\/g, '/')}` }
        : { uri: `https://ui-avatars.com/api/?name=${user?.name}&background=2563EB&color=fff` };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
            
            <Animated.View style={[styles.topHeader, { opacity: fadeAnim }]}>
                <View style={styles.brandSection}>
                    <TouchableOpacity 
                        activeOpacity={0.8}
                        style={styles.logoWrapper} 
                        onPress={() => navigation.navigate('TeacherProfile')}
                    >
                        <View style={styles.profileContainer}>
                            <Image 
                                source={profilePicSource} 
                                style={styles.profileImage} 
                                onLoadEnd={() => setImgLoading(false)}
                            />
                            {imgLoading && (
                                <View style={styles.imgLoader}>
                                    <ActivityIndicator size="small" color={COLORS.accent} />
                                </View>
                            )}
                            <View style={styles.onlineBadge} />
                        </View>
                    </TouchableOpacity>
                    
                    <View style={styles.titleContainer}>
                        <Text style={styles.coachingTitle} numberOfLines={1}>
                            {user?.coachingName || 'VidyaSetu Academy'}
                        </Text>
                        <Text style={styles.teacherSub}>Hello, {user?.name?.split(' ')[0] || 'Teacher'}</Text>
                    </View>
                </View>
                
                <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                    <Ionicons name="log-out-outline" size={22} color={COLORS.error} />
                </TouchableOpacity>
            </Animated.View>

            <ScrollView 
                style={styles.mainContainer} 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={{ paddingBottom: 40 }}
            >
                {notice && (
                    <TouchableOpacity 
                        activeOpacity={0.9}
                        onPress={() => {
                            if(notice.type === 'UPDATE' && notice.downloadLink) {
                                Linking.openURL(notice.downloadLink);
                            } else {
                                navigation.navigate('TeacherBroadcast'); 
                            }
                        }}
                    >
                        <Animated.View style={[
                            styles.noticeCard, 
                            notice.type === 'UPDATE' 
                                ? [styles.updateBanner, { opacity: blinkAnim }] 
                                : styles.adminNoticeBanner
                        ]}>
                            <View style={styles.noticeRow}>
                                <View style={[styles.iconBox, { backgroundColor: notice.type === 'UPDATE' ? '#FFFBEB' : '#EFF6FF' }]}>
                                    <Ionicons 
                                        name={notice.type === 'UPDATE' ? "cloud-download" : "notifications"} 
                                        size={22} 
                                        color={notice.type === 'UPDATE' ? COLORS.warning : COLORS.accent} 
                                    />
                                </View>
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={[styles.adminBadge, { color: notice.type === 'UPDATE' ? COLORS.warning : COLORS.accent }]}>
                                        {notice.type === 'UPDATE' ? 'NEW UPDATE' : 'ANNOUNCEMENT'}
                                    </Text>
                                    <Text style={styles.noticeHeading}>{notice.title}</Text>
                                    <Text style={styles.noticeSubText} numberOfLines={1}>{notice.description}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={18} color={COLORS.secondaryText} />
                            </View>
                        </Animated.View>
                    </TouchableOpacity>
                )}

                <View style={styles.summaryContainer}>
                    <SummaryCard 
                        icon="people" 
                        value={stats.totalStudents} 
                        label="Students" 
                        color={COLORS.accent} 
                    />
                    <SummaryCard 
                        icon="wallet" 
                        value={`₹${stats.totalCollected}`} 
                        label="Earnings" 
                        color={COLORS.success} 
                    />
                </View>

                <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionHeader}>Management Hub</Text>
                    <View style={styles.headerLine} />
                </View>

                <View style={styles.menuGrid}>
                    <MenuIconButton title="Add Student" icon="person-add-outline" color="#4F46E5" onPress={() => navigation.navigate('AddStudent')} />
                    <MenuIconButton title="Mark Attnd." icon="calendar-outline" color="#F59E0B" onPress={() => navigation.navigate('MarkAttendance')} />
                    <MenuIconButton title="Attendance History" icon="time-outline" color="#8B5CF6" onPress={() => navigation.navigate('AttendanceHistory')} />
                    <MenuIconButton title="Homework" icon="book-outline" color="#EC4899" onPress={() => navigation.navigate('GiveHomework')} />
                    <MenuIconButton title="My Students" icon="people-outline" color="#06B6D4" onPress={() => navigation.navigate('MyStudents')} />
                    <MenuIconButton title="Fees" icon="cash-outline" color="#10B981" onPress={() => navigation.navigate('CollectFee')} />
                    <MenuIconButton title="Fee Status" icon="people-circle-outline" color="#8B5CF6" onPress={() => navigation.navigate('StudentFeeStatus')} />
                    <MenuIconButton title="Manage Fees" icon="settings-outline" color="#F97316" onPress={() => navigation.navigate('ManageStudentFees')} />
                    <MenuIconButton title="Analytics" icon="bar-chart-outline" color="#3B82F6" onPress={() => navigation.navigate('FeesDashboard')} />
                    <MenuIconButton title="Broadcast" icon="megaphone-outline" color="#F43F5E" onPress={() => navigation.navigate('TeacherBroadcast')} />
                    
                    {/* ALL BUTTONS RESTORED */}
                    <MenuIconButton title="Notices" icon="notifications-outline" color="#64748B" onPress={() => navigation.navigate('ManageNotices')} />
                    <MenuIconButton title="Support" icon="help-buoy-outline" color="#475569" onPress={() => navigation.navigate('ContactDeveloper')} />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const SummaryCard = ({ icon, value, label, color }) => (
    <View style={styles.summaryCard}>
        <View style={[styles.statIconCircle, { backgroundColor: `${color}10` }]}>
            <Ionicons name={icon} size={20} color={color} />
        </View>
        <View style={{ marginLeft: 10 }}>
            <Text style={styles.summaryValue}>{value}</Text>
            <Text style={styles.summaryLabel}>{label}</Text>
        </View>
    </View>
);

const MenuIconButton = ({ title, icon, color, onPress }) => {
    const scaleValue = useRef(new Animated.Value(1)).current;

    const onPressIn = () => {
        Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    };
    const onPressOut = () => {
        Animated.spring(scaleValue, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();
    };

    return (
        <Pressable 
            onPress={() => {
                Vibration.vibrate(10);
                onPress();
            }}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            style={styles.gridItemContainer}
        >
            <Animated.View style={[styles.gridItem, { transform: [{ scale: scaleValue }] }]}>
                <View style={[styles.iconCircle, { backgroundColor: `${color}10` }]}>
                    <Ionicons name={icon} size={28} color={color} />
                </View>
                <Text style={styles.gridLabel}>{title}</Text>
            </Animated.View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.background },
    topHeader: { 
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
        paddingHorizontal: 20, paddingVertical: 20, backgroundColor: COLORS.background
    },
    brandSection: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    logoWrapper: { position: 'relative' },
    profileContainer: {
        width: 50, height: 50, borderRadius: 15, backgroundColor: COLORS.cardBg,
        shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
    },
    profileImage: { width: 50, height: 50, borderRadius: 15 },
    imgLoader: { position: 'absolute', top: 15, left: 15 },
    onlineBadge: { 
        position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, 
        borderRadius: 7, backgroundColor: COLORS.success, borderWidth: 2, borderColor: COLORS.background 
    },
    titleContainer: { marginLeft: 12, flex: 1 },
    coachingTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.primaryText },
    teacherSub: { fontSize: 13, color: COLORS.secondaryText, marginTop: 1 },
    logoutBtn: { 
        backgroundColor: COLORS.cardBg, padding: 10, borderRadius: 12, 
        borderWidth: 1, borderColor: COLORS.border, elevation: 1 
    },
    mainContainer: { flex: 1, paddingHorizontal: 20 },
    noticeCard: { 
        padding: 16, borderRadius: 20, marginBottom: 20, 
        backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.border,
        elevation: 2
    },
    updateBanner: { borderColor: COLORS.warning, borderLeftWidth: 4 },
    adminNoticeBanner: { borderColor: COLORS.accent, borderLeftWidth: 4 },
    noticeRow: { flexDirection: 'row', alignItems: 'center' },
    iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    adminBadge: { fontSize: 10, fontWeight: 'bold', marginBottom: 2 },
    noticeHeading: { fontSize: 15, fontWeight: '700', color: COLORS.primaryText },
    noticeSubText: { fontSize: 13, color: COLORS.secondaryText, marginTop: 1 },
    summaryContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
    summaryCard: { 
        width: '48%', padding: 14, borderRadius: 20, backgroundColor: COLORS.cardBg,
        flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, elevation: 2
    },
    statIconCircle: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    summaryValue: { fontSize: 16, fontWeight: 'bold', color: COLORS.primaryText },
    summaryLabel: { fontSize: 11, color: COLORS.secondaryText, fontWeight: '600' },
    sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    sectionHeader: { fontSize: 13, fontWeight: '700', color: COLORS.secondaryText, textTransform: 'uppercase' },
    headerLine: { flex: 1, height: 1, backgroundColor: COLORS.border, marginLeft: 12 },
    menuGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    gridItemContainer: { width: '48%', marginBottom: 15 },
    gridItem: { 
        width: '100%', paddingVertical: 22, borderRadius: 24, 
        alignItems: 'center', backgroundColor: COLORS.cardBg, elevation: 3, 
        borderWidth: 1, borderColor: COLORS.border
    },
    iconCircle: { width: 54, height: 54, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    gridLabel: { fontWeight: '700', fontSize: 13, color: COLORS.primaryText },
});

export default TeacherDashboard;