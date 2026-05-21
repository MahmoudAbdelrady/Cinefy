import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import LoginPage from "./app/pages/LoginPage.tsx";
import ForgotPasswordPage from "./app/pages/ForgotPasswordPage.tsx";
import "./styles/index.css";

function Root() {
  const [route, setRoute] = useState(() => window.location.hash || "#/login");

  useEffect(() => {
    const onChange = () => setRoute(window.location.hash || "#/login");
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  if (route.startsWith("#/forgot-password")) return <ForgotPasswordPage />;
  return <LoginPage />;
}

createRoot(document.getElementById("root")!).render(<Root />);
