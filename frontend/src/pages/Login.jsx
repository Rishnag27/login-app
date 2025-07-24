import React from "react";
import {useFormik} from 'formik';
import * as Yup from 'yup';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar'; // Bilgi mesajı için
import Alert from '@mui/material/Alert'; // Snackbar ile birlikte kullanılır
import CircularProgress from '@mui/material/CircularProgress'; // Yükleniyor animasyonu için
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function Login() {
  const [loading, setLoading] = useState(false); // Yükleniyor animasyonu için
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' }); // Snackbar için
  const navigate = useNavigate();

  // Formik ve Yup ile validasyon
  const validationSchema = Yup.object({
    username: Yup.string().required("Kullanıcı adı zorunlu!"),
    password: Yup.string().required("Şifre zorunlu!"),
  });

  const formik = useFormik({
    initialValues: {
      username: "",
      password: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true); // Form gönderilince yükleniyor başlasın
      try {
        const res = await fetch("https://login-app-m004.onrender.com/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        const data = await res.json();
        if (res.ok) {
          localStorage.setItem("token", data.token);
          setSnackbar({ open: true, message: "Giriş başarılı!", severity: "success" });
          navigate("/dashboard");
        } else {
          setSnackbar({ open: true, message: data.error || data.message, severity: "error" });
        }
      } catch (e) {
        setSnackbar({ open: true, message: "Sunucu hatası!", severity: "error" });
      }
      setLoading(false); // İstek bitince yükleniyor dursun
    },
  });

  return (
    <div>
      {/* Yükleniyor animasyonu */}
      {loading && <CircularProgress />}
      {/* Snackbar ile bilgi/hata mesajı */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      {/* Formik ile form yönetimi */}
      <form onSubmit={formik.handleSubmit}>
        <input
          name="username"
          placeholder="Kullanıcı adı"
          value={formik.values.username}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        />
        {formik.touched.username && formik.errors.username && (
          <div style={{ color: "red" }}>{formik.errors.username}</div>
        )}
        <input
          name="password"
          type="password"
          placeholder="Şifre"
          value={formik.values.password}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        />
        {formik.touched.password && formik.errors.password && (
          <div style={{ color: "red" }}>{formik.errors.password}</div>
        )}
        <Button type="submit" variant="contained" disabled={loading}>Giriş Yap</Button>
      </form>
      <p>
        Hesabın yok mu? <Link to="/register">Kayıt Ol</Link>
      </p>
    </div>
  );
}
