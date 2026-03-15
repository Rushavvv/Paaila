import { useState, useEffect, useRef } from 'react'
import '../App.css'

function PDFChat() {
  const [sidebarOpen, setSidebarOpen]   = useState(false)
  const [documents, setDocuments]       = useState([])
  const [selectedDoc, setSelectedDoc]   = useState('')
  const [summaryText, setSummaryText]   = useState('')
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [question, setQuestion]         = useState('')
  const [chatMessages, setChatMessages] = useState([])
  const fileInputRef = useRef(null)
  const chatEndRef   = useRef(null)

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

  /* ── Load chat history when doc changes ── */
  useEffect(() => {
    const loadHistory = async () => {
      if (!selectedDoc) { setChatMessages([]); return }
      try {
        const response = await fetch(
          `http://127.0.0.1:8000/chat/history?document_id=${encodeURIComponent(selectedDoc)}`,
          { headers: { ...getAuthHeaders() } }
        )
        if (!response.ok) return
        const data = await response.json()
        const historyMessages = (data.history || []).flatMap((row) => ([
          { id: `bot-${row.id}`,  type: 'bot',  text: row.answer   },
          { id: `user-${row.id}`, type: 'user', text: row.question },
        ]))
        setChatMessages(historyMessages)
      } catch (error) { console.error(error) }
    }
    loadHistory()
  }, [selectedDoc])

  /* ── Fetch summary when doc changes ── */
  useEffect(() => {
    if (!selectedDoc) { setSummaryText(''); return }
    const fetchSummary = async () => {
      setSummaryLoading(true)
      setSummaryText('')
      try {
        const response = await fetch('http://127.0.0.1:8000/summarize/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({ document_id: selectedDoc }),
        })
        const data = await response.json()
        setSummaryText(data.summary || 'No summary available.')
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
    const userId    = `user-${Date.now()}`
    const loadingId = `loading-${Date.now()}`
    setChatMessages((prev) => [
      { id: loadingId, type: 'bot',  text: 'Thinking...', isLoading: true },
      { id: userId,    type: 'user', text: question },
      ...prev,
    ])
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
      setChatMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingId ? { ...msg, text: data.answer, isLoading: false } : msg
        )
      )
    } catch (error) {
      console.error(error)
      alert('Failed to get answer!')
      setChatMessages((prev) => prev.filter((msg) => msg.id !== loadingId))
    }
  }

  /* ── Enter key to submit ── */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') askQuestion()
  }

  return (
    <div className="pdf-page">

      {/* ── Navbar ── */}
      <nav className="menu-bar">
        <div className="menu-container">
          <div className="menu-logo">
            {/* Upload trigger lives in nav-left */}
            <button type="button" className="menu-link upload-toggle" onClick={toggleSidebar}>
              ↑ Upload PDF
            </button>
          </div>
          <div className="menu-links">
            <a href="/home"          className="menu-link">Home</a>
            <a href="/pdf-chat"      className="menu-link active">PDF Chatbot</a>
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
          <p>Upload a document, then ask anything about it in plain language.</p>
        </div>

        {/* Two-column layout */}
        <div className="pdf-layout">

          {/* ── Left: Summary ── */}
          <div className="summary-section">
            <p className="section-title">Document Summary</p>
            <div className={`summary-box${summaryLoading ? ' loading' : ''}`}>
              {summaryLoading
                ? 'Generating summary...'
                : summaryText || 'Select a document to view its AI-generated summary.'}
            </div>
          </div>

          {/* ── Right: Chat ── */}
          <div className="chat-container">

            {/* Inputs */}
            <div className="input-section">
              <div className="input-group">
                <label htmlFor="document-select">Select Document</label>
                <select
                  id="document-select"
                  value={selectedDoc}
                  onChange={(e) => setSelectedDoc(e.target.value)}
                >
                  <option value="">-- choose a document --</option>
                  {documents.map((doc) => (
                    <option key={doc} value={doc}>{doc}</option>
                  ))}
                </select>
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

              <button className="ask-button" onClick={askQuestion}>
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
                  chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`chat-bubble ${msg.type}${msg.isLoading ? ' loading' : ''}`}
                    >
                      {msg.isLoading ? null : msg.text}
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

export default PDFChat