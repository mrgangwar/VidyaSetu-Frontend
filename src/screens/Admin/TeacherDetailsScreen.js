import React, { useState, useEffect } from 'react';
import { 
    View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, 
    ActivityIndicator, SafeAreaView, StatusBar, Vibration, Modal, Dimensions, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../api/client';

const { width } = Dimensions.get('window');

const TeacherDetailsScreen = ({ route, navigation }) => {
    const { teacherId } = route.params;
    const [teacher, setTeacher] = useState(null);
    const [loading, setLoading] = useState(true);

    // --- Modal State for Themed Alert ---
    const [modalVisible, setModalVisible] = useState(false);
    const [modalConfig, setModalConfig] = useState({ title: '', message: '', onConfirm: null });

    const fetchDetails = async () => {
        try {
            const res = await apiClient.get(`/admin/teacher/${teacherId}`);
            setTeacher(res.data.teacher);
        } catch (err) {
            triggerCustomAlert("Access Error", "Could not retrieve teacher profile.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDetails(); }, []);

    // Custom Alert Trigger with Vibration
    const triggerCustomAlert = (title, message, onConfirm = null) => {
        Vibration.vibrate([0, 80, 50, 80]); 
        setModalConfig({ title, message, onConfirm });
        setModalVisible(true);
    };

    const handleDeletePress = () => {
        triggerCustomAlert(
            "Permanent Deletion",
            "This action cannot be undone. All associated coaching records for this teacher will be removed.",
            async () => {
                try {
                    await apiClient.delete(`/admin/teacher/delete/${teacherId}`);
                    setModalVisible(false);
                    navigation.goBack();
                } catch (err) {
                    Vibration.vibrate(100);
                    triggerCustomAlert("Error", "Deletion failed. Please try again.");
                }
            }
        );
    };

    if (loading) return (
        <View style={styles.loader}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={styles.loadingText}>Verifying Profile...</Text>
        </View>
    );

    const baseUrl = Platform.OS === 'web' ? 'http://localhost:5000/' : 'http://10.54.31.32:5000/';
    const profileImage = teacher?.profilePhoto 
        ? { uri: teacher.profilePhoto.startsWith('http') ? teacher.profilePhoto : `${baseUrl}${teacher.profilePhoto.replace(/\\/g, '/')}` }
        : { uri: `https://ui-avatars.com/api/?name=${teacher?.name}&size=250&background=4F46E5&color=fff` };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F1F5F9" />

            {/* --- CUSTOM THEMED ALERT DIALOG (Matches Login Modal) --- */}
            <Modal transparent visible={modalVisible} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.premiumModal}>
                        <View style={[styles.modalStatus, { backgroundColor: modalConfig.onConfirm ? '#EF4444' : '#4F46E5' }]} />
                        <Text style={styles.modalTitleText}>{modalConfig.title}</Text>
                        <Text style={styles.modalSubText}>{modalConfig.message}</Text>
                        
                        <View style={styles.modalActionRow}>
                            <TouchableOpacity 
                                style={styles.cancelBtn} 
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.cancelBtnText}>{modalConfig.onConfirm ? "Cancel" : "Dismiss"}</Text>
                            </TouchableOpacity>
                            
                            {modalConfig.onConfirm && (
                                <TouchableOpacity 
                                    style={styles.deleteBtn} 
                                    onPress={modalConfig.onConfirm}
                                >
                                    <Text style={styles.deleteBtnText}>Delete</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>
            </Modal>
            
            <View style={styles.navBar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                    <Ionicons name="chevron-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.navTitle}>Faculty Profile</Text>
                <TouchableOpacity onPress={() => navigation.navigate('EditTeacher', { teacher })} style={styles.headerBtn}>
                    <Ionicons name="create-outline" size={22} color="#4F46E5" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.heroCard}>
                    <View style={styles.imageWrapper}>
                        <Image source={profileImage} style={styles.profileImg} />
                        <View style={[styles.statusBadge, { backgroundColor: '#10B981' }]} />
                    </View>
                    <Text style={styles.name}>{teacher?.name}</Text>
                    <View style={styles.tag}>
                        <Text style={styles.tagText}>{teacher?.subject || 'Lead Educator'}</Text>
                    </View>
                </View>

                <View style={styles.content}>
                    <Text style={styles.sectionLabel}>Professional Details</Text>
                    <View style={styles.infoCard}>
                        <InfoRow icon="business" label="Institution" value={teacher?.coachingId?.coachingName || 'Independent'} />
                        <InfoRow icon="school" label="Qualifications" value={teacher?.qualifications} />
                        <InfoRow icon="mail" label="Official Email" value={teacher?.email} />
                        <InfoRow icon="call" label="Contact" value={teacher?.contactNumber} />
                        <InfoRow icon="location" label="Address" value={teacher?.address} last />
                    </View>

                    <Text style={styles.sectionLabel}>Account Management</Text>
                    <TouchableOpacity style={styles.dangerCard} onPress={handleDeletePress} activeOpacity={0.7}>
                        <View style={styles.dangerIconBox}>
                            <Ionicons name="trash-outline" size={22} color="#EF4444" />
                        </View>
                        <View style={{flex: 1}}>
                            <Text style={styles.dangerTitle}>Deactivate Account</Text>
                            <Text style={styles.dangerSub}>Remove access and wipe teacher data</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#FCA5A5" />
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const InfoRow = ({ icon, label, value, last }) => (
    <View style={[styles.infoRow, last && { borderBottomWidth: 0 }]}>
        <View style={styles.iconBox}>
            <Ionicons name={icon} size={20} color="#4F46E5" />
        </View>
        <View style={styles.infoTexts}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue}>{value || 'Not provided'}</Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F1F5F9' },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F1F5F9' },
    loadingText: { marginTop: 15, color: '#64748B', fontWeight: '800', fontSize: 14 },
    navBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
    navTitle: { fontSize: 22, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
    headerBtn: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', elevation: 2 },
    scrollContent: { paddingBottom: 40 },
    heroCard: { alignItems: 'center', paddingVertical: 40, marginHorizontal: 25, backgroundColor: '#FFFFFF', borderRadius: 32, marginTop: 10, borderWidth: 1, borderColor: '#E2E8F0', elevation: 3 },
    imageWrapper: { position: 'relative', marginBottom: 20 },
    profileImg: { width: 130, height: 130, borderRadius: 45, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#F1F5F9' },
    statusBadge: { position: 'absolute', bottom: -5, right: -5, width: 24, height: 24, borderRadius: 12, borderWidth: 4, borderColor: '#FFFFFF' },
    name: { fontSize: 26, fontWeight: '900', color: '#0F172A' },
    tag: { backgroundColor: '#F1F5F9', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 12, marginTop: 10 },
    tagText: { color: '#4F46E5', fontWeight: '800', fontSize: 13, textTransform: 'uppercase' },
    content: { paddingHorizontal: 25, marginTop: 25 },
    sectionLabel: { fontSize: 12, fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 15, marginLeft: 5 },
    infoCard: { backgroundColor: '#FFFFFF', borderRadius: 32, padding: 10, marginBottom: 25, borderWidth: 1, borderColor: '#E2E8F0', elevation: 3 },
    infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    iconBox: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    infoTexts: { flex: 1 },
    infoLabel: { fontSize: 11, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', marginBottom: 2 },
    infoValue: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
    dangerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF1F2', padding: 22, borderRadius: 32, borderWidth: 1, borderColor: '#FFE4E6' },
    dangerIconBox: { width: 48, height: 48, borderRadius: 18, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    dangerTitle: { fontSize: 17, fontWeight: '800', color: '#9F1239' },
    dangerSub: { fontSize: 13, color: '#E11D48', fontWeight: '600', marginTop: 2 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.8)', justifyContent: 'center', alignItems: 'center', padding: 25 },
    premiumModal: { backgroundColor: '#FFFFFF', borderRadius: 32, padding: 30, width: '100%', alignItems: 'center', elevation: 20 },
    modalStatus: { width: 60, height: 6, borderRadius: 10, marginBottom: 20 },
    modalTitleText: { fontSize: 22, fontWeight: '900', color: '#0F172A', marginBottom: 10 },
    modalSubText: { fontSize: 15, color: '#475569', textAlign: 'center', lineHeight: 22, marginBottom: 25 },
    modalActionRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between' },
    cancelBtn: { flex: 1, paddingVertical: 15, alignItems: 'center', borderRadius: 18, backgroundColor: '#F1F5F9', marginRight: 8 },
    cancelBtnText: { color: '#64748B', fontWeight: '800', fontSize: 16 },
    deleteBtn: { flex: 1, paddingVertical: 15, alignItems: 'center', borderRadius: 18, backgroundColor: '#0F172A', marginLeft: 8 },
    deleteBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
});

export default TeacherDetailsScreen;