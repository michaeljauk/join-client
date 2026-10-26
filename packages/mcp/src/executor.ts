// NOTE: types are imported from the /mcp subpath's re-exports via the package
// types entry, but we avoid the root JS module because it imports
// `cloudflare:workers`. We reimplement a minimal normalizeCode below.
import type {
  Executor,
  ExecuteResult,
  ResolvedProvider,
} from "@cloudflare/codemode";

type ProviderFns = Record<string, (...args: unknown[]) => Promise<unknown>>;
type ProvidersInput = ResolvedProvider[] | ProviderFns;

const AsyncFunction = Object.getPrototypeOf(async function () {})
  .constructor as new (
  ...args: string[]
) => (...a: unknown[]) => Promise<ExecuteResult>;

export interface NodeExecutorOptions {
  timeoutMs?: number;
}

/**
 * Node-local Executor for @cloudflare/codemode.
 *
 * Runs LLM-authored async arrow functions in the host process via AsyncFunction,
 * with provider tool functions exposed as namespaced Proxies. There is no
 * sandbox isolation beyond scope — agent code runs with the MCP server's
 * privileges, which is acceptable for a local stdio server that already
 * holds the user's JOIN token.
 */
export class NodeExecutor implements Executor {
  readonly #timeoutMs: number;

  constructor(options: NodeExecutorOptions = {}) {
    this.#timeoutMs = options.timeoutMs ?? 30_000;
  }

  async execute(
    code: string,
    providersOrFns: ProvidersInput,
  ): Promise<ExecuteResult> {
    const providers = toProviderArray(providersOrFns);

    const invalid = validateProviderNames(providers);
    if (invalid) return { result: undefined, error: invalid };

    const normalized = normalizeCode(code);
    const logs: string[] = [];
    const sandboxConsole = {
      log: (...a: unknown[]) => logs.push(a.map(stringify).join(" ")),
      warn: (...a: unknown[]) =>
        logs.push("[warn] " + a.map(stringify).join(" ")),
      error: (...a: unknown[]) =>
        logs.push("[error] " + a.map(stringify).join(" ")),
    };

    const proxies = providers.map((p) => makeProviderProxy(p));
    const providerNames = providers.map((p) => p.name);

    const body = `
      try {
        const result = await Promise.race([
          (${normalized})(),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Execution timed out")), ${this.#timeoutMs})),
        ]);
        return { result, logs: __logs };
      } catch (err) {
        return { result: undefined, error: (err && err.message) ? err.message : String(err), logs: __logs };
      }
    `;

    try {
      const fn = new AsyncFunction(
        "console",
        "__logs",
        "setTimeout",
        ...providerNames,
        body,
      );
      return await fn(sandboxConsole, logs, setTimeout, ...proxies);
    } catch (err) {
      return {
        result: undefined,
        error: err instanceof Error ? err.message : String(err),
        logs,
      };
    }
  }
}

function toProviderArray(input: ProvidersInput): ResolvedProvider[] {
  if (Array.isArray(input)) return input;
  return [{ name: "codemode", fns: input }];
}

const RESERVED = new Set(["console", "__logs", "setTimeout"]);
const VALID_IDENT = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;

function validateProviderNames(providers: ResolvedProvider[]): string | null {
  const seen = new Set<string>();
  for (const p of providers) {
    if (RESERVED.has(p.name)) return `Provider name "${p.name}" is reserved`;
    if (!VALID_IDENT.test(p.name))
      return `Provider name "${p.name}" is not a valid JavaScript identifier`;
    if (seen.has(p.name)) return `Duplicate provider name "${p.name}"`;
    seen.add(p.name);
  }
  return null;
}

function makeProviderProxy(provider: ResolvedProvider): unknown {
  return new Proxy(Object.create(null), {
    get(_target, prop) {
      if (typeof prop !== "string") return undefined;
      const fn = provider.fns[prop];
      if (!fn) {
        return async () => {
          throw new Error(`Unknown tool: ${provider.name}.${prop}`);
        };
      }
      if (provider.positionalArgs) {
        return async (...args: unknown[]) => fn(...args);
      }
      return async (args: unknown) => fn(args ?? {});
    },
  });
}

/**
 * Strip markdown code fences LLMs sometimes wrap code in, and ensure the
 * result is an expression that can be invoked with `()`. Ported minimally
 * from @cloudflare/codemode — full version handles more AST shapes, but for
 * our prompt (which tells the model to emit `async () => ...`) this is enough.
 */
function normalizeCode(code: string): string {
  const trimmed = code.trim();
  const fenced = trimmed.match(
    /^```(?:js|javascript|typescript|ts|tsx|jsx)?\s*\n([\s\S]*?)```\s*$/,
  );
  const body = (fenced?.[1] ?? trimmed).trim();
  if (!body) return "async () => {}";
  if (body.startsWith("async") || body.startsWith("(")) return body;
  return `async () => {\n${body}\n}`;
}

function stringify(v: unknown): string {
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}
