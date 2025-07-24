import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import { useFormik } from 'formik';
import * as Yup from 'yup';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/");

    fetch("https://login-app-m004.onrender.com/profile", {
      headers: { Authorization: "Bearer " + token },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          alert(data.error);
          navigate("/");
        } else {
          setProfile(data);
        }
      })
      .catch(() => {
        alert("Sunucuya bağlanırken hata oluştu");
        navigate("/");
      });
  }, []);

  // Profil güncelleme formu için Formik
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      username: profile ? profile.username : '',
      password: '',
    },
    validationSchema: Yup.object({
      username: Yup.string().required('Kullanıcı adı zorunlu!'),
      password: Yup.string().min(8, 'Şifre en az 8 karakter olmalı!').notRequired(),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const res = await fetch('https://login-app-m004.onrender.com/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + localStorage.getItem('token'),
          },
          body: JSON.stringify(values),
        });
        const data = await res.json();
        if (res.ok) {
          setSnackbar({ open: true, message: 'Profil güncellendi!', severity: 'success' });
          setProfile({ ...profile, username: values.username });
        } else {
          setSnackbar({ open: true, message: data.error || data.message, severity: 'error' });
        }
      } catch (e) {
        setSnackbar({ open: true, message: 'Sunucu hatası!', severity: 'error' });
      }
      setLoading(false);
    },
  });

  if (!profile) return <div>Yükleniyor...</div>;

  return (
    <div>
      <Button variant="outlined" onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>Geri Dön</Button>
      <h2>Profil Bilgileri</h2>
      <p>ID: {profile.id}</p>
      <p>Rol: {profile.role}</p>
      <form onSubmit={formik.handleSubmit} style={{ marginBottom: 16 }}>
        <TextField
          label="Kullanıcı Adı"
          name="username"
          value={formik.values.username}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.username && Boolean(formik.errors.username)}
          helperText={formik.touched.username && formik.errors.username}
          margin="normal"
          fullWidth
        />
        <TextField
          label="Yeni Şifre"
          name="password"
          type="password"
          value={formik.values.password}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.password && Boolean(formik.errors.password)}
          helperText={formik.touched.password && formik.errors.password}
          margin="normal"
          fullWidth
        />
        <Button type="submit" variant="contained" disabled={loading} style={{ marginTop: 8 }}>
          Profili Güncelle
        </Button>
        {loading && <CircularProgress size={24} style={{ marginLeft: 16, verticalAlign: 'middle' }} />}
      </form>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      <p>Kullanıcı Adı: {profile.username}</p>
      {profile.role === "admin" && (
        <Button variant="contained" style={{ marginTop: 16 }} onClick={() => navigate('/admin')}>
          Admin Paneli
        </Button>
      )}
      <Button
        variant="contained"
        style={{ marginTop: 16 }}
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
