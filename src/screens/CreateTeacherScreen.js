import React, { useState } from 'react';
import { 
    View, TextInput, TouchableOpacity, Image, Text, StyleSheet, 
    ScrollView, Modal, ActivityIndicator, Platform, Linking, 
    StatusBar, SafeAreaView, Vibration, Dimensions
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons'; 
import apiClient from '../api/client';

const FormInput = ({ label, placeholder, value, onChangeText, field, isFocused, setIsFocused, ...props }) => (
    <View style={styles.inputWrapper}>
        <Text style={styles.label}>{label}</Text>
        <TextInput 
            style={[styles.input, isFocused === field && styles.inputFocused]}
            placeholder={placeholder}
            placeholderTextColor="#94A3B8"
            value={value}
            onChangeText={onChangeText}
            onFocus={() => setIsFocused(field)}
            onBlur={() => setIsFocused(null)}
            {...props}
        />
    </View>
);

export default function CreateTeacherScreen({ navigation }) {
    const initialState = {
        name: '', email: '', password: '', coachingName: '', 
        address: '', qualifications: '', subject: '', contactNumber: ''
    };

    const [formData, setFormData] = useState(initialState);
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(null);

    const [modalVisible, setModalVisible] = useState(false);
    const [whatsappLink, setWhatsappLink] = useState('');

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'], 
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const handleCreate = async () => {
        if (!formData.name || !formData.email || !formData.password) {
            Vibration.vibrate(50);
            return alert("Essential Fields Required", "Please provide a Name, Email, and Password.");
        }

        setLoading(true);
        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                if (formData[key]) {
                    let value = formData[key];
                    if (key === 'contactNumber' && value.length === 10) value = `91${value}`;
                    data.append(key, value);
                }
            });

            if (image) {
                const filename = image.split('/').pop();
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : `image`;
                data.append('profilePhoto', {
                    uri: Platform.OS === 'android' ? image : image.replace('file://', ''),
                    name: filename || 'photo.jpg',
                    type: type === 'image/jpg' ? 'image/jpeg' : type,
                });
            }

            const response = await apiClient.post('/admin/create-teacher', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (response.data.success) {
                setWhatsappLink(response.data.whatsappLink);
                setModalVisible(true); 
                Vibration.vibrate(100);
            }
        } catch (error) {
            alert('Registration Failed', error.response?.data?.message || "An error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#F1F5F9" />
            
            <Modal transparent visible={modalVisible} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.premiumModal}>
                        <View style={[styles.modalStatus, { backgroundColor: '#10B981' }]} />
                        <Text style={styles.modalTitleText}>Teacher Onboarded</Text>
                        <Text style={styles.modalSubText}>The account is ready. Would you like to share the credentials now?</Text>
                        
                        <TouchableOpacity 
                            style={styles.whatsappBtn} 
                            onPress={() => {
                                if (whatsappLink) Linking.openURL(whatsappLink);
                                setModalVisible(false);
                                navigation.goBack();
                            }}
                        >
                            <Text style={styles.whatsappBtnText}>Send on WhatsApp</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.modalCloseBtn} onPress={() => {setModalVisible(false); navigation.goBack();}}>
                            <Text style={styles.modalCloseText}>Skip for now</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Register Teacher</Text>
                <View style={{width: 44}} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <TouchableOpacity onPress={pickImage} style={styles.imagePickerContainer}>
                    <View style={styles.imagePicker}>
                        {image ? (
                            <Image source={{ uri: image }} style={styles.img} />
                        ) : (
                            <Ionicons name="camera-outline" size={32} color="#94A3B8" />
                        )}
                    </View>
                    <View style={styles.addBadge}>
                        <Ionicons name="add" size={18} color="#FFF" />
                    </View>
                </TouchableOpacity>

                <View style={styles.formCard}>
                    <FormInput label="Full Name *" placeholder="Enter teacher's name" value={formData.name} onChangeText={(txt) => setFormData({...formData, name: txt})} field="name" isFocused={isFocused} setIsFocused={setIsFocused} />
                    <FormInput label="Email Address *" placeholder="name@institution.com" value={formData.email} onChangeText={(txt) => setFormData({...formData, email: txt})} field="email" keyboardType="email-address" autoCapitalize="none" isFocused={isFocused} setIsFocused={setIsFocused} />
                    <FormInput label="Temporary Password *" placeholder="Create a secure password" value={formData.password} onChangeText={(txt) => setFormData({...formData, password: txt})} field="pass" secureTextEntry isFocused={isFocused} setIsFocused={setIsFocused} />
                    <FormInput label="Coaching Name" placeholder="e.g. Vidya Academy" value={formData.coachingName} onChangeText={(txt) => setFormData({...formData, coachingName: txt})} field="coaching" isFocused={isFocused} setIsFocused={setIsFocused} />
                    <FormInput label="Subject Expertise" placeholder="e.g. Mathematics" value={formData.subject} onChangeText={(txt) => setFormData({...formData, subject: txt})} field="subject" isFocused={isFocused} setIsFocused={setIsFocused} />
                    <FormInput label="Qualifications" placeholder="e.g. M.Sc, B.Ed" value={formData.qualifications} onChangeText={(txt) => setFormData({...formData, qualifications: txt})} field="qual" isFocused={isFocused} setIsFocused={setIsFocused} />
                    <FormInput label="Contact Number" placeholder="10-digit number" value={formData.contactNumber} onChangeText={(txt) => setFormData({...formData, contactNumber: txt})} field="phone" keyboardType="numeric" isFocused={isFocused} setIsFocused={setIsFocused} />
                    <FormInput label="Address" placeholder="Enter physical address" value={formData.address} onChangeText={(txt) => setFormData({...formData, address: txt})} field="address" multiline isFocused={isFocused} setIsFocused={setIsFocused} />

                    <TouchableOpacity style={styles.submitBtn} onPress={handleCreate} disabled={loading} activeOpacity={0.8}>
                        {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Complete Registration</Text>}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F1F5F9' },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: 20, 
        paddingVertical: 15, 
        backgroundColor: '#F1F5F9' 
    },
    backBtn: { 
        width: 44, height: 44, borderRadius: 15, 
        backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2
    },
    headerTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
    scrollContainer: { padding: 25, paddingTop: 10 },
    imagePickerContainer: { alignSelf: 'center', marginBottom: 35, marginTop: 10 },
    imagePicker: { 
        height: 110, width: 110, backgroundColor: '#FFFFFF', borderRadius: 35, 
        justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', 
        overflow: 'hidden', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 5
    },
    img: { height: '100%', width: '100%' },
    addBadge: { 
        position: 'absolute', bottom: -5, right: -5, backgroundColor: '#4F46E5', 
        width: 32, height: 32, borderRadius: 12, justifyContent: 'center', alignItems: 'center', 
        borderWidth: 3, borderColor: '#F1F5F9' 
    },
    formCard: { 
        backgroundColor: '#FFFFFF', borderRadius: 32, padding: 24, 
        borderWidth: 1, borderColor: '#E2E8F0',
        shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.04, shadowRadius: 15, elevation: 3 
    },
    inputWrapper: { marginBottom: 22 },
    label: { fontSize: 12, fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, marginLeft: 4 },
    input: { backgroundColor: '#F8FAFC', borderRadius: 18, paddingHorizontal: 20, paddingVertical: 16, fontSize: 16, color: '#0F172A', borderWidth: 1.5, borderColor: '#F1F5F9' },
    inputFocused: { borderColor: '#4F46E5', backgroundColor: '#FFFFFF' },
    submitBtn: { 
        backgroundColor: '#4F46E5', paddingVertical: 18, borderRadius: 20, 
        alignItems: 'center', marginTop: 15, shadowColor: '#4F46E5', 
        shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 
    },
    submitBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
    
    
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.8)', justifyContent: 'center', alignItems: 'center', padding: 25 },
    premiumModal: { backgroundColor: '#FFFFFF', borderRadius: 28, padding: 35, width: '100%', alignItems: 'center', elevation: 20 },
    modalStatus: { width: 50, height: 5, borderRadius: 10, marginBottom: 25 },
    modalTitleText: { fontSize: 24, fontWeight: '900', color: '#0F172A', marginBottom: 12 },
    modalSubText: { fontSize: 16, color: '#475569', textAlign: 'center', lineHeight: 24, marginBottom: 30 },
    whatsappBtn: { backgroundColor: '#25D366', width: '100%', paddingVertical: 18, borderRadius: 18, alignItems: 'center', marginBottom: 15 },
    whatsappBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
    modalCloseBtn: { paddingVertical: 10 },
    modalCloseText: { color: '#94A3B8', fontWeight: '700', fontSize: 15 }
});