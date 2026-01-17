import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem("token"));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            setLoading(true); // Ensure loading is true while fetching
            // Fetch user profile if token exists
            api.get("/users/me")
                .then((response) => {
                    setUser(response);
                })
                .catch(() => {
                    // Token invalid
                    logout();
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, [token]);

    const login = async (email, password) => {
        try {
            // OAuth2PasswordRequestForm expects x-www-form-urlencoded
            const params = new URLSearchParams();
            params.append("username", email);
            params.append("password", password);

            const response = await api.post("/auth/token", params, {
                // Content-Type will be set automatically by browser/fetch for URLSearchParams
                // or we can explicit set it, but usually standard fetch handles it.
                // Actually for URLSearchParams fetch sets application/x-www-form-urlencoded;charset=UTF-8
            });

            const { access_token } = response;
            localStorage.setItem("token", access_token);
            setToken(access_token);

            // Immediately fetch user to ensure state is ready before redirect
            try {
                const userRes = await api.get("/users/me");
                setUser(userRes);
            } catch (error) {
                console.error("Failed to fetch user after login", error);
                // Don't throw here, let useEffect handle consistency or just proceed?
                // best to throw so login fails UI side if user details fail
                throw error;
            }

            return true;
        } catch (error) {
            console.error("Login failed:", error);
            throw error;
        }
    };

    const register = async (userData) => {
        try {
            await api.post("/register", userData);
            // Auto login after register? Or redirect to login.
            // For now, let's just return true
            return true;
        } catch (error) {
            console.error("Registration failed:", error);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, register, loading, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
