// 1. Ek dum saaf imports (Sirf ek-ek baar)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 2. Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDSvr3e2K4bSXDvPn_l4Acgq12c_wOCRGs",
  authDomain: "impactlink-solution2026.firebaseapp.com",
  projectId: "impactlink-solution2026",
  storageBucket: "impactlink-solution2026.firebasestorage.app",
  messagingSenderId: "818904553573",
  appId: "1:818904553573:web:3cf4d1888cd2785a810e8c"
};

// 3. INITIALIZE SERVICES (Sirf ek baar!)
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

console.log("✅ Firebase Initialized. Ready for Sign Up / Login.");

// 4. SIGN UP LOGIC
const signUpBtn = document.getElementById('signUpBtn');
if (signUpBtn) {
    signUpBtn.addEventListener('click', async () => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const role = document.getElementById('role').value;

        console.log("Attempting Sign Up for:", email);

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await setDoc(doc(db, "users", user.uid), {
                email: email,
                role: role,
                createdAt: new Date()
            });

            // Inside your signUpBtn listener, after the alert
            alert("Registration Successful! Account type: " + role);

                if (role === "ngo") {
                    window.location.href = "ngo-dashboard.html";
                } else {
                    window.location.href = "volunteer-dashboard.html";
                }

            } catch (error) {
                console.error("Sign Up Error:", error.code);
                alert("Error: " + error.message);
            } // This closes the 'try'
        }); // This closes the 'addEventListener'
}

// 5. LOGIN LOGIC

// LOGIN LOGIC
const loginBtn = document.getElementById('loginBtn');

if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            // 1. Sign in the user
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Get their role from Firestore
            const userDoc = await getDoc(doc(db, "users", user.uid));
            
            if (userDoc.exists()) {
                const role = userDoc.data().role;
                alert("Welcome back! Logging in as " + role);
                
                // 3. Redirect based on role
                if (role === "ngo") {
                    window.location.href = "ngo-dashboard.html";
                } else {
                    window.location.href = "volunteer-dashboard.html";
                }
            } else {
                alert("User record not found in database.");
            }
        } catch (error) {
            console.error("Login Error:", error.code);
            alert("Login Failed: " + error.message);
        }
    });
}