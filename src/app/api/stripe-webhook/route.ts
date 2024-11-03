import { headers } from "next/headers";
import { clerkClient } from "@clerk/nextjs";
import { NextResponse } from "next/server";

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("Stripe-Signature") as string;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    return new NextResponse("Webhook error", { status: 400 });
  }

  const session = event.data.object as any;
  const userId = session?.metadata?.userId;

  if (!userId) {
    return new NextResponse("No user id", { status: 400 });
  }

  // 处理不同的 webhook 事件
  switch (event.type) {
    case "checkout.session.completed":
      const subscriptionId = session.subscription;
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const priceId = subscription.items.data[0].price.id;
      const price = await stripe.prices.retrieve(priceId);
      const product = await stripe.products.retrieve(price.product);

      // Get existing metadata to preserve other fields
      const user = await clerkClient.users.getUser(userId);
      const newMetadata = {
        stripeCurrentPeriodEnd: subscription.current_period_end,
        stripeSubscriptionStatus: "active",
        stripePriceId: priceId,
        stripePlanName: product.name,
        stripeMonthlyPrice: price.unit_amount / 100,
        credits: 10,
      };
      console.log(newMetadata);
      await clerkClient.users.updateUser(userId, {
        publicMetadata: newMetadata,
      });
      break;

    case "customer.subscription.updated":
      const updatedSubscription = await stripe.subscriptions.retrieve(
        session.id
      );
      const updatedPriceId = updatedSubscription.items.data[0].price.id;
      const updatedPrice = await stripe.prices.retrieve(updatedPriceId);
      const updatedProduct = await stripe.products.retrieve(
        updatedPrice.product
      );

      // Get existing metadata for update case
      const updatedUser = await clerkClient.users.getUser(userId);
      const updatedExistingMetadata = updatedUser.publicMetadata;

      await clerkClient.users.updateUser(userId, {
        publicMetadata: {
          stripeCurrentPeriodEnd: updatedSubscription.current_period_end,
          stripeSubscriptionStatus: updatedSubscription.status,
          stripePriceId: updatedPriceId,
          stripePlanName: updatedProduct.name,
          stripeMonthlyPrice: updatedPrice.unit_amount / 100,
          credits: 10,
        },
      });
      break;

    case "customer.subscription.deleted":
      // Get existing metadata for deletion case
      const deletedUser = await clerkClient.users.getUser(userId);
      const deletedExistingMetadata = deletedUser.publicMetadata;

      await clerkClient.users.updateUser(userId, {
        publicMetadata: {
          stripeCurrentPeriodEnd: 0,
          stripeSubscriptionStatus: "canceled",
          stripePriceId: null,
          stripePlanName: "Free",
          stripeMonthlyPrice: 0,
          credits: 0, // Reset credits when subscription is canceled
        },
      });
      break;
  }

  return new NextResponse(null, { status: 200 });
}
