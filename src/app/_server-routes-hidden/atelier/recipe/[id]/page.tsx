import RecipeDetailContent from './recipe-content';

export function generateStaticParams() {
    return [{ id: 'placeholder' }];
}

export default function RecipeDetailPage() {
    return <RecipeDetailContent />;
}
