
'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirebase, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where, updateDoc, arrayRemove, deleteDoc, setDoc, Timestamp } from 'firebase/firestore';
import { UserProfile, HouseholdInvite } from '@/lib/types';
import {
    Users,
    Plus,
    Trash2,
    Link as LinkIcon,
    ShieldCheck,
    Clock,
    Phone,
    UserPlus,
    Check,
    Copy,
    Loader2,
    ChefHat,
    ChevronRight,
    Search
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppHeader } from '@/components/layout/app-header';
import {
    SidebarProvider,
    Sidebar as AppSidebar,
    SidebarInset
} from '@/components/ui/sidebar';
import { Sidebar } from '@/components/dashboard/sidebar';
import { useToast } from '@/hooks/use-toast';
// import { createHouseholdInviteAction } from '../actions';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatUserIdentifier } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function FoyerControlPage() {
    const { user, isUserLoading } = useUser();
    const { firestore } = useFirebase();
    const { toast } = useToast();

    const [isCreatingInvite, setIsCreatingInvite] = useState(false);
    const [inviteName, setInviteName] = useState('');
    const [invitePhone, setInvitePhone] = useState('');
    const [selectedCountryName, setSelectedCountryName] = useState('France');
    const [lastInviteLink, setLastInviteLink] = useState<string | null>(null);

    const phoneCountries = [
        { name: 'France', code: '+33', flag: '🇫🇷' },
        { name: 'Belgique', code: '+32', flag: '🇧🇪' },
        { name: 'Suisse', code: '+41', flag: '🇨🇭' },
        { name: 'Luxembourg', code: '+352', flag: '🇱🇺' },
        { name: 'Allemagne', code: '+49', flag: '🇩🇪' },
        { name: 'Italie', code: '+39', flag: '🇮🇹' },
        { name: 'Espagne', code: '+34', flag: '🇪🇸' },
        { name: 'Portugal', code: '+351', flag: '🇵🇹' },
        { name: 'Royaume-Uni', code: '+44', flag: '🇬🇧' },
        { name: 'Pays-Bas', code: '+31', flag: '🇳🇱' },
        { name: 'Canada', code: '+1', flag: '🇨🇦' },
        { name: 'États-Unis', code: '+1', flag: '🇺🇸' },
        { name: 'Brésil', code: '+55', flag: '🇧🇷' },
        { name: 'Mexique', code: '+52', flag: '🇲🇽' },
    ];

    // --- Data Fetching ---
    const userProfileRef = useMemoFirebase(() => (user ? doc(firestore, 'users', user.uid) : null), [user, firestore]);
    const { data: userProfile, isLoading: isLoadingProfile } = useDoc<UserProfile>(userProfileRef);

    // Fetch members (users who have chefId == current user.uid)
    const membersQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(collection(firestore, 'users'), where('chefId', '==', user.uid));
    }, [user, firestore]);
    const { data: members, isLoading: isLoadingMembers } = useCollection<UserProfile>(membersQuery);

    // Fetch pending invites
    const invitesQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(collection(firestore, 'invites'), where('chefId', '==', user.uid), where('status', '==', 'pending'));
    }, [user, firestore]);
    const { data: pendingInvites, isLoading: isLoadingInvites } = useCollection<HouseholdInvite>(invitesQuery);

    const handleCreateInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !userProfile || !inviteName || !invitePhone) return;

        setIsCreatingInvite(true);
        try {
            const country = phoneCountries.find(c => c.name === selectedCountryName);
            const code = country?.code || '+33';
            const fullPhone = `${code}${invitePhone.replace(/^0/, '').replace(/\s+/g, '')}`;

            const inviteId = Math.random().toString(36).substring(2, 10);
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

            const inviteData = {
                id: inviteId,
                chefId: user.uid,
                chefName: userProfile.name,
                name: inviteName,
                phone: fullPhone,
                createdAt: Timestamp.now(),
                expiresAt: Timestamp.fromDate(expiresAt),
                status: 'pending'
            };

            await setDoc(doc(firestore, 'invites', inviteId), inviteData);

            const origin = window.location.origin.includes('localhost') ? 'https://app.mycookflex.com' : window.location.origin;
            const link = `${origin}/join-family/${inviteId}`;
            setLastInviteLink(link);
            setInviteName('');
            setInvitePhone('');

            toast({
                title: "Invitation générée !",
                description: "Envoyez le lien à votre proche. Il est valable 24h.",
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Erreur",
                description: error.message || "Impossible de générer l'invitation."
            });
        } finally {
            setIsCreatingInvite(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copié !", description: "Le lien a été copié dans le presse-papier." });
    };

    const handleDeleteInvite = async (inviteId: string) => {
        try {
            await deleteDoc(doc(firestore, 'invites', inviteId));
            toast({ title: "Invitation supprimée" });
        } catch (e) {
            toast({ variant: "destructive", title: "Erreur" });
        }
    };

    const handleRemoveMember = async (memberId: string, memberEmail: string, memberName: string) => {
        if (!confirm(`Voulez-vous vraiment retirer ${memberName} de votre foyer ?`)) return;
        try {
            const memberRef = doc(firestore, 'users', memberId);
            await updateDoc(memberRef, {
                chefId: null,
                status: 'isDenied',
                removedBy: userProfile?.name || 'Le Chef de famille',
                origin: 'Exclu (Foyer)'
            });

            // Create record for admin
            const deletedMemberRef = doc(collection(firestore, 'deletedMembers'));
            await setDoc(deletedMemberRef, {
                id: deletedMemberRef.id,
                userId: memberId,
                email: memberEmail,
                name: memberName,
                removedBy: userProfile?.name || 'Chef de famille',
                deletedAt: Timestamp.now(),
                status: 'new' // Tab: Nouveaux
            });

            // Clean up notifications for that member or send a last "Bye" but if status is isDenied, they'll see a special page anyway

            toast({ title: "Membre retiré", description: `${memberName} a été banni de votre foyer.` });
        } catch (e) {
            toast({ variant: "destructive", title: "Erreur", description: "Impossible de retirer le membre." });
        }
    };

    const isLoading = isUserLoading || isLoadingProfile || isLoadingMembers || isLoadingInvites;

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    if (userProfile?.chefId) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-6 text-center">
                <ShieldCheck className="h-16 w-16 text-muted-foreground mb-4 opacity-20" />
                <h1 className="text-2xl font-black">Accès Restreint</h1>
                <p className="text-muted-foreground max-w-sm mt-2">
                    Seul le chef du foyer peut accéder à cette page pour gérer les membres.
                </p>
                <Button className="mt-8" onClick={() => window.location.href = '/dashboard'}>Retour au tableau de bord</Button>
            </div>
        );
    }

    const sidebarProps = {
        goals: 'N/A',
        setGoals: () => { },
        meals: [],
    };

    return (
        <div className="h-screen w-full bg-background font-body">
            <SidebarProvider>
                <AppSidebar collapsible="icon" className="w-80 peer hidden md:block" variant="sidebar">
                    <Sidebar {...sidebarProps} />
                </AppSidebar>
                <SidebarInset>
                    <div className="flex h-full flex-1 flex-col overflow-hidden">
                        <AppHeader
                            title="Gestion du Foyer"
                            icon={<Users className="h-6 w-6" />}
                            user={user}
                            sidebarProps={sidebarProps}
                        />

                        <main className="flex-1 overflow-y-auto bg-background/50">
                            <div className="max-w-5xl mx-auto p-6 md:p-10 space-y-10">
                                {/* Hero Section */}
                                <div className="space-y-2">
                                    <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                                        <ShieldCheck className="h-7 w-7 text-primary" />
                                    </div>
                                    <h1 className="text-3xl md:text-4xl font-black tracking-tight">Espace Chef de Foyer</h1>
                                    <p className="text-muted-foreground text-sm max-w-2xl font-medium">
                                        Gérez les membres de votre famille, invitez de nouveaux cuisiniers et gardez votre organisation privée et sécurisée.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                                    {/* Left Column: Invite Form & History */}
                                    <div className="lg:col-span-7 space-y-8">
                                        <Card className="rounded-3xl border-2 border-primary/10 overflow-hidden shadow-xl shadow-primary/5 bg-card">
                                            <CardHeader className="bg-primary/5 border-b-2 border-primary/5">
                                                <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                                                    <UserPlus className="h-5 w-5 text-primary" />
                                                    Inviter un membre
                                                </CardTitle>
                                                <CardDescription className="text-xs font-bold font-medium">
                                                    Créez un accès sécurisé valide 24h pour un proche.
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="p-6 md:p-8 space-y-6">
                                                <form onSubmit={handleCreateInvite} className="space-y-4">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nom du proche</label>
                                                            <Input
                                                                placeholder="ex: Marie"
                                                                value={inviteName}
                                                                onChange={(e) => setInviteName(e.target.value)}
                                                                className="h-12 rounded-xl border-2 font-bold focus-visible:ring-primary/20"
                                                                required
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Numéro de téléphone</label>
                                                            <div className="flex gap-2">
                                                                <Select value={selectedCountryName} onValueChange={setSelectedCountryName}>
                                                                    <SelectTrigger className="w-[100px] h-12 rounded-xl border-2 font-bold focus:ring-primary/20">
                                                                        <SelectValue>
                                                                            <span className="flex items-center gap-2">
                                                                                <span>{phoneCountries.find(c => c.name === selectedCountryName)?.flag}</span>
                                                                                <span>{phoneCountries.find(c => c.name === selectedCountryName)?.code}</span>
                                                                            </span>
                                                                        </SelectValue>
                                                                    </SelectTrigger>
                                                                    <SelectContent className="rounded-2xl border-2">
                                                                        {phoneCountries.map((c) => (
                                                                            <SelectItem key={c.name} value={c.name}>
                                                                                <span className="flex items-center gap-2">
                                                                                    <span>{c.flag}</span>
                                                                                    <span>{c.code}</span>
                                                                                    <span className="text-xs text-muted-foreground ml-1">{c.name}</span>
                                                                                </span>
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                                <div className="relative flex-1">
                                                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                                                                    <Input
                                                                        placeholder="612345678"
                                                                        value={invitePhone}
                                                                        onChange={(e) => setInvitePhone(e.target.value)}
                                                                        className="h-12 pl-10 rounded-xl border-2 font-bold focus-visible:ring-primary/20"
                                                                        required
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        disabled={isCreatingInvite}
                                                        className="w-full h-12 rounded-xl font-black uppercase tracking-widest bg-primary hover:scale-[1.02] transition-transform shadow-lg shadow-primary/20"
                                                    >
                                                        {isCreatingInvite ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LinkIcon className="mr-2 h-4 w-4" />}
                                                        Générer le lien unique
                                                    </Button>
                                                </form>

                                                {lastInviteLink && (
                                                    <div className="p-4 rounded-2xl bg-primary/5 border-2 border-primary/10 animate-in fade-in zoom-in-95 duration-500">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Lien d'invitation généré !</p>
                                                        <div className="flex gap-2">
                                                            <Input
                                                                value={lastInviteLink}
                                                                readOnly
                                                                className="h-10 text-xs font-mono bg-background border-none"
                                                            />
                                                            <Button size="icon" className="shrink-0 h-10 w-10 rounded-lg" onClick={() => copyToClipboard(lastInviteLink)}>
                                                                <Copy className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                        <p className="text-[9px] font-bold text-muted-foreground mt-3 italic">
                                                            Important: Transmettez ce lien à votre proche. Il devra définir son mot de passe pour rejoindre votre famille.
                                                        </p>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>

                                        {/* Pending Invites List */}
                                        <div className="space-y-4">
                                            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                                <Clock className="h-3.5 w-3.5" />
                                                Invitations en cours ({pendingInvites?.length || 0})
                                            </h3>
                                            <div className="grid gap-3">
                                                {pendingInvites && pendingInvites.length > 0 ? pendingInvites.map(invite => (
                                                    <div key={invite.id} className="flex items-center justify-between p-4 rounded-2xl bg-card border-2 border-border shadow-sm group">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center text-accent-foreground font-black text-xs">
                                                                {invite.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-black">{invite.name}</p>
                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                    <span className="text-[10px] text-muted-foreground font-bold">{invite.phone}</span>
                                                                    <Badge variant="outline" className="text-[8px] h-4 py-0 font-black uppercase bg-primary/5 text-primary border-primary/20">
                                                                        Expire le {format(invite.expiresAt.toDate(), 'dd/MM HH:mm')}
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => {
                                                                const origin = window.location.origin.includes('localhost') ? 'https://app.mycookflex.com' : window.location.origin;
                                                                copyToClipboard(`${origin}/join-family/${invite.id}`);
                                                            }}>
                                                                <Copy className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => handleDeleteInvite(invite.id)}>
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )) : (
                                                    <div className="p-10 border-2 border-dashed rounded-3xl text-center opacity-20">
                                                        <p className="text-xs font-black uppercase tracking-widest">Aucune invitation</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column: Active Members */}
                                    <div className="lg:col-span-5 space-y-4">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                            <Users className="h-3.5 w-3.5" />
                                            Membres Actifs ({members?.length || 0})
                                        </h3>
                                        <div className="grid gap-4">
                                            {members && members.length > 0 ? members.map(member => (
                                                <div key={member.id} className="p-5 rounded-[2rem] bg-card border-2 border-border shadow-lg relative overflow-hidden group">
                                                    <div className="absolute top-0 right-0 p-6 pointer-events-none opacity-5 group-hover:scale-110 transition-transform">
                                                        <Users className="h-20 w-20" />
                                                    </div>
                                                    <div className="relative z-10 flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center p-0.5 border-2 border-primary/5 shadow-inner">
                                                                <Avatar className="h-full w-full rounded-xl">
                                                                    <AvatarImage src={member.avatarUrl} />
                                                                    <AvatarFallback className="bg-primary/5 text-primary font-black uppercase text-lg">
                                                                        {member.name.charAt(0)}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                            </div>
                                                            <div>
                                                                <p className="font-black text-lg">{member.name}</p>
                                                                <div className="flex flex-col gap-0.5">
                                                                    <span className="text-[10px] text-muted-foreground font-bold">{formatUserIdentifier(member.email)}</span>
                                                                    <span className="text-[10px] text-primary/70 font-black uppercase tracking-tighter">Niveau {userProfile?.level || 1} • {userProfile?.xp || 0} XP (Foyer)</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-10 w-10 text-destructive/40 hover:text-destructive hover:bg-destructive/10 transition-colors rounded-xl"
                                                            onClick={() => handleRemoveMember(member.id, member.email, member.name)}
                                                        >
                                                            <Trash2 className="h-5 w-5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            )) : (
                                                <div className="p-10 border-2 border-dashed rounded-[2.5rem] text-center bg-accent/5">
                                                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/40 italic">Vous êtes seul pour le moment</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-8 p-6 rounded-3xl bg-blue-500/5 border-2 border-blue-500/10 space-y-4">
                                            <div className="flex items-center gap-3 text-blue-500">
                                                <ChefHat className="h-5 w-5" />
                                                <span className="text-sm font-black uppercase tracking-widest">Rôle: Chef de foyer</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                                                En tant que chef, vous avez le contrôle total sur qui peut voir votre planning et participer à la cuisine.
                                                Les membres invités héritent de la confidentialité de votre foyer.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </main>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </div>
    );
}

