'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Save, ArrowRight, Target, Sparkles, CheckCircle2, ChevronRight, X } from 'lucide-react';
import { useUser, useFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLoading } from '@/contexts/loading-context';
import { Checkbox } from '@/components/ui/checkbox';
import { LogoIcon } from '@/components/icons';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import Image from 'next/image';
import Autoplay from 'embla-carousel-autoplay';

interface AIPersonality {
    tone: string;
    mainGoals: string;
    allergies: string;
    preferences: string;
    dislikes: string;
}

const mainObjectives = [
    "Perte de poids",
    "Prise de masse",
    "Manger équilibré",
    "Réduction du sucre",
    "Réduction de la malbouffe",
    "Anti-gaspillage",
    "Optimiser le budget courses",
    "Cuisiner plus souvent",
    "Manger maison 5 jours/semaine",
];

const secondaryObjectives = mainObjectives.slice(2);
const allergyOptions = ["Aucune", "Lactose", "Gluten", "Fruits à coque", "Arachides", "Autre"];
const preferenceOptions = ["Cuisine asiatique", "Cuisine italienne", "Cuisine française", "Cuisine africaine", "Cuisine thaïlandaise", "Cuisine mexicaine", "Cuisine indienne", "Végétarien", "Vegan", "Autre"];

const carouselItems = [
    { image: '/mcf/17.png' },
    { image: '/mcf/18.png' },
    { image: '/mcf/20.png' }
];

export default function PreferencesPage() {
    const router = useRouter();
    const { user } = useUser();
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const { showLoading, hideLoading } = useLoading();

    const [mainObjective, setMainObjective] = useState('');
    const [selectedSecondary, setSelectedSecondary] = useState<string[]>([]);
    const [api, setApi] = useState<any>();
    const autoplay = useRef(Autoplay({ delay: 6000, stopOnInteraction: false }));

    const [aiPersonality, setAiPersonality] = useState<AIPersonality>({
        tone: 'Amical et encourageant',
        mainGoals: '',
        allergies: '',
        preferences: '',
        dislikes: '',
    });

    const [customAllergies, setCustomAllergies] = useState('');
    const [customPreferences, setCustomPreferences] = useState('');

    // Persistence: Load data on mount
    useEffect(() => {
        const savedData = localStorage.getItem('mcf_preferences_draft');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                if (data.mainObjective) setMainObjective(data.mainObjective);
                if (data.selectedSecondary) setSelectedSecondary(data.selectedSecondary);
                if (data.aiPersonality) setAiPersonality(data.aiPersonality);
                if (data.customAllergies) setCustomAllergies(data.customAllergies);
                if (data.customPreferences) setCustomPreferences(data.customPreferences);
            } catch (e) {
                console.error("Failed to load preferences draft", e);
            }
        }
    }, []);

    // Persistence: Save data on change
    useEffect(() => {
        const draft = { mainObjective, selectedSecondary, aiPersonality, customAllergies, customPreferences };
        localStorage.setItem('mcf_preferences_draft', JSON.stringify(draft));
    }, [mainObjective, selectedSecondary, aiPersonality, customAllergies, customPreferences]);

    const handleFieldChange = (field: keyof AIPersonality, value: string) => {
        setAiPersonality(prev => ({ ...prev, [field]: value }));
    };

    const handleSecondaryObjectiveChange = (objective: string) => {
        setSelectedSecondary(prev =>
            prev.includes(objective)
                ? prev.filter(item => item !== objective)
                : [...prev, objective]
        );
    };

    const handleFinish = async () => {
        if (!user) {
            toast({ variant: "destructive", title: "Erreur", description: "Utilisateur non connecté." });
            return;
        }
        if (!mainObjective) {
            toast({ variant: "destructive", title: "Champ requis", description: "Veuillez choisir un objectif principal." });
            return;
        }

        showLoading("Configuration de votre outil...");

        const finalPersonality = {
            tone: aiPersonality.tone,
            mainGoals: aiPersonality.mainGoals,
            allergies: aiPersonality.allergies === 'Autre' ? customAllergies : aiPersonality.allergies,
            preferences: aiPersonality.preferences === 'Autre' ? customPreferences : aiPersonality.preferences,
            dislikes: aiPersonality.dislikes,
        };

        try {
            const userRef = doc(firestore, `users/${user.uid}`);
            await setDoc(userRef, {
                mainObjective: mainObjective,
                secondaryObjectives: selectedSecondary,
                xp: 0,
                level: 1,
                streak: 0,
                targetCalories: 2000,
                ...finalPersonality,
                isAITrainingEnabled: true,
                updatedAt: serverTimestamp(),
            }, { merge: true });

            setTimeout(() => {
                router.push('/pricing');
                localStorage.removeItem('mcf_preferences_draft');
            }, 1000);

        } catch (error) {
            console.error("Failed to save preferences:", error);
            toast({
                variant: "destructive",
                title: "Erreur de sauvegarde",
                description: "Impossible d'enregistrer vos préférences. Veuillez réessayer.",
            });
            hideLoading();
        }
    };

    const handleSkip = async () => {
        if (!user) return;
        showLoading("Chargement...");
        try {
            const userRef = doc(firestore, `users/${user.uid}`);
            // On définit un objectif par défaut pour que l'AuthProvider laisse passer
            await setDoc(userRef, {
                mainObjective: 'À définir',
                updatedAt: serverTimestamp(),
            }, { merge: true });

            router.push('/pricing');
        } catch (error) {
            console.error("Failed to skip preferences:", error);
            hideLoading();
        }
    };

    return (
        <div className="flex min-h-screen w-full lg:grid lg:grid-cols-2 lg:h-screen lg:overflow-hidden bg-background">
            {/* Left Pane - Visual Inspiration (Sticky on Desktop) */}
            <div className="hidden lg:flex bg-primary flex-col items-center justify-center relative overflow-hidden w-full h-screen lg:sticky lg:top-0">
                <div className="absolute inset-0 z-0 text-white">
                    <Carousel
                        setApi={setApi}
                        plugins={[autoplay.current]}
                        className="w-full h-full"
                        opts={{ loop: true }}
                    >
                        <CarouselContent className="h-screen -ml-0">
                            {carouselItems.map((item, index) => (
                                <CarouselItem key={index} className="pl-0 relative h-screen">
                                    <Image src={item.image} alt="Cuisine Inspiration" fill className="object-cover" priority={index === 0} />
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                    </Carousel>
                </div>

                <div className="absolute top-12 left-12 z-10 flex flex-col gap-2">
                    <div className="p-5 rounded-[2rem] backdrop-blur-md bg-black/20 border border-white/10 shadow-2xl">
                        <div className="w-12 h-12 bg-white rounded-xl shadow-2xl flex items-center justify-center transform -rotate-3 mb-4">
                            <LogoIcon className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-black text-white tracking-tight drop-shadow-lg leading-tight">Mieux vous connaître<br />pour mieux cuisiner.</h2>
                    </div>
                </div>
            </div>

            {/* Right Pane - Content */}
            <div className="w-full flex items-start justify-center p-4 md:p-6 lg:p-12 lg:h-full overflow-y-auto bg-background">
                <div className="mx-auto w-full max-w-[580px] space-y-8 md:space-y-12 py-8 md:py-16">

                    <div className="flex flex-col items-center text-center gap-6">
                        <div className="w-20 h-20 bg-primary/10 rounded-[2.5rem] flex items-center justify-center shadow-inner relative">
                            <div className="absolute inset-0 bg-primary/5 blur-2xl rounded-full animate-pulse" />
                            <Target className="h-10 w-10 text-primary relative z-10" />
                        </div>

                        <div className="space-y-3">
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">Vos Préférences</h1>
                            <p className="text-muted-foreground font-medium max-w-[400px] mx-auto leading-relaxed">
                                Ces informations permettront à notre outil de créer des plans repas sur-mesure pour vous.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-10">
                        {/* Objectif Section */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="h-6 w-1 bg-primary rounded-full" />
                                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Objectif Principal</Label>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {mainObjectives.slice(0, 9).map((objective) => (
                                    <button
                                        key={objective}
                                        onClick={() => setMainObjective(objective)}
                                        className={`
                      p-4 rounded-2xl border-2 text-left transition-all duration-300 group relative overflow-hidden
                      ${mainObjective === objective
                                                ? 'border-primary bg-primary/5 shadow-lg shadow-primary/5'
                                                : 'border-muted bg-background md:hover:border-primary/40'}
                    `}
                                    >
                                        <p className={`text-xs font-bold leading-snug ${mainObjective === objective ? 'text-primary' : 'text-muted-foreground'}`}>
                                            {objective}
                                        </p>
                                        {mainObjective === objective && (
                                            <CheckCircle2 className="absolute top-2 right-2 h-4 w-4 text-primary animate-in zoom-in" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* AI Preferences Card */}
                        <div className="bg-primary/[0.02] border-2 border-primary/10 rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-8 space-y-8 md:space-y-10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -mr-16 -mt-16 md:group-hover:scale-150 transition-transform duration-1000" />

                            <div className="relative z-10 space-y-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                                        <Sparkles className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-black tracking-tight">Personnalisation Outil</h3>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Pour un assistant qui vous ressemble</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Ton de l'assistant</Label>
                                        <Select value={aiPersonality.tone} onValueChange={(value) => handleFieldChange('tone', value)}>
                                            <SelectTrigger className="h-14 border-2 rounded-2xl bg-background font-bold px-5">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl">
                                                <SelectItem value="Amical et encourageant">Amical et encourageant</SelectItem>
                                                <SelectItem value="Formel et direct">Formel et direct</SelectItem>
                                                <SelectItem value="Scientifique et détaillé">Scientifique et détaillé</SelectItem>
                                                <SelectItem value="Humoristique">Humoristique</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Allergies & Intolérances</Label>
                                        <Select onValueChange={(value) => handleFieldChange('allergies', value)}>
                                            <SelectTrigger className="h-14 border-2 rounded-2xl bg-background font-bold px-5">
                                                <SelectValue placeholder="Aucune" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl">
                                                {allergyOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        {aiPersonality.allergies === 'Autre' && (
                                            <Textarea
                                                placeholder="Spécifiez vos allergies..."
                                                className="rounded-2xl border-2 mt-3 min-h-[100px]"
                                                value={customAllergies}
                                                onChange={(e) => setCustomAllergies(e.target.value)}
                                            />
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Préférences / Détesté</Label>
                                        <Textarea
                                            placeholder="Ex: Je déteste les choux de Bruxelles, j'adore la coriandre..."
                                            className="rounded-2xl border-2 bg-background min-h-[120px] p-5 font-medium"
                                            value={aiPersonality.dislikes}
                                            onChange={(e) => handleFieldChange('dislikes', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4">
                        <Button onClick={handleFinish} className="w-full h-16 text-lg font-black shadow-2xl shadow-primary/30 rounded-2xl group relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full md:group-hover:translate-x-full transition-transform duration-1000" />
                            Finaliser & Découvrir
                            <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-2 transition-transform" />
                        </Button>

                        <Button onClick={handleSkip} variant="ghost" className="w-full h-14 text-sm font-bold text-muted-foreground hover:text-foreground rounded-2xl">
                            Passer pour le moment
                        </Button>
                    </div>

                </div>
            </div>
        </div>
    );
}
