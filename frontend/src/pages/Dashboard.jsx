import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import { io } from "socket.io-client";

export default function Dashboard() {
  const [message, setMessage] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [username, setUsername] = useState("");
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/");

    fetch("http://127.0.0.1:5000/profile", {
      headers: { Authorization: "Bearer " + token },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.username) setUsername(data.username);
      });

    fetch("http://127.0.0.1:5000/dashboard", {
      headers: { Authorization: "Bearer " + token },
    })
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch(() => setMessage("Sunucuya bağlanılamadı"));

    // Geçmiş mesajları çek
    fetch("http://127.0.0.1:5000/messages")
      .then(res => res.json())
      .then(data => setChatMessages(data || []));

    // socket.io bağlantısı
    socketRef.current = io("http://127.0.0.1:5000");
    socketRef.current.on("chat_message", (data) => {
      setChatMessages((prev) => [...prev, data]);
    });
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [navigate]);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const msg = { username, message: chatInput };
    socketRef.current.emit("chat_message", msg);
    setChatInput("");
  };

  return (
    <div>
      <h2>Dashboard</h2>
      <p>{message}</p>
      <Paper style={{ maxWidth: 500, margin: "24px auto", padding: 16 }}>
        <h3>Canlı Sohbet</h3>
        <div style={{ maxHeight: 200, overflowY: "auto", background: "#f5f5f5", padding: 8, marginBottom: 8 }}>
          {chatMessages.map((msg, i) => (
            <div key={i} style={{ marginBottom: 4 }}>
              <b>{msg.username}:</b> {msg.message}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <form onSubmit={sendMessage} style={{ display: "flex", gap: 8 }}>
          <TextField
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            placeholder="Mesaj yaz..."
            size="small"
            fullWidth
          />
          <Button type="submit" variant="contained">Gönder</Button>
        </form>
      </Paper>
      <Button variant="contained" onClick={() => navigate("/appointments")}>Randevu Al</Button>
      <Button variant="contained" onClick={() => navigate("/profile")}>Profili Gör</Button>
      <Button variant="contained"
        onClick={() => {
          localStorage.removeItem("token");
          navigate("/");
        }}
      >
        Çıkış Yap
      </Button>
    </div>
  );
}
