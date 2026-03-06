import React, { useState, useCallback } from 'react';
import { 
    View, Text, StyleSheet, FlatList, TouchableOpacity, 
    ActivityIndicator, RefreshControl, SafeAreaView, StatusBar, 
    TextInput, Modal, Alert, ScrollView, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../api/client';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';

// Global Design System Colors
const COLORS = {
    background: '#F8FAFC',
    cardBg: '#FFFFFF',
    primary: '#2563EB',
    charcoal: '#1E293B',
    slate: '#64748B',
    lightGray: '#E2E8F0',
    success: '#10B981',
    error: '#DC2626',
    warning: '#F59E0B'
};

const ManageStudentFeesScreen = () => {
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [oldFeeModalVisible, setOldFeeModalVisible] = useState(false);
    
    // Edit form state
    const [monthlyFees, setMonthlyFees] = useState('');
    const [joiningDate, setJoiningDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Old fee form state
    const [oldFeeAmount, setOldFeeAmount] = useState('');
    const [oldFeeDate, setOldFeeDate] = useState(new Date());
    const [oldFeeMethod, setOldFeeMethod] = useState('CASH');
    const [oldFeeRemarks, setOldFeeRemarks] = useState('');
    const [showOldFeeDatePicker, setShowOldFeeDatePicker] = useState(false);
    const [isAddingOldFee, setIsAddingOldFee] = useState(false);

    const fetchStudents = async () => {
        try {
            const res = await apiClient.get('/teacher/my-students');
            if (res.data.success) {
                setStudents(res.data.students || []);
                setFilteredStudents(res.data.students || []);
            }
        } catch (err) {
            console.log("Fetch Students Error:", err);
            Alert.alert("Error", "Failed to load students");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchStudents();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchStudents();
    };

    const handleSearch = (text) => {
        setSearch(text);
        const filtered = students.filter(s => 
            s.name.toLowerCase().includes(text.toLowerCase()) || 
            s.studentLoginId.toLowerCase().includes(text.toLowerCase())
        );
        setFilteredStudents(filtered);
    };

    const openEditModal = (student) => {
        setSelectedStudent(student);
        setMonthlyFees(student.monthlyFees?.toString() || '');
        setJoiningDate(new Date(student.joiningDate || student.createdAt));
        setEditModalVisible(true);
    };

    const openOldFeeModal = (student) => {
        setSelectedStudent(student);
        setOldFeeAmount('');
        setOldFeeDate(new Date());
        setOldFeeMethod('CASH');
        setOldFeeRemarks('');
        setOldFeeModalVisible(true);
    };

    const saveFeeSettings = async () => {
        if (!monthlyFees || isNaN(Number(monthlyFees)) || Number(monthlyFees) < 0) {
            Alert.alert("Invalid Amount", "Please enter a valid monthly fee amount");
            return;
        }

        setIsSaving(true);
        try {
            const res = await apiClient.put('/fees/update-student-fee-settings', {
                studentId: selectedStudent._id,
                monthlyFees: Number(monthlyFees),
                joiningDate: joiningDate.toISOString()
            });

            if (res.data.success) {
                Alert.alert("Success", "Student fee settings updated successfully");
                setEditModalVisible(false);
                fetchStudents();
            }
        } catch (err) {
            Alert.alert("Error", err.response?.data?.message || "Failed to update fee settings");
        } finally {
            setIsSaving(false);
        }
    };

    const addOldFee = async () => {
        if (!oldFeeAmount || isNaN(Number(oldFeeAmount)) || Number(oldFeeAmount) <= 0) {
            Alert.alert("Invalid Amount", "Please enter a valid amount");
            return;
        }

        setIsAddingOldFee(true);
        try {
            const res = await apiClient.post('/fees/add-old-fee', {
                studentId: selectedStudent._id,
                amountPaid: Number(oldFeeAmount),
                paymentDate: oldFeeDate.toISOString(),
                paymentMethod: oldFeeMethod,
                remarks: oldFeeRemarks || 'Old Fee Payment'
            });

            if (res.data.success) {
                Alert.alert("Success", "Old fee payment added successfully");
                setOldFeeModalVisible(false);
            }
        } catch (err) {
            Alert.alert("Error", err.response?.data?.message || "Failed to add old fee");
        } finally {
            setIsAddingOldFee(false);
        }
    };

    const renderStudentItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.studentCard}
            onPress={() => openEditModal(item)}
            activeOpacity={0.7}
        >
            <View style={styles.studentInfo}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
                </View>
                <View style={styles.studentDetails}>
                    <Text style={styles.studentName}>{item.name}</Text>
                    <Text style={styles.studentId}>ID: {item.studentLoginId}</Text>
                    <Text style={styles.joiningDate}>
                        Joined: {new Date(item.joiningDate || item.createdAt).toLocaleDateString('en-GB')}
                    </Text>
                </View>
            </View>
            <View style={styles.feeActions}>
                <View style={styles.feeInfo}>
                    <Text style={styles.feeLabel}>MONTHLY</Text>
                    <Text style={styles.feeValue}>₹{item.monthlyFees}</Text>
                </View>
                <TouchableOpacity 
                    style={styles.addOldFeeBtn}
                    onPress={() => openOldFeeModal(item)}
                >
                    <Ionicons name="time-outline" size={16} color={COLORS.warning} />
                    <Text style={styles.addOldFeeText}>Add Old Fee</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loaderText}>Loading students...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
            
            <View style={styles.headerArea}>
                <Text style={styles.headerTitle}>Manage Fees</Text>
                <Text style={styles.headerSubtitle}>Edit monthly fees, joining date & add old payments</Text>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search-outline" size={20} color={COLORS.slate} />
                <TextInput 
                    placeholder="Search by name or ID..."
                    style={styles.searchInput}
                    value={search}
                    onChangeText={handleSearch}
                    placeholderTextColor={COLORS.slate}
                />
            </View>

            {/* Student List */}
            <FlatList
                data={filteredStudents}
                keyExtractor={(item) => item._id}
                renderItem={renderStudentItem}
                refreshControl={
                    <RefreshControl 
                        refreshing={refreshing} 
                        onRefresh={onRefresh} 
                        tintColor={COLORS.primary}
                    />
                }
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="people-outline" size={50} color={COLORS.lightGray} />
                        <Text style={styles.emptyText}>No students found</Text>
                    </View>
                }
            />

            {/* Edit Modal */}
            <Modal visible={editModalVisible} transparent animationType="slide">
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHandle} />
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Fee Settings</Text>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                <Ionicons name="close-circle" size={28} color={COLORS.lightGray} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.inputLabel}>Student Name</Text>
                            <View style={styles.infoBox}>
                                <Text style={styles.infoText}>{selectedStudent?.name}</Text>
                            </View>

                            <Text style={styles.inputLabel}>Monthly Fees (₹)</Text>
                            <TextInput 
                                style={styles.input}
                                value={monthlyFees}
                                onChangeText={setMonthlyFees}
                                keyboardType="numeric"
                                placeholder="Enter monthly fees"
                                placeholderTextColor={COLORS.lightGray}
                            />

                            <Text style={styles.inputLabel}>Joining Date</Text>
                            <TouchableOpacity 
                                style={styles.dateButton}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                                <Text style={styles.dateButtonText}>
                                    {joiningDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </Text>
                            </TouchableOpacity>

                            {showDatePicker && (
                                <DateTimePicker
                                    value={joiningDate}
                                    mode="date"
                                    display="default"
                                    onChange={(event, date) => {
                                        setShowDatePicker(Platform.OS === 'ios');
                                        if (date) setJoiningDate(date);
                                    }}
                                />
                            )}

                            <TouchableOpacity 
                                style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                                onPress={saveFeeSettings}
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <Ionicons name="save-outline" size={20} color="#fff" />
                                        <Text style={styles.saveButtonText}>Save Changes</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Add Old Fee Modal */}
            <Modal visible={oldFeeModalVisible} transparent animationType="slide">
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHandle} />
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add Old Fee Payment</Text>
                            <TouchableOpacity onPress={() => setOldFeeModalVisible(false)}>
                                <Ionicons name="close-circle" size={28} color={COLORS.lightGray} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.inputLabel}>Student</Text>
                            <View style={styles.infoBox}>
                                <Text style={styles.infoText}>{selectedStudent?.name}</Text>
                            </View>

                            <Text style={styles.inputLabel}>Amount (₹)</Text>
                            <TextInput 
                                style={styles.input}
                                value={oldFeeAmount}
                                onChangeText={setOldFeeAmount}
                                keyboardType="numeric"
                                placeholder="Enter amount"
                                placeholderTextColor={COLORS.lightGray}
                            />

                            <Text style={styles.inputLabel}>Payment Date</Text>
                            <TouchableOpacity 
                                style={styles.dateButton}
                                onPress={() => setShowOldFeeDatePicker(true)}
                            >
                                <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                                <Text style={styles.dateButtonText}>
                                    {oldFeeDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </Text>
                            </TouchableOpacity>

                            {showOldFeeDatePicker && (
                                <DateTimePicker
                                    value={oldFeeDate}
                                    mode="date"
                                    display="default"
                                    maximumDate={new Date()}
                                    onChange={(event, date) => {
                                        setShowOldFeeDatePicker(Platform.OS === 'ios');
                                        if (date) setOldFeeDate(date);
                                    }}
                                />
                            )}

                            <Text style={styles.inputLabel}>Payment Method</Text>
                            <View style={styles.methodContainer}>
                                {['CASH', 'ONLINE', 'UPI', 'CARD'].map((method) => (
                                    <TouchableOpacity 
                                        key={method}
                                        style={[styles.methodButton, oldFeeMethod === method && styles.methodButtonActive]}
                                        onPress={() => setOldFeeMethod(method)}
                                    >
                                        <Text style={[styles.methodText, oldFeeMethod === method && styles.methodTextActive]}>
                                            {method}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.inputLabel}>Remarks (Optional)</Text>
                            <TextInput 
                                style={[styles.input, styles.remarksInput]}
                                value={oldFeeRemarks}
                                onChangeText={setOldFeeRemarks}
                                placeholder="e.g., Fee for January 2025"
                                placeholderTextColor={COLORS.lightGray}
                                multiline
                            />

                            <TouchableOpacity 
                                style={[styles.saveButton, isAddingOldFee && styles.saveButtonDisabled]}
                                onPress={addOldFee}
                                disabled={isAddingOldFee}
                            >
                                {isAddingOldFee ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <Ionicons name="add-circle-outline" size={20} color="#fff" />
                                        <Text style={styles.saveButtonText}>Add Old Payment</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
    loaderText: { marginTop: 14, color: COLORS.slate, fontSize: 13, fontWeight: '600' },
    
    headerArea: { paddingHorizontal: 20, paddingTop: 15, paddingBottom: 10 },
    headerTitle: { fontSize: 28, fontWeight: '900', color: COLORS.charcoal },
    headerSubtitle: { fontSize: 14, color: COLORS.slate, marginTop: 4 },

    searchContainer: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: COLORS.cardBg, 
        marginHorizontal: 20, 
        marginTop: 10, 
        paddingHorizontal: 16, 
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.lightGray
    },
    searchInput: { flex: 1, paddingVertical: 12, marginLeft: 10, color: COLORS.charcoal, fontSize: 15 },

    listContent: { paddingHorizontal: 20, paddingBottom: 40 },
    studentCard: { 
        backgroundColor: COLORS.cardBg, 
        padding: 16, 
        borderRadius: 20, 
        marginBottom: 12, 
        flexDirection: 'row', 
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: COLORS.lightGray,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.02,
        shadowRadius: 8
    },
    studentInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    avatar: { width: 50, height: 50, borderRadius: 16, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    avatarText: { color: COLORS.primary, fontWeight: '900', fontSize: 20 },
    studentDetails: { flex: 1 },
    studentName: { fontSize: 16, fontWeight: '800', color: COLORS.charcoal },
    studentId: { fontSize: 12, color: COLORS.slate, marginTop: 2 },
    joiningDate: { fontSize: 11, color: COLORS.primary, marginTop: 2 },
    
    feeActions: { alignItems: 'flex-end' },
    feeInfo: { alignItems: 'flex-end', backgroundColor: '#F0F9FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, marginBottom: 8 },
    feeLabel: { fontSize: 9, color: COLORS.primary, fontWeight: '900', letterSpacing: 0.5 },
    feeValue: { fontSize: 18, fontWeight: '900', color: COLORS.charcoal },
    
    addOldFeeBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.warning + '15', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
    addOldFeeText: { fontSize: 11, color: COLORS.warning, fontWeight: '700', marginLeft: 4 },

    emptyState: { alignItems: 'center', marginTop: 60 },
    emptyText: { color: COLORS.slate, marginTop: 10, fontWeight: '600' },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: COLORS.cardBg, borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 30, maxHeight: '85%' },
    modalHandle: { width: 50, height: 5, backgroundColor: COLORS.lightGray, borderRadius: 10, marginBottom: 25 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    modalTitle: { fontSize: 22, fontWeight: '900', color: COLORS.charcoal },

    inputLabel: { fontSize: 13, fontWeight: '700', color: COLORS.slate, marginBottom: 8, marginTop: 15 },
    input: { 
        backgroundColor: COLORS.background, 
        borderRadius: 12, 
        paddingHorizontal: 16, 
        paddingVertical: 14, 
        fontSize: 16, 
        color: COLORS.charcoal,
        borderWidth: 1,
        borderColor: COLORS.lightGray
    },
    remarksInput: { height: 80, textAlignVertical: 'top' },
    
    infoBox: { backgroundColor: COLORS.background, padding: 14, borderRadius: 12 },
    infoText: { fontSize: 16, fontWeight: '700', color: COLORS.charcoal },

    dateButton: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: COLORS.background, 
        padding: 14, 
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.lightGray
    },
    dateButtonText: { marginLeft: 10, fontSize: 16, color: COLORS.charcoal, fontWeight: '600' },

    methodContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 5 },
    methodButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: COLORS.background, marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: COLORS.lightGray },
    methodButtonActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    methodText: { fontSize: 13, fontWeight: '700', color: COLORS.slate },
    methodTextActive: { color: '#fff' },

    saveButton: { 
        backgroundColor: COLORS.primary, 
        flexDirection: 'row', 
        justifyContent: 'center', 
        alignItems: 'center',
        padding: 18, 
        borderRadius: 16, 
        marginTop: 30,
        marginBottom: 20
    },
    saveButtonDisabled: { opacity: 0.6 },
    saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '800', marginLeft: 8 }
});

export default ManageStudentFeesScreen;
