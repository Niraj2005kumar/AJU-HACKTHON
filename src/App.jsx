import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, doc, getDoc, setDoc, query, where } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { 
  ShieldCheck, Fingerprint, Lock, ArrowRight, Building2, 
  FileText, GraduationCap, Map, LogOut, FilePlus, 
  Database, Upload, ExternalLink, UserCircle, CreditCard,
  User, Phone, Home, BookOpen, Users, CheckCircle2
} from 'lucide-react';

const firebaseConfig = {
  apiKey: "AIzaSyAha5EXW7rTnz3YLLQBXZLVmCw3Oq5jGuk",
  authDomain: "doc-1-79294.firebaseapp.com",
  projectId: "doc-1-79294",
  storageBucket: "doc-1-79294.firebasestorage.app",
  messagingSenderId: "330580198333",
  appId: "1:330580198333:web:a692fca2124f35fa9c88d4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const DEPARTMENTS = [
  { id: 'UIDAI', name: 'Aadhaar (UIDAI)', docType: 'Aadhaar Card', icon: Fingerprint, color: 'text-orange-600', bg: 'bg-orange-50' },
  { id: 'PAN', name: 'Income Tax (PAN)', docType: 'PAN Card', icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'CBSE', name: 'Education (CBSE)', docType: 'Marksheet', icon: GraduationCap, color: 'text-emerald-600', bg: 'bg-emerald-50' }
];

// --- 1. IDENTITY INITIALIZATION ---
const ProfileRegistration = ({ aadhaar, onComplete }) => {
  const [formData, setFormData] = useState({
    fullName: '', fatherName: '', motherName: '', address: '',
    gender: 'Male', phone: '', marks10: '', marks12: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, "users", aadhaar), { ...formData, aadhaar, createdAt: new Date() });
      onComplete({ ...formData, aadhaar });
    } catch (error) { 
      console.error("Initialization failed:", error);
      alert("Registration Error."); 
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-2xl rounded-[48px] shadow-2xl p-12 border border-slate-100">
        <header className="mb-10 text-center">
          <h2 className="text-3xl font-black text-slate-900 italic">Initialize Identity Vault</h2>
          <p className="text-slate-400 font-medium">Link institutional records for ID: {aadhaar}</p>
        </header>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <input required placeholder="Full Legal Name" className="col-span-2 p-4 bg-slate-50 rounded-2xl border outline-none focus:border-blue-600" onChange={e => setFormData({...formData, fullName: e.target.value})} />
          <input required placeholder="Father's Name" className="p-4 bg-slate-50 rounded-2xl border outline-none" onChange={e => setFormData({...formData, fatherName: e.target.value})} />
          <input required placeholder="Mother's Name" className="p-4 bg-slate-50 rounded-2xl border outline-none" onChange={e => setFormData({...formData, motherName: e.target.value})} />
          <select className="p-4 bg-slate-50 rounded-2xl border outline-none" onChange={e => setFormData({...formData, gender: e.target.value})}>
            <option>Male</option><option>Female</option><option>Other</option>
          </select>
          <input required placeholder="Phone Number" className="p-4 bg-slate-50 rounded-2xl border outline-none" onChange={e => setFormData({...formData, phone: e.target.value})} />
          <input required type="number" placeholder="10th Marks (%)" className="p-4 bg-slate-50 rounded-2xl border outline-none" onChange={e => setFormData({...formData, marks10: e.target.value})} />
          <input required type="number" placeholder="12th Marks (%)" className="p-4 bg-slate-50 rounded-2xl border outline-none" onChange={e => setFormData({...formData, marks12: e.target.value})} />
          <textarea required placeholder="Permanent Address" className="col-span-2 p-4 bg-slate-50 rounded-2xl border outline-none h-24" onChange={e => setFormData({...formData, address: e.target.value})} />
          <button type="submit" className="col-span-2 bg-blue-600 text-white py-5 rounded-[28px] font-black text-xl hover:bg-blue-700 transition-all shadow-xl">Securely Commit Profile</button>
        </form>
      </div>
    </div>
  );
};

// --- 2. MULTI-ASSET AUTHENTICATION GATEWAY ---
const AuthGateway = ({ onCancel, onGrant, isSSO, targetPortal }) => {
  const [step, setStep] = useState('input');
  const [aadhaar, setAadhaar] = useState('');
  const [userDocs, setUserDocs] = useState([]);
  const [selectedFileUrls, setSelectedFileUrls] = useState([]);
  const [activeUser, setActiveUser] = useState(null);

  const fetchFiles = async (userData) => {
    setActiveUser(userData);
    const q = query(collection(db, 'docone_records'), where("ownerAadhaar", "==", aadhaar));
    onSnapshot(q, (snap) => {
      setUserDocs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setStep('select_assets');
    });
  };

  const handleAuth = async () => {
    try {
        const snap = await getDoc(doc(db, "users", aadhaar));
        if (snap.exists()) {
          isSSO ? fetchFiles(snap.data()) : onGrant(snap.data());
        } else { 
          onGrant({ aadhaar, needsRegistration: true }); 
        }
    } catch (error) {
        console.error("Auth failed:", error);
    }
  };

  const toggleSelection = (url) => {
    setSelectedFileUrls(prev => prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]);
  };

  const finalize = () => {
    const payload = { ...activeUser, fileUrls: selectedFileUrls };
    if (window.opener) {
      window.opener.postMessage({ type: 'DOCONE_AUTH_SUCCESS', payload }, '*');
      window.close();
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-lg rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in">
        <div className="bg-blue-900 p-8 text-white text-center">
          <ShieldCheck size={40} className="mx-auto mb-2" />
          <h1 className="text-2xl font-black italic">DocOne Gateway</h1>
        </div>
        <div className="p-8 space-y-6 text-center">
          {step === 'input' && (
            <>
              <h2 className="text-xl font-bold italic">Sign in to {targetPortal}</h2>
              <input value={aadhaar} onChange={e => setAadhaar(e.target.value)} placeholder="Aadhaar ID" className="w-full p-6 bg-slate-50 rounded-3xl text-2xl font-mono border text-center" />
              <button onClick={() => setStep('otp')} className="w-full bg-blue-900 text-white py-5 rounded-3xl font-black">Authorize</button>
            </>
          )}
          {step === 'otp' && (
            <>
              <input type="password" placeholder="••••••" className="w-full p-6 bg-slate-50 rounded-3xl text-4xl text-center font-mono border" />
              <button onClick={handleAuth} className="w-full bg-blue-900 text-white py-5 rounded-3xl font-black">Verify Identity</button>
            </>
          )}
          {step === 'select_assets' && (
            <div className="space-y-6">
              <h2 className="font-black text-xl text-slate-800 text-left italic">Select Assets to Share</h2>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-2 text-left">
                {userDocs.map(docItem => (
                  <label key={docItem.id} className={`flex items-center p-4 border-2 rounded-2xl cursor-pointer transition-all ${selectedFileUrls.includes(docItem.fileUrl) ? 'border-blue-600 bg-blue-50' : 'border-slate-100'}`}>
                    <div className={`w-6 h-6 rounded-md border-2 mr-4 flex items-center justify-center ${selectedFileUrls.includes(docItem.fileUrl) ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                        {selectedFileUrls.includes(docItem.fileUrl) && <CheckCircle2 size={16} className="text-white" />}
                    </div>
                    <input type="checkbox" className="hidden" onChange={() => toggleSelection(docItem.fileUrl)} />
                    <div className="text-left"><p className="font-bold text-sm">{docItem.type}</p><p className="text-[10px] text-slate-400 uppercase">Issuer: {docItem.issuer}</p></div>
                  </label>
                ))}
              </div>
              <button onClick={finalize} disabled={selectedFileUrls.length === 0} className="w-full bg-emerald-600 text-white py-5 rounded-3xl font-black shadow-lg">Grant Access to {selectedFileUrls.length} Files</button>
            </div>
          )}
          <button onClick={() => isSSO ? window.close() : onCancel()} className="text-slate-400 font-bold hover:text-slate-600">Abort Session</button>
        </div>
      </div>
    </div>
  );
};

// --- 3. CITIZEN DASHBOARD ---
const CitizenDashboard = ({ user, documents, onLogout }) => {
  const myDocs = documents.filter(d => d.ownerAadhaar === user.aadhaar);
  return (
    <div className="min-h-screen bg-slate-50 p-8 lg:p-16">
      <header className="flex justify-between items-start mb-16">
        <div className="flex items-center space-x-6">
          <div className="w-20 h-20 bg-blue-600 rounded-[28px] text-white flex items-center justify-center shadow-xl"><User size={40} /></div>
          <div><h1 className="text-5xl font-black text-slate-900 tracking-tighter italic">{user.fullName}</h1><p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1 italic">Vault ID: {user.aadhaar}</p></div>
        </div>
        <button onClick={onLogout} className="bg-white p-5 rounded-3xl border text-red-500 font-black flex items-center space-x-2 hover:bg-red-50 transition-all"><LogOut size={20} /><span>Terminate</span></button>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
        <div className="bg-white p-10 rounded-[56px] border shadow-sm space-y-8">
          <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest italic border-b pb-2">Legal Metadata</h3>
          <div className="space-y-6 text-sm text-slate-700">
            <div><p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Lineage</p><p className="font-bold">{user.fatherName} (F) | {user.motherName} (M)</p></div>
            <div><p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Academics</p><p className="font-bold">10th: {user.marks10}% | 12th: {user.marks12}%</p></div>
            <div><p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Contact</p><p className="font-bold">{user.phone}</p></div>
          </div>
        </div>
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-8">
           {myDocs.map(docItem => (
             <div key={docItem.id} className="bg-white p-10 rounded-[56px] border shadow-sm hover:shadow-2xl transition-all group">
               <div className="bg-blue-50 text-blue-600 w-16 h-16 rounded-3xl flex items-center justify-center mb-8"><FileText size={32} /></div>
               <h3 className="text-2xl font-black text-slate-900 mb-6">{docItem.type}</h3>
               <a href={docItem.fileUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center space-x-3 w-full bg-slate-900 text-white py-5 rounded-[28px] font-black hover:bg-blue-600 transition-all shadow-md"><ExternalLink size={20} /><span>Verify Document</span></a>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};

// --- 4. OFFICER DASHBOARD ---
const OfficerDashboard = ({ setView, documents, selectedDept }) => {
    const [citizenAadhaar, setCitizenAadhaar] = useState('');
    const [certNo, setCertNo] = useState('');
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const deptDocs = documents.filter(d => d.issuer === selectedDept.name);
  
    const handleUpload = async (e) => {
      e.preventDefault();
      if (!file) return alert("Asset Required.");
      setLoading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'docone_preset'); 
        formData.append('cloud_name', 'dtxqt3vwz'); 
        const res = await fetch('https://api.cloudinary.com/v1_1/dtxqt3vwz/image/upload', { method: 'POST', body: formData });
        const data = await res.json();
        await addDoc(collection(db, 'docone_records'), {
          ownerAadhaar: citizenAadhaar,
          type: selectedDept.docType,
          refNo: certNo,
          fileUrl: data.secure_url,
          issuer: selectedDept.name,
          date: new Date().toLocaleDateString()
        });
        setCitizenAadhaar(''); setCertNo(''); setFile(null);
        alert("Institutional Record Pushed Successfully");
      } catch (error) { 
        console.error("Upload failed:", error);
        alert("Network Failure."); 
      }
      setLoading(false);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex">
          <aside className="w-96 bg-white border-r p-12 flex flex-col sticky top-0 h-screen font-sans">
            <div className="text-4xl font-black italic mb-20 tracking-tighter text-blue-600">DocOne</div>
            <div className="bg-blue-600 text-white p-6 rounded-[32px] flex items-center space-x-4 font-black shadow-xl shadow-blue-100">
                <selectedDept.icon size={24}/><span>{selectedDept.docType} Node</span>
            </div>
            <button onClick={() => setView('landing')} className="mt-auto flex items-center space-x-3 text-red-500 font-black hover:translate-x-2 transition-transform"><LogOut /><span>Exit Terminal</span></button>
          </aside>
          <main className="flex-1 p-16 overflow-y-auto">
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter italic mb-20">Issuance Protocol</h1>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
              <div className="lg:col-span-5 bg-white p-12 rounded-[64px] shadow-2xl border-t-[12px] border-blue-600">
                <form onSubmit={handleUpload} className="space-y-8">
                  <input value={citizenAadhaar} onChange={(e) => setCitizenAadhaar(e.target.value)} placeholder="Target Identity Number" className="w-full p-6 bg-slate-50 rounded-3xl outline-none border font-mono text-xl" required />
                  <div className="relative w-full h-32 bg-blue-50 border-2 border-dashed border-blue-200 rounded-[32px] flex items-center justify-center">
                    <input type="file" onChange={(e) => setFile(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer" required />
                    <div className="text-blue-600 font-black text-center"><Upload size={32} className="mx-auto mb-2" /><span>{file ? file.name.substring(0,20) : "Select Asset"}</span></div>
                  </div>
                  <input value={certNo} onChange={(e) => setCertNo(e.target.value)} placeholder="Reference Number" className="w-full p-6 bg-slate-50 rounded-3xl outline-none border font-medium" required />
                  <button disabled={loading} className="w-full bg-blue-600 text-white py-7 rounded-[32px] font-black text-2xl shadow-xl">{loading ? 'Transmitting...' : `Issue ${selectedDept.docType}`}</button>
                </form>
              </div>
              <div className="lg:col-span-7 text-slate-800">
                 <h3 className="text-2xl font-black mb-10 italic">Institutional Ledger</h3>
                 <div className="bg-white rounded-[56px] border shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 font-black uppercase text-[10px] text-slate-400 tracking-widest"><tr className="divide-x"><th className="p-8">Recipient</th><th className="p-8">Blockchain State</th></tr></thead>
                      <tbody className="divide-y">
                        {deptDocs.map(docItem => (
                          <tr key={docItem.id} className="hover:bg-blue-50/50 transition-colors"><td className="p-8 font-mono font-bold text-slate-700">ID-XXXX-{docItem.ownerAadhaar.slice(-4)}</td><td className="p-8"><span className="bg-emerald-100 text-emerald-700 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest italic">Asset Committed</span></td></tr>
                        ))}
                      </tbody>
                    </table>
                 </div>
              </div>
            </div>
          </main>
        </div>
      );
};

// --- MAIN SYSTEM ROUTING ---
export default function App() {
  const [view, setView] = useState('landing'); 
  const [user, setUser] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [selectedDept, setSelectedDept] = useState(null);
  const isSSO = new URLSearchParams(window.location.search).get('mode') === 'sso';
  const ssoPortalName = new URLSearchParams(window.location.search).get('portal')?.replace(/_/g, ' ') || 'Institutional Gateway';

  useEffect(() => {
    signInAnonymously(auth).catch(error => console.error("Identity Engine Offline: ", error));
    const unsubscribe = onSnapshot(collection(db, 'docone_records'), (snapshot) => {
      setDocuments(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, []);

  const renderView = () => {
    if (isSSO) return <AuthGateway isSSO={true} targetPortal={ssoPortalName} onGrant={(u) => { setUser(u); u.needsRegistration ? setView('register') : setView('citizen_dashboard'); }} />;
    switch(view) {
      case 'landing': return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center text-slate-900">
          <div className="mb-16"><div className="bg-blue-600 w-24 h-24 rounded-[40px] flex items-center justify-center mx-auto mb-6 shadow-2xl"><ShieldCheck size={48} className="text-white" /></div><h1 className="text-6xl font-black tracking-tighter italic">DocOne</h1><p className="text-slate-500 font-bold uppercase tracking-widest text-sm mt-2">Unified Identity Protocol</p></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-5xl">
            <button onClick={() => setView('citizen_login')} className="bg-white p-12 rounded-[64px] border-2 border-transparent hover:border-blue-600 hover:shadow-2xl text-left transition-all group">
                <UserCircle size={56} className="text-blue-600 mb-8" /><h2 className="text-4xl font-black">Citizen Vault</h2><div className="flex items-center text-blue-600 font-bold mt-10">Initialize Session <ArrowRight size={24} className="ml-3" /></div></button>
            <button onClick={() => setView('officer_login')} className="bg-slate-900 p-12 rounded-[64px] border-2 border-slate-800 hover:border-blue-400 hover:shadow-2xl text-left transition-all group">
                <Building2 size={56} className="text-blue-400 mb-8" /><h2 className="text-4xl font-black text-white">Authority Node</h2><div className="flex items-center text-blue-400 font-bold mt-10">System Access <ArrowRight size={24} className="ml-3" /></div></button>
          </div>
        </div>
      );
      case 'citizen_login': return <AuthGateway onCancel={() => setView('landing')} targetPortal="DocOne Central Vault" onGrant={(u) => { setUser(u); u.needsRegistration ? setView('register') : setView('citizen_dashboard'); }} />;
      case 'register': return <ProfileRegistration aadhaar={user.aadhaar} onComplete={(u) => { setUser(u); setView('citizen_dashboard'); }} />;
      case 'citizen_dashboard': return <CitizenDashboard user={user} documents={documents} onLogout={() => setView('landing')} />;
      case 'officer_login': return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white font-sans">
            <h1 className="text-3xl font-black italic mb-12 border-b-4 border-blue-500 pb-4">Institutional Selection Node</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl w-full">
            {DEPARTMENTS.map(d => (
                <button key={d.id} onClick={() => { setSelectedDept(d); setView('officer_dashboard'); }} className="bg-slate-800 p-10 rounded-[56px] border-2 border-slate-700 hover:border-blue-500 text-left transition-all group">
                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform ${d.bg} ${d.color}`}><d.icon size={32} /></div><h3 className="text-2xl font-black">{d.name}</h3><p className="text-slate-500 text-sm mt-2">Authority: {d.docType}</p></button>
            ))}
            </div>
            <button onClick={() => setView('landing')} className="mt-16 text-slate-500 font-bold hover:text-white transition-colors">Back to Main Gateway</button>
        </div>
      );
      case 'officer_dashboard': return <OfficerDashboard setView={setView} documents={documents} selectedDept={selectedDept} />;
      default: return <div />;
    }
  };
  return <div className="bg-white min-h-screen font-sans antialiased text-slate-900">{renderView()}</div>;
}