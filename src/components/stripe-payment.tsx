import { loadStripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string
);

export default function CheckoutButton() {
  const handleCheckout = async () => {
    try {
      const stripe = await stripePromise;
      if (!stripe) {
        return;
      }

      const { session } = await (
        await fetch("/api/stripe-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quantity: 1,
            unit_amount: 100, // $1.00
          }),
        })
      ).json();

      await stripe.redirectToCheckout({
        sessionId: session.id,
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <section className="flex flex-col items-center ">
      <Button onClick={handleCheckout}>Subscribe</Button>
    </section>
  );
}
