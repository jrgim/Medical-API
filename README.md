# Hospital Management API

Sistema de gestión hospitalaria desarrollado con Node.js, Express y TypeScript que proporciona una API REST completa para la administración de hospitales, incluyendo gestión de pacientes, doctores, citas médicas, historiales clínicos y más.

## 📋 Tabla de Contenidos

- [Características](#características)
- [Tecnologías Utilizadas](#tecnologías-utilizadas)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Ejecución](#ejecución)
- [API Endpoints](#api-endpoints)
- [Autenticación y Autorización](#autenticación-y-autorización)
- [Base de Datos](#base-de-datos)
- [Testing](#testing)

## ✨ Características

- **Gestión de Usuarios**: Soporte para tres roles (paciente, doctor, admin)
- **Sistema de Autenticación**: JWT para autenticación y autorización basada en roles
- **Gestión de Pacientes**: Registro, actualización y consulta de información de pacientes
- **Gestión de Doctores**: Administración de perfiles médicos y especialidades
- **Sistema de Citas**: Programación, reagendamiento y cancelación de citas
- **Historiales Médicos**: Registro de diagnósticos, tratamientos y resultados de pruebas
- **Disponibilidad Médica**: Gestión de horarios disponibles para doctores
- **Notificaciones**: Sistema de notificaciones para usuarios
- **Auditoría**: Registro de acciones importantes en el sistema
- **Departamentos y Especialidades**: Gestión de especialidades médicas y departamentos

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** - Entorno de ejecución
- **Express 5.x** - Framework web
- **TypeScript** - Lenguaje de programación
- **SQLite3** - Base de datos
- **TypeDI** - Inyección de dependencias

### Seguridad y Validación
- **JWT (jsonwebtoken)** - Autenticación basada en tokens
- **bcryptjs** - Hash de contraseñas
- **express-validator** - Validación de datos

### Testing
- **Jest** - Framework de testing
- **ts-jest** - Soporte de TypeScript para Jest
- **Supertest** - Testing de endpoints HTTP

### Utilidades
- **dotenv** - Variables de entorno
- **cors** - Manejo de CORS
- **morgan** - Logger de peticiones HTTP
- **lodash** - Utilidades de JavaScript

## 📁 Estructura del Proyecto

```
finalpractice-139992/
├── src/
│   ├── app/                          # Módulos de la aplicación
│   │   ├── appointments/             # Gestión de citas
│   │   ├── audit/                    # Auditoría del sistema
│   │   ├── availability/             # Disponibilidad de doctores
│   │   ├── departments/              # Departamentos del hospital
│   │   ├── doctors/                  # Gestión de doctores
│   │   ├── medical-records/          # Historiales médicos
│   │   ├── notifications/            # Sistema de notificaciones
│   │   ├── patients/                 # Gestión de pacientes
│   │   ├── public/                   # Endpoints públicos
│   │   ├── specialties/              # Especialidades médicas
│   │   └── users/                    # Gestión de usuarios
│   ├── config/                       # Configuración
│   │   └── environment/              # Configuración por entorno
│   ├── database/                     # Servicios de base de datos
│   │   ├── models/                   # Modelos de base de datos
│   │   └── database.service.ts       # Servicio principal de BD
│   ├── server/                       # Configuración del servidor
│   │   ├── api/                      # Configuración de rutas
│   │   └── middlewares/              # Middlewares (auth, validation, etc.)
│   └── index.ts                      # Punto de entrada
├── jest.config.js                    # Configuración de Jest
├── tsconfig.json                     # Configuración de TypeScript
└── package.json                      # Dependencias y scripts
```

### Patrón de Arquitectura

Cada módulo sigue una arquitectura en capas:
- **Controller**: Maneja las peticiones HTTP y las respuestas
- **Service**: Contiene la lógica de negocio
- **Repository**: Interactúa con la base de datos
- **Model**: Define los tipos e interfaces de datos

## 🚀 Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd finalpractice-139992
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Crear archivo de configuración** (opcional)
```bash
# Crear archivo .env en la raíz del proyecto
touch .env
```

## ⚙️ Configuración

### Variables de Entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
# Puerto del servidor
PORT=3000

# Entorno (development, test, production)
NODE_ENV=development

# JWT Secret (cambiar en producción)
JWT_SECRET=tu_secret_key_segura_aqui
```

### Base de Datos

La aplicación utiliza SQLite y crea automáticamente la base de datos al iniciar:
- **Desarrollo**: `src/data/hospital.db`
- **Testing**: Base de datos en memoria (`:memory:`)

## 🏃‍♂️ Ejecución

### Modo Desarrollo
```bash
npm run dev
```
El servidor se ejecutará en `http://localhost:3000` con hot-reload.

### Modo Producción
```bash
# Compilar TypeScript
npm run build

# Ejecutar la aplicación
npm start
```

### Testing
```bash
npm test
```

## 📡 API Endpoints

### Base URL
```
http://localhost:3000/api
```

### Endpoints Públicos

#### Autenticación

**POST** `/api/public/login`
- **Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
- **Response**:
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "patient"
  }
}
```

#### Doctores Públicos

**GET** `/api/public/doctors`
- Lista todos los doctores disponibles (sin autenticación)
- Query params: `specialtyId`, `date`

**GET** `/api/public/doctors/:id`
- Obtiene información de un doctor específico

### Pacientes

**POST** `/api/patients` (Público - Registro)
- **Body**:
```json
{
  "email": "patient@example.com",
  "password": "password123",
  "firstName": "Juan",
  "lastName": "Pérez",
  "dateOfBirth": "1990-01-15",
  "phone": "123456789",
  "address": "Calle Principal 123"
}
```

**GET** `/api/patients` (🔒 Autenticado)
- Admin: lista todos los pacientes
- Doctor: lista pacientes con citas asignadas

**GET** `/api/patients/:id` (🔒 Autenticado)
- Obtiene información de un paciente específico

**PUT** `/api/patients/:id` (🔒 Autenticado)
- Actualiza información del paciente

**GET** `/api/patients/:patientId/medical-records` (🔒 Autenticado)
- Obtiene historiales médicos del paciente

**DELETE** `/api/patients/:id` (🔒 Admin)
- Elimina un paciente

### Doctores

**GET** `/api/doctors` (🔒 Autenticado)
- Lista todos los doctores
- Query params: `specialtyId`, `date`

**POST** `/api/doctors` (🔒 Admin)
- **Body**:
```json
{
  "email": "doctor@example.com",
  "password": "password123",
  "firstName": "María",
  "lastName": "García",
  "licenseNumber": "LIC123456",
  "specialtyIds": [1, 2],
  "consultationFee": 50.00,
  "yearsOfExperience": 10
}
```

**GET** `/api/doctors/:id` (🔒 Autenticado)
- Obtiene información de un doctor específico

**PUT** `/api/doctors/:id` (🔒 Doctor/Admin)
- Actualiza información del doctor

**PUT** `/api/doctors/:id/specialties` (🔒 Admin)
- Actualiza especialidades del doctor
- **Body**: `{ "specialtyIds": [1, 2, 3] }`

**DELETE** `/api/doctors/:id` (🔒 Admin)
- Elimina un doctor

### Citas (Appointments)

**GET** `/api/appointments` (🔒 Autenticado)
- Lista citas según el rol del usuario
- Paciente: sus propias citas
- Doctor: citas asignadas a él
- Admin: todas las citas

**POST** `/api/appointments` (🔒 Autenticado)
- **Body**:
```json
{
  "doctorId": 1,
  "appointmentDate": "2026-02-15",
  "appointmentTime": "10:30",
  "reason": "Consulta general"
}
```

**GET** `/api/appointments/:id` (🔒 Autenticado)
- Obtiene detalles de una cita específica

**PATCH** `/api/appointments/:id/reschedule` (🔒 Autenticado)
- **Body**:
```json
{
  "newDateTime": "2026-02-16T14:00:00.000Z",
  "reason": "Motivo del cambio"
}
```

**PATCH** `/api/appointments/:id/cancel` (🔒 Autenticado)
- **Body**: `{ "reason": "Motivo de cancelación" }`

**DELETE** `/api/appointments/:id` (🔒 Admin)
- Elimina una cita

### Historiales Médicos

**GET** `/api/medical-records` (🔒 Autenticado)
- Lista historiales según el rol
- Query params: `patientId`, `doctorId`

**POST** `/api/medical-records` (🔒 Doctor/Admin)
- **Body**:
```json
{
  "patientId": 1,
  "diagnosis": "Diagnóstico médico",
  "notes": "Notas adicionales"
}
```

**GET** `/api/medical-records/:id` (🔒 Autenticado)
- Obtiene un historial médico específico

**PATCH** `/api/medical-records/:id` (🔒 Doctor/Admin)
- Actualiza un historial médico

**POST** `/api/medical-records/:id/test-results` (🔒 Doctor/Admin)
- **Body**:
```json
{
  "testType": "Análisis de sangre",
  "result": "Resultados normales",
  "date": "2026-02-03",
  "notes": "Sin observaciones"
}
```

**POST** `/api/medical-records/:id/treatments` (🔒 Doctor/Admin)
- **Body**:
```json
{
  "name": "Ibuprofeno 400mg",
  "startDate": "2026-02-03T10:00:00.000Z",
  "details": "Tomar cada 8 horas",
  "status": "ongoing"
}
```

**PATCH** `/api/medical-records/:id/treatments/:treatmentId` (🔒 Doctor/Admin)
- **Body**:
```json
{
  "details": "Nuevas instrucciones",
  "status": "completed"
}
```

**DELETE** `/api/medical-records/:id` (🔒 Admin)
- Elimina un historial médico

### Disponibilidad (Availability)

**GET** `/api/availability/doctors/:doctorId`
- Lista disponibilidad de un doctor
- Query param: `date`

**POST** `/api/availability` (🔒 Doctor/Admin)
- **Body** (array de slots):
```json
[
  {
    "date": "2026-02-10",
    "time": "09:00",
    "isAvailable": true
  },
  {
    "date": "2026-02-10",
    "time": "10:00",
    "isAvailable": true
  }
]
```

**PUT** `/api/availability/:slotId` (🔒 Doctor/Admin)
- Actualiza un slot de disponibilidad

**DELETE** `/api/availability/:slotId` (🔒 Doctor/Admin)
- Elimina un slot de disponibilidad

### Especialidades

**GET** `/api/specialties`
- Lista todas las especialidades

**POST** `/api/specialties` (🔒 Admin)
- **Body**: `{ "name": "Cardiología", "description": "..." }`

**GET** `/api/specialties/:id`
- Obtiene una especialidad específica

**PUT** `/api/specialties/:id` (🔒 Admin)
- Actualiza una especialidad

**DELETE** `/api/specialties/:id` (🔒 Admin)
- Elimina una especialidad

### Departamentos

**GET** `/api/departments`
- Lista todos los departamentos

**POST** `/api/departments` (🔒 Admin)
- **Body**: `{ "name": "Emergencias", "description": "...", "phone": "...", "location": "..." }`

**GET** `/api/departments/:id`
- Obtiene un departamento específico

**PUT** `/api/departments/:id` (🔒 Admin)
- Actualiza un departamento

**DELETE** `/api/departments/:id` (🔒 Admin)
- Elimina un departamento

### Notificaciones

**GET** `/api/notifications` (🔒 Autenticado)
- Lista notificaciones del usuario autenticado

**POST** `/api/notifications/send` (🔒 Autenticado)
- **Body**:
```json
{
  "userId": 1,
  "title": "Título",
  "message": "Mensaje de la notificación",
  "type": "alert"
}
```

**PATCH** `/api/notifications/:id/read` (🔒 Autenticado)
- Marca una notificación como leída

**DELETE** `/api/notifications/:id` (🔒 Autenticado)
- Elimina una notificación

### Usuarios

**GET** `/api/users` (🔒 Admin)
- Lista todos los usuarios

**GET** `/api/users/search` (🔒 Admin)
- Busca usuarios
- Query params: `query`, `role`

### Auditoría

**GET** `/api/audit-logs` (🔒 Admin)
- Lista todos los registros de auditoría
- Query params: `userId`, `action`, `entityType`

## 🔐 Autenticación y Autorización

### Sistema de Autenticación

El sistema utiliza **JWT (JSON Web Tokens)** para la autenticación:

1. El usuario inicia sesión en `/api/public/login`
2. Recibe un token JWT válido por 7 días
3. Debe incluir el token en todas las peticiones protegidas

### Headers Requeridos

```
Authorization: Bearer <jwt_token>
```

### Roles del Sistema

- **patient**: Pacientes del hospital
  - Puede ver sus propias citas y historiales
  - Puede crear citas
  - Puede actualizar su perfil

- **doctor**: Médicos del hospital
  - Puede ver sus citas asignadas
  - Puede crear y actualizar historiales médicos
  - Puede gestionar su disponibilidad
  - Puede ver pacientes con citas asignadas

- **admin**: Administradores del sistema
  - Acceso completo a todas las funcionalidades
  - Puede crear doctores
  - Puede gestionar departamentos y especialidades
  - Acceso a logs de auditoría

## 💾 Base de Datos

### Esquema de Base de Datos

La base de datos SQLite contiene las siguientes tablas:

- **users**: Usuarios del sistema
- **patients**: Perfiles de pacientes
- **doctors**: Perfiles de doctores
- **doctorSpecialties**: Relación muchos a muchos entre doctores y especialidades
- **specialties**: Especialidades médicas
- **departments**: Departamentos del hospital
- **appointments**: Citas médicas
- **availabilities**: Disponibilidad de doctores
- **medicalRecords**: Historiales médicos
- **treatments**: Tratamientos prescritos
- **testResults**: Resultados de pruebas médicas
- **notifications**: Notificaciones del sistema
- **auditLogs**: Registro de auditoría

### Inicialización

La base de datos se inicializa automáticamente al iniciar la aplicación:
- Se crean todas las tablas necesarias
- Se configuran las relaciones y constraints
- Se habilitan las foreign keys

## 🧪 Testing

El proyecto utiliza **Jest** con **TypeScript** para testing.

### Ejecutar Tests

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests en modo watch
npm test -- --watch

# Ejecutar tests con cobertura
npm test -- --coverage
```

### Estructura de Tests

Los archivos de test están ubicados junto a sus módulos correspondientes con el patrón `*.spec.ts`:

```
src/app/appointments/
├── appointment.controller.spec.ts
├── appointment.service.spec.ts
```

### Ejemplo de Estructura de Test

```typescript
describe('AppointmentService', () => {
  it('should create an appointment', async () => {
    // Test implementation
  });
});
```

## 📝 Notas Adicionales

### Características de Seguridad

- Contraseñas hasheadas con bcrypt
- Tokens JWT con expiración
- Validación de datos con express-validator
- Control de acceso basado en roles
- Foreign keys habilitadas en SQLite
- Registro de auditoría para acciones críticas

### Funcionalidades Especiales

- **Notificaciones Automáticas**: Se generan notificaciones cuando:
  - Se actualiza un historial médico
  - Se añaden resultados de pruebas
  - Se crean o modifican citas

- **Validación de Permisos**: 
  - Los doctores solo pueden crear historiales para pacientes con citas
  - Los pacientes solo pueden ver sus propios datos
  - Los doctores solo pueden ver sus pacientes asignados

- **Gestión de Disponibilidad**:
  - Los doctores pueden definir slots de disponibilidad
  - Los slots se marcan como no disponibles al crear citas

## 👤 Autor

**Jorge** - Universidad San Jorge  
Tecnologías Avanzadas - Curso 2025-2026

## 📄 Licencia

MIT
