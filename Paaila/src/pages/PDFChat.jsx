import { useState, useEffect, useRef } from 'react'
import '../App.css'

function PDFChat() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [documents, setDocuments] = useState([])
  const [selectedDoc, setSelectedDoc] = useState('')
  const [summaryText, setSummaryText] = useState('Select a document to view its summary...')
  const [question, setQuestion] = useState('')
  const [chatMessages, setChatMessages] = useState([])
  const fileInputRef = useRef(null)

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev)
  }

  const loadDocuments = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/documents/')
      if (!response.ok) {
        const errText = await response.text()
        console.error('Error response body:', errText)
        throw new Error('Failed to fetch documents')
      }

      const data = await response.json()
      setDocuments(data.documents || [])
    } catch (error) {
      console.error('Fetch error:', error)
      alert('Error loading documents!')
    }
  }

  useEffect(() => {
    loadDocuments()
  }, [])

  useEffect(() => {
    if (!selectedDoc) {
      setSummaryText('Select a document to view its summary...')
      return
    }

    const fetchSummary = async () => {
      setSummaryText('Generating summary...')
      try {
        const response = await fetch('http://127.0.0.1:8000/summarize/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            document_id: selectedDoc,
          }),
        })

        const data = await response.json()
        setSummaryText(data.summary || 'No summary available.')
      } catch (error) {
        console.error(error)
        setSummaryText('Error generating summary.')
      }
    }

    fetchSummary()
  }, [selectedDoc])

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

  const askQuestion = async () => {
    if (!selectedDoc || !question) {
      alert('Please select a document and enter a question!')
      return
    }

    const userId = `user-${Date.now()}`
    const loadingId = `loading-${Date.now()}`

    setChatMessages((prev) => [
      { id: loadingId, type: 'bot', text: 'Loading...' },
      { id: userId, type: 'user', text: question },
      ...prev,
    ])

    try {
      const response = await fetch('http://127.0.0.1:8000/chat/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_id: selectedDoc,
          question: question,
        }),
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
          msg.id === loadingId ? { ...msg, text: data.answer } : msg
        )
      )
      setQuestion('')
    } catch (error) {
      console.error(error)
      alert('Failed to get answer!')
      setChatMessages((prev) => prev.filter((msg) => msg.id !== loadingId))
    }
  }

  return (
    <>
      {/* Navigation Menu Bar */}
      <nav className="menu-bar">
        <div className="menu-container">
          <div className="menu-logo">
            <button type="button" className="menu-link upload-toggle" onClick={toggleSidebar}>
              Upload PDF
            </button>
          </div>
          <div className="menu-links">
            <a href="/home" className="menu-link">Home</a>
            <a href="/pdf-chat" className="menu-link active">PDF Chatbot</a>
            <a href="/resume-parser" className="menu-link">Resume Parser</a>
          </div>
        </div>
      </nav>

      <div
        className={`overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={toggleSidebar}
      />

      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <button className="sidebar-close" onClick={toggleSidebar}>
          ✕
        </button>
        <h2>Upload PDF</h2>
        <div className="form-group">
          <input type="file" ref={fileInputRef} accept=".pdf" />
        </div>
        <button onClick={uploadPDF}>Upload Document</button>
        <p className="note">After upload, note down the Document ID provided.</p>
      </div>

      <div className="main-content">
        <div className="header">
          <h1>PDF Chatbot</h1>
          <p>Upload your PDF and ask questions</p>
        </div>

        <div className="summary-section">
          <h2>Summary:</h2>
          <div className="summary-box">{summaryText}</div>
        </div>

        <div className="chat-container">
          <div className="input-section">
            <div className="input-group">
              <label htmlFor="document-select">Select Document:</label>
              <select
                id="document-select"
                value={selectedDoc}
                onChange={(event) => setSelectedDoc(event.target.value)}
              >
                <option value="">-- Select a document --</option>
                {documents.map((doc) => (
                  <option key={doc} value={doc}>
                    {doc}
                  </option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label htmlFor="question-input">Question:</label>
              <input
                id="question-input"
                type="text"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyPress={(event) => {
                  if (event.key === 'Enter') {
                    askQuestion()
                  }
                }}
                placeholder="Ask your question"
              />
            </div>
            <button className="ask-button" onClick={askQuestion}>
              Ask Question
            </button>
          </div>

          <div className="answer-section">
            <h2>Answer:</h2>
            <div className="chat-messages">
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`chat-bubble ${msg.type}`}>
                  {msg.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default PDFChat
