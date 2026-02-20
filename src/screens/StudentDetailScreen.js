import React, { useEffect, useState } from 'react';
import { 
    View, Text, Image, StyleSheet, ScrollView, 
    TouchableOpacity, Linking, ActivityIndicator, StatusBar, Dimensions, Platform 
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// Dynamic base URL for API calls
const API_BASE_URL = Platform.OS === 'web' ? 'http://localhost:5000' : 'http://10.54.31.32:5000';

export default function StudentDetailScreen({ route }) {
    const { studentId } = route.params; 
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStudentDetails();
    }, []);

    const fetchStudentDetails = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/api/teacher/student/${studentId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStudent(res.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching student details:", error);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#6366F1" />
                <Text style={styles.loaderText}>Retrieving student records...</Text>
            </View>
        );
    }

    if (!student) {
        return (
            <View style={styles.loaderContainer}>
                <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                <Text style={styles.errorText}>Student profile not found</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Profile Header Section */}
                <View style={styles.headerCard}>
                    <View style={styles.imageWrapper}>
                        <Image
                            source={student.profilePhoto
                                ? { uri: student.profilePhoto.startsWith('http') ? student.profilePhoto : `${API_BASE_URL}/${student.profilePhoto.replace(/\\/g, '/').replace(/^\//, '')}` }
                                : require('../assets/default-avatar.png')}
                            style={styles.profileImg}
                        />
                        <View style={styles.statusIndicator} />
                    </View>
                    <Text style={styles.nameText}>{student.name}</Text>
                    <View style={styles.idBadge}>
                        <Text style={styles.idText}>ID: {student.studentLoginId}</Text>
                    </View>
                </View>

                {/* Information Grid */}
                <View style={styles.detailsWrapper}>
                    <Text style={styles.sectionHeader}>Personal Information</Text>
                    
                    <View style={styles.infoCard}>
                        <DetailRow label="Guardian" value={student.fatherName} icon="person-outline" />
                        <DetailRow label="Educational Institution" value={student.collegeName} icon="school-outline" />
                        <DetailRow label="Primary Contact" value={student.mobileNumber} icon="call-outline" />
                        <DetailRow label="Emergency Contact" value={student.parentMobile} icon="shield-checkmark-outline" />
                        <DetailRow label="Email Address" value={student.email} icon="mail-outline" />
                        <DetailRow label="Assigned Batch" value={student.batchTime} icon="time-outline" />
                        <DetailRow label="Academic Session" value={student.session} icon="calendar-outline" />
                        <DetailRow label="Monthly Revenue" value={`₹${student.monthlyFees}`} icon="cash-outline" />
                        <DetailRow label="Residential Address" value={student.address} icon="location-outline" isLast />
                    </View>

                    {/* Quick Communication Actions */}
                    <View style={styles.actionGrid}>
                        <TouchableOpacity 
                            activeOpacity={0.8}
                            style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
                            onPress={() => Linking.openURL(`https://wa.me/${student.mobileNumber}`)}
                        >
                            <Ionicons name="logo-whatsapp" size={20} color="#fff" />
                            <Text style={styles.btnLabel}>WhatsApp</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            activeOpacity={0.8}
                            style={[styles.actionBtn, { backgroundColor: '#6366F1' }]}
                            onPress={() => Linking.openURL(`tel:${student.mobileNumber}`)}
                        >
                            <Ionicons name="call" size={18} color="#fff" />
                            <Text style={styles.btnLabel}>Call Now</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const DetailRow = ({ label, value, icon, isLast }) => (
    <View style={[styles.row, isLast && { borderBottomWidth: 0 }]}>
        <View style={styles.iconContainer}>
            <Ionicons name={icon} size={20} color="#6366F1" />
        </View>
        <View style={styles.textContainer}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <Text style={styles.fieldValue}>{value || 'Unspecified'}</Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
    loaderText: { marginTop: 12, color: '#64748B', fontWeight: '600' },
    errorText: { marginTop: 10, color: '#EF4444', fontWeight: 'bold' },
    
    headerCard: { 
        backgroundColor: '#1E293B', 
        paddingTop: 80, 
        paddingBottom: 40, 
        alignItems: 'center', 
        borderBottomLeftRadius: 40, 
        borderBottomRightRadius: 40,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 10
    },
    imageWrapper: { position: 'relative', marginBottom: 16 },
    profileImg: { 
        width: 130, 
        height: 130, 
        borderRadius: 65, 
        borderWidth: 4, 
        borderColor: '#6366F1' 
    },
    statusIndicator: {
        position: 'absolute',
        bottom: 5,
        right: 10,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#10B981',
        borderWidth: 3,
        borderColor: '#1E293B'
    },
    nameText: { fontSize: 26, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5 },
    idBadge: { 
        backgroundColor: 'rgba(99, 102, 241, 0.2)', 
        paddingHorizontal: 16, 
        paddingVertical: 6, 
        borderRadius: 12, 
        marginTop: 8,
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.3)'
    },
    idText: { color: '#A5B4FC', fontSize: 13, fontWeight: '800', letterSpacing: 1 },
    
    detailsWrapper: { paddingHorizontal: 20, marginTop: -20 },
    sectionHeader: { 
        fontSize: 14, 
        fontWeight: '800', 
        color: '#6366F1', 
        textTransform: 'uppercase', 
        letterSpacing: 1.5,
        marginLeft: 10,
        marginBottom: 12
    },
    infoCard: { 
        backgroundColor: '#FFFFFF', 
        borderRadius: 30, 
        padding: 20, 
        shadowColor: '#000', 
        shadowOpacity: 0.05, 
        shadowRadius: 10, 
        elevation: 4 
    },
    row: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9'
    },
    iconContainer: { 
        width: 40, 
        height: 40, 
        borderRadius: 12, 
        backgroundColor: '#EEF2FF', 
        justifyContent: 'center', 
        alignItems: 'center',
        marginRight: 15
    },
    textContainer: { flex: 1 },
    fieldLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase' },
    fieldValue: { fontSize: 15, color: '#334155', fontWeight: '600', marginTop: 2 },
    
    actionGrid: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        marginTop: 25 
    },
    actionBtn: { 
        flexDirection: 'row',
        paddingVertical: 16, 
        borderRadius: 20, 
        width: '48%', 
        alignItems: 'center', 
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5
    },
    btnLabel: { color: '#FFFFFF', fontWeight: '800', marginLeft: 8, fontSize: 14 }
});