import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import LoginPage from "./app/pages/LoginPage.tsx";
import ForgotPasswordPage from "./app/pages/ForgotPasswordPage.tsx";
import "./styles/index.css";

function Root() {
  const [route, setRoute] = useState(() => window.location.hash || "#/");

  useEffect(() => {
    const onChange = () => setRoute(window.location.hash || "#/");
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  if (route.startsWith("#/login")) return <LoginPage />;
  if (route.startsWith("#/forgot-password")) return <ForgotPasswordPage />;
  return <App />;
}

createRoot(document.getElementById("root")!).render(<Root />);
