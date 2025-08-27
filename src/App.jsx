import { useState, useRef } from 'react'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('save')
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


  const [authToken, setAuthToken] = useState('your-jwt-token-here')
  const [importJsonText, setImportJsonText] = useState('')

  const handleImportJson = () => {
    try {
      const jsonData = JSON.parse(importJsonText)

      // Update saveFormData with parsed JSON
      setSaveFormData(prev => ({
        ...prev,
        ...jsonData
      }))

      // Update fileDescriptions if present in JSON
      if (jsonData.fileDescriptions) {
        setFileDescriptions(prev => ({
          ...prev,
          ...jsonData.fileDescriptions
        }))
      }

      // Clear the import text
      setImportJsonText('')

      console.log('Successfully imported JSON data:', jsonData)
      alert('JSON data imported successfully!')

    } catch (error) {
      console.error('Error parsing JSON:', error)
      alert('Invalid JSON format. Please check your JSON syntax.')
    }
  }

  const handleExportJson = () => {
    const exportData = {
      ...saveFormData,
      fileDescriptions: fileDescriptions
    }

    const jsonString = JSON.stringify(exportData, null, 2)
    navigator.clipboard.writeText(jsonString).then(() => {
      alert('Current form data copied to clipboard!')
    }).catch(() => {
      // Fallback: show in alert
      prompt('Copy this JSON:', jsonString)
    })
  }

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
      // Check if we have any files to upload
      const hasFiles = Object.values(saveFiles).some(file => file !== null)

      if (hasFiles) {
        // Use FormData when files are present
        const formData = new FormData()

        // Add form fields to FormData
        Object.entries(saveFormData).forEach(([key, value]) => {
          if (value) {
            formData.append(key, value)
          }
        })

        // Add file descriptions as JSON string
        formData.append('fileDescriptions', JSON.stringify(fileDescriptions))

        // Add files
        Object.entries(saveFiles).forEach(([key, file]) => {
          if (file) {
            formData.append(key, file)
          }
        })

        // Debug: Log what we're sending
        console.log('Sending FormData with files:')
        for (let [key, value] of formData.entries()) {
          console.log(key, ':', value instanceof File ? `File: ${value.name}` : value)
        }

        const res = await fetch('http://localhost:3001/vbmaster/perubahan-status-disposisi/save', {
          method: 'POST',
          headers: {
            'authentication': `${authToken}`
            // Don't set Content-Type header for FormData - browser will set it automatically with boundary
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
      } else {
        // Use JSON when no files are present
        const jsonPayload = {
          // Always include required fields
          status: saveFormData.status || '1',
          typeBBBK: saveFormData.typeBBBK || 'BB',

          // Add other form fields
          ...Object.fromEntries(
            Object.entries(saveFormData).filter(([key, value]) => value && key !== 'status' && key !== 'typeBBBK')
          ),

          // Add file descriptions
          fileDescriptions: fileDescriptions
        }

        // Debug: Log what we're sending
        console.log('Sending JSON payload (no files):', jsonPayload)

        const res = await fetch('http://localhost:3001/vbmaster/perubahan-status-disposisi/save', {
          method: 'POST',
          headers: {
            'authentication': `${authToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(jsonPayload)
        })

        const data = await res.json()
        setResponse({
          status: res.status,
          statusText: res.statusText,
          headers: Object.fromEntries(res.headers.entries()),
          data
        })
      }
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
          'authentication': `${authToken}`
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

  return (
    <div className="app">
      <header className="header">
        <h1>🚀 Backend Endpoint Tester</h1>
        <p>Testing tool for Perubahan Status Disposisi API</p>

        <div className="nav-tabs">
          <button
            className={`nav-tab ${currentPage === 'general' ? 'active' : ''}`}
            onClick={() => setCurrentPage('general')}
          >
            General API Test
          </button>
          <button
            className={`nav-tab ${currentPage === 'save' ? 'active' : ''}`}
            onClick={() => setCurrentPage('save')}
          >
            Save Endpoint Test
          </button>
        </div>
      </header>

      {currentPage === 'general' && (
        <div className="container">
          <div className="request-section">
            <h2>General Request Configuration</h2>

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
                placeholder="http://localhost:3001/vbmaster/perubahan-status-disposisi/find"
              />
            </div>

            <div className="form-group">
              <label>Headers (JSON):</label>
              <textarea
                value={headers}
                onChange={(e) => setHeaders(e.target.value)}
                placeholder='{"Content-Type": "application/json", "authentication": "token"}'
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
      )}

      {currentPage === 'save' && (
        <div className="container save-endpoint">
          <div className="request-section">
            <h2>Save Endpoint Configuration</h2>

            <div className="form-group">
              <label>Auth Token:</label>
              <input
                type="text"
                value={authToken}
                onChange={(e) => setAuthToken(e.target.value)}
                placeholder="your-jwt-token-here"
              />
            </div>

            <div className="json-import-section">
              <h3>🚀 Quick Fill with JSON</h3>
              <div className="form-group">
                <label>Paste JSON Data:</label>
                <textarea
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  placeholder='{"status": "1", "typeBBBK": "BB", "alasan": "Test reason", "noAnalisa": "TEST001", "batchNo": "BATCH001", "itemId": "ITEM001", "itemName": "Test Item", "suppId": "SUPP001", "suppName": "Test Supplier", "prcId": "PRC001", "prcName": "Test Principle", "jumAwal": "100", "jumWadahAwal": "10", "fileDescriptions": {"file": "Main document", "file01": "Supporting doc 1"}}'
                  rows={4}
                  style={{fontFamily: 'monospace', fontSize: '12px'}}
                />
              </div>
              <div className="action-buttons">
                <button onClick={handleImportJson} className="import-btn" disabled={!importJsonText.trim()}>
                  📥 Import JSON to Form
                </button>
                <button onClick={handleExportJson} className="export-btn">
                  📤 Export Form to JSON
                </button>
                <button onClick={() => setImportJsonText('')} className="clear-btn">
                  🗑️ Clear JSON
                </button>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>No Permohonan:</label>
                <input
                  type="text"
                  value={saveFormData.noPermohonan}
                  onChange={(e) => setSaveFormData(prev => ({...prev, noPermohonan: e.target.value}))}
                  placeholder="Auto-generated if empty"
                />
              </div>

              <div className="form-group">
                <label>Type BB/BK:</label>
                <select
                  value={saveFormData.typeBBBK}
                  onChange={(e) => setSaveFormData(prev => ({...prev, typeBBBK: e.target.value}))}
                >
                  <option value="BB">BB (Bahan Baku)</option>
                  <option value="BK">BK (Bahan Kemas)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Status:</label>
                <select
                  value={saveFormData.status}
                  onChange={(e) => setSaveFormData(prev => ({...prev, status: e.target.value}))}
                >
                  <option value="1">Status 1</option>
                  <option value="2">Status 2</option>
                  <option value="3">Status 3</option>
                  <option value="4">Status 4</option>
                  <option value="5">Status 5</option>
                </select>
              </div>

              <div className="form-group">
                <label>Alasan:</label>
                <input
                  type="text"
                  value={saveFormData.alasan}
                  onChange={(e) => setSaveFormData(prev => ({...prev, alasan: e.target.value}))}
                  placeholder="Reason for rejection"
                />
              </div>

              <div className="form-group">
                <label>No Analisa:</label>
                <input
                  type="text"
                  value={saveFormData.noAnalisa}
                  onChange={(e) => setSaveFormData(prev => ({...prev, noAnalisa: e.target.value}))}
                  placeholder="Analysis number"
                />
              </div>

              <div className="form-group">
                <label>Batch No:</label>
                <input
                  type="text"
                  value={saveFormData.batchNo}
                  onChange={(e) => setSaveFormData(prev => ({...prev, batchNo: e.target.value}))}
                  placeholder="Batch number"
                />
              </div>

              <div className="form-group">
                <label>Item ID:</label>
                <input
                  type="text"
                  value={saveFormData.itemId}
                  onChange={(e) => setSaveFormData(prev => ({...prev, itemId: e.target.value}))}
                  placeholder="Item ID"
                />
              </div>

              <div className="form-group">
                <label>Item Name:</label>
                <input
                  type="text"
                  value={saveFormData.itemName}
                  onChange={(e) => setSaveFormData(prev => ({...prev, itemName: e.target.value}))}
                  placeholder="Item name"
                />
              </div>

              <div className="form-group">
                <label>Supplier ID:</label>
                <input
                  type="text"
                  value={saveFormData.suppId}
                  onChange={(e) => setSaveFormData(prev => ({...prev, suppId: e.target.value}))}
                  placeholder="Supplier ID"
                />
              </div>

              <div className="form-group">
                <label>Supplier Name:</label>
                <input
                  type="text"
                  value={saveFormData.suppName}
                  onChange={(e) => setSaveFormData(prev => ({...prev, suppName: e.target.value}))}
                  placeholder="Supplier name"
                />
              </div>

              <div className="form-group">
                <label>Principle ID:</label>
                <input
                  type="text"
                  value={saveFormData.prcId}
                  onChange={(e) => setSaveFormData(prev => ({...prev, prcId: e.target.value}))}
                  placeholder="Principle ID"
                />
              </div>

              <div className="form-group">
                <label>Principle Name:</label>
                <input
                  type="text"
                  value={saveFormData.prcName}
                  onChange={(e) => setSaveFormData(prev => ({...prev, prcName: e.target.value}))}
                  placeholder="Principle name"
                />
              </div>

              <div className="form-group">
                <label>Jumlah Awal:</label>
                <input
                  type="number"
                  value={saveFormData.jumAwal}
                  onChange={(e) => setSaveFormData(prev => ({...prev, jumAwal: e.target.value}))}
                  placeholder="Initial quantity"
                />
              </div>

              <div className="form-group">
                <label>Jumlah Wadah Awal:</label>
                <input
                  type="number"
                  value={saveFormData.jumWadahAwal}
                  onChange={(e) => setSaveFormData(prev => ({...prev, jumWadahAwal: e.target.value}))}
                  placeholder="Initial container count"
                />
              </div>

              <div className="form-group">
                <label>Disposisi:</label>
                <select
                  value={saveFormData.disposisi}
                  onChange={(e) => setSaveFormData(prev => ({...prev, disposisi: e.target.value}))}
                >
                  <option value="">Select Disposisi</option>
                  <option value="DISETUJUI">DISETUJUI</option>
                  <option value="TIDAK DISETUJUI">TIDAK DISETUJUI</option>
                </select>
              </div>

              <div className="form-group">
                <label>Keterangan:</label>
                <textarea
                  value={saveFormData.keterangan}
                  onChange={(e) => setSaveFormData(prev => ({...prev, keterangan: e.target.value}))}
                  placeholder="Additional notes"
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>Tanggal Tempel:</label>
                <input
                  type="date"
                  value={saveFormData.tglTempel}
                  onChange={(e) => setSaveFormData(prev => ({...prev, tglTempel: e.target.value}))}
                />
              </div>

              <div className="form-group">
                <label>Inspektor:</label>
                <input
                  type="text"
                  value={saveFormData.inspektor}
                  onChange={(e) => setSaveFormData(prev => ({...prev, inspektor: e.target.value}))}
                  placeholder="Inspector name"
                />
              </div>

              <div className="form-group">
                <label>Tindak Lanjut:</label>
                <textarea
                  value={saveFormData.tindakLanjut}
                  onChange={(e) => setSaveFormData(prev => ({...prev, tindakLanjut: e.target.value}))}
                  placeholder="Follow-up actions"
                  rows={3}
                />
              </div>
            </div>

            <div className="file-upload-section">
              <h3>📎 File Upload</h3>
              <p style={{color: '#e74c3c', marginBottom: '1rem', fontWeight: 'bold'}}>
                ⚠️ At least one file is REQUIRED for new records (when No Permohonan is empty)
              </p>
              <p style={{color: '#666', marginBottom: '1rem'}}>
                Note: When files are selected, data will be sent as FormData. Otherwise, it will be sent as JSON.
              </p>

              {['file', 'file01', 'file02', 'file03'].map((fileKey, index) => (
                <div key={fileKey} className="file-upload-group">
                  <h4>File {index === 0 ? '' : `0${index}`} {index === 0 ? '(Main - Required for new records)' : '(Optional)'}</h4>

                  <div className="form-group">
                    <label>Description:</label>
                    <input
                      type="text"
                      value={fileDescriptions[fileKey]}
                      onChange={(e) => setFileDescriptions(prev => ({...prev, [fileKey]: e.target.value}))}
                      placeholder={`Description for file ${index === 0 ? '' : `0${index}`}`}
                    />
                  </div>

                  <div className="form-group">
                    <label>Choose File:</label>
                    <input
                      type="file"
                      onChange={(e) => handleSaveFileUpload(fileKey, e)}
                      accept="*/*"
                    />
                    {saveFiles[fileKey] && (
                      <div className="file-info">
                        ✅ Selected: {saveFiles[fileKey].name} ({(saveFiles[fileKey].size / 1024).toFixed(2)} KB)
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <div className="files-summary">
                <h4>📋 Files Summary:</h4>
                <p>Files selected: {Object.values(saveFiles).filter(file => file !== null).length}/4</p>
                {Object.values(saveFiles).some(file => file !== null) ? (
                  <p style={{color: '#27ae60'}}>✅ Will send as FormData (with files)</p>
                ) : (
                  <p style={{color: '#e74c3c'}}>❌ Will send as JSON (no files) - may fail for new records</p>
                )}
              </div>
            </div>            <div className="action-buttons">
              <button onClick={handleSaveEndpointTest} disabled={loading} className="send-btn">
                {loading ? '⏳ Saving...' : '💾 Save Data'}
              </button>
              <button onClick={clearSaveForm} className="clear-btn">
                🗑️ Clear Form
              </button>
            </div>

            <div className="form-debug">
              <h3>📊 Current Form Data (Debug)</h3>
              <pre style={{fontSize: '12px', background: '#f1f5f9', padding: '1rem', borderRadius: '4px'}}>
                Status: {saveFormData.status || '1'}
                {'\n'}Type BB/BK: {saveFormData.typeBBBK || 'BB'}
                {'\n'}Alasan: {saveFormData.alasan || '(empty)'}
                {'\n'}No Analisa: {saveFormData.noAnalisa || '(empty)'}
                {'\n'}JSON Payload: {JSON.stringify({
                  status: saveFormData.status || '1',
                  typeBBBK: saveFormData.typeBBBK || 'BB',
                  ...Object.fromEntries(
                    Object.entries(saveFormData).filter(([key, value]) => value && key !== 'status' && key !== 'typeBBBK')
                  ),
                  fileDescriptions: fileDescriptions
                }, null, 2)}
              </pre>
            </div>
          </div>

          <div className="response-section">
            <h2>Response & Download Tools</h2>

            <div className="download-tools">
              <h3>📥 Download File Tools</h3>
              <div className="download-buttons">
                <input
                  type="text"
                  placeholder="No Reject DNC for download"
                  className="download-input"
                  id="downloadNoReject"
                />
                <button onClick={() => {
                  const noReject = document.getElementById('downloadNoReject').value
                  if (noReject) handleDownloadFile('file', noReject)
                }} className="download-btn">
                  📄 Check File
                </button>
                <button onClick={() => {
                  const noReject = document.getElementById('downloadNoReject').value
                  if (noReject) handleDownloadFile('file01', noReject)
                }} className="download-btn">
                  📄 Check File01
                </button>
                <button onClick={() => {
                  const noReject = document.getElementById('downloadNoReject').value
                  if (noReject) handleDownloadFile('file02', noReject)
                }} className="download-btn">
                  📄 Check File02
                </button>
                <button onClick={() => {
                  const noReject = document.getElementById('downloadNoReject').value
                  if (noReject) handleDownloadFile('file03', noReject)
                }} className="download-btn">
                  📄 Check File03
                </button>
              </div>
            </div>

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
      )}
    </div>
  )
}

export default App
