import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import AdminPanel from "./pages/AdminPanel";
import { useEffect, useState } from "react";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Switch from '@mui/material/Switch';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Appointment from "./pages/Appointment";

function RoleRoutes({ role, setRole }) {
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch("https://login-app-m004.onrender.com/profile", {
        headers: { Authorization: "Bearer " + token },
      })
        .then((res) => res.json())
        .then((data) => setRole(data.role))
        .catch(() => setRole(null));
    } else {
      setRole(null);
    }
  }, [setRole]);
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/appointments" element={<Appointment />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/admin" element={<AdminPanel />} />
    </Routes>
  );
}

export default function App() {
  const [role, setRole] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
    },
    components: {
      MuiContainer: {
        styleOverrides: {
          root: {
            paddingTop: 32,
            paddingBottom: 32,
            minHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          },
        },
      },
    },
  });
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: 16 }}>
        <span style={{ marginRight: 8 }}>Karanlık Mod</span>
        <Switch checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
      </div>
      <Container maxWidth="sm">
        <Typography variant="h3" align="center" gutterBottom style={{ fontWeight: 700, marginBottom: 32 }}>
          Login App
        </Typography>
        <BrowserRouter>
          <RoleRoutes role={role} setRole={setRole} />
        </BrowserRouter>
      </Container>
    </ThemeProvider>
  );
}
