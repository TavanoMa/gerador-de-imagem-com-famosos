import { Translations } from './pt';

export const en: Translations = {
  hero: {
    title: "Upload Your Photo",
    subtitle: "See Your Pet Dancing",
    description: "The trick that's making pets go viral on TikTok. Now you can do it with yours.",
    cta: "MAKE MY PET DANCE →"
  },
  home: {
    title: "AI Celebrity Photo Generator",
    selectFamous: "Choose Your Favorite Celebrity",
    description: "Create realistic photos alongside your favorite celebrities using artificial intelligence."
  },
  generation: {
    uploadTitle: "Upload your photo",
    generateButton: "Generate Image",
    generating: "Generating...",
    selectImage: "Select an image",
    noCredits: "Insufficient credits",
    success: "Image generated successfully!",
    error: "Error generating image",
    shareTitle: "Share your image"
  },
  share: {
    title: "Share your photo!",
    whatsapp: "Share on WhatsApp",
    facebook: "Share on Facebook",
    twitter: "Share on Twitter",
    copyLink: "Copy link",
    download: "Download image",
    linkCopied: "Link copied!"
  },
  header: {
    credits: "Credits",
    signIn: "Sign In",
    signOut: "Sign Out"
  }
} as const;
