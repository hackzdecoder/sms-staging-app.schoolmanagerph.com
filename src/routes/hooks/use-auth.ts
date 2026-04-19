import { useEffect, useState } from 'react';
import api from 'src/routes/api/config';

interface AuthUser {
    user_id: string;
    username: string;
    full_name?: string;
    email?: string;
    token?: string;
    account_status?: string;
}

// Add interface for API response
interface UserResponse {
    user_id: string;
    username: string;
    full_name?: string;
    email?: string;
    account_status: string;
    nickname?: string;
    name?: string;
}

// Add login response interface
interface LoginResponse {
    user: AuthUser;
    token: string;
    message?: string;
    requires_email?: boolean;
    redirect_to?: string;
}

export function useAuth() {
    const [authenticated, setAuthenticated] = useState(false);
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        const userData = localStorage.getItem('auth_user');

        if (token && userData) {
            try {
                const parsedUser = JSON.parse(userData);
                setUser({ ...parsedUser, token });
                setAuthenticated(true);
                // Don't check status here - let App.tsx handle it
            } catch (error) {
                console.error('Failed to parse user data:', error);
                clearAuthData();
                setAuthenticated(false);
            }
        } else {
            setAuthenticated(false);
        }

        setLoading(false);
    }, []);

    const clearAuthData = () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        sessionStorage.removeItem('auth_token');
        setAuthenticated(false);
        setUser(null);
        // Clear axios default headers
        delete api.defaults.headers.common['Authorization'];
    };

    const logout = () => {
        clearAuthData();
        // Optional: Call logout API endpoint
        api.post('/logout').catch(() => {
            // Ignore errors on logout
        });
    };

    const login = async (credentials: { username: string; password: string }) => {
        try {
            const response = await api.post<LoginResponse>('/login', credentials);

            const { user: userData, token, requires_email } = response.data;

            // CRITICAL FIX: Only store auth data if we have a token
            if (token) {
                localStorage.setItem('auth_token', token);
                localStorage.setItem('auth_user', JSON.stringify(userData));
                setUser({ ...userData, token });
                setAuthenticated(true);

                // Set axios default headers
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            }

            return {
                success: true,
                data: response.data,
                requiresEmail: requires_email || false,
                accountStatus: userData.account_status || 'active'
            };
        } catch (error: any) {
            console.error('Login error:', error.response?.status, error.response?.data);

            // Handle specific backend responses
            if (error.response?.status === 403) {
                // Account is inactive/deactivated
                return {
                    success: false,
                    error: 'Your account has been deactivated',
                    accountStatus: 'inactive'
                };
            } else if (error.response?.status === 429) {
                // Too many login attempts
                return {
                    success: false,
                    error: error.response?.data?.message || 'Too many login attempts. Please try again later.'
                };
            } else if (error.response?.status === 401) {
                // Invalid credentials
                return {
                    success: false,
                    error: 'Invalid username or password. Please try again.'
                };
            } else if (error.response?.status === 404) {
                // User not found
                return {
                    success: false,
                    error: 'Invalid username or password. Please try again.'
                };
            } else {
                // Network or other errors
                return {
                    success: false,
                    error: 'Unable to connect to server. Please check your connection and try again.'
                };
            }
        }
    };

    return {
        authenticated,
        user,
        loading,
        logout,
        login
    };
}