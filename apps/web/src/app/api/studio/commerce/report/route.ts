import { studioCommerceReportQuerySchema } from "@ai-nft-forge/shared";
import { NextResponse } from "next/server";

import {
  createCommerceErrorResponse,
  requireStudioApiSession
} from "../../../../../server/commerce/http";
import { createRuntimeCollectionCommerceService } from "../../../../../server/commerce/runtime";

function parseReportQuery(request: Request) {
  const { searchParams } = new URL(request.url);

  return studioCommerceReportQuerySchema.parse({
    brandSlug: searchParams.get("brandSlug") ?? undefined
  });
}

export async function GET(request: Request) {
  try {
    const session = await requireStudioApiSession();
    const query = parseReportQuery(request);
    const format = new URL(request.url).searchParams.get("format");
    const commerceService = createRuntimeCollectionCommerceService();

    if (format === "csv") {
      const result = await commerceService.exportOwnerCommerceReportCsv({
        ...(query.brandSlug
          ? {
              brandSlug: query.brandSlug
            }
          : {}),
        ownerUserId: session.ownerUserId
      });

      return new NextResponse(result.csv, {
        headers: {
          "Content-Disposition": `attachment; filename=\"${result.filename}\"`,
          "Content-Type": "text/csv; charset=utf-8"
        },
        status: 200
      });
    }

    const result = await commerceService.getOwnerCommerceReport({
      ...(query.brandSlug
        ? {
            brandSlug: query.brandSlug
          }
        : {}),
      ownerUserId: session.ownerUserId
    });

    return NextResponse.json(result);
  } catch (error) {
    return createCommerceErrorResponse(error);
  }
}
