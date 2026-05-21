import Cookies from "universal-cookie";
import { LoginRequest, LoginResponse, User } from "../types/auth";

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
const cookies = new Cookies();

export async function signIn(email: string, password: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/user/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password } as LoginRequest),
    });

    if (response.ok) {
      const data: LoginResponse = await response.json();
      const userWithAvatar = {
        ...data.user,
      };

      localStorage.setItem("currentUser", JSON.stringify(userWithAvatar));
      cookies.set("auth-cookie", data.accessToken, {
        path: "/",
        expires: new Date(Date.now() + 12 * 60 * 60 * 1000),
        sameSite: "lax",
        domain: process.env.DOMAIN,
      });
      return {
        isOk: true,
        data: { user: userWithAvatar, accessToken: data.accessToken },
      };
    } else {
      const errorText = await response.text();
      console.error("API error:", errorText);
      return {
        isOk: false,
        message:
          response.status === 401
            ? "Invalid email or password"
            : errorText || "Login failed",
      };
    }
  } catch (error) {
    console.error("Login error:", error);
    return {
      isOk: false,
      message: "Network error. Please try again.",
    };
  }
}
export function signOut() {
  localStorage.clear();
  cookies.remove("auth-cookie", { path: "/" });
}

export async function getUser() {
  const storedUser = localStorage.getItem("currentUser");
  localStorage.getItem("cartItems");
  const token = cookies.get("auth-cookie");

  if (storedUser && token) {
    try {
      const userData: User = JSON.parse(storedUser);
      return {
        isOk: true,
        data: userData,
      };
    } catch (error) {
      console.error("Error parsing stored user:", error);
      localStorage.removeItem("currentUser");
      cookies.remove("auth-cookie", { path: "/" });
    }
  }

  if (!token) {
    return {
      isOk: false,
      message: "No authentication token found",
    };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/user/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data: { user: User } = await response.json();
      localStorage.setItem("currentUser", JSON.stringify(data.user));
      return {
        isOk: true,
        data: data.user,
      };
    } else {
      const errorText = await response.text();
      localStorage.removeItem("currentUser");
      cookies.remove("auth-cookie", { path: "/" });
      return {
        isOk: false,
        message: errorText || "Failed to fetch user",
      };
    }
  } catch (error) {
    console.error("Fetch user error:", error);
    return {
      isOk: false,
      message: "Network error. Please try again.",
    };
  }
}
