import React, { useState, useEffect, useRef } from 'react';
import { 
    View, Text, FlatList, StyleSheet, TouchableOpacity, 
    ActivityIndicator, RefreshControl, SafeAreaView, StatusBar,
    Vibration, Animated, Modal, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../api/client';

const { width } = Dimensions.get('window');

// --- GLOBAL DESIGN SYSTEM ---
const COLORS = {
    background: '#F8FAFC', 
    primaryText: '#1F2937', 
    secondaryText: '#64748B', 
    placeholder: '#CBD5E1', 
    cardBg: '#FFFFFF',
    border: '#E2E8F0',
    accent: '#2563EB', 
    midnight: '#0F172A', 
    success: '#10B981', 
    error: '#DC2626', 
    warning: '#F59E0B', 
};

export default function HomeworkHistoryScreen() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Custom Alert State
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'success', onConfirm: null });
    const alertPopAnim = useRef(new Animated.Value(0)).current;

    const showAlert = (title, message, type = 'success', onConfirm = null) => {
        setAlertConfig({ title, message, type, onConfirm });
        setAlertVisible(true);
        // Vibration: Error/Delete gets a longer buzz
        Vibration.vibrate(type === 'error' || type === 'warning' ? [0, 60, 100, 60] : 15);
        Animated.spring(alertPopAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 8 }).start();
    };

    const hideAlert = () => {
        Animated.timing(alertPopAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setAlertVisible(false));
    };

    const fetchHistory = async () => {
        try {
            const res = await apiClient.get('/teacher/my-homeworks'); 
            if (res.data.success) {
                setHistory(res.data.history);
            }
        } catch (error) {
            showAlert("Connection Error", "Unable to load assignment history.", "error");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { 
        fetchHistory(); 
    }, []);

    const confirmDelete = (id) => {
        showAlert(
            "Remove Assignment", 
            "This action will permanently delete the homework for all students.", 
            "warning",
            () => handleDelete(id)
        );
    };

    const handleDelete = async (id) => {
        hideAlert();
        try {
            const res = await apiClient.delete(`/teacher/delete-homework/${id}`);
            if (res.data.success) {
                setHistory(history.filter(item => item._id !== id));
                Vibration.vibrate(10);
            }
        } catch (error) {
            showAlert("Error", "Failed to delete the assignment.", "error");
        }
    };

    if (loading) return (
        <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={COLORS.accent} />
            <Text style={styles.loaderText}>Retrieving Records</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.cardBg} />
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerSubtitle}>History</Text>
                    <Text style={styles.headerTitle}>Past Assignments</Text>
                </View>

                <FlatList 
                    data={history}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.listPadding}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl 
                            refreshing={refreshing} 
                            onRefresh={() => { setRefreshing(true); fetchHistory(); }} 
                            colors={[COLORS.accent]}
                            tintColor={COLORS.accent}
                        />
                    }
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <View style={styles.cardInfo}>
                                <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                                
                                <View style={styles.metaRow}>
                                    <View style={styles.metaItem}>
                                        <Ionicons name="calendar-outline" size={14} color={COLORS.secondaryText} />
                                        <Text style={styles.metaText}>
                                            {new Date(item.createdAt).toLocaleDateString('en-GB')}
                                        </Text>
                                    </View>
                                    <View style={styles.metaItem}>
                                        <Ionicons name="time-outline" size={14} color={COLORS.secondaryText} />
                                        <Text style={styles.metaText}>{item.batchTime}</Text>
                                    </View>
                                </View>

                                <View style={styles.attachmentBadge}>
                                    <Ionicons name="attach-outline" size={14} color={COLORS.accent} />
                                    <Text style={styles.attachmentText}>
                                        {item.attachments?.length || 0} Material Attached
                                    </Text>
                                </View>
                            </View>

                            <TouchableOpacity 
                                activeOpacity={0.6}
                                onPress={() => confirmDelete(item._id)} 
                                style={styles.deleteBtn}
                            >
                                <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                            </TouchableOpacity>
                        </View>
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="file-tray-outline" size={60} color={COLORS.placeholder} />
                            <Text style={styles.emptyText}>No assignments found</Text>
                        </View>
                    }
                />
            </View>

            {/* Custom Alert Modal */}
            <Modal transparent visible={alertVisible} animationType="none">
                <View style={styles.modalOverlay}>
                    <Animated.View style={[
                        styles.alertBox, 
                        { transform: [{ scale: alertPopAnim }], opacity: alertPopAnim }
                    ]}>
                        <View style={[
                            styles.alertBar, 
                            { backgroundColor: alertConfig.type === 'error' ? COLORS.error : alertConfig.type === 'warning' ? COLORS.warning : COLORS.success }
                        ]} />
                        <View style={styles.alertInner}>
                            <Ionicons 
                                name={alertConfig.type === 'error' ? "close-circle" : alertConfig.type === 'warning' ? "alert-circle" : "checkmark-circle"} 
                                size={54} 
                                color={alertConfig.type === 'error' ? COLORS.error : alertConfig.type === 'warning' ? COLORS.warning : COLORS.success} 
                            />
                            <Text style={styles.alertTitleText}>{alertConfig.title}</Text>
                            <Text style={styles.alertMsgText}>{alertConfig.message}</Text>
                            
                            <View style={styles.alertActions}>
                                {alertConfig.onConfirm && (
                                    <TouchableOpacity style={styles.alertSecondaryBtn} onPress={hideAlert}>
                                        <Text style={styles.alertSecondaryText}>Cancel</Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity 
                                    style={[styles.alertPrimaryBtn, alertConfig.type === 'warning' && { backgroundColor: COLORS.error }]} 
                                    onPress={alertConfig.onConfirm ? alertConfig.onConfirm : hideAlert}
                                >
                                    <Text style={styles.alertPrimaryText}>
                                        {alertConfig.onConfirm ? "Delete" : "Got it"}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Animated.View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.cardBg },
    container: { flex: 1, backgroundColor: COLORS.background },
    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
    loaderText: { marginTop: 12, color: COLORS.secondaryText, fontWeight: '600' },
    header: {
        backgroundColor: COLORS.cardBg, paddingHorizontal: 25, paddingTop: 10, paddingBottom: 25,
        borderBottomLeftRadius: 35, borderBottomRightRadius: 35, elevation: 8,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12
    },
    headerSubtitle: { fontSize: 11, fontWeight: '800', color: COLORS.accent, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 5 },
    headerTitle: { fontSize: 26, fontWeight: '900', color: COLORS.primaryText, letterSpacing: -0.5 },
    listPadding: { paddingHorizontal: 20, paddingTop: 25, paddingBottom: 40 },
    card: { 
        backgroundColor: COLORS.cardBg, padding: 18, borderRadius: 24, marginBottom: 16, 
        flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
        elevation: 3, shadowColor: '#000', shadowOpacity: 0.02
    },
    cardInfo: { flex: 1 },
    title: { fontSize: 17, fontWeight: '800', color: COLORS.primaryText, marginBottom: 8, letterSpacing: -0.3 },
    metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    metaItem: { flexDirection: 'row', alignItems: 'center', marginRight: 15 },
    metaText: { fontSize: 13, color: COLORS.secondaryText, marginLeft: 5, fontWeight: '500' },
    attachmentBadge: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: `${COLORS.accent}10`,
        alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10
    },
    attachmentText: { fontSize: 12, color: COLORS.accent, fontWeight: '800', marginLeft: 4 },
    deleteBtn: { 
        width: 44, height: 44, backgroundColor: '#FEF2F2', borderRadius: 14,
        justifyContent: 'center', alignItems: 'center', marginLeft: 15
    },
    emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
    emptyText: { marginTop: 15, color: COLORS.secondaryText, fontSize: 16, fontWeight: '600' },

    // Custom Alert Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.45)', justifyContent: 'center', alignItems: 'center', padding: 25 },
    alertBox: { width: '100%', backgroundColor: COLORS.cardBg, borderRadius: 32, overflow: 'hidden', elevation: 20 },
    alertBar: { height: 6 },
    alertInner: { padding: 35, alignItems: 'center' },
    alertTitleText: { fontSize: 22, fontWeight: '900', color: COLORS.midnight, marginTop: 15 },
    alertMsgText: { fontSize: 15, color: COLORS.secondaryText, textAlign: 'center', marginTop: 10, lineHeight: 22, fontWeight: '500' },
    alertActions: { flexDirection: 'row', width: '100%', marginTop: 25 },
    alertPrimaryBtn: { flex: 1, backgroundColor: COLORS.midnight, paddingVertical: 15, borderRadius: 18, alignItems: 'center' },
    alertPrimaryText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
    alertSecondaryBtn: { flex: 1, backgroundColor: 'transparent', paddingVertical: 15, alignItems: 'center', marginRight: 10 },
    alertSecondaryText: { color: COLORS.secondaryText, fontWeight: '700', fontSize: 15 }
});