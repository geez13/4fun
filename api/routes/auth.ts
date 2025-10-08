/**
 * User authentication API routes with Supabase integration
 * Handle user registration, login, token management, etc.
 */
import { Router, type Request, type Response } from 'express'
import { supabase } from '../services/supabaseService.js'

const router = Router()

/**
 * User Registration
 * POST /api/auth/register
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = (req as any).body

    if (!email || !password || !name) {
      (res as any).status(400).json({
        success: false,
        error: 'Email, password, and name are required',
      })
      return
    }

    // Register user with Supabase Auth
    const { data: authData, error: authError } = await (supabase.auth as any).signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    })

    if (authError) {
      (res as any).status(400).json({
        success: false,
        error: authError.message,
      })
      return
    }

    (res as any).status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: authData.user?.id,
        email: authData.user?.email,
        name: authData.user?.user_metadata?.name,
      },
    })
  } catch (error) {
    console.error('Registration error:', error);
    (res as any).status(500).json({
      success: false,
      error: 'Failed to register user',
    })
  }
})

/**
 * User Login
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = (req as any).body

    if (!email || !password) {
      (res as any).status(400).json({
        success: false,
        error: 'Email and password are required',
      })
      return
    }

    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await (supabase.auth as any).signInWithPassword({
      email,
      password,
    })

    if (authError) {
      (res as any).status(401).json({
        success: false,
        error: authError.message,
      })
      return
    }

    (res as any).json({
      success: true,
      message: 'Login successful',
      token: authData.session?.access_token,
      user: {
        id: authData.user?.id,
        email: authData.user?.email,
        name: authData.user?.user_metadata?.name,
      },
    })
  } catch (error) {
    console.error('Login error:', error);
    (res as any).status(500).json({
      success: false,
      error: 'Failed to login',
    })
  }
})

/**
 * User Logout
 * POST /api/auth/logout
 */
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = (req as any).headers.authorization
    const token = authHeader?.split(' ')[1]

    if (token) {
      // Sign out from Supabase
      await (supabase.auth as any).signOut()
    }

    (res as any).json({
      success: true,
      message: 'Logout successful',
    })
  } catch (error) {
    console.error('Logout error:', error);
    (res as any).status(500).json({
      success: false,
      error: 'Failed to logout',
    })
  }
})

/**
 * Verify Token
 * GET /api/auth/verify
 */
router.get('/verify', async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = (req as any).headers.authorization
    const token = authHeader?.split(' ')[1]

    if (!token) {
      (res as any).status(401).json({
        success: false,
        error: 'No token provided',
      })
      return
    }

    // Verify token with Supabase
    const { data: userData, error } = await (supabase.auth as any).getUser(token)

    if (error || !userData.user) {
      (res as any).status(401).json({
        success: false,
        error: 'Invalid token',
      })
      return
    }

    (res as any).json({
      success: true,
      user: {
        id: userData.user.id,
        email: userData.user.email,
        name: userData.user.user_metadata?.name,
      },
    })
  } catch (error) {
    console.error('Token verification error:', error);
    (res as any).status(500).json({
      success: false,
      error: 'Failed to verify token',
    })
  }
})

export default router
