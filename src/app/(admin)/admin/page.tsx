"use client";

import { Card, CardBody, CardHeader } from "@heroui/react";
import { ChevronRight, Library, Tags } from "lucide-react";

import Link from "next/link";

export default function AdminDashboard() {
  const adminModules = [
    {
      title: "Brand Management",
      description: "Add or edit global manufacturers and their details.",
      href: "/admin/brands",
      icon: <Tags className="text-secondary" size={24} />,
      stats: "Master List",
    },
    {
      title: "Product Catalog",
      description: "Manage the master library of skincare products.",
      href: "/admin/products",
      icon: <Library className="text-secondary" size={24} />,
      stats: "Global Database",
    },
  ];

  return (
    <main className="flex flex-col gap-8 p-4 md:p-8 container mx-auto w-full">
      <header>
        <h1 className="text-2xl font-bold uppercase tracking-tight">
          Admin <span className="text-secondary">Dashboard</span>
        </h1>
        <p className="text-default-500">
          Select a module to manage the global application data.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {adminModules.map((module) => (
          <Card
            key={module.href}
            isPressable
            as={Link}
            href={module.href}
            className="border-none bg-content1 hover:bg-content2 transition-colors"
          >
            <CardHeader className="flex gap-4 p-5">
              <div className="p-3 rounded-xl bg-secondary/10">
                {module.icon}
              </div>
              <div className="flex flex-col text-left">
                <p className="text-large font-bold">{module.title}</p>
                <p className="text-small text-default-500">{module.stats}</p>
              </div>
            </CardHeader>
            <CardBody className="px-5 pb-5 pt-0 flex flex-row justify-between items-end">
              <p className="text-default-600 text-sm max-w-[80%]">
                {module.description}
              </p>
              <ChevronRight className="text-default-400" size={20} />
            </CardBody>
          </Card>
        ))}
      </div>
    </main>
  );
}
