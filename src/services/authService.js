/**
 * Authentication Service
 * Handles user authentication (Google OAuth, email/password)
 * TODO: Replace mock implementation with actual backend API
 */

/**
 * Sign in with Google OAuth
 * @returns {Promise<Object>} User data
 */
export async function signInWithGoogle() {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // TODO: Implement actual Google OAuth
  // 1. Initialize Google Sign-In
  // 2. Get OAuth token
  // 3. Send token to backend for verification
  // 4. Return user data and JWT

  return {
    id: 'user-123',
    email: 'user@example.com',
    name: 'Test User',
    provider: 'google',
    token: 'mock-jwt-token',
    createdAt: new Date().toISOString(),
  };
}

/**
 * Sign in with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} User data
 */
export async function signInWithEmail(email, password) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));

  // TODO: POST to /api/auth/signin
  // Validate credentials
  // Return JWT and user data

  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  return {
    id: 'user-456',
    email,
    name: email.split('@')[0],
    provider: 'email',
    token: 'mock-jwt-token',
    createdAt: new Date().toISOString(),
  };
}

/**
 * Sign up with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} confirmPassword - Password confirmation
 * @returns {Promise<Object>} User data
 */
export async function signUpWithEmail(email, password, confirmPassword) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // TODO: POST to /api/auth/signup
  // Validate email format
  // Check password strength
  // Verify passwords match
  // Create user account
  // Return JWT and user data

  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  if (password !== confirmPassword) {
    throw new Error('Passwords do not match');
  }

  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  return {
    id: `user-${Date.now()}`,
    email,
    name: email.split('@')[0],
    provider: 'email',
    token: 'mock-jwt-token',
    createdAt: new Date().toISOString(),
  };
}

/**
 * Sign out current user
 * @returns {Promise<void>}
 */
export async function signOut() {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // TODO: POST to /api/auth/signout
  // Invalidate JWT token
  // Clear session
  
  // Clear local storage
  localStorage.removeItem('user');
  localStorage.removeItem('token');
}

/**
 * Get current authenticated user
 * @returns {Promise<Object|null>} User data or null if not authenticated
 */
export async function getCurrentUser() {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));

  // TODO: GET /api/auth/me with JWT in header
  // Verify token validity
  // Return user data

  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
export function isAuthenticated() {
  const token = localStorage.getItem('token');
  return !!token;
}
