# Claro eCare Auth Microservice - OTP Management

Microservicio de autenticación para Claro eCare que gestiona OTP (One-Time Passwords) utilizando Redis como almacenamiento.

## Características

- ✅ Generación de OTP de 6 dígitos
- ✅ Validación de números telefónicos chilenos
- ✅ Expiración de OTP después de 5 minutos
- ✅ Rate limiting: Nuevo OTP cada 1 minuto
- ✅ Mantiene el OTP vigente entre solicitudes
- ✅ Almacenamiento en Redis
- ✅ API RESTful con NestJS
- ✅ TypeScript
- ✅ Validaciones con class-validator

## Formatos de Números Telefónicos Chilenos Soportados

El servicio acepta números móviles chilenos en los siguientes formatos:

- `+56912345678` - Con código de país y signo +
- `56912345678` - Con código de país sin signo +
- `912345678` - Formato local (9 dígitos comenzando con 9)
- También acepta espacios y guiones: `+56 9 1234 5678`, `+56-9-1234-5678`

## Requisitos

- Node.js 18+
- Redis 6+
- npm o yarn

## Instalación

```bash
npm install
```

## Configuración

Crea un archivo `.env` basado en `.env.example`:

```env
PORT=3000
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
OTP_EXPIRATION_SECONDS=300
OTP_REQUEST_COOLDOWN_SECONDS=60
```

## Ejecución

### Desarrollo
```bash
npm run start:dev
```

### Producción
```bash
npm run build
npm run start:prod
```

## Testing

```bash
# Tests unitarios
npm test

# Tests con cobertura
npm run test:cov

# Tests en modo watch
npm run test:watch
```

## API Endpoints

### 1. Generar OTP

**POST** `/otp/generate`

Genera un nuevo OTP para un número de teléfono. Si ya existe un OTP vigente, lo mantiene y simplemente actualiza el cooldown.

**Request Body:**
```json
{
  "phoneNumber": "+56912345678"
}
```

**Response (200 OK):**
```json
{
  "message": "OTP generated successfully for +56912345678",
  "expiresIn": 300
}
```

**Response (400 Bad Request) - Si está en cooldown:**
```json
{
  "statusCode": 400,
  "message": "Please wait 45 seconds before requesting a new OTP",
  "error": "Bad Request"
}
```

### 2. Validar OTP

**POST** `/otp/validate`

Valida un OTP para un número de teléfono. Si es correcto, lo elimina del sistema.

**Request Body:**
```json
{
  "phoneNumber": "+56912345678",
  "otp": "123456"
}
```

**Response (200 OK):**
```json
{
  "valid": true,
  "message": "OTP validated successfully"
}
```

**Response (401 Unauthorized) - OTP inválido:**
```json
{
  "statusCode": 401,
  "message": "Invalid OTP",
  "error": "Unauthorized"
}
```

### 3. Consultar Estado de OTP

**GET** `/otp/status?phoneNumber=+56912345678`

Consulta si existe un OTP vigente para un número de teléfono y cuánto tiempo le queda.

**Response (200 OK) - OTP existe:**
```json
{
  "exists": true,
  "remainingSeconds": 250
}
```

**Response (200 OK) - OTP no existe:**
```json
{
  "exists": false
}
```

## Ejemplos de Uso

### Con cURL

```bash
# Generar OTP
curl -X POST http://localhost:3000/otp/generate \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+56912345678"}'

# Validar OTP
curl -X POST http://localhost:3000/otp/validate \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+56912345678", "otp": "123456"}'

# Consultar estado
curl http://localhost:3000/otp/status?phoneNumber=+56912345678
```

## Arquitectura

```
src/
├── common/
│   └── validators/
│       └── chilean-phone.validator.ts    # Validador de números chilenos
├── config/
│   └── redis.service.ts                  # Servicio de conexión a Redis
├── otp/
│   ├── dto/
│   │   ├── generate-otp.dto.ts          # DTO para generación
│   │   └── validate-otp.dto.ts          # DTO para validación
│   ├── otp.controller.ts                # Controlador REST
│   ├── otp.service.ts                   # Lógica de negocio
│   └── otp.module.ts                    # Módulo NestJS
├── app.module.ts                         # Módulo principal
└── main.ts                               # Entry point
```

## Flujo de Funcionamiento

1. **Generación de OTP:**
   - Cliente solicita OTP para un número telefónico
   - Sistema verifica si hay cooldown activo (1 minuto)
   - Si existe OTP vigente, lo mantiene; si no, genera uno nuevo
   - OTP expira en 5 minutos
   - Se establece cooldown de 1 minuto para nuevas solicitudes

2. **Validación de OTP:**
   - Cliente envía número telefónico y OTP
   - Sistema verifica que coincidan
   - Si es correcto, elimina el OTP y devuelve éxito
   - Si es incorrecto o expiró, devuelve error

## Seguridad

- Validación estricta de formato de números telefónicos
- Rate limiting para prevenir ataques de fuerza bruta
- OTPs de un solo uso (se eliminan después de validación exitosa)
- Expiración automática de OTPs
- Validación de entrada con class-validator

## Licencia

ISC