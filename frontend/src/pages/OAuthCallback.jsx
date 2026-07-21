import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const OAuthCallback = () => {
  const { setUser } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  useEffect(() => {
    const completeLogin = async () => {
      const token = searchParams.get("token");

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        // Save JWT
        localStorage.setItem("token", token);

        // Fetch current user
        const res = await api.get("/auth/me");

        const user = res.data.data || res.data;

localStorage.setItem("user", JSON.stringify(user));

setUser(user);

navigate("/", { replace: true });
      } catch (err) {
        console.error(err);
        localStorage.removeItem("token");
        navigate("/login");
      }
    };

    completeLogin();
  }, [navigate, searchParams]);

  return (
    <h2 style={{ textAlign: "center", marginTop: "100px" }}>
      Signing you in...
    </h2>
  );
};

export default OAuthCallback;