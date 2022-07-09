import { createContext, ReactNode } from "react";
import { api } from "../services/api";

type SignInCredentials = {
    email: string;
    password: string;
}

type AuthContextData = {
    signIn(credentials: SignInCredentials): Promise<void>;
    isAuthenticated: boolean;
}

export const AuthContext = createContext({} as AuthContextData);

type AuthProviderProps = {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const isAuthenticated = false;

    async function signIn({ email, password }: SignInCredentials) {
        try {
            const response = await api.post('sessions', {
                email,
                password
            })
    
            console.log(` response `, response.data);
        } catch (err) {
            console.error(err);
        }
    }

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            signIn
        }}>
            {children}
        </AuthContext.Provider>
    )
}