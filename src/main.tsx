import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Bu dosya SADECE yerel geliştirme/önizleme için kullanılır (npm run dev).
// Sanalyzer platformu kendi içinde <App /> bileşenini doğrudan import edip
// mount edecek — bu dosyayı kullanmayacak.
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
