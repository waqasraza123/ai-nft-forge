"use client";

import Link from "next/link";
import {
  startTransition,
  type FormEvent,
  useEffect,
  useEffectEvent,
  useState
} from "react";

import {
  defaultStudioBrandAccentColor,
  defaultStudioBrandThemePreset,
  defaultStudioBrandLandingDescription,
  defaultStudioBrandLandingHeadline,
  defaultStudioFeaturedReleaseLabel,
  studioSettingsResponseSchema,
  type StudioSettingsSummary
} from "@ai-nft-forge/shared";
import {
  MetricTile,
  PageShell,
  Pill,
  SurfaceCard,
  SurfaceGrid
} from "@ai-nft-forge/ui";

type StudioSettingsClientProps = {
  initialSettings: StudioSettingsSummary | null;
  ownerWalletAddress: string;
};

type NoticeState = {
  message: string;
  tone: "error" | "info" | "success";
} | null;

function createFallbackErrorMessage(response: Response) {
  switch (response.status) {
    case 401:
      return "An active studio session is required.";
    case 409:
      return "The requested studio settings conflict with existing records.";
    default:
      return "The studio settings request could not be completed.";
  }
}

async function parseJsonResponse<T>(input: {
  response: Response;
  schema: {
    parse(value: unknown): T;
  };
}): Promise<T> {
  const payload = await input.response.json().catch(() => null);

  if (!input.response.ok) {
    if (
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof payload.error === "object" &&
      payload.error !== null &&
      "message" in payload.error &&
      typeof payload.error.message === "string"
    ) {
      throw new Error(payload.error.message);
    }

    throw new Error(createFallbackErrorMessage(input.response));
  }

  return input.schema.parse(payload);
}

function createInitialEditorState(settings: StudioSettingsSummary | null) {
  return {
    accentColor: settings?.brand.accentColor ?? defaultStudioBrandAccentColor,
    brandName: settings?.brand.name ?? "",
    brandSlug: settings?.brand.slug ?? "",
    customDomain: settings?.brand.customDomain ?? "",
    featuredReleaseLabel:
      settings?.brand.featuredReleaseLabel ?? defaultStudioFeaturedReleaseLabel,
    heroKicker: settings?.brand.heroKicker ?? "",
    landingDescription:
      settings?.brand.landingDescription ??
      defaultStudioBrandLandingDescription,
    landingHeadline:
      settings?.brand.landingHeadline ?? defaultStudioBrandLandingHeadline,
    primaryCtaLabel: settings?.brand.primaryCtaLabel ?? "",
    secondaryCtaLabel: settings?.brand.secondaryCtaLabel ?? "",
    storyBody: settings?.brand.storyBody ?? "",
    storyHeadline: settings?.brand.storyHeadline ?? "",
    themePreset: settings?.brand.themePreset ?? defaultStudioBrandThemePreset,
    wordmark: settings?.brand.wordmark ?? "",
    workspaceName: settings?.workspace.name ?? "",
    workspaceSlug: settings?.workspace.slug ?? ""
  };
}

export function StudioSettingsClient({
  initialSettings,
  ownerWalletAddress
}: StudioSettingsClientProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [editorState, setEditorState] = useState(() =>
    createInitialEditorState(initialSettings)
  );
  const [notice, setNotice] = useState<NoticeState>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setEditorState(createInitialEditorState(settings));
  }, [settings]);

  const refreshSettings = useEffectEvent(
    async (input?: { silent?: boolean }) => {
      if (!input?.silent) {
        setIsRefreshing(true);
      }

      try {
        const response = await fetch("/api/studio/settings", {
          cache: "no-store"
        });
        const result = await parseJsonResponse({
          response,
          schema: studioSettingsResponseSchema
        });

        startTransition(() => {
          setSettings(result.settings);
        });
      } catch (error) {
        setNotice({
          message:
            error instanceof Error
              ? error.message
              : "Studio settings could not be refreshed.",
          tone: "error"
        });
      } finally {
        if (!input?.silent) {
          setIsRefreshing(false);
        }
      }
    }
  );

  async function handleSaveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSaving(true);
    setNotice({
      message: settings
        ? "Saving studio settings…"
        : "Creating studio identity…",
      tone: "info"
    });

    try {
      const response = await fetch("/api/studio/settings", {
        body: JSON.stringify(editorState),
        headers: {
          "Content-Type": "application/json"
        },
        method: "PUT"
      });
      const result = await parseJsonResponse({
        response,
        schema: studioSettingsResponseSchema
      });

      startTransition(() => {
        setSettings(result.settings);
      });
      setNotice({
        message: "Studio settings saved.",
        tone: "success"
      });
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : "Studio settings could not be saved.",
        tone: "error"
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <PageShell
      eyebrow="Settings"
      title="Define the durable studio identity"
      lead="This protected settings surface owns the workspace and public brand profile used by collection publication. Saved settings now also carry storefront landing copy so the public brand route can be merchandised without hardcoded page text."
      actions={
        <>
          <button
            className="button-action"
            disabled={isRefreshing}
            onClick={() => {
              void refreshSettings();
            }}
            type="button"
          >
            {isRefreshing ? "Refreshing…" : "Refresh data"}
          </button>
          <Link className="action-link" href="/studio/collections">
            Open collections
          </Link>
          <Link className="inline-link" href="/studio">
            Back to studio
          </Link>
        </>
      }
      tone="studio"
    >
      <SurfaceGrid>
        <SurfaceCard
          body="Workspace and brand identity are now persisted behind the session boundary and reused by collection publication. This keeps public routes stable and removes ad hoc brand entry during publish."
          eyebrow="Phase 3"
          span={12}
          title="Owner-scoped studio profile"
        >
          <div className="metric-list">
            <MetricTile label="Owner" value={ownerWalletAddress} />
            <MetricTile
              label="Workspace"
              value={settings?.workspace.slug ?? "Unconfigured"}
            />
            <MetricTile
              label="Brand"
              value={settings?.brand.slug ?? "Unconfigured"}
            />
            <MetricTile
              label="Domain"
              value={settings?.brand.customDomain ?? "Default route"}
            />
          </div>
          <div className="pill-row">
            <Pill>/studio/settings</Pill>
            <Pill>
              {settings?.brand.publicBrandPath ?? "/brands/[brandSlug]"}
            </Pill>
            <Pill>
              {settings?.brand.accentColor ?? defaultStudioBrandAccentColor}
            </Pill>
            <Pill>
              {settings?.brand.themePreset ?? defaultStudioBrandThemePreset}
            </Pill>
          </div>
        </SurfaceCard>
        <SurfaceCard
          body="Configure the durable workspace slug, public brand slug, brand route copy, and storefront accent. These settings become the reusable source of truth for public presentation and collection publication."
          eyebrow="Profile"
          span={8}
          title={settings ? "Update studio identity" : "Create studio identity"}
        >
          <form className="studio-form" onSubmit={handleSaveSettings}>
            <label className="field-stack">
              <span className="field-label">Workspace name</span>
              <input
                className="input-field"
                maxLength={120}
                onChange={(event) => {
                  setEditorState((current) => ({
                    ...current,
                    workspaceName: event.target.value
                  }));
                }}
                placeholder="Forge Operations"
                required
                value={editorState.workspaceName}
              />
            </label>
            <label className="field-stack">
              <span className="field-label">Workspace slug</span>
              <input
                className="input-field"
                maxLength={80}
                onChange={(event) => {
                  setEditorState((current) => ({
                    ...current,
                    workspaceSlug: event.target.value
                  }));
                }}
                pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                placeholder="forge-operations"
                required
                value={editorState.workspaceSlug}
              />
            </label>
            <label className="field-stack">
              <span className="field-label">Brand name</span>
              <input
                className="input-field"
                maxLength={120}
                onChange={(event) => {
                  setEditorState((current) => ({
                    ...current,
                    brandName: event.target.value
                  }));
                }}
                placeholder="Forge Editions"
                required
                value={editorState.brandName}
              />
            </label>
            <label className="field-stack">
              <span className="field-label">Brand slug</span>
              <input
                className="input-field"
                maxLength={80}
                onChange={(event) => {
                  setEditorState((current) => ({
                    ...current,
                    brandSlug: event.target.value
                  }));
                }}
                pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                placeholder="forge-editions"
                required
                value={editorState.brandSlug}
              />
            </label>
            <label className="field-stack">
              <span className="field-label">Custom domain</span>
              <input
                className="input-field"
                maxLength={253}
                onChange={(event) => {
                  setEditorState((current) => ({
                    ...current,
                    customDomain: event.target.value
                  }));
                }}
                placeholder="collections.example.com"
                value={editorState.customDomain}
              />
            </label>
            <label className="field-stack">
              <span className="field-label">Theme preset</span>
              <select
                className="input-field"
                onChange={(event) => {
                  setEditorState((current) => ({
                    ...current,
                    themePreset: event.target.value as
                      | "editorial_warm"
                      | "gallery_mono"
                      | "midnight_launch"
                  }));
                }}
                value={editorState.themePreset}
              >
                <option value="editorial_warm">Editorial warm</option>
                <option value="gallery_mono">Gallery mono</option>
                <option value="midnight_launch">Midnight launch</option>
              </select>
            </label>
            <label className="field-stack">
              <span className="field-label">Landing headline</span>
              <input
                className="input-field"
                maxLength={120}
                onChange={(event) => {
                  setEditorState((current) => ({
                    ...current,
                    landingHeadline: event.target.value
                  }));
                }}
                placeholder="Curated collectible releases"
                required
                value={editorState.landingHeadline}
              />
            </label>
            <label className="field-stack">
              <span className="field-label">Landing description</span>
              <textarea
                className="input-field input-field--multiline"
                maxLength={280}
                onChange={(event) => {
                  setEditorState((current) => ({
                    ...current,
                    landingDescription: event.target.value
                  }));
                }}
                rows={5}
                value={editorState.landingDescription}
              />
            </label>
            <label className="field-stack">
              <span className="field-label">Wordmark</span>
              <input
                className="input-field"
                maxLength={40}
                onChange={(event) => {
                  setEditorState((current) => ({
                    ...current,
                    wordmark: event.target.value
                  }));
                }}
                placeholder="Forge Editions"
                value={editorState.wordmark}
              />
            </label>
            <label className="field-stack">
              <span className="field-label">Hero kicker</span>
              <input
                className="input-field"
                maxLength={60}
                onChange={(event) => {
                  setEditorState((current) => ({
                    ...current,
                    heroKicker: event.target.value
                  }));
                }}
                placeholder="Season three launch"
                value={editorState.heroKicker}
              />
            </label>
            <label className="field-stack">
              <span className="field-label">Story headline</span>
              <input
                className="input-field"
                maxLength={120}
                onChange={(event) => {
                  setEditorState((current) => ({
                    ...current,
                    storyHeadline: event.target.value
                  }));
                }}
                placeholder="A collectible portrait program built for premium launches."
                value={editorState.storyHeadline}
              />
            </label>
            <label className="field-stack">
              <span className="field-label">Story body</span>
              <textarea
                className="input-field input-field--multiline"
                maxLength={600}
                onChange={(event) => {
                  setEditorState((current) => ({
                    ...current,
                    storyBody: event.target.value
                  }));
                }}
                rows={5}
                value={editorState.storyBody}
              />
            </label>
            <label className="field-stack">
              <span className="field-label">Featured release label</span>
              <input
                className="input-field"
                maxLength={40}
                onChange={(event) => {
                  setEditorState((current) => ({
                    ...current,
                    featuredReleaseLabel: event.target.value
                  }));
                }}
                placeholder="Featured release"
                required
                value={editorState.featuredReleaseLabel}
              />
            </label>
            <label className="field-stack">
              <span className="field-label">Primary CTA label</span>
              <input
                className="input-field"
                maxLength={40}
                onChange={(event) => {
                  setEditorState((current) => ({
                    ...current,
                    primaryCtaLabel: event.target.value
                  }));
                }}
                placeholder="View featured release"
                value={editorState.primaryCtaLabel}
              />
            </label>
            <label className="field-stack">
              <span className="field-label">Secondary CTA label</span>
              <input
                className="input-field"
                maxLength={40}
                onChange={(event) => {
                  setEditorState((current) => ({
                    ...current,
                    secondaryCtaLabel: event.target.value
                  }));
                }}
                placeholder="Browse archive"
                value={editorState.secondaryCtaLabel}
              />
            </label>
            <label className="field-stack">
              <span className="field-label">Accent color</span>
              <div className="color-input-row">
                <input
                  className="color-swatch-input"
                  onChange={(event) => {
                    setEditorState((current) => ({
                      ...current,
                      accentColor: event.target.value
                    }));
                  }}
                  type="color"
                  value={editorState.accentColor}
                />
                <input
                  className="input-field"
                  maxLength={7}
                  onChange={(event) => {
                    setEditorState((current) => ({
                      ...current,
                      accentColor: event.target.value
                    }));
                  }}
                  pattern="^#[0-9a-fA-F]{6}$"
                  required
                  value={editorState.accentColor}
                />
              </div>
            </label>
            <div className="studio-action-row">
              <button
                className="button-action button-action--accent"
                disabled={isSaving}
                type="submit"
              >
                {isSaving
                  ? "Saving…"
                  : settings
                    ? "Save settings"
                    : "Create settings"}
              </button>
            </div>
          </form>
        </SurfaceCard>
        <SurfaceCard
          body="These values become the durable publication target for review-ready drafts and the editorial source of truth for the public brand landing. Brand slug changes are still validated against existing public collection routes before they are accepted."
          eyebrow="Preview"
          span={4}
          title="Storefront preview"
        >
          <div className="settings-preview-card">
            <div
              className="settings-preview-card__swatch"
              style={{ backgroundColor: editorState.accentColor }}
            />
            <div className="settings-preview-card__copy">
              <strong>
                {editorState.wordmark || editorState.brandName || "Wordmark"}
              </strong>
              <span>{editorState.heroKicker || "Hero kicker"}</span>
              <span>{editorState.themePreset.replaceAll("_", " ")}</span>
            </div>
            <div className="settings-preview-card__copy">
              <strong>
                {editorState.landingHeadline || "Landing headline"}
              </strong>
              <span>{editorState.landingDescription}</span>
              <span>
                {editorState.featuredReleaseLabel ||
                  defaultStudioFeaturedReleaseLabel}
              </span>
            </div>
            <div className="settings-preview-card__copy">
              <strong>{editorState.storyHeadline || "Story headline"}</strong>
              <span>{editorState.storyBody || "Story body preview"}</span>
              <span>
                {editorState.primaryCtaLabel || "Primary CTA"} /{" "}
                {editorState.secondaryCtaLabel || "Secondary CTA"}
              </span>
            </div>
            <div className="settings-preview-card__copy">
              <strong>{editorState.brandName || "Brand name"}</strong>
              <span>
                {editorState.brandSlug
                  ? `/brands/${editorState.brandSlug}`
                  : "/brands/[brandSlug]"}
              </span>
              <span>
                {editorState.customDomain || "No custom domain configured"}
              </span>
            </div>
          </div>
          <div className="pill-row">
            <Pill>{editorState.workspaceSlug || "workspace-slug"}</Pill>
            <Pill>{editorState.brandSlug || "brand-slug"}</Pill>
            <Pill>{editorState.accentColor}</Pill>
            <Pill>{editorState.themePreset.replaceAll("_", " ")}</Pill>
            <Pill>
              {editorState.featuredReleaseLabel ||
                defaultStudioFeaturedReleaseLabel}
            </Pill>
          </div>
          <div className="settings-preview-links">
            <Link className="inline-link" href="/studio/collections">
              Collections publish from this profile
            </Link>
            <Link className="inline-link" href="/studio/assets">
              Generated assets still feed the same curation path
            </Link>
          </div>
        </SurfaceCard>
      </SurfaceGrid>
      {notice ? (
        <div className={`notice-banner notice-banner--${notice.tone}`}>
          {notice.message}
        </div>
      ) : null}
    </PageShell>
  );
}
