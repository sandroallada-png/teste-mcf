import JoinFamilyContent from './join-family-content';

export function generateStaticParams() {
    return [{ inviteId: 'placeholder' }];
}

export default function JoinFamilyPage() {
    return <JoinFamilyContent />;
}
