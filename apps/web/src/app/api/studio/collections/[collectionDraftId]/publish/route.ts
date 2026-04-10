import { collectionPublicationMerchandisingRequestSchema } from "@ai-nft-forge/shared";
import { NextResponse } from "next/server";

import {
  createCollectionDraftErrorResponse,
  parseJsonBody,
  requireStudioApiSession
} from "../../../../../../server/collections/http";
import { createRuntimeCollectionDraftService } from "../../../../../../server/collections/runtime";

type RouteContext = {
  params: Promise<{
    collectionDraftId: string;
  }>;
};

export async function POST(_: Request, context: RouteContext) {
  try {
    const session = await requireStudioApiSession();
    const { collectionDraftId } = await context.params;
    const result =
      await createRuntimeCollectionDraftService().publishCollectionDraft({
        collectionDraftId,
        ownerUserId: session.user.id
      });

    return NextResponse.json(result);
  } catch (error) {
    return createCollectionDraftErrorResponse(error);
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  try {
    const session = await requireStudioApiSession();
    const { collectionDraftId } = await context.params;
    const result =
      await createRuntimeCollectionDraftService().unpublishCollectionDraft({
        collectionDraftId,
        ownerUserId: session.user.id
      });

    return NextResponse.json(result);
  } catch (error) {
    return createCollectionDraftErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await requireStudioApiSession();
    const { collectionDraftId } = await context.params;
    const body = collectionPublicationMerchandisingRequestSchema.parse(
      await parseJsonBody(request)
    );
    const result =
      await createRuntimeCollectionDraftService().updateCollectionPublicationMerchandising(
        {
          collectionDraftId,
          displayOrder: body.displayOrder,
          endAt: body.endAt ?? null,
          heroGeneratedAssetId: body.heroGeneratedAssetId ?? null,
          isFeatured: body.isFeatured,
          launchAt: body.launchAt ?? null,
          ownerUserId: session.user.id,
          priceAmountMinor: body.priceAmountMinor ?? null,
          priceCurrency: body.priceCurrency ?? null,
          priceLabel: body.priceLabel ?? null,
          primaryCtaHref: body.primaryCtaHref ?? null,
          primaryCtaLabel: body.primaryCtaLabel ?? null,
          secondaryCtaHref: body.secondaryCtaHref ?? null,
          secondaryCtaLabel: body.secondaryCtaLabel ?? null,
          soldCount: body.soldCount,
          storefrontBody: body.storefrontBody ?? null,
          storefrontHeadline: body.storefrontHeadline ?? null,
          storefrontStatus: body.storefrontStatus,
          totalSupply: body.totalSupply ?? null
        }
      );

    return NextResponse.json(result);
  } catch (error) {
    return createCollectionDraftErrorResponse(error);
  }
}
