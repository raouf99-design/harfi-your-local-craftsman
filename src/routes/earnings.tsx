import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { FloatingContacts } from "@/components/FloatingContacts";
import { getSession } from "@/lib/api";

export const Route = createFileRoute("/earnings")({
  component: Earnings,
});

const TXNS = [
  { id: "t1", title: "إصلاح تسرب — أمين قاسمي", date: "2025-05-22", amount: 3500 },
  { id: "t2", title: "تركيب حنفية — سارة بلال", date: "2025-05-19", amount: 2000 },
  { id: "t3", title: "صيانة كهربائية — كريم زيدان", date: "2025-05-12", amount: 4200 },
  { id: "t4", title: "تركيب باب — يوسف م.", date: "2025-05-05", amount: 5500 },
];

function Earnings() {
  const total = TXNS.reduce((s, t) => s + t.amount, 0);
  const month = total;
  const week = TXNS.slice(0, 2).reduce((s, t) => s + t.amount, 0);

  return (
    <main className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-md px-5 pt-10">
        <Link to="/dashboard" className="text-sm text-muted-foreground">→ رجوع</Link>
        <h1 className="mt-3 text-2xl font-black">الأرباح</h1>

        <div className="mt-5 card-gold rounded-3xl p-6 bg-gradient-to-br from-[color:var(--gold)]/20 to-transparent">
          <p className="text-xs text-muted-foreground">الإجمالي</p>
          <p className="mt-1 text-4xl font-black gold-text">{total.toLocaleString("ar-DZ")} دج</p>
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">هذا الأسبوع</p>
              <p className="font-bold mt-1">{week.toLocaleString("ar-DZ")} دج</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">هذا الشهر</p>
              <p className="font-bold mt-1">{month.toLocaleString("ar-DZ")} دج</p>
            </div>
          </div>
        </div>

        <h2 className="mt-6 text-sm font-bold">آخر المعاملات</h2>
        <ul className="mt-3 space-y-2">
          {TXNS.map((t) => (
            <li key={t.id} className="card-gold rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="font-bold text-sm">{t.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t.date}</p>
              </div>
              <p className="text-sm font-black text-emerald-400">+{t.amount.toLocaleString("ar-DZ")}</p>
            </li>
          ))}
        </ul>
      </div>
      <BottomNav />
      <FloatingContacts />
    </main>
  );
}
