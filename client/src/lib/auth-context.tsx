import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "./queryClient";
import { useToast } from "@/hooks/use-toast";

type LoginData = {
  emailOrPhone: string;
  password: string;
};

type RegisterData = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

export type LoginResponse = User & {
  requireOtp?: boolean;
  requireEmailVerification?: boolean;
  requireDeviceVerification?: boolean;
  tempToken?: string;
  email?: string;
  message?: string;
};

export type RegisterResponse = User & {
  requireEmailVerification?: boolean;
  tempToken?: string;
  email?: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<LoginResponse, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<RegisterResponse, Error, RegisterData>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();

  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData): Promise<LoginResponse> => {
      const res = await apiRequest("POST", "/api/auth/login", credentials);
      return await res.json();
    },
    onSuccess: (data: LoginResponse) => {
      if (data.requireOtp || data.requireEmailVerification || data.requireDeviceVerification) return;
      queryClient.setQueryData(["/api/user"], data);
      toast({
        title: "Connexion réussie",
        description: `Bienvenue, ${data.fullName}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Échec de la connexion",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterData): Promise<RegisterResponse> => {
      const res = await apiRequest("POST", "/api/auth/register", credentials);
      return await res.json();
    },
    onSuccess: (data: RegisterResponse) => {
      if (data.requireEmailVerification) return;
      queryClient.setQueryData(["/api/user"], data);
      toast({
        title: "Inscription réussie",
        description: `Bienvenue sur SendavaPay, ${data.fullName}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Échec de l'inscription",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Déconnexion",
        description: "À bientôt!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
