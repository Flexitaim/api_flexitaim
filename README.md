# API de Usuarios

API REST simple para gestión de usuarios desarrollada con TypeScript, Express y MySQL.

## Estructura del Proyecto

```
src/
├── controllers/     # Controladores que manejan las peticiones HTTP
│   └── usuariosController.ts
├── models/         # Modelos de Sequelize
│   └── Usuario.ts
├── routes/         # Rutas de la API
│   └── usuariosRouter.ts
├── services/       # Lógica de negocio
│   └── usuariosService.ts
├── utils/          # Utilidades y configuraciones
│   └── databaseService.ts
└── index.ts        # Punto de entrada de la aplicación
```

## Requisitos Previos

- Node.js (v14 o superior)
- MySQL (v8 o superior)
- npm o yarn

## Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/dev-ajras/reservoz.git
cd reservoz
```

2. Instalar dependencias:
```bash
npm install
```

3. Crear el archivo `.env` en la raíz del proyecto con las siguientes variables:
```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=reservoz
```

4. Crear la base de datos en MySQL:
```sql
CREATE DATABASE reservoz;
```

5. Compilar el proyecto:
```bash
npm run build
```

6. Iniciar el servidor:
```bash
npm run dev
```

## Endpoints Disponibles

### Crear Usuario
- **URL**: `/api/usuarios`
- **Método**: `POST`
- **Body**:
```json
{
    "nombre": "Nombre del Usuario"
}
```
- **Respuesta Exitosa** (201):
```json
{
    "id": "uuid-generado",
    "nombre": "Nombre del Usuario",
    "createdAt": "2024-03-27T12:00:00.000Z",
    "updatedAt": "2024-03-27T12:00:00.000Z"
}
```

### Obtener Usuarios
- **URL**: `/api/usuarios`
- **Método**: `GET`
- **Respuesta Exitosa** (200):
```json
[
    {
        "id": "uuid-1",
        "nombre": "Usuario 1",
        "createdAt": "2024-03-27T12:00:00.000Z",
        "updatedAt": "2024-03-27T12:00:00.000Z"
    },
    {
        "id": "uuid-2",
        "nombre": "Usuario 2",
        "createdAt": "2024-03-27T12:00:00.000Z",
        "updatedAt": "2024-03-27T12:00:00.000Z"
    }
]
```

## Estructura de Archivos

### Models
Los modelos definen la estructura de datos y sus relaciones. En este caso, tenemos:
- `Usuario.ts`: Define el modelo de Usuario con campos id (UUID) y nombre.

### Controllers
Los controladores manejan las peticiones HTTP y las respuestas:
- `usuariosController.ts`: Maneja las rutas relacionadas con usuarios.

### Services
Contiene la lógica de negocio:
- `usuariosService.ts`: Implementa las operaciones CRUD para usuarios.

### Routes
Define las rutas de la API:
- `usuariosRouter.ts`: Define las rutas para el recurso de usuarios.

### Utils
Contiene utilidades y configuraciones:
- `databaseService.ts`: Configuración de la conexión a MySQL con Sequelize.

## Scripts Disponibles

- `npm run build`: Compila el proyecto TypeScript
- `npm run dev`: Inicia el servidor en modo desarrollo
- `npm start`: Inicia el servidor en modo producción
- `npm run watch`: Compila el proyecto en modo watch

## Tecnologías Utilizadas

- TypeScript
- Express
- MySQL
- Sequelize
- dotenv
- cors 