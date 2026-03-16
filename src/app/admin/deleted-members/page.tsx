'use client';

import { useState } from 'react';
import { AppHeader } from "@/components/layout/app-header";
import { Sidebar } from "@/components/dashboard/sidebar";
import { SidebarProvider, Sidebar as AppSidebar, SidebarInset } from "@/components/ui/sidebar";
import { useFirebase, useUser, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { collection, doc, query, where, updateDoc, Timestamp, orderBy } from "firebase/firestore";
import { Trash2, Loader2, Copy, Check, Filter, Calendar, Mail, User, ShieldAlert, ArrowRightLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { UserProfile } from "@/lib/types";
import { useToast } from '@/hooks/use-toast';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function DeletedMembersAdminPage() {
    const { user, isUserLoading } = useUser();
    const { firestore } = useFirebase();
    const router = useRouter();
    const { toast } = useToast();
    const [isCleanedView, setIsCleanedView] = useState(false);

    const userProfileRef = useMemoFirebase(() => {
        if (!user) return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

    // --- Deleted Members Logic ---
    const deletedMembersQuery = useMemoFirebase(() => {
        const status = isCleanedView ? 'cleaned' : 'new';
        return query(
            collection(firestore, 'deletedMembers'),
            where('status', '==', status),
            orderBy('deletedAt', 'desc')
        );
    }, [firestore, isCleanedView]);

    const { data: deletedMembers, isLoading: isMembersLoading } = useCollection<any>(deletedMembersQuery);

    useEffect(() => {
        if (!isProfileLoading && userProfile?.role !== 'admin') {
            router.replace('/dashboard');
        }
    }, [isProfileLoading, userProfile, router]);

    const handleCopyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Email copié !", description: "L'email fantôme est dans votre presse-papier." });
    };

    const handleMarkAsCleaned = async (memberId: string) => {
        try {
            await updateDoc(doc(firestore, 'deletedMembers', memberId), {
                status: 'cleaned',
                cleanedAt: Timestamp.now()
            });
            toast({ title: "Membre archivé", description: "Le membre a été déplacé dans la section 'Nettoyer'." });
        } catch (e) {
            toast({ variant: "destructive", title: "Erreur lors de l'archivage" });
        }
    };

    const handleRestoreToNew = async (memberId: string) => {
        try {
            await updateDoc(doc(firestore, 'deletedMembers', memberId), {
                status: 'new'
            });
            toast({ title: "Membre restauré", description: "Le membre a été déplacé dans la section 'Nouveaux'." });
        } catch (e) {
            toast({ variant: "destructive", title: "Erreur lors de la restauration" });
        }
    };

    if (isUserLoading || isProfileLoading || !user || userProfile?.role !== 'admin') {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="h-screen w-full bg-background font-body">
            <SidebarProvider>
                <AppSidebar collapsible="icon" className="w-80 peer hidden md:block" variant="sidebar">
                    <Sidebar goals="Admin" setGoals={() => { }} meals={[]} />
                </AppSidebar>
                <SidebarInset>
                    <div className="flex h-full flex-1 flex-col">
                        <AppHeader
                            title="Membres Supprimés"
                            icon={<Trash2 className="h-6 w-6" />}
                            user={user}
                            sidebarProps={{ goals: "Admin", setGoals: () => { }, meals: [] }}
                        />
                        <main className="flex-1 overflow-y-auto p-4 md:p-8">
                            <div className="max-w-6xl mx-auto space-y-8">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <h1 className="text-3xl font-black tracking-tighter uppercase">Modération des Bannis</h1>
                                        <p className="text-muted-foreground text-sm">Gérez les anciens membres de famille ayant été exclus par leur chef.</p>
                                    </div>
                                    <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-2xl border border-border/50">
                                        <div className="flex items-center gap-2">
                                            <Label htmlFor="view-mode" className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                                                {isCleanedView ? "Vue : Archivés (Nettoyer)" : "Vue : Nouveaux"}
                                            </Label>
                                            <Switch
                                                id="view-mode"
                                                checked={isCleanedView}
                                                onCheckedChange={setIsCleanedView}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {isMembersLoading ? (
                                    <div className="flex justify-center p-20">
                                        <Loader2 className="h-10 w-10 animate-spin text-primary/30" />
                                    </div>
                                ) : (
                                    <div className="grid gap-4">
                                        {deletedMembers && deletedMembers.length > 0 ? (
                                            deletedMembers.map((member: any) => (
                                                <Card key={member.id} className="overflow-hidden border-2 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow">
                                                    <CardContent className="p-0">
                                                        <div className="flex flex-col md:flex-row md:items-center">
                                                            {/* User Info */}
                                                            <div className="flex-1 p-6 md:p-8 flex items-center gap-5 border-b md:border-b-0 md:border-r border-border/50">
                                                                <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground border-2 border-border/20">
                                                                    <User className="h-8 w-8" />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <h3 className="text-xl font-black tracking-tight">{member.name}</h3>
                                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-bold italic">
                                                                        <ShieldAlert className="h-3 w-3 text-destructive" />
                                                                        <span>Retiré par {member.removedBy}</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Details */}
                                                            <div className="flex-1 p-6 md:p-8 bg-muted/5 space-y-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="h-8 w-8 rounded-full bg-primary/5 flex items-center justify-center">
                                                                        <Mail className="h-4 w-4 text-primary/40" />
                                                                    </div>
                                                                    <div className="flex-1 overflow-hidden">
                                                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">E-mail fantôme</p>
                                                                        <p className="text-xs font-bold truncate">{member.email}</p>
                                                                    </div>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="icon"
                                                                        className="rounded-xl h-10 w-10"
                                                                        onClick={() => handleCopyToClipboard(member.email)}
                                                                    >
                                                                        <Copy className="h-4 w-4" />
                                                                    </Button>
                                                                </div>

                                                                <div className="flex items-center gap-3">
                                                                    <div className="h-8 w-8 rounded-full bg-primary/5 flex items-center justify-center">
                                                                        <Calendar className="h-4 w-4 text-primary/40" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date de bannissement</p>
                                                                        <p className="text-xs font-bold italic">
                                                                            {member.deletedAt ? format(member.deletedAt.toDate(), 'PPP à HH:mm', { locale: fr }) : 'Date inconnue'}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Actions */}
                                                            <div className="p-6 md:p-8 bg-muted/20 flex md:flex-col items-center justify-center gap-3 border-t md:border-t-0 md:border-l border-border/50">
                                                                {!isCleanedView ? (
                                                                    <Button
                                                                        onClick={() => handleMarkAsCleaned(member.id)}
                                                                        className="w-full h-12 rounded-2xl font-black uppercase tracking-widest text-[10px]"
                                                                    >
                                                                        Archiver (Nettoyer)
                                                                        <Check className="ml-2 h-4 w-4" />
                                                                    </Button>
                                                                ) : (
                                                                    <Button
                                                                        variant="outline"
                                                                        onClick={() => handleRestoreToNew(member.id)}
                                                                        className="w-full h-12 rounded-2xl font-black uppercase tracking-widest text-[10px]"
                                                                    >
                                                                        Restaurer
                                                                        <ArrowRightLeft className="ml-2 h-4 w-4" />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))
                                        ) : (
                                            <div className="flex flex-col items-center justify-center p-20 border-2 border-dashed rounded-[3rem] bg-accent/5 text-center space-y-4">
                                                <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center">
                                                    <Filter className="h-10 w-10 text-muted-foreground/20" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Aucun membre trouvé</p>
                                                    <p className="text-[10px] text-muted-foreground/40 italic">La liste des bannis est vide pour cette section.</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </main>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </div>
    );
}
