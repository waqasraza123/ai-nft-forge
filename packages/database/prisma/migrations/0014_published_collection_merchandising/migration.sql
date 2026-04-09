ALTER TABLE "published_collections"
ADD COLUMN "is_featured" BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN "display_order" INTEGER NOT NULL DEFAULT 0;

WITH ranked_publications AS (
  SELECT
    "id",
    "brand_slug",
    ROW_NUMBER() OVER (
      PARTITION BY "brand_slug"
      ORDER BY "updated_at" DESC, "id" DESC
    ) AS "rank"
  FROM "published_collections"
)
UPDATE "published_collections" AS publication
SET
  "display_order" = ranked_publications."rank" - 1,
  "is_featured" = ranked_publications."rank" = 1
FROM ranked_publications
WHERE publication."id" = ranked_publications."id";

CREATE INDEX "published_collections_brand_featured_order_updated_at_idx"
ON "published_collections"(
  "brand_slug",
  "is_featured",
  "display_order",
  "updated_at"
);
