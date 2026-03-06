"use client";
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { auth, db, storage, signInWithGoogle } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Professional Icons
import { MessageSquare, FileText, Upload, User, LogOut, Beaker, Send, Layers } from 'lucide-react';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';

export default function Workspace() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'research'
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [documents, setDocuments] = useState([]);
  const [activePdf, setActivePdf] = useState(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubMsg = onSnapshot(query(collection(db, "projects", id, "messages"), orderBy("createdAt", "asc")), (s) => 
      setMessages(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    const unsubDoc = onSnapshot(query(collection(db, "projects", id, "documents"), orderBy("createdAt", "desc")), (s) => 
      setDocuments(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );
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

    try {
      // Upload file to Firebase Storage
      const fileRef = ref(storage, `projects/${id}/${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      
      // Save file metadata to Firestore
      await addDoc(collection(db, "projects", id, "documents"), {
        name: file.name, 
        url: url,
        createdAt: serverTimestamp()
      });

      // Send to backend for AI processing 
      await fetch('http://localhost:8000/process-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: url,
          project_id: id,
          file_name: file.name
        })
      });

      alert("Research paper uploaded and analyzed by AI!");
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Something went wrong with the AI analysis.");
    }
  };

  if (!user) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-950 text-white">
      <Beaker size={48} className="text-indigo-500 mb-6 animate-pulse" />
      <h1 className="text-2xl font-bold mb-8">STEM Collaborative Environment</h1>
      <button onClick={signInWithGoogle} className="bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-4 rounded-2xl font-bold shadow-2xl transition-all flex items-center gap-3">
        <User size={20} /> Sign in with Google
      </button>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50">
      
      {/* 1. MINIMAL SIDEBAR (Far Left) */}
      <nav className="w-20 bg-slate-950 flex flex-col items-center py-10 gap-10 border-r border-slate-800 shadow-2xl z-50">
        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
          <Beaker size={24} />
        </div>
        
        <button onClick={() => setActiveTab('chat')} className={`p-4 rounded-2xl transition-all ${activeTab === 'chat' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
          <MessageSquare size={24} />
        </button>

        <button onClick={() => setActiveTab('research')} className={`p-4 rounded-2xl transition-all ${activeTab === 'research' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
          <FileText size={24} />
        </button>

        <div className="mt-auto flex flex-col gap-6 items-center">
           <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-indigo-400">
             {user.displayName.charAt(0)}
           </div>
           <button onClick={() => auth.signOut()} className="text-slate-600 hover:text-red-400 pb-4 transition-colors">
             <LogOut size={20} />
           </button>
        </div>
      </nav>

      {/* 2. MAIN WORKSPACE AREA */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Modern Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Layers size={18} className="text-indigo-600" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Project / </span>
            <h1 className="font-bold text-slate-800">{id}</h1>
          </div>
          <div className="flex items-center gap-3">
             <div className="h-2 w-2 rounded-full bg-green-500 animate-ping" />
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Sync Enabled</span>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          
          {/* TAB: CHAT MODE (Research Brainstorming) */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col bg-white max-w-5xl mx-auto w-full border-x border-slate-100 shadow-sm">
              <div className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-hide">
                {messages.map(m => (
                  <div key={m.id} className={`flex ${m.uid === user.uid ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] ${m.uid === user.uid ? "text-right" : ""}`}>
                      <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-tighter">{m.sender}</p>
                      <div className={`p-4 rounded-2xl text-sm shadow-sm leading-relaxed ${
                        m.uid === user.uid ? "bg-indigo-600 text-white rounded-tr-none shadow-indigo-200" : "bg-slate-100 text-slate-800 rounded-tl-none"
                      }`}>
                        {m.text}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={sendMessage} className="p-8 bg-slate-50/50 border-t flex gap-4">
                <input 
                  value={input} onChange={(e) => setInput(e.target.value)}
                  className="flex-1 bg-white border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800 shadow-sm"
                  placeholder="Discuss scientific concepts..."
                />
                <button type="submit" className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:shadow-2xl transition-all flex items-center gap-2">
                  <Send size={18} /> Send
                </button>
              </form>
            </div>
          )}

          {/* TAB: RESEARCH MODE (PDF Reader & Knowledge Curation) */}
          {activeTab === 'research' && (
            <div className="flex-1 flex bg-slate-100">
              {/* Document Browser Sidebar */}
              <aside className="w-80 bg-white border-r border-slate-200 flex flex-col">
                <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Repository</h3>
                  <label className="p-2 bg-indigo-50 text-indigo-600 rounded-lg cursor-pointer hover:bg-indigo-100 transition-colors">
                    <Upload size={16} />
                    <input type="file" onChange={handleFileUpload} className="hidden" accept=".pdf" />
                  </label>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {documents.length === 0 && <p className="text-center text-slate-400 text-xs mt-10">No papers uploaded</p>}
                  {documents.map(doc => (
                    <button key={doc.id} onClick={() => setActivePdf(doc.url)}
                      className={`w-full text-left p-4 rounded-xl flex items-center gap-4 transition-all ${activePdf === doc.url ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-50 text-slate-600'}`}
                    >
                      <FileText size={18} />
                      <span className="text-xs font-bold truncate">{doc.name}</span>
                    </button>
                  ))}
                </div>
              </aside>

              {/* PDF Canvas */}
              <div className="flex-1 p-6 flex flex-col">
                <div className="flex-1 bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 relative">
                  {activePdf ? (
                    <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
                      <Viewer fileUrl={activePdf} />
                    </Worker>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-6">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center border-4 border-dashed border-slate-200">
                        <FileText size={32} />
                      </div>
                      <p className="text-sm font-bold tracking-widest uppercase">Select a Paper to Review</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}