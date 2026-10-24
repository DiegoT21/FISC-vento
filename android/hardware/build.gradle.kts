plugins {
    id("com.android.library")
    id("org.jetbrains.kotlin.android")
}
android {
    namespace = "com.fiscvento.hardware"
    compileSdk = 35
    defaultConfig { minSdk = 33 }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
}
dependencies {
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0")
    // AGP 8 no empaqueta AAR locales dentro de un AAR de librería: usamos los JAR extraídos.
    // El AAR original queda en libs/ como referencia (rfidapi3lib-2.0.5.292.aar).
    implementation(files("libs/rfidapi3-classes.jar", "libs/rfidserviceapi.jar"))
    testImplementation("junit:junit:4.13.2")
}
