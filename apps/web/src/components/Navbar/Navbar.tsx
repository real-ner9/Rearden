import { NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import styles from "./Navbar.module.scss";

export function Navbar() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  return (
    <nav className={styles.bottomNav}>
      <NavLink to="/" end className={styles.bottomTab}>
        {({ isActive }) => (
          <div className={`${styles.bottomTabInner} ${isActive ? styles.bottomActive : ""}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
        )}
      </NavLink>

      <NavLink to="/search" className={styles.bottomTab}>
        {({ isActive }) => (
          <div className={`${styles.bottomTabInner} ${isActive ? styles.bottomActive : ""}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </div>
        )}
      </NavLink>

      <NavLink to="/feed" className={styles.bottomTab}>
        {({ isActive }) => (
          <div className={`${styles.bottomTabInner} ${isActive ? styles.bottomActive : ""}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill={isActive ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="2" />
              <path d="M10 8l6 4-6 4V8z" />
            </svg>
          </div>
        )}
      </NavLink>

      <NavLink
        to={user ? "/chat" : "/auth"}
        className={styles.bottomTab}
        onClick={(e) => {
          if (!user) {
            e.preventDefault();
            navigate("/auth", { state: { from: "/chat" } });
          }
        }}
      >
        {({ isActive }) => (
          <div className={`${styles.bottomTabInner} ${isActive ? styles.bottomActive : ""}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          </div>
        )}
      </NavLink>

      <NavLink to={user ? "/register" : "/auth"} className={styles.bottomTab}>
        {({ isActive }) => (
          <div className={`${styles.bottomTabInner} ${isActive ? styles.bottomActive : ""}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
        )}
      </NavLink>
    </nav>
  );
}
