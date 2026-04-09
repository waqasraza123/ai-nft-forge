export const aiNftForgeCollectionContractStandard = "erc721";

export const aiNftForgeSupportedCollectionContractChains = [
  {
    chainId: 84532,
    key: "base-sepolia",
    label: "Base Sepolia",
    network: "development"
  },
  {
    chainId: 8453,
    key: "base",
    label: "Base",
    network: "production"
  }
] as const;

export type AiNftForgeCollectionContractChain =
  (typeof aiNftForgeSupportedCollectionContractChains)[number];

function normalizeContractSymbolSegment(value: string) {
  return value.replace(/[^a-z0-9]/gi, "").toUpperCase();
}

function createContractSymbolSourceSegment(value: string) {
  const [firstSegment = value] = value.split(/[^a-z0-9]+/gi).filter(Boolean);

  return normalizeContractSymbolSegment(firstSegment);
}

function trimTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function joinPublicOriginAndPath(origin: string, path: string) {
  return `${trimTrailingSlash(origin)}${path}`;
}

export function createCollectionContractName(input: {
  brandName: string;
  collectionTitle: string;
}) {
  return `${input.brandName} ${input.collectionTitle}`.trim();
}

export function createCollectionContractSymbol(input: {
  brandSlug: string;
  collectionSlug: string;
}) {
  const brandSegment = createContractSymbolSourceSegment(input.brandSlug);
  const collectionSegment = createContractSymbolSourceSegment(
    input.collectionSlug
  );
  const rawSymbol = `${brandSegment.slice(0, 4)}${collectionSegment.slice(0, 7)}`;

  return rawSymbol.slice(0, 11) || "AINFTFORGE";
}

export function createCollectionContractPath(input: {
  brandSlug: string;
  collectionSlug: string;
}) {
  return `/brands/${input.brandSlug}/collections/${input.collectionSlug}/contract`;
}

export function createCollectionMetadataManifestPath(input: {
  brandSlug: string;
  collectionSlug: string;
}) {
  return `/brands/${input.brandSlug}/collections/${input.collectionSlug}/metadata`;
}

export function createCollectionPublicPath(input: {
  brandSlug: string;
  collectionSlug: string;
}) {
  return `/brands/${input.brandSlug}/collections/${input.collectionSlug}`;
}

export function createCollectionTokenUriBasePath(input: {
  brandSlug: string;
  collectionSlug: string;
}) {
  return `/brands/${input.brandSlug}/collections/${input.collectionSlug}/token-uri`;
}

export function createCollectionTokenUriPath(input: {
  brandSlug: string;
  collectionSlug: string;
  tokenId: number;
}) {
  return `${createCollectionTokenUriBasePath(input)}/${input.tokenId.toString()}`;
}

export function createCollectionTokenUriTemplatePath(input: {
  brandSlug: string;
  collectionSlug: string;
}) {
  return `${createCollectionTokenUriBasePath(input)}/{tokenId}`;
}

export function createCollectionContractUrl(input: {
  brandSlug: string;
  collectionSlug: string;
  origin: string;
}) {
  return joinPublicOriginAndPath(
    input.origin,
    createCollectionContractPath(input)
  );
}

export function createCollectionMetadataManifestUrl(input: {
  brandSlug: string;
  collectionSlug: string;
  origin: string;
}) {
  return joinPublicOriginAndPath(
    input.origin,
    createCollectionMetadataManifestPath(input)
  );
}

export function createCollectionPublicUrl(input: {
  brandSlug: string;
  collectionSlug: string;
  origin: string;
}) {
  return joinPublicOriginAndPath(
    input.origin,
    createCollectionPublicPath(input)
  );
}

export function createCollectionTokenUriBaseUrl(input: {
  brandSlug: string;
  collectionSlug: string;
  origin: string;
}) {
  return joinPublicOriginAndPath(
    input.origin,
    createCollectionTokenUriBasePath(input)
  );
}

export function createCollectionTokenUriUrl(input: {
  brandSlug: string;
  collectionSlug: string;
  origin: string;
  tokenId: number;
}) {
  return joinPublicOriginAndPath(
    input.origin,
    createCollectionTokenUriPath(input)
  );
}

export function createCollectionTokenUriTemplateUrl(input: {
  brandSlug: string;
  collectionSlug: string;
  origin: string;
}) {
  return joinPublicOriginAndPath(
    input.origin,
    createCollectionTokenUriTemplatePath(input)
  );
}
