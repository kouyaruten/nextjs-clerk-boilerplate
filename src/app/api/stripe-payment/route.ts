import { auth } from "@clerk/nextjs";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2023-10-16",
});

export async function POST(req: NextRequest) {
  const { userId } = auth();
  const origin = req.headers.get("origin") || req.nextUrl.origin;

  try {
    // 1. 查找或创建 customer
    let customer: Stripe.Customer;
    const customers = await stripe.customers.search({
      query: `metadata['clerkUserId']:'${userId}'`,
      limit: 1,
    });

    if (customers.data.length > 0) {
      customer = customers.data[0];
    } else {
      // 创建新的 customer
      customer = await stripe.customers.create({
        metadata: { clerkUserId: userId },
      });
    }
    // 2. 创建 subscription checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ["card"],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: "subscription", // 改为订阅模式
      metadata: {
        userId, // clerk user id
      },
      subscription_data: {
        metadata: {
          userId, // 在订阅对象上也添加 userId
        },
      },
      success_url: `${origin}/dashboard`,
      cancel_url: `${origin}/dashboard`,
    });

    return NextResponse.json({ session }, { status: 200 });
  } catch (error) {
    if (error instanceof Error)
      throw new Error(
        `Error creating Stripe checkout session: ${error.message}`,
        { cause: error }
      );
  }
}
