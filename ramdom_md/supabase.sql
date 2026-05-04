-- Camcookie Connect 26 Schema

-- Users table (extends Supabase auth)
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  profile_image_base64 TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read own profile"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Any authenticated user can read all usernames"
  ON public.users
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Chat messages table
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Enable RLS on chat_messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all messages"
  ON public.chat_messages
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert own messages"
  ON public.chat_messages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Drawings table
CREATE TABLE public.drawings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  drawing_data TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Enable RLS on drawings
ALTER TABLE public.drawings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all drawings"
  ON public.drawings
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert own drawings"
  ON public.drawings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Stories table
CREATE TABLE public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Enable RLS on stories
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all stories"
  ON public.stories
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert own stories"
  ON public.stories
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stories"
  ON public.stories
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create function to check if username exists
CREATE OR REPLACE FUNCTION public.username_exists(p_username VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(SELECT 1 FROM public.users WHERE username = p_username);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update username
CREATE OR REPLACE FUNCTION public.update_username(p_username VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  IF public.username_exists(p_username) THEN
    RETURN FALSE;
  END IF;
  UPDATE public.users SET username = p_username WHERE id = auth.uid();
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indices for performance
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX idx_drawings_user_id ON public.drawings(user_id);
CREATE INDEX idx_stories_user_id ON public.stories(user_id);