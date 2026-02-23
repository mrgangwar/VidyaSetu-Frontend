import React, { useState, useContext } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, StyleSheet, 
    Image, ScrollView, ActivityIndicator, Platform,
    SafeAreaView, StatusBar, KeyboardAvoidingView, Modal, Vibration
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import apiClient from '../../api/client';

// Get API base URL from environment variable
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ? process.env.EXPO_PUBLIC_API_URL.replace('/api', '') : 'https://vidyasetu-backend-n7ob.onrender.com';

const AdminProfileScreen = ({ navigation }) => {
    const { user, setUser } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    
    // --- Themed Modal State (Source: Login Page) ---
    const [modalVisible, setModalVisible] = useState(false);
    const [modalContent, setModalContent] = useState({ title: '', message: '', type: 'error' });

    const [name, setName] = useState(user?.name || '');
    const [whatsapp, setWhatsapp] = useState(user?.whatsappNumber || '');
    const [contact, setContact] = useState(user?.contactNumber || '');
    const [image, setImage] = useState(null);

    const triggerModal = (title, message, type = 'error') => {
        // Adding vibration feedback: shorter for success, distinct for errors
        Vibration.vibrate(type === 'success' ? 60 : [0, 80, 50, 80]);
        setModalContent({ title, message, type });
        setModalVisible(true);
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });
        if (!result.canceled) setImage(result.assets[0]);
    };

    const handleSave = async () => {
        if (!name || !contact) {
            return triggerModal("Required Fields", "Name and Contact Number are essential for your profile.", "error");
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('whatsappNumber', whatsapp);
            formData.append('contactNumber', contact);

            if (image) {
                const filename = image.uri.split('/').pop();
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : `image/jpeg`;

                formData.append('profilePhoto', {
                    uri: Platform.OS === 'android' ? image.uri : image.uri.replace('file://', ''),
                    name: filename || 'admin_pfp.jpg',
                    type: type,
                });
            }

            const res = await apiClient.put('/admin/profile/update', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (res.data.success) {
                setUser(res.data.user); 
                triggerModal("Success 🎉", "Your profile has been synchronized successfully.", "success");
                setTimeout(() => {
                    setModalVisible(false);
                    navigation.goBack();
                }, 1800);
            }
        } catch (err) {
            triggerModal("Update Error", err.response?.data?.message || "Verification failed. Check your connection.", "error");
        } finally {
            setLoading(false);
        }
    };

    // Corrected Image rendering logic
    const baseUrl = process.env.EXPO_PUBLIC_API_URL ? process.env.EXPO_PUBLIC_API_URL.replace('/api', '') : 'https://vidyasetu-backend-n7ob.onrender.com';
    const currentProfilePic = user?.profilePhoto 
        ? { uri: user.profilePhoto.startsWith('http') ? user.profilePhoto : `${baseUrl}${user.profilePhoto.replace(/\\/g, '/')}` }
        : { uri: `https://ui-avatars.com/api/?name=${user?.name}&background=4F46E5&color=fff` };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#F1F5F9" />

            {/* --- THEMED PREMIUM MODAL (Source of Truth: Login) --- */}
            <Modal transparent visible={modalVisible} animationType="fade" onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.premiumModal}>
                        <View style={[styles.modalStatus, { backgroundColor: modalContent.type === 'error' ? '#EF4444' : '#10B981' }]} />
                        <Text style={styles.modalTitleText}>{modalContent.title}</Text>
                        <Text style={styles.modalSubText}>{modalContent.message}</Text>
                        <TouchableOpacity 
                            style={styles.modalCloseBtn} 
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={styles.modalCloseText}>Dismiss</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <View style={styles.headerNav}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color="#0F172A" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Account Settings</Text>
                    <View style={{ width: 44 }} />
                </View>

                <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    <View style={styles.imageSection}>
                        <View style={styles.imageWrapper}>
                            <Image source={image ? { uri: image.uri } : currentProfilePic} style={styles.profileImg} />
                            <TouchableOpacity onPress={pickImage} style={styles.cameraBadge}>
                                <Ionicons name="camera" size={20} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.adminEmail}>{user?.email}</Text>
                        <View style={styles.roleBadge}>
                            <Text style={styles.roleText}>SUPER ADMIN</Text>
                        </View>
                    </View>

                    <View style={styles.formCard}>
                        <Text style={styles.cardHeader}>Identity & Contact</Text>
                        
                        <CustomInput label="Full Name" icon="person-outline" value={name} onChange={setName} />
                        <CustomInput label="WhatsApp Number" icon="logo-whatsapp" value={whatsapp} onChange={setWhatsapp} keyboardType="phone-pad" />
                        <CustomInput label="Direct Contact" icon="call-outline" value={contact} onChange={setContact} keyboardType="phone-pad" />

                        <TouchableOpacity 
                            style={[styles.saveBtn, loading && { opacity: 0.7 }]} 
                            onPress={handleSave} 
                            disabled={loading}
                        >
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Preferences</Text>}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const CustomInput = ({ label, icon, value, onChange, ...props }) => (
    <View style={styles.inputGroup}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.inputWrapperInner}>
            <Ionicons name={icon} size={20} color="#94A3B8" style={{ marginRight: 12 }} />
            <TextInput 
                style={styles.input} 
                value={value} 
                onChangeText={onChange} 
                placeholderTextColor="#94A3B8"
                {...props} 
            />
        </View>
    </View>
);

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F1F5F9' },
    headerNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
    backBtn: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05 },
    headerTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A' },
    container: { padding: 20 },
    imageSection: { alignItems: 'center', marginBottom: 30 },
    imageWrapper: { position: 'relative' },
    profileImg: { width: 120, height: 120, borderRadius: 40, backgroundColor: '#FFF', borderWidth: 2, borderColor: '#E2E8F0' },
    cameraBadge: { position: 'absolute', bottom: -5, right: -5, backgroundColor: '#4F46E5', width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#F1F5F9' },
    adminEmail: { marginTop: 15, fontSize: 16, color: '#64748B', fontWeight: '700' },
    roleBadge: { marginTop: 8, backgroundColor: '#EEF2FF', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },
    roleText: { color: '#4F46E5', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
    formCard: { backgroundColor: '#FFF', borderRadius: 32, padding: 25, elevation: 3, borderWidth: 1, borderColor: '#E2E8F0' },
    cardHeader: { fontSize: 11, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 25 },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 11, fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: 10, marginLeft: 4, letterSpacing: 1 },
    inputWrapperInner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 18, paddingHorizontal: 16, borderWidth: 1.5, borderColor: '#F1F5F9' },
    input: { flex: 1, paddingVertical: 14, fontSize: 16, color: '#0F172A', fontWeight: '700' },
    saveBtn: { backgroundColor: '#4F46E5', paddingVertical: 18, borderRadius: 20, alignItems: 'center', marginTop: 10, elevation: 4, shadowColor: '#4F46E5', shadowOpacity: 0.3, shadowRadius: 10 },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },

    // Modal Styles (Mirrored from Login)
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.8)', justifyContent: 'center', alignItems: 'center', padding: 25 },
    premiumModal: { backgroundColor: '#FFFFFF', borderRadius: 28, padding: 35, width: '100%', alignItems: 'center', elevation: 20 },
    modalStatus: { width: 50, height: 5, borderRadius: 10, marginBottom: 25 },
    modalTitleText: { fontSize: 24, fontWeight: '900', color: '#0F172A', marginBottom: 12 },
    modalSubText: { fontSize: 16, color: '#475569', textAlign: 'center', lineHeight: 24, marginBottom: 30 },
    modalCloseBtn: { backgroundColor: '#0F172A', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 15 },
    modalCloseText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 }
});

export default AdminProfileScreen;