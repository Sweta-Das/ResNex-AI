"use client";
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { auth, db, storage, signInWithGoogle } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// PDF Viewer Imports
import { Worker, Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';

export default function Workspace() {
  const { id } = useParams(); 
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [documents, setDocuments] = useState([]);
  const [activePdf, setActivePdf] = useState(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "projects", id, "messages"), orderBy("createdAt", "asc"));
    return onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, [user, id]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "projects", id, "documents"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      setDocuments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
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
    if (!file || file.type !== 'application/pdf') {
      alert("Please upload a PDF file");
      return;
    }
    const fileRef = ref(storage, `projects/${id}/${file.name}`);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    await addDoc(collection(db, "projects", id, "documents"), {
      name: file.name, url: url, createdAt: serverTimestamp()
    });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-200">
        <button onClick={signInWithGoogle} className="bg-blue-700 text-white px-8 py-3 rounded-lg font-bold shadow-2xl hover:bg-blue-800 transition-all">
          Sign in with Google to Collaborate
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-100 text-slate-900 overflow-hidden font-sans">
      
      {/* LEFT COLUMN: CHAT (Deep Navy Header, Light Gray Body) */}
      <div className="w-[450px] flex flex-col bg-white border-r border-slate-300 shadow-2xl z-10">
        <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
          <h2 className="font-black tracking-tight">RESEARCH CHAT: {id}</h2>
          <span className="text-[10px] bg-blue-500 px-2 py-1 rounded-full uppercase font-bold">Live</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50">
          {messages.map(m => (
            <div key={m.id} className={`flex flex-col ${m.uid === user.uid ? "items-end" : "items-start"}`}>
              <span className="text-[10px] font-bold text-slate-500 mb-1 px-2 uppercase tracking-widest">{m.sender}</span>
              <div className={`p-4 rounded-2xl max-w-[85%] shadow-sm leading-relaxed text-sm ${
                m.uid === user.uid 
                ? "bg-blue-600 text-white rounded-tr-none" 
                : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"
              }`}>
                {m.text}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={sendMessage} className="p-4 bg-white border-t border-slate-200 flex gap-2">
          <input 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            className="flex-1 border border-slate-300 p-3 rounded-xl bg-slate-50 text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400" 
            placeholder="Discuss findings..." 
          />
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl font-bold px-5 transition-colors">
            SEND
          </button>
        </form>
      </div>

      {/* RIGHT COLUMN: PDF VIEWER (Professional Workspace) */}
      <div className="flex-1 flex flex-col bg-slate-200">
        <div className="p-4 bg-white border-b border-slate-300 flex justify-between items-center shadow-sm">
          <div className="flex gap-3 items-center">
            <label className="bg-slate-800 text-white px-4 py-2 rounded-lg cursor-pointer text-xs font-bold hover:bg-slate-700 transition-colors uppercase tracking-tight">
              + UPLOAD PAPER
              <input type="file" onChange={handleFileUpload} className="hidden" accept=".pdf" />
            </label>
            
            <select 
              className="border border-slate-300 p-2 rounded-lg text-xs font-semibold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500" 
              onChange={(e) => setActivePdf(e.target.value)}
              value={activePdf || ""}
            >
              <option value="">-- SELECT SHARED DOCUMENT --</option>
              {documents.map(doc => <option key={doc.id} value={doc.url}>{doc.name}</option>)}
            </select>
          </div>
          <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Shared STEM Workspace</div>
        </div>

        {/* PDF Rendering Area */}
        <div className="flex-1 overflow-auto p-4 flex justify-center bg-slate-300">
          <div className="w-full max-w-5xl h-full shadow-2xl bg-white rounded-lg overflow-hidden border border-slate-400">
            {activePdf ? (
              <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
                  <Viewer fileUrl={activePdf} />
              </Worker>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center animate-pulse">
                   📄
                </div>
                <p className="font-bold uppercase tracking-widest text-xs">Awaiting Research Material</p>
                <p className="text-xs text-slate-400">Upload a PDF to view it with your team</p>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}