# Ubuntu HRMS Android Implementation Guide

This guide provides comprehensive technical specifications and implementation guidance for building an Android version of the Ubuntu HRMS system.

## Table of Contents
1. [Technical Stack Recommendations](#technical-stack-recommendations)
2. [Architecture Pattern](#architecture-pattern)
3. [Screen Mapping](#screen-mapping)
4. [Data Models](#data-models)
5. [API Integration](#api-integration)
6. [Authentication Flow](#authentication-flow)
7. [Offline Support](#offline-support)
8. [Push Notifications](#push-notifications)
9. [File Handling](#file-handling)
10. [Geolocation Features](#geolocation-features)
11. [PDF Generation](#pdf-generation)
12. [Security Considerations](#security-considerations)
13. [Performance Optimization](#performance-optimization)
14. [Testing Strategy](#testing-strategy)

---

## Technical Stack Recommendations

### Recommended Stack
- **Language:** Kotlin (primary) with Java for legacy support
- **UI Framework:** Jetpack Compose (modern) or XML layouts (traditional)
- **Networking:** Retrofit 2 + OkHttp 3
- **Dependency Injection:** Hilt or Koin
- **Local Database:** Room Database
- **Image Loading:** Coil or Glide
- **Async Operations:** Kotlin Coroutines + Flow
- **Architecture:** MVVM (Model-View-ViewModel) or MVI
- **Navigation:** Jetpack Navigation Component
- **Build System:** Gradle (Kotlin DSL)

### Alternative Stack Options
- **Cross-platform:** Flutter or React Native (if targeting multiple platforms)
- **UI Framework:** XML layouts with ViewBinding (if team prefers traditional Android)
- **Networking:** Ktor (if preferring Kotlin-first)

### Dependencies (Gradle)

```kotlin
// Core
implementation("androidx.core:core-ktx:1.12.0")
implementation("androidx.appcompat:appcompat:1.6.1")
implementation("com.google.android.material:material:1.11.0")

// Lifecycle
implementation("androidx.lifecycle:lifecycle-viewmodel-ktx:2.7.0")
implementation("androidx.lifecycle:lifecycle-livedata-ktx:2.7.0")
implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")

// Compose (if using)
implementation("androidx.compose.ui:ui:1.5.4")
implementation("androidx.compose.material3:material3:1.1.2")
implementation("androidx.activity:activity-compose:1.8.1")

// Networking
implementation("com.squareup.retrofit2:retrofit:2.9.0")
implementation("com.squareup.retrofit2:converter-gson:2.9.0")
implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")

// DI
implementation("com.google.dagger:hilt-android:2.48")
kapt("com.google.dagger:hilt-compiler:2.48")

// Database
implementation("androidx.room:room-runtime:2.6.1")
implementation("androidx.room:room-ktx:2.6.1")
kapt("androidx.room:room-compiler:2.6.1")

// Coroutines
implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")

// Navigation
implementation("androidx.navigation:navigation-fragment-ktx:2.7.6")
implementation("androidx.navigation:navigation-ui-ktx:2.7.6")

// Image Loading
implementation("io.coil-kt:coil:2.5.0")

// PDF
implementation("com.itextpdf:itext7-core:7.2.5")

// Location
implementation("com.google.android.gms:play-services-location:21.0.1")

// Push Notifications
implementation("com.google.firebase:firebase-messaging:23.4.0")

// Biometrics
implementation("androidx.biometric:biometric:1.1.0")
```

---

## Architecture Pattern

### MVVM Architecture
```
┌─────────────────────────────────────────────────────────┐
│                      Presentation Layer                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐│
│  │ Activity │  │ Fragment │  │  Dialog  │  │ Adapter ││
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘│
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                      ViewModel Layer                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  LoginVM │  │  DashVM  │  │ LeaveVM  │  ...         │
│  └──────────┘  └──────────┘  └──────────┘              │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                      Repository Layer                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  AuthRepo│  │ EmpRepo  │  │LeaveRepo  │  ...         │
│  └──────────┘  └──────────┘  └──────────┘              │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                      Data Source Layer                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │   API    │  │  Room DB │  │ SharedPref│  ...       │
│  └──────────┘  └──────────┘  └──────────┘              │
└─────────────────────────────────────────────────────────┘
```

### Package Structure
```
com.ubuntu.hrms
├── data
│   ├── api
│   │   ├── ApiService.kt
│   │   ├── AuthApi.kt
│   │   ├── EmployeeApi.kt
│   │   └── ...
│   ├── model
│   │   ├── User.kt
│   │   ├── Employee.kt
│   │   ├── LeaveRequest.kt
│   │   └── ...
│   ├── repository
│   │   ├── AuthRepository.kt
│   │   ├── EmployeeRepository.kt
│   │   └── ...
│   └── local
│       ├── AppDatabase.kt
│       ├── UserDao.kt
│       └── ...
├── domain
│   ├── usecase
│   │   ├── LoginUseCase.kt
│   │   ├── GetEmployeesUseCase.kt
│   │   └── ...
│   └── model
│       ├── User.kt
│       └── ...
├── presentation
│   ├── ui
│   │   ├── auth
│   │   │   ├── LoginActivity.kt
│   │   │   ├── RegisterActivity.kt
│   │   │   └── ...
│   │   ├── admin
│   │   ├── manager
│   │   ├── employee
│   │   ├── contractor
│   │   └── common
│   ├── viewmodel
│   │   ├── AuthViewModel.kt
│   │   ├── DashboardViewModel.kt
│   │   └── ...
│   └── adapter
│       ├── EmployeeAdapter.kt
│       └── ...
├── di
│   ├── AppModule.kt
│   ├── RepositoryModule.kt
│   └── ...
├── utils
│   ├── Extensions.kt
│   ├── Constants.kt
│   └── ...
└── UbuntuHrmsApp.kt
```

---

## Screen Mapping

### Authentication Screens

| Web Route | Android Screen | Description |
|------------|----------------|-------------|
| `/login` | LoginActivity | Login with email/password |
| `/register` | RegisterActivity | New user registration |
| `/forgot-password` | ForgotPasswordActivity | Password recovery |
| `/reset-password` | ResetPasswordActivity | Set new password |
| `/unauthorized` | UnauthorizedActivity | Access denied screen |

### Admin Screens

| Web Route | Android Screen | Description |
|------------|----------------|-------------|
| `/admin/dashboard` | AdminDashboardActivity | Overview of system metrics |
| `/admin/employees` | EmployeeListActivity | Employee directory |
| `/admin/employees/:id` | EmployeeDetailActivity | Employee details |
| `/admin/users` | UserListActivity | System users |
| `/admin/users/:id` | UserDetailActivity | User details |
| `/admin/permissions` | PermissionsActivity | Role permissions |
| `/admin/settings` | AdminSettingsActivity | System settings |
| `/admin/attendance` | AttendanceReportActivity | Attendance reports |
| `/admin/kpis` | KpiReportActivity | KPI reports |
| `/admin/leaves` | LeaveReportActivity | Leave reports |
| `/admin/payroll` | PayrollActivity | Payroll processing |
| `/admin/contracts` | ContractListActivity | Contract management |
| `/admin/onboarding` | OnboardingActivity | Onboarding process |
| `/admin/daily-labour` | DailyLabourActivity | Daily labour management |
| `/admin/complaints` | ComplaintListActivity | Complaint management |
| `/admin/assets` | AssetListActivity | Asset management |
| `/admin/contractors` | ContractorListActivity | Contractor management |
| `/admin/reports` | ReportsActivity | Generate reports |

### Manager Screens

| Web Route | Android Screen | Description |
|------------|----------------|-------------|
| `/manager/dashboard` | ManagerDashboardActivity | Team overview |
| `/manager/attendance` | TeamAttendanceActivity | Team attendance |
| `/manager/leaves` | TeamLeaveActivity | Team leave requests |

### Employee Screens

| Web Route | Android Screen | Description |
|------------|----------------|-------------|
| `/employee/dashboard` | EmployeeDashboardActivity | Personal overview |
| `/employee/leaves` | MyLeaveActivity | Personal leave |
| `/employee/punch` | PunchActivity | Clock in/out |
| `/employee/attendance` | MyAttendanceActivity | Personal attendance |

### Contractor Screens

| Web Route | Android Screen | Description |
|------------|----------------|-------------|
| `/contractor/dashboard` | ContractorDashboardActivity | Contractor overview |
| `/contractor/projects` | ProjectListActivity | Assigned projects |
| `/contractor/invoices` | InvoiceListActivity | Invoice management |
| `/contractor/portal` | ContractorPortalActivity | Main portal |

### Recruitment Screens

| Web Route | Android Screen | Description |
|------------|----------------|-------------|
| `/` | LandingActivity | Public landing |
| `/recruitment/jobs-board` | JobBoardActivity | Public job board |
| `/recruitment/apply/:id` | JobApplicationActivity | Apply for job |
| `/recruitment/jobs` | JobManagementActivity | Manage jobs |
| `/recruitment/jobs/:id` | JobDetailActivity | Job details |
| `/recruitment/create-advertisement` | CreateJobActivity | Create job posting |
| `/recruitment/jobs/:id/applicants` | ApplicantListActivity | Job applicants |
| `/recruitment/jobs/:id/applicants/:id` | ApplicantDetailActivity | Applicant details |
| `/recruitment/my-applications` | MyApplicationsActivity | My applications |

### Leave Screens

| Web Route | Android Screen | Description |
|------------|----------------|-------------|
| `/leave/request` | LeaveRequestActivity | Request leave |
| `/leave/approvals` | LeaveApprovalActivity | Approve leaves |
| `/leave/statutory` | StatutoryLeaveActivity | Statutory leave |

### Payroll Screens

| Web Route | Android Screen | Description |
|------------|----------------|-------------|
| `/payroll/disburse` | PayrollDisburseActivity | Process payroll |
| `/payroll/payslips` | PayslipListActivity | View payslips |

### KPI Screens

| Web Route | Android Screen | Description |
|------------|----------------|-------------|
| `/kpi/manage` | KpiManageActivity | Manage KPIs |
| `/kpi/assessment` | KpiAssessmentActivity | Conduct assessments |
| `/kpi/my-goals` | MyGoalsActivity | Personal KPIs |

### Common Screens

| Web Route | Android Screen | Description |
|------------|----------------|-------------|
| `/profile` | ProfileActivity | Profile overview |
| `/profile/view` | ProfileViewActivity | View profile |
| `/profile/update` | ProfileUpdateActivity | Update profile |
| `/settings` | SettingsActivity | App settings |

---

## Data Models

### User Model
```kotlin
data class User(
    val id: String,
    val email: String,
    val firstName: String,
    val lastName: String,
    val role: UserRole,
    val isActive: Boolean,
    val createdAt: String,
    val updatedAt: String
)

enum class UserRole {
    ADMIN,
    MANAGER,
    SUPERVISOR,
    HR,
    EMPLOYEE,
    CONTRACTOR
}
```

### Employee Model
```kotlin
data class Employee(
    val id: String,
    val userId: String,
    val employeeId: String,
    val firstName: String,
    val lastName: String,
    val email: String,
    val phone: String,
    val department: String,
    val position: String,
    val employmentType: EmploymentType,
    val joinDate: String,
    val salary: Double,
    val status: EmployeeStatus,
    val profilePicture: String?,
    val emergencyContact: EmergencyContact?
)

enum class EmploymentType {
    FULL_TIME,
    PART_TIME,
    CONTRACT,
    DAILY_LABOUR
}

enum class EmployeeStatus {
    ACTIVE,
    ON_LEAVE,
    TERMINATED,
    ONBOARDING
}

data class EmergencyContact(
    val name: String,
    val relationship: String,
    val phone: String
)
```

### Leave Request Model
```kotlin
data class LeaveRequest(
    val id: String,
    val employeeId: String,
    val employeeName: String,
    val leaveType: LeaveType,
    val startDate: String,
    val endDate: String,
    val reason: String,
    val status: LeaveStatus,
    val appliedDate: String,
    val approvedBy: String?,
    val approvedDate: String?,
    val rejectionReason: String?
)

enum class LeaveType {
    ANNUAL,
    SICK,
    MATERNITY,
    PATERNITY,
    COMPASSIONATE,
    UNPAID
}

enum class LeaveStatus {
    PENDING,
    APPROVED,
    REJECTED,
    CANCELLED
}
```

### Attendance Model
```kotlin
data class Attendance(
    val id: String,
    val employeeId: String,
    val employeeName: String,
    val date: String,
    val checkInTime: String?,
    val checkOutTime: String?,
    val location: Location?,
    val status: AttendanceStatus,
    val notes: String?
)

data class Location(
    val latitude: Double,
    val longitude: Double,
    val accuracy: Float,
    val timestamp: Long
)

enum class AttendanceStatus {
    PRESENT,
    ABSENT,
    LATE,
    HALF_DAY
}
```

### KPI Model
```kotlin
data class KPI(
    val id: String,
    val title: String,
    val description: String,
    val category: KPICategory,
    val targetValue: Double,
    val currentValue: Double,
    val unit: String,
    val deadline: String,
    val assignedTo: List<String>,
    val status: KPIStatus,
    val createdAt: String
)

enum class KPICategory {
    PERFORMANCE,
    PRODUCTIVITY,
    QUALITY,
    ATTENDANCE,
    TEAMWORK
}

enum class KPIStatus {
    NOT_STARTED,
    IN_PROGRESS,
    COMPLETED,
    OVERDUE
}
```

### Job Posting Model
```kotlin
data class JobPosting(
    val id: String,
    val title: String,
    val description: String,
    val department: String,
    val location: String,
    val employmentType: EmploymentType,
    val salaryMin: Double,
    val salaryMax: Double,
    val requirements: List<String>,
    val responsibilities: List<String>,
    val status: JobStatus,
    val postedDate: String,
    val deadline: String,
    val applicantCount: Int
)

enum class JobStatus {
    DRAFT,
    ACTIVE,
    CLOSED,
    FILLED
}
```

### Payslip Model
```kotlin
data class Payslip(
    val id: String,
    val employeeId: String,
    val employeeName: String,
    val period: String,
    val basicSalary: Double,
    val allowances: List<Allowance>,
    val deductions: List<Deduction>,
    val netPay: Double,
    val generatedDate: String,
    val pdfUrl: String
)

data class Allowance(
    val name: String,
    val amount: Double
)

data class Deduction(
    val name: String,
    val amount: Double
)
```

---

## API Integration

### Base Configuration
```kotlin
object ApiConfig {
    const val BASE_URL = "http://localhost:5000/api/"
    const val TIMEOUT = 30L // seconds
}

class RetrofitClient {
    private val okHttpClient = OkHttpClient.Builder()
        .addInterceptor(AuthInterceptor())
        .addInterceptor(LoggingInterceptor())
        .connectTimeout(ApiConfig.TIMEOUT, TimeUnit.SECONDS)
        .readTimeout(ApiConfig.TIMEOUT, TimeUnit.SECONDS)
        .build()

    private val retrofit = Retrofit.Builder()
        .baseUrl(ApiConfig.BASE_URL)
        .client(okHttpClient)
        .addConverterFactory(GsonConverterFactory.create())
        .build()

    fun <T> createService(serviceClass: Class<T>): T {
        return retrofit.create(serviceClass)
    }
}
```

### Auth Interceptor
```kotlin
class AuthInterceptor : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()
        val token = TokenManager.getToken()
        
        val newRequest = if (token != null) {
            originalRequest.newBuilder()
                .header("x-auth-token", token)
                .build()
        } else {
            originalRequest
        }
        
        return chain.proceed(newRequest)
    }
}
```

### API Service Interfaces
```kotlin
interface AuthApi {
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>
    
    @POST("auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<RegisterResponse>
    
    @POST("auth/forgot-password")
    suspend fun forgotPassword(@Body request: ForgotPasswordRequest): Response<ForgotPasswordResponse>
    
    @POST("auth/reset-password")
    suspend fun resetPassword(@Body request: ResetPasswordRequest): Response<ResetPasswordResponse>
}

interface EmployeeApi {
    @GET("employees")
    suspend fun getAllEmployees(): Response<List<Employee>>
    
    @GET("employees/{id}")
    suspend fun getEmployee(@Path("id") id: String): Response<Employee>
    
    @POST("employees")
    suspend fun createEmployee(@Body employee: Employee): Response<Employee>
    
    @PUT("employees/{id}")
    suspend fun updateEmployee(@Path("id") id: String, @Body employee: Employee): Response<Employee>
    
    @DELETE("employees/{id}")
    suspend fun deleteEmployee(@Path("id") id: String): Response<Unit>
}

interface LeaveApi {
    @GET("leave")
    suspend fun getAllLeaveRequests(): Response<List<LeaveRequest>>
    
    @POST("leave")
    suspend fun createLeaveRequest(@Body request: LeaveRequest): Response<LeaveRequest>
    
    @PUT("leave/{id}")
    suspend fun updateLeaveRequest(@Path("id") id: String, @Body request: LeaveRequest): Response<LeaveRequest>
    
    @DELETE("leave/{id}")
    suspend fun cancelLeaveRequest(@Path("id") id: String): Response<Unit>
}

interface AttendanceApi {
    @GET("attendance")
    suspend fun getAttendance(): Response<List<Attendance>>
    
    @POST("attendance")
    suspend fun markAttendance(@Body attendance: Attendance): Response<Attendance>
    
    @GET("attendance/{id}")
    suspend fun getAttendanceDetail(@Path("id") id: String): Response<Attendance>
}

interface PayrollApi {
    @GET("payroll/payslips")
    suspend fun getPayslips(): Response<List<Payslip>>
    
    @GET("payroll/payslips/{id}")
    suspend fun getPayslip(@Path("id") id: String): Response<Payslip>
}

interface JobApi {
    @GET("jobs")
    suspend fun getJobs(): Response<List<JobPosting>>
    
    @GET("jobs/{id}")
    suspend fun getJob(@Path("id") id: String): Response<JobPosting>
    
    @POST("jobs")
    suspend fun createJob(@Body job: JobPosting): Response<JobPosting>
    
    @POST("jobs/{id}/apply")
    suspend fun applyForJob(@Path("id") id: String, @Body application: JobApplication): Response<JobApplication>
}
```

---

## Authentication Flow

### Login Flow
```
User enters credentials
        ↓
Validate input
        ↓
Call API login endpoint
        ↓
Receive token & user data
        ↓
Store token in secure storage
        ↓
Store user data in local DB
        ↓
Navigate to appropriate dashboard (based on role)
```

### Token Management
```kotlin
object TokenManager {
    private const val TOKEN_KEY = "auth_token"
    private const val USER_KEY = "user_data"
    
    fun saveToken(token: String) {
        val encryptedToken = encrypt(token)
        SharedPreferencesManager.putString(TOKEN_KEY, encryptedToken)
    }
    
    fun getToken(): String? {
        val encryptedToken = SharedPreferencesManager.getString(TOKEN_KEY)
        return encryptedToken?.let { decrypt(it) }
    }
    
    fun clearToken() {
        SharedPreferencesManager.remove(TOKEN_KEY)
        SharedPreferencesManager.remove(USER_KEY)
    }
    
    fun saveUser(user: User) {
        val userJson = Gson().toJson(user)
        SharedPreferencesManager.putString(USER_KEY, userJson)
    }
    
    fun getUser(): User? {
        val userJson = SharedPreferencesManager.getString(USER_KEY)
        return Gson().fromJson(userJson, User::class.java)
    }
    
    private fun encrypt(data: String): String {
        // Use Android Keystore for encryption
        return data // Simplified - implement actual encryption
    }
    
    private fun decrypt(data: String): String {
        // Use Android Keystore for decryption
        return data // Simplified - implement actual decryption
    }
}
```

### Biometric Login
```kotlin
class BiometricManager(private val context: Context) {
    
    fun canAuthenticate(): Boolean {
        val biometricManager = BiometricManager.from(context)
        return biometricManager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG) ==
            BiometricManager.BIOMETRIC_SUCCESS
    }
    
    fun authenticate(
        onSuccess: () -> Unit,
        onError: (String) -> Unit
    ) {
        val promptInfo = BiometricPrompt.PromptInfo.Builder()
            .setTitle("Biometric Login")
            .setSubtitle("Use your fingerprint to login")
            .setNegativeButtonText("Cancel")
            .build()
        
        val biometricPrompt = BiometricPrompt(
            (context as FragmentActivity),
            ContextCompat.getMainExecutor(context),
            object : BiometricPrompt.AuthenticationCallback() {
                override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                    onSuccess()
                }
                
                override fun onAuthenticationFailed() {
                    onError("Authentication failed")
                }
                
                override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                    onError(errString.toString())
                }
            }
        )
        
        biometricPrompt.authenticate(promptInfo)
    }
}
```

---

## Offline Support

### Offline Strategy
1. **Cache API Responses**: Store frequently accessed data in Room database
2. **Queue Offline Actions**: Store create/update/delete requests locally
3. **Sync on Reconnect**: Process queued requests when network is available
4. **Conflict Resolution**: Use last-write-wins or timestamp-based resolution

### Room Database Setup
```kotlin
@Database(
    entities = [
        User::class,
        Employee::class,
        LeaveRequest::class,
        Attendance::class,
        KPI::class
    ],
    version = 1
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
    abstract fun employeeDao(): EmployeeDao
    abstract fun leaveRequestDao(): LeaveRequestDao
    abstract fun attendanceDao(): AttendanceDao
    abstract fun kpiDao(): KpiDao
    
    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null
        
        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "ubuntu_hrms_database"
                )
                    .fallbackToDestructiveMigration()
                    .build()
                    .also { INSTANCE = it }
            }
        }
    }
}
```

### Offline Queue Manager
```kotlin
class OfflineQueueManager(
    private val context: Context,
    private val apiService: ApiService
) {
    private val queue = mutableListOf<OfflineAction>()
    
    data class OfflineAction(
        val id: String,
        val type: ActionType,
        val endpoint: String,
        val data: String,
        val timestamp: Long
    )
    
    enum class ActionType {
        CREATE, UPDATE, DELETE
    }
    
    fun enqueueAction(action: OfflineAction) {
        queue.add(action)
        saveToStorage()
    }
    
    suspend fun syncQueue() {
        if (!isNetworkAvailable()) return
        
        val actionsToSync = queue.toList()
        queue.clear()
        
        for (action in actionsToSync) {
            try {
                when (action.type) {
                    ActionType.CREATE -> performCreate(action)
                    ActionType.UPDATE -> performUpdate(action)
                    ActionType.DELETE -> performDelete(action)
                }
            } catch (e: Exception) {
                // Re-add to queue if failed
                queue.add(action)
            }
        }
        
        saveToStorage()
    }
    
    private suspend fun performCreate(action: OfflineAction) {
        // Implementation based on endpoint
    }
    
    private suspend fun performUpdate(action: OfflineAction) {
        // Implementation based on endpoint
    }
    
    private suspend fun performDelete(action: OfflineAction) {
        // Implementation based on endpoint
    }
    
    private fun isNetworkAvailable(): Boolean {
        val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = connectivityManager.activeNetworkInfo
        return network != null && network.isConnected
    }
    
    private fun saveToStorage() {
        // Save queue to SharedPreferences or Room
    }
}
```

### Network Connectivity Observer
```kotlin
class NetworkConnectivityObserver(
    private val context: Context
) : LiveData<Boolean>() {
    
    private val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
    
    private val networkCallback = object : ConnectivityManager.NetworkCallback() {
        override fun onAvailable(network: Network) {
            postValue(true)
        }
        
        override fun onLost(network: Network) {
            postValue(false)
        }
    }
    
    override fun onActive() {
        super.onActive()
        val request = NetworkRequest.Builder()
            .build()
        connectivityManager.registerNetworkCallback(request, networkCallback)
    }
    
    override fun onInactive() {
        super.onInactive()
        connectivityManager.unregisterNetworkCallback(networkCallback)
    }
}
```

---

## Push Notifications

### Firebase Cloud Messaging Setup
```kotlin
class FirebaseMessagingService : FirebaseMessagingService() {
    
    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        val notification = remoteMessage.notification
        val data = remoteMessage.data
        
        when (data["type"]) {
            "LEAVE_APPROVAL" -> handleLeaveApproval(data)
            "PAYROLL_READY" -> handlePayrollReady(data)
            "KPI_REMINDER" -> handleKpiReminder(data)
            "COMPLAINT_RESPONSE" -> handleComplaintResponse(data)
            else -> handleGenericNotification(notification)
        }
    }
    
    override fun onNewToken(token: String) {
        TokenManager.saveFcmToken(token)
        // Send token to server
    }
    
    private fun handleLeaveApproval(data: Map<String, String>) {
        val notification = NotificationCompat.Builder(this, "leave_channel")
            .setContentTitle("Leave Request Updated")
            .setContentText(data["message"])
            .setSmallIcon(R.drawable.ic_notification)
            .build()
        
        NotificationManagerCompat.from(this).notify(1, notification)
    }
    
    // Similar handlers for other notification types
}
```

### Notification Channels
```kotlin
class NotificationChannels(private val context: Context) {
    
    fun createChannels() {
        val notificationManager = NotificationManagerCompat.from(context)
        
        // Leave notifications
        val leaveChannel = NotificationChannel(
            "leave_channel",
            "Leave Notifications",
            NotificationManager.IMPORTANCE_HIGH
        )
        notificationManager.createNotificationChannel(leaveChannel)
        
        // Payroll notifications
        val payrollChannel = NotificationChannel(
            "payroll_channel",
            "Payroll Notifications",
            NotificationManager.IMPORTANCE_HIGH
        )
        notificationManager.createNotificationChannel(payrollChannel)
        
        // KPI notifications
        val kpiChannel = NotificationChannel(
            "kpi_channel",
            "KPI Notifications",
            NotificationManager.IMPORTANCE_DEFAULT
        )
        notificationManager.createNotificationChannel(kpiChannel)
        
        // Complaint notifications
        val complaintChannel = NotificationChannel(
            "complaint_channel",
            "Complaint Notifications",
            NotificationManager.IMPORTANCE_DEFAULT
        )
        notificationManager.createNotificationChannel(complaintChannel)
    }
}
```

---

## File Handling

### File Picker
```kotlin
class FilePicker(private val activity: Activity) {
    
    fun pickDocument(
        mimeType: String = "*/*",
        requestCode: Int = FILE_PICKER_REQUEST
    ) {
        val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
            addCategory(Intent.CATEGORY_OPENABLE)
            type = mimeType
        }
        activity.startActivityForResult(intent, requestCode)
    }
    
    fun pickImage(requestCode: Int = IMAGE_PICKER_REQUEST) {
        val intent = Intent(Intent.ACTION_PICK).apply {
            type = "image/*"
        }
        activity.startActivityForResult(intent, requestCode)
    }
    
    companion object {
        const val FILE_PICKER_REQUEST = 1001
        const val IMAGE_PICKER_REQUEST = 1002
    }
}
```

### File Upload
```kotlin
class FileUploader(private val apiService: ApiService) {
    
    suspend fun uploadFile(
        fileUri: Uri,
        onProgress: (Int) -> Unit
    ): Result<String> {
        return try {
            val file = File(fileUri.path ?: return Result.failure(Exception("Invalid file")))
            val requestFile = RequestBody.create(
                MediaType.parse("multipart/form-data"),
                file
            )
            val body = MultipartBody.Part.createFormData("file", file.name, requestFile)
            
            val response = apiService.uploadFile(body)
            Result.success(response.url)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun uploadCv(
        fileUri: Uri,
        applicantId: String
    ): Result<String> {
        return try {
            val file = File(fileUri.path ?: return Result.failure(Exception("Invalid file")))
            val requestFile = RequestBody.create(
                MediaType.parse("application/pdf"),
                file
            )
            val body = MultipartBody.Part.createFormData("cv", file.name, requestFile)
            
            val response = apiService.uploadCv(applicantId, body)
            Result.success(response.url)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
```

### File Download
```kotlin
class FileDownloader(private val context: Context) {
    
    suspend fun downloadFile(url: String, fileName: String): Result<File> {
        return try {
            val request = Request.Builder().url(url).build()
            val response = OkHttpClient().newCall(request).execute()
            
            if (!response.isSuccessful) {
                return Result.failure(Exception("Download failed"))
            }
            
            val file = File(context.getExternalFilesDir(null), fileName)
            file.writeBytes(response.body?.bytes() ?: return Result.failure(Exception("Empty response")))
            
            Result.success(file)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    fun openFile(file: File) {
        val uri = FileProvider.getUriForFile(
            context,
            "${context.packageName}.provider",
            file
        )
        
        val intent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(uri, context.contentResolver.getType(uri))
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        
        context.startActivity(Intent.createChooser(intent, "Open file"))
    }
}
```

---

## Geolocation Features

### Location Service
```kotlin
class LocationService(private val context: Context) {
    
    private val fusedLocationClient = LocationServices.getFusedLocationProviderClient(context)
    
    @SuppressLint("MissingPermission")
    suspend fun getCurrentLocation(): Result<Location> {
        return try {
            val location = fusedLocationClient.getCurrentLocation(
                Priority.PRIORITY_HIGH_ACCURACY,
                CancellationTokenSource().token
            ).await()
            
            Result.success(
                Location(
                    latitude = location.latitude,
                    longitude = location.longitude,
                    accuracy = location.accuracy,
                    timestamp = location.time
                )
            )
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    fun requestLocationPermission(activity: Activity, requestCode: Int) {
        ActivityCompat.requestPermissions(
            activity,
            arrayOf(
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.ACCESS_COARSE_LOCATION
            ),
            requestCode
        )
    }
    
    fun hasLocationPermission(): Boolean {
        return ActivityCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
    }
}
```

### Geofencing (Optional)
```kotlin
class GeofenceManager(private val context: Context) {
    
    private val geofencingClient = LocationServices.getGeofencingClient(context)
    
    fun addGeofence(
        geofenceId: String,
        latitude: Double,
        longitude: Double,
        radius: Float
    ) {
        val geofence = Geofence.Builder()
            .setRequestId(geofenceId)
            .setCircularRegion(latitude, longitude, radius)
            .setExpirationDuration(Geofence.NEVER_EXPIRE)
            .setTransitionTypes(Geofence.GEOFENCE_TRANSITION_ENTER or Geofence.GEOFENCE_TRANSITION_EXIT)
            .build()
        
        val geofencingRequest = GeofencingRequest.Builder()
            .addGeofence(geofence)
            .setInitialTrigger(GeofencingRequest.INITIAL_TRIGGER_ENTER)
            .build()
        
        val pendingIntent = geofencePendingIntent(geofenceId)
        
        geofencingClient.addGeofences(geofencingRequest, pendingIntent)
    }
    
    private fun geofencePendingIntent(geofenceId: String): PendingIntent {
        val intent = Intent(context, GeofenceBroadcastReceiver::class.java)
        return PendingIntent.getBroadcast(
            context,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }
}
```

---

## PDF Generation

### Payslip PDF Generation
```kotlin
class PayslipPdfGenerator(private val context: Context) {
    
    fun generatePayslip(payslip: Payslip): Result<File> {
        return try {
            val file = File(context.getExternalFilesDir(null), "payslip_${payslip.id}.pdf")
            val writer = PdfWriter(file)
            val pdf = PdfDocument(writer)
            val document = Document(pdf)
            
            document.add(Paragraph("Ubuntu HRMS - Payslip").apply {
                setFontSize(20f)
                setBold()
            })
            
            document.add(Paragraph("Employee: ${payslip.employeeName}"))
            document.add(Paragraph("Period: ${payslip.period}"))
            document.add(Paragraph("Generated: ${payslip.generatedDate}"))
            
            document.add(Paragraph("\nEarnings:").setBold())
            payslip.allowances.forEach { allowance ->
                document.add(Paragraph("${allowance.name}: $${allowance.amount}"))
            }
            
            document.add(Paragraph("\nDeductions:").setBold())
            payslip.deductions.forEach { deduction ->
                document.add(Paragraph("${deduction.name}: $${deduction.amount}"))
            }
            
            document.add(Paragraph("\nNet Pay: $${payslip.netPay}").apply {
                setFontSize(16f)
                setBold()
            })
            
            document.close()
            Result.success(file)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
```

---

## Security Considerations

### Data Encryption
```kotlin
class EncryptionManager(private val context: Context) {
    
    private val keyStore = KeyStore.getInstance("AndroidKeyStore").apply {
        load(null)
    }
    
    fun encryptData(data: String, alias: String): String {
        val cipher = Cipher.getInstance(TRANSFORMATION)
        cipher.init(Cipher.ENCRYPT_MODE, getSecretKey(alias))
        val encryptedBytes = cipher.doFinal(data.toByteArray())
        return Base64.encodeToString(encryptedBytes, Base64.DEFAULT)
    }
    
    fun decryptData(encryptedData: String, alias: String): String {
        val cipher = Cipher.getInstance(TRANSFORMATION)
        cipher.init(Cipher.DECRYPT_MODE, getSecretKey(alias))
        val decryptedBytes = cipher.doFinal(Base64.decode(encryptedData, Base64.DEFAULT))
        return String(decryptedBytes)
    }
    
    private fun getSecretKey(alias: String): SecretKey {
        if (!keyStore.containsAlias(alias)) {
            val keyGenerator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore")
            val keyGenSpec = KeyGenParameterSpec.Builder(
                alias,
                KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
            )
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setUserAuthenticationRequired(true)
                .setUserAuthenticationValidityDurationSeconds(300)
                .build()
            keyGenerator.init(keyGenSpec)
            keyGenerator.generateKey()
        }
        return (keyStore.getEntry(alias, null) as KeyStore.SecretKeyEntry).secretKey
    }
    
    companion object {
        private const val TRANSFORMATION = "AES/GCM/NoPadding"
    }
}
```

### Certificate Pinning
```kotlin
class CertificatePinner {
    
    fun getOkHttpClient(): OkHttpClient {
        return OkHttpClient.Builder()
            .certificatePinner(
                CertificatePinner.Builder()
                    .add("yourdomain.com", "sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=")
                    .build()
            )
            .build()
    }
}
```

---

## Performance Optimization

### Image Loading with Coil
```kotlin
@Composable
fun AsyncImageWithCoil(
    url: String,
    modifier: Modifier = Modifier,
    placeholder: Painter? = null
) {
    AsyncImage(
        model = ImageRequest.Builder(LocalContext.current)
            .data(url)
            .crossfade(true)
            .build(),
        contentDescription = null,
        modifier = modifier,
        placeholder = placeholder?.let { { it } }
    )
}
```

### Pagination with Paging 3
```kotlin
class EmployeePagingSource(
    private val apiService: EmployeeApi
) : PagingSource<Int, Employee>() {
    
    override suspend fun load(params: LoadParams<Int>): LoadResult<Int, Employee> {
        return try {
            val page = params.key ?: 1
            val response = apiService.getEmployees(page, params.loadSize)
            
            LoadResult.Page(
                data = response.data,
                prevKey = if (page == 1) null else page - 1,
                nextKey = if (response.data.isEmpty()) null else page + 1
            )
        } catch (e: Exception) {
            LoadResult.Error(e)
        }
    }
    
    override fun getRefreshKey(state: PagingState<Int, Employee>): Int? {
        return state.anchorPosition?.let { anchorPosition ->
            state.closestPageToPosition(anchorPosition)?.prevKey?.plus(1)
                ?: state.closestPageToPosition(anchorPosition)?.nextKey?.minus(1)
        }
    }
}
```

---

## Testing Strategy

### Unit Testing
```kotlin
@ExperimentalCoroutinesApi
class LoginViewModelTest {
    
    private lateinit var viewModel: LoginViewModel
    private val authRepository: AuthRepository = mock()
    private val testDispatcher = UnconfinedTestDispatcher()
    
    @Before
    fun setup() {
        Dispatchers.setMain(testDispatcher)
        viewModel = LoginViewModel(authRepository)
    }
    
    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }
    
    @Test
    fun `login with valid credentials returns success`() = runTest {
        // Given
        val loginRequest = LoginRequest("test@example.com", "password")
        val loginResponse = LoginResponse("token123", User("1", "test@example.com", "Test", "User", UserRole.ADMIN))
        
        whenever(authRepository.login(loginRequest)).thenReturn(Result.success(loginResponse))
        
        // When
        viewModel.login("test@example.com", "password")
        
        // Then
        assertEquals(LoginState.Success, viewModel.loginState.value)
    }
    
    @Test
    fun `login with invalid credentials returns error`() = runTest {
        // Given
        whenever(authRepository.login(any())).thenReturn(Result.failure(Exception("Invalid credentials")))
        
        // When
        viewModel.login("test@example.com", "wrong")
        
        // Then
        assertTrue(viewModel.loginState.value is LoginState.Error)
    }
}
```

### UI Testing
```kotlin
@RunWith(AndroidJUnit4::class)
class LoginActivityTest {
    
    @get:Rule
    val activityRule = ActivityScenarioRule(LoginActivity::class.java)
    
    @Test
    fun login_with_valid_credentials_navigates_to_dashboard() {
        // Enter email
        onView(withId(R.id.etEmail)).perform(typeText("test@example.com"))
        
        // Enter password
        onView(withId(R.id.etPassword)).perform(typeText("password"), closeSoftKeyboard())
        
        // Click login
        onView(withId(R.id.btnLogin)).perform(click())
        
        // Verify navigation to dashboard
        intended(hasComponent(DashboardActivity::class.java.name))
    }
}
```

---

## Deployment Checklist

- [ ] Configure API base URL for production
- [ ] Set up Firebase project for push notifications
- [ ] Configure signing keys for release builds
- [ ] Set up crash reporting (Firebase Crashlytics)
- [ ] Configure analytics (Firebase Analytics)
- [ ] Test on multiple Android versions
- [ ] Test on different screen sizes
- [ ] Test offline functionality
- [ ] Test file upload/download
- [ ] Test biometric authentication
- [ ] Test geolocation features
- [ ] Test PDF generation
- [ ] Performance testing
- [ ] Security audit
- [ ] Accessibility testing

---

## API Endpoints Reference for Android

### Base URL
```
Production: https://api.ubuntuhrms.com/api/
Development: http://localhost:5000/api/
```

### Authentication Endpoints
```
POST /auth/login
POST /auth/register
POST /auth/forgot-password
POST /auth/reset-password
```

### Employee Endpoints
```
GET /employees
GET /employees/:id
POST /employees
PUT /employees/:id
DELETE /employees/:id
```

### Leave Endpoints
```
GET /leave
POST /leave
PUT /leave/:id
DELETE /leave/:id
```

### Attendance Endpoints
```
GET /attendance
POST /attendance
GET /attendance/:id
```

### Payroll Endpoints
```
GET /payroll/payslips
GET /payroll/payslips/:id
POST /payroll/process
```

### KPI Endpoints
```
GET /kpi
POST /kpi
PUT /kpi/:id
POST /kpi/:id/assessment
```

### Job Endpoints
```
GET /jobs
GET /jobs/:id
POST /jobs
POST /jobs/:id/apply
GET /jobs/:id/applicants
```

---

## Role-Based Navigation Matrix

| Screen | Admin | Manager | Supervisor | HR | Employee | Contractor |
|--------|-------|---------|------------|-----|----------|------------|
| Login | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Register | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ |
| Admin Dashboard | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Manager Dashboard | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Employee Dashboard | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| Contractor Dashboard | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |
| Employee Management | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ |
| Leave Management | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Attendance | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ |
| Payroll | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ |
| KPI | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Recruitment | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ |
| Complaints | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ |
| Assets | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Contractors | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Reports | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ |
| Settings | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## Conclusion

This guide provides a comprehensive foundation for implementing the Ubuntu HRMS Android application. The architecture and patterns recommended here follow Android best practices and ensure a maintainable, scalable, and performant application.

For questions or clarifications, refer to the web version user manual or contact the development team.
