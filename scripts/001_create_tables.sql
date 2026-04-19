-- Crear tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  currency TEXT DEFAULT 'MXN',
  monthly_budget DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear tabla de categorías
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

-- Crear tabla para imágenes generadas por IA
CREATE TABLE IF NOT EXISTS public.ai_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  prompt TEXT,
  lifestyle_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_images ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- Políticas RLS para categories
CREATE POLICY "categories_select_own" ON public.categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "categories_insert_own" ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "categories_update_own" ON public.categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "categories_delete_own" ON public.categories FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para transactions
CREATE POLICY "transactions_select_own" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "transactions_insert_own" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "transactions_update_own" ON public.transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "transactions_delete_own" ON public.transactions FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para ai_images
CREATE POLICY "ai_images_select_own" ON public.ai_images FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ai_images_insert_own" ON public.ai_images FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ai_images_delete_own" ON public.ai_images FOR DELETE USING (auth.uid() = user_id);

-- Trigger para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NULL)
  )
  ON CONFLICT (id) DO NOTHING;

  -- Insertar categorías predeterminadas para el nuevo usuario
  INSERT INTO public.categories (user_id, name, type, icon, color) VALUES
    (NEW.id, 'Salario', 'income', 'briefcase', '#22c55e'),
    (NEW.id, 'Freelance', 'income', 'laptop', '#10b981'),
    (NEW.id, 'Inversiones', 'income', 'trending-up', '#14b8a6'),
    (NEW.id, 'Otros Ingresos', 'income', 'plus-circle', '#06b6d4'),
    (NEW.id, 'Alimentación', 'expense', 'utensils', '#ef4444'),
    (NEW.id, 'Transporte', 'expense', 'car', '#f97316'),
    (NEW.id, 'Entretenimiento', 'expense', 'gamepad-2', '#eab308'),
    (NEW.id, 'Servicios', 'expense', 'zap', '#8b5cf6'),
    (NEW.id, 'Salud', 'expense', 'heart-pulse', '#ec4899'),
    (NEW.id, 'Educación', 'expense', 'graduation-cap', '#3b82f6'),
    (NEW.id, 'Compras', 'expense', 'shopping-bag', '#f43f5e'),
    (NEW.id, 'Otros Gastos', 'expense', 'minus-circle', '#6b7280');

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
