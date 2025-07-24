import React, { useEffect, useState } from "react";
import { Button, TextField, Snackbar, Alert, CircularProgress, Typography, Paper, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";

export default function AdminPanel() {
  const [appointments, setAppointments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ date: "", time: "", description: "" });
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [editDialog, setEditDialog] = useState({ open: false, appointment: null });
  const [editForm, setEditForm] = useState({ date: "", time: "", description: "" });

  const fetchAppointments = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    const res = await fetch("https://login-app-m004.onrender.com/appointments", {
      headers: { Authorization: "Bearer " + token },
    });
    const data = await res.json();
    setAppointments(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  const fetchUsers = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch("https://login-app-m004.onrender.com/users", {
      headers: { Authorization: "Bearer " + token },
    });
    const data = await res.json();
    setUsers(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    fetchAppointments();
    fetchUsers();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const res = await fetch("https://login-app-m004.onrender.com/appointments", {
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
    const res = await fetch(`https://login-app-m004.onrender.com/appointments/${id}`, {
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

  const handleEditOpen = (appointment) => {
    setEditForm({ date: appointment.date, time: appointment.time, description: appointment.description });
    setEditDialog({ open: true, appointment });
  };

  const handleEditSave = async () => {
    const token = localStorage.getItem("token");
    const { appointment } = editDialog;
    const res = await fetch(`https://login-app-m004.onrender.com/appointments/${appointment.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify(editForm),
    });
    const data = await res.json();
    if (res.ok) {
      setSnackbar({ open: true, message: "Randevu güncellendi!", severity: "success" });
      fetchAppointments();
      setEditDialog({ open: false, appointment: null });
    } else {
      setSnackbar({ open: true, message: data.error || data.message, severity: "error" });
    }
  };

  const handleUserRole = async (user, newRole) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`https://login-app-m004.onrender.com/users/${user.id}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ role: newRole }),
    });
    const data = await res.json();
    if (res.ok) {
      setSnackbar({ open: true, message: `Kullanıcı ${newRole === "admin" ? "admin yapıldı" : "adminlikten çıkarıldı"}!`, severity: "success" });
      fetchUsers();
    } else {
      setSnackbar({ open: true, message: data.error || data.message, severity: "error" });
    }
  };

  const handleUserDelete = async (user) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`https://login-app-m004.onrender.com/users/${user.id}`, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + token },
    });
    const data = await res.json();
    if (res.ok) {
      setSnackbar({ open: true, message: "Kullanıcı silindi!", severity: "success" });
      fetchUsers();
    } else {
      setSnackbar({ open: true, message: data.error || data.message, severity: "error" });
    }
  };

  return (
    <Paper style={{ padding: 24, marginTop: 24, width: "100%" }}>
      <Typography variant="h4" gutterBottom>Admin Paneli</Typography>
      <Typography variant="h5" gutterBottom>Kullanıcılar</Typography>
      {users.length === 0 ? <Typography>Hiç kullanıcı yok.</Typography> : (
        users.map(user => (
          <div key={user.id} style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
            <span style={{ flex: 1 }}>{user.username} ({user.role})</span>
            <Button
              variant="outlined"
              color={user.role === "admin" ? "warning" : "success"}
              size="small"
              onClick={() => handleUserRole(user, user.role === "admin" ? "user" : "admin")}
              style={{ marginRight: 8 }}
            >
              {user.role === "admin" ? "Adminlikten Çıkar" : "Admin Yap"}
            </Button>
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={() => handleUserDelete(user)}
            >
              Sil
            </Button>
          </div>
        ))
      )}
      <Typography variant="h5" gutterBottom style={{ marginTop: 32 }}>Randevular</Typography>
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
            <Button variant="outlined" color="primary" size="small" onClick={() => handleEditOpen(a)} style={{ marginRight: 8 }}>
              Düzenle
            </Button>
            <Button variant="outlined" color="error" size="small" onClick={() => handleDelete(a.id)}>
              Sil
            </Button>
          </div>
        ))
      )}
      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, appointment: null })}>
        <DialogTitle>Randevu Düzenle</DialogTitle>
        <DialogContent style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 300 }}>
          <TextField
            label="Tarih"
            type="date"
            name="date"
            value={editForm.date}
            onChange={e => setEditForm({ ...editForm, date: e.target.value })}
            InputLabelProps={{ shrink: true }}
            required
          />
          <TextField
            label="Saat"
            type="time"
            name="time"
            value={editForm.time}
            onChange={e => setEditForm({ ...editForm, time: e.target.value })}
            InputLabelProps={{ shrink: true }}
            required
          />
          <TextField
            label="Açıklama"
            name="description"
            value={editForm.description}
            onChange={e => setEditForm({ ...editForm, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, appointment: null })}>İptal</Button>
          <Button onClick={handleEditSave} variant="contained">Kaydet</Button>
        </DialogActions>
      </Dialog>
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