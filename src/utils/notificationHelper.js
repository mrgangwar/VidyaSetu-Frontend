// File: src/utils/notificationHelper.js

import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

export async function registerForPushNotificationsAsync() {
  // 1. Check karein ki kya hum Real Device par hain aur Expo Go toh nahi?
  if (!Constants.isDevice) {
    console.log('Push Notifications physical device par hi kaam karti hain');
    return null;
  }

  // 2. SDK 53 Warning Bypass: Agar Expo Go hai toh token mat mango
  if (Constants.appOwnership === 'expo') {
    console.warn('SDK 53: Expo Go mein push notifications support nahi hain. Is part ko skip kar rahe hain.');
    return null; 
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    return token;
  } catch (error) {
    console.log("Notification Token Error:", error);
    return null;
  }
}