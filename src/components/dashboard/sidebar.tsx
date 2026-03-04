'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Lightbulb, Loader2, Sparkles, Target, User, Activity, Calendar, Refrigerator, BarChart2, Star, History, ShoppingCart, MessageSquare, Bot, Save, LayoutDashboard, Trophy, ChefHat, Shield, UtensilsCrossed, Gem, Edit, Package, Library } from 'lucide-react';
import type { Meal } from '@/lib/types';
import { getTipsAction } from '@/app/actions';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '../icons';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import Link from 'next/link';
import { useUser, useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter, usePathname } from 'next/navigation';
import { ButtonWithLoading } from '../ui/button-with-loading';
import { Progress } from '../ui/progress';
import { SidebarContent, useSidebar } from '../ui/sidebar';
import { ScrollArea } from '../ui/scroll-area';
import { doc } from 'firebase/firestore';
import { useLoading } from '@/contexts/loading-context';
import { cn, formatUserIdentifier } from '@/lib/utils';
import { useReadOnly } from '@/contexts/read-only-context';

export const mainNavLinks = [
  { href: '/dashboard', label: 'Tableau de bord', icon: <LayoutDashboard className="h-5 w-5" /> },
  { href: '/cuisine', label: 'Cuisine', icon: <ChefHat className="h-5 w-5" /> },
  { href: '/box', label: <span className="flex items-center gap-2">Ma Box <Badge variant="secondary" className="text-[10px] h-4 px-1 bg-primary/10 text-primary border-none">Nouveau</Badge></span>, icon: <Package className="h-5 w-5" /> },
  { href: '/atelier', label: <span className="flex items-center gap-2">Atelier du Chef <Gem className="h-3 w-3 text-primary" /></span>, icon: <Library className="h-5 w-5" /> },
  { href: '/calendar', label: 'Calendrier', icon: <Calendar className="h-5 w-5" /> },
  { href: '/my-flex-ai', label: 'My Flex Coach', icon: <Bot className="h-5 w-5" /> },
  { href: '/fridge', label: <span className="flex items-center gap-2">Frigo <Gem className="h-3 w-3 text-primary" /></span>, icon: <Refrigerator className="h-5 w-5" /> },
  { href: '/courses', label: <span className="flex items-center gap-2">Courses <Gem className="h-3 w-3 text-primary" /></span>, icon: <ShoppingCart className="h-5 w-5" /> },
  { href: '/mon-niveau', label: 'Mon Niveau', icon: <Trophy className="h-5 w-5" /> },
];

export const adminNavLinks = [
  { href: '/admin', label: 'Outils Admin', icon: <Shield className="h-5 w-5" /> },
  { href: '/admin/feedbacks', label: 'Feedbacks', icon: <Star className="h-5 w-5" /> },
  { href: '/admin/follow-up', label: 'Suivi et Relance', icon: <Activity className="h-5 w-5" /> },
];

export const accountNavLinks = [
  { href: '#', label: 'Mon Abonnement', icon: <Star className="h-5 w-5" /> },
  { href: '/settings', label: 'Profil & Paramètres', icon: <User className="h-5 w-5" /> },
]

interface SidebarProps {
  goals: string;
  setGoals: (goals: string) => void;
  meals: Meal[];
  isMobile?: boolean;
}

interface UserProfile {
  role?: 'user' | 'admin';
  xp?: number;
  level?: number;
  avatarUrl?: string;
  name?: string;
}

export function Sidebar({ goals, setGoals, meals, isMobile = false }: SidebarProps) {
  const [tips, setTips] = useState<string>('');
  const { toast } = useToast();
  const { user } = useUser();
  const { firestore } = useFirebase();
  const router = useRouter();
  const pathname = usePathname();
  const { showLoading } = useLoading();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { isReadOnly, chefName, triggerBlock } = useReadOnly();

  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  const isAdmin = userProfile?.role === 'admin';

  const handleGetTips = async () => {
    setTips('');
    const foodLogs = meals.map(m => `${m.name} (${m.calories} kcal)`).join(', ');
    try {
      const { tips: newTips, error } = await getTipsAction({
        foodLogs: foodLogs || 'Aucun aliment enregistré aujourd\'hui.',
        dietaryGoals: goals,
      });

      if (error) {
        throw new Error(error);
      } else if (newTips) {
        setTips(newTips);
      }
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: e.message || 'Impossible de générer des conseils.',
      });
    }
  };

  const handleSoon = (e: React.MouseEvent, href: string) => {
    if (href === '#') {
      e.preventDefault();
      toast({
        title: 'Bientôt disponible',
        description: 'Cette fonctionnalité est en cours de développement.',
      });
    }
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    handleSoon(e as React.MouseEvent, href);
    if (href !== '#' && href !== pathname) {
      showLoading("Chargement de la page...");
    }
    // Let the default Link behavior handle navigation
  };

  const XP_PER_LEVEL = 500;
  const currentLevel = userProfile?.level ?? 1;
  const currentXp = userProfile?.xp ?? 0;
  const xpForCurrentLevel = currentXp % XP_PER_LEVEL;
  const progressPercentage = (xpForCurrentLevel / XP_PER_LEVEL) * 100;

  if (isMobile) {
    return (
      <ScrollArea className="h-full">
        <div className="flex w-full flex-col p-4">
          <div className="mb-6">
            <Logo />
          </div>
          <nav className="flex flex-col flex-1">
            <div className="flex-1 space-y-0.5">
              {mainNavLinks.map(link => (
                <Link key={link.href} href={link.href} onClick={(e) => handleNavClick(e, link.href)} className="flex items-center gap-2.5 text-muted-foreground hover:text-foreground hover:bg-accent/50 px-3 py-1.5 rounded-md transition-colors text-sm font-medium group">
                  <span className="text-muted-foreground group-hover:text-foreground/80">{link.icon}</span>
                  {link.label}
                </Link>
              ))}
              {isAdmin && (
                <div className="pt-4 pb-1">
                  <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Administration</p>
                </div>
              )}
              {isAdmin && adminNavLinks.map(link => (
                <Link key={link.href} href={link.href} onClick={(e) => handleNavClick(e, link.href)} className="flex items-center gap-2.5 text-muted-foreground hover:text-foreground hover:bg-accent/50 px-3 py-1.5 rounded-md transition-colors text-sm font-medium group">
                  <span className="text-muted-foreground group-hover:text-foreground/80">{link.icon}</span>
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
          <Separator className="my-4" />
          <div className="flex flex-1 flex-col gap-4">
            <Card className="shadow-md">
              <CardHeader className="p-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    Niveau {currentLevel}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{xpForCurrentLevel} / {XP_PER_LEVEL} XP</p>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <Progress value={progressPercentage} />
              </CardContent>
            </Card>
            <Card className="shadow-md">
              <CardHeader className="flex-row items-center justify-between gap-3 space-y-0 p-3">
                <div className="flex items-center gap-3">
                  <Target className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">Vos Objectifs</CardTitle>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild={!isReadOnly} onClick={isReadOnly ? () => triggerBlock() : undefined}>
                  {isReadOnly ? <Edit className="h-4 w-4" /> : <Link href="/settings"><Edit className="h-4 w-4" /></Link>}
                </Button>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <p className="text-sm text-muted-foreground p-2 h-24">{goals}</p>
                <div className="mt-2 rounded-lg border bg-background/50 p-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <h4 className="text-xs font-semibold">État</h4>
                    </div>
                    <Badge variant="secondary" className="text-xs">En cours</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="flex flex-1 flex-col shadow-md">
              <CardHeader className="flex-row items-center gap-3 space-y-0 p-3">
                <Sparkles className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-base">Conseils de l'outil</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between p-3 pt-0">
                {tips ? (
                  <div className="prose prose-sm rounded-lg bg-green-100 dark:bg-green-900/30 p-3 text-green-900 dark:text-green-200 h-full overflow-y-auto">
                    <p className="text-xs">{tips}</p>
                  </div>
                ) : (
                  <div className="flex flex-1 items-center justify-center text-center text-xs text-muted-foreground">
                    Cliquez pour générer vos conseils.
                  </div>
                )}
                <ButtonWithLoading onClick={handleGetTips} className="mt-3 w-full h-9">
                  <Lightbulb className="mr-2 h-4 w-4" />
                  Générer mes conseils
                </ButtonWithLoading>
              </CardContent>
            </Card>
          </div>
        </div>
      </ScrollArea>
    )
  }

  return (
    <SidebarContent className={cn("p-2 bg-sidebar border-r flex flex-col h-full", isCollapsed && "p-1 items-center")}>
      <div className={cn("mb-2 px-2 py-2 flex items-center justify-center", !isCollapsed && "justify-start")}>
        <Logo showText={!isCollapsed} />
      </div>

      <nav className="flex flex-col flex-1 overflow-hidden">
        <div className="flex-1 space-y-0.5 px-1">
          {mainNavLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              title={isCollapsed ? (typeof link.label === 'string' ? link.label : 'Navigation') : undefined}
              onClick={(e) => handleNavClick(e, link.href)}
              className={cn(
                "flex items-center gap-2.5 px-2 py-1.5 rounded-md transition-all text-sm font-medium group relative",
                isCollapsed ? "justify-center px-0 w-10 h-10 mx-auto" : "px-2",
                pathname === link.href ? "bg-accent/80 text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
              )}
            >
              <span className={cn(
                "transition-colors",
                pathname === link.href ? "text-foreground" : "text-muted-foreground group-hover:text-foreground/80"
              )}>
                {link.icon}
              </span>
              {!isCollapsed && link.label}
              {isCollapsed && pathname === link.href && (
                <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />
              )}
            </Link>
          ))}
        </div>

        {isAdmin && (
          <div className="px-3 pt-6 pb-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Système</p>
          </div>
        )}
        <div className="space-y-0.5 px-1">
          {isAdmin && adminNavLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              title={isCollapsed ? link.label : undefined}
              onClick={(e) => handleNavClick(e, link.href)}
              className={cn(
                "flex items-center gap-2.5 px-2 py-1.5 rounded-md transition-all text-sm font-medium group",
                isCollapsed ? "justify-center px-0 w-10 h-10 mx-auto" : "px-2",
                pathname === link.href ? "bg-accent/80 text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
              )}
            >
              <span className={cn(
                "transition-colors",
                pathname === link.href ? "text-foreground" : "text-muted-foreground group-hover:text-foreground/80"
              )}>
                {link.icon}
              </span>
              {!isCollapsed && link.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Badge Mode Observateur */}
      {isReadOnly && !isCollapsed && (
        <div className="mx-2 mb-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">Mode Observateur</p>
              {chefName && <p className="text-[10px] text-muted-foreground truncate">Chef&nbsp;: {chefName}</p>}
            </div>
          </div>
        </div>
      )}
      {isReadOnly && isCollapsed && (
        <div className="mx-auto mb-2 h-8 w-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center" title="Mode Observateur">
          <Shield className="h-3.5 w-3.5 text-amber-500" />
        </div>
      )}

      <div className="mt-auto flex flex-col pt-2 bg-sidebar/50">
        {!isCollapsed && accountNavLinks.map(link => (
          <Link
            key={link.href}
            href={link.href}
            onClick={(e) => handleNavClick(e, link.href)}
            className="flex items-center gap-2.5 text-muted-foreground hover:text-foreground hover:bg-accent/40 px-3 py-1.5 rounded-md transition-colors text-sm font-medium"
          >
            <span className="text-muted-foreground/70">{link.icon}</span>
            {link.label}
          </Link>
        ))}
        {!isCollapsed && <Separator className="my-2 opacity-50" />}
        <div className={cn("flex items-center gap-2.5 px-2 py-2 hover:bg-accent/40 rounded-md transition-colors cursor-pointer group", isCollapsed && "justify-center px-0")}>
          <Avatar className="h-6 w-6 rounded-sm">
            <AvatarImage src={userProfile?.avatarUrl ?? user?.photoURL ?? undefined} alt="Utilisateur" />
            <AvatarFallback className="text-[10px] font-bold bg-muted">{user?.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex flex-col overflow-hidden">
              <p className="text-xs font-semibold truncate text-foreground/80 group-hover:text-foreground">{userProfile?.name || user?.displayName || 'Utilisateur'}</p>
              <p className="text-[10px] text-muted-foreground truncate">{formatUserIdentifier(user?.email)}</p>
            </div>
          )}
        </div>
      </div>
    </SidebarContent>
  );
}
