import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadStorageData = async () => {
            try {
                const savedUser = await AsyncStorage.getItem('userData');
                if (savedUser) {
                    setUser(JSON.parse(savedUser));
                }
            } catch (e) {
                console.error("AuthContext Load Error:", e);
            } finally {
                setIsLoading(false);
            }
        };
        loadStorageData();
    }, []);

    /**
     * ✅ Updated Save User Data
     * Backend se naya 'user' object aane par usey clean tarike se update karein
     */
    const saveUserData = async (newUserData) => {
        try {
            // Check karein ki data valid hai
            if (!newUserData) return;

            // Simple aur safe update logic
            // Agar backend pura object bhej raha hai (res.data.user), toh direct save karein
            await AsyncStorage.setItem('userData', JSON.stringify(newUserData));
            setUser(newUserData); 
            
            console.log("✅ State & Storage Updated with New Profile Data");
        } catch (e) {
            console.error("Save User Error:", e);
        }
    };

    const logout = async () => {
    try {
        // 🧹 Dono keys ek saath delete hongi
        await AsyncStorage.multiRemove(['token', 'userData']);
        
        // 🔄 State null hote hi Navigator trigger ho jayega
        setUser(null); 
        
        console.log("✅ Logout Successful: Storage Cleared");
    } catch (e) {
        console.error("Logout Error:", e);
        Alert.alert("Error", "Logout nahi ho paya, dobara koshish karein.");
    }
};

    return (
        <AuthContext.Provider value={{ 
            user, 
            setUser,
             updateUser: saveUserData,
            isLoading, 
            logout 
        }}>
            {children}
        </AuthContext.Provider>
    );
};