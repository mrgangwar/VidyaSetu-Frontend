import React, { useState, useContext, useRef } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, ScrollView, 
    StyleSheet, Image, ActivityIndicator, Platform, 
    KeyboardAvoidingView, Animated, Vibration, Modal,
    LayoutAnimation, UIManager
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import apiClient from '../api/client'; 
import { AuthContext } from '../context/AuthContext'; 
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const COLORS = {
    background: '#F8FAFC',
    primaryText: '#1F2937',
    secondaryText: '#64748B',
    accent: '#2563EB',
    cardBg: '#FFFFFF',
    border: '#E2E8F0',
    error: '#DC2626',
    success: '#10B981',
    midnight: '#0F172A'
};

export default function AddStudentScreen({ navigation }) {
    const { user } = useContext(AuthContext); 
    const [image, setImage] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [loading, setLoading] = useState(false);
    
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'success', onConfirm: null });
    const alertPopAnim = useRef(new Animated.Value(0)).current;

    const [formData, setFormData] = useState({
        name: '', 
        fatherName: '', 
        collegeName: '', 
        address: '',
        mobileNumber: '', 
        email: '', 
        studentLoginId: '', 
        password: '', 
        batchTime: '', 
        session: new Date().getFullYear().toString(), 
        parentMobile: '', 
        monthlyFees: '', 
        joiningDate: new Date()
    });

    const showAlert = (title, message, type = 'success', onConfirm = null) => {
        setAlertConfig({ title, message, type, onConfirm });
        setAlertVisible(true);
        Vibration.vibrate(type === 'error' ? [0, 40, 100, 40] : 15);
        Animated.spring(alertPopAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 8 }).start();
    };

    const hideAlert = () => {
        Animated.timing(alertPopAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
            setAlertVisible(false);
            if (alertConfig.onConfirm) alertConfig.onConfirm();
        });
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });
        if (!result.canceled) {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setImage(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        // Validation for required fields based on Schema
        if (!formData.name || !formData.studentLoginId || !formData.monthlyFees || !formData.password || !formData.mobileNumber) {
            return showAlert("Required Fields", "Please fill all mandatory fields (marked with *).", "error");
        }

        setLoading(true);
        try {
            const data = new FormData();
            
            // Appending all fields from Schema
            Object.keys(formData).forEach(key => {
                if (key === 'joiningDate') {
                    data.append(key, formData[key].toISOString());
                } else {
                    data.append(key, formData[key]);
                }
            });

            if (user?.coachingId) data.append('coachingId', user.coachingId);

            if (image) {
                const filename = image.split('/').pop();
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : `image/jpeg`;
                data.append('profilePhoto', {
                    uri: Platform.OS === 'android' ? image : image.replace('file://', ''),
                    name: filename,
                    type: type,
                });
            }

            const res = await apiClient.post('/teacher/create-student', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (res.data.success) {
                showAlert("Success ✅", `${formData.name} registered successfully!`, "success", () => navigation.goBack());
            }
        } catch (error) {
            showAlert("Registration Failed", error.response?.data?.message || "Check your network.", "error");
        } finally { 
            setLoading(false); 
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }} edges={['top']}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
                    
                    <View style={styles.headerContainer}>
                        <Text style={styles.headerTitle}>New Student</Text>
                        <Text style={styles.headerSub}>Complete the details to register a new student</Text>
                    </View>
                    
                    <TouchableOpacity activeOpacity={0.8} onPress={pickImage} style={styles.imageBox}>
                        <View style={styles.imgInner}>
                            {image ? (
                                <Image source={{ uri: image }} style={styles.img} />
                            ) : (
                                <View style={styles.cameraPlaceholder}>
                                    <Ionicons name="camera-outline" size={32} color={COLORS.accent} />
                                    <Text style={styles.photoLabel}>PHOTO</Text>
                                </View>
                            )}
                        </View>
                        <View style={styles.editBadge}><Ionicons name="add" size={16} color="#fff" /></View>
                    </TouchableOpacity>

                    <View style={styles.form}>
                        <SectionLabel title="Login Credentials" />
                        <InputField label="Full Name *" value={formData.name} onChange={t => setFormData({...formData, name: t})} icon="person-outline" />
                        <InputField label="Student ID / Username *" value={formData.studentLoginId} onChange={t => setFormData({...formData, studentLoginId: t})} icon="finger-print-outline" />
                        <InputField label="Login Password *" value={formData.password} onChange={t => setFormData({...formData, password: t})} icon="lock-closed-outline" secure />
                        
                        <SectionLabel title="Contact Details" />
                        <InputField label="Mobile Number *" value={formData.mobileNumber} onChange={t => setFormData({...formData, mobileNumber: t})} icon="call-outline" keyboard="phone-pad" />
                        <InputField label="Parent's Mobile" value={formData.parentMobile} onChange={t => setFormData({...formData, parentMobile: t})} icon="phone-portrait-outline" keyboard="phone-pad" />
                        <InputField label="Email Address" value={formData.email} onChange={t => setFormData({...formData, email: t})} icon="mail-outline" keyboard="email-address" />
                        <InputField label="Full Address" value={formData.address} onChange={t => setFormData({...formData, address: t})} icon="location-outline" />

                        <SectionLabel title="Academic & Fees" />
                        <InputField label="Father's Name" value={formData.fatherName} onChange={t => setFormData({...formData, fatherName: t})} icon="people-outline" />
                        <InputField label="College / School" value={formData.collegeName} onChange={t => setFormData({...formData, collegeName: t})} icon="business-outline" />
                        <View style={styles.row}>
                            <View style={{flex: 1, marginRight: 8}}>
                                <InputField label="Batch Time" value={formData.batchTime} onChange={t => setFormData({...formData, batchTime: t})} icon="time-outline" />
                            </View>
                            <View style={{flex: 1}}>
                                <InputField label="Session" value={formData.session} onChange={t => setFormData({...formData, session: t})} icon="calendar-outline" keyboard="numeric" />
                            </View>
                        </View>
                        <InputField label="Monthly Fees (INR) *" value={formData.monthlyFees} onChange={t => setFormData({...formData, monthlyFees: t})} icon="cash-outline" keyboard="numeric" />

                        <TouchableOpacity activeOpacity={0.7} onPress={() => setShowDatePicker(true)} style={styles.datePickerBtn}>
                            <View style={styles.dateLeft}>
                                <View style={styles.dateIconCircle}><Ionicons name="calendar" size={18} color={COLORS.accent} /></View>
                                <View style={{ marginLeft: 12 }}>
                                    <Text style={styles.dateLabel}>Joining Date</Text>
                                    <Text style={styles.dateValue}>{formData.joiningDate.toDateString()}</Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color={COLORS.secondaryText} />
                        </TouchableOpacity>

                        {showDatePicker && (
                            <DateTimePicker value={formData.joiningDate} mode="date" display="default" onChange={(e, d) => { setShowDatePicker(false); if(d) setFormData({...formData, joiningDate: d}); }} />
                        )}

                        <TouchableOpacity activeOpacity={0.8} style={[styles.btn, loading && { opacity: 0.7 }]} onPress={handleSave} disabled={loading}>
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Register Student</Text>}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <Modal transparent visible={alertVisible} animationType="none">
                <View style={styles.modalOverlay}>
                    <Animated.View style={[styles.alertBox, { transform: [{ scale: alertPopAnim }] }]}>
                        <View style={[styles.alertHeader, { backgroundColor: alertConfig.type === 'error' ? COLORS.error : COLORS.success }]} />
                        <View style={styles.alertBody}>
                            <Ionicons name={alertConfig.type === 'error' ? "alert-circle" : "checkmark-circle"} size={44} color={alertConfig.type === 'error' ? COLORS.error : COLORS.success} />
                            <Text style={styles.alertTitle}>{alertConfig.title}</Text>
                            <Text style={styles.alertMessage}>{alertConfig.message}</Text>
                            <TouchableOpacity style={styles.alertBtn} onPress={hideAlert}>
                                <Text style={styles.alertBtnText}>Continue</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const SectionLabel = ({ title }) => (
    <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionLabel}>{title}</Text>
        <View style={styles.headerLine} />
    </View>
);

const InputField = ({ label, value, onChange, icon, keyboard = 'default', secure = false }) => (
    <View style={styles.inputWrapper}>
        <Ionicons name={icon} size={18} color={COLORS.accent} style={{ marginRight: 12 }} />
        <TextInput 
            placeholder={label} 
            placeholderTextColor={COLORS.secondaryText}
            style={styles.textInput} 
            value={value} 
            onChangeText={onChange} 
            keyboardType={keyboard} 
            secureTextEntry={secure} 
        />
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerContainer: { padding: 25, alignItems: 'center' },
    headerTitle: { fontSize: 26, fontWeight: '800', color: COLORS.midnight },
    headerSub: { fontSize: 13, color: COLORS.secondaryText, marginTop: 4, textAlign: 'center' },
    imageBox: { alignSelf: 'center', marginBottom: 25 },
    imgInner: {
        width: 100, height: 100, borderRadius: 35, backgroundColor: COLORS.cardBg, 
        justifyContent: 'center', alignItems: 'center', elevation: 3, 
        shadowColor: '#000', shadowOpacity: 0.1, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden'
    },
    img: { width: '100%', height: '100%' },
    cameraPlaceholder: { alignItems: 'center' },
    photoLabel: { fontSize: 9, fontWeight: '800', color: COLORS.accent, marginTop: 4 },
    editBadge: { position: 'absolute', bottom: -5, right: -5, backgroundColor: COLORS.accent, width: 26, height: 26, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.background },
    form: { paddingHorizontal: 20 },
    sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', marginTop: 15, marginBottom: 12 },
    sectionLabel: { fontSize: 10, fontWeight: '800', color: COLORS.secondaryText, textTransform: 'uppercase', letterSpacing: 1.2 },
    headerLine: { flex: 1, height: 1, backgroundColor: COLORS.border, marginLeft: 10 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBg, paddingHorizontal: 16, borderRadius: 18, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
    textInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: COLORS.primaryText, fontWeight: '500' },
    row: { flexDirection: 'row' },
    datePickerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, backgroundColor: COLORS.cardBg, borderRadius: 18, marginBottom: 20, borderWidth: 1, borderColor: COLORS.border },
    dateLeft: { flexDirection: 'row', alignItems: 'center' },
    dateIconCircle: { width: 32, height: 32, borderRadius: 10, backgroundColor: `${COLORS.accent}10`, justifyContent: 'center', alignItems: 'center' },
    dateLabel: { fontSize: 10, fontWeight: '700', color: COLORS.secondaryText, textTransform: 'uppercase' },
    dateValue: { fontSize: 13, fontWeight: '700', color: COLORS.primaryText },
    btn: { backgroundColor: COLORS.accent, padding: 18, borderRadius: 20, alignItems: 'center', marginTop: 10, elevation: 4 },
    btnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'center', alignItems: 'center' },
    alertBox: { width: '85%', backgroundColor: '#FFF', borderRadius: 25, overflow: 'hidden' },
    alertHeader: { height: 5 },
    alertBody: { padding: 25, alignItems: 'center' },
    alertTitle: { fontSize: 18, fontWeight: '800', color: COLORS.midnight, marginTop: 15 },
    alertMessage: { fontSize: 13, color: COLORS.secondaryText, textAlign: 'center', marginTop: 8 },
    alertBtn: { marginTop: 20, backgroundColor: COLORS.accent, paddingHorizontal: 40, paddingVertical: 12, borderRadius: 15 },
    alertBtnText: { color: '#FFF', fontWeight: '700' }
});