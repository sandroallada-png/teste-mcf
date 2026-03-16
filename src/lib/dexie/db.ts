import Dexie, { type Table } from 'dexie';

export interface DefaultDoc {
  id: string;
  [key: string]: any;
}

export class AppDb extends Dexie {
  // Collections publiques
  meals!: Table<DefaultDoc, string>;
  ingredients!: Table<DefaultDoc, string>;
  
  // Collections utilisateur
  userFoodLogs!: Table<DefaultDoc, string>;
  userFavorites!: Table<DefaultDoc, string>;
  userGoals!: Table<DefaultDoc, string>;

  // Table technique pour gérer la file d'attente (sync) des opérations hors ligne
  syncQueue!: Table<{
    id?: string;
    collectionPath: string;
    docId?: string;
    data: any;
    operation: 'set' | 'update' | 'add' | 'delete';
    timestamp: number;
    status: 'pending' | 'syncing' | 'failed';
  }, string>;

  constructor() {
    super('CookFlexDB');
    this.version(1).stores({
      meals: 'id, category, type, origin, source',
      ingredients: 'id, name, category, subCategory',
      userFoodLogs: 'id, userId, date, type',
      userFavorites: 'id, userId, dishId',
      userGoals: 'id, userId',
      syncQueue: '++id, collectionPath, operation, status, timestamp'
    });
  }
}

export const db = new AppDb();
