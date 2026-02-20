import React, { useEffect, useState, useContext } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Linking, ActivityIndicator, Alert, Platform } from 'react-native';
import apiClient from '../../api/client';
import { AuthContext } from '../../context/AuthContext'; // Role check karne ke liye

const API_BASE = Platform.OS === 'web' ? 'http://localhost:5000' : 'http://10.54.31.32:5000';

const ContactDeveloperScreen = () => {
    const { user } = useContext(AuthContext); // Check karne ke liye ki user TEACHER hai ya STUDENT
    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchContact = async () => {
            try {
                // Role ke mutabiq sahi API route select karna
                const endpoint = user?.role === 'TEACHER' 
                    ? '/teacher/developer-contact' 
                    : '/student/developer-contact';

                const res = await apiClient.get(endpoint);
                
                // Teacher API 'admin' key bhejti hai, Dashboard API 'developer' key
                setAdmin(res.data.admin || res.data.developer);
            } catch (err) {
                console.log("Fetch Error:", err.message);
                Alert.alert("Error", "Could not load developer details");
            } finally {
                setLoading(false);
            }
        };
        fetchContact();
    }, [user]);

    const openWhatsApp = () => {
        if (admin?.whatsappNumber) {
            // Dynamic message based on Role
            const roleName = user?.role === 'TEACHER' ? 'Teacher' : 'Student';
            const msg = `Hello VidyaSetu Team, I am a ${roleName} and I need help with...`;
            Linking.openURL(`whatsapp://send?phone=${admin.whatsappNumber}&text=${msg}`);
        } else {
            Alert.alert("Error", "WhatsApp number not available");
        }
    };

    const makeCall = () => {
        if (admin?.contactNumber) {
            Linking.openURL(`tel:${admin.contactNumber}`);
        } else {
            Alert.alert("Error", "Contact number not available");
        }
    };

    if (loading) return <ActivityIndicator size="large" color="#007AFF" style={{flex:1}} />;

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <Image 
                    source={admin?.profilePhoto 
                        ? { uri: admin.profilePhoto.startsWith('http') ? admin.profilePhoto : `${API_BASE}/${admin.profilePhoto}` } 
                        : require('../../assets/default-avatar.png')
                    } 
                    style={styles.img} 
                />
                <Text style={styles.name}>{admin?.name || 'Developer Name'}</Text>
                <Text style={styles.subText}>Contact VidyaSetu for Technical Support</Text>
                
                <TouchableOpacity style={[styles.btn, styles.waBtn]} onPress={openWhatsApp}>
                    <Text style={styles.btnText}>Chat on WhatsApp</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.btn, styles.callBtn]} onPress={makeCall}>
                    <Text style={styles.btnText}>Call Support</Text>
                </TouchableOpacity>

                <Text style={styles.email}>Email: {admin?.email}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9f9f9', justifyContent: 'center', padding: 20 },
    card: { backgroundColor: '#fff', borderRadius: 25, padding: 30, alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
    img: { width: 130, height: 130, borderRadius: 65, marginBottom: 15, borderWidth: 4, borderColor: '#007AFF' },
    name: { fontSize: 24, fontWeight: 'bold', color: '#333' },
    subText: { color: '#888', marginBottom: 25, textAlign: 'center' },
    btn: { width: '100%', padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
    waBtn: { backgroundColor: '#25D366' },
    callBtn: { backgroundColor: '#007AFF' },
    btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    email: { marginTop: 10, color: '#666', fontSize: 14 }
});

export default ContactDeveloperScreen;