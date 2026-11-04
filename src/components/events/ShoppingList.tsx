"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, ShoppingBasket } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { ShoppingListItem as ShoppingListItemType } from "@/lib/pocketbase/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ShoppingList({
  eventId,
  items,
  canEdit,
}: {
  eventId: string;
  items: ShoppingListItemType[];
  canEdit: boolean;
}) {
  const { user, pb } = useAuth();
  const [list, setList] = useState(items);
  const [newLabel, setNewLabel] = useState("");
  const [adding, setAdding] = useState(false);

  async function toggleChecked(item: ShoppingListItemType) {
    setList((prev) => prev.map((i) => (i.id === item.id ? { ...i, checked: !i.checked } : i)));
    try {
      await pb.collection("shopping_list_items").update(item.id, { checked: !item.checked });
    } catch {
      setList((prev) => prev.map((i) => (i.id === item.id ? { ...i, checked: item.checked } : i)));
      toast.error("Geen verbinding. Probeer het nog eens.");
    }
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newLabel.trim()) return;
    setAdding(true);
    try {
      const created = await pb.collection("shopping_list_items").create<ShoppingListItemType>({
        event: eventId,
        custom_label: newLabel.trim(),
        added_by: user?.id,
      });
      setList((prev) => [...prev, created]);
      setNewLabel("");
    } catch {
      toast.error("Geen verbinding. Probeer het nog eens.");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border p-4">
      <h3 className="flex items-center gap-2 text-title-3 font-heading font-bold">
        <ShoppingBasket className="h-5 w-5" />
        Boodschappenlijst
      </h3>
      {list.length === 0 ? (
        <p className="text-body text-muted-foreground">Nog niets op de lijst.</p>
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
                <span className={item.checked ? "text-muted-foreground line-through" : ""}>
                  {item.custom_label || "Ingrediënt"}
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
      {canEdit && (
        <form onSubmit={addItem} className="flex gap-2">
          <Input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Item toevoegen"
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={adding} aria-label="Toevoegen">
            <Plus className="h-4 w-4" />
          </Button>
        </form>
      )}
    </div>
  );
}
