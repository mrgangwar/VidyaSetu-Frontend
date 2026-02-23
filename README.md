# 📱 VidyaSetu Frontend - Mobile App (React Native / Expo)

A comprehensive mobile application built with React Native and Expo for the VidyaSetu tuition management platform. The app provides role-based access for Super Admins, Admins, Teachers, and Students to manage their respective activities.

---

## 🚀 Features

### 🔐 Authentication
- **Multi-Role Login**: Supports Admin, Teacher, and Student logins
- **Student ID or Email Login**: Flexible login options for students
- **Secure Token Storage**: JWT tokens stored securely using AsyncStorage
- **Password Reset**: OTP-based password recovery via email

### 📱 Admin Features (Super Admin & Admin)

#### Dashboard
- Overview statistics
- Quick access to all admin functions

#### Teacher Management
- Create new teacher accounts
- View list of all teachers
- Edit teacher profiles
- Delete teachers
- Teacher details view with qualifications

#### Broadcast System (Super Admin)
- Send global notifications
- Target specific roles (Teachers/Students/All)
- Push notifications via Expo

#### Profile Management
- Update personal profile
- Profile photo upload

### 👨‍🏫 Teacher Features

#### Student Management
- Add new students with all details
- View list of assigned students
- Edit student profiles
- Delete students
- Profile photo upload for students

#### Attendance System
- Mark daily attendance (Present/Absent/Late/Leave)
- Mark entire batch as Holiday
- View today's attendance
- View attendance history by date
- Student attendance statistics with percentage

#### Fee Management
- Collect monthly fees
- Automatic balance calculation
- View fee statistics
- Fee dashboard with charts
- Professional fee receipt generation

#### Notice Board
- Create notices for students
- Manage existing notices
- View global broadcasts from Super Admin

#### Homework
- Create homework assignments
- Add attachments (images/PDFs)
- Set due dates
- View homework history
- Delete homework

#### Profile
- View and edit profile
- Update qualifications and subjects
- Contact developer support

### 🎓 Student Features

#### Dashboard
- Personal dashboard with key stats
- View assigned teacher
- See pending fees
- Recent notices display

#### My Profile
- View personal profile
- Update contact details

#### Attendance
- View personal attendance history
- Attendance statistics with percentage

#### Fees
- View fee payment history
- Check pending balance

#### Homework
- View assigned homework
- Download attachments
- Check due dates

#### Notices
- View all notices
- Access global broadcasts

#### Teachers
- View list of teachers
- Teacher contact details

---

## 🏗️ Project Structure

```
tuition-saas-app/
├── assets/
│   └── images/           # App icons and splash screen
├── components/
│   └── ui/                # Reusable UI components
├── constants/
│   └── theme.ts           # Color palette and typography
├── hooks/
│   ├── use-color-scheme.ts
│   └── use-theme-color.ts
├── src/
│   ├── api/
│   │   └── client.js      # Axios API client with interceptors
│   ├── context/
│   │   └── AuthContext.js # Authentication context provider
│   ├── navigation/
│   │   └── AppNavigator.js # Navigation stack based on user role
│   ├── screens/
│   │   ├── Admin/              # Admin-specific screens
│   │   │   ├── AdminProfileScreen.js
│   │   │   ├── BroadcastScreen.js
│   │   │   ├── EditTeacherScreen.js
│   │   │   ├── TeacherDetailsScreen.js
│   │   │   └── TeacherListScreen.js
│   │   ├── Student/            # Student-specific screens
│   │   │   ├── AllNotices.js
│   │   │   ├── MyAttendance.js
│   │   │   ├── MyFees.js
│   │   │   ├── MyHomework.js
│   │   │   ├── MyTeacher.js
│   │   │   ├── StudentSelfProfile.js
│   │   │   └── TeacherDetails.js
│   │   ├── Teacher/            # Teacher-specific screens
│   │   │   ├── ContactDeveloperScreen.js
│   │   │   ├── GiveHomeworkScreen.js
│   │   │   ├── HomeworkHistoryScreen.js
│   │   │   ├── ManageNotices.js
│   │   │   └── TeacherBroadcastScreen.js
│   │   ├── AddStudentScreen.js
│   │   ├── AdminDashboard.js
│   │   ├── AttendanceHistory.js
│   │   ├── CollectFeeScreen.js
│   │   ├── CreateTeacherScreen.js
│   │   ├── FeesDashboard.js
│   │   ├── ForgotPasswordScreen.js
│   │   ├── LoginScreen.js
│   │   ├── MarkAttendance.js
│   │   ├── MyStudentsScreen.js
│   │   ├── StudentDashboard.js
│   │   ├── StudentDetailScreen.js
│   │   ├── StudentProfile.js
│   │   ├── TeacherDashboard.js
│   │   └── TeacherProfileScreen.js
│   └── utils/
│       └── notificationHelper.js
├── App.js                 # App entry point
├── app.json               # Expo configuration
├── package.json           # Dependencies
└── tsconfig.json          # TypeScript config
```

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **React Native** | Mobile framework |
| **Expo** | Development platform |
| **Expo Router** | File-based routing |
| **React Navigation** | Navigation library |
| **Axios** | HTTP client |
| **AsyncStorage** | Local data persistence |
| **Expo Notifications** | Push notifications |
| **Expo Image Picker** | Photo selection |
| **Expo Document Picker** | Document selection |
| **Expo Secure Store** | Secure storage |
| **React Native Paper** | UI components |
| **React Native SVG** | Charts and graphics |
| **TypeScript** | Type safety |

---

## 📲 App Screens

### Common Screens
- **Login Screen** - Role-based login
- **Forgot Password** - Password reset flow

### Admin Screens
| Screen | Description |
|--------|-------------|
| `AdminDashboard` | Main admin dashboard |
| `CreateTeacherScreen` | Add new teacher |
| `TeacherListScreen` | List all teachers |
| `TeacherDetailsScreen` | View teacher details |
| `EditTeacherScreen` | Edit teacher profile |
| `AdminProfileScreen` | Admin profile management |
| `BroadcastScreen` | Send global notifications |

### Teacher Screens
| Screen | Description |
|--------|-------------|
| `TeacherDashboard` | Main teacher dashboard |
| `AddStudentScreen` | Add new student |
| `MyStudentsScreen` | List of students |
| `StudentDetailScreen` | Student details |
| `StudentProfile` | Edit student profile |
| `TeacherProfileScreen` | Teacher profile |
| `MarkAttendance` | Mark daily attendance |
| `AttendanceHistory` | View attendance records |
| `CollectFeeScreen` | Collect student fees |
| `FeesDashboard` | Fee statistics |
| `ManageNotices` | Manage notices |
| `GiveHomeworkScreen` | Create homework |
| `HomeworkHistoryScreen` | Homework list |
| `ContactDeveloperScreen` | Developer support |

### Student Screens
| Screen | Description |
|--------|-------------|
| `StudentDashboard` | Student dashboard |
| `StudentSelfProfile` | View/edit profile |
| `MyAttendance` | Attendance history |
| `MyFees` | Fee history |
| `MyHomework` | View homework |
| `MyTeacher` | List of teachers |
| `TeacherDetails` | Teacher details |
| `AllNotices` | All notices & updates |

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file or use Expo environment variables:

```env
EXPO_PUBLIC_API_URL=https://your-backend-api.onrender.com/api
```

### App Configuration (`app.json`)

Key configurations in `app.json`:
- **App Name**: VidyaSetu
- **Bundle Identifier**: `com.nirankar003.vidyasetu`
- **Package**: Android APK package name
- **Scheme**: Deep linking scheme

---

## 🏃‍♂️ Installation & Setup

### Prerequisites
- Node.js (v18+)
- npm or yarn
- Expo CLI
- Android Studio (for Android builds)
- Xcode (for iOS builds)

### Steps

1. **Install Dependencies**
   ```bash
   cd tuition-saas-app
   npm install
   ```

2. **Configure Environment**
   ```bash
   # Set your backend API URL in .env
   echo "EXPO_PUBLIC_API_URL=https://your-api.com/api" > .env
   ```

3. **Start Development Server**
   ```bash
   npm start
   # or
   expo start
   ```

4. **Run on Android**
   ```bash
   npm run android
   # or
   expo run:android
   ```

5. **Run on iOS**
   ```bash
   npm run ios
   # or
   expo run:ios
   ```

---

## 🔗 API Integration

The app uses Axios with interceptors for seamless API communication:

```javascript
// API Client Configuration (src/api/client.js)
- Base URL from environment variable
- Automatic JWT token injection
- FormData handling for file uploads
- Response error handling
```

### Authentication Flow
1. User enters credentials
2. API validates and returns JWT token
3. Token stored in AsyncStorage
4. Token automatically included in all subsequent requests

---

## 📊 Navigation Flow

```
App Start
    │
    ▼
┌─────────────────┐
│   AuthContext   │ ── Checks for saved token
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
  No Token  Has Token
    │         │
    ▼         ▼
┌─────────┐  ┌──────────────┐
│  Login  │  │  Load User   │
└─────────┘  └──────┬───────┘
                    │
         ┌──────────┼──────────┐
         ▼          ▼          ▼
    ┌────────┐ ┌────────┐ ┌──────────┐
    │ ADMIN │ │TEACHER │ │ STUDENT  │
    └────────┘ └────────┘ └──────────┘
```

---

## 🔔 Push Notifications

The app supports push notifications via Expo:

1. **Token Registration**: App registers push token on login
2. **Notifications Received**:
   - Global broadcasts from Super Admin
   - Fee reminders
   - Notice updates
3. **Notification Handling**: Background and foreground handling

---

## 📦 Build & Deployment

### Development Build
```bash
expo start
```

### Production Build (Android APK)
```bash
eas build -p android --profile preview
```

### App Store (iOS)
```bash
eas build -p ios
```

---

## 🛡️ Security Features

- JWT token-based authentication
- Secure token storage using AsyncStorage
- Role-based route protection
- HTTPS communication
- Input validation

---

## 📱 Platform Support

| Platform | Status |
|----------|--------|
| Android | ✅ Supported |
| iOS | ✅ Supported |
| Web | ✅ Supported (experimental) |

---

## 📄 License

ISC License - See LICENSE file for details.

---

## 👨‍💻 Developer

**VidyaSetu Team**  
Bridging Knowledge, Empowering Education 🌟

---

## 🙏 Acknowledgments

- [Expo](https://expo.dev/) - Excellent React Native platform
- [React Native Paper](https://reactnativepaper.com/) - Material Design components
- [MongoDB](https://www.mongodb.com/) - Flexible database
