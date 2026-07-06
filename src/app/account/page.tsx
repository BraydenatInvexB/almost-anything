"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Package, Heart, LogOut, User, RotateCcw, Shield, MapPin } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthProvider";
import { useFavorites } from "@/context/FavoritesProvider";
import { useCart } from "@/context/CartProvider";
import { AccountSubNav } from "@/components/account/AccountSubNav";

export default function AccountPage() {
  const router = useRouter();
  const { user, signOut, loading, isConfigured } = useAuth();
  const { favoriteCount } = useFavorites();
  const { itemCount } = useCart();
  const [isStaff, setIsStaff] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsStaff(false);
      return;
    }
    fetch("/api/admin/session")
      .then((res) => res.json())
      .then((data) => setIsStaff(Boolean(data.staff)))
      .catch(() => setIsStaff(false));
  }, [user]);

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  return (
    <div className="flex min-h-full flex-col bg-white">
      <SiteHeader />

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-8 sm:px-6">
        <AccountSubNav current="/account" />
        <h1 className="text-2xl font-bold text-neutral-900">My Account</h1>

        {isStaff ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand/20 bg-brand/5 px-4 py-3">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-brand" />
              <p className="text-sm text-neutral-700">
                You&apos;re signed in as staff. This page is for customer orders and favorites.
              </p>
            </div>
            <Link
              href="/admin"
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand/90"
            >
              Open admin console
            </Link>
          </div>
        ) : null}

        {!isConfigured || (!loading && !user) ? (
          <Card variant="elevated" className="mt-8 max-w-lg bg-white p-8 text-center">
            <User className="mx-auto h-12 w-12 text-neutral-300" />
            <p className="mt-4 font-medium">Sign in to access your account</p>
            <p className="mt-2 text-sm text-neutral-500">
              Track orders, save favorites, and manage your account.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link href="/login">
                <Button>Sign In</Button>
              </Link>
              <Link href="/signup">
                <Button variant="secondary">Create Account</Button>
              </Link>
            </div>
          </Card>
        ) : loading ? (
          <p className="mt-8 text-neutral-500">Loading...</p>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <Card variant="elevated" className="bg-white p-6 md:col-span-1">
              {user?.user_metadata?.avatar_url ? (
                <Image
                  src={user.user_metadata.avatar_url}
                  alt={user.user_metadata.full_name ?? "Avatar"}
                  width={64}
                  height={64}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-900 text-xl font-bold text-white">
                  {(user?.email?.[0] ?? "U").toUpperCase()}
                </div>
              )}
              <h2 className="mt-4 font-semibold">
                {user?.user_metadata?.full_name ?? "Member"}
              </h2>
              <p className="text-sm text-neutral-500">{user?.email}</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-4 text-red-500"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2 md:col-span-2">
              <Link href="/account/orders">
                <Card
                  variant="elevated"
                  className="bg-white p-6 transition-shadow hover:shadow-md"
                >
                  <Package className="h-8 w-8 text-neutral-900" />
                  <h3 className="mt-3 font-semibold">Orders</h3>
                  <p className="mt-1 text-sm text-neutral-500">
                    View order history and tracking
                  </p>
                </Card>
              </Link>

              <Link href="/account/returns">
                <Card
                  variant="elevated"
                  className="bg-white p-6 transition-shadow hover:shadow-md"
                >
                  <RotateCcw className="h-8 w-8 text-neutral-600" />
                  <h3 className="mt-3 font-semibold">Returns</h3>
                  <p className="mt-1 text-sm text-neutral-500">
                    Request and track return requests
                  </p>
                </Card>
              </Link>

              <Link href="/account/addresses">
                <Card
                  variant="elevated"
                  className="bg-white p-6 transition-shadow hover:shadow-md"
                >
                  <MapPin className="h-8 w-8 text-neutral-600" />
                  <h3 className="mt-3 font-semibold">Addresses</h3>
                  <p className="mt-1 text-sm text-neutral-500">
                    Saved shipping addresses for checkout
                  </p>
                </Card>
              </Link>

              <Link href="/favorites">
                <Card
                  variant="elevated"
                  className="bg-white p-6 transition-shadow hover:shadow-md"
                >
                  <Heart className="h-8 w-8 fill-red-500 text-red-500" />
                  <h3 className="mt-3 font-semibold">Favorites</h3>
                  <p className="mt-1 text-sm text-neutral-500">
                    {favoriteCount} saved items
                  </p>
                </Card>
              </Link>

              <Link href="/cart">
                <Card
                  variant="elevated"
                  className="bg-white p-6 transition-shadow hover:shadow-md"
                >
                  <Package className="h-8 w-8 text-neutral-600" />
                  <h3 className="mt-3 font-semibold">Cart</h3>
                  <p className="mt-1 text-sm text-neutral-500">
                    {itemCount} items in cart
                  </p>
                </Card>
              </Link>

            </div>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
