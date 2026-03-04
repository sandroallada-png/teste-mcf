"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Refrigerator, Calendar, Grip, Sparkles, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthContext } from '@/components/auth/auth-provider';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock } from 'lucide-react';

export function FloatingShortcuts() {
    const [isOpen, setIsOpen] = useState(false);
    const [showOnboardingWarning, setShowOnboardingWarning] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const { isFullySetup, user } = useAuthContext();
    const [showTutorial, setShowTutorial] = useState(false);
    const [mounted, setMounted] = useState(false);
    const isAuthPage = pathname === '/login' || pathname === '/register';
    const isRegistrationPath = pathname === '/register' ||
        pathname === '/login' ||
        pathname?.startsWith('/join-family') ||
        pathname === '/personalization' ||
        pathname === '/preferences' ||
        pathname === '/pricing' ||
        pathname === '/welcome';

    const isRestrictedByAuth = isAuthPage && !user;
    const showWarning = showOnboardingWarning || isRestrictedByAuth;

    const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const dragOffset = React.useRef({ x: 0, y: 0 });
    const cardRef = React.useRef<HTMLDivElement>(null);
    const lastPositionRef = React.useRef<{ x: number; y: number } | null>(null);

    // Handle Dragging
    const hasMoved = React.useRef(false);
    const isOverTrashRef = React.useRef(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted || isRegistrationPath) return;
        if (isOpen) {
            const views = parseInt(localStorage.getItem('mcf-floating-tutorial-views') || '0', 10);
            if (views < 3) {
                const timer = setTimeout(() => {
                    setShowTutorial(true);
                    // Increment count as soon as it's shown to be strict about the "3 times" rule
                    localStorage.setItem('mcf-floating-tutorial-views', (views + 1).toString());
                }, 500);
                return () => clearTimeout(timer);
            }
        } else {
            setShowTutorial(false);
        }
    }, [isOpen, mounted, isRegistrationPath]);

    const dismissTutorial = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setShowTutorial(false);
    };

    const handleNavigation = (path: string) => {
        const isAdmin = user?.email === 'emapms@gmail.com';
        if (!isFullySetup && user && !isAdmin) {
            setShowOnboardingWarning(true);
            return;
        }
        setIsOpen(false);
        router.push(path);
    };

    // Reset warning when closing
    useEffect(() => {
        if (!isOpen) {
            setShowOnboardingWarning(false);
        }
    }, [isOpen]);

    // Ensure menu stays within viewport
    useEffect(() => {
        if (!mounted || isRegistrationPath) return;
        if (isOpen && cardRef.current && !position) {
            const timer = setTimeout(() => {
                const card = cardRef.current;
                if (!card) return;

                const rect = card.getBoundingClientRect();
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;

                if (rect.right > viewportWidth || rect.left < 0 || rect.bottom > viewportHeight || rect.top < 0) {
                    const safeX = Math.max(0, Math.min(rect.left, viewportWidth - rect.width));
                    const safeY = Math.max(0, Math.min(rect.top, viewportHeight - rect.height));
                    setPosition({ x: safeX, y: safeY });
                }
            }, 100);

            return () => clearTimeout(timer);
        }
    }, [isOpen, position, mounted, isRegistrationPath]);

    useEffect(() => {
        if (!isDragging) return;

        document.body.style.overflow = 'hidden';

        const handleMove = (e: MouseEvent | TouchEvent) => {
            e.preventDefault();
            hasMoved.current = true;

            const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
            const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

            let newX = clientX - dragOffset.current.x;
            let newY = clientY - dragOffset.current.y;

            const screenWidth = window.visualViewport ? window.visualViewport.width : window.innerWidth;
            const screenHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
            const offsetLeft = window.visualViewport ? window.visualViewport.offsetLeft : 0;
            const offsetTop = window.visualViewport ? window.visualViewport.offsetTop : 0;

            const cardRect = cardRef.current?.getBoundingClientRect();
            const cardWidth = cardRect?.width || 0;
            const cardHeight = cardRect?.height || 0;

            const minX = offsetLeft;
            const maxX = offsetLeft + screenWidth - cardWidth;
            const minY = offsetTop;
            const maxY = offsetTop + screenHeight - cardHeight;

            newX = Math.max(minX, Math.min(newX, maxX));
            newY = Math.max(minY, Math.min(newY, maxY));

            if (cardRef.current) {
                cardRef.current.style.left = `${newX}px`;
                cardRef.current.style.top = `${newY}px`;
            }

            const trashThreshold = 100;
            const trashX = offsetLeft + screenWidth / 2;
            const trashY = offsetTop + 80;

            if (cardWidth > 0) {
                const cardCenterX = newX + cardWidth / 2;
                const cardCenterY = newY + cardHeight / 2;
                const dist = Math.sqrt(Math.pow(cardCenterX - trashX, 2) + Math.pow(cardCenterY - trashY, 2));
                const isOver = dist < trashThreshold;

                if (isOver !== isOverTrashRef.current) {
                    isOverTrashRef.current = isOver;
                    if (cardRef.current) cardRef.current.style.opacity = isOver ? '0.5' : '1';
                }
            }

            lastPositionRef.current = { x: newX, y: newY };
        };

        const handleUp = () => {
            setIsDragging(false);
            document.body.style.overflow = '';

            if (isOverTrashRef.current) {
                setIsOpen(false);
                isOverTrashRef.current = false;
                setPosition(null);
            } else if (lastPositionRef.current) {
                const screenWidth = window.visualViewport ? window.visualViewport.width : window.innerWidth;
                const offsetLeft = window.visualViewport ? window.visualViewport.offsetLeft : 0;
                const cardRect = cardRef.current?.getBoundingClientRect();
                const cardWidth = cardRect?.width || 0;

                let finalX = lastPositionRef.current.x;
                let finalY = lastPositionRef.current.y;

                const centerX = offsetLeft + screenWidth / 2;

                if (finalX + cardWidth / 2 < centerX) {
                    finalX = offsetLeft;
                } else {
                    finalX = offsetLeft + screenWidth - cardWidth;
                }

                setPosition({ x: finalX, y: finalY });
            }
            if (cardRef.current) cardRef.current.style.opacity = '1';
        };

        window.addEventListener('mousemove', handleMove, { passive: false });
        window.addEventListener('mouseup', handleUp);
        window.addEventListener('touchmove', handleMove, { passive: false });
        window.addEventListener('touchend', handleUp);

        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', handleUp);
        };
    }, [isDragging]);

    const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
        hasMoved.current = false;
        const target = e.currentTarget as HTMLElement;
        const card = target.closest('.floating-shortcuts-card');
        if (!card) return;

        const rect = card.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

        dragOffset.current = {
            x: clientX - rect.left,
            y: clientY - rect.top,
        };

        const startX = rect.left;
        const startY = rect.top;

        if (!position) {
            setPosition({ x: startX, y: startY });
        }
        lastPositionRef.current = { x: startX, y: startY };
        setIsDragging(true);
    };

    if (!mounted || isRegistrationPath) return null;

    return createPortal(
        <>

            {!isOpen && (
                <div
                    className={cn(
                        "fixed top-1/2 -translate-y-1/2 z-[40] group flex items-center w-8 h-40 touch-none py-4 transition-all duration-300 select-none",
                        "right-0 justify-end pl-4 cursor-grab active:cursor-grabbing"
                    )}
                    style={{
                        top: '50%'
                    }}
                    onMouseDown={(e) => {
                        const startX = e.clientX;
                        const handleMouseUp = (e: MouseEvent) => {
                            const diff = startX - e.clientX;
                            if (Math.abs(diff) < 5 || diff > 30) {
                                setIsOpen(true);
                            }
                            window.removeEventListener('mouseup', handleMouseUp);
                        };
                        window.addEventListener('mouseup', handleMouseUp, { once: true });
                    }}
                    onTouchStart={(e) => {
                        const touch = e.currentTarget.dataset;
                        // @ts-ignore
                        touch.startX = String(e.touches[0].clientX);
                    }}
                    onTouchEnd={(e) => {
                        // @ts-ignore
                        const startX = parseFloat(e.currentTarget.dataset.startX || '0');
                        const endX = e.changedTouches[0].clientX;
                        const diff = startX - endX;
                        if (diff > 30 || Math.abs(diff) < 5) {
                            setIsOpen(true);
                        }
                        // @ts-ignore
                        e.currentTarget.dataset.startX = '';
                    }}
                >
                    <div className={cn(
                        "h-24 w-1.5 bg-primary/80 hover:bg-primary shadow-[0_0_15px_rgba(59,130,246,0.8)] transition-all duration-300 transform group-hover:w-2",
                        "rounded-l-full translate-x-0.5 group-hover:translate-x-0"
                    )} />
                    <div className={cn(
                        "absolute top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[10px] font-bold text-primary bg-background/90 px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap",
                        "right-full mr-1"
                    )}>
                        Ouvrir
                    </div>
                </div>
            )}

            {isOpen && (
                <Card
                    ref={cardRef}
                    className={cn(
                        'fixed z-[40] shadow-2xl floating-shortcuts-card transition-[width,height] ease-in-out rounded-3xl',
                        !position && 'top-1/2 -translate-y-1/2 rounded-r-none rounded-l-3xl border-r-0'
                    )}
                    style={{
                        ...(position ? {
                            top: position.y,
                            left: position.x,
                            margin: 0,
                        } : {
                            top: '50%',
                            right: '0',
                            left: 'auto',
                        }),
                        width: showWarning ? '20rem' : '4rem',
                        maxWidth: 'calc(100vw - 1rem)',
                        transform: !position ? 'translateY(-50%)' : 'none',
                        animation: !position && !isDragging ? 'slideInFromRightSmooth 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
                        transition: isDragging
                            ? 'none'
                            : 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        willChange: isDragging ? 'left, top' : 'auto',
                    }}
                >
                    <CardHeader
                        className={cn(
                            "p-2 bg-gradient-to-r from-background to-secondary/20 cursor-move select-none active:cursor-grabbing border-b transition-all duration-300",
                            !showWarning ? "justify-center" : "justify-between"
                        )}
                        style={{ touchAction: 'none' }}
                        onMouseDown={handleDragStart}
                        onTouchStart={handleDragStart}
                    >
                        {showWarning ? (
                            <div className="flex justify-between items-center w-full">
                                <CardTitle className="text-sm font-black flex items-center gap-2 text-primary uppercase tracking-tighter">
                                    <Sparkles className="h-4 w-4" />
                                    {isRestrictedByAuth ? 'Espace Membre' : 'Accès Restreint'}
                                </CardTitle>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 pointer-events-auto"
                                    onClick={() => {
                                        if (isRestrictedByAuth) setIsOpen(false);
                                        else setShowOnboardingWarning(false);
                                    }}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2 relative">
                                {showTutorial && (
                                    <div className="absolute right-full top-0 mr-4 w-56 bg-primary text-primary-foreground p-4 rounded-xl shadow-xl animate-in fade-in slide-in-from-right-2 z-50 pointer-events-auto border-2 border-white/20">
                                        <div className="absolute top-2 -right-1.5 w-3 h-3 bg-primary rotate-45 border-t-2 border-r-2 border-white/20" />
                                        <div className="flex flex-col gap-2">
                                            <p className="text-sm font-bold flex items-center gap-2">
                                                <span>✨ Raccourcis</span>
                                            </p>
                                            <p className="text-xs leading-relaxed opacity-90">
                                                <strong>Glissez la poignée</strong> pour ouvrir ce menu n'importe où.
                                            </p>
                                        </div>
                                        <Button size="sm" variant="secondary" className="h-7 text-xs w-full mt-3 hover:bg-secondary/90 font-semibold" onClick={dismissTutorial}>C'est noté !</Button>
                                    </div>
                                )}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 pointer-events-auto group relative"
                                    onClick={() => {
                                        dismissTutorial();
                                        if (!hasMoved.current) setIsOpen(false);
                                    }}
                                    title="Déplacer ou Fermer"
                                >
                                    <Grip className="h-4 w-4 text-muted-foreground transition-all duration-300 group-hover:opacity-0 group-hover:scale-75 animate-pulse" />
                                    <X className="absolute inset-0 m-auto h-4 w-4 text-destructive scale-75 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:scale-100" />
                                </Button>
                            </div>
                        )}
                    </CardHeader>

                    <CardContent
                        className="p-1 pb-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
                    >
                        <AnimatePresence mode="wait">
                            {showWarning ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="p-4 space-y-4 text-center"
                                >
                                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                                        <Lock className="h-8 w-8 text-primary" />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="font-black text-lg leading-tight uppercase tracking-tight">
                                            {isRestrictedByAuth ? 'Bientôt disponible' : 'Presque là !'}
                                        </p>
                                        <p className="text-xs text-muted-foreground leading-relaxed italic px-2">
                                            {isRestrictedByAuth
                                                ? "Ne vous inquiétez pas, après la création de votre compte, vous pourrez accéder à tous vos outils intelligents ici !"
                                                : "Ne vous inquiétez pas, vous y êtes presque ! Finalisez votre profil pour débloquer tout votre univers culinaire."
                                            }
                                        </p>
                                    </div>
                                    <Button
                                        className="w-full h-11 rounded-xl text-xs font-bold uppercase tracking-widest shadow-xl shadow-primary/20"
                                        onClick={() => {
                                            if (isRestrictedByAuth) setIsOpen(false);
                                            else setShowOnboardingWarning(false);
                                        }}
                                    >
                                        {isRestrictedByAuth ? 'D\'accord' : 'Continuer l\'inscription'}
                                    </Button>
                                </motion.div>
                            ) : (
                                <div className="flex flex-col gap-4 items-center py-2">

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-10 w-10 rounded-full bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300 hover:scale-110 transition-transform shadow-sm"
                                        onClick={() => handleNavigation('/fridge')}
                                        title="Frigo"
                                    >
                                        <Refrigerator className="h-5 w-5" />
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-10 w-10 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300 hover:scale-110 transition-transform shadow-sm"
                                        onClick={() => handleNavigation('/courses')}
                                        title="Courses"
                                    >
                                        <ShoppingCart className="h-5 w-5" />
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-10 w-10 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300 hover:scale-110 transition-transform shadow-sm"
                                        onClick={() => handleNavigation('/calendar')}
                                        title="Calendrier"
                                    >
                                        <Calendar className="h-5 w-5" />
                                    </Button>
                                </div>
                            )}
                        </AnimatePresence>
                    </CardContent>
                </Card>
            )}
        </>,
        document.body
    );
}
