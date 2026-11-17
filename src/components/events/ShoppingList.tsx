"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, ShoppingBasket } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { ShoppingListItemExpanded } from "@/lib/pocketbase/types";
import { UNIT_LABELS, UNIT_LABELS_EN } from "@/lib/constants/units";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SupermarketLinks } from "./SupermarketLinks";
import { t, DEFAULT_LOCALE, type Locale } from "@/lib/i18n/translations";

function itemLabel(item: ShoppingListItemExpanded, locale: Locale): string {
  return item.expand?.ingredient?.name || item.custom_label || t(locale, "recipe.ingredientFallback");
}

function itemQuantity(item: ShoppingListItemExpanded, locale: Locale): string | null {
  if (!item.quantity) return null;
  const labels = locale === "en" ? UNIT_LABELS_EN : UNIT_LABELS;
  const unit = item.unit ? labels[item.unit] : "";
  return `${item.quantity}${unit ? ` ${unit}` : ""}`;
}

export function ShoppingList({
  eventId,
  items,
  canEdit,
  locale = DEFAULT_LOCALE,
}: {
  eventId: string;
  items: ShoppingListItemExpanded[];
  canEdit: boolean;
  locale?: Locale;
}) {
  const { user, pb } = useAuth();
  const [list, setList] = useState(items);
  const [newLabel, setNewLabel] = useState("");
  const [adding, setAdding] = useState(false);

  async function toggleChecked(item: ShoppingListItemExpanded) {
    setList((prev) => prev.map((i) => (i.id === item.id ? { ...i, checked: !i.checked } : i)));
    try {
      await pb.collection("shopping_list_items").update(item.id, { checked: !item.checked });
    } catch {
      setList((prev) => prev.map((i) => (i.id === item.id ? { ...i, checked: item.checked } : i)));
      toast.error(t(locale, "common.networkError"));
    }
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newLabel.trim()) return;
    setAdding(true);
    try {
      const created = await pb.collection("shopping_list_items").create<ShoppingListItemExpanded>({
        event: eventId,
        custom_label: newLabel.trim(),
        added_by: user?.id,
      });
      setList((prev) => [...prev, created]);
      setNewLabel("");
    } catch {
      toast.error(t(locale, "common.networkError"));
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border p-4">
      <h3 className="flex items-center gap-2 text-title-3 font-heading font-bold">
        <ShoppingBasket className="h-5 w-5" />
        {t(locale, "shoppingList.title")}
      </h3>
      {list.length === 0 ? (
        <p className="text-body text-muted-foreground">{t(locale, "shoppingList.empty")}</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {list.map((item) => (
            <li key={item.id}>
              <label className="flex min-h-11 items-center gap-3 rounded-lg px-1 py-1">
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => toggleChecked(item)}
                  className="h-5 w-5 accent-primary"
                />
                <span className={`flex-1 ${item.checked ? "text-muted-foreground line-through" : ""}`}>
                  {itemLabel(item, locale)}
                </span>
                {itemQuantity(item, locale) && (
                  <span className="whitespace-nowrap text-caption text-muted-foreground">
                    {itemQuantity(item, locale)}
                  </span>
                )}
              </label>
            </li>
          ))}
        </ul>
      )}
      {list.length > 0 && <SupermarketLinks items={list} locale={locale} />}
      {canEdit && (
        <form onSubmit={addItem} className="flex gap-2">
          <Input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder={t(locale, "shoppingList.addPlaceholder")}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={adding} aria-label={t(locale, "shoppingList.addAria")}>
            <Plus className="h-4 w-4" />
          </Button>
        </form>
      )}
    </div>
  );
}
