-- Create order_notes table for internal staff communication
CREATE TABLE IF NOT EXISTS public.order_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_order_notes_order_id ON public.order_notes(order_id);
CREATE INDEX IF NOT EXISTS idx_order_notes_created_at ON public.order_notes(created_at DESC);

-- Enable RLS
ALTER TABLE public.order_notes ENABLE ROW LEVEL SECURITY;

-- Policy: Admin and kitchen staff can view all notes
CREATE POLICY "Admin and kitchen can view notes"
ON public.order_notes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'kitchen')
  )
);

-- Policy: Admin and kitchen staff can create notes
CREATE POLICY "Admin and kitchen can create notes"
ON public.order_notes FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'kitchen')
  )
);

-- Policy: Users can update their own notes
CREATE POLICY "Users can update own notes"
ON public.order_notes FOR UPDATE
USING (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'kitchen')
  )
)
WITH CHECK (
  auth.uid() = user_id
);

-- Policy: Users can delete their own notes
CREATE POLICY "Users can delete own notes"
ON public.order_notes FOR DELETE
USING (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'kitchen')
  )
);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_notes_updated_at
  BEFORE UPDATE ON public.order_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
