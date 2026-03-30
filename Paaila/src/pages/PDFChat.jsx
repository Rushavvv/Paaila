import { useState, useEffect, useRef } from 'react'
import Footer from '../components/Footer'
import '../App.css'

function PDFChat() {
  const [sidebarOpen, setSidebarOpen]   = useState(false)
  const [documents, setDocuments]       = useState([])
  const [selectedDoc, setSelectedDoc]   = useState('')
  const [summaryText, setSummaryText]   = useState(() => sessionStorage.getItem('pdfchat_summaryText') || '')
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [question, setQuestion]         = useState('')
  const [chatMessages, setChatMessages] = useState([])
  const [shouldScroll, setShouldScroll] = useState(false)
  const fileInputRef = useRef(null)
  const chatEndRef   = useRef(null)

  useEffect(() => {
    setSelectedDoc('');
    function checkToken() {
      const token = localStorage.getItem('token');
      if (!token) {
        setSelectedDoc('');
        setSummaryText('');
        setChatMessages([]);
        sessionStorage.removeItem('pdfchat_summaryText');
      }
    }
    checkToken();
    function onStorage(e) {
      if (e.key === 'token' && !e.newValue) {
        setSelectedDoc('');
        setSummaryText('');
        setChatMessages([]);
        sessionStorage.removeItem('pdfchat_summaryText');
      }
    }
    window.addEventListener('storage', onStorage);
    const interval = setInterval(checkToken, 60000);
    return () => {
      window.removeEventListener('storage', onStorage);
      clearInterval(interval);
    };
  }, []);

  // Scroll to bottom when chatMessages change
  useEffect(() => {
    if (shouldScroll && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
      setShouldScroll(false);
    }
  }, [chatMessages, shouldScroll]);

  /* ── Auth ── */
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  /* ── Sidebar ── */
  const toggleSidebar = () => setSidebarOpen((prev) => !prev)

  /* ── Load documents ── */
  const loadDocuments = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/documents/', {
        headers: { ...getAuthHeaders() },
      })
      if (!response.ok) throw new Error('Failed to fetch documents')
      const data = await response.json()
      setDocuments(data.documents || [])
    } catch (error) {
      console.error('Fetch error:', error)
      alert('Error loading documents!')
    }
  }


  useEffect(() => { loadDocuments() }, [])

  useEffect(() => {
    sessionStorage.setItem('pdfchat_summaryText', summaryText)
  }, [summaryText])

  /* ── Load chat history when doc changes ── */
  useEffect(() => {
    const loadHistory = async () => {
      if (!selectedDoc) { setChatMessages([]); return }
      // Show loading state for chat
      setChatMessages([{ id: 'loading-chat', type: 'bot', text: 'Loading chat history...', isLoading: true }]);
      try {
        const response = await fetch(
          `http://127.0.0.1:8000/chat/history?document_id=${encodeURIComponent(selectedDoc)}`,
          { headers: { ...getAuthHeaders() } }
        )
        if (!response.ok) {
          setChatMessages([])
          return
        }
        const data = await response.json()
        const historyMessages = (data.history || []).flatMap((row) => ([
          { id: `bot-${row.id}`,  type: 'bot',  text: row.answer,   date: row.date || row.timestamp || null },
          { id: `user-${row.id}`, type: 'user', text: row.question, date: row.date || row.timestamp || null },
        ]))
        setChatMessages(historyMessages)
      } catch (error) {
        setChatMessages([])
        console.error(error)
      }
    }
    if (selectedDoc) {
      loadHistory()
    } else {
      setChatMessages([])
    }
  }, [selectedDoc])

  /* ── Fetch summary when doc changes ── */
  useEffect(() => {
    if (!selectedDoc) { setSummaryText(''); setSummaryLoading(false); return }
    // Show loading state for summary
    setSummaryText('');
    setSummaryLoading(true);
    // Try to load summary from sessionStorage first
    const localKey = `pdfchat_summary_${selectedDoc}`
    const localSummary = sessionStorage.getItem(localKey)
    if (localSummary) {
      setSummaryText(localSummary)
      setSummaryLoading(false)
      return
    }
    const fetchSummary = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/summarize/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({ document_id: selectedDoc }),
        })
        const data = await response.json()
        setSummaryText(data.summary || 'No summary available.')
        sessionStorage.setItem(localKey, data.summary || 'No summary available.')
      } catch (error) {
        console.error(error)
        setSummaryText('Error generating summary.')
      } finally {
        setSummaryLoading(false)
      }
    }
    fetchSummary()
  }, [selectedDoc])

  /* ── Upload PDF ── */
  const uploadPDF = async () => {
    const fileInput = fileInputRef.current
    if (!fileInput || !fileInput.files.length) {
      alert('Please select a PDF first!')
      return
    }
    const formData = new FormData()
    formData.append('file', fileInput.files[0])
    try {
      const response = await fetch('http://127.0.0.1:8000/upload/', {
        method: 'POST',
        headers: { ...getAuthHeaders() },
        body: formData,
      })
      const data = await response.json()
      alert(`Upload successful! Your Document ID is: ${data.document_id}`)
      fileInput.value = ''
      await loadDocuments()
      setSelectedDoc(data.document_id)
    } catch (error) {
      console.error(error)
      alert('Failed to upload PDF!')
    }
  }

  /* ── Ask question ── */
  const askQuestion = async () => {
    if (!selectedDoc || !question) {
      alert('Please select a document and enter a question!')
      return
    }
    const now = new Date();
    const dateStr = now.toISOString();
    const userId    = `user-${Date.now()}`
    const loadingId = `loading-${Date.now()}`
    setChatMessages((prev) => [
      { id: loadingId, type: 'bot',  text: 'Thinking...', isLoading: true, date: dateStr },
      { id: userId,    type: 'user', text: question, date: dateStr },
      ...prev,
    ])
    setShouldScroll(true);
    const currentQuestion = question
    setQuestion('')
    try {
      const response = await fetch('http://127.0.0.1:8000/chat/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ document_id: selectedDoc, question: currentQuestion }),
      })
      if (!response.ok) {
        const err = await response.json()
        alert(`Error: ${err.detail || response.status}`)
        setChatMessages((prev) => prev.filter((msg) => msg.id !== loadingId))
        return
      }
      const data = await response.json()
      setChatMessages((prev) => {
        const updated = prev.map((msg) =>
          msg.id === loadingId ? { ...msg, text: data.answer, isLoading: false, date: data.created_at || dateStr } : msg
        )
        // Save chat history for this doc
        try {
          localStorage.setItem(`pdfchat_history_${selectedDoc}`, JSON.stringify(updated))
        } catch {}
        return updated
      })
    } catch (error) {
      console.error(error)
      alert('Failed to get answer!')
      setChatMessages((prev) => prev.filter((msg) => msg.id !== loadingId))
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') askQuestion()
  }

  // Add clear handler
  const handleClearAll = async () => {
    if (!selectedDoc) return;
    if (!window.confirm('Are you sure you want to clear all chat and summary data for this document?')) return;
    // Clear chat from backend
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://127.0.0.1:8000/chat/delete_history?document_id=${encodeURIComponent(selectedDoc)}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch (e) {
      // ignore errors
    }
    // Clear UI and storage
    setChatMessages([]);
    setSummaryText('');
    sessionStorage.removeItem('pdfchat_summaryText');
    sessionStorage.removeItem(`pdfchat_summary_${selectedDoc}`);
    localStorage.removeItem(`pdfchat_history_${selectedDoc}`);
  }

  return (
    <div className="pdf-page">

      {/* ── Navbar ── */}
      <nav className="menu-bar">
        <div className="menu-container">
          <div className="menu-logo">
            <span className="logo-text">
              Paaila
            </span>
          </div>
          <div className="menu-links">
            <a href="/home"          className="menu-link">Home</a>
            <a href="/chat"          className="menu-link active">PDF Chatbot</a>
            <a href="/resume-parser" className="menu-link">Resume Parser</a>
          </div>
        </div>
      </nav>

      {/* ── Overlay ── */}
      <div
        className={`overlay${sidebarOpen ? ' active' : ''}`}
        onClick={toggleSidebar}
      />

      {/* ── Sidebar ── */}
      <div className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <button className="sidebar-close" onClick={toggleSidebar} aria-label="Close sidebar">
          ✕
        </button>
        <h2>Upload PDF</h2>
        <div className="form-group">
          <label htmlFor="file-input">Select File</label>
          <input id="file-input" type="file" ref={fileInputRef} accept=".pdf" />
        </div>
        <button onClick={uploadPDF}>Upload Document</button>
        <p className="note">
          After upload, note down the Document ID shown — you'll need it to start chatting.
        </p>
      </div>

      {/* ── Main content ── */}
      <div className="main-content">

        {/* Header */}
        <div className="header">
          <span className="header-eyebrow">AI-Powered Document Intelligence</span>
          <h1>PDF <span>Chatbot</span></h1>
          <p>Upload a document, then ask anything about it.</p>
        </div>

        {/* Two-column layout */}
        <div className="pdf-layout">

          {/* ── Left: Summary ── */}
          <div className="summary-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <button
                style={{ background: 'var(--blue)', color: '#09090A', border: 'none', borderRadius: 16, padding: '6px 18px', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                title="Upload a PDF document"
              >
                ↑ Upload PDF
              </button>
              <button
                style={{ background: 'var(--blue)', color: '#09090A', border: 'none', borderRadius: 16, padding: '6px 18px', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}
                onClick={handleClearAll}
                title="Clear all chat and summary data for this document"
              >
                Clear All
              </button>
              <input
                type="file"
                ref={fileInputRef}
                accept=".pdf"
                style={{ display: 'none' }}
                onChange={async (e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    await uploadPDF();
                  }
                }}
              />
            </div>
            <p className="section-title">Document Summary</p>
            <div className={`summary-box${summaryLoading ? ' loading' : ''}`}>
              {summaryLoading
                ? 'Generating summary...'
                : summaryText || 'Summy will be displayed here'}
            </div>
          </div>

          {/* ── Right: Chat ── */}
          <div className="chat-container">

            {/* Inputs */}
            <div className="input-section">
              <div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: 8, flexDirection: 'row' }}>
                <label htmlFor="document-select" style={{ marginBottom: 0, marginRight: 8 }}>Select Document</label>
                <select
                  id="document-select"
                  value={selectedDoc}
                  onChange={(e) => {
                    setSelectedDoc(e.target.value);
                  }}
                  style={{ minWidth: 180 }}
                >
                  <option value="">-- choose a document --</option>
                  {documents.map((doc) => (
                    <option key={doc} value={doc}>{doc}</option>
                  ))}
                </select>
                {selectedDoc && (
                  <button
                    style={{ background: 'var(--blue)', color: '#09090A', border: 'none', borderRadius: 12, padding: '4px 12px', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', marginLeft: 8 }}
                    onClick={async () => {
                      if (!window.confirm('Are you sure you want to delete this document and all its data?')) return;
                      const token = localStorage.getItem('token');
                      const res = await fetch(`http://127.0.0.1:8000/documents/${encodeURIComponent(selectedDoc)}`, {
                        method: 'DELETE',
                        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        alert('Document deleted.');
        setSelectedDoc('');
        await loadDocuments();
        setChatMessages([]);
        setSummaryText('');
      } else {
        alert('Failed to delete document.');
      }
    }}
    title="Delete this document and all its data"
  >
    Delete
  </button>
                )}
              </div>

              <div className="input-group">
                <label htmlFor="question-input">Your Question</label>
                <input
                  id="question-input"
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything about this document..."
                />
              </div>

              <button
                className="ask-button"
                onClick={e => { e.preventDefault(); askQuestion(); }}
                type="button"
              >
                Ask →
              </button>
            </div>

            {/* Messages */}
            <div className="answer-section">
              <p className="section-title">Conversation</p>
              <div className="chat-messages">
                {chatMessages.length === 0 ? (
                  <div className="chat-empty">
                    <span className="chat-empty-icon">◈</span>
                    <span className="chat-empty-text">No messages yet</span>
                  </div>
                ) : (
                  [...chatMessages].reverse().map((msg, idx, arr) => {
                    // Show date above the first message, or when date changes
                    const showDate = idx === 0 || (msg.date && arr[idx - 1]?.date !== msg.date);
                    // Format ISO date string for display
                    let displayDate = '';
                    if (msg.date) {
                      try {
                        const d = new Date(msg.date);
                        displayDate = d.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: '2-digit' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      } catch { displayDate = msg.date; }
                    }
                    return (
                      <div key={msg.id} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: msg.type === 'user' ? 'flex-end' : 'flex-start' }}>
                        {showDate && msg.date && (
                          <div className="chat-date-label" style={{ textAlign: 'center', color: 'var(--muted2)', fontSize: 11, margin: '10px 0 2px 0', letterSpacing: '0.08em' }}>{displayDate}</div>
                        )}
                        <div
                          className={`chat-bubble ${msg.type}${msg.isLoading ? ' loading' : ''}`}
                          style={{ textAlign: msg.type === 'user' ? 'right' : 'left' }}
                        >
                          {msg.isLoading ? (msg.id === 'loading-chat' ? 'Loading chat history...' : '') : msg.text}
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={chatEndRef} />
              </div>
            </div>

          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default PDFChat