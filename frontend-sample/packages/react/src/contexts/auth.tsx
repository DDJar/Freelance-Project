import React, {
  useState,
  useEffect,
  createContext,
  useContext,
  useCallback,
} from "react";
import Cookies from "universal-cookie";
import axios from "axios";
import { getUser, signIn as sendSignInRequest } from "../api/auth";
import { AuthContextType, User } from "../types/auth";


// Constants
const cookies = new Cookies();
const token = cookies.get("auth-cookie");

const AuthContext = createContext<AuthContextType>({
  loading: false,
} as AuthContextType);
const useAuth = () => useContext(AuthContext);

function AuthProvider(props: React.PropsWithChildren<unknown>) {
  const [user, setUser] = useState<User | undefined>(() => {
    const storedUser = localStorage.getItem("currentUser");
    try {
      return storedUser ? JSON.parse(storedUser) : undefined;
    } catch (error) {
      console.error("Error parsing stored user:", error);
      localStorage.removeItem("currentUser");
      return undefined;
    }
  });
  const [loading, setLoading] = useState(true);

  // Auto set Authorization header from cookie
  useEffect(() => {
    const token = cookies.get("auth-cookie");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  }, []);

  // Fetch user info on mount
  useEffect(() => {
    (async function () {
      const result = await getUser();
      if (result.isOk) {
        setUser(result.data);
      } else {
        localStorage.removeItem("currentUser");
        cookies.remove("auth-cookie", { path: "/" });
        setUser(undefined);
      }
      setLoading(false);
    })();
  }, []);

  // Sign-in with token and set everything
  const signIn = useCallback(async (email: string, password: string) => {
    const result = await sendSignInRequest(email, password);
    if (result.isOk && result.data) {
      const { user, accessToken } = result.data;

      // Token đã được lưu trong cookie ở signInRequest
      localStorage.setItem("currentUser", JSON.stringify(user));

      axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
      setUser(user);
    }

    return result;
  }, []);

  // Sign-out
  const signOut = useCallback(() => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("accessToken");
    cookies.remove("auth-cookie", { path: "/" });

    delete axios.defaults.headers.common["Authorization"];
    setUser(undefined);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, signIn, signOut, loading }}
      {...props}
    />
  );
}

export { AuthProvider, useAuth };
export default AuthProvider;