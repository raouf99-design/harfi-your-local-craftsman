CREATE TABLE public.service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  craftsman_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  category text NOT NULL,
  address text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','in_progress','completed','cancelled')),
  rating int CHECK (rating BETWEEN 1 AND 5),
  price int,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_service_requests_customer ON public.service_requests(customer_id);
CREATE INDEX idx_service_requests_craftsman ON public.service_requests(craftsman_id);
CREATE INDEX idx_service_requests_status ON public.service_requests(status);

ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can insert their own requests"
ON public.service_requests FOR INSERT TO authenticated
WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can view their own requests"
ON public.service_requests FOR SELECT TO authenticated
USING (auth.uid() = customer_id);

CREATE POLICY "Customers can update their own requests"
ON public.service_requests FOR UPDATE TO authenticated
USING (auth.uid() = customer_id)
WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Craftsmen can view pending or assigned requests"
ON public.service_requests FOR SELECT TO authenticated
USING (
  (status = 'pending' AND public.has_role(auth.uid(), 'craftsman'))
  OR craftsman_id = auth.uid()
);

CREATE POLICY "Craftsmen can update pending or assigned requests"
ON public.service_requests FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'craftsman')
  AND (status = 'pending' OR craftsman_id = auth.uid())
)
WITH CHECK (
  public.has_role(auth.uid(), 'craftsman')
  AND (craftsman_id = auth.uid() OR craftsman_id IS NULL)
);