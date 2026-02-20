import React, { useState } from 'react';
import { 
    View, Text, StyleSheet, Image, TouchableOpacity, 
    Linking, ScrollView, Dimensions, Vibration, Modal, ActivityIndicator, StatusBar 
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// GLOBAL DESIGN SYSTEM CONSTANTS
const COLORS = {
    background: '#F8FAFC',
    cardBg: '#FFFFFF',
    primary: '#2563EB',      // Royal Blue
    midnight: '#1E1B4B',     // Midnight Blue
    textPrimary: '#1E293B',  // Charcoal Gray
    textSecondary: '#64748B', // Slate Gray
    border: '#E2E8F0',
    success: '#10B981',      // Emerald Green
    error: '#DC2626',        // Crimson Red
};

const TeacherDetails = ({ route }) => {
    const { teacher } = route.params;
    const [imgLoading, setImgLoading] = useState(true);
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertMsg, setAlertMsg] = useState('');

    const triggerError = (msg) => {
        Vibration.vibrate(100);
        setAlertMsg(msg);
        setAlertVisible(true);
    };

    // 📞 Function to handle Phone Call
    const makeCall = (number) => {
        if (number) {
            Vibration.vibrate(10);
            const cleanNumber = number.replace(/\D/g, '');
            Linking.openURL(`tel:${cleanNumber}`);
        } else {
            triggerError("Contact number is not available for this faculty.");
        }
    };

    // 💬 Function to handle WhatsApp
    const openWhatsApp = (number) => {
        if (number) {
            Vibration.vibrate(10);
            let cleanNumber = number.replace(/\D/g, '');
            if (cleanNumber.length > 10) {
                cleanNumber = cleanNumber.slice(-10);
            }
            Linking.openURL(`whatsapp://send?phone=91${cleanNumber}`);
        } else {
            triggerError("WhatsApp contact is not available.");
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.background }}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                
                {/* Header / Profile Image */}
                <View style={styles.header}>
                    <View style={styles.imgWrapper}>
                        {imgLoading && <ActivityIndicator style={styles.loader} color={COLORS.primary} />}
                        <Image 
                            source={teacher.profilePhoto ? { uri: teacher.profilePhoto } : require('../../assets/default-avatar.png')} 
                            style={styles.profileImg} 
                            onLoadEnd={() => setImgLoading(false)}
                            onError={() => setImgLoading(false)}
                        />
                    </View>
                    <Text style={styles.name}>{teacher.name}</Text>
                    <View style={styles.subjectBadge}>
                        <Text style={styles.subjectText}>{teacher.subject || 'Faculty Member'}</Text>
                    </View>
                </View>

                {/* Info Section */}
                <View style={styles.infoSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Professional Profile</Text>
                    </View>

                    <View style={styles.card}>
                        <View style={styles.iconBox}>
                            <Ionicons name="school" size={22} color={COLORS.primary} />
                        </View>
                        <View style={styles.cardTextContent}>
                            <Text style={styles.label}>Qualification</Text>
                            <Text style={styles.value}>{teacher.qualifications || 'Expert Faculty'}</Text>
                        </View>
                    </View>

                    {/* Contact Options */}
                    <Text style={[styles.sectionTitle, { marginTop: 10 }]}>Quick Connect</Text>
                    <View style={styles.actionContainer}>
                        <TouchableOpacity 
                            style={styles.callBtn} 
                            onPress={() => makeCall(teacher.contactNumber)}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="call" size={20} color="#fff" />
                            <Text style={styles.callBtnText}>Call Teacher</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.waBtn} 
                            onPress={() => openWhatsApp(teacher.whatsappNumber || teacher.contactNumber)}
                            activeOpacity={0.8}
                        >
                            <FontAwesome name="whatsapp" size={22} color={COLORS.success} />
                            <Text style={styles.waBtnText}>WhatsApp</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={{ height: 40 }} />
            </ScrollView>

            {/* CUSTOM ALERT DIALOG */}
            <Modal transparent visible={alertVisible} animationType="fade">
                <View style={styles.alertOverlay}>
                    <View style={styles.alertBox}>
                        <Text style={styles.alertTitle}>Notification</Text>
                        <Text style={styles.alertMessage}>{alertMsg}</Text>
                        <TouchableOpacity 
                            style={styles.alertCloseBtn} 
                            onPress={() => setAlertVisible(false)}
                        >
                            <Text style={styles.alertCloseText}>Dismiss</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { 
        alignItems: 'center', 
        paddingVertical: 50, 
        backgroundColor: '#fff', 
        borderBottomLeftRadius: 40, 
        borderBottomRightRadius: 40, 
        elevation: 8,
        shadowColor: COLORS.primary,
        shadowOpacity: 0.1,
        shadowRadius: 20
    },
    imgWrapper: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: COLORS.border,
        overflow: 'hidden'
    },
    profileImg: { width: '100%', height: '100%' },
    loader: { position: 'absolute' },
    name: { fontSize: 26, fontWeight: '900', color: COLORS.textPrimary, marginTop: 15, letterSpacing: -0.5 },
    subjectBadge: {
        backgroundColor: COLORS.primary + '10',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        marginTop: 8
    },
    subjectText: { fontSize: 14, color: COLORS.primary, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
    
    infoSection: { padding: 24 },
    sectionTitle: { fontSize: 12, fontWeight: '900', color: COLORS.textSecondary, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1.5 },
    
    card: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#fff', 
        padding: 20, 
        borderRadius: 24, 
        marginBottom: 25, 
        elevation: 2,
        borderWidth: 1,
        borderColor: COLORS.border
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: COLORS.primary + '10',
        justifyContent: 'center',
        alignItems: 'center'
    },
    cardTextContent: { marginLeft: 16, flex: 1 },
    label: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '700', textTransform: 'uppercase' },
    value: { fontSize: 17, color: COLORS.textPrimary, fontWeight: '700', marginTop: 2 },
    
    actionContainer: { flexDirection: 'row', justifyContent: 'space-between' },
    callBtn: { 
        flex: 0.55, 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        backgroundColor: COLORS.primary, 
        paddingVertical: 16, 
        borderRadius: 18,
        elevation: 4,
        shadowColor: COLORS.primary,
        shadowOpacity: 0.3,
        shadowRadius: 10
    },
    callBtnText: { marginLeft: 10, fontWeight: '800', fontSize: 15, color: '#fff' },
    waBtn: { 
        flex: 0.4, 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        backgroundColor: '#fff', 
        paddingVertical: 16, 
        borderRadius: 18,
        borderWidth: 2,
        borderColor: COLORS.success + '40'
    },
    waBtnText: { marginLeft: 8, fontWeight: '800', fontSize: 15, color: COLORS.success },

    // Alert Styles
    alertOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 30 },
    alertBox: { width: '100%', backgroundColor: '#fff', borderRadius: 24, padding: 25, elevation: 20 },
    alertTitle: { fontSize: 20, fontWeight: '800', color: COLORS.midnight, marginBottom: 10 },
    alertMessage: { fontSize: 15, color: COLORS.textSecondary, lineHeight: 22, marginBottom: 20 },
    alertCloseBtn: { alignSelf: 'flex-end', padding: 10 },
    alertCloseText: { color: COLORS.primary, fontWeight: '800', fontSize: 15 }
});

export default TeacherDetails;