'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Palette, ArrowRight, Sparkles, Check, Layout, Utensils, Zap } from 'lucide-react';
import { ThemeSelector } from '@/components/personalization/theme-selector';
import { useAccentTheme } from '@/contexts/accent-theme-context';
import { useUser, useFirebase } from '@/firebase';
import { setDocumentNonBlocking } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Label } from '@/components/ui/label';
import { useLoading } from '@/contexts/loading-context';
import { LogoIcon } from '@/components/icons';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import Image from 'next/image';
import Autoplay from 'embla-carousel-autoplay';
import { motion, AnimatePresence } from 'framer-motion';

const carouselItems = [
  { image: '/mcf/19.png' },
  { image: '/mcf/21.png' },
  { image: '/mcf/18.png' }
];

export default function PersonalizationPage() {
  const router = useRouter();
  const { theme, setTheme } = useAccentTheme();
  const { user } = useUser();
  const { firestore } = useFirebase();
  const [api, setApi] = useState<any>();
  const { showLoading, hideLoading } = useLoading();
  const autoplay = useRef(Autoplay({ delay: 6000, stopOnInteraction: false }));

  // Persistence: Load data on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('mcf_personalization_theme');
    if (savedTheme) {
      try {
        const data = JSON.parse(savedTheme);
        if (data) setTheme(data);
      } catch (e) {
        console.error("Failed to load personalization draft", e);
      }
    }
  }, [setTheme]);

  // Persistence: Save data on change
  useEffect(() => {
    localStorage.setItem('mcf_personalization_theme', JSON.stringify(theme));
  }, [theme]);

  const handleFinish = async () => {
    showLoading("Préparation de votre univers...");

    try {
      if (user) {
        const userRef = doc(firestore, 'users', user.uid);
        await setDocumentNonBlocking(userRef, { theme: theme.name }, { merge: true });
      }

      setTimeout(() => {
        router.push('/preferences');
        localStorage.removeItem('mcf_personalization_theme');
      }, 1000);

    } catch (error) {
      console.error("Error saving theme:", error);
      hideLoading();
    }
  };

  const handleSkip = async () => {
    if (!user) return;
    showLoading("Chargement...");
    try {
      const userRef = doc(firestore, 'users', user.uid);
      // On définit un thème par défaut pour que l'AuthProvider laisse passer
      await setDoc(userRef, {
        theme: 'Vert Nature (Défaut)',
        updatedAt: serverTimestamp()
      }, { merge: true });
      router.push('/preferences');
    } catch (error) {
      console.error("Error skipping personalization:", error);
      hideLoading();
    }
  };

  return (
    <div className="flex min-h-screen w-full lg:grid lg:grid-cols-2 lg:h-screen lg:overflow-hidden bg-background">
      {/* Left Pane - Visual Inspiration */}
      <div className="hidden lg:flex bg-primary flex-col items-center justify-center relative overflow-hidden w-full h-screen lg:sticky lg:top-0">
        <div className="absolute inset-0 z-0 text-white">
          <Carousel setApi={setApi} plugins={[autoplay.current]} className="w-full h-full" opts={{ loop: true }}>
            <CarouselContent className="h-screen -ml-0">
              {carouselItems.map((item, index) => (
                <CarouselItem key={index} className="pl-0 relative h-screen">
                  <Image src={item.image} alt="Cuisine Inspiration" fill sizes="50vw" className="object-cover" priority={index === 0} />
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
            <h2 className="text-2xl font-black text-white tracking-tight drop-shadow-lg leading-tight">Personnalisez votre<br />expérience culinaire.</h2>
          </div>
        </div>
      </div>

      {/* Right Pane - Content */}
      <div className="w-full flex items-start justify-center p-6 lg:p-12 lg:h-full overflow-y-auto bg-background selection:bg-primary/20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mx-auto w-full max-w-[540px] space-y-12 py-16"
        >
          <div className="flex flex-col items-center text-center gap-10">
            <div className="flex flex-col items-center gap-4">
              <motion.div
                whileHover={{ rotate: 12, scale: 1.1 }}
                className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center border border-primary/5"
              >
                <LogoIcon className="w-10 h-10" />
              </motion.div>
              <p className="text-primary font-black text-[10px] tracking-[0.4em] uppercase opacity-70">Configuration du Style</p>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
                Votre Cuisine,<br />Vos Couleurs.
              </h1>
              <p className="text-muted-foreground font-medium max-w-[360px] mx-auto leading-relaxed">
                Personnalisez l'outil avec une palette qui vous inspire à cuisiner.
              </p>
            </div>
          </div>

          {/* Interactive Preview Container */}
          <div className="space-y-10">
            {/* Live Preview Card */}
            <motion.div
              layout
              className="relative p-6 rounded-[2.5rem] bg-muted/30 border-2 border-primary/5 overflow-hidden group shadow-2xl shadow-black/5"
            >
              <div className="absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full opacity-20 transition-colors duration-500" style={{ backgroundColor: `hsl(${theme.hsl})` }} />

              <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-colors duration-500" style={{ backgroundColor: `hsl(${theme.hsl})` }}>
                      <Layout className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Aperçu direct</p>
                      <p className="font-black tracking-tight">{theme.name}</p>
                    </div>
                  </div>
                  <div className="h-8 w-24 rounded-full bg-background/50 backdrop-blur-sm border flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full animate-pulse mr-2" style={{ backgroundColor: `hsl(${theme.hsl})` }} />
                    <span className="text-[9px] font-bold">Actif</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-background shadow-sm border space-y-2">
                    <Utensils className="h-4 w-4 opacity-20" />
                    <div className="h-2 w-12 rounded-full bg-muted" />
                    <div className="h-3 w-full rounded-full transition-colors duration-500" style={{ backgroundColor: `hsl(${theme.hsl} / 0.1)` }} />
                  </div>
                  <div className="p-4 rounded-2xl transition-colors duration-500 shadow-sm space-y-2" style={{ backgroundColor: `hsl(${theme.hsl})` }}>
                    <Zap className="h-4 w-4 text-white opacity-40" />
                    <div className="h-2 w-12 rounded-full bg-white/20" />
                    <div className="h-3 w-full rounded-full bg-white/40" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Theme Selector */}
            <div className="space-y-6">
              <div className="flex items-center gap-4 px-2">
                <div className="h-px flex-1 bg-muted-foreground/10" />
                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground whitespace-nowrap">Choisir votre Ton</Label>
                <div className="h-px flex-1 bg-muted-foreground/10" />
              </div>

              <ThemeSelector selectedThemeName={theme.name} onThemeChange={setTheme} />
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <Button
              onClick={handleFinish}
              className="w-full h-18 py-8 text-xl font-black shadow-2xl shadow-primary/30 rounded-[2rem] group relative overflow-hidden"
              style={{ backgroundColor: `hsl(${theme.hsl})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full md:group-hover:translate-x-full transition-transform duration-1000" />
              Valider ce style
              <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-2 transition-transform" />
            </Button>

            <Button onClick={handleSkip} variant="ghost" className="w-full h-14 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground rounded-2xl">
              Plus tard
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
