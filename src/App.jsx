import React from "react";
// import { useContext } from "react";
// import { ThemeContext } from "./components/ThemeContext/themecontext";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Home from "./components/Home/home";
import Categories from "./components/Categories/categories";
import Statistics from "./components/Statistics/statistics";
import Settings from "./components/Settings/settings";
import Header from "./components/Header/header";
import Footer from "./components/Footer/footer";
import Login from "./components/Login/login";
import Register from "./components/Register/register";
import PrivateRoute from "./components/Private/privaterouter";
import Transaction from "./components/Transaction/transaction";
import { CurrencyProvider } from "./context/CurrencyContext";
// import ThemeProvider, { ThemeContext } from "./components/ThemeContext/themecontext";
// import "./App.css";

function AppContent() {
  // const { theme } = useContext(ThemeContext);
  const location = useLocation();
  const isAuthScreen = location.pathname === '/login' || location.pathname === '/register';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-cyan-50 text-slate-900">
      {!isAuthScreen && (
        <div className="flex min-h-screen">
          <Header />
          <div className="flex-1 flex flex-col overflow-hidden">
            <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
              <div className="mx-auto w-full max-w-[1500px]">
                <Routes>
                  <Route path="/" element={<Navigate to="/login" replace />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/home" element={<Home />} />
                  <Route path="/transaction" element={<Transaction />} />
                  <Route path="/categories" element={<Categories />} />
                  <Route path="/statistics" element={<Statistics />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </div>
            </main>
            <Footer />
          </div>
        </div>
      )}

      {isAuthScreen && (
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/home" element={<Home />} />
          <Route path="/transaction" element={<Transaction />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      )}
    </div>
  );
}

function App() {
  return (
    // <ThemeProvider>
    <CurrencyProvider>
      <Router>
        <AppContent />
      </Router>
    </CurrencyProvider>
    // </ThemeProvider>
  );
}

export default App;
