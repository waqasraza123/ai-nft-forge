import type { SourceAsset, SourceAssetStatus } from "@prisma/client";

import type { DatabaseExecutor } from "../client.js";

type SourceAssetRepositoryDatabase = Pick<DatabaseExecutor, "sourceAsset">;

type CreatePendingSourceAssetInput = {
  contentType: string;
  originalFilename: string;
  ownerUserId: string;
  storageBucket: string;
  storageObjectKey: string;
};

export function createSourceAssetRepository(
  database: SourceAssetRepositoryDatabase
) {
  return {
    createPendingUpload(
      input: CreatePendingSourceAssetInput
    ): Promise<SourceAsset> {
      return database.sourceAsset.create({
        data: {
          ...input,
          status: "pending_upload"
        }
      });
    },

    findByIdForOwner(input: {
      id: string;
      ownerUserId: string;
    }): Promise<SourceAsset | null> {
      return database.sourceAsset.findFirst({
        where: {
          id: input.id,
          ownerUserId: input.ownerUserId
        }
      });
    },

    listByOwnerUserId(ownerUserId: string): Promise<SourceAsset[]> {
      return database.sourceAsset.findMany({
        orderBy: {
          createdAt: "desc"
        },
        where: {
          ownerUserId
        }
      });
    },

    updateUploadState(input: {
      byteSize: number | null;
      id: string;
      status: SourceAssetStatus;
      uploadedAt: Date | null;
    }): Promise<SourceAsset> {
      return database.sourceAsset.update({
        data: {
          byteSize: input.byteSize,
          status: input.status,
          uploadedAt: input.uploadedAt
        },
        where: {
          id: input.id
        }
      });
    }
  };
}

export type SourceAssetRepository = ReturnType<
  typeof createSourceAssetRepository
>;
