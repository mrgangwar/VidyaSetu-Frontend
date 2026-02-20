import React, { useEffect, useState, useCallback } from 'react';
import { 
    View, Text, StyleSheet, Dimensions, ScrollView, 
    ActivityIndicator, RefreshControl, SafeAreaView, StatusBar 
} from 'react-native';
import { PieChart } from "react-native-chart-kit";
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../api/client';

const screenWidth = Dimensions.get("window").width;

const FeesDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({ totalCollected: 0, totalPending: 0 });

    const fetchStats = async () => {
        try {
            const res = await apiClient.get('/teacher/fee-stats');
            if (res.data.success) {
                setStats(res.data.stats);
            }
        } catch (err) {
            console.error("Dashboard Fetch Error:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchStats();
    }, []);

    const chartData = [
        {
            name: "Collected",
            amount: stats?.totalCollected || 0,
            color: "#10B981",
            legendFontColor: "#64748B",
            legendFontSize: 13
        },
        {
            name: "Pending",
            amount: stats?.totalPending || 0,
            color: "#EF4444",
            legendFontColor: "#64748B",
            legendFontSize: 13
        }
    ];

    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#6366F1" />
                <Text style={styles.loaderText}>Syncing financial data</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" />
            <ScrollView 
                style={styles.container}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl 
                        refreshing={refreshing} 
                        onRefresh={onRefresh} 
                        tintColor="#6366F1"
                    />
                }
            >
                <View style={styles.header}>
                    <Text style={styles.headerSubtitle}>Analytics</Text>
                    <Text style={styles.title}>Finance Overview</Text>
                </View>
                
                <View style={styles.chartCard}>
                    <View style={styles.chartHeader}>
                        <Ionicons name="pie-chart-outline" size={20} color="#6366F1" />
                        <Text style={styles.chartTitle}>Revenue Distribution</Text>
                    </View>
                    
                    {stats?.totalCollected === 0 && stats?.totalPending === 0 ? (
                        <View style={styles.emptyChartContainer}>
                            <Ionicons name="stats-chart-outline" size={40} color="#E2E8F0" />
                            <Text style={styles.noDataText}>No financial records available</Text>
                        </View>
                    ) : (
                        <PieChart
                            data={chartData}
                            width={screenWidth - 70}
                            height={200}
                            chartConfig={{
                                color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
                            }}
                            accessor={"amount"}
                            backgroundColor={"transparent"}
                            paddingLeft={"15"}
                            absolute
                        />
                    )}
                </View>

                <View style={styles.statsRow}>
                    <View style={[styles.statBox, styles.collectedBorder]}>
                        <View style={styles.statHeader}>
                            <Text style={styles.statLabel}>Collected</Text>
                            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                        </View>
                        <Text style={styles.collectedValue}>
                            ₹{stats?.totalCollected?.toLocaleString('en-IN')}
                        </Text>
                    </View>
                    
                    <View style={[styles.statBox, styles.pendingBorder]}>
                        <View style={styles.statHeader}>
                            <Text style={styles.statLabel}>Pending</Text>
                            <Ionicons name="alert-circle" size={16} color="#EF4444" />
                        </View>
                        <Text style={styles.pendingValue}>
                            ₹{stats?.totalPending?.toLocaleString('en-IN')}
                        </Text>
                    </View>
                </View>

                <View style={styles.tipBox}>
                    <View style={styles.tipIconContainer}>
                        <Ionicons name="information-circle" size={20} color="#3B82F6" />
                    </View>
                    <Text style={styles.tipText}>
                        Calculations are based on individual student enrollment dates and monthly billing cycles.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { 
        flex: 1, 
        backgroundColor: '#FFFFFF' 
    },
    container: { 
        flex: 1, 
        backgroundColor: '#F8FAFC', 
        paddingHorizontal: 20 
    },
    loaderContainer: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#F8FAFC' 
    },
    loaderText: { 
        marginTop: 12, 
        color: '#64748B', 
        fontWeight: '600' 
    },
    header: {
        marginTop: 20,
        marginBottom: 25
    },
    headerSubtitle: {
        fontSize: 12,
        fontWeight: '800',
        color: '#6366F1',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 4
    },
    title: { 
        fontSize: 28, 
        fontWeight: '900', 
        color: '#1E293B' 
    },
    chartCard: { 
        backgroundColor: '#FFFFFF', 
        borderRadius: 24, 
        padding: 20, 
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 0.05, 
        shadowRadius: 12,
        elevation: 3 
    },
    chartHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10
    },
    chartTitle: { 
        fontSize: 15, 
        fontWeight: '700', 
        color: '#475569', 
        marginLeft: 8
    },
    emptyChartContainer: {
        height: 200,
        justifyContent: 'center',
        alignItems: 'center'
    },
    statsRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        marginTop: 25 
    },
    statBox: { 
        backgroundColor: '#FFFFFF', 
        width: '48%', 
        padding: 18, 
        borderRadius: 20, 
        borderLeftWidth: 5, 
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000', 
        shadowOpacity: 0.04,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2 
    },
    statHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    collectedBorder: { borderLeftColor: '#10B981' },
    pendingBorder: { borderLeftColor: '#EF4444' },
    statLabel: { 
        fontSize: 12, 
        color: '#64748B', 
        fontWeight: '800', 
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    collectedValue: { 
        fontSize: 19, 
        fontWeight: '900', 
        marginTop: 10,
        color: '#059669' 
    },
    pendingValue: { 
        fontSize: 19, 
        fontWeight: '900', 
        marginTop: 10,
        color: '#DC2626' 
    },
    noDataText: { 
        marginTop: 10,
        color: '#94A3B8', 
        fontSize: 14,
        fontWeight: '500'
    },
    tipBox: { 
        marginTop: 30, 
        padding: 18, 
        backgroundColor: '#EFF6FF', 
        borderRadius: 20, 
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#DBEAFE',
        marginBottom: 40
    },
    tipIconContainer: {
        marginRight: 12
    },
    tipText: { 
        flex: 1,
        color: '#1E40AF', 
        fontSize: 13, 
        fontWeight: '500',
        lineHeight: 18
    }
});

export default FeesDashboard;