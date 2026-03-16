
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo, LogoIcon, GoogleIcon } from '@/components/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth } from '@/firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useLoading } from '@/contexts/loading-context';
import { updateProfile } from 'firebase/auth';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import { doc, setDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useFirebase, addDocumentNonBlocking } from '@/firebase';
import { useAuthContext } from '@/components/auth/auth-provider';
import { initiateEmailSignUp, initiateGoogleSignIn } from '@/firebase/auth-actions';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import Image from 'next/image';
import Autoplay from 'embla-carousel-autoplay';

const carouselItems = [
  { image: '/mcf/17.png' },
  { image: '/mcf/18.png' },
  { image: '/mcf/19.png' },
  { image: '/mcf/20.png' },
  { image: '/mcf/21.png' }
];

const countries = [
  // Europe
  "France", "Belgique", "Suisse", "Luxembourg", "Allemagne", "Italie", "Espagne", "Portugal", "Royaume-Uni", "Pays-Bas",
  // Amériques
  "Canada", "États-Unis", "Brésil", "Mexique", "Argentine"
].sort();

const ages = Array.from({ length: 86 }, (_, i) => (i + 14).toString());

export default function RegisterPage() {
  const router = useRouter();
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const { showLoading, hideLoading } = useLoading();
  const { user, loading } = useAuthContext();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState('');
  const [country, setCountry] = useState('');
  const [referral, setReferral] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [api, setApi] = useState<any>();
  const [current, setCurrent] = useState(0);

  const autoplay = useRef(Autoplay({ delay: 5000, stopOnInteraction: false }));

  // Persistence: Load data on mount
  useEffect(() => {
    const savedData = localStorage.getItem('mcf_register_draft');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        if (data.name) setName(data.name);
        if (data.email) setEmail(data.email);
        if (data.password) setPassword(data.password);
        if (data.age) setAge(data.age);
        if (data.country) setCountry(data.country);
        if (data.referral) setReferral(data.referral);
        if (data.step) setStep(data.step);
        if (data.showForm) setShowForm(data.showForm);
      } catch (e) {
        console.error("Failed to load registration draft", e);
      }
    }
  }, []);

  // Persistence: Save data on change
  useEffect(() => {
    const draft = { name, email, password, age, country, referral, step, showForm };
    localStorage.setItem('mcf_register_draft', JSON.stringify(draft));
  }, [name, email, password, age, country, referral, step, showForm]);

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const togglePasswordVisibility = () => setIsPasswordVisible(!isPasswordVisible);

  const handleNextStep = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (step === 1) {
      if (!name || !email || !password) {
        toast({ variant: "destructive", title: "Champs requis", description: "Veuillez remplir vos informations de base." });
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!age || !referral || !country) {
        toast({ variant: "destructive", title: "Champs requis", description: "Veuillez préciser votre âge, votre pays et comment vous nous avez connus." });
        return;
      }
      setStep(3);
    }
  };

  const handleBackStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleFinalRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    showLoading("Création de votre espace...");

    try {
      const userCredential = await initiateEmailSignUp(auth, email, password);

      if (userCredential && userCredential.user) {
        const user = userCredential.user;
        await updateProfile(user, { displayName: name });

        const userDocRef = doc(firestore, 'users', user.uid);
        await setDoc(userDocRef, {
          id: user.uid,
          name: name,
          email: user.email,
          age: parseInt(age, 10),
          country: country,
          referralSource: referral,
          role: 'user',
          xp: 0,
          level: 1,
        }, { merge: true });

        const feedbackCollectionRef = collection(firestore, 'feedbacks');
        addDocumentNonBlocking(feedbackCollectionRef, {
          userId: user.uid,
          userName: name,
          rating: 0,
          comment: `Nouvelle inscription : ${name}`,
          page: `Source: ${referral}`,
          status: 'new',
          createdAt: serverTimestamp(),
        });

        router.push('/personalization');
        localStorage.removeItem('mcf_register_draft');
      }
    } catch (error: any) {
      console.error("Registration failed:", error);
      toast({ variant: "destructive", title: "Erreur", description: "Une erreur est survenue lors de l'inscription." });
      hideLoading();
    }
  };

  const handleGoogleSignIn = async () => {
    showLoading("Connexion sécurisée...");
    try {
      await initiateGoogleSignIn(auth);
    } catch (error) {
      console.error("Google sign in failed:", error);
      hideLoading();
    }
  };

  if (loading || user) return null;

  return (
    <div className="flex min-h-screen w-full lg:grid lg:grid-cols-2 lg:h-screen lg:overflow-hidden bg-background">

      {/* Left Pane - Carousel (Fixed on Desktop) */}
      <div className={`
        ${showForm ? 'hidden lg:flex' : 'flex'} 
        bg-primary flex-col items-center justify-center relative overflow-hidden w-full h-screen lg:sticky lg:top-0
      `}>
        <div className="absolute inset-0 z-0">
          <Carousel setApi={setApi} plugins={[autoplay.current]} className="w-full h-full" opts={{ loop: true }}>
            <CarouselContent className="h-screen -ml-0">
              {carouselItems.map((item, index) => (
                <CarouselItem key={index} className="pl-0 relative h-screen bg-[#347d1c] flex items-center justify-center lg:block text-white">
                  <div className="hidden lg:block absolute inset-0">
                    <Image src={item.image} alt="Cuisine" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" priority={index === 0} />
                  </div>
                  <div className="lg:hidden relative w-full h-full flex items-center justify-center p-6 sm:p-12">
                    <div className="absolute top-12 left-1/2 -translate-x-1/2 w-full h-full max-w-[500px] max-h-[500px] bg-white/5 blur-[120px] rounded-full" />
                    <div className="relative w-full max-w-[360px] aspect-[9/14] bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-2xl rounded-[3.5rem] border border-white/20 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.4)] overflow-hidden flex items-center justify-center self-center mb-12">
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-transparent pointer-events-none" />
                      <div className="relative w-full h-full p-10">
                        <Image src={item.image} alt="Cuisine" fill sizes="(max-width: 1024px) 100vw, 400px" className="object-contain p-4 scale-125 rounded-[2.5rem]" />
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
        <div className="absolute bottom-40 lg:bottom-36 left-0 right-0 z-20 flex justify-center gap-2">
          {carouselItems.map((_, index) => (
            <div key={index} className={`h-2 w-2 rounded-full transition-all duration-300 ${current === index ? 'bg-white w-6' : 'bg-white/40'}`} />
          ))}
        </div>
        <div className="lg:hidden absolute bottom-12 left-0 right-0 px-6 z-20">
          <Button onClick={() => setShowForm(true)} className="w-full h-14 text-lg font-bold shadow-2xl bg-white text-primary hover:bg-gray-100 border-none">Continuer vers l'inscription</Button>
        </div>
        <div className="absolute top-12 left-12 z-10 flex flex-col gap-2">
          <div className="p-4 rounded-2xl backdrop-blur-md bg-black/20 border border-white/10 shadow-2xl">
            <Logo className="w-32 h-auto brightness-0 invert" />
            <p className="text-white/80 text-[10px] font-medium tracking-wide mt-1">L'art de cuisiner intelligemment.</p>
          </div>
        </div>
      </div>

      {/* Right Pane - Professional Multi-step Form */}
      <div className={`${showForm ? 'flex' : 'hidden lg:flex'} w-full bg-background p-6 lg:p-12 lg:h-full lg:overflow-y-auto relative justify-center`}>
        <div className="mx-auto w-full max-w-[420px] py-12 space-y-12">
          {/* Step Progress Indicator (Enhanced) - Now in normal flow */}
          <div className="flex items-center justify-center gap-3 w-full px-6">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`h-2 rounded-full transition-all duration-700 ${s === step ? 'w-12 bg-primary' : 'w-2 bg-muted'} ${s < step ? 'bg-primary/40' : ''}`} />
            ))}
          </div>

          <div className="flex flex-col items-center gap-3 text-center">
            <div>
              <h1 className="text-4xl font-black tracking-tight">
                {step === 1 && "Créer un compte"}
                {step === 2 && "Profil"}
                {step === 3 && "Vérification"}
              </h1>
              <p className="text-muted-foreground mt-2 font-medium max-w-[300px] mx-auto leading-relaxed">
                {step === 1 && "Rejoignez la communauté My Cook Flex."}
                {step === 2 && "Parlez-nous un peu de vous."}
                {step === 3 && "Tout semble correct ?"}
              </p>
            </div>
          </div>

          <div className="relative min-h-[400px]">
            {step === 1 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="grid gap-4">
                  <Button
                    variant="outline"
                    className="h-14 text-base font-bold border-2 hover:bg-muted relative overflow-hidden group transition-all hover:scale-[1.02] active:scale-95"
                    onClick={handleGoogleSignIn}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-red-500/5 to-yellow-500/5 opacity-40 md:opacity-0 md:group-hover:opacity-100 transition-opacity" />
                    <GoogleIcon className="mr-3 h-5 w-5" />
                    Continuer avec Google
                  </Button>

                  <div className="relative py-4 flex items-center gap-4">
                    <div className="flex-1 h-px bg-muted-foreground/20" />
                    <span className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground">Ou</span>
                    <div className="flex-1 h-px bg-muted-foreground/20" />
                  </div>
                </div>

                <form onSubmit={handleNextStep} className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Nom Complet</Label>
                    <Input placeholder="Jean Dupont" value={name} onChange={e => setName(e.target.value)} className="h-14 border-2 rounded-2xl focus-visible:ring-primary focus-visible:border-primary text-base font-medium px-5" required />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">E-mail</Label>
                    <Input type="email" placeholder="jean@exemple.com" value={email} onChange={e => setEmail(e.target.value)} className="h-14 border-2 rounded-2xl focus-visible:ring-primary focus-visible:border-primary text-base font-medium px-5" required />
                  </div>
                  <div className="space-y-3 relative">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Mot de passe</Label>
                    <div className="relative group">
                      <Input type={isPasswordVisible ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="h-14 border-2 rounded-2xl pr-14 px-5 text-base" required />
                      <button type="button" onClick={togglePasswordVisibility} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors">
                        {isPasswordVisible ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                      </button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    variant="outline"
                    className="w-full h-16 text-lg font-black shadow-2xl shadow-primary/30 rounded-2xl group relative overflow-hidden text-primary border-2 border-primary/20 bg-primary/5 hover:bg-primary hover:!text-white transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full md:group-hover:translate-x-full transition-transform duration-1000" />
                    <span className="relative z-10 flex items-center justify-center">
                      Commencer
                      <ArrowLeft className="ml-3 h-5 w-5 rotate-180 group-hover:translate-x-2 transition-transform" />
                    </span>
                  </Button>
                </form>
              </div>
            )}

            {step === 2 && (
              <form onSubmit={handleNextStep} className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Âge</Label>
                    <Select onValueChange={setAge} value={age}>
                      <SelectTrigger className="h-16 border-2 rounded-2xl text-xl font-black text-center px-4">
                        <SelectValue placeholder="-" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-2">
                        {ages.map((a) => (
                          <SelectItem key={a} value={a}>{a} ans</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Pays</Label>
                    <Select onValueChange={setCountry} value={country}>
                      <SelectTrigger className="h-16 border-2 rounded-2xl text-base px-6 font-bold">
                        <SelectValue placeholder="Pays" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-2">
                        {countries.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Comment nous avez-vous connus ?</Label>
                  <Select onValueChange={setReferral} value={referral}>
                    <SelectTrigger className="h-16 border-2 rounded-2xl text-base px-6 font-medium">
                      <SelectValue placeholder="Sélectionner une source" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-2">
                      <SelectItem value="Insta">Instagram</SelectItem>
                      <SelectItem value="Tiktok">TikTok</SelectItem>
                      <SelectItem value="Google">Recherche Google</SelectItem>
                      <SelectItem value="Friend">Bouche à oreille</SelectItem>
                      <SelectItem value="Other">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-4 pt-6">
                  <Button variant="ghost" onClick={handleBackStep} className="h-16 flex-1 text-base font-bold rounded-2xl">Retour</Button>
                  <Button
                    type="submit"
                    variant="outline"
                    className="h-16 flex-[2] text-lg font-black shadow-xl shadow-primary/20 rounded-2xl text-primary border-2 border-primary/20 bg-primary/5 hover:bg-primary hover:!text-white transition-all duration-300"
                  >
                    Suivant
                  </Button>
                </div>
              </form>
            )}

            {step === 3 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="bg-primary/[0.03] border-2 border-primary/10 rounded-[2.5rem] p-8 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000" />

                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 bg-white rounded-2xl shadow-lg border border-primary/5 flex items-center justify-center transform -rotate-3 transition-transform group-hover:rotate-0 duration-500 relative">
                      <div className="absolute inset-0 bg-primary/5 blur-xl rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity" />
                      <LogoIcon className="w-10 h-10 relative z-10" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black tracking-tight">Vérification</h3>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Une dernière étape</p>
                    </div>
                  </div>

                  <div className="space-y-4 text-left">
                    <div className="p-4 bg-background/50 rounded-2xl border border-primary/5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Votre Profil</p>
                      <p className="font-bold text-primary">{name}</p>
                      <p className="text-sm text-muted-foreground">{email}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 bg-background/50 rounded-2xl border border-primary/5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Âge</p>
                        <p className="font-bold">{age} ans</p>
                      </div>
                      <div className="p-4 bg-background/50 rounded-2xl border border-primary/5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Pays</p>
                        <p className="font-bold">{country || 'Non spécifié'}</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-muted-foreground mt-8 text-xs font-medium leading-relaxed italic">
                    "Prêt à simplifier votre quotidien culinaire avec My Cook Flex ?"
                  </p>
                </div>
                <div className="flex gap-4">
                  <Button variant="ghost" onClick={handleBackStep} className="h-16 flex-1 text-base font-bold rounded-2xl">Retour</Button>
                  <Button
                    onClick={handleFinalRegister}
                    variant="outline"
                    className="h-16 flex-[2] text-lg font-black shadow-2xl shadow-primary/40 rounded-2xl text-primary border-2 border-primary/20 bg-primary/5 hover:bg-primary hover:!text-white transition-all duration-300"
                  >
                    Confirmer & Entrer
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="pt-8 text-center">
            <p className="text-sm text-muted-foreground font-medium">
              Déjà membre ? <Link href="/login" className="text-primary font-black hover:underline ml-1">Se connecter</Link>
            </p>
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} className="lg:hidden mt-10 text-muted-foreground opacity-40 font-bold tracking-widest uppercase text-[10px] hover:opacity-100">← Retour</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
