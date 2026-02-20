import React, { useState, useEffect, useRef } from 'react';
import { 
    View, Text, StyleSheet, TextInput, TouchableOpacity, 
    FlatList, ActivityIndicator, Keyboard, RefreshControl, 
    SafeAreaView, StatusBar, Vibration, Animated, Modal, Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../api/client';

const { width } = Dimensions.get('window');

// --- DESIGN SYSTEM COLORS ---
const COLORS = {
    background: '#F8FAFC',
    cardBg: '#FFFFFF',
    primary: '#2563EB', // Royal Blue
    charcoal: '#1E293B',
    slate: '#64748B',
    lightGray: '#E2E8F0',
    error: '#EF4444',
    success: '#10B981',
    midnight: '#0F172A',
};

const ManageNotices = () => {
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [form, setForm] = useState({ title: '', description: '' });

    // Custom Alert States
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'error', onConfirm: null });
    const alertAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => { 
        fetchNotices(); 
    }, []);

    const showAlert = (title, message, type = 'error', onConfirm = null) => {
        setAlertConfig({ title, message, type, onConfirm });
        setAlertVisible(true);
        Vibration.vibrate(type === 'error' || type === 'warning' ? [0, 50, 100, 50] : 20);
        Animated.spring(alertAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 8 }).start();
    };

    const hideAlert = () => {
        Animated.timing(alertAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => setAlertVisible(false));
    };

    const fetchNotices = async () => {
        try {
            setRefreshing(true);
            const res = await apiClient.get('/teacher/my-notices'); 
            if (res.data.success) {
                setNotices(res.data.notices);
            }
        } catch (err) { 
            showAlert("Sync Error", "Unable to retrieve notice history. Please try again.");
        } finally {
            setRefreshing(false);
        }
    };

    const handlePost = async () => {
        if (!form.title.trim() || !form.description.trim()) {
            return showAlert("Required Fields", "Please provide both a title and description.");
        }
        
        setLoading(true);
        try {
            const res = await apiClient.post('/teacher/create-notice', form);
            if (res.data.success) {
                setForm({ title: '', description: '' });
                Keyboard.dismiss();
                showAlert("Success", "Notice published successfully.", "success");
                fetchNotices();
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Internal server error occurred.";
            showAlert("Publication Failed", errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = (id) => {
        showAlert(
            "Delete Notice", 
            "Are you sure you want to permanently remove this announcement?", 
            "warning",
            () => deleteNotice(id)
        );
    };

    const deleteNotice = async (id) => {
        try {
            const res = await apiClient.delete(`/teacher/notice/${id}`);
            if (res.data.success) {
                setNotices(prev => prev.filter(item => item._id !== id));
                hideAlert();
            }
        } catch (err) { 
            showAlert("Action Failed", "Could not remove the selected notice.");
        }
    };

    const renderNoticeItem = ({ item }) => (
        <View style={styles.noticeItem}>
            <View style={styles.noticeIndicator} />
            <View style={styles.noticeBody}>
                <View style={styles.noticeHeader}>
                    <Text style={styles.noticeTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.noticeDate}>
                        {new Date(item.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </Text>
                </View>
                <Text style={styles.noticeDesc} numberOfLines={2}>{item.description}</Text>
            </View>
            <TouchableOpacity 
                activeOpacity={0.7}
                onPress={() => confirmDelete(item._id)} 
                style={styles.delBtn}
            >
                <Ionicons name="trash-sharp" size={18} color={COLORS.error} />
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
            <View style={styles.container}>
                <View style={styles.screenHeader}>
                    <Text style={styles.headerSubtitle}>Communication</Text>
                    <Text style={styles.headerTitle}>Bulletin Board</Text>
                </View>

                <View style={styles.inputCard}>
                    <Text style={styles.cardLabel}>Create Announcement</Text>
                    <TextInput 
                        style={styles.input} 
                        placeholder="Subject Title" 
                        placeholderTextColor={COLORS.slate}
                        value={form.title}
                        onChangeText={t => setForm({...form, title: t})}
                    />
                    <TextInput 
                        style={[styles.input, styles.textArea]} 
                        placeholder="Compose your message here..." 
                        placeholderTextColor={COLORS.slate}
                        multiline
                        numberOfLines={4}
                        value={form.description}
                        onChangeText={t => setForm({...form, description: t})}
                    />
                    <TouchableOpacity 
                        activeOpacity={0.9}
                        style={[styles.postBtn, loading && { opacity: 0.7 }]} 
                        onPress={handlePost} 
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <View style={styles.btnRow}>
                                <Ionicons name="send" size={16} color="#fff" style={{marginRight: 8}} />
                                <Text style={styles.postBtnText}>Publish Notice</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.listHeader}>
                    <Text style={styles.sectionTitle}>Sent Records</Text>
                    <TouchableOpacity onPress={fetchNotices} style={styles.refreshBtn}>
                        <Ionicons name="sync" size={14} color={COLORS.primary} />
                        <Text style={styles.refreshText}>Sync</Text>
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={notices}
                    keyExtractor={item => item._id}
                    renderItem={renderNoticeItem}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={fetchNotices} tintColor={COLORS.primary} />
                    }
                    ListEmptyComponent={
                        !refreshing && (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="chatbox-ellipses-outline" size={48} color={COLORS.lightGray} />
                                <Text style={styles.emptyText}>No active announcements found.</Text>
                            </View>
                        )
                    }
                />
            </View>

            {/* Custom Premium Alert Dialog */}
            <Modal transparent visible={alertVisible} animationType="none">
                <View style={styles.alertOverlay}>
                    <Animated.View style={[styles.alertBox, { transform: [{ scale: alertAnim }] }]}>
                        <View style={[styles.alertBar, { backgroundColor: alertConfig.type === 'success' ? COLORS.success : alertConfig.type === 'warning' ? '#F59E0B' : COLORS.error }]} />
                        <View style={styles.alertContent}>
                            <Text style={styles.alertTitle}>{alertConfig.title}</Text>
                            <Text style={styles.alertMessage}>{alertConfig.message}</Text>
                            
                            <View style={styles.alertActionRow}>
                                {alertConfig.onConfirm ? (
                                    <>
                                        <TouchableOpacity style={[styles.alertBtn, styles.cancelBtn]} onPress={hideAlert}>
                                            <Text style={styles.cancelBtnText}>Cancel</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                            style={[styles.alertBtn, { backgroundColor: COLORS.error }]} 
                                            onPress={alertConfig.onConfirm}
                                        >
                                            <Text style={styles.confirmBtnText}>Delete</Text>
                                        </TouchableOpacity>
                                    </>
                                ) : (
                                    <TouchableOpacity style={[styles.alertBtn, { backgroundColor: COLORS.midnight }]} onPress={hideAlert}>
                                        <Text style={styles.confirmBtnText}>Understood</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    </Animated.View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.background },
    container: { flex: 1, paddingHorizontal: 20 },
    screenHeader: { marginTop: 15, marginBottom: 20 },
    headerSubtitle: { fontSize: 12, fontWeight: '800', color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 },
    headerTitle: { fontSize: 28, fontWeight: '900', color: COLORS.charcoal },
    inputCard: { 
        backgroundColor: COLORS.cardBg, padding: 20, borderRadius: 28, marginBottom: 25, 
        borderWidth: 1, borderColor: COLORS.lightGray, elevation: 4, 
        shadowColor: COLORS.midnight, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 12 
    },
    cardLabel: { fontSize: 13, fontWeight: '800', color: COLORS.slate, marginBottom: 15, textTransform: 'uppercase', letterSpacing: 0.5 },
    input: { 
        backgroundColor: COLORS.background, borderRadius: 16, padding: 16, marginBottom: 12, 
        fontSize: 15, color: COLORS.charcoal, fontWeight: '500', borderWidth: 1, borderColor: COLORS.lightGray 
    },
    textArea: { height: 110, textAlignVertical: 'top' },
    postBtn: { 
        backgroundColor: COLORS.primary, padding: 18, borderRadius: 20, 
        alignItems: 'center', justifyContent: 'center',
        shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5
    },
    btnRow: { flexDirection: 'row', alignItems: 'center' },
    postBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
    listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.charcoal },
    refreshBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    refreshText: { color: COLORS.primary, fontSize: 12, fontWeight: '800', marginLeft: 4 },
    noticeItem: { 
        backgroundColor: COLORS.cardBg, borderRadius: 22, marginBottom: 14, 
        flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.lightGray, overflow: 'hidden'
    },
    noticeIndicator: { width: 6, height: '100%', backgroundColor: COLORS.primary },
    noticeBody: { flex: 1, padding: 18 },
    noticeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    noticeTitle: { fontWeight: '800', fontSize: 16, color: COLORS.charcoal, flex: 1, marginRight: 10 },
    noticeDate: { fontSize: 12, color: COLORS.slate, fontWeight: '700' },
    noticeDesc: { fontSize: 14, color: COLORS.slate, lineHeight: 20, fontWeight: '500' },
    delBtn: { padding: 12, backgroundColor: '#FEF2F2', borderRadius: 14, marginRight: 14 },
    listContent: { paddingBottom: 40 },
    emptyContainer: { alignItems: 'center', marginTop: 50 },
    emptyText: { textAlign: 'center', color: COLORS.slate, marginTop: 12, fontWeight: '600' },
    
    // Custom Alert Styles
    alertOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.7)', justifyContent: 'center', alignItems: 'center', padding: 25 },
    alertBox: { width: '100%', backgroundColor: COLORS.cardBg, borderRadius: 30, overflow: 'hidden', elevation: 24 },
    alertBar: { height: 6 },
    alertContent: { padding: 25, alignItems: 'center' },
    alertTitle: { fontSize: 20, fontWeight: '900', color: COLORS.midnight, marginBottom: 10 },
    alertMessage: { fontSize: 15, color: COLORS.slate, textAlign: 'center', marginBottom: 25, lineHeight: 22 },
    alertActionRow: { flexDirection: 'row', width: '100%', justifyContent: 'center' },
    alertBtn: { flex: 1, paddingVertical: 14, borderRadius: 16, alignItems: 'center', marginHorizontal: 5 },
    cancelBtn: { backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.lightGray },
    cancelBtnText: { color: COLORS.charcoal, fontWeight: '800' },
    confirmBtnText: { color: '#fff', fontWeight: '800' }
});

export default ManageNotices;