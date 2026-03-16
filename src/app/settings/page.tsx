
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    SidebarProvider,
    Sidebar as AppSidebar,
    SidebarInset,
} from '@/components/ui/sidebar';
import { Sidebar } from '@/components/dashboard/sidebar';
import { useUser, useFirebase, updateDocumentNonBlocking, useCollection, useMemoFirebase, initiateEmailVerification, useDoc } from '@/firebase';
import { collection, doc, query, limit, updateDoc, setDoc } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import type { Meal, UserProfile as UserProfileType } from '@/lib/types';
import { Loader2, Settings, Palette, Save, Trash2, ShieldCheck, KeyRound, BookOpen, Tag, Info, BrainCircuit, Target, User, Image as ImageIcon, Languages, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ThemeSelector, type Theme } from '@/components/personalization/theme-selector';
import { useAccentTheme } from '@/contexts/accent-theme-context';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { updateProfile } from 'firebase/auth';
import { AppHeader } from '@/components/layout/app-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageZoomLightbox } from '@/components/shared/image-zoom-lightbox';
import { Textarea } from '@/components/ui/textarea';
import { cn, formatUserIdentifier } from '@/lib/utils';
import { useReadOnly } from '@/contexts/read-only-context';


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

const defaultPersonality: Partial<UserProfileType> = {
    tone: 'Amical et encourageant',
    mainObjective: '',
    allergies: '',
    preferences: '',
};

export default function SettingsPage() {
    const { user, isUserLoading } = useUser();
    const { firestore, auth } = useFirebase();
    const router = useRouter();
    const { toast } = useToast();
    const { theme: activeAccentTheme, setTheme: setAccentTheme } = useAccentTheme();
    const { isReadOnly, triggerBlock } = useReadOnly();

    // Helper function to get supported language
    const getSupportedLanguage = (lang: string) => {
        const supported = ['fr', 'en', 'de', 'it', 'es', 'pt'];
        const baseLang = lang.split('-')[0];
        return supported.includes(baseLang) ? baseLang : 'fr';
    };

    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [isMarketSubscribed, setIsMarketSubscribed] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);

    // AI Personality State
    const [personality, setPersonality] = useState<Partial<UserProfileType>>(defaultPersonality);
    const [language, setLanguage] = useState('system');
    const [detectedLanguage, setDetectedLanguage] = useState('fr');

    // --- Data fetching for user profile (including AI settings) ---
    const userProfileRef = useMemoFirebase(
        () => (user ? doc(firestore, 'users', user.uid) : null),
        [user, firestore]
    );
    const { data: userProfile, isLoading: isLoadingProfile } = useDoc<UserProfileType>(userProfileRef);

    const isTrainingEnabled = userProfile?.isAITrainingEnabled ?? false;
    const [mainObjective, setMainObjective] = useState(userProfile?.mainObjective || '');

    // --- Data fetching for sidebar ---
    const allMealsCollectionRef = useMemoFirebase(
        () => (user ? collection(firestore, 'users', user.uid, 'foodLogs') : null),
        [user, firestore]
    );
    const { data: allMeals, isLoading: isLoadingAllMeals } = useCollection<Omit<Meal, 'id'>>(allMealsCollectionRef);

    const goalsCollectionRef = useMemoFirebase(
        () => (user ? collection(firestore, 'users', user.uid, 'goals') : null),
        [user, firestore]
    );
    const singleGoalQuery = useMemoFirebase(
        () => goalsCollectionRef ? query(goalsCollectionRef, limit(1)) : null,
        [goalsCollectionRef]
    )
    const { data: goalsData, isLoading: isLoadingGoals } = useCollection<{ description: string }>(singleGoalQuery);

    const [goals, setGoals] = useState('Perdre du poids, manger plus sainement et réduire ma consommation de sucre.');
    const [goalId, setGoalId] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            setDisplayName(user.displayName || '');
            if (typeof navigator !== 'undefined') {
                setDetectedLanguage(getSupportedLanguage(navigator.language));
            }
        }
        if (goalsData) {
            if (goalsData.length > 0 && goalsData[0]) {
                setGoals(goalsData[0].description);
                setGoalId(goalsData[0].id);
            } else if (user && !isLoadingGoals) {
                const defaultGoal = {
                    userId: user.uid,
                    description: 'Perdre du poids, manger plus sainement et réduire ma consommation de sucre.',
                    targetValue: 2000,
                    timeFrame: 'daily',
                };
                addDocumentNonBlocking(collection(firestore, 'users', user.uid, 'goals'), defaultGoal);
            }
        }
        if (userProfile) {
            if (isTrainingEnabled) {
                setPersonality(userProfile);
            } else {
                setPersonality(defaultPersonality);
            }
            setMainObjective(userProfile.mainObjective || '');
            setLanguage(userProfile.language || 'system');
        }
    }, [goalsData, user, isLoadingGoals, firestore, userProfile, isTrainingEnabled]);

    const updateGoals = (newDescription: string) => {
        setGoals(newDescription);
        if (goalId && user) {
            const goalRef = doc(firestore, 'users', user.uid, 'goals', goalId);
            updateDoc(goalRef, { description: newDescription }).catch(console.error);
        }
    }

    const handleSaveProfile = async () => {
        if (isReadOnly) { triggerBlock(); return; }
        if (!user || !auth.currentUser) return;
        if (!userProfileRef) return;

        setIsSaving(true);
        try {
            // Update Firebase Auth profile
            if (displayName !== user.displayName) {
                await updateProfile(auth.currentUser, { displayName });
            }

            // Update Firestore document
            await updateDoc(userProfileRef, { name: displayName });

            toast({
                title: "Profil enregistré",
                description: "Vos informations de profil ont été mises à jour.",
            });
        } catch (error) {
            console.error("Error updating profile:", error);
            toast({
                variant: "destructive",
                title: "Erreur",
                description: "Impossible de mettre à jour le profil.",
            });
        } finally {
            setIsSaving(false);
        }
    }

    const handleSaveAppearance = (newTheme: Theme) => {
        if (isReadOnly) { triggerBlock(); return; }
        if (!user) return;
        const userRef = doc(firestore, 'users', user.uid);
        setAccentTheme(newTheme);
        updateDocumentNonBlocking(userRef, { theme: newTheme.name });
        toast({
            title: "Apparence enregistrée",
            description: `Le thème ${newTheme.name} a été appliqué.`,
        });
    }

    const handleToggleTraining = async (enabled: boolean) => {
        if (isReadOnly) { triggerBlock(); return; }
        if (!userProfileRef) return;
        try {
            await setDoc(userProfileRef, { isAITrainingEnabled: enabled }, { merge: true });
            toast({
                title: `Entraînement ${enabled ? 'activé' : 'désactivé'}`,
                description: enabled ? "Vous pouvez maintenant personnaliser l'assistant." : "L'assistant utilisera ses réponses par défaut.",
            });
        } catch (error) {
            toast({ variant: 'destructive', title: "Erreur", description: "Impossible de modifier le paramètre." })
        }
    };

    const handleFieldChange = (field: keyof UserProfileType, value: string) => {
        let finalValue: any = value;
        if (['age', 'weight', 'height', 'targetCalories', 'targetMeals'].includes(field)) {
            finalValue = value === '' ? undefined : Number(value);
        }
        setPersonality(prev => ({ ...prev, [field]: finalValue }));
    };

    const handleSaveAISettings = async () => {
        if (isReadOnly) { triggerBlock(); return; }
        if (!user || !userProfileRef) return;
        setIsSaving(true);
        try {
            await setDoc(userProfileRef, {
                ...personality,
            }, { merge: true });

            toast({
                title: "Préférences IA sauvegardées",
                description: "L'assistant utilisera désormais ces informations.",
            });
        } catch (error) {
            console.error("Failed to save AI settings:", error);
            toast({
                variant: "destructive",
                title: "Erreur de sauvegarde",
                description: "Impossible d'enregistrer vos préférences. Veuillez réessayer.",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveLanguage = async (value: string) => {
        if (isReadOnly) { triggerBlock(); return; }
        if (!user || !userProfileRef) return;
        setLanguage(value);
        try {
            updateDocumentNonBlocking(userProfileRef, { language: value });
            toast({
                title: "Langue mise à jour",
                description: "La langue de l'application a été modifiée.",
            });
        } catch (error) {
            console.error("Error updating language:", error);
            toast({
                variant: 'destructive',
                title: "Erreur",
                description: "Impossible de modifier la langue.",
            });
        }
    };

    const handleDeleteAccount = () => {
        toast({
            variant: "destructive",
            title: "Action non disponible",
            description: "La suppression de compte est désactivée en mode démonstration.",
        });
    }

    const handleSendVerification = () => {
        if (auth.currentUser) {
            initiateEmailVerification(auth.currentUser);
        }
    };

    if (isUserLoading || isLoadingAllMeals || isLoadingGoals || isLoadingProfile || !user) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    const sidebarProps = {
        goals,
        setGoals: updateGoals,
        meals: allMeals ?? [],
    };

    return (
        <SidebarProvider defaultOpen={true}>
            <AppSidebar collapsible="icon" className="w-64 peer hidden md:block border-r bg-sidebar">
                <Sidebar {...sidebarProps} />
            </AppSidebar>
            <SidebarInset className="bg-background flex flex-col h-screen">
                <AppHeader
                    title="Paramètres"
                    icon={<Settings className="h-4 w-4" />}
                    user={user}
                    sidebarProps={sidebarProps}
                />

                <main className="flex-1 overflow-y-auto max-w-4xl mx-auto w-full px-4 md:px-8 py-6 md:py-10 space-y-10 md:space-y-12">

                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
                        <p className="text-muted-foreground text-sm">Gérez votre compte, vos préférences et personnalisez votre expérience.</p>
                    </div>

                    <div className="space-y-10">
                        {/* PROFIL SECTION */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-2 border-b pb-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Profil public</h2>
                            </div>

                            <div className="flex flex-col md:flex-row gap-10 items-start">
                                <div className="relative group">
                                    <Avatar className="h-24 w-24 border rounded-lg cursor-zoom-in transition-opacity hover:opacity-80" onClick={() => setZoomImageUrl(userProfile?.avatarUrl || user.photoURL || null)}>
                                        <AvatarImage src={userProfile?.avatarUrl || user.photoURL || undefined} />
                                        <AvatarFallback className="text-2xl font-bold bg-muted">{displayName?.charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="absolute -bottom-2 -right-2 h-7 w-7 rounded-full bg-background border shadow-sm"
                                        onClick={() => router.push('/avatar-selection')}
                                    >
                                        <ImageIcon className="h-3.5 w-3.5" />
                                    </Button>
                                </div>

                                <div className="flex-1 w-full space-y-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="displayName" className="text-xs font-medium">Nom d'affichage</Label>
                                        <Input
                                            id="displayName"
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            className="max-w-md h-9 text-sm rounded shadow-sm"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="email" className="text-xs font-medium">Adresse e-mail</Label>
                                        <div className="flex items-center gap-2 max-w-md">
                                            <Input id="email" value={formatUserIdentifier(user.email) || ''} readOnly disabled className="h-9 text-sm rounded bg-accent/30 opacity-70" />
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                disabled={user.emailVerified}
                                                onClick={handleSendVerification}
                                                className={cn(
                                                    "h-8 px-3 text-[10px] font-bold uppercase tracking-wider",
                                                    user.emailVerified ? "text-emerald-600 bg-emerald-50" : "text-primary hover:bg-primary/5"
                                                )}
                                            >
                                                {user.emailVerified ? "Vérifié" : "Vérifier"}
                                            </Button>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handleSaveProfile}
                                        disabled={isSaving}
                                        className="h-9 px-4 text-xs font-bold rounded shadow-sm"
                                    >
                                        {isSaving ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-2 h-3.5 w-3.5" />}
                                        Enregistrer les modifications
                                    </Button>
                                </div>
                            </div>
                        </section>

                        {/* IA SECTION */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-2 border-b pb-2">
                                <BrainCircuit className="h-4 w-4 text-muted-foreground" />
                                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Intelligence MyFlex</h2>
                            </div>

                            <div className="space-y-6 max-w-2xl">
                                <div className="flex items-center justify-between p-4 rounded-lg bg-accent/20 border">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="enable-training" className="text-sm font-bold">Personnalisation de l'IA</Label>
                                        <p className="text-xs text-muted-foreground">Permettre à l'assistant d'adapter ses conseils à votre profil.</p>
                                    </div>
                                    <Switch
                                        id="enable-training"
                                        checked={isTrainingEnabled}
                                        onCheckedChange={handleToggleTraining}
                                    />
                                </div>

                                {isTrainingEnabled && (
                                    <div className="space-y-6 bg-accent/5 p-6 rounded-lg border border-dashed animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="space-y-2">
                                            <Label htmlFor="main-objective" className="text-xs font-medium flex items-center gap-1.5">
                                                <Target className="h-3 w-3" />
                                                Objectif principal
                                            </Label>
                                            <Textarea
                                                id="main-objective"
                                                placeholder="Ex: Perdre 5kg, manger plus de protéines..."
                                                className="min-h-[80px] text-sm rounded shadow-sm"
                                                value={personality?.mainObjective || ''}
                                                onChange={(e) => handleFieldChange('mainObjective', e.target.value)}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="ai-tone" className="text-xs font-medium">Ton de l'assistant</Label>
                                                <Select value={personality?.tone || ''} onValueChange={(value) => handleFieldChange('tone', value)}>
                                                    <SelectTrigger className="h-9 text-xs rounded shadow-sm">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded border shadow-md">
                                                        <SelectItem value="Amical et encourageant" className="text-xs">Amical</SelectItem>
                                                        <SelectItem value="Formel et direct" className="text-xs">Formel</SelectItem>
                                                        <SelectItem value="Scientifique et détaillé" className="text-xs">Scientifique</SelectItem>
                                                        <SelectItem value="Humoristique" className="text-xs">Humoristique</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="allergies" className="text-xs font-medium">Allergies / Restrictions</Label>
                                                <Input
                                                    id="allergies"
                                                    placeholder="Lactose, gluten..."
                                                    className="h-9 text-sm rounded shadow-sm"
                                                    value={personality?.allergies || ''}
                                                    onChange={(e) => handleFieldChange('allergies', e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="origin" className="text-xs font-medium">Origine culinaire</Label>
                                                <Input
                                                    id="origin"
                                                    placeholder="Ex: Française, Africaine, Italienne..."
                                                    className="h-9 text-sm rounded shadow-sm"
                                                    value={personality?.origin || ''}
                                                    onChange={(e) => handleFieldChange('origin', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="country" className="text-xs font-medium">Pays de résidence</Label>
                                                <Input
                                                    id="country"
                                                    placeholder="Ex: France, Sénégal..."
                                                    className="h-9 text-sm rounded shadow-sm"
                                                    value={personality?.country || ''}
                                                    onChange={(e) => handleFieldChange('country', e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="preferences" className="text-xs font-medium">Préférences alimentaires</Label>
                                            <Textarea
                                                id="preferences"
                                                placeholder="Vos goûts, dégoûts..."
                                                className="min-h-[80px] text-sm rounded shadow-sm"
                                                value={personality?.preferences || ''}
                                                onChange={(e) => handleFieldChange('preferences', e.target.value)}
                                            />
                                        </div>

                                        <Button
                                            onClick={handleSaveAISettings}
                                            size="sm"
                                            disabled={isSaving}
                                            className="h-8 px-4 text-[10px] font-bold uppercase tracking-wider rounded"
                                        >
                                            Enregistrer les préférences IA
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* APPEARANCE SECTION */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-2 border-b pb-2">
                                <Palette className="h-4 w-4 text-muted-foreground" />
                                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Apparence</h2>
                            </div>
                            <div className="max-w-2xl bg-accent/10 p-6 rounded-lg border">
                                <p className="text-xs text-muted-foreground mb-6">Personnalisez les couleurs d'accentuation de votre interface.</p>
                                {activeAccentTheme && (
                                    <ThemeSelector
                                        selectedThemeName={activeAccentTheme.name}
                                        onThemeChange={handleSaveAppearance}
                                    />
                                )}
                            </div>
                        </section>

                        {/* INTERFACE SECTION */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-2 border-b pb-2">
                                <Sparkles className="h-4 w-4 text-muted-foreground" />
                                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Préférences d'Interface</h2>
                            </div>
                            <div className="max-w-2xl bg-card p-6 rounded-lg border space-y-4 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1 pr-4">
                                        <Label htmlFor="floating-shortcuts" className="text-sm font-bold">Raccourci latéral mobile (Edge)</Label>
                                        <p className="text-xs text-muted-foreground">Afficher une poignée sur le bord droit de l'écran pour accéder rapidement à vos outils essentiels.</p>
                                    </div>
                                    <Switch
                                        id="floating-shortcuts"
                                        checked={userProfile?.isFloatingShortcutsEnabled !== false}
                                        onCheckedChange={(checked) => {
                                            if (isReadOnly) { triggerBlock(); return; }
                                            if (!userProfileRef) return;
                                            updateDocumentNonBlocking(userProfileRef, { isFloatingShortcutsEnabled: checked });
                                            toast({
                                                title: `Raccourci ${checked ? 'activé' : 'désactivé'}`,
                                                description: `Le menu flottant a été ${checked ? 'activé' : 'masqué'}.`,
                                            });
                                        }}
                                    />
                                </div>
                            </div>
                        </section>

                        {/* PHYSICAL PROFILE SECTION */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-2 border-b pb-2">
                                <Target className="h-4 w-4 text-muted-foreground" />
                                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Profil Physique & Objectifs</h2>
                            </div>

                            <div className="max-w-2xl bg-accent/5 p-6 rounded-lg border border-dashed space-y-8">
                                <p className="text-xs text-muted-foreground italic">Ces informations permettent à notre outil (MyFlex) de calculer vos besoins nutritionnels précis.</p>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Âge</Label>
                                        <Input
                                            type="number"
                                            value={personality?.age || ''}
                                            onChange={(e) => handleFieldChange('age', e.target.value)}
                                            placeholder="Ex: 25"
                                            className="h-9 text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Sexe</Label>
                                        <Select value={personality?.gender || ''} onValueChange={(v) => handleFieldChange('gender', v)}>
                                            <SelectTrigger className="h-9 text-xs">
                                                <SelectValue placeholder="Choisir" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="male">Homme</SelectItem>
                                                <SelectItem value="female">Femme</SelectItem>
                                                <SelectItem value="other">Autre</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Poids (kg)</Label>
                                        <Input
                                            type="number"
                                            value={personality?.weight || ''}
                                            onChange={(e) => handleFieldChange('weight', e.target.value)}
                                            placeholder="70"
                                            className="h-9 text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Taille (cm)</Label>
                                        <Input
                                            type="number"
                                            value={personality?.height || ''}
                                            onChange={(e) => handleFieldChange('height', e.target.value)}
                                            placeholder="175"
                                            className="h-9 text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Niveau d'activité</Label>
                                    <Select value={personality?.activityLevel || ''} onValueChange={(v) => handleFieldChange('activityLevel', v)}>
                                        <SelectTrigger className="h-9 text-xs">
                                            <SelectValue placeholder="Votre activité quotidienne" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="sedentary">Sédentaire (Bureau, peu de sport)</SelectItem>
                                            <SelectItem value="light">Légèrement actif (1-2 fois/semaine)</SelectItem>
                                            <SelectItem value="moderate">Modérément actif (3-5 fois/semaine)</SelectItem>
                                            <SelectItem value="active">Très actif (Sport quotidien)</SelectItem>
                                            <SelectItem value="very_active">Extrêmement actif (Métier physique + sport)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <Label className="text-[10px] uppercase font-black">Objectif Calories</Label>
                                            <span className="text-[10px] font-bold text-primary">{personality?.targetCalories || 2000} kcal/jour</span>
                                        </div>
                                        <Input
                                            type="number"
                                            value={personality?.targetCalories || ''}
                                            onChange={(e) => handleFieldChange('targetCalories', e.target.value)}
                                            className="h-9 text-sm"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <Label className="text-[10px] uppercase font-black">Nombre de repas</Label>
                                            <span className="text-[10px] font-bold text-primary">{personality?.targetMeals || 4} / jour</span>
                                        </div>
                                        <Input
                                            type="number"
                                            value={personality?.targetMeals || ''}
                                            onChange={(e) => handleFieldChange('targetMeals', e.target.value)}
                                            className="h-9 text-sm"
                                        />
                                    </div>
                                </div>

                                <Button
                                    onClick={handleSaveAISettings}
                                    size="sm"
                                    disabled={isSaving}
                                    className="h-9 px-6 text-xs font-bold rounded shadow-lg bg-primary hover:bg-primary/90 transition-all active:scale-95"
                                >
                                    Mettre à jour mon profil santé
                                </Button>
                            </div>
                        </section>

                        {/* LANGUAGE SECTION */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-2 border-b pb-2">
                                <Languages className="h-4 w-4 text-muted-foreground" />
                                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Langue & Région</h2>
                            </div>
                            <div className="max-w-2xl bg-card p-6 rounded-lg border">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                                    <div className="space-y-1">
                                        <Label htmlFor="language-select" className="text-sm font-medium">Langue de l'application</Label>
                                        <p className="text-xs text-muted-foreground">Choisissez la langue d'affichage de l'interface et de l'assistant.</p>
                                    </div>
                                    <Select value={language} onValueChange={handleSaveLanguage}>
                                        <SelectTrigger id="language-select" className="w-full">
                                            <SelectValue placeholder="Choisir une langue" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="system">
                                                Système (Détecté: {
                                                    detectedLanguage === 'fr' ? 'Français' :
                                                        detectedLanguage === 'en' ? 'English' :
                                                            detectedLanguage === 'de' ? 'Deutsch' :
                                                                detectedLanguage === 'it' ? 'Italiano' :
                                                                    detectedLanguage === 'es' ? 'Español' :
                                                                        detectedLanguage === 'pt' ? 'Português' : detectedLanguage
                                                })
                                            </SelectItem>
                                            <SelectItem value="fr">Français (France)</SelectItem>
                                            <SelectItem value="en">English (US)</SelectItem>
                                            <SelectItem value="de">Deutsch</SelectItem>
                                            <SelectItem value="it">Italiano</SelectItem>
                                            <SelectItem value="es">Español</SelectItem>
                                            <SelectItem value="pt">Português</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </section>

                        {/* DANGER SECTION REMOVED */}
                    </div>
                </main>
                <ImageZoomLightbox isOpen={!!zoomImageUrl} imageUrl={zoomImageUrl || ''} onClose={() => setZoomImageUrl(null)} />
            </SidebarInset>
        </SidebarProvider>
    );
}
