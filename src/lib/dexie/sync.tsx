'use client';

import { useEffect, useCallback } from 'react';
import { db } from './db';
import { useFirebase, useUser, useMemoFirebase } from '@/firebase';
import { collection, onSnapshot, query, where, DocumentData, QuerySnapshot } from 'firebase/firestore';

// Synchronise une collection Firestore avec une table Dexie
function useSyncCollection(collectionRef: any, table: any, userId?: string | null) {
  useEffect(() => {
    if (!collectionRef) return;

    // Listen to firestore changes
    const unsubscribe = onSnapshot(collectionRef, (snapshot: QuerySnapshot<DocumentData>) => {
      snapshot.docChanges().forEach((change) => {
        const item: { id: string; userId?: string; [key: string]: any } = { id: change.doc.id, ...change.doc.data() };
        if (change.type === 'added' || change.type === 'modified') {
           // Si un userId est requis, on s'assure qu'il est bien présent pour les tables spécifiques à l'utilisateur
           if (userId) {
              item.userId = userId;
           }
           table.put(item).catch(console.error);
        }
        if (change.type === 'removed') {
           table.delete(change.doc.id).catch(console.error);
        }
      });
    }, (error) => {
        console.error(`Sync error on ${table.name}`, error);
    });

    return () => unsubscribe();
  }, [collectionRef, table, userId]);
}

/**
 * Ce Provider (ou Hooks) va se charger en arrière-plan d'écouter les données de Firebase
 * et de mettre à jour instantanément la base locale Dexie.
 * La UI pourra ainsi lire DEPUIS Dexie pour une réactivité extrême même sans internet.
 */
export function DexieSyncManager() {
  const { firestore } = useFirebase();
  const { user } = useUser();

  // 1. Sync Meals
  const mealsQuery = useMemoFirebase(() => collection(firestore, 'meals'), [firestore]);
  useSyncCollection(mealsQuery, db.meals);

  // 2. Sync Ingredients
  const ingredientsQuery = useMemoFirebase(() => collection(firestore, 'ingredients'), [firestore]);
  useSyncCollection(ingredientsQuery, db.ingredients);

  // 3. Sync User FoodLogs (si connecté)
  const foodLogsQuery = useMemoFirebase(() => {
    return user ? collection(firestore, 'users', user.uid, 'foodLogs') : null;
  }, [firestore, user]);
  useSyncCollection(foodLogsQuery, db.userFoodLogs, user?.uid);

  // 4. Sync User Favorites
  const favoritesQuery = useMemoFirebase(() => {
    return user ? collection(firestore, 'users', user.uid, 'favorites') : null;
  }, [firestore, user]);
  useSyncCollection(favoritesQuery, db.userFavorites, user?.uid);

  // 5. Sync Offline Queue vers Firebase
  useEffect(() => {
     // TODO: Lancer un worker récurrent ou un listner sur 'online' event 
     // pour process db.syncQueue
     const processQueue = async () => {
        if (!navigator.onLine) return;
        
        const pending = await db.syncQueue.where('status').equals('pending').toArray();
        if (pending.length === 0) return;
        
        // Logique de rejeu des writes vers Firebase... (simplifiée pour l'instant)
        // Les writes de base utilisent déjà persistentLocalCache de Firebase.
        // Ce système de queue serait utile pour rejouer des requêtes d'API (cloud functions complexes).
     };

     window.addEventListener('online', processQueue);
     return () => window.removeEventListener('online', processQueue);
  }, []);

  return null; // Pas de rendu visuel, travaille en arrière-plan
}
