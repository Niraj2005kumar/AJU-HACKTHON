import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, doc, getDoc, setDoc, query, where, updateDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously, signInWithEmailAndPassword } from 'firebase/auth';

import { 
  ShieldCheck, Fingerprint, Lock, ArrowRight, Building2, 
  FileText, GraduationCap, LogOut, FilePlus, 
  Database, Upload, ExternalLink, UserCircle, CreditCard,
  User, CheckCircle2, Edit3, Save, Calendar, MapPin, Mail, Hash
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
  { id: 'UIDAI', name: 'Identity Authority', docType: 'Aadhaar Card', icon: Fingerprint, color: 'text-orange-600', bg: 'bg-orange-50' },
  { id: 'PAN', name: 'IT Department (PAN)', docType: 'PAN Card', icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'CBSE', name: 'Education Board', docType: 'Marksheet', icon: GraduationCap, color: 'text-emerald-600', bg: 'bg-emerald-50' }
];

// --- NAVBAR ---
const Navbar = ({ setView }) => (
  <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-100 h-20 flex items-center shadow-sm">
    <div className="max-w-7xl mx-auto w-full px-6 flex justify-between items-center">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('landing')}>
        <ShieldCheck className="text-indigo-600" size={32} />
        <span className="text-2xl font-black tracking-tighter">DocOne</span>
      </div>
      <div className="flex gap-4">
        <button onClick={() => setView('citizen_login')} className="px-6 py-2 font-bold text-slate-600 hover:text-indigo-600">Login</button>
        <button onClick={() => setView('citizen_login')} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow-md">Sign Up</button>
      </div>
    </div>
  </nav>
);

// --- AUTH GATEWAY (FOR CITIZENS & SSO) ---
const AuthGateway = ({ onGrant, isSSO, targetPortal, onCancel }) => {
  const [step, setStep] = useState('input');
  const [aadhaar, setAadhaar] = useState('');
  const [userDocs, setUserDocs] = useState([]);
  const [selectedUrls, setSelectedUrls] = useState([]);
  const [activeUser, setActiveUser] = useState(null);

  const handleVerify = async () => {
    const snap = await getDoc(doc(db, "users", aadhaar));
    if (snap.exists()) {
      const data = snap.data();
      if (isSSO) {
        setActiveUser(data);
        const q = query(collection(db, 'docone_records'), where("ownerAadhaar", "==", aadhaar));
        onSnapshot(q, (s) => {
          setUserDocs(s.docs.map(d => ({ id: d.id, ...d.data() })));
          setStep('select');
        });
      } else { onGrant(data); }
    } else { onGrant({ aadhaar, needsRegistration: true }); }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 pt-24 text-left">
      <div className="bg-white w-full max-w-[480px] rounded-[32px] shadow-2xl overflow-hidden border border-slate-100">
        <div className="bg-indigo-600 p-8 text-white text-center">
          <ShieldCheck size={40} className="mx-auto mb-2" />
          <h2 className="text-xl font-bold uppercase tracking-widest">Citizen Access</h2>
        </div>
        <div className="p-10 space-y-6">
          {step === 'input' ? (
            <div className="text-center">
              <p className="text-slate-500 font-medium mb-6">Verify your Aadhaar Identity</p>
              <input value={aadhaar} onChange={e => setAadhaar(e.target.value)} placeholder="0000 0000 0000" className="w-full p-4 bg-slate-50 rounded-xl text-2xl font-mono text-center border focus:border-indigo-600 outline-none" />
              <button onClick={handleVerify} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg mt-6 shadow-lg">Login / Register</button>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800">Choose documents for {targetPortal}</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {userDocs.map(d => (
                  <label key={d.id} className={`flex items-center p-4 border rounded-xl cursor-pointer ${selectedUrls.includes(d.fileUrl) ? 'border-indigo-600 bg-indigo-50' : 'bg-slate-50'}`}>
                    <input type="checkbox" className="mr-3 w-5 h-5 accent-indigo-600" onChange={() => setSelectedUrls(prev => prev.includes(d.fileUrl) ? prev.filter(u => u !== d.fileUrl) : [...prev, d.fileUrl])} />
                    <span className="font-bold text-sm text-slate-700">{d.type}</span>
                  </label>
                ))}
              </div>
              <button onClick={() => {
                window.opener.postMessage({ type: 'DOCONE_AUTH_SUCCESS', payload: { ...activeUser, fileUrls: selectedUrls } }, '*');
                window.close();
              }} className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold shadow-lg">Confirm & Share</button>
            </div>
          )}
          <button onClick={() => isSSO ? window.close() : onCancel()} className="w-full text-slate-400 font-bold text-sm uppercase">Cancel</button>
        </div>
      </div>
    </div>
  );
};

// --- LANDING PAGE ---
const LandingPage = ({ setView }) => (
  <div className="pt-20">
    <section className="min-h-[80vh] flex flex-col items-center justify-center text-center px-6 bg-white">
      <div className="bg-emerald-50 text-emerald-700 px-6 py-2 rounded-full font-bold text-xs uppercase tracking-widest mb-8 border border-emerald-100">
        Verified Identity Ecosystem
      </div>
      <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-8 italic text-slate-900 leading-none">
        Submit Forms <br /> <span className="text-indigo-600">Instantly.</span>
      </h1>
      <p className="text-xl md:text-2xl text-slate-500 font-medium mb-12 max-w-2xl leading-tight">
        Fill complex form in just <span className="text-emerald-500 font-black">one minutes</span> with verified institutional records.
      </p>
      <div className="flex flex-wrap justify-center gap-6">
        <button onClick={() => setView('citizen_login')} className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-bold text-lg shadow-xl flex items-center gap-3">Sign Up Now <ArrowRight /></button>
        <button onClick={() => setView('officer_login')} className="px-10 py-5 bg-white border-2 border-slate-100 text-slate-900 rounded-2xl font-bold text-lg hover:border-indigo-600 transition-all">Officer Portal</button>
      </div>
    </section>
  </div>
);

// --- REGISTRATION ---
const ProfileRegistration = ({ aadhaar, onComplete }) => {
  const [form, setForm] = useState({ 
    fullName: '', fatherName: '', motherName: '', dob: '', 
    gender: 'Male', phone: '', email: '', pincode: '', 
    marks10: '', marks12: '', address: '' 
  });
  
  const handleCreate = async (e) => {
    e.preventDefault();
    await setDoc(doc(db, "users", aadhaar), { ...form, aadhaar, createdAt: new Date() });
    onComplete({ ...form, aadhaar });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 pt-28 pb-12">
      <div className="bg-white w-full max-w-3xl rounded-[32px] shadow-2xl p-10 border border-slate-100 text-left">
        <div className="mb-8 border-b pb-4">
            <h2 className="text-3xl font-black italic text-slate-900 uppercase">Create Your Account</h2>
            <p className="text-slate-400 font-bold text-sm">Aadhaar linked: {aadhaar}</p>
        </div>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="col-span-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Full Name</label>
            <input required className="w-full p-3 bg-slate-50 rounded-lg outline-none font-bold" onChange={e => setForm({...form, fullName: e.target.value})} />
          </div>
          <div><label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Father's Name</label><input required className="w-full p-3 bg-slate-50 rounded-lg outline-none font-bold" onChange={e => setForm({...form, fatherName: e.target.value})} /></div>
          <div><label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Mother's Name</label><input required className="w-full p-3 bg-slate-50 rounded-lg outline-none font-bold" onChange={e => setForm({...form, motherName: e.target.value})} /></div>
          <div><label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Date of Birth</label><input required type="date" className="w-full p-3 bg-slate-50 rounded-lg outline-none font-bold text-slate-600" onChange={e => setForm({...form, dob: e.target.value})} /></div>
          <div><label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Gender</label><select className="w-full p-3 bg-slate-50 rounded-lg outline-none font-bold" onChange={e => setForm({...form, gender: e.target.value})}><option>Male</option><option>Female</option><option>Other</option></select></div>
          <div><label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Phone Number</label><input required className="w-full p-3 bg-slate-50 rounded-lg outline-none font-bold" onChange={e => setForm({...form, phone: e.target.value})} /></div>
          <div><label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Email Address</label><input required type="email" className="w-full p-3 bg-slate-50 rounded-lg outline-none font-bold" onChange={e => setForm({...form, email: e.target.value})} /></div>
          <div><label className="text-[10px] font-bold text-slate-400 uppercase ml-2">10th Marks (%)</label><input required className="w-full p-3 bg-slate-50 rounded-lg outline-none font-bold" onChange={e => setForm({...form, marks10: e.target.value})} /></div>
          <div><label className="text-[10px] font-bold text-slate-400 uppercase ml-2">12th Marks (%)</label><input required className="w-full p-3 bg-slate-50 rounded-lg outline-none font-bold" onChange={e => setForm({...form, marks12: e.target.value})} /></div>
          <div className="col-span-2"><label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Pincode</label><input required className="w-full p-3 bg-slate-50 rounded-lg outline-none font-bold" onChange={e => setForm({...form, pincode: e.target.value})} /></div>
          <div className="col-span-2"><label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Full Residential Address</label><textarea required className="w-full p-3 bg-slate-50 rounded-lg outline-none h-20 font-bold" onChange={e => setForm({...form, address: e.target.value})} /></div>
          <button type="submit" className="col-span-2 bg-indigo-600 text-white py-5 rounded-2xl font-bold text-lg shadow-xl mt-4">Complete Registration</button>
        </form>
      </div>
    </div>
  );
};

// --- CITIZEN DASHBOARD ---
const CitizenDashboard = ({ user, documents, onLogout }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState(user);
  const myDocs = documents.filter(d => d.ownerAadhaar === user.aadhaar);

  const handleUpdate = async () => {
    await updateDoc(doc(db, "users", user.aadhaar), profile);
    setIsEditing(false);
    alert("Profile Updated!");
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] pt-28 p-6 pb-20 text-left">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center bg-white p-8 rounded-[24px] shadow-sm border border-slate-100">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl"><User size={32}/></div>
            <div>
              <h1 className="text-3xl font-black italic text-slate-900 uppercase">{user.fullName}</h1>
              <p className="text-slate-400 font-bold text-sm tracking-widest mt-1">ID: {user.aadhaar}</p>
            </div>
          </div>
          <button onClick={onLogout} className="bg-red-50 text-red-500 px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-red-100 transition-all shadow-sm"><LogOut size={18}/> Sign Out</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-slate-700">
          <div className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-100 space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="font-bold text-indigo-600 uppercase text-xs tracking-widest">Personal Details</h3>
              <button onClick={() => isEditing ? handleUpdate() : setIsEditing(true)} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-all shadow-sm">
                {isEditing ? <Save size={18}/> : <Edit3 size={18}/>}
              </button>
            </div>
            <div className="space-y-5">
              <div><p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Father's Name</p><p className="font-bold">{user.fatherName}</p></div>
              <div><p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Mother's Name</p><p className="font-bold">{user.motherName}</p></div>
              <div><p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Date of Birth</p><p className="font-bold">{user.dob}</p></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Email</p>
                {isEditing ? <input className="w-full p-2 bg-slate-50 rounded-lg border font-bold text-indigo-600" value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} /> : <p className="font-bold text-sm">{profile.email}</p>}
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Secure Phone</p>
                {isEditing ? <input className="w-full p-2 bg-slate-50 rounded-lg border text-sm font-bold" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})}/> : <p className="font-bold">{profile.phone}</p>}
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Pincode</p>
                {isEditing ? <input className="w-full p-2 bg-slate-50 rounded-lg border text-sm font-bold" value={profile.pincode} onChange={e => setProfile({...profile, pincode: e.target.value})}/> : <p className="font-bold">{profile.pincode}</p>}
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Residential Address</p>
                {isEditing ? <textarea className="w-full p-2 bg-slate-50 rounded-lg border text-sm font-bold h-20" value={profile.address} onChange={e => setProfile({...profile, address: e.target.value})}/> : <p className="font-bold text-sm leading-relaxed italic">{profile.address}</p>}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            {myDocs.map(d => (
              <div key={d.id} className="bg-white p-8 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                <FileText className="text-indigo-600 mb-4 group-hover:scale-110 transition-transform" size={32}/>
                <p className="text-[10px] font-bold text-slate-400 uppercase italic">Issuer: {d.issuer}</p>
                <h4 className="text-xl font-bold mb-6 text-slate-800 uppercase tracking-tight">{d.type}</h4>
                <a href={d.fileUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-indigo-600 transition-all shadow-md"><ExternalLink size={16}/> View Asset</a>
              </div>
            ))}
            {myDocs.length === 0 && <div className="col-span-2 py-20 border-2 border-dashed border-slate-200 rounded-[32px] text-center text-slate-300 font-bold italic uppercase">No Document Available</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- OFFICER AUTH & DASHBOARD ---
const OfficerNode = ({ setView, onDeptSelect }) => {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [selectedDept, setSelectedDept] = useState(null);

  const handleOfficerLogin = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      const loggedInEmail = userCredential.user.email.toLowerCase();
      
      let isAuth = false;
      if (selectedDept.id === 'UIDAI' && loggedInEmail.includes('aadhaar')) isAuth = true;
      if (selectedDept.id === 'PAN' && loggedInEmail.includes('pan')) isAuth = true;
      if (selectedDept.id === 'CBSE' && loggedInEmail.includes('cbse')) isAuth = true;
      if (loggedInEmail === 'admin@docone.com') isAuth = true;

      if (isAuth) {
        onDeptSelect(selectedDept);
        setView('officer_dashboard');
      } else {
        alert(`Access Denied: Your account is not authorized for ${selectedDept.name}`);
        await auth.signOut();
      }
    } catch { alert("Unauthorized: Invalid Credentials."); }
  };

  if (selectedDept) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-left">
        <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl p-10">
          <div className="text-center mb-8">
            <Lock className="text-red-500 mx-auto mb-4" size={40} />
            <h2 className="text-2xl font-black uppercase text-slate-800">{selectedDept.id} Terminal</h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Officer Auth Required</p>
          </div>
          <form onSubmit={handleOfficerLogin} className="space-y-4">
            <input type="email" placeholder="Officer Email" className="w-full p-4 bg-slate-50 border rounded-xl outline-none focus:border-indigo-600" onChange={e => setEmail(e.target.value)} required />
            <input type="password" placeholder="Password" className="w-full p-4 bg-slate-50 border rounded-xl outline-none focus:border-indigo-600" onChange={e => setPass(e.target.value)} required />
            <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg uppercase">Verify Access</button>
            <button type="button" onClick={() => setSelectedDept(null)} className="w-full text-slate-400 font-bold text-xs uppercase tracking-widest mt-4">Go Back</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 pt-32 p-6 flex flex-col items-center">
      <h1 className="text-white text-4xl font-black italic mb-16 uppercase tracking-tighter">Authority Selection Node</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full text-left">
        {DEPARTMENTS.map(d => (
          <button key={d.id} onClick={() => setSelectedDept(d)} className="bg-white/5 p-10 rounded-[32px] border-2 border-white/5 hover:border-indigo-500 transition-all group hover:bg-white/10">
            <d.icon size={48} className={`${d.color} mb-8 transition-transform group-hover:scale-110`} />
            <h4 className="text-white text-2xl font-bold tracking-tight uppercase leading-none">{d.name}</h4>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-3 italic">Connect to Port</p>
          </button>
        ))}
      </div>
      <button onClick={() => setView('landing')} className="mt-20 text-slate-500 font-bold uppercase tracking-widest hover:text-white transition-colors">Return to Gateway</button>
    </div>
  );
};

// --- OFFICER DASHBOARD (UPDATED LEDGER) ---
const OfficerDashboard = ({ setView, documents, selectedDept }) => {
  const [aadhaar, setAadhaar] = useState('');
  const [ref, setRef] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const deptDocs = documents.filter(d => d.issuer === selectedDept.name);

  const handlePush = async (e) => {
    e.preventDefault();
    if (!file) return alert("Select File!");
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'docone_preset'); 
      formData.append('cloud_name', 'dtxqt3vwz'); 
      const res = await fetch('https://api.cloudinary.com/v1_1/dtxqt3vwz/image/upload', { method: 'POST', body: formData });
      const data = await res.json();
      await addDoc(collection(db, 'docone_records'), { ownerAadhaar: aadhaar, type: selectedDept.docType, refNo: ref, fileUrl: data.secure_url, issuer: selectedDept.name, date: new Date().toLocaleDateString() });
      setAadhaar(''); setRef(''); setFile(null);
      alert("Asset Committed Successfully!");
    } catch { alert("Transmission Error!"); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-24 p-6 flex flex-col md:flex-row gap-8 text-left">
      <aside className="w-full md:w-80 bg-slate-900 rounded-[24px] p-8 text-white h-fit shadow-2xl">
        <div className={`${selectedDept.bg} ${selectedDept.color} w-16 h-16 rounded-2xl flex items-center justify-center mb-6`}><selectedDept.icon size={32}/></div>
        <h3 className="text-2xl font-black italic mb-2 tracking-tight uppercase leading-none">{selectedDept.id} Terminal</h3>
        <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-12 italic">Authorized Node</p>
        <button onClick={() => setView('landing')} className="flex items-center gap-2 text-slate-500 font-bold hover:text-white transition-all uppercase italic text-xs"><LogOut size={18}/> Exit Terminal</button>
      </aside>

      <main className="flex-1 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* UPLOAD BOX */}
          <div className="lg:col-span-5 bg-white p-10 rounded-[24px] shadow-sm border border-t-[12px] border-indigo-600 italic uppercase font-black">
            <h3 className="text-xl mb-8 leading-none">Push Verified Asset</h3>
            <form onSubmit={handlePush} className="space-y-6">
              <input required value={aadhaar} onChange={e => setAadhaar(e.target.value)} placeholder="Target Aadhaar" className="w-full p-4 bg-slate-50 rounded-xl border outline-none font-mono text-center text-xl" />
              <div className="p-10 border-4 border-dashed border-slate-100 rounded-2xl text-center cursor-pointer hover:bg-slate-50 relative group">
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setFile(e.target.files[0])} />
                <Upload className="mx-auto text-indigo-600 mb-2 group-hover:scale-110 transition-transform"/>
                <p className="text-[10px] text-slate-400">{file ? file.name : "Select Asset"}</p>
              </div>
              <input required value={ref} onChange={e => setRef(e.target.value)} placeholder={`Reference ${selectedDept.id} No.`} className="w-full p-4 bg-slate-50 rounded-xl border outline-none text-sm font-bold" />
              <button disabled={loading} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-xl italic tracking-tight">{loading ? "Distributing..." : "Commit Asset"}</button>
            </form>
          </div>

          {/* LEDGER WITH DOWNLOAD BUTTON */}
          <div className="lg:col-span-7 bg-white rounded-[24px] shadow-sm border overflow-hidden">
            <div className="bg-slate-50 p-4 border-b font-black text-[10px] uppercase text-slate-400 tracking-widest">Institutional Ledger</div>
            <table className="w-full text-left font-bold uppercase">
              <thead className="bg-slate-50/50 text-[10px] text-slate-400 tracking-widest border-b">
                <tr><th className="p-6 uppercase italic">Identity ID</th><th className="p-6 uppercase italic">{selectedDept.id} No.</th><th className="p-6 text-right uppercase italic">Action</th></tr>
              </thead>
              <tbody className="divide-y text-sm italic">
                {deptDocs.map((d, idx) => (
                  <tr key={idx} className="hover:bg-indigo-50/10">
                    <td className="p-6 font-mono text-slate-500">{d.ownerAadhaar}</td>
                    <td className="p-6 font-black text-slate-700 uppercase">{d.refNo}</td>
                    <td className="p-6 text-right">
                      <a href={d.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-xl text-xs font-black shadow-md hover:bg-indigo-700 transition-all uppercase">
                        <ExternalLink size={14} /> Download
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

// --- MAIN ROUTER ---
export default function App() {
  const [view, setView] = useState('landing'); 
  const [user, setUser] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [selectedDept, setSelectedDept] = useState(null);
  const isSSO = new URLSearchParams(window.location.search).get('mode') === 'sso';
  const ssoPortal = new URLSearchParams(window.location.search).get('portal')?.replace(/_/g, ' ') || 'Institutional Node';

  useEffect(() => {
    signInAnonymously(auth).catch(e => console.error(e));
    const unsubscribe = onSnapshot(collection(db, 'docone_records'), (snap) => setDocuments(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsubscribe();
  }, []);

  if (isSSO) return <AuthGateway isSSO={true} targetPortal={ssoPortal} onGrant={(u) => { setUser(u); setView(u.needsRegistration ? 'register' : 'citizen_dashboard'); }} />;

  return (
    <div className="bg-white min-h-screen font-sans selection:bg-indigo-100">
      <Navbar setView={setView} />
      {view === 'landing' && <LandingPage setView={setView} />}
      {view === 'citizen_login' && <AuthGateway isSSO={false} onCancel={() => setView('landing')} onGrant={(u) => { setUser(u); setView(u.needsRegistration ? 'register' : 'citizen_dashboard'); }} />}
      {view === 'register' && <ProfileRegistration aadhaar={user.aadhaar} onComplete={(u) => { setUser(u); setView('citizen_dashboard'); }} />}
      {view === 'citizen_dashboard' && <CitizenDashboard user={user} documents={documents} onLogout={() => setView('landing')} />}
      {view === 'officer_login' && <OfficerNode setView={setView} onDeptSelect={setSelectedDept} />}
      {view === 'officer_dashboard' && <OfficerDashboard setView={setView} documents={documents} selectedDept={selectedDept} />}
      <footer className="bg-white border-t py-12 px-6 text-center text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]"><p>© {new Date().getFullYear()} Catalyst Circle. All Rights Reserved.</p></footer>
    </div>
  );
}