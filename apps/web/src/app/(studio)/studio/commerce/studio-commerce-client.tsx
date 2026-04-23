"use client";

import { useRouter } from "next/navigation";
import {
  startTransition,
  type FormEvent,
  useEffect,
  useEffectEvent,
  useMemo,
  useState
} from "react";

import {
  studioCommerceDashboardQuerySchema,
  studioCommerceCheckoutActionResponseSchema,
  studioCommerceDashboardResponseSchema,
  type CommerceCheckoutFulfillmentStatus,
  type StudioCommerceBrandSummary,
  type StudioCommerceCheckoutSummary,
  type StudioCommerceCollectionSummary,
  type StudioCommerceDashboardResponse
} from "@ai-nft-forge/shared";
import {
  ActionRow,
  ActionButton,
  ActionLink,
  EmptyState,
  FieldLabel,
  FieldStack,
  SurfacePanel,
  SectionHeading,
  SignalCard,
  SelectField,
  InsetMetric as CommerceInsetMetric,
  PageShell,
  Pill,
  StatusBanner,
  cn
} from "@ai-nft-forge/ui";

import {
  CollectibleEditorialBand,
  FloatingCollectibleCluster,
  StudioSceneCard
} from "../../../../components/collectible-visuals";
import {
  StudioCommerceSessionCard,
  type StudioCommerceSessionActionRequest,
  type StudioCommerceSessionEditor,
  type StudioCommerceSessionEmphasisTone
} from "../../../../components/studio/studio-commerce-session-card";

type StudioCommerceClientProps = {
  initialDashboard: StudioCommerceDashboardResponse["dashboard"];
  ownerWalletAddress: string;
};

type NoticeState = {
  message: string;
  tone: "error" | "info" | "success";
} | null;

type FulfillmentEditorState = Record<string, StudioCommerceSessionEditor>;

type CommerceSignalTone = "critical" | "warning" | "success" | "neutral";

const commerceMetricTones = {
  critical: "border-red-200 bg-red-50 text-red-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  neutral:
    "border-[color:var(--color-line)] bg-[color:var(--color-surface)] text-[color:var(--color-text)]"
} as const;

const commerceHeroMetricClasses =
  "rounded-[1.5rem] border border-[color:var(--color-line)] bg-white/78 p-4 text-[color:var(--color-text)] shadow-[0_18px_40px_rgba(191,197,225,0.18)] backdrop-blur-xl";
const commerceHeroMetricTextClasses =
  "text-[color:var(--color-muted)] [&>span]:text-[11px] [&>span]:font-semibold [&>span]:tracking-[0.2em] [&>span]:text-[color:var(--color-muted)] [&>strong]:mt-2 [&>strong]:text-lg [&>strong]:font-semibold [&>strong]:text-[color:var(--color-text)] [&>p]:mt-2 [&>p]:text-sm [&>p]:leading-6 [&>p]:text-[color:var(--color-muted)]";

function createFallbackErrorMessage(response: Response) {
  switch (response.status) {
    case 401:
      return "An active studio session is required.";
    case 404:
      return "The requested checkout session was not found.";
    case 409:
      return "The requested commerce action conflicts with the current checkout state.";
    default:
      return "The commerce administration request could not be completed.";
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

function formatTimestamp(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function shortenWalletAddress(input: string) {
  if (input.length <= 18) {
    return input;
  }

  return `${input.slice(0, 10)}…${input.slice(-6)}`;
}

function createCommerceDashboardPath(brandSlug: string | null) {
  const parsedQuery = studioCommerceDashboardQuerySchema.parse({
    ...(brandSlug
      ? {
          brandSlug
        }
      : {})
  });

  if (!parsedQuery.brandSlug) {
    return "/api/studio/commerce";
  }

  return `/api/studio/commerce?brandSlug=${encodeURIComponent(parsedQuery.brandSlug)}`;
}

function createCommerceReportPath(brandSlug: string | null, format?: "csv") {
  const parsedQuery = studioCommerceDashboardQuerySchema.parse({
    ...(brandSlug
      ? {
          brandSlug
        }
      : {})
  });
  const params = new URLSearchParams();

  if (parsedQuery.brandSlug) {
    params.set("brandSlug", parsedQuery.brandSlug);
  }

  if (format) {
    params.set("format", format);
  }

  const query = params.toString();

  return query.length > 0
    ? `/api/studio/commerce/report?${query}`
    : "/api/studio/commerce/report";
}

function createInitialFulfillmentEditors(
  dashboard: StudioCommerceDashboardResponse["dashboard"]
): FulfillmentEditorState {
  return Object.fromEntries(
    dashboard.checkouts.map((checkout) => [
      checkout.checkoutSessionId,
      {
        fulfillmentNotes: checkout.fulfillmentNotes ?? "",
        fulfillmentStatus: checkout.fulfillmentStatus
      }
    ])
  );
}

function getAutomationInFlightCount(
  checkouts: StudioCommerceCheckoutSummary[]
) {
  return checkouts.filter(
    (checkout) =>
      checkout.fulfillmentAutomationStatus === "queued" ||
      checkout.fulfillmentAutomationStatus === "processing" ||
      checkout.fulfillmentAutomationStatus === "submitted"
  ).length;
}

function compareIsoTimestampDescending(
  left: string | null,
  right: string | null
) {
  if (left === right) {
    return 0;
  }

  if (left === null) {
    return 1;
  }

  if (right === null) {
    return -1;
  }

  return right.localeCompare(left);
}

function getCollectionPressureScore(
  collection: StudioCommerceCollectionSummary
) {
  return (
    collection.unfulfilledCheckoutCount * 4 +
    collection.openCheckoutCount * 3 +
    collection.completedCheckoutCount
  );
}

function getBrandPressureScore(brand: StudioCommerceBrandSummary) {
  return (
    brand.unfulfilledCheckoutCount * 4 +
    brand.openCheckoutCount * 3 +
    brand.completedCheckoutCount
  );
}

function getCommerceMetricToneClass(tone: CommerceSignalTone) {
  return commerceMetricTones[tone];
}

function getSessionEmphasis(input: {
  checkout: StudioCommerceCheckoutSummary;
}): {
  label: string;
  rank: number;
  tone: StudioCommerceSessionEmphasisTone;
} {
  const { checkout } = input;

  if (checkout.fulfillmentAutomationStatus === "failed") {
    return {
      label: "Automation failed",
      rank: 0,
      tone: "critical"
    };
  }

  if (
    checkout.status === "completed" &&
    checkout.fulfillmentStatus === "unfulfilled"
  ) {
    if (
      checkout.fulfillmentAutomationStatus === "queued" ||
      checkout.fulfillmentAutomationStatus === "processing" ||
      checkout.fulfillmentAutomationStatus === "submitted"
    ) {
      return {
        label: "Automation in flight",
        rank: 1,
        tone: "warning"
      };
    }

    return {
      label:
        checkout.fulfillmentProviderKind === "manual"
          ? "Manual fulfillment"
          : "Fulfill now",
      rank: 2,
      tone: "warning"
    };
  }

  if (checkout.status === "open") {
    return {
      label:
        checkout.providerKind === "manual"
          ? "Awaiting payment"
          : "Active reservation",
      rank: 3,
      tone: "warning"
    };
  }

  if (checkout.status === "expired") {
    return {
      label: "Expired",
      rank: 4,
      tone: "neutral"
    };
  }

  if (checkout.status === "canceled") {
    return {
      label: "Released",
      rank: 5,
      tone: "neutral"
    };
  }

  return {
    label: "Settled",
    rank: 6,
    tone: "success"
  };
}

function compareCheckoutPriority(
  left: StudioCommerceCheckoutSummary,
  right: StudioCommerceCheckoutSummary
) {
  const leftPriority = getSessionEmphasis({
    checkout: left
  });
  const rightPriority = getSessionEmphasis({
    checkout: right
  });

  if (leftPriority.rank !== rightPriority.rank) {
    return leftPriority.rank - rightPriority.rank;
  }

  const latestTimeComparison = compareIsoTimestampDescending(
    left.completedAt ?? left.createdAt,
    right.completedAt ?? right.createdAt
  );

  if (latestTimeComparison !== 0) {
    return latestTimeComparison;
  }

  return right.checkoutSessionId.localeCompare(left.checkoutSessionId);
}

function getSignalTone(input: {
  neutralWhenZero?: boolean;
  warningWhenPositive?: boolean;
  value: number;
}): CommerceSignalTone {
  if (input.value === 0) {
    return input.neutralWhenZero ? "neutral" : "success";
  }

  if (input.warningWhenPositive) {
    return "warning";
  }

  return "critical";
}

export function StudioCommerceClient({
  initialDashboard,
  ownerWalletAddress
}: StudioCommerceClientProps) {
  const router = useRouter();
  const [dashboard, setDashboard] = useState(initialDashboard);
  const [notice, setNotice] = useState<NoticeState>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [busyCheckoutAction, setBusyCheckoutAction] = useState<string | null>(
    null
  );
  const [fulfillmentEditors, setFulfillmentEditors] = useState(() =>
    createInitialFulfillmentEditors(initialDashboard)
  );

  useEffect(() => {
    setFulfillmentEditors(createInitialFulfillmentEditors(dashboard));
  }, [dashboard]);

  const activeBrand =
    dashboard.brands.find(
      (brand) => brand.brandSlug === dashboard.activeBrandSlug
    ) ?? null;

  const completionRate =
    dashboard.summary.totalCheckoutCount === 0
      ? 0
      : (dashboard.summary.completedCheckoutCount /
          dashboard.summary.totalCheckoutCount) *
        100;
  const fulfillmentRate =
    dashboard.summary.completedCheckoutCount === 0
      ? 0
      : (dashboard.summary.fulfilledCheckoutCount /
          dashboard.summary.completedCheckoutCount) *
        100;

  const latestCompletedCheckoutAt = useMemo(
    () =>
      dashboard.checkouts.reduce<string | null>(
        (latest, checkout) =>
          checkout.completedAt !== null &&
          (latest === null || checkout.completedAt > latest)
            ? checkout.completedAt
            : latest,
        null
      ),
    [dashboard.checkouts]
  );
  const latestFulfilledCheckoutAt = useMemo(
    () =>
      dashboard.checkouts.reduce<string | null>(
        (latest, checkout) =>
          checkout.fulfilledAt !== null &&
          (latest === null || checkout.fulfilledAt > latest)
            ? checkout.fulfilledAt
            : latest,
        null
      ),
    [dashboard.checkouts]
  );

  const commerceReportPath = createCommerceReportPath(
    dashboard.activeBrandSlug
  );
  const commerceReportCsvPath = createCommerceReportPath(
    dashboard.activeBrandSlug,
    "csv"
  );

  const automationInFlightCount = useMemo(
    () => getAutomationInFlightCount(dashboard.checkouts),
    [dashboard.checkouts]
  );

  const prioritizedCheckouts = useMemo(
    () => [...dashboard.checkouts].sort(compareCheckoutPriority),
    [dashboard.checkouts]
  );

  const attentionCheckouts = useMemo(
    () =>
      prioritizedCheckouts.filter((checkout) => {
        const emphasis = getSessionEmphasis({
          checkout
        });

        return emphasis.tone === "critical" || emphasis.tone === "warning";
      }),
    [prioritizedCheckouts]
  );

  const sortedBrands = useMemo(
    () =>
      [...dashboard.brands].sort((left, right) => {
        const pressureDifference =
          getBrandPressureScore(right) - getBrandPressureScore(left);

        if (pressureDifference !== 0) {
          return pressureDifference;
        }

        return right.totalCheckoutCount - left.totalCheckoutCount;
      }),
    [dashboard.brands]
  );

  const sortedCollections = useMemo(
    () =>
      [...dashboard.collections].sort((left, right) => {
        const pressureDifference =
          getCollectionPressureScore(right) - getCollectionPressureScore(left);

        if (pressureDifference !== 0) {
          return pressureDifference;
        }

        return right.totalCheckoutCount - left.totalCheckoutCount;
      }),
    [dashboard.collections]
  );

  const activeScopeLabel = activeBrand ? activeBrand.brandName : "All brands";
  const scopeCheckoutCount = activeBrand
    ? activeBrand.totalCheckoutCount
    : dashboard.summary.totalCheckoutCount;
  const scopeBrandCount = activeBrand ? 1 : dashboard.brands.length;
  const commerceVisualItems = useMemo(() => {
    const queueItems = attentionCheckouts
      .slice(0, 3)
      .map(
        (checkout) =>
          `${checkout.brandName} · Edition ${checkout.editionNumber}`
      );

    if (queueItems.length > 0) {
      return queueItems;
    }

    const collectionItems = sortedCollections
      .slice(0, 3)
      .map((collection) => collection.title);

    if (collectionItems.length > 0) {
      return collectionItems;
    }

    return ["Live checkout", "Fulfillment queue", "Release reports"];
  }, [attentionCheckouts, sortedCollections]);

  const overviewSignals = [
    {
      detail:
        attentionCheckouts.length > 0
          ? "Payment or fulfillment needs operator review."
          : "No active checkout or fulfillment exceptions.",
      label: "Needs action",
      tone: getSignalTone({
        value: attentionCheckouts.length
      }),
      value: attentionCheckouts.length
    },
    {
      detail: "Reservations still holding an edition or payment window.",
      label: "Open reservations",
      tone: getSignalTone({
        value: dashboard.summary.openCheckoutCount,
        warningWhenPositive: true
      }),
      value: dashboard.summary.openCheckoutCount
    },
    {
      detail: "Paid sessions recorded in durable commerce history.",
      label: "Completed sales",
      tone: "success" as const,
      value: dashboard.summary.completedCheckoutCount
    },
    {
      detail: "Completed sessions still awaiting final delivery.",
      label: "Unfulfilled",
      tone: getSignalTone({
        value: dashboard.summary.unfulfilledCheckoutCount
      }),
      value: dashboard.summary.unfulfilledCheckoutCount
    },
    {
      detail:
        dashboard.summary.automationFailedCheckoutCount > 0
          ? "Failed automation needs recovery."
          : "Queued or submitted automation still in flight.",
      label: "Automation watch",
      tone:
        dashboard.summary.automationFailedCheckoutCount > 0
          ? "critical"
          : getSignalTone({
              neutralWhenZero: true,
              value: automationInFlightCount,
              warningWhenPositive: true
            }),
      value:
        dashboard.summary.automationFailedCheckoutCount +
        automationInFlightCount
    },
    {
      detail: "Sessions closed without a completed purchase.",
      label: "Expired or released",
      tone: getSignalTone({
        neutralWhenZero: true,
        value:
          dashboard.summary.expiredCheckoutCount +
          dashboard.summary.canceledCheckoutCount,
        warningWhenPositive: true
      }),
      value:
        dashboard.summary.expiredCheckoutCount +
        dashboard.summary.canceledCheckoutCount
    }
  ];

  const queueSignals = [
    {
      description:
        dashboard.summary.unfulfilledCheckoutCount > 0
          ? "Completed orders still need delivery confirmation."
          : "Every paid checkout in scope is currently fulfilled.",
      label: "Fulfill now",
      tone: getSignalTone({
        value: dashboard.summary.unfulfilledCheckoutCount
      }),
      value: dashboard.summary.unfulfilledCheckoutCount
    },
    {
      description:
        dashboard.summary.automationFailedCheckoutCount > 0
          ? "Webhook automation failed and can be retried."
          : "No failed automation runs are currently blocking fulfillment.",
      label: "Automation recovery",
      tone: getSignalTone({
        neutralWhenZero: true,
        value: dashboard.summary.automationFailedCheckoutCount
      }),
      value: dashboard.summary.automationFailedCheckoutCount
    },
    {
      description:
        dashboard.summary.openCheckoutCount > 0
          ? "Reservations are still open across hosted or manual checkouts."
          : "No sessions are currently holding open reservations.",
      label: "Open sessions",
      tone: getSignalTone({
        neutralWhenZero: true,
        value: dashboard.summary.openCheckoutCount,
        warningWhenPositive: true
      }),
      value: dashboard.summary.openCheckoutCount
    }
  ];

  const refreshDashboard = useEffectEvent(
    async (input?: { silent?: boolean }) => {
      if (!input?.silent) {
        setIsRefreshing(true);
      }

      try {
        const response = await fetch(
          createCommerceDashboardPath(dashboard.activeBrandSlug),
          {
            cache: "no-store"
          }
        );
        const result = await parseJsonResponse({
          response,
          schema: studioCommerceDashboardResponseSchema
        });

        startTransition(() => {
          setDashboard(result.dashboard);
        });
      } catch (error) {
        setNotice({
          message:
            error instanceof Error
              ? error.message
              : "Commerce administration data could not be refreshed.",
          tone: "error"
        });
      } finally {
        if (!input?.silent) {
          setIsRefreshing(false);
        }
      }
    }
  );

  async function handleBrandScopeChange(brandSlug: string | null) {
    setNotice({
      message: brandSlug
        ? `Loading ${brandSlug} commerce activity…`
        : "Loading commerce activity across all brands…",
      tone: "info"
    });

    try {
      const response = await fetch(createCommerceDashboardPath(brandSlug), {
        cache: "no-store"
      });
      const result = await parseJsonResponse({
        response,
        schema: studioCommerceDashboardResponseSchema
      });

      startTransition(() => {
        setDashboard(result.dashboard);
      });
      router.replace(
        brandSlug
          ? `/studio/commerce?brandSlug=${encodeURIComponent(brandSlug)}`
          : "/studio/commerce"
      );
      setNotice(null);
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : "Commerce brand scope could not be changed.",
        tone: "error"
      });
    }
  }

  async function runCheckoutAction(input: StudioCommerceSessionActionRequest) {
    setBusyCheckoutAction(input.checkoutSessionId);
    setNotice({
      message: input.message,
      tone: "info"
    });

    try {
      const requestInit: RequestInit = {
        method: input.method ?? "POST"
      };

      if (input.payload !== undefined) {
        requestInit.body = JSON.stringify(input.payload);
        requestInit.headers = {
          "Content-Type": "application/json"
        };
      }

      const response = await fetch(input.path, requestInit);

      await parseJsonResponse({
        response,
        schema: studioCommerceCheckoutActionResponseSchema
      });
      await refreshDashboard({
        silent: true
      });
      setNotice({
        message: input.successMessage,
        tone: "success"
      });
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : "Commerce action could not be completed.",
        tone: "error"
      });
    } finally {
      setBusyCheckoutAction(null);
    }
  }

  function handleEditorChange(input: {
    checkoutSessionId: string;
    fulfillmentNotes?: string;
    fulfillmentStatus?: CommerceCheckoutFulfillmentStatus;
  }) {
    setFulfillmentEditors((current) => ({
      ...current,
      [input.checkoutSessionId]: {
        fulfillmentNotes:
          input.fulfillmentNotes ??
          current[input.checkoutSessionId]?.fulfillmentNotes ??
          "",
        fulfillmentStatus:
          input.fulfillmentStatus ??
          current[input.checkoutSessionId]?.fulfillmentStatus ??
          "unfulfilled"
      }
    }));
  }

  async function handleFulfillmentSubmit(
    event: FormEvent<HTMLFormElement>,
    checkout: StudioCommerceCheckoutSummary
  ) {
    event.preventDefault();

    const editor = fulfillmentEditors[checkout.checkoutSessionId] ?? {
      fulfillmentNotes: "",
      fulfillmentStatus: "unfulfilled" as const
    };

    await runCheckoutAction({
      checkoutSessionId: checkout.checkoutSessionId,
      message: "Saving fulfillment state…",
      method: "PATCH",
      path: `/api/studio/commerce/checkouts/${checkout.checkoutSessionId}/fulfillment`,
      payload: {
        fulfillmentNotes: editor.fulfillmentNotes || null,
        fulfillmentStatus: editor.fulfillmentStatus
      },
      successMessage: "Fulfillment state saved."
    });
  }

  return (
    <PageShell
      eyebrow="Commerce"
      title="Operate live checkout and fulfillment"
      lead="Use this workspace to supervise reservations, payment completion, automation handoff, and final fulfillment without leaving the Studio scope boundary."
      actions={
        <>
          <ActionButton
            tone="accent"
            disabled={isRefreshing}
            onClick={() => {
              void refreshDashboard();
            }}
            type="button"
          >
            {isRefreshing ? "Refreshing…" : "Refresh workspace"}
          </ActionButton>
          <ActionLink href="/studio/collections" tone="action">
            Collections
          </ActionLink>
          <ActionLink href="/studio/commerce/fleet" tone="action">
            Fleet view
          </ActionLink>
          <ActionLink href="/studio" tone="inline">
            Back to studio
          </ActionLink>
        </>
      }
      tone="studio"
    >
      <div className="space-y-6">
        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <CollectibleEditorialBand className="bg-[linear-gradient(145deg,#fffbf3,#f5fbff_52%,#faf2ff)] shadow-[0_28px_90px_rgba(191,198,225,0.22)]">
            <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr] xl:items-start">
              <div className="space-y-5">
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-accent)]">
                    Transaction control room
                  </p>
                  <h2 className="max-w-4xl text-3xl font-semibold font-[var(--font-display)] leading-tight text-[color:var(--color-text)] sm:text-4xl">
                    {attentionCheckouts.length > 0
                      ? `${attentionCheckouts.length.toString()} sessions need attention in ${activeScopeLabel}.`
                      : `Checkout and fulfillment are stable in ${activeScopeLabel}.`}
                  </h2>
                  <p className="max-w-3xl text-sm leading-7 text-[color:var(--color-muted)]">
                    Scope, payment state, fulfillment automation, and release
                    pressure stay visible together so recovery decisions do not
                    drift away from the live buyer ledger.
                  </p>
                </div>
                <ActionRow compact>
                  <Pill>{activeBrand?.brandSlug ?? "all-brands"}</Pill>
                  <Pill>{scopeCheckoutCount.toString()} sessions in scope</Pill>
                  <Pill>
                    {dashboard.collections.length.toString()} releases
                  </Pill>
                  <Pill>{scopeBrandCount.toString()} brand scope</Pill>
                  <Pill>
                    {dashboard.summary.manualCheckoutCount.toString()} manual
                  </Pill>
                  <Pill>
                    {dashboard.summary.stripeCheckoutCount.toString()} stripe
                  </Pill>
                </ActionRow>
                <div className="grid gap-3 md:grid-cols-3">
                  <SignalCard
                    className={cn(
                      commerceHeroMetricClasses,
                      commerceHeroMetricTextClasses
                    )}
                    detail="Workspace owner wallet currently supervising this commerce scope."
                    label="Operator authority"
                    tone="default"
                    value={shortenWalletAddress(ownerWalletAddress)}
                  />
                  <SignalCard
                    className={cn(
                      commerceHeroMetricClasses,
                      commerceHeroMetricTextClasses
                    )}
                    detail={`${formatPercent(completionRate)} payment completion rate.`}
                    label="Latest paid"
                    tone="default"
                    value={formatTimestamp(latestCompletedCheckoutAt)}
                  />
                  <SignalCard
                    className={cn(
                      commerceHeroMetricClasses,
                      commerceHeroMetricTextClasses
                    )}
                    detail={`${formatPercent(fulfillmentRate)} fulfillment completion rate.`}
                    label="Latest fulfilled"
                    tone="default"
                    value={formatTimestamp(latestFulfilledCheckoutAt)}
                  />
                </div>
              </div>
              <StudioSceneCard
                className="bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,246,255,0.92))]"
                eyebrow="Creator-side oversight"
                note="Keep live checkout operations premium and legible: active scope, automation state, and release backlog remain visible without turning the route into a dense ops wall."
                title="Premium commerce shell"
              />
            </div>
          </CollectibleEditorialBand>

          <FloatingCollectibleCluster
            className="min-h-full"
            headline="Release pressure, buyer activity, and fulfillment signals now share one visual frame."
            items={commerceVisualItems}
            label="Commerce spotlight"
          />
        </section>

        <section
          className="grid gap-3 md:grid-cols-3"
          aria-label="Commerce overview"
        >
          {overviewSignals.map((signal) => (
            <article
              className={cn(
                "rounded-[1.5rem] border p-4 shadow-[0_14px_30px_rgba(15,23,42,0.08)] backdrop-blur",
                getCommerceMetricToneClass(signal.tone)
              )}
              key={signal.label}
            >
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
                {signal.label}
              </span>
              <strong className="mt-2 block text-2xl font-semibold text-[color:var(--color-text)]">
                {signal.value.toString()}
              </strong>
              <p className="mt-2 text-sm text-[color:var(--color-muted)]">
                {signal.detail}
              </p>
            </article>
          ))}
        </section>

        {notice ? (
          <StatusBanner
            tone={
              notice.tone === "error"
                ? "error"
                : notice.tone === "success"
                  ? "success"
                  : "info"
            }
          >
            <strong className="mr-2">
              {notice.tone === "error"
                ? "Commerce error"
                : notice.tone === "success"
                  ? "Commerce updated"
                  : "Working"}
            </strong>
            <span>{notice.message}</span>
          </StatusBanner>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <SurfacePanel>
              <SectionHeading
                className="mb-4"
                lead="Separate manual fulfillment, automation recovery, and open reservations before reviewing the full session ledger."
                eyebrow="Attention queue"
                title="What needs action now"
              />
              <div className="grid gap-3 md:grid-cols-2">
                {queueSignals.map((signal) => (
                  <article
                    className={cn(
                      "rounded-[1.35rem] border p-4 shadow-[0_12px_26px_rgba(15,23,42,0.06)]",
                      getCommerceMetricToneClass(signal.tone)
                    )}
                    key={signal.label}
                  >
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                      {signal.label}
                    </span>
                    <strong className="mt-2 block text-xl font-semibold text-[color:var(--color-text)]">
                      {signal.value.toString()}
                    </strong>
                    <p className="mt-2 text-sm text-[color:var(--color-muted)]">
                      {signal.description}
                    </p>
                  </article>
                ))}
              </div>
              {attentionCheckouts.length === 0 ? (
                <EmptyState className="rounded-[1.5rem] bg-[color:var(--color-surface)]/75">
                  No sessions currently require intervention in this scope.
                </EmptyState>
              ) : (
                <div className="space-y-3">
                  {attentionCheckouts.slice(0, 6).map((checkout) => {
                    const emphasis = getSessionEmphasis({
                      checkout
                    });

                    return (
                      <StudioCommerceSessionCard
                        checkout={checkout}
                        editor={
                          fulfillmentEditors[checkout.checkoutSessionId] ?? {
                            fulfillmentNotes: checkout.fulfillmentNotes ?? "",
                            fulfillmentStatus: checkout.fulfillmentStatus
                          }
                        }
                        emphasisLabel={emphasis.label}
                        emphasisTone={emphasis.tone}
                        isBusy={
                          busyCheckoutAction === checkout.checkoutSessionId
                        }
                        key={checkout.checkoutSessionId}
                        onEditorChange={handleEditorChange}
                        onRunAction={runCheckoutAction}
                        onSubmitFulfillment={handleFulfillmentSubmit}
                      />
                    );
                  })}
                </div>
              )}
            </SurfacePanel>

            <SurfacePanel>
              <SectionHeading
                className="mb-4"
                lead="Every session remains available for payment recovery, release, fulfillment updates, and provider verification."
                eyebrow="Session workspace"
                title="Full transaction ledger"
              />
              {prioritizedCheckouts.length === 0 ? (
                <EmptyState className="rounded-[1.5rem] bg-[color:var(--color-surface)]/75">
                  Buyer-facing checkout has not produced any sessions yet.
                </EmptyState>
              ) : (
                <div className="space-y-3">
                  {prioritizedCheckouts.map((checkout) => {
                    const emphasis = getSessionEmphasis({
                      checkout
                    });

                    return (
                      <StudioCommerceSessionCard
                        checkout={checkout}
                        editor={
                          fulfillmentEditors[checkout.checkoutSessionId] ?? {
                            fulfillmentNotes: checkout.fulfillmentNotes ?? "",
                            fulfillmentStatus: checkout.fulfillmentStatus
                          }
                        }
                        emphasisLabel={emphasis.label}
                        emphasisTone={emphasis.tone}
                        isBusy={
                          busyCheckoutAction === checkout.checkoutSessionId
                        }
                        key={checkout.checkoutSessionId}
                        onEditorChange={handleEditorChange}
                        onRunAction={runCheckoutAction}
                        onSubmitFulfillment={handleFulfillmentSubmit}
                      />
                    );
                  })}
                </div>
              )}
            </SurfacePanel>
          </div>

          <aside className="space-y-6">
            <SurfacePanel>
              <SectionHeading
                className="mb-4"
                lead="Make the current commerce boundary explicit before exporting, retrying automation, or reviewing buyer sessions."
                eyebrow="Scope"
                title="Brand and workspace context"
              />
              <FieldStack emphasis="compact">
                <FieldLabel>Active commerce scope</FieldLabel>
                <SelectField
                  onChange={(event) => {
                    void handleBrandScopeChange(event.target.value || null);
                  }}
                  value={dashboard.activeBrandSlug ?? ""}
                >
                  <option value="">All brands</option>
                  {sortedBrands.map((brand) => (
                    <option key={brand.brandSlug} value={brand.brandSlug}>
                      {brand.brandName} · {brand.totalCheckoutCount} sessions
                    </option>
                  ))}
                </SelectField>
              </FieldStack>
              <div className="grid gap-3 md:grid-cols-2">
                <CommerceInsetMetric
                  detail="Current workspace-wide session count in this scope."
                  label="Sessions"
                  value={scopeCheckoutCount.toString()}
                />
                <CommerceInsetMetric
                  detail="Brands participating in the selected commerce boundary."
                  label="Brand scope"
                  value={scopeBrandCount.toString()}
                />
              </div>
              <div className="space-y-2">
                <ActionButton
                  className={cn(
                    dashboard.activeBrandSlug === null
                      ? "border-[color:var(--color-accent)] ring-2 ring-[color:var(--color-accent)]"
                      : "hover:border-[color:var(--color-accent)]"
                  )}
                  tone="surface"
                  onClick={() => {
                    void handleBrandScopeChange(null);
                  }}
                  type="button"
                >
                  <strong>All brands</strong>
                  <span>
                    {dashboard.summary.totalCheckoutCount.toString()} sessions
                    across the workspace
                  </span>
                </ActionButton>
                {sortedBrands.map((brand) => (
                  <ActionButton
                    className={cn(
                      dashboard.activeBrandSlug === brand.brandSlug
                        ? "border-[color:var(--color-accent)] ring-2 ring-[color:var(--color-accent)]"
                        : "hover:border-[color:var(--color-accent)]"
                    )}
                    tone="surface"
                    key={brand.brandSlug}
                    onClick={() => {
                      void handleBrandScopeChange(brand.brandSlug);
                    }}
                    type="button"
                  >
                    <strong>{brand.brandName}</strong>
                    <span>
                      {brand.openCheckoutCount.toString()} open ·{" "}
                      {brand.unfulfilledCheckoutCount.toString()} unfulfilled ·{" "}
                      {brand.completedCheckoutCount.toString()} completed
                    </span>
                  </ActionButton>
                ))}
              </div>
            </SurfacePanel>

            <SurfacePanel>
              <SectionHeading
                className="mb-4"
                lead="Focus on the live or recently active releases carrying the most open checkout and fulfillment backlog."
                eyebrow="Releases"
                title="Collection pressure"
              />
              {sortedCollections.length === 0 ? (
                <EmptyState className="rounded-[1.5rem] bg-[color:var(--color-surface)]/75">
                  No checkout sessions exist yet.
                </EmptyState>
              ) : (
                <div className="space-y-2">
                  {sortedCollections.map((collection) => (
                    <article
                      className="rounded-[1.5rem] border border-[color:var(--color-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.04))] p-4 shadow-[0_12px_26px_rgba(15,23,42,0.06)]"
                      key={collection.collectionPublicPath}
                    >
                      <div className="grid gap-4">
                        <div className="space-y-1">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-accent)]">
                            Live release
                          </p>
                          <strong className="text-base text-[color:var(--color-text)]">
                            {collection.title}
                          </strong>
                          <span className="block text-sm text-[color:var(--color-muted)]">
                            {collection.brandName} ·{" "}
                            {collection.storefrontStatus}
                          </span>
                        </div>
                        <ActionRow compact>
                          <Pill>
                            {collection.openCheckoutCount.toString()} open
                          </Pill>
                          <Pill>
                            {collection.unfulfilledCheckoutCount.toString()}{" "}
                            unfulfilled
                          </Pill>
                          <Pill>
                            {collection.completedCheckoutCount.toString()}{" "}
                            completed
                          </Pill>
                        </ActionRow>
                        <span className="text-sm text-[color:var(--color-muted)]">
                          Public launch route remains available for storefront
                          verification and buyer-path QA.
                        </span>
                      </div>
                      <ActionLink
                        className="mt-4 text-sm"
                        href={collection.collectionPublicPath}
                        rel="noreferrer"
                        target="_blank"
                        tone="inline"
                      >
                        Public page
                      </ActionLink>
                    </article>
                  ))}
                </div>
              )}
            </SurfacePanel>

            <SurfacePanel>
              <SectionHeading
                className="mb-4"
                lead="Export the same filtered session scope you are reviewing live, or verify timing and automation cadence before a handoff."
                eyebrow="Reports"
                title="Export and verify"
              />
              <div className="grid gap-3 md:grid-cols-2">
                <CommerceInsetMetric
                  label="Completion rate"
                  value={formatPercent(completionRate)}
                />
                <CommerceInsetMetric
                  label="Fulfillment rate"
                  value={formatPercent(fulfillmentRate)}
                />
                <CommerceInsetMetric
                  label="Last paid"
                  value={formatTimestamp(latestCompletedCheckoutAt)}
                />
                <CommerceInsetMetric
                  label="Last fulfilled"
                  value={formatTimestamp(latestFulfilledCheckoutAt)}
                />
              </div>
              <ActionRow>
                <ActionLink href={commerceReportCsvPath} tone="action">
                  Export CSV
                </ActionLink>
                <ActionLink
                  className="text-sm"
                  href={commerceReportPath}
                  rel="noreferrer"
                  target="_blank"
                  tone="inline"
                >
                  Open report JSON
                </ActionLink>
              </ActionRow>
              <ActionRow compact>
                <Pill>
                  {automationInFlightCount.toString()} automation in flight
                </Pill>
                <Pill>
                  {dashboard.summary.automationFailedCheckoutCount.toString()}{" "}
                  failed
                </Pill>
                <Pill>
                  {prioritizedCheckouts.length.toString()} sessions listed
                </Pill>
              </ActionRow>
            </SurfacePanel>
          </aside>
        </div>
      </div>
    </PageShell>
  );
}
