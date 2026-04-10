'use client';

import { Activity, Loader2, Users, TrendingUp, BarChart, DatabaseZap, Copy, Sparkles, Send, Mail, Bell } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line, Bar, BarChart as RechartsBarChart } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect, useMemo } from "react";
import { collection, query, where, getDocs, Timestamp, getCountFromServer } from 'firebase/firestore';
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { getApiUrl } from '@/lib/api-utils';
import type { GenerateReminderOutput, UserProfile } from '@/lib/types';
import { format, subDays, startOfMonth, endOfMonth, eachMonthOfInterval, startOfDay, endOfDay, eachDayOfInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Input } from "@/components/ui/input";
import { formatUserIdentifier } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface UserData extends UserProfile {
    createdAt?: Timestamp;
    lastLogin?: Timestamp;
}

export function FollowUpSection() {
    const { firestore } = useFirebase();
    const { toast } = useToast();

    const [messageType, setMessageType] = useState<'notification' | 'email'>('notification');
    const [userSegment, setUserSegment] = useState('inactive_3_days');
    const [generatedMessage, setGeneratedMessage] = useState<GenerateReminderOutput | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [inactivityReminderEnabled, setInactivityReminderEnabled] = useState(false);

    const [stats, setStats] = useState({
        newUsers24h: 0,
        activeUsersToday: 0,
        aiPerformance: 0,
        totalUsers: 0,
    });
    const [isLoadingStats, setIsLoadingStats] = useState(true);

    const usersCollectionRef = useMemoFirebase(() => collection(firestore, 'users'), [firestore]);
    const { data: allUsers, isLoading: isLoadingUsers } = useCollection<UserData>(usersCollectionRef);

    const [userGrowthData, setUserGrowthData] = useState<{ date: string; users: number }[]>([]);
    const [dailyActivityData, setDailyActivityData] = useState<{ day: string; active: number }[]>([]);

    const [isCustomCopyOpen, setIsCustomCopyOpen] = useState(false);
    const [customDays, setCustomDays] = useState("7");

    useEffect(() => {
        if (!allUsers) return;

        const monthCounts: Record<string, number> = {};
        allUsers.forEach(u => {
            if (u.createdAt) {
                const monthKey = format(u.createdAt.toDate(), 'yyyy-MM');
                monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
            }
        });

        const sortedMonthKeys = Object.keys(monthCounts).sort();
        let total = 0;
        const cumulativeData = sortedMonthKeys.map(key => {
            total += monthCounts[key];
            return {
                date: format(new Date(key + '-02'), 'MMM', { locale: fr }),
                users: total
            }
        });

        setUserGrowthData(cumulativeData);
    }, [allUsers]);

    useEffect(() => {
        if (!firestore) return;

        const fetchDailyActivity = async () => {
            const today = new Date();
            const last7Days = eachDayOfInterval({
                start: subDays(today, 6),
                end: today,
            });

            const activityPromises = last7Days.map(async (day) => {
                const start = startOfDay(day);
                const end = endOfDay(day);
                const q = query(
                    collection(firestore, 'users'),
                    where('lastLogin', '>=', Timestamp.fromDate(start)),
                    where('lastLogin', '<=', Timestamp.fromDate(end))
                );
                const snapshot = await getCountFromServer(q);
                return {
                    day: format(day, 'EEE', { locale: fr }),
                    active: snapshot.data().count
                };
            });

            const results = await Promise.all(activityPromises);
            setDailyActivityData(results);
        };

        fetchDailyActivity();
    }, [firestore]);

    useEffect(() => {
        if (!firestore) return;

        const fetchStats = async () => {
            setIsLoadingStats(true);
            try {
                const totalUsersSnapshot = await getCountFromServer(collection(firestore, 'users'));
                const totalUsersCount = totalUsersSnapshot.data().count;

                const yesterday = subDays(new Date(), 1);
                const newUsersQuery = query(collection(firestore, 'users'), where('createdAt', '>=', Timestamp.fromDate(yesterday)));
                const newUsersSnapshot = await getCountFromServer(newUsersQuery);
                const newUsersCount = newUsersSnapshot.data().count;

                const todayStart = startOfDay(new Date());
                const activeUsersQuery = query(collection(firestore, 'users'), where('lastLogin', '>=', Timestamp.fromDate(todayStart)));
                const activeUsersSnapshot = await getCountFromServer(activeUsersQuery);
                const uniqueActiveUsers = activeUsersSnapshot.data().count;

                const positiveFeedbackQuery = query(collection(firestore, 'feedbacks'), where('rating', '==', 1));
                const negativeFeedbackQuery = query(collection(firestore, 'feedbacks'), where('rating', '==', -1));
                const positiveCount = (await getCountFromServer(positiveFeedbackQuery)).data().count;
                const negativeCount = (await getCountFromServer(negativeFeedbackQuery)).data().count;
                const totalRated = positiveCount + negativeCount;
                const aiPerformance = totalRated > 0 ? (positiveCount / totalRated) * 100 : 100;

                setStats({
                    newUsers24h: newUsersCount,
                    activeUsersToday: uniqueActiveUsers,
                    aiPerformance: parseFloat(aiPerformance.toFixed(1)),
                    totalUsers: totalUsersCount,
                });

            } catch (error) {
                console.error("Error fetching stats:", error);
                toast({ variant: 'destructive', title: 'Erreur de chargement', description: 'Impossible de récupérer les statistiques.' });
            } finally {
                setIsLoadingStats(false);
            }
        };

        fetchStats();
    }, [firestore, toast]);

    const handleCopyEmails = async (period: '24h' | 'semaine' | 'mois' | 'all' | number) => {
        if (!allUsers) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'La liste des utilisateurs est vide.' });
            return;
        }

        let startDate: Date | null = null;
        if (period === '24h') startDate = subDays(new Date(), 1);
        else if (period === 'semaine') startDate = subDays(new Date(), 7);
        else if (period === 'mois') startDate = subDays(new Date(), 30);
        else if (typeof period === 'number') startDate = subDays(new Date(), period);

        const filteredUsers = startDate && allUsers
            ? allUsers.filter(u => u.createdAt && u.createdAt.toDate() >= startDate!)
            : allUsers;

        if (!filteredUsers || filteredUsers.length === 0) {
            toast({ title: 'Aucun e-mail', description: 'Aucun nouvel utilisateur pour cette période.' });
            return;
        }

        const emails = filteredUsers.map(u => formatUserIdentifier(u.email)).join(', ');

        try {
            await navigator.clipboard.writeText(emails);
            toast({ title: 'Copié !', description: `${filteredUsers.length} adresse(s) e-mail copiée(s) dans le presse-papiers.` });
        } catch (error) {
            console.error('Failed to copy emails:', error);
            toast({ variant: 'destructive', title: 'Erreur de copie', description: 'Impossible de copier dans le presse-papiers.' });
        }
    };

    const handleGenerateMessage = async () => {
        setIsGenerating(true);
        setGeneratedMessage(null);
        try {
            const response = await fetch(getApiUrl('/api/ai/generate-reminder'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: messageType,
                    userSegment,
                }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Erreur lors de la génération du message');
            setGeneratedMessage(data.message);
        } catch (e: any) {
            toast({
                variant: "destructive",
                title: "Erreur de génération",
                description: e.message || "Impossible de générer le message pour le moment."
            });
        } finally {
            setIsGenerating(false);
        }
    }

    const handleSendMessage = () => {
        toast({
            title: "Notification envoyée !",
            description: `Le message a été envoyé au segment d'utilisateurs: ${userSegment}.`,
        });
    }

    const handleToggleReminder = (enabled: boolean) => {
        setInactivityReminderEnabled(enabled);
        toast({
            title: `Relance automatique ${enabled ? 'activée' : 'désactivée'}`,
            description: "Le paramètre a été mis à jour.",
        });
    };

    if (isLoadingUsers) {
        return (
            <div className="flex w-full items-center justify-center p-12">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    const chartConfig = {
        users: { label: 'Utilisateurs', color: 'hsl(var(--primary))' },
        active: { label: 'Actifs', color: 'hsl(var(--primary))' },
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Utilisateurs</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isLoadingStats ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">{stats.totalUsers}</div>}
                        <p className="text-xs text-muted-foreground">Utilisateurs inscrits au total</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Inscrits (24h)</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isLoadingStats ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">+{stats.newUsers24h}</div>}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Utilisateurs Actifs (jour)</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isLoadingStats ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">{stats.activeUsersToday}</div>}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Satisfaction de l'IA</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isLoadingStats ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">{stats.aiPerformance}%</div>}
                        <p className="text-xs text-muted-foreground">Taux de retours positifs</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Courbe de Croissance</CardTitle>
                        <CardDescription>Évolution du nombre total d'utilisateurs.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64">
                            <ChartContainer config={chartConfig} className="h-full w-full">
                                <ResponsiveContainer>
                                    <LineChart data={userGrowthData}>
                                        <CartesianGrid vertical={false} />
                                        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                                        <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <Line type="monotone" dataKey="users" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Engagement Quotidien</CardTitle>
                        <CardDescription>Nombre d'utilisateurs actifs cette semaine.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64">
                            <ChartContainer config={chartConfig} className="h-full w-full">
                                <ResponsiveContainer>
                                    <RechartsBarChart data={dailyActivityData}>
                                        <CartesianGrid vertical={false} />
                                        <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
                                        <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <Bar dataKey="active" fill="hsl(var(--primary))" radius={4} />
                                    </RechartsBarChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Collecte des Données Automatique</CardTitle>
                    <CardDescription>Configurez la collecte et l'analyse des données d'engagement utilisateur.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2 rounded-lg border p-4">
                        <Activity className="h-5 w-5 text-primary" />
                        <div className="flex-1">
                            <Label htmlFor="inactivity-trigger">Relance pour inactivité</Label>
                            <p className="text-xs text-muted-foreground">
                                Envoie une notification push après 3 jours d'inactivité.
                            </p>
                        </div>
                        <Switch
                            id="inactivity-trigger"
                            checked={inactivityReminderEnabled}
                            onCheckedChange={handleToggleReminder}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Copie des E-mails</CardTitle>
                    <CardDescription>Récupérez les adresses e-mail des inscrits pour vos campagnes de communication.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Button variant="outline" onClick={() => handleCopyEmails('24h')}><Copy className="mr-2 h-4 w-4" />Dernières 24h</Button>
                    <Button variant="outline" onClick={() => handleCopyEmails('semaine')}><Copy className="mr-2 h-4 w-4" />Semaine</Button>
                    <Button variant="outline" onClick={() => handleCopyEmails('mois')}><Copy className="mr-2 h-4 w-4" />Mois</Button>
                    <Dialog open={isCustomCopyOpen} onOpenChange={setIsCustomCopyOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline"><Copy className="mr-2 h-4 w-4" />Personnaliser</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Copie personnalisée</DialogTitle>
                                <DialogDescription>
                                    Choisissez une période pour copier les e-mails ou copiez tout.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4 space-y-4">
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        value={customDays}
                                        onChange={(e) => setCustomDays(e.target.value)}
                                        placeholder="Nombre de jours"
                                    />
                                    <Button onClick={() => {
                                        handleCopyEmails(parseInt(customDays));
                                        setIsCustomCopyOpen(false);
                                    }}>Copier</Button>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-background px-2 text-muted-foreground">
                                            Ou
                                        </span>
                                    </div>
                                </div>
                                <Button variant="secondary" className="w-full" onClick={() => {
                                    handleCopyEmails('all');
                                    setIsCustomCopyOpen(false);
                                }}>Copier tous les e-mails</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Générateur de Message de Relance IA</CardTitle>
                    <CardDescription>Créez des messages de relance percutants pour réengager vos utilisateurs inactifs.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Type de message</Label>
                            <Select value={messageType} onValueChange={(v) => setMessageType(v as any)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="notification"><Bell className="inline-block mr-2 h-4 w-4" />Notification</SelectItem>
                                    <SelectItem value="email"><Mail className="inline-block mr-2 h-4 w-4" />Email</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Segment d'utilisateurs</Label>
                            <Select value={userSegment} onValueChange={setUserSegment}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="inactive_3_days">Inactifs depuis 3 jours</SelectItem>
                                    <SelectItem value="inactive_7_days">Inactifs depuis 7 jours</SelectItem>
                                    <SelectItem value="inactive_14_days">Inactifs depuis 14 jours et plus</SelectItem>
                                    <SelectItem value="no_goal">N'ont pas complété d'objectif</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div>
                        <Button onClick={handleGenerateMessage} className="w-full md:w-auto" disabled={isGenerating}>
                            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                            {isGenerating ? "Génération..." : "Générer le message"}
                        </Button>
                    </div>
                    <div className="space-y-2">
                        {generatedMessage?.subject && (
                            <>
                                <Label>Sujet de l'email</Label>
                                <Input readOnly value={generatedMessage.subject} className="bg-muted/50" />
                            </>
                        )}
                        <Label>Message généré</Label>
                        <Textarea readOnly value={generatedMessage?.body || "Le message généré par l'IA apparaîtra ici..."} className="min-h-24 bg-muted/50" />
                    </div>
                    <div className="flex gap-4">
                        <Button variant="outline" onClick={() => {
                            navigator.clipboard.writeText(generatedMessage?.body || '');
                            toast({ title: "Copié !" });
                        }} disabled={!generatedMessage}>
                            <Copy className="mr-2 h-4 w-4" /> Copier
                        </Button>
                        <Button onClick={handleSendMessage} disabled={!generatedMessage || messageType !== 'notification'}>
                            <Send className="mr-2 h-4 w-4" /> Envoyer
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
