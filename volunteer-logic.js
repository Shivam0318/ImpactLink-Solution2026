import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, query, orderBy, onSnapshot, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDSvr3e2K4bSXDvPn_l4Acgq12c_wOCRGs",
    authDomain: "impactlink-solution2026.firebaseapp.com",
    projectId: "impactlink-solution2026",
    storageBucket: "impactlink-solution2026.firebasestorage.app",
    messagingSenderId: "818904553573",
    appId: "1:818904553573:web:3cf4d1888cd2785a810e8c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// 1. Wait for Auth to be ready before fetching data
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User is logged in:", user.email);
        loadVolunteerData(user.email);
    } else {
        console.log("No user logged in. Redirecting...");
        window.location.href = "index.html";
    }
});

function loadVolunteerData(userEmail) {
    const volunteerFeed = document.getElementById('volunteerFeed');
    const activeMissions = document.getElementById('activeMissions');

    // Use a simpler query first to ensure it works without complex indexes
    const q = query(collection(db, "opportunities"), orderBy("createdAt", "desc"));

    onSnapshot(q, (snapshot) => {
        console.log("Snapshot received! Card count:", snapshot.size);
        
        volunteerFeed.innerHTML = "";
        activeMissions.innerHTML = "";

        if (snapshot.empty) {
            volunteerFeed.innerHTML = "<p style='color:gray;'>No available opportunities found.</p>";
            return;
        }

        snapshot.forEach((opportunity) => {
            const data = opportunity.data();
            const id = opportunity.id;

            // LOGIC: Is it available or did I claim it?
            const isAvailable = !data.status || data.status === "Available";
            const isMine = data.claimedBy === userEmail && data.status !== "Completed";

            if (isMine) {
                activeMissions.innerHTML += `
                    <div style="background:#1a1a1a; padding:15px; border-left:5px solid #4caf50; margin-bottom:10px; border-radius:8px;">
                        <h4 style="margin:0;">${data.title}</h4>
                        <p style="font-size:12px; color:#aaa;">Status: ${data.workStatus || 'Started'}</p>
                        <div style="margin-top:10px;">
                            <button onclick="updateStatus('${id}', 'On Site')" style="cursor:pointer; padding:5px 10px;">Arrived</button>
                            <button onclick="updateStatus('${id}', 'Completed')" style="cursor:pointer; padding:5px 10px; background:#4caf50; border:none; color:white;">Finish</button>
                        </div>
                    </div>`;
            } else if (isAvailable) {
                volunteerFeed.innerHTML += `
                    <div style="background:#1a1a1a; padding:15px; border-left:5px solid #00bcd4; margin-bottom:10px; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <h4 style="margin:0; color:#00bcd4;">${data.title}</h4>
                            <p style="margin:5px 0; font-size:13px; color:#ccc;">${data.description}</p>
                        </div>
                        <button onclick="claimTask('${id}')" style="background:#00bcd4; border:none; padding:8px 15px; border-radius:5px; cursor:pointer; font-weight:bold;">Claim</button>
                    </div>`;
            }
        });
    }, (error) => {
        console.error("Firestore Subscription Error:", error);
        volunteerFeed.innerHTML = "<p style='color:red;'>Error loading data. Check console.</p>";
    });
}

// 2. Claim & Update Functions (Made Global for HTML buttons)
window.claimTask = async (id) => {
    try {
        const ref = doc(db, "opportunities", id);
        await updateDoc(ref, {
            status: "Claimed",
            claimedBy: auth.currentUser.email,
            workStatus: "Assigned"
        });
        alert("Mission Accepted!");
    } catch (e) { console.error(e); }
};

window.updateStatus = async (id, status) => {
    try {
        const ref = doc(db, "opportunities", id);
        const update = { workStatus: status };
        if (status === "Completed") update.status = "Completed";
        await updateDoc(ref, update);
    } catch (e) { console.error(e); }
};

// 3. Logout
document.getElementById('logoutBtn').onclick = () => signOut(auth);