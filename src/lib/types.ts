export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_pinned: boolean;
  pin_order: number;
  created_at: string;
  item_count: number;
};

export type Item = {
  id: string;
  category_id: string;
  title: string;
  body: string | null;
  url: string | null;
  author: string | null;
  is_pinned: boolean;
  pin_order: number;
  created_at: string;
};

export type ActionState = { ok: boolean; error?: string; message?: string } | null;
