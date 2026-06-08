# Hausplus — Frontend React

Plataforma inmobiliaria con tres tipos de usuario: **Cliente**, **Propietario** y **Empleado**.

## Stack

- **React 18** + React Router v6
- **CSS Modules** (sin frameworks externos)
- **Axios** (preparado para conectar al backend)
- **Context API** para gestión de autenticación

---

## Estructura del proyecto

```
src/
├── assets/
│   └── mockData.js          # Datos mock de propiedades
├── components/
│   ├── Navbar.jsx            # Barra de navegación global
│   ├── Navbar.module.css
│   ├── PropertyCard.jsx      # Tarjeta de propiedad
│   ├── PropertyCard.module.css
│   ├── Chatbot.jsx           # Chatbot con FAQ
│   └── Chatbot.module.css
├── context/
│   └── AuthContext.jsx       # Auth global (login/logout/user)
├── pages/
│   ├── LoginPage.jsx         # Login con selección de rol
│   ├── LoginPage.module.css
│   ├── client/
│   │   ├── LandingPage.jsx   # Catálogo público
│   │   ├── LandingPage.module.css
│   │   ├── PropertyDetail.jsx
│   │   └── PropertyDetail.module.css
│   ├── employee/
│   │   ├── EmployeeDashboard.jsx
│   │   └── EmployeeDashboard.module.css
│   └── owner/
│       ├── OwnerDashboard.jsx
│       └── OwnerDashboard.module.css
├── App.jsx                   # Routing y rutas protegidas
├── index.js
└── index.css                 # Variables CSS globales y reset
```

---

## Arrancar el proyecto

```bash
npm install
npm start
```

Abre [http://localhost:3000](http://localhost:3000).

---

## Flujo de navegación

```
/ (LandingPage)
  └── /login
        ├── rol: cliente   → /         (catálogo con sesión)
        ├── rol: empleado  → /empleado (portal de gestión)
        └── rol: propietario → /propietario (panel del propietario)
```

---

## Conectar al backend Django + DRF

Reemplaza la función `login` en `src/context/AuthContext.jsx`:

```js
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const login = async ({ email, password }) => {
  const { data } = await axios.post('/api/auth/token/', { email, password });
  localStorage.setItem('access', data.access);
  localStorage.setItem('refresh', data.refresh);
  const payload = jwtDecode(data.access);
  const user = { name: payload.name, email: payload.email, role: payload.role };
  setUser(user);
  return user;
};
```

Configura el interceptor de Axios en `src/api/axiosConfig.js` para adjuntar el token JWT en cada petición.

---

## Variables de entorno

Crea un archivo `.env` en la raíz:

```
REACT_APP_API_URL=http://localhost:8000/api
```

Y úsalo en tus llamadas:

```js
axios.get(`${process.env.REACT_APP_API_URL}/properties/`)
```
