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
  defaultStudioBrandLandingDescription,
  defaultStudioBrandLandingHeadline,
  defaultStudioBrandThemePreset,
  defaultStudioFeaturedReleaseLabel,
  studioBrandResponseSchema,
  studioSettingsResponseSchema,
  studioWorkspaceMemberDeleteResponseSchema,
  studioWorkspaceMemberResponseSchema,
  type StudioBrandSummary,
  type StudioSettingsSummary,
  type StudioWorkspaceMemberSummary
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

type StudioBrandEditorState = {
  accentColor: string;
  brandName: string;
  brandSlug: string;
  customDomain: string;
  featuredReleaseLabel: string;
  heroKicker: string;
  landingDescription: string;
  landingHeadline: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  storyBody: string;
  storyHeadline: string;
  themePreset: "editorial_warm" | "gallery_mono" | "midnight_launch";
  wordmark: string;
  workspaceName: string;
  workspaceSlug: string;
};

type NewBrandState = {
  accentColor: string;
  brandName: string;
  brandSlug: string;
  themePreset: "editorial_warm" | "gallery_mono" | "midnight_launch";
};

type MemberState = {
  walletAddress: string;
};

function createFallbackErrorMessage(response: Response) {
  switch (response.status) {
    case 401:
      return "An active studio session is required.";
    case 403:
      return "Only workspace owners can change these studio settings.";
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
  const brand = settings?.brands[0] ?? settings?.brand ?? null;

  return {
    accentColor: brand?.accentColor ?? defaultStudioBrandAccentColor,
    brandName: brand?.name ?? "",
    brandSlug: brand?.slug ?? "",
    customDomain: brand?.customDomain ?? "",
    featuredReleaseLabel:
      brand?.featuredReleaseLabel ?? defaultStudioFeaturedReleaseLabel,
    heroKicker: brand?.heroKicker ?? "",
    landingDescription:
      brand?.landingDescription ?? defaultStudioBrandLandingDescription,
    landingHeadline:
      brand?.landingHeadline ?? defaultStudioBrandLandingHeadline,
    primaryCtaLabel: brand?.primaryCtaLabel ?? "",
    secondaryCtaLabel: brand?.secondaryCtaLabel ?? "",
    storyBody: brand?.storyBody ?? "",
    storyHeadline: brand?.storyHeadline ?? "",
    themePreset: brand?.themePreset ?? defaultStudioBrandThemePreset,
    wordmark: brand?.wordmark ?? "",
    workspaceName: settings?.workspace.name ?? "",
    workspaceSlug: settings?.workspace.slug ?? ""
  };
}

function createEditorState(input: {
  brand: StudioBrandSummary | null;
  workspace: StudioSettingsSummary["workspace"] | null;
}): StudioBrandEditorState {
  return {
    accentColor: input.brand?.accentColor ?? defaultStudioBrandAccentColor,
    brandName: input.brand?.name ?? "",
    brandSlug: input.brand?.slug ?? "",
    customDomain: input.brand?.customDomain ?? "",
    featuredReleaseLabel:
      input.brand?.featuredReleaseLabel ?? defaultStudioFeaturedReleaseLabel,
    heroKicker: input.brand?.heroKicker ?? "",
    landingDescription:
      input.brand?.landingDescription ?? defaultStudioBrandLandingDescription,
    landingHeadline:
      input.brand?.landingHeadline ?? defaultStudioBrandLandingHeadline,
    primaryCtaLabel: input.brand?.primaryCtaLabel ?? "",
    secondaryCtaLabel: input.brand?.secondaryCtaLabel ?? "",
    storyBody: input.brand?.storyBody ?? "",
    storyHeadline: input.brand?.storyHeadline ?? "",
    themePreset: input.brand?.themePreset ?? defaultStudioBrandThemePreset,
    wordmark: input.brand?.wordmark ?? "",
    workspaceName: input.workspace?.name ?? "",
    workspaceSlug: input.workspace?.slug ?? ""
  };
}

function createInitialNewBrandState(): NewBrandState {
  return {
    accentColor: defaultStudioBrandAccentColor,
    brandName: "",
    brandSlug: "",
    themePreset: defaultStudioBrandThemePreset
  };
}

function createInitialMemberState(): MemberState {
  return {
    walletAddress: ""
  };
}

function resolveSelectedBrandId(input: {
  currentBrandId: string | null;
  settings: StudioSettingsSummary | null;
}) {
  if (
    input.currentBrandId &&
    input.settings?.brands.some((brand) => brand.id === input.currentBrandId)
  ) {
    return input.currentBrandId;
  }

  return input.settings?.brands[0]?.id ?? input.settings?.brand.id ?? null;
}

export function StudioSettingsClient({
  initialSettings,
  ownerWalletAddress
}: StudioSettingsClientProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(
    initialSettings?.brands[0]?.id ?? initialSettings?.brand.id ?? null
  );
  const [editorState, setEditorState] = useState<StudioBrandEditorState>(() =>
    createInitialEditorState(initialSettings)
  );
  const [newBrandState, setNewBrandState] = useState<NewBrandState>(() =>
    createInitialNewBrandState()
  );
  const [memberState, setMemberState] = useState<MemberState>(() =>
    createInitialMemberState()
  );
  const [notice, setNotice] = useState<NoticeState>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingBrand, setIsCreatingBrand] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [removingMembershipId, setRemovingMembershipId] = useState<
    string | null
  >(null);

  const access = settings?.access ?? {
    canManageMembers: true,
    canManageOnchain: true,
    canManageOpsPolicy: true,
    canManageWorkspace: true,
    canPublishCollections: true,
    role: "owner" as const
  };
  const canManageMembers = access.canManageMembers;
  const canManageWorkspace = access.canManageWorkspace;

  const selectedBrand =
    settings?.brands.find((brand) => brand.id === selectedBrandId) ??
    settings?.brands[0] ??
    settings?.brand ??
    null;

  useEffect(() => {
    const nextSelectedBrandId = resolveSelectedBrandId({
      currentBrandId: selectedBrandId,
      settings
    });

    if (nextSelectedBrandId !== selectedBrandId) {
      setSelectedBrandId(nextSelectedBrandId);
      return;
    }

    setEditorState(
      createEditorState({
        brand: selectedBrand,
        workspace: settings?.workspace ?? null
      })
    );
  }, [selectedBrand, selectedBrandId, settings]);

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
          setSelectedBrandId((currentBrandId) =>
            resolveSelectedBrandId({
              currentBrandId,
              settings: result.settings
            })
          );
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

    if (!canManageWorkspace) {
      setNotice({
        message: "Only workspace owners can change studio identity.",
        tone: "error"
      });
      return;
    }

    setIsSaving(true);
    setNotice({
      message: settings
        ? "Saving studio settings…"
        : "Creating studio identity…",
      tone: "info"
    });

    try {
      const response = await fetch("/api/studio/settings", {
        body: JSON.stringify({
          ...editorState,
          brandId: selectedBrand?.id ?? null
        }),
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
        setSelectedBrandId(
          resolveSelectedBrandId({
            currentBrandId: selectedBrand?.id ?? null,
            settings: result.settings
          })
        );
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

  async function handleCreateBrand(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canManageWorkspace) {
      setNotice({
        message: "Only workspace owners can add brands.",
        tone: "error"
      });
      return;
    }

    setIsCreatingBrand(true);
    setNotice({
      message: "Creating additional brand…",
      tone: "info"
    });

    try {
      const response = await fetch("/api/studio/settings/brands", {
        body: JSON.stringify({
          accentColor: newBrandState.accentColor,
          brandName: newBrandState.brandName,
          brandSlug: newBrandState.brandSlug,
          featuredReleaseLabel: defaultStudioFeaturedReleaseLabel,
          landingDescription: defaultStudioBrandLandingDescription,
          landingHeadline: defaultStudioBrandLandingHeadline,
          themePreset: newBrandState.themePreset
        }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });
      const payload = await parseJsonResponse({
        response,
        schema: studioBrandResponseSchema
      });

      startTransition(() => {
        setSettings((currentSettings) => {
          if (!currentSettings) {
            return currentSettings;
          }

          return {
            ...currentSettings,
            brand: currentSettings.brand,
            brands: [...currentSettings.brands, payload.brand]
          };
        });
        setSelectedBrandId(payload.brand.id);
        setNewBrandState(createInitialNewBrandState());
      });
      setNotice({
        message: `Created ${payload.brand.name}.`,
        tone: "success"
      });
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : "Additional brand could not be created.",
        tone: "error"
      });
    } finally {
      setIsCreatingBrand(false);
    }
  }

  async function handleAddMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canManageMembers) {
      setNotice({
        message: "Only workspace owners can manage operators.",
        tone: "error"
      });
      return;
    }

    setIsAddingMember(true);
    setNotice({
      message: "Adding workspace operator…",
      tone: "info"
    });

    try {
      const response = await fetch("/api/studio/settings/members", {
        body: JSON.stringify({
          walletAddress: memberState.walletAddress
        }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });
      const payload = await parseJsonResponse({
        response,
        schema: studioWorkspaceMemberResponseSchema
      });

      startTransition(() => {
        setSettings((currentSettings) => {
          if (!currentSettings) {
            return currentSettings;
          }

          return {
            ...currentSettings,
            members: [...currentSettings.members, payload.member]
          };
        });
        setMemberState(createInitialMemberState());
      });
      setNotice({
        message: `Added ${payload.member.walletAddress} as an operator.`,
        tone: "success"
      });
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : "Workspace operator could not be added.",
        tone: "error"
      });
    } finally {
      setIsAddingMember(false);
    }
  }

  async function handleRemoveMember(member: StudioWorkspaceMemberSummary) {
    if (!member.membershipId || !canManageMembers) {
      return;
    }

    setRemovingMembershipId(member.membershipId);
    setNotice({
      message: `Removing ${member.walletAddress}…`,
      tone: "info"
    });

    try {
      const response = await fetch(
        `/api/studio/settings/members/${member.membershipId}`,
        {
          method: "DELETE"
        }
      );
      await parseJsonResponse({
        response,
        schema: studioWorkspaceMemberDeleteResponseSchema
      });

      startTransition(() => {
        setSettings((currentSettings) => {
          if (!currentSettings) {
            return currentSettings;
          }

          return {
            ...currentSettings,
            members: currentSettings.members.filter(
              (currentMember) =>
                currentMember.membershipId !== member.membershipId
            )
          };
        });
      });
      setNotice({
        message: `Removed ${member.walletAddress} from the workspace.`,
        tone: "success"
      });
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : "Workspace operator could not be removed.",
        tone: "error"
      });
    } finally {
      setRemovingMembershipId(null);
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
            <MetricTile label="Role" value={access.role} />
            <MetricTile
              label="Workspace"
              value={settings?.workspace.slug ?? "Unconfigured"}
            />
            <MetricTile
              label="Primary brand"
              value={settings?.brand.slug ?? "Unconfigured"}
            />
            <MetricTile
              label="Brand count"
              value={settings?.brands.length?.toString() ?? "0"}
            />
            <MetricTile
              label="Members"
              value={settings?.members.length?.toString() ?? "1"}
            />
          </div>
          <div className="pill-row">
            <Pill>/studio/settings</Pill>
            <Pill>{selectedBrand?.publicBrandPath ?? "/brands/[brandSlug]"}</Pill>
            <Pill>
              {selectedBrand?.accentColor ?? defaultStudioBrandAccentColor}
            </Pill>
            <Pill>
              {selectedBrand?.themePreset ?? defaultStudioBrandThemePreset}
            </Pill>
          </div>
        </SurfaceCard>
        <SurfaceCard
          body="Configure the shared workspace slug plus the currently selected brand profile. Multi-brand administration keeps one owner workspace and lets publication target an explicit brand instead of assuming a single storefront."
          eyebrow="Profile"
          span={8}
          title={settings ? "Update studio identity" : "Create studio identity"}
        >
          {!canManageWorkspace ? (
            <div className="status-banner status-banner--info">
              <strong>Operator read-only</strong>
              <span>
                Operators can review workspace identity and brand
                configuration, but only workspace owners can change it.
              </span>
            </div>
          ) : null}
          <form className="studio-form" onSubmit={handleSaveSettings}>
            <fieldset disabled={!canManageWorkspace || isSaving}>
            {settings?.brands.length ? (
              <label className="field-stack">
                <span className="field-label">Editing brand</span>
                <select
                  className="input-field"
                  onChange={(event) => {
                    setSelectedBrandId(event.target.value || null);
                  }}
                  value={selectedBrand?.id ?? ""}
                >
                  {settings.brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name} · /brands/{brand.slug}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
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
                disabled={!canManageWorkspace || isSaving}
                type="submit"
              >
                {isSaving
                  ? "Saving…"
                  : settings
                    ? "Save settings"
                    : "Create settings"}
              </button>
            </div>
            </fieldset>
          </form>
        </SurfaceCard>
        <SurfaceCard
          body="Add an additional publication brand under the same owner workspace. New brands start with a minimal storefront profile and can then be refined in the main editor."
          eyebrow="Brands"
          span={4}
          title="Create brand"
        >
          {!canManageWorkspace ? (
            <div className="status-banner status-banner--info">
              <strong>Owner action required</strong>
              <span>Only workspace owners can create additional brands.</span>
            </div>
          ) : null}
          <form className="studio-form" onSubmit={handleCreateBrand}>
            <fieldset disabled={!canManageWorkspace || isCreatingBrand}>
            <label className="field-stack">
              <span className="field-label">Brand name</span>
              <input
                className="input-field"
                maxLength={120}
                onChange={(event) => {
                  setNewBrandState((current) => ({
                    ...current,
                    brandName: event.target.value
                  }));
                }}
                placeholder="North Editions"
                required
                value={newBrandState.brandName}
              />
            </label>
            <label className="field-stack">
              <span className="field-label">Brand slug</span>
              <input
                className="input-field"
                maxLength={80}
                onChange={(event) => {
                  setNewBrandState((current) => ({
                    ...current,
                    brandSlug: event.target.value
                  }));
                }}
                pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                placeholder="north-editions"
                required
                value={newBrandState.brandSlug}
              />
            </label>
            <label className="field-stack">
              <span className="field-label">Theme preset</span>
              <select
                className="input-field"
                onChange={(event) => {
                  setNewBrandState((current) => ({
                    ...current,
                    themePreset: event.target.value as
                      | "editorial_warm"
                      | "gallery_mono"
                      | "midnight_launch"
                  }));
                }}
                value={newBrandState.themePreset}
              >
                <option value="editorial_warm">Editorial warm</option>
                <option value="gallery_mono">Gallery mono</option>
                <option value="midnight_launch">Midnight launch</option>
              </select>
            </label>
            <label className="field-stack">
              <span className="field-label">Accent color</span>
              <div className="color-input-row">
                <input
                  className="color-swatch-input"
                  onChange={(event) => {
                    setNewBrandState((current) => ({
                      ...current,
                      accentColor: event.target.value
                    }));
                  }}
                  type="color"
                  value={newBrandState.accentColor}
                />
                <input
                  className="input-field"
                  maxLength={7}
                  onChange={(event) => {
                    setNewBrandState((current) => ({
                      ...current,
                      accentColor: event.target.value
                    }));
                  }}
                  pattern="^#[0-9a-fA-F]{6}$"
                  required
                  value={newBrandState.accentColor}
                />
              </div>
            </label>
            <div className="pill-row">
              <Pill>
                {settings?.workspace.slug ??
                  editorState.workspaceSlug ??
                  "workspace-slug"}
              </Pill>
              <Pill>
                {newBrandState.brandSlug
                  ? `/brands/${newBrandState.brandSlug}`
                  : "/brands/[brandSlug]"}
              </Pill>
              <Pill>{newBrandState.themePreset.replaceAll("_", " ")}</Pill>
            </div>
            <div className="studio-action-row">
              <button
                className="button-action"
                disabled={
                  !canManageWorkspace ||
                  isCreatingBrand ||
                  !settings?.workspace.id
                }
                type="submit"
              >
                {isCreatingBrand ? "Creating…" : "Add brand"}
              </button>
            </div>
            </fieldset>
          </form>
        </SurfaceCard>
        <SurfaceCard
          body="Workspace roles now support owner-governed operator access. Operators inherit the same workspace and brand context for day-to-day studio work, while ownership retains the high-risk settings and publication controls."
          eyebrow="Access"
          span={4}
          title="Workspace members"
        >
          <div className="pill-row">
            <Pill>{access.role}</Pill>
            <Pill>{settings?.members.length ?? 1} total members</Pill>
          </div>
          {!canManageMembers ? (
            <div className="status-banner status-banner--info">
              <strong>Operator read-only</strong>
              <span>Only workspace owners can add or remove members.</span>
            </div>
          ) : null}
          {settings?.members.length ? (
            <div className="collection-item-list">
              {settings.members.map((member) => (
                <div className="collection-item-card" key={member.id}>
                  <div className="collection-item-card__copy">
                    <strong>{member.userDisplayName ?? member.walletAddress}</strong>
                    <span>{member.walletAddress}</span>
                    <span>
                      {member.role === "owner" ? "Owner" : "Operator"}
                      {member.addedAt
                        ? ` · added ${new Intl.DateTimeFormat("en-US", {
                            dateStyle: "medium",
                            timeStyle: "short"
                          }).format(new Date(member.addedAt))}`
                        : ""}
                    </span>
                  </div>
                  {member.membershipId ? (
                    <div className="collection-item-card__actions">
                      <button
                        className="button-action"
                        disabled={
                          !canManageMembers ||
                          removingMembershipId === member.membershipId
                        }
                        onClick={() => {
                          void handleRemoveMember(member);
                        }}
                        type="button"
                      >
                        {removingMembershipId === member.membershipId
                          ? "Removing…"
                          : "Remove"}
                      </button>
                    </div>
                  ) : (
                    <div className="collection-item-card__actions">
                      <Pill>Owner</Pill>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="collection-empty-state">
              No workspace members are configured yet.
            </div>
          )}
          <form className="studio-form" onSubmit={handleAddMember}>
            <fieldset disabled={!canManageMembers || isAddingMember}>
              <label className="field-stack">
                <span className="field-label">Operator wallet</span>
                <input
                  className="input-field"
                  onChange={(event) => {
                    setMemberState({
                      walletAddress: event.target.value
                    });
                  }}
                  placeholder="0x..."
                  required
                  value={memberState.walletAddress}
                />
              </label>
              <div className="studio-action-row">
                <button
                  className="button-action"
                  disabled={!canManageMembers || isAddingMember}
                  type="submit"
                >
                  {isAddingMember ? "Adding…" : "Add operator"}
                </button>
              </div>
            </fieldset>
          </form>
        </SurfaceCard>
        <SurfaceCard
          body="These values become the durable publication target for the selected brand and the editorial source of truth for its public landing. Brand slug changes are still validated against existing public collection routes before they are accepted."
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
