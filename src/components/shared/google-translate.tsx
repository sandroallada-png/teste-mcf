'use client';

import { useEffect, useRef, useState } from 'react';
import { useFirebase, useUser } from '@/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export function GoogleTranslateProvider({ children }: { children: React.ReactNode }) {
    const { user } = useUser();
    const { firestore } = useFirebase();
    const [currentLang, setCurrentLang] = useState('fr');
    const isFirstLoad = useRef(true);

    useEffect(() => {
        if (typeof window !== 'undefined' && typeof Node === 'function' && Node.prototype) {
            const originalRemoveChild = Node.prototype.removeChild;
            Node.prototype.removeChild = function (child: any) {
                if (child.parentNode !== this) {
                    return child;
                }
                return originalRemoveChild.apply(this, arguments as any);
            };

            const originalInsertBefore = Node.prototype.insertBefore;
            Node.prototype.insertBefore = function (newNode: any, referenceNode: any) {
                if (referenceNode && referenceNode.parentNode !== this) {
                    return newNode;
                }
                return originalInsertBefore.apply(this, arguments as any);
            };
        }
    }, []);

    useEffect(() => {
        if (!user || !firestore) return;

        const getSupportedLanguage = (lang: string) => {
            const supported = ['fr', 'en', 'de', 'it', 'es', 'pt'];
            const baseLang = lang.split('-')[0];
            return supported.includes(baseLang) ? baseLang : 'fr';
        };

        const systemLang = typeof navigator !== 'undefined' ? getSupportedLanguage(navigator.language) : 'fr';

        const unsubscribe = onSnapshot(doc(firestore, 'users', user.uid), (docRef: any) => {
            const data = docRef.data();
            const lang = (data && data.language && data.language !== 'system') ? data.language : systemLang;
            
            if (isFirstLoad.current) {
                setCurrentLang(lang);
                isFirstLoad.current = false;
            } else {
                setCurrentLang(prevLang => {
                    if (lang !== prevLang) {
                        // Language changed, update cookie and reload
                        if (lang === 'fr') {
                            document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                            document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=' + location.hostname + '; path=/;';
                        } else {
                            const langValue = `/fr/${lang}`;
                            document.cookie = `googtrans=${langValue}; path=/`;
                            document.cookie = `googtrans=${langValue}; domain=${location.hostname}; path=/`;
                        }
                        window.location.reload();
                    }
                    return lang;
                });
            }
        });

        return () => unsubscribe();
    }, [user, firestore]);

    useEffect(() => {
        // Only run script injection once when currentLang is known and not fr
        if (currentLang !== 'fr') {
            const langValue = `/fr/${currentLang}`;
            // Set cookie just in case it wasn't set
            document.cookie = `googtrans=${langValue}; path=/`;
            document.cookie = `googtrans=${langValue}; domain=${location.hostname}; path=/`;

            if (!document.getElementById('google-translate-script')) {
                const addScript = document.createElement('script');
                addScript.id = 'google-translate-script';
                addScript.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
                document.head.appendChild(addScript);

                (window as any).googleTranslateElementInit = () => {
                    new (window as any).google.translate.TranslateElement({
                        pageLanguage: 'fr',
                        includedLanguages: 'en,de,it,es,pt,fr',
                        autoDisplay: false,
                    }, 'google_translate_element');
                };
            }
        }
    }, [currentLang]);

    return (
        <>
            <div id="google_translate_element" style={{ display: 'none' }}></div>
            {children}
            <style dangerouslySetInnerHTML={{ __html: `
                .goog-te-banner-frame.skiptranslate { display: none !important; }
                body { top: 0px !important; }
                .goog-tooltip { display: none !important; }
                .goog-tooltip:hover { display: none !important; }
                .goog-text-highlight { background-color: transparent !important; border: none !important; box-shadow: none !important; }
                font { background-color: transparent !important; box-shadow: none !important; }
            ` }} />
        </>
    );
}
