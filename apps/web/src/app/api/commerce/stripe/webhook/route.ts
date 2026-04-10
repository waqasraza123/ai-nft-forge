import { createRuntimeCollectionCommerceService } from "../../../../../server/commerce/runtime";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return new Response("Missing stripe-signature header.", {
      status: 400
    });
  }

  const payload = await request.text();

  try {
    await createRuntimeCollectionCommerceService().handleStripeWebhook({
      payload,
      signature
    });

    return new Response("ok", {
      status: 200
    });
  } catch (error) {
    return new Response(
      error instanceof Error ? error.message : "Invalid Stripe webhook.",
      {
        status: 400
      }
    );
  }
}
