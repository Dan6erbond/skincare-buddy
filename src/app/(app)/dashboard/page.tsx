"use client";

import * as queryKeys from "@/lib/query/keys";

import {
  ArrowRight,
  BookOpen,
  Calendar,
  ChevronRight,
  Heart,
  LayoutDashboard,
  Package,
  Sparkles,
  User,
} from "lucide-react";
import { Button, Card, CardBody, Image, Skeleton } from "@heroui/react";
import { bucketId, databaseId, tableIds } from "@/lib/appwrite/const";

import { InstallModal } from "@/components/ui/install-modal";
import { JournalEntries } from "@/lib/appwrite/types";
import { JournalEntryModal } from "@/components/journal/modal";
import Link from "next/link";
import { Query } from "appwrite";
import { useAppwrite } from "@/contexts/appwrite";
import { useAuth } from "@/contexts/auth";
import { useQuery } from "@tanstack/react-query";

export default function DashboardPage() {
  const { user } = useAuth();
  const { tables, storage } = useAppwrite();

  // Fetch only the 4 most recent journal entries for the dashboard preview
  const { data: recentEntries, isLoading: entriesLoading } = useQuery({
    queryKey: [...queryKeys.journal(), "preview"],
    queryFn: async () => {
      return await tables.listRows<JournalEntries>({
        databaseId,
        tableId: tableIds.journalEntries,
        queries: [
          Query.equal("userId", user!.$id),
          Query.orderDesc("occurredAt"),
          Query.limit(4),
        ],
      });
    },
    enabled: !!user?.$id,
  });

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
      title: "Skin Journal",
      description: "Track progress photos and daily skin changes.",
      href: "/journal",
      icon: <BookOpen className="size-6 text-warning" />,
      stats: "Recent Entries",
      color: "warning",
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
      {/* Decorative Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary-200/20 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[-5%] w-[40%] h-[50%] rounded-full bg-secondary-200/20 blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-12 pb-20">
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
            startContent={<User size={18} />}
          >
            Edit Skin Profile
          </Button>
        </header>

        {/* Navigation Grid - Now 2x2 on Desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {navCards.map((card) => (
            <Card
              key={card.href}
              as={Link}
              href={card.href}
              isPressable
              className="border-none shadow-xl bg-background/60 backdrop-blur-md hover:scale-[1.02] transition-transform duration-300"
            >
              <CardBody className="p-5 flex flex-col justify-between min-h-45">
                <div className="space-y-3">
                  <div
                    className={`p-2.5 rounded-xl w-fit bg-${card.color}-100/30`}
                  >
                    {card.icon}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">{card.title}</h2>
                    <p className="text-default-400 text-xs leading-tight line-clamp-2">
                      {card.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-default-100 mt-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-default-400">
                    {card.stats}
                  </span>
                  <ArrowRight className="size-3 text-default-400" />
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        {/* Recent Journal Entries Section */}
        <section className="mt-12 space-y-4">
          <div className="flex items-center justify-between px-1 flex-wrap gap-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <BookOpen className="size-5 text-warning" />
              Latest Progress
            </h2>
            <div className="flex gap-2">
              <JournalEntryModal size="sm" variant="flat" />
              <Button
                as={Link}
                href="/journal"
                size="sm"
                variant="light"
                endContent={<ChevronRight size={16} />}
              >
                Full Journal
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {entriesLoading
              ? Array(4)
                  .fill(0)
                  .map((_, i) => (
                    <Skeleton key={i} className="rounded-2xl aspect-square" />
                  ))
              : recentEntries?.rows.map((entry) => (
                  <Card
                    key={entry.$id}
                    as={Link}
                    href="/journal"
                    isPressable
                    className="group overflow-hidden rounded-2xl aspect-square border-none"
                  >
                    {entry.imageId ? (
                      <Image
                        removeWrapper
                        src={`/api/files/${entry.imageId}`}
                        className="z-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        alt="Journal entry"
                      />
                    ) : (
                      <div className="size-full bg-default-100 flex items-center justify-center text-default-300">
                        <BookOpen size={24} />
                      </div>
                    )}
                    <div className="absolute inset-0 z-10 bg-linear-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-3">
                      <p className="text-[10px] font-bold text-white/90 uppercase">
                        {new Date(entry.occurredAt).toLocaleDateString(
                          undefined,
                          { month: "short", day: "numeric" },
                        )}
                      </p>
                    </div>
                  </Card>
                ))}
            {!entriesLoading && recentEntries?.rows.length === 0 && (
              <Card className="col-span-full bg-default-50 border-dashed border-2 border-default-200 shadow-none">
                <CardBody className="py-8 flex flex-col items-center text-center gap-2">
                  <p className="text-sm text-default-500 font-medium">
                    No progress photos yet.
                  </p>
                  <Button
                    as={Link}
                    href="/journal"
                    size="sm"
                    color="warning"
                    variant="flat"
                  >
                    Start Your Journal
                  </Button>
                </CardBody>
              </Card>
            )}
          </div>
        </section>

        {/* Pro Tip Card */}
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
