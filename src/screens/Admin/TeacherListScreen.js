import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
    View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, 
    Image, ActivityIndicator, RefreshControl, SafeAreaView, 
    StatusBar, Animated, Vibration, Linking, Dimensions, Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../api/client';

const TeacherListScreen = ({ navigation }) => {
    const [teachers, setTeachers] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    
    const scrollY = useRef(new Animated.Value(0)).current;

    const fetchTeachers = async (query = '') => {
        if (!query && !refreshing) setLoading(true);
        try {
            const res = await apiClient.get(`/admin/teachers?search=${query}`);
            setTeachers(res.data.teachers || []);
        } catch (err) {
            console.error("Fetch Error:", err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchTeachers();
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchTeachers(search);
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [search]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setSearch('');
        fetchTeachers();
    }, []);

    const renderTeacherItem = ({ item, index }) => {
        const baseUrl = Platform.OS === 'web' ? 'http://localhost:5000/' : 'http://10.54.31.32:5000/';
        const profileImage = item.profilePhoto 
            ? { uri: item.profilePhoto.startsWith('http') ? item.profilePhoto : `${baseUrl}${item.profilePhoto.replace(/\\/g, '/')}` }
            : { uri: `https://ui-avatars.com/api/?name=${item.name}&background=4F46E5&color=fff` };

        return (
            <TouchableOpacity 
                style={styles.card}
                onPress={() => navigation.navigate('TeacherDetails', { teacherId: item._id })}
                activeOpacity={0.8}
            >
                <View style={styles.imageContainer}>
                    <Image source={profileImage} style={styles.avatar} />
                    {item.isActive && <View style={styles.activeDot} />}
                </View>

                <View style={styles.info}>
                    <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                    <View style={styles.badgeRow}>
                        <View style={styles.subjectBadge}>
                            <Text style={styles.subjectText}>{item.subject || 'General'}</Text>
                        </View>
                        <Text style={styles.coachingText} numberOfLines={1}>• {item.coachingName || 'VidyaSetu'}</Text>
                    </View>
                    <Text style={styles.emailText}>{item.email}</Text>
                </View>

                <TouchableOpacity 
                    style={styles.actionBtn}
                    onPress={() => {
                        Vibration.vibrate(20);
                        Linking.openURL(`whatsapp://send?phone=${item.contactNumber}`);
                    }}
                >
                    <Ionicons name="logo-whatsapp" size={20} color="#10B981" />
                </TouchableOpacity>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F1F5F9" />
            
            <View style={styles.headerArea}>
                <View style={styles.titleRow}>
                    <Text style={styles.mainTitle}>Faculty Directory</Text>
                    <View style={styles.countChip}>
                        <Text style={styles.countText}>{teachers.length} Active</Text>
                    </View>
                </View>

                <View style={styles.searchBox}>
                    <Ionicons name="search" size={20} color="#94A3B8" style={{ marginLeft: 15 }} />
                    <TextInput 
                        style={styles.searchBar}
                        placeholder="Search name or institution..."
                        placeholderTextColor="#94A3B8"
                        value={search}
                        onChangeText={setSearch}
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={() => setSearch('')}>
                            <Ionicons name="close-circle" size={18} color="#CBD5E1" style={{ marginRight: 15 }} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {loading ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#4F46E5" />
                    <Text style={styles.loadingText}>Synchronizing...</Text>
                </View>
            ) : (
                <FlatList 
                    data={teachers}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.listContent}
                    renderItem={renderTeacherItem}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="people-outline" size={80} color="#CBD5E1" />
                            <Text style={styles.emptyText}>No registered teachers found</Text>
                            <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
                                <Text style={styles.refreshBtnText}>Refresh Directory</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F1F5F9' },
    headerArea: { 
        paddingHorizontal: 25, paddingTop: 15, paddingBottom: 25, 
        backgroundColor: '#F1F5F9'
    },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    mainTitle: { fontSize: 26, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
    countChip: { backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, elevation: 1 },
    countText: { color: '#4F46E5', fontWeight: '800', fontSize: 12 },
    
    searchBox: { 
        flexDirection: 'row', alignItems: 'center', 
        backgroundColor: '#FFFFFF', borderRadius: 18, height: 55,
        borderWidth: 1, borderColor: '#E2E8F0',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2
    },
    searchBar: { flex: 1, paddingHorizontal: 10, fontSize: 16, color: '#0F172A', fontWeight: '600' },
    
    listContent: { paddingHorizontal: 25, paddingBottom: 100 },
    card: { 
        flexDirection: 'row', padding: 18, backgroundColor: '#FFFFFF', 
        borderRadius: 28, alignItems: 'center', marginBottom: 15,
        borderWidth: 1, borderColor: '#E2E8F0',
        shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.04, shadowRadius: 15, elevation: 3 
    },
    imageContainer: { position: 'relative' },
    avatar: { width: 60, height: 60, borderRadius: 20, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#F1F5F9' },
    activeDot: { position: 'absolute', top: -2, right: -2, width: 14, height: 14, borderRadius: 7, backgroundColor: '#10B981', borderWidth: 2, borderColor: '#FFF' },
    
    info: { flex: 1, marginLeft: 15 },
    name: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
    badgeRow: { flexDirection: 'row', alignItems: 'center' },
    subjectBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    subjectText: { fontSize: 11, fontWeight: '800', color: '#4F46E5', textTransform: 'uppercase' },
    coachingText: { fontSize: 12, color: '#64748B', marginLeft: 6, fontWeight: '600', flex: 1 },
    emailText: { fontSize: 12, color: '#94A3B8', marginTop: 4 },
    
    actionBtn: { 
        width: 45, height: 45, borderRadius: 15, 
        backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center' 
    },
    
    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 15, color: '#64748B', fontWeight: '800' },
    emptyState: { alignItems: 'center', marginTop: 60 },
    emptyText: { fontSize: 16, color: '#94A3B8', fontWeight: '700', marginTop: 15 },
    refreshBtn: { 
        marginTop: 25, paddingHorizontal: 30, paddingVertical: 15, 
        backgroundColor: '#4F46E5', borderRadius: 18,
        shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5
    },
    refreshBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15 }
});

export default TeacherListScreen;