"use client";

import Link from "next/link";
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
import { PageShell, Pill } from "@ai-nft-forge/ui";

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
          <button
            className="button-action button-action--accent"
            disabled={isRefreshing}
            onClick={() => {
              void refreshDashboard();
            }}
            type="button"
          >
            {isRefreshing ? "Refreshing…" : "Refresh workspace"}
          </button>
          <Link className="action-link" href="/studio/collections">
            Collections
          </Link>
          <Link className="action-link" href="/studio/commerce/fleet">
            Fleet view
          </Link>
          <Link className="inline-link" href="/studio">
            Back to studio
          </Link>
        </>
      }
      tone="studio"
    >
      <div className="studio-commerce">
        <section className="studio-commerce__hero">
          <div className="studio-commerce__hero-copy">
            <p className="studio-commerce__hero-kicker">
              Transaction control room
            </p>
            <h2 className="studio-commerce__hero-title">
              {attentionCheckouts.length > 0
                ? `${attentionCheckouts.length.toString()} sessions need attention in ${activeScopeLabel}.`
                : `Checkout and fulfillment are stable in ${activeScopeLabel}.`}
            </h2>
            <p className="studio-commerce__hero-lead">
              Scope, backlog, automation state, and release context stay visible
              together so payment recovery and fulfillment verification do not
              drift apart.
            </p>
            <div className="pill-row">
              <Pill>{activeBrand?.brandSlug ?? "all-brands"}</Pill>
              <Pill>{scopeCheckoutCount.toString()} sessions in scope</Pill>
              <Pill>{dashboard.collections.length.toString()} releases</Pill>
              <Pill>{scopeBrandCount.toString()} brand scope</Pill>
              <Pill>
                {dashboard.summary.manualCheckoutCount.toString()} manual
              </Pill>
              <Pill>
                {dashboard.summary.stripeCheckoutCount.toString()} stripe
              </Pill>
            </div>
          </div>
          <div className="studio-commerce__hero-panel">
            <div className="studio-commerce__hero-stat">
              <span>Operator authority</span>
              <strong>{shortenWalletAddress(ownerWalletAddress)}</strong>
              <small>
                Workspace owner wallet currently supervising this scope
              </small>
            </div>
            <div className="studio-commerce__hero-stat">
              <span>Latest paid</span>
              <strong>{formatTimestamp(latestCompletedCheckoutAt)}</strong>
              <small>
                {formatPercent(completionRate)} payment completion rate
              </small>
            </div>
            <div className="studio-commerce__hero-stat">
              <span>Latest fulfilled</span>
              <strong>{formatTimestamp(latestFulfilledCheckoutAt)}</strong>
              <small>
                {formatPercent(fulfillmentRate)} fulfillment completion rate
              </small>
            </div>
          </div>
        </section>

        <section
          className="studio-commerce__metrics"
          aria-label="Commerce overview"
        >
          {overviewSignals.map((signal) => (
            <article
              className={`studio-commerce-metric studio-commerce-metric--${signal.tone}`}
              key={signal.label}
            >
              <span className="studio-commerce-metric__label">
                {signal.label}
              </span>
              <strong className="studio-commerce-metric__value">
                {signal.value.toString()}
              </strong>
              <p className="studio-commerce-metric__detail">{signal.detail}</p>
            </article>
          ))}
        </section>

        {notice ? (
          <div
            className={`status-banner ${
              notice.tone === "error"
                ? "status-banner--error"
                : notice.tone === "success"
                  ? "status-banner--success"
                  : "status-banner--info"
            }`}
          >
            <strong>
              {notice.tone === "error"
                ? "Commerce error"
                : notice.tone === "success"
                  ? "Commerce updated"
                  : "Working"}
            </strong>
            <span>{notice.message}</span>
          </div>
        ) : null}

        <div className="studio-commerce__layout">
          <div className="studio-commerce__main">
            <section className="studio-commerce-panel">
              <div className="studio-commerce-panel__header">
                <div>
                  <p className="studio-commerce-panel__eyebrow">
                    Attention queue
                  </p>
                  <h3 className="studio-commerce-panel__title">
                    What needs action now
                  </h3>
                </div>
                <p className="studio-commerce-panel__body">
                  Separate manual fulfillment, automation recovery, and open
                  reservations before reviewing the full session ledger.
                </p>
              </div>
              <div className="studio-commerce-priority-grid">
                {queueSignals.map((signal) => (
                  <article
                    className={`studio-commerce-priority-card studio-commerce-priority-card--${signal.tone}`}
                    key={signal.label}
                  >
                    <span className="studio-commerce-priority-card__label">
                      {signal.label}
                    </span>
                    <strong className="studio-commerce-priority-card__value">
                      {signal.value.toString()}
                    </strong>
                    <p className="studio-commerce-priority-card__detail">
                      {signal.description}
                    </p>
                  </article>
                ))}
              </div>
              {attentionCheckouts.length === 0 ? (
                <div className="empty-state">
                  No sessions currently require intervention in this scope.
                </div>
              ) : (
                <div className="studio-commerce-session-list">
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
            </section>

            <section className="studio-commerce-panel">
              <div className="studio-commerce-panel__header">
                <div>
                  <p className="studio-commerce-panel__eyebrow">
                    Session workspace
                  </p>
                  <h3 className="studio-commerce-panel__title">
                    Full transaction ledger
                  </h3>
                </div>
                <p className="studio-commerce-panel__body">
                  Every session remains available for payment recovery, release,
                  fulfillment updates, and provider verification.
                </p>
              </div>
              {prioritizedCheckouts.length === 0 ? (
                <div className="empty-state">
                  Buyer-facing checkout has not produced any sessions yet.
                </div>
              ) : (
                <div className="studio-commerce-session-list">
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
            </section>
          </div>

          <aside className="studio-commerce__rail">
            <section className="studio-commerce-panel">
              <div className="studio-commerce-panel__header">
                <div>
                  <p className="studio-commerce-panel__eyebrow">Scope</p>
                  <h3 className="studio-commerce-panel__title">
                    Brand and workspace context
                  </h3>
                </div>
                <p className="studio-commerce-panel__body">
                  Make the current commerce boundary explicit before exporting,
                  retrying automation, or reviewing buyer sessions.
                </p>
              </div>
              <label className="field-stack">
                <span className="field-label">Active commerce scope</span>
                <select
                  className="input-field"
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
                </select>
              </label>
              <div className="studio-commerce-brand-list">
                <button
                  className={`studio-commerce-brand-button ${
                    dashboard.activeBrandSlug === null
                      ? "studio-commerce-brand-button--active"
                      : ""
                  }`}
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
                </button>
                {sortedBrands.map((brand) => (
                  <button
                    className={`studio-commerce-brand-button ${
                      dashboard.activeBrandSlug === brand.brandSlug
                        ? "studio-commerce-brand-button--active"
                        : ""
                    }`}
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
                  </button>
                ))}
              </div>
            </section>

            <section className="studio-commerce-panel">
              <div className="studio-commerce-panel__header">
                <div>
                  <p className="studio-commerce-panel__eyebrow">Releases</p>
                  <h3 className="studio-commerce-panel__title">
                    Collection pressure
                  </h3>
                </div>
                <p className="studio-commerce-panel__body">
                  Focus on the live or recently active releases carrying the
                  most open checkout and fulfillment backlog.
                </p>
              </div>
              {sortedCollections.length === 0 ? (
                <div className="empty-state">
                  No checkout sessions exist yet.
                </div>
              ) : (
                <div className="studio-commerce-collection-list">
                  {sortedCollections.map((collection) => (
                    <article
                      className="studio-commerce-collection-card"
                      key={collection.collectionPublicPath}
                    >
                      <div className="studio-commerce-collection-card__copy">
                        <strong>{collection.title}</strong>
                        <span>
                          {collection.brandName} · {collection.storefrontStatus}
                        </span>
                        <span>
                          {collection.openCheckoutCount.toString()} open ·{" "}
                          {collection.unfulfilledCheckoutCount.toString()}{" "}
                          unfulfilled
                        </span>
                      </div>
                      <Link
                        className="inline-link"
                        href={collection.collectionPublicPath}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Public page
                      </Link>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="studio-commerce-panel">
              <div className="studio-commerce-panel__header">
                <div>
                  <p className="studio-commerce-panel__eyebrow">Reports</p>
                  <h3 className="studio-commerce-panel__title">
                    Export and verify
                  </h3>
                </div>
                <p className="studio-commerce-panel__body">
                  Export the same filtered session scope you are reviewing live,
                  or verify timing and automation cadence before a handoff.
                </p>
              </div>
              <div className="studio-commerce-report-grid">
                <div className="studio-commerce-report-item">
                  <span>Completion rate</span>
                  <strong>{formatPercent(completionRate)}</strong>
                </div>
                <div className="studio-commerce-report-item">
                  <span>Fulfillment rate</span>
                  <strong>{formatPercent(fulfillmentRate)}</strong>
                </div>
                <div className="studio-commerce-report-item">
                  <span>Last paid</span>
                  <strong>{formatTimestamp(latestCompletedCheckoutAt)}</strong>
                </div>
                <div className="studio-commerce-report-item">
                  <span>Last fulfilled</span>
                  <strong>{formatTimestamp(latestFulfilledCheckoutAt)}</strong>
                </div>
              </div>
              <div className="studio-action-row">
                <a className="action-link" href={commerceReportCsvPath}>
                  Export CSV
                </a>
                <a
                  className="inline-link"
                  href={commerceReportPath}
                  rel="noreferrer"
                  target="_blank"
                >
                  Open report JSON
                </a>
              </div>
              <div className="pill-row">
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
              </div>
            </section>
          </aside>
        </div>
      </div>
    </PageShell>
  );
}
