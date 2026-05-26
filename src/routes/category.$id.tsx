import { createFileRoute, Link } from "@tanstack/react-router";
import { CATEGORIES } from "@/lib/categories";
import { BottomNav } from "@/components/BottomNav";
import { FloatingContacts } from "@/components/FloatingContacts";
import { MapPin, Star } from "lucide-react";

export const Route = createFileRoute("/category/$id")({
  component: CategoryPage,
});

const MOCK = [
  { id: "1", name: "محمد بن علي", rating: 4.9, jobs: 128, wilaya: "الجزائر", commune: "باب الزوار", price: "من 2000 دج" },
  { id: "2", name: "كريم زيدان", rating: 4.8, jobs: 92, wilaya: "وهران", commune: "السانيا", price: "من 1500 دج" },
  { id: "3", name: "ياسين حداد", rating: 4.7, jobs: 64, wilaya: "قسنطينة", commune: "الخروب", price: "من 1800 دج" },
  { id: "4", name: "عبد القادر", rating: 4.6, jobs: 45, wilaya: "البليدة", commune: "بوفاريك", price: "من 1700 دج" },
];

function CategoryPage() {
  const { id } = Route.useParams();
  const cat = CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0];

  return (
    <main className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-md px-5 pt-10">
        <Link to="/home" className="text-sm text-muted-foreground">→ رجوع</Link>

        <div className={`mt-4 card-gold rounded-3xl p-5 bg-gradient-to-br ${cat.color}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[color:var(--gold)] tracking-widest font-bold">فئة</p>
              <h1 className="mt-1 text-2xl font-black">{cat.name}</h1>
              <p className="mt-1 text-xs text-muted-foreground">{MOCK.length} حرفي متاح في منطقتك</p>
            </div>
            <span className="text-5xl">{cat.icon}</span>
          </div>
        </div>

        <h2 className="mt-6 text-sm font-bold text-muted-foreground">الحرفيون المتاحون</h2>
        <ul className="mt-3 space-y-3">
          {MOCK.map((c) => (
            <li key={c.id}>
              <Link
                to="/craftsman/$id"
                params={{ id: c.id }}
                search={{ cat: cat.id, name: c.name }}
                className="card-gold rounded-2xl p-4 flex items-center gap-3 active:scale-[.98] transition-transform"
              >
                <div className="h-14 w-14 rounded-2xl gold-gradient text-black font-black flex items-center justify-center text-lg">
                  {c.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-bold">{c.name}</p>
                    <span className="text-xs flex items-center gap-1 text-[color:var(--gold)]">
                      <Star className="h-3 w-3 fill-current" /> {c.rating}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3" /> {c.wilaya} · {c.commune}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{c.jobs} عمل منجز</span>
                    <span className="text-[color:var(--gold)] font-bold">{c.price}</span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <BottomNav />
      <FloatingContacts />
    </main>
  );
}
