import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/user/me", {
                method: "GET",
                credentials: "include",
            });
            if (res.ok) {
                const data = await res.json();

                setUser(data.user);
                return {success: true, message: 'User fetched successfully'};
            } else {
                setUser(null);
                return {success: false, message: 'Failed to fetch user'};
            }
        } catch (err) {
            console.error("Error fetching user:", err);
            setUser(null);
            return {success: false, message: 'Server Error'};
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    const login = async (email, password) => {
        try {
            const res = await fetch('/api/user/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
                credentials: 'include',
            });

            const data = await res.json();

            if (res.ok) {
                setUser(data.user);
                return {success: true, message: data.message || 'Login successful'};
            } else {
                setUser(null);
                return {success: false, message: data.message || 'Login request failed'};
            }
        } catch (err) {
            console.error('Login error:', err);
            return {success: false, message: 'Server Error'};
        }
    };

    const logout = async () => {
        try {
            const res = await fetch('/api/user/logout', {
                method: 'POST',
                credentials: 'include',
            });

            const data = await res.json();

            if (res.ok) {
                setUser(null);
                return {success: true, message: data.message || 'Logout successful'};
            } else {
                return {success: false, message: data.message || 'Logout request failed'};
            }
        } catch (err) {
            console.error('Logout error:', err);
            return {success: false, message: 'Server Error'};
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, fetchUser }}>
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);