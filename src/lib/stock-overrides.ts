import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase-lazy";

type StockMap = Record<string, boolean>;

let cachedOverrides: StockMap | null = null;
let inflight: Promise<StockMap> | null = null;
const listeners = new Set<(map: StockMap) => void>();

function notify(map: StockMap) {
  for (const fn of listeners) fn(map);
}

async function loadStockOverrides(): Promise<StockMap> {
  if (cachedOverrides) return cachedOverrides;
  inflight ??= (async () => {
    try {
      const supabase = await getSupabase();
      const sb = supabase as unknown as {
        from: (t: string) => {
          select: (q: string) => Promise<{ data: Array<{ product_key: string; out_of_stock: boolean }> | null }>;
        };
      };
      const { data } = await sb.from("product_stock_overrides").select("product_key, out_of_stock");
      const map: StockMap = {};
      for (const row of data ?? []) {
        map[row.product_key] = Boolean(row.out_of_stock);
      }
      cachedOverrides = map;
      notify(map);
      return map;
    } catch {
      cachedOverrides = {};
      return {};
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

/** Update the in-memory cache right away after an admin toggles a product. */
export function setLocalStockOverride(productKey: string, outOfStock: boolean) {
  cachedOverrides = { ...(cachedOverrides ?? {}), [productKey]: outOfStock };
  notify(cachedOverrides);
}

export function useStockOverrides(): StockMap {
  const [map, setMap] = useState<StockMap>(() => cachedOverrides ?? {});

  useEffect(() => {
    listeners.add(setMap);
    void loadStockOverrides().then(setMap);
    return () => {
      listeners.delete(setMap);
    };
  }, []);

  return map;
}

export function useIsOutOfStock(productName: string, staticOutOfStock?: boolean): boolean {
  const overrides = useStockOverrides();
  if (productName in overrides) return overrides[productName];
  return Boolean(staticOutOfStock);
}
