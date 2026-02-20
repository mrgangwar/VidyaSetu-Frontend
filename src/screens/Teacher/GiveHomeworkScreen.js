import React, { useState, useContext, useRef } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, ScrollView, 
    StyleSheet, ActivityIndicator, SafeAreaView, StatusBar,
    Vibration, Animated, Modal, Dimensions, Platform
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../api/client';
import { AuthContext } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

// --- GLOBAL DESIGN SYSTEM ---
const COLORS = {
    background: '#F8FAFC', // Soft White
    primaryText: '#1F2937', // Charcoal Gray
    secondaryText: '#64748B', // Slate Gray
    placeholder: '#CBD5E1', // Light Gray
    cardBg: '#FFFFFF',
    border: '#E2E8F0',
    accent: '#2563EB', // Royal Blue
    midnight: '#0F172A', // Midnight Blue (Alert Title)
    success: '#10B981', // Emerald Green
    error: '#DC2626', // Crimson Red
    warning: '#F59E0B', // Amber
};

export default function GiveHomeworkScreen({ navigation }) {
    const { user } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [files, setFiles] = useState([]); 
    const [form, setForm] = useState({
        title: '',
        description: '',
        batchTime: '', 
    });

    // Custom Alert State
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'success' });
    const alertPopAnim = useRef(new Animated.Value(0)).current;

    const showAlert = (title, message, type = 'success') => {
        setAlertConfig({ title, message, type });
        setAlertVisible(true);
        // Success: short tap | Error: heavy double tap
        Vibration.vibrate(type === 'error' ? [0, 50, 100, 50] : 15);
        Animated.spring(alertPopAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 50,
            friction: 8
        }).start();
    };

    const hideAlert = () => {
        Animated.timing(alertPopAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true
        }).start(() => setAlertVisible(false));
    };

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['image/*', 'application/pdf'],
                multiple: true,
            });

            if (!result.canceled) {
                Vibration.vibrate(10);
                setFiles([...files, ...result.assets]);
            }
        } catch (err) {
            showAlert("Access Denied", "Unable to access document storage.", "error");
        }
    };

    const removeFile = (index) => {
        Vibration.vibrate(5);
        const newFiles = [...files];
        newFiles.splice(index, 1);
        setFiles(newFiles);
    };

    const handleUpload = async () => {
        if (!form.title || !form.batchTime) {
            return showAlert("Required Fields", "Please provide a title and batch time.", "warning");
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('title', form.title);
        formData.append('description', form.description);
        formData.append('batchTime', form.batchTime);

        files.forEach((file) => {
            formData.append('files', {
                uri: file.uri,
                name: file.name,
                type: file.mimeType,
            });
        });

        try {
            const res = await apiClient.post('/teacher/create-homework', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (res.data.success) {
                showAlert("Success", "Homework has been assigned successfully.", "success");
                setTimeout(() => {
                    hideAlert();
                    navigation.navigate('HomeworkHistory');
                }, 1800);
            }
        } catch (error) {
            showAlert("Upload Failed", error.response?.data?.message || "An unexpected error occurred.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.cardBg} />
            
            <ScrollView 
                style={styles.container} 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header Section */}
                <View style={styles.headerRow}>
                    <View>
                        <Text style={styles.headerLabel}>Curriculum</Text>
                        <Text style={styles.mainTitle}>New Homework</Text>
                    </View>
                    <TouchableOpacity 
                        activeOpacity={0.6}
                        style={styles.historyBtn} 
                        onPress={() => navigation.navigate('HomeworkHistory')}
                    >
                        <Ionicons name="time-outline" size={18} color={COLORS.accent} />
                        <Text style={styles.historyBtnText}>History</Text>
                    </TouchableOpacity>
                </View>

                {/* Form Card */}
                <View style={styles.formCard}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Assignment Title</Text>
                        <TextInput 
                            style={styles.input} 
                            placeholder="e.g. Calculus Practice Set" 
                            placeholderTextColor={COLORS.placeholder}
                            value={form.title} 
                            onChangeText={t => setForm({...form, title: t})} 
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Batch Schedule</Text>
                        <TextInput 
                            style={styles.input} 
                            placeholder="e.g. 10:00 AM - 12:00 PM" 
                            placeholderTextColor={COLORS.placeholder}
                            value={form.batchTime} 
                            onChangeText={t => setForm({...form, batchTime: t})} 
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Instructions</Text>
                        <TextInput 
                            style={[styles.input, styles.textArea]} 
                            multiline 
                            numberOfLines={4}
                            textAlignVertical="top"
                            placeholder="Enter detailed task instructions here..." 
                            placeholderTextColor={COLORS.placeholder}
                            value={form.description} 
                            onChangeText={t => setForm({...form, description: t})} 
                        />
                    </View>
                </View>

                {/* Attachment Section */}
                <Text style={styles.sectionTitle}>Support Material</Text>
                <TouchableOpacity 
                    activeOpacity={0.8} 
                    style={styles.attachBtn} 
                    onPress={pickDocument}
                >
                    <View style={styles.attachIconContainer}>
                        <Ionicons name="cloud-upload-outline" size={24} color={COLORS.accent} />
                    </View>
                    <View>
                        <Text style={styles.attachText}>Add Documents</Text>
                        <Text style={styles.attachSubtext}>PDFs or Images (Max 5MB)</Text>
                    </View>
                </TouchableOpacity>

                {/* File Previews */}
                <View style={styles.fileList}>
                    {files.map((f, i) => (
                        <View key={i} style={styles.fileCard}>
                            <View style={styles.fileIconWrapper}>
                                <Ionicons 
                                    name={f.mimeType === 'application/pdf' ? 'document-text' : 'image'} 
                                    size={20} 
                                    color={COLORS.secondaryText} 
                                />
                            </View>
                            <Text numberOfLines={1} style={styles.fileName}>{f.name}</Text>
                            <TouchableOpacity onPress={() => removeFile(i)} style={styles.removeFileBtn}>
                                <Ionicons name="close-circle" size={22} color={COLORS.error} />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>

                {/* Submit Action */}
                <TouchableOpacity 
                    activeOpacity={0.9}
                    style={[styles.submitBtn, loading && styles.submitBtnDisabled]} 
                    onPress={handleUpload} 
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <View style={styles.btnInner}>
                            <Text style={styles.submitText}>Publish Assignment</Text>
                            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
                        </View>
                    )}
                </TouchableOpacity>
            </ScrollView>

            {/* Custom Alert Modal */}
            <Modal transparent visible={alertVisible} animationType="none">
                <View style={styles.modalOverlay}>
                    <Animated.View style={[
                        styles.alertBox, 
                        { transform: [{ scale: alertPopAnim }], opacity: alertPopAnim }
                    ]}>
                        <View style={[
                            styles.alertAccentBar, 
                            { backgroundColor: alertConfig.type === 'error' ? COLORS.error : alertConfig.type === 'warning' ? COLORS.warning : COLORS.success }
                        ]} />
                        <View style={styles.alertBody}>
                            <Ionicons 
                                name={alertConfig.type === 'error' ? "close-circle" : alertConfig.type === 'warning' ? "alert-circle" : "checkmark-circle"} 
                                size={50} 
                                color={alertConfig.type === 'error' ? COLORS.error : alertConfig.type === 'warning' ? COLORS.warning : COLORS.success} 
                            />
                            <Text style={styles.alertTitleText}>{alertConfig.title}</Text>
                            <Text style={styles.alertMessageText}>{alertConfig.message}</Text>
                            <TouchableOpacity style={styles.alertCloseBtn} onPress={hideAlert}>
                                <Text style={styles.alertCloseBtnText}>Got it</Text>
                            </TouchableOpacity>
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
    scrollContent: { padding: 24, paddingBottom: 60 },
    headerRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 30 
    },
    headerLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: COLORS.accent,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 4
    },
    mainTitle: { fontSize: 26, fontWeight: '900', color: COLORS.primaryText, letterSpacing: -0.8 },
    historyBtn: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: COLORS.cardBg, 
        paddingVertical: 10, 
        paddingHorizontal: 16, 
        borderRadius: 16, 
        borderWidth: 1, 
        borderColor: COLORS.border,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5
    },
    historyBtnText: { color: COLORS.accent, fontWeight: '800', marginLeft: 6, fontSize: 13 },
    formCard: { marginBottom: 10 },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 13, fontWeight: '700', marginBottom: 8, color: COLORS.secondaryText, marginLeft: 4 },
    input: { 
        backgroundColor: COLORS.cardBg, 
        paddingHorizontal: 18, 
        paddingVertical: 15, 
        borderRadius: 18, 
        borderWidth: 1, 
        borderColor: COLORS.border, 
        fontSize: 15, 
        color: COLORS.primaryText,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.02
    },
    textArea: { height: 110, paddingTop: 15 },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.primaryText, marginBottom: 15, marginLeft: 4 },
    attachBtn: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: COLORS.cardBg,
        padding: 20, 
        borderRadius: 22, 
        borderStyle: 'dashed', 
        borderWidth: 2, 
        borderColor: '#CBD5E1', 
        marginBottom: 20 
    },
    attachIconContainer: {
        width: 46,
        height: 46,
        borderRadius: 14,
        backgroundColor: `${COLORS.accent}10`,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16
    },
    attachText: { color: COLORS.accent, fontWeight: '800', fontSize: 16 },
    attachSubtext: { color: COLORS.secondaryText, fontSize: 12, fontWeight: '500', marginTop: 2 },
    fileList: { marginBottom: 15 },
    fileCard: { 
        flexDirection: 'row', 
        backgroundColor: COLORS.cardBg, 
        padding: 12, 
        borderRadius: 16, 
        marginBottom: 10, 
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border
    },
    fileIconWrapper: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center'
    },
    fileName: { flex: 1, fontSize: 14, color: COLORS.primaryText, fontWeight: '600', marginLeft: 12 },
    removeFileBtn: { padding: 4 },
    submitBtn: { 
        backgroundColor: COLORS.accent, 
        padding: 20, 
        borderRadius: 22, 
        alignItems: 'center', 
        marginTop: 10,
        elevation: 8,
        shadowColor: COLORS.accent,
        shadowOpacity: 0.3,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 }
    },
    submitBtnDisabled: { opacity: 0.6 },
    btnInner: { flexDirection: 'row', alignItems: 'center' },
    submitText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800', marginRight: 8 },

    // Custom Alert Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'center', alignItems: 'center', padding: 25 },
    alertBox: { width: '100%', backgroundColor: COLORS.cardBg, borderRadius: 30, overflow: 'hidden', elevation: 20 },
    alertAccentBar: { height: 6 },
    alertBody: { padding: 30, alignItems: 'center' },
    alertTitleText: { fontSize: 22, fontWeight: '900', color: COLORS.midnight, marginTop: 15 },
    alertMessageText: { fontSize: 15, color: COLORS.secondaryText, textAlign: 'center', marginTop: 10, lineHeight: 22, fontWeight: '500' },
    alertCloseBtn: { marginTop: 25, backgroundColor: COLORS.midnight, paddingHorizontal: 40, paddingVertical: 14, borderRadius: 18, width: '100%', alignItems: 'center' },
    alertCloseBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15 }
});