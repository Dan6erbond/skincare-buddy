import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Skincare Buddy",
    short_name: "Skincare Buddy",
    description:
      "Track your skincare routine, analyze product ingredients, and get AI-powered recommendations based on your skin's unique needs.",
    start_url: "/",
    icons: [
      {
        src: "/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    theme_color: "#ffffff",
    background_color: "#ffffff",
    display: "standalone",
    screenshots: [
      {
        src: "/screenshot-dashboard-laptop.png",
        sizes: "1363x887",
        type: "image/png",
        form_factor: "wide",
        label:
          "User dashboard with links to product shelf, routines and wishlist",
      },
      {
        src: "/screenshot-dashboard-mobile.png",
        sizes: "370x661",
        type: "image/png",
        label:
          "User dashboard with links to product shelf, routines and wishlist",
      },
      {
        src: "/screenshot-catalog-laptop.png",
        sizes: "1363x887",
        type: "image/png",
        form_factor: "wide",
        label: "Catalog page showing global products",
      },
      {
        src: "/screenshot-catalog-mobile.png",
        sizes: "371x664",
        type: "image/png",
        label: "Catalog page showing global products",
      },
    ],
  };

}
