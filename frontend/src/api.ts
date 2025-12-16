const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

// Get token from localStorage
export function getToken(): string | null {
  return localStorage.getItem("token");
}

// Set token in localStorage
export function setToken(token: string) {
  localStorage.setItem("token", token);
}

// Remove token from localStorage
export function removeToken() {
  localStorage.removeItem("token");
}

// Authentication API
export async function registerUser(email: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Registration failed" }));
    throw new Error(error.error || "Failed to register");
  }

  return res.json();
}

export async function loginUser(email: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Login failed" }));
    throw new Error(error.error || "Failed to login");
  }

  const data = await res.json();
  if (data.token) {
    setToken(data.token);
  }
  return data;
}

// Workspace API
export async function createWorkspace(name: string) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE_URL}/workspaces`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Failed to create workspace" }));
    throw new Error(error.error || "Failed to create workspace");
  }

  return res.json();
}

export async function getWorkspaces() {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE_URL}/workspaces`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Failed to fetch workspaces" }));
    throw new Error(error.error || "Failed to fetch workspaces");
  }

  return res.json();
}

export async function getWorkspace(id: string) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE_URL}/workspaces/${id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Failed to fetch workspace" }));
    throw new Error(error.error || "Failed to fetch workspace");
  }

  return res.json();
}

// Document API
export async function uploadDocument(file: File, workspaceId?: string) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const formData = new FormData();
  formData.append("file", file);
  if (workspaceId) {
    formData.append("workspaceId", workspaceId);
  }

  const res = await fetch(`${API_BASE_URL}/documents/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Upload failed" }));
    throw new Error(error.error || "Failed to upload document");
  }

  return res.json();
}

// RAG API
export async function askQuestion(question: string, workspaceId: string) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE_URL}/rag/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ question, workspaceId }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Failed to get response" }));
    throw new Error(error.error || "Failed to get response");
  }

  return res.json();
}
  
