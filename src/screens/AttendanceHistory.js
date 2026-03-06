import React, { useState, useEffect, useRef } from 'react';
import { 
    View, Text, StyleSheet, FlatList, TouchableOpacity, 
    ActivityIndicator, SafeAreaView, StatusBar, Dimensions, 
    Platform, Vibration, Animated, Modal 
} from 'react-native';
import apiClient from '../api/client';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// --- GLOBAL DESIGN SYSTEM CONSTANTS ---
const COLORS = {
    background: '#F8FAFC', // Soft White
    primaryText: '#1F2937', // Charcoal Gray
    secondaryText: '#64748B', // Slate Gray
    placeholder: '#CBD5E1', // Light Gray
    cardBg: '#FFFFFF',
    border: '#E2E8F0',
    accent: '#2563EB', // Royal Blue
    midnight: '#0F172A', // Midnight Blue (Alert Title)
    success: '#10B981', // Emerald Green
    error: '#DC2626', // Crimson Red
    warning: '#F59E0B', // Amber
};

const AttendanceHistory = () => {
    const [date, setDate] = useState(new Date());
    const [showPicker, setShowPicker] = useState(false);
    const [records, setRecords] = useState([]); 
    const [loading, setLoading] = useState(false);

    // Custom Alert State
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'success' });
    const alertPopAnim = useRef(new Animated.Value(0)).current;

    const showAlert = (title, message, type = 'success') => {
        setAlertConfig({ title, message, type });
        setAlertVisible(true);
        Vibration.vibrate(type === 'error' ? [0, 50, 100, 50] : 15);
        Animated.spring(alertPopAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 8 }).start();
    };

    const hideAlert = () => {
        Animated.timing(alertPopAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setAlertVisible(false));
    };

    const fetchHistory = async (selectedDate) => {
        setLoading(true);
        try {
            const formattedDate = selectedDate.toISOString().split('T')[0];
            const res = await apiClient.get(`/teacher/attendance-history?date=${formattedDate}`);
            
            if (res.data.success) {
                setRecords(res.data.attendance || []);
            }
        } catch (err) {
            showAlert("System Error", "Failed to retrieve attendance records.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory(date);
    }, []);

    const onDateChange = (event, selectedDate) => {
        setShowPicker(false);
        if (selectedDate) {
            Vibration.vibrate(10);
            setDate(selectedDate);
            fetchHistory(selectedDate);
        }
    };

    const getStatusStyle = (status) => {
        switch(status) {
            case 'Present': return { bg: '#F0FDF4', text: COLORS.success, icon: 'checkmark-circle' };
            case 'Absent': return { bg: '#FEF2F2', text: COLORS.error, icon: 'close-circle' };
            case 'Late': return { bg: '#FFFBEB', text: COLORS.warning, icon: 'time' };
            case 'Holiday': return { bg: '#EFF6FF', text: COLORS.accent, icon: 'calendar' };
            case 'Leave': return { bg: '#FEF3C7', text: '#D97706', icon: 'calendar-outline' };
            default: return { bg: COLORS.background, text: COLORS.secondaryText, icon: 'help-circle' };
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.cardBg} />
            
            <View style={styles.mainContent}>
                {/* Header Section */}
                <View style={styles.header}>
                    <Text style={styles.headerSubtitle}>History Logs</Text>
                    <Text style={styles.title}>Attendance Records</Text>
                    
                    <TouchableOpacity 
                        activeOpacity={0.8}
                        style={styles.dateSelector} 
                        onPress={() => setShowPicker(true)}
                    >
                        <View style={styles.dateInfo}>
                            <Text style={styles.dateLabel}>Selected Date</Text>
                            <Text style={styles.dateValue}>
                                {date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </Text>
                        </View>
                        <View style={styles.calendarIconCircle}>
                            <Ionicons name="calendar" size={20} color="#FFFFFF" />
                        </View>
                    </TouchableOpacity>
                </View>

                {showPicker && (
                    <DateTimePicker 
                        value={date} 
                        mode="date" 
                        display={Platform.OS === 'ios' ? 'inline' : 'default'}
                        maximumDate={new Date()}
                        onChange={onDateChange} 
                    />
                )}

                {loading ? (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color={COLORS.accent} />
                        <Text style={styles.loaderSubtext}>Fetching records...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={records}
                        keyExtractor={item => item._id}
                        contentContainerStyle={styles.listContainer}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Ionicons name="document-text-outline" size={60} color={COLORS.placeholder} />
                                <Text style={styles.emptyText}>No records found for this date.</Text>
                            </View>
                        }
                        renderItem={({ item }) => {
                            const statusStyle = getStatusStyle(item.status);
                            return (
                                <View style={styles.card}>
                                    <View style={styles.studentDetails}>
                                        <Text style={styles.studentName} numberOfLines={1}>
                                            {item.studentId?.name || 'Unknown Student'}
                                        </Text>
                                        <Text style={styles.metaData}>
                                            ID: {item.studentId?.studentLoginId || 'N/A'} • {item.studentId?.batchTime || 'General'}
                                        </Text>
                                    </View>
                                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                                        <Ionicons name={statusStyle.icon} size={14} color={statusStyle.text} style={{marginRight: 4}} />
                                        <Text style={[styles.statusText, { color: statusStyle.text }]}>
                                            {item.status}
                                        </Text>
                                    </View>
                                </View>
                            );
                        }}
                    />
                )}
            </View>

            {/* Custom Alert Modal */}
            <Modal transparent visible={alertVisible} animationType="none">
                <View style={styles.modalOverlay}>
                    <Animated.View style={[
                        styles.alertBox, 
                        { transform: [{ scale: alertPopAnim }], opacity: alertPopAnim }
                    ]}>
                        <View style={[styles.alertAccentBar, { backgroundColor: alertConfig.type === 'error' ? COLORS.error : COLORS.success }]} />
                        <View style={styles.alertBody}>
                            <Ionicons 
                                name={alertConfig.type === 'error' ? "alert-circle" : "checkmark-circle"} 
                                size={50} 
                                color={alertConfig.type === 'error' ? COLORS.error : COLORS.success} 
                            />
                            <Text style={styles.alertTitleText}>{alertConfig.title}</Text>
                            <Text style={styles.alertMessageText}>{alertConfig.message}</Text>
                            <TouchableOpacity style={styles.alertCloseBtn} onPress={hideAlert}>
                                <Text style={styles.alertCloseBtnText}>Dismiss</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.cardBg },
    mainContent: { flex: 1, backgroundColor: COLORS.background },
    header: { 
        backgroundColor: COLORS.cardBg, paddingHorizontal: 24, paddingBottom: 30, paddingTop: 10,
        borderBottomLeftRadius: 35, borderBottomRightRadius: 35, elevation: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 15
    },
    headerSubtitle: { fontSize: 11, fontWeight: '800', color: COLORS.accent, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 5 },
    title: { fontSize: 26, fontWeight: '900', color: COLORS.primaryText, marginBottom: 20, letterSpacing: -0.5 },
    dateSelector: { 
        backgroundColor: COLORS.accent, padding: 16, borderRadius: 24, 
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        elevation: 10, shadowColor: COLORS.accent, shadowOpacity: 0.3, shadowRadius: 15, shadowOffset: { width: 0, height: 8 }
    },
    dateInfo: { flex: 1 },
    dateLabel: { color: 'rgba(255, 255, 255, 0.7)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    dateValue: { fontSize: 17, fontWeight: '800', color: '#FFFFFF', marginTop: 2 },
    calendarIconCircle: { width: 42, height: 42, backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
    listContainer: { paddingHorizontal: 20, paddingTop: 25, paddingBottom: 40 },
    card: { 
        backgroundColor: COLORS.cardBg, padding: 18, borderRadius: 24, flexDirection: 'row', 
        justifyContent: 'space-between', alignItems: 'center', marginBottom: 15,
        borderWidth: 1, borderColor: COLORS.border, elevation: 4, shadowColor: '#000', shadowOpacity: 0.03
    },
    studentDetails: { flex: 1, marginRight: 10 },
    studentName: { fontSize: 16, fontWeight: '800', color: COLORS.primaryText, letterSpacing: -0.3 },
    metaData: { fontSize: 12, color: COLORS.secondaryText, marginTop: 4, fontWeight: '500' },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, minWidth: 95, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
    statusText: { fontWeight: '800', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loaderSubtext: { marginTop: 10, color: COLORS.secondaryText, fontWeight: '600', fontSize: 13 },
    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: width * 0.35 },
    emptyText: { textAlign: 'center', color: COLORS.secondaryText, fontSize: 15, fontWeight: '600', marginTop: 15 },
    
    // Alert Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'center', alignItems: 'center', padding: 25 },
    alertBox: { width: '100%', backgroundColor: COLORS.cardBg, borderRadius: 30, overflow: 'hidden' },
    alertAccentBar: { height: 6 },
    alertBody: { padding: 35, alignItems: 'center' },
    alertTitleText: { fontSize: 22, fontWeight: '900', color: COLORS.midnight, marginTop: 15 },
    alertMessageText: { fontSize: 15, color: COLORS.secondaryText, textAlign: 'center', marginTop: 10, lineHeight: 22 },
    alertCloseBtn: { marginTop: 25, backgroundColor: COLORS.midnight, paddingHorizontal: 40, paddingVertical: 14, borderRadius: 18, width: '100%', alignItems: 'center' },
    alertCloseBtnText: { color: '#FFF', fontWeight: '800' }
});

export default AttendanceHistory;