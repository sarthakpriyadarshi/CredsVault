export const API_URL = "http://localhost:3000/api";

export async function signUp(name: string, email: string, password: string, userType: string) {
  const endpoint = userType === "company" ? "/auth/company-register" : "/auth/user-register";
  const payload = { name, email, password };
  console.log("Signing up with:", payload);

  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    console.log("Sign-up response:", data);
    return data;
  } catch (error) {
    console.error("Sign-up error:", error);
    throw error;
  }
}

export async function login(email: string, password: string, userType: string) {
  const endpoint = userType === "company" ? "/auth/company-login" : "/auth/user-login";
  const payload = { email, password };
  console.log("Logging in with:", payload);

  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    console.log("Login response:", data);
    return data;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
}