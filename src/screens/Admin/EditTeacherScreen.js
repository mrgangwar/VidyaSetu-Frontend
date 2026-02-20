import React, { useState } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, StyleSheet, 
    ScrollView, Image, SafeAreaView, ActivityIndicator, 
    KeyboardAvoidingView, Platform, Modal, Vibration, StatusBar
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../api/client';

const EditTeacherScreen = ({ route, navigation }) => {
    const { teacher } = route.params;
    const [loading, setLoading] = useState(false);
    
    // --- Themed Modal State ---
    const [modalVisible, setModalVisible] = useState(false);
    const [modalConfig, setModalConfig] = useState({ title: '', message: '', success: false });

    const [formData, setFormData] = useState({
        name: teacher.name,
        coachingName: teacher.coachingId?.coachingName || '',
        subject: teacher.subject || '',
        contactNumber: teacher.contactNumber || '',
        address: teacher.address || '',
    });
    const [image, setImage] = useState(null);

    const triggerAlert = (title, message, success = false) => {
        Vibration.vibrate(success ? 60 : [0, 80, 50, 80]);
        setModalConfig({ title, message, success });
        setModalVisible(true);
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (!result.canceled) setImage(result.assets[0]);
    };

    const handleUpdate = async () => {
        setLoading(true);
        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('coachingName', formData.coachingName);
            data.append('subject', formData.subject);
            data.append('contactNumber', formData.contactNumber);
            data.append('address', formData.address);

            if (image) {
                const filename = image.uri.split('/').pop();
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : `image/jpeg`;
                
                data.append('profilePhoto', {
                    uri: Platform.OS === 'android' ? image.uri : image.uri.replace('file://', ''),
                    name: filename || 'profile.jpg',
                    type: type,
                });
            }

            const res = await apiClient.put(`/admin/teacher/update/${teacher._id}`, data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (res.data.success) {
                triggerAlert("Success 🎉", "Profile updated successfully", true);
                setTimeout(() => {
                    setModalVisible(false);
                    navigation.navigate('TeacherList');
                }, 1500);
            }
        } catch (err) {
            triggerAlert("Update Failed", err.response?.data?.message || err.message, false);
        } finally {
            setLoading(false);
        }
    };

    const baseUrl = Platform.OS === 'web' ? 'http://localhost:5000/' : 'http://10.54.31.32:5000/';
    const currentProfilePic = teacher.profilePhoto 
        ? { uri: teacher.profilePhoto.startsWith('http') ? teacher.profilePhoto : `${baseUrl}${teacher.profilePhoto.replace(/\\/g, '/')}` }
        : { uri: `https://ui-avatars.com/api/?name=${teacher.name}&background=4F46E5&color=fff` };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F1F5F9" />
            
            {/* --- THEMED CUSTOM MODAL --- */}
            <Modal transparent visible={modalVisible} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.premiumModal}>
                        <View style={[styles.modalStatus, { backgroundColor: modalConfig.success ? '#10B981' : '#EF4444' }]} />
                        <Text style={styles.modalTitleText}>{modalConfig.title}</Text>
                        <Text style={styles.modalSubText}>{modalConfig.message}</Text>
                        <TouchableOpacity 
                            style={[styles.modalBtn, { backgroundColor: '#0F172A' }]} 
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={styles.modalBtnText}>Continue</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                        <Ionicons name="close" size={24} color="#0F172A" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Edit Faculty</Text>
                    <View style={{ width: 44 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    <View style={styles.photoSection}>
                        <View style={styles.imageContainer}>
                            <Image 
                                source={image ? { uri: image.uri } : currentProfilePic} 
                                style={styles.img} 
                            />
                            <TouchableOpacity onPress={pickImage} style={styles.cameraBtn}>
                                <Ionicons name="camera" size={20} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.photoHint}>Tap camera to update photo</Text>
                    </View>

                    <View style={styles.formCard}>
                        <InputField label="Teacher Full Name" icon="person-outline" value={formData.name} onChange={(val) => setFormData({...formData, name: val})} />
                        <InputField label="Coaching Name" icon="business-outline" value={formData.coachingName} onChange={(val) => setFormData({...formData, coachingName: val})} />
                        <InputField label="Primary Subject" icon="book-outline" value={formData.subject} onChange={(val) => setFormData({...formData, subject: val})} />
                        <InputField label="Contact Number" icon="call-outline" value={formData.contactNumber} onChange={(val) => setFormData({...formData, contactNumber: val})} keyboardType="numeric" />
                        <InputField label="Full Address" icon="location-outline" value={formData.address} onChange={(val) => setFormData({...formData, address: val})} multiline />
                    </View>

                    <TouchableOpacity 
                        style={[styles.saveBtn, loading && { opacity: 0.7 }]} 
                        onPress={handleUpdate}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>Synchronize Changes</Text>}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const InputField = ({ label, icon, value, onChange, ...props }) => (
    <View style={styles.inputWrapper}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.inputContainer}>
            <Ionicons name={icon} size={20} color="#94A3B8" style={{ marginRight: 12 }} />
            <TextInput 
                style={styles.input} 
                value={value} 
                onChangeText={onChange}
                placeholderTextColor="#CBD5E1"
                {...props} 
            />
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F1F5F9' },
    header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A' },
    headerBtn: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 2 },
    scrollContent: { padding: 20, paddingBottom: 50 },
    photoSection: { alignItems: 'center', marginBottom: 30 },
    imageContainer: { position: 'relative' },
    img: { width: 120, height: 120, borderRadius: 40, backgroundColor: '#FFF', borderWidth: 2, borderColor: '#E2E8F0' },
    cameraBtn: { position: 'absolute', bottom: -5, right: -5, backgroundColor: '#4F46E5', width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#F1F5F9' },
    photoHint: { marginTop: 12, fontSize: 12, color: '#94A3B8', fontWeight: '800', textTransform: 'uppercase' },
    formCard: { backgroundColor: '#FFF', borderRadius: 32, padding: 20, marginBottom: 25, elevation: 3, borderWidth: 1, borderColor: '#E2E8F0' },
    inputWrapper: { marginBottom: 20 },
    label: { fontSize: 11, fontWeight: '800', color: '#64748B', textTransform: 'uppercase', marginBottom: 8, marginLeft: 4, letterSpacing: 1 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: '#E2E8F0' },
    input: { flex: 1, paddingVertical: 14, fontSize: 15, color: '#0F172A', fontWeight: '700' },
    saveBtn: { backgroundColor: '#0F172A', paddingVertical: 18, borderRadius: 20, alignItems: 'center', elevation: 4 },
    saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
    
    // Custom Modal Styles (Matching Login)
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.8)', justifyContent: 'center', alignItems: 'center', padding: 25 },
    premiumModal: { backgroundColor: '#FFF', borderRadius: 32, padding: 30, width: '100%', alignItems: 'center' },
    modalStatus: { width: 60, height: 6, borderRadius: 10, marginBottom: 20 },
    modalTitleText: { fontSize: 22, fontWeight: '900', color: '#0F172A', marginBottom: 10 },
    modalSubText: { fontSize: 15, color: '#475569', textAlign: 'center', lineHeight: 22, marginBottom: 25 },
    modalBtn: { width: '100%', paddingVertical: 15, borderRadius: 18, alignItems: 'center' },
    modalBtnText: { color: '#FFF', fontWeight: '800', fontSize: 16 }
});

export default EditTeacherScreen;