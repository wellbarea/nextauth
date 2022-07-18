import Router from "next/router";
import { destroyCookie, parseCookies, setCookie } from "nookies";
import { createContext, ReactNode, useEffect, useState } from "react";
import { api } from "../services/apiClient";

type User = {
    email: string;
    permissions: string[];
    roles: string[];
}

type SignInCredentials = {
    email: string;
    password: string;
}

type AuthContextData = {
    signIn(credentials: SignInCredentials): Promise<void>;
    signOut(): void;
    user?: User;
    isAuthenticated: boolean;
}

export const AuthContext = createContext({} as AuthContextData);

type AuthProviderProps = {
    children: ReactNode;
}

let authChannel: BroadcastChannel;

export function signOut() {
    destroyCookie(undefined, 'nextauth.token')
    destroyCookie(undefined, 'nextauth.refreshToken')

    authChannel.postMessage('signOut');

    Router.push('/')
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User>();
    const isAuthenticated = !!user;

    useEffect(() => {
        authChannel = new BroadcastChannel('auth');

        authChannel.onmessage = ({ data }) => {
            switch (data) {
                case 'signOut':
                    signOut();
                break;
            
                default:
                break;
            }
        }
    }, [])

    useEffect(() => {

        const { 'nextauth.token': token } = parseCookies()
        if (token) {
            api.get('/me').then(response => {
                const { email, permissions, roles } = response.data;

                setUser({ email, permissions, roles })
            }).catch(() => {
                signOut();
            })
        }


    }, [])

    async function signIn({ email, password }: SignInCredentials) {
        try {
            const response = await api.post('sessions', {
                email,
                password
            })

            const { token, refreshToken, permissions, roles } = response.data;
    
            setCookie(undefined, 'nextauth.token', token, {
                maxAge: 60 * 60 * 24 * 30, // 30 days
                path: '/'
            });

            setCookie(undefined, 'nextauth.refreshToken', refreshToken, {
                maxAge: 60 * 60 * 24 * 30, // 30 days
                path: '/'
            });

            setUser({
                email,
                permissions,
                roles
            })

            api.defaults.headers['Authorization'] = `Bearer ${token}`;

            Router.push('/dashboard')

        } catch (err) {
            console.error(err);
        }
    }

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            user,
            signIn,
            signOut
        }}>
            {children}
        </AuthContext.Provider>
    )
}