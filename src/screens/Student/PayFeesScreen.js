import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
    ActivityIndicator, RefreshControl, Dimensions, SafeAreaView, StatusBar,
    Alert, Modal, Vibration, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../api/client';
import { useFocusEffect } from '@react-navigation/native';
import RazorpayCheckout from 'razorpay-checkout';

const { width } = Dimensions.get('window');

// Global Design System Colors
const COLORS = {
    background: '#F8FAFC',
    cardBg: '#FFFFFF',
    primary: '#2563EB', // Royal Blue
    charcoal: '#1E293B',
    slate: '#64748B',
    lightGray: '#E2E8F0',
    success: '#10B981',
    error: '#DC2626',
    warning: '#F59E0B'
};

const PayFeesScreen = () => {
    const [feeDetails, setFeeDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [paymentModalVisible, setPaymentModalVisible] = useState(false);
    const [amount, setAmount] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [razorpayKey, setRazorpayKey] = useState('');
    const [successModalVisible, setSuccessModalVisible] = useState(false);
    const [paymentReceipt, setPaymentReceipt] = useState(null);

    const fetchFeeDetails = async () => {
        try {
            const res = await apiClient.get('/fees/student-fee-details');
            if (res.data.success) {
                setFeeDetails(res.data.data);
                setRazorpayKey(res.data.data.razorpayKeyId || '');
            }
        } catch (err) {
            console.log("Fee Details Error:", err);
            Alert.alert("Error", "Failed to load fee details");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchFeeDetails();
        }, [])
    );

    const onRefresh = () => {
        Vibration.vibrate(10);
        setRefreshing(true);
        fetchFeeDetails();
    };

    // Create Razorpay order and initiate payment
    const initiatePayment = async () => {
        const paymentAmount = parseFloat(amount);
        
        if (!paymentAmount || paymentAmount <= 0) {
            Alert.alert("Invalid Amount", "Please enter a valid amount");
            return;
        }

        if (paymentAmount > (feeDetails?.feeDetails?.totalDue || 0) + 1000) {
            Alert.alert("Amount Exceeded", "Amount exceeds your remaining balance");
            return;
        }

        setIsProcessing(true);
        setPaymentModalVisible(false);

        try {
            // Step 1: Create order on backend
            const orderRes = await apiClient.post('/fees/create-payment-order', {
                amount: paymentAmount
            });

            if (!orderRes.data.success) {
                Alert.alert("Error", orderRes.data.message || "Failed to create payment order");
                setIsProcessing(false);
                return;
            }

            const orderData = orderRes.data.data;

            // Step 2: Open Razorpay checkout
            const razorpayOptions = {
                description: 'Tuition Fee Payment',
                currency: 'INR',
                key: razorpayKey || orderData.keyId,
                amount: orderData.amount,
                name: 'VidyaSetu',
                order_id: orderData.orderId,
                prefill: {
                    email: feeDetails.student?.email || '',
                    contact: feeDetails.student?.mobileNumber || '',
                    name: feeDetails.student?.name || ''
                },
                theme: {
                    color: COLORS.primary
                }
            };

            RazorpayCheckout.open(razorpayOptions).then(async (data) => {
                // Payment successful - verify with backend
                try {
                    const verifyRes = await apiClient.post('/fees/verify-payment', {
                        razorpayPaymentId: data.razorpay_payment_id,
                        razorpayOrderId: data.razorpay_order_id,
                        razorpaySignature: data.razorpay_signature,
                        amount: paymentAmount
                    });

                    if (verifyRes.data.success) {
                        setPaymentReceipt(verifyRes.data.data);
                        setSuccessModalVisible(true);
                        fetchFeeDetails(); // Refresh data
                    }
                } catch (verifyErr) {
                    Alert.alert("Verification Failed", "Payment was made but verification failed. Contact support.");
                }
            }).catch((error) => {
                console.log("Razorpay Error:", error);
                if (error.code !== 'USER_CANCELLED') {
                    Alert.alert("Payment Failed", error.description || "Something went wrong with the payment");
                }
            }).finally(() => {
                setIsProcessing(false);
            });

        } catch (err) {
            console.log("Payment Initiation Error:", err);
            Alert.alert("Error", "Failed to initiate payment");
            setIsProcessing(false);
        }
    };

    const openPaymentModal = () => {
        const dueAmount = feeDetails?.feeDetails?.totalDue || 0;
        if (dueAmount <= 0) {
            Alert.alert("No Dues", "You have no pending fees!");
            return;
        }
        setAmount(dueAmount.toString());
        setPaymentModalVisible(true);
    };

    const renderHistoryItem = ({ item }) => (
        <View style={styles.historyCard}>
            <View style={styles.historyLeft}>
                <View style={[styles.iconCircle, { backgroundColor: item.paymentMethod === 'RAZORPAY' ? '#F0FDF4' : '#FEF3C7' }]}>
                    <Ionicons 
                        name={item.paymentMethod === 'RAZORPAY' ? 'card' : 'cash'} 
                        size={20} 
                        color={item.paymentMethod === 'RAZORPAY' ? COLORS.success : COLORS.warning} 
                    />
                </View>
                <View>
                    <Text style={styles.historyMethod}>
                        {item.paymentMethod === 'RAZORPAY' ? 'Online Payment' : item.paymentMethod === 'CASH' ? 'Cash Payment' : 'Other'}
                    </Text>
                    <Text style={styles.historyDate}>
                        {new Date(item.paymentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </Text>
                </View>
            </View>
            <View style={styles.historyRight}>
                <Text style={styles.historyAmount}>₹{item.amountPaid.toLocaleString('en-IN')}</Text>
                <Text style={styles.historyReceipt}>REF: {item.receiptNo}</Text>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loaderText}>Loading payment details...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
            
            <View style={styles.headerArea}>
                <Text style={styles.headerTitle}>Pay Fees Online</Text>
                <Text style={styles.headerSubtitle}>Secure payment via Razorpay</Text>
            </View>

            {/* 💳 MAIN DASHBOARD CARD */}
            <View style={styles.mainCard}>
                <View style={styles.cardHeader}>
                    <View>
                        <Text style={styles.cardTitle}>Fee Summary</Text>
                        <Text style={styles.cardSub}>Academic Session 2025-26</Text>
                    </View>
                    <View style={styles.headerIconBg}>
                        <Ionicons name="shield-checkmark" size={24} color="#fff" />
                    </View>
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Total Paid</Text>
                        <Text style={[styles.statValue, { color: COLORS.success }]}>
                            ₹{(feeDetails?.feeDetails?.totalPaid || 0).toLocaleString('en-IN')}
                        </Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Balance Due</Text>
                        <Text style={[styles.statValue, { color: COLORS.error }]}>
                            ₹{(feeDetails?.feeDetails?.totalDue || 0).toLocaleString('en-IN')}
                        </Text>
                    </View>
                </View>

                <View style={styles.monthlyInfo}>
                    <View style={styles.monthlyRow}>
                        <Text style={styles.monthlyLabel}>Monthly Fee</Text>
                        <Text style={styles.monthlyValue}>₹{(feeDetails?.feeDetails?.monthlyFee || 0).toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.monthlyRow}>
                        <Text style={styles.monthlyLabel}>Days Active</Text>
                        <Text style={styles.monthlyValue}>{feeDetails?.feeDetails?.daysActive || 0} days</Text>
                    </View>
                </View>

                {/* 🟢 PAY NOW BUTTON */}
                <TouchableOpacity 
                    style={[styles.payButton, (feeDetails?.feeDetails?.totalDue || 0) <= 0 && styles.payButtonDisabled]}
                    onPress={openPaymentModal}
                    disabled={(feeDetails?.feeDetails?.totalDue || 0) <= 0}
                >
                    <Ionicons name="card-outline" size={22} color="#fff" />
                    <Text style={styles.payButtonText}>Pay Fees Now</Text>
                </TouchableOpacity>

                <Text style={styles.secureText}>
                    <Ionicons name="lock-closed" size={12} color={COLORS.slate} /> 
                    Secured by Razorpay
                </Text>
            </View>

            {/* 📜 PAYMENT HISTORY */}
            <View style={styles.historyHeader}>
                <Text style={styles.sectionTitle}>Payment History</Text>
                <Text style={styles.historyCount}>{feeDetails?.history?.length || 0} transactions</Text>
            </View>

            <FlatList
                data={feeDetails?.history || []}
                keyExtractor={(item) => item._id}
                renderItem={renderHistoryItem}
                refreshControl={
                    <RefreshControl 
                        refreshing={refreshing} 
                        onRefresh={onRefresh} 
                        tintColor={COLORS.primary}
                        colors={[COLORS.primary]}
                    />
                }
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="receipt-outline" size={48} color={COLORS.lightGray} />
                        <Text style={styles.emptyTitle}>No Payments Yet</Text>
                        <Text style={styles.emptyText}>Your payment history will appear here</Text>
                    </View>
                }
            />

            {/* 💰 PAYMENT MODAL */}
            <Modal visible={paymentModalVisible} transparent animationType="slide">
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHandle} />
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitleSmall}>ONLINE PAYMENT</Text>
                            <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
                                <Ionicons name="close-circle" size={28} color={COLORS.lightGray} />
                            </TouchableOpacity>
                        </View>
                        
                        <Text style={styles.modalSubtitle}>Enter amount to pay</Text>
                        
                        <View style={styles.inputContainer}>
                            <Text style={styles.currencySymbol}>₹</Text>
                            <TextInput 
                                placeholder="0"
                                keyboardType="numeric"
                                style={styles.amountInput}
                                value={amount}
                                onChangeText={setAmount}
                                placeholderTextColor={COLORS.lightGray}
                            />
                        </View>

                        <View style={styles.quickAmounts}>
                            {[1000, 2000, 5000, 10000].map((amt) => (
                                <TouchableOpacity 
                                    key={amt}
                                    style={[styles.quickAmountBtn, parseInt(amount) === amt && styles.quickAmountBtnActive]}
                                    onPress={() => setAmount(amt.toString())}
                                >
                                    <Text style={[styles.quickAmountText, parseInt(amount) === amt && styles.quickAmountTextActive]}>
                                        ₹{amt}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity 
                            style={styles.proceedButton}
                            onPress={initiatePayment}
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="lock-closed" size={18} color="#fff" />
                                    <Text style={styles.proceedButtonText}>Proceed to Pay</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* ✅ SUCCESS MODAL */}
            <Modal visible={successModalVisible} transparent animationType="fade">
                <View style={styles.successOverlay}>
                    <View style={styles.successCard}>
                        <View style={styles.successIconWrapper}>
                            <Ionicons name="checkmark-done" size={50} color={COLORS.success} />
                        </View>
                        
                        <Text style={styles.successTitle}>Payment Successful!</Text>
                        <Text style={styles.successDesc}>
                            Your payment of <Text style={styles.boldText}>₹{paymentReceipt?.amountPaid}</Text> has been processed
                        </Text>

                        <View style={styles.receiptContainer}>
                            <Text style={styles.receiptLabel}>RECEIPT NUMBER</Text>
                            <Text style={styles.receiptText}>{paymentReceipt?.receiptNumber}</Text>
                        </View>
                        
                        <View style={styles.balanceContainer}>
                            <Text style={styles.balanceLabel}>Remaining Balance</Text>
                            <Text style={styles.balanceValue}>₹{paymentReceipt?.balanceRemaining || 0}</Text>
                        </View>
                        
                        <TouchableOpacity 
                            style={styles.doneButton} 
                            onPress={() => setSuccessModalVisible(false)}
                        >
                            <Text style={styles.doneButtonText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Loading Overlay */}
            {isProcessing && (
                <View style={styles.processingOverlay}>
                    <View style={styles.processingCard}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                        <Text style={styles.processingText}>Processing Payment...</Text>
                        <Text style={styles.processingSubtext}>Please wait while we verify your payment</Text>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
    loaderText: { marginTop: 14, color: COLORS.slate, fontSize: 13, fontWeight: '600', letterSpacing: 0.5 },
    
    headerArea: { paddingHorizontal: 24, paddingTop: 15, paddingBottom: 10 },
    headerTitle: { fontSize: 28, fontWeight: '900', color: COLORS.charcoal, letterSpacing: -0.8 },
    headerSubtitle: { fontSize: 14, color: COLORS.slate, marginTop: 4, fontWeight: '500' },

    // Main Card
    mainCard: { 
        backgroundColor: COLORS.primary, 
        margin: 20, 
        borderRadius: 30, 
        padding: 24, 
        elevation: 10,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 15
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
    cardTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
    cardSub: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginTop: 2 },
    headerIconBg: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 15 },
    
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    statBox: { flex: 1 },
    statLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
    statValue: { color: '#FFFFFF', fontSize: 24, fontWeight: '900', marginTop: 4 },
    statDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: 15 },

    monthlyInfo: { marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)' },
    monthlyRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    monthlyLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' },
    monthlyValue: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },

    payButton: { 
        backgroundColor: COLORS.success, 
        flexDirection: 'row', 
        justifyContent: 'center', 
        alignItems: 'center',
        padding: 18, 
        borderRadius: 20, 
        marginTop: 25,
        elevation: 5,
        shadowColor: COLORS.success,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8
    },
    payButtonDisabled: { backgroundColor: COLORS.slate, opacity: 0.6 },
    payButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', marginLeft: 10 },
    secureText: { textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 15, fontWeight: '600' },

    // History Section
    historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 15, marginTop: 5 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.charcoal, letterSpacing: -0.5 },
    historyCount: { fontSize: 13, color: COLORS.slate, fontWeight: '600' },

    listContent: { paddingHorizontal: 20, paddingBottom: 40 },
    historyCard: { 
        backgroundColor: COLORS.cardBg, 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        padding: 16, 
        borderRadius: 20, 
        marginBottom: 12, 
        alignItems: 'center', 
        borderWidth: 1,
        borderColor: COLORS.lightGray,
        shadowColor: '#000',
        shadowOpacity: 0.02,
        shadowRadius: 8,
        elevation: 2
    },
    historyLeft: { flexDirection: 'row', alignItems: 'center' },
    iconCircle: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    historyMethod: { fontSize: 15, fontWeight: '700', color: COLORS.charcoal },
    historyDate: { fontSize: 12, color: COLORS.slate, marginTop: 2, fontWeight: '500' },
    historyRight: { alignItems: 'flex-end' },
    historyAmount: { fontSize: 17, fontWeight: '800', color: COLORS.success },
    historyReceipt: { fontSize: 9, color: COLORS.slate, fontWeight: '700', letterSpacing: 0.5, marginTop: 4 },

    emptyState: { alignItems: 'center', marginTop: 60, paddingHorizontal: 50 },
    emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.charcoal, marginTop: 15 },
    emptyText: { color: COLORS.slate, marginTop: 8, fontSize: 13, textAlign: 'center' },

    // Payment Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: COLORS.cardBg, borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 30, alignItems: 'center' },
    modalHandle: { width: 50, height: 5, backgroundColor: COLORS.lightGray, borderRadius: 10, marginBottom: 25 },
    modalHeader: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    modalTitleSmall: { fontSize: 10, fontWeight: '900', color: COLORS.primary, letterSpacing: 1.5 },
    modalSubtitle: { fontSize: 16, color: COLORS.slate, fontWeight: '600', marginBottom: 25 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
    currencySymbol: { fontSize: 32, fontWeight: '900', color: COLORS.charcoal, marginRight: 8 },
    amountInput: { fontSize: 48, fontWeight: '900', color: COLORS.charcoal, textAlign: 'center', minWidth: 100 },

    quickAmounts: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 30 },
    quickAmountBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.lightGray },
    quickAmountBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    quickAmountText: { fontSize: 14, fontWeight: '700', color: COLORS.charcoal },
    quickAmountTextActive: { color: '#fff' },

    proceedButton: { backgroundColor: COLORS.primary, width: '100%', padding: 18, borderRadius: 20, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
    proceedButtonText: { color: '#fff', fontSize: 16, fontWeight: '800', marginLeft: 8 },

    // Success Modal
    successOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.9)', justifyContent: 'center', alignItems: 'center' },
    successCard: { width: '88%', backgroundColor: COLORS.cardBg, borderRadius: 35, padding: 35, alignItems: 'center' },
    successIconWrapper: { width: 90, height: 90, borderRadius: 30, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center', marginBottom: 25 },
    successTitle: { fontSize: 24, fontWeight: '900', color: COLORS.charcoal, marginBottom: 12 },
    successDesc: { fontSize: 15, color: COLORS.slate, textAlign: 'center', marginBottom: 20, lineHeight: 22 },
    boldText: { fontWeight: '900', color: COLORS.success },
    receiptContainer: { backgroundColor: COLORS.background, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16, marginBottom: 15, alignItems: 'center', borderWidth: 1, borderColor: COLORS.lightGray },
    receiptLabel: { fontSize: 10, fontWeight: '900', color: COLORS.slate, letterSpacing: 1 },
    receiptText: { fontSize: 16, color: COLORS.charcoal, fontWeight: '700', letterSpacing: 1, marginTop: 4 },
    balanceContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingHorizontal: 10, marginBottom: 25 },
    balanceLabel: { fontSize: 14, color: COLORS.slate, fontWeight: '600' },
    balanceValue: { fontSize: 18, fontWeight: '900', color: COLORS.error },
    doneButton: { backgroundColor: COLORS.primary, width: '100%', padding: 16, borderRadius: 16, alignItems: 'center' },
    doneButtonText: { color: '#fff', fontSize: 16, fontWeight: '800' },

    // Processing Overlay
    processingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 999 },
    processingCard: { backgroundColor: COLORS.cardBg, padding: 40, borderRadius: 24, alignItems: 'center' },
    processingText: { marginTop: 20, fontSize: 18, fontWeight: '800', color: COLORS.charcoal },
    processingSubtext: { marginTop: 8, fontSize: 13, color: COLORS.slate, fontWeight: '500' }
});

export default PayFeesScreen;
