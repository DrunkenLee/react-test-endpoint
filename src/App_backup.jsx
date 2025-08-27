import { useState, useRef } from 'react'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('general')
  const [endpoint, setEndpoint] = useState('http://localhost:3001/vbmaster')
  const [method, setMethod] = useState('GET')
  const [headers, setHeaders] = useState('{"Content-Type": "application/json"}')
  const [body, setBody] = useState('')
  const [response, setResponse] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [pdfUrl, setPdfUrl] = useState(null)
  const fileInputRef = useRef(null)

  // Save endpoint specific states
  const [saveFormData, setSaveFormData] = useState({
    noPermohonan: '',
    typeBBBK: 'BB',
    status: '1',
    alasan: '',
    noAnalisa: '',
    batchNo: '',
    itemId: '',
    itemName: '',
    suppId: '',
    suppName: '',
    prcId: '',
    prcName: '',
    jumAwal: '',
    jumWadahAwal: '',
    disposisi: '',
    keterangan: '',
    tglTempel: '',
    inspektor: '',
    tindakLanjut: ''
  })

  const [saveFiles, setSaveFiles] = useState({
    file: null,
    file01: null,
    file02: null,
    file03: null
  })

  const [fileDescriptions, setFileDescriptions] = useState({
    file: '',
    file01: '',
    file02: '',
    file03: ''
  })

  const [authToken, setAuthToken] = useState('your-jwt-token-here')tate, useRef } from 'react'
import './App.css'

function App() {
  const [endpoint, setEndpoint] = useState('http://localhost:3001/vbmaster')
  const [method, setMethod] = useState('GET')
  const [headers, setHeaders] = useState('{"Content-Type": "application/json"}')
  const [body, setBody] = useState('')
  const [response, setResponse] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [pdfUrl, setPdfUrl] = useState(null)
  const fileInputRef = useRef(null)

  const handleRequest = async () => {
    setLoading(true)
    setError(null)
    setResponse(null)
    setPdfUrl(null)

    try {
      let parsedHeaders = {}
      if (headers.trim()) {
        parsedHeaders = JSON.parse(headers)
      }

      const options = {
        method,
        headers: parsedHeaders,
      }

      if (method !== 'GET' && method !== 'HEAD' && body) {
        if (parsedHeaders['Content-Type']?.includes('application/json')) {
          options.body = JSON.stringify(JSON.parse(body))
        } else {
          options.body = body
        }
      }

      const res = await fetch(endpoint, options)

      const contentType = res.headers.get('content-type')

      if (contentType?.includes('application/pdf')) {
        // Handle PDF response
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        setPdfUrl(url)
        setResponse({
          status: res.status,
          statusText: res.statusText,
          headers: Object.fromEntries(res.headers.entries()),
          type: 'PDF',
          size: blob.size
        })
      } else if (contentType?.includes('application/json')) {
        // Handle JSON response
        const data = await res.json()
        setResponse({
          status: res.status,
          statusText: res.statusText,
          headers: Object.fromEntries(res.headers.entries()),
          data
        })
      } else {
        // Handle text response
        const text = await res.text()
        setResponse({
          status: res.status,
          statusText: res.statusText,
          headers: Object.fromEntries(res.headers.entries()),
          data: text
        })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveEndpointTest = async () => {
    setLoading(true)
    setError(null)
    setResponse(null)

    try {
      const formData = new FormData()

      // Add form fields
      Object.entries(saveFormData).forEach(([key, value]) => {
        if (value) formData.append(key, value)
      })

      // Add file descriptions
      formData.append('fileDescriptions', JSON.stringify(fileDescriptions))

      // Add files
      Object.entries(saveFiles).forEach(([key, file]) => {
        if (file) formData.append(key, file)
      })

      const res = await fetch('http://localhost:3001/vbmaster/perubahan-status-disposisi/save', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: formData
      })

      const data = await res.json()
      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries()),
        data
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setBody(e.target.result)
      }
      reader.readAsText(file)
    }
  }

  const handleSaveFileUpload = (fileKey, event) => {
    const file = event.target.files[0]
    if (file) {
      setSaveFiles(prev => ({
        ...prev,
        [fileKey]: file
      }))
    }
  }

  const handleDownloadFile = async (fileEndpoint, noRejectDnc) => {
    try {
      const response = await fetch(`http://localhost:3001/vbmaster/perubahan-status-disposisi/${fileEndpoint}?noRejectDnc=${noRejectDnc}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })
      const data = await response.json()
      setResponse({
        status: response.status,
        statusText: response.statusText,
        data: data
      })
    } catch (err) {
      setError(err.message)
    }
  }

  const downloadPdf = () => {
    if (pdfUrl) {
      const a = document.createElement('a')
      a.href = pdfUrl
      a.download = 'response.pdf'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }

  const clearAll = () => {
    setResponse(null)
    setError(null)
    setPdfUrl(null)
    setBody('')
  }

  const clearSaveForm = () => {
    setSaveFormData({
      noPermohonan: '',
      typeBBBK: 'BB',
      status: '1',
      alasan: '',
      noAnalisa: '',
      batchNo: '',
      itemId: '',
      itemName: '',
      suppId: '',
      suppName: '',
      prcId: '',
      prcName: '',
      jumAwal: '',
      jumWadahAwal: '',
      disposisi: '',
      keterangan: '',
      tglTempel: '',
      inspektor: '',
      tindakLanjut: ''
    })
    setSaveFiles({
      file: null,
      file01: null,
      file02: null,
      file03: null
    })
    setFileDescriptions({
      file: '',
      file01: '',
      file02: '',
      file03: ''
    })
    setResponse(null)
    setError(null)
  }

  const downloadPdf = () => {
    if (pdfUrl) {
      const a = document.createElement('a')
      a.href = pdfUrl
      a.download = 'response.pdf'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }

  const clearAll = () => {
    setResponse(null)
    setError(null)
    setPdfUrl(null)
    setBody('')
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Mike's Lab</h1>
        <p>Buat ngetes doang</p>
      </header>

      <div className="container">
        <div className="request-section">
          <h2>Request Configuration</h2>

          <div className="form-group">
            <label>Method:</label>
            <select value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
              <option value="PATCH">PATCH</option>
            </select>
          </div>

          <div className="form-group">
            <label>Endpoint URL:</label>
            <input
              type="text"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="http://localhost:3001/vbmaster/generate-pdf"
            />
          </div>

          <div className="form-group">
            <label>Headers (JSON):</label>
            <textarea
              value={headers}
              onChange={(e) => setHeaders(e.target.value)}
              placeholder='{"Content-Type": "application/json", "Authorization": "Bearer token"}'
              rows={3}
            />
          </div>

          {method !== 'GET' && method !== 'HEAD' && (
            <div className="form-group">
              <label>Request Body:</label>
              <div className="body-controls">
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder='{"key": "value"} or raw text'
                  rows={6}
                />
                <div className="file-upload">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="upload-btn"
                  >
                    📁 Load from File
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="action-buttons">
            <button onClick={handleRequest} disabled={loading} className="send-btn">
              {loading ? '⏳ Sending...' : '🚀 Send Request'}
            </button>
            <button onClick={clearAll} className="clear-btn">
              🗑️ Clear
            </button>
          </div>
        </div>

        <div className="response-section">
          <h2>Response</h2>

          {error && (
            <div className="error">
              <h3>❌ Error</h3>
              <pre>{error}</pre>
            </div>
          )}

          {response && (
            <div className="response">
              <div className="response-status">
                <span className={`status ${response.status < 400 ? 'success' : 'error'}`}>
                  {response.status} {response.statusText}
                </span>
              </div>

              <div className="response-headers">
                <h3>Headers:</h3>
                <pre>{JSON.stringify(response.headers, null, 2)}</pre>
              </div>

              {response.type === 'PDF' && (
                <div className="pdf-response">
                  <h3>📄 PDF Response ({(response.size / 1024).toFixed(2)} KB)</h3>
                  <div className="pdf-actions">
                    <button onClick={downloadPdf} className="download-btn">
                      📥 Download PDF
                    </button>
                    <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="view-btn">
                      👁️ View PDF
                    </a>
                  </div>
                  <iframe src={pdfUrl} className="pdf-preview" title="PDF Preview"></iframe>
                </div>
              )}

              {response.data && (
                <div className="response-data">
                  <h3>Response Data:</h3>
                  <pre>{typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
