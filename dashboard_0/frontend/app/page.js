"use client";
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { auth, db, storage, signInWithGoogle } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Icons & UI
import { MessageSquare, FileText, Download, Upload, User, LogOut, Beaker } from 'lucide-react';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';

export default function Workspace() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'research'
  
  // Data States
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [documents, setDocuments] = useState([]);
  const [activePdf, setActivePdf] = useState(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  // Sync Chat & Docs
  useEffect(() => {
    if (!user) return;
    const msgQuery = query(collection(db, "projects", id, "messages"), orderBy("createdAt", "asc"));
    const docQuery = query(collection(db, "projects", id, "documents"), orderBy("createdAt", "desc"));
    
    const unsubMsg = onSnapshot(msgQuery, (s) => setMessages(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubDoc = onSnapshot(docQuery, (s) => setDocuments(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    
    return () => { unsubMsg(); unsubDoc(); };
  }, [user, id]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    await addDoc(collection(db, "projects", id, "messages"), {
      text: input, sender: user.displayName, uid: user.uid, createdAt: serverTimestamp()
    });
    setInput("");
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fileRef = ref(storage, `projects/${id}/${file.name}`);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    await addDoc(collection(db, "projects", id, "documents"), {
      name: file.name, url: url, createdAt: serverTimestamp()
    });
  };

  if (!user) return (
    <div className="h-screen flex items-center justify-center bg-slate-900">
      <button onClick={signInWithGoogle} className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-500 transition-all shadow-2xl">
        <User size={20} /> Enter Research Workspace
      </button>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* 1. PROFESSIONAL SIDEBAR (Far Left) */}
      <aside className="w-20 bg-slate-900 flex flex-col items-center py-8 gap-8 border-r border-slate-800">
        <div className="p-3 bg-indigo-600 rounded-2xl text-white mb-4">
          <Beaker size={28} />
        </div>
        
        <button 
          onClick={() => setActiveTab('chat')}
          className={`p-4 rounded-xl transition-all ${activeTab === 'chat' ? 'bg-slate-800 text-indigo-400' : 'text-slate-500 hover:text-white'}`}
        >
          <MessageSquare size={24} />
        </button>

        <button 
          onClick={() => setActiveTab('research')}
          className={`p-4 rounded-xl transition-all ${activeTab === 'research' ? 'bg-slate-800 text-indigo-400' : 'text-slate-500 hover:text-white'}`}
        >
          <FileText size={24} />
        </button>

        <div className="mt-auto flex flex-col gap-4">
           <button onClick={() => auth.signOut()} className="text-slate-500 hover:text-red-400 p-4">
             <LogOut size={20} />
           </button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Project</span>
            <h1 className="font-bold text-lg text-slate-800">{id}</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold text-slate-500">{user.displayName}</span>
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
              {user.displayName.charAt(0)}
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          
          {/* TAB 1: CHAT MODE (Full height chat) */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col bg-white max-w-4xl mx-auto w-full border-x border-slate-100 shadow-inner">
              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {messages.map(m => (
                  <div key={m.id} className={`flex ${m.uid === user.uid ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] ${m.uid === user.uid ? "order-2" : ""}`}>
                      <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase px-1">{m.sender}</p>
                      <div className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
                        m.uid === user.uid ? "bg-indigo-600 text-white rounded-tr-none" : "bg-slate-100 text-slate-800 rounded-tl-none"
                      }`}>
                        {m.text}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={sendMessage} className="p-6 bg-slate-50 border-t flex gap-3">
                <input 
                  value={input} onChange={(e) => setInput(e.target.value)}
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-5 py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 shadow-sm"
                  placeholder="Collaborate with your team..."
                />
                <button type="submit" className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all">Send</button>
              </form>
            </div>
          )}

          {/* TAB 2: RESEARCH MODE (Split View with PDF) */}
          {activeTab === 'research' && (
            <div className="flex-1 flex">
              {/* Left Sidebar for Research: Documents List */}
              <div className="w-80 border-r border-slate-200 bg-white flex flex-col">
                <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                  <h3 className="text-xs font-bold text-slate-500 uppercase">Documents</h3>
                  <label className="cursor-pointer text-indigo-600 hover:text-indigo-800">
                    <Upload size={18} />
                    <input type="file" onChange={handleFileUpload} className="hidden" accept=".pdf" />
                  </label>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                  {documents.map(doc => (
                    <button 
                      key={doc.id} 
                      onClick={() => setActivePdf(doc.url)}
                      className={`w-full text-left p-3 rounded-lg mb-1 flex items-center gap-3 transition-colors ${activePdf === doc.url ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-600'}`}
                    >
                      <FileText size={16} />
                      <span className="text-xs font-semibold truncate">{doc.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* PDF Viewer Area */}
              <div className="flex-1 bg-slate-200 p-4">
                <div className="h-full bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-300">
                  {activePdf ? (
                    <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
                      <Viewer fileUrl={activePdf} />
                    </Worker>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
                      <FileText size={48} className="opacity-20" />
                      <p className="text-sm font-medium">Select a research paper from the list</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}