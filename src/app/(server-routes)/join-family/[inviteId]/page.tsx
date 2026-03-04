
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirebase } from '@/firebase';
import { doc, getDoc, updateDoc, setDoc, Timestamp } from 'firebase/firestore';
import {
    createUserWithEmailAndPassword,
    updateProfile,
    signOut
} from 'firebase/auth';
import {
    Users,
    ShieldCheck,
    Key,
    User,
    ArrowRight,
    Loader2,
    Lock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { getInviteAction } from '../../actions';

export default function JoinFamilyPage() {
    const { inviteId } = useParams();
    const router = useRouter();
    const { auth, firestore } = useFirebase();
    const { toast } = useToast();

    const [invite, setInvite] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const phoneCountries = [
        { name: 'France', code: '+33', flag: '🇫🇷' },
        { name: 'Belgique', code: '+32', flag: '🇧🇪' },
        { name: 'Suisse', code: '+41', flag: '🇨🇭' },
        { name: 'Togo', code: '+228', flag: '🇹🇬' },
        { name: 'Côte d\'Ivoire', code: '+225', flag: '🇨🇮' },
        { name: 'Sénégal', code: '+221', flag: '🇸🇳' },
        { name: 'Cameroun', code: '+237', flag: '🇨🇲' },
        { name: 'Canada', code: '+1', flag: '🇨🇦' },
    ];

    const getFlag = (phone: string) => {
        if (!phone) return '🌐';
        const sorted = [...phoneCountries].sort((a, b) => b.code.length - a.code.length);
        const match = sorted.find(c => phone.startsWith(c.code));
        return match ? match.flag : '🌐';
    };

    useEffect(() => {
        const fetchInvite = async () => {
            if (!inviteId) return;
            setIsLoading(true);
            try {
                const { invite: inviteData, error: inviteError } = await getInviteAction(inviteId as string);
                if (inviteError || !inviteData) {
                    setError(inviteError || 'Invitation introuvable');
                } else {
                    setInvite(inviteData);
                    setName((inviteData as any).name);
                }
            } catch (e) {
                setError("Impossible de charger l'invitation.");
            } finally {
                setIsLoading(false);
            }
        };
        signOut(auth).then(() => fetchInvite());
    }, [inviteId, auth]);

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!invite || !password || password.length < 6) {
            toast({ variant: "destructive", title: "Erreur", description: "Le mot de passe doit faire au moins 6 caractères." });
            return;
        }
        setIsJoining(true);
        const email = `foyer${invite.phone.replace(/\+/g, '')}@cook.flex`;
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            const userProfile = {
                id: user.uid, name, email,
                chefId: invite.chefId, role: 'user',
                phoneNumber: invite.phone || '', xp: 0, level: 1, streak: 0,
                targetCalories: 2000, createdAt: Timestamp.now(), isAITrainingEnabled: true,
                origin: invite.chefName ? `Cuisine familiale (${invite.chefName})` : 'Cuisine familiale',
            };
            const userDocRef = doc(firestore, 'users', user.uid);
            const existingDoc = await getDoc(userDocRef);
            if (existingDoc.exists()) {
                await updateDoc(userDocRef, { chefId: invite.chefId, role: 'user', origin: userProfile.origin });
            } else {
                await setDoc(userDocRef, userProfile);
            }
            await updateDoc(doc(firestore, 'invites', invite.id), { status: 'accepted' });
            toast({ title: "Bienvenue dans la famille !", description: `Vous avez rejoint le foyer de ${invite.chefName}.` });
            router.push('/dashboard');
        } catch (error: any) {
            let msg = "Une erreur est survenue lors de l'inscription.";
            if (error.code === 'auth/email-already-in-use') msg = "Ce numéro est déjà associé à un compte.";
            toast({ variant: "destructive", title: "Échec de l'inscription", description: msg });
        } finally {
            setIsJoining(false);
        }
    };

    if (isLoading) return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-[#0a0a0a]">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
            <p className="mt-8 text-muted-foreground font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Activation du lien sécurisé...</p>
        </div>
    );

    if (error) return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-[#0a0a0a] p-6 text-center">
            <div className="h-24 w-24 bg-destructive/10 rounded-[2.5rem] flex items-center justify-center mb-8 rotate-12"><ShieldCheck className="h-12 w-12 text-destructive" /></div>
            <h1 className="text-3xl font-black text-white tracking-tighter">Lien Invalide</h1>
            <p className="text-muted-foreground max-w-sm mt-4 font-medium leading-relaxed">{error}</p>
            <Button className="mt-10 h-14 px-10 rounded-2xl bg-white text-black hover:bg-white/90 font-black uppercase tracking-widest text-xs" onClick={() => router.push('/login')}>Retour à l'accueil</Button>
        </div>
    );

    return (
        <div className="min-h-screen w-full bg-[#050505] flex justify-center p-4 overflow-y-auto">
            <Card className="max-w-md w-full my-auto rounded-[3rem] border border-white/5 bg-black/40 backdrop-blur-3xl shadow-2xl relative z-10 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                <CardHeader className="p-8 md:p-10 text-center space-y-4">
                    <div className="mx-auto h-20 w-20 bg-primary/10 rounded-[2rem] flex items-center justify-center"><Users className="h-10 w-10 text-primary" /></div>
                    <div className="space-y-1">
                        <CardTitle className="text-2xl md:text-3xl font-black text-white tracking-tighter">Rejoindre {invite.chefName}</CardTitle>
                        <CardDescription className="text-xs font-bold uppercase tracking-[0.2em] text-primary/60">Invitation Privée MyFlex</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="p-8 md:p-10 pt-0 space-y-8">
                    <form onSubmit={handleJoin} className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-2">Votre Identifiant (Téléphone)</label>
                                <div className="h-14 px-5 flex items-center gap-4 bg-white/[0.03] border border-white/5 rounded-2xl">
                                    <span className="text-xl">{getFlag(invite.phone)}</span>
                                    <span className="text-white/60 font-black text-lg tracking-tight">{invite.phone}</span>
                                    <Lock className="h-4 w-4 text-muted-foreground/20 ml-auto" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Votre Prénom</label>
                                <div className="relative"><Input type="text" placeholder="Comment on vous appelle ?" value={name} onChange={(e) => setName(e.target.value)} className="h-14 pl-12 rounded-2xl border-white/5 bg-white/[0.03] text-white font-bold focus-visible:ring-primary/20" required /><User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20" /></div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Créer votre mot de passe</label>
                                <div className="relative"><Input type="password" placeholder="Min. 6 caractères" value={password} onChange={(e) => setPassword(e.target.value)} className="h-14 pl-12 rounded-2xl border-white/5 bg-white/[0.03] text-white font-bold focus-visible:ring-primary/20" required minLength={6} /><Key className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20" /></div>
                            </div>
                        </div>
                        <Button type="submit" className="w-full h-16 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all" disabled={isJoining}>
                            {isJoining ? <Loader2 className="h-6 w-6 animate-spin" /> : <><span>Rejoindre le foyer</span><ArrowRight className="ml-3 h-5 w-5" /></>}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="p-8 border-t border-white/5 bg-white/[0.01] flex flex-col gap-4">
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground/60 font-black uppercase tracking-widest"><ShieldCheck className="h-4 w-4 text-primary" />Connexion sécurisée Chiffrée</div>
                </CardFooter>
            </Card>
        </div>
    );
}
