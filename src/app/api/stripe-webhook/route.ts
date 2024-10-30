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
      await clerkClient.users.updateUser(userId, {
        publicMetadata: {
          stripe: {
            currentPeriodEnd: subscription.current_period_end,
            subscriptionStatus: "active",
            priceId: priceId,
            planName: product.name,
            monthlyPrice: price.unit_amount / 100,
          },
        },
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

      await clerkClient.users.updateUser(userId, {
        publicMetadata: {
          stripe: {
            currentPeriodEnd: updatedSubscription.current_period_end,
            subscriptionStatus: updatedSubscription.status,
            priceId: updatedPriceId,
            planName: updatedProduct.name,
            monthlyPrice: updatedPrice.unit_amount / 100,
          },
        },
      });
      break;

    case "customer.subscription.deleted":
      await clerkClient.users.updateUser(userId, {
        publicMetadata: {
          stripe: {
            currentPeriodEnd: 0,
            subscriptionStatus: "canceled",
            priceId: null,
            planName: "Free",
            monthlyPrice: 0,
          },
        },
      });
      break;
  }

  return new NextResponse(null, { status: 200 });
}
