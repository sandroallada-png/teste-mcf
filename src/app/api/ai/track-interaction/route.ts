import { NextResponse } from 'next/server';
import { trackInteractionAction } from '@/app/actions';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        // The arguments are passed as properties in the body
        const { userId, dishName, dishOrigin, dishCategory, eventType } = body;
        const result = await trackInteractionAction(userId, dishName, dishOrigin, dishCategory, eventType);

        const headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS, POST',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        };

        return NextResponse.json(result, { headers });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS, POST',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
