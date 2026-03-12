"use client";

import {
  ArrowRight,
  Calendar,
  Heart,
  LayoutDashboard,
  Package,
  Sparkles,
  User,
} from "lucide-react";
import { Button, Card, CardBody } from "@heroui/react";

import { InstallModal } from "@/components/ui/install-modal";
import Link from "next/link";
import { useAuth } from "@/contexts/auth";

export default function DashboardPage() {
  const { user } = useAuth();

  const navCards = [
    {
      title: "My Shelf",
      description: "Manage your current products and inventory.",
      href: "/products",
      icon: <Package className="size-6 text-primary" />,
      stats: "View All Products",
      color: "primary",
    },
    {
      title: "Routines",
      description: "Daily AM & PM regiments tailored for you.",
      href: "/routines",
      icon: <Calendar className="size-6 text-secondary" />,
      stats: "Manage Steps",
      color: "secondary",
    },
    {
      title: "Wishlist",
      description: "Keep track of products you want to try next.",
      href: "/wishlist",
      icon: <Heart className="size-6 text-danger" />,
      stats: "Saved Items",
      color: "danger",
    },
  ];

  return (
    <div className="relative min-h-screen p-4 md:p-8 container mx-auto w-full">
      {/* Decorative Background (Matches Profile Page) */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary-200/20 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[-5%] w-[40%] h-[50%] rounded-full bg-secondary-200/20 blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-12">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-white shadow-sm border border-default-100">
              <LayoutDashboard className="size-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                Welcome back, {user?.name?.split(" ")[0] || "Glow Getter"}!
              </h1>
              <p className="text-default-500 flex items-center gap-1">
                <Sparkles className="size-4 text-secondary" />
                Your skincare journey is looking bright today.
              </p>
            </div>
          </div>
          <Button
            as={Link}
            href="/profile"
            variant="flat"
            color="primary"
            className="font-medium"
            startContent={<User />}
          >
            Edit Skin Profile
          </Button>
        </header>

        {/* Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {navCards.map((card) => (
            <Card
              key={card.href}
              as={Link}
              href={card.href}
              isPressable
              className="border-none shadow-xl bg-background/60 backdrop-blur-md hover:scale-[1.02] transition-transform duration-300"
            >
              <CardBody className="p-6 flex flex-col justify-between min-h-50">
                <div className="space-y-4">
                  <div
                    className={`p-3 rounded-xl w-fit bg-${card.color}-100/30`}
                  >
                    {card.icon}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{card.title}</h2>
                    <p className="text-default-500 text-sm leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-default-100 mt-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-default-400">
                    {card.stats}
                  </span>
                  <ArrowRight className="size-4 text-default-400" />
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        {/* Quick Tip / Placeholder for Alerts */}
        <Card className="mt-8 border-none bg-primary text-primary-foreground shadow-lg shadow-primary/20">
          <CardBody className="p-6 flex flex-row items-center gap-6">
            <div className="hidden sm:flex p-4 rounded-full bg-white/20">
              <Sparkles className="size-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg">Pro Tip</h3>
              <p className="text-primary-foreground/80 text-sm">
                Consistency is key! Don&apos;t forget to log your evening
                routine to track how your skin responds to your new products.
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      <InstallModal />
    </div>
  );
}
