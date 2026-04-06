import type { GeneratedAsset } from "@prisma/client";

import type { DatabaseExecutor } from "../client.js";

type GeneratedAssetRepositoryDatabase = Pick<
  DatabaseExecutor,
  "generatedAsset"
>;

type CreateGeneratedAssetInput = {
  byteSize: number | null;
  contentType: string;
  generationRequestId: string;
  ownerUserId: string;
  sourceAssetId: string;
  storageBucket: string;
  storageObjectKey: string;
  variantIndex: number;
};

export function createGeneratedAssetRepository(
  database: GeneratedAssetRepositoryDatabase
) {
  return {
    createMany(inputs: CreateGeneratedAssetInput[]): Promise<GeneratedAsset[]> {
      return Promise.all(
        inputs.map((input) =>
          database.generatedAsset.create({
            data: input
          })
        )
      );
    },

    listByGenerationRequestIds(
      generationRequestIds: string[]
    ): Promise<GeneratedAsset[]> {
      if (generationRequestIds.length === 0) {
        return Promise.resolve([]);
      }

      return database.generatedAsset.findMany({
        orderBy: [
          {
            generationRequestId: "desc"
          },
          {
            variantIndex: "asc"
          }
        ],
        where: {
          generationRequestId: {
            in: generationRequestIds
          }
        }
      });
    }
  };
}

export type GeneratedAssetRepository = ReturnType<
  typeof createGeneratedAssetRepository
>;
