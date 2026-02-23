import React, { useState, useCallback } from 'react';
import { 
    View, Text, FlatList, StyleSheet, TouchableOpacity, 
    ActivityIndicator, Alert, RefreshControl, SafeAreaView, Vibration
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy'; 
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../api/client';
import { useFocusEffect } from '@react-navigation/native';

// Get API base URL from environment variable
const SERVER_URL = process.env.EXPO_PUBLIC_API_URL ? process.env.EXPO_PUBLIC_API_URL.replace('/api', '') : 'https://vidyasetu-backend-n7ob.onrender.com';

// Standardized Design Palette
const COLORS = {
    background: '#F8FAFC',
    cardBg: '#FFFFFF',
    primary: '#2563EB', // Royal Blue
    textPrimary: '#1E293B', // Charcoal Gray
    textSecondary: '#64748B', // Slate Gray
    border: '#E2E8F0',
    success: '#10B981',
    info: '#3B82F6'
};

export default function MyHomework() {
    const [homeworks, setHomeworks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [downloading, setDownloading] = useState(null); 

    const fetchHomework = async () => {
        try {
            const res = await apiClient.get('/student/my-homework');
            if (res.data.success) {
                setHomeworks(res.data.homeworks);
            }
        } catch (e) {
            console.log("Homework Error:", e);
            Vibration.vibrate(100);
            Alert.alert("Network Error", "Homework records load nahi ho paaye. Please try again.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchHomework();
        }, [])
    );

    const onRefresh = () => {
        Vibration.vibrate(10); // Subtle touch feedback
        setRefreshing(true);
        fetchHomework();
    };

    const downloadAndOpen = async (fileUrl, fileName) => {
        Vibration.vibrate(10);
        setDownloading(fileName);
        
        const safeFileName = fileName.replace(/\s/g, '_');
        const fileUri = FileSystem.cacheDirectory + safeFileName; 

        try {
            const baseUrl = SERVER_URL.endsWith('/') ? SERVER_URL.slice(0, -1) : SERVER_URL;
            const cleanFileUrl = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
            const fullDownloadUrl = `${baseUrl}${cleanFileUrl}`;

            const info = await FileSystem.getInfoAsync(fileUri);
            
            if (info.exists) {
                await Sharing.shareAsync(fileUri);
            } else {
                const downloadRes = await FileSystem.downloadAsync(fullDownloadUrl, fileUri);
                if (downloadRes.status !== 200) throw new Error(`Status: ${downloadRes.status}`);
                await Sharing.shareAsync(downloadRes.uri);
            }
        } catch (error) {
            Vibration.vibrate([0, 50, 100, 50]);
            Alert.alert("Download Failed", "File open nahi ho saki. Please check internet connection.");
        } finally {
            setDownloading(null);
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            {/* Header Row */}
            <View style={styles.topRow}>
                <View style={styles.subjectBadge}>
                    <Text style={styles.subjectText}>{item.subject || 'General'}</Text>
                </View>
                <View style={styles.dateContainer}>
                    <Ionicons name="calendar-clear-outline" size={14} color={COLORS.textSecondary} />
                    <Text style={styles.dateText}>
                        {new Date(item.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </Text>
                </View>
            </View>

            <Text style={styles.title}>{item.title}</Text>
            
            <View style={styles.instructionBox}>
                <Ionicons name="information-circle" size={18} color={COLORS.primary} />
                <Text style={styles.desc} numberOfLines={3}>
                    {item.description || "Teacher ne koi extra instructions nahi diye hain."}
                </Text>
            </View>
            
            {item.attachments && item.attachments.map((file, index) => {
                const extension = file.fileType === 'pdf' ? 'pdf' : 'jpg';
                const displayFileName = `HW_${item._id.slice(-4)}_${index}.${extension}`;
                const isPdf = file.fileType === 'pdf';

                return (
                    <TouchableOpacity 
                        key={index} 
                        activeOpacity={0.7}
                        style={[styles.downloadBtn, { borderColor: isPdf ? COLORS.primary : COLORS.success }]} 
                        onPress={() => downloadAndOpen(file.fileUrl, displayFileName)}
                        disabled={downloading !== null}
                    >
                        {downloading === displayFileName ? (
                            <ActivityIndicator size="small" color={COLORS.primary} />
                        ) : (
                            <View style={styles.btnContent}>
                                <View style={[styles.iconCircle, { backgroundColor: isPdf ? COLORS.primary : COLORS.success }]}>
                                    <Ionicons name={isPdf ? "document-text" : "image"} size={16} color="#fff" />
                                </View>
                                <Text style={[styles.btnText, { color: isPdf ? COLORS.primary : COLORS.success }]}>
                                    View {isPdf ? 'Assignment PDF' : 'Attached Image'}
                                </Text>
                                <Ionicons name="chevron-forward" size={16} color={isPdf ? COLORS.primary : COLORS.success} style={{marginLeft: 'auto'}} />
                            </View>
                        )}
                    </TouchableOpacity>
                );
            })}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerArea}>
                <Text style={styles.mainHeading}>Curriculum</Text>
                <Text style={styles.subHeading}>Daily homework and study materials</Text>
            </View>

            {loading ? (
                <View style={styles.centerLoader}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loaderText}>Syncing assignments...</Text>
                </View>
            ) : (
                <FlatList 
                    data={homeworks} 
                    renderItem={renderItem} 
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.listPadding}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl 
                            refreshing={refreshing} 
                            onRefresh={onRefresh} 
                            colors={[COLORS.primary]} 
                            tintColor={COLORS.primary}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="sparkles-outline" size={80} color={COLORS.border} />
                            <Text style={styles.emptyTitle}>All Caught Up!</Text>
                            <Text style={styles.emptyDesc}>No pending homework found. Take some rest! 🎉</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    headerArea: { 
        paddingHorizontal: 24, 
        paddingVertical: 20, 
        backgroundColor: '#fff', 
        borderBottomWidth: 1, 
        borderBottomColor: COLORS.border 
    },
    mainHeading: { fontSize: 28, fontWeight: '900', color: COLORS.textPrimary, letterSpacing: -0.5 },
    subHeading: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2, fontWeight: '500' },
    
    listPadding: { padding: 20, paddingBottom: 40 },
    card: { 
        backgroundColor: COLORS.cardBg, 
        padding: 20, 
        borderRadius: 24, 
        marginBottom: 20, 
        borderWidth: 1,
        borderColor: COLORS.border,
        elevation: 3, 
        shadowColor: '#000', 
        shadowOpacity: 0.05, 
        shadowRadius: 15 
    },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    subjectBadge: { backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    subjectText: { fontSize: 11, fontWeight: '800', color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
    dateContainer: { flexDirection: 'row', alignItems: 'center' },
    dateText: { fontSize: 12, color: COLORS.textSecondary, marginLeft: 5, fontWeight: '600' },
    
    title: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 12 },
    instructionBox: { 
        flexDirection: 'row', 
        backgroundColor: '#F8FAFC', 
        padding: 12, 
        borderRadius: 16, 
        marginBottom: 15,
        borderWidth: 1,
        borderColor: COLORS.border
    },
    desc: { fontSize: 13, color: '#475569', marginLeft: 10, lineHeight: 20, flex: 1, fontWeight: '500' },
    
    downloadBtn: { 
        padding: 14, 
        borderRadius: 16, 
        marginTop: 10, 
        borderWidth: 1.5,
        backgroundColor: '#fff'
    },
    btnContent: { flexDirection: 'row', alignItems: 'center' },
    iconCircle: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    btnText: { fontWeight: '700', fontSize: 14 },
    
    centerLoader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loaderText: { marginTop: 12, color: COLORS.textSecondary, fontWeight: '600' },
    
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyTitle: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, marginTop: 15 },
    emptyDesc: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', marginTop: 8, paddingHorizontal: 40, lineHeight: 22 }
});