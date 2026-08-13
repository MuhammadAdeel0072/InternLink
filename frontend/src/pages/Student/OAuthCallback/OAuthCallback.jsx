import { useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import api from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";
import styles from "./OAuthCallback.module.css";

const OAuthCallback = () => {
  const { setUser } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    const completeLogin = async () => {
      const token = searchParams.get("token");

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const res = await api.get("/auth/me");

        const user = res.data.data || res.data;

        setUser(user);

        const redirect = location.state?.from?.pathname || searchParams.get("redirect") || "/";
        navigate(redirect, { replace: true });
      } catch (err) {
        console.error(err);
        navigate("/login");
      }
    };

    completeLogin();
  }, [navigate, searchParams, setUser, location.state]);

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