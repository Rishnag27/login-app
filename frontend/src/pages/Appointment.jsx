import React, { useEffect, useState } from "react";
import { Button, TextField, Snackbar, Alert, CircularProgress, Typography, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function Appointment() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ date: "", time: "", description: "" });
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const navigate = useNavigate();

  const fetchAppointments = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    const res = await fetch("http://127.0.0.1:5000/appointments", {
      headers: { Authorization: "Bearer " + token },
    });
    const data = await res.json();
    setAppointments(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const res = await fetch("http://127.0.0.1:5000/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      setSnackbar({ open: true, message: "Randevu oluşturuldu!", severity: "success" });
      setForm({ date: "", time: "", description: "" });
      fetchAppointments();
    } else {
      setSnackbar({ open: true, message: data.error || data.message, severity: "error" });
    }
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`http://127.0.0.1:5000/appointments/${id}`, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + token },
    });
    const data = await res.json();
    if (res.ok) {
      setSnackbar({ open: true, message: "Randevu silindi!", severity: "success" });
      setAppointments(appointments.filter(a => a.id !== id));
    } else {
      setSnackbar({ open: true, message: data.error || data.message, severity: "error" });
    }
  };

  return (
    <Paper style={{ padding: 24, marginTop: 24, width: "100%" }}>
      <Button variant="outlined" onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>Geri Dön</Button>
      <Typography variant="h5" gutterBottom>Randevularım</Typography>
      <form onSubmit={handleCreate} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <TextField
          label="Tarih"
          type="date"
          name="date"
          value={form.date}
          onChange={e => setForm({ ...form, date: e.target.value })}
          InputLabelProps={{ shrink: true }}
          required
        />
        <TextField
          label="Saat"
          type="time"
          name="time"
          value={form.time}
          onChange={e => setForm({ ...form, time: e.target.value })}
          InputLabelProps={{ shrink: true }}
          required
          style={{ minWidth: 105 }}
        />
        <TextField
          label="Açıklama"
          name="description"
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
        />
        <Button type="submit" variant="contained">Ekle</Button>
      </form>
      {loading ? <CircularProgress /> : (
        appointments.length === 0 ? <Typography>Hiç randevu yok.</Typography> :
        appointments.map(a => (
          <div key={a.id} style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
            <span style={{ flex: 1 }}>
              {a.date} {a.time} - {a.description} {a.username && <b>({a.username})</b>}
            </span>
            <Button variant="outlined" color="error" size="small" onClick={() => handleDelete(a.id)}>
              Sil
            </Button>
          </div>
        ))
      )}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
}