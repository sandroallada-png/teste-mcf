
import { NextResponse } from 'next/server';
import { getFirestoreInstance } from '@/firebase/server-init';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request: Request) {
    try {
        const bugData = await request.json();
        const firestore = await getFirestoreInstance();
        
        const docRef = await addDoc(collection(firestore, 'bugs'), {
            ...bugData,
            status: 'new',
            createdAt: serverTimestamp(),
            userAgent: request.headers.get('user-agent'),
        });

        return NextResponse.json({ success: true, id: docRef.id });
    } catch (error: any) {
        console.error('Error reporting bug:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
