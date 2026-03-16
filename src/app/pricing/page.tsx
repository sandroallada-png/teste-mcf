'use client';

import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { LogoIcon } from '@/components/icons';
import { useLoading } from '@/contexts/loading-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Star, Zap, Shield, Crown, ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const singlePlan = {
  name: 'Premium Illimité',
  price: '2,00€',
  description: 'Tout MyCookFlex sans aucune limite.',
  icon: Crown,
  features: [
    'Planification intelligente par IA',
    'Analyse nutritionnelle complète',
    'Liste de courses intelligente',
    'Coaching IA illimité',
    'Mode hors-ligne complet',
    'Partage familial inclus',
  ],
  color: 'from-primary/20 to-emerald-500/20',
  glow: 'bg-primary/20',
  btnClass: 'bg-primary text-primary-foreground shadow-2xl shadow-primary/30 active:opacity-90',
};

export default function PricingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const { firestore } = useFirebase();
  const { showLoading, hideLoading } = useLoading();

  const handleConfirmBeta = async () => {
    if (!user) {
      toast({ title: "Connexion requise", description: "Veuillez vous connecter.", variant: "destructive" });
      return;
    }
    showLoading("Initialisation de votre accès...");
    try {
      await updateDoc(doc(firestore, 'users', user.uid), { subscriptionStatus: 'free' });
      setTimeout(() => router.push('/avatar-selection'), 1000);
    } catch {
      toast({ title: "Erreur technique", description: "Impossible d'activer votre essai.", variant: "destructive" });
      hideLoading();
    }
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-start overflow-x-hidden overflow-y-auto">
      <div className="w-full max-w-[600px] px-4 py-8 md:py-20 space-y-12">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex flex-col items-center text-center gap-6">
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 bg-white rounded-[1.5rem] shadow-2xl flex items-center justify-center -rotate-3 border border-primary/5">
              <LogoIcon className="w-9 h-9" />
            </div>
            <p className="text-primary font-black text-[10px] tracking-[0.4em] uppercase opacity-70">L'Excellence Culinaire</p>
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter leading-none">Un Plan Unique.<br /><span className="text-primary">Une Liberté Totale.</span></h1>
            <p className="text-muted-foreground font-medium max-w-[340px] mx-auto leading-relaxed text-sm md:text-base italic">
              Simple, transparent et accessible à tous, sans carte bancaire demandée.
            </p>
          </div>
        </div>

        {/* ── Single Plan Card ────────────────────────────────────── */}
        <AlertDialog>
          <div className="flex justify-center w-full">
            <Card className="relative flex flex-col rounded-[2.5rem] border-2 border-primary bg-primary/[0.02] shadow-[0_0_50px_-15px_rgba(var(--primary),0.2)] w-full max-w-sm overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-700">
              <div className="absolute -top-20 -right-20 w-48 h-48 blur-[70px] rounded-full opacity-30 pointer-events-none bg-primary/20" />

              <div className="absolute top-6 right-6">
                <div className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-primary-foreground shadow-xl shadow-primary/20">
                  <Star className="h-3 w-3 fill-current" /> Offre Spéciale
                </div>
              </div>

              <CardHeader className="p-8 pb-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 bg-primary/10 shadow-inner">
                  <Crown className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl font-black tracking-tight">{singlePlan.name}</CardTitle>
                <CardDescription className="font-bold text-muted-foreground/80 text-sm mt-1">{singlePlan.description}</CardDescription>
                <div className="pt-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black tracking-tighter text-primary">{singlePlan.price}</span>
                    <span className="text-muted-foreground font-bold text-sm">/mois</span>
                  </div>
                  <p className="text-[10px] uppercase font-black tracking-widest text-primary/40 mt-2">
                    Sans engagement • Annulable à tout moment
                  </p>
                </div>
              </CardHeader>

              <CardContent className="p-8 pt-0 space-y-4">
                <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                <ul className="space-y-3">
                  {singlePlan.features.map((f) => (
                    <li key={f} className="flex items-center gap-4">
                      <div className="h-2 w-2 rounded-full bg-primary shrink-0 shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                      <span className="text-sm font-bold text-foreground/80">{f}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="p-8 pt-4">
                <AlertDialogTrigger asChild>
                  <Button className="w-full h-14 rounded-2xl font-black text-base uppercase tracking-widest bg-primary text-primary-foreground shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all">
                    Débloquer Tout <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </AlertDialogTrigger>
              </CardFooter>
            </Card>
          </div>

          {/* CTA "Commencer Gratuitement" */}
          <div className="flex flex-col items-center gap-6 mt-4">
            <div className="flex items-center gap-4 text-muted-foreground/10">
              <div className="h-px w-12 bg-current" />
              <Sparkles className="h-4 w-4" />
              <div className="h-px w-12 bg-current" />
            </div>

            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="group h-14 px-10 font-black text-xs tracking-[0.2em] uppercase rounded-full border-2 border-primary/20 text-primary hover:bg-primary/5 transition-all">
                Commencer gratuitement
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </AlertDialogTrigger>
          </div>

          {/* Dialog bêta */}
          <AlertDialogContent className="rounded-[3rem] border-2 border-primary/20 bg-background/95 backdrop-blur-3xl max-w-md p-8 mx-4 overflow-hidden border-none shadow-[0_0_80px_-20px_rgba(var(--primary),0.3)]">
            <div className="absolute -top-24 -right-24 w-56 h-56 bg-primary/15 blur-[100px] rounded-full pointer-events-none" />
            <AlertDialogHeader className="items-center text-center space-y-6 relative z-10">
              <div className="w-20 h-20 bg-white rounded-3xl shadow-2xl flex items-center justify-center -rotate-6 border border-primary/5">
                <LogoIcon className="w-12 h-12" />
              </div>
              <div className="space-y-2">
                <AlertDialogTitle className="text-3xl font-black tracking-tighter">Accès Privilégié</AlertDialogTitle>
                <div className="h-1 w-12 bg-primary mx-auto rounded-full" />
              </div>
              <AlertDialogDescription className="text-base font-bold text-muted-foreground/90 leading-relaxed">
                En tant qu'utilisateur précurseur, MyCookFlex vous est offert
                <span className="text-primary font-black ml-1 uppercase tracking-widest text-lg block mt-2 animate-pulse">Entièrement Gratuit</span>
                pendant toute la phase de lancement.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="pt-8 relative z-10">
              <AlertDialogAction
                onClick={handleConfirmBeta}
                className="w-full h-16 rounded-2xl text-lg font-black uppercase tracking-widest bg-primary text-primary-foreground shadow-2xl shadow-primary/40 hover:opacity-90 transition-opacity"
              >
                Activer maintenant <ArrowRight className="ml-3 h-6 w-6" />
              </AlertDialogAction>
            </div>
          </AlertDialogContent>

        </AlertDialog>

        <p className="text-center text-muted-foreground/20 text-[9px] font-black uppercase tracking-[0.4em] pb-10">
          No credit card required • Powered by Next-Gen AI
        </p>
      </div>
    </div>
  );
}
