-- Simpletide orders table (matches Edge Functions for order & shipping emails)
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  payment_status text NOT NULL DEFAULT 'pending_payment',
  payment_method text NOT NULL DEFAULT 'card',
  payment_id text,
  gateway_transaction_id text,
  subtotal numeric(10, 2) NOT NULL DEFAULT 0,
  shipping_cost numeric(10, 2) NOT NULL DEFAULT 0,
  affiliate_code text,
  affiliate_discount numeric(10, 2) NOT NULL DEFAULT 0,
  credits_discount numeric(10, 2) NOT NULL DEFAULT 0,
  processing_fee numeric(10, 2) NOT NULL DEFAULT 0,
  refunded_amount numeric(10, 2) NOT NULL DEFAULT 0,
  total numeric(10, 2) NOT NULL DEFAULT 0,
  shipping_method text DEFAULT 'priority',
  carrier text,
  tracking_number text,
  shipping_address jsonb,
  line_items_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_user_id_idx ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS orders_email_idx ON public.orders (lower(email));
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS orders_status_idx ON public.orders (status);
CREATE INDEX IF NOT EXISTS orders_payment_status_idx ON public.orders (payment_status);

CREATE OR REPLACE FUNCTION public.set_orders_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_set_updated_at ON public.orders;
CREATE TRIGGER orders_set_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_orders_updated_at();

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Customers can read only their own orders; writes happen server-side via service_role.
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
