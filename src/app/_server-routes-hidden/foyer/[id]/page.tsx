import FoyerContent from './foyer-content';

export function generateStaticParams() {
    return [{ id: 'placeholder' }];
}

export default function FoyerPage() {
    return <FoyerContent />;
}
