"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  startTransition,
  type FormEvent,
  useEffect,
  useEffectEvent,
  useState
} from "react";

import {
  studioCommerceDashboardQuerySchema,
  studioCommerceCheckoutActionResponseSchema,
  studioCommerceDashboardResponseSchema,
  type CommerceCheckoutFulfillmentStatus,
  type CommerceFulfillmentAutomationStatus,
  type StudioCommerceCheckoutSummary,
  type StudioCommerceDashboardResponse
} from "@ai-nft-forge/shared";
import {
  MetricTile,
  PageShell,
  Pill,
  SurfaceCard,
  SurfaceGrid
} from "@ai-nft-forge/ui";

type StudioCommerceClientProps = {
  initialDashboard: StudioCommerceDashboardResponse["dashboard"];
  ownerWalletAddress: string;
};

type NoticeState = {
  message: string;
  tone: "error" | "info" | "success";
} | null;

type FulfillmentEditorState = Record<
  string,
  {
    fulfillmentNotes: string;
    fulfillmentStatus: CommerceCheckoutFulfillmentStatus;
  }
>;

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

function formatCheckoutStatus(status: StudioCommerceCheckoutSummary["status"]) {
  switch (status) {
    case "completed":
      return "Completed";
    case "expired":
      return "Expired";
    case "canceled":
      return "Canceled";
    case "open":
    default:
      return "Open";
  }
}

function formatFulfillmentStatus(
  status: StudioCommerceCheckoutSummary["fulfillmentStatus"]
) {
  return status === "fulfilled" ? "Fulfilled" : "Unfulfilled";
}

function formatAutomationStatus(status: CommerceFulfillmentAutomationStatus) {
  switch (status) {
    case "queued":
      return "Queued";
    case "processing":
      return "Dispatching";
    case "submitted":
      return "Submitted";
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
    case "idle":
    default:
      return "Idle";
  }
}

function formatProviderKind(
  providerKind: StudioCommerceCheckoutSummary["providerKind"]
) {
  return providerKind === "stripe" ? "Stripe" : "Manual";
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
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
  const latestCompletedCheckoutAt = dashboard.checkouts.reduce<string | null>(
    (latest, checkout) =>
      checkout.completedAt !== null &&
      (latest === null || checkout.completedAt > latest)
        ? checkout.completedAt
        : latest,
    null
  );
  const latestFulfilledCheckoutAt = dashboard.checkouts.reduce<string | null>(
    (latest, checkout) =>
      checkout.fulfilledAt !== null &&
      (latest === null || checkout.fulfilledAt > latest)
        ? checkout.fulfilledAt
        : latest,
    null
  );
  const commerceReportPath = createCommerceReportPath(
    dashboard.activeBrandSlug
  );
  const commerceReportCsvPath = createCommerceReportPath(
    dashboard.activeBrandSlug,
    "csv"
  );

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

  async function runCheckoutAction(input: {
    checkoutSessionId: string;
    message: string;
    method?: "PATCH" | "POST";
    path: string;
    payload?: unknown;
    successMessage: string;
  }) {
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
      title="Review reservations, payments, and fulfillment"
      lead="This protected studio surface is the owner control plane for live commerce sessions. It tracks provider-specific checkout state, lets manual deployments confirm payment, lets owners release stale reservations, and records fulfillment separately from payment completion."
      actions={
        <>
          <button
            className="button-action"
            disabled={isRefreshing}
            onClick={() => {
              void refreshDashboard();
            }}
            type="button"
          >
            {isRefreshing ? "Refreshing…" : "Refresh data"}
          </button>
          <Link className="action-link" href="/studio/collections">
            Open collections
          </Link>
          <Link className="action-link" href="/studio/commerce/fleet">
            Commerce fleet
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
          body="Checkout volume, provider mix, and fulfillment backlog are derived from durable commerce session records. Completed sales remain separate from fulfillment so payment and delivery workflows do not get conflated."
          eyebrow="Overview"
          span={12}
          title="Owner-side commerce operations"
        >
          <div className="metric-list">
            <MetricTile label="Owner" value={ownerWalletAddress} />
            <MetricTile
              label="Scope"
              value={activeBrand?.brandSlug ?? "all brands"}
            />
            <MetricTile
              label="Checkouts"
              value={dashboard.summary.totalCheckoutCount.toString()}
            />
            <MetricTile
              label="Open"
              value={dashboard.summary.openCheckoutCount.toString()}
            />
            <MetricTile
              label="Completed"
              value={dashboard.summary.completedCheckoutCount.toString()}
            />
            <MetricTile
              label="Unfulfilled"
              value={dashboard.summary.unfulfilledCheckoutCount.toString()}
            />
            <MetricTile
              label="Automation queued"
              value={dashboard.summary.automationQueuedCheckoutCount.toString()}
            />
            <MetricTile
              label="Stripe"
              value={dashboard.summary.stripeCheckoutCount.toString()}
            />
          </div>
          <label className="field-stack">
            <span className="field-label">Commerce scope</span>
            <select
              className="input-field"
              onChange={(event) => {
                void handleBrandScopeChange(event.target.value || null);
              }}
              value={dashboard.activeBrandSlug ?? ""}
            >
              <option value="">All brands</option>
              {dashboard.brands.map((brand) => (
                <option key={brand.brandSlug} value={brand.brandSlug}>
                  {brand.brandName} · {brand.totalCheckoutCount} checkouts
                </option>
              ))}
            </select>
          </label>
          <div className="pill-row">
            <Pill>/studio/commerce</Pill>
            <Pill>{dashboard.brands.length} brands</Pill>
            <Pill>{dashboard.summary.manualCheckoutCount} manual</Pill>
            <Pill>{dashboard.summary.stripeCheckoutCount} stripe</Pill>
            <Pill>{dashboard.summary.fulfilledCheckoutCount} fulfilled</Pill>
            <Pill>
              {dashboard.summary.automationFailedCheckoutCount} automation
              failed
            </Pill>
            <Pill>{dashboard.summary.expiredCheckoutCount} expired</Pill>
            <Pill>{dashboard.summary.canceledCheckoutCount} canceled</Pill>
          </div>
        </SurfaceCard>

        <SurfaceCard
          body="Brand partitions keep workspace-level commerce from flattening multi-brand performance. Switch scope at the top to review one storefront without losing the cross-brand backlog picture."
          eyebrow="Brands"
          span={4}
          title="Commerce partitions"
        >
          {dashboard.brands.length === 0 ? (
            <div className="empty-state">No brands are configured yet.</div>
          ) : (
            <div className="stack-list">
              <button
                className="status-banner"
                onClick={() => {
                  void handleBrandScopeChange(null);
                }}
                type="button"
              >
                <strong>All brands</strong>
                <span>
                  {dashboard.brands.reduce(
                    (total, brand) => total + brand.totalCheckoutCount,
                    0
                  )}{" "}
                  total checkouts across the workspace
                </span>
                <div className="pill-row">
                  <Pill>
                    {dashboard.activeBrandSlug === null
                      ? "active"
                      : "workspace"}
                  </Pill>
                </div>
              </button>
              {dashboard.brands.map((brand) => (
                <button
                  className="status-banner"
                  key={brand.brandSlug}
                  onClick={() => {
                    void handleBrandScopeChange(brand.brandSlug);
                  }}
                  type="button"
                >
                  <strong>{brand.brandName}</strong>
                  <span>
                    {brand.totalCheckoutCount} total, {brand.openCheckoutCount}{" "}
                    open, {brand.unfulfilledCheckoutCount} unfulfilled
                  </span>
                  <div className="pill-row">
                    <Pill>{brand.brandSlug}</Pill>
                    <Pill>
                      {dashboard.activeBrandSlug === brand.brandSlug
                        ? "active"
                        : "view brand"}
                    </Pill>
                  </div>
                </button>
              ))}
            </div>
          )}
        </SurfaceCard>

        <SurfaceCard
          body="These collection-level aggregates make it obvious where the active queue or fulfillment backlog sits before drilling into individual sessions."
          eyebrow="Collections"
          span={4}
          title={
            activeBrand
              ? `Checkout backlog in ${activeBrand.brandName}`
              : "Checkout backlog by release"
          }
        >
          {dashboard.collections.length === 0 ? (
            <div className="empty-state">No checkout sessions exist yet.</div>
          ) : (
            <div className="stack-list">
              {dashboard.collections.map((collection) => (
                <div
                  className="status-banner"
                  key={collection.collectionPublicPath}
                >
                  <strong>{collection.title}</strong>
                  <span>
                    {collection.openCheckoutCount} open,{" "}
                    {collection.unfulfilledCheckoutCount} unfulfilled,{" "}
                    {collection.completedCheckoutCount} completed
                  </span>
                  <div className="pill-row">
                    <Pill>{collection.storefrontStatus}</Pill>
                    <Link
                      className="inline-link"
                      href={collection.collectionPublicPath}
                      target="_blank"
                    >
                      Public page
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SurfaceCard>

        <SurfaceCard
          body="Export the current workspace or brand scope as a durable checkout-session report. The CSV export uses the same active brand filter as the dashboard so handoffs and offline review do not drift from what operators are seeing live."
          eyebrow="Reports"
          span={4}
          title={
            activeBrand
              ? `Reporting for ${activeBrand.brandName}`
              : "Reporting across all brands"
          }
        >
          <div className="metric-list">
            <MetricTile
              label="Completion rate"
              value={formatPercent(completionRate)}
            />
            <MetricTile
              label="Fulfillment rate"
              value={formatPercent(fulfillmentRate)}
            />
            <MetricTile
              label="Last paid"
              value={formatTimestamp(latestCompletedCheckoutAt)}
            />
            <MetricTile
              label="Last fulfilled"
              value={formatTimestamp(latestFulfilledCheckoutAt)}
            />
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
            <Pill>{dashboard.activeBrandSlug ?? "all-brands"}</Pill>
            <Pill>{dashboard.checkouts.length} rows in scope</Pill>
            <Pill>{dashboard.collections.length} collections</Pill>
          </div>
        </SurfaceCard>

        <SurfaceCard
          body="Each session card exposes the current payment state, owner recovery actions, and fulfillment controls for completed sales."
          eyebrow="Sessions"
          span={8}
          title={
            activeBrand
              ? `Recent checkout sessions in ${activeBrand.brandName}`
              : "Recent checkout sessions"
          }
        >
          {notice ? (
            <div
              className={`status-banner ${
                notice.tone === "error"
                  ? "status-banner--error"
                  : notice.tone === "success"
                    ? "status-banner--success"
                    : ""
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
          {dashboard.checkouts.length === 0 ? (
            <div className="empty-state">
              Buyer-facing checkout has not produced any sessions yet.
            </div>
          ) : (
            <div className="stack-list">
              {dashboard.checkouts.map((checkout) => {
                const editor = fulfillmentEditors[
                  checkout.checkoutSessionId
                ] ?? {
                  fulfillmentNotes: checkout.fulfillmentNotes ?? "",
                  fulfillmentStatus: checkout.fulfillmentStatus
                };
                const actionBusy =
                  busyCheckoutAction === checkout.checkoutSessionId;
                const canCompleteManually =
                  checkout.providerKind === "manual" &&
                  checkout.status === "open";
                const canCancel =
                  checkout.status === "open" || checkout.status === "expired";
                const canEditFulfillment = checkout.status === "completed";
                const canRetryAutomation =
                  checkout.fulfillmentProviderKind === "webhook" &&
                  checkout.status === "completed" &&
                  checkout.fulfillmentStatus === "unfulfilled" &&
                  (checkout.fulfillmentAutomationStatus === "failed" ||
                    checkout.fulfillmentAutomationStatus === "idle");

                return (
                  <article
                    className="status-banner"
                    key={checkout.checkoutSessionId}
                  >
                    <strong>{checkout.title}</strong>
                    <span>
                      {checkout.buyerDisplayName
                        ? `${checkout.buyerDisplayName} · `
                        : ""}
                      {checkout.buyerEmail} · edition #{checkout.editionNumber}
                    </span>
                    <div className="pill-row">
                      <Pill>{checkout.brandSlug}</Pill>
                      <Pill>{formatCheckoutStatus(checkout.status)}</Pill>
                      <Pill>{formatProviderKind(checkout.providerKind)}</Pill>
                      <Pill>
                        {formatFulfillmentStatus(checkout.fulfillmentStatus)}
                      </Pill>
                      <Pill>
                        {formatAutomationStatus(
                          checkout.fulfillmentAutomationStatus
                        )}
                      </Pill>
                      <Pill>{checkout.storefrontStatus}</Pill>
                      {checkout.priceLabel ? (
                        <Pill>{checkout.priceLabel}</Pill>
                      ) : null}
                    </div>
                    <div className="metric-list">
                      <MetricTile
                        label="Created"
                        value={formatTimestamp(checkout.createdAt)}
                      />
                      <MetricTile
                        label="Expires"
                        value={formatTimestamp(checkout.expiresAt)}
                      />
                      <MetricTile
                        label="Completed"
                        value={formatTimestamp(checkout.completedAt)}
                      />
                      <MetricTile
                        label="Fulfilled"
                        value={formatTimestamp(checkout.fulfilledAt)}
                      />
                      <MetricTile
                        label="Last automation"
                        value={formatTimestamp(
                          checkout.fulfillmentAutomationLastAttemptedAt
                        )}
                      />
                      <MetricTile
                        label="Webhook accepted"
                        value={formatTimestamp(
                          checkout.fulfillmentAutomationLastSucceededAt
                        )}
                      />
                    </div>
                    <div className="pill-row">
                      <Link
                        className="inline-link"
                        href={checkout.collectionPublicPath}
                        target="_blank"
                      >
                        Public release
                      </Link>
                      <Link
                        className="inline-link"
                        href={`/brands/${checkout.brandSlug}/collections/${checkout.collectionSlug}/checkout/${checkout.checkoutSessionId}`}
                        target="_blank"
                      >
                        Hosted checkout
                      </Link>
                      {checkout.providerKind === "stripe" ? (
                        <Link
                          className="inline-link"
                          href={checkout.checkoutUrl}
                          target="_blank"
                        >
                          Stripe session
                        </Link>
                      ) : null}
                    </div>
                    {checkout.providerSessionId ? (
                      <div className="pill-row">
                        <Pill>{checkout.providerSessionId}</Pill>
                      </div>
                    ) : null}
                    {checkout.fulfillmentProviderKind === "webhook" ? (
                      <div className="pill-row">
                        <Pill>fulfillment webhook</Pill>
                        <Pill>
                          {checkout.fulfillmentAutomationAttemptCount.toString()}{" "}
                          attempts
                        </Pill>
                        {checkout.fulfillmentAutomationExternalReference ? (
                          <Pill>
                            {checkout.fulfillmentAutomationExternalReference}
                          </Pill>
                        ) : null}
                      </div>
                    ) : null}
                    {checkout.fulfillmentAutomationErrorMessage ? (
                      <div className="status-banner status-banner--error">
                        <strong>
                          {checkout.fulfillmentAutomationErrorCode ??
                            "Automation failure"}
                        </strong>
                        <span>
                          {checkout.fulfillmentAutomationErrorMessage}
                        </span>
                      </div>
                    ) : null}
                    {canCompleteManually || canCancel ? (
                      <div className="pill-row">
                        {canCompleteManually ? (
                          <button
                            className="button-action"
                            disabled={actionBusy}
                            onClick={() => {
                              void runCheckoutAction({
                                checkoutSessionId: checkout.checkoutSessionId,
                                message: "Recording manual payment…",
                                path: `/api/studio/commerce/checkouts/${checkout.checkoutSessionId}/complete`,
                                successMessage:
                                  "Manual checkout marked completed."
                              });
                            }}
                            type="button"
                          >
                            {actionBusy ? "Working…" : "Mark paid"}
                          </button>
                        ) : null}
                        {canCancel ? (
                          <button
                            className="button-action"
                            disabled={actionBusy}
                            onClick={() => {
                              void runCheckoutAction({
                                checkoutSessionId: checkout.checkoutSessionId,
                                message: "Releasing checkout session…",
                                path: `/api/studio/commerce/checkouts/${checkout.checkoutSessionId}/cancel`,
                                successMessage: "Checkout session released."
                              });
                            }}
                            type="button"
                          >
                            {actionBusy ? "Working…" : "Release session"}
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                    {canRetryAutomation ? (
                      <div className="pill-row">
                        <button
                          className="button-action"
                          disabled={actionBusy}
                          onClick={() => {
                            void runCheckoutAction({
                              checkoutSessionId: checkout.checkoutSessionId,
                              message: "Requeueing fulfillment automation…",
                              path: `/api/studio/commerce/checkouts/${checkout.checkoutSessionId}/fulfillment/retry`,
                              payload: {
                                reason: null
                              },
                              successMessage: "Fulfillment automation requeued."
                            });
                          }}
                          type="button"
                        >
                          {actionBusy ? "Working…" : "Retry automation"}
                        </button>
                      </div>
                    ) : null}
                    {canEditFulfillment ? (
                      <form
                        className="studio-form"
                        onSubmit={(event) => {
                          void handleFulfillmentSubmit(event, checkout);
                        }}
                      >
                        <label className="field-stack">
                          <span className="field-label">
                            Fulfillment status
                          </span>
                          <select
                            className="input-field"
                            onChange={(event) => {
                              const nextStatus = event.target
                                .value as CommerceCheckoutFulfillmentStatus;

                              setFulfillmentEditors((current) => ({
                                ...current,
                                [checkout.checkoutSessionId]: {
                                  ...(current[checkout.checkoutSessionId] ??
                                    editor),
                                  fulfillmentStatus: nextStatus
                                }
                              }));
                            }}
                            value={editor.fulfillmentStatus}
                          >
                            <option value="unfulfilled">Unfulfilled</option>
                            <option value="fulfilled">Fulfilled</option>
                          </select>
                        </label>
                        <label className="field-stack">
                          <span className="field-label">Fulfillment notes</span>
                          <textarea
                            className="input-field"
                            onChange={(event) => {
                              setFulfillmentEditors((current) => ({
                                ...current,
                                [checkout.checkoutSessionId]: {
                                  ...(current[checkout.checkoutSessionId] ??
                                    editor),
                                  fulfillmentNotes: event.target.value
                                }
                              }));
                            }}
                            placeholder="Delivery, wallet handoff, tracking, or internal notes"
                            rows={3}
                            value={editor.fulfillmentNotes}
                          />
                        </label>
                        <button
                          className="button-action"
                          disabled={actionBusy}
                          type="submit"
                        >
                          {actionBusy ? "Saving…" : "Save fulfillment"}
                        </button>
                      </form>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </SurfaceCard>
      </SurfaceGrid>
    </PageShell>
  );
}
