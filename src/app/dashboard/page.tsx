"use client";
import Image from "next/image";
import { UserButton, useUser } from "@clerk/nextjs";
import CheckoutButton from "../../components/stripe-payment";
import Link from "next/link";
import Loader from "@/components/ui/Loader";
import AIChatForm from "@/components/AIChatForm";

// 定义 Stripe 元数据的类型
type UserMetadata = {
  stripeCurrentPeriodEnd: number;
  stripeSubscriptionStatus: string;
  stripePlanName: string;
  stripeMonthlyPrice: number;
  credits: number;
};

export default function DashboardPage() {
  const { user, isLoaded } = useUser();

  // 使用类型断言来确保类型安全
  const userMetadata = user?.publicMetadata as UserMetadata;

  // Show loader while Clerk is loading user data
  if (!isLoaded) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="grid col-auto place-content-center p-8">
      <div className="container flex flex-col items-start gap-4">
        <UserButton />
        <h2 className="text-2xl font-bold tracking-tight">User Information</h2>

        <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2 w-[600px]">
          {/* User Details */}
          <div className="space-y-2">
            <p>
              <span className="font-semibold">Email:</span>{" "}
              {user?.primaryEmailAddress?.emailAddress}
            </p>
            <p>
              <span className="font-semibold">Full Name:</span> {user?.fullName}
            </p>
            <p>
              <span className="font-semibold">User ID:</span> {user?.id}
            </p>
          </div>
        </div>

        {/* Stripe Metadata */}
        <div className="mt-6">
          <h3 className="text-2xl font-bold tracking-tight">
            Membership Status
          </h3>
          <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2 w-[600px]">
            <p>
              <span className="font-semibold">Subscription Status:</span>{" "}
              {userMetadata?.stripeSubscriptionStatus || "Not available"}
            </p>
            <p>
              <span className="font-semibold">Current Period End:</span>{" "}
              {userMetadata?.stripeCurrentPeriodEnd
                ? new Date(
                    userMetadata.stripeCurrentPeriodEnd * 1000
                  ).toLocaleDateString()
                : "Not available"}
            </p>
            <p>
              <span className="font-semibold">Plan Name:</span>{" "}
              {userMetadata?.stripePlanName || "Not available"}
            </p>
            <p>
              <span className="font-semibold">Monthly Price:</span>{" "}
              {userMetadata?.stripeMonthlyPrice}
            </p>
            {userMetadata?.stripeSubscriptionStatus !== "active" && (
              <CheckoutButton />
            )}
            {userMetadata?.stripeSubscriptionStatus === "active" && (
              <Link
                href="https://billing.stripe.com/p/login/test_7sI4ia4KYchR3nO3cc"
                target="_blank"
                className="text-blue-500 hover:underline"
              >
                Manage subscription ↗
              </Link>
            )}
          </div>
        </div>

        {/* Credits info */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Credits</h2>
          <p>
            Subscribe using{" "}
            <span className="font-mono bg-gray-100 p-2">4242424242424242</span>{" "}
            to get 10 credits.
          </p>
          <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2 w-[600px]">
            <AIChatForm />
          </div>
        </div>
      </div>
    </div>
  );
}
