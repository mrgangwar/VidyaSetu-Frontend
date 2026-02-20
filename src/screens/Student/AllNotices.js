import React, { useState, useEffect } from 'react';
import { 
    View, Text, StyleSheet, FlatList, TouchableOpacity, 
    ActivityIndicator, StatusBar, Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../api/client';

const { width } = Dimensions.get('window');

const AllNotices = () => {
    const [notices, setNotices] = useState([]);
    const [filteredNotices, setFilteredNotices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('ALL'); // ALL, TEACHER, ADMIN

    const fetchNotices = async () => {
        try {
            const res = await apiClient.get('/student/all-notices');
            if (res.data.success) {
                setNotices(res.data.notices);
                setFilteredNotices(res.data.notices);
            }
        } catch (err) {
            console.log("Notice fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchNotices(); }, []);

    const filterData = (tab) => {
        setActiveTab(tab);
        if (tab === 'ALL') {
            setFilteredNotices(notices);
        } else if (tab === 'TEACHER') {
            setFilteredNotices(notices.filter(n => n.coachingId !== null));
        } else if (tab === 'ADMIN') {
            setFilteredNotices(notices.filter(n => n.coachingId === null));
        }
    };

    const NoticeItem = ({ item }) => (
        <View style={[styles.card, { borderLeftColor: !item.coachingId ? '#E11D48' : '#6366F1' }]}>
            <View style={styles.topRow}>
                <View style={[styles.badge, { backgroundColor: !item.coachingId ? '#FFF1F2' : '#EEF2FF' }]}>
                    <Text style={[styles.badgeText, { color: !item.coachingId ? '#E11D48' : '#4F46E5' }]}>
                        {!item.coachingId ? 'SYSTEM ADMIN' : 'FACULTY'}
                    </Text>
                </View>
                <View style={styles.dateContainer}>
                    <Ionicons name="time-outline" size={14} color="#94A3B8" />
                    <Text style={styles.dateText}>
                        {new Date(item.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </Text>
                </View>
            </View>
            <Text style={styles.titleText}>{item.title}</Text>
            <Text style={styles.descText} numberOfLines={4}>
                {item.description || item.message}
            </Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            
            {/* SEGMENTED TAB SWITCHER */}
            <View style={styles.tabContainer}>
                <View style={styles.tabBar}>
                    {['ALL', 'TEACHER', 'ADMIN'].map((tab) => (
                        <TouchableOpacity 
                            key={tab} 
                            activeOpacity={0.8}
                            onPress={() => filterData(tab)}
                            style={[styles.tabBtn, activeTab === tab && styles.activeTabBtn]}
                        >
                            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                                {tab === 'ADMIN' ? 'OFFICIAL' : tab}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {loading ? (
                <View style={styles.centerLoader}>
                    <ActivityIndicator size="large" color="#6366F1" />
                    <Text style={styles.loaderText}>Syncing notices...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredNotices}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item }) => <NoticeItem item={item} />}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconCircle}>
                                <Ionicons name="notifications-off-outline" size={40} color="#CBD5E1" />
                            </View>
                            <Text style={styles.emptyTitle}>Clear Desk</Text>
                            <Text style={styles.emptySubtitle}>No announcements found in this category.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    
    tabContainer: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    tabBar: { 
        flexDirection: 'row', 
        backgroundColor: '#F1F5F9', 
        padding: 5, 
        borderRadius: 16,
        justifyContent: 'space-between'
    },
    tabBtn: { 
        flex: 1,
        paddingVertical: 10, 
        alignItems: 'center',
        borderRadius: 12 
    },
    activeTabBtn: { 
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2
    },
    tabText: { fontSize: 12, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.5 },
    activeTabText: { color: '#6366F1' },

    listContent: { padding: 20, paddingBottom: 40 },
    card: { 
        backgroundColor: '#FFFFFF', 
        padding: 20, 
        borderRadius: 24, 
        marginBottom: 16, 
        borderLeftWidth: 6, 
        shadowColor: '#000',
        shadowOpacity: 0.03,
        shadowRadius: 15,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F1F5F9'
    },
    topRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 14 
    },
    badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
    badgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
    dateContainer: { flexDirection: 'row', alignItems: 'center' },
    dateText: { fontSize: 11, color: '#94A3B8', fontWeight: '700', marginLeft: 4 },
    titleText: { fontSize: 18, fontWeight: '900', color: '#1E293B', letterSpacing: -0.3 },
    descText: { 
        fontSize: 14, 
        color: '#64748B', 
        marginTop: 8, 
        lineHeight: 22, 
        fontWeight: '500' 
    },

    centerLoader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loaderText: { marginTop: 12, color: '#94A3B8', fontSize: 13, fontWeight: '600' },

    emptyContainer: { 
        alignItems: 'center', 
        marginTop: 100, 
        paddingHorizontal: 40 
    },
    emptyIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20
    },
    emptyTitle: { fontSize: 20, fontWeight: '900', color: '#1E293B' },
    emptySubtitle: { 
        fontSize: 14, 
        color: '#94A3B8', 
        textAlign: 'center', 
        marginTop: 8,
        lineHeight: 20 
    }
});

export default AllNotices;