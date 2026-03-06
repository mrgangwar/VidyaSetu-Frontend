import React, { useContext } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native'; 
import { createStackNavigator } from '@react-navigation/stack';
import { AuthContext } from '../context/AuthContext';

// --- SHARED SCREENS ---
import LoginScreen from '../screens/LoginScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';

// --- ADMIN SCREENS ---
import AdminDashboard from '../screens/AdminDashboard';
import CreateTeacherScreen from '../screens/CreateTeacherScreen';
import TeacherListScreen from '../screens/Admin/TeacherListScreen';
import TeacherDetailsScreen from '../screens/Admin/TeacherDetailsScreen';
import EditTeacherScreen from '../screens/Admin/EditTeacherScreen';
import AdminProfileScreen from '../screens/Admin/AdminProfileScreen';
import BroadcastScreen from '../screens/Admin/BroadcastScreen';

// --- TEACHER SCREENS ---
import TeacherDashboard from '../screens/TeacherDashboard';
import AddStudentScreen from '../screens/AddStudentScreen';
import MyStudentsScreen from '../screens/MyStudentsScreen';
import StudentDetailScreen from '../screens/StudentDetailScreen';
import MarkAttendance from '../screens/MarkAttendance'; 
import CollectFeeScreen from '../screens/CollectFeeScreen'; 
import FeesDashboard from '../screens/FeesDashboard'; 
import ManageNotices from '../screens/Teacher/ManageNotices';
import ContactDeveloperScreen from '../screens/Teacher/ContactDeveloperScreen';
import AttendanceHistory from '../screens/AttendanceHistory';
import TeacherProfileScreen from '../screens/TeacherProfileScreen';
import GiveHomeworkScreen from '../screens/Teacher/GiveHomeworkScreen';
import HomeworkHistoryScreen from '../screens/Teacher/HomeworkHistoryScreen';
// ✅ ADDED: Screen for global broadcasts from Admin
import TeacherBroadcastScreen from '../screens/Teacher/TeacherBroadcastScreen'; 
// ✅ ADDED: Screen for student fee status
import StudentFeeStatusScreen from '../screens/StudentFeeStatusScreen';
import ManageStudentFeesScreen from '../screens/Teacher/ManageStudentFeesScreen'; 

// --- ALIASING & PATHS ---
import TeacherSideStudentProfile from '../screens/StudentProfile'; 
import StudentSideProfile from '../screens/Student/StudentSelfProfile'; 

// --- STUDENT SCREENS ---
import StudentDashboard from '../screens/StudentDashboard'; 
import MyAttendance from '../screens/Student/MyAttendance';
import MyHomework from '../screens/Student/MyHomework';
import MyFees from '../screens/Student/MyFees';
import PayFeesScreen from '../screens/Student/PayFeesScreen';
import MyTeachers from '../screens/Student/MyTeacher';
import TeacherDetails from '../screens/Student/TeacherDetails';
import AllNotices from '../screens/Student/AllNotices';
const Stack = createStackNavigator();

export default function AppNavigator() {
    const { user, isLoading } = useContext(AuthContext);

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6366F1" />
            </View>
        );
    }

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {user === null ? (
                <>
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                </>
            ) : (
                <>
                    {/* --- ADMIN ROUTES (SUPER_ADMIN & ADMIN) --- */}
                    {(user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') && (
                        <>
                            <Stack.Screen name="AdminHome" component={AdminDashboard} />
                            <Stack.Screen name="CreateTeacher" component={CreateTeacherScreen} />
                            <Stack.Screen name="TeacherList" component={TeacherListScreen} />
                            <Stack.Screen name="TeacherDetails" component={TeacherDetailsScreen} />
                            <Stack.Screen name="EditTeacher" component={EditTeacherScreen} /> 
                            <Stack.Screen name="AdminProfile" component={AdminProfileScreen} /> 
                            <Stack.Screen 
                                name="Broadcast" 
                                component={BroadcastScreen} 
                                options={{ headerShown: true, title: 'Send Global Notice' }} 
                            />
                        </>
                    )}

                    {/* --- TEACHER ROUTES --- */}
                    {user.role === 'TEACHER' && (
                        <>
                            <Stack.Screen name="TeacherHome" component={TeacherDashboard} />
                            <Stack.Screen name="AddStudent" component={AddStudentScreen} />
                            <Stack.Screen name="MyStudents" component={MyStudentsScreen} />
                            <Stack.Screen name="StudentDetail" component={StudentDetailScreen} /> 
                            <Stack.Screen 
                                name="TeacherStudentProfile" 
                                component={TeacherSideStudentProfile} 
                                options={{ headerShown: true, title: 'Edit Student Profile' }} 
                            />
                            <Stack.Screen name="TeacherProfile" component={TeacherProfileScreen} options={{ title: 'Edit Profile' }} />
                            <Stack.Screen name="MarkAttendance" component={MarkAttendance} />
                            <Stack.Screen name="AttendanceHistory" component={AttendanceHistory} />
                            <Stack.Screen name="CollectFee" component={CollectFeeScreen} />
                            <Stack.Screen name="FeesDashboard" component={FeesDashboard} />
                            <Stack.Screen name="StudentFeeStatus" component={StudentFeeStatusScreen} />
                            <Stack.Screen name="ManageStudentFees" component={ManageStudentFeesScreen} />
                            <Stack.Screen name="ManageNotices" component={ManageNotices} />
                            <Stack.Screen name="ContactDeveloper" component={ContactDeveloperScreen} />
                            <Stack.Screen name="GiveHomework" component={GiveHomeworkScreen} />
                            <Stack.Screen name="HomeworkHistory" component={HomeworkHistoryScreen} />
                            {/* ✅ IMPORTANT: Global Notices from Admin Screen */}
                            <Stack.Screen 
                                name="TeacherBroadcast" 
                                component={TeacherBroadcastScreen} 
                                options={{ headerShown: true, title: 'Admin Updates' }} 
                            />
                        </>
                    )}

                    {/* --- STUDENT ROUTES --- */}
                    {user.role === 'STUDENT' && (
                        <>
                            <Stack.Screen name="StudentHome" component={StudentDashboard} />
                            <Stack.Screen 
                                name="MyProfile" 
                                component={StudentSideProfile} 
                                options={{ headerShown: true, title: 'My Profile' }} 
                            />
                            <Stack.Screen name="MyAttendance" component={MyAttendance} options={{ headerShown: true, title: 'My Attendance' }} />
                            <Stack.Screen name="MyHomework" component={MyHomework} options={{ headerShown: true, title: 'My Homework' }} />
                            <Stack.Screen name="MyFees" component={MyFees} options={{ headerShown: true, title: 'My Fees' }} />
                            <Stack.Screen name="PayFees" component={PayFeesScreen} options={{ headerShown: true, title: 'Pay Fees Online' }} />
                            <Stack.Screen name="MyTeachers" component={MyTeachers} options={{ headerShown: true, title: 'My Teachers' }} />
                            <Stack.Screen name="TeacherDetails" component={TeacherDetails} options={{ headerShown: true, title: 'Teacher Details' }} />
                            <Stack.Screen name="AllNotices" component={AllNotices} options={{ headerShown: true, title: 'Notices & Updates' }} />
                            <Stack.Screen name="ContactDeveloper" component={ContactDeveloperScreen} />
                        </>
                    )}
                </>
            )}
        </Stack.Navigator>
    );
}

const styles = StyleSheet.create({
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }
});