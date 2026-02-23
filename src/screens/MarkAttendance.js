import React, { useState, useEffect, useRef } from 'react';
import { 
    View, Text, StyleSheet, FlatList, TouchableOpacity, 
    ActivityIndicator, SafeAreaView, StatusBar, Dimensions,
    Vibration, Animated, Modal, Image, Platform 
} from 'react-native';
import apiClient from '../api/client';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Get API base URL from environment variable
const API_BASE = process.env.EXPO_PUBLIC_API_URL ? process.env.EXPO_PUBLIC_API_URL.replace('/api', '') : 'https://vidyasetu-backend-n7ob.onrender.com';

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

const MarkAttendance = () => {
    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState({}); 
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Custom Alert State
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'success' });
    const alertPopAnim = useRef(new Animated.Value(0)).current;

    const showAlert = (title, message, type = 'success') => {
        setAlertConfig({ title, message, type });
        setAlertVisible(true);
        // Vibration pattern based on type
        Vibration.vibrate(type === 'error' ? [0, 50, 100, 50] : 20);
        Animated.spring(alertPopAnim, { 
            toValue: 1, 
            useNativeDriver: true, 
            tension: 50, 
            friction: 8 
        }).start();
    };

    const hideAlert = () => {
        Animated.timing(alertPopAnim, { 
            toValue: 0, 
            duration: 200, 
            useNativeDriver: true 
        }).start(() => setAlertVisible(false));
    };

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            const studentRes = await apiClient.get('/teacher/my-students');
            const studentList = studentRes.data.students || [];
            setStudents(studentList);

            try {
                const attendanceRes = await apiClient.get('/teacher/today-attendance');
                const markedData = attendanceRes.data.attendance || [];
                
                let finalStatus = {};
                studentList.forEach(std => { finalStatus[std._id] = 'Present'; });
                
                markedData.forEach(record => { 
                    const sId = record.studentId._id || record.studentId;
                    finalStatus[sId] = record.status; 
                });
                setAttendance(finalStatus);
            } catch (attendanceErr) {
                let defaultStatus = {};
                studentList.forEach(std => { defaultStatus[std._id] = 'Present'; });
                setAttendance(defaultStatus);
            }
        } catch (err) {
            showAlert("System Error", "Failed to load student registry. Please verify connection.", "error");
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = (id, status) => {
        Vibration.vibrate(10); // Light touch feedback
        setAttendance(prev => ({ ...prev, [id]: status }));
    };

    const submitAttendance = async () => {
        setSubmitting(true);
        Vibration.vibrate(15);
        try {
            const attendanceData = Object.keys(attendance).map(id => ({
                studentId: id,
                status: attendance[id]
            }));

            const res = await apiClient.post('/teacher/mark-attendance', { attendanceData });
            
            if(res.data.success) {
                showAlert(
                    "Success", 
                    "Attendance records have been synchronized and parents notified.",
                    "success"
                );
            }
        } catch (err) {
            showAlert("Sync Error", err.response?.data?.message || "Internal Server Error", "error");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={COLORS.accent} />
            <Text style={styles.loaderText}>Accessing Student Registry...</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.cardBg} />
            
            {/* Header Section */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerSubtitle}>Class Management</Text>
                    <Text style={styles.title}>Mark Attendance</Text>
                    <View style={styles.dateContainer}>
                        <Ionicons name="calendar-outline" size={14} color={COLORS.accent} />
                        <Text style={styles.dateText}>
                            {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </Text>
                    </View>
                </View>
                <View style={styles.statsBadge}>
                    <Text style={styles.statsText}>{students.length} Students</Text>
                </View>
            </View>

            {/* List Section */}
            <FlatList
                data={students}
                keyExtractor={item => item._id}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                    <View style={styles.studentCard}>
                        <View style={styles.avatarContainer}>
                            {item.profilePhoto ? (
                                <Image
                                    source={{ uri: item.profilePhoto.startsWith('http') ? item.profilePhoto : `${API_BASE}/${item.profilePhoto.replace(/\\/g, '/').replace(/^\//, '')}` }}
                                    style={styles.avatarImage}
                                />
                            ) : (
                                <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                            )}
                        </View>
                        
                        <View style={styles.studentInfo}>
                            <Text style={styles.studentName} numberOfLines={1}>{item.name}</Text>
                            <Text style={styles.studentId}>{item.studentLoginId} • {item.batchTime || 'General'}</Text>
                        </View>
                        
                        <View style={styles.controlRow}>
                            <TouchableOpacity 
                                activeOpacity={0.6}
                                onPress={() => toggleStatus(item._id, 'Present')}
                                style={[
                                    styles.statusToggle, 
                                    attendance[item._id] === 'Present' ? styles.pActive : styles.inactiveBtn
                                ]}
                            >
                                <Text style={[styles.statusLabel, attendance[item._id] === 'Present' && styles.labelActive]}>P</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                activeOpacity={0.6}
                                onPress={() => toggleStatus(item._id, 'Absent')}
                                style={[
                                    styles.statusToggle, 
                                    attendance[item._id] === 'Absent' ? styles.aActive : styles.inactiveBtn
                                ]}
                            >
                                <Text style={[styles.statusLabel, attendance[item._id] === 'Absent' && styles.labelActive]}>A</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            />

            {/* Sticky Footer Button */}
            <View style={styles.footer}>
                <TouchableOpacity 
                    activeOpacity={0.8}
                    style={[styles.primaryBtn, submitting && styles.btnDisabled]} 
                    onPress={submitAttendance} 
                    disabled={submitting}
                >
                    {submitting ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <View style={styles.btnContent}>
                            <Ionicons name="cloud-done-outline" size={20} color="#FFFFFF" style={styles.btnIcon} />
                            <Text style={styles.primaryBtnText}>Confirm and Sync</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Custom Alert Dialog */}
            <Modal transparent visible={alertVisible} animationType="none">
                <View style={styles.modalOverlay}>
                    <Animated.View style={[
                        styles.alertBox, 
                        { transform: [{ scale: alertPopAnim }], opacity: alertPopAnim }
                    ]}>
                        <View style={[
                            styles.alertAccentBar, 
                            { backgroundColor: alertConfig.type === 'error' ? COLORS.error : COLORS.success }
                        ]} />
                        <View style={styles.alertBody}>
                            <View style={[
                                styles.alertIconCircle, 
                                { backgroundColor: (alertConfig.type === 'error' ? COLORS.error : COLORS.success) + '15' }
                            ]}>
                                <Ionicons 
                                    name={alertConfig.type === 'error' ? "close-circle" : "checkmark-circle"} 
                                    size={40} 
                                    color={alertConfig.type === 'error' ? COLORS.error : COLORS.success} 
                                />
                            </View>
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
    container: { flex: 1, backgroundColor: COLORS.background },
    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
    loaderText: { marginTop: 15, color: COLORS.secondaryText, fontWeight: '600', letterSpacing: 0.5 },
    header: { 
        paddingHorizontal: 24, paddingVertical: 25, flexDirection: 'row', 
        justifyContent: 'space-between', alignItems: 'flex-start',
        backgroundColor: COLORS.cardBg, borderBottomLeftRadius: 30, borderBottomRightRadius: 30,
        elevation: 10, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 15, shadowOffset: { width: 0, height: 5 }
    },
    headerSubtitle: { fontSize: 11, fontWeight: '800', color: COLORS.accent, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 },
    title: { fontSize: 26, fontWeight: '900', color: COLORS.primaryText, letterSpacing: -0.5 },
    dateContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
    dateText: { color: COLORS.secondaryText, fontSize: 13, fontWeight: '600', marginLeft: 6 },
    statsBadge: { backgroundColor: `${COLORS.accent}10`, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, borderWidth: 1, borderColor: `${COLORS.accent}20` },
    statsText: { color: COLORS.accent, fontWeight: '800', fontSize: 12 },
    listContainer: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 140 },
    studentCard: { 
        backgroundColor: COLORS.cardBg, padding: 14, borderRadius: 24, flexDirection: 'row', 
        alignItems: 'center', marginBottom: 14, borderWidth: 1, borderColor: COLORS.border,
        elevation: 4, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }
    },
    avatarContainer: { 
        width: 52, height: 52, borderRadius: 18, backgroundColor: COLORS.background, 
        justifyContent: 'center', alignItems: 'center', marginRight: 15, overflow: 'hidden',
        borderWidth: 1, borderColor: COLORS.border
    },
    avatarImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    avatarText: { fontSize: 18, fontWeight: '900', color: COLORS.accent },
    studentInfo: { flex: 1 },
    studentName: { fontSize: 16, fontWeight: '800', color: COLORS.primaryText, letterSpacing: -0.3 },
    studentId: { fontSize: 12, color: COLORS.secondaryText, marginTop: 3, fontWeight: '500' },
    controlRow: { flexDirection: 'row' },
    statusToggle: { width: 44, height: 44, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
    pActive: { backgroundColor: COLORS.success, elevation: 6, shadowColor: COLORS.success, shadowOpacity: 0.3 },
    aActive: { backgroundColor: COLORS.error, elevation: 6, shadowColor: COLORS.error, shadowOpacity: 0.3 },
    inactiveBtn: { backgroundColor: COLORS.background, borderWidth: 1.5, borderColor: COLORS.border },
    statusLabel: { color: COLORS.placeholder, fontWeight: '900', fontSize: 16 },
    labelActive: { color: '#FFFFFF' },
    footer: { position: 'absolute', bottom: 0, width: width, padding: 24, backgroundColor: 'transparent' },
    primaryBtn: { 
        backgroundColor: COLORS.accent, paddingVertical: 18, borderRadius: 24, 
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        elevation: 12, shadowColor: COLORS.accent, shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }
    },
    btnDisabled: { opacity: 0.7 },
    btnContent: { flexDirection: 'row', alignItems: 'center' },
    btnIcon: { marginRight: 10 },
    primaryBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16, letterSpacing: 0.3 },

    // Custom Alert Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'center', alignItems: 'center', padding: 25 },
    alertBox: { width: '100%', backgroundColor: COLORS.cardBg, borderRadius: 30, overflow: 'hidden', elevation: 25 },
    alertAccentBar: { height: 6, width: '100%' },
    alertBody: { padding: 30, alignItems: 'center' },
    alertIconCircle: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    alertTitleText: { fontSize: 22, fontWeight: '900', color: COLORS.midnight, textAlign: 'center' },
    alertMessageText: { fontSize: 15, color: COLORS.secondaryText, textAlign: 'center', marginTop: 10, lineHeight: 22, fontWeight: '500' },
    alertCloseBtn: { marginTop: 25, backgroundColor: COLORS.midnight, paddingHorizontal: 35, paddingVertical: 14, borderRadius: 18, width: '100%', alignItems: 'center' },
    alertCloseBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15 }
});

export default MarkAttendance;