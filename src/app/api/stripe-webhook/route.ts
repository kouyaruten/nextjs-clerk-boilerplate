import { clerkClient } from "@clerk/nextjs";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2023-10-16",
});
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  if (req === null)
    throw new Error(`Missing userId or request`, { cause: { req } });

  const stripeSignature = req.headers.get("stripe-signature");

  if (stripeSignature === null) throw new Error("stripeSignature is null");

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      await req.text(),
      stripeSignature,
      webhookSecret
    );
  } catch (error) {
    if (error instanceof Error)
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 400,
        }
      );
  }

  if (event === undefined) throw new Error(`event is undefined`);
  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object;
      console.log(`Payment successful for session ID: ${session.id}`);
      await clerkClient.users.updateUserMetadata(
        session.metadata?.userId as string,
        {
          publicMetadata: {
            stripe: {
              customerId: session.customer as string,
              subscriptionId: session.subscription as string,
              status: session.status,
              payment: session.payment_status,
            },
          },
        }
      );
      break;

    case "customer.subscription.updated":
      const subscription = event.data.object;
      await clerkClient.users.updateUserMetadata(
        subscription.metadata?.userId as string,
        {
          publicMetadata: {
            stripe: {
              subscriptionStatus: subscription.status,
              currentPeriodEnd: subscription.current_period_end,
            },
          },
        }
      );
      break;

    case "customer.subscription.deleted":
      const canceledSubscription = event.data.object;
      await clerkClient.users.updateUserMetadata(
        canceledSubscription.metadata?.userId as string,
        {
          publicMetadata: {
            stripe: {
              subscriptionStatus: "canceled",
              canceledAt: canceledSubscription.canceled_at,
            },
          },
        }
      );
      break;

    default:
      console.warn(`Unhandled event type: ${event.type}`);
  }

  NextResponse.json({ status: 200, message: "success" });
}
