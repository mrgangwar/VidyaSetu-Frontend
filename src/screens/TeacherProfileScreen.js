import React, { useState, useContext, useRef, useEffect } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, StyleSheet, 
    Image, ScrollView, ActivityIndicator, Platform, 
    Vibration, Animated, Modal 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../api/client';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

// Get API base URL from environment variable
const API_BASE = process.env.EXPO_PUBLIC_API_URL ? process.env.EXPO_PUBLIC_API_URL.replace('/api', '') : 'https://vidyasetu-backend-n7ob.onrender.com';

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

const TeacherProfileScreen = () => {
    const { user, setUser } = useContext(AuthContext);
    
    // Local State
    const [name, setName] = useState('');
    const [coachingName, setCoachingName] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [whatsappNumber, setWhatsappNumber] = useState('');
    const [address, setAddress] = useState('');
    const [qualifications, setQualifications] = useState('');
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [imgLoading, setImgLoading] = useState(false);

    // Sync state with user context on load or change
    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setCoachingName(user.coachingName || '');
            setContactNumber(user.contactNumber || '');
            setWhatsappNumber(user.whatsappNumber || '');
            setAddress(user.address || '');
            setQualifications(user.qualifications || '');
        }
    }, [user]);

    // Custom Alert State
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'success' });
    const alertPopAnim = useRef(new Animated.Value(0)).current;

    const showAlert = (title, message, type = 'success') => {
        setAlertConfig({ title, message, type });
        setAlertVisible(true);
        Vibration.vibrate(type === 'error' ? [0, 50, 100, 50] : 15);
        Animated.spring(alertPopAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 8 }).start();
    };

    const hideAlert = () => {
        Vibration.vibrate(10);
        Animated.timing(alertPopAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setAlertVisible(false));
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images, 
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
            // LayoutAnimation can be added here for smooth transition
        }
    };

    const handleSave = async () => {
        if (!name || !contactNumber) {
            return showAlert("Required Fields", "Name and Contact Number are mandatory.", "error");
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('coachingName', coachingName);
            formData.append('contactNumber', contactNumber);
            formData.append('whatsappNumber', whatsappNumber);
            formData.append('address', address);
            formData.append('qualifications', qualifications);

            // CRITICAL: Ensure image is handled correctly
            if (image) {
                const filename = image.split('/').pop();
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : `image/jpeg`;

                formData.append('profilePhoto', {
                    uri: Platform.OS === 'android' ? image : image.replace('file://', ''),
                    name: filename,
                    type: type,
                });
            }

            // Using the user ID from context
            const userId = user?._id || user?.id;
            const res = await apiClient.put(`/teacher/update-profile/${userId}`, formData, {
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    'Accept': 'application/json'
                }
            });

            if (res.data.success) {
                setUser(res.data.user); // Update global auth state
                setImage(null); // Clear local image pick
                showAlert("Profile Updated", "Your details and photo have been saved successfully.", "success");
            }
        } catch (err) {
            console.log("Update Error:", err.response?.data || err.message);
            showAlert("Update Failed", err.response?.data?.message || "Internal server error.", "error");
        } finally {
            setLoading(false);
        }
    };

    // Helper to get image source
    const getImageSource = () => {
        if (image) return { uri: image };
        if (user?.profilePhoto) {
            // Check if it's already a full URL (Cloudinary) or a local path
            if (user.profilePhoto.startsWith('http')) {
                return { uri: user.profilePhoto };
            }
            return { uri: `${API_BASE}/${user.profilePhoto}` };
        }
        return null;
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }} edges={['bottom']}>
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                
                <View style={styles.header}>
                    <TouchableOpacity activeOpacity={0.9} onPress={pickImage} style={styles.imageWrapper}>
                        <View style={styles.imgContainer}>
                            {getImageSource() ? (
                                <Image 
                                    source={getImageSource()} 
                                    style={styles.profileImg} 
                                    onLoadStart={() => setImgLoading(true)}
                                    onLoadEnd={() => setImgLoading(false)}
                                />
                            ) : (
                                <View style={styles.placeholder}>
                                    <Ionicons name="person" size={50} color={COLORS.secondaryText} />
                                </View>
                            )}
                            {imgLoading && (
                                <ActivityIndicator style={styles.imgLoader} color={COLORS.accent} />
                            )}
                        </View>
                        <View style={styles.cameraIcon}>
                            <Ionicons name="camera" size={18} color="#fff" />
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.emailText}>{user?.email}</Text>
                    <View style={styles.roleBadgeContainer}>
                        <Text style={styles.roleBadge}>{user?.role || 'TEACHER'}</Text>
                    </View>
                </View>

                <View style={styles.form}>
                    <InputField label="Full Name" value={name} onChange={setName} icon="person-outline" />
                    <InputField label="Coaching Name" value={coachingName} onChange={setCoachingName} icon="business-outline" />
                    <InputField label="Qualifications" value={qualifications} onChange={setQualifications} icon="school-outline" />
                    <InputField label="Contact Number" value={contactNumber} onChange={setContactNumber} keyboard="phone-pad" icon="call-outline" />
                    <InputField label="WhatsApp Number" value={whatsappNumber} onChange={setWhatsappNumber} keyboard="phone-pad" icon="logo-whatsapp" />
                    <InputField label="Office Address" value={address} onChange={setAddress} multiline icon="location-outline" />

                    <TouchableOpacity 
                        activeOpacity={0.8}
                        style={[styles.saveBtn, loading && { opacity: 0.7 }]} 
                        onPress={() => {
                            Vibration.vibrate(10);
                            handleSave();
                        }} 
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <Modal transparent visible={alertVisible} animationType="none">
                <View style={styles.modalOverlay}>
                    <Animated.View style={[styles.alertBox, { transform: [{ scale: alertPopAnim }] }]}>
                        <View style={[styles.alertHeader, { backgroundColor: alertConfig.type === 'error' ? COLORS.error : COLORS.success }]} />
                        <View style={styles.alertBody}>
                            <Ionicons 
                                name={alertConfig.type === 'error' ? "alert-circle" : "checkmark-circle"} 
                                size={44} 
                                color={alertConfig.type === 'error' ? COLORS.error : COLORS.success} 
                            />
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
};

const InputField = ({ label, value, onChange, keyboard = 'default', multiline = false, icon }) => (
    <View style={styles.inputGroup}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.inputWrapper}>
            <Ionicons name={icon} size={20} color={COLORS.accent} style={styles.icon} />
            <TextInput 
                style={[styles.input, multiline && { height: 80, textAlignVertical: 'top' }]} 
                value={value} 
                onChangeText={onChange} 
                keyboardType={keyboard}
                multiline={multiline}
                placeholderTextColor={COLORS.secondaryText}
            />
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: { paddingBottom: 40, backgroundColor: COLORS.background },
    header: { 
        alignItems: 'center', 
        paddingVertical: 35, 
        backgroundColor: COLORS.cardBg, 
        borderBottomLeftRadius: 40, 
        borderBottomRightRadius: 40, 
        elevation: 8, shadowColor: '#000', shadowOpacity: 0.05
    },
    imageWrapper: { marginBottom: 15, position: 'relative' },
    imgContainer: {
        width: 120, height: 120, borderRadius: 42, overflow: 'hidden',
        borderWidth: 4, borderColor: COLORS.background, backgroundColor: '#F1F5F9',
        elevation: 5
    },
    profileImg: { width: '100%', height: '100%' },
    imgLoader: { position: 'absolute', top: '40%', left: '40%' },
    placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    cameraIcon: { 
        position: 'absolute', bottom: -5, right: -5, 
        backgroundColor: COLORS.accent, padding: 10, borderRadius: 15, 
        borderWidth: 3, borderColor: COLORS.cardBg, elevation: 5 
    },
    emailText: { fontSize: 14, color: COLORS.secondaryText, fontWeight: '600', marginTop: 5 },
    roleBadgeContainer: { 
        marginTop: 10, backgroundColor: `${COLORS.accent}15`, 
        paddingHorizontal: 16, paddingVertical: 6, borderRadius: 12 
    },
    roleBadge: { color: COLORS.accent, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
    form: { paddingHorizontal: 25, marginTop: 25 },
    inputGroup: { marginBottom: 18 },
    label: { fontSize: 12, color: COLORS.midnight, marginBottom: 8, fontWeight: '700', marginLeft: 4 },
    inputWrapper: { 
        flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBg, 
        borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 15 
    },
    icon: { marginRight: 12 },
    input: { flex: 1, paddingVertical: 14, fontSize: 15, color: COLORS.primaryText, fontWeight: '500' },
    saveBtn: { 
        backgroundColor: COLORS.accent, padding: 18, borderRadius: 22, 
        alignItems: 'center', marginTop: 15, elevation: 8, shadowColor: COLORS.accent, shadowOpacity: 0.3 
    },
    saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'center', alignItems: 'center' },
    alertBox: { width: '85%', backgroundColor: '#FFF', borderRadius: 25, overflow: 'hidden', elevation: 20 },
    alertHeader: { height: 6 },
    alertBody: { padding: 30, alignItems: 'center' },
    alertTitle: { fontSize: 20, fontWeight: '800', color: COLORS.midnight, marginTop: 15 },
    alertMessage: { fontSize: 14, color: COLORS.secondaryText, textAlign: 'center', marginTop: 10, lineHeight: 20 },
    alertBtn: { marginTop: 25, backgroundColor: COLORS.accent, paddingHorizontal: 40, paddingVertical: 12, borderRadius: 15 },
    alertBtnText: { color: '#FFF', fontWeight: '700' }
});

export default TeacherProfileScreen;