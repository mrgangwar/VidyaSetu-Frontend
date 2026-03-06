import React, { useState, useEffect, useCallback } from 'react';
import { 
    View, Text, StyleSheet, FlatList, ActivityIndicator, 
    RefreshControl, SafeAreaView, Dimensions, StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../api/client';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const MyAttendance = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({ present: 0, absent: 0 });

    const fetchAttendance = async () => {
        try {
            const res = await apiClient.get('/student/attendance-history');
            if (res.data.success) {
                setHistory(res.data.history);
                
                // Statistical calculation for dashboard metrics
                const presentCount = res.data.history.filter(h => h.status === 'Present').length;
                const absentCount = res.data.history.filter(h => h.status === 'Absent').length;
                const holidayCount = res.data.history.filter(h => h.status === 'Holiday').length;
                const leaveCount = res.data.history.filter(h => h.status === 'Leave').length;
                setStats({ present: presentCount, absent: absentCount, holiday: holidayCount, leave: leaveCount });
            }
        } catch (err) {
            console.log("Attendance Fetch Error:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchAttendance();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchAttendance();
    };

    const renderItem = ({ item }) => {
        const isPresent = item.status === 'Present';
        const isAbsent = item.status === 'Absent';
        const isHoliday = item.status === 'Holiday';
        const isLeave = item.status === 'Leave';
        const dateObj = new Date(item.date);
        
        // Determine colors based on status
        let statusColor, statusBg, statusIcon;
        if (isPresent) {
            statusColor = '#16A34A';
            statusBg = '#F0FDF4';
            statusIcon = 'checkmark-circle';
        } else if (isHoliday) {
            statusColor = '#2563EB';
            statusBg = '#EFF6FF';
            statusIcon = 'calendar';
        } else if (isLeave) {
            statusColor = '#D97706';
            statusBg = '#FEF3C7';
            statusIcon = 'calendar-outline';
        } else {
            statusColor = '#E11D48';
            statusBg = '#FFF1F2';
            statusIcon = 'close-circle';
        }
        
        return (
            <View style={styles.row}>
                <View style={styles.leftContent}>
                    <View style={[styles.dateBox, { backgroundColor: statusBg }]}>
                        <Text style={[styles.dateDay, { color: statusColor }]}>
                            {dateObj.getDate()}
                        </Text>
                        <Text style={[styles.dateMonth, { color: statusColor }]}>
                            {dateObj.toLocaleDateString('en-US', { month: 'short' })}
                        </Text>
                    </View>
                    <View style={styles.textInfo}>
                        <Text style={styles.dayName}>{dateObj.toLocaleDateString('en-US', { weekday: 'long' })}</Text>
                        <Text style={styles.yearText}>{dateObj.getFullYear()}</Text>
                    </View>
                </View>

                <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                    <Ionicons 
                        name={statusIcon} 
                        size={16} 
                        color={statusColor} 
                    />
                    <Text style={[styles.statusText, { color: statusColor }]}>
                        {item.status}
                    </Text>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#6366F1" />
                <Text style={styles.loaderText}>Syncing Attendance Logs</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            
            {/* ANALYTICS HEADER */}
            <View style={styles.headerSection}>
                <Text style={styles.mainTitle}>Attendance Insight</Text>
                <View style={styles.statsContainer}>
                    <View style={[styles.statCard, { borderLeftColor: '#10B981' }]}>
                        <Text style={styles.statValue}>{stats.present}</Text>
                        <Text style={styles.statLabel}>Present</Text>
                    </View>
                    <View style={[styles.statCard, { borderLeftColor: '#E11D48' }]}>
                        <Text style={styles.statValue}>{stats.absent}</Text>
                        <Text style={styles.statLabel}>Absent</Text>
                    </View>
                    <View style={[styles.statCard, { borderLeftColor: '#2563EB' }]}>
                        <Text style={styles.statValue}>{stats.holiday || 0}</Text>
                        <Text style={styles.statLabel}>Holiday</Text>
                    </View>
                    <View style={[styles.statCard, { borderLeftColor: '#D97706' }]}>
                        <Text style={styles.statValue}>{stats.leave || 0}</Text>
                        <Text style={styles.statLabel}>Leave</Text>
                    </View>
                </View>
            </View>

            {/* TIMELINE LIST */}
            <FlatList
                data={history}
                keyExtractor={(item) => item._id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContainer}
                refreshControl={
                    <RefreshControl 
                        refreshing={refreshing} 
                        onRefresh={onRefresh} 
                        tintColor="#6366F1" 
                        colors={['#6366F1']} 
                    />
                }
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyBox}>
                        <View style={styles.emptyIconCircle}>
                            <Ionicons name="calendar-clear-outline" size={48} color="#CBD5E1" />
                        </View>
                        <Text style={styles.emptyTitle}>No Records Found</Text>
                        <Text style={styles.emptyDesc}>Your session history will appear here once faculty marks your attendance.</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
    loaderText: { marginTop: 14, color: '#94A3B8', fontSize: 13, fontWeight: '600', letterSpacing: 0.5 },
    
    headerSection: { 
        backgroundColor: '#FFFFFF', 
        paddingHorizontal: 24, 
        paddingTop: 20,
        paddingBottom: 30, 
        borderBottomLeftRadius: 32, 
        borderBottomRightRadius: 32, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05, 
        shadowRadius: 20,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#F1F5F9'
    },
    mainTitle: { fontSize: 26, fontWeight: '900', color: '#0F172A', marginBottom: 24, letterSpacing: -0.5 },
    
    statsContainer: { flexDirection: 'row', justifyContent: 'space-between' },
    statCard: { 
        backgroundColor: '#F8FAFC', 
        width: (width - 68) / 3, 
        padding: 16, 
        borderRadius: 20, 
        borderLeftWidth: 4,
        borderWidth: 1,
        borderColor: '#F1F5F9'
    },
    statValue: { fontSize: 22, fontWeight: '900', color: '#1E293B' },
    statLabel: { fontSize: 10, color: '#64748B', fontWeight: '800', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },

    listContainer: { padding: 24, paddingBottom: 40 },
    row: { 
        backgroundColor: '#FFFFFF', 
        padding: 14, 
        borderRadius: 24, 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 16, 
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000', 
        shadowOpacity: 0.02,
        shadowRadius: 10,
        elevation: 2
    },
    leftContent: { flexDirection: 'row', alignItems: 'center' },
    dateBox: { width: 52, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    dateDay: { fontSize: 20, fontWeight: '900' },
    dateMonth: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', marginTop: -2 },
    
    textInfo: { marginLeft: 16 },
    dayName: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
    yearText: { fontSize: 12, color: '#94A3B8', fontWeight: '600', marginTop: 2 },

    statusBadge: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingHorizontal: 12, 
        paddingVertical: 8, 
        borderRadius: 14 
    },
    statusText: { marginLeft: 6, fontWeight: '900', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.3 },

    emptyBox: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
    emptyIconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9'
    },
    emptyTitle: { fontSize: 20, fontWeight: '900', color: '#1E293B' },
    emptyDesc: { fontSize: 14, color: '#94A3B8', textAlign: 'center', marginTop: 10, lineHeight: 22, fontWeight: '500' }
});

export default MyAttendance;