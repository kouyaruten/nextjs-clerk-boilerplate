"use client";
import Image from "next/image";
import { UserButton, useUser } from "@clerk/nextjs";
import CheckoutButton from "../../components/stripe-payment";

// 定义 Stripe 元数据的类型
type StripeMetadata = {
  stripe: {
    status: string;
    payment: string;
    currentPeriodEnd: number;
    subscriptionStatus: string;
  };
};

export default function DashboardPage() {
  const { user } = useUser();

  // 使用类型断言来确保类型安全
  const stripeData = (user?.publicMetadata as StripeMetadata)?.stripe;

  return (
    <div className="grid col-auto place-content-center p-8">
      <div className="flex flex-col items-center gap-4">
        <UserButton />

        <div className="mt-8 space-y-4">
          <h2 className="text-2xl font-bold">User Information</h2>

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

          {/* Stripe Metadata */}
          <div className="mt-6">
            <h3 className="text-xl font-semibold">Membership Status</h3>
            <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
              <p>
                <span className="font-semibold">Status:</span>{" "}
                {stripeData?.status || "Not available"}
              </p>
              <p>
                <span className="font-semibold">Payment:</span>{" "}
                {stripeData?.payment || "Not available"}
              </p>
              <p>
                <span className="font-semibold">Subscription Status:</span>{" "}
                {stripeData?.subscriptionStatus || "Not available"}
              </p>
              <p>
                <span className="font-semibold">Current Period End:</span>{" "}
                {stripeData?.currentPeriodEnd
                  ? new Date(
                      stripeData.currentPeriodEnd * 1000
                    ).toLocaleDateString()
                  : "Not available"}
              </p>
            </div>
          </div>
          {stripeData?.subscriptionStatus !== "active" && <CheckoutButton />}
        </div>
      </div>
    </div>
  );
}
