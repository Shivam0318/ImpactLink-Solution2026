import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 1. Firebase Config
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


// 2. AI CONFIG (Updated to Stable v1 Endpoint)
const API_KEY = "AIzaSyBsTn3sPHXmh10rMttF0R2PskXOoXOWZjw"; 
const AI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

let myChart = null;

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
    });
}

// 3. BROADCAST LOGIC
const postBtn = document.getElementById('postBtn');
if (postBtn) {
    postBtn.onclick = async () => {
        const title = document.getElementById('oppTitle').value;
        const desc = document.getElementById('oppDesc').value;
        if (!title || !desc) return alert("Fill all fields");
        try {
            await addDoc(collection(db, "opportunities"), { title, description: desc, createdAt: serverTimestamp() });
            alert("Broadcasted!");
            document.getElementById('oppTitle').value = "";
            document.getElementById('oppDesc').value = "";
        } catch (e) { console.error(e); }
    };
}

// 4. REAL-TIME FEED
const myPosts = document.getElementById('myPosts');
onSnapshot(query(collection(db, "opportunities"), orderBy("createdAt", "desc")), (snap) => {
    if (!myPosts) return;
    myPosts.innerHTML = snap.empty ? "<p>No posts yet.</p>" : "";
    snap.forEach(doc => {
        const d = doc.data();
        myPosts.innerHTML += `
            <div class="post-card" style="background:#1e1e1e; padding:15px; margin-bottom:10px; border-radius:8px; border-left:4px solid #00bcd4;">
                <h4 style="color:#00bcd4; margin:0;">${d.title}</h4>
                <p style="color:#ccc;">${d.description}</p>
            </div>`;
    });
});

// 5. THE AI DASHBOARD & GRAPH ANALYZER
const analyzeBtn = document.getElementById('analyzeBtn');
const aiOutput = document.getElementById('aiOutput');

if (analyzeBtn) {
    analyzeBtn.onclick = async () => {
        aiOutput.innerHTML = "<p style='color:#00bcd4;'>🤖 AI is generating your impact report...</p>";

        const cards = document.querySelectorAll('.post-card');
        const textToAnalyze = Array.from(cards).map(c => {
            // This ensures the AI sees the Title AND the Description where the sub-area lives
            return `Title: ${c.querySelector('h4').innerText} | Info: ${c.querySelector('p').innerText}`;
        }).join("\n---\n");

        if (!textToAnalyze) {
            aiOutput.innerHTML = "<p style='color:red;'>Add some posts first!</p>";
            return;
        }

       const prompt = `
            Analyze these NGO requirements: ${textToAnalyze}.
            
            STRICT MAPPING RULES:
            1. DO NOT group by city (e.g., do not just say 'Lucknow').
            2. Extract the specific NEIGHBORHOOD or AREA name for each bar (e.g., 'Hazratganj', 'Alambagh', 'Indira Nagar').
            3. If multiple tasks are in the same area, create separate labels like 'Hazratganj (1)', 'Hazratganj (2)'.
            4. Each item in the 'labels' array MUST correspond 1:1 with an item in the 'scores' array.
            
            RETURN ONLY THIS JSON:
            {
            "labels": ["Specific Area 1", "Specific Area 2", "Specific Area 3"],
            "scores": [9, 7, 5],
            "summary": "Focus on [Specific Area] as the primary hotspot."
            }
        `;
        try {
            const response = await fetch(AI_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });

            const result = await response.json();

            // SAFETY CHECK: Ensure result.candidates exists before reading [0]
            if (result.candidates && result.candidates.length > 0) {
                const rawText = result.candidates[0].content.parts[0].text;
                const jsonStr = rawText.substring(rawText.indexOf('{'), rawText.lastIndexOf('}') + 1);
                const data = JSON.parse(jsonStr);

                document.getElementById('reportDashboard').style.display = "block";
                document.getElementById('aiReportText').innerHTML = data.summary;
                aiOutput.innerHTML = "Report Generated ✅";

                const ctx = document.getElementById('priorityChart').getContext('2d');
                if (myChart) myChart.destroy();
                   myChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: data.labels, // These will now be your Area names
                        datasets: [{
                            label: 'Priority by Location',
                            data: data.scores,
                            backgroundColor: '#00bcd4',
                            maxBarThickness: 35
                        }]
                    },
                    options: {
                        scales: {
                            x: {
                                ticks: {
                                    autoSkip: false, // <--- This forces every Area name to show
                                    maxRotation: 45, // <--- Tilts the names so they fit
                                    minRotation: 45,
                                    color: '#ffffff'
                                }
                            },
                            y: {
                                beginAtZero: true,
                                max: 10,
                                ticks: { color: '#ffffff' }
                            }
                        }
                    }
                });
            } else {
                throw new Error(result.error?.message || "AI Model not responding. Check API key.");
            }
        } catch (err) {
            console.error("Dashboard Error:", err);
            aiOutput.innerHTML = `<p style='color:red;'>Error: ${err.message}</p>`;
        }
    };
}

// 6. LOGOUT
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.onclick = () => signOut(auth).then(() => window.location.href = "index.html");
}