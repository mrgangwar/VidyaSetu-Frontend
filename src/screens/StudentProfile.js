import React, { useState, useEffect, useRef } from 'react';
import { 
    View, Text, StyleSheet, TextInput, TouchableOpacity, 
    ScrollView, Image, ActivityIndicator, Platform, 
    Animated, Vibration, Modal, Pressable, LayoutAnimation 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../api/client'; 
import { SafeAreaView } from 'react-native-safe-area-context';

// --- GLOBAL DESIGN SYSTEM ---
const COLORS = {
    background: '#F8FAFC',
    primaryText: '#1F2937',
    secondaryText: '#64748B',
    accent: '#2563EB',
    cardBg: '#FFFFFF',
    border: '#E2E8F0',
    error: '#DC2626',
    success: '#10B981',
    warning: '#F59E0B',
    midnight: '#0F172A'
};

const StudentProfile = ({ route, navigation }) => {
    const { studentId } = route.params; 
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    
    // Custom Alert State
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'success', onConfirm: null, showCancel: false });
    const alertPopAnim = useRef(new Animated.Value(0)).current;

    const [form, setForm] = useState({
        name: '',
        fatherName: '',
        mobileNumber: '',
        monthlyFees: '',
        address: '',
        batchTime: '',
        collegeName: '',
        session: '',
        parentMobile: '',
        profilePhoto: null
    });

    useEffect(() => {
        fetchStudentDetails();
    }, []);

    const showAlert = (title, message, type = 'success', onConfirm = null, showCancel = false) => {
        setAlertConfig({ title, message, type, onConfirm, showCancel });
        setAlertVisible(true);
        Vibration.vibrate(type === 'error' || type === 'warning' ? [0, 40, 100, 40] : 15);
        Animated.spring(alertPopAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 8 }).start();
    };

    const hideAlert = (runConfirm = true) => {
        Animated.timing(alertPopAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
            setAlertVisible(false);
            if (runConfirm && alertConfig.onConfirm) alertConfig.onConfirm();
        });
    };

    const fetchStudentDetails = async () => {
        try {
            const res = await apiClient.get(`/teacher/student/${studentId}`);
            if (res.data.success) {
                const s = res.data.student;
                setForm({
                    name: s.name || '',
                    fatherName: s.fatherName || '',
                    mobileNumber: s.mobileNumber || '',
                    monthlyFees: s.monthlyFees?.toString() || '',
                    address: s.address || '',
                    batchTime: s.batchTime || '',
                    collegeName: s.collegeName || '',
                    session: s.session || '',
                    parentMobile: s.parentMobile || '',
                    profilePhoto: s.profilePhoto
                });
            }
        } catch (err) {
            showAlert("Fetch Error", "Could not retrieve student details.", "error");
        } finally {
            setLoading(false);
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.3,
        });

        if (!result.canceled) {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setForm({ ...form, profilePhoto: result.assets[0].uri });
        }
    };

    const handleUpdate = async () => {
        if (!form.name || !form.monthlyFees) {
            return showAlert("Missing Info", "Name and Monthly Fees are required!", "warning");
        }

        setUpdating(true);
        try {
            const formData = new FormData();
            formData.append('name', form.name);
            formData.append('fatherName', form.fatherName);
            formData.append('mobileNumber', form.mobileNumber);
            formData.append('monthlyFees', form.monthlyFees);
            formData.append('address', form.address);
            formData.append('batchTime', form.batchTime);
            formData.append('collegeName', form.collegeName);
            formData.append('session', form.session);
            formData.append('parentMobile', form.parentMobile);

            if (form.profilePhoto && (form.profilePhoto.startsWith('file://') || form.profilePhoto.startsWith('content://'))) {
                const uri = form.profilePhoto;
                const filename = uri.split('/').pop();
                const match = /\.(\w+)$/.exec(filename || '');
                const type = match ? `image/${match[1]}` : `image/jpeg`;
                
                formData.append('profilePhoto', {
                    uri: uri,
                    name: filename || 'photo.jpg',
                    type: type
                });
            }

            const res = await apiClient.put(`/teacher/update-student/${studentId}`, formData);
            if (res.data.success) {
                showAlert("Success ✅", "Student profile updated successfully!", "success", () => navigation.goBack());
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message;
            showAlert("Update Failed", errorMsg, "error");
        } finally {
            setUpdating(false);
        }
    };

    const handleDelete = () => {
        showAlert(
            "Delete Student?", 
            "This action is permanent and cannot be undone. All records will be removed.", 
            "warning", 
            async () => {
                try {
                    const res = await apiClient.delete(`/teacher/delete-student/${studentId}`);
                    if (res.data.success) {
                        navigation.goBack();
                    }
                } catch (err) { showAlert("Error", "Could not delete student", "error"); }
            },
            true
        );
    };

    if (loading) return (
        <View style={styles.loaderCenter}>
            <ActivityIndicator size="large" color={COLORS.accent} />
            <Text style={styles.loaderText}>Loading Profile...</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                <View style={styles.header}>
                    <TouchableOpacity activeOpacity={0.8} onPress={pickImage} style={styles.avatarWrapper}>
                        <View style={styles.avatarBorder}>
                            <Image
                                source={form.profilePhoto
                                    ? { uri: form.profilePhoto.startsWith('http') || form.profilePhoto.startsWith('file://') || form.profilePhoto.startsWith('content://')
                                        ? form.profilePhoto
                                        : `http://10.54.31.32:5000/${form.profilePhoto.replace(/\\/g, '/').replace(/^\//, '')}` }
                                    : { uri: `https://ui-avatars.com/api/?name=${form.name}&background=2563EB&color=fff` }}
                                style={styles.avatar}
                            />
                        </View>
                        <View style={styles.editBadge}>
                            <Ionicons name="camera" size={16} color="#fff" />
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{form.name}</Text>
                    <Text style={styles.headerSub}>ID: {studentId.slice(-6).toUpperCase()}</Text>
                </View>

                <View style={styles.formSection}>
                    <Text style={styles.sectionTitle}>Personal Information</Text>
                    <InputGroup label="Full Name" value={form.name} onChange={t => setForm({...form, name: t})} icon="person-outline" />
                    <InputGroup label="Father's Name" value={form.fatherName} onChange={t => setForm({...form, fatherName: t})} icon="people-outline" />

                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                            <InputGroup label="Mobile" value={form.mobileNumber} onChange={t => setForm({...form, mobileNumber: t})} icon="call-outline" keyboard="phone-pad" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <InputGroup label="Monthly Fees" value={form.monthlyFees} onChange={t => setForm({...form, monthlyFees: t})} icon="cash-outline" keyboard="numeric" />
                        </View>
                    </View>

                    <Text style={styles.sectionTitle}>Academic Details</Text>
                    <InputGroup label="Batch Time" value={form.batchTime} onChange={t => setForm({...form, batchTime: t})} icon="time-outline" />
                    <InputGroup label="College Name" value={form.collegeName} onChange={t => setForm({...form, collegeName: t})} icon="school-outline" />
                    <InputGroup label="Address" value={form.address} onChange={t => setForm({...form, address: t})} icon="location-outline" />

                    <TouchableOpacity 
                        activeOpacity={0.8} 
                        style={[styles.updateBtn, updating && { opacity: 0.7 }]} 
                        onPress={handleUpdate} 
                        disabled={updating}
                    >
                        {updating ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Update Profile</Text>}
                    </TouchableOpacity>

                    <TouchableOpacity activeOpacity={0.6} style={styles.deleteBtn} onPress={handleDelete}>
                        <Ionicons name="trash-outline" size={18} color={COLORS.error} />
                        <Text style={styles.deleteText}>Remove Student Record</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Custom Alert Modal */}
            <Modal transparent visible={alertVisible} animationType="none">
                <View style={styles.modalOverlay}>
                    <Animated.View style={[styles.alertBox, { transform: [{ scale: alertPopAnim }] }]}>
                        <View style={[styles.alertHeader, { backgroundColor: alertConfig.type === 'error' ? COLORS.error : alertConfig.type === 'warning' ? COLORS.warning : COLORS.success }]} />
                        <View style={styles.alertBody}>
                            <Ionicons 
                                name={alertConfig.type === 'error' ? "alert-circle" : alertConfig.type === 'warning' ? "warning" : "checkmark-circle"} 
                                size={44} 
                                color={alertConfig.type === 'error' ? COLORS.error : alertConfig.type === 'warning' ? COLORS.warning : COLORS.success} 
                            />
                            <Text style={styles.alertTitle}>{alertConfig.title}</Text>
                            <Text style={styles.alertMessage}>{alertConfig.message}</Text>
                            
                            <View style={styles.alertActionRow}>
                                {alertConfig.showCancel && (
                                    <TouchableOpacity style={[styles.alertBtn, { backgroundColor: COLORS.border, marginRight: 10 }]} onPress={() => hideAlert(false)}>
                                        <Text style={[styles.alertBtnText, { color: COLORS.primaryText }]}>Cancel</Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity style={styles.alertBtn} onPress={() => hideAlert(true)}>
                                    <Text style={styles.alertBtnText}>{alertConfig.showCancel ? "Confirm" : "Continue"}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Animated.View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const InputGroup = ({ label, value, onChange, icon, keyboard = 'default' }) => (
    <View style={styles.inputWrapper}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.inputContainer}>
            <Ionicons name={icon} size={18} color={COLORS.accent} style={{ marginRight: 10 }} />
            <TextInput 
                style={styles.input} 
                value={value} 
                onChangeText={onChange} 
                keyboardType={keyboard}
                placeholderTextColor={COLORS.secondaryText}
            />
        </View>
    </View>
);

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.background },
    container: { flex: 1 },
    loaderCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
    loaderText: { marginTop: 10, color: COLORS.secondaryText, fontWeight: '600' },
    header: { paddingVertical: 30, alignItems: 'center' },
    avatarWrapper: { position: 'relative' },
    avatarBorder: {
        width: 120, height: 120, borderRadius: 45, backgroundColor: COLORS.cardBg, 
        padding: 4, elevation: 8, shadowColor: '#000', shadowOpacity: 0.1, 
        shadowRadius: 15, borderWidth: 1, borderColor: COLORS.border
    },
    avatar: { width: '100%', height: '100%', borderRadius: 40 },
    editBadge: { 
        position: 'absolute', bottom: -4, right: -4, backgroundColor: COLORS.accent, 
        padding: 8, borderRadius: 14, borderWidth: 3, borderColor: COLORS.background 
    },
    headerTitle: { fontSize: 26, fontWeight: '900', color: COLORS.midnight, marginTop: 15 },
    headerSub: { fontSize: 13, color: COLORS.secondaryText, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
    
    formSection: { paddingHorizontal: 20 },
    sectionTitle: { fontSize: 12, fontWeight: '800', color: COLORS.secondaryText, textTransform: 'uppercase', letterSpacing: 1.5, marginVertical: 15 },
    inputWrapper: { marginBottom: 16 },
    label: { fontSize: 12, color: COLORS.secondaryText, marginBottom: 6, fontWeight: '700', marginLeft: 4 },
    inputContainer: { 
        flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBg, 
        paddingHorizontal: 15, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border
    },
    input: { flex: 1, paddingVertical: 12, fontSize: 15, color: COLORS.primaryText, fontWeight: '600' },
    row: { flexDirection: 'row' },
    
    updateBtn: { 
        backgroundColor: COLORS.accent, padding: 18, borderRadius: 20, 
        alignItems: 'center', marginTop: 25, shadowColor: COLORS.accent, 
        shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 
    },
    btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
    deleteBtn: { marginTop: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10 },
    deleteText: { color: COLORS.error, fontWeight: '700', fontSize: 14, marginLeft: 8 },

    // Alert Dialog Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    alertBox: { width: '90%', backgroundColor: '#FFF', borderRadius: 25, overflow: 'hidden', elevation: 20 },
    alertHeader: { height: 6 },
    alertBody: { padding: 30, alignItems: 'center' },
    alertTitle: { fontSize: 19, fontWeight: '800', color: COLORS.midnight, marginTop: 15 },
    alertMessage: { fontSize: 14, color: COLORS.secondaryText, textAlign: 'center', marginTop: 10, lineHeight: 20 },
    alertActionRow: { flexDirection: 'row', marginTop: 25 },
    alertBtn: { backgroundColor: COLORS.accent, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 14, minWidth: 100, alignItems: 'center' },
    alertBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 }
});

export default StudentProfile;