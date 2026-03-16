import type { Metadata } from 'next';

const siteUrl = 'https://www.mycookflex.com';
const siteTitle = 'My Cook Flex : Votre Plan de Repas Intelligent & Coach Nutritionnel IA';
const siteDescription = "Générez des plans de repas adaptés à vos objectifs (perte de poids, prise de masse...), créez des listes de courses automatiques et discutez avec notre IA pour des conseils nutritionnels sur mesure. Simplifiez votre alimentation dès aujourd'hui.";
const siteImage = `${siteUrl}/new-logo/logo-favicon.png`; // Assurez-vous que cette image existe dans /public

export const AppMetadata: Metadata = {
  title: siteTitle,
  description: siteDescription,
  keywords: [
    'plan de repas',
    'coach nutritionnel',
    'recettes saines',
    'liste de courses',
    'IA nutrition',
    'perte de poids',
    'prise de masse',
    'mycookflex',
    'repas couple',
    'planificateur de repas',
    'idées de repas',
    'alimentation saine',
    'régime alimentaire',
  ],
  authors: [{ name: 'My Cook Flex Team' }],
  creator: 'My Cook Flex',
  publisher: 'My Cook Flex',

  // --- Open Graph Metadata ---
  openGraph: {
    type: 'website',
    url: siteUrl,
    title: siteTitle,
    description: siteDescription,
    images: [
      {
        url: siteImage,
        width: 512,
        height: 512,
        alt: 'My Cook Flex Logo',
      },
    ],
    siteName: 'My Cook Flex',
    locale: 'fr_FR',
  },

  // --- Twitter Card Metadata ---
  twitter: {
    card: 'summary_large_image',
    title: siteTitle,
    description: siteDescription,
    images: [siteImage],
    creator: '@MyCookFlex', // Remplacez par votre handle Twitter si vous en avez un
  },

  // --- Additional Metadata ---
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },

};
