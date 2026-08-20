import { useEffect } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import api from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";
import styles from "./OAuthCallback.module.css";

const OAuthCallback = () => {
  const { setUser } = useAuth();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  useEffect(() => {
    const completeLogin = async () => {
      const token = searchParams.get("token");

      if (!token) {
        window.location.replace("/login");
        return;
      }

      try {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        localStorage.setItem("token", token);

        const res = await api.get("/auth/me");

        const user = res.data?.data || res.data;

        if (!user) {
          throw new Error("No user data received");
        }

        localStorage.setItem("user", JSON.stringify(user));
        setUser(user);

        const redirect =
          location.state?.from?.pathname ||
          searchParams.get("redirect") ||
          (user.role === "recruiter" ? "/recruiter/dashboard" : "/");

        window.location.replace(redirect);
      } catch (err) {
        console.error("OAuth callback error:", err);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.replace("/login");
      }
    };

    completeLogin();
  }, [searchParams, setUser, location.state]);

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