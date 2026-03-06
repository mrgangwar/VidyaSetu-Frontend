import React, { useState, useCallback } from 'react';
import { 
    View, Text, StyleSheet, FlatList, 
    ActivityIndicator, RefreshControl, Dimensions, SafeAreaView, StatusBar, TouchableOpacity, Vibration
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../api/client';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

// Global Design System Colors
const COLORS = {
    background: '#F8FAFC',
    cardBg: '#FFFFFF',
    primary: '#2563EB', // Royal Blue
    charcoal: '#1E293B',
    slate: '#64748B',
    lightGray: '#E2E8F0',
    success: '#10B981',
    error: '#DC2626',
    warning: '#F59E0B'
};

const MyFees = () => {
    const [feesData, setFeesData] = useState({ history: [], stats: {} });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const navigation = useNavigation();

    const fetchFeeRecords = async () => {
        try {
            const res = await apiClient.get('/student/dashboard');
            if (res.data.success) {
                setFeesData({
                    history: res.data.data.feeHistory || [],
                    stats: res.data.data.stats || {}
                });
            }
        } catch (err) {
            console.log("Fee Screen Error:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchFeeRecords();
        }, [])
    );

    const onRefresh = () => {
        Vibration.vibrate(10); // Haptic feedback
        setRefreshing(true);
        fetchFeeRecords();
    };

    // Calculation for visual progress indicator
    const total = (feesData.stats.totalPaid || 0) + (feesData.stats.totalDue || 0);
    const progress = total > 0 ? (feesData.stats.totalPaid / total) : 0;

    const renderFeeItem = ({ item }) => (
        <View style={styles.feeCard}>
            <View style={styles.cardLeft}>
                <View style={[styles.iconCircle, { backgroundColor: '#F0FDF4' }]}>
                    <Ionicons name="shield-check" size={22} color={COLORS.success} />
                </View>
                <View>
                    <Text style={styles.payMethod}>{item.paymentMethod || 'Tuition Fee'}</Text>
                    <Text style={styles.payDate}>
                        {new Date(item.paymentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </Text>
                </View>
            </View>
            <View style={styles.cardRight}>
                <Text style={styles.amountText}>₹{item.amountPaid.toLocaleString('en-IN')}</Text>
                <View style={styles.receiptBadge}>
                    <Text style={styles.receiptNo}>REF: {item.receiptNumber || 'N/A'}</Text>
                </View>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loaderText}>Syncing Ledger Records...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
            
            <View style={styles.headerArea}>
                <Text style={styles.headerTitle}>Financial Overview</Text>
            </View>

            {/* 💳 PREMIUM FINANCIAL DASHBOARD */}
            <View style={styles.mainCard}>
                <View style={styles.cardHeader}>
                    <View>
                        <Text style={styles.cardTitle}>Fee Statement</Text>
                        <Text style={styles.cardSub}>Academic Session 2025-26</Text>
                    </View>
                    <View style={styles.headerIconBg}>
                        <Ionicons name="card" size={24} color="#fff" />
                    </View>
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Total Paid</Text>
                        <Text style={styles.statValue}>₹{(feesData.stats.totalPaid || 0).toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Balance Due</Text>
                        <Text style={[styles.statValue, { color: '#FECACA' }]}>₹{(feesData.stats.totalDue || 0).toLocaleString('en-IN')}</Text>
                    </View>
                </View>

                {/* 📊 PROGRESS ANALYTICS */}
                <View style={styles.progressContainer}>
                    <View style={styles.progressHeader}>
                        <Text style={styles.progressText}>Settlement Progress</Text>
                        <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
                    </View>
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
                    </View>
                </View>
            </View>

            <View style={styles.historyHeader}>
                <Text style={styles.sectionTitle}>Transaction History</Text>
                <TouchableOpacity 
                    activeOpacity={0.6}
                    style={styles.payOnlineBtn}
                    onPress={() => navigation.navigate('PayFees')}
                >
                    <Ionicons name="card" size={16} color={COLORS.primary} />
                    <Text style={styles.payOnlineText}>Pay Online</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={feesData.history}
                keyExtractor={(item) => item._id}
                renderItem={renderFeeItem}
                refreshControl={
                    <RefreshControl 
                        refreshing={refreshing} 
                        onRefresh={onRefresh} 
                        tintColor={COLORS.primary}
                        colors={[COLORS.primary]}
                    />
                }
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIconCircle}>
                            <Ionicons name="receipt-outline" size={48} color={COLORS.lightGray} />
                        </View>
                        <Text style={styles.emptyTitle}>No Records Found</Text>
                        <Text style={styles.emptyText}>Your verified payment receipts will appear here automatically.</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
    loaderText: { marginTop: 14, color: COLORS.slate, fontSize: 13, fontWeight: '600', letterSpacing: 0.5 },
    
    headerArea: { paddingHorizontal: 24, paddingTop: 15, paddingBottom: 5 },
    headerTitle: { fontSize: 28, fontWeight: '900', color: COLORS.charcoal, letterSpacing: -0.8 },

    // 💳 Premium Main Card
    mainCard: { 
        backgroundColor: COLORS.primary, 
        margin: 20, 
        borderRadius: 30, 
        padding: 24, 
        elevation: 10,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 15
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
    cardTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
    cardSub: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginTop: 2 },
    headerIconBg: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 15 },
    
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    statBox: { flex: 1 },
    statLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
    statValue: { color: '#FFFFFF', fontSize: 24, fontWeight: '900', marginTop: 4 },
    statDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: 15 },

    progressContainer: { marginTop: 28 },
    progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    progressText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
    progressBarBg: { height: 6, backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 10, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: COLORS.success, borderRadius: 10 },

    historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 15, marginTop: 5 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.charcoal, letterSpacing: -0.5 },
    payOnlineBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: COLORS.primary },
    payOnlineText: { fontSize: 13, fontWeight: '700', color: COLORS.primary, marginLeft: 6 },

    listContent: { paddingHorizontal: 20, paddingBottom: 40 },
    feeCard: { 
        backgroundColor: COLORS.cardBg, 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        padding: 16, 
        borderRadius: 20, 
        marginBottom: 12, 
        alignItems: 'center', 
        borderWidth: 1,
        borderColor: COLORS.lightGray,
        shadowColor: '#000',
        shadowOpacity: 0.02,
        shadowRadius: 8,
        elevation: 2
    },
    cardLeft: { flexDirection: 'row', alignItems: 'center' },
    iconCircle: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    payMethod: { fontSize: 15, fontWeight: '700', color: COLORS.charcoal },
    payDate: { fontSize: 12, color: COLORS.slate, marginTop: 2, fontWeight: '500' },
    
    cardRight: { alignItems: 'flex-end' },
    amountText: { fontSize: 17, fontWeight: '800', color: COLORS.success },
    receiptBadge: { backgroundColor: COLORS.background, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginTop: 4, borderWidth: 1, borderColor: COLORS.lightGray },
    receiptNo: { fontSize: 9, color: COLORS.slate, fontWeight: '700', letterSpacing: 0.5 },

    emptyState: { alignItems: 'center', marginTop: 60, paddingHorizontal: 50 },
    emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.cardBg, justifyContent: 'center', alignItems: 'center', marginBottom: 20, elevation: 1 },
    emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.charcoal },
    emptyText: { color: COLORS.slate, marginTop: 10, fontSize: 13, textAlign: 'center', lineHeight: 20, fontWeight: '500' }
});

export default MyFees;