import { useState, useRef, useCallback, useEffect } from "react";
import { askQuestion, uploadDocument, loginUser, registerUser, getWorkspaces, createWorkspace, getToken, removeToken } from "./api";
import "./App.css";

type Message = {
  role: "user" | "ai";
  text: string;
  timestamp?: Date;
};

type Workspace = {
  id: string;
  name: string;
  createdAt: string;
  documents?: Array<{ id: string; title: string; createdAt: string }>;
};

export default function App() {
  // Messages stored per workspace: Map<workspaceId, Message[]>
  const [messagesByWorkspace, setMessagesByWorkspace] = useState<Map<string, Message[]>>(new Map());
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  
  // Workspace state
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");

  // Get messages for current workspace
  const messages = selectedWorkspaceId ? (messagesByWorkspace.get(selectedWorkspaceId) || []) : [];

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const uploadAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check authentication on mount
  useEffect(() => {
    const token = getToken();
    if (token) {
      setIsAuthenticated(true);
      loadWorkspaces();
    } else {
      setShowAuthModal(true);
    }
  }, []);

  const loadWorkspaces = async () => {
    try {
      setWorkspaceLoading(true);
      const data = await getWorkspaces();
      setWorkspaces(data.workspaces || []);
      if (data.workspaces && data.workspaces.length > 0 && !selectedWorkspaceId) {
        setSelectedWorkspaceId(data.workspaces[0].id);
      }
    } catch (error) {
      console.error("Failed to load workspaces:", error);
      if (error instanceof Error && error.message.includes("Not authenticated")) {
        setIsAuthenticated(false);
        removeToken();
        setShowAuthModal(true);
      }
    } finally {
      setWorkspaceLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      await loginUser(authEmail, authPassword);
      setIsAuthenticated(true);
      setShowAuthModal(false);
      setAuthEmail("");
      setAuthPassword("");
      await loadWorkspaces();
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Login failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      await registerUser(authEmail, authPassword);
      // Auto-login after registration
      await loginUser(authEmail, authPassword);
      setIsAuthenticated(true);
      setShowAuthModal(false);
      setAuthEmail("");
      setAuthPassword("");
      await loadWorkspaces();
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Registration failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    removeToken();
    setIsAuthenticated(false);
    setWorkspaces([]);
    setSelectedWorkspaceId(null);
    setMessagesByWorkspace(new Map());
    setShowAuthModal(true);
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;

    try {
      const data = await createWorkspace(newWorkspaceName.trim());
      await loadWorkspaces();
      setSelectedWorkspaceId(data.workspace.id);
      setNewWorkspaceName("");
      setShowCreateWorkspace(false);
    } catch (error) {
      console.error("Failed to create workspace:", error);
      alert(error instanceof Error ? error.message : "Failed to create workspace");
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file) return;
    if (!selectedWorkspaceId) {
      setUploadError("Please select a workspace first");
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      await uploadDocument(file, selectedWorkspaceId);
      setUploadedFile({
        name: file.name,
        size: file.size,
      });
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
      await loadWorkspaces(); // Refresh to get updated document count
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Failed to upload document");
      setUploadedFile(null);
    } finally {
      setUploading(false);
    }
  }, [selectedWorkspaceId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    uploadAreaRef.current?.classList.add("dragover");
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    uploadAreaRef.current?.classList.remove("dragover");
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    uploadAreaRef.current?.classList.remove("dragover");

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  // Helper function to update messages for a specific workspace
  const updateWorkspaceMessages = (workspaceId: string, updater: (messages: Message[]) => Message[]) => {
    setMessagesByWorkspace((prev) => {
      const newMap = new Map(prev);
      const currentMessages = newMap.get(workspaceId) || [];
      newMap.set(workspaceId, updater(currentMessages));
      return newMap;
    });
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    if (!selectedWorkspaceId) {
      return;
    }

    const question = input.trim();
    setInput("");
    
    const userMessage: Message = {
      role: "user",
      text: question,
      timestamp: new Date(),
    };
    
    updateWorkspaceMessages(selectedWorkspaceId, (m) => [...m, userMessage]);
    setLoading(true);

    try {
      const res = await askQuestion(question, selectedWorkspaceId);
      const aiMessage: Message = {
        role: "ai",
        text: res.answer,
        timestamp: new Date(),
      };
      updateWorkspaceMessages(selectedWorkspaceId, (m) => [...m, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        role: "ai",
        text: error instanceof Error ? error.message : "Sorry, I encountered an error while processing your question. Please try again.",
        timestamp: new Date(),
      };
      updateWorkspaceMessages(selectedWorkspaceId, (m) => [...m, errorMessage]);
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, selectedWorkspaceId]);

  // Auth Modal
  if (showAuthModal || !isAuthenticated) {
    return (
      <div className="auth-modal-overlay">
        <div className="auth-modal">
          <h2>{authMode === "login" ? "Login" : "Register"}</h2>
          <form onSubmit={authMode === "login" ? handleLogin : handleRegister}>
            <div className="auth-form-group">
              <label>Email</label>
              <input
                type="email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                required
                disabled={authLoading}
              />
            </div>
            <div className="auth-form-group">
              <label>Password</label>
              <input
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                required
                disabled={authLoading}
              />
            </div>
            {authError && <div className="auth-error">{authError}</div>}
            <button type="submit" disabled={authLoading} className="auth-submit-button">
              {authLoading ? "Loading..." : authMode === "login" ? "Login" : "Register"}
            </button>
          </form>
          <div className="auth-switch">
            {authMode === "login" ? (
              <>
                Don't have an account?{" "}
                <button onClick={() => { setAuthMode("register"); setAuthError(null); }}>
                  Register
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button onClick={() => { setAuthMode("login"); setAuthError(null); }}>
                  Login
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  const selectedWorkspace = workspaces.find(w => w.id === selectedWorkspaceId);

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="sidebar-header">
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {sidebarOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <path d="M3 12h18M3 6h18M3 18h18" />
              )}
            </svg>
          </button>
          {sidebarOpen && <h2 className="sidebar-title">Document RAG</h2>}
          {sidebarOpen && (
            <button className="logout-button" onClick={handleLogout} title="Logout">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          )}
        </div>

        {sidebarOpen && (
          <div className="sidebar-content">
            {/* Workspace Section */}
            <div className="workspace-section">
              <div className="workspace-header">
                <h3>Workspaces</h3>
                <button
                  className="create-workspace-button"
                  onClick={() => setShowCreateWorkspace(!showCreateWorkspace)}
                  title="Create workspace"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
              </div>

              {showCreateWorkspace && (
                <form onSubmit={handleCreateWorkspace} className="create-workspace-form">
                  <input
                    type="text"
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    placeholder="Workspace name"
                    className="workspace-name-input"
                    autoFocus
                  />
                  <div className="create-workspace-actions">
                    <button type="submit" className="create-workspace-submit">Create</button>
                    <button type="button" onClick={() => { setShowCreateWorkspace(false); setNewWorkspaceName(""); }}>Cancel</button>
                  </div>
                </form>
              )}

              {workspaceLoading ? (
                <div className="workspace-loading">Loading workspaces...</div>
              ) : (
                <div className="workspace-list">
                  {workspaces.map((workspace) => (
                    <button
                      key={workspace.id}
                      className={`workspace-item ${selectedWorkspaceId === workspace.id ? "active" : ""}`}
                      onClick={() => setSelectedWorkspaceId(workspace.id)}
                    >
                      <div className="workspace-item-name">{workspace.name}</div>
                      {workspace.documents && (
                        <div className="workspace-item-docs">{workspace.documents.length} docs</div>
                      )}
                    </button>
                  ))}
                  {workspaces.length === 0 && (
                    <div className="no-workspaces">No workspaces yet. Create one above.</div>
                  )}
                </div>
              )}

              {selectedWorkspace && (
                <div className="selected-workspace-info">
                  <strong>Selected: {selectedWorkspace.name}</strong>
                </div>
              )}
            </div>

            {/* Upload Section */}
            <div className="upload-section">
              <h3>Upload Document</h3>
              {!selectedWorkspaceId ? (
                <div className="workspace-warning">
                  Please select a workspace first
                </div>
              ) : (
                <>
                  <div
                    ref={uploadAreaRef}
                    className="upload-area"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <svg className="upload-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <div className="upload-text">
                      {uploading ? "Uploading..." : "Click or drag to upload"}
                    </div>
                    <div className="upload-hint">PDF, DOC, TXT files</div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="file-input"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleFileSelect}
                      disabled={uploading || !selectedWorkspaceId}
                    />
                  </div>

                  {uploading && (
                    <div className="upload-status">
                      <div className="loading-spinner"></div>
                      <span>Uploading...</span>
                    </div>
                  )}

                  {uploadedFile && (
                    <div className="uploaded-file">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                      </svg>
                      <div className="file-info">
                        <div className="file-name">{uploadedFile.name}</div>
                        <div className="file-size">{formatFileSize(uploadedFile.size)}</div>
                      </div>
                    </div>
                  )}

                  {uploadError && (
                    <div className="error-message">
                      <strong>Error:</strong> {uploadError}
                    </div>
                  )}

                  {uploadSuccess && (
                    <div className="success-message">
                      ✓ Document uploaded successfully!
                    </div>
                  )}
                </>
              )}
            </div>

            {messages.length > 0 && selectedWorkspaceId && (
              <div className="conversation-actions">
                <button 
                  className="new-chat-button"
                  onClick={() => {
                    if (selectedWorkspaceId) {
                      updateWorkspaceMessages(selectedWorkspaceId, () => []);
                    }
                    setInput("");
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  New Chat
                </button>
              </div>
            )}
          </div>
        )}
      </aside>

      {/* Main Chat Area */}
      <main className="chat-main">
        {!sidebarOpen && (
          <button 
            className="sidebar-open-button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
        )}
        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h1 className="empty-state-title">How can I help you today?</h1>
              <p className="empty-state-subtitle">
                Upload a document and ask questions to get AI-powered insights
              </p>
            </div>
          ) : (
            <div className="messages-list">
              {messages.map((m, i) => (
                <div key={i} className={`message ${m.role}`}>
                  <div className="message-avatar">
                    {m.role === "user" ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5z" />
                        <path d="M2 17l10 5 10-5" />
                        <path d="M2 12l10 5 10-5" />
                      </svg>
                    )}
                  </div>
                  <div className="message-content">
                    <div className="message-text">{m.text}</div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="message ai">
                  <div className="message-avatar">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2L2 7l10 5 10-5-10-5z" />
                      <path d="M2 17l10 5 10-5" />
                      <path d="M2 12l10 5 10-5" />
                    </svg>
                  </div>
                  <div className="message-content">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="input-container">
          <div className="input-wrapper">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={selectedWorkspaceId ? "Message Document RAG..." : "Select a workspace to ask questions..."}
              className="message-input"
              rows={1}
              disabled={loading || !selectedWorkspaceId}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
              }}
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading || !selectedWorkspaceId}
              className="send-button"
              aria-label="Send message"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
          <div className="input-footer">
            <p>Document RAG can make mistakes. Check important info.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
