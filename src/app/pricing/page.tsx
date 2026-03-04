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

const plans = [
  {
    name: 'Welcome',
    price: '1,99€',
    annualPrice: '21,49€',
    annualDiscount: '10%',
    description: 'Essentiel pour les débutants.',
    icon: Zap,
    features: ['Planification intelligente', 'Analyse nutritionnelle', 'Liste de courses auto', 'Mode hors-ligne'],
    isPopular: false,
    color: 'from-blue-500/20 to-cyan-500/20',
    glow: 'bg-blue-500/10',
    // Bouton clair visible sans survol : fond semi-opaque + texte foreground + active bien contrasté
    btnClass: 'bg-foreground/10 border-2 border-foreground/20 text-foreground active:bg-foreground active:text-background',
  },
  {
    name: 'Éco',
    price: '4,60€',
    annualPrice: '46,92€',
    annualDiscount: '15%',
    description: 'Le meilleur rapport qualité-prix.',
    icon: Shield,
    features: ["IA d'apprentissage profond", 'Optimisation budget expert', "Score d'équilibre IA", 'Partage familial (2 profils)', 'Recettes personnalisées'],
    isPopular: true,
    color: 'from-primary/20 to-emerald-500/20',
    glow: 'bg-primary/20',
    btnClass: 'bg-primary text-primary-foreground shadow-2xl shadow-primary/30 active:opacity-90',
  },
  {
    name: 'Premium',
    price: '15€',
    annualPrice: '135€',
    annualDiscount: '25%',
    description: "L'expérience ultime.",
    icon: Crown,
    features: ['Coaching IA illimité', 'Accès My Cook Market', 'Planification multi-profils', 'Guide restaurants IA', 'Support Ultra-prioritaire'],
    isPopular: false,
    color: 'from-purple-500/20 to-pink-500/20',
    glow: 'bg-purple-500/10',
    btnClass: 'bg-foreground/10 border-2 border-foreground/20 text-foreground active:bg-foreground active:text-background',
  },
];

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
    /* overflow-x-hidden bloque le glissement gauche/droite sur mobile */
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-start overflow-x-hidden overflow-y-auto">
      <div className="w-full max-w-[900px] px-4 py-8 md:py-12 space-y-8">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex flex-col items-center text-center gap-5">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-white rounded-xl shadow-xl flex items-center justify-center -rotate-3">
              <LogoIcon className="w-8 h-8" />
            </div>
            <p className="text-primary font-black text-[10px] tracking-[0.3em] uppercase">My Cook Flex Premium</p>
          </div>
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center shadow-inner">
            <Crown className="h-7 w-7 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl md:text-4xl font-black tracking-tighter">Choisissez votre Énergie</h1>
            <p className="text-muted-foreground font-medium max-w-[380px] mx-auto leading-relaxed text-sm">
              Une expérience sans compromis, sans carte bancaire demandée.
            </p>
          </div>
        </div>

        {/* ── Cards + Dialog ──────────────────────────────────────── */}
        <AlertDialog>

          {/* Grid : pas de translate/hover pour ne pas bouger sur mobile */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-full">
            {plans.map((plan) => {
              const Icon = plan.icon;
              return (
                <Card
                  key={plan.name}
                  className={cn(
                    'relative flex flex-col rounded-[2rem] border-2 overflow-hidden',
                    plan.isPopular
                      ? 'border-primary bg-primary/[0.03] shadow-[0_0_40px_-15px_rgba(var(--primary),0.3)] md:scale-105 md:z-10'
                      : 'border-muted-foreground/10 bg-background'
                  )}
                >
                  {/* Glow décoratif */}
                  <div className={cn("absolute -top-20 -right-20 w-40 h-40 blur-[60px] rounded-full opacity-25 pointer-events-none", plan.glow)} />

                  {plan.isPopular && (
                    <div className="absolute top-5 right-5 z-10">
                      <div className="flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[9px] font-black uppercase tracking-widest text-primary-foreground shadow-lg shadow-primary/20">
                        <Star className="h-2.5 w-2.5 fill-current" /> Recommandé
                      </div>
                    </div>
                  )}

                  <CardHeader className="p-5 md:p-6 pb-2">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br shadow-inner", plan.color)}>
                      <Icon className="h-5 w-5 text-foreground" />
                    </div>
                    <CardTitle className="text-xl font-black tracking-tight">{plan.name}</CardTitle>
                    <CardDescription className="font-bold text-muted-foreground/80 text-sm">{plan.description}</CardDescription>
                    <div className="pt-4 space-y-0.5">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black tracking-tighter">{plan.price}</span>
                        <span className="text-muted-foreground font-bold text-xs">/mois</span>
                      </div>
                      <p className="text-[9px] uppercase font-black tracking-widest text-primary/60">
                        ou {plan.annualPrice}/an (Économisez {plan.annualDiscount})
                      </p>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 p-5 md:p-6 pt-0 space-y-3">
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-muted-foreground/10 to-transparent" />
                    <ul className="space-y-2">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-3">
                          <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0 shadow-[0_0_6px_rgba(var(--primary),0.4)]" />
                          <span className="text-xs font-bold text-muted-foreground/90 leading-snug">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter className="p-5 md:p-6 pt-2">
                    <AlertDialogTrigger asChild>
                      <Button className={cn("w-full h-12 rounded-xl font-black text-sm transition-all duration-150", plan.btnClass)}>
                        Choisir {plan.name}
                      </Button>
                    </AlertDialogTrigger>
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          {/* CTA secondaire */}
          <div className="flex flex-col items-center gap-4 mt-8">
            <div className="flex items-center gap-4 text-muted-foreground/20">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-current" />
              <Sparkles className="h-4 w-4" />
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-current" />
            </div>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="h-12 px-8 font-black text-[11px] tracking-[0.2em] uppercase rounded-full border-2 border-primary/20 text-primary bg-primary/5 active:bg-primary active:text-primary-foreground">
                Commencer l'essai gratuit maintenant
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
          </div>

          {/* Dialog bêta */}
          <AlertDialogContent className="rounded-[2rem] border-2 border-primary/20 bg-background/95 backdrop-blur-2xl max-w-md p-6 md:p-8 mx-4 overflow-hidden">
            <div className="absolute -top-20 -right-20 w-48 h-48 bg-primary/10 blur-[80px] rounded-full pointer-events-none" />
            <AlertDialogHeader className="items-center text-center space-y-4 relative z-10">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center -rotate-6 border border-primary/5">
                <LogoIcon className="w-10 h-10" />
              </div>
              <AlertDialogTitle className="text-2xl font-black tracking-tighter">Accès Bêta Prioritaire</AlertDialogTitle>
              <AlertDialogDescription className="text-base font-bold text-muted-foreground/80 leading-relaxed">
                Félicitations ! En tant que pionnier, My Cook Flex vous est offert
                <span className="text-primary font-black ml-1">gratuitement</span> pendant toute la durée de la bêta.
                <br /><br />
                Accédez à l'intégralité des outils sans aucun frais dès maintenant.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="pt-6 relative z-10">
              <AlertDialogAction
                onClick={handleConfirmBeta}
                className="w-full h-14 rounded-xl text-lg font-black bg-primary text-primary-foreground shadow-2xl shadow-primary/30"
              >
                Activer mon accès <ArrowRight className="ml-2 h-5 w-5" />
              </AlertDialogAction>
            </div>
          </AlertDialogContent>

        </AlertDialog>

        <p className="text-center text-muted-foreground/30 text-[8px] font-black uppercase tracking-[0.3em] pb-8">
          Secure encrypted checkout • Next-Gen meal planning
        </p>
      </div>
    </div>
  );
}
