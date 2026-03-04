'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser, useFirebase } from '@/firebase';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import {
    SidebarProvider,
    Sidebar as AppSidebar,
    SidebarInset
} from '@/components/ui/sidebar';
import { Sidebar } from '@/components/dashboard/sidebar';
import { AppHeader } from '@/components/layout/app-header';
import {
    ChefHat,
    Clock,
    Flame,
    ArrowLeft,
    UtensilsCrossed,
    Sparkles,
    Loader2,
    Calendar,
    Tag,
    History,
    ListChecks,
    CookingPot,
    BookOpenCheck,
    ZoomIn,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import type { Meal } from '@/lib/types';
import { fr } from 'date-fns/locale';
import { ImageZoomLightbox } from '@/components/shared/image-zoom-lightbox';
import { format } from 'date-fns';

type ParsedBlock =
    | { type: 'h1' | 'h2' | 'h3'; text: string }
    | { type: 'paragraph'; text: string }
    | { type: 'bullet'; text: string }
    | { type: 'numbered'; num: string; text: string }
    | { type: 'divider' }
    | { type: 'empty' };

function parseMarkdown(raw: string): ParsedBlock[] {
    const lines = raw.split('\n');
    const blocks: ParsedBlock[] = [];
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) { blocks.push({ type: 'empty' }); continue; }
        if (trimmed === '---' || trimmed === '***') { blocks.push({ type: 'divider' }); continue; }
        const h1 = trimmed.match(/^#\s+(.*)/); if (h1) { blocks.push({ type: 'h1', text: h1[1] }); continue; }
        const h2 = trimmed.match(/^##\s+(.*)/); if (h2) { blocks.push({ type: 'h2', text: h2[1] }); continue; }
        const h3 = trimmed.match(/^###\s+(.*)/); if (h3) { blocks.push({ type: 'h3', text: h3[1] }); continue; }
        const bullet = trimmed.match(/^[-*]\s+(.*)/); if (bullet) { blocks.push({ type: 'bullet', text: bullet[1] }); continue; }
        const numbered = trimmed.match(/^(\d+)\.\s+(.*)/); if (numbered) { blocks.push({ type: 'numbered', num: numbered[1], text: numbered[2] }); continue; }
        blocks.push({ type: 'paragraph', text: trimmed });
    }
    return blocks;
}

function renderInline(text: string): React.ReactNode {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((p, i) => {
        if (p.startsWith('**') && p.endsWith('**')) return <strong key={i} className="text-amber-400 font-black">{p.slice(2, -2)}</strong>;
        return <span key={i}>{p}</span>;
    });
}

function RecipeContent({ markdown }: { markdown: string }) {
    const blocks = parseMarkdown(markdown);
    return (
        <div className="space-y-1">
            {blocks.map((block, i) => {
                switch (block.type) {
                    case 'h1': return <h2 key={i} className="text-2xl md:text-3xl font-black text-foreground uppercase tracking-tighter italic pt-10 pb-2 first:pt-0">{block.text}</h2>;
                    case 'h2': return <div key={i} className="flex items-center gap-3 pt-8 pb-3 first:pt-0"><div className="h-px flex-1 bg-border" /><h3 className="text-[11px] font-black text-amber-500 uppercase tracking-[0.3em] whitespace-nowrap">{block.text}</h3><div className="h-px flex-1 bg-border" /></div>;
                    case 'h3': return <h4 key={i} className="text-base font-black text-foreground/90 uppercase tracking-wider pt-6 pb-1">{block.text}</h4>;
                    case 'bullet': return <div key={i} className="flex items-start gap-3 py-1 pl-2"><span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" /><span className="text-foreground/75 text-[15px] leading-relaxed">{renderInline(block.text)}</span></div>;
                    case 'numbered': return <div key={i} className="flex items-start gap-4 py-2 pl-2"><span className="shrink-0 mt-0.5 h-7 w-7 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-black flex items-center justify-center">{block.num}</span><span className="text-foreground/80 text-[15px] leading-relaxed pt-1">{renderInline(block.text)}</span></div>;
                    case 'paragraph': return <p key={i} className="text-foreground/65 text-[15px] leading-[1.8] py-1">{renderInline(block.text)}</p>;
                    case 'divider': return <div key={i} className="h-px bg-border my-6" />;
                    case 'empty': return <div key={i} className="h-2" />;
                    default: return null;
                }
            })}
        </div>
    );
}

export default function RecipeDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user } = useUser();
    const { firestore } = useFirebase();
    const [recipe, setRecipe] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [allMeals, setAllMeals] = useState<Meal[]>([]);
    const [goals, setGoals] = useState('Perdre du poids, manger plus sainement.');
    const [zoomImage, setZoomImage] = useState<string | null>(null);

    useEffect(() => {
        if (!user || !id) return;
        const recipeId = Array.isArray(id) ? id[0] : id;
        const bookRef = doc(firestore, 'atelierBooks', recipeId);
        const cookingRef = doc(firestore, `users/${user.uid}/cooking`, recipeId);
        const fetchRecipe = async () => {
            try {
                const bookSnap = await getDoc(bookRef);
                if (bookSnap.exists()) { setRecipe({ id: bookSnap.id, ...bookSnap.data(), source: 'chef' }); }
                else {
                    const cookingSnap = await getDoc(cookingRef);
                    if (cookingSnap.exists()) setRecipe({ id: cookingSnap.id, ...cookingSnap.data(), source: 'grimoire' });
                }
            } catch (error) { console.error('Error fetching recipe:', error); }
            finally { setIsLoading(false); }
        };
        fetchRecipe();
        const userDocRef = doc(firestore, 'users', user.uid);
        const unsubscribe = onSnapshot(userDocRef, (snap) => { if (snap.exists()) setGoals(snap.data().goals || 'Objectif non défini'); });
        return () => unsubscribe();
    }, [user, id, firestore]);

    const sidebarProps = { goals, setGoals: (g: string) => setGoals(g), meals: allMeals };

    if (isLoading) return <div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="h-12 w-12 animate-spin text-amber-500" /></div>;

    if (!recipe) return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-foreground p-6 text-center">
            <div className="h-20 w-20 bg-amber-500/10 rounded-full flex items-center justify-center mb-6"><History className="h-10 w-10 text-amber-500/50" /></div>
            <h1 className="text-2xl font-black uppercase tracking-widest mb-2">Recette introuvable</h1>
            <Button onClick={() => router.back()} variant="outline" className="border-white/10 hover:bg-white/5 text-xs font-black uppercase tracking-widest px-8 mt-4">Retour à l'atelier</Button>
        </div>
    );

    return (
        <SidebarProvider style={{ '--sidebar-width': '20rem' } as React.CSSProperties}>
            <AppSidebar collapsible="icon" className="peer hidden md:block dark:[&_[data-sidebar=sidebar]]:bg-[#0d0d0d]" variant="sidebar">
                <Sidebar {...sidebarProps} />
            </AppSidebar>
            <SidebarInset className="dark:bg-[#0a0a0a] bg-background min-h-screen">
                <AppHeader title={recipe.name} icon={<ChefHat className="h-4 w-4" />} user={user} sidebarProps={sidebarProps} className="border-b border-white/5 px-2 dark:bg-[#0d0d0d]/80 bg-background/80 backdrop-blur-md" />
                <div className="w-full">
                    <div className="relative w-full h-[45vh] md:h-[55vh] overflow-hidden">
                        <Image src={recipe.imageUrl || 'https://images.unsplash.com/photo-1547592110-803444465817?auto=format&fit=crop&q=80&w=1400'} alt={recipe.name} fill className="object-cover brightness-50 cursor-zoom-in hover:scale-110 transition-transform duration-700" priority sizes="100vw" onClick={() => setZoomImage(recipe.imageUrl)} />
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
                        <button onClick={() => router.back()} className="absolute top-6 left-6 z-20 flex items-center gap-2 text-white/60 hover:text-white transition-colors text-[11px] font-black uppercase tracking-widest group">
                            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />Atelier
                        </button>
                        <div className="absolute bottom-0 left-0 w-full p-6 md:px-12 md:pb-10 space-y-4">
                            <div className="flex flex-wrap gap-2">
                                <Badge className="bg-amber-500 text-black font-black text-[9px] uppercase tracking-[0.2em] px-3 py-1 rounded-full border-none">{recipe.source === 'chef' ? 'Atelier de Chef' : 'Mon Grimoire'}</Badge>
                                {recipe.category && <Badge variant="outline" className="border-white/20 text-white/70 text-[9px] uppercase tracking-widest px-3 py-1 rounded-full">{recipe.category}</Badge>}
                            </div>
                            <h1 className="text-3xl md:text-6xl font-black text-white uppercase italic leading-none tracking-tighter max-w-4xl">{recipe.name}</h1>
                        </div>
                    </div>
                    <div className="max-w-6xl mx-auto px-4 md:px-8 py-10">
                        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 lg:gap-12 items-start">
                            <div className="min-w-0 space-y-8">
                                {recipe.description && (
                                    <div className="relative rounded-2xl overflow-hidden border border-amber-500/15 bg-amber-500/5 p-6 md:p-8">
                                        <div className="flex items-center gap-2 text-amber-500/70 mb-4"><Sparkles className="h-3.5 w-3.5" /><span className="text-[10px] font-black uppercase tracking-[0.3em]">Note du chef</span></div>
                                        <blockquote className="text-foreground/80 text-base md:text-lg font-serif italic leading-relaxed border-l-2 border-amber-500/30 pl-5">{recipe.description}</blockquote>
                                    </div>
                                )}
                                {recipe.recipe ? (
                                    <div className="rounded-2xl border border-border bg-card p-6 md:p-10 space-y-6">
                                        <div className="flex items-center gap-3 pb-2 border-b border-border">
                                            <div className="h-9 w-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0"><BookOpenCheck className="h-4 w-4 text-amber-500" /></div>
                                            <div><p className="text-[10px] font-black text-amber-500/60 uppercase tracking-[0.3em]">Recette complète</p><h2 className="text-base font-black text-foreground/90 uppercase tracking-tight">{recipe.name}</h2></div>
                                        </div>
                                        <RecipeContent markdown={recipe.recipe} />
                                    </div>
                                ) : (
                                    <div className="rounded-2xl border border-border bg-card p-10 text-center space-y-3"><CookingPot className="h-10 w-10 text-foreground/20 mx-auto" /><p className="text-foreground/40 text-sm italic">Le secret de cette recette est jalousement gardé…</p></div>
                                )}
                            </div>
                            <div className="space-y-6 lg:sticky lg:top-6">
                                <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                                    <p className="text-[10px] font-black text-foreground/30 uppercase tracking-widest">En un coup d'œil</p>
                                    <div className="space-y-3">
                                        {recipe.cookingTime && <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-foreground/50 text-xs font-bold uppercase tracking-wider"><Clock className="h-3.5 w-3.5 text-amber-500" />Temps</div><span className="text-sm font-bold text-foreground">{recipe.cookingTime}</span></div>}
                                        {recipe.calories && <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-foreground/50 text-xs font-bold uppercase tracking-wider"><Flame className="h-3.5 w-3.5 text-amber-500" />Calories</div><span className="text-sm font-bold text-foreground">{recipe.calories} kcal</span></div>}
                                        {recipe.category && <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-foreground/50 text-xs font-bold uppercase tracking-wider"><UtensilsCrossed className="h-3.5 w-3.5 text-amber-500" />Catégorie</div><span className="text-sm font-bold text-foreground capitalize">{recipe.category}</span></div>}
                                    </div>
                                </div>
                                {recipe.galleryUrls && recipe.galleryUrls.length > 0 && (
                                    <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                                        <p className="text-[10px] font-black text-foreground/30 uppercase tracking-widest">Galerie</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {recipe.galleryUrls.map((url: string, i: number) => (
                                                <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-border hover:scale-105 transition-all cursor-zoom-in group" onClick={() => setZoomImage(url)}>
                                                    <Image src={url} alt={`Dressage ${i + 1}`} fill className="object-cover" sizes="150px" />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center"><ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6" /></div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <Button onClick={() => router.back()} variant="outline" className="w-full h-12 rounded-xl border-border text-foreground/60 hover:bg-muted font-black uppercase tracking-widest text-xs transition-all">
                                    <ArrowLeft className="mr-2 h-4 w-4" />Retour à l'atelier
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
                <ImageZoomLightbox isOpen={!!zoomImage} imageUrl={zoomImage} onClose={() => setZoomImage(null)} />
            </SidebarInset>
        </SidebarProvider>
    );
}
