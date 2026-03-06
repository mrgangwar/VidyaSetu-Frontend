import React, { useState, useCallback } from 'react';
import { 
    View, Text, StyleSheet, FlatList, TouchableOpacity, 
    ActivityIndicator, RefreshControl, SafeAreaView, StatusBar, TextInput, Modal, Vibration
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../api/client';
import { useFocusEffect } from '@react-navigation/native';

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

const StudentFeeStatusScreen = () => {
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('ALL'); // ALL, PAID, PARTIAL, UNPAID
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [detailModalVisible, setDetailModalVisible] = useState(false);

    const fetchStudentsFeeStatus = async () => {
        try {
            const res = await apiClient.get('/fees/all-students-fee-status');
            if (res.data.success) {
                setStudents(res.data.students || []);
                setFilteredStudents(res.data.students || []);
                setSummary(res.data.summary);
            }
        } catch (err) {
            console.log("Fee Status Error:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchStudentsFeeStatus();
        }, [])
    );

    const onRefresh = () => {
        Vibration.vibrate(10);
        setRefreshing(true);
        fetchStudentsFeeStatus();
    };

    const handleSearch = (text) => {
        setSearch(text);
        filterStudents(text, filter);
    };

    const filterStudents = (searchText, filterType) => {
        let filtered = students;
        
        // Apply search filter
        if (searchText) {
            filtered = filtered.filter(s => 
                s.name.toLowerCase().includes(searchText.toLowerCase()) || 
                s.studentLoginId.toLowerCase().includes(searchText.toLowerCase())
            );
        }

        // Apply status filter
        if (filterType !== 'ALL') {
            filtered = filtered.filter(s => s.paymentStatus === filterType);
        }

        setFilteredStudents(filtered);
    };

    const handleFilterChange = (filterType) => {
        setFilter(filterType);
        filterStudents(search, filterType);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'PAID': return COLORS.success;
            case 'PARTIAL': return COLORS.warning;
            case 'UNPAID': return COLORS.error;
            default: return COLORS.slate;
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'PAID': return 'checkmark-circle';
            case 'PARTIAL': return 'alert-circle';
            case 'UNPAID': return 'close-circle';
            default: return 'help-circle';
        }
    };

    const openStudentDetail = (student) => {
        setSelectedStudent(student);
        setDetailModalVisible(true);
    };

    const renderStudentItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.studentCard}
            onPress={() => openStudentDetail(item)}
            activeOpacity={0.7}
        >
            <View style={styles.studentInfo}>
                <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(item.paymentStatus) }]} />
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
                </View>
                <View style={styles.studentDetails}>
                    <Text style={styles.studentName}>{item.name}</Text>
                    <Text style={styles.studentId}>ID: {item.studentLoginId}</Text>
                    <View style={styles.feeInfo}>
                        <Text style={styles.monthlyFee}>₹{item.monthlyFees}/month</Text>
                    </View>
                </View>
            </View>
            <View style={styles.amountInfo}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.paymentStatus) + '20' }]}>
                    <Ionicons name={getStatusIcon(item.paymentStatus)} size={14} color={getStatusColor(item.paymentStatus)} />
                    <Text style={[styles.statusText, { color: getStatusColor(item.paymentStatus) }]}>
                        {item.paymentStatus}
                    </Text>
                </View>
                <View style={styles.amountRow}>
                    <View style={styles.amountItem}>
                        <Text style={styles.amountLabel}>Paid</Text>
                        <Text style={[styles.amountValue, { color: COLORS.success }]}>
                            ₹{item.totalPaid.toLocaleString('en-IN')}
                        </Text>
                    </View>
                    <View style={styles.amountItem}>
                        <Text style={styles.amountLabel}>Due</Text>
                        <Text style={[styles.amountValue, { color: item.totalDue > 0 ? COLORS.error : COLORS.success }]}>
                            ₹{item.totalDue.toLocaleString('en-IN')}
                        </Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loaderText}>Loading student fee status...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
            
            <View style={styles.headerArea}>
                <Text style={styles.headerTitle}>Fee Status</Text>
                <Text style={styles.headerSubtitle}>Track student payment progress</Text>
            </View>

            {/* 📊 SUMMARY CARDS */}
            {summary && (
                <View style={styles.summaryContainer}>
                    <View style={[styles.summaryCard, { backgroundColor: COLORS.success + '15' }]}>
                        <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                        <Text style={styles.summaryValue}>{summary.paidStudents}</Text>
                        <Text style={styles.summaryLabel}>Paid</Text>
                    </View>
                    <View style={[styles.summaryCard, { backgroundColor: COLORS.warning + '15' }]}>
                        <Ionicons name="alert-circle" size={24} color={COLORS.warning} />
                        <Text style={styles.summaryValue}>{summary.partialStudents}</Text>
                        <Text style={styles.summaryLabel}>Partial</Text>
                    </View>
                    <View style={[styles.summaryCard, { backgroundColor: COLORS.error + '15' }]}>
                        <Ionicons name="close-circle" size={24} color={COLORS.error} />
                        <Text style={styles.summaryValue}>{summary.unpaidStudents}</Text>
                        <Text style={styles.summaryLabel}>Unpaid</Text>
                    </View>
                </View>
            )}

            {/* 💰 TOTAL SUMMARY */}
            {summary && (
                <View style={styles.totalSummary}>
                    <View style={styles.totalItem}>
                        <Text style={styles.totalLabel}>Total Collected</Text>
                        <Text style={[styles.totalValue, { color: COLORS.success }]}>
                            ₹{summary.totalCollected.toLocaleString('en-IN')}
                        </Text>
                    </View>
                    <View style={styles.totalDivider} />
                    <View style={styles.totalItem}>
                        <Text style={styles.totalLabel}>Total Pending</Text>
                        <Text style={[styles.totalValue, { color: COLORS.error }]}>
                            ₹{summary.totalPending.toLocaleString('en-IN')}
                        </Text>
                    </View>
                </View>
            )}

            {/* 🔍 SEARCH BAR */}
            <View style={styles.searchContainer}>
                <Ionicons name="search-outline" size={20} color={COLORS.slate} />
                <TextInput 
                    placeholder="Search by name or ID..."
                    style={styles.searchInput}
                    value={search}
                    onChangeText={handleSearch}
                    placeholderTextColor={COLORS.slate}
                />
                {search ? (
                    <TouchableOpacity onPress={() => handleSearch('')}>
                        <Ionicons name="close-circle" size={20} color={COLORS.slate} />
                    </TouchableOpacity>
                ) : null}
            </View>

            {/* FILTER TABS */}
            <View style={styles.filterContainer}>
                {['ALL', 'UNPAID', 'PARTIAL', 'PAID'].map((f) => (
                    <TouchableOpacity 
                        key={f}
                        style={[styles.filterTab, filter === f && styles.filterTabActive]}
                        onPress={() => handleFilterChange(f)}
                    >
                        <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                            {f}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* 📋 STUDENT LIST */}
            <FlatList
                data={filteredStudents}
                keyExtractor={(item) => item._id}
                renderItem={renderStudentItem}
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
                        <Ionicons name="people-outline" size={50} color={COLORS.lightGray} />
                        <Text style={styles.emptyText}>No students found</Text>
                    </View>
                }
            />

            {/* 📱 STUDENT DETAIL MODAL */}
            <Modal visible={detailModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Student Details</Text>
                            <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                                <Ionicons name="close-circle" size={28} color={COLORS.lightGray} />
                            </TouchableOpacity>
                        </View>

                        {selectedStudent && (
                            <>
                                <View style={styles.modalStudentInfo}>
                                    <View style={styles.modalAvatar}>
                                        <Text style={styles.modalAvatarText}>
                                            {selectedStudent.name.charAt(0)}
                                        </Text>
                                    </View>
                                    <Text style={styles.modalStudentName}>{selectedStudent.name}</Text>
                                    <Text style={styles.modalStudentId}>ID: {selectedStudent.studentLoginId}</Text>
                                    <Text style={styles.modalMobile}>📱 {selectedStudent.mobileNumber}</Text>
                                </View>

                                <View style={styles.modalStats}>
                                    <View style={styles.modalStatBox}>
                                        <Text style={styles.modalStatLabel}>Monthly Fee</Text>
                                        <Text style={styles.modalStatValue}>
                                            ₹{selectedStudent.monthlyFees.toLocaleString('en-IN')}
                                        </Text>
                                    </View>
                                    <View style={styles.modalStatBox}>
                                        <Text style={styles.modalStatLabel}>Total Expected</Text>
                                        <Text style={styles.modalStatValue}>
                                            ₹{selectedStudent.totalExpected.toLocaleString('en-IN')}
                                        </Text>
                                    </View>
                                    <View style={styles.modalStatBox}>
                                        <Text style={styles.modalStatLabel}>Total Paid</Text>
                                        <Text style={[styles.modalStatValue, { color: COLORS.success }]}>
                                            ₹{selectedStudent.totalPaid.toLocaleString('en-IN')}
                                        </Text>
                                    </View>
                                    <View style={styles.modalStatBox}>
                                        <Text style={styles.modalStatLabel}>Balance Due</Text>
                                        <Text style={[styles.modalStatValue, { color: COLORS.error }]}>
                                            ₹{selectedStudent.totalDue.toLocaleString('en-IN')}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.modalStatus}>
                                    <View style={[styles.statusBadgeLarge, { backgroundColor: getStatusColor(selectedStudent.paymentStatus) + '20' }]}>
                                        <Ionicons 
                                            name={getStatusIcon(selectedStudent.paymentStatus)} 
                                            size={24} 
                                            color={getStatusColor(selectedStudent.paymentStatus)} 
                                        />
                                        <Text style={[styles.statusTextLarge, { color: getStatusColor(selectedStudent.paymentStatus) }]}>
                                            {selectedStudent.paymentStatus === 'PAID' ? 'All Fees Paid' : 
                                             selectedStudent.paymentStatus === 'PARTIAL' ? 'Partial Payment' : 
                                             'Fees Pending'}
                                        </Text>
                                    </View>
                                </View>

                                {selectedStudent.lastPaymentDate && (
                                    <Text style={styles.lastPayment}>
                                        Last Payment: {new Date(selectedStudent.lastPaymentDate).toLocaleDateString('en-GB', { 
                                            day: '2-digit', month: 'short', year: 'numeric' 
                                        })}
                                    </Text>
                                )}
                            </>
                        )}
                    </View>
                </View>
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

    // Summary Cards
    summaryContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 10 },
    summaryCard: { flex: 1, alignItems: 'center', padding: 15, borderRadius: 16, marginHorizontal: 4 },
    summaryValue: { fontSize: 22, fontWeight: '900', color: COLORS.charcoal, marginTop: 8 },
    summaryLabel: { fontSize: 11, color: COLORS.slate, fontWeight: '600', marginTop: 2 },

    // Total Summary
    totalSummary: { 
        flexDirection: 'row', 
        backgroundColor: COLORS.cardBg, 
        marginHorizontal: 20, 
        marginTop: 15, 
        padding: 16, 
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.lightGray
    },
    totalItem: { flex: 1, alignItems: 'center' },
    totalDivider: { width: 1, backgroundColor: COLORS.lightGray },
    totalLabel: { fontSize: 12, color: COLORS.slate, fontWeight: '600' },
    totalValue: { fontSize: 20, fontWeight: '900', marginTop: 4 },

    // Search
    searchContainer: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: COLORS.cardBg, 
        marginHorizontal: 20, 
        marginTop: 15, 
        paddingHorizontal: 16, 
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.lightGray
    },
    searchInput: { flex: 1, paddingVertical: 12, marginLeft: 10, color: COLORS.charcoal, fontSize: 15 },

    // Filter
    filterContainer: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 15, marginBottom: 10 },
    filterTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.cardBg, marginRight: 8, borderWidth: 1, borderColor: COLORS.lightGray },
    filterTabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    filterText: { fontSize: 12, fontWeight: '700', color: COLORS.slate },
    filterTextActive: { color: '#fff' },

    // List
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
    statusIndicator: { width: 4, height: 50, borderRadius: 2, marginRight: 12 },
    avatar: { width: 50, height: 50, borderRadius: 16, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    avatarText: { color: COLORS.primary, fontWeight: '900', fontSize: 20 },
    studentDetails: { flex: 1 },
    studentName: { fontSize: 16, fontWeight: '800', color: COLORS.charcoal },
    studentId: { fontSize: 12, color: COLORS.slate, marginTop: 2 },
    feeInfo: { marginTop: 4 },
    monthlyFee: { fontSize: 11, color: COLORS.primary, fontWeight: '700' },
    
    amountInfo: { alignItems: 'flex-end' },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginBottom: 8 },
    statusText: { fontSize: 10, fontWeight: '800', marginLeft: 4 },
    amountRow: { flexDirection: 'row' },
    amountItem: { marginLeft: 12, alignItems: 'flex-end' },
    amountLabel: { fontSize: 10, color: COLORS.slate },
    amountValue: { fontSize: 14, fontWeight: '800' },

    emptyState: { alignItems: 'center', marginTop: 60 },
    emptyText: { color: COLORS.slate, marginTop: 10, fontWeight: '600' },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: COLORS.cardBg, borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 30, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    modalTitle: { fontSize: 22, fontWeight: '900', color: COLORS.charcoal },
    
    modalStudentInfo: { alignItems: 'center', marginBottom: 25 },
    modalAvatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    modalAvatarText: { color: '#fff', fontWeight: '900', fontSize: 32 },
    modalStudentName: { fontSize: 24, fontWeight: '900', color: COLORS.charcoal },
    modalStudentId: { fontSize: 14, color: COLORS.slate, marginTop: 4 },
    modalMobile: { fontSize: 14, color: COLORS.slate, marginTop: 8 },

    modalStats: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    modalStatBox: { width: '48%', backgroundColor: COLORS.background, padding: 16, borderRadius: 16, marginBottom: 12, alignItems: 'center' },
    modalStatLabel: { fontSize: 11, color: COLORS.slate, fontWeight: '600' },
    modalStatValue: { fontSize: 18, fontWeight: '900', color: COLORS.charcoal, marginTop: 4 },

    modalStatus: { alignItems: 'center', marginTop: 15 },
    statusBadgeLarge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16 },
    statusTextLarge: { fontSize: 16, fontWeight: '800', marginLeft: 8 },

    lastPayment: { textAlign: 'center', color: COLORS.slate, fontSize: 13, marginTop: 20 }
});

export default StudentFeeStatusScreen;
