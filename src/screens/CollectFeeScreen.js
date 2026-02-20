import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
    View, Text, TextInput, FlatList, TouchableOpacity, 
    StyleSheet, Modal, ActivityIndicator, KeyboardAvoidingView, Platform, 
    RefreshControl, SafeAreaView, Linking, StatusBar, Vibration, Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../api/client'; 

// --- GLOBAL DESIGN SYSTEM COLORS ---
const COLORS = {
    background: '#F8FAFC', // Soft White
    cardBg: '#FFFFFF',
    primaryText: '#1E293B', // Charcoal Gray
    secondaryText: '#64748B', // Slate Gray
    placeholder: '#CBD5E1', // Light Gray
    primary: '#2563EB', // Royal Blue
    midnight: '#0F172A', // Midnight Blue
    success: '#10B981', // Emerald Green
    error: '#EF4444', // Crimson Red
    warning: '#F59E0B', // Amber
    border: '#E2E8F0',
};

export default function CollectFeeScreen() {
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Custom Alert States
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'success' });
    const alertAnim = useRef(new Animated.Value(0)).current;

    // Payment Modal States
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [amount, setAmount] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    
    // Success Popup States
    const [successModalVisible, setSuccessModalVisible] = useState(false);
    const [paymentData, setPaymentData] = useState(null);

    // Custom Alert Trigger
    const showAlert = (title, message, type = 'success') => {
        setAlertConfig({ title, message, type });
        setAlertVisible(true);
        Vibration.vibrate(type === 'error' ? [0, 50, 100, 50] : 10);
        Animated.spring(alertAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 8 }).start();
    };

    const hideAlert = () => {
        Animated.timing(alertAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => setAlertVisible(false));
    };

    const fetchStudents = async () => {
        try {
            const res = await apiClient.get('/teacher/my-students');
            if (res.data.success) {
                setStudents(res.data.students || []);
                setFilteredStudents(res.data.students || []);
            }
        } catch (error) {
            showAlert("System Error", "Failed to retrieve student records.", "error");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchStudents(); }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchStudents();
    }, []);

    const handleSearch = (text) => {
        setSearch(text);
        const filtered = students.filter(s => 
            s.name.toLowerCase().includes(text.toLowerCase()) || 
            s.studentLoginId.toLowerCase().includes(text.toLowerCase())
        );
        setFilteredStudents(filtered);
    };

    const openPaymentModal = (student) => {
        setSelectedStudent(student);
        setAmount(''); 
        setModalVisible(true);
        Vibration.vibrate(5);
    };

    const processPayment = async () => {
        if (!amount || isNaN(amount) || Number(amount) <= 0) {
            return showAlert("Invalid Input", "Please enter a positive numeric value.", "error");
        }

        setIsProcessing(true);
        try {
            const res = await apiClient.post('/teacher/collect-fee', {
                studentId: selectedStudent._id,
                amountPaid: Number(amount)
            });

            if (res.data.success) {
                setPaymentData({
                    amount: amount,
                    studentName: selectedStudent.name,
                    receiptNo: res.data.record.receiptNo,
                    waLink: res.data.whatsappLink
                });
                setModalVisible(false);
                setSuccessModalVisible(true);
                Vibration.vibrate([0, 10, 30, 10]);
                fetchStudents();
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || "Transaction failed.";
            showAlert("Payment Error", errorMsg, "error");
        } finally {
            setIsProcessing(false);
        }
    };

    const renderStudent = ({ item }) => (
        <TouchableOpacity 
            activeOpacity={0.7} 
            style={styles.card} 
            onPress={() => openPaymentModal(item)}
        >
            <View style={styles.studentLeft}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
                </View>
                <View>
                    <Text style={styles.name}>{item.name}</Text>
                    <View style={styles.metaRow}>
                        <Text style={styles.subText}>ID: {item.studentLoginId}</Text>
                        <View style={styles.dot} />
                        <Text style={styles.subText}>{item.batchTime}</Text>
                    </View>
                </View>
            </View>
            <View style={styles.feeInfo}>
                <Text style={styles.feeLabel}>MONTHLY</Text>
                <Text style={styles.feeValue}>₹{item.monthlyFees}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
            <View style={styles.container}>
                <View style={styles.headerSection}>
                    <Text style={styles.headerSubtitle}>Finance Manager</Text>
                    <Text style={styles.headerMain}>Collect Fees</Text>
                    <Text style={styles.subHeader}>Select a student to record their payment</Text>
                </View>
                
                <View style={styles.searchWrapper}>
                    <Ionicons name="search-outline" size={20} color={COLORS.secondaryText} />
                    <TextInput 
                        placeholder="Search student by name or ID..." 
                        style={styles.searchBar}
                        value={search}
                        onChangeText={handleSearch}
                        placeholderTextColor={COLORS.placeholder}
                    />
                </View>

                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                        <Text style={styles.loadingText}>Fetching Records...</Text>
                    </View>
                ) : (
                    <FlatList 
                        data={filteredStudents}
                        keyExtractor={item => item._id}
                        renderItem={renderStudent}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Ionicons name="people-outline" size={50} color={COLORS.placeholder} />
                                <Text style={styles.emptyText}>No matching students found</Text>
                            </View>
                        }
                    />
                )}

                {/* MODAL 1: Amount Collection */}
                <Modal visible={modalVisible} transparent animationType="slide">
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHandle} />
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitleSmall}>PAYMENT ENTRY</Text>
                                <TouchableOpacity onPress={() => setModalVisible(false)}>
                                    <Ionicons name="close-circle" size={28} color={COLORS.placeholder} />
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.targetStudent}>{selectedStudent?.name}</Text>
                            <Text style={styles.targetId}>Reg ID: {selectedStudent?.studentLoginId}</Text>
                            
                            <View style={styles.inputContainer}>
                                <View style={styles.inputWrapper}>
                                    <Text style={styles.currencySymbol}>₹</Text>
                                    <TextInput 
                                        placeholder="0" 
                                        keyboardType="numeric" 
                                        style={styles.amountInput}
                                        value={amount} 
                                        onChangeText={setAmount} 
                                        autoFocus
                                        placeholderTextColor={COLORS.border}
                                    />
                                </View>
                            </View>

                            <TouchableOpacity 
                                activeOpacity={0.8}
                                style={[styles.payBtn, isProcessing && styles.btnDisabled]} 
                                onPress={processPayment} 
                                disabled={isProcessing}
                            >
                                {isProcessing ? <ActivityIndicator color="#fff" /> : <Text style={styles.payBtnText}>Confirm and Log Payment</Text>}
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </Modal>

                {/* MODAL 2: Success Popup */}
                <Modal visible={successModalVisible} transparent animationType="fade">
                    <View style={styles.successOverlay}>
                        <View style={styles.successCard}>
                            <View style={styles.successIconWrapper}>
                                <Ionicons name="checkmark-done" size={50} color={COLORS.success} />
                            </View>
                            
                            <Text style={styles.successTitle}>Transaction Success</Text>
                            <Text style={styles.successDesc}>
                                Logged <Text style={styles.boldText}>₹{paymentData?.amount}</Text> for{"\n"}
                                <Text style={styles.studentHighlight}>{paymentData?.studentName}</Text>
                            </Text>

                            <View style={styles.receiptContainer}>
                                <Text style={styles.receiptLabel}>TRANS. ID</Text>
                                <Text style={styles.receiptText}>{paymentData?.receiptNo}</Text>
                            </View>
                            
                            <TouchableOpacity 
                                activeOpacity={0.8}
                                style={styles.waPremiumBtn} 
                                onPress={() => {
                                    setSuccessModalVisible(false);
                                    if (paymentData?.waLink) Linking.openURL(paymentData.waLink);
                                }}
                            >
                                <Ionicons name="logo-whatsapp" size={20} color="#fff" />
                                <Text style={styles.waPremiumBtnText}>Send Digital Receipt</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.doneBtn} onPress={() => setSuccessModalVisible(false)}>
                                <Text style={styles.doneBtnText}>Close Window</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* Custom Alert Dialog */}
                <Modal transparent visible={alertVisible} animationType="none">
                    <View style={styles.alertOverlay}>
                        <Animated.View style={[styles.alertBox, { transform: [{ scale: alertAnim }] }]}>
                            <View style={[styles.alertBar, { backgroundColor: alertConfig.type === 'error' ? COLORS.error : COLORS.success }]} />
                            <View style={styles.alertContent}>
                                <Text style={styles.alertTitle}>{alertConfig.title}</Text>
                                <Text style={styles.alertMessage}>{alertConfig.message}</Text>
                                <TouchableOpacity style={styles.alertBtn} onPress={hideAlert}>
                                    <Text style={styles.alertBtnText}>Dismiss</Text>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    </View>
                </Modal>

            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.background },
    container: { flex: 1, paddingHorizontal: 20 },
    headerSection: { marginTop: 15, marginBottom: 20 },
    headerSubtitle: { fontSize: 12, fontWeight: '800', color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 },
    headerMain: { fontSize: 32, fontWeight: '900', color: COLORS.primaryText, letterSpacing: -0.5 },
    subHeader: { fontSize: 14, color: COLORS.secondaryText, marginTop: 4, fontWeight: '500' },
    searchWrapper: { 
        flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBg, 
        paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, 
        marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.02, elevation: 2
    },
    searchBar: { flex: 1, paddingVertical: 14, marginLeft: 10, color: COLORS.primaryText, fontSize: 15, fontWeight: '600' },
    listContent: { paddingBottom: 100 },
    card: { 
        backgroundColor: COLORS.cardBg, padding: 18, borderRadius: 24, marginBottom: 15, 
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
        borderWidth: 1, borderColor: COLORS.border, elevation: 3, shadowColor: '#475569', shadowOpacity: 0.05
    },
    studentLeft: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 50, height: 50, borderRadius: 16, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    avatarText: { color: COLORS.primary, fontWeight: '900', fontSize: 20 },
    name: { fontSize: 17, fontWeight: '800', color: COLORS.primaryText, marginBottom: 2 },
    metaRow: { flexDirection: 'row', alignItems: 'center' },
    subText: { color: COLORS.secondaryText, fontSize: 12, fontWeight: '600' },
    dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.placeholder, marginHorizontal: 8 },
    feeInfo: { alignItems: 'flex-end', backgroundColor: '#F0F9FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
    feeLabel: { fontSize: 9, color: COLORS.primary, fontWeight: '900', letterSpacing: 0.5 },
    feeValue: { fontSize: 18, fontWeight: '900', color: COLORS.midnight },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, color: COLORS.secondaryText, fontWeight: '600' },
    emptyContainer: { alignItems: 'center', marginTop: 60 },
    emptyText: { color: COLORS.placeholder, marginTop: 10, fontWeight: '600' },

    // Modals
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: COLORS.cardBg, borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 30, alignItems: 'center' },
    modalHandle: { width: 50, height: 5, backgroundColor: COLORS.border, borderRadius: 10, marginBottom: 25 },
    modalHeader: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    modalTitleSmall: { fontSize: 10, fontWeight: '900', color: COLORS.primary, letterSpacing: 1.5 },
    targetStudent: { fontSize: 28, fontWeight: '900', color: COLORS.primaryText },
    targetId: { fontSize: 15, color: COLORS.secondaryText, fontWeight: '600', marginBottom: 30 },
    inputContainer: { width: '100%', alignItems: 'center', marginBottom: 40 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 3, borderColor: COLORS.primary, width: '70%', justifyContent: 'center', paddingBottom: 5 },
    currencySymbol: { fontSize: 32, fontWeight: '900', color: COLORS.primaryText, marginRight: 8 },
    amountInput: { fontSize: 48, fontWeight: '900', color: COLORS.primaryText, textAlign: 'center', minWidth: 100 },
    payBtn: { backgroundColor: COLORS.primary, width: '100%', padding: 20, borderRadius: 20, alignItems: 'center', shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
    btnDisabled: { opacity: 0.6 },
    payBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },

    // Success Popup
    successOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.9)', justifyContent: 'center', alignItems: 'center' },
    successCard: { width: '88%', backgroundColor: COLORS.cardBg, borderRadius: 35, padding: 35, alignItems: 'center' },
    successIconWrapper: { width: 90, height: 90, borderRadius: 30, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center', marginBottom: 25 },
    successTitle: { fontSize: 24, fontWeight: '900', color: COLORS.primaryText, marginBottom: 12 },
    successDesc: { fontSize: 16, color: COLORS.secondaryText, textAlign: 'center', marginBottom: 25, lineHeight: 24 },
    boldText: { fontWeight: '900', color: COLORS.primaryText },
    studentHighlight: { color: COLORS.primary, fontWeight: '800' },
    receiptContainer: { backgroundColor: COLORS.background, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16, marginBottom: 30, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
    receiptLabel: { fontSize: 10, fontWeight: '900', color: COLORS.placeholder, letterSpacing: 1 },
    receiptText: { fontSize: 14, color: COLORS.primaryText, fontWeight: '700', letterSpacing: 1 },
    waPremiumBtn: { flexDirection: 'row', backgroundColor: '#128C7E', width: '100%', padding: 18, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    waPremiumBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', marginLeft: 10 },
    doneBtn: { marginTop: 25 },
    doneBtnText: { color: COLORS.placeholder, fontWeight: '700', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },

    // Custom Alert
    alertOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    alertBox: { width: '100%', backgroundColor: COLORS.cardBg, borderRadius: 24, overflow: 'hidden', elevation: 20 },
    alertBar: { height: 6 },
    alertContent: { padding: 25, alignItems: 'center' },
    alertTitle: { fontSize: 20, fontWeight: '900', color: COLORS.midnight, marginBottom: 10 },
    alertMessage: { fontSize: 15, color: COLORS.secondaryText, textAlign: 'center', marginBottom: 20, lineHeight: 20 },
    alertBtn: { backgroundColor: COLORS.background, paddingVertical: 12, paddingHorizontal: 30, borderRadius: 12 },
    alertBtnText: { color: COLORS.midnight, fontWeight: '800', fontSize: 14 }
});