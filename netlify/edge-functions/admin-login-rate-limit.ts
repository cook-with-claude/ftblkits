interface NetlifyContext {
  next(): Promise<Response>;
}

// Hosting-level protection for the shared-password login. The route keeps a
// small in-process fallback for local development, while Netlify enforces this
// limit consistently across serverless instances in production.
export default function adminLoginRateLimit(_request: Request, context: NetlifyContext) {
  return context.next();
}

export const config = {
  path: "/api/admin/login",
  rateLimit: {
    action: "rate_limit",
    aggregateBy: ["ip", "domain"],
    windowLimit: 10,
    windowSize: 900,
  },
};
