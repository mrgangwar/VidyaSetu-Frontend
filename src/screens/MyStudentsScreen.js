import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
    View, Text, FlatList, TextInput, Image, 
    StyleSheet, TouchableOpacity, ActivityIndicator, Animated, 
    SafeAreaView, StatusBar, RefreshControl, Vibration, Modal, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../api/client';

// --- GLOBAL DESIGN SYSTEM ---
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

export default function MyStudentsScreen({ navigation }) {
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');

    // Custom Alert State
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'error' });
    const alertPopAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchStudents();
        });
        return unsubscribe;
    }, [navigation]);

    const showAlert = (title, message, type = 'error') => {
        setAlertConfig({ title, message, type });
        setAlertVisible(true);
        Vibration.vibrate(type === 'error' ? [0, 50, 100, 50] : 15);
        Animated.spring(alertPopAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 8 }).start();
    };

    const hideAlert = () => {
        Animated.timing(alertPopAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setAlertVisible(false));
    };

    const fetchStudents = async () => {
        try {
            const res = await apiClient.get('/teacher/my-students');
            if (res.data.success) {
                setStudents(res.data.students);
                setFilteredStudents(res.data.students);
            }
        } catch (error) {
            showAlert("Connection Error", "Unable to retrieve student data. Please check your network.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchStudents();
    }, []);

    const handleSearch = (text) => {
        setSearch(text);
        if (text.trim()) {
            const newData = students.filter(item => {
                const itemData = item.name ? item.name.toUpperCase() : '';
                const textData = text.toUpperCase();
                return itemData.includes(textData);
            });
            setFilteredStudents(newData);
        } else {
            setFilteredStudents(students);
        }
    };

    const StudentCard = ({ item }) => {
        const [imgLoading, setImgLoading] = useState(true);
        const scaleValue = useRef(new Animated.Value(1)).current;

        const handlePress = () => {
            Vibration.vibrate(10);
            navigation.navigate('TeacherStudentProfile', { studentId: item._id });
        };

        return (
            <TouchableOpacity 
                activeOpacity={1}
                onPress={handlePress}
                onPressIn={() => Animated.spring(scaleValue, { toValue: 0.98, useNativeDriver: true }).start()}
                onPressOut={() => Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start()}
            >
                <Animated.View style={[styles.card, { transform: [{ scale: scaleValue }] }]}>
                    <View style={styles.avatarContainer}>
                        <Image
                            source={item.profilePhoto
                                ? { uri: item.profilePhoto.startsWith('http') ? item.profilePhoto : `http://10.54.31.32:5000/${item.profilePhoto.replace(/\\/g, '/').replace(/^\//, '')}` }
                                : { uri: `https://ui-avatars.com/api/?name=${item.name}&background=2563EB&color=fff` }}
                            style={styles.avatar}
                            onLoadEnd={() => setImgLoading(false)}
                        />
                        {imgLoading && (
                            <View style={styles.avatarLoader}>
                                <ActivityIndicator size="small" color={COLORS.accent} />
                            </View>
                        )}
                        <View style={styles.activeIndicator} />
                    </View>

                    <View style={styles.info}>
                        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                        <View style={styles.metaRow}>
                            <Ionicons name="id-card-outline" size={13} color={COLORS.secondaryText} />
                            <Text style={styles.subText}>{item.studentLoginId}</Text>
                            <View style={styles.dotSeparator} />
                            <Ionicons name="time-outline" size={13} color={COLORS.secondaryText} />
                            <Text style={styles.subText}>{item.batchTime}</Text>
                        </View>
                        <View style={styles.phoneRow}>
                            <Ionicons name="call" size={13} color={COLORS.accent} />
                            <Text style={styles.phoneText}>{item.mobileNumber}</Text>
                        </View>
                    </View>

                    <View style={styles.actionColumn}>
                        <View style={styles.chevronCircle}>
                            <Ionicons name="chevron-forward" size={16} color={COLORS.accent} />
                        </View>
                    </View>
                </Animated.View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
            <View style={styles.container}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerLabel}>Student Base</Text>
                        <Text style={styles.title}>Directory</Text>
                    </View>
                    <View style={styles.countBadge}>
                        <Text style={styles.countText}>{filteredStudents.length} Students</Text>
                    </View>
                </View>

                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color={COLORS.secondaryText} />
                    <TextInput 
                        style={styles.searchBar}
                        placeholder="Search by student name..."
                        placeholderTextColor={COLORS.secondaryText}
                        value={search}
                        onChangeText={handleSearch}
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={() => handleSearch('')}>
                            <Ionicons name="close-circle" size={18} color={COLORS.secondaryText} />
                        </TouchableOpacity>
                    )}
                </View>

                {loading ? (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color={COLORS.accent} />
                        <Text style={styles.loaderText}>Fetching Student Records...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredStudents}
                        keyExtractor={(item) => item._id}
                        renderItem={({ item }) => <StudentCard item={item} />}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.accent]} />
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <View style={styles.emptyIconCircle}>
                                    <Ionicons name="people-outline" size={50} color={COLORS.secondaryText} />
                                </View>
                                <Text style={styles.emptyTitle}>No Results Found</Text>
                                <Text style={styles.emptySub}>We couldn't find any students matching "{search}"</Text>
                            </View>
                        }
                        contentContainerStyle={styles.listContent}
                    />
                )}
            </View>

            {/* Custom Alert Modal */}
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
                                <Text style={styles.alertBtnText}>Dismiss</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.background },
    container: { flex: 1, paddingHorizontal: 20 },
    header: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingVertical: 20
    },
    headerLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: COLORS.accent,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 2
    },
    title: { fontSize: 32, fontWeight: '900', color: COLORS.midnight },
    countBadge: { 
        backgroundColor: `${COLORS.accent}15`, 
        paddingHorizontal: 12, 
        paddingVertical: 6, 
        borderRadius: 12,
        borderWidth: 1,
        borderColor: `${COLORS.accent}20`
    },
    countText: { fontSize: 12, color: COLORS.accent, fontWeight: '800' },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.cardBg,
        borderRadius: 18,
        paddingHorizontal: 16,
        marginBottom: 25,
        height: 56,
        borderWidth: 1,
        borderColor: COLORS.border,
        elevation: 2,
        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10
    },
    searchBar: { flex: 1, marginLeft: 10, fontSize: 16, color: COLORS.primaryText, fontWeight: '500' },
    listContent: { paddingBottom: 40 },
    card: { 
        backgroundColor: COLORS.cardBg, 
        borderRadius: 24, 
        padding: 16, 
        flexDirection: 'row', 
        alignItems: 'center', 
        marginBottom: 16, 
        borderWidth: 1,
        borderColor: COLORS.border,
        elevation: 3,
        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15
    },
    avatarContainer: { position: 'relative' },
    avatar: { width: 60, height: 60, borderRadius: 20, backgroundColor: COLORS.background },
    avatarLoader: { position: 'absolute', top: 20, left: 20 },
    activeIndicator: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: COLORS.success,
        borderWidth: 3,
        borderColor: COLORS.cardBg
    },
    info: { flex: 1, marginLeft: 16 },
    name: { fontSize: 17, fontWeight: '800', color: COLORS.primaryText, marginBottom: 4 },
    metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    subText: { fontSize: 12, color: COLORS.secondaryText, marginLeft: 5, fontWeight: '600' },
    dotSeparator: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: COLORS.border, marginHorizontal: 8 },
    phoneRow: { flexDirection: 'row', alignItems: 'center' },
    phoneText: { fontSize: 13, color: COLORS.accent, marginLeft: 6, fontWeight: '700' },
    actionColumn: { marginLeft: 10 },
    chevronCircle: {
        width: 32, height: 32, borderRadius: 12,
        backgroundColor: `${COLORS.accent}10`,
        justifyContent: 'center', alignItems: 'center'
    },
    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loaderText: { marginTop: 15, color: COLORS.secondaryText, fontSize: 14, fontWeight: '600' },
    emptyContainer: { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
    emptyIconCircle: {
        width: 100, height: 100, borderRadius: 50,
        backgroundColor: `${COLORS.secondaryText}10`,
        justifyContent: 'center', alignItems: 'center', marginBottom: 20
    },
    emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.primaryText },
    emptySub: { fontSize: 14, color: COLORS.secondaryText, textAlign: 'center', marginTop: 8, lineHeight: 20 },

    // Alert Dialog Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    alertBox: { width: '90%', backgroundColor: '#FFF', borderRadius: 25, overflow: 'hidden', elevation: 20 },
    alertHeader: { height: 6 },
    alertBody: { padding: 30, alignItems: 'center' },
    alertTitle: { fontSize: 20, fontWeight: '800', color: COLORS.midnight, marginTop: 15 },
    alertMessage: { fontSize: 14, color: COLORS.secondaryText, textAlign: 'center', marginTop: 10, lineHeight: 20 },
    alertBtn: { marginTop: 25, backgroundColor: COLORS.accent, paddingHorizontal: 40, paddingVertical: 12, borderRadius: 15 },
    alertBtnText: { color: '#FFF', fontWeight: '700' }
});