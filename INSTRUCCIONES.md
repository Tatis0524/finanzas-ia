# FinanzasIA - Asistente Inteligente de Finanzas Personales

## Descripcion del Proyecto

FinanzasIA es una aplicacion web completa y funcional para la gestion de finanzas personales, potenciada con inteligencia artificial. Incluye todas las funcionalidades requeridas:

### Funcionalidades Implementadas

1. **Sistema de Autenticacion**
   - Registro de usuarios con email y contrasena
   - Inicio de sesion seguro
   - Verificacion de email
   - Sesiones persistentes

2. **Gestion Financiera**
   - Registrar ingresos y gastos
   - Editar y eliminar transacciones
   - Categorias predefinidas y personalizables
   - Historial completo de transacciones

3. **Analisis con IA**
   - Analisis automatico de habitos financieros
   - Recomendaciones personalizadas
   - Alertas de presupuesto
   - Evaluacion de tasa de ahorro

4. **Visualizacion**
   - Grafico de barras: Ingresos vs Gastos
   - Grafico circular: Gastos por categoria
   - Grafico de linea: Tendencia del balance
   - Resumen financiero con estadisticas

5. **Entrada por Voz**
   - Reconocimiento de voz con Web Speech API (gratuita)
   - Registro de gastos/ingresos por comandos de voz
   - Deteccion automatica de categoria y monto

6. **Importacion y Exportacion**
   - Exportar a CSV
   - Exportar a Excel (.xlsx)
   - Importar desde CSV
   - Importar desde Excel
   - Plantilla descargable

7. **BONUS: Generacion de Imagen y Video con IA**
   - Genera imagen del "estilo de vida financiero" usando Pollinations.ai (API 100% gratuita)
   - Convierte la imagen en video motivacional de 5 segundos
   - Descarga de imagen y video

---

## Tecnologias Utilizadas

### Frontend
- **Next.js 15** - Framework React con App Router
- **React 19** - Libreria de UI
- **TypeScript** - Tipado estatico
- **Tailwind CSS v4** - Estilos
- **shadcn/ui** - Componentes de UI
- **Recharts** - Graficos

### Backend y Base de Datos
- **Supabase** (FREE TIER)
  - Base de datos PostgreSQL
  - Autenticacion
  - Row Level Security (RLS)

### APIs Gratuitas
- **Web Speech API** - Reconocimiento de voz (nativo del navegador)
- **Pollinations.ai** - Generacion de imagenes con IA (100% gratis, sin API key)
- **MediaRecorder API** - Creacion de video (nativo del navegador)

### Librerias
- **SWR** - Data fetching y cache
- **xlsx** - Manejo de archivos Excel
- **papaparse** - Procesamiento de CSV

---

## Instrucciones de Instalacion Local

### Prerrequisitos
- Node.js 18+ instalado
- pnpm (recomendado) o npm
- Cuenta en Supabase (gratuita)

### Paso 1: Clonar el Proyecto

```bash
git clone <url-del-repositorio>
cd finanzas-ia
```

### Paso 2: Instalar Dependencias

```bash
pnpm install
# o
npm install
```

### Paso 3: Configurar Supabase

1. Crea una cuenta gratuita en https://supabase.com
2. Crea un nuevo proyecto
3. Ve a Settings > API y copia:
   - Project URL
   - anon public key

4. Crea un archivo `.env.local` en la raiz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
```

### Paso 4: Crear las Tablas en Supabase

Ve a SQL Editor en Supabase y ejecuta el siguiente script (tambien disponible en `/scripts/001_create_tables.sql`):

```sql
-- Crear tabla de perfiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  currency TEXT DEFAULT 'MXN',
  monthly_budget DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear tabla de categorias
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  icon TEXT DEFAULT 'tag',
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear tabla de transacciones
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(12,2) NOT NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear tabla para imagenes IA
CREATE TABLE IF NOT EXISTS public.ai_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  prompt TEXT,
  lifestyle_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_images ENABLE ROW LEVEL SECURITY;

-- Politicas RLS (ver script completo en /scripts/001_create_tables.sql)
```

### Paso 5: Ejecutar en Desarrollo

```bash
pnpm dev
# o
npm run dev
```

La aplicacion estara disponible en http://localhost:3000

---

## Instrucciones de Despliegue Web

### Opcion 1: Vercel (Recomendado)

1. Sube tu codigo a GitHub
2. Ve a https://vercel.com
3. Importa tu repositorio
4. Configura las variables de entorno:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Haz clic en Deploy

La URL publica estara disponible inmediatamente.

### Opcion 2: Netlify

1. Sube tu codigo a GitHub
2. Ve a https://netlify.com
3. New site from Git
4. Selecciona tu repositorio
5. Build command: `pnpm build`
6. Publish directory: `.next`
7. Configura las variables de entorno
8. Deploy

---

## Uso en Movil (PWA)

### En Android (Chrome)

1. Abre la URL de la aplicacion en Chrome
2. Aparecera un banner "Agregar a pantalla de inicio"
3. O ve al menu (3 puntos) > "Instalar aplicacion"
4. La app se instalara como aplicacion nativa

### En iOS (Safari)

1. Abre la URL de la aplicacion en Safari
2. Toca el boton de compartir (cuadrado con flecha)
3. Selecciona "Agregar a pantalla de inicio"
4. Dale un nombre y confirma
5. La app aparecera en tu pantalla de inicio

### Caracteristicas PWA

- Funciona offline (cache de archivos estaticos)
- Instalable como app nativa
- Pantalla completa sin barra de navegador
- Icono personalizado
- Splash screen

---

## Datos de Prueba

Para probar la aplicacion rapidamente:

1. Registrate con un email valido
2. Confirma tu email (revisa spam)
3. Inicia sesion
4. Las categorias se crean automaticamente
5. Prueba agregar transacciones:
   - "Salario - $15,000 - Ingreso"
   - "Super - $1,500 - Alimentacion"
   - "Uber - $200 - Transporte"
   - "Netflix - $199 - Entretenimiento"

6. Prueba la entrada por voz:
   - "Gaste 150 pesos en comida"
   - "Recibi 5000 pesos de freelance"

7. Prueba el generador de imagen IA

---

## Estructura del Proyecto

```
finanzas-ia/
├── app/
│   ├── auth/
│   │   ├── callback/route.ts      # Callback de autenticacion
│   │   ├── error/page.tsx         # Pagina de error
│   │   ├── login/page.tsx         # Inicio de sesion
│   │   └── sign-up/page.tsx       # Registro
│   ├── dashboard/
│   │   ├── analytics/page.tsx     # Graficos y analisis
│   │   ├── ai-advisor/page.tsx    # Asesor IA
│   │   ├── import-export/page.tsx # Importar/Exportar
│   │   ├── lifestyle/page.tsx     # Generador de imagen IA
│   │   ├── settings/page.tsx      # Configuracion
│   │   ├── transactions/page.tsx  # Transacciones
│   │   ├── voice/page.tsx         # Entrada por voz
│   │   ├── layout.tsx             # Layout del dashboard
│   │   └── page.tsx               # Inicio del dashboard
│   ├── layout.tsx                 # Layout principal
│   ├── page.tsx                   # Landing page
│   └── globals.css                # Estilos globales
├── components/
│   ├── dashboard/
│   │   ├── ai-advisor.tsx         # Componente asesor IA
│   │   ├── finance-charts.tsx     # Graficos
│   │   ├── import-export.tsx      # Importar/Exportar
│   │   ├── lifestyle-generator.tsx # Generador imagen IA
│   │   ├── sidebar.tsx            # Sidebar navegacion
│   │   ├── stats-cards.tsx        # Tarjetas de estadisticas
│   │   ├── transaction-form.tsx   # Formulario transaccion
│   │   ├── transaction-list.tsx   # Lista de transacciones
│   │   └── voice-input.tsx        # Entrada por voz
│   └── ui/                        # Componentes shadcn/ui
├── hooks/
│   ├── use-auth.ts                # Hook de autenticacion
│   ├── use-profile.ts             # Hook de perfil
│   └── use-transactions.ts        # Hook de transacciones
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # Cliente Supabase (browser)
│   │   ├── middleware.ts          # Middleware Supabase
│   │   └── server.ts              # Cliente Supabase (server)
│   ├── types.ts                   # Tipos TypeScript
│   └── utils.ts                   # Utilidades
├── public/
│   ├── icons/                     # Iconos PWA
│   └── manifest.json              # Manifest PWA
├── scripts/
│   └── 001_create_tables.sql      # Script de base de datos
├── middleware.ts                  # Middleware Next.js
└── INSTRUCCIONES.md               # Este archivo
```

---

## APIs Gratuitas Utilizadas

| Servicio | Uso | Limite |
|----------|-----|--------|
| Supabase | Base de datos y Auth | 500MB DB, 50k MAU |
| Web Speech API | Reconocimiento de voz | Ilimitado (navegador) |
| Pollinations.ai | Generacion de imagenes | Ilimitado (gratis) |
| MediaRecorder API | Creacion de video | Ilimitado (navegador) |

---

## Soporte de Navegadores

- Chrome 90+ (recomendado)
- Firefox 90+
- Safari 15+
- Edge 90+

**Nota:** La entrada por voz funciona mejor en Chrome y Edge.

---

## Licencia

Proyecto academico - Libre uso para fines educativos.

---

## Contacto

Para dudas o soporte, consulta la documentacion o abre un issue en el repositorio.
