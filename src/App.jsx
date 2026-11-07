import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, doc, onSnapshot, setDoc, getDoc, addDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { QRCodeCanvas } from 'qrcode.react';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const TEACHER_EMAILS = ['teacher@example.com', 'admin@example.com'];
const ATTENDANCE_COLLECTION = 'attendance_dev';
const SCHEDULE_COLLECTION = 'schedule_dev';

const AI_SUGGESTIONS = [
    { title: 'Practice Quiz', description: 'Take a 5-min quiz on Newtonian Physics.', icon: '📝', link: 'https://www.khanacademy.org/science/physics' },
    { title: 'Coding Challenge', description: 'Solve a beginner-level Python problem on loops.', icon: '💻', link: 'https://www.hackerrank.com/domains/python' },
    { title: 'Build Your Resume', description: 'Add a new skill or project to your resume.', icon: '📄', link: 'https://www.indeed.com/career-advice/resumes-cover-letters/how-to-make-a-resume' },
    { title: 'Learn a New Concept', description: 'Watch a short video about Quantum Computing.', icon: '🎥', link: 'https://www.youtube.com/watch?v=F_Riqjdh2oM' },
];

// --- Helper Components & Icons ---
const Icon = ({ name, className }) => {
    const icons = {
        user: <><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
        users: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
        login: <><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></>,
        clipboard: <><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></>,
        check: <polyline points="20 6 9 17 4 12"/>,
        x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
        qrCode: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>,
        lightbulb: <><path d="M9 18h6v2H9z"/><path d="M12 2C9.24 2 7 4.24 7 7c0 2.05 1.2 3.81 3 4.58V14h4v-2.42c1.8-.77 3-2.53 3-4.58c0-2.76-2.24-5-5-5z"/></>,
        face: <><path d="M12 2a10 10 0 0 0-10 10c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.1.39-1.99 1.03-2.69a3.6 3.6 0 0 1 .1-2.64s.84-.27 2.75 1.02a9.58 9.58 0 0 1 5 0c1.91-1.3 2.75-1.02 2.75-1.02.55 1.37.2 2.4.1 2.64.64.7 1.03 1.6 1.03 2.69 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.75c0 .27.16.59.67.5A10 10 0 0 0 22 12c0-5.52-4.48-10-10-10z"/></>,
        wifi: <><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" x2="12.01" y1="20" y2="20"/></>,
        barChart: <><line x1="12" x2="12" y1="20" y2="10" /><line x1="18" x2="18" y1="20" y2="4" /><line x1="6" x2="6" y1="20" y2="16" /></>,
        calendar: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>,
        plus: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
        trash: <><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></>,
        circle: <circle cx="12" cy="12" r="10" />
    };
    return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>{icons[name]}</svg>;
};

const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

// --- Main Application Component ---
export default function App() {
    const [userProfile, setUserProfile] = useState(null);
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(true);
    const [scannerReady, setScannerReady] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                const userDocRef = doc(db, ATTENDANCE_COLLECTION, currentUser.uid);
                const docSnap = await getDoc(userDocRef);
                const role = TEACHER_EMAILS.includes(currentUser.email) ? 'teacher' : 'student';
                let name = '';
                if (docSnap.exists()) {
                    name = docSnap.data().name;
                } else {
                    const derivedName = capitalize(currentUser.email.split('@')[0]);
                    await setDoc(userDocRef, { name: derivedName, email: currentUser.email, attendance: {} });
                    name = derivedName;
                }
                setUserProfile({ ...currentUser, role, name });
            } else {
                setUserProfile(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);
    
    useEffect(() => {
        const scheduleQuery = query(collection(db, SCHEDULE_COLLECTION), orderBy("time"));
        const unsubscribe = onSnapshot(scheduleQuery, (snapshot) => {
            setSchedule(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const loadScript = (id, src, onReady) => {
            if (document.getElementById(id)) {
                onReady();
                return;
            }
            const script = document.createElement('script');
            script.id = id;
            script.src = src;
            script.async = true;
            script.onload = () => onReady();
            document.body.appendChild(script);
        };
        loadScript('html5-qrcode-script', "https://cdnjs.cloudflare.com/ajax/libs/html5-qrcode/2.3.8/html5-qrcode.min.js", () => setScannerReady(true));
    }, []);

    if (loading) {
        return <div className="flex items-center justify-center h-screen bg-gray-100"><div className="text-lg font-semibold">Authenticating...</div></div>;
    }

    if (!userProfile) {
        return <LoginScreen />;
    }

    return (
        <div className="bg-gray-50 min-h-screen font-sans">
            <style>{`.animate-fade-in { animation: fadeIn 0.5s ease-out forwards; } @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
            <Header user={userProfile} />
            <main className="p-4 md:p-8">
                {userProfile.role === 'student' && <StudentDashboard user={userProfile} schedule={schedule} scannerReady={scannerReady} />}
                {userProfile.role === 'teacher' && <TeacherDashboard schedule={schedule} />}
            </main>
        </div>
    );
}

// --- Screens & Components ---
function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState('');

    const handleAuthAction = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (isSignUp) {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                const name = capitalize(user.email.split('@')[0]);
                await setDoc(doc(db, ATTENDANCE_COLLECTION, user.uid), {
                    name: name,
                    email: user.email,
                    attendance: {}
                });
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100 p-4">
            <div className="w-full max-w-sm mx-auto bg-white p-8 rounded-2xl shadow-lg">
                <div className="flex justify-center items-center mb-6"><div className="bg-indigo-600 p-3 rounded-xl"><Icon name="clipboard" className="text-white w-8 h-8" /></div></div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">{isSignUp ? 'Create Account' : 'Welcome Back'}</h1>
                <p className="text-gray-500 mb-8 text-center">{isSignUp ? 'Enter your details to get started.' : 'Please sign in to continue.'}</p>
                <form onSubmit={handleAuthAction} className="space-y-4">
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Address" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"/>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required minLength="6" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"/>
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors shadow-md">{isSignUp ? 'Sign Up' : 'Login'}</button>
                </form>
                <div className="mt-6 text-center">
                    <button onClick={() => setIsSignUp(!isSignUp)} className="text-sm font-medium text-indigo-600 hover:underline">
                        {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function Header({ user }) {
    return (
        <header className="bg-white shadow-sm p-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="bg-indigo-600 p-2 rounded-lg"><Icon name="clipboard" className="text-white w-6 h-6" /></div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-800">SmartCurric+</h1>
            </div>
            <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700 hidden sm:block">Welcome, {user.name}!</span>
                <button onClick={() => signOut(auth)} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">
                    Logout <Icon name="login" className="w-4 h-4" />
                </button>
            </div>
        </header>
    );
}

function InfoModal({ message, onClose }) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-sm mx-4">
                <h3 className="text-lg font-bold text-gray-800 mb-4">{message}</h3>
                <button onClick={onClose} className="bg-indigo-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-indigo-700 transition-colors">Close</button>
            </div>
        </div>
    );
}

function StudentDashboard({ user, schedule, scannerReady }) {
    const [attendance, setAttendance] = useState({});
    const [suggestion, setSuggestion] = useState(null);
    const [isScannerOpen, setScannerOpen] = useState(false);
    const [infoModal, setInfoModal] = useState({ isOpen: false, message: '' });

    useEffect(() => {
        const studentDocRef = doc(db, ATTENDANCE_COLLECTION, user.uid);
        const unsubscribe = onSnapshot(studentDocRef, (doc) => {
            if (doc.exists()) {
                setAttendance(doc.data().attendance || {});
            }
        });
        return unsubscribe;
    }, [user.uid]);

    const scheduleWithAttendance = useMemo(() => {
        return schedule.map(item => ({
            ...item,
            attended: attendance[item.subject] === true,
        }));
    }, [schedule, attendance]);

    const markAttendance = useCallback(async (subject) => {
        const allSubjects = schedule.map(item => item.subject);
        if (!allSubjects.includes(subject)) {
            setInfoModal({ isOpen: true, message: `"${subject}" is not a valid class code.`});
            return;
        }
        const studentDocRef = doc(db, ATTENDANCE_COLLECTION, user.uid);
        try {
            await setDoc(studentDocRef, { attendance: { [subject]: true } }, { merge: true });
            setScannerOpen(false);
        } catch (error) { console.error("Error marking attendance: ", error); }
    }, [schedule, user.uid]);

    const handleDummyClick = (feature) => setInfoModal({ isOpen: true, message: `${feature} feature is coming soon!`});
    const getSuggestion = () => setSuggestion(AI_SUGGESTIONS[Math.floor(Math.random() * AI_SUGGESTIONS.length)]);
    
    const attendanceSummary = useMemo(() => {
        const totalClasses = scheduleWithAttendance.filter(s => s.type === 'class').length;
        const attendedClasses = scheduleWithAttendance.filter(s => s.attended).length;
        return totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0;
    }, [scheduleWithAttendance]);

    return (
        <>
            {isScannerOpen && scannerReady && <QrScannerModal onClose={() => setScannerOpen(false)} onScanSuccess={markAttendance} />}
            {infoModal.isOpen && <InfoModal message={infoModal.message} onClose={() => setInfoModal({ isOpen: false, message: '' })} />}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <div className="bg-white p-6 rounded-xl shadow-md mb-8">
                        <h2 className="text-2xl font-bold text-gray-800">Hello, {user.name}!</h2>
                        <p className="text-gray-500 mb-6">Here's your plan for today.</p>
                        <div className="bg-indigo-50 p-4 rounded-lg mb-6">
                            <div className="text-sm text-indigo-700 font-semibold">Overall Attendance</div>
                            <div className="text-3xl font-bold text-indigo-600">{attendanceSummary}%</div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                             <button onClick={() => setScannerOpen(true)} disabled={!scannerReady} className="p-3 bg-green-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all transform hover:scale-105 shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed">
                                <Icon name="qrCode" className="w-5 h-5"/><span>{scannerReady ? 'QR Scan' : 'Loading...'}</span>
                            </button>
                             <button onClick={() => handleDummyClick('Face Recognition')} className="p-3 bg-blue-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 shadow-md transition-all transform hover:scale-105">
                                <Icon name="face" className="w-5 h-5"/><span>Face Rec</span>
                            </button>
                             <button onClick={() => handleDummyClick('WiFi Proximity')} className="p-3 bg-purple-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 shadow-md transition-all transform hover:scale-105">
                                <Icon name="wifi" className="w-5 h-5"/><span>WiFi</span>
                            </button>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-md">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Daily Routine</h3>
                        <div className="space-y-4">
                            {scheduleWithAttendance.map((item, index) => (
                                <div key={item.id || index} className="flex items-center gap-4">
                                    <div className="w-20 text-right font-semibold text-gray-600">{item.time}</div>
                                    <div className={`w-4 h-4 rounded-full ${item.type === 'class' ? 'bg-indigo-500' : 'bg-gray-400'}`}></div>
                                    <div className="w-full bg-gray-100 p-3 rounded-lg flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-gray-800">{item.subject}</p>
                                            {item.room && <p className="text-sm text-gray-500">Room: {item.room}</p>}
                                        </div>
                                        {item.type === 'class' && (
                                            item.attended ? <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 flex items-center gap-1.5"><Icon name="check" className="w-3.5 h-3.5"/>Present</span>
                                                          : <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 flex items-center gap-1.5"><Icon name="x" className="w-3.5 h-3.5"/>Absent</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><Icon name="lightbulb" className="text-yellow-500"/> AI Suggestions</h3>
                    <p className="text-gray-500 mb-6">Suggestions for your free periods.</p>
                    <button onClick={getSuggestion} className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-indigo-700 transition-transform transform hover:scale-105 mb-6">What should I do now?</button>
                    {suggestion && (
                        <div className="bg-indigo-50 border-l-4 border-indigo-400 p-4 rounded-lg animate-fade-in">
                            <div className="flex items-start gap-3">
                                <span className="text-2xl">{suggestion.icon}</span>
                                <div>
                                    <h4 className="font-bold text-indigo-800">{suggestion.title}</h4>
                                    <p className="text-sm text-indigo-700 mb-2">{suggestion.description}</p>
                                    <a href={suggestion.link} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-indigo-600 hover:underline">
                                        Learn more &rarr;
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

function QrScannerModal({ onClose, onScanSuccess }) {
    const scannerRef = useRef(null);
    const containerRef = useRef(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;
        let scanner = null;

        const startScanner = async () => {
            try {
                // Check for cameras
                const devices = await window.Html5Qrcode.getCameras();
                if (devices && devices.length > 0) {
                    // Initialize scanner
                    scanner = new window.Html5Qrcode("qr-reader");
                    scannerRef.current = scanner;

                    await scanner.start(
                        { facingMode: "environment" }, // prefer back camera
                        {
                            fps: 10,
                            qrbox: { width: 250, height: 250 }
                        },
                        (decodedText) => {
                            if (isMounted) {
                                onScanSuccess(decodedText);
                            }
                        },
                        () => {} // Ignore errors to prevent console spam
                    );
                } else {
                    setError("No camera found");
                }
            } catch (err) {
                setError(`Failed to start scanner: ${err.message}`);
                console.error("Scanner error:", err);
            }
        };

        // Ensure container exists and is ready
        if (containerRef.current) {
            containerRef.current.innerHTML = ""; // Clear any existing content
            containerRef.current.id = "qr-reader";

            // Small delay to ensure DOM is ready
            setTimeout(() => {
                if (window.Html5Qrcode && isMounted) {
                    startScanner();
                }
            }, 100);
        }

        return () => {
            isMounted = false;
            if (scannerRef.current) {
                scannerRef.current.stop()
                    .then(() => {
                        if (scannerRef.current) {
                            scannerRef.current.clear();
                        }
                    })
                    .catch(console.error);
            }
        };
    }, [onScanSuccess]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <style>
                {`
                    #qr-reader {
                        width: 100% !important;
                        border: none !important;
                    }
                    #qr-reader video {
                        border-radius: 0.75rem;
                        border: 2px solid white;
                    }
                    /* Hide unnecessary HTML5QRCode elements */
                    #qr-reader__header_message,
                    #qr-reader__dashboard_section_csr,
                    #qr-reader__dashboard_section_swaplink,
                    #qr-reader__status_span {
                        display: none !important;
                    }
                `}
            </style>
            <div className="bg-white p-6 rounded-xl shadow-2xl relative w-full max-w-md">
                <h3 className="text-xl font-bold text-center mb-4">Scan Classroom QR Code</h3>
                {error ? (
                    <div className="text-red-500 text-center p-4">
                        {error}
                    </div>
                ) : (
                    <div ref={containerRef} className="w-full"></div>
                )}
                <button 
                    onClick={onClose} 
                    className="absolute top-3 right-3 bg-gray-200 text-gray-800 rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-300"
                >
                    &times;
                </button>
            </div>
        </div>
    );
}
function TeacherDashboard({ schedule, qrLibReady }) {
    const [activeTab, setActiveTab] = useState('live');
    const [loadingSchedule, setLoadingSchedule] = useState(true);
    
    useEffect(() => {
        if(schedule.length > 0) {
            setLoadingSchedule(false)
        } else {
             setLoadingSchedule(false)
        }
    }, [schedule])

    const tabButtonClasses = (tabName) => `py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tabName ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`;

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-6">
                    <button onClick={() => setActiveTab('live')} className={tabButtonClasses('live')}>Live Classroom</button>
                    <button onClick={() => setActiveTab('reports')} className={tabButtonClasses('reports')}>Reports</button>
                    <button onClick={() => setActiveTab('schedule')} className={tabButtonClasses('schedule')}>Manage Schedule</button>
                    <button onClick={() => setActiveTab('qr')} className={tabButtonClasses('qr')}>QR Tools</button>
                </nav>
            </div>
            
            <div className="min-h-[400px]">
                {activeTab === 'live' && <LiveAttendanceView schedule={schedule} loading={loadingSchedule} />}
                {activeTab === 'reports' && <ReportsDashboard schedule={schedule} loading={loadingSchedule} />}
                {activeTab === 'schedule' && <ManageSchedule schedule={schedule} loading={loadingSchedule} />}
                {activeTab === 'qr' && <QrTools schedule={schedule} loading={loadingSchedule} qrLibReady={qrLibReady} />}
            </div>
        </div>
    );
}

function LiveAttendanceView({ schedule, loading }) {
    const [students, setStudents] = useState([]);
    const [loadingStudents, setLoadingStudents] = useState(true);

    useEffect(() => {
        const attendanceColRef = collection(db, ATTENDANCE_COLLECTION);
        const unsubscribe = onSnapshot(attendanceColRef, (snapshot) => {
            const allUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setStudents(allUsers.filter(user => !TEACHER_EMAILS.includes(user.email)));
            setLoadingStudents(false);
        });
        return () => unsubscribe();
    }, []);

    const toggleAttendance = async (studentId, subject) => {
        const studentDocRef = doc(db, ATTENDANCE_COLLECTION, studentId);
        const student = students.find(s => s.id === studentId);
        if (!student) return;

        const currentStatus = student.attendance?.[subject];
        let newStatus;
        if (currentStatus === true) newStatus = false;
        else if (currentStatus === false) newStatus = undefined;
        else newStatus = true;

        const updatedAttendance = { ...student.attendance, [subject]: newStatus };
        if (newStatus === undefined) delete updatedAttendance[subject];

        await setDoc(studentDocRef, { attendance: updatedAttendance }, { merge: true });
    };
    
    if (loading || loadingStudents) return <div className="text-center p-8 font-semibold">Loading Live Attendance...</div>;

    const subjects = schedule.filter(c => c.type === 'class').map(c => c.subject);

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Live Classroom Display</h2>
            <p className="text-gray-500 mb-6">Real-time attendance status for all students. Click an icon to toggle status.</p>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="border-b bg-gray-50">
                        <tr>
                            <th className="p-3 font-semibold text-gray-600">Student Name</th>
                            {subjects.map(subject => <th key={subject} className="p-3 font-semibold text-gray-600 text-center">{subject}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {students.map(student => (
                            <tr key={student.id} className="border-b hover:bg-gray-50">
                                <td className="p-3 font-medium text-gray-800">{student.name}</td>
                                {subjects.map(subject => {
                                    const status = student.attendance?.[subject];
                                    let icon = <Icon name="circle" className="w-5 h-5 text-gray-400"/>;
                                    if (status === true) icon = <Icon name="check" className="w-5 h-5 text-green-600"/>;
                                    if (status === false) icon = <Icon name="x" className="w-5 h-5 text-red-600"/>;
                                    
                                    return (
                                        <td key={subject} className="p-3 text-center">
                                            <button onClick={() => toggleAttendance(student.id, subject)} className="mx-auto flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-200 transition-colors">
                                                {icon}
                                            </button>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function ReportsDashboard({ schedule, loading }) {
    const [students, setStudents] = useState([]);
    const [loadingStudents, setLoadingStudents] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState(null);

    useEffect(() => {
        const attendanceColRef = collection(db, ATTENDANCE_COLLECTION);
        const unsubscribe = onSnapshot(attendanceColRef, (snapshot) => {
            const allUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const studentsOnly = allUsers.filter(user => !TEACHER_EMAILS.includes(user.email));
            
            const totalClasses = schedule.filter(c => c.type === 'class').length;
            
            const processedData = studentsOnly.map(student => {
                const attendedClasses = student.attendance ? Object.values(student.attendance).filter(val => val === true).length : 0;
                const percentage = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0;
                return { ...student, attendedClasses, totalClasses, percentage };
            });
            
            setStudents(processedData);
            setLoadingStudents(false);
        });
        return () => unsubscribe();
    }, [schedule]);

    if (loading || loadingStudents) return <div className="text-center p-8 font-semibold">Loading Reports...</div>;

    return (
        <>
            {selectedStudent && <StudentDetailModal student={selectedStudent} schedule={schedule} onClose={() => setSelectedStudent(null)} />}
            <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-1">Attendance Reports</h2>
                <p className="text-gray-500 mb-6">Summary of student attendance records. Click a name for details.</p>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b bg-gray-50">
                            <tr>
                                <th className="p-3 font-semibold text-gray-600">Student Name</th>
                                <th className="p-3 font-semibold text-gray-600 text-center">Classes Attended</th>
                                <th className="p-3 font-semibold text-gray-600">Attendance %</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map(student => (
                                <tr key={student.id} className="border-b hover:bg-gray-50">
                                    <td className="p-3 font-medium">
                                        <button onClick={() => setSelectedStudent(student)} className="text-indigo-600 hover:underline">{student.name}</button>
                                    </td>
                                    <td className="p-3 font-medium text-gray-800 text-center">{student.attendedClasses} / {student.totalClasses}</td>
                                    <td className="p-3">
                                        <div className="w-full bg-gray-200 rounded-full h-4"><div className="bg-gradient-to-r from-blue-400 to-indigo-500 h-4 rounded-full text-xs font-medium text-white text-center p-0.5 leading-none" style={{ width: `${student.percentage}%` }}>{student.percentage}%</div></div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

function StudentDetailModal({ student, schedule, onClose }) {
    const classes = schedule.filter(item => item.type === 'class');
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-xl shadow-2xl relative w-full max-w-lg">
                <h3 className="text-xl font-bold mb-1">{student.name}</h3>
                <p className="text-sm text-gray-500 mb-4">{student.email}</p>
                <div className="space-y-2">
                    {classes.map(c => {
                        const status = student.attendance?.[c.subject];
                        let statusText = <span className="font-semibold text-gray-500">Unmarked</span>;
                        if (status === true) statusText = <span className="font-semibold text-green-600">Present</span>;
                        if (status === false) statusText = <span className="font-semibold text-red-600">Absent</span>;
                        
                        return (
                            <div key={c.id} className="flex justify-between items-center bg-gray-100 p-2 rounded-md">
                                <span className="text-gray-800">{c.subject}</span>
                                {statusText}
                            </div>
                        );
                    })}
                </div>
                <button onClick={onClose} className="absolute top-3 right-3 bg-gray-200 text-gray-800 rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-300">&times;</button>
            </div>
        </div>
    );
}

function ManageSchedule({ schedule, loading }) {
    const [newClass, setNewClass] = useState({ subject: '', time: '', room: '' });

    const handleAddClass = async (e) => {
        e.preventDefault();
        if (!newClass.subject || !newClass.time) {
            alert("Subject and Time are required.");
            return;
        }
        await addDoc(collection(db, SCHEDULE_COLLECTION), { ...newClass, type: 'class' });
        setNewClass({ subject: '', time: '', room: '' });
    };

    const handleDeleteClass = async (id) => {
        if (window.confirm("Are you sure you want to delete this class?")) {
            await deleteDoc(doc(db, SCHEDULE_COLLECTION, id));
        }
    };

    if (loading) return <div className="text-center p-8 font-semibold">Loading Schedule...</div>;

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Manage Schedule</h2>
            <p className="text-gray-500 mb-6">Add or remove classes from the school timetable.</p>
            
            <form onSubmit={handleAddClass} className="mb-8 p-4 border rounded-lg bg-gray-50 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Subject Name</label>
                    <input type="text" value={newClass.subject} onChange={e => setNewClass({...newClass, subject: e.target.value})} placeholder="e.g., Chemistry" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Time</label>
                    <input type="text" value={newClass.time} onChange={e => setNewClass({...newClass, time: e.target.value})} placeholder="e.g., 04:00 PM" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                </div>
                <div>
                     <button type="submit" className="w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"><Icon name="plus" className="w-5 h-5"/> Add Class</button>
                </div>
            </form>

            <div className="space-y-3">
                {schedule.map(item => (
                    <div key={item.id} className="flex justify-between items-center bg-gray-100 p-3 rounded-lg">
                        <div>
                            <p className="font-bold text-gray-800">{item.subject}</p>
                            <p className="text-sm text-gray-600">{item.time}{item.room && `, Room: ${item.room}`}</p>
                        </div>
                        <button onClick={() => handleDeleteClass(item.id)} className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100 transition-colors">
                            <Icon name="trash" className="w-5 h-5"/>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

function QrTools({ schedule, loading }) {
    const [selectedSubject, setSelectedSubject] = useState('');

    useEffect(() => {
        const classSubjects = schedule.filter(s => s.type === 'class');
        if (classSubjects.length > 0) {
            const currentSelectionIsValid = classSubjects.some(c => c.subject === selectedSubject);
            if (!currentSelectionIsValid) {
                setSelectedSubject(classSubjects[0].subject);
            }
        } else {
             setSelectedSubject('');
        }
    }, [schedule, selectedSubject]);


    if (loading) return <div className="text-center p-8 font-semibold">Loading Tools...</div>;

    const classes = schedule.filter(s => s.type === 'class');

    if (classes.length === 0) {
        return (
            <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-1">QR Code Generator</h2>
                <p className="text-gray-500">Please add a class in the "Manage Schedule" tab first.</p>
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">QR Code Generator</h2>
            <p className="text-gray-500 mb-6">Select a class to generate its unique QR code for attendance.</p>
            
            <div className="max-w-xs mb-6">
                <label className="block text-sm font-medium text-gray-700">Select Class</label>
                <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                    {classes.map(item => (
                        <option key={item.id} value={item.subject}>{item.subject}</option>
                    ))}
                </select>
            </div>
            
            {selectedSubject && (
                 <div className="bg-gray-50 p-6 rounded-lg inline-block shadow-inner">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(selectedSubject)}`} alt={`QR Code for ${selectedSubject}`} />
                    <p className="text-center font-semibold text-gray-800 mt-4">QR Code for: {selectedSubject}</p>
                </div>
            )}
        </div>
    );
}
