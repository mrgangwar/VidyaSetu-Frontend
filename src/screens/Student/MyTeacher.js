import React, { useEffect, useState, useCallback } from 'react';
import { 
    View, Text, FlatList, TouchableOpacity, Image, 
    StyleSheet, ActivityIndicator, RefreshControl, StatusBar, Vibration 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../api/client';

// GLOBAL DESIGN SYSTEM CONSTANTS
const COLORS = {
    background: '#F8FAFC',
    cardBg: '#FFFFFF',
    primary: '#2563EB',      // Royal Blue
    textPrimary: '#1E293B',  // Charcoal Gray
    textSecondary: '#64748B', // Slate Gray
    border: '#E2E8F0',
    lightGray: '#CBD5E1'
};

const MyTeachers = ({ navigation }) => {
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchTeachers = async () => {
        try {
            const res = await apiClient.get('/student/my-teachers');
            if (res.data.success) {
                setTeachers(res.data.teachers);
            }
        } catch (err) { 
            console.log("Fetch Teachers Error:", err); 
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { 
        fetchTeachers(); 
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        Vibration.vibrate(10);
        fetchTeachers();
    }, []);

    const handleTeacherPress = (item) => {
        Vibration.vibrate(20);
        navigation.navigate('TeacherDetails', { teacher: item });
    };

    const renderTeacherCard = ({ item }) => (
        <TouchableOpacity 
            style={styles.card} 
            activeOpacity={0.7}
            onPress={() => handleTeacherPress(item)}
        >
            <View style={styles.avatarWrapper}>
                <Image 
                    source={item.profilePhoto ? { uri: item.profilePhoto } : require('../../assets/default-avatar.png')} 
                    style={styles.avatar}
                    defaultSource={require('../../assets/default-avatar.png')} 
                />
            </View>
            <View style={styles.content}>
                <Text style={styles.teacherName} numberOfLines={1}>{item.name}</Text>
                <View style={styles.subjectRow}>
                    <Ionicons name="book-outline" size={14} color={COLORS.primary} />
                    <Text style={styles.subjectText}>{item.subject || 'Faculty Member'}</Text>
                </View>
            </View>
            <View style={styles.arrowContainer}>
                <Ionicons name="chevron-forward" size={20} color={COLORS.lightGray} />
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading your faculty...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
            
            <View style={styles.headerSection}>
                <Text style={styles.headerTitle}>My Teachers</Text>
                <Text style={styles.headerSubtitle}>{teachers.length} Professionals Assigned</Text>
            </View>

            <FlatList
                data={teachers}
                keyExtractor={(item) => item._id}
                renderItem={renderTeacherCard}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl 
                        refreshing={refreshing} 
                        onRefresh={onRefresh} 
                        tintColor={COLORS.primary}
                        colors={[COLORS.primary]}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="people-outline" size={60} color={COLORS.lightGray} />
                        <Text style={styles.emptyText}>No teachers assigned yet.</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
    loadingText: { marginTop: 12, color: COLORS.textSecondary, fontWeight: '600' },
    
    headerSection: { paddingHorizontal: 20, paddingTop: 20, marginBottom: 15 },
    headerTitle: { fontSize: 28, fontWeight: '900', color: COLORS.textPrimary, letterSpacing: -0.5 },
    headerSubtitle: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600', marginTop: 2 },

    listContainer: { padding: 20, paddingTop: 10 },
    card: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: COLORS.cardBg, 
        padding: 16, 
        borderRadius: 20, 
        marginBottom: 16, 
        borderWidth: 1,
        borderColor: COLORS.border,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10
    },
    avatarWrapper: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: COLORS.background,
        elevation: 2,
        backgroundColor: COLORS.background,
        overflow: 'hidden'
    },
    avatar: { width: '100%', height: '100%' },
    content: { flex: 1, marginLeft: 15 },
    teacherName: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary },
    subjectRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    subjectText: { fontSize: 13, color: COLORS.textSecondary, marginLeft: 5, fontWeight: '600' },
    arrowContainer: { marginLeft: 10 },

    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { marginTop: 10, color: COLORS.textSecondary, fontSize: 16, fontWeight: '600' }
});

export default MyTeachers;