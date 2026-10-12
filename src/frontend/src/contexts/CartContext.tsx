import type { CartItem as BackendCartItem } from "@/backend";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

export type CartItem =
  | {
      kind: "track";
      trackId: bigint;
      licenseTierId: bigint;
      title: string;
      artist: string;
      coverUrl: string;
      licenseName: string;
      priceCents: number;
      quantity: number;
    }
  | {
      kind: "customMusic";
      title: string;
      priceCents: number;
      quantity: number;
    };

export interface CouponState {
  code: string;
  discountType: "fixed" | "percentage";
  amount: number;
}

const STORAGE_KEY = "ritmo_raiz_cart";
const COUPON_KEY = "ritmo_raiz_coupon";

/** Stable identity for a cart line, used for remove/quantity updates. */
export function itemKey(item: CartItem): string {
  return item.kind === "track"
    ? `track-${item.trackId}-${item.licenseTierId}`
    : "custom-music";
}

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    return parsed.map((item) => {
      if (item.kind === "track") {
        return {
          ...item,
          trackId: BigInt(item.trackId),
          licenseTierId: BigInt(item.licenseTierId),
        };
      }
      return item;
    });
  } catch {
    return [];
  }
}

function loadCoupon(): CouponState | null {
  try {
    const raw = localStorage.getItem(COUPON_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CouponState;
  } catch {
    return null;
  }
}

interface CartContextValue {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: CartItem) => void;
  removeItem: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  clearCart: () => void;
  subtotalCents: number;
  count: number;
  coupon: CouponState | null;
  applyCoupon: (coupon: CouponState) => void;
  removeCoupon: () => void;
  discountCents: number;
  totalCents: number;
  toBackendItems: () => BackendCartItem[];
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => loadCart());
  const [isOpen, setIsOpen] = useState(false);
  const [coupon, setCoupon] = useState<CouponState | null>(() => loadCoupon());

  // Persist cart and coupon across refresh and browser restart.
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(items, (_key, value) =>
        typeof value === "bigint" ? value.toString() : value,
      ),
    );
  }, [items]);

  useEffect(() => {
    if (coupon) localStorage.setItem(COUPON_KEY, JSON.stringify(coupon));
    else localStorage.removeItem(COUPON_KEY);
  }, [coupon]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => {
      const key = itemKey(item);
      const existing = prev.find((i) => itemKey(i) === key);
      if (existing) {
        return prev.map((i) =>
          itemKey(i) === key ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((key: string) => {
    setItems((prev) => prev.filter((i) => itemKey(i) !== key));
  }, []);

  const updateQuantity = useCallback((key: string, quantity: number) => {
    setItems((prev) =>
      prev.map((i) =>
        itemKey(i) === key ? { ...i, quantity: Math.max(1, quantity) } : i,
      ),
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setCoupon(null);
  }, []);

  const subtotalCents = useMemo(
    () => items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0),
    [items],
  );

  const count = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items],
  );

  const discountCents = useMemo(() => {
    if (!coupon) return 0;
    if (coupon.discountType === "percentage") {
      return Math.round((subtotalCents * coupon.amount) / 100);
    }
    return Math.min(coupon.amount, subtotalCents);
  }, [coupon, subtotalCents]);

  const totalCents = Math.max(0, subtotalCents - discountCents);

  const applyCoupon = useCallback((c: CouponState) => setCoupon(c), []);
  const removeCoupon = useCallback(() => setCoupon(null), []);

  const toBackendItems = useCallback((): BackendCartItem[] => {
    return items.map((item) =>
      item.kind === "track"
        ? {
            __kind__: "track",
            track: { trackId: item.trackId, licenseTierId: item.licenseTierId },
          }
        : { __kind__: "customMusic", customMusic: {} },
    );
  }, [items]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      isOpen,
      openCart,
      closeCart,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      subtotalCents,
      count,
      coupon,
      applyCoupon,
      removeCoupon,
      discountCents,
      totalCents,
      toBackendItems,
    }),
    [
      items,
      isOpen,
      openCart,
      closeCart,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      subtotalCents,
      count,
      coupon,
      applyCoupon,
      removeCoupon,
      discountCents,
      totalCents,
      toBackendItems,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCartContext(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCartContext must be used within CartProvider");
  return ctx;
}
