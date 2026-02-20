import React, { useState, useEffect } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, StyleSheet, 
    ScrollView, ActivityIndicator, SafeAreaView, StatusBar,
    Vibration, Modal, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../api/client';

const BroadcastScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [notices, setNotices] = useState([]);
    
    
    const [modalVisible, setModalVisible] = useState(false);
    const [modalContent, setModalContent] = useState({ title: '', message: '', type: 'error' });

    const [form, setForm] = useState({
        type: 'NOTICE', 
        target: 'ALL',
        title: '',
        description: '',
        version: '',
        downloadLink: ''
    });

    useEffect(() => {
        fetchHistory();
    }, []);

    const triggerModal = (title, message, type = 'error') => {
        Vibration.vibrate(type === 'error' ? [0, 80, 50, 80] : 60);
        setModalContent({ title, message, type });
        setModalVisible(true);
    };

    const fetchHistory = async () => {
        setHistoryLoading(true);
        try {
            const res = await apiClient.get('/admin/notices'); 
            if (res.data.success) {
                setNotices(res.data.notices);
            }
        } catch (err) {
            console.log("Fetch Error:", err.message);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleSend = async () => {
        if (!form.title || !form.description) {
            return triggerModal("Required Fields", "Please provide a Title and Description for the broadcast.");
        }
        
        if (form.type === 'UPDATE' && (!form.version || !form.downloadLink)) {
            return triggerModal("Missing Details", "Version and Download Link are mandatory for App Updates.");
        }

        setLoading(true);
        try {
            const res = await apiClient.post('/admin/broadcast', form);
            if (res.data.success) {
                triggerModal("Broadcast Sent 🚀", "Message has been pushed to the selected users successfully.", "success");
                setForm({ type: 'NOTICE', target: 'ALL', title: '', description: '', version: '', downloadLink: '' });
                fetchHistory(); 
            }
        } catch (err) {
            triggerModal("Operation Failed", "Could not transmit broadcast. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id) => {
        
        triggerModal("Remove Broadcast", "This will remove the notice from the history. Re-send if needed.", "error");
       
        confirmDelete(id);
    };

    const confirmDelete = async (id) => {
        try {
            const res = await apiClient.delete(`/admin/broadcast/${id}`);
            if (res.data.success) {
                fetchHistory();
            }
        } catch (err) {
            triggerModal("Error", "Could not delete broadcast record.");
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#F1F5F9" />
            
            {/* THEMED MODAL */}
            <Modal transparent visible={modalVisible} animationType="fade" onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.premiumModal}>
                        <View style={[styles.modalStatus, { backgroundColor: modalContent.type === 'error' ? '#EF4444' : '#10B981' }]} />
                        <Text style={styles.modalTitleText}>{modalContent.title}</Text>
                        <Text style={styles.modalSubText}>{modalContent.message}</Text>
                        <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalVisible(false)}>
                            <Text style={styles.modalCloseText}>Dismiss</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Header */}
            <View style={styles.navBar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.navTitle}>Communications</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
                
                <View style={styles.formCard}>
                    <Text style={styles.sectionTitle}>New Broadcast</Text>

                    <Text style={styles.miniLabel}>BROADCAST TYPE</Text>
                    <View style={styles.tabRow}>
                        {['NOTICE', 'UPDATE'].map(t => (
                            <TouchableOpacity 
                                key={t} 
                                style={[styles.tab, form.type === t && styles.activeTab]} 
                                onPress={() => setForm({...form, type: t})}
                            >
                                <Text style={[styles.tabText, form.type === t && styles.activeTabText]}>{t}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.miniLabel}>RECIPIENT GROUP</Text>
                    <View style={styles.tabRow}>
                        {['ALL', 'TEACHER', 'STUDENT'].map(t => (
                            <TouchableOpacity 
                                key={t} 
                                style={[styles.tab, form.target === t && styles.activeTab]} 
                                onPress={() => setForm({...form, target: t})}
                            >
                                <Text style={[styles.tabText, form.target === t && styles.activeTabText]}>{t}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TextInput 
                        style={styles.input} 
                        placeholder="Notice Title" 
                        placeholderTextColor="#94A3B8"
                        value={form.title} 
                        onChangeText={(v) => setForm({...form, title: v})} 
                    />
                    <TextInput 
                        style={[styles.input, { height: 120, textAlignVertical: 'top' }]} 
                        placeholder="Type your message here..." 
                        placeholderTextColor="#94A3B8"
                        multiline 
                        value={form.description} 
                        onChangeText={(v) => setForm({...form, description: v})} 
                    />

                    {form.type === 'UPDATE' && (
                        <View style={styles.updateWrapper}>
                            <View style={styles.updateHeader}>
                                <Ionicons name="rocket-sharp" size={18} color="#4F46E5" />
                                <Text style={styles.updateLabel}>Software Patch Details</Text>
                            </View>
                            <TextInput 
                                style={styles.updateInput} 
                                placeholder="Version (e.g. 1.2.0)" 
                                placeholderTextColor="#94A3B8"
                                value={form.version} 
                                onChangeText={(v) => setForm({...form, version: v})} 
                            />
                            <TextInput 
                                style={styles.updateInput} 
                                placeholder="Direct Download Link" 
                                placeholderTextColor="#94A3B8"
                                value={form.downloadLink} 
                                onChangeText={(v) => setForm({...form, downloadLink: v})} 
                            />
                        </View>
                    )}

                    <TouchableOpacity 
                        style={[styles.mainSendBtn, loading && { backgroundColor: '#94A3B8' }]} 
                        onPress={handleSend}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : (
                            <>
                                <Ionicons name="send" size={18} color="#FFF" style={{marginRight: 10}} />
                                <Text style={styles.sendText}>Push Broadcast</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* HISTORY SECTION */}
                <View style={styles.historySection}>
                    <View style={styles.historyHeaderRow}>
                        <Text style={styles.sectionTitle}>History</Text>
                        <TouchableOpacity onPress={fetchHistory} style={styles.refreshBtn}>
                             <Ionicons name="refresh" size={20} color="#4F46E5" />
                        </TouchableOpacity>
                    </View>
                    
                    {historyLoading ? (
                        <ActivityIndicator color="#4F46E5" style={{ marginTop: 20 }} />
                    ) : (
                        notices.map((item) => (
                            <View key={item._id} style={styles.historyCard}>
                                <View style={styles.historyContent}>
                                    <View style={styles.badgeRow}>
                                        <View style={[styles.typeBadge, item.type === 'UPDATE' ? styles.updateBadge : styles.noticeBadge]}>
                                            <Text style={styles.badgeText}>{item.type}</Text>
                                        </View>
                                        <Text style={styles.targetLabel}>Sent to: {item.target}</Text>
                                    </View>
                                    <Text style={styles.historyTitle} numberOfLines={1}>{item.title}</Text>
                                    <Text style={styles.historyDesc} numberOfLines={2}>{item.description}</Text>
                                </View>
                                
                                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item._id)}>
                                    <Ionicons name="trash-bin" size={20} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F1F5F9' },
    navBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
    backBtn: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 2 },
    navTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A' },
    container: { flex: 1, paddingHorizontal: 20 },
    formCard: { backgroundColor: '#FFF', borderRadius: 32, padding: 25, elevation: 3, borderWidth: 1, borderColor: '#E2E8F0' },
    sectionTitle: { fontSize: 22, fontWeight: '900', color: '#0F172A', marginBottom: 20 },
    miniLabel: { fontSize: 11, fontWeight: '800', color: '#94A3B8', letterSpacing: 1.5, marginBottom: 10, textTransform: 'uppercase' },
    tabRow: { flexDirection: 'row', marginBottom: 20, backgroundColor: '#F1F5F9', borderRadius: 18, padding: 5 },
    tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 14 },
    activeTab: { backgroundColor: '#FFF', elevation: 3, shadowColor: '#4F46E5', shadowOpacity: 0.1 },
    tabText: { color: '#64748B', fontWeight: '800', fontSize: 12 },
    activeTabText: { color: '#4F46E5' },
    input: { backgroundColor: '#F8FAFC', borderRadius: 18, padding: 18, fontSize: 16, marginBottom: 15, color: '#0F172A', borderWidth: 1.5, borderColor: '#F1F5F9', fontWeight: '600' },
    updateWrapper: { backgroundColor: '#EEF2FF', padding: 20, borderRadius: 24, marginBottom: 20, borderWidth: 1, borderColor: '#C7D2FE' },
    updateHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    updateLabel: { fontSize: 13, fontWeight: '900', color: '#4F46E5', marginLeft: 8, textTransform: 'uppercase' },
    updateInput: { backgroundColor: '#FFF', borderRadius: 12, padding: 14, fontSize: 14, marginBottom: 10, color: '#0F172A', fontWeight: '600' },
    mainSendBtn: { backgroundColor: '#4F46E5', flexDirection: 'row', padding: 18, borderRadius: 20, alignItems: 'center', justifyContent: 'center', elevation: 5, shadowColor: '#4F46E5', shadowOpacity: 0.3 },
    sendText: { color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 0.5 },
    historySection: { marginTop: 40 },
    historyHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    refreshBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },
    historyCard: { flexDirection: 'row', backgroundColor: '#FFF', padding: 20, borderRadius: 28, marginBottom: 15, alignItems: 'center', elevation: 2, borderWidth: 1, borderColor: '#F1F5F9' },
    historyContent: { flex: 1 },
    badgeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    badgeText: { fontSize: 10, fontWeight: '900', color: '#fff' },
    noticeBadge: { backgroundColor: '#4F46E5' },
    updateBadge: { backgroundColor: '#F59E0B' },
    targetLabel: { fontSize: 11, color: '#94A3B8', marginLeft: 10, fontWeight: '700' },
    historyTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
    historyDesc: { fontSize: 14, color: '#64748B', marginTop: 5, lineHeight: 20, fontWeight: '500' },
    deleteBtn: { padding: 12, marginLeft: 10, backgroundColor: '#FEF2F2', borderRadius: 15 },

    
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.8)', justifyContent: 'center', alignItems: 'center', padding: 25 },
    premiumModal: { backgroundColor: '#FFFFFF', borderRadius: 28, padding: 35, width: '100%', alignItems: 'center', elevation: 20 },
    modalStatus: { width: 50, height: 5, borderRadius: 10, marginBottom: 25 },
    modalTitleText: { fontSize: 24, fontWeight: '900', color: '#0F172A', marginBottom: 12 },
    modalSubText: { fontSize: 16, color: '#475569', textAlign: 'center', lineHeight: 24, marginBottom: 30 },
    modalCloseBtn: { backgroundColor: '#0F172A', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 15 },
    modalCloseText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 }
});

export default BroadcastScreen;