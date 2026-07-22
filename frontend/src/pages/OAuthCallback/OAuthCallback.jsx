import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../services/api";     // ✅ Goes to src/services/
import { useAuth } from "../../context/AuthContext";  // ✅ Goes to src/context/

import styles from "./OAuthCallback.module.css";

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
    <div className={styles.callbackContainer}>
      <div className={styles.callbackContent}>
        <div className={styles.spinner}></div>
        <h2 className={styles.callbackText}>
          Signing you in...
        </h2>
        <p className={styles.callbackSubtext}>
          Please wait while we authenticate your account
        </p>
      </div>
    </div>
  );
};

export default OAuthCallback;