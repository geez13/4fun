const API_BASE_URL = import.meta.env.VITE_API_URL || ''

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface ApiError {
  message: string
  code?: string
  status?: number
  details?: any
}

export class ApiServiceError extends Error {
  public code?: string
  public status?: number
  public details?: any

  constructor(message: string, code?: string, status?: number, details?: any) {
    super(message)
    this.name = 'ApiServiceError'
    this.code = code
    this.status = status
    this.details = details
  }
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
}

export interface AuthResponse {
  token: string
  user: {
    id: string
    email: string
    name: string
  }
}

export interface ImageRecord {
  id: string
  original_url: string
  processed_url?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  created_at: string
  updated_at: string
  file_name: string
  file_size: number
  storage_mode: string
}

export interface ImageResponse extends ApiResponse {
  image?: ImageRecord
}

class ApiService {
  private readonly maxRetries = 3
  private readonly retryDelay = 1000 // 1 second

  private getAuthHeaders(sessionToken?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    let token = sessionToken;

    if (!token) {
      try {
        const storedAuth = localStorage.getItem('auth-storage');
        if (storedAuth) {
          token = JSON.parse(storedAuth).state?.token;
        }
      } catch (error) {
        console.error('Error parsing auth token:', error);
      }
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private getErrorMessage(error: any, defaultMessage: string): string {
    if (error?.message) return error.message
    if (error?.error) return error.error
    if (typeof error === 'string') return error
    return defaultMessage
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      const data = await response.json()
      
      if (!response.ok) {
        const errorMessage = this.getErrorMessage(data, `HTTP ${response.status}: ${response.statusText}`)
        throw new ApiServiceError(
          errorMessage,
          data.code || 'HTTP_ERROR',
          response.status,
          data
        )
      }

      return data
    } catch (error) {
      if (error instanceof ApiServiceError) {
        throw error
      }
      
      // Handle JSON parsing errors or other unexpected errors
      const errorMessage = response.ok 
        ? 'Failed to parse server response'
        : `HTTP ${response.status}: ${response.statusText}`
      
      throw new ApiServiceError(
        errorMessage,
        'PARSE_ERROR',
        response.status
      )
    }
  }

  private async fetchWithRetry<T>(
    url: string, 
    options: RequestInit, 
    retries = this.maxRetries
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(url, options)
      return await this.handleResponse<T>(response)
    } catch (error) {
      if (error instanceof ApiServiceError) {
        // Don't retry client errors (4xx) or authentication errors
        if (error.status && error.status >= 400 && error.status < 500) {
          throw error
        }
      }

      if (retries > 0) {
        console.warn(`Request failed, retrying... (${this.maxRetries - retries + 1}/${this.maxRetries})`)
        await this.delay(this.retryDelay * (this.maxRetries - retries + 1))
        return this.fetchWithRetry<T>(url, options, retries - 1)
      }

      // If all retries failed, throw the original error or create a new one
      if (error instanceof ApiServiceError) {
        throw error
      }

      throw new ApiServiceError(
        error instanceof Error ? error.message : 'Network request failed',
        'NETWORK_ERROR'
      )
    }
  }

  async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      return await this.fetchWithRetry<AuthResponse>(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      })
    } catch (error) {
      if (error instanceof ApiServiceError) {
        return {
          success: false,
          error: error.message
        }
      }
      return {
        success: false,
        error: 'Login failed. Please check your credentials and try again.'
      }
    }
  }

  async register(userData: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      return await this.fetchWithRetry<AuthResponse>(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })
    } catch (error) {
      if (error instanceof ApiServiceError) {
        return {
          success: false,
          error: error.message
        }
      }
      return {
        success: false,
        error: 'Registration failed. Please try again.'
      }
    }
  }

  async logout(): Promise<ApiResponse> {
    try {
      return await this.fetchWithRetry(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      })
    } catch (error) {
      if (error instanceof ApiServiceError) {
        return {
          success: false,
          error: error.message
        }
      }
      return {
        success: false,
        error: 'Logout failed. Please try again.'
      }
    }
  }

  async verifyToken(): Promise<ApiResponse<{ user: any }>> {
    try {
      return await this.fetchWithRetry<{ user: any }>(`${API_BASE_URL}/api/auth/verify`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      })
    } catch (error) {
      if (error instanceof ApiServiceError) {
        return {
          success: false,
          error: error.message
        }
      }
      return {
        success: false,
        error: 'Token verification failed.'
      }
    }
  }

  async uploadImage(file: File): Promise<ApiResponse<{ imageId: string; originalUrl: string; fileName: string; fileSize: number }>> {
    try {
      const formData = new FormData()
      formData.append('image', file)

      // Don't set Content-Type for FormData - let browser set it with boundary
      const headers: HeadersInit = {}
      const token = localStorage.getItem('auth-storage')
      if (token) {
        try {
          const parsed = JSON.parse(token)
          if (parsed.state?.token) {
            headers['Authorization'] = `Bearer ${parsed.state.token}`
          }
        } catch (error) {
          console.error('Error parsing auth token:', error)
        }
      }

      return await this.fetchWithRetry<{ imageId: string; originalUrl: string; fileName: string; fileSize: number }>(`${API_BASE_URL}/api/images/upload`, {
        method: 'POST',
        headers,
        body: formData,
      })
    } catch (error) {
      if (error instanceof ApiServiceError) {
        return {
          success: false,
          error: error.message
        }
      }
      return {
        success: false,
        error: 'Image upload failed. Please check your file and try again.'
      }
    }
  }

  async uploadImageGated(file: File, sessionToken: string): Promise<ApiResponse<{ imageId: string; originalUrl: string; fileName: string; fileSize: number }>> {
    try {
      const formData = new FormData()
      formData.append('image', file)

      // Don't set Content-Type for FormData - let browser set it with boundary
      const headers: HeadersInit = {
        'X-Session-Token': sessionToken,
      }
      const token = localStorage.getItem('auth-storage')
      if (token) {
        try {
          const parsed = JSON.parse(token)
          if (parsed.state?.token) {
            headers['Authorization'] = `Bearer ${parsed.state.token}`
          }
        } catch (error) {
          console.error('Error parsing auth token:', error)
        }
      }

      return await this.fetchWithRetry<{ imageId: string; originalUrl: string; fileName: string; fileSize: number }>(`${API_BASE_URL}/api/images/upload`, {
        method: 'POST',
        headers,
        body: formData,
      })
    } catch (error) {
      if (error instanceof ApiServiceError) {
        return {
          success: false,
          error: error.message
        }
      }
      return {
        success: false,
        error: 'Token-gated image upload failed. Please verify your access and try again.'
      }
    }
  }

  async verifyTokenAccess(walletAddress: string, signature: string, message: string): Promise<ApiResponse<{ hasAccess: boolean; tokenBalance: number; requiredBalance: number; sessionToken?: string; verificationId?: string }>> {
    try {
      return await this.fetchWithRetry<{ hasAccess: boolean; tokenBalance: number; requiredBalance: number; sessionToken?: string; verificationId?: string }>(`${API_BASE_URL}/api/token/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          signature,
          message,
        }),
      })
    } catch (error) {
      if (error instanceof ApiServiceError) {
        return {
          success: false,
          error: error.message
        }
      }
      return {
        success: false,
        error: 'Token verification failed. Please ensure you have sufficient tokens and try again.'
      }
    }
  }

  async processFourFinger(imageId: string, sessionToken: string, prompt?: string): Promise<ApiResponse<{ processedImageUrl: string }>> {
    try {
      // Token-gated processing requires X-Session-Token for middleware
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken,
      }

      // Attach auth token if available (for additional auth layers)
      const stored = localStorage.getItem('auth-storage')
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          if (parsed.state?.token) {
            headers['Authorization'] = `Bearer ${parsed.state.token}`
          }
        } catch (error) {
          console.error('Error parsing auth token:', error)
        }
      }

      // Build request body; include prompt if provided
      const bodyPayload: any = {}
      if (prompt && typeof prompt === 'string' && prompt.trim().length > 0) {
        bodyPayload.prompt = prompt
      }

      return await this.fetchWithRetry<{ processedImageUrl: string }>(`${API_BASE_URL}/api/images/${imageId}/process-vsign`, {
        method: 'POST',
        headers,
        body: JSON.stringify(bodyPayload),
      })
    } catch (error) {
      if (error instanceof ApiServiceError) {
        return {
          success: false,
          error: error.message
        }
      }
      return {
        success: false,
        error: 'Image processing failed. Please try again.'
      }
    }
  }

  async getImage(imageId: string): Promise<ApiResponse<{ url: string }>> {
    try {
      return await this.fetchWithRetry<{ url: string }>(`${API_BASE_URL}/api/images/${imageId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      })
    } catch (error) {
      if (error instanceof ApiServiceError) {
        return {
          success: false,
          error: error.message
        }
      }
      return {
        success: false,
        error: 'Failed to retrieve image. Please try again.'
      }
    }
  }

  async getUserImages(): Promise<ApiResponse<any[]>> {
    const response = await fetch(`${API_BASE_URL}/api/images/user`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    })

    const data = await response.json()
    return data
  }

  async healthCheck(): Promise<ApiResponse<{ status: string }>> {
    try {
      return await this.fetchWithRetry<{ status: string }>(`${API_BASE_URL}/api/health`, {
        method: 'GET',
      })
    } catch (error) {
      if (error instanceof ApiServiceError) {
        return {
          success: false,
          error: error.message
        }
      }
      return {
        success: false,
        error: 'Health check failed. Service may be unavailable.'
      }
    }
  }
}

export const apiService = new ApiService()