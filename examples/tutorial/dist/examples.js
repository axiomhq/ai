var Wh = Object.defineProperty;
var al = (t) => {
  throw TypeError(t);
};
var Kh = (t, e, r) => e in t ? Wh(t, e, { enumerable: !0, configurable: !0, writable: !0, value: r }) : t[e] = r;
var ol = (t, e, r) => Kh(t, typeof e != "symbol" ? e + "" : e, r), Qi = (t, e, r) => e.has(t) || al("Cannot " + r);
var Kt = (t, e, r) => (Qi(t, e, "read from private field"), r ? r.call(t) : e.get(t)), Hi = (t, e, r) => e.has(t) ? al("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(t) : e.set(t, r), fs = (t, e, r, n) => (Qi(t, e, "write to private field"), n ? n.call(t, r) : e.set(t, r), r), ea = (t, e, r) => (Qi(t, e, "access private method"), r);
var Gh = Object.defineProperty, Yh = (t, e, r) => e in t ? Gh(t, e, { enumerable: !0, configurable: !0, writable: !0, value: r }) : t[e] = r, ll = (t, e, r) => Yh(t, typeof e != "symbol" ? e + "" : e, r);
const Xh = ({ project: t, prompt: e, data: r, task: n, scorers: s }) => (console.log(t, e, r, n, s), { output: "NOT_IMPLEMENTED" }), Qh = (t) => (console.log(t), { name: t }), Hh = (t, e) => (console.log(t, e), { id: "NOT_IMPLEMENTED", version: "NOT_IMPLEMENTED", environment: "development", ...e }), ed = (t, { environment: e, version: r }) => {
  console.log(t, e, r);
};
class td {
  constructor(e) {
    ll(this, "prompts", {
      create: (r, n) => (console.log(this.apiKey), Hh(r, n)),
      deploy: (r, { environment: n, version: s }) => ed(r, { environment: n, version: s })
    }), ll(this, "projects", {
      create: (r) => Qh(r)
    }), this.apiKey = e;
  }
  run({ project: e, prompt: r, inputs: n }) {
    console.log(e, r, n);
  }
  eval({ project: e, prompt: r, data: n, task: s, scorers: i }) {
    Xh({ project: e, prompt: r, data: n, task: s, scorers: i });
  }
}
const Ma = "RFC3986", Fa = {
  RFC1738: (t) => String(t).replace(/%20/g, "+"),
  RFC3986: (t) => String(t)
}, rd = "RFC1738", nd = Array.isArray, ar = (() => {
  const t = [];
  for (let e = 0; e < 256; ++e)
    t.push("%" + ((e < 16 ? "0" : "") + e.toString(16)).toUpperCase());
  return t;
})(), ta = 1024, sd = (t, e, r, n, s) => {
  if (t.length === 0)
    return t;
  let i = t;
  if (typeof t == "symbol" ? i = Symbol.prototype.toString.call(t) : typeof t != "string" && (i = String(t)), r === "iso-8859-1")
    return escape(i).replace(/%u[0-9a-f]{4}/gi, function(f) {
      return "%26%23" + parseInt(f.slice(2), 16) + "%3B";
    });
  let l = "";
  for (let f = 0; f < i.length; f += ta) {
    const d = i.length >= ta ? i.slice(f, f + ta) : i, p = [];
    for (let g = 0; g < d.length; ++g) {
      let w = d.charCodeAt(g);
      if (w === 45 || // -
      w === 46 || // .
      w === 95 || // _
      w === 126 || // ~
      w >= 48 && w <= 57 || // 0-9
      w >= 65 && w <= 90 || // a-z
      w >= 97 && w <= 122 || // A-Z
      s === rd && (w === 40 || w === 41)) {
        p[p.length] = d.charAt(g);
        continue;
      }
      if (w < 128) {
        p[p.length] = ar[w];
        continue;
      }
      if (w < 2048) {
        p[p.length] = ar[192 | w >> 6] + ar[128 | w & 63];
        continue;
      }
      if (w < 55296 || w >= 57344) {
        p[p.length] = ar[224 | w >> 12] + ar[128 | w >> 6 & 63] + ar[128 | w & 63];
        continue;
      }
      g += 1, w = 65536 + ((w & 1023) << 10 | d.charCodeAt(g) & 1023), p[p.length] = ar[240 | w >> 18] + ar[128 | w >> 12 & 63] + ar[128 | w >> 6 & 63] + ar[128 | w & 63];
    }
    l += p.join("");
  }
  return l;
};
function id(t) {
  return !t || typeof t != "object" ? !1 : !!(t.constructor && t.constructor.isBuffer && t.constructor.isBuffer(t));
}
function cl(t, e) {
  if (nd(t)) {
    const r = [];
    for (let n = 0; n < t.length; n += 1)
      r.push(e(t[n]));
    return r;
  }
  return e(t);
}
const ad = Object.prototype.hasOwnProperty, qu = {
  brackets(t) {
    return String(t) + "[]";
  },
  comma: "comma",
  indices(t, e) {
    return String(t) + "[" + e + "]";
  },
  repeat(t) {
    return String(t);
  }
}, or = Array.isArray, od = Array.prototype.push, Lu = function(t, e) {
  od.apply(t, or(e) ? e : [e]);
}, ld = Date.prototype.toISOString, dt = {
  addQueryPrefix: !1,
  allowDots: !1,
  allowEmptyArrays: !1,
  arrayFormat: "indices",
  charset: "utf-8",
  charsetSentinel: !1,
  delimiter: "&",
  encode: !0,
  encodeDotInKeys: !1,
  encoder: sd,
  encodeValuesOnly: !1,
  format: Ma,
  formatter: Fa[Ma],
  /** @deprecated */
  indices: !1,
  serializeDate(t) {
    return ld.call(t);
  },
  skipNulls: !1,
  strictNullHandling: !1
};
function cd(t) {
  return typeof t == "string" || typeof t == "number" || typeof t == "boolean" || typeof t == "symbol" || typeof t == "bigint";
}
const ra = {};
function Vu(t, e, r, n, s, i, l, f, d, p, g, w, P, x, T, S, y, _) {
  let m = t, b = _, $ = 0, O = !1;
  for (; (b = b.get(ra)) !== void 0 && !O; ) {
    const H = b.get(t);
    if ($ += 1, typeof H < "u") {
      if (H === $)
        throw new RangeError("Cyclic object value");
      O = !0;
    }
    typeof b.get(ra) > "u" && ($ = 0);
  }
  if (typeof p == "function" ? m = p(e, m) : m instanceof Date ? m = P == null ? void 0 : P(m) : r === "comma" && or(m) && (m = cl(m, function(H) {
    return H instanceof Date ? P == null ? void 0 : P(H) : H;
  })), m === null) {
    if (i)
      return d && !S ? (
        // @ts-expect-error
        d(e, dt.encoder, y, "key", x)
      ) : e;
    m = "";
  }
  if (cd(m) || id(m)) {
    if (d) {
      const H = S ? e : d(e, dt.encoder, y, "key", x);
      return [
        (T == null ? void 0 : T(H)) + "=" + // @ts-expect-error
        (T == null ? void 0 : T(d(m, dt.encoder, y, "value", x)))
      ];
    }
    return [(T == null ? void 0 : T(e)) + "=" + (T == null ? void 0 : T(String(m)))];
  }
  const A = [];
  if (typeof m > "u")
    return A;
  let j;
  if (r === "comma" && or(m))
    S && d && (m = cl(m, d)), j = [{ value: m.length > 0 ? m.join(",") || null : void 0 }];
  else if (or(p))
    j = p;
  else {
    const H = Object.keys(m);
    j = g ? H.sort(g) : H;
  }
  const V = f ? String(e).replace(/\./g, "%2E") : String(e), G = n && or(m) && m.length === 1 ? V + "[]" : V;
  if (s && or(m) && m.length === 0)
    return G + "[]";
  for (let H = 0; H < j.length; ++H) {
    const ee = j[H], ye = (
      // @ts-ignore
      typeof ee == "object" && typeof ee.value < "u" ? ee.value : m[ee]
    );
    if (l && ye === null)
      continue;
    const ge = w && f ? ee.replace(/\./g, "%2E") : ee, ke = or(m) ? typeof r == "function" ? r(G, ge) : G : G + (w ? "." + ge : "[" + ge + "]");
    _.set(t, $);
    const ze = /* @__PURE__ */ new WeakMap();
    ze.set(ra, _), Lu(A, Vu(
      ye,
      ke,
      r,
      n,
      s,
      i,
      l,
      f,
      // @ts-ignore
      r === "comma" && S && or(m) ? null : d,
      p,
      g,
      w,
      P,
      x,
      T,
      S,
      y,
      ze
    ));
  }
  return A;
}
function ud(t = dt) {
  if (typeof t.allowEmptyArrays < "u" && typeof t.allowEmptyArrays != "boolean")
    throw new TypeError("`allowEmptyArrays` option can only be `true` or `false`, when provided");
  if (typeof t.encodeDotInKeys < "u" && typeof t.encodeDotInKeys != "boolean")
    throw new TypeError("`encodeDotInKeys` option can only be `true` or `false`, when provided");
  if (t.encoder !== null && typeof t.encoder < "u" && typeof t.encoder != "function")
    throw new TypeError("Encoder has to be a function.");
  const e = t.charset || dt.charset;
  if (typeof t.charset < "u" && t.charset !== "utf-8" && t.charset !== "iso-8859-1")
    throw new TypeError("The charset option must be either utf-8, iso-8859-1, or undefined");
  let r = Ma;
  if (typeof t.format < "u") {
    if (!ad.call(Fa, t.format))
      throw new TypeError("Unknown format option provided.");
    r = t.format;
  }
  const n = Fa[r];
  let s = dt.filter;
  (typeof t.filter == "function" || or(t.filter)) && (s = t.filter);
  let i;
  if (t.arrayFormat && t.arrayFormat in qu ? i = t.arrayFormat : "indices" in t ? i = t.indices ? "indices" : "repeat" : i = dt.arrayFormat, "commaRoundTrip" in t && typeof t.commaRoundTrip != "boolean")
    throw new TypeError("`commaRoundTrip` must be a boolean, or absent");
  const l = typeof t.allowDots > "u" ? t.encodeDotInKeys ? !0 : dt.allowDots : !!t.allowDots;
  return {
    addQueryPrefix: typeof t.addQueryPrefix == "boolean" ? t.addQueryPrefix : dt.addQueryPrefix,
    // @ts-ignore
    allowDots: l,
    allowEmptyArrays: typeof t.allowEmptyArrays == "boolean" ? !!t.allowEmptyArrays : dt.allowEmptyArrays,
    arrayFormat: i,
    charset: e,
    charsetSentinel: typeof t.charsetSentinel == "boolean" ? t.charsetSentinel : dt.charsetSentinel,
    commaRoundTrip: !!t.commaRoundTrip,
    delimiter: typeof t.delimiter > "u" ? dt.delimiter : t.delimiter,
    encode: typeof t.encode == "boolean" ? t.encode : dt.encode,
    encodeDotInKeys: typeof t.encodeDotInKeys == "boolean" ? t.encodeDotInKeys : dt.encodeDotInKeys,
    encoder: typeof t.encoder == "function" ? t.encoder : dt.encoder,
    encodeValuesOnly: typeof t.encodeValuesOnly == "boolean" ? t.encodeValuesOnly : dt.encodeValuesOnly,
    filter: s,
    format: r,
    formatter: n,
    serializeDate: typeof t.serializeDate == "function" ? t.serializeDate : dt.serializeDate,
    skipNulls: typeof t.skipNulls == "boolean" ? t.skipNulls : dt.skipNulls,
    // @ts-ignore
    sort: typeof t.sort == "function" ? t.sort : null,
    strictNullHandling: typeof t.strictNullHandling == "boolean" ? t.strictNullHandling : dt.strictNullHandling
  };
}
function fd(t, e = {}) {
  let r = t;
  const n = ud(e);
  let s, i;
  typeof n.filter == "function" ? (i = n.filter, r = i("", r)) : or(n.filter) && (i = n.filter, s = i);
  const l = [];
  if (typeof r != "object" || r === null)
    return "";
  const f = qu[n.arrayFormat], d = f === "comma" && n.commaRoundTrip;
  s || (s = Object.keys(r)), n.sort && s.sort(n.sort);
  const p = /* @__PURE__ */ new WeakMap();
  for (let P = 0; P < s.length; ++P) {
    const x = s[P];
    n.skipNulls && r[x] === null || Lu(l, Vu(
      r[x],
      x,
      // @ts-expect-error
      f,
      d,
      n.allowEmptyArrays,
      n.strictNullHandling,
      n.skipNulls,
      n.encodeDotInKeys,
      n.encode ? n.encoder : null,
      n.filter,
      n.sort,
      n.allowDots,
      n.serializeDate,
      n.format,
      n.formatter,
      n.encodeValuesOnly,
      n.charset,
      p
    ));
  }
  const g = l.join(n.delimiter);
  let w = n.addQueryPrefix === !0 ? "?" : "";
  return n.charsetSentinel && (n.charset === "iso-8859-1" ? w += "utf8=%26%2310003%3B&" : w += "utf8=%E2%9C%93&"), g.length > 0 ? w + g : "";
}
const ln = "4.103.0";
let ul = !1, Bn, Uu, zu, Da, Bu, Zu, Ju, Wu, Ku;
function hd(t, e = { auto: !1 }) {
  if (ul)
    throw new Error(`you must \`import 'openai/shims/${t.kind}'\` before importing anything else from openai`);
  if (Bn)
    throw new Error(`can't \`import 'openai/shims/${t.kind}'\` after \`import 'openai/shims/${Bn}'\``);
  ul = e.auto, Bn = t.kind, Uu = t.fetch, zu = t.FormData, Da = t.File, Bu = t.ReadableStream, Zu = t.getMultipartRequestOptions, Ju = t.getDefaultAgent, Wu = t.fileFromPath, Ku = t.isFsReadStream;
}
class dd {
  constructor(e) {
    this.body = e;
  }
  get [Symbol.toStringTag]() {
    return "MultipartBody";
  }
}
function md({ manuallyImported: t } = {}) {
  const e = t ? "You may need to use polyfills" : "Add one of these imports before your first `import … from 'openai'`:\n- `import 'openai/shims/node'` (if you're running on Node)\n- `import 'openai/shims/web'` (otherwise)\n";
  let r, n, s, i;
  try {
    r = fetch, n = Request, s = Response, i = Headers;
  } catch (l) {
    throw new Error(`this environment is missing the following Web Fetch API type: ${l.message}. ${e}`);
  }
  return {
    kind: "web",
    fetch: r,
    Request: n,
    Response: s,
    Headers: i,
    FormData: (
      // @ts-ignore
      typeof FormData < "u" ? FormData : class {
        // @ts-ignore
        constructor() {
          throw new Error(`file uploads aren't supported in this environment yet as 'FormData' is undefined. ${e}`);
        }
      }
    ),
    Blob: typeof Blob < "u" ? Blob : class {
      constructor() {
        throw new Error(`file uploads aren't supported in this environment yet as 'Blob' is undefined. ${e}`);
      }
    },
    File: (
      // @ts-ignore
      typeof File < "u" ? File : class {
        // @ts-ignore
        constructor() {
          throw new Error(`file uploads aren't supported in this environment yet as 'File' is undefined. ${e}`);
        }
      }
    ),
    ReadableStream: (
      // @ts-ignore
      typeof ReadableStream < "u" ? ReadableStream : class {
        // @ts-ignore
        constructor() {
          throw new Error(`streaming isn't supported in this environment yet as 'ReadableStream' is undefined. ${e}`);
        }
      }
    ),
    getMultipartRequestOptions: async (l, f) => ({
      ...f,
      body: new dd(l)
    }),
    getDefaultAgent: (l) => {
    },
    fileFromPath: () => {
      throw new Error("The `fileFromPath` function is only supported in Node. See the README for more details: https://www.github.com/openai/openai-node#file-uploads");
    },
    isFsReadStream: (l) => !1
  };
}
const Gu = () => {
  Bn || hd(md(), { auto: !0 });
};
Gu();
class be extends Error {
}
class Et extends be {
  constructor(e, r, n, s) {
    super(`${Et.makeMessage(e, r, n)}`), this.status = e, this.headers = s, this.request_id = s == null ? void 0 : s["x-request-id"], this.error = r;
    const i = r;
    this.code = i == null ? void 0 : i.code, this.param = i == null ? void 0 : i.param, this.type = i == null ? void 0 : i.type;
  }
  static makeMessage(e, r, n) {
    const s = r != null && r.message ? typeof r.message == "string" ? r.message : JSON.stringify(r.message) : r ? JSON.stringify(r) : n;
    return e && s ? `${e} ${s}` : e ? `${e} status code (no body)` : s || "(no status code or body)";
  }
  static generate(e, r, n, s) {
    if (!e || !s)
      return new Ci({ message: n, cause: La(r) });
    const i = r == null ? void 0 : r.error;
    return e === 400 ? new Yu(e, i, n, s) : e === 401 ? new Xu(e, i, n, s) : e === 403 ? new Qu(e, i, n, s) : e === 404 ? new Hu(e, i, n, s) : e === 409 ? new ef(e, i, n, s) : e === 422 ? new tf(e, i, n, s) : e === 429 ? new rf(e, i, n, s) : e >= 500 ? new nf(e, i, n, s) : new Et(e, i, n, s);
  }
}
class Bt extends Et {
  constructor({ message: e } = {}) {
    super(void 0, void 0, e || "Request was aborted.", void 0);
  }
}
class Ci extends Et {
  constructor({ message: e, cause: r }) {
    super(void 0, void 0, e || "Connection error.", void 0), r && (this.cause = r);
  }
}
class lo extends Ci {
  constructor({ message: e } = {}) {
    super({ message: e ?? "Request timed out." });
  }
}
class Yu extends Et {
}
class Xu extends Et {
}
class Qu extends Et {
}
class Hu extends Et {
}
class ef extends Et {
}
class tf extends Et {
}
class rf extends Et {
}
class nf extends Et {
}
class sf extends be {
  constructor() {
    super("Could not parse response content as the length limit was reached");
  }
}
class af extends be {
  constructor() {
    super("Could not parse response content as the request was rejected by the content filter");
  }
}
var hs = function(t, e, r, n, s) {
  if (n === "m") throw new TypeError("Private method is not writable");
  if (n === "a" && !s) throw new TypeError("Private accessor was defined without a setter");
  if (typeof e == "function" ? t !== e || !s : !e.has(t)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return n === "a" ? s.call(t, r) : s ? s.value = r : e.set(t, r), r;
}, Ur = function(t, e, r, n) {
  if (r === "a" && !n) throw new TypeError("Private accessor was defined without a getter");
  if (typeof e == "function" ? t !== e || !n : !e.has(t)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return r === "m" ? n : r === "a" ? n.call(t) : n ? n.value : e.get(t);
}, Vt;
class Ri {
  constructor() {
    Vt.set(this, void 0), this.buffer = new Uint8Array(), hs(this, Vt, null, "f");
  }
  decode(e) {
    if (e == null)
      return [];
    const r = e instanceof ArrayBuffer ? new Uint8Array(e) : typeof e == "string" ? new TextEncoder().encode(e) : e;
    let n = new Uint8Array(this.buffer.length + r.length);
    n.set(this.buffer), n.set(r, this.buffer.length), this.buffer = n;
    const s = [];
    let i;
    for (; (i = pd(this.buffer, Ur(this, Vt, "f"))) != null; ) {
      if (i.carriage && Ur(this, Vt, "f") == null) {
        hs(this, Vt, i.index, "f");
        continue;
      }
      if (Ur(this, Vt, "f") != null && (i.index !== Ur(this, Vt, "f") + 1 || i.carriage)) {
        s.push(this.decodeText(this.buffer.slice(0, Ur(this, Vt, "f") - 1))), this.buffer = this.buffer.slice(Ur(this, Vt, "f")), hs(this, Vt, null, "f");
        continue;
      }
      const l = Ur(this, Vt, "f") !== null ? i.preceding - 1 : i.preceding, f = this.decodeText(this.buffer.slice(0, l));
      s.push(f), this.buffer = this.buffer.slice(i.index), hs(this, Vt, null, "f");
    }
    return s;
  }
  decodeText(e) {
    if (e == null)
      return "";
    if (typeof e == "string")
      return e;
    if (typeof Buffer < "u") {
      if (e instanceof Buffer)
        return e.toString();
      if (e instanceof Uint8Array)
        return Buffer.from(e).toString();
      throw new be(`Unexpected: received non-Uint8Array (${e.constructor.name}) stream chunk in an environment with a global "Buffer" defined, which this library assumes to be Node. Please report this error.`);
    }
    if (typeof TextDecoder < "u") {
      if (e instanceof Uint8Array || e instanceof ArrayBuffer)
        return this.textDecoder ?? (this.textDecoder = new TextDecoder("utf8")), this.textDecoder.decode(e);
      throw new be(`Unexpected: received non-Uint8Array/ArrayBuffer (${e.constructor.name}) in a web platform. Please report this error.`);
    }
    throw new be("Unexpected: neither Buffer nor TextDecoder are available as globals. Please report this error.");
  }
  flush() {
    return this.buffer.length ? this.decode(`
`) : [];
  }
}
Vt = /* @__PURE__ */ new WeakMap();
Ri.NEWLINE_CHARS = /* @__PURE__ */ new Set([`
`, "\r"]);
Ri.NEWLINE_REGEXP = /\r\n|[\n\r]/g;
function pd(t, e) {
  for (let s = e ?? 0; s < t.length; s++) {
    if (t[s] === 10)
      return { preceding: s, index: s + 1, carriage: !1 };
    if (t[s] === 13)
      return { preceding: s, index: s + 1, carriage: !0 };
  }
  return null;
}
function gd(t) {
  for (let n = 0; n < t.length - 1; n++) {
    if (t[n] === 10 && t[n + 1] === 10 || t[n] === 13 && t[n + 1] === 13)
      return n + 2;
    if (t[n] === 13 && t[n + 1] === 10 && n + 3 < t.length && t[n + 2] === 13 && t[n + 3] === 10)
      return n + 4;
  }
  return -1;
}
function of(t) {
  if (t[Symbol.asyncIterator])
    return t;
  const e = t.getReader();
  return {
    async next() {
      try {
        const r = await e.read();
        return r != null && r.done && e.releaseLock(), r;
      } catch (r) {
        throw e.releaseLock(), r;
      }
    },
    async return() {
      const r = e.cancel();
      return e.releaseLock(), await r, { done: !0, value: void 0 };
    },
    [Symbol.asyncIterator]() {
      return this;
    }
  };
}
class cr {
  constructor(e, r) {
    this.iterator = e, this.controller = r;
  }
  static fromSSEResponse(e, r) {
    let n = !1;
    async function* s() {
      if (n)
        throw new Error("Cannot iterate over a consumed stream, use `.tee()` to split the stream.");
      n = !0;
      let i = !1;
      try {
        for await (const l of yd(e, r))
          if (!i) {
            if (l.data.startsWith("[DONE]")) {
              i = !0;
              continue;
            }
            if (l.event === null || l.event.startsWith("response.") || l.event.startsWith("transcript.")) {
              let f;
              try {
                f = JSON.parse(l.data);
              } catch (d) {
                throw console.error("Could not parse message into JSON:", l.data), console.error("From chunk:", l.raw), d;
              }
              if (f && f.error)
                throw new Et(void 0, f.error, void 0, mf(e.headers));
              yield f;
            } else {
              let f;
              try {
                f = JSON.parse(l.data);
              } catch (d) {
                throw console.error("Could not parse message into JSON:", l.data), console.error("From chunk:", l.raw), d;
              }
              if (l.event == "error")
                throw new Et(void 0, f.error, f.message, void 0);
              yield { event: l.event, data: f };
            }
          }
        i = !0;
      } catch (l) {
        if (l instanceof Error && l.name === "AbortError")
          return;
        throw l;
      } finally {
        i || r.abort();
      }
    }
    return new cr(s, r);
  }
  /**
   * Generates a Stream from a newline-separated ReadableStream
   * where each item is a JSON value.
   */
  static fromReadableStream(e, r) {
    let n = !1;
    async function* s() {
      const l = new Ri(), f = of(e);
      for await (const d of f)
        for (const p of l.decode(d))
          yield p;
      for (const d of l.flush())
        yield d;
    }
    async function* i() {
      if (n)
        throw new Error("Cannot iterate over a consumed stream, use `.tee()` to split the stream.");
      n = !0;
      let l = !1;
      try {
        for await (const f of s())
          l || f && (yield JSON.parse(f));
        l = !0;
      } catch (f) {
        if (f instanceof Error && f.name === "AbortError")
          return;
        throw f;
      } finally {
        l || r.abort();
      }
    }
    return new cr(i, r);
  }
  [Symbol.asyncIterator]() {
    return this.iterator();
  }
  /**
   * Splits the stream into two streams which can be
   * independently read from at different speeds.
   */
  tee() {
    const e = [], r = [], n = this.iterator(), s = (i) => ({
      next: () => {
        if (i.length === 0) {
          const l = n.next();
          e.push(l), r.push(l);
        }
        return i.shift();
      }
    });
    return [
      new cr(() => s(e), this.controller),
      new cr(() => s(r), this.controller)
    ];
  }
  /**
   * Converts this stream to a newline-separated ReadableStream of
   * JSON stringified values in the stream
   * which can be turned back into a Stream with `Stream.fromReadableStream()`.
   */
  toReadableStream() {
    const e = this;
    let r;
    const n = new TextEncoder();
    return new Bu({
      async start() {
        r = e[Symbol.asyncIterator]();
      },
      async pull(s) {
        try {
          const { value: i, done: l } = await r.next();
          if (l)
            return s.close();
          const f = n.encode(JSON.stringify(i) + `
`);
          s.enqueue(f);
        } catch (i) {
          s.error(i);
        }
      },
      async cancel() {
        var s;
        await ((s = r.return) == null ? void 0 : s.call(r));
      }
    });
  }
}
async function* yd(t, e) {
  if (!t.body)
    throw e.abort(), new be("Attempted to iterate over a response with no body");
  const r = new _d(), n = new Ri(), s = of(t.body);
  for await (const i of wd(s))
    for (const l of n.decode(i)) {
      const f = r.decode(l);
      f && (yield f);
    }
  for (const i of n.flush()) {
    const l = r.decode(i);
    l && (yield l);
  }
}
async function* wd(t) {
  let e = new Uint8Array();
  for await (const r of t) {
    if (r == null)
      continue;
    const n = r instanceof ArrayBuffer ? new Uint8Array(r) : typeof r == "string" ? new TextEncoder().encode(r) : r;
    let s = new Uint8Array(e.length + n.length);
    s.set(e), s.set(n, e.length), e = s;
    let i;
    for (; (i = gd(e)) !== -1; )
      yield e.slice(0, i), e = e.slice(i);
  }
  e.length > 0 && (yield e);
}
class _d {
  constructor() {
    this.event = null, this.data = [], this.chunks = [];
  }
  decode(e) {
    if (e.endsWith("\r") && (e = e.substring(0, e.length - 1)), !e) {
      if (!this.event && !this.data.length)
        return null;
      const i = {
        event: this.event,
        data: this.data.join(`
`),
        raw: this.chunks
      };
      return this.event = null, this.data = [], this.chunks = [], i;
    }
    if (this.chunks.push(e), e.startsWith(":"))
      return null;
    let [r, n, s] = vd(e, ":");
    return s.startsWith(" ") && (s = s.substring(1)), r === "event" ? this.event = s : r === "data" && this.data.push(s), null;
  }
}
function vd(t, e) {
  const r = t.indexOf(e);
  return r !== -1 ? [t.substring(0, r), e, t.substring(r + e.length)] : [t, "", ""];
}
const lf = (t) => t != null && typeof t == "object" && typeof t.url == "string" && typeof t.blob == "function", cf = (t) => t != null && typeof t == "object" && typeof t.name == "string" && typeof t.lastModified == "number" && Ti(t), Ti = (t) => t != null && typeof t == "object" && typeof t.size == "number" && typeof t.type == "string" && typeof t.text == "function" && typeof t.slice == "function" && typeof t.arrayBuffer == "function", bd = (t) => cf(t) || lf(t) || Ku(t);
async function uf(t, e, r) {
  var s;
  if (t = await t, cf(t))
    return t;
  if (lf(t)) {
    const i = await t.blob();
    e || (e = new URL(t.url).pathname.split(/[\\/]/).pop() ?? "unknown_file");
    const l = Ti(i) ? [await i.arrayBuffer()] : [i];
    return new Da(l, e, r);
  }
  const n = await Sd(t);
  if (e || (e = $d(t) ?? "unknown_file"), !(r != null && r.type)) {
    const i = (s = n[0]) == null ? void 0 : s.type;
    typeof i == "string" && (r = { ...r, type: i });
  }
  return new Da(n, e, r);
}
async function Sd(t) {
  var r;
  let e = [];
  if (typeof t == "string" || ArrayBuffer.isView(t) || // includes Uint8Array, Buffer, etc.
  t instanceof ArrayBuffer)
    e.push(t);
  else if (Ti(t))
    e.push(await t.arrayBuffer());
  else if (xd(t))
    for await (const n of t)
      e.push(n);
  else
    throw new Error(`Unexpected data type: ${typeof t}; constructor: ${(r = t == null ? void 0 : t.constructor) == null ? void 0 : r.name}; props: ${Ed(t)}`);
  return e;
}
function Ed(t) {
  return `[${Object.getOwnPropertyNames(t).map((r) => `"${r}"`).join(", ")}]`;
}
function $d(t) {
  var e;
  return na(t.name) || na(t.filename) || // For fs.ReadStream
  ((e = na(t.path)) == null ? void 0 : e.split(/[\\/]/).pop());
}
const na = (t) => {
  if (typeof t == "string")
    return t;
  if (typeof Buffer < "u" && t instanceof Buffer)
    return String(t);
}, xd = (t) => t != null && typeof t == "object" && typeof t[Symbol.asyncIterator] == "function", fl = (t) => t && typeof t == "object" && t.body && t[Symbol.toStringTag] === "MultipartBody", Yr = async (t) => {
  const e = await kd(t.body);
  return Zu(e, t);
}, kd = async (t) => {
  const e = new zu();
  return await Promise.all(Object.entries(t || {}).map(([r, n]) => qa(e, r, n))), e;
}, qa = async (t, e, r) => {
  if (r !== void 0) {
    if (r == null)
      throw new TypeError(`Received null for "${e}"; to pass null in FormData, you must use the string 'null'`);
    if (typeof r == "string" || typeof r == "number" || typeof r == "boolean")
      t.append(e, String(r));
    else if (bd(r)) {
      const n = await uf(r);
      t.append(e, n);
    } else if (Array.isArray(r))
      await Promise.all(r.map((n) => qa(t, e + "[]", n)));
    else if (typeof r == "object")
      await Promise.all(Object.entries(r).map(([n, s]) => qa(t, `${e}[${n}]`, s)));
    else
      throw new TypeError(`Invalid value given to form, expected a string, number, boolean, object, Array, File or Blob but got ${r} instead`);
  }
};
var Ad = function(t, e, r, n, s) {
  if (n === "m") throw new TypeError("Private method is not writable");
  if (n === "a" && !s) throw new TypeError("Private accessor was defined without a setter");
  if (typeof e == "function" ? t !== e || !s : !e.has(t)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return n === "a" ? s.call(t, r) : s ? s.value = r : e.set(t, r), r;
}, Pd = function(t, e, r, n) {
  if (r === "a" && !n) throw new TypeError("Private accessor was defined without a getter");
  if (typeof e == "function" ? t !== e || !n : !e.has(t)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return r === "m" ? n : r === "a" ? n.call(t) : n ? n.value : e.get(t);
}, ds;
Gu();
async function ff(t) {
  var l;
  const { response: e } = t;
  if (t.options.stream)
    return Rr("response", e.status, e.url, e.headers, e.body), t.options.__streamClass ? t.options.__streamClass.fromSSEResponse(e, t.controller) : cr.fromSSEResponse(e, t.controller);
  if (e.status === 204)
    return null;
  if (t.options.__binaryResponse)
    return e;
  const r = e.headers.get("content-type"), n = (l = r == null ? void 0 : r.split(";")[0]) == null ? void 0 : l.trim();
  if ((n == null ? void 0 : n.includes("application/json")) || (n == null ? void 0 : n.endsWith("+json"))) {
    const f = await e.json();
    return Rr("response", e.status, e.url, e.headers, f), hf(f, e);
  }
  const i = await e.text();
  return Rr("response", e.status, e.url, e.headers, i), i;
}
function hf(t, e) {
  return !t || typeof t != "object" || Array.isArray(t) ? t : Object.defineProperty(t, "_request_id", {
    value: e.headers.get("x-request-id"),
    enumerable: !1
  });
}
class Oi extends Promise {
  constructor(e, r = ff) {
    super((n) => {
      n(null);
    }), this.responsePromise = e, this.parseResponse = r;
  }
  _thenUnwrap(e) {
    return new Oi(this.responsePromise, async (r) => hf(e(await this.parseResponse(r), r), r.response));
  }
  /**
   * Gets the raw `Response` instance instead of parsing the response
   * data.
   *
   * If you want to parse the response body but still get the `Response`
   * instance, you can use {@link withResponse()}.
   *
   * 👋 Getting the wrong TypeScript type for `Response`?
   * Try setting `"moduleResolution": "NodeNext"` if you can,
   * or add one of these imports before your first `import … from 'openai'`:
   * - `import 'openai/shims/node'` (if you're running on Node)
   * - `import 'openai/shims/web'` (otherwise)
   */
  asResponse() {
    return this.responsePromise.then((e) => e.response);
  }
  /**
   * Gets the parsed response data, the raw `Response` instance and the ID of the request,
   * returned via the X-Request-ID header which is useful for debugging requests and reporting
   * issues to OpenAI.
   *
   * If you just want to get the raw `Response` instance without parsing it,
   * you can use {@link asResponse()}.
   *
   *
   * 👋 Getting the wrong TypeScript type for `Response`?
   * Try setting `"moduleResolution": "NodeNext"` if you can,
   * or add one of these imports before your first `import … from 'openai'`:
   * - `import 'openai/shims/node'` (if you're running on Node)
   * - `import 'openai/shims/web'` (otherwise)
   */
  async withResponse() {
    const [e, r] = await Promise.all([this.parse(), this.asResponse()]);
    return { data: e, response: r, request_id: r.headers.get("x-request-id") };
  }
  parse() {
    return this.parsedPromise || (this.parsedPromise = this.responsePromise.then(this.parseResponse)), this.parsedPromise;
  }
  then(e, r) {
    return this.parse().then(e, r);
  }
  catch(e) {
    return this.parse().catch(e);
  }
  finally(e) {
    return this.parse().finally(e);
  }
}
class Cd {
  constructor({
    baseURL: e,
    maxRetries: r = 2,
    timeout: n = 6e5,
    // 10 minutes
    httpAgent: s,
    fetch: i
  }) {
    this.baseURL = e, this.maxRetries = sa("maxRetries", r), this.timeout = sa("timeout", n), this.httpAgent = s, this.fetch = i ?? Uu;
  }
  authHeaders(e) {
    return {};
  }
  /**
   * Override this to add your own default headers, for example:
   *
   *  {
   *    ...super.defaultHeaders(),
   *    Authorization: 'Bearer 123',
   *  }
   */
  defaultHeaders(e) {
    return {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": this.getUserAgent(),
      ...Id(),
      ...this.authHeaders(e)
    };
  }
  /**
   * Override this to add your own headers validation:
   */
  validateHeaders(e, r) {
  }
  defaultIdempotencyKey() {
    return `stainless-node-retry-${Dd()}`;
  }
  get(e, r) {
    return this.methodRequest("get", e, r);
  }
  post(e, r) {
    return this.methodRequest("post", e, r);
  }
  patch(e, r) {
    return this.methodRequest("patch", e, r);
  }
  put(e, r) {
    return this.methodRequest("put", e, r);
  }
  delete(e, r) {
    return this.methodRequest("delete", e, r);
  }
  methodRequest(e, r, n) {
    return this.request(Promise.resolve(n).then(async (s) => {
      const i = s && Ti(s == null ? void 0 : s.body) ? new DataView(await s.body.arrayBuffer()) : (s == null ? void 0 : s.body) instanceof DataView ? s.body : (s == null ? void 0 : s.body) instanceof ArrayBuffer ? new DataView(s.body) : s && ArrayBuffer.isView(s == null ? void 0 : s.body) ? new DataView(s.body.buffer) : s == null ? void 0 : s.body;
      return { method: e, path: r, ...s, body: i };
    }));
  }
  getAPIList(e, r, n) {
    return this.requestAPIList(r, { method: "get", path: e, ...n });
  }
  calculateContentLength(e) {
    if (typeof e == "string") {
      if (typeof Buffer < "u")
        return Buffer.byteLength(e, "utf8").toString();
      if (typeof TextEncoder < "u")
        return new TextEncoder().encode(e).length.toString();
    } else if (ArrayBuffer.isView(e))
      return e.byteLength.toString();
    return null;
  }
  buildRequest(e, { retryCount: r = 0 } = {}) {
    var S;
    const n = { ...e }, { method: s, path: i, query: l, headers: f = {} } = n, d = ArrayBuffer.isView(n.body) || n.__binaryRequest && typeof n.body == "string" ? n.body : fl(n.body) ? n.body.body : n.body ? JSON.stringify(n.body, null, 2) : null, p = this.calculateContentLength(d), g = this.buildURL(i, l);
    "timeout" in n && sa("timeout", n.timeout), n.timeout = n.timeout ?? this.timeout;
    const w = n.httpAgent ?? this.httpAgent ?? Ju(g), P = n.timeout + 1e3;
    typeof ((S = w == null ? void 0 : w.options) == null ? void 0 : S.timeout) == "number" && P > (w.options.timeout ?? 0) && (w.options.timeout = P), this.idempotencyHeader && s !== "get" && (e.idempotencyKey || (e.idempotencyKey = this.defaultIdempotencyKey()), f[this.idempotencyHeader] = e.idempotencyKey);
    const x = this.buildHeaders({ options: n, headers: f, contentLength: p, retryCount: r });
    return { req: {
      method: s,
      ...d && { body: d },
      headers: x,
      ...w && { agent: w },
      // @ts-ignore node-fetch uses a custom AbortSignal type that is
      // not compatible with standard web types
      signal: n.signal ?? null
    }, url: g, timeout: n.timeout };
  }
  buildHeaders({ options: e, headers: r, contentLength: n, retryCount: s }) {
    const i = {};
    n && (i["content-length"] = n);
    const l = this.defaultHeaders(e);
    return pl(i, l), pl(i, r), fl(e.body) && Bn !== "node" && delete i["content-type"], ms(l, "x-stainless-retry-count") === void 0 && ms(r, "x-stainless-retry-count") === void 0 && (i["x-stainless-retry-count"] = String(s)), ms(l, "x-stainless-timeout") === void 0 && ms(r, "x-stainless-timeout") === void 0 && e.timeout && (i["x-stainless-timeout"] = String(Math.trunc(e.timeout / 1e3))), this.validateHeaders(i, r), i;
  }
  /**
   * Used as a callback for mutating the given `FinalRequestOptions` object.
   */
  async prepareOptions(e) {
  }
  /**
   * Used as a callback for mutating the given `RequestInit` object.
   *
   * This is useful for cases where you want to add certain headers based off of
   * the request properties, e.g. `method` or `url`.
   */
  async prepareRequest(e, { url: r, options: n }) {
  }
  parseHeaders(e) {
    return e ? Symbol.iterator in e ? Object.fromEntries(Array.from(e).map((r) => [...r])) : { ...e } : {};
  }
  makeStatusError(e, r, n, s) {
    return Et.generate(e, r, n, s);
  }
  request(e, r = null) {
    return new Oi(this.makeRequest(e, r));
  }
  async makeRequest(e, r) {
    var w, P;
    const n = await e, s = n.maxRetries ?? this.maxRetries;
    r == null && (r = s), await this.prepareOptions(n);
    const { req: i, url: l, timeout: f } = this.buildRequest(n, { retryCount: s - r });
    if (await this.prepareRequest(i, { url: l, options: n }), Rr("request", l, n, i.headers), (w = n.signal) != null && w.aborted)
      throw new Bt();
    const d = new AbortController(), p = await this.fetchWithTimeout(l, i, f, d).catch(La);
    if (p instanceof Error) {
      if ((P = n.signal) != null && P.aborted)
        throw new Bt();
      if (r)
        return this.retryRequest(n, r);
      throw p.name === "AbortError" ? new lo() : new Ci({ cause: p });
    }
    const g = mf(p.headers);
    if (!p.ok) {
      if (r && this.shouldRetry(p)) {
        const m = `retrying, ${r} attempts remaining`;
        return Rr(`response (error; ${m})`, p.status, l, g), this.retryRequest(n, r, g);
      }
      const x = await p.text().catch((m) => La(m).message), T = jd(x), S = T ? void 0 : x;
      throw Rr(`response (error; ${r ? "(error; no more retries left)" : "(error; not retryable)"})`, p.status, l, g, S), this.makeStatusError(p.status, T, S, g);
    }
    return { response: p, options: n, controller: d };
  }
  requestAPIList(e, r) {
    const n = this.makeRequest(r, null);
    return new Rd(this, n, e);
  }
  buildURL(e, r) {
    const n = Fd(e) ? new URL(e) : new URL(this.baseURL + (this.baseURL.endsWith("/") && e.startsWith("/") ? e.slice(1) : e)), s = this.defaultQuery();
    return pf(s) || (r = { ...s, ...r }), typeof r == "object" && r && !Array.isArray(r) && (n.search = this.stringifyQuery(r)), n.toString();
  }
  stringifyQuery(e) {
    return Object.entries(e).filter(([r, n]) => typeof n < "u").map(([r, n]) => {
      if (typeof n == "string" || typeof n == "number" || typeof n == "boolean")
        return `${encodeURIComponent(r)}=${encodeURIComponent(n)}`;
      if (n === null)
        return `${encodeURIComponent(r)}=`;
      throw new be(`Cannot stringify type ${typeof n}; Expected string, number, boolean, or null. If you need to pass nested query parameters, you can manually encode them, e.g. { query: { 'foo[key1]': value1, 'foo[key2]': value2 } }, and please open a GitHub issue requesting better support for your use case.`);
    }).join("&");
  }
  async fetchWithTimeout(e, r, n, s) {
    const { signal: i, ...l } = r || {};
    i && i.addEventListener("abort", () => s.abort());
    const f = setTimeout(() => s.abort(), n), d = {
      signal: s.signal,
      ...l
    };
    return d.method && (d.method = d.method.toUpperCase()), // use undefined this binding; fetch errors if bound to something else in browser/cloudflare
    this.fetch.call(void 0, e, d).finally(() => {
      clearTimeout(f);
    });
  }
  shouldRetry(e) {
    const r = e.headers.get("x-should-retry");
    return r === "true" ? !0 : r === "false" ? !1 : e.status === 408 || e.status === 409 || e.status === 429 || e.status >= 500;
  }
  async retryRequest(e, r, n) {
    let s;
    const i = n == null ? void 0 : n["retry-after-ms"];
    if (i) {
      const f = parseFloat(i);
      Number.isNaN(f) || (s = f);
    }
    const l = n == null ? void 0 : n["retry-after"];
    if (l && !s) {
      const f = parseFloat(l);
      Number.isNaN(f) ? s = Date.parse(l) - Date.now() : s = f * 1e3;
    }
    if (!(s && 0 <= s && s < 60 * 1e3)) {
      const f = e.maxRetries ?? this.maxRetries;
      s = this.calculateDefaultRetryTimeoutMillis(r, f);
    }
    return await Hn(s), this.makeRequest(e, r - 1);
  }
  calculateDefaultRetryTimeoutMillis(e, r) {
    const i = r - e, l = Math.min(0.5 * Math.pow(2, i), 8), f = 1 - Math.random() * 0.25;
    return l * f * 1e3;
  }
  getUserAgent() {
    return `${this.constructor.name}/JS ${ln}`;
  }
}
class df {
  constructor(e, r, n, s) {
    ds.set(this, void 0), Ad(this, ds, e, "f"), this.options = s, this.response = r, this.body = n;
  }
  hasNextPage() {
    return this.getPaginatedItems().length ? this.nextPageInfo() != null : !1;
  }
  async getNextPage() {
    const e = this.nextPageInfo();
    if (!e)
      throw new be("No next page expected; please check `.hasNextPage()` before calling `.getNextPage()`.");
    const r = { ...this.options };
    if ("params" in e && typeof r.query == "object")
      r.query = { ...r.query, ...e.params };
    else if ("url" in e) {
      const n = [...Object.entries(r.query || {}), ...e.url.searchParams.entries()];
      for (const [s, i] of n)
        e.url.searchParams.set(s, i);
      r.query = void 0, r.path = e.url.toString();
    }
    return await Pd(this, ds, "f").requestAPIList(this.constructor, r);
  }
  async *iterPages() {
    let e = this;
    for (yield e; e.hasNextPage(); )
      e = await e.getNextPage(), yield e;
  }
  async *[(ds = /* @__PURE__ */ new WeakMap(), Symbol.asyncIterator)]() {
    for await (const e of this.iterPages())
      for (const r of e.getPaginatedItems())
        yield r;
  }
}
class Rd extends Oi {
  constructor(e, r, n) {
    super(r, async (s) => new n(e, s.response, await ff(s), s.options));
  }
  /**
   * Allow auto-paginating iteration on an unawaited list call, eg:
   *
   *    for await (const item of client.items.list()) {
   *      console.log(item)
   *    }
   */
  async *[Symbol.asyncIterator]() {
    const e = await this;
    for await (const r of e)
      yield r;
  }
}
const mf = (t) => new Proxy(Object.fromEntries(
  // @ts-ignore
  t.entries()
), {
  get(e, r) {
    const n = r.toString();
    return e[n.toLowerCase()] || e[n];
  }
}), Td = {
  method: !0,
  path: !0,
  query: !0,
  body: !0,
  headers: !0,
  maxRetries: !0,
  stream: !0,
  timeout: !0,
  httpAgent: !0,
  signal: !0,
  idempotencyKey: !0,
  __metadata: !0,
  __binaryRequest: !0,
  __binaryResponse: !0,
  __streamClass: !0
}, tt = (t) => typeof t == "object" && t !== null && !pf(t) && Object.keys(t).every((e) => gf(Td, e)), Od = () => {
  var e;
  if (typeof Deno < "u" && Deno.build != null)
    return {
      "X-Stainless-Lang": "js",
      "X-Stainless-Package-Version": ln,
      "X-Stainless-OS": dl(Deno.build.os),
      "X-Stainless-Arch": hl(Deno.build.arch),
      "X-Stainless-Runtime": "deno",
      "X-Stainless-Runtime-Version": typeof Deno.version == "string" ? Deno.version : ((e = Deno.version) == null ? void 0 : e.deno) ?? "unknown"
    };
  if (typeof EdgeRuntime < "u")
    return {
      "X-Stainless-Lang": "js",
      "X-Stainless-Package-Version": ln,
      "X-Stainless-OS": "Unknown",
      "X-Stainless-Arch": `other:${EdgeRuntime}`,
      "X-Stainless-Runtime": "edge",
      "X-Stainless-Runtime-Version": process.version
    };
  if (Object.prototype.toString.call(typeof process < "u" ? process : 0) === "[object process]")
    return {
      "X-Stainless-Lang": "js",
      "X-Stainless-Package-Version": ln,
      "X-Stainless-OS": dl(process.platform),
      "X-Stainless-Arch": hl(process.arch),
      "X-Stainless-Runtime": "node",
      "X-Stainless-Runtime-Version": process.version
    };
  const t = Nd();
  return t ? {
    "X-Stainless-Lang": "js",
    "X-Stainless-Package-Version": ln,
    "X-Stainless-OS": "Unknown",
    "X-Stainless-Arch": "unknown",
    "X-Stainless-Runtime": `browser:${t.browser}`,
    "X-Stainless-Runtime-Version": t.version
  } : {
    "X-Stainless-Lang": "js",
    "X-Stainless-Package-Version": ln,
    "X-Stainless-OS": "Unknown",
    "X-Stainless-Arch": "unknown",
    "X-Stainless-Runtime": "unknown",
    "X-Stainless-Runtime-Version": "unknown"
  };
};
function Nd() {
  if (typeof navigator > "u" || !navigator)
    return null;
  const t = [
    { key: "edge", pattern: /Edge(?:\W+(\d+)\.(\d+)(?:\.(\d+))?)?/ },
    { key: "ie", pattern: /MSIE(?:\W+(\d+)\.(\d+)(?:\.(\d+))?)?/ },
    { key: "ie", pattern: /Trident(?:.*rv\:(\d+)\.(\d+)(?:\.(\d+))?)?/ },
    { key: "chrome", pattern: /Chrome(?:\W+(\d+)\.(\d+)(?:\.(\d+))?)?/ },
    { key: "firefox", pattern: /Firefox(?:\W+(\d+)\.(\d+)(?:\.(\d+))?)?/ },
    { key: "safari", pattern: /(?:Version\W+(\d+)\.(\d+)(?:\.(\d+))?)?(?:\W+Mobile\S*)?\W+Safari/ }
  ];
  for (const { key: e, pattern: r } of t) {
    const n = r.exec(navigator.userAgent);
    if (n) {
      const s = n[1] || 0, i = n[2] || 0, l = n[3] || 0;
      return { browser: e, version: `${s}.${i}.${l}` };
    }
  }
  return null;
}
const hl = (t) => t === "x32" ? "x32" : t === "x86_64" || t === "x64" ? "x64" : t === "arm" ? "arm" : t === "aarch64" || t === "arm64" ? "arm64" : t ? `other:${t}` : "unknown", dl = (t) => (t = t.toLowerCase(), t.includes("ios") ? "iOS" : t === "android" ? "Android" : t === "darwin" ? "MacOS" : t === "win32" ? "Windows" : t === "freebsd" ? "FreeBSD" : t === "openbsd" ? "OpenBSD" : t === "linux" ? "Linux" : t ? `Other:${t}` : "Unknown");
let ml;
const Id = () => ml ?? (ml = Od()), jd = (t) => {
  try {
    return JSON.parse(t);
  } catch {
    return;
  }
}, Md = /^[a-z][a-z0-9+.-]*:/i, Fd = (t) => Md.test(t), Hn = (t) => new Promise((e) => setTimeout(e, t)), sa = (t, e) => {
  if (typeof e != "number" || !Number.isInteger(e))
    throw new be(`${t} must be an integer`);
  if (e < 0)
    throw new be(`${t} must be a positive integer`);
  return e;
}, La = (t) => {
  if (t instanceof Error)
    return t;
  if (typeof t == "object" && t !== null)
    try {
      return new Error(JSON.stringify(t));
    } catch {
    }
  return new Error(t);
}, Wr = (t) => {
  var e, r, n, s, i;
  if (typeof process < "u")
    return ((r = (e = process.env) == null ? void 0 : e[t]) == null ? void 0 : r.trim()) ?? void 0;
  if (typeof Deno < "u")
    return (i = (s = (n = Deno.env) == null ? void 0 : n.get) == null ? void 0 : s.call(n, t)) == null ? void 0 : i.trim();
};
function pf(t) {
  if (!t)
    return !0;
  for (const e in t)
    return !1;
  return !0;
}
function gf(t, e) {
  return Object.prototype.hasOwnProperty.call(t, e);
}
function pl(t, e) {
  for (const r in e) {
    if (!gf(e, r))
      continue;
    const n = r.toLowerCase();
    if (!n)
      continue;
    const s = e[r];
    s === null ? delete t[n] : s !== void 0 && (t[n] = s);
  }
}
const gl = /* @__PURE__ */ new Set(["authorization", "api-key"]);
function Rr(t, ...e) {
  var r;
  if (typeof process < "u" && ((r = process == null ? void 0 : process.env) == null ? void 0 : r.DEBUG) === "true") {
    const n = e.map((s) => {
      if (!s)
        return s;
      if (s.headers) {
        const l = { ...s, headers: { ...s.headers } };
        for (const f in s.headers)
          gl.has(f.toLowerCase()) && (l.headers[f] = "REDACTED");
        return l;
      }
      let i = null;
      for (const l in s)
        gl.has(l.toLowerCase()) && (i ?? (i = { ...s }), i[l] = "REDACTED");
      return i ?? s;
    });
    console.log(`OpenAI:DEBUG:${t}`, ...n);
  }
}
const Dd = () => "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (t) => {
  const e = Math.random() * 16 | 0;
  return (t === "x" ? e : e & 3 | 8).toString(16);
}), qd = () => (
  // @ts-ignore
  typeof window < "u" && // @ts-ignore
  typeof window.document < "u" && // @ts-ignore
  typeof navigator < "u"
), Ld = (t) => typeof (t == null ? void 0 : t.get) == "function", ms = (t, e) => {
  var n;
  const r = e.toLowerCase();
  if (Ld(t)) {
    const s = ((n = e[0]) == null ? void 0 : n.toUpperCase()) + e.substring(1).replace(/([^\w])(\w)/g, (i, l, f) => l + f.toUpperCase());
    for (const i of [e, r, e.toUpperCase(), s]) {
      const l = t.get(i);
      if (l)
        return l;
    }
  }
  for (const [s, i] of Object.entries(t))
    if (s.toLowerCase() === r)
      return Array.isArray(i) ? (i.length <= 1 || console.warn(`Received ${i.length} entries for the ${e} header, using the first entry.`), i[0]) : i;
}, Vd = (t) => {
  if (typeof Buffer < "u") {
    const e = Buffer.from(t, "base64");
    return Array.from(new Float32Array(e.buffer, e.byteOffset, e.length / Float32Array.BYTES_PER_ELEMENT));
  } else {
    const e = atob(t), r = e.length, n = new Uint8Array(r);
    for (let s = 0; s < r; s++)
      n[s] = e.charCodeAt(s);
    return Array.from(new Float32Array(n.buffer));
  }
};
function si(t) {
  return t != null && typeof t == "object" && !Array.isArray(t);
}
class Ni extends df {
  constructor(e, r, n, s) {
    super(e, r, n, s), this.data = n.data || [], this.object = n.object;
  }
  getPaginatedItems() {
    return this.data ?? [];
  }
  // @deprecated Please use `nextPageInfo()` instead
  /**
   * This page represents a response that isn't actually paginated at the API level
   * so there will never be any next page params.
   */
  nextPageParams() {
    return null;
  }
  nextPageInfo() {
    return null;
  }
}
class mt extends df {
  constructor(e, r, n, s) {
    super(e, r, n, s), this.data = n.data || [], this.has_more = n.has_more || !1;
  }
  getPaginatedItems() {
    return this.data ?? [];
  }
  hasNextPage() {
    return this.has_more === !1 ? !1 : super.hasNextPage();
  }
  // @deprecated Please use `nextPageInfo()` instead
  nextPageParams() {
    const e = this.nextPageInfo();
    if (!e)
      return null;
    if ("params" in e)
      return e.params;
    const r = Object.fromEntries(e.url.searchParams);
    return Object.keys(r).length ? r : null;
  }
  nextPageInfo() {
    var n;
    const e = this.getPaginatedItems();
    if (!e.length)
      return null;
    const r = (n = e[e.length - 1]) == null ? void 0 : n.id;
    return r ? { params: { after: r } } : null;
  }
}
class $e {
  constructor(e) {
    this._client = e;
  }
}
let yf = class extends $e {
  list(e, r = {}, n) {
    return tt(r) ? this.list(e, {}, r) : this._client.getAPIList(`/chat/completions/${e}/messages`, Ud, { query: r, ...n });
  }
}, Ii = class extends $e {
  constructor() {
    super(...arguments), this.messages = new yf(this._client);
  }
  create(e, r) {
    return this._client.post("/chat/completions", { body: e, ...r, stream: e.stream ?? !1 });
  }
  /**
   * Get a stored chat completion. Only Chat Completions that have been created with
   * the `store` parameter set to `true` will be returned.
   *
   * @example
   * ```ts
   * const chatCompletion =
   *   await client.chat.completions.retrieve('completion_id');
   * ```
   */
  retrieve(e, r) {
    return this._client.get(`/chat/completions/${e}`, r);
  }
  /**
   * Modify a stored chat completion. Only Chat Completions that have been created
   * with the `store` parameter set to `true` can be modified. Currently, the only
   * supported modification is to update the `metadata` field.
   *
   * @example
   * ```ts
   * const chatCompletion = await client.chat.completions.update(
   *   'completion_id',
   *   { metadata: { foo: 'string' } },
   * );
   * ```
   */
  update(e, r, n) {
    return this._client.post(`/chat/completions/${e}`, { body: r, ...n });
  }
  list(e = {}, r) {
    return tt(e) ? this.list({}, e) : this._client.getAPIList("/chat/completions", ji, { query: e, ...r });
  }
  /**
   * Delete a stored chat completion. Only Chat Completions that have been created
   * with the `store` parameter set to `true` can be deleted.
   *
   * @example
   * ```ts
   * const chatCompletionDeleted =
   *   await client.chat.completions.del('completion_id');
   * ```
   */
  del(e, r) {
    return this._client.delete(`/chat/completions/${e}`, r);
  }
};
class ji extends mt {
}
class Ud extends mt {
}
Ii.ChatCompletionsPage = ji;
Ii.Messages = yf;
let Mi = class extends $e {
  constructor() {
    super(...arguments), this.completions = new Ii(this._client);
  }
};
Mi.Completions = Ii;
Mi.ChatCompletionsPage = ji;
class wf extends $e {
  /**
   * Generates audio from the input text.
   *
   * @example
   * ```ts
   * const speech = await client.audio.speech.create({
   *   input: 'input',
   *   model: 'string',
   *   voice: 'ash',
   * });
   *
   * const content = await speech.blob();
   * console.log(content);
   * ```
   */
  create(e, r) {
    return this._client.post("/audio/speech", {
      body: e,
      ...r,
      headers: { Accept: "application/octet-stream", ...r == null ? void 0 : r.headers },
      __binaryResponse: !0
    });
  }
}
class _f extends $e {
  create(e, r) {
    return this._client.post("/audio/transcriptions", Yr({
      body: e,
      ...r,
      stream: e.stream ?? !1,
      __metadata: { model: e.model }
    }));
  }
}
class vf extends $e {
  create(e, r) {
    return this._client.post("/audio/translations", Yr({ body: e, ...r, __metadata: { model: e.model } }));
  }
}
class es extends $e {
  constructor() {
    super(...arguments), this.transcriptions = new _f(this._client), this.translations = new vf(this._client), this.speech = new wf(this._client);
  }
}
es.Transcriptions = _f;
es.Translations = vf;
es.Speech = wf;
class co extends $e {
  /**
   * Creates and executes a batch from an uploaded file of requests
   */
  create(e, r) {
    return this._client.post("/batches", { body: e, ...r });
  }
  /**
   * Retrieves a batch.
   */
  retrieve(e, r) {
    return this._client.get(`/batches/${e}`, r);
  }
  list(e = {}, r) {
    return tt(e) ? this.list({}, e) : this._client.getAPIList("/batches", uo, { query: e, ...r });
  }
  /**
   * Cancels an in-progress batch. The batch will be in status `cancelling` for up to
   * 10 minutes, before changing to `cancelled`, where it will have partial results
   * (if any) available in the output file.
   */
  cancel(e, r) {
    return this._client.post(`/batches/${e}/cancel`, r);
  }
}
class uo extends mt {
}
co.BatchesPage = uo;
var Qt = function(t, e, r, n, s) {
  if (n === "m") throw new TypeError("Private method is not writable");
  if (n === "a" && !s) throw new TypeError("Private accessor was defined without a setter");
  if (typeof e == "function" ? t !== e || !s : !e.has(t)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return n === "a" ? s.call(t, r) : s ? s.value = r : e.set(t, r), r;
}, nt = function(t, e, r, n) {
  if (r === "a" && !n) throw new TypeError("Private accessor was defined without a getter");
  if (typeof e == "function" ? t !== e || !n : !e.has(t)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return r === "m" ? n : r === "a" ? n.call(t) : n ? n.value : e.get(t);
}, Va, ii, ai, jn, Mn, oi, Fn, wr, Dn, fi, hi, cn, bf;
class fo {
  constructor() {
    Va.add(this), this.controller = new AbortController(), ii.set(this, void 0), ai.set(this, () => {
    }), jn.set(this, () => {
    }), Mn.set(this, void 0), oi.set(this, () => {
    }), Fn.set(this, () => {
    }), wr.set(this, {}), Dn.set(this, !1), fi.set(this, !1), hi.set(this, !1), cn.set(this, !1), Qt(this, ii, new Promise((e, r) => {
      Qt(this, ai, e, "f"), Qt(this, jn, r, "f");
    }), "f"), Qt(this, Mn, new Promise((e, r) => {
      Qt(this, oi, e, "f"), Qt(this, Fn, r, "f");
    }), "f"), nt(this, ii, "f").catch(() => {
    }), nt(this, Mn, "f").catch(() => {
    });
  }
  _run(e) {
    setTimeout(() => {
      e().then(() => {
        this._emitFinal(), this._emit("end");
      }, nt(this, Va, "m", bf).bind(this));
    }, 0);
  }
  _connected() {
    this.ended || (nt(this, ai, "f").call(this), this._emit("connect"));
  }
  get ended() {
    return nt(this, Dn, "f");
  }
  get errored() {
    return nt(this, fi, "f");
  }
  get aborted() {
    return nt(this, hi, "f");
  }
  abort() {
    this.controller.abort();
  }
  /**
   * Adds the listener function to the end of the listeners array for the event.
   * No checks are made to see if the listener has already been added. Multiple calls passing
   * the same combination of event and listener will result in the listener being added, and
   * called, multiple times.
   * @returns this ChatCompletionStream, so that calls can be chained
   */
  on(e, r) {
    return (nt(this, wr, "f")[e] || (nt(this, wr, "f")[e] = [])).push({ listener: r }), this;
  }
  /**
   * Removes the specified listener from the listener array for the event.
   * off() will remove, at most, one instance of a listener from the listener array. If any single
   * listener has been added multiple times to the listener array for the specified event, then
   * off() must be called multiple times to remove each instance.
   * @returns this ChatCompletionStream, so that calls can be chained
   */
  off(e, r) {
    const n = nt(this, wr, "f")[e];
    if (!n)
      return this;
    const s = n.findIndex((i) => i.listener === r);
    return s >= 0 && n.splice(s, 1), this;
  }
  /**
   * Adds a one-time listener function for the event. The next time the event is triggered,
   * this listener is removed and then invoked.
   * @returns this ChatCompletionStream, so that calls can be chained
   */
  once(e, r) {
    return (nt(this, wr, "f")[e] || (nt(this, wr, "f")[e] = [])).push({ listener: r, once: !0 }), this;
  }
  /**
   * This is similar to `.once()`, but returns a Promise that resolves the next time
   * the event is triggered, instead of calling a listener callback.
   * @returns a Promise that resolves the next time given event is triggered,
   * or rejects if an error is emitted.  (If you request the 'error' event,
   * returns a promise that resolves with the error).
   *
   * Example:
   *
   *   const message = await stream.emitted('message') // rejects if the stream errors
   */
  emitted(e) {
    return new Promise((r, n) => {
      Qt(this, cn, !0, "f"), e !== "error" && this.once("error", n), this.once(e, r);
    });
  }
  async done() {
    Qt(this, cn, !0, "f"), await nt(this, Mn, "f");
  }
  _emit(e, ...r) {
    if (nt(this, Dn, "f"))
      return;
    e === "end" && (Qt(this, Dn, !0, "f"), nt(this, oi, "f").call(this));
    const n = nt(this, wr, "f")[e];
    if (n && (nt(this, wr, "f")[e] = n.filter((s) => !s.once), n.forEach(({ listener: s }) => s(...r))), e === "abort") {
      const s = r[0];
      !nt(this, cn, "f") && !(n != null && n.length) && Promise.reject(s), nt(this, jn, "f").call(this, s), nt(this, Fn, "f").call(this, s), this._emit("end");
      return;
    }
    if (e === "error") {
      const s = r[0];
      !nt(this, cn, "f") && !(n != null && n.length) && Promise.reject(s), nt(this, jn, "f").call(this, s), nt(this, Fn, "f").call(this, s), this._emit("end");
    }
  }
  _emitFinal() {
  }
}
ii = /* @__PURE__ */ new WeakMap(), ai = /* @__PURE__ */ new WeakMap(), jn = /* @__PURE__ */ new WeakMap(), Mn = /* @__PURE__ */ new WeakMap(), oi = /* @__PURE__ */ new WeakMap(), Fn = /* @__PURE__ */ new WeakMap(), wr = /* @__PURE__ */ new WeakMap(), Dn = /* @__PURE__ */ new WeakMap(), fi = /* @__PURE__ */ new WeakMap(), hi = /* @__PURE__ */ new WeakMap(), cn = /* @__PURE__ */ new WeakMap(), Va = /* @__PURE__ */ new WeakSet(), bf = function(e) {
  if (Qt(this, fi, !0, "f"), e instanceof Error && e.name === "AbortError" && (e = new Bt()), e instanceof Bt)
    return Qt(this, hi, !0, "f"), this._emit("abort", e);
  if (e instanceof be)
    return this._emit("error", e);
  if (e instanceof Error) {
    const r = new be(e.message);
    return r.cause = e, this._emit("error", r);
  }
  return this._emit("error", new be(String(e)));
};
var ve = function(t, e, r, n) {
  if (r === "a" && !n) throw new TypeError("Private accessor was defined without a getter");
  if (typeof e == "function" ? t !== e || !n : !e.has(t)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return r === "m" ? n : r === "a" ? n.call(t) : n ? n.value : e.get(t);
}, qt = function(t, e, r, n, s) {
  if (n === "m") throw new TypeError("Private method is not writable");
  if (n === "a" && !s) throw new TypeError("Private accessor was defined without a setter");
  if (typeof e == "function" ? t !== e || !s : !e.has(t)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return n === "a" ? s.call(t, r) : s ? s.value = r : e.set(t, r), r;
}, St, Ua, lr, li, er, Kr, fn, Jr, di, Ut, ci, ui, Zn, qn, Ln, yl, wl, _l, vl, bl, Sl, El;
class tr extends fo {
  constructor() {
    super(...arguments), St.add(this), Ua.set(this, []), lr.set(this, {}), li.set(this, {}), er.set(this, void 0), Kr.set(this, void 0), fn.set(this, void 0), Jr.set(this, void 0), di.set(this, void 0), Ut.set(this, void 0), ci.set(this, void 0), ui.set(this, void 0), Zn.set(this, void 0);
  }
  [(Ua = /* @__PURE__ */ new WeakMap(), lr = /* @__PURE__ */ new WeakMap(), li = /* @__PURE__ */ new WeakMap(), er = /* @__PURE__ */ new WeakMap(), Kr = /* @__PURE__ */ new WeakMap(), fn = /* @__PURE__ */ new WeakMap(), Jr = /* @__PURE__ */ new WeakMap(), di = /* @__PURE__ */ new WeakMap(), Ut = /* @__PURE__ */ new WeakMap(), ci = /* @__PURE__ */ new WeakMap(), ui = /* @__PURE__ */ new WeakMap(), Zn = /* @__PURE__ */ new WeakMap(), St = /* @__PURE__ */ new WeakSet(), Symbol.asyncIterator)]() {
    const e = [], r = [];
    let n = !1;
    return this.on("event", (s) => {
      const i = r.shift();
      i ? i.resolve(s) : e.push(s);
    }), this.on("end", () => {
      n = !0;
      for (const s of r)
        s.resolve(void 0);
      r.length = 0;
    }), this.on("abort", (s) => {
      n = !0;
      for (const i of r)
        i.reject(s);
      r.length = 0;
    }), this.on("error", (s) => {
      n = !0;
      for (const i of r)
        i.reject(s);
      r.length = 0;
    }), {
      next: async () => e.length ? { value: e.shift(), done: !1 } : n ? { value: void 0, done: !0 } : new Promise((i, l) => r.push({ resolve: i, reject: l })).then((i) => i ? { value: i, done: !1 } : { value: void 0, done: !0 }),
      return: async () => (this.abort(), { value: void 0, done: !0 })
    };
  }
  static fromReadableStream(e) {
    const r = new tr();
    return r._run(() => r._fromReadableStream(e)), r;
  }
  async _fromReadableStream(e, r) {
    var i;
    const n = r == null ? void 0 : r.signal;
    n && (n.aborted && this.controller.abort(), n.addEventListener("abort", () => this.controller.abort())), this._connected();
    const s = cr.fromReadableStream(e, this.controller);
    for await (const l of s)
      ve(this, St, "m", qn).call(this, l);
    if ((i = s.controller.signal) != null && i.aborted)
      throw new Bt();
    return this._addRun(ve(this, St, "m", Ln).call(this));
  }
  toReadableStream() {
    return new cr(this[Symbol.asyncIterator].bind(this), this.controller).toReadableStream();
  }
  static createToolAssistantStream(e, r, n, s, i) {
    const l = new tr();
    return l._run(() => l._runToolAssistantStream(e, r, n, s, {
      ...i,
      headers: { ...i == null ? void 0 : i.headers, "X-Stainless-Helper-Method": "stream" }
    })), l;
  }
  async _createToolAssistantStream(e, r, n, s, i) {
    var p;
    const l = i == null ? void 0 : i.signal;
    l && (l.aborted && this.controller.abort(), l.addEventListener("abort", () => this.controller.abort()));
    const f = { ...s, stream: !0 }, d = await e.submitToolOutputs(r, n, f, {
      ...i,
      signal: this.controller.signal
    });
    this._connected();
    for await (const g of d)
      ve(this, St, "m", qn).call(this, g);
    if ((p = d.controller.signal) != null && p.aborted)
      throw new Bt();
    return this._addRun(ve(this, St, "m", Ln).call(this));
  }
  static createThreadAssistantStream(e, r, n) {
    const s = new tr();
    return s._run(() => s._threadAssistantStream(e, r, {
      ...n,
      headers: { ...n == null ? void 0 : n.headers, "X-Stainless-Helper-Method": "stream" }
    })), s;
  }
  static createAssistantStream(e, r, n, s) {
    const i = new tr();
    return i._run(() => i._runAssistantStream(e, r, n, {
      ...s,
      headers: { ...s == null ? void 0 : s.headers, "X-Stainless-Helper-Method": "stream" }
    })), i;
  }
  currentEvent() {
    return ve(this, ci, "f");
  }
  currentRun() {
    return ve(this, ui, "f");
  }
  currentMessageSnapshot() {
    return ve(this, er, "f");
  }
  currentRunStepSnapshot() {
    return ve(this, Zn, "f");
  }
  async finalRunSteps() {
    return await this.done(), Object.values(ve(this, lr, "f"));
  }
  async finalMessages() {
    return await this.done(), Object.values(ve(this, li, "f"));
  }
  async finalRun() {
    if (await this.done(), !ve(this, Kr, "f"))
      throw Error("Final run was not received.");
    return ve(this, Kr, "f");
  }
  async _createThreadAssistantStream(e, r, n) {
    var f;
    const s = n == null ? void 0 : n.signal;
    s && (s.aborted && this.controller.abort(), s.addEventListener("abort", () => this.controller.abort()));
    const i = { ...r, stream: !0 }, l = await e.createAndRun(i, { ...n, signal: this.controller.signal });
    this._connected();
    for await (const d of l)
      ve(this, St, "m", qn).call(this, d);
    if ((f = l.controller.signal) != null && f.aborted)
      throw new Bt();
    return this._addRun(ve(this, St, "m", Ln).call(this));
  }
  async _createAssistantStream(e, r, n, s) {
    var d;
    const i = s == null ? void 0 : s.signal;
    i && (i.aborted && this.controller.abort(), i.addEventListener("abort", () => this.controller.abort()));
    const l = { ...n, stream: !0 }, f = await e.create(r, l, { ...s, signal: this.controller.signal });
    this._connected();
    for await (const p of f)
      ve(this, St, "m", qn).call(this, p);
    if ((d = f.controller.signal) != null && d.aborted)
      throw new Bt();
    return this._addRun(ve(this, St, "m", Ln).call(this));
  }
  static accumulateDelta(e, r) {
    for (const [n, s] of Object.entries(r)) {
      if (!e.hasOwnProperty(n)) {
        e[n] = s;
        continue;
      }
      let i = e[n];
      if (i == null) {
        e[n] = s;
        continue;
      }
      if (n === "index" || n === "type") {
        e[n] = s;
        continue;
      }
      if (typeof i == "string" && typeof s == "string")
        i += s;
      else if (typeof i == "number" && typeof s == "number")
        i += s;
      else if (si(i) && si(s))
        i = this.accumulateDelta(i, s);
      else if (Array.isArray(i) && Array.isArray(s)) {
        if (i.every((l) => typeof l == "string" || typeof l == "number")) {
          i.push(...s);
          continue;
        }
        for (const l of s) {
          if (!si(l))
            throw new Error(`Expected array delta entry to be an object but got: ${l}`);
          const f = l.index;
          if (f == null)
            throw console.error(l), new Error("Expected array delta entry to have an `index` property");
          if (typeof f != "number")
            throw new Error(`Expected array delta entry \`index\` property to be a number but got ${f}`);
          const d = i[f];
          d == null ? i.push(l) : i[f] = this.accumulateDelta(d, l);
        }
        continue;
      } else
        throw Error(`Unhandled record type: ${n}, deltaValue: ${s}, accValue: ${i}`);
      e[n] = i;
    }
    return e;
  }
  _addRun(e) {
    return e;
  }
  async _threadAssistantStream(e, r, n) {
    return await this._createThreadAssistantStream(r, e, n);
  }
  async _runAssistantStream(e, r, n, s) {
    return await this._createAssistantStream(r, e, n, s);
  }
  async _runToolAssistantStream(e, r, n, s, i) {
    return await this._createToolAssistantStream(n, e, r, s, i);
  }
}
qn = function(e) {
  if (!this.ended)
    switch (qt(this, ci, e, "f"), ve(this, St, "m", _l).call(this, e), e.event) {
      case "thread.created":
        break;
      case "thread.run.created":
      case "thread.run.queued":
      case "thread.run.in_progress":
      case "thread.run.requires_action":
      case "thread.run.completed":
      case "thread.run.incomplete":
      case "thread.run.failed":
      case "thread.run.cancelling":
      case "thread.run.cancelled":
      case "thread.run.expired":
        ve(this, St, "m", El).call(this, e);
        break;
      case "thread.run.step.created":
      case "thread.run.step.in_progress":
      case "thread.run.step.delta":
      case "thread.run.step.completed":
      case "thread.run.step.failed":
      case "thread.run.step.cancelled":
      case "thread.run.step.expired":
        ve(this, St, "m", wl).call(this, e);
        break;
      case "thread.message.created":
      case "thread.message.in_progress":
      case "thread.message.delta":
      case "thread.message.completed":
      case "thread.message.incomplete":
        ve(this, St, "m", yl).call(this, e);
        break;
      case "error":
        throw new Error("Encountered an error event in event processing - errors should be processed earlier");
    }
}, Ln = function() {
  if (this.ended)
    throw new be("stream has ended, this shouldn't happen");
  if (!ve(this, Kr, "f"))
    throw Error("Final run has not been received");
  return ve(this, Kr, "f");
}, yl = function(e) {
  const [r, n] = ve(this, St, "m", bl).call(this, e, ve(this, er, "f"));
  qt(this, er, r, "f"), ve(this, li, "f")[r.id] = r;
  for (const s of n) {
    const i = r.content[s.index];
    (i == null ? void 0 : i.type) == "text" && this._emit("textCreated", i.text);
  }
  switch (e.event) {
    case "thread.message.created":
      this._emit("messageCreated", e.data);
      break;
    case "thread.message.in_progress":
      break;
    case "thread.message.delta":
      if (this._emit("messageDelta", e.data.delta, r), e.data.delta.content)
        for (const s of e.data.delta.content) {
          if (s.type == "text" && s.text) {
            let i = s.text, l = r.content[s.index];
            if (l && l.type == "text")
              this._emit("textDelta", i, l.text);
            else
              throw Error("The snapshot associated with this text delta is not text or missing");
          }
          if (s.index != ve(this, fn, "f")) {
            if (ve(this, Jr, "f"))
              switch (ve(this, Jr, "f").type) {
                case "text":
                  this._emit("textDone", ve(this, Jr, "f").text, ve(this, er, "f"));
                  break;
                case "image_file":
                  this._emit("imageFileDone", ve(this, Jr, "f").image_file, ve(this, er, "f"));
                  break;
              }
            qt(this, fn, s.index, "f");
          }
          qt(this, Jr, r.content[s.index], "f");
        }
      break;
    case "thread.message.completed":
    case "thread.message.incomplete":
      if (ve(this, fn, "f") !== void 0) {
        const s = e.data.content[ve(this, fn, "f")];
        if (s)
          switch (s.type) {
            case "image_file":
              this._emit("imageFileDone", s.image_file, ve(this, er, "f"));
              break;
            case "text":
              this._emit("textDone", s.text, ve(this, er, "f"));
              break;
          }
      }
      ve(this, er, "f") && this._emit("messageDone", e.data), qt(this, er, void 0, "f");
  }
}, wl = function(e) {
  const r = ve(this, St, "m", vl).call(this, e);
  switch (qt(this, Zn, r, "f"), e.event) {
    case "thread.run.step.created":
      this._emit("runStepCreated", e.data);
      break;
    case "thread.run.step.delta":
      const n = e.data.delta;
      if (n.step_details && n.step_details.type == "tool_calls" && n.step_details.tool_calls && r.step_details.type == "tool_calls")
        for (const i of n.step_details.tool_calls)
          i.index == ve(this, di, "f") ? this._emit("toolCallDelta", i, r.step_details.tool_calls[i.index]) : (ve(this, Ut, "f") && this._emit("toolCallDone", ve(this, Ut, "f")), qt(this, di, i.index, "f"), qt(this, Ut, r.step_details.tool_calls[i.index], "f"), ve(this, Ut, "f") && this._emit("toolCallCreated", ve(this, Ut, "f")));
      this._emit("runStepDelta", e.data.delta, r);
      break;
    case "thread.run.step.completed":
    case "thread.run.step.failed":
    case "thread.run.step.cancelled":
    case "thread.run.step.expired":
      qt(this, Zn, void 0, "f"), e.data.step_details.type == "tool_calls" && ve(this, Ut, "f") && (this._emit("toolCallDone", ve(this, Ut, "f")), qt(this, Ut, void 0, "f")), this._emit("runStepDone", e.data, r);
      break;
  }
}, _l = function(e) {
  ve(this, Ua, "f").push(e), this._emit("event", e);
}, vl = function(e) {
  switch (e.event) {
    case "thread.run.step.created":
      return ve(this, lr, "f")[e.data.id] = e.data, e.data;
    case "thread.run.step.delta":
      let r = ve(this, lr, "f")[e.data.id];
      if (!r)
        throw Error("Received a RunStepDelta before creation of a snapshot");
      let n = e.data;
      if (n.delta) {
        const s = tr.accumulateDelta(r, n.delta);
        ve(this, lr, "f")[e.data.id] = s;
      }
      return ve(this, lr, "f")[e.data.id];
    case "thread.run.step.completed":
    case "thread.run.step.failed":
    case "thread.run.step.cancelled":
    case "thread.run.step.expired":
    case "thread.run.step.in_progress":
      ve(this, lr, "f")[e.data.id] = e.data;
      break;
  }
  if (ve(this, lr, "f")[e.data.id])
    return ve(this, lr, "f")[e.data.id];
  throw new Error("No snapshot available");
}, bl = function(e, r) {
  let n = [];
  switch (e.event) {
    case "thread.message.created":
      return [e.data, n];
    case "thread.message.delta":
      if (!r)
        throw Error("Received a delta with no existing snapshot (there should be one from message creation)");
      let s = e.data;
      if (s.delta.content)
        for (const i of s.delta.content)
          if (i.index in r.content) {
            let l = r.content[i.index];
            r.content[i.index] = ve(this, St, "m", Sl).call(this, i, l);
          } else
            r.content[i.index] = i, n.push(i);
      return [r, n];
    case "thread.message.in_progress":
    case "thread.message.completed":
    case "thread.message.incomplete":
      if (r)
        return [r, n];
      throw Error("Received thread message event with no existing snapshot");
  }
  throw Error("Tried to accumulate a non-message event");
}, Sl = function(e, r) {
  return tr.accumulateDelta(r, e);
}, El = function(e) {
  switch (qt(this, ui, e.data, "f"), e.event) {
    case "thread.run.created":
      break;
    case "thread.run.queued":
      break;
    case "thread.run.in_progress":
      break;
    case "thread.run.requires_action":
    case "thread.run.cancelled":
    case "thread.run.failed":
    case "thread.run.completed":
    case "thread.run.expired":
      qt(this, Kr, e.data, "f"), ve(this, Ut, "f") && (this._emit("toolCallDone", ve(this, Ut, "f")), qt(this, Ut, void 0, "f"));
      break;
  }
};
class ho extends $e {
  /**
   * Create an assistant with a model and instructions.
   *
   * @example
   * ```ts
   * const assistant = await client.beta.assistants.create({
   *   model: 'gpt-4o',
   * });
   * ```
   */
  create(e, r) {
    return this._client.post("/assistants", {
      body: e,
      ...r,
      headers: { "OpenAI-Beta": "assistants=v2", ...r == null ? void 0 : r.headers }
    });
  }
  /**
   * Retrieves an assistant.
   *
   * @example
   * ```ts
   * const assistant = await client.beta.assistants.retrieve(
   *   'assistant_id',
   * );
   * ```
   */
  retrieve(e, r) {
    return this._client.get(`/assistants/${e}`, {
      ...r,
      headers: { "OpenAI-Beta": "assistants=v2", ...r == null ? void 0 : r.headers }
    });
  }
  /**
   * Modifies an assistant.
   *
   * @example
   * ```ts
   * const assistant = await client.beta.assistants.update(
   *   'assistant_id',
   * );
   * ```
   */
  update(e, r, n) {
    return this._client.post(`/assistants/${e}`, {
      body: r,
      ...n,
      headers: { "OpenAI-Beta": "assistants=v2", ...n == null ? void 0 : n.headers }
    });
  }
  list(e = {}, r) {
    return tt(e) ? this.list({}, e) : this._client.getAPIList("/assistants", mo, {
      query: e,
      ...r,
      headers: { "OpenAI-Beta": "assistants=v2", ...r == null ? void 0 : r.headers }
    });
  }
  /**
   * Delete an assistant.
   *
   * @example
   * ```ts
   * const assistantDeleted = await client.beta.assistants.del(
   *   'assistant_id',
   * );
   * ```
   */
  del(e, r) {
    return this._client.delete(`/assistants/${e}`, {
      ...r,
      headers: { "OpenAI-Beta": "assistants=v2", ...r == null ? void 0 : r.headers }
    });
  }
}
class mo extends mt {
}
ho.AssistantsPage = mo;
function $l(t) {
  return typeof t.parse == "function";
}
const mn = (t) => (t == null ? void 0 : t.role) === "assistant", Sf = (t) => (t == null ? void 0 : t.role) === "function", Ef = (t) => (t == null ? void 0 : t.role) === "tool";
function po(t) {
  return (t == null ? void 0 : t.$brand) === "auto-parseable-response-format";
}
function ts(t) {
  return (t == null ? void 0 : t.$brand) === "auto-parseable-tool";
}
function zd(t, e) {
  return !e || !$f(e) ? {
    ...t,
    choices: t.choices.map((r) => ({
      ...r,
      message: {
        ...r.message,
        parsed: null,
        ...r.message.tool_calls ? {
          tool_calls: r.message.tool_calls
        } : void 0
      }
    }))
  } : go(t, e);
}
function go(t, e) {
  const r = t.choices.map((n) => {
    var s;
    if (n.finish_reason === "length")
      throw new sf();
    if (n.finish_reason === "content_filter")
      throw new af();
    return {
      ...n,
      message: {
        ...n.message,
        ...n.message.tool_calls ? {
          tool_calls: ((s = n.message.tool_calls) == null ? void 0 : s.map((i) => Zd(e, i))) ?? void 0
        } : void 0,
        parsed: n.message.content && !n.message.refusal ? Bd(e, n.message.content) : null
      }
    };
  });
  return { ...t, choices: r };
}
function Bd(t, e) {
  var r, n;
  return ((r = t.response_format) == null ? void 0 : r.type) !== "json_schema" ? null : ((n = t.response_format) == null ? void 0 : n.type) === "json_schema" ? "$parseRaw" in t.response_format ? t.response_format.$parseRaw(e) : JSON.parse(e) : null;
}
function Zd(t, e) {
  var n;
  const r = (n = t.tools) == null ? void 0 : n.find((s) => {
    var i;
    return ((i = s.function) == null ? void 0 : i.name) === e.function.name;
  });
  return {
    ...e,
    function: {
      ...e.function,
      parsed_arguments: ts(r) ? r.$parseRaw(e.function.arguments) : r != null && r.function.strict ? JSON.parse(e.function.arguments) : null
    }
  };
}
function Jd(t, e) {
  var n;
  if (!t)
    return !1;
  const r = (n = t.tools) == null ? void 0 : n.find((s) => {
    var i;
    return ((i = s.function) == null ? void 0 : i.name) === e.function.name;
  });
  return ts(r) || (r == null ? void 0 : r.function.strict) || !1;
}
function $f(t) {
  var e;
  return po(t.response_format) ? !0 : ((e = t.tools) == null ? void 0 : e.some((r) => ts(r) || r.type === "function" && r.function.strict === !0)) ?? !1;
}
function Wd(t) {
  for (const e of t ?? []) {
    if (e.type !== "function")
      throw new be(`Currently only \`function\` tool types support auto-parsing; Received \`${e.type}\``);
    if (e.function.strict !== !0)
      throw new be(`The \`${e.function.name}\` tool is not marked with \`strict: true\`. Only strict function tools can be auto-parsed`);
  }
}
var jt = function(t, e, r, n) {
  if (r === "a" && !n) throw new TypeError("Private accessor was defined without a getter");
  if (typeof e == "function" ? t !== e || !n : !e.has(t)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return r === "m" ? n : r === "a" ? n.call(t) : n ? n.value : e.get(t);
}, At, za, mi, Ba, Za, Ja, xf, Wa;
const xl = 10;
class kf extends fo {
  constructor() {
    super(...arguments), At.add(this), this._chatCompletions = [], this.messages = [];
  }
  _addChatCompletion(e) {
    var n;
    this._chatCompletions.push(e), this._emit("chatCompletion", e);
    const r = (n = e.choices[0]) == null ? void 0 : n.message;
    return r && this._addMessage(r), e;
  }
  _addMessage(e, r = !0) {
    if ("content" in e || (e.content = null), this.messages.push(e), r) {
      if (this._emit("message", e), (Sf(e) || Ef(e)) && e.content)
        this._emit("functionCallResult", e.content);
      else if (mn(e) && e.function_call)
        this._emit("functionCall", e.function_call);
      else if (mn(e) && e.tool_calls)
        for (const n of e.tool_calls)
          n.type === "function" && this._emit("functionCall", n.function);
    }
  }
  /**
   * @returns a promise that resolves with the final ChatCompletion, or rejects
   * if an error occurred or the stream ended prematurely without producing a ChatCompletion.
   */
  async finalChatCompletion() {
    await this.done();
    const e = this._chatCompletions[this._chatCompletions.length - 1];
    if (!e)
      throw new be("stream ended without producing a ChatCompletion");
    return e;
  }
  /**
   * @returns a promise that resolves with the content of the final ChatCompletionMessage, or rejects
   * if an error occurred or the stream ended prematurely without producing a ChatCompletionMessage.
   */
  async finalContent() {
    return await this.done(), jt(this, At, "m", za).call(this);
  }
  /**
   * @returns a promise that resolves with the the final assistant ChatCompletionMessage response,
   * or rejects if an error occurred or the stream ended prematurely without producing a ChatCompletionMessage.
   */
  async finalMessage() {
    return await this.done(), jt(this, At, "m", mi).call(this);
  }
  /**
   * @returns a promise that resolves with the content of the final FunctionCall, or rejects
   * if an error occurred or the stream ended prematurely without producing a ChatCompletionMessage.
   */
  async finalFunctionCall() {
    return await this.done(), jt(this, At, "m", Ba).call(this);
  }
  async finalFunctionCallResult() {
    return await this.done(), jt(this, At, "m", Za).call(this);
  }
  async totalUsage() {
    return await this.done(), jt(this, At, "m", Ja).call(this);
  }
  allChatCompletions() {
    return [...this._chatCompletions];
  }
  _emitFinal() {
    const e = this._chatCompletions[this._chatCompletions.length - 1];
    e && this._emit("finalChatCompletion", e);
    const r = jt(this, At, "m", mi).call(this);
    r && this._emit("finalMessage", r);
    const n = jt(this, At, "m", za).call(this);
    n && this._emit("finalContent", n);
    const s = jt(this, At, "m", Ba).call(this);
    s && this._emit("finalFunctionCall", s);
    const i = jt(this, At, "m", Za).call(this);
    i != null && this._emit("finalFunctionCallResult", i), this._chatCompletions.some((l) => l.usage) && this._emit("totalUsage", jt(this, At, "m", Ja).call(this));
  }
  async _createChatCompletion(e, r, n) {
    const s = n == null ? void 0 : n.signal;
    s && (s.aborted && this.controller.abort(), s.addEventListener("abort", () => this.controller.abort())), jt(this, At, "m", xf).call(this, r);
    const i = await e.chat.completions.create({ ...r, stream: !1 }, { ...n, signal: this.controller.signal });
    return this._connected(), this._addChatCompletion(go(i, r));
  }
  async _runChatCompletion(e, r, n) {
    for (const s of r.messages)
      this._addMessage(s, !1);
    return await this._createChatCompletion(e, r, n);
  }
  async _runFunctions(e, r, n) {
    var P;
    const s = "function", { function_call: i = "auto", stream: l, ...f } = r, d = typeof i != "string" && (i == null ? void 0 : i.name), { maxChatCompletions: p = xl } = n || {}, g = {};
    for (const x of r.functions)
      g[x.name || x.function.name] = x;
    const w = r.functions.map((x) => ({
      name: x.name || x.function.name,
      parameters: x.parameters,
      description: x.description
    }));
    for (const x of r.messages)
      this._addMessage(x, !1);
    for (let x = 0; x < p; ++x) {
      const S = (P = (await this._createChatCompletion(e, {
        ...f,
        function_call: i,
        functions: w,
        messages: [...this.messages]
      }, n)).choices[0]) == null ? void 0 : P.message;
      if (!S)
        throw new be("missing message in ChatCompletion response");
      if (!S.function_call)
        return;
      const { name: y, arguments: _ } = S.function_call, m = g[y];
      if (m) {
        if (d && d !== y) {
          const A = `Invalid function_call: ${JSON.stringify(y)}. ${JSON.stringify(d)} requested. Please try again`;
          this._addMessage({ role: s, name: y, content: A });
          continue;
        }
      } else {
        const A = `Invalid function_call: ${JSON.stringify(y)}. Available options are: ${w.map((j) => JSON.stringify(j.name)).join(", ")}. Please try again`;
        this._addMessage({ role: s, name: y, content: A });
        continue;
      }
      let b;
      try {
        b = $l(m) ? await m.parse(_) : _;
      } catch (A) {
        this._addMessage({
          role: s,
          name: y,
          content: A instanceof Error ? A.message : String(A)
        });
        continue;
      }
      const $ = await m.function(b, this), O = jt(this, At, "m", Wa).call(this, $);
      if (this._addMessage({ role: s, name: y, content: O }), d)
        return;
    }
  }
  async _runTools(e, r, n) {
    var x, T, S;
    const s = "tool", { tool_choice: i = "auto", stream: l, ...f } = r, d = typeof i != "string" && ((x = i == null ? void 0 : i.function) == null ? void 0 : x.name), { maxChatCompletions: p = xl } = n || {}, g = r.tools.map((y) => {
      if (ts(y)) {
        if (!y.$callback)
          throw new be("Tool given to `.runTools()` that does not have an associated function");
        return {
          type: "function",
          function: {
            function: y.$callback,
            name: y.function.name,
            description: y.function.description || "",
            parameters: y.function.parameters,
            parse: y.$parseRaw,
            strict: !0
          }
        };
      }
      return y;
    }), w = {};
    for (const y of g)
      y.type === "function" && (w[y.function.name || y.function.function.name] = y.function);
    const P = "tools" in r ? g.map((y) => y.type === "function" ? {
      type: "function",
      function: {
        name: y.function.name || y.function.function.name,
        parameters: y.function.parameters,
        description: y.function.description,
        strict: y.function.strict
      }
    } : y) : void 0;
    for (const y of r.messages)
      this._addMessage(y, !1);
    for (let y = 0; y < p; ++y) {
      const m = (T = (await this._createChatCompletion(e, {
        ...f,
        tool_choice: i,
        tools: P,
        messages: [...this.messages]
      }, n)).choices[0]) == null ? void 0 : T.message;
      if (!m)
        throw new be("missing message in ChatCompletion response");
      if (!((S = m.tool_calls) != null && S.length))
        return;
      for (const b of m.tool_calls) {
        if (b.type !== "function")
          continue;
        const $ = b.id, { name: O, arguments: A } = b.function, j = w[O];
        if (j) {
          if (d && d !== O) {
            const ee = `Invalid tool_call: ${JSON.stringify(O)}. ${JSON.stringify(d)} requested. Please try again`;
            this._addMessage({ role: s, tool_call_id: $, content: ee });
            continue;
          }
        } else {
          const ee = `Invalid tool_call: ${JSON.stringify(O)}. Available options are: ${Object.keys(w).map((ye) => JSON.stringify(ye)).join(", ")}. Please try again`;
          this._addMessage({ role: s, tool_call_id: $, content: ee });
          continue;
        }
        let V;
        try {
          V = $l(j) ? await j.parse(A) : A;
        } catch (ee) {
          const ye = ee instanceof Error ? ee.message : String(ee);
          this._addMessage({ role: s, tool_call_id: $, content: ye });
          continue;
        }
        const G = await j.function(V, this), H = jt(this, At, "m", Wa).call(this, G);
        if (this._addMessage({ role: s, tool_call_id: $, content: H }), d)
          return;
      }
    }
  }
}
At = /* @__PURE__ */ new WeakSet(), za = function() {
  return jt(this, At, "m", mi).call(this).content ?? null;
}, mi = function() {
  let e = this.messages.length;
  for (; e-- > 0; ) {
    const r = this.messages[e];
    if (mn(r)) {
      const { function_call: n, ...s } = r, i = {
        ...s,
        content: r.content ?? null,
        refusal: r.refusal ?? null
      };
      return n && (i.function_call = n), i;
    }
  }
  throw new be("stream ended without producing a ChatCompletionMessage with role=assistant");
}, Ba = function() {
  var e, r;
  for (let n = this.messages.length - 1; n >= 0; n--) {
    const s = this.messages[n];
    if (mn(s) && (s != null && s.function_call))
      return s.function_call;
    if (mn(s) && ((e = s == null ? void 0 : s.tool_calls) != null && e.length))
      return (r = s.tool_calls.at(-1)) == null ? void 0 : r.function;
  }
}, Za = function() {
  for (let e = this.messages.length - 1; e >= 0; e--) {
    const r = this.messages[e];
    if (Sf(r) && r.content != null || Ef(r) && r.content != null && typeof r.content == "string" && this.messages.some((n) => {
      var s;
      return n.role === "assistant" && ((s = n.tool_calls) == null ? void 0 : s.some((i) => i.type === "function" && i.id === r.tool_call_id));
    }))
      return r.content;
  }
}, Ja = function() {
  const e = {
    completion_tokens: 0,
    prompt_tokens: 0,
    total_tokens: 0
  };
  for (const { usage: r } of this._chatCompletions)
    r && (e.completion_tokens += r.completion_tokens, e.prompt_tokens += r.prompt_tokens, e.total_tokens += r.total_tokens);
  return e;
}, xf = function(e) {
  if (e.n != null && e.n > 1)
    throw new be("ChatCompletion convenience helpers only support n=1 at this time. To use n>1, please use chat.completions.create() directly.");
}, Wa = function(e) {
  return typeof e == "string" ? e : e === void 0 ? "undefined" : JSON.stringify(e);
};
class Jn extends kf {
  /** @deprecated - please use `runTools` instead. */
  static runFunctions(e, r, n) {
    const s = new Jn(), i = {
      ...n,
      headers: { ...n == null ? void 0 : n.headers, "X-Stainless-Helper-Method": "runFunctions" }
    };
    return s._run(() => s._runFunctions(e, r, i)), s;
  }
  static runTools(e, r, n) {
    const s = new Jn(), i = {
      ...n,
      headers: { ...n == null ? void 0 : n.headers, "X-Stainless-Helper-Method": "runTools" }
    };
    return s._run(() => s._runTools(e, r, i)), s;
  }
  _addMessage(e, r = !0) {
    super._addMessage(e, r), mn(e) && e.content && this._emit("content", e.content);
  }
}
const Af = 1, Pf = 2, Cf = 4, Rf = 8, Tf = 16, Of = 32, Nf = 64, If = 128, jf = 256, Mf = If | jf, Ff = Tf | Of | Mf | Nf, Df = Af | Pf | Ff, qf = Cf | Rf, Kd = Df | qf, wt = {
  STR: Af,
  NUM: Pf,
  ARR: Cf,
  OBJ: Rf,
  NULL: Tf,
  BOOL: Of,
  NAN: Nf,
  INFINITY: If,
  MINUS_INFINITY: jf,
  INF: Mf,
  SPECIAL: Ff,
  ATOM: Df,
  COLLECTION: qf,
  ALL: Kd
};
class Gd extends Error {
}
class Yd extends Error {
}
function Xd(t, e = wt.ALL) {
  if (typeof t != "string")
    throw new TypeError(`expecting str, got ${typeof t}`);
  if (!t.trim())
    throw new Error(`${t} is empty`);
  return Qd(t.trim(), e);
}
const Qd = (t, e) => {
  const r = t.length;
  let n = 0;
  const s = (P) => {
    throw new Gd(`${P} at position ${n}`);
  }, i = (P) => {
    throw new Yd(`${P} at position ${n}`);
  }, l = () => (w(), n >= r && s("Unexpected end of input"), t[n] === '"' ? f() : t[n] === "{" ? d() : t[n] === "[" ? p() : t.substring(n, n + 4) === "null" || wt.NULL & e && r - n < 4 && "null".startsWith(t.substring(n)) ? (n += 4, null) : t.substring(n, n + 4) === "true" || wt.BOOL & e && r - n < 4 && "true".startsWith(t.substring(n)) ? (n += 4, !0) : t.substring(n, n + 5) === "false" || wt.BOOL & e && r - n < 5 && "false".startsWith(t.substring(n)) ? (n += 5, !1) : t.substring(n, n + 8) === "Infinity" || wt.INFINITY & e && r - n < 8 && "Infinity".startsWith(t.substring(n)) ? (n += 8, 1 / 0) : t.substring(n, n + 9) === "-Infinity" || wt.MINUS_INFINITY & e && 1 < r - n && r - n < 9 && "-Infinity".startsWith(t.substring(n)) ? (n += 9, -1 / 0) : t.substring(n, n + 3) === "NaN" || wt.NAN & e && r - n < 3 && "NaN".startsWith(t.substring(n)) ? (n += 3, NaN) : g()), f = () => {
    const P = n;
    let x = !1;
    for (n++; n < r && (t[n] !== '"' || x && t[n - 1] === "\\"); )
      x = t[n] === "\\" ? !x : !1, n++;
    if (t.charAt(n) == '"')
      try {
        return JSON.parse(t.substring(P, ++n - Number(x)));
      } catch (T) {
        i(String(T));
      }
    else if (wt.STR & e)
      try {
        return JSON.parse(t.substring(P, n - Number(x)) + '"');
      } catch {
        return JSON.parse(t.substring(P, t.lastIndexOf("\\")) + '"');
      }
    s("Unterminated string literal");
  }, d = () => {
    n++, w();
    const P = {};
    try {
      for (; t[n] !== "}"; ) {
        if (w(), n >= r && wt.OBJ & e)
          return P;
        const x = f();
        w(), n++;
        try {
          const T = l();
          Object.defineProperty(P, x, { value: T, writable: !0, enumerable: !0, configurable: !0 });
        } catch (T) {
          if (wt.OBJ & e)
            return P;
          throw T;
        }
        w(), t[n] === "," && n++;
      }
    } catch {
      if (wt.OBJ & e)
        return P;
      s("Expected '}' at end of object");
    }
    return n++, P;
  }, p = () => {
    n++;
    const P = [];
    try {
      for (; t[n] !== "]"; )
        P.push(l()), w(), t[n] === "," && n++;
    } catch {
      if (wt.ARR & e)
        return P;
      s("Expected ']' at end of array");
    }
    return n++, P;
  }, g = () => {
    if (n === 0) {
      t === "-" && wt.NUM & e && s("Not sure what '-' is");
      try {
        return JSON.parse(t);
      } catch (x) {
        if (wt.NUM & e)
          try {
            return t[t.length - 1] === "." ? JSON.parse(t.substring(0, t.lastIndexOf("."))) : JSON.parse(t.substring(0, t.lastIndexOf("e")));
          } catch {
          }
        i(String(x));
      }
    }
    const P = n;
    for (t[n] === "-" && n++; t[n] && !",]}".includes(t[n]); )
      n++;
    n == r && !(wt.NUM & e) && s("Unterminated number literal");
    try {
      return JSON.parse(t.substring(P, n));
    } catch {
      t.substring(P, n) === "-" && wt.NUM & e && s("Not sure what '-' is");
      try {
        return JSON.parse(t.substring(P, t.lastIndexOf("e")));
      } catch (T) {
        i(String(T));
      }
    }
  }, w = () => {
    for (; n < r && ` 
\r	`.includes(t[n]); )
      n++;
  };
  return l();
}, kl = (t) => Xd(t, wt.ALL ^ wt.NUM);
var en = function(t, e, r, n, s) {
  if (n === "m") throw new TypeError("Private method is not writable");
  if (n === "a" && !s) throw new TypeError("Private accessor was defined without a setter");
  if (typeof e == "function" ? t !== e || !s : !e.has(t)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return n === "a" ? s.call(t, r) : s ? s.value = r : e.set(t, r), r;
}, Ke = function(t, e, r, n) {
  if (r === "a" && !n) throw new TypeError("Private accessor was defined without a getter");
  if (typeof e == "function" ? t !== e || !n : !e.has(t)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return r === "m" ? n : r === "a" ? n.call(t) : n ? n.value : e.get(t);
}, ht, mr, tn, xr, ia, ps, aa, oa, la, gs, ca, Al;
class Wn extends kf {
  constructor(e) {
    super(), ht.add(this), mr.set(this, void 0), tn.set(this, void 0), xr.set(this, void 0), en(this, mr, e, "f"), en(this, tn, [], "f");
  }
  get currentChatCompletionSnapshot() {
    return Ke(this, xr, "f");
  }
  /**
   * Intended for use on the frontend, consuming a stream produced with
   * `.toReadableStream()` on the backend.
   *
   * Note that messages sent to the model do not appear in `.on('message')`
   * in this context.
   */
  static fromReadableStream(e) {
    const r = new Wn(null);
    return r._run(() => r._fromReadableStream(e)), r;
  }
  static createChatCompletion(e, r, n) {
    const s = new Wn(r);
    return s._run(() => s._runChatCompletion(e, { ...r, stream: !0 }, { ...n, headers: { ...n == null ? void 0 : n.headers, "X-Stainless-Helper-Method": "stream" } })), s;
  }
  async _createChatCompletion(e, r, n) {
    var l;
    super._createChatCompletion;
    const s = n == null ? void 0 : n.signal;
    s && (s.aborted && this.controller.abort(), s.addEventListener("abort", () => this.controller.abort())), Ke(this, ht, "m", ia).call(this);
    const i = await e.chat.completions.create({ ...r, stream: !0 }, { ...n, signal: this.controller.signal });
    this._connected();
    for await (const f of i)
      Ke(this, ht, "m", aa).call(this, f);
    if ((l = i.controller.signal) != null && l.aborted)
      throw new Bt();
    return this._addChatCompletion(Ke(this, ht, "m", gs).call(this));
  }
  async _fromReadableStream(e, r) {
    var l;
    const n = r == null ? void 0 : r.signal;
    n && (n.aborted && this.controller.abort(), n.addEventListener("abort", () => this.controller.abort())), Ke(this, ht, "m", ia).call(this), this._connected();
    const s = cr.fromReadableStream(e, this.controller);
    let i;
    for await (const f of s)
      i && i !== f.id && this._addChatCompletion(Ke(this, ht, "m", gs).call(this)), Ke(this, ht, "m", aa).call(this, f), i = f.id;
    if ((l = s.controller.signal) != null && l.aborted)
      throw new Bt();
    return this._addChatCompletion(Ke(this, ht, "m", gs).call(this));
  }
  [(mr = /* @__PURE__ */ new WeakMap(), tn = /* @__PURE__ */ new WeakMap(), xr = /* @__PURE__ */ new WeakMap(), ht = /* @__PURE__ */ new WeakSet(), ia = function() {
    this.ended || en(this, xr, void 0, "f");
  }, ps = function(r) {
    let n = Ke(this, tn, "f")[r.index];
    return n || (n = {
      content_done: !1,
      refusal_done: !1,
      logprobs_content_done: !1,
      logprobs_refusal_done: !1,
      done_tool_calls: /* @__PURE__ */ new Set(),
      current_tool_call_index: null
    }, Ke(this, tn, "f")[r.index] = n, n);
  }, aa = function(r) {
    var s, i, l, f, d, p, g, w, P, x, T, S, y, _, m;
    if (this.ended)
      return;
    const n = Ke(this, ht, "m", Al).call(this, r);
    this._emit("chunk", r, n);
    for (const b of r.choices) {
      const $ = n.choices[b.index];
      b.delta.content != null && ((s = $.message) == null ? void 0 : s.role) === "assistant" && ((i = $.message) != null && i.content) && (this._emit("content", b.delta.content, $.message.content), this._emit("content.delta", {
        delta: b.delta.content,
        snapshot: $.message.content,
        parsed: $.message.parsed
      })), b.delta.refusal != null && ((l = $.message) == null ? void 0 : l.role) === "assistant" && ((f = $.message) != null && f.refusal) && this._emit("refusal.delta", {
        delta: b.delta.refusal,
        snapshot: $.message.refusal
      }), ((d = b.logprobs) == null ? void 0 : d.content) != null && ((p = $.message) == null ? void 0 : p.role) === "assistant" && this._emit("logprobs.content.delta", {
        content: (g = b.logprobs) == null ? void 0 : g.content,
        snapshot: ((w = $.logprobs) == null ? void 0 : w.content) ?? []
      }), ((P = b.logprobs) == null ? void 0 : P.refusal) != null && ((x = $.message) == null ? void 0 : x.role) === "assistant" && this._emit("logprobs.refusal.delta", {
        refusal: (T = b.logprobs) == null ? void 0 : T.refusal,
        snapshot: ((S = $.logprobs) == null ? void 0 : S.refusal) ?? []
      });
      const O = Ke(this, ht, "m", ps).call(this, $);
      $.finish_reason && (Ke(this, ht, "m", la).call(this, $), O.current_tool_call_index != null && Ke(this, ht, "m", oa).call(this, $, O.current_tool_call_index));
      for (const A of b.delta.tool_calls ?? [])
        O.current_tool_call_index !== A.index && (Ke(this, ht, "m", la).call(this, $), O.current_tool_call_index != null && Ke(this, ht, "m", oa).call(this, $, O.current_tool_call_index)), O.current_tool_call_index = A.index;
      for (const A of b.delta.tool_calls ?? []) {
        const j = (y = $.message.tool_calls) == null ? void 0 : y[A.index];
        j != null && j.type && ((j == null ? void 0 : j.type) === "function" ? this._emit("tool_calls.function.arguments.delta", {
          name: (_ = j.function) == null ? void 0 : _.name,
          index: A.index,
          arguments: j.function.arguments,
          parsed_arguments: j.function.parsed_arguments,
          arguments_delta: ((m = A.function) == null ? void 0 : m.arguments) ?? ""
        }) : (j == null || j.type, void 0));
      }
    }
  }, oa = function(r, n) {
    var l, f, d;
    if (Ke(this, ht, "m", ps).call(this, r).done_tool_calls.has(n))
      return;
    const i = (l = r.message.tool_calls) == null ? void 0 : l[n];
    if (!i)
      throw new Error("no tool call snapshot");
    if (!i.type)
      throw new Error("tool call snapshot missing `type`");
    if (i.type === "function") {
      const p = (d = (f = Ke(this, mr, "f")) == null ? void 0 : f.tools) == null ? void 0 : d.find((g) => g.type === "function" && g.function.name === i.function.name);
      this._emit("tool_calls.function.arguments.done", {
        name: i.function.name,
        index: n,
        arguments: i.function.arguments,
        parsed_arguments: ts(p) ? p.$parseRaw(i.function.arguments) : p != null && p.function.strict ? JSON.parse(i.function.arguments) : null
      });
    } else
      i.type;
  }, la = function(r) {
    var s, i;
    const n = Ke(this, ht, "m", ps).call(this, r);
    if (r.message.content && !n.content_done) {
      n.content_done = !0;
      const l = Ke(this, ht, "m", ca).call(this);
      this._emit("content.done", {
        content: r.message.content,
        parsed: l ? l.$parseRaw(r.message.content) : null
      });
    }
    r.message.refusal && !n.refusal_done && (n.refusal_done = !0, this._emit("refusal.done", { refusal: r.message.refusal })), (s = r.logprobs) != null && s.content && !n.logprobs_content_done && (n.logprobs_content_done = !0, this._emit("logprobs.content.done", { content: r.logprobs.content })), (i = r.logprobs) != null && i.refusal && !n.logprobs_refusal_done && (n.logprobs_refusal_done = !0, this._emit("logprobs.refusal.done", { refusal: r.logprobs.refusal }));
  }, gs = function() {
    if (this.ended)
      throw new be("stream has ended, this shouldn't happen");
    const r = Ke(this, xr, "f");
    if (!r)
      throw new be("request ended without sending any chunks");
    return en(this, xr, void 0, "f"), en(this, tn, [], "f"), Hd(r, Ke(this, mr, "f"));
  }, ca = function() {
    var n;
    const r = (n = Ke(this, mr, "f")) == null ? void 0 : n.response_format;
    return po(r) ? r : null;
  }, Al = function(r) {
    var n, s, i, l;
    let f = Ke(this, xr, "f");
    const { choices: d, ...p } = r;
    f ? Object.assign(f, p) : f = en(this, xr, {
      ...p,
      choices: []
    }, "f");
    for (const { delta: g, finish_reason: w, index: P, logprobs: x = null, ...T } of r.choices) {
      let S = f.choices[P];
      if (S || (S = f.choices[P] = { finish_reason: w, index: P, message: {}, logprobs: x, ...T }), x)
        if (!S.logprobs)
          S.logprobs = Object.assign({}, x);
        else {
          const { content: A, refusal: j, ...V } = x;
          Object.assign(S.logprobs, V), A && ((n = S.logprobs).content ?? (n.content = []), S.logprobs.content.push(...A)), j && ((s = S.logprobs).refusal ?? (s.refusal = []), S.logprobs.refusal.push(...j));
        }
      if (w && (S.finish_reason = w, Ke(this, mr, "f") && $f(Ke(this, mr, "f")))) {
        if (w === "length")
          throw new sf();
        if (w === "content_filter")
          throw new af();
      }
      if (Object.assign(S, T), !g)
        continue;
      const { content: y, refusal: _, function_call: m, role: b, tool_calls: $, ...O } = g;
      if (Object.assign(S.message, O), _ && (S.message.refusal = (S.message.refusal || "") + _), b && (S.message.role = b), m && (S.message.function_call ? (m.name && (S.message.function_call.name = m.name), m.arguments && ((i = S.message.function_call).arguments ?? (i.arguments = ""), S.message.function_call.arguments += m.arguments)) : S.message.function_call = m), y && (S.message.content = (S.message.content || "") + y, !S.message.refusal && Ke(this, ht, "m", ca).call(this) && (S.message.parsed = kl(S.message.content))), $) {
        S.message.tool_calls || (S.message.tool_calls = []);
        for (const { index: A, id: j, type: V, function: G, ...H } of $) {
          const ee = (l = S.message.tool_calls)[A] ?? (l[A] = {});
          Object.assign(ee, H), j && (ee.id = j), V && (ee.type = V), G && (ee.function ?? (ee.function = { name: G.name ?? "", arguments: "" })), G != null && G.name && (ee.function.name = G.name), G != null && G.arguments && (ee.function.arguments += G.arguments, Jd(Ke(this, mr, "f"), ee) && (ee.function.parsed_arguments = kl(ee.function.arguments)));
        }
      }
    }
    return f;
  }, Symbol.asyncIterator)]() {
    const e = [], r = [];
    let n = !1;
    return this.on("chunk", (s) => {
      const i = r.shift();
      i ? i.resolve(s) : e.push(s);
    }), this.on("end", () => {
      n = !0;
      for (const s of r)
        s.resolve(void 0);
      r.length = 0;
    }), this.on("abort", (s) => {
      n = !0;
      for (const i of r)
        i.reject(s);
      r.length = 0;
    }), this.on("error", (s) => {
      n = !0;
      for (const i of r)
        i.reject(s);
      r.length = 0;
    }), {
      next: async () => e.length ? { value: e.shift(), done: !1 } : n ? { value: void 0, done: !0 } : new Promise((i, l) => r.push({ resolve: i, reject: l })).then((i) => i ? { value: i, done: !1 } : { value: void 0, done: !0 }),
      return: async () => (this.abort(), { value: void 0, done: !0 })
    };
  }
  toReadableStream() {
    return new cr(this[Symbol.asyncIterator].bind(this), this.controller).toReadableStream();
  }
}
function Hd(t, e) {
  const { id: r, choices: n, created: s, model: i, system_fingerprint: l, ...f } = t, d = {
    ...f,
    id: r,
    choices: n.map(({ message: p, finish_reason: g, index: w, logprobs: P, ...x }) => {
      if (!g)
        throw new be(`missing finish_reason for choice ${w}`);
      const { content: T = null, function_call: S, tool_calls: y, ..._ } = p, m = p.role;
      if (!m)
        throw new be(`missing role for choice ${w}`);
      if (S) {
        const { arguments: b, name: $ } = S;
        if (b == null)
          throw new be(`missing function_call.arguments for choice ${w}`);
        if (!$)
          throw new be(`missing function_call.name for choice ${w}`);
        return {
          ...x,
          message: {
            content: T,
            function_call: { arguments: b, name: $ },
            role: m,
            refusal: p.refusal ?? null
          },
          finish_reason: g,
          index: w,
          logprobs: P
        };
      }
      return y ? {
        ...x,
        index: w,
        finish_reason: g,
        logprobs: P,
        message: {
          ..._,
          role: m,
          content: T,
          refusal: p.refusal ?? null,
          tool_calls: y.map((b, $) => {
            const { function: O, type: A, id: j, ...V } = b, { arguments: G, name: H, ...ee } = O || {};
            if (j == null)
              throw new be(`missing choices[${w}].tool_calls[${$}].id
${ys(t)}`);
            if (A == null)
              throw new be(`missing choices[${w}].tool_calls[${$}].type
${ys(t)}`);
            if (H == null)
              throw new be(`missing choices[${w}].tool_calls[${$}].function.name
${ys(t)}`);
            if (G == null)
              throw new be(`missing choices[${w}].tool_calls[${$}].function.arguments
${ys(t)}`);
            return { ...V, id: j, type: A, function: { ...ee, name: H, arguments: G } };
          })
        }
      } : {
        ...x,
        message: { ..._, content: T, role: m, refusal: p.refusal ?? null },
        finish_reason: g,
        index: w,
        logprobs: P
      };
    }),
    created: s,
    model: i,
    object: "chat.completion",
    ...l ? { system_fingerprint: l } : {}
  };
  return zd(d, e);
}
function ys(t) {
  return JSON.stringify(t);
}
class pn extends Wn {
  static fromReadableStream(e) {
    const r = new pn(null);
    return r._run(() => r._fromReadableStream(e)), r;
  }
  /** @deprecated - please use `runTools` instead. */
  static runFunctions(e, r, n) {
    const s = new pn(null), i = {
      ...n,
      headers: { ...n == null ? void 0 : n.headers, "X-Stainless-Helper-Method": "runFunctions" }
    };
    return s._run(() => s._runFunctions(e, r, i)), s;
  }
  static runTools(e, r, n) {
    const s = new pn(
      // @ts-expect-error TODO these types are incompatible
      r
    ), i = {
      ...n,
      headers: { ...n == null ? void 0 : n.headers, "X-Stainless-Helper-Method": "runTools" }
    };
    return s._run(() => s._runTools(e, r, i)), s;
  }
}
let Lf = class extends $e {
  parse(e, r) {
    return Wd(e.tools), this._client.chat.completions.create(e, {
      ...r,
      headers: {
        ...r == null ? void 0 : r.headers,
        "X-Stainless-Helper-Method": "beta.chat.completions.parse"
      }
    })._thenUnwrap((n) => go(n, e));
  }
  runFunctions(e, r) {
    return e.stream ? pn.runFunctions(this._client, e, r) : Jn.runFunctions(this._client, e, r);
  }
  runTools(e, r) {
    return e.stream ? pn.runTools(this._client, e, r) : Jn.runTools(this._client, e, r);
  }
  /**
   * Creates a chat completion stream
   */
  stream(e, r) {
    return Wn.createChatCompletion(this._client, e, r);
  }
};
class Ka extends $e {
  constructor() {
    super(...arguments), this.completions = new Lf(this._client);
  }
}
(function(t) {
  t.Completions = Lf;
})(Ka || (Ka = {}));
class Vf extends $e {
  /**
   * Create an ephemeral API token for use in client-side applications with the
   * Realtime API. Can be configured with the same session parameters as the
   * `session.update` client event.
   *
   * It responds with a session object, plus a `client_secret` key which contains a
   * usable ephemeral API token that can be used to authenticate browser clients for
   * the Realtime API.
   *
   * @example
   * ```ts
   * const session =
   *   await client.beta.realtime.sessions.create();
   * ```
   */
  create(e, r) {
    return this._client.post("/realtime/sessions", {
      body: e,
      ...r,
      headers: { "OpenAI-Beta": "assistants=v2", ...r == null ? void 0 : r.headers }
    });
  }
}
class Uf extends $e {
  /**
   * Create an ephemeral API token for use in client-side applications with the
   * Realtime API specifically for realtime transcriptions. Can be configured with
   * the same session parameters as the `transcription_session.update` client event.
   *
   * It responds with a session object, plus a `client_secret` key which contains a
   * usable ephemeral API token that can be used to authenticate browser clients for
   * the Realtime API.
   *
   * @example
   * ```ts
   * const transcriptionSession =
   *   await client.beta.realtime.transcriptionSessions.create();
   * ```
   */
  create(e, r) {
    return this._client.post("/realtime/transcription_sessions", {
      body: e,
      ...r,
      headers: { "OpenAI-Beta": "assistants=v2", ...r == null ? void 0 : r.headers }
    });
  }
}
class Fi extends $e {
  constructor() {
    super(...arguments), this.sessions = new Vf(this._client), this.transcriptionSessions = new Uf(this._client);
  }
}
Fi.Sessions = Vf;
Fi.TranscriptionSessions = Uf;
class yo extends $e {
  /**
   * Create a message.
   *
   * @example
   * ```ts
   * const message = await client.beta.threads.messages.create(
   *   'thread_id',
   *   { content: 'string', role: 'user' },
   * );
   * ```
   */
  create(e, r, n) {
    return this._client.post(`/threads/${e}/messages`, {
      body: r,
      ...n,
      headers: { "OpenAI-Beta": "assistants=v2", ...n == null ? void 0 : n.headers }
    });
  }
  /**
   * Retrieve a message.
   *
   * @example
   * ```ts
   * const message = await client.beta.threads.messages.retrieve(
   *   'thread_id',
   *   'message_id',
   * );
   * ```
   */
  retrieve(e, r, n) {
    return this._client.get(`/threads/${e}/messages/${r}`, {
      ...n,
      headers: { "OpenAI-Beta": "assistants=v2", ...n == null ? void 0 : n.headers }
    });
  }
  /**
   * Modifies a message.
   *
   * @example
   * ```ts
   * const message = await client.beta.threads.messages.update(
   *   'thread_id',
   *   'message_id',
   * );
   * ```
   */
  update(e, r, n, s) {
    return this._client.post(`/threads/${e}/messages/${r}`, {
      body: n,
      ...s,
      headers: { "OpenAI-Beta": "assistants=v2", ...s == null ? void 0 : s.headers }
    });
  }
  list(e, r = {}, n) {
    return tt(r) ? this.list(e, {}, r) : this._client.getAPIList(`/threads/${e}/messages`, wo, {
      query: r,
      ...n,
      headers: { "OpenAI-Beta": "assistants=v2", ...n == null ? void 0 : n.headers }
    });
  }
  /**
   * Deletes a message.
   *
   * @example
   * ```ts
   * const messageDeleted =
   *   await client.beta.threads.messages.del(
   *     'thread_id',
   *     'message_id',
   *   );
   * ```
   */
  del(e, r, n) {
    return this._client.delete(`/threads/${e}/messages/${r}`, {
      ...n,
      headers: { "OpenAI-Beta": "assistants=v2", ...n == null ? void 0 : n.headers }
    });
  }
}
class wo extends mt {
}
yo.MessagesPage = wo;
class _o extends $e {
  retrieve(e, r, n, s = {}, i) {
    return tt(s) ? this.retrieve(e, r, n, {}, s) : this._client.get(`/threads/${e}/runs/${r}/steps/${n}`, {
      query: s,
      ...i,
      headers: { "OpenAI-Beta": "assistants=v2", ...i == null ? void 0 : i.headers }
    });
  }
  list(e, r, n = {}, s) {
    return tt(n) ? this.list(e, r, {}, n) : this._client.getAPIList(`/threads/${e}/runs/${r}/steps`, vo, {
      query: n,
      ...s,
      headers: { "OpenAI-Beta": "assistants=v2", ...s == null ? void 0 : s.headers }
    });
  }
}
class vo extends mt {
}
_o.RunStepsPage = vo;
let rs = class extends $e {
  constructor() {
    super(...arguments), this.steps = new _o(this._client);
  }
  create(e, r, n) {
    const { include: s, ...i } = r;
    return this._client.post(`/threads/${e}/runs`, {
      query: { include: s },
      body: i,
      ...n,
      headers: { "OpenAI-Beta": "assistants=v2", ...n == null ? void 0 : n.headers },
      stream: r.stream ?? !1
    });
  }
  /**
   * Retrieves a run.
   *
   * @example
   * ```ts
   * const run = await client.beta.threads.runs.retrieve(
   *   'thread_id',
   *   'run_id',
   * );
   * ```
   */
  retrieve(e, r, n) {
    return this._client.get(`/threads/${e}/runs/${r}`, {
      ...n,
      headers: { "OpenAI-Beta": "assistants=v2", ...n == null ? void 0 : n.headers }
    });
  }
  /**
   * Modifies a run.
   *
   * @example
   * ```ts
   * const run = await client.beta.threads.runs.update(
   *   'thread_id',
   *   'run_id',
   * );
   * ```
   */
  update(e, r, n, s) {
    return this._client.post(`/threads/${e}/runs/${r}`, {
      body: n,
      ...s,
      headers: { "OpenAI-Beta": "assistants=v2", ...s == null ? void 0 : s.headers }
    });
  }
  list(e, r = {}, n) {
    return tt(r) ? this.list(e, {}, r) : this._client.getAPIList(`/threads/${e}/runs`, bo, {
      query: r,
      ...n,
      headers: { "OpenAI-Beta": "assistants=v2", ...n == null ? void 0 : n.headers }
    });
  }
  /**
   * Cancels a run that is `in_progress`.
   *
   * @example
   * ```ts
   * const run = await client.beta.threads.runs.cancel(
   *   'thread_id',
   *   'run_id',
   * );
   * ```
   */
  cancel(e, r, n) {
    return this._client.post(`/threads/${e}/runs/${r}/cancel`, {
      ...n,
      headers: { "OpenAI-Beta": "assistants=v2", ...n == null ? void 0 : n.headers }
    });
  }
  /**
   * A helper to create a run an poll for a terminal state. More information on Run
   * lifecycles can be found here:
   * https://platform.openai.com/docs/assistants/how-it-works/runs-and-run-steps
   */
  async createAndPoll(e, r, n) {
    const s = await this.create(e, r, n);
    return await this.poll(e, s.id, n);
  }
  /**
   * Create a Run stream
   *
   * @deprecated use `stream` instead
   */
  createAndStream(e, r, n) {
    return tr.createAssistantStream(e, this._client.beta.threads.runs, r, n);
  }
  /**
   * A helper to poll a run status until it reaches a terminal state. More
   * information on Run lifecycles can be found here:
   * https://platform.openai.com/docs/assistants/how-it-works/runs-and-run-steps
   */
  async poll(e, r, n) {
    const s = { ...n == null ? void 0 : n.headers, "X-Stainless-Poll-Helper": "true" };
    for (n != null && n.pollIntervalMs && (s["X-Stainless-Custom-Poll-Interval"] = n.pollIntervalMs.toString()); ; ) {
      const { data: i, response: l } = await this.retrieve(e, r, {
        ...n,
        headers: { ...n == null ? void 0 : n.headers, ...s }
      }).withResponse();
      switch (i.status) {
        //If we are in any sort of intermediate state we poll
        case "queued":
        case "in_progress":
        case "cancelling":
          let f = 5e3;
          if (n != null && n.pollIntervalMs)
            f = n.pollIntervalMs;
          else {
            const d = l.headers.get("openai-poll-after-ms");
            if (d) {
              const p = parseInt(d);
              isNaN(p) || (f = p);
            }
          }
          await Hn(f);
          break;
        //We return the run in any terminal state.
        case "requires_action":
        case "incomplete":
        case "cancelled":
        case "completed":
        case "failed":
        case "expired":
          return i;
      }
    }
  }
  /**
   * Create a Run stream
   */
  stream(e, r, n) {
    return tr.createAssistantStream(e, this._client.beta.threads.runs, r, n);
  }
  submitToolOutputs(e, r, n, s) {
    return this._client.post(`/threads/${e}/runs/${r}/submit_tool_outputs`, {
      body: n,
      ...s,
      headers: { "OpenAI-Beta": "assistants=v2", ...s == null ? void 0 : s.headers },
      stream: n.stream ?? !1
    });
  }
  /**
   * A helper to submit a tool output to a run and poll for a terminal run state.
   * More information on Run lifecycles can be found here:
   * https://platform.openai.com/docs/assistants/how-it-works/runs-and-run-steps
   */
  async submitToolOutputsAndPoll(e, r, n, s) {
    const i = await this.submitToolOutputs(e, r, n, s);
    return await this.poll(e, i.id, s);
  }
  /**
   * Submit the tool outputs from a previous run and stream the run to a terminal
   * state. More information on Run lifecycles can be found here:
   * https://platform.openai.com/docs/assistants/how-it-works/runs-and-run-steps
   */
  submitToolOutputsStream(e, r, n, s) {
    return tr.createToolAssistantStream(e, r, this._client.beta.threads.runs, n, s);
  }
};
class bo extends mt {
}
rs.RunsPage = bo;
rs.Steps = _o;
rs.RunStepsPage = vo;
class $n extends $e {
  constructor() {
    super(...arguments), this.runs = new rs(this._client), this.messages = new yo(this._client);
  }
  create(e = {}, r) {
    return tt(e) ? this.create({}, e) : this._client.post("/threads", {
      body: e,
      ...r,
      headers: { "OpenAI-Beta": "assistants=v2", ...r == null ? void 0 : r.headers }
    });
  }
  /**
   * Retrieves a thread.
   *
   * @example
   * ```ts
   * const thread = await client.beta.threads.retrieve(
   *   'thread_id',
   * );
   * ```
   */
  retrieve(e, r) {
    return this._client.get(`/threads/${e}`, {
      ...r,
      headers: { "OpenAI-Beta": "assistants=v2", ...r == null ? void 0 : r.headers }
    });
  }
  /**
   * Modifies a thread.
   *
   * @example
   * ```ts
   * const thread = await client.beta.threads.update(
   *   'thread_id',
   * );
   * ```
   */
  update(e, r, n) {
    return this._client.post(`/threads/${e}`, {
      body: r,
      ...n,
      headers: { "OpenAI-Beta": "assistants=v2", ...n == null ? void 0 : n.headers }
    });
  }
  /**
   * Delete a thread.
   *
   * @example
   * ```ts
   * const threadDeleted = await client.beta.threads.del(
   *   'thread_id',
   * );
   * ```
   */
  del(e, r) {
    return this._client.delete(`/threads/${e}`, {
      ...r,
      headers: { "OpenAI-Beta": "assistants=v2", ...r == null ? void 0 : r.headers }
    });
  }
  createAndRun(e, r) {
    return this._client.post("/threads/runs", {
      body: e,
      ...r,
      headers: { "OpenAI-Beta": "assistants=v2", ...r == null ? void 0 : r.headers },
      stream: e.stream ?? !1
    });
  }
  /**
   * A helper to create a thread, start a run and then poll for a terminal state.
   * More information on Run lifecycles can be found here:
   * https://platform.openai.com/docs/assistants/how-it-works/runs-and-run-steps
   */
  async createAndRunPoll(e, r) {
    const n = await this.createAndRun(e, r);
    return await this.runs.poll(n.thread_id, n.id, r);
  }
  /**
   * Create a thread and stream the run back
   */
  createAndRunStream(e, r) {
    return tr.createThreadAssistantStream(e, this._client.beta.threads, r);
  }
}
$n.Runs = rs;
$n.RunsPage = bo;
$n.Messages = yo;
$n.MessagesPage = wo;
class xn extends $e {
  constructor() {
    super(...arguments), this.realtime = new Fi(this._client), this.chat = new Ka(this._client), this.assistants = new ho(this._client), this.threads = new $n(this._client);
  }
}
xn.Realtime = Fi;
xn.Assistants = ho;
xn.AssistantsPage = mo;
xn.Threads = $n;
class zf extends $e {
  create(e, r) {
    return this._client.post("/completions", { body: e, ...r, stream: e.stream ?? !1 });
  }
}
class Bf extends $e {
  /**
   * Retrieve Container File Content
   */
  retrieve(e, r, n) {
    return this._client.get(`/containers/${e}/files/${r}/content`, {
      ...n,
      headers: { Accept: "*/*", ...n == null ? void 0 : n.headers }
    });
  }
}
let Di = class extends $e {
  constructor() {
    super(...arguments), this.content = new Bf(this._client);
  }
  /**
   * Create a Container File
   *
   * You can send either a multipart/form-data request with the raw file content, or
   * a JSON request with a file ID.
   */
  create(e, r, n) {
    return this._client.post(`/containers/${e}/files`, Yr({ body: r, ...n }));
  }
  /**
   * Retrieve Container File
   */
  retrieve(e, r, n) {
    return this._client.get(`/containers/${e}/files/${r}`, n);
  }
  list(e, r = {}, n) {
    return tt(r) ? this.list(e, {}, r) : this._client.getAPIList(`/containers/${e}/files`, So, {
      query: r,
      ...n
    });
  }
  /**
   * Delete Container File
   */
  del(e, r, n) {
    return this._client.delete(`/containers/${e}/files/${r}`, {
      ...n,
      headers: { Accept: "*/*", ...n == null ? void 0 : n.headers }
    });
  }
};
class So extends mt {
}
Di.FileListResponsesPage = So;
Di.Content = Bf;
class ns extends $e {
  constructor() {
    super(...arguments), this.files = new Di(this._client);
  }
  /**
   * Create Container
   */
  create(e, r) {
    return this._client.post("/containers", { body: e, ...r });
  }
  /**
   * Retrieve Container
   */
  retrieve(e, r) {
    return this._client.get(`/containers/${e}`, r);
  }
  list(e = {}, r) {
    return tt(e) ? this.list({}, e) : this._client.getAPIList("/containers", Eo, { query: e, ...r });
  }
  /**
   * Delete Container
   */
  del(e, r) {
    return this._client.delete(`/containers/${e}`, {
      ...r,
      headers: { Accept: "*/*", ...r == null ? void 0 : r.headers }
    });
  }
}
class Eo extends mt {
}
ns.ContainerListResponsesPage = Eo;
ns.Files = Di;
ns.FileListResponsesPage = So;
class Zf extends $e {
  /**
   * Creates an embedding vector representing the input text.
   *
   * @example
   * ```ts
   * const createEmbeddingResponse =
   *   await client.embeddings.create({
   *     input: 'The quick brown fox jumped over the lazy dog',
   *     model: 'text-embedding-3-small',
   *   });
   * ```
   */
  create(e, r) {
    const n = !!e.encoding_format;
    let s = n ? e.encoding_format : "base64";
    n && Rr("Request", "User defined encoding_format:", e.encoding_format);
    const i = this._client.post("/embeddings", {
      body: {
        ...e,
        encoding_format: s
      },
      ...r
    });
    return n ? i : (Rr("response", "Decoding base64 embeddings to float32 array"), i._thenUnwrap((l) => (l && l.data && l.data.forEach((f) => {
      const d = f.embedding;
      f.embedding = Vd(d);
    }), l)));
  }
}
class $o extends $e {
  /**
   * Get an evaluation run output item by ID.
   */
  retrieve(e, r, n, s) {
    return this._client.get(`/evals/${e}/runs/${r}/output_items/${n}`, s);
  }
  list(e, r, n = {}, s) {
    return tt(n) ? this.list(e, r, {}, n) : this._client.getAPIList(`/evals/${e}/runs/${r}/output_items`, xo, { query: n, ...s });
  }
}
class xo extends mt {
}
$o.OutputItemListResponsesPage = xo;
class ss extends $e {
  constructor() {
    super(...arguments), this.outputItems = new $o(this._client);
  }
  /**
   * Kicks off a new run for a given evaluation, specifying the data source, and what
   * model configuration to use to test. The datasource will be validated against the
   * schema specified in the config of the evaluation.
   */
  create(e, r, n) {
    return this._client.post(`/evals/${e}/runs`, { body: r, ...n });
  }
  /**
   * Get an evaluation run by ID.
   */
  retrieve(e, r, n) {
    return this._client.get(`/evals/${e}/runs/${r}`, n);
  }
  list(e, r = {}, n) {
    return tt(r) ? this.list(e, {}, r) : this._client.getAPIList(`/evals/${e}/runs`, ko, { query: r, ...n });
  }
  /**
   * Delete an eval run.
   */
  del(e, r, n) {
    return this._client.delete(`/evals/${e}/runs/${r}`, n);
  }
  /**
   * Cancel an ongoing evaluation run.
   */
  cancel(e, r, n) {
    return this._client.post(`/evals/${e}/runs/${r}`, n);
  }
}
class ko extends mt {
}
ss.RunListResponsesPage = ko;
ss.OutputItems = $o;
ss.OutputItemListResponsesPage = xo;
class is extends $e {
  constructor() {
    super(...arguments), this.runs = new ss(this._client);
  }
  /**
   * Create the structure of an evaluation that can be used to test a model's
   * performance. An evaluation is a set of testing criteria and the config for a
   * data source, which dictates the schema of the data used in the evaluation. After
   * creating an evaluation, you can run it on different models and model parameters.
   * We support several types of graders and datasources. For more information, see
   * the [Evals guide](https://platform.openai.com/docs/guides/evals).
   */
  create(e, r) {
    return this._client.post("/evals", { body: e, ...r });
  }
  /**
   * Get an evaluation by ID.
   */
  retrieve(e, r) {
    return this._client.get(`/evals/${e}`, r);
  }
  /**
   * Update certain properties of an evaluation.
   */
  update(e, r, n) {
    return this._client.post(`/evals/${e}`, { body: r, ...n });
  }
  list(e = {}, r) {
    return tt(e) ? this.list({}, e) : this._client.getAPIList("/evals", Ao, { query: e, ...r });
  }
  /**
   * Delete an evaluation.
   */
  del(e, r) {
    return this._client.delete(`/evals/${e}`, r);
  }
}
class Ao extends mt {
}
is.EvalListResponsesPage = Ao;
is.Runs = ss;
is.RunListResponsesPage = ko;
let Po = class extends $e {
  /**
   * Upload a file that can be used across various endpoints. Individual files can be
   * up to 512 MB, and the size of all files uploaded by one organization can be up
   * to 100 GB.
   *
   * The Assistants API supports files up to 2 million tokens and of specific file
   * types. See the
   * [Assistants Tools guide](https://platform.openai.com/docs/assistants/tools) for
   * details.
   *
   * The Fine-tuning API only supports `.jsonl` files. The input also has certain
   * required formats for fine-tuning
   * [chat](https://platform.openai.com/docs/api-reference/fine-tuning/chat-input) or
   * [completions](https://platform.openai.com/docs/api-reference/fine-tuning/completions-input)
   * models.
   *
   * The Batch API only supports `.jsonl` files up to 200 MB in size. The input also
   * has a specific required
   * [format](https://platform.openai.com/docs/api-reference/batch/request-input).
   *
   * Please [contact us](https://help.openai.com/) if you need to increase these
   * storage limits.
   */
  create(e, r) {
    return this._client.post("/files", Yr({ body: e, ...r }));
  }
  /**
   * Returns information about a specific file.
   */
  retrieve(e, r) {
    return this._client.get(`/files/${e}`, r);
  }
  list(e = {}, r) {
    return tt(e) ? this.list({}, e) : this._client.getAPIList("/files", Co, { query: e, ...r });
  }
  /**
   * Delete a file.
   */
  del(e, r) {
    return this._client.delete(`/files/${e}`, r);
  }
  /**
   * Returns the contents of the specified file.
   */
  content(e, r) {
    return this._client.get(`/files/${e}/content`, {
      ...r,
      headers: { Accept: "application/binary", ...r == null ? void 0 : r.headers },
      __binaryResponse: !0
    });
  }
  /**
   * Returns the contents of the specified file.
   *
   * @deprecated The `.content()` method should be used instead
   */
  retrieveContent(e, r) {
    return this._client.get(`/files/${e}/content`, r);
  }
  /**
   * Waits for the given file to be processed, default timeout is 30 mins.
   */
  async waitForProcessing(e, { pollInterval: r = 5e3, maxWait: n = 30 * 60 * 1e3 } = {}) {
    const s = /* @__PURE__ */ new Set(["processed", "error", "deleted"]), i = Date.now();
    let l = await this.retrieve(e);
    for (; !l.status || !s.has(l.status); )
      if (await Hn(r), l = await this.retrieve(e), Date.now() - i > n)
        throw new lo({
          message: `Giving up on waiting for file ${e} to finish processing after ${n} milliseconds.`
        });
    return l;
  }
};
class Co extends mt {
}
Po.FileObjectsPage = Co;
class Jf extends $e {
}
let Wf = class extends $e {
  /**
   * Run a grader.
   *
   * @example
   * ```ts
   * const response = await client.fineTuning.alpha.graders.run({
   *   grader: {
   *     input: 'input',
   *     name: 'name',
   *     operation: 'eq',
   *     reference: 'reference',
   *     type: 'string_check',
   *   },
   *   model_sample: 'model_sample',
   *   reference_answer: 'string',
   * });
   * ```
   */
  run(e, r) {
    return this._client.post("/fine_tuning/alpha/graders/run", { body: e, ...r });
  }
  /**
   * Validate a grader.
   *
   * @example
   * ```ts
   * const response =
   *   await client.fineTuning.alpha.graders.validate({
   *     grader: {
   *       input: 'input',
   *       name: 'name',
   *       operation: 'eq',
   *       reference: 'reference',
   *       type: 'string_check',
   *     },
   *   });
   * ```
   */
  validate(e, r) {
    return this._client.post("/fine_tuning/alpha/graders/validate", { body: e, ...r });
  }
};
class Ro extends $e {
  constructor() {
    super(...arguments), this.graders = new Wf(this._client);
  }
}
Ro.Graders = Wf;
class To extends $e {
  /**
   * **NOTE:** Calling this endpoint requires an [admin API key](../admin-api-keys).
   *
   * This enables organization owners to share fine-tuned models with other projects
   * in their organization.
   *
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const permissionCreateResponse of client.fineTuning.checkpoints.permissions.create(
   *   'ft:gpt-4o-mini-2024-07-18:org:weather:B7R9VjQd',
   *   { project_ids: ['string'] },
   * )) {
   *   // ...
   * }
   * ```
   */
  create(e, r, n) {
    return this._client.getAPIList(`/fine_tuning/checkpoints/${e}/permissions`, Oo, { body: r, method: "post", ...n });
  }
  retrieve(e, r = {}, n) {
    return tt(r) ? this.retrieve(e, {}, r) : this._client.get(`/fine_tuning/checkpoints/${e}/permissions`, {
      query: r,
      ...n
    });
  }
  /**
   * **NOTE:** This endpoint requires an [admin API key](../admin-api-keys).
   *
   * Organization owners can use this endpoint to delete a permission for a
   * fine-tuned model checkpoint.
   *
   * @example
   * ```ts
   * const permission =
   *   await client.fineTuning.checkpoints.permissions.del(
   *     'ft:gpt-4o-mini-2024-07-18:org:weather:B7R9VjQd',
   *     'cp_zc4Q7MP6XxulcVzj4MZdwsAB',
   *   );
   * ```
   */
  del(e, r, n) {
    return this._client.delete(`/fine_tuning/checkpoints/${e}/permissions/${r}`, n);
  }
}
class Oo extends Ni {
}
To.PermissionCreateResponsesPage = Oo;
let qi = class extends $e {
  constructor() {
    super(...arguments), this.permissions = new To(this._client);
  }
};
qi.Permissions = To;
qi.PermissionCreateResponsesPage = Oo;
class No extends $e {
  list(e, r = {}, n) {
    return tt(r) ? this.list(e, {}, r) : this._client.getAPIList(`/fine_tuning/jobs/${e}/checkpoints`, Io, { query: r, ...n });
  }
}
class Io extends mt {
}
No.FineTuningJobCheckpointsPage = Io;
class kn extends $e {
  constructor() {
    super(...arguments), this.checkpoints = new No(this._client);
  }
  /**
   * Creates a fine-tuning job which begins the process of creating a new model from
   * a given dataset.
   *
   * Response includes details of the enqueued job including job status and the name
   * of the fine-tuned models once complete.
   *
   * [Learn more about fine-tuning](https://platform.openai.com/docs/guides/fine-tuning)
   *
   * @example
   * ```ts
   * const fineTuningJob = await client.fineTuning.jobs.create({
   *   model: 'gpt-4o-mini',
   *   training_file: 'file-abc123',
   * });
   * ```
   */
  create(e, r) {
    return this._client.post("/fine_tuning/jobs", { body: e, ...r });
  }
  /**
   * Get info about a fine-tuning job.
   *
   * [Learn more about fine-tuning](https://platform.openai.com/docs/guides/fine-tuning)
   *
   * @example
   * ```ts
   * const fineTuningJob = await client.fineTuning.jobs.retrieve(
   *   'ft-AF1WoRqd3aJAHsqc9NY7iL8F',
   * );
   * ```
   */
  retrieve(e, r) {
    return this._client.get(`/fine_tuning/jobs/${e}`, r);
  }
  list(e = {}, r) {
    return tt(e) ? this.list({}, e) : this._client.getAPIList("/fine_tuning/jobs", jo, { query: e, ...r });
  }
  /**
   * Immediately cancel a fine-tune job.
   *
   * @example
   * ```ts
   * const fineTuningJob = await client.fineTuning.jobs.cancel(
   *   'ft-AF1WoRqd3aJAHsqc9NY7iL8F',
   * );
   * ```
   */
  cancel(e, r) {
    return this._client.post(`/fine_tuning/jobs/${e}/cancel`, r);
  }
  listEvents(e, r = {}, n) {
    return tt(r) ? this.listEvents(e, {}, r) : this._client.getAPIList(`/fine_tuning/jobs/${e}/events`, Mo, {
      query: r,
      ...n
    });
  }
  /**
   * Pause a fine-tune job.
   *
   * @example
   * ```ts
   * const fineTuningJob = await client.fineTuning.jobs.pause(
   *   'ft-AF1WoRqd3aJAHsqc9NY7iL8F',
   * );
   * ```
   */
  pause(e, r) {
    return this._client.post(`/fine_tuning/jobs/${e}/pause`, r);
  }
  /**
   * Resume a fine-tune job.
   *
   * @example
   * ```ts
   * const fineTuningJob = await client.fineTuning.jobs.resume(
   *   'ft-AF1WoRqd3aJAHsqc9NY7iL8F',
   * );
   * ```
   */
  resume(e, r) {
    return this._client.post(`/fine_tuning/jobs/${e}/resume`, r);
  }
}
class jo extends mt {
}
class Mo extends mt {
}
kn.FineTuningJobsPage = jo;
kn.FineTuningJobEventsPage = Mo;
kn.Checkpoints = No;
kn.FineTuningJobCheckpointsPage = Io;
class Mr extends $e {
  constructor() {
    super(...arguments), this.methods = new Jf(this._client), this.jobs = new kn(this._client), this.checkpoints = new qi(this._client), this.alpha = new Ro(this._client);
  }
}
Mr.Methods = Jf;
Mr.Jobs = kn;
Mr.FineTuningJobsPage = jo;
Mr.FineTuningJobEventsPage = Mo;
Mr.Checkpoints = qi;
Mr.Alpha = Ro;
class Kf extends $e {
}
class Fo extends $e {
  constructor() {
    super(...arguments), this.graderModels = new Kf(this._client);
  }
}
Fo.GraderModels = Kf;
class Gf extends $e {
  /**
   * Creates a variation of a given image. This endpoint only supports `dall-e-2`.
   *
   * @example
   * ```ts
   * const imagesResponse = await client.images.createVariation({
   *   image: fs.createReadStream('otter.png'),
   * });
   * ```
   */
  createVariation(e, r) {
    return this._client.post("/images/variations", Yr({ body: e, ...r }));
  }
  /**
   * Creates an edited or extended image given one or more source images and a
   * prompt. This endpoint only supports `gpt-image-1` and `dall-e-2`.
   *
   * @example
   * ```ts
   * const imagesResponse = await client.images.edit({
   *   image: fs.createReadStream('path/to/file'),
   *   prompt: 'A cute baby sea otter wearing a beret',
   * });
   * ```
   */
  edit(e, r) {
    return this._client.post("/images/edits", Yr({ body: e, ...r }));
  }
  /**
   * Creates an image given a prompt.
   * [Learn more](https://platform.openai.com/docs/guides/images).
   *
   * @example
   * ```ts
   * const imagesResponse = await client.images.generate({
   *   prompt: 'A cute baby sea otter',
   * });
   * ```
   */
  generate(e, r) {
    return this._client.post("/images/generations", { body: e, ...r });
  }
}
class Do extends $e {
  /**
   * Retrieves a model instance, providing basic information about the model such as
   * the owner and permissioning.
   */
  retrieve(e, r) {
    return this._client.get(`/models/${e}`, r);
  }
  /**
   * Lists the currently available models, and provides basic information about each
   * one such as the owner and availability.
   */
  list(e) {
    return this._client.getAPIList("/models", qo, e);
  }
  /**
   * Delete a fine-tuned model. You must have the Owner role in your organization to
   * delete a model.
   */
  del(e, r) {
    return this._client.delete(`/models/${e}`, r);
  }
}
class qo extends Ni {
}
Do.ModelsPage = qo;
class Yf extends $e {
  /**
   * Classifies if text and/or image inputs are potentially harmful. Learn more in
   * the [moderation guide](https://platform.openai.com/docs/guides/moderation).
   */
  create(e, r) {
    return this._client.post("/moderations", { body: e, ...r });
  }
}
function em(t, e) {
  return !e || !rm(e) ? {
    ...t,
    output_parsed: null,
    output: t.output.map((r) => r.type === "function_call" ? {
      ...r,
      parsed_arguments: null
    } : r.type === "message" ? {
      ...r,
      content: r.content.map((n) => ({
        ...n,
        parsed: null
      }))
    } : r)
  } : Xf(t, e);
}
function Xf(t, e) {
  const r = t.output.map((s) => {
    if (s.type === "function_call")
      return {
        ...s,
        parsed_arguments: im(e, s)
      };
    if (s.type === "message") {
      const i = s.content.map((l) => l.type === "output_text" ? {
        ...l,
        parsed: tm(e, l.text)
      } : l);
      return {
        ...s,
        content: i
      };
    }
    return s;
  }), n = Object.assign({}, t, { output: r });
  return Object.getOwnPropertyDescriptor(t, "output_text") || Ga(n), Object.defineProperty(n, "output_parsed", {
    enumerable: !0,
    get() {
      for (const s of n.output)
        if (s.type === "message") {
          for (const i of s.content)
            if (i.type === "output_text" && i.parsed !== null)
              return i.parsed;
        }
      return null;
    }
  }), n;
}
function tm(t, e) {
  var r, n, s, i;
  return ((n = (r = t.text) == null ? void 0 : r.format) == null ? void 0 : n.type) !== "json_schema" ? null : "$parseRaw" in ((s = t.text) == null ? void 0 : s.format) ? ((i = t.text) == null ? void 0 : i.format).$parseRaw(e) : JSON.parse(e);
}
function rm(t) {
  var e;
  return !!po((e = t.text) == null ? void 0 : e.format);
}
function nm(t) {
  return (t == null ? void 0 : t.$brand) === "auto-parseable-tool";
}
function sm(t, e) {
  return t.find((r) => r.type === "function" && r.name === e);
}
function im(t, e) {
  const r = sm(t.tools ?? [], e.name);
  return {
    ...e,
    ...e,
    parsed_arguments: nm(r) ? r.$parseRaw(e.arguments) : r != null && r.strict ? JSON.parse(e.arguments) : null
  };
}
function Ga(t) {
  const e = [];
  for (const r of t.output)
    if (r.type === "message")
      for (const n of r.content)
        n.type === "output_text" && e.push(n.text);
  t.output_text = e.join("");
}
class Qf extends $e {
  list(e, r = {}, n) {
    return tt(r) ? this.list(e, {}, r) : this._client.getAPIList(`/responses/${e}/input_items`, om, {
      query: r,
      ...n
    });
  }
}
var rn = function(t, e, r, n, s) {
  if (n === "m") throw new TypeError("Private method is not writable");
  if (n === "a" && !s) throw new TypeError("Private accessor was defined without a setter");
  if (typeof e == "function" ? t !== e || !s : !e.has(t)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return n === "a" ? s.call(t, r) : s ? s.value = r : e.set(t, r), r;
}, kr = function(t, e, r, n) {
  if (r === "a" && !n) throw new TypeError("Private accessor was defined without a getter");
  if (typeof e == "function" ? t !== e || !n : !e.has(t)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return r === "m" ? n : r === "a" ? n.call(t) : n ? n.value : e.get(t);
}, nn, ws, Ar, _s, Pl, Cl, Rl, Tl;
class Lo extends fo {
  constructor(e) {
    super(), nn.add(this), ws.set(this, void 0), Ar.set(this, void 0), _s.set(this, void 0), rn(this, ws, e, "f");
  }
  static createResponse(e, r, n) {
    const s = new Lo(r);
    return s._run(() => s._createOrRetrieveResponse(e, r, {
      ...n,
      headers: { ...n == null ? void 0 : n.headers, "X-Stainless-Helper-Method": "stream" }
    })), s;
  }
  async _createOrRetrieveResponse(e, r, n) {
    var f;
    const s = n == null ? void 0 : n.signal;
    s && (s.aborted && this.controller.abort(), s.addEventListener("abort", () => this.controller.abort())), kr(this, nn, "m", Pl).call(this);
    let i, l = null;
    "response_id" in r ? (i = await e.responses.retrieve(r.response_id, { stream: !0 }, { ...n, signal: this.controller.signal, stream: !0 }), l = r.starting_after ?? null) : i = await e.responses.create({ ...r, stream: !0 }, { ...n, signal: this.controller.signal }), this._connected();
    for await (const d of i)
      kr(this, nn, "m", Cl).call(this, d, l);
    if ((f = i.controller.signal) != null && f.aborted)
      throw new Bt();
    return kr(this, nn, "m", Rl).call(this);
  }
  [(ws = /* @__PURE__ */ new WeakMap(), Ar = /* @__PURE__ */ new WeakMap(), _s = /* @__PURE__ */ new WeakMap(), nn = /* @__PURE__ */ new WeakSet(), Pl = function() {
    this.ended || rn(this, Ar, void 0, "f");
  }, Cl = function(r, n) {
    if (this.ended)
      return;
    const s = (l, f) => {
      (n == null || f.sequence_number > n) && this._emit(l, f);
    }, i = kr(this, nn, "m", Tl).call(this, r);
    switch (s("event", r), r.type) {
      case "response.output_text.delta": {
        const l = i.output[r.output_index];
        if (!l)
          throw new be(`missing output at index ${r.output_index}`);
        if (l.type === "message") {
          const f = l.content[r.content_index];
          if (!f)
            throw new be(`missing content at index ${r.content_index}`);
          if (f.type !== "output_text")
            throw new be(`expected content to be 'output_text', got ${f.type}`);
          s("response.output_text.delta", {
            ...r,
            snapshot: f.text
          });
        }
        break;
      }
      case "response.function_call_arguments.delta": {
        const l = i.output[r.output_index];
        if (!l)
          throw new be(`missing output at index ${r.output_index}`);
        l.type === "function_call" && s("response.function_call_arguments.delta", {
          ...r,
          snapshot: l.arguments
        });
        break;
      }
      default:
        s(r.type, r);
        break;
    }
  }, Rl = function() {
    if (this.ended)
      throw new be("stream has ended, this shouldn't happen");
    const r = kr(this, Ar, "f");
    if (!r)
      throw new be("request ended without sending any events");
    rn(this, Ar, void 0, "f");
    const n = am(r, kr(this, ws, "f"));
    return rn(this, _s, n, "f"), n;
  }, Tl = function(r) {
    let n = kr(this, Ar, "f");
    if (!n) {
      if (r.type !== "response.created")
        throw new be(`When snapshot hasn't been set yet, expected 'response.created' event, got ${r.type}`);
      return n = rn(this, Ar, r.response, "f"), n;
    }
    switch (r.type) {
      case "response.output_item.added": {
        n.output.push(r.item);
        break;
      }
      case "response.content_part.added": {
        const s = n.output[r.output_index];
        if (!s)
          throw new be(`missing output at index ${r.output_index}`);
        s.type === "message" && s.content.push(r.part);
        break;
      }
      case "response.output_text.delta": {
        const s = n.output[r.output_index];
        if (!s)
          throw new be(`missing output at index ${r.output_index}`);
        if (s.type === "message") {
          const i = s.content[r.content_index];
          if (!i)
            throw new be(`missing content at index ${r.content_index}`);
          if (i.type !== "output_text")
            throw new be(`expected content to be 'output_text', got ${i.type}`);
          i.text += r.delta;
        }
        break;
      }
      case "response.function_call_arguments.delta": {
        const s = n.output[r.output_index];
        if (!s)
          throw new be(`missing output at index ${r.output_index}`);
        s.type === "function_call" && (s.arguments += r.delta);
        break;
      }
      case "response.completed": {
        rn(this, Ar, r.response, "f");
        break;
      }
    }
    return n;
  }, Symbol.asyncIterator)]() {
    const e = [], r = [];
    let n = !1;
    return this.on("event", (s) => {
      const i = r.shift();
      i ? i.resolve(s) : e.push(s);
    }), this.on("end", () => {
      n = !0;
      for (const s of r)
        s.resolve(void 0);
      r.length = 0;
    }), this.on("abort", (s) => {
      n = !0;
      for (const i of r)
        i.reject(s);
      r.length = 0;
    }), this.on("error", (s) => {
      n = !0;
      for (const i of r)
        i.reject(s);
      r.length = 0;
    }), {
      next: async () => e.length ? { value: e.shift(), done: !1 } : n ? { value: void 0, done: !0 } : new Promise((i, l) => r.push({ resolve: i, reject: l })).then((i) => i ? { value: i, done: !1 } : { value: void 0, done: !0 }),
      return: async () => (this.abort(), { value: void 0, done: !0 })
    };
  }
  /**
   * @returns a promise that resolves with the final Response, or rejects
   * if an error occurred or the stream ended prematurely without producing a REsponse.
   */
  async finalResponse() {
    await this.done();
    const e = kr(this, _s, "f");
    if (!e)
      throw new be("stream ended without producing a ChatCompletion");
    return e;
  }
}
function am(t, e) {
  return em(t, e);
}
class Vo extends $e {
  constructor() {
    super(...arguments), this.inputItems = new Qf(this._client);
  }
  create(e, r) {
    return this._client.post("/responses", { body: e, ...r, stream: e.stream ?? !1 })._thenUnwrap((n) => ("object" in n && n.object === "response" && Ga(n), n));
  }
  retrieve(e, r = {}, n) {
    return tt(r) && n === void 0 ? this.retrieve(e, {}, r) : this._client.get(`/responses/${e}`, {
      query: r,
      ...n,
      stream: r.stream ?? !1
    })._thenUnwrap((s) => ("object" in s && s.object === "response" && Ga(s), s));
  }
  /**
   * Deletes a model response with the given ID.
   *
   * @example
   * ```ts
   * await client.responses.del(
   *   'resp_677efb5139a88190b512bc3fef8e535d',
   * );
   * ```
   */
  del(e, r) {
    return this._client.delete(`/responses/${e}`, {
      ...r,
      headers: { Accept: "*/*", ...r == null ? void 0 : r.headers }
    });
  }
  parse(e, r) {
    return this._client.responses.create(e, r)._thenUnwrap((n) => Xf(n, e));
  }
  /**
   * Creates a model response stream
   */
  stream(e, r) {
    return Lo.createResponse(this._client, e, r);
  }
  /**
   * Cancels a model response with the given ID. Only responses created with the
   * `background` parameter set to `true` can be cancelled.
   * [Learn more](https://platform.openai.com/docs/guides/background).
   *
   * @example
   * ```ts
   * await client.responses.cancel(
   *   'resp_677efb5139a88190b512bc3fef8e535d',
   * );
   * ```
   */
  cancel(e, r) {
    return this._client.post(`/responses/${e}/cancel`, {
      ...r,
      headers: { Accept: "*/*", ...r == null ? void 0 : r.headers }
    });
  }
}
class om extends mt {
}
Vo.InputItems = Qf;
class Hf extends $e {
  /**
   * Adds a
   * [Part](https://platform.openai.com/docs/api-reference/uploads/part-object) to an
   * [Upload](https://platform.openai.com/docs/api-reference/uploads/object) object.
   * A Part represents a chunk of bytes from the file you are trying to upload.
   *
   * Each Part can be at most 64 MB, and you can add Parts until you hit the Upload
   * maximum of 8 GB.
   *
   * It is possible to add multiple Parts in parallel. You can decide the intended
   * order of the Parts when you
   * [complete the Upload](https://platform.openai.com/docs/api-reference/uploads/complete).
   */
  create(e, r, n) {
    return this._client.post(`/uploads/${e}/parts`, Yr({ body: r, ...n }));
  }
}
class Uo extends $e {
  constructor() {
    super(...arguments), this.parts = new Hf(this._client);
  }
  /**
   * Creates an intermediate
   * [Upload](https://platform.openai.com/docs/api-reference/uploads/object) object
   * that you can add
   * [Parts](https://platform.openai.com/docs/api-reference/uploads/part-object) to.
   * Currently, an Upload can accept at most 8 GB in total and expires after an hour
   * after you create it.
   *
   * Once you complete the Upload, we will create a
   * [File](https://platform.openai.com/docs/api-reference/files/object) object that
   * contains all the parts you uploaded. This File is usable in the rest of our
   * platform as a regular File object.
   *
   * For certain `purpose` values, the correct `mime_type` must be specified. Please
   * refer to documentation for the
   * [supported MIME types for your use case](https://platform.openai.com/docs/assistants/tools/file-search#supported-files).
   *
   * For guidance on the proper filename extensions for each purpose, please follow
   * the documentation on
   * [creating a File](https://platform.openai.com/docs/api-reference/files/create).
   */
  create(e, r) {
    return this._client.post("/uploads", { body: e, ...r });
  }
  /**
   * Cancels the Upload. No Parts may be added after an Upload is cancelled.
   */
  cancel(e, r) {
    return this._client.post(`/uploads/${e}/cancel`, r);
  }
  /**
   * Completes the
   * [Upload](https://platform.openai.com/docs/api-reference/uploads/object).
   *
   * Within the returned Upload object, there is a nested
   * [File](https://platform.openai.com/docs/api-reference/files/object) object that
   * is ready to use in the rest of the platform.
   *
   * You can specify the order of the Parts by passing in an ordered list of the Part
   * IDs.
   *
   * The number of bytes uploaded upon completion must match the number of bytes
   * initially specified when creating the Upload object. No Parts may be added after
   * an Upload is completed.
   */
  complete(e, r, n) {
    return this._client.post(`/uploads/${e}/complete`, { body: r, ...n });
  }
}
Uo.Parts = Hf;
const lm = async (t) => {
  const e = await Promise.allSettled(t), r = e.filter((s) => s.status === "rejected");
  if (r.length) {
    for (const s of r)
      console.error(s.reason);
    throw new Error(`${r.length} promise(s) failed - see the above errors`);
  }
  const n = [];
  for (const s of e)
    s.status === "fulfilled" && n.push(s.value);
  return n;
};
class Li extends $e {
  /**
   * Create a vector store file by attaching a
   * [File](https://platform.openai.com/docs/api-reference/files) to a
   * [vector store](https://platform.openai.com/docs/api-reference/vector-stores/object).
   */
  create(e, r, n) {
    return this._client.post(`/vector_stores/${e}/files`, {
      body: r,
      ...n,
      headers: { "OpenAI-Beta": "assistants=v2", ...n == null ? void 0 : n.headers }
    });
  }
  /**
   * Retrieves a vector store file.
   */
  retrieve(e, r, n) {
    return this._client.get(`/vector_stores/${e}/files/${r}`, {
      ...n,
      headers: { "OpenAI-Beta": "assistants=v2", ...n == null ? void 0 : n.headers }
    });
  }
  /**
   * Update attributes on a vector store file.
   */
  update(e, r, n, s) {
    return this._client.post(`/vector_stores/${e}/files/${r}`, {
      body: n,
      ...s,
      headers: { "OpenAI-Beta": "assistants=v2", ...s == null ? void 0 : s.headers }
    });
  }
  list(e, r = {}, n) {
    return tt(r) ? this.list(e, {}, r) : this._client.getAPIList(`/vector_stores/${e}/files`, Vi, {
      query: r,
      ...n,
      headers: { "OpenAI-Beta": "assistants=v2", ...n == null ? void 0 : n.headers }
    });
  }
  /**
   * Delete a vector store file. This will remove the file from the vector store but
   * the file itself will not be deleted. To delete the file, use the
   * [delete file](https://platform.openai.com/docs/api-reference/files/delete)
   * endpoint.
   */
  del(e, r, n) {
    return this._client.delete(`/vector_stores/${e}/files/${r}`, {
      ...n,
      headers: { "OpenAI-Beta": "assistants=v2", ...n == null ? void 0 : n.headers }
    });
  }
  /**
   * Attach a file to the given vector store and wait for it to be processed.
   */
  async createAndPoll(e, r, n) {
    const s = await this.create(e, r, n);
    return await this.poll(e, s.id, n);
  }
  /**
   * Wait for the vector store file to finish processing.
   *
   * Note: this will return even if the file failed to process, you need to check
   * file.last_error and file.status to handle these cases
   */
  async poll(e, r, n) {
    const s = { ...n == null ? void 0 : n.headers, "X-Stainless-Poll-Helper": "true" };
    for (n != null && n.pollIntervalMs && (s["X-Stainless-Custom-Poll-Interval"] = n.pollIntervalMs.toString()); ; ) {
      const i = await this.retrieve(e, r, {
        ...n,
        headers: s
      }).withResponse(), l = i.data;
      switch (l.status) {
        case "in_progress":
          let f = 5e3;
          if (n != null && n.pollIntervalMs)
            f = n.pollIntervalMs;
          else {
            const d = i.response.headers.get("openai-poll-after-ms");
            if (d) {
              const p = parseInt(d);
              isNaN(p) || (f = p);
            }
          }
          await Hn(f);
          break;
        case "failed":
        case "completed":
          return l;
      }
    }
  }
  /**
   * Upload a file to the `files` API and then attach it to the given vector store.
   *
   * Note the file will be asynchronously processed (you can use the alternative
   * polling helper method to wait for processing to complete).
   */
  async upload(e, r, n) {
    const s = await this._client.files.create({ file: r, purpose: "assistants" }, n);
    return this.create(e, { file_id: s.id }, n);
  }
  /**
   * Add a file to a vector store and poll until processing is complete.
   */
  async uploadAndPoll(e, r, n) {
    const s = await this.upload(e, r, n);
    return await this.poll(e, s.id, n);
  }
  /**
   * Retrieve the parsed contents of a vector store file.
   */
  content(e, r, n) {
    return this._client.getAPIList(`/vector_stores/${e}/files/${r}/content`, zo, { ...n, headers: { "OpenAI-Beta": "assistants=v2", ...n == null ? void 0 : n.headers } });
  }
}
class Vi extends mt {
}
class zo extends Ni {
}
Li.VectorStoreFilesPage = Vi;
Li.FileContentResponsesPage = zo;
class eh extends $e {
  /**
   * Create a vector store file batch.
   */
  create(e, r, n) {
    return this._client.post(`/vector_stores/${e}/file_batches`, {
      body: r,
      ...n,
      headers: { "OpenAI-Beta": "assistants=v2", ...n == null ? void 0 : n.headers }
    });
  }
  /**
   * Retrieves a vector store file batch.
   */
  retrieve(e, r, n) {
    return this._client.get(`/vector_stores/${e}/file_batches/${r}`, {
      ...n,
      headers: { "OpenAI-Beta": "assistants=v2", ...n == null ? void 0 : n.headers }
    });
  }
  /**
   * Cancel a vector store file batch. This attempts to cancel the processing of
   * files in this batch as soon as possible.
   */
  cancel(e, r, n) {
    return this._client.post(`/vector_stores/${e}/file_batches/${r}/cancel`, {
      ...n,
      headers: { "OpenAI-Beta": "assistants=v2", ...n == null ? void 0 : n.headers }
    });
  }
  /**
   * Create a vector store batch and poll until all files have been processed.
   */
  async createAndPoll(e, r, n) {
    const s = await this.create(e, r);
    return await this.poll(e, s.id, n);
  }
  listFiles(e, r, n = {}, s) {
    return tt(n) ? this.listFiles(e, r, {}, n) : this._client.getAPIList(`/vector_stores/${e}/file_batches/${r}/files`, Vi, { query: n, ...s, headers: { "OpenAI-Beta": "assistants=v2", ...s == null ? void 0 : s.headers } });
  }
  /**
   * Wait for the given file batch to be processed.
   *
   * Note: this will return even if one of the files failed to process, you need to
   * check batch.file_counts.failed_count to handle this case.
   */
  async poll(e, r, n) {
    const s = { ...n == null ? void 0 : n.headers, "X-Stainless-Poll-Helper": "true" };
    for (n != null && n.pollIntervalMs && (s["X-Stainless-Custom-Poll-Interval"] = n.pollIntervalMs.toString()); ; ) {
      const { data: i, response: l } = await this.retrieve(e, r, {
        ...n,
        headers: s
      }).withResponse();
      switch (i.status) {
        case "in_progress":
          let f = 5e3;
          if (n != null && n.pollIntervalMs)
            f = n.pollIntervalMs;
          else {
            const d = l.headers.get("openai-poll-after-ms");
            if (d) {
              const p = parseInt(d);
              isNaN(p) || (f = p);
            }
          }
          await Hn(f);
          break;
        case "failed":
        case "cancelled":
        case "completed":
          return i;
      }
    }
  }
  /**
   * Uploads the given files concurrently and then creates a vector store file batch.
   *
   * The concurrency limit is configurable using the `maxConcurrency` parameter.
   */
  async uploadAndPoll(e, { files: r, fileIds: n = [] }, s) {
    if (r == null || r.length == 0)
      throw new Error("No `files` provided to process. If you've already uploaded files you should use `.createAndPoll()` instead");
    const i = (s == null ? void 0 : s.maxConcurrency) ?? 5, l = Math.min(i, r.length), f = this._client, d = r.values(), p = [...n];
    async function g(P) {
      for (let x of P) {
        const T = await f.files.create({ file: x, purpose: "assistants" }, s);
        p.push(T.id);
      }
    }
    const w = Array(l).fill(d).map(g);
    return await lm(w), await this.createAndPoll(e, {
      file_ids: p
    });
  }
}
class Fr extends $e {
  constructor() {
    super(...arguments), this.files = new Li(this._client), this.fileBatches = new eh(this._client);
  }
  /**
   * Create a vector store.
   */
  create(e, r) {
    return this._client.post("/vector_stores", {
      body: e,
      ...r,
      headers: { "OpenAI-Beta": "assistants=v2", ...r == null ? void 0 : r.headers }
    });
  }
  /**
   * Retrieves a vector store.
   */
  retrieve(e, r) {
    return this._client.get(`/vector_stores/${e}`, {
      ...r,
      headers: { "OpenAI-Beta": "assistants=v2", ...r == null ? void 0 : r.headers }
    });
  }
  /**
   * Modifies a vector store.
   */
  update(e, r, n) {
    return this._client.post(`/vector_stores/${e}`, {
      body: r,
      ...n,
      headers: { "OpenAI-Beta": "assistants=v2", ...n == null ? void 0 : n.headers }
    });
  }
  list(e = {}, r) {
    return tt(e) ? this.list({}, e) : this._client.getAPIList("/vector_stores", Bo, {
      query: e,
      ...r,
      headers: { "OpenAI-Beta": "assistants=v2", ...r == null ? void 0 : r.headers }
    });
  }
  /**
   * Delete a vector store.
   */
  del(e, r) {
    return this._client.delete(`/vector_stores/${e}`, {
      ...r,
      headers: { "OpenAI-Beta": "assistants=v2", ...r == null ? void 0 : r.headers }
    });
  }
  /**
   * Search a vector store for relevant chunks based on a query and file attributes
   * filter.
   */
  search(e, r, n) {
    return this._client.getAPIList(`/vector_stores/${e}/search`, Zo, {
      body: r,
      method: "post",
      ...n,
      headers: { "OpenAI-Beta": "assistants=v2", ...n == null ? void 0 : n.headers }
    });
  }
}
class Bo extends mt {
}
class Zo extends Ni {
}
Fr.VectorStoresPage = Bo;
Fr.VectorStoreSearchResponsesPage = Zo;
Fr.Files = Li;
Fr.VectorStoreFilesPage = Vi;
Fr.FileContentResponsesPage = zo;
Fr.FileBatches = eh;
var th;
class Pe extends Cd {
  /**
   * API Client for interfacing with the OpenAI API.
   *
   * @param {string | undefined} [opts.apiKey=process.env['OPENAI_API_KEY'] ?? undefined]
   * @param {string | null | undefined} [opts.organization=process.env['OPENAI_ORG_ID'] ?? null]
   * @param {string | null | undefined} [opts.project=process.env['OPENAI_PROJECT_ID'] ?? null]
   * @param {string} [opts.baseURL=process.env['OPENAI_BASE_URL'] ?? https://api.openai.com/v1] - Override the default base URL for the API.
   * @param {number} [opts.timeout=10 minutes] - The maximum amount of time (in milliseconds) the client will wait for a response before timing out.
   * @param {number} [opts.httpAgent] - An HTTP agent used to manage HTTP(s) connections.
   * @param {Core.Fetch} [opts.fetch] - Specify a custom `fetch` function implementation.
   * @param {number} [opts.maxRetries=2] - The maximum number of times the client will retry a request.
   * @param {Core.Headers} opts.defaultHeaders - Default headers to include with every request to the API.
   * @param {Core.DefaultQuery} opts.defaultQuery - Default query parameters to include with every request to the API.
   * @param {boolean} [opts.dangerouslyAllowBrowser=false] - By default, client-side use of this library is not allowed, as it risks exposing your secret API credentials to attackers.
   */
  constructor({ baseURL: e = Wr("OPENAI_BASE_URL"), apiKey: r = Wr("OPENAI_API_KEY"), organization: n = Wr("OPENAI_ORG_ID") ?? null, project: s = Wr("OPENAI_PROJECT_ID") ?? null, ...i } = {}) {
    if (r === void 0)
      throw new be("The OPENAI_API_KEY environment variable is missing or empty; either provide it, or instantiate the OpenAI client with an apiKey option, like new OpenAI({ apiKey: 'My API Key' }).");
    const l = {
      apiKey: r,
      organization: n,
      project: s,
      ...i,
      baseURL: e || "https://api.openai.com/v1"
    };
    if (!l.dangerouslyAllowBrowser && qd())
      throw new be(`It looks like you're running in a browser-like environment.

This is disabled by default, as it risks exposing your secret API credentials to attackers.
If you understand the risks and have appropriate mitigations in place,
you can set the \`dangerouslyAllowBrowser\` option to \`true\`, e.g.,

new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety
`);
    super({
      baseURL: l.baseURL,
      timeout: l.timeout ?? 6e5,
      httpAgent: l.httpAgent,
      maxRetries: l.maxRetries,
      fetch: l.fetch
    }), this.completions = new zf(this), this.chat = new Mi(this), this.embeddings = new Zf(this), this.files = new Po(this), this.images = new Gf(this), this.audio = new es(this), this.moderations = new Yf(this), this.models = new Do(this), this.fineTuning = new Mr(this), this.graders = new Fo(this), this.vectorStores = new Fr(this), this.beta = new xn(this), this.batches = new co(this), this.uploads = new Uo(this), this.responses = new Vo(this), this.evals = new is(this), this.containers = new ns(this), this._options = l, this.apiKey = r, this.organization = n, this.project = s;
  }
  defaultQuery() {
    return this._options.defaultQuery;
  }
  defaultHeaders(e) {
    return {
      ...super.defaultHeaders(e),
      "OpenAI-Organization": this.organization,
      "OpenAI-Project": this.project,
      ...this._options.defaultHeaders
    };
  }
  authHeaders(e) {
    return { Authorization: `Bearer ${this.apiKey}` };
  }
  stringifyQuery(e) {
    return fd(e, { arrayFormat: "brackets" });
  }
}
th = Pe;
Pe.OpenAI = th;
Pe.DEFAULT_TIMEOUT = 6e5;
Pe.OpenAIError = be;
Pe.APIError = Et;
Pe.APIConnectionError = Ci;
Pe.APIConnectionTimeoutError = lo;
Pe.APIUserAbortError = Bt;
Pe.NotFoundError = Hu;
Pe.ConflictError = ef;
Pe.RateLimitError = rf;
Pe.BadRequestError = Yu;
Pe.AuthenticationError = Xu;
Pe.InternalServerError = nf;
Pe.PermissionDeniedError = Qu;
Pe.UnprocessableEntityError = tf;
Pe.toFile = uf;
Pe.fileFromPath = Wu;
Pe.Completions = zf;
Pe.Chat = Mi;
Pe.ChatCompletionsPage = ji;
Pe.Embeddings = Zf;
Pe.Files = Po;
Pe.FileObjectsPage = Co;
Pe.Images = Gf;
Pe.Audio = es;
Pe.Moderations = Yf;
Pe.Models = Do;
Pe.ModelsPage = qo;
Pe.FineTuning = Mr;
Pe.Graders = Fo;
Pe.VectorStores = Fr;
Pe.VectorStoresPage = Bo;
Pe.VectorStoreSearchResponsesPage = Zo;
Pe.Beta = xn;
Pe.Batches = co;
Pe.BatchesPage = uo;
Pe.Uploads = Uo;
Pe.Responses = Vo;
Pe.Evals = is;
Pe.EvalListResponsesPage = Ao;
Pe.Containers = ns;
Pe.ContainerListResponsesPage = Eo;
class cm extends Pe {
  /**
   * API Client for interfacing with the Azure OpenAI API.
   *
   * @param {string | undefined} [opts.apiVersion=process.env['OPENAI_API_VERSION'] ?? undefined]
   * @param {string | undefined} [opts.endpoint=process.env['AZURE_OPENAI_ENDPOINT'] ?? undefined] - Your Azure endpoint, including the resource, e.g. `https://example-resource.azure.openai.com/`
   * @param {string | undefined} [opts.apiKey=process.env['AZURE_OPENAI_API_KEY'] ?? undefined]
   * @param {string | undefined} opts.deployment - A model deployment, if given, sets the base client URL to include `/deployments/{deployment}`.
   * @param {string | null | undefined} [opts.organization=process.env['OPENAI_ORG_ID'] ?? null]
   * @param {string} [opts.baseURL=process.env['OPENAI_BASE_URL']] - Sets the base URL for the API, e.g. `https://example-resource.azure.openai.com/openai/`.
   * @param {number} [opts.timeout=10 minutes] - The maximum amount of time (in milliseconds) the client will wait for a response before timing out.
   * @param {number} [opts.httpAgent] - An HTTP agent used to manage HTTP(s) connections.
   * @param {Core.Fetch} [opts.fetch] - Specify a custom `fetch` function implementation.
   * @param {number} [opts.maxRetries=2] - The maximum number of times the client will retry a request.
   * @param {Core.Headers} opts.defaultHeaders - Default headers to include with every request to the API.
   * @param {Core.DefaultQuery} opts.defaultQuery - Default query parameters to include with every request to the API.
   * @param {boolean} [opts.dangerouslyAllowBrowser=false] - By default, client-side use of this library is not allowed, as it risks exposing your secret API credentials to attackers.
   */
  constructor({ baseURL: e = Wr("OPENAI_BASE_URL"), apiKey: r = Wr("AZURE_OPENAI_API_KEY"), apiVersion: n = Wr("OPENAI_API_VERSION"), endpoint: s, deployment: i, azureADTokenProvider: l, dangerouslyAllowBrowser: f, ...d } = {}) {
    if (!n)
      throw new be("The OPENAI_API_VERSION environment variable is missing or empty; either provide it, or instantiate the AzureOpenAI client with an apiVersion option, like new AzureOpenAI({ apiVersion: 'My API Version' }).");
    if (typeof l == "function" && (f = !0), !l && !r)
      throw new be("Missing credentials. Please pass one of `apiKey` and `azureADTokenProvider`, or set the `AZURE_OPENAI_API_KEY` environment variable.");
    if (l && r)
      throw new be("The `apiKey` and `azureADTokenProvider` arguments are mutually exclusive; only one can be passed at a time.");
    if (r ?? (r = Ol), d.defaultQuery = { ...d.defaultQuery, "api-version": n }, e) {
      if (s)
        throw new be("baseURL and endpoint are mutually exclusive");
    } else {
      if (s || (s = process.env.AZURE_OPENAI_ENDPOINT), !s)
        throw new be("Must provide one of the `baseURL` or `endpoint` arguments, or the `AZURE_OPENAI_ENDPOINT` environment variable");
      e = `${s}/openai`;
    }
    super({
      apiKey: r,
      baseURL: e,
      ...d,
      ...f !== void 0 ? { dangerouslyAllowBrowser: f } : {}
    }), this.apiVersion = "", this._azureADTokenProvider = l, this.apiVersion = n, this.deploymentName = i;
  }
  buildRequest(e, r = {}) {
    var n;
    if (um.has(e.path) && e.method === "post" && e.body !== void 0) {
      if (!si(e.body))
        throw new Error("Expected request body to be an object");
      const s = this.deploymentName || e.body.model || ((n = e.__metadata) == null ? void 0 : n.model);
      s !== void 0 && !this.baseURL.includes("/deployments") && (e.path = `/deployments/${s}${e.path}`);
    }
    return super.buildRequest(e, r);
  }
  async _getAzureADToken() {
    if (typeof this._azureADTokenProvider == "function") {
      const e = await this._azureADTokenProvider();
      if (!e || typeof e != "string")
        throw new be(`Expected 'azureADTokenProvider' argument to return a string but it returned ${e}`);
      return e;
    }
  }
  authHeaders(e) {
    return {};
  }
  async prepareOptions(e) {
    var n;
    if ((n = e.headers) != null && n["api-key"])
      return super.prepareOptions(e);
    const r = await this._getAzureADToken();
    if (e.headers ?? (e.headers = {}), r)
      e.headers.Authorization = `Bearer ${r}`;
    else if (this.apiKey !== Ol)
      e.headers["api-key"] = this.apiKey;
    else
      throw new be("Unable to handle auth");
    return super.prepareOptions(e);
  }
}
const um = /* @__PURE__ */ new Set([
  "/completions",
  "/chat/completions",
  "/embeddings",
  "/audio/transcriptions",
  "/audio/translations",
  "/audio/speech",
  "/images/generations"
]), Ol = "<Missing Key>";
var Ve;
(function(t) {
  t.assertEqual = (s) => {
  };
  function e(s) {
  }
  t.assertIs = e;
  function r(s) {
    throw new Error();
  }
  t.assertNever = r, t.arrayToEnum = (s) => {
    const i = {};
    for (const l of s)
      i[l] = l;
    return i;
  }, t.getValidEnumValues = (s) => {
    const i = t.objectKeys(s).filter((f) => typeof s[s[f]] != "number"), l = {};
    for (const f of i)
      l[f] = s[f];
    return t.objectValues(l);
  }, t.objectValues = (s) => t.objectKeys(s).map(function(i) {
    return s[i];
  }), t.objectKeys = typeof Object.keys == "function" ? (s) => Object.keys(s) : (s) => {
    const i = [];
    for (const l in s)
      Object.prototype.hasOwnProperty.call(s, l) && i.push(l);
    return i;
  }, t.find = (s, i) => {
    for (const l of s)
      if (i(l))
        return l;
  }, t.isInteger = typeof Number.isInteger == "function" ? (s) => Number.isInteger(s) : (s) => typeof s == "number" && Number.isFinite(s) && Math.floor(s) === s;
  function n(s, i = " | ") {
    return s.map((l) => typeof l == "string" ? `'${l}'` : l).join(i);
  }
  t.joinValues = n, t.jsonStringifyReplacer = (s, i) => typeof i == "bigint" ? i.toString() : i;
})(Ve || (Ve = {}));
var Nl;
(function(t) {
  t.mergeShapes = (e, r) => ({
    ...e,
    ...r
    // second overwrites first
  });
})(Nl || (Nl = {}));
const pe = Ve.arrayToEnum([
  "string",
  "nan",
  "number",
  "integer",
  "float",
  "boolean",
  "date",
  "bigint",
  "symbol",
  "function",
  "undefined",
  "null",
  "array",
  "object",
  "unknown",
  "promise",
  "void",
  "never",
  "map",
  "set"
]), Cr = (t) => {
  switch (typeof t) {
    case "undefined":
      return pe.undefined;
    case "string":
      return pe.string;
    case "number":
      return Number.isNaN(t) ? pe.nan : pe.number;
    case "boolean":
      return pe.boolean;
    case "function":
      return pe.function;
    case "bigint":
      return pe.bigint;
    case "symbol":
      return pe.symbol;
    case "object":
      return Array.isArray(t) ? pe.array : t === null ? pe.null : t.then && typeof t.then == "function" && t.catch && typeof t.catch == "function" ? pe.promise : typeof Map < "u" && t instanceof Map ? pe.map : typeof Set < "u" && t instanceof Set ? pe.set : typeof Date < "u" && t instanceof Date ? pe.date : pe.object;
    default:
      return pe.unknown;
  }
}, ie = Ve.arrayToEnum([
  "invalid_type",
  "invalid_literal",
  "custom",
  "invalid_union",
  "invalid_union_discriminator",
  "invalid_enum_value",
  "unrecognized_keys",
  "invalid_arguments",
  "invalid_return_type",
  "invalid_date",
  "invalid_string",
  "too_small",
  "too_big",
  "invalid_intersection_types",
  "not_multiple_of",
  "not_finite"
]);
class Er extends Error {
  get errors() {
    return this.issues;
  }
  constructor(e) {
    super(), this.issues = [], this.addIssue = (n) => {
      this.issues = [...this.issues, n];
    }, this.addIssues = (n = []) => {
      this.issues = [...this.issues, ...n];
    };
    const r = new.target.prototype;
    Object.setPrototypeOf ? Object.setPrototypeOf(this, r) : this.__proto__ = r, this.name = "ZodError", this.issues = e;
  }
  format(e) {
    const r = e || function(i) {
      return i.message;
    }, n = { _errors: [] }, s = (i) => {
      for (const l of i.issues)
        if (l.code === "invalid_union")
          l.unionErrors.map(s);
        else if (l.code === "invalid_return_type")
          s(l.returnTypeError);
        else if (l.code === "invalid_arguments")
          s(l.argumentsError);
        else if (l.path.length === 0)
          n._errors.push(r(l));
        else {
          let f = n, d = 0;
          for (; d < l.path.length; ) {
            const p = l.path[d];
            d === l.path.length - 1 ? (f[p] = f[p] || { _errors: [] }, f[p]._errors.push(r(l))) : f[p] = f[p] || { _errors: [] }, f = f[p], d++;
          }
        }
    };
    return s(this), n;
  }
  static assert(e) {
    if (!(e instanceof Er))
      throw new Error(`Not a ZodError: ${e}`);
  }
  toString() {
    return this.message;
  }
  get message() {
    return JSON.stringify(this.issues, Ve.jsonStringifyReplacer, 2);
  }
  get isEmpty() {
    return this.issues.length === 0;
  }
  flatten(e = (r) => r.message) {
    const r = {}, n = [];
    for (const s of this.issues)
      s.path.length > 0 ? (r[s.path[0]] = r[s.path[0]] || [], r[s.path[0]].push(e(s))) : n.push(e(s));
    return { formErrors: n, fieldErrors: r };
  }
  get formErrors() {
    return this.flatten();
  }
}
Er.create = (t) => new Er(t);
const Ya = (t, e) => {
  let r;
  switch (t.code) {
    case ie.invalid_type:
      t.received === pe.undefined ? r = "Required" : r = `Expected ${t.expected}, received ${t.received}`;
      break;
    case ie.invalid_literal:
      r = `Invalid literal value, expected ${JSON.stringify(t.expected, Ve.jsonStringifyReplacer)}`;
      break;
    case ie.unrecognized_keys:
      r = `Unrecognized key(s) in object: ${Ve.joinValues(t.keys, ", ")}`;
      break;
    case ie.invalid_union:
      r = "Invalid input";
      break;
    case ie.invalid_union_discriminator:
      r = `Invalid discriminator value. Expected ${Ve.joinValues(t.options)}`;
      break;
    case ie.invalid_enum_value:
      r = `Invalid enum value. Expected ${Ve.joinValues(t.options)}, received '${t.received}'`;
      break;
    case ie.invalid_arguments:
      r = "Invalid function arguments";
      break;
    case ie.invalid_return_type:
      r = "Invalid function return type";
      break;
    case ie.invalid_date:
      r = "Invalid date";
      break;
    case ie.invalid_string:
      typeof t.validation == "object" ? "includes" in t.validation ? (r = `Invalid input: must include "${t.validation.includes}"`, typeof t.validation.position == "number" && (r = `${r} at one or more positions greater than or equal to ${t.validation.position}`)) : "startsWith" in t.validation ? r = `Invalid input: must start with "${t.validation.startsWith}"` : "endsWith" in t.validation ? r = `Invalid input: must end with "${t.validation.endsWith}"` : Ve.assertNever(t.validation) : t.validation !== "regex" ? r = `Invalid ${t.validation}` : r = "Invalid";
      break;
    case ie.too_small:
      t.type === "array" ? r = `Array must contain ${t.exact ? "exactly" : t.inclusive ? "at least" : "more than"} ${t.minimum} element(s)` : t.type === "string" ? r = `String must contain ${t.exact ? "exactly" : t.inclusive ? "at least" : "over"} ${t.minimum} character(s)` : t.type === "number" ? r = `Number must be ${t.exact ? "exactly equal to " : t.inclusive ? "greater than or equal to " : "greater than "}${t.minimum}` : t.type === "date" ? r = `Date must be ${t.exact ? "exactly equal to " : t.inclusive ? "greater than or equal to " : "greater than "}${new Date(Number(t.minimum))}` : r = "Invalid input";
      break;
    case ie.too_big:
      t.type === "array" ? r = `Array must contain ${t.exact ? "exactly" : t.inclusive ? "at most" : "less than"} ${t.maximum} element(s)` : t.type === "string" ? r = `String must contain ${t.exact ? "exactly" : t.inclusive ? "at most" : "under"} ${t.maximum} character(s)` : t.type === "number" ? r = `Number must be ${t.exact ? "exactly" : t.inclusive ? "less than or equal to" : "less than"} ${t.maximum}` : t.type === "bigint" ? r = `BigInt must be ${t.exact ? "exactly" : t.inclusive ? "less than or equal to" : "less than"} ${t.maximum}` : t.type === "date" ? r = `Date must be ${t.exact ? "exactly" : t.inclusive ? "smaller than or equal to" : "smaller than"} ${new Date(Number(t.maximum))}` : r = "Invalid input";
      break;
    case ie.custom:
      r = "Invalid input";
      break;
    case ie.invalid_intersection_types:
      r = "Intersection results could not be merged";
      break;
    case ie.not_multiple_of:
      r = `Number must be a multiple of ${t.multipleOf}`;
      break;
    case ie.not_finite:
      r = "Number must be finite";
      break;
    default:
      r = e.defaultError, Ve.assertNever(t);
  }
  return { message: r };
};
let fm = Ya;
function hm() {
  return fm;
}
const dm = (t) => {
  const { data: e, path: r, errorMaps: n, issueData: s } = t, i = [...r, ...s.path || []], l = {
    ...s,
    path: i
  };
  if (s.message !== void 0)
    return {
      ...s,
      path: i,
      message: s.message
    };
  let f = "";
  const d = n.filter((p) => !!p).slice().reverse();
  for (const p of d)
    f = p(l, { data: e, defaultError: f }).message;
  return {
    ...s,
    path: i,
    message: f
  };
};
function he(t, e) {
  const r = hm(), n = dm({
    issueData: e,
    data: t.data,
    path: t.path,
    errorMaps: [
      t.common.contextualErrorMap,
      // contextual error map is first priority
      t.schemaErrorMap,
      // then schema-bound map if available
      r,
      // then global override map
      r === Ya ? void 0 : Ya
      // then global default map
    ].filter((s) => !!s)
  });
  t.common.issues.push(n);
}
class Nt {
  constructor() {
    this.value = "valid";
  }
  dirty() {
    this.value === "valid" && (this.value = "dirty");
  }
  abort() {
    this.value !== "aborted" && (this.value = "aborted");
  }
  static mergeArray(e, r) {
    const n = [];
    for (const s of r) {
      if (s.status === "aborted")
        return Re;
      s.status === "dirty" && e.dirty(), n.push(s.value);
    }
    return { status: e.value, value: n };
  }
  static async mergeObjectAsync(e, r) {
    const n = [];
    for (const s of r) {
      const i = await s.key, l = await s.value;
      n.push({
        key: i,
        value: l
      });
    }
    return Nt.mergeObjectSync(e, n);
  }
  static mergeObjectSync(e, r) {
    const n = {};
    for (const s of r) {
      const { key: i, value: l } = s;
      if (i.status === "aborted" || l.status === "aborted")
        return Re;
      i.status === "dirty" && e.dirty(), l.status === "dirty" && e.dirty(), i.value !== "__proto__" && (typeof l.value < "u" || s.alwaysSet) && (n[i.value] = l.value);
    }
    return { status: e.value, value: n };
  }
}
const Re = Object.freeze({
  status: "aborted"
}), Vn = (t) => ({ status: "dirty", value: t }), Jt = (t) => ({ status: "valid", value: t }), Il = (t) => t.status === "aborted", jl = (t) => t.status === "dirty", gn = (t) => t.status === "valid", pi = (t) => typeof Promise < "u" && t instanceof Promise;
var we;
(function(t) {
  t.errToObj = (e) => typeof e == "string" ? { message: e } : e || {}, t.toString = (e) => typeof e == "string" ? e : e == null ? void 0 : e.message;
})(we || (we = {}));
var gi = function(t, e, r, n) {
  if (r === "a" && !n) throw new TypeError("Private accessor was defined without a getter");
  if (typeof e == "function" ? t !== e || !n : !e.has(t)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return r === "m" ? n : r === "a" ? n.call(t) : n ? n.value : e.get(t);
}, rh = function(t, e, r, n, s) {
  if (n === "m") throw new TypeError("Private method is not writable");
  if (n === "a" && !s) throw new TypeError("Private accessor was defined without a setter");
  if (typeof e == "function" ? t !== e || !s : !e.has(t)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return n === "a" ? s.call(t, r) : s ? s.value = r : e.set(t, r), r;
}, Un, zn;
class hr {
  constructor(e, r, n, s) {
    this._cachedPath = [], this.parent = e, this.data = r, this._path = n, this._key = s;
  }
  get path() {
    return this._cachedPath.length || (Array.isArray(this._key) ? this._cachedPath.push(...this._path, ...this._key) : this._cachedPath.push(...this._path, this._key)), this._cachedPath;
  }
}
const Ml = (t, e) => {
  if (gn(e))
    return { success: !0, data: e.value };
  if (!t.common.issues.length)
    throw new Error("Validation failed but no issues detected.");
  return {
    success: !1,
    get error() {
      if (this._error)
        return this._error;
      const r = new Er(t.common.issues);
      return this._error = r, this._error;
    }
  };
};
function Oe(t) {
  if (!t)
    return {};
  const { errorMap: e, invalid_type_error: r, required_error: n, description: s } = t;
  if (e && (r || n))
    throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
  return e ? { errorMap: e, description: s } : { errorMap: (l, f) => {
    const { message: d } = t;
    return l.code === "invalid_enum_value" ? { message: d ?? f.defaultError } : typeof f.data > "u" ? { message: d ?? n ?? f.defaultError } : l.code !== "invalid_type" ? { message: f.defaultError } : { message: d ?? r ?? f.defaultError };
  }, description: s };
}
class De {
  get description() {
    return this._def.description;
  }
  _getType(e) {
    return Cr(e.data);
  }
  _getOrReturnCtx(e, r) {
    return r || {
      common: e.parent.common,
      data: e.data,
      parsedType: Cr(e.data),
      schemaErrorMap: this._def.errorMap,
      path: e.path,
      parent: e.parent
    };
  }
  _processInputParams(e) {
    return {
      status: new Nt(),
      ctx: {
        common: e.parent.common,
        data: e.data,
        parsedType: Cr(e.data),
        schemaErrorMap: this._def.errorMap,
        path: e.path,
        parent: e.parent
      }
    };
  }
  _parseSync(e) {
    const r = this._parse(e);
    if (pi(r))
      throw new Error("Synchronous parse encountered promise.");
    return r;
  }
  _parseAsync(e) {
    const r = this._parse(e);
    return Promise.resolve(r);
  }
  parse(e, r) {
    const n = this.safeParse(e, r);
    if (n.success)
      return n.data;
    throw n.error;
  }
  safeParse(e, r) {
    const n = {
      common: {
        issues: [],
        async: (r == null ? void 0 : r.async) ?? !1,
        contextualErrorMap: r == null ? void 0 : r.errorMap
      },
      path: (r == null ? void 0 : r.path) || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data: e,
      parsedType: Cr(e)
    }, s = this._parseSync({ data: e, path: n.path, parent: n });
    return Ml(n, s);
  }
  "~validate"(e) {
    var n, s;
    const r = {
      common: {
        issues: [],
        async: !!this["~standard"].async
      },
      path: [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data: e,
      parsedType: Cr(e)
    };
    if (!this["~standard"].async)
      try {
        const i = this._parseSync({ data: e, path: [], parent: r });
        return gn(i) ? {
          value: i.value
        } : {
          issues: r.common.issues
        };
      } catch (i) {
        (s = (n = i == null ? void 0 : i.message) == null ? void 0 : n.toLowerCase()) != null && s.includes("encountered") && (this["~standard"].async = !0), r.common = {
          issues: [],
          async: !0
        };
      }
    return this._parseAsync({ data: e, path: [], parent: r }).then((i) => gn(i) ? {
      value: i.value
    } : {
      issues: r.common.issues
    });
  }
  async parseAsync(e, r) {
    const n = await this.safeParseAsync(e, r);
    if (n.success)
      return n.data;
    throw n.error;
  }
  async safeParseAsync(e, r) {
    const n = {
      common: {
        issues: [],
        contextualErrorMap: r == null ? void 0 : r.errorMap,
        async: !0
      },
      path: (r == null ? void 0 : r.path) || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data: e,
      parsedType: Cr(e)
    }, s = this._parse({ data: e, path: n.path, parent: n }), i = await (pi(s) ? s : Promise.resolve(s));
    return Ml(n, i);
  }
  refine(e, r) {
    const n = (s) => typeof r == "string" || typeof r > "u" ? { message: r } : typeof r == "function" ? r(s) : r;
    return this._refinement((s, i) => {
      const l = e(s), f = () => i.addIssue({
        code: ie.custom,
        ...n(s)
      });
      return typeof Promise < "u" && l instanceof Promise ? l.then((d) => d ? !0 : (f(), !1)) : l ? !0 : (f(), !1);
    });
  }
  refinement(e, r) {
    return this._refinement((n, s) => e(n) ? !0 : (s.addIssue(typeof r == "function" ? r(n, s) : r), !1));
  }
  _refinement(e) {
    return new _n({
      schema: this,
      typeName: oe.ZodEffects,
      effect: { type: "refinement", refinement: e }
    });
  }
  superRefine(e) {
    return this._refinement(e);
  }
  constructor(e) {
    this.spa = this.safeParseAsync, this._def = e, this.parse = this.parse.bind(this), this.safeParse = this.safeParse.bind(this), this.parseAsync = this.parseAsync.bind(this), this.safeParseAsync = this.safeParseAsync.bind(this), this.spa = this.spa.bind(this), this.refine = this.refine.bind(this), this.refinement = this.refinement.bind(this), this.superRefine = this.superRefine.bind(this), this.optional = this.optional.bind(this), this.nullable = this.nullable.bind(this), this.nullish = this.nullish.bind(this), this.array = this.array.bind(this), this.promise = this.promise.bind(this), this.or = this.or.bind(this), this.and = this.and.bind(this), this.transform = this.transform.bind(this), this.brand = this.brand.bind(this), this.default = this.default.bind(this), this.catch = this.catch.bind(this), this.describe = this.describe.bind(this), this.pipe = this.pipe.bind(this), this.readonly = this.readonly.bind(this), this.isNullable = this.isNullable.bind(this), this.isOptional = this.isOptional.bind(this), this["~standard"] = {
      version: 1,
      vendor: "zod",
      validate: (r) => this["~validate"](r)
    };
  }
  optional() {
    return br.create(this, this._def);
  }
  nullable() {
    return vn.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return ur.create(this);
  }
  promise() {
    return bi.create(this, this._def);
  }
  or(e) {
    return wi.create([this, e], this._def);
  }
  and(e) {
    return _i.create(this, e, this._def);
  }
  transform(e) {
    return new _n({
      ...Oe(this._def),
      schema: this,
      typeName: oe.ZodEffects,
      effect: { type: "transform", transform: e }
    });
  }
  default(e) {
    const r = typeof e == "function" ? e : () => e;
    return new Ha({
      ...Oe(this._def),
      innerType: this,
      defaultValue: r,
      typeName: oe.ZodDefault
    });
  }
  brand() {
    return new Mm({
      typeName: oe.ZodBranded,
      type: this,
      ...Oe(this._def)
    });
  }
  catch(e) {
    const r = typeof e == "function" ? e : () => e;
    return new eo({
      ...Oe(this._def),
      innerType: this,
      catchValue: r,
      typeName: oe.ZodCatch
    });
  }
  describe(e) {
    const r = this.constructor;
    return new r({
      ...this._def,
      description: e
    });
  }
  pipe(e) {
    return Jo.create(this, e);
  }
  readonly() {
    return to.create(this);
  }
  isOptional() {
    return this.safeParse(void 0).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
}
const mm = /^c[^\s-]{8,}$/i, pm = /^[0-9a-z]+$/, gm = /^[0-9A-HJKMNP-TV-Z]{26}$/i, ym = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i, wm = /^[a-z0-9_-]{21}$/i, _m = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/, vm = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/, bm = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i, Sm = "^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$";
let ua;
const Em = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/, $m = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/, xm = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/, km = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/, Am = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/, Pm = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/, nh = "((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))", Cm = new RegExp(`^${nh}$`);
function sh(t) {
  let e = "[0-5]\\d";
  t.precision ? e = `${e}\\.\\d{${t.precision}}` : t.precision == null && (e = `${e}(\\.\\d+)?`);
  const r = t.precision ? "+" : "?";
  return `([01]\\d|2[0-3]):[0-5]\\d(:${e})${r}`;
}
function Rm(t) {
  return new RegExp(`^${sh(t)}$`);
}
function Tm(t) {
  let e = `${nh}T${sh(t)}`;
  const r = [];
  return r.push(t.local ? "Z?" : "Z"), t.offset && r.push("([+-]\\d{2}:?\\d{2})"), e = `${e}(${r.join("|")})`, new RegExp(`^${e}$`);
}
function Om(t, e) {
  return !!((e === "v4" || !e) && Em.test(t) || (e === "v6" || !e) && xm.test(t));
}
function Nm(t, e) {
  if (!_m.test(t))
    return !1;
  try {
    const [r] = t.split("."), n = r.replace(/-/g, "+").replace(/_/g, "/").padEnd(r.length + (4 - r.length % 4) % 4, "="), s = JSON.parse(atob(n));
    return !(typeof s != "object" || s === null || "typ" in s && (s == null ? void 0 : s.typ) !== "JWT" || !s.alg || e && s.alg !== e);
  } catch {
    return !1;
  }
}
function Im(t, e) {
  return !!((e === "v4" || !e) && $m.test(t) || (e === "v6" || !e) && km.test(t));
}
class vr extends De {
  _parse(e) {
    if (this._def.coerce && (e.data = String(e.data)), this._getType(e) !== pe.string) {
      const i = this._getOrReturnCtx(e);
      return he(i, {
        code: ie.invalid_type,
        expected: pe.string,
        received: i.parsedType
      }), Re;
    }
    const n = new Nt();
    let s;
    for (const i of this._def.checks)
      if (i.kind === "min")
        e.data.length < i.value && (s = this._getOrReturnCtx(e, s), he(s, {
          code: ie.too_small,
          minimum: i.value,
          type: "string",
          inclusive: !0,
          exact: !1,
          message: i.message
        }), n.dirty());
      else if (i.kind === "max")
        e.data.length > i.value && (s = this._getOrReturnCtx(e, s), he(s, {
          code: ie.too_big,
          maximum: i.value,
          type: "string",
          inclusive: !0,
          exact: !1,
          message: i.message
        }), n.dirty());
      else if (i.kind === "length") {
        const l = e.data.length > i.value, f = e.data.length < i.value;
        (l || f) && (s = this._getOrReturnCtx(e, s), l ? he(s, {
          code: ie.too_big,
          maximum: i.value,
          type: "string",
          inclusive: !0,
          exact: !0,
          message: i.message
        }) : f && he(s, {
          code: ie.too_small,
          minimum: i.value,
          type: "string",
          inclusive: !0,
          exact: !0,
          message: i.message
        }), n.dirty());
      } else if (i.kind === "email")
        bm.test(e.data) || (s = this._getOrReturnCtx(e, s), he(s, {
          validation: "email",
          code: ie.invalid_string,
          message: i.message
        }), n.dirty());
      else if (i.kind === "emoji")
        ua || (ua = new RegExp(Sm, "u")), ua.test(e.data) || (s = this._getOrReturnCtx(e, s), he(s, {
          validation: "emoji",
          code: ie.invalid_string,
          message: i.message
        }), n.dirty());
      else if (i.kind === "uuid")
        ym.test(e.data) || (s = this._getOrReturnCtx(e, s), he(s, {
          validation: "uuid",
          code: ie.invalid_string,
          message: i.message
        }), n.dirty());
      else if (i.kind === "nanoid")
        wm.test(e.data) || (s = this._getOrReturnCtx(e, s), he(s, {
          validation: "nanoid",
          code: ie.invalid_string,
          message: i.message
        }), n.dirty());
      else if (i.kind === "cuid")
        mm.test(e.data) || (s = this._getOrReturnCtx(e, s), he(s, {
          validation: "cuid",
          code: ie.invalid_string,
          message: i.message
        }), n.dirty());
      else if (i.kind === "cuid2")
        pm.test(e.data) || (s = this._getOrReturnCtx(e, s), he(s, {
          validation: "cuid2",
          code: ie.invalid_string,
          message: i.message
        }), n.dirty());
      else if (i.kind === "ulid")
        gm.test(e.data) || (s = this._getOrReturnCtx(e, s), he(s, {
          validation: "ulid",
          code: ie.invalid_string,
          message: i.message
        }), n.dirty());
      else if (i.kind === "url")
        try {
          new URL(e.data);
        } catch {
          s = this._getOrReturnCtx(e, s), he(s, {
            validation: "url",
            code: ie.invalid_string,
            message: i.message
          }), n.dirty();
        }
      else i.kind === "regex" ? (i.regex.lastIndex = 0, i.regex.test(e.data) || (s = this._getOrReturnCtx(e, s), he(s, {
        validation: "regex",
        code: ie.invalid_string,
        message: i.message
      }), n.dirty())) : i.kind === "trim" ? e.data = e.data.trim() : i.kind === "includes" ? e.data.includes(i.value, i.position) || (s = this._getOrReturnCtx(e, s), he(s, {
        code: ie.invalid_string,
        validation: { includes: i.value, position: i.position },
        message: i.message
      }), n.dirty()) : i.kind === "toLowerCase" ? e.data = e.data.toLowerCase() : i.kind === "toUpperCase" ? e.data = e.data.toUpperCase() : i.kind === "startsWith" ? e.data.startsWith(i.value) || (s = this._getOrReturnCtx(e, s), he(s, {
        code: ie.invalid_string,
        validation: { startsWith: i.value },
        message: i.message
      }), n.dirty()) : i.kind === "endsWith" ? e.data.endsWith(i.value) || (s = this._getOrReturnCtx(e, s), he(s, {
        code: ie.invalid_string,
        validation: { endsWith: i.value },
        message: i.message
      }), n.dirty()) : i.kind === "datetime" ? Tm(i).test(e.data) || (s = this._getOrReturnCtx(e, s), he(s, {
        code: ie.invalid_string,
        validation: "datetime",
        message: i.message
      }), n.dirty()) : i.kind === "date" ? Cm.test(e.data) || (s = this._getOrReturnCtx(e, s), he(s, {
        code: ie.invalid_string,
        validation: "date",
        message: i.message
      }), n.dirty()) : i.kind === "time" ? Rm(i).test(e.data) || (s = this._getOrReturnCtx(e, s), he(s, {
        code: ie.invalid_string,
        validation: "time",
        message: i.message
      }), n.dirty()) : i.kind === "duration" ? vm.test(e.data) || (s = this._getOrReturnCtx(e, s), he(s, {
        validation: "duration",
        code: ie.invalid_string,
        message: i.message
      }), n.dirty()) : i.kind === "ip" ? Om(e.data, i.version) || (s = this._getOrReturnCtx(e, s), he(s, {
        validation: "ip",
        code: ie.invalid_string,
        message: i.message
      }), n.dirty()) : i.kind === "jwt" ? Nm(e.data, i.alg) || (s = this._getOrReturnCtx(e, s), he(s, {
        validation: "jwt",
        code: ie.invalid_string,
        message: i.message
      }), n.dirty()) : i.kind === "cidr" ? Im(e.data, i.version) || (s = this._getOrReturnCtx(e, s), he(s, {
        validation: "cidr",
        code: ie.invalid_string,
        message: i.message
      }), n.dirty()) : i.kind === "base64" ? Am.test(e.data) || (s = this._getOrReturnCtx(e, s), he(s, {
        validation: "base64",
        code: ie.invalid_string,
        message: i.message
      }), n.dirty()) : i.kind === "base64url" ? Pm.test(e.data) || (s = this._getOrReturnCtx(e, s), he(s, {
        validation: "base64url",
        code: ie.invalid_string,
        message: i.message
      }), n.dirty()) : Ve.assertNever(i);
    return { status: n.value, value: e.data };
  }
  _regex(e, r, n) {
    return this.refinement((s) => e.test(s), {
      validation: r,
      code: ie.invalid_string,
      ...we.errToObj(n)
    });
  }
  _addCheck(e) {
    return new vr({
      ...this._def,
      checks: [...this._def.checks, e]
    });
  }
  email(e) {
    return this._addCheck({ kind: "email", ...we.errToObj(e) });
  }
  url(e) {
    return this._addCheck({ kind: "url", ...we.errToObj(e) });
  }
  emoji(e) {
    return this._addCheck({ kind: "emoji", ...we.errToObj(e) });
  }
  uuid(e) {
    return this._addCheck({ kind: "uuid", ...we.errToObj(e) });
  }
  nanoid(e) {
    return this._addCheck({ kind: "nanoid", ...we.errToObj(e) });
  }
  cuid(e) {
    return this._addCheck({ kind: "cuid", ...we.errToObj(e) });
  }
  cuid2(e) {
    return this._addCheck({ kind: "cuid2", ...we.errToObj(e) });
  }
  ulid(e) {
    return this._addCheck({ kind: "ulid", ...we.errToObj(e) });
  }
  base64(e) {
    return this._addCheck({ kind: "base64", ...we.errToObj(e) });
  }
  base64url(e) {
    return this._addCheck({
      kind: "base64url",
      ...we.errToObj(e)
    });
  }
  jwt(e) {
    return this._addCheck({ kind: "jwt", ...we.errToObj(e) });
  }
  ip(e) {
    return this._addCheck({ kind: "ip", ...we.errToObj(e) });
  }
  cidr(e) {
    return this._addCheck({ kind: "cidr", ...we.errToObj(e) });
  }
  datetime(e) {
    return typeof e == "string" ? this._addCheck({
      kind: "datetime",
      precision: null,
      offset: !1,
      local: !1,
      message: e
    }) : this._addCheck({
      kind: "datetime",
      precision: typeof (e == null ? void 0 : e.precision) > "u" ? null : e == null ? void 0 : e.precision,
      offset: (e == null ? void 0 : e.offset) ?? !1,
      local: (e == null ? void 0 : e.local) ?? !1,
      ...we.errToObj(e == null ? void 0 : e.message)
    });
  }
  date(e) {
    return this._addCheck({ kind: "date", message: e });
  }
  time(e) {
    return typeof e == "string" ? this._addCheck({
      kind: "time",
      precision: null,
      message: e
    }) : this._addCheck({
      kind: "time",
      precision: typeof (e == null ? void 0 : e.precision) > "u" ? null : e == null ? void 0 : e.precision,
      ...we.errToObj(e == null ? void 0 : e.message)
    });
  }
  duration(e) {
    return this._addCheck({ kind: "duration", ...we.errToObj(e) });
  }
  regex(e, r) {
    return this._addCheck({
      kind: "regex",
      regex: e,
      ...we.errToObj(r)
    });
  }
  includes(e, r) {
    return this._addCheck({
      kind: "includes",
      value: e,
      position: r == null ? void 0 : r.position,
      ...we.errToObj(r == null ? void 0 : r.message)
    });
  }
  startsWith(e, r) {
    return this._addCheck({
      kind: "startsWith",
      value: e,
      ...we.errToObj(r)
    });
  }
  endsWith(e, r) {
    return this._addCheck({
      kind: "endsWith",
      value: e,
      ...we.errToObj(r)
    });
  }
  min(e, r) {
    return this._addCheck({
      kind: "min",
      value: e,
      ...we.errToObj(r)
    });
  }
  max(e, r) {
    return this._addCheck({
      kind: "max",
      value: e,
      ...we.errToObj(r)
    });
  }
  length(e, r) {
    return this._addCheck({
      kind: "length",
      value: e,
      ...we.errToObj(r)
    });
  }
  /**
   * Equivalent to `.min(1)`
   */
  nonempty(e) {
    return this.min(1, we.errToObj(e));
  }
  trim() {
    return new vr({
      ...this._def,
      checks: [...this._def.checks, { kind: "trim" }]
    });
  }
  toLowerCase() {
    return new vr({
      ...this._def,
      checks: [...this._def.checks, { kind: "toLowerCase" }]
    });
  }
  toUpperCase() {
    return new vr({
      ...this._def,
      checks: [...this._def.checks, { kind: "toUpperCase" }]
    });
  }
  get isDatetime() {
    return !!this._def.checks.find((e) => e.kind === "datetime");
  }
  get isDate() {
    return !!this._def.checks.find((e) => e.kind === "date");
  }
  get isTime() {
    return !!this._def.checks.find((e) => e.kind === "time");
  }
  get isDuration() {
    return !!this._def.checks.find((e) => e.kind === "duration");
  }
  get isEmail() {
    return !!this._def.checks.find((e) => e.kind === "email");
  }
  get isURL() {
    return !!this._def.checks.find((e) => e.kind === "url");
  }
  get isEmoji() {
    return !!this._def.checks.find((e) => e.kind === "emoji");
  }
  get isUUID() {
    return !!this._def.checks.find((e) => e.kind === "uuid");
  }
  get isNANOID() {
    return !!this._def.checks.find((e) => e.kind === "nanoid");
  }
  get isCUID() {
    return !!this._def.checks.find((e) => e.kind === "cuid");
  }
  get isCUID2() {
    return !!this._def.checks.find((e) => e.kind === "cuid2");
  }
  get isULID() {
    return !!this._def.checks.find((e) => e.kind === "ulid");
  }
  get isIP() {
    return !!this._def.checks.find((e) => e.kind === "ip");
  }
  get isCIDR() {
    return !!this._def.checks.find((e) => e.kind === "cidr");
  }
  get isBase64() {
    return !!this._def.checks.find((e) => e.kind === "base64");
  }
  get isBase64url() {
    return !!this._def.checks.find((e) => e.kind === "base64url");
  }
  get minLength() {
    let e = null;
    for (const r of this._def.checks)
      r.kind === "min" && (e === null || r.value > e) && (e = r.value);
    return e;
  }
  get maxLength() {
    let e = null;
    for (const r of this._def.checks)
      r.kind === "max" && (e === null || r.value < e) && (e = r.value);
    return e;
  }
}
vr.create = (t) => new vr({
  checks: [],
  typeName: oe.ZodString,
  coerce: (t == null ? void 0 : t.coerce) ?? !1,
  ...Oe(t)
});
function jm(t, e) {
  const r = (t.toString().split(".")[1] || "").length, n = (e.toString().split(".")[1] || "").length, s = r > n ? r : n, i = Number.parseInt(t.toFixed(s).replace(".", "")), l = Number.parseInt(e.toFixed(s).replace(".", ""));
  return i % l / 10 ** s;
}
class yn extends De {
  constructor() {
    super(...arguments), this.min = this.gte, this.max = this.lte, this.step = this.multipleOf;
  }
  _parse(e) {
    if (this._def.coerce && (e.data = Number(e.data)), this._getType(e) !== pe.number) {
      const i = this._getOrReturnCtx(e);
      return he(i, {
        code: ie.invalid_type,
        expected: pe.number,
        received: i.parsedType
      }), Re;
    }
    let n;
    const s = new Nt();
    for (const i of this._def.checks)
      i.kind === "int" ? Ve.isInteger(e.data) || (n = this._getOrReturnCtx(e, n), he(n, {
        code: ie.invalid_type,
        expected: "integer",
        received: "float",
        message: i.message
      }), s.dirty()) : i.kind === "min" ? (i.inclusive ? e.data < i.value : e.data <= i.value) && (n = this._getOrReturnCtx(e, n), he(n, {
        code: ie.too_small,
        minimum: i.value,
        type: "number",
        inclusive: i.inclusive,
        exact: !1,
        message: i.message
      }), s.dirty()) : i.kind === "max" ? (i.inclusive ? e.data > i.value : e.data >= i.value) && (n = this._getOrReturnCtx(e, n), he(n, {
        code: ie.too_big,
        maximum: i.value,
        type: "number",
        inclusive: i.inclusive,
        exact: !1,
        message: i.message
      }), s.dirty()) : i.kind === "multipleOf" ? jm(e.data, i.value) !== 0 && (n = this._getOrReturnCtx(e, n), he(n, {
        code: ie.not_multiple_of,
        multipleOf: i.value,
        message: i.message
      }), s.dirty()) : i.kind === "finite" ? Number.isFinite(e.data) || (n = this._getOrReturnCtx(e, n), he(n, {
        code: ie.not_finite,
        message: i.message
      }), s.dirty()) : Ve.assertNever(i);
    return { status: s.value, value: e.data };
  }
  gte(e, r) {
    return this.setLimit("min", e, !0, we.toString(r));
  }
  gt(e, r) {
    return this.setLimit("min", e, !1, we.toString(r));
  }
  lte(e, r) {
    return this.setLimit("max", e, !0, we.toString(r));
  }
  lt(e, r) {
    return this.setLimit("max", e, !1, we.toString(r));
  }
  setLimit(e, r, n, s) {
    return new yn({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind: e,
          value: r,
          inclusive: n,
          message: we.toString(s)
        }
      ]
    });
  }
  _addCheck(e) {
    return new yn({
      ...this._def,
      checks: [...this._def.checks, e]
    });
  }
  int(e) {
    return this._addCheck({
      kind: "int",
      message: we.toString(e)
    });
  }
  positive(e) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: !1,
      message: we.toString(e)
    });
  }
  negative(e) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: !1,
      message: we.toString(e)
    });
  }
  nonpositive(e) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: !0,
      message: we.toString(e)
    });
  }
  nonnegative(e) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: !0,
      message: we.toString(e)
    });
  }
  multipleOf(e, r) {
    return this._addCheck({
      kind: "multipleOf",
      value: e,
      message: we.toString(r)
    });
  }
  finite(e) {
    return this._addCheck({
      kind: "finite",
      message: we.toString(e)
    });
  }
  safe(e) {
    return this._addCheck({
      kind: "min",
      inclusive: !0,
      value: Number.MIN_SAFE_INTEGER,
      message: we.toString(e)
    })._addCheck({
      kind: "max",
      inclusive: !0,
      value: Number.MAX_SAFE_INTEGER,
      message: we.toString(e)
    });
  }
  get minValue() {
    let e = null;
    for (const r of this._def.checks)
      r.kind === "min" && (e === null || r.value > e) && (e = r.value);
    return e;
  }
  get maxValue() {
    let e = null;
    for (const r of this._def.checks)
      r.kind === "max" && (e === null || r.value < e) && (e = r.value);
    return e;
  }
  get isInt() {
    return !!this._def.checks.find((e) => e.kind === "int" || e.kind === "multipleOf" && Ve.isInteger(e.value));
  }
  get isFinite() {
    let e = null, r = null;
    for (const n of this._def.checks) {
      if (n.kind === "finite" || n.kind === "int" || n.kind === "multipleOf")
        return !0;
      n.kind === "min" ? (r === null || n.value > r) && (r = n.value) : n.kind === "max" && (e === null || n.value < e) && (e = n.value);
    }
    return Number.isFinite(r) && Number.isFinite(e);
  }
}
yn.create = (t) => new yn({
  checks: [],
  typeName: oe.ZodNumber,
  coerce: (t == null ? void 0 : t.coerce) || !1,
  ...Oe(t)
});
class Kn extends De {
  constructor() {
    super(...arguments), this.min = this.gte, this.max = this.lte;
  }
  _parse(e) {
    if (this._def.coerce)
      try {
        e.data = BigInt(e.data);
      } catch {
        return this._getInvalidInput(e);
      }
    if (this._getType(e) !== pe.bigint)
      return this._getInvalidInput(e);
    let n;
    const s = new Nt();
    for (const i of this._def.checks)
      i.kind === "min" ? (i.inclusive ? e.data < i.value : e.data <= i.value) && (n = this._getOrReturnCtx(e, n), he(n, {
        code: ie.too_small,
        type: "bigint",
        minimum: i.value,
        inclusive: i.inclusive,
        message: i.message
      }), s.dirty()) : i.kind === "max" ? (i.inclusive ? e.data > i.value : e.data >= i.value) && (n = this._getOrReturnCtx(e, n), he(n, {
        code: ie.too_big,
        type: "bigint",
        maximum: i.value,
        inclusive: i.inclusive,
        message: i.message
      }), s.dirty()) : i.kind === "multipleOf" ? e.data % i.value !== BigInt(0) && (n = this._getOrReturnCtx(e, n), he(n, {
        code: ie.not_multiple_of,
        multipleOf: i.value,
        message: i.message
      }), s.dirty()) : Ve.assertNever(i);
    return { status: s.value, value: e.data };
  }
  _getInvalidInput(e) {
    const r = this._getOrReturnCtx(e);
    return he(r, {
      code: ie.invalid_type,
      expected: pe.bigint,
      received: r.parsedType
    }), Re;
  }
  gte(e, r) {
    return this.setLimit("min", e, !0, we.toString(r));
  }
  gt(e, r) {
    return this.setLimit("min", e, !1, we.toString(r));
  }
  lte(e, r) {
    return this.setLimit("max", e, !0, we.toString(r));
  }
  lt(e, r) {
    return this.setLimit("max", e, !1, we.toString(r));
  }
  setLimit(e, r, n, s) {
    return new Kn({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind: e,
          value: r,
          inclusive: n,
          message: we.toString(s)
        }
      ]
    });
  }
  _addCheck(e) {
    return new Kn({
      ...this._def,
      checks: [...this._def.checks, e]
    });
  }
  positive(e) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: !1,
      message: we.toString(e)
    });
  }
  negative(e) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: !1,
      message: we.toString(e)
    });
  }
  nonpositive(e) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: !0,
      message: we.toString(e)
    });
  }
  nonnegative(e) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: !0,
      message: we.toString(e)
    });
  }
  multipleOf(e, r) {
    return this._addCheck({
      kind: "multipleOf",
      value: e,
      message: we.toString(r)
    });
  }
  get minValue() {
    let e = null;
    for (const r of this._def.checks)
      r.kind === "min" && (e === null || r.value > e) && (e = r.value);
    return e;
  }
  get maxValue() {
    let e = null;
    for (const r of this._def.checks)
      r.kind === "max" && (e === null || r.value < e) && (e = r.value);
    return e;
  }
}
Kn.create = (t) => new Kn({
  checks: [],
  typeName: oe.ZodBigInt,
  coerce: (t == null ? void 0 : t.coerce) ?? !1,
  ...Oe(t)
});
class Xa extends De {
  _parse(e) {
    if (this._def.coerce && (e.data = !!e.data), this._getType(e) !== pe.boolean) {
      const n = this._getOrReturnCtx(e);
      return he(n, {
        code: ie.invalid_type,
        expected: pe.boolean,
        received: n.parsedType
      }), Re;
    }
    return Jt(e.data);
  }
}
Xa.create = (t) => new Xa({
  typeName: oe.ZodBoolean,
  coerce: (t == null ? void 0 : t.coerce) || !1,
  ...Oe(t)
});
class yi extends De {
  _parse(e) {
    if (this._def.coerce && (e.data = new Date(e.data)), this._getType(e) !== pe.date) {
      const i = this._getOrReturnCtx(e);
      return he(i, {
        code: ie.invalid_type,
        expected: pe.date,
        received: i.parsedType
      }), Re;
    }
    if (Number.isNaN(e.data.getTime())) {
      const i = this._getOrReturnCtx(e);
      return he(i, {
        code: ie.invalid_date
      }), Re;
    }
    const n = new Nt();
    let s;
    for (const i of this._def.checks)
      i.kind === "min" ? e.data.getTime() < i.value && (s = this._getOrReturnCtx(e, s), he(s, {
        code: ie.too_small,
        message: i.message,
        inclusive: !0,
        exact: !1,
        minimum: i.value,
        type: "date"
      }), n.dirty()) : i.kind === "max" ? e.data.getTime() > i.value && (s = this._getOrReturnCtx(e, s), he(s, {
        code: ie.too_big,
        message: i.message,
        inclusive: !0,
        exact: !1,
        maximum: i.value,
        type: "date"
      }), n.dirty()) : Ve.assertNever(i);
    return {
      status: n.value,
      value: new Date(e.data.getTime())
    };
  }
  _addCheck(e) {
    return new yi({
      ...this._def,
      checks: [...this._def.checks, e]
    });
  }
  min(e, r) {
    return this._addCheck({
      kind: "min",
      value: e.getTime(),
      message: we.toString(r)
    });
  }
  max(e, r) {
    return this._addCheck({
      kind: "max",
      value: e.getTime(),
      message: we.toString(r)
    });
  }
  get minDate() {
    let e = null;
    for (const r of this._def.checks)
      r.kind === "min" && (e === null || r.value > e) && (e = r.value);
    return e != null ? new Date(e) : null;
  }
  get maxDate() {
    let e = null;
    for (const r of this._def.checks)
      r.kind === "max" && (e === null || r.value < e) && (e = r.value);
    return e != null ? new Date(e) : null;
  }
}
yi.create = (t) => new yi({
  checks: [],
  coerce: (t == null ? void 0 : t.coerce) || !1,
  typeName: oe.ZodDate,
  ...Oe(t)
});
class Fl extends De {
  _parse(e) {
    if (this._getType(e) !== pe.symbol) {
      const n = this._getOrReturnCtx(e);
      return he(n, {
        code: ie.invalid_type,
        expected: pe.symbol,
        received: n.parsedType
      }), Re;
    }
    return Jt(e.data);
  }
}
Fl.create = (t) => new Fl({
  typeName: oe.ZodSymbol,
  ...Oe(t)
});
class Dl extends De {
  _parse(e) {
    if (this._getType(e) !== pe.undefined) {
      const n = this._getOrReturnCtx(e);
      return he(n, {
        code: ie.invalid_type,
        expected: pe.undefined,
        received: n.parsedType
      }), Re;
    }
    return Jt(e.data);
  }
}
Dl.create = (t) => new Dl({
  typeName: oe.ZodUndefined,
  ...Oe(t)
});
class ql extends De {
  _parse(e) {
    if (this._getType(e) !== pe.null) {
      const n = this._getOrReturnCtx(e);
      return he(n, {
        code: ie.invalid_type,
        expected: pe.null,
        received: n.parsedType
      }), Re;
    }
    return Jt(e.data);
  }
}
ql.create = (t) => new ql({
  typeName: oe.ZodNull,
  ...Oe(t)
});
class Ll extends De {
  constructor() {
    super(...arguments), this._any = !0;
  }
  _parse(e) {
    return Jt(e.data);
  }
}
Ll.create = (t) => new Ll({
  typeName: oe.ZodAny,
  ...Oe(t)
});
class Vl extends De {
  constructor() {
    super(...arguments), this._unknown = !0;
  }
  _parse(e) {
    return Jt(e.data);
  }
}
Vl.create = (t) => new Vl({
  typeName: oe.ZodUnknown,
  ...Oe(t)
});
class Or extends De {
  _parse(e) {
    const r = this._getOrReturnCtx(e);
    return he(r, {
      code: ie.invalid_type,
      expected: pe.never,
      received: r.parsedType
    }), Re;
  }
}
Or.create = (t) => new Or({
  typeName: oe.ZodNever,
  ...Oe(t)
});
class Ul extends De {
  _parse(e) {
    if (this._getType(e) !== pe.undefined) {
      const n = this._getOrReturnCtx(e);
      return he(n, {
        code: ie.invalid_type,
        expected: pe.void,
        received: n.parsedType
      }), Re;
    }
    return Jt(e.data);
  }
}
Ul.create = (t) => new Ul({
  typeName: oe.ZodVoid,
  ...Oe(t)
});
class ur extends De {
  _parse(e) {
    const { ctx: r, status: n } = this._processInputParams(e), s = this._def;
    if (r.parsedType !== pe.array)
      return he(r, {
        code: ie.invalid_type,
        expected: pe.array,
        received: r.parsedType
      }), Re;
    if (s.exactLength !== null) {
      const l = r.data.length > s.exactLength.value, f = r.data.length < s.exactLength.value;
      (l || f) && (he(r, {
        code: l ? ie.too_big : ie.too_small,
        minimum: f ? s.exactLength.value : void 0,
        maximum: l ? s.exactLength.value : void 0,
        type: "array",
        inclusive: !0,
        exact: !0,
        message: s.exactLength.message
      }), n.dirty());
    }
    if (s.minLength !== null && r.data.length < s.minLength.value && (he(r, {
      code: ie.too_small,
      minimum: s.minLength.value,
      type: "array",
      inclusive: !0,
      exact: !1,
      message: s.minLength.message
    }), n.dirty()), s.maxLength !== null && r.data.length > s.maxLength.value && (he(r, {
      code: ie.too_big,
      maximum: s.maxLength.value,
      type: "array",
      inclusive: !0,
      exact: !1,
      message: s.maxLength.message
    }), n.dirty()), r.common.async)
      return Promise.all([...r.data].map((l, f) => s.type._parseAsync(new hr(r, l, r.path, f)))).then((l) => Nt.mergeArray(n, l));
    const i = [...r.data].map((l, f) => s.type._parseSync(new hr(r, l, r.path, f)));
    return Nt.mergeArray(n, i);
  }
  get element() {
    return this._def.type;
  }
  min(e, r) {
    return new ur({
      ...this._def,
      minLength: { value: e, message: we.toString(r) }
    });
  }
  max(e, r) {
    return new ur({
      ...this._def,
      maxLength: { value: e, message: we.toString(r) }
    });
  }
  length(e, r) {
    return new ur({
      ...this._def,
      exactLength: { value: e, message: we.toString(r) }
    });
  }
  nonempty(e) {
    return this.min(1, e);
  }
}
ur.create = (t, e) => new ur({
  type: t,
  minLength: null,
  maxLength: null,
  exactLength: null,
  typeName: oe.ZodArray,
  ...Oe(e)
});
function un(t) {
  if (t instanceof at) {
    const e = {};
    for (const r in t.shape) {
      const n = t.shape[r];
      e[r] = br.create(un(n));
    }
    return new at({
      ...t._def,
      shape: () => e
    });
  } else return t instanceof ur ? new ur({
    ...t._def,
    type: un(t.element)
  }) : t instanceof br ? br.create(un(t.unwrap())) : t instanceof vn ? vn.create(un(t.unwrap())) : t instanceof Xr ? Xr.create(t.items.map((e) => un(e))) : t;
}
class at extends De {
  constructor() {
    super(...arguments), this._cached = null, this.nonstrict = this.passthrough, this.augment = this.extend;
  }
  _getCached() {
    if (this._cached !== null)
      return this._cached;
    const e = this._def.shape(), r = Ve.objectKeys(e);
    return this._cached = { shape: e, keys: r }, this._cached;
  }
  _parse(e) {
    if (this._getType(e) !== pe.object) {
      const p = this._getOrReturnCtx(e);
      return he(p, {
        code: ie.invalid_type,
        expected: pe.object,
        received: p.parsedType
      }), Re;
    }
    const { status: n, ctx: s } = this._processInputParams(e), { shape: i, keys: l } = this._getCached(), f = [];
    if (!(this._def.catchall instanceof Or && this._def.unknownKeys === "strip"))
      for (const p in s.data)
        l.includes(p) || f.push(p);
    const d = [];
    for (const p of l) {
      const g = i[p], w = s.data[p];
      d.push({
        key: { status: "valid", value: p },
        value: g._parse(new hr(s, w, s.path, p)),
        alwaysSet: p in s.data
      });
    }
    if (this._def.catchall instanceof Or) {
      const p = this._def.unknownKeys;
      if (p === "passthrough")
        for (const g of f)
          d.push({
            key: { status: "valid", value: g },
            value: { status: "valid", value: s.data[g] }
          });
      else if (p === "strict")
        f.length > 0 && (he(s, {
          code: ie.unrecognized_keys,
          keys: f
        }), n.dirty());
      else if (p !== "strip") throw new Error("Internal ZodObject error: invalid unknownKeys value.");
    } else {
      const p = this._def.catchall;
      for (const g of f) {
        const w = s.data[g];
        d.push({
          key: { status: "valid", value: g },
          value: p._parse(
            new hr(s, w, s.path, g)
            //, ctx.child(key), value, getParsedType(value)
          ),
          alwaysSet: g in s.data
        });
      }
    }
    return s.common.async ? Promise.resolve().then(async () => {
      const p = [];
      for (const g of d) {
        const w = await g.key, P = await g.value;
        p.push({
          key: w,
          value: P,
          alwaysSet: g.alwaysSet
        });
      }
      return p;
    }).then((p) => Nt.mergeObjectSync(n, p)) : Nt.mergeObjectSync(n, d);
  }
  get shape() {
    return this._def.shape();
  }
  strict(e) {
    return we.errToObj, new at({
      ...this._def,
      unknownKeys: "strict",
      ...e !== void 0 ? {
        errorMap: (r, n) => {
          var i, l;
          const s = ((l = (i = this._def).errorMap) == null ? void 0 : l.call(i, r, n).message) ?? n.defaultError;
          return r.code === "unrecognized_keys" ? {
            message: we.errToObj(e).message ?? s
          } : {
            message: s
          };
        }
      } : {}
    });
  }
  strip() {
    return new at({
      ...this._def,
      unknownKeys: "strip"
    });
  }
  passthrough() {
    return new at({
      ...this._def,
      unknownKeys: "passthrough"
    });
  }
  // const AugmentFactory =
  //   <Def extends ZodObjectDef>(def: Def) =>
  //   <Augmentation extends ZodRawShape>(
  //     augmentation: Augmentation
  //   ): ZodObject<
  //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
  //     Def["unknownKeys"],
  //     Def["catchall"]
  //   > => {
  //     return new ZodObject({
  //       ...def,
  //       shape: () => ({
  //         ...def.shape(),
  //         ...augmentation,
  //       }),
  //     }) as any;
  //   };
  extend(e) {
    return new at({
      ...this._def,
      shape: () => ({
        ...this._def.shape(),
        ...e
      })
    });
  }
  /**
   * Prior to zod@1.0.12 there was a bug in the
   * inferred type of merged objects. Please
   * upgrade if you are experiencing issues.
   */
  merge(e) {
    return new at({
      unknownKeys: e._def.unknownKeys,
      catchall: e._def.catchall,
      shape: () => ({
        ...this._def.shape(),
        ...e._def.shape()
      }),
      typeName: oe.ZodObject
    });
  }
  // merge<
  //   Incoming extends AnyZodObject,
  //   Augmentation extends Incoming["shape"],
  //   NewOutput extends {
  //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
  //       ? Augmentation[k]["_output"]
  //       : k extends keyof Output
  //       ? Output[k]
  //       : never;
  //   },
  //   NewInput extends {
  //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
  //       ? Augmentation[k]["_input"]
  //       : k extends keyof Input
  //       ? Input[k]
  //       : never;
  //   }
  // >(
  //   merging: Incoming
  // ): ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"],
  //   NewOutput,
  //   NewInput
  // > {
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  setKey(e, r) {
    return this.augment({ [e]: r });
  }
  // merge<Incoming extends AnyZodObject>(
  //   merging: Incoming
  // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
  // ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"]
  // > {
  //   // const mergedShape = objectUtil.mergeShapes(
  //   //   this._def.shape(),
  //   //   merging._def.shape()
  //   // );
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  catchall(e) {
    return new at({
      ...this._def,
      catchall: e
    });
  }
  pick(e) {
    const r = {};
    for (const n of Ve.objectKeys(e))
      e[n] && this.shape[n] && (r[n] = this.shape[n]);
    return new at({
      ...this._def,
      shape: () => r
    });
  }
  omit(e) {
    const r = {};
    for (const n of Ve.objectKeys(this.shape))
      e[n] || (r[n] = this.shape[n]);
    return new at({
      ...this._def,
      shape: () => r
    });
  }
  /**
   * @deprecated
   */
  deepPartial() {
    return un(this);
  }
  partial(e) {
    const r = {};
    for (const n of Ve.objectKeys(this.shape)) {
      const s = this.shape[n];
      e && !e[n] ? r[n] = s : r[n] = s.optional();
    }
    return new at({
      ...this._def,
      shape: () => r
    });
  }
  required(e) {
    const r = {};
    for (const n of Ve.objectKeys(this.shape))
      if (e && !e[n])
        r[n] = this.shape[n];
      else {
        let i = this.shape[n];
        for (; i instanceof br; )
          i = i._def.innerType;
        r[n] = i;
      }
    return new at({
      ...this._def,
      shape: () => r
    });
  }
  keyof() {
    return ih(Ve.objectKeys(this.shape));
  }
}
at.create = (t, e) => new at({
  shape: () => t,
  unknownKeys: "strip",
  catchall: Or.create(),
  typeName: oe.ZodObject,
  ...Oe(e)
});
at.strictCreate = (t, e) => new at({
  shape: () => t,
  unknownKeys: "strict",
  catchall: Or.create(),
  typeName: oe.ZodObject,
  ...Oe(e)
});
at.lazycreate = (t, e) => new at({
  shape: t,
  unknownKeys: "strip",
  catchall: Or.create(),
  typeName: oe.ZodObject,
  ...Oe(e)
});
class wi extends De {
  _parse(e) {
    const { ctx: r } = this._processInputParams(e), n = this._def.options;
    function s(i) {
      for (const f of i)
        if (f.result.status === "valid")
          return f.result;
      for (const f of i)
        if (f.result.status === "dirty")
          return r.common.issues.push(...f.ctx.common.issues), f.result;
      const l = i.map((f) => new Er(f.ctx.common.issues));
      return he(r, {
        code: ie.invalid_union,
        unionErrors: l
      }), Re;
    }
    if (r.common.async)
      return Promise.all(n.map(async (i) => {
        const l = {
          ...r,
          common: {
            ...r.common,
            issues: []
          },
          parent: null
        };
        return {
          result: await i._parseAsync({
            data: r.data,
            path: r.path,
            parent: l
          }),
          ctx: l
        };
      })).then(s);
    {
      let i;
      const l = [];
      for (const d of n) {
        const p = {
          ...r,
          common: {
            ...r.common,
            issues: []
          },
          parent: null
        }, g = d._parseSync({
          data: r.data,
          path: r.path,
          parent: p
        });
        if (g.status === "valid")
          return g;
        g.status === "dirty" && !i && (i = { result: g, ctx: p }), p.common.issues.length && l.push(p.common.issues);
      }
      if (i)
        return r.common.issues.push(...i.ctx.common.issues), i.result;
      const f = l.map((d) => new Er(d));
      return he(r, {
        code: ie.invalid_union,
        unionErrors: f
      }), Re;
    }
  }
  get options() {
    return this._def.options;
  }
}
wi.create = (t, e) => new wi({
  options: t,
  typeName: oe.ZodUnion,
  ...Oe(e)
});
function Qa(t, e) {
  const r = Cr(t), n = Cr(e);
  if (t === e)
    return { valid: !0, data: t };
  if (r === pe.object && n === pe.object) {
    const s = Ve.objectKeys(e), i = Ve.objectKeys(t).filter((f) => s.indexOf(f) !== -1), l = { ...t, ...e };
    for (const f of i) {
      const d = Qa(t[f], e[f]);
      if (!d.valid)
        return { valid: !1 };
      l[f] = d.data;
    }
    return { valid: !0, data: l };
  } else if (r === pe.array && n === pe.array) {
    if (t.length !== e.length)
      return { valid: !1 };
    const s = [];
    for (let i = 0; i < t.length; i++) {
      const l = t[i], f = e[i], d = Qa(l, f);
      if (!d.valid)
        return { valid: !1 };
      s.push(d.data);
    }
    return { valid: !0, data: s };
  } else return r === pe.date && n === pe.date && +t == +e ? { valid: !0, data: t } : { valid: !1 };
}
class _i extends De {
  _parse(e) {
    const { status: r, ctx: n } = this._processInputParams(e), s = (i, l) => {
      if (Il(i) || Il(l))
        return Re;
      const f = Qa(i.value, l.value);
      return f.valid ? ((jl(i) || jl(l)) && r.dirty(), { status: r.value, value: f.data }) : (he(n, {
        code: ie.invalid_intersection_types
      }), Re);
    };
    return n.common.async ? Promise.all([
      this._def.left._parseAsync({
        data: n.data,
        path: n.path,
        parent: n
      }),
      this._def.right._parseAsync({
        data: n.data,
        path: n.path,
        parent: n
      })
    ]).then(([i, l]) => s(i, l)) : s(this._def.left._parseSync({
      data: n.data,
      path: n.path,
      parent: n
    }), this._def.right._parseSync({
      data: n.data,
      path: n.path,
      parent: n
    }));
  }
}
_i.create = (t, e, r) => new _i({
  left: t,
  right: e,
  typeName: oe.ZodIntersection,
  ...Oe(r)
});
class Xr extends De {
  _parse(e) {
    const { status: r, ctx: n } = this._processInputParams(e);
    if (n.parsedType !== pe.array)
      return he(n, {
        code: ie.invalid_type,
        expected: pe.array,
        received: n.parsedType
      }), Re;
    if (n.data.length < this._def.items.length)
      return he(n, {
        code: ie.too_small,
        minimum: this._def.items.length,
        inclusive: !0,
        exact: !1,
        type: "array"
      }), Re;
    !this._def.rest && n.data.length > this._def.items.length && (he(n, {
      code: ie.too_big,
      maximum: this._def.items.length,
      inclusive: !0,
      exact: !1,
      type: "array"
    }), r.dirty());
    const i = [...n.data].map((l, f) => {
      const d = this._def.items[f] || this._def.rest;
      return d ? d._parse(new hr(n, l, n.path, f)) : null;
    }).filter((l) => !!l);
    return n.common.async ? Promise.all(i).then((l) => Nt.mergeArray(r, l)) : Nt.mergeArray(r, i);
  }
  get items() {
    return this._def.items;
  }
  rest(e) {
    return new Xr({
      ...this._def,
      rest: e
    });
  }
}
Xr.create = (t, e) => {
  if (!Array.isArray(t))
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  return new Xr({
    items: t,
    typeName: oe.ZodTuple,
    rest: null,
    ...Oe(e)
  });
};
class vi extends De {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(e) {
    const { status: r, ctx: n } = this._processInputParams(e);
    if (n.parsedType !== pe.object)
      return he(n, {
        code: ie.invalid_type,
        expected: pe.object,
        received: n.parsedType
      }), Re;
    const s = [], i = this._def.keyType, l = this._def.valueType;
    for (const f in n.data)
      s.push({
        key: i._parse(new hr(n, f, n.path, f)),
        value: l._parse(new hr(n, n.data[f], n.path, f)),
        alwaysSet: f in n.data
      });
    return n.common.async ? Nt.mergeObjectAsync(r, s) : Nt.mergeObjectSync(r, s);
  }
  get element() {
    return this._def.valueType;
  }
  static create(e, r, n) {
    return r instanceof De ? new vi({
      keyType: e,
      valueType: r,
      typeName: oe.ZodRecord,
      ...Oe(n)
    }) : new vi({
      keyType: vr.create(),
      valueType: e,
      typeName: oe.ZodRecord,
      ...Oe(r)
    });
  }
}
class zl extends De {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(e) {
    const { status: r, ctx: n } = this._processInputParams(e);
    if (n.parsedType !== pe.map)
      return he(n, {
        code: ie.invalid_type,
        expected: pe.map,
        received: n.parsedType
      }), Re;
    const s = this._def.keyType, i = this._def.valueType, l = [...n.data.entries()].map(([f, d], p) => ({
      key: s._parse(new hr(n, f, n.path, [p, "key"])),
      value: i._parse(new hr(n, d, n.path, [p, "value"]))
    }));
    if (n.common.async) {
      const f = /* @__PURE__ */ new Map();
      return Promise.resolve().then(async () => {
        for (const d of l) {
          const p = await d.key, g = await d.value;
          if (p.status === "aborted" || g.status === "aborted")
            return Re;
          (p.status === "dirty" || g.status === "dirty") && r.dirty(), f.set(p.value, g.value);
        }
        return { status: r.value, value: f };
      });
    } else {
      const f = /* @__PURE__ */ new Map();
      for (const d of l) {
        const p = d.key, g = d.value;
        if (p.status === "aborted" || g.status === "aborted")
          return Re;
        (p.status === "dirty" || g.status === "dirty") && r.dirty(), f.set(p.value, g.value);
      }
      return { status: r.value, value: f };
    }
  }
}
zl.create = (t, e, r) => new zl({
  valueType: e,
  keyType: t,
  typeName: oe.ZodMap,
  ...Oe(r)
});
class Gn extends De {
  _parse(e) {
    const { status: r, ctx: n } = this._processInputParams(e);
    if (n.parsedType !== pe.set)
      return he(n, {
        code: ie.invalid_type,
        expected: pe.set,
        received: n.parsedType
      }), Re;
    const s = this._def;
    s.minSize !== null && n.data.size < s.minSize.value && (he(n, {
      code: ie.too_small,
      minimum: s.minSize.value,
      type: "set",
      inclusive: !0,
      exact: !1,
      message: s.minSize.message
    }), r.dirty()), s.maxSize !== null && n.data.size > s.maxSize.value && (he(n, {
      code: ie.too_big,
      maximum: s.maxSize.value,
      type: "set",
      inclusive: !0,
      exact: !1,
      message: s.maxSize.message
    }), r.dirty());
    const i = this._def.valueType;
    function l(d) {
      const p = /* @__PURE__ */ new Set();
      for (const g of d) {
        if (g.status === "aborted")
          return Re;
        g.status === "dirty" && r.dirty(), p.add(g.value);
      }
      return { status: r.value, value: p };
    }
    const f = [...n.data.values()].map((d, p) => i._parse(new hr(n, d, n.path, p)));
    return n.common.async ? Promise.all(f).then((d) => l(d)) : l(f);
  }
  min(e, r) {
    return new Gn({
      ...this._def,
      minSize: { value: e, message: we.toString(r) }
    });
  }
  max(e, r) {
    return new Gn({
      ...this._def,
      maxSize: { value: e, message: we.toString(r) }
    });
  }
  size(e, r) {
    return this.min(e, r).max(e, r);
  }
  nonempty(e) {
    return this.min(1, e);
  }
}
Gn.create = (t, e) => new Gn({
  valueType: t,
  minSize: null,
  maxSize: null,
  typeName: oe.ZodSet,
  ...Oe(e)
});
class Bl extends De {
  get schema() {
    return this._def.getter();
  }
  _parse(e) {
    const { ctx: r } = this._processInputParams(e);
    return this._def.getter()._parse({ data: r.data, path: r.path, parent: r });
  }
}
Bl.create = (t, e) => new Bl({
  getter: t,
  typeName: oe.ZodLazy,
  ...Oe(e)
});
class Zl extends De {
  _parse(e) {
    if (e.data !== this._def.value) {
      const r = this._getOrReturnCtx(e);
      return he(r, {
        received: r.data,
        code: ie.invalid_literal,
        expected: this._def.value
      }), Re;
    }
    return { status: "valid", value: e.data };
  }
  get value() {
    return this._def.value;
  }
}
Zl.create = (t, e) => new Zl({
  value: t,
  typeName: oe.ZodLiteral,
  ...Oe(e)
});
function ih(t, e) {
  return new wn({
    values: t,
    typeName: oe.ZodEnum,
    ...Oe(e)
  });
}
class wn extends De {
  constructor() {
    super(...arguments), Un.set(this, void 0);
  }
  _parse(e) {
    if (typeof e.data != "string") {
      const r = this._getOrReturnCtx(e), n = this._def.values;
      return he(r, {
        expected: Ve.joinValues(n),
        received: r.parsedType,
        code: ie.invalid_type
      }), Re;
    }
    if (gi(this, Un, "f") || rh(this, Un, new Set(this._def.values), "f"), !gi(this, Un, "f").has(e.data)) {
      const r = this._getOrReturnCtx(e), n = this._def.values;
      return he(r, {
        received: r.data,
        code: ie.invalid_enum_value,
        options: n
      }), Re;
    }
    return Jt(e.data);
  }
  get options() {
    return this._def.values;
  }
  get enum() {
    const e = {};
    for (const r of this._def.values)
      e[r] = r;
    return e;
  }
  get Values() {
    const e = {};
    for (const r of this._def.values)
      e[r] = r;
    return e;
  }
  get Enum() {
    const e = {};
    for (const r of this._def.values)
      e[r] = r;
    return e;
  }
  extract(e, r = this._def) {
    return wn.create(e, {
      ...this._def,
      ...r
    });
  }
  exclude(e, r = this._def) {
    return wn.create(this.options.filter((n) => !e.includes(n)), {
      ...this._def,
      ...r
    });
  }
}
Un = /* @__PURE__ */ new WeakMap();
wn.create = ih;
class Jl extends De {
  constructor() {
    super(...arguments), zn.set(this, void 0);
  }
  _parse(e) {
    const r = Ve.getValidEnumValues(this._def.values), n = this._getOrReturnCtx(e);
    if (n.parsedType !== pe.string && n.parsedType !== pe.number) {
      const s = Ve.objectValues(r);
      return he(n, {
        expected: Ve.joinValues(s),
        received: n.parsedType,
        code: ie.invalid_type
      }), Re;
    }
    if (gi(this, zn, "f") || rh(this, zn, new Set(Ve.getValidEnumValues(this._def.values)), "f"), !gi(this, zn, "f").has(e.data)) {
      const s = Ve.objectValues(r);
      return he(n, {
        received: n.data,
        code: ie.invalid_enum_value,
        options: s
      }), Re;
    }
    return Jt(e.data);
  }
  get enum() {
    return this._def.values;
  }
}
zn = /* @__PURE__ */ new WeakMap();
Jl.create = (t, e) => new Jl({
  values: t,
  typeName: oe.ZodNativeEnum,
  ...Oe(e)
});
class bi extends De {
  unwrap() {
    return this._def.type;
  }
  _parse(e) {
    const { ctx: r } = this._processInputParams(e);
    if (r.parsedType !== pe.promise && r.common.async === !1)
      return he(r, {
        code: ie.invalid_type,
        expected: pe.promise,
        received: r.parsedType
      }), Re;
    const n = r.parsedType === pe.promise ? r.data : Promise.resolve(r.data);
    return Jt(n.then((s) => this._def.type.parseAsync(s, {
      path: r.path,
      errorMap: r.common.contextualErrorMap
    })));
  }
}
bi.create = (t, e) => new bi({
  type: t,
  typeName: oe.ZodPromise,
  ...Oe(e)
});
class _n extends De {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === oe.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(e) {
    const { status: r, ctx: n } = this._processInputParams(e), s = this._def.effect || null, i = {
      addIssue: (l) => {
        he(n, l), l.fatal ? r.abort() : r.dirty();
      },
      get path() {
        return n.path;
      }
    };
    if (i.addIssue = i.addIssue.bind(i), s.type === "preprocess") {
      const l = s.transform(n.data, i);
      if (n.common.async)
        return Promise.resolve(l).then(async (f) => {
          if (r.value === "aborted")
            return Re;
          const d = await this._def.schema._parseAsync({
            data: f,
            path: n.path,
            parent: n
          });
          return d.status === "aborted" ? Re : d.status === "dirty" || r.value === "dirty" ? Vn(d.value) : d;
        });
      {
        if (r.value === "aborted")
          return Re;
        const f = this._def.schema._parseSync({
          data: l,
          path: n.path,
          parent: n
        });
        return f.status === "aborted" ? Re : f.status === "dirty" || r.value === "dirty" ? Vn(f.value) : f;
      }
    }
    if (s.type === "refinement") {
      const l = (f) => {
        const d = s.refinement(f, i);
        if (n.common.async)
          return Promise.resolve(d);
        if (d instanceof Promise)
          throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
        return f;
      };
      if (n.common.async === !1) {
        const f = this._def.schema._parseSync({
          data: n.data,
          path: n.path,
          parent: n
        });
        return f.status === "aborted" ? Re : (f.status === "dirty" && r.dirty(), l(f.value), { status: r.value, value: f.value });
      } else
        return this._def.schema._parseAsync({ data: n.data, path: n.path, parent: n }).then((f) => f.status === "aborted" ? Re : (f.status === "dirty" && r.dirty(), l(f.value).then(() => ({ status: r.value, value: f.value }))));
    }
    if (s.type === "transform")
      if (n.common.async === !1) {
        const l = this._def.schema._parseSync({
          data: n.data,
          path: n.path,
          parent: n
        });
        if (!gn(l))
          return l;
        const f = s.transform(l.value, i);
        if (f instanceof Promise)
          throw new Error("Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.");
        return { status: r.value, value: f };
      } else
        return this._def.schema._parseAsync({ data: n.data, path: n.path, parent: n }).then((l) => gn(l) ? Promise.resolve(s.transform(l.value, i)).then((f) => ({
          status: r.value,
          value: f
        })) : l);
    Ve.assertNever(s);
  }
}
_n.create = (t, e, r) => new _n({
  schema: t,
  typeName: oe.ZodEffects,
  effect: e,
  ...Oe(r)
});
_n.createWithPreprocess = (t, e, r) => new _n({
  schema: e,
  effect: { type: "preprocess", transform: t },
  typeName: oe.ZodEffects,
  ...Oe(r)
});
class br extends De {
  _parse(e) {
    return this._getType(e) === pe.undefined ? Jt(void 0) : this._def.innerType._parse(e);
  }
  unwrap() {
    return this._def.innerType;
  }
}
br.create = (t, e) => new br({
  innerType: t,
  typeName: oe.ZodOptional,
  ...Oe(e)
});
class vn extends De {
  _parse(e) {
    return this._getType(e) === pe.null ? Jt(null) : this._def.innerType._parse(e);
  }
  unwrap() {
    return this._def.innerType;
  }
}
vn.create = (t, e) => new vn({
  innerType: t,
  typeName: oe.ZodNullable,
  ...Oe(e)
});
class Ha extends De {
  _parse(e) {
    const { ctx: r } = this._processInputParams(e);
    let n = r.data;
    return r.parsedType === pe.undefined && (n = this._def.defaultValue()), this._def.innerType._parse({
      data: n,
      path: r.path,
      parent: r
    });
  }
  removeDefault() {
    return this._def.innerType;
  }
}
Ha.create = (t, e) => new Ha({
  innerType: t,
  typeName: oe.ZodDefault,
  defaultValue: typeof e.default == "function" ? e.default : () => e.default,
  ...Oe(e)
});
class eo extends De {
  _parse(e) {
    const { ctx: r } = this._processInputParams(e), n = {
      ...r,
      common: {
        ...r.common,
        issues: []
      }
    }, s = this._def.innerType._parse({
      data: n.data,
      path: n.path,
      parent: {
        ...n
      }
    });
    return pi(s) ? s.then((i) => ({
      status: "valid",
      value: i.status === "valid" ? i.value : this._def.catchValue({
        get error() {
          return new Er(n.common.issues);
        },
        input: n.data
      })
    })) : {
      status: "valid",
      value: s.status === "valid" ? s.value : this._def.catchValue({
        get error() {
          return new Er(n.common.issues);
        },
        input: n.data
      })
    };
  }
  removeCatch() {
    return this._def.innerType;
  }
}
eo.create = (t, e) => new eo({
  innerType: t,
  typeName: oe.ZodCatch,
  catchValue: typeof e.catch == "function" ? e.catch : () => e.catch,
  ...Oe(e)
});
class Wl extends De {
  _parse(e) {
    if (this._getType(e) !== pe.nan) {
      const n = this._getOrReturnCtx(e);
      return he(n, {
        code: ie.invalid_type,
        expected: pe.nan,
        received: n.parsedType
      }), Re;
    }
    return { status: "valid", value: e.data };
  }
}
Wl.create = (t) => new Wl({
  typeName: oe.ZodNaN,
  ...Oe(t)
});
class Mm extends De {
  _parse(e) {
    const { ctx: r } = this._processInputParams(e), n = r.data;
    return this._def.type._parse({
      data: n,
      path: r.path,
      parent: r
    });
  }
  unwrap() {
    return this._def.type;
  }
}
class Jo extends De {
  _parse(e) {
    const { status: r, ctx: n } = this._processInputParams(e);
    if (n.common.async)
      return (async () => {
        const i = await this._def.in._parseAsync({
          data: n.data,
          path: n.path,
          parent: n
        });
        return i.status === "aborted" ? Re : i.status === "dirty" ? (r.dirty(), Vn(i.value)) : this._def.out._parseAsync({
          data: i.value,
          path: n.path,
          parent: n
        });
      })();
    {
      const s = this._def.in._parseSync({
        data: n.data,
        path: n.path,
        parent: n
      });
      return s.status === "aborted" ? Re : s.status === "dirty" ? (r.dirty(), {
        status: "dirty",
        value: s.value
      }) : this._def.out._parseSync({
        data: s.value,
        path: n.path,
        parent: n
      });
    }
  }
  static create(e, r) {
    return new Jo({
      in: e,
      out: r,
      typeName: oe.ZodPipeline
    });
  }
}
class to extends De {
  _parse(e) {
    const r = this._def.innerType._parse(e), n = (s) => (gn(s) && (s.value = Object.freeze(s.value)), s);
    return pi(r) ? r.then((s) => n(s)) : n(r);
  }
  unwrap() {
    return this._def.innerType;
  }
}
to.create = (t, e) => new to({
  innerType: t,
  typeName: oe.ZodReadonly,
  ...Oe(e)
});
var oe;
(function(t) {
  t.ZodString = "ZodString", t.ZodNumber = "ZodNumber", t.ZodNaN = "ZodNaN", t.ZodBigInt = "ZodBigInt", t.ZodBoolean = "ZodBoolean", t.ZodDate = "ZodDate", t.ZodSymbol = "ZodSymbol", t.ZodUndefined = "ZodUndefined", t.ZodNull = "ZodNull", t.ZodAny = "ZodAny", t.ZodUnknown = "ZodUnknown", t.ZodNever = "ZodNever", t.ZodVoid = "ZodVoid", t.ZodArray = "ZodArray", t.ZodObject = "ZodObject", t.ZodUnion = "ZodUnion", t.ZodDiscriminatedUnion = "ZodDiscriminatedUnion", t.ZodIntersection = "ZodIntersection", t.ZodTuple = "ZodTuple", t.ZodRecord = "ZodRecord", t.ZodMap = "ZodMap", t.ZodSet = "ZodSet", t.ZodFunction = "ZodFunction", t.ZodLazy = "ZodLazy", t.ZodLiteral = "ZodLiteral", t.ZodEnum = "ZodEnum", t.ZodEffects = "ZodEffects", t.ZodNativeEnum = "ZodNativeEnum", t.ZodOptional = "ZodOptional", t.ZodNullable = "ZodNullable", t.ZodDefault = "ZodDefault", t.ZodCatch = "ZodCatch", t.ZodPromise = "ZodPromise", t.ZodBranded = "ZodBranded", t.ZodPipeline = "ZodPipeline", t.ZodReadonly = "ZodReadonly";
})(oe || (oe = {}));
const Ot = vr.create, bn = yn.create, Fm = Xa.create;
Or.create;
const Sr = ur.create, Zt = at.create;
wi.create;
_i.create;
Xr.create;
const Dm = vi.create;
wn.create;
bi.create;
br.create;
vn.create;
/*! js-yaml 4.1.0 https://github.com/nodeca/js-yaml @license MIT */
function ah(t) {
  return typeof t > "u" || t === null;
}
function qm(t) {
  return typeof t == "object" && t !== null;
}
function Lm(t) {
  return Array.isArray(t) ? t : ah(t) ? [] : [t];
}
function Vm(t, e) {
  var r, n, s, i;
  if (e)
    for (i = Object.keys(e), r = 0, n = i.length; r < n; r += 1)
      s = i[r], t[s] = e[s];
  return t;
}
function Um(t, e) {
  var r = "", n;
  for (n = 0; n < e; n += 1)
    r += t;
  return r;
}
function zm(t) {
  return t === 0 && Number.NEGATIVE_INFINITY === 1 / t;
}
var Bm = ah, Zm = qm, Jm = Lm, Wm = Um, Km = zm, Gm = Vm, Tt = {
  isNothing: Bm,
  isObject: Zm,
  toArray: Jm,
  repeat: Wm,
  isNegativeZero: Km,
  extend: Gm
};
function oh(t, e) {
  var r = "", n = t.reason || "(unknown reason)";
  return t.mark ? (t.mark.name && (r += 'in "' + t.mark.name + '" '), r += "(" + (t.mark.line + 1) + ":" + (t.mark.column + 1) + ")", !e && t.mark.snippet && (r += `

` + t.mark.snippet), n + " " + r) : n;
}
function Yn(t, e) {
  Error.call(this), this.name = "YAMLException", this.reason = t, this.mark = e, this.message = oh(this, !1), Error.captureStackTrace ? Error.captureStackTrace(this, this.constructor) : this.stack = new Error().stack || "";
}
Yn.prototype = Object.create(Error.prototype);
Yn.prototype.constructor = Yn;
Yn.prototype.toString = function(e) {
  return this.name + ": " + oh(this, e);
};
var _r = Yn;
function fa(t, e, r, n, s) {
  var i = "", l = "", f = Math.floor(s / 2) - 1;
  return n - e > f && (i = " ... ", e = n - f + i.length), r - n > f && (l = " ...", r = n + f - l.length), {
    str: i + t.slice(e, r).replace(/\t/g, "→") + l,
    pos: n - e + i.length
    // relative position
  };
}
function ha(t, e) {
  return Tt.repeat(" ", e - t.length) + t;
}
function Ym(t, e) {
  if (e = Object.create(e || null), !t.buffer) return null;
  e.maxLength || (e.maxLength = 79), typeof e.indent != "number" && (e.indent = 1), typeof e.linesBefore != "number" && (e.linesBefore = 3), typeof e.linesAfter != "number" && (e.linesAfter = 2);
  for (var r = /\r?\n|\r|\0/g, n = [0], s = [], i, l = -1; i = r.exec(t.buffer); )
    s.push(i.index), n.push(i.index + i[0].length), t.position <= i.index && l < 0 && (l = n.length - 2);
  l < 0 && (l = n.length - 1);
  var f = "", d, p, g = Math.min(t.line + e.linesAfter, s.length).toString().length, w = e.maxLength - (e.indent + g + 3);
  for (d = 1; d <= e.linesBefore && !(l - d < 0); d++)
    p = fa(
      t.buffer,
      n[l - d],
      s[l - d],
      t.position - (n[l] - n[l - d]),
      w
    ), f = Tt.repeat(" ", e.indent) + ha((t.line - d + 1).toString(), g) + " | " + p.str + `
` + f;
  for (p = fa(t.buffer, n[l], s[l], t.position, w), f += Tt.repeat(" ", e.indent) + ha((t.line + 1).toString(), g) + " | " + p.str + `
`, f += Tt.repeat("-", e.indent + g + 3 + p.pos) + `^
`, d = 1; d <= e.linesAfter && !(l + d >= s.length); d++)
    p = fa(
      t.buffer,
      n[l + d],
      s[l + d],
      t.position - (n[l] - n[l + d]),
      w
    ), f += Tt.repeat(" ", e.indent) + ha((t.line + d + 1).toString(), g) + " | " + p.str + `
`;
  return f.replace(/\n$/, "");
}
var Xm = Ym, Qm = [
  "kind",
  "multi",
  "resolve",
  "construct",
  "instanceOf",
  "predicate",
  "represent",
  "representName",
  "defaultStyle",
  "styleAliases"
], Hm = [
  "scalar",
  "sequence",
  "mapping"
];
function ep(t) {
  var e = {};
  return t !== null && Object.keys(t).forEach(function(r) {
    t[r].forEach(function(n) {
      e[String(n)] = r;
    });
  }), e;
}
function tp(t, e) {
  if (e = e || {}, Object.keys(e).forEach(function(r) {
    if (Qm.indexOf(r) === -1)
      throw new _r('Unknown option "' + r + '" is met in definition of "' + t + '" YAML type.');
  }), this.options = e, this.tag = t, this.kind = e.kind || null, this.resolve = e.resolve || function() {
    return !0;
  }, this.construct = e.construct || function(r) {
    return r;
  }, this.instanceOf = e.instanceOf || null, this.predicate = e.predicate || null, this.represent = e.represent || null, this.representName = e.representName || null, this.defaultStyle = e.defaultStyle || null, this.multi = e.multi || !1, this.styleAliases = ep(e.styleAliases || null), Hm.indexOf(this.kind) === -1)
    throw new _r('Unknown kind "' + this.kind + '" is specified for "' + t + '" YAML type.');
}
var Pt = tp;
function Kl(t, e) {
  var r = [];
  return t[e].forEach(function(n) {
    var s = r.length;
    r.forEach(function(i, l) {
      i.tag === n.tag && i.kind === n.kind && i.multi === n.multi && (s = l);
    }), r[s] = n;
  }), r;
}
function rp() {
  var t = {
    scalar: {},
    sequence: {},
    mapping: {},
    fallback: {},
    multi: {
      scalar: [],
      sequence: [],
      mapping: [],
      fallback: []
    }
  }, e, r;
  function n(s) {
    s.multi ? (t.multi[s.kind].push(s), t.multi.fallback.push(s)) : t[s.kind][s.tag] = t.fallback[s.tag] = s;
  }
  for (e = 0, r = arguments.length; e < r; e += 1)
    arguments[e].forEach(n);
  return t;
}
function ro(t) {
  return this.extend(t);
}
ro.prototype.extend = function(e) {
  var r = [], n = [];
  if (e instanceof Pt)
    n.push(e);
  else if (Array.isArray(e))
    n = n.concat(e);
  else if (e && (Array.isArray(e.implicit) || Array.isArray(e.explicit)))
    e.implicit && (r = r.concat(e.implicit)), e.explicit && (n = n.concat(e.explicit));
  else
    throw new _r("Schema.extend argument should be a Type, [ Type ], or a schema definition ({ implicit: [...], explicit: [...] })");
  r.forEach(function(i) {
    if (!(i instanceof Pt))
      throw new _r("Specified list of YAML types (or a single Type object) contains a non-Type object.");
    if (i.loadKind && i.loadKind !== "scalar")
      throw new _r("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.");
    if (i.multi)
      throw new _r("There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.");
  }), n.forEach(function(i) {
    if (!(i instanceof Pt))
      throw new _r("Specified list of YAML types (or a single Type object) contains a non-Type object.");
  });
  var s = Object.create(ro.prototype);
  return s.implicit = (this.implicit || []).concat(r), s.explicit = (this.explicit || []).concat(n), s.compiledImplicit = Kl(s, "implicit"), s.compiledExplicit = Kl(s, "explicit"), s.compiledTypeMap = rp(s.compiledImplicit, s.compiledExplicit), s;
};
var np = ro, sp = new Pt("tag:yaml.org,2002:str", {
  kind: "scalar",
  construct: function(t) {
    return t !== null ? t : "";
  }
}), ip = new Pt("tag:yaml.org,2002:seq", {
  kind: "sequence",
  construct: function(t) {
    return t !== null ? t : [];
  }
}), ap = new Pt("tag:yaml.org,2002:map", {
  kind: "mapping",
  construct: function(t) {
    return t !== null ? t : {};
  }
}), op = new np({
  explicit: [
    sp,
    ip,
    ap
  ]
});
function lp(t) {
  if (t === null) return !0;
  var e = t.length;
  return e === 1 && t === "~" || e === 4 && (t === "null" || t === "Null" || t === "NULL");
}
function cp() {
  return null;
}
function up(t) {
  return t === null;
}
var fp = new Pt("tag:yaml.org,2002:null", {
  kind: "scalar",
  resolve: lp,
  construct: cp,
  predicate: up,
  represent: {
    canonical: function() {
      return "~";
    },
    lowercase: function() {
      return "null";
    },
    uppercase: function() {
      return "NULL";
    },
    camelcase: function() {
      return "Null";
    },
    empty: function() {
      return "";
    }
  },
  defaultStyle: "lowercase"
});
function hp(t) {
  if (t === null) return !1;
  var e = t.length;
  return e === 4 && (t === "true" || t === "True" || t === "TRUE") || e === 5 && (t === "false" || t === "False" || t === "FALSE");
}
function dp(t) {
  return t === "true" || t === "True" || t === "TRUE";
}
function mp(t) {
  return Object.prototype.toString.call(t) === "[object Boolean]";
}
var pp = new Pt("tag:yaml.org,2002:bool", {
  kind: "scalar",
  resolve: hp,
  construct: dp,
  predicate: mp,
  represent: {
    lowercase: function(t) {
      return t ? "true" : "false";
    },
    uppercase: function(t) {
      return t ? "TRUE" : "FALSE";
    },
    camelcase: function(t) {
      return t ? "True" : "False";
    }
  },
  defaultStyle: "lowercase"
});
function gp(t) {
  return 48 <= t && t <= 57 || 65 <= t && t <= 70 || 97 <= t && t <= 102;
}
function yp(t) {
  return 48 <= t && t <= 55;
}
function wp(t) {
  return 48 <= t && t <= 57;
}
function _p(t) {
  if (t === null) return !1;
  var e = t.length, r = 0, n = !1, s;
  if (!e) return !1;
  if (s = t[r], (s === "-" || s === "+") && (s = t[++r]), s === "0") {
    if (r + 1 === e) return !0;
    if (s = t[++r], s === "b") {
      for (r++; r < e; r++)
        if (s = t[r], s !== "_") {
          if (s !== "0" && s !== "1") return !1;
          n = !0;
        }
      return n && s !== "_";
    }
    if (s === "x") {
      for (r++; r < e; r++)
        if (s = t[r], s !== "_") {
          if (!gp(t.charCodeAt(r))) return !1;
          n = !0;
        }
      return n && s !== "_";
    }
    if (s === "o") {
      for (r++; r < e; r++)
        if (s = t[r], s !== "_") {
          if (!yp(t.charCodeAt(r))) return !1;
          n = !0;
        }
      return n && s !== "_";
    }
  }
  if (s === "_") return !1;
  for (; r < e; r++)
    if (s = t[r], s !== "_") {
      if (!wp(t.charCodeAt(r)))
        return !1;
      n = !0;
    }
  return !(!n || s === "_");
}
function vp(t) {
  var e = t, r = 1, n;
  if (e.indexOf("_") !== -1 && (e = e.replace(/_/g, "")), n = e[0], (n === "-" || n === "+") && (n === "-" && (r = -1), e = e.slice(1), n = e[0]), e === "0") return 0;
  if (n === "0") {
    if (e[1] === "b") return r * parseInt(e.slice(2), 2);
    if (e[1] === "x") return r * parseInt(e.slice(2), 16);
    if (e[1] === "o") return r * parseInt(e.slice(2), 8);
  }
  return r * parseInt(e, 10);
}
function bp(t) {
  return Object.prototype.toString.call(t) === "[object Number]" && t % 1 === 0 && !Tt.isNegativeZero(t);
}
var Sp = new Pt("tag:yaml.org,2002:int", {
  kind: "scalar",
  resolve: _p,
  construct: vp,
  predicate: bp,
  represent: {
    binary: function(t) {
      return t >= 0 ? "0b" + t.toString(2) : "-0b" + t.toString(2).slice(1);
    },
    octal: function(t) {
      return t >= 0 ? "0o" + t.toString(8) : "-0o" + t.toString(8).slice(1);
    },
    decimal: function(t) {
      return t.toString(10);
    },
    /* eslint-disable max-len */
    hexadecimal: function(t) {
      return t >= 0 ? "0x" + t.toString(16).toUpperCase() : "-0x" + t.toString(16).toUpperCase().slice(1);
    }
  },
  defaultStyle: "decimal",
  styleAliases: {
    binary: [2, "bin"],
    octal: [8, "oct"],
    decimal: [10, "dec"],
    hexadecimal: [16, "hex"]
  }
}), Ep = new RegExp(
  // 2.5e4, 2.5 and integers
  "^(?:[-+]?(?:[0-9][0-9_]*)(?:\\.[0-9_]*)?(?:[eE][-+]?[0-9]+)?|\\.[0-9_]+(?:[eE][-+]?[0-9]+)?|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$"
);
function $p(t) {
  return !(t === null || !Ep.test(t) || // Quick hack to not allow integers end with `_`
  // Probably should update regexp & check speed
  t[t.length - 1] === "_");
}
function xp(t) {
  var e, r;
  return e = t.replace(/_/g, "").toLowerCase(), r = e[0] === "-" ? -1 : 1, "+-".indexOf(e[0]) >= 0 && (e = e.slice(1)), e === ".inf" ? r === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY : e === ".nan" ? NaN : r * parseFloat(e, 10);
}
var kp = /^[-+]?[0-9]+e/;
function Ap(t, e) {
  var r;
  if (isNaN(t))
    switch (e) {
      case "lowercase":
        return ".nan";
      case "uppercase":
        return ".NAN";
      case "camelcase":
        return ".NaN";
    }
  else if (Number.POSITIVE_INFINITY === t)
    switch (e) {
      case "lowercase":
        return ".inf";
      case "uppercase":
        return ".INF";
      case "camelcase":
        return ".Inf";
    }
  else if (Number.NEGATIVE_INFINITY === t)
    switch (e) {
      case "lowercase":
        return "-.inf";
      case "uppercase":
        return "-.INF";
      case "camelcase":
        return "-.Inf";
    }
  else if (Tt.isNegativeZero(t))
    return "-0.0";
  return r = t.toString(10), kp.test(r) ? r.replace("e", ".e") : r;
}
function Pp(t) {
  return Object.prototype.toString.call(t) === "[object Number]" && (t % 1 !== 0 || Tt.isNegativeZero(t));
}
var Cp = new Pt("tag:yaml.org,2002:float", {
  kind: "scalar",
  resolve: $p,
  construct: xp,
  predicate: Pp,
  represent: Ap,
  defaultStyle: "lowercase"
}), Rp = op.extend({
  implicit: [
    fp,
    pp,
    Sp,
    Cp
  ]
}), Tp = Rp, lh = new RegExp(
  "^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$"
), ch = new RegExp(
  "^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$"
);
function Op(t) {
  return t === null ? !1 : lh.exec(t) !== null || ch.exec(t) !== null;
}
function Np(t) {
  var e, r, n, s, i, l, f, d = 0, p = null, g, w, P;
  if (e = lh.exec(t), e === null && (e = ch.exec(t)), e === null) throw new Error("Date resolve error");
  if (r = +e[1], n = +e[2] - 1, s = +e[3], !e[4])
    return new Date(Date.UTC(r, n, s));
  if (i = +e[4], l = +e[5], f = +e[6], e[7]) {
    for (d = e[7].slice(0, 3); d.length < 3; )
      d += "0";
    d = +d;
  }
  return e[9] && (g = +e[10], w = +(e[11] || 0), p = (g * 60 + w) * 6e4, e[9] === "-" && (p = -p)), P = new Date(Date.UTC(r, n, s, i, l, f, d)), p && P.setTime(P.getTime() - p), P;
}
function Ip(t) {
  return t.toISOString();
}
var jp = new Pt("tag:yaml.org,2002:timestamp", {
  kind: "scalar",
  resolve: Op,
  construct: Np,
  instanceOf: Date,
  represent: Ip
});
function Mp(t) {
  return t === "<<" || t === null;
}
var Fp = new Pt("tag:yaml.org,2002:merge", {
  kind: "scalar",
  resolve: Mp
}), Wo = `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=
\r`;
function Dp(t) {
  if (t === null) return !1;
  var e, r, n = 0, s = t.length, i = Wo;
  for (r = 0; r < s; r++)
    if (e = i.indexOf(t.charAt(r)), !(e > 64)) {
      if (e < 0) return !1;
      n += 6;
    }
  return n % 8 === 0;
}
function qp(t) {
  var e, r, n = t.replace(/[\r\n=]/g, ""), s = n.length, i = Wo, l = 0, f = [];
  for (e = 0; e < s; e++)
    e % 4 === 0 && e && (f.push(l >> 16 & 255), f.push(l >> 8 & 255), f.push(l & 255)), l = l << 6 | i.indexOf(n.charAt(e));
  return r = s % 4 * 6, r === 0 ? (f.push(l >> 16 & 255), f.push(l >> 8 & 255), f.push(l & 255)) : r === 18 ? (f.push(l >> 10 & 255), f.push(l >> 2 & 255)) : r === 12 && f.push(l >> 4 & 255), new Uint8Array(f);
}
function Lp(t) {
  var e = "", r = 0, n, s, i = t.length, l = Wo;
  for (n = 0; n < i; n++)
    n % 3 === 0 && n && (e += l[r >> 18 & 63], e += l[r >> 12 & 63], e += l[r >> 6 & 63], e += l[r & 63]), r = (r << 8) + t[n];
  return s = i % 3, s === 0 ? (e += l[r >> 18 & 63], e += l[r >> 12 & 63], e += l[r >> 6 & 63], e += l[r & 63]) : s === 2 ? (e += l[r >> 10 & 63], e += l[r >> 4 & 63], e += l[r << 2 & 63], e += l[64]) : s === 1 && (e += l[r >> 2 & 63], e += l[r << 4 & 63], e += l[64], e += l[64]), e;
}
function Vp(t) {
  return Object.prototype.toString.call(t) === "[object Uint8Array]";
}
var Up = new Pt("tag:yaml.org,2002:binary", {
  kind: "scalar",
  resolve: Dp,
  construct: qp,
  predicate: Vp,
  represent: Lp
}), zp = Object.prototype.hasOwnProperty, Bp = Object.prototype.toString;
function Zp(t) {
  if (t === null) return !0;
  var e = [], r, n, s, i, l, f = t;
  for (r = 0, n = f.length; r < n; r += 1) {
    if (s = f[r], l = !1, Bp.call(s) !== "[object Object]") return !1;
    for (i in s)
      if (zp.call(s, i))
        if (!l) l = !0;
        else return !1;
    if (!l) return !1;
    if (e.indexOf(i) === -1) e.push(i);
    else return !1;
  }
  return !0;
}
function Jp(t) {
  return t !== null ? t : [];
}
var Wp = new Pt("tag:yaml.org,2002:omap", {
  kind: "sequence",
  resolve: Zp,
  construct: Jp
}), Kp = Object.prototype.toString;
function Gp(t) {
  if (t === null) return !0;
  var e, r, n, s, i, l = t;
  for (i = new Array(l.length), e = 0, r = l.length; e < r; e += 1) {
    if (n = l[e], Kp.call(n) !== "[object Object]" || (s = Object.keys(n), s.length !== 1)) return !1;
    i[e] = [s[0], n[s[0]]];
  }
  return !0;
}
function Yp(t) {
  if (t === null) return [];
  var e, r, n, s, i, l = t;
  for (i = new Array(l.length), e = 0, r = l.length; e < r; e += 1)
    n = l[e], s = Object.keys(n), i[e] = [s[0], n[s[0]]];
  return i;
}
var Xp = new Pt("tag:yaml.org,2002:pairs", {
  kind: "sequence",
  resolve: Gp,
  construct: Yp
}), Qp = Object.prototype.hasOwnProperty;
function Hp(t) {
  if (t === null) return !0;
  var e, r = t;
  for (e in r)
    if (Qp.call(r, e) && r[e] !== null)
      return !1;
  return !0;
}
function eg(t) {
  return t !== null ? t : {};
}
var tg = new Pt("tag:yaml.org,2002:set", {
  kind: "mapping",
  resolve: Hp,
  construct: eg
}), rg = Tp.extend({
  implicit: [
    jp,
    Fp
  ],
  explicit: [
    Up,
    Wp,
    Xp,
    tg
  ]
}), Nr = Object.prototype.hasOwnProperty, Si = 1, uh = 2, fh = 3, Ei = 4, da = 1, ng = 2, Gl = 3, sg = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/, ig = /[\x85\u2028\u2029]/, ag = /[,\[\]\{\}]/, hh = /^(?:!|!!|![a-z\-]+!)$/i, dh = /^(?:!|[^,\[\]\{\}])(?:%[0-9a-f]{2}|[0-9a-z\-#;\/\?:@&=\+\$,_\.!~\*'\(\)\[\]])*$/i;
function Yl(t) {
  return Object.prototype.toString.call(t);
}
function fr(t) {
  return t === 10 || t === 13;
}
function Gr(t) {
  return t === 9 || t === 32;
}
function Mt(t) {
  return t === 9 || t === 32 || t === 10 || t === 13;
}
function hn(t) {
  return t === 44 || t === 91 || t === 93 || t === 123 || t === 125;
}
function og(t) {
  var e;
  return 48 <= t && t <= 57 ? t - 48 : (e = t | 32, 97 <= e && e <= 102 ? e - 97 + 10 : -1);
}
function lg(t) {
  return t === 120 ? 2 : t === 117 ? 4 : t === 85 ? 8 : 0;
}
function cg(t) {
  return 48 <= t && t <= 57 ? t - 48 : -1;
}
function Xl(t) {
  return t === 48 ? "\0" : t === 97 ? "\x07" : t === 98 ? "\b" : t === 116 || t === 9 ? "	" : t === 110 ? `
` : t === 118 ? "\v" : t === 102 ? "\f" : t === 114 ? "\r" : t === 101 ? "\x1B" : t === 32 ? " " : t === 34 ? '"' : t === 47 ? "/" : t === 92 ? "\\" : t === 78 ? "" : t === 95 ? " " : t === 76 ? "\u2028" : t === 80 ? "\u2029" : "";
}
function ug(t) {
  return t <= 65535 ? String.fromCharCode(t) : String.fromCharCode(
    (t - 65536 >> 10) + 55296,
    (t - 65536 & 1023) + 56320
  );
}
var mh = new Array(256), ph = new Array(256);
for (var sn = 0; sn < 256; sn++)
  mh[sn] = Xl(sn) ? 1 : 0, ph[sn] = Xl(sn);
function fg(t, e) {
  this.input = t, this.filename = e.filename || null, this.schema = e.schema || rg, this.onWarning = e.onWarning || null, this.legacy = e.legacy || !1, this.json = e.json || !1, this.listener = e.listener || null, this.implicitTypes = this.schema.compiledImplicit, this.typeMap = this.schema.compiledTypeMap, this.length = t.length, this.position = 0, this.line = 0, this.lineStart = 0, this.lineIndent = 0, this.firstTabInLine = -1, this.documents = [];
}
function gh(t, e) {
  var r = {
    name: t.filename,
    buffer: t.input.slice(0, -1),
    // omit trailing \0
    position: t.position,
    line: t.line,
    column: t.position - t.lineStart
  };
  return r.snippet = Xm(r), new _r(e, r);
}
function Se(t, e) {
  throw gh(t, e);
}
function $i(t, e) {
  t.onWarning && t.onWarning.call(null, gh(t, e));
}
var Ql = {
  YAML: function(e, r, n) {
    var s, i, l;
    e.version !== null && Se(e, "duplication of %YAML directive"), n.length !== 1 && Se(e, "YAML directive accepts exactly one argument"), s = /^([0-9]+)\.([0-9]+)$/.exec(n[0]), s === null && Se(e, "ill-formed argument of the YAML directive"), i = parseInt(s[1], 10), l = parseInt(s[2], 10), i !== 1 && Se(e, "unacceptable YAML version of the document"), e.version = n[0], e.checkLineBreaks = l < 2, l !== 1 && l !== 2 && $i(e, "unsupported YAML version of the document");
  },
  TAG: function(e, r, n) {
    var s, i;
    n.length !== 2 && Se(e, "TAG directive accepts exactly two arguments"), s = n[0], i = n[1], hh.test(s) || Se(e, "ill-formed tag handle (first argument) of the TAG directive"), Nr.call(e.tagMap, s) && Se(e, 'there is a previously declared suffix for "' + s + '" tag handle'), dh.test(i) || Se(e, "ill-formed tag prefix (second argument) of the TAG directive");
    try {
      i = decodeURIComponent(i);
    } catch {
      Se(e, "tag prefix is malformed: " + i);
    }
    e.tagMap[s] = i;
  }
};
function Tr(t, e, r, n) {
  var s, i, l, f;
  if (e < r) {
    if (f = t.input.slice(e, r), n)
      for (s = 0, i = f.length; s < i; s += 1)
        l = f.charCodeAt(s), l === 9 || 32 <= l && l <= 1114111 || Se(t, "expected valid JSON character");
    else sg.test(f) && Se(t, "the stream contains non-printable characters");
    t.result += f;
  }
}
function Hl(t, e, r, n) {
  var s, i, l, f;
  for (Tt.isObject(r) || Se(t, "cannot merge mappings; the provided source object is unacceptable"), s = Object.keys(r), l = 0, f = s.length; l < f; l += 1)
    i = s[l], Nr.call(e, i) || (e[i] = r[i], n[i] = !0);
}
function dn(t, e, r, n, s, i, l, f, d) {
  var p, g;
  if (Array.isArray(s))
    for (s = Array.prototype.slice.call(s), p = 0, g = s.length; p < g; p += 1)
      Array.isArray(s[p]) && Se(t, "nested arrays are not supported inside keys"), typeof s == "object" && Yl(s[p]) === "[object Object]" && (s[p] = "[object Object]");
  if (typeof s == "object" && Yl(s) === "[object Object]" && (s = "[object Object]"), s = String(s), e === null && (e = {}), n === "tag:yaml.org,2002:merge")
    if (Array.isArray(i))
      for (p = 0, g = i.length; p < g; p += 1)
        Hl(t, e, i[p], r);
    else
      Hl(t, e, i, r);
  else
    !t.json && !Nr.call(r, s) && Nr.call(e, s) && (t.line = l || t.line, t.lineStart = f || t.lineStart, t.position = d || t.position, Se(t, "duplicated mapping key")), s === "__proto__" ? Object.defineProperty(e, s, {
      configurable: !0,
      enumerable: !0,
      writable: !0,
      value: i
    }) : e[s] = i, delete r[s];
  return e;
}
function Ko(t) {
  var e;
  e = t.input.charCodeAt(t.position), e === 10 ? t.position++ : e === 13 ? (t.position++, t.input.charCodeAt(t.position) === 10 && t.position++) : Se(t, "a line break is expected"), t.line += 1, t.lineStart = t.position, t.firstTabInLine = -1;
}
function ot(t, e, r) {
  for (var n = 0, s = t.input.charCodeAt(t.position); s !== 0; ) {
    for (; Gr(s); )
      s === 9 && t.firstTabInLine === -1 && (t.firstTabInLine = t.position), s = t.input.charCodeAt(++t.position);
    if (e && s === 35)
      do
        s = t.input.charCodeAt(++t.position);
      while (s !== 10 && s !== 13 && s !== 0);
    if (fr(s))
      for (Ko(t), s = t.input.charCodeAt(t.position), n++, t.lineIndent = 0; s === 32; )
        t.lineIndent++, s = t.input.charCodeAt(++t.position);
    else
      break;
  }
  return r !== -1 && n !== 0 && t.lineIndent < r && $i(t, "deficient indentation"), n;
}
function Ui(t) {
  var e = t.position, r;
  return r = t.input.charCodeAt(e), !!((r === 45 || r === 46) && r === t.input.charCodeAt(e + 1) && r === t.input.charCodeAt(e + 2) && (e += 3, r = t.input.charCodeAt(e), r === 0 || Mt(r)));
}
function Go(t, e) {
  e === 1 ? t.result += " " : e > 1 && (t.result += Tt.repeat(`
`, e - 1));
}
function hg(t, e, r) {
  var n, s, i, l, f, d, p, g, w = t.kind, P = t.result, x;
  if (x = t.input.charCodeAt(t.position), Mt(x) || hn(x) || x === 35 || x === 38 || x === 42 || x === 33 || x === 124 || x === 62 || x === 39 || x === 34 || x === 37 || x === 64 || x === 96 || (x === 63 || x === 45) && (s = t.input.charCodeAt(t.position + 1), Mt(s) || r && hn(s)))
    return !1;
  for (t.kind = "scalar", t.result = "", i = l = t.position, f = !1; x !== 0; ) {
    if (x === 58) {
      if (s = t.input.charCodeAt(t.position + 1), Mt(s) || r && hn(s))
        break;
    } else if (x === 35) {
      if (n = t.input.charCodeAt(t.position - 1), Mt(n))
        break;
    } else {
      if (t.position === t.lineStart && Ui(t) || r && hn(x))
        break;
      if (fr(x))
        if (d = t.line, p = t.lineStart, g = t.lineIndent, ot(t, !1, -1), t.lineIndent >= e) {
          f = !0, x = t.input.charCodeAt(t.position);
          continue;
        } else {
          t.position = l, t.line = d, t.lineStart = p, t.lineIndent = g;
          break;
        }
    }
    f && (Tr(t, i, l, !1), Go(t, t.line - d), i = l = t.position, f = !1), Gr(x) || (l = t.position + 1), x = t.input.charCodeAt(++t.position);
  }
  return Tr(t, i, l, !1), t.result ? !0 : (t.kind = w, t.result = P, !1);
}
function dg(t, e) {
  var r, n, s;
  if (r = t.input.charCodeAt(t.position), r !== 39)
    return !1;
  for (t.kind = "scalar", t.result = "", t.position++, n = s = t.position; (r = t.input.charCodeAt(t.position)) !== 0; )
    if (r === 39)
      if (Tr(t, n, t.position, !0), r = t.input.charCodeAt(++t.position), r === 39)
        n = t.position, t.position++, s = t.position;
      else
        return !0;
    else fr(r) ? (Tr(t, n, s, !0), Go(t, ot(t, !1, e)), n = s = t.position) : t.position === t.lineStart && Ui(t) ? Se(t, "unexpected end of the document within a single quoted scalar") : (t.position++, s = t.position);
  Se(t, "unexpected end of the stream within a single quoted scalar");
}
function mg(t, e) {
  var r, n, s, i, l, f;
  if (f = t.input.charCodeAt(t.position), f !== 34)
    return !1;
  for (t.kind = "scalar", t.result = "", t.position++, r = n = t.position; (f = t.input.charCodeAt(t.position)) !== 0; ) {
    if (f === 34)
      return Tr(t, r, t.position, !0), t.position++, !0;
    if (f === 92) {
      if (Tr(t, r, t.position, !0), f = t.input.charCodeAt(++t.position), fr(f))
        ot(t, !1, e);
      else if (f < 256 && mh[f])
        t.result += ph[f], t.position++;
      else if ((l = lg(f)) > 0) {
        for (s = l, i = 0; s > 0; s--)
          f = t.input.charCodeAt(++t.position), (l = og(f)) >= 0 ? i = (i << 4) + l : Se(t, "expected hexadecimal character");
        t.result += ug(i), t.position++;
      } else
        Se(t, "unknown escape sequence");
      r = n = t.position;
    } else fr(f) ? (Tr(t, r, n, !0), Go(t, ot(t, !1, e)), r = n = t.position) : t.position === t.lineStart && Ui(t) ? Se(t, "unexpected end of the document within a double quoted scalar") : (t.position++, n = t.position);
  }
  Se(t, "unexpected end of the stream within a double quoted scalar");
}
function pg(t, e) {
  var r = !0, n, s, i, l = t.tag, f, d = t.anchor, p, g, w, P, x, T = /* @__PURE__ */ Object.create(null), S, y, _, m;
  if (m = t.input.charCodeAt(t.position), m === 91)
    g = 93, x = !1, f = [];
  else if (m === 123)
    g = 125, x = !0, f = {};
  else
    return !1;
  for (t.anchor !== null && (t.anchorMap[t.anchor] = f), m = t.input.charCodeAt(++t.position); m !== 0; ) {
    if (ot(t, !0, e), m = t.input.charCodeAt(t.position), m === g)
      return t.position++, t.tag = l, t.anchor = d, t.kind = x ? "mapping" : "sequence", t.result = f, !0;
    r ? m === 44 && Se(t, "expected the node content, but found ','") : Se(t, "missed comma between flow collection entries"), y = S = _ = null, w = P = !1, m === 63 && (p = t.input.charCodeAt(t.position + 1), Mt(p) && (w = P = !0, t.position++, ot(t, !0, e))), n = t.line, s = t.lineStart, i = t.position, Sn(t, e, Si, !1, !0), y = t.tag, S = t.result, ot(t, !0, e), m = t.input.charCodeAt(t.position), (P || t.line === n) && m === 58 && (w = !0, m = t.input.charCodeAt(++t.position), ot(t, !0, e), Sn(t, e, Si, !1, !0), _ = t.result), x ? dn(t, f, T, y, S, _, n, s, i) : w ? f.push(dn(t, null, T, y, S, _, n, s, i)) : f.push(S), ot(t, !0, e), m = t.input.charCodeAt(t.position), m === 44 ? (r = !0, m = t.input.charCodeAt(++t.position)) : r = !1;
  }
  Se(t, "unexpected end of the stream within a flow collection");
}
function gg(t, e) {
  var r, n, s = da, i = !1, l = !1, f = e, d = 0, p = !1, g, w;
  if (w = t.input.charCodeAt(t.position), w === 124)
    n = !1;
  else if (w === 62)
    n = !0;
  else
    return !1;
  for (t.kind = "scalar", t.result = ""; w !== 0; )
    if (w = t.input.charCodeAt(++t.position), w === 43 || w === 45)
      da === s ? s = w === 43 ? Gl : ng : Se(t, "repeat of a chomping mode identifier");
    else if ((g = cg(w)) >= 0)
      g === 0 ? Se(t, "bad explicit indentation width of a block scalar; it cannot be less than one") : l ? Se(t, "repeat of an indentation width identifier") : (f = e + g - 1, l = !0);
    else
      break;
  if (Gr(w)) {
    do
      w = t.input.charCodeAt(++t.position);
    while (Gr(w));
    if (w === 35)
      do
        w = t.input.charCodeAt(++t.position);
      while (!fr(w) && w !== 0);
  }
  for (; w !== 0; ) {
    for (Ko(t), t.lineIndent = 0, w = t.input.charCodeAt(t.position); (!l || t.lineIndent < f) && w === 32; )
      t.lineIndent++, w = t.input.charCodeAt(++t.position);
    if (!l && t.lineIndent > f && (f = t.lineIndent), fr(w)) {
      d++;
      continue;
    }
    if (t.lineIndent < f) {
      s === Gl ? t.result += Tt.repeat(`
`, i ? 1 + d : d) : s === da && i && (t.result += `
`);
      break;
    }
    for (n ? Gr(w) ? (p = !0, t.result += Tt.repeat(`
`, i ? 1 + d : d)) : p ? (p = !1, t.result += Tt.repeat(`
`, d + 1)) : d === 0 ? i && (t.result += " ") : t.result += Tt.repeat(`
`, d) : t.result += Tt.repeat(`
`, i ? 1 + d : d), i = !0, l = !0, d = 0, r = t.position; !fr(w) && w !== 0; )
      w = t.input.charCodeAt(++t.position);
    Tr(t, r, t.position, !1);
  }
  return !0;
}
function ec(t, e) {
  var r, n = t.tag, s = t.anchor, i = [], l, f = !1, d;
  if (t.firstTabInLine !== -1) return !1;
  for (t.anchor !== null && (t.anchorMap[t.anchor] = i), d = t.input.charCodeAt(t.position); d !== 0 && (t.firstTabInLine !== -1 && (t.position = t.firstTabInLine, Se(t, "tab characters must not be used in indentation")), !(d !== 45 || (l = t.input.charCodeAt(t.position + 1), !Mt(l)))); ) {
    if (f = !0, t.position++, ot(t, !0, -1) && t.lineIndent <= e) {
      i.push(null), d = t.input.charCodeAt(t.position);
      continue;
    }
    if (r = t.line, Sn(t, e, fh, !1, !0), i.push(t.result), ot(t, !0, -1), d = t.input.charCodeAt(t.position), (t.line === r || t.lineIndent > e) && d !== 0)
      Se(t, "bad indentation of a sequence entry");
    else if (t.lineIndent < e)
      break;
  }
  return f ? (t.tag = n, t.anchor = s, t.kind = "sequence", t.result = i, !0) : !1;
}
function yg(t, e, r) {
  var n, s, i, l, f, d, p = t.tag, g = t.anchor, w = {}, P = /* @__PURE__ */ Object.create(null), x = null, T = null, S = null, y = !1, _ = !1, m;
  if (t.firstTabInLine !== -1) return !1;
  for (t.anchor !== null && (t.anchorMap[t.anchor] = w), m = t.input.charCodeAt(t.position); m !== 0; ) {
    if (!y && t.firstTabInLine !== -1 && (t.position = t.firstTabInLine, Se(t, "tab characters must not be used in indentation")), n = t.input.charCodeAt(t.position + 1), i = t.line, (m === 63 || m === 58) && Mt(n))
      m === 63 ? (y && (dn(t, w, P, x, T, null, l, f, d), x = T = S = null), _ = !0, y = !0, s = !0) : y ? (y = !1, s = !0) : Se(t, "incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line"), t.position += 1, m = n;
    else {
      if (l = t.line, f = t.lineStart, d = t.position, !Sn(t, r, uh, !1, !0))
        break;
      if (t.line === i) {
        for (m = t.input.charCodeAt(t.position); Gr(m); )
          m = t.input.charCodeAt(++t.position);
        if (m === 58)
          m = t.input.charCodeAt(++t.position), Mt(m) || Se(t, "a whitespace character is expected after the key-value separator within a block mapping"), y && (dn(t, w, P, x, T, null, l, f, d), x = T = S = null), _ = !0, y = !1, s = !1, x = t.tag, T = t.result;
        else if (_)
          Se(t, "can not read an implicit mapping pair; a colon is missed");
        else
          return t.tag = p, t.anchor = g, !0;
      } else if (_)
        Se(t, "can not read a block mapping entry; a multiline key may not be an implicit key");
      else
        return t.tag = p, t.anchor = g, !0;
    }
    if ((t.line === i || t.lineIndent > e) && (y && (l = t.line, f = t.lineStart, d = t.position), Sn(t, e, Ei, !0, s) && (y ? T = t.result : S = t.result), y || (dn(t, w, P, x, T, S, l, f, d), x = T = S = null), ot(t, !0, -1), m = t.input.charCodeAt(t.position)), (t.line === i || t.lineIndent > e) && m !== 0)
      Se(t, "bad indentation of a mapping entry");
    else if (t.lineIndent < e)
      break;
  }
  return y && dn(t, w, P, x, T, null, l, f, d), _ && (t.tag = p, t.anchor = g, t.kind = "mapping", t.result = w), _;
}
function wg(t) {
  var e, r = !1, n = !1, s, i, l;
  if (l = t.input.charCodeAt(t.position), l !== 33) return !1;
  if (t.tag !== null && Se(t, "duplication of a tag property"), l = t.input.charCodeAt(++t.position), l === 60 ? (r = !0, l = t.input.charCodeAt(++t.position)) : l === 33 ? (n = !0, s = "!!", l = t.input.charCodeAt(++t.position)) : s = "!", e = t.position, r) {
    do
      l = t.input.charCodeAt(++t.position);
    while (l !== 0 && l !== 62);
    t.position < t.length ? (i = t.input.slice(e, t.position), l = t.input.charCodeAt(++t.position)) : Se(t, "unexpected end of the stream within a verbatim tag");
  } else {
    for (; l !== 0 && !Mt(l); )
      l === 33 && (n ? Se(t, "tag suffix cannot contain exclamation marks") : (s = t.input.slice(e - 1, t.position + 1), hh.test(s) || Se(t, "named tag handle cannot contain such characters"), n = !0, e = t.position + 1)), l = t.input.charCodeAt(++t.position);
    i = t.input.slice(e, t.position), ag.test(i) && Se(t, "tag suffix cannot contain flow indicator characters");
  }
  i && !dh.test(i) && Se(t, "tag name cannot contain such characters: " + i);
  try {
    i = decodeURIComponent(i);
  } catch {
    Se(t, "tag name is malformed: " + i);
  }
  return r ? t.tag = i : Nr.call(t.tagMap, s) ? t.tag = t.tagMap[s] + i : s === "!" ? t.tag = "!" + i : s === "!!" ? t.tag = "tag:yaml.org,2002:" + i : Se(t, 'undeclared tag handle "' + s + '"'), !0;
}
function _g(t) {
  var e, r;
  if (r = t.input.charCodeAt(t.position), r !== 38) return !1;
  for (t.anchor !== null && Se(t, "duplication of an anchor property"), r = t.input.charCodeAt(++t.position), e = t.position; r !== 0 && !Mt(r) && !hn(r); )
    r = t.input.charCodeAt(++t.position);
  return t.position === e && Se(t, "name of an anchor node must contain at least one character"), t.anchor = t.input.slice(e, t.position), !0;
}
function vg(t) {
  var e, r, n;
  if (n = t.input.charCodeAt(t.position), n !== 42) return !1;
  for (n = t.input.charCodeAt(++t.position), e = t.position; n !== 0 && !Mt(n) && !hn(n); )
    n = t.input.charCodeAt(++t.position);
  return t.position === e && Se(t, "name of an alias node must contain at least one character"), r = t.input.slice(e, t.position), Nr.call(t.anchorMap, r) || Se(t, 'unidentified alias "' + r + '"'), t.result = t.anchorMap[r], ot(t, !0, -1), !0;
}
function Sn(t, e, r, n, s) {
  var i, l, f, d = 1, p = !1, g = !1, w, P, x, T, S, y;
  if (t.listener !== null && t.listener("open", t), t.tag = null, t.anchor = null, t.kind = null, t.result = null, i = l = f = Ei === r || fh === r, n && ot(t, !0, -1) && (p = !0, t.lineIndent > e ? d = 1 : t.lineIndent === e ? d = 0 : t.lineIndent < e && (d = -1)), d === 1)
    for (; wg(t) || _g(t); )
      ot(t, !0, -1) ? (p = !0, f = i, t.lineIndent > e ? d = 1 : t.lineIndent === e ? d = 0 : t.lineIndent < e && (d = -1)) : f = !1;
  if (f && (f = p || s), (d === 1 || Ei === r) && (Si === r || uh === r ? S = e : S = e + 1, y = t.position - t.lineStart, d === 1 ? f && (ec(t, y) || yg(t, y, S)) || pg(t, S) ? g = !0 : (l && gg(t, S) || dg(t, S) || mg(t, S) ? g = !0 : vg(t) ? (g = !0, (t.tag !== null || t.anchor !== null) && Se(t, "alias node should not have any properties")) : hg(t, S, Si === r) && (g = !0, t.tag === null && (t.tag = "?")), t.anchor !== null && (t.anchorMap[t.anchor] = t.result)) : d === 0 && (g = f && ec(t, y))), t.tag === null)
    t.anchor !== null && (t.anchorMap[t.anchor] = t.result);
  else if (t.tag === "?") {
    for (t.result !== null && t.kind !== "scalar" && Se(t, 'unacceptable node kind for !<?> tag; it should be "scalar", not "' + t.kind + '"'), w = 0, P = t.implicitTypes.length; w < P; w += 1)
      if (T = t.implicitTypes[w], T.resolve(t.result)) {
        t.result = T.construct(t.result), t.tag = T.tag, t.anchor !== null && (t.anchorMap[t.anchor] = t.result);
        break;
      }
  } else if (t.tag !== "!") {
    if (Nr.call(t.typeMap[t.kind || "fallback"], t.tag))
      T = t.typeMap[t.kind || "fallback"][t.tag];
    else
      for (T = null, x = t.typeMap.multi[t.kind || "fallback"], w = 0, P = x.length; w < P; w += 1)
        if (t.tag.slice(0, x[w].tag.length) === x[w].tag) {
          T = x[w];
          break;
        }
    T || Se(t, "unknown tag !<" + t.tag + ">"), t.result !== null && T.kind !== t.kind && Se(t, "unacceptable node kind for !<" + t.tag + '> tag; it should be "' + T.kind + '", not "' + t.kind + '"'), T.resolve(t.result, t.tag) ? (t.result = T.construct(t.result, t.tag), t.anchor !== null && (t.anchorMap[t.anchor] = t.result)) : Se(t, "cannot resolve a node with !<" + t.tag + "> explicit tag");
  }
  return t.listener !== null && t.listener("close", t), t.tag !== null || t.anchor !== null || g;
}
function bg(t) {
  var e = t.position, r, n, s, i = !1, l;
  for (t.version = null, t.checkLineBreaks = t.legacy, t.tagMap = /* @__PURE__ */ Object.create(null), t.anchorMap = /* @__PURE__ */ Object.create(null); (l = t.input.charCodeAt(t.position)) !== 0 && (ot(t, !0, -1), l = t.input.charCodeAt(t.position), !(t.lineIndent > 0 || l !== 37)); ) {
    for (i = !0, l = t.input.charCodeAt(++t.position), r = t.position; l !== 0 && !Mt(l); )
      l = t.input.charCodeAt(++t.position);
    for (n = t.input.slice(r, t.position), s = [], n.length < 1 && Se(t, "directive name must not be less than one character in length"); l !== 0; ) {
      for (; Gr(l); )
        l = t.input.charCodeAt(++t.position);
      if (l === 35) {
        do
          l = t.input.charCodeAt(++t.position);
        while (l !== 0 && !fr(l));
        break;
      }
      if (fr(l)) break;
      for (r = t.position; l !== 0 && !Mt(l); )
        l = t.input.charCodeAt(++t.position);
      s.push(t.input.slice(r, t.position));
    }
    l !== 0 && Ko(t), Nr.call(Ql, n) ? Ql[n](t, n, s) : $i(t, 'unknown document directive "' + n + '"');
  }
  if (ot(t, !0, -1), t.lineIndent === 0 && t.input.charCodeAt(t.position) === 45 && t.input.charCodeAt(t.position + 1) === 45 && t.input.charCodeAt(t.position + 2) === 45 ? (t.position += 3, ot(t, !0, -1)) : i && Se(t, "directives end mark is expected"), Sn(t, t.lineIndent - 1, Ei, !1, !0), ot(t, !0, -1), t.checkLineBreaks && ig.test(t.input.slice(e, t.position)) && $i(t, "non-ASCII line breaks are interpreted as content"), t.documents.push(t.result), t.position === t.lineStart && Ui(t)) {
    t.input.charCodeAt(t.position) === 46 && (t.position += 3, ot(t, !0, -1));
    return;
  }
  if (t.position < t.length - 1)
    Se(t, "end of the stream or a document separator is expected");
  else
    return;
}
function Sg(t, e) {
  t = String(t), e = e || {}, t.length !== 0 && (t.charCodeAt(t.length - 1) !== 10 && t.charCodeAt(t.length - 1) !== 13 && (t += `
`), t.charCodeAt(0) === 65279 && (t = t.slice(1)));
  var r = new fg(t, e), n = t.indexOf("\0");
  for (n !== -1 && (r.position = n, Se(r, "null byte is not allowed in input")), r.input += "\0"; r.input.charCodeAt(r.position) === 32; )
    r.lineIndent += 1, r.position += 1;
  for (; r.position < r.length - 1; )
    bg(r);
  return r.documents;
}
function Eg(t, e) {
  var r = Sg(t, e);
  if (r.length !== 0) {
    if (r.length === 1)
      return r[0];
    throw new _r("expected a single document in the stream, but found more");
  }
}
var $g = Eg, xg = {
  load: $g
}, kg = xg.load;
/*!
 * mustache.js - Logic-less {{mustache}} templates with JavaScript
 * http://github.com/janl/mustache.js
 */
var Ag = Object.prototype.toString, An = Array.isArray || function(e) {
  return Ag.call(e) === "[object Array]";
};
function Yo(t) {
  return typeof t == "function";
}
function Pg(t) {
  return An(t) ? "array" : typeof t;
}
function ma(t) {
  return t.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
}
function tc(t, e) {
  return t != null && typeof t == "object" && e in t;
}
function Cg(t, e) {
  return t != null && typeof t != "object" && t.hasOwnProperty && t.hasOwnProperty(e);
}
var Rg = RegExp.prototype.test;
function Tg(t, e) {
  return Rg.call(t, e);
}
var Og = /\S/;
function Ng(t) {
  return !Tg(Og, t);
}
var Ig = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
  "/": "&#x2F;",
  "`": "&#x60;",
  "=": "&#x3D;"
};
function jg(t) {
  return String(t).replace(/[&<>"'`=\/]/g, function(r) {
    return Ig[r];
  });
}
var Mg = /\s*/, Fg = /\s+/, rc = /\s*=/, Dg = /\s*\}/, qg = /#|\^|\/|>|\{|&|=|!/;
function Lg(t, e) {
  if (!t)
    return [];
  var r = !1, n = [], s = [], i = [], l = !1, f = !1, d = "", p = 0;
  function g() {
    if (l && !f)
      for (; i.length; )
        delete s[i.pop()];
    else
      i = [];
    l = !1, f = !1;
  }
  var w, P, x;
  function T(V) {
    if (typeof V == "string" && (V = V.split(Fg, 2)), !An(V) || V.length !== 2)
      throw new Error("Invalid tags: " + V);
    w = new RegExp(ma(V[0]) + "\\s*"), P = new RegExp("\\s*" + ma(V[1])), x = new RegExp("\\s*" + ma("}" + V[1]));
  }
  T(e || lt.tags);
  for (var S = new as(t), y, _, m, b, $, O; !S.eos(); ) {
    if (y = S.pos, m = S.scanUntil(w), m)
      for (var A = 0, j = m.length; A < j; ++A)
        b = m.charAt(A), Ng(b) ? (i.push(s.length), d += b) : (f = !0, r = !0, d += " "), s.push(["text", b, y, y + 1]), y += 1, b === `
` && (g(), d = "", p = 0, r = !1);
    if (!S.scan(w))
      break;
    if (l = !0, _ = S.scan(qg) || "name", S.scan(Mg), _ === "=" ? (m = S.scanUntil(rc), S.scan(rc), S.scanUntil(P)) : _ === "{" ? (m = S.scanUntil(x), S.scan(Dg), S.scanUntil(P), _ = "&") : m = S.scanUntil(P), !S.scan(P))
      throw new Error("Unclosed tag at " + S.pos);
    if (_ == ">" ? $ = [_, m, y, S.pos, d, p, r] : $ = [_, m, y, S.pos], p++, s.push($), _ === "#" || _ === "^")
      n.push($);
    else if (_ === "/") {
      if (O = n.pop(), !O)
        throw new Error('Unopened section "' + m + '" at ' + y);
      if (O[1] !== m)
        throw new Error('Unclosed section "' + O[1] + '" at ' + y);
    } else _ === "name" || _ === "{" || _ === "&" ? f = !0 : _ === "=" && T(m);
  }
  if (g(), O = n.pop(), O)
    throw new Error('Unclosed section "' + O[1] + '" at ' + S.pos);
  return Ug(Vg(s));
}
function Vg(t) {
  for (var e = [], r, n, s = 0, i = t.length; s < i; ++s)
    r = t[s], r && (r[0] === "text" && n && n[0] === "text" ? (n[1] += r[1], n[3] = r[3]) : (e.push(r), n = r));
  return e;
}
function Ug(t) {
  for (var e = [], r = e, n = [], s, i, l = 0, f = t.length; l < f; ++l)
    switch (s = t[l], s[0]) {
      case "#":
      case "^":
        r.push(s), n.push(s), r = s[4] = [];
        break;
      case "/":
        i = n.pop(), i[5] = s[2], r = n.length > 0 ? n[n.length - 1][4] : e;
        break;
      default:
        r.push(s);
    }
  return e;
}
function as(t) {
  this.string = t, this.tail = t, this.pos = 0;
}
as.prototype.eos = function() {
  return this.tail === "";
};
as.prototype.scan = function(e) {
  var r = this.tail.match(e);
  if (!r || r.index !== 0)
    return "";
  var n = r[0];
  return this.tail = this.tail.substring(n.length), this.pos += n.length, n;
};
as.prototype.scanUntil = function(e) {
  var r = this.tail.search(e), n;
  switch (r) {
    case -1:
      n = this.tail, this.tail = "";
      break;
    case 0:
      n = "";
      break;
    default:
      n = this.tail.substring(0, r), this.tail = this.tail.substring(r);
  }
  return this.pos += n.length, n;
};
function En(t, e) {
  this.view = t, this.cache = { ".": this.view }, this.parent = e;
}
En.prototype.push = function(e) {
  return new En(e, this);
};
En.prototype.lookup = function(e) {
  var r = this.cache, n;
  if (r.hasOwnProperty(e))
    n = r[e];
  else {
    for (var s = this, i, l, f, d = !1; s; ) {
      if (e.indexOf(".") > 0)
        for (i = s.view, l = e.split("."), f = 0; i != null && f < l.length; )
          f === l.length - 1 && (d = tc(i, l[f]) || Cg(i, l[f])), i = i[l[f++]];
      else
        i = s.view[e], d = tc(s.view, e);
      if (d) {
        n = i;
        break;
      }
      s = s.parent;
    }
    r[e] = n;
  }
  return Yo(n) && (n = n.call(this.view)), n;
};
function It() {
  this.templateCache = {
    _cache: {},
    set: function(e, r) {
      this._cache[e] = r;
    },
    get: function(e) {
      return this._cache[e];
    },
    clear: function() {
      this._cache = {};
    }
  };
}
It.prototype.clearCache = function() {
  typeof this.templateCache < "u" && this.templateCache.clear();
};
It.prototype.parse = function(e, r) {
  var n = this.templateCache, s = e + ":" + (r || lt.tags).join(":"), i = typeof n < "u", l = i ? n.get(s) : void 0;
  return l == null && (l = Lg(e, r), i && n.set(s, l)), l;
};
It.prototype.render = function(e, r, n, s) {
  var i = this.getConfigTags(s), l = this.parse(e, i), f = r instanceof En ? r : new En(r, void 0);
  return this.renderTokens(l, f, n, e, s);
};
It.prototype.renderTokens = function(e, r, n, s, i) {
  for (var l = "", f, d, p, g = 0, w = e.length; g < w; ++g)
    p = void 0, f = e[g], d = f[0], d === "#" ? p = this.renderSection(f, r, n, s, i) : d === "^" ? p = this.renderInverted(f, r, n, s, i) : d === ">" ? p = this.renderPartial(f, r, n, i) : d === "&" ? p = this.unescapedValue(f, r) : d === "name" ? p = this.escapedValue(f, r, i) : d === "text" && (p = this.rawValue(f)), p !== void 0 && (l += p);
  return l;
};
It.prototype.renderSection = function(e, r, n, s, i) {
  var l = this, f = "", d = r.lookup(e[1]);
  function p(P) {
    return l.render(P, r, n, i);
  }
  if (d) {
    if (An(d))
      for (var g = 0, w = d.length; g < w; ++g)
        f += this.renderTokens(e[4], r.push(d[g]), n, s, i);
    else if (typeof d == "object" || typeof d == "string" || typeof d == "number")
      f += this.renderTokens(e[4], r.push(d), n, s, i);
    else if (Yo(d)) {
      if (typeof s != "string")
        throw new Error("Cannot use higher-order sections without the original template");
      d = d.call(r.view, s.slice(e[3], e[5]), p), d != null && (f += d);
    } else
      f += this.renderTokens(e[4], r, n, s, i);
    return f;
  }
};
It.prototype.renderInverted = function(e, r, n, s, i) {
  var l = r.lookup(e[1]);
  if (!l || An(l) && l.length === 0)
    return this.renderTokens(e[4], r, n, s, i);
};
It.prototype.indentPartial = function(e, r, n) {
  for (var s = r.replace(/[^ \t]/g, ""), i = e.split(`
`), l = 0; l < i.length; l++)
    i[l].length && (l > 0 || !n) && (i[l] = s + i[l]);
  return i.join(`
`);
};
It.prototype.renderPartial = function(e, r, n, s) {
  if (n) {
    var i = this.getConfigTags(s), l = Yo(n) ? n(e[1]) : n[e[1]];
    if (l != null) {
      var f = e[6], d = e[5], p = e[4], g = l;
      d == 0 && p && (g = this.indentPartial(l, p, f));
      var w = this.parse(g, i);
      return this.renderTokens(w, r, n, g, s);
    }
  }
};
It.prototype.unescapedValue = function(e, r) {
  var n = r.lookup(e[1]);
  if (n != null)
    return n;
};
It.prototype.escapedValue = function(e, r, n) {
  var s = this.getConfigEscape(n) || lt.escape, i = r.lookup(e[1]);
  if (i != null)
    return typeof i == "number" && s === lt.escape ? String(i) : s(i);
};
It.prototype.rawValue = function(e) {
  return e[1];
};
It.prototype.getConfigTags = function(e) {
  return An(e) ? e : e && typeof e == "object" ? e.tags : void 0;
};
It.prototype.getConfigEscape = function(e) {
  if (e && typeof e == "object" && !An(e))
    return e.escape;
};
var lt = {
  name: "mustache.js",
  version: "4.2.0",
  tags: ["{{", "}}"],
  clearCache: void 0,
  escape: void 0,
  parse: void 0,
  render: void 0,
  Scanner: void 0,
  Context: void 0,
  Writer: void 0,
  /**
   * Allows a user to override the default caching strategy, by providing an
   * object with set, get and clear methods. This can also be used to disable
   * the cache by setting it to the literal `undefined`.
   */
  set templateCache(t) {
    Xn.templateCache = t;
  },
  /**
   * Gets the default or overridden caching object from the default writer.
   */
  get templateCache() {
    return Xn.templateCache;
  }
}, Xn = new It();
lt.clearCache = function() {
  return Xn.clearCache();
};
lt.parse = function(e, r) {
  return Xn.parse(e, r);
};
lt.render = function(e, r, n, s) {
  if (typeof e != "string")
    throw new TypeError('Invalid template! Template should be a "string" but "' + Pg(e) + '" was given as the first argument for mustache#render(template, view, partials)');
  return Xn.render(e, r, n, s);
};
lt.escape = jg;
lt.Scanner = as;
lt.Context = En;
lt.Writer = It;
function zi(t) {
  return t && t.__esModule && Object.prototype.hasOwnProperty.call(t, "default") ? t.default : t;
}
function yh(t) {
  if (Object.prototype.hasOwnProperty.call(t, "__esModule")) return t;
  var e = t.default;
  if (typeof e == "function") {
    var r = function n() {
      return this instanceof n ? Reflect.construct(e, arguments, this.constructor) : e.apply(this, arguments);
    };
    r.prototype = e.prototype;
  } else r = {};
  return Object.defineProperty(r, "__esModule", { value: !0 }), Object.keys(t).forEach(function(n) {
    var s = Object.getOwnPropertyDescriptor(t, n);
    Object.defineProperty(r, n, s.get ? s : {
      enumerable: !0,
      get: function() {
        return t[n];
      }
    });
  }), r;
}
var pa, nc;
function zg() {
  return nc || (nc = 1, pa = /* @__PURE__ */ function() {
    function t(e, r, n, s, i) {
      return e < r || n < r ? e > n ? n + 1 : e + 1 : s === i ? r : r + 1;
    }
    return function(e, r) {
      if (e === r)
        return 0;
      if (e.length > r.length) {
        var n = e;
        e = r, r = n;
      }
      for (var s = e.length, i = r.length; s > 0 && e.charCodeAt(s - 1) === r.charCodeAt(i - 1); )
        s--, i--;
      for (var l = 0; l < s && e.charCodeAt(l) === r.charCodeAt(l); )
        l++;
      if (s -= l, i -= l, s === 0 || i < 3)
        return i;
      var f = 0, d, p, g, w, P, x, T, S, y, _, m, b, $ = [];
      for (d = 0; d < s; d++)
        $.push(d + 1), $.push(e.charCodeAt(l + d));
      for (var O = $.length - 1; f < i - 3; )
        for (y = r.charCodeAt(l + (p = f)), _ = r.charCodeAt(l + (g = f + 1)), m = r.charCodeAt(l + (w = f + 2)), b = r.charCodeAt(l + (P = f + 3)), x = f += 4, d = 0; d < O; d += 2)
          T = $[d], S = $[d + 1], p = t(T, p, g, y, S), g = t(p, g, w, _, S), w = t(g, w, P, m, S), x = t(w, P, x, b, S), $[d] = x, P = w, w = g, g = p, p = T;
      for (; f < i; )
        for (y = r.charCodeAt(l + (p = f)), x = ++f, d = 0; d < O; d += 2)
          T = $[d], $[d] = x = t(T, p, x, y, $[d + 1]), p = T;
      return x;
    };
  }()), pa;
}
var Bg = zg();
const Zg = /* @__PURE__ */ zi(Bg);
var ga, sc;
function Xo() {
  if (sc) return ga;
  sc = 1;
  function t(e) {
    return Object.prototype.toString.call(e) === "[object Array]";
  }
  return ga = Array.isArray || t, ga;
}
var ya, ic;
function Qo() {
  if (ic) return ya;
  ic = 1;
  function t(e) {
    return typeof e == "function";
  }
  return ya = t, ya;
}
var wa, ac;
function Jg() {
  if (ac) return wa;
  ac = 1;
  var t = Xo(), e = Qo();
  function r(n, s, i) {
    if (!t(n))
      throw new TypeError("dot()::invalid input argument. First argument must be an array. Value: `" + n + "`.");
    if (!t(s))
      throw new TypeError("dot()::invalid input argument. Second argument must be an array. Value: `" + s + "`.");
    if (arguments.length > 2 && !e(i))
      throw new TypeError("dot()::invalid input argument. Accessor must be a function. Value: `" + i + "`.");
    var l = n.length, f = 0, d;
    if (l !== s.length)
      throw new Error("dot()::invalid input argument. Arrays must be of equal length.");
    if (!l)
      return null;
    if (i)
      for (d = 0; d < l; d++)
        f += i(n[d], d, 0) * i(s[d], d, 1);
    else
      for (d = 0; d < l; d++)
        f += n[d] * s[d];
    return f;
  }
  return wa = r, wa;
}
var _a, oc;
function Wg() {
  if (oc) return _a;
  oc = 1;
  var t = Xo(), e = Qo();
  function r(n, s) {
    if (!t(n))
      throw new TypeError("l2norm()::invalid input argument. Must provide an array.  Value: `" + n + "`.");
    if (arguments.length > 1 && !e(s))
      throw new TypeError("l2norm()::invalid input argument. Accessor must be a function. Value: `" + s + "`.");
    var i = n.length, l = 0, f = 1, d, p, g, w;
    if (!i)
      return null;
    if (s)
      for (w = 0; w < i; w++)
        p = s(n[w], w), g = p < 0 ? -p : p, g > 0 && (g > l ? (d = l / p, f = 1 + f * d * d, l = g) : (d = p / l, f = f + d * d));
    else
      for (w = 0; w < i; w++)
        p = n[w], g = p < 0 ? -p : p, g > 0 && (g > l ? (d = l / p, f = 1 + f * d * d, l = g) : (d = p / l, f = f + d * d));
    return l * Math.sqrt(f);
  }
  return _a = r, _a;
}
var va, lc;
function Kg() {
  if (lc) return va;
  lc = 1;
  var t = Jg(), e = Wg(), r = Xo(), n = Qo();
  function s(l, f) {
    return function(p, g) {
      return l(p, g, f);
    };
  }
  function i(l, f, d) {
    var p, g, w;
    if (!r(l))
      throw new TypeError("cosine-similarity()::invalid input argument. First argument must be an array. Value: `" + l + "`.");
    if (!r(f))
      throw new TypeError("cosine-similarity()::invalid input argument. Second argument must be an array. Value: `" + f + "`.");
    if (arguments.length > 2 && !n(d))
      throw new TypeError("cosine-similarity()::invalid input argument. Accessor must be a function. Value: `" + d + "`.");
    if (l.length !== f.length)
      throw new Error("cosine-similarity()::invalid input argument. Input arrays must have the same length.");
    return l.length ? (d ? (p = t(l, f, d), g = e(l, s(d, 0)), w = e(f, s(d, 1))) : (p = t(l, f), g = e(l), w = e(f)), p / (g * w)) : null;
  }
  return va = i, va;
}
var Gg = Kg();
const Yg = /* @__PURE__ */ zi(Gg);
var Ie = {};
const Xg = Object.prototype.toString;
function Qn(t) {
  const e = Xg.call(t);
  return e.endsWith("Array]") && !e.includes("Big");
}
const Qg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  isAnyArray: Qn
}, Symbol.toStringTag, { value: "Module" })), Hg = /* @__PURE__ */ yh(Qg);
function ey(t) {
  var e = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  if (!Qn(t))
    throw new TypeError("input must be an array");
  if (t.length === 0)
    throw new TypeError("input must not be empty");
  var r = e.fromIndex, n = r === void 0 ? 0 : r, s = e.toIndex, i = s === void 0 ? t.length : s;
  if (n < 0 || n >= t.length || !Number.isInteger(n))
    throw new Error("fromIndex must be a positive integer smaller than length");
  if (i <= n || i > t.length || !Number.isInteger(i))
    throw new Error("toIndex must be an integer greater than fromIndex and at most equal to length");
  for (var l = t[n], f = n + 1; f < i; f++)
    t[f] > l && (l = t[f]);
  return l;
}
function ty(t) {
  var e = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  if (!Qn(t))
    throw new TypeError("input must be an array");
  if (t.length === 0)
    throw new TypeError("input must not be empty");
  var r = e.fromIndex, n = r === void 0 ? 0 : r, s = e.toIndex, i = s === void 0 ? t.length : s;
  if (n < 0 || n >= t.length || !Number.isInteger(n))
    throw new Error("fromIndex must be a positive integer smaller than length");
  if (i <= n || i > t.length || !Number.isInteger(i))
    throw new Error("toIndex must be an integer greater than fromIndex and at most equal to length");
  for (var l = t[n], f = n + 1; f < i; f++)
    t[f] < l && (l = t[f]);
  return l;
}
function ry(t) {
  var e = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  if (Qn(t)) {
    if (t.length === 0)
      throw new TypeError("input must not be empty");
  } else throw new TypeError("input must be an array");
  var r;
  if (e.output !== void 0) {
    if (!Qn(e.output))
      throw new TypeError("output option must be an array if specified");
    r = e.output;
  } else
    r = new Array(t.length);
  var n = ty(t), s = ey(t);
  if (n === s)
    throw new RangeError("minimum and maximum input values are equal. Cannot rescale a constant array");
  var i = e.min, l = i === void 0 ? e.autoMinMax ? n : 0 : i, f = e.max, d = f === void 0 ? e.autoMinMax ? s : 1 : f;
  if (l >= d)
    throw new RangeError("min option must be smaller than max option");
  for (var p = (d - l) / (s - n), g = 0; g < t.length; g++)
    r[g] = (t[g] - n) * p + l;
  return r;
}
const ny = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: ry
}, Symbol.toStringTag, { value: "Module" })), sy = /* @__PURE__ */ yh(ny);
var cc;
function iy() {
  var Tn, no, kt;
  if (cc) return Ie;
  cc = 1, Object.defineProperty(Ie, "__esModule", { value: !0 });
  var t = Hg, e = sy;
  const r = " ".repeat(2), n = " ".repeat(4);
  function s() {
    return i(this);
  }
  function i(v, u = {}) {
    const {
      maxRows: o = 15,
      maxColumns: a = 10,
      maxNumSize: c = 8,
      padMinus: h = "auto"
    } = u;
    return `${v.constructor.name} {
${r}[
${n}${l(v, o, a, c, h)}
${r}]
${r}rows: ${v.rows}
${r}columns: ${v.columns}
}`;
  }
  function l(v, u, o, a, c) {
    const { rows: h, columns: E } = v, k = Math.min(h, u), C = Math.min(E, o), R = [];
    if (c === "auto") {
      c = !1;
      e: for (let L = 0; L < k; L++)
        for (let M = 0; M < C; M++)
          if (v.get(L, M) < 0) {
            c = !0;
            break e;
          }
    }
    for (let L = 0; L < k; L++) {
      let M = [];
      for (let K = 0; K < C; K++)
        M.push(f(v.get(L, K), a, c));
      R.push(`${M.join(" ")}`);
    }
    return C !== E && (R[R.length - 1] += ` ... ${E - o} more columns`), k !== h && R.push(`... ${h - u} more rows`), R.join(`
${n}`);
  }
  function f(v, u, o) {
    return (v >= 0 && o ? ` ${d(v, u - 1)}` : d(v, u)).padEnd(u);
  }
  function d(v, u) {
    let o = v.toString();
    if (o.length <= u) return o;
    let a = v.toFixed(u);
    if (a.length > u && (a = v.toFixed(Math.max(0, u - (a.length - u)))), a.length <= u && !a.startsWith("0.000") && !a.startsWith("-0.000"))
      return a;
    let c = v.toExponential(u);
    return c.length > u && (c = v.toExponential(Math.max(0, u - (c.length - u)))), c.slice(0);
  }
  function p(v, u) {
    v.prototype.add = function(a) {
      return typeof a == "number" ? this.addS(a) : this.addM(a);
    }, v.prototype.addS = function(a) {
      for (let c = 0; c < this.rows; c++)
        for (let h = 0; h < this.columns; h++)
          this.set(c, h, this.get(c, h) + a);
      return this;
    }, v.prototype.addM = function(a) {
      if (a = u.checkMatrix(a), this.rows !== a.rows || this.columns !== a.columns)
        throw new RangeError("Matrices dimensions must be equal");
      for (let c = 0; c < this.rows; c++)
        for (let h = 0; h < this.columns; h++)
          this.set(c, h, this.get(c, h) + a.get(c, h));
      return this;
    }, v.add = function(a, c) {
      return new u(a).add(c);
    }, v.prototype.sub = function(a) {
      return typeof a == "number" ? this.subS(a) : this.subM(a);
    }, v.prototype.subS = function(a) {
      for (let c = 0; c < this.rows; c++)
        for (let h = 0; h < this.columns; h++)
          this.set(c, h, this.get(c, h) - a);
      return this;
    }, v.prototype.subM = function(a) {
      if (a = u.checkMatrix(a), this.rows !== a.rows || this.columns !== a.columns)
        throw new RangeError("Matrices dimensions must be equal");
      for (let c = 0; c < this.rows; c++)
        for (let h = 0; h < this.columns; h++)
          this.set(c, h, this.get(c, h) - a.get(c, h));
      return this;
    }, v.sub = function(a, c) {
      return new u(a).sub(c);
    }, v.prototype.subtract = v.prototype.sub, v.prototype.subtractS = v.prototype.subS, v.prototype.subtractM = v.prototype.subM, v.subtract = v.sub, v.prototype.mul = function(a) {
      return typeof a == "number" ? this.mulS(a) : this.mulM(a);
    }, v.prototype.mulS = function(a) {
      for (let c = 0; c < this.rows; c++)
        for (let h = 0; h < this.columns; h++)
          this.set(c, h, this.get(c, h) * a);
      return this;
    }, v.prototype.mulM = function(a) {
      if (a = u.checkMatrix(a), this.rows !== a.rows || this.columns !== a.columns)
        throw new RangeError("Matrices dimensions must be equal");
      for (let c = 0; c < this.rows; c++)
        for (let h = 0; h < this.columns; h++)
          this.set(c, h, this.get(c, h) * a.get(c, h));
      return this;
    }, v.mul = function(a, c) {
      return new u(a).mul(c);
    }, v.prototype.multiply = v.prototype.mul, v.prototype.multiplyS = v.prototype.mulS, v.prototype.multiplyM = v.prototype.mulM, v.multiply = v.mul, v.prototype.div = function(a) {
      return typeof a == "number" ? this.divS(a) : this.divM(a);
    }, v.prototype.divS = function(a) {
      for (let c = 0; c < this.rows; c++)
        for (let h = 0; h < this.columns; h++)
          this.set(c, h, this.get(c, h) / a);
      return this;
    }, v.prototype.divM = function(a) {
      if (a = u.checkMatrix(a), this.rows !== a.rows || this.columns !== a.columns)
        throw new RangeError("Matrices dimensions must be equal");
      for (let c = 0; c < this.rows; c++)
        for (let h = 0; h < this.columns; h++)
          this.set(c, h, this.get(c, h) / a.get(c, h));
      return this;
    }, v.div = function(a, c) {
      return new u(a).div(c);
    }, v.prototype.divide = v.prototype.div, v.prototype.divideS = v.prototype.divS, v.prototype.divideM = v.prototype.divM, v.divide = v.div, v.prototype.mod = function(a) {
      return typeof a == "number" ? this.modS(a) : this.modM(a);
    }, v.prototype.modS = function(a) {
      for (let c = 0; c < this.rows; c++)
        for (let h = 0; h < this.columns; h++)
          this.set(c, h, this.get(c, h) % a);
      return this;
    }, v.prototype.modM = function(a) {
      if (a = u.checkMatrix(a), this.rows !== a.rows || this.columns !== a.columns)
        throw new RangeError("Matrices dimensions must be equal");
      for (let c = 0; c < this.rows; c++)
        for (let h = 0; h < this.columns; h++)
          this.set(c, h, this.get(c, h) % a.get(c, h));
      return this;
    }, v.mod = function(a, c) {
      return new u(a).mod(c);
    }, v.prototype.modulus = v.prototype.mod, v.prototype.modulusS = v.prototype.modS, v.prototype.modulusM = v.prototype.modM, v.modulus = v.mod, v.prototype.and = function(a) {
      return typeof a == "number" ? this.andS(a) : this.andM(a);
    }, v.prototype.andS = function(a) {
      for (let c = 0; c < this.rows; c++)
        for (let h = 0; h < this.columns; h++)
          this.set(c, h, this.get(c, h) & a);
      return this;
    }, v.prototype.andM = function(a) {
      if (a = u.checkMatrix(a), this.rows !== a.rows || this.columns !== a.columns)
        throw new RangeError("Matrices dimensions must be equal");
      for (let c = 0; c < this.rows; c++)
        for (let h = 0; h < this.columns; h++)
          this.set(c, h, this.get(c, h) & a.get(c, h));
      return this;
    }, v.and = function(a, c) {
      return new u(a).and(c);
    }, v.prototype.or = function(a) {
      return typeof a == "number" ? this.orS(a) : this.orM(a);
    }, v.prototype.orS = function(a) {
      for (let c = 0; c < this.rows; c++)
        for (let h = 0; h < this.columns; h++)
          this.set(c, h, this.get(c, h) | a);
      return this;
    }, v.prototype.orM = function(a) {
      if (a = u.checkMatrix(a), this.rows !== a.rows || this.columns !== a.columns)
        throw new RangeError("Matrices dimensions must be equal");
      for (let c = 0; c < this.rows; c++)
        for (let h = 0; h < this.columns; h++)
          this.set(c, h, this.get(c, h) | a.get(c, h));
      return this;
    }, v.or = function(a, c) {
      return new u(a).or(c);
    }, v.prototype.xor = function(a) {
      return typeof a == "number" ? this.xorS(a) : this.xorM(a);
    }, v.prototype.xorS = function(a) {
      for (let c = 0; c < this.rows; c++)
        for (let h = 0; h < this.columns; h++)
          this.set(c, h, this.get(c, h) ^ a);
      return this;
    }, v.prototype.xorM = function(a) {
      if (a = u.checkMatrix(a), this.rows !== a.rows || this.columns !== a.columns)
        throw new RangeError("Matrices dimensions must be equal");
      for (let c = 0; c < this.rows; c++)
        for (let h = 0; h < this.columns; h++)
          this.set(c, h, this.get(c, h) ^ a.get(c, h));
      return this;
    }, v.xor = function(a, c) {
      return new u(a).xor(c);
    }, v.prototype.leftShift = function(a) {
      return typeof a == "number" ? this.leftShiftS(a) : this.leftShiftM(a);
    }, v.prototype.leftShiftS = function(a) {
      for (let c = 0; c < this.rows; c++)
        for (let h = 0; h < this.columns; h++)
          this.set(c, h, this.get(c, h) << a);
      return this;
    }, v.prototype.leftShiftM = function(a) {
      if (a = u.checkMatrix(a), this.rows !== a.rows || this.columns !== a.columns)
        throw new RangeError("Matrices dimensions must be equal");
      for (let c = 0; c < this.rows; c++)
        for (let h = 0; h < this.columns; h++)
          this.set(c, h, this.get(c, h) << a.get(c, h));
      return this;
    }, v.leftShift = function(a, c) {
      return new u(a).leftShift(c);
    }, v.prototype.signPropagatingRightShift = function(a) {
      return typeof a == "number" ? this.signPropagatingRightShiftS(a) : this.signPropagatingRightShiftM(a);
    }, v.prototype.signPropagatingRightShiftS = function(a) {
      for (let c = 0; c < this.rows; c++)
        for (let h = 0; h < this.columns; h++)
          this.set(c, h, this.get(c, h) >> a);
      return this;
    }, v.prototype.signPropagatingRightShiftM = function(a) {
      if (a = u.checkMatrix(a), this.rows !== a.rows || this.columns !== a.columns)
        throw new RangeError("Matrices dimensions must be equal");
      for (let c = 0; c < this.rows; c++)
        for (let h = 0; h < this.columns; h++)
          this.set(c, h, this.get(c, h) >> a.get(c, h));
      return this;
    }, v.signPropagatingRightShift = function(a, c) {
      return new u(a).signPropagatingRightShift(c);
    }, v.prototype.rightShift = function(a) {
      return typeof a == "number" ? this.rightShiftS(a) : this.rightShiftM(a);
    }, v.prototype.rightShiftS = function(a) {
      for (let c = 0; c < this.rows; c++)
        for (let h = 0; h < this.columns; h++)
          this.set(c, h, this.get(c, h) >>> a);
      return this;
    }, v.prototype.rightShiftM = function(a) {
      if (a = u.checkMatrix(a), this.rows !== a.rows || this.columns !== a.columns)
        throw new RangeError("Matrices dimensions must be equal");
      for (let c = 0; c < this.rows; c++)
        for (let h = 0; h < this.columns; h++)
          this.set(c, h, this.get(c, h) >>> a.get(c, h));
      return this;
    }, v.rightShift = function(a, c) {
      return new u(a).rightShift(c);
    }, v.prototype.zeroFillRightShift = v.prototype.rightShift, v.prototype.zeroFillRightShiftS = v.prototype.rightShiftS, v.prototype.zeroFillRightShiftM = v.prototype.rightShiftM, v.zeroFillRightShift = v.rightShift, v.prototype.not = function() {
      for (let a = 0; a < this.rows; a++)
        for (let c = 0; c < this.columns; c++)
          this.set(a, c, ~this.get(a, c));
      return this;
    }, v.not = function(a) {
      return new u(a).not();
    }, v.prototype.abs = function() {
      for (let a = 0; a < this.rows; a++)
        for (let c = 0; c < this.columns; c++)
          this.set(a, c, Math.abs(this.get(a, c)));
      return this;
    }, v.abs = function(a) {
      return new u(a).abs();
    }, v.prototype.acos = function() {
      for (let a = 0; a < this.rows; a++)
        for (let c = 0; c < this.columns; c++)
          this.set(a, c, Math.acos(this.get(a, c)));
      return this;
    }, v.acos = function(a) {
      return new u(a).acos();
    }, v.prototype.acosh = function() {
      for (let a = 0; a < this.rows; a++)
        for (let c = 0; c < this.columns; c++)
          this.set(a, c, Math.acosh(this.get(a, c)));
      return this;
    }, v.acosh = function(a) {
      return new u(a).acosh();
    }, v.prototype.asin = function() {
      for (let a = 0; a < this.rows; a++)
        for (let c = 0; c < this.columns; c++)
          this.set(a, c, Math.asin(this.get(a, c)));
      return this;
    }, v.asin = function(a) {
      return new u(a).asin();
    }, v.prototype.asinh = function() {
      for (let a = 0; a < this.rows; a++)
        for (let c = 0; c < this.columns; c++)
          this.set(a, c, Math.asinh(this.get(a, c)));
      return this;
    }, v.asinh = function(a) {
      return new u(a).asinh();
    }, v.prototype.atan = function() {
      for (let a = 0; a < this.rows; a++)
        for (let c = 0; c < this.columns; c++)
          this.set(a, c, Math.atan(this.get(a, c)));
      return this;
    }, v.atan = function(a) {
      return new u(a).atan();
    }, v.prototype.atanh = function() {
      for (let a = 0; a < this.rows; a++)
        for (let c = 0; c < this.columns; c++)
          this.set(a, c, Math.atanh(this.get(a, c)));
      return this;
    }, v.atanh = function(a) {
      return new u(a).atanh();
    }, v.prototype.cbrt = function() {
      for (let a = 0; a < this.rows; a++)
        for (let c = 0; c < this.columns; c++)
          this.set(a, c, Math.cbrt(this.get(a, c)));
      return this;
    }, v.cbrt = function(a) {
      return new u(a).cbrt();
    }, v.prototype.ceil = function() {
      for (let a = 0; a < this.rows; a++)
        for (let c = 0; c < this.columns; c++)
          this.set(a, c, Math.ceil(this.get(a, c)));
      return this;
    }, v.ceil = function(a) {
      return new u(a).ceil();
    }, v.prototype.clz32 = function() {
      for (let a = 0; a < this.rows; a++)
        for (let c = 0; c < this.columns; c++)
          this.set(a, c, Math.clz32(this.get(a, c)));
      return this;
    }, v.clz32 = function(a) {
      return new u(a).clz32();
    }, v.prototype.cos = function() {
      for (let a = 0; a < this.rows; a++)
        for (let c = 0; c < this.columns; c++)
          this.set(a, c, Math.cos(this.get(a, c)));
      return this;
    }, v.cos = function(a) {
      return new u(a).cos();
    }, v.prototype.cosh = function() {
      for (let a = 0; a < this.rows; a++)
        for (let c = 0; c < this.columns; c++)
          this.set(a, c, Math.cosh(this.get(a, c)));
      return this;
    }, v.cosh = function(a) {
      return new u(a).cosh();
    }, v.prototype.exp = function() {
      for (let a = 0; a < this.rows; a++)
        for (let c = 0; c < this.columns; c++)
          this.set(a, c, Math.exp(this.get(a, c)));
      return this;
    }, v.exp = function(a) {
      return new u(a).exp();
    }, v.prototype.expm1 = function() {
      for (let a = 0; a < this.rows; a++)
        for (let c = 0; c < this.columns; c++)
          this.set(a, c, Math.expm1(this.get(a, c)));
      return this;
    }, v.expm1 = function(a) {
      return new u(a).expm1();
    }, v.prototype.floor = function() {
      for (let a = 0; a < this.rows; a++)
        for (let c = 0; c < this.columns; c++)
          this.set(a, c, Math.floor(this.get(a, c)));
      return this;
    }, v.floor = function(a) {
      return new u(a).floor();
    }, v.prototype.fround = function() {
      for (let a = 0; a < this.rows; a++)
        for (let c = 0; c < this.columns; c++)
          this.set(a, c, Math.fround(this.get(a, c)));
      return this;
    }, v.fround = function(a) {
      return new u(a).fround();
    }, v.prototype.log = function() {
      for (let a = 0; a < this.rows; a++)
        for (let c = 0; c < this.columns; c++)
          this.set(a, c, Math.log(this.get(a, c)));
      return this;
    }, v.log = function(a) {
      return new u(a).log();
    }, v.prototype.log1p = function() {
      for (let a = 0; a < this.rows; a++)
        for (let c = 0; c < this.columns; c++)
          this.set(a, c, Math.log1p(this.get(a, c)));
      return this;
    }, v.log1p = function(a) {
      return new u(a).log1p();
    }, v.prototype.log10 = function() {
      for (let a = 0; a < this.rows; a++)
        for (let c = 0; c < this.columns; c++)
          this.set(a, c, Math.log10(this.get(a, c)));
      return this;
    }, v.log10 = function(a) {
      return new u(a).log10();
    }, v.prototype.log2 = function() {
      for (let a = 0; a < this.rows; a++)
        for (let c = 0; c < this.columns; c++)
          this.set(a, c, Math.log2(this.get(a, c)));
      return this;
    }, v.log2 = function(a) {
      return new u(a).log2();
    }, v.prototype.round = function() {
      for (let a = 0; a < this.rows; a++)
        for (let c = 0; c < this.columns; c++)
          this.set(a, c, Math.round(this.get(a, c)));
      return this;
    }, v.round = function(a) {
      return new u(a).round();
    }, v.prototype.sign = function() {
      for (let a = 0; a < this.rows; a++)
        for (let c = 0; c < this.columns; c++)
          this.set(a, c, Math.sign(this.get(a, c)));
      return this;
    }, v.sign = function(a) {
      return new u(a).sign();
    }, v.prototype.sin = function() {
      for (let a = 0; a < this.rows; a++)
        for (let c = 0; c < this.columns; c++)
          this.set(a, c, Math.sin(this.get(a, c)));
      return this;
    }, v.sin = function(a) {
      return new u(a).sin();
    }, v.prototype.sinh = function() {
      for (let a = 0; a < this.rows; a++)
        for (let c = 0; c < this.columns; c++)
          this.set(a, c, Math.sinh(this.get(a, c)));
      return this;
    }, v.sinh = function(a) {
      return new u(a).sinh();
    }, v.prototype.sqrt = function() {
      for (let a = 0; a < this.rows; a++)
        for (let c = 0; c < this.columns; c++)
          this.set(a, c, Math.sqrt(this.get(a, c)));
      return this;
    }, v.sqrt = function(a) {
      return new u(a).sqrt();
    }, v.prototype.tan = function() {
      for (let a = 0; a < this.rows; a++)
        for (let c = 0; c < this.columns; c++)
          this.set(a, c, Math.tan(this.get(a, c)));
      return this;
    }, v.tan = function(a) {
      return new u(a).tan();
    }, v.prototype.tanh = function() {
      for (let a = 0; a < this.rows; a++)
        for (let c = 0; c < this.columns; c++)
          this.set(a, c, Math.tanh(this.get(a, c)));
      return this;
    }, v.tanh = function(a) {
      return new u(a).tanh();
    }, v.prototype.trunc = function() {
      for (let a = 0; a < this.rows; a++)
        for (let c = 0; c < this.columns; c++)
          this.set(a, c, Math.trunc(this.get(a, c)));
      return this;
    }, v.trunc = function(a) {
      return new u(a).trunc();
    }, v.pow = function(a, c) {
      return new u(a).pow(c);
    }, v.prototype.pow = function(a) {
      return typeof a == "number" ? this.powS(a) : this.powM(a);
    }, v.prototype.powS = function(a) {
      for (let c = 0; c < this.rows; c++)
        for (let h = 0; h < this.columns; h++)
          this.set(c, h, this.get(c, h) ** a);
      return this;
    }, v.prototype.powM = function(a) {
      if (a = u.checkMatrix(a), this.rows !== a.rows || this.columns !== a.columns)
        throw new RangeError("Matrices dimensions must be equal");
      for (let c = 0; c < this.rows; c++)
        for (let h = 0; h < this.columns; h++)
          this.set(c, h, this.get(c, h) ** a.get(c, h));
      return this;
    };
  }
  function g(v, u, o) {
    let a = o ? v.rows : v.rows - 1;
    if (u < 0 || u > a)
      throw new RangeError("Row index out of range");
  }
  function w(v, u, o) {
    let a = o ? v.columns : v.columns - 1;
    if (u < 0 || u > a)
      throw new RangeError("Column index out of range");
  }
  function P(v, u) {
    if (u.to1DArray && (u = u.to1DArray()), u.length !== v.columns)
      throw new RangeError(
        "vector size must be the same as the number of columns"
      );
    return u;
  }
  function x(v, u) {
    if (u.to1DArray && (u = u.to1DArray()), u.length !== v.rows)
      throw new RangeError("vector size must be the same as the number of rows");
    return u;
  }
  function T(v, u) {
    if (!t.isAnyArray(u))
      throw new TypeError("row indices must be an array");
    for (let o = 0; o < u.length; o++)
      if (u[o] < 0 || u[o] >= v.rows)
        throw new RangeError("row indices are out of range");
  }
  function S(v, u) {
    if (!t.isAnyArray(u))
      throw new TypeError("column indices must be an array");
    for (let o = 0; o < u.length; o++)
      if (u[o] < 0 || u[o] >= v.columns)
        throw new RangeError("column indices are out of range");
  }
  function y(v, u, o, a, c) {
    if (arguments.length !== 5)
      throw new RangeError("expected 4 arguments");
    if (m("startRow", u), m("endRow", o), m("startColumn", a), m("endColumn", c), u > o || a > c || u < 0 || u >= v.rows || o < 0 || o >= v.rows || a < 0 || a >= v.columns || c < 0 || c >= v.columns)
      throw new RangeError("Submatrix indices are out of range");
  }
  function _(v, u = 0) {
    let o = [];
    for (let a = 0; a < v; a++)
      o.push(u);
    return o;
  }
  function m(v, u) {
    if (typeof u != "number")
      throw new TypeError(`${v} must be a number`);
  }
  function b(v) {
    if (v.isEmpty())
      throw new Error("Empty matrix has no elements to index");
  }
  function $(v) {
    let u = _(v.rows);
    for (let o = 0; o < v.rows; ++o)
      for (let a = 0; a < v.columns; ++a)
        u[o] += v.get(o, a);
    return u;
  }
  function O(v) {
    let u = _(v.columns);
    for (let o = 0; o < v.rows; ++o)
      for (let a = 0; a < v.columns; ++a)
        u[a] += v.get(o, a);
    return u;
  }
  function A(v) {
    let u = 0;
    for (let o = 0; o < v.rows; o++)
      for (let a = 0; a < v.columns; a++)
        u += v.get(o, a);
    return u;
  }
  function j(v) {
    let u = _(v.rows, 1);
    for (let o = 0; o < v.rows; ++o)
      for (let a = 0; a < v.columns; ++a)
        u[o] *= v.get(o, a);
    return u;
  }
  function V(v) {
    let u = _(v.columns, 1);
    for (let o = 0; o < v.rows; ++o)
      for (let a = 0; a < v.columns; ++a)
        u[a] *= v.get(o, a);
    return u;
  }
  function G(v) {
    let u = 1;
    for (let o = 0; o < v.rows; o++)
      for (let a = 0; a < v.columns; a++)
        u *= v.get(o, a);
    return u;
  }
  function H(v, u, o) {
    const a = v.rows, c = v.columns, h = [];
    for (let E = 0; E < a; E++) {
      let k = 0, C = 0, R = 0;
      for (let L = 0; L < c; L++)
        R = v.get(E, L) - o[E], k += R, C += R * R;
      u ? h.push((C - k * k / c) / (c - 1)) : h.push((C - k * k / c) / c);
    }
    return h;
  }
  function ee(v, u, o) {
    const a = v.rows, c = v.columns, h = [];
    for (let E = 0; E < c; E++) {
      let k = 0, C = 0, R = 0;
      for (let L = 0; L < a; L++)
        R = v.get(L, E) - o[E], k += R, C += R * R;
      u ? h.push((C - k * k / a) / (a - 1)) : h.push((C - k * k / a) / a);
    }
    return h;
  }
  function ye(v, u, o) {
    const a = v.rows, c = v.columns, h = a * c;
    let E = 0, k = 0, C = 0;
    for (let R = 0; R < a; R++)
      for (let L = 0; L < c; L++)
        C = v.get(R, L) - o, E += C, k += C * C;
    return u ? (k - E * E / h) / (h - 1) : (k - E * E / h) / h;
  }
  function ge(v, u) {
    for (let o = 0; o < v.rows; o++)
      for (let a = 0; a < v.columns; a++)
        v.set(o, a, v.get(o, a) - u[o]);
  }
  function ke(v, u) {
    for (let o = 0; o < v.rows; o++)
      for (let a = 0; a < v.columns; a++)
        v.set(o, a, v.get(o, a) - u[a]);
  }
  function ze(v, u) {
    for (let o = 0; o < v.rows; o++)
      for (let a = 0; a < v.columns; a++)
        v.set(o, a, v.get(o, a) - u);
  }
  function st(v) {
    const u = [];
    for (let o = 0; o < v.rows; o++) {
      let a = 0;
      for (let c = 0; c < v.columns; c++)
        a += v.get(o, c) ** 2 / (v.columns - 1);
      u.push(Math.sqrt(a));
    }
    return u;
  }
  function ct(v, u) {
    for (let o = 0; o < v.rows; o++)
      for (let a = 0; a < v.columns; a++)
        v.set(o, a, v.get(o, a) / u[o]);
  }
  function qe(v) {
    const u = [];
    for (let o = 0; o < v.columns; o++) {
      let a = 0;
      for (let c = 0; c < v.rows; c++)
        a += v.get(c, o) ** 2 / (v.rows - 1);
      u.push(Math.sqrt(a));
    }
    return u;
  }
  function xt(v, u) {
    for (let o = 0; o < v.rows; o++)
      for (let a = 0; a < v.columns; a++)
        v.set(o, a, v.get(o, a) / u[a]);
  }
  function re(v) {
    const u = v.size - 1;
    let o = 0;
    for (let a = 0; a < v.columns; a++)
      for (let c = 0; c < v.rows; c++)
        o += v.get(c, a) ** 2 / u;
    return Math.sqrt(o);
  }
  function U(v, u) {
    for (let o = 0; o < v.rows; o++)
      for (let a = 0; a < v.columns; a++)
        v.set(o, a, v.get(o, a) / u);
  }
  class Z {
    static from1DArray(u, o, a) {
      if (u * o !== a.length)
        throw new RangeError("data length does not match given dimensions");
      let h = new I(u, o);
      for (let E = 0; E < u; E++)
        for (let k = 0; k < o; k++)
          h.set(E, k, a[E * o + k]);
      return h;
    }
    static rowVector(u) {
      let o = new I(1, u.length);
      for (let a = 0; a < u.length; a++)
        o.set(0, a, u[a]);
      return o;
    }
    static columnVector(u) {
      let o = new I(u.length, 1);
      for (let a = 0; a < u.length; a++)
        o.set(a, 0, u[a]);
      return o;
    }
    static zeros(u, o) {
      return new I(u, o);
    }
    static ones(u, o) {
      return new I(u, o).fill(1);
    }
    static rand(u, o, a = {}) {
      if (typeof a != "object")
        throw new TypeError("options must be an object");
      const { random: c = Math.random } = a;
      let h = new I(u, o);
      for (let E = 0; E < u; E++)
        for (let k = 0; k < o; k++)
          h.set(E, k, c());
      return h;
    }
    static randInt(u, o, a = {}) {
      if (typeof a != "object")
        throw new TypeError("options must be an object");
      const { min: c = 0, max: h = 1e3, random: E = Math.random } = a;
      if (!Number.isInteger(c)) throw new TypeError("min must be an integer");
      if (!Number.isInteger(h)) throw new TypeError("max must be an integer");
      if (c >= h) throw new RangeError("min must be smaller than max");
      let k = h - c, C = new I(u, o);
      for (let R = 0; R < u; R++)
        for (let L = 0; L < o; L++) {
          let M = c + Math.round(E() * k);
          C.set(R, L, M);
        }
      return C;
    }
    static eye(u, o, a) {
      o === void 0 && (o = u), a === void 0 && (a = 1);
      let c = Math.min(u, o), h = this.zeros(u, o);
      for (let E = 0; E < c; E++)
        h.set(E, E, a);
      return h;
    }
    static diag(u, o, a) {
      let c = u.length;
      o === void 0 && (o = c), a === void 0 && (a = o);
      let h = Math.min(c, o, a), E = this.zeros(o, a);
      for (let k = 0; k < h; k++)
        E.set(k, k, u[k]);
      return E;
    }
    static min(u, o) {
      u = this.checkMatrix(u), o = this.checkMatrix(o);
      let a = u.rows, c = u.columns, h = new I(a, c);
      for (let E = 0; E < a; E++)
        for (let k = 0; k < c; k++)
          h.set(E, k, Math.min(u.get(E, k), o.get(E, k)));
      return h;
    }
    static max(u, o) {
      u = this.checkMatrix(u), o = this.checkMatrix(o);
      let a = u.rows, c = u.columns, h = new this(a, c);
      for (let E = 0; E < a; E++)
        for (let k = 0; k < c; k++)
          h.set(E, k, Math.max(u.get(E, k), o.get(E, k)));
      return h;
    }
    static checkMatrix(u) {
      return Z.isMatrix(u) ? u : new I(u);
    }
    static isMatrix(u) {
      return u != null && u.klass === "Matrix";
    }
    get size() {
      return this.rows * this.columns;
    }
    apply(u) {
      if (typeof u != "function")
        throw new TypeError("callback must be a function");
      for (let o = 0; o < this.rows; o++)
        for (let a = 0; a < this.columns; a++)
          u.call(this, o, a);
      return this;
    }
    to1DArray() {
      let u = [];
      for (let o = 0; o < this.rows; o++)
        for (let a = 0; a < this.columns; a++)
          u.push(this.get(o, a));
      return u;
    }
    to2DArray() {
      let u = [];
      for (let o = 0; o < this.rows; o++) {
        u.push([]);
        for (let a = 0; a < this.columns; a++)
          u[o].push(this.get(o, a));
      }
      return u;
    }
    toJSON() {
      return this.to2DArray();
    }
    isRowVector() {
      return this.rows === 1;
    }
    isColumnVector() {
      return this.columns === 1;
    }
    isVector() {
      return this.rows === 1 || this.columns === 1;
    }
    isSquare() {
      return this.rows === this.columns;
    }
    isEmpty() {
      return this.rows === 0 || this.columns === 0;
    }
    isSymmetric() {
      if (this.isSquare()) {
        for (let u = 0; u < this.rows; u++)
          for (let o = 0; o <= u; o++)
            if (this.get(u, o) !== this.get(o, u))
              return !1;
        return !0;
      }
      return !1;
    }
    isDistance() {
      if (!this.isSymmetric()) return !1;
      for (let u = 0; u < this.rows; u++)
        if (this.get(u, u) !== 0) return !1;
      return !0;
    }
    isEchelonForm() {
      let u = 0, o = 0, a = -1, c = !0, h = !1;
      for (; u < this.rows && c; ) {
        for (o = 0, h = !1; o < this.columns && h === !1; )
          this.get(u, o) === 0 ? o++ : this.get(u, o) === 1 && o > a ? (h = !0, a = o) : (c = !1, h = !0);
        u++;
      }
      return c;
    }
    isReducedEchelonForm() {
      let u = 0, o = 0, a = -1, c = !0, h = !1;
      for (; u < this.rows && c; ) {
        for (o = 0, h = !1; o < this.columns && h === !1; )
          this.get(u, o) === 0 ? o++ : this.get(u, o) === 1 && o > a ? (h = !0, a = o) : (c = !1, h = !0);
        for (let E = o + 1; E < this.rows; E++)
          this.get(u, E) !== 0 && (c = !1);
        u++;
      }
      return c;
    }
    echelonForm() {
      let u = this.clone(), o = 0, a = 0;
      for (; o < u.rows && a < u.columns; ) {
        let c = o;
        for (let h = o; h < u.rows; h++)
          u.get(h, a) > u.get(c, a) && (c = h);
        if (u.get(c, a) === 0)
          a++;
        else {
          u.swapRows(o, c);
          let h = u.get(o, a);
          for (let E = a; E < u.columns; E++)
            u.set(o, E, u.get(o, E) / h);
          for (let E = o + 1; E < u.rows; E++) {
            let k = u.get(E, a) / u.get(o, a);
            u.set(E, a, 0);
            for (let C = a + 1; C < u.columns; C++)
              u.set(E, C, u.get(E, C) - u.get(o, C) * k);
          }
          o++, a++;
        }
      }
      return u;
    }
    reducedEchelonForm() {
      let u = this.echelonForm(), o = u.columns, a = u.rows, c = a - 1;
      for (; c >= 0; )
        if (u.maxRow(c) === 0)
          c--;
        else {
          let h = 0, E = !1;
          for (; h < a && E === !1; )
            u.get(c, h) === 1 ? E = !0 : h++;
          for (let k = 0; k < c; k++) {
            let C = u.get(k, h);
            for (let R = h; R < o; R++) {
              let L = u.get(k, R) - C * u.get(c, R);
              u.set(k, R, L);
            }
          }
          c--;
        }
      return u;
    }
    set() {
      throw new Error("set method is unimplemented");
    }
    get() {
      throw new Error("get method is unimplemented");
    }
    repeat(u = {}) {
      if (typeof u != "object")
        throw new TypeError("options must be an object");
      const { rows: o = 1, columns: a = 1 } = u;
      if (!Number.isInteger(o) || o <= 0)
        throw new TypeError("rows must be a positive integer");
      if (!Number.isInteger(a) || a <= 0)
        throw new TypeError("columns must be a positive integer");
      let c = new I(this.rows * o, this.columns * a);
      for (let h = 0; h < o; h++)
        for (let E = 0; E < a; E++)
          c.setSubMatrix(this, this.rows * h, this.columns * E);
      return c;
    }
    fill(u) {
      for (let o = 0; o < this.rows; o++)
        for (let a = 0; a < this.columns; a++)
          this.set(o, a, u);
      return this;
    }
    neg() {
      return this.mulS(-1);
    }
    getRow(u) {
      g(this, u);
      let o = [];
      for (let a = 0; a < this.columns; a++)
        o.push(this.get(u, a));
      return o;
    }
    getRowVector(u) {
      return I.rowVector(this.getRow(u));
    }
    setRow(u, o) {
      g(this, u), o = P(this, o);
      for (let a = 0; a < this.columns; a++)
        this.set(u, a, o[a]);
      return this;
    }
    swapRows(u, o) {
      g(this, u), g(this, o);
      for (let a = 0; a < this.columns; a++) {
        let c = this.get(u, a);
        this.set(u, a, this.get(o, a)), this.set(o, a, c);
      }
      return this;
    }
    getColumn(u) {
      w(this, u);
      let o = [];
      for (let a = 0; a < this.rows; a++)
        o.push(this.get(a, u));
      return o;
    }
    getColumnVector(u) {
      return I.columnVector(this.getColumn(u));
    }
    setColumn(u, o) {
      w(this, u), o = x(this, o);
      for (let a = 0; a < this.rows; a++)
        this.set(a, u, o[a]);
      return this;
    }
    swapColumns(u, o) {
      w(this, u), w(this, o);
      for (let a = 0; a < this.rows; a++) {
        let c = this.get(a, u);
        this.set(a, u, this.get(a, o)), this.set(a, o, c);
      }
      return this;
    }
    addRowVector(u) {
      u = P(this, u);
      for (let o = 0; o < this.rows; o++)
        for (let a = 0; a < this.columns; a++)
          this.set(o, a, this.get(o, a) + u[a]);
      return this;
    }
    subRowVector(u) {
      u = P(this, u);
      for (let o = 0; o < this.rows; o++)
        for (let a = 0; a < this.columns; a++)
          this.set(o, a, this.get(o, a) - u[a]);
      return this;
    }
    mulRowVector(u) {
      u = P(this, u);
      for (let o = 0; o < this.rows; o++)
        for (let a = 0; a < this.columns; a++)
          this.set(o, a, this.get(o, a) * u[a]);
      return this;
    }
    divRowVector(u) {
      u = P(this, u);
      for (let o = 0; o < this.rows; o++)
        for (let a = 0; a < this.columns; a++)
          this.set(o, a, this.get(o, a) / u[a]);
      return this;
    }
    addColumnVector(u) {
      u = x(this, u);
      for (let o = 0; o < this.rows; o++)
        for (let a = 0; a < this.columns; a++)
          this.set(o, a, this.get(o, a) + u[o]);
      return this;
    }
    subColumnVector(u) {
      u = x(this, u);
      for (let o = 0; o < this.rows; o++)
        for (let a = 0; a < this.columns; a++)
          this.set(o, a, this.get(o, a) - u[o]);
      return this;
    }
    mulColumnVector(u) {
      u = x(this, u);
      for (let o = 0; o < this.rows; o++)
        for (let a = 0; a < this.columns; a++)
          this.set(o, a, this.get(o, a) * u[o]);
      return this;
    }
    divColumnVector(u) {
      u = x(this, u);
      for (let o = 0; o < this.rows; o++)
        for (let a = 0; a < this.columns; a++)
          this.set(o, a, this.get(o, a) / u[o]);
      return this;
    }
    mulRow(u, o) {
      g(this, u);
      for (let a = 0; a < this.columns; a++)
        this.set(u, a, this.get(u, a) * o);
      return this;
    }
    mulColumn(u, o) {
      w(this, u);
      for (let a = 0; a < this.rows; a++)
        this.set(a, u, this.get(a, u) * o);
      return this;
    }
    max(u) {
      if (this.isEmpty())
        return NaN;
      switch (u) {
        case "row": {
          const o = new Array(this.rows).fill(Number.NEGATIVE_INFINITY);
          for (let a = 0; a < this.rows; a++)
            for (let c = 0; c < this.columns; c++)
              this.get(a, c) > o[a] && (o[a] = this.get(a, c));
          return o;
        }
        case "column": {
          const o = new Array(this.columns).fill(Number.NEGATIVE_INFINITY);
          for (let a = 0; a < this.rows; a++)
            for (let c = 0; c < this.columns; c++)
              this.get(a, c) > o[c] && (o[c] = this.get(a, c));
          return o;
        }
        case void 0: {
          let o = this.get(0, 0);
          for (let a = 0; a < this.rows; a++)
            for (let c = 0; c < this.columns; c++)
              this.get(a, c) > o && (o = this.get(a, c));
          return o;
        }
        default:
          throw new Error(`invalid option: ${u}`);
      }
    }
    maxIndex() {
      b(this);
      let u = this.get(0, 0), o = [0, 0];
      for (let a = 0; a < this.rows; a++)
        for (let c = 0; c < this.columns; c++)
          this.get(a, c) > u && (u = this.get(a, c), o[0] = a, o[1] = c);
      return o;
    }
    min(u) {
      if (this.isEmpty())
        return NaN;
      switch (u) {
        case "row": {
          const o = new Array(this.rows).fill(Number.POSITIVE_INFINITY);
          for (let a = 0; a < this.rows; a++)
            for (let c = 0; c < this.columns; c++)
              this.get(a, c) < o[a] && (o[a] = this.get(a, c));
          return o;
        }
        case "column": {
          const o = new Array(this.columns).fill(Number.POSITIVE_INFINITY);
          for (let a = 0; a < this.rows; a++)
            for (let c = 0; c < this.columns; c++)
              this.get(a, c) < o[c] && (o[c] = this.get(a, c));
          return o;
        }
        case void 0: {
          let o = this.get(0, 0);
          for (let a = 0; a < this.rows; a++)
            for (let c = 0; c < this.columns; c++)
              this.get(a, c) < o && (o = this.get(a, c));
          return o;
        }
        default:
          throw new Error(`invalid option: ${u}`);
      }
    }
    minIndex() {
      b(this);
      let u = this.get(0, 0), o = [0, 0];
      for (let a = 0; a < this.rows; a++)
        for (let c = 0; c < this.columns; c++)
          this.get(a, c) < u && (u = this.get(a, c), o[0] = a, o[1] = c);
      return o;
    }
    maxRow(u) {
      if (g(this, u), this.isEmpty())
        return NaN;
      let o = this.get(u, 0);
      for (let a = 1; a < this.columns; a++)
        this.get(u, a) > o && (o = this.get(u, a));
      return o;
    }
    maxRowIndex(u) {
      g(this, u), b(this);
      let o = this.get(u, 0), a = [u, 0];
      for (let c = 1; c < this.columns; c++)
        this.get(u, c) > o && (o = this.get(u, c), a[1] = c);
      return a;
    }
    minRow(u) {
      if (g(this, u), this.isEmpty())
        return NaN;
      let o = this.get(u, 0);
      for (let a = 1; a < this.columns; a++)
        this.get(u, a) < o && (o = this.get(u, a));
      return o;
    }
    minRowIndex(u) {
      g(this, u), b(this);
      let o = this.get(u, 0), a = [u, 0];
      for (let c = 1; c < this.columns; c++)
        this.get(u, c) < o && (o = this.get(u, c), a[1] = c);
      return a;
    }
    maxColumn(u) {
      if (w(this, u), this.isEmpty())
        return NaN;
      let o = this.get(0, u);
      for (let a = 1; a < this.rows; a++)
        this.get(a, u) > o && (o = this.get(a, u));
      return o;
    }
    maxColumnIndex(u) {
      w(this, u), b(this);
      let o = this.get(0, u), a = [0, u];
      for (let c = 1; c < this.rows; c++)
        this.get(c, u) > o && (o = this.get(c, u), a[0] = c);
      return a;
    }
    minColumn(u) {
      if (w(this, u), this.isEmpty())
        return NaN;
      let o = this.get(0, u);
      for (let a = 1; a < this.rows; a++)
        this.get(a, u) < o && (o = this.get(a, u));
      return o;
    }
    minColumnIndex(u) {
      w(this, u), b(this);
      let o = this.get(0, u), a = [0, u];
      for (let c = 1; c < this.rows; c++)
        this.get(c, u) < o && (o = this.get(c, u), a[0] = c);
      return a;
    }
    diag() {
      let u = Math.min(this.rows, this.columns), o = [];
      for (let a = 0; a < u; a++)
        o.push(this.get(a, a));
      return o;
    }
    norm(u = "frobenius") {
      switch (u) {
        case "max":
          return this.max();
        case "frobenius":
          return Math.sqrt(this.dot(this));
        default:
          throw new RangeError(`unknown norm type: ${u}`);
      }
    }
    cumulativeSum() {
      let u = 0;
      for (let o = 0; o < this.rows; o++)
        for (let a = 0; a < this.columns; a++)
          u += this.get(o, a), this.set(o, a, u);
      return this;
    }
    dot(u) {
      Z.isMatrix(u) && (u = u.to1DArray());
      let o = this.to1DArray();
      if (o.length !== u.length)
        throw new RangeError("vectors do not have the same size");
      let a = 0;
      for (let c = 0; c < o.length; c++)
        a += o[c] * u[c];
      return a;
    }
    mmul(u) {
      u = I.checkMatrix(u);
      let o = this.rows, a = this.columns, c = u.columns, h = new I(o, c), E = new Float64Array(a);
      for (let k = 0; k < c; k++) {
        for (let C = 0; C < a; C++)
          E[C] = u.get(C, k);
        for (let C = 0; C < o; C++) {
          let R = 0;
          for (let L = 0; L < a; L++)
            R += this.get(C, L) * E[L];
          h.set(C, k, R);
        }
      }
      return h;
    }
    mpow(u) {
      if (!this.isSquare())
        throw new RangeError("Matrix must be square");
      if (!Number.isInteger(u) || u < 0)
        throw new RangeError("Exponent must be a non-negative integer");
      let o = I.eye(this.rows), a = this;
      for (let c = u; c >= 1; c /= 2)
        (c & 1) !== 0 && (o = o.mmul(a)), a = a.mmul(a);
      return o;
    }
    strassen2x2(u) {
      u = I.checkMatrix(u);
      let o = new I(2, 2);
      const a = this.get(0, 0), c = u.get(0, 0), h = this.get(0, 1), E = u.get(0, 1), k = this.get(1, 0), C = u.get(1, 0), R = this.get(1, 1), L = u.get(1, 1), M = (a + R) * (c + L), K = (k + R) * c, se = a * (E - L), J = R * (C - c), Y = (a + h) * L, ce = (k - a) * (c + E), F = (h - R) * (C + L), ne = M + J - Y + F, de = se + Y, xe = K + J, Ae = M - K + se + ce;
      return o.set(0, 0, ne), o.set(0, 1, de), o.set(1, 0, xe), o.set(1, 1, Ae), o;
    }
    strassen3x3(u) {
      u = I.checkMatrix(u);
      let o = new I(3, 3);
      const a = this.get(0, 0), c = this.get(0, 1), h = this.get(0, 2), E = this.get(1, 0), k = this.get(1, 1), C = this.get(1, 2), R = this.get(2, 0), L = this.get(2, 1), M = this.get(2, 2), K = u.get(0, 0), se = u.get(0, 1), J = u.get(0, 2), Y = u.get(1, 0), ce = u.get(1, 1), F = u.get(1, 2), ne = u.get(2, 0), de = u.get(2, 1), xe = u.get(2, 2), Ae = (a + c + h - E - k - L - M) * ce, Qe = (a - E) * (-se + ce), _e = k * (-K + se + Y - ce - F - ne + xe), Ee = (-a + E + k) * (K - se + ce), Ge = (E + k) * (-K + se), D = a * K, Q = (-a + R + L) * (K - J + F), ue = (-a + R) * (J - F), te = (R + L) * (-K + J), He = (a + c + h - k - C - R - L) * F, Ze = L * (-K + J + Y - ce - F - ne + de), Xe = (-h + L + M) * (ce + ne - de), et = (h - M) * (ce - de), _t = h * ne, Wt = (L + M) * (-ne + de), ut = (-h + k + C) * (F + ne - xe), ir = (h - C) * (F - xe), dr = (k + C) * (-ne + xe), Fe = c * Y, vt = C * de, Ft = E * J, Dt = R * se, ft = M * xe, Dh = D + _t + Fe, qh = Ae + Ee + Ge + D + Xe + _t + Wt, Lh = D + Q + te + He + _t + ut + dr, Vh = Qe + _e + Ee + D + _t + ut + ir, Uh = Qe + Ee + Ge + D + vt, zh = _t + ut + ir + dr + Ft, Bh = D + Q + ue + Ze + Xe + et + _t, Zh = Xe + et + _t + Wt + Dt, Jh = D + Q + ue + te + ft;
      return o.set(0, 0, Dh), o.set(0, 1, qh), o.set(0, 2, Lh), o.set(1, 0, Vh), o.set(1, 1, Uh), o.set(1, 2, zh), o.set(2, 0, Bh), o.set(2, 1, Zh), o.set(2, 2, Jh), o;
    }
    mmulStrassen(u) {
      u = I.checkMatrix(u);
      let o = this.clone(), a = o.rows, c = o.columns, h = u.rows, E = u.columns;
      c !== h && console.warn(
        `Multiplying ${a} x ${c} and ${h} x ${E} matrix: dimensions do not match.`
      );
      function k(M, K, se) {
        let J = M.rows, Y = M.columns;
        if (J === K && Y === se)
          return M;
        {
          let ce = Z.zeros(K, se);
          return ce = ce.setSubMatrix(M, 0, 0), ce;
        }
      }
      let C = Math.max(a, h), R = Math.max(c, E);
      o = k(o, C, R), u = k(u, C, R);
      function L(M, K, se, J) {
        if (se <= 512 || J <= 512)
          return M.mmul(K);
        se % 2 === 1 && J % 2 === 1 ? (M = k(M, se + 1, J + 1), K = k(K, se + 1, J + 1)) : se % 2 === 1 ? (M = k(M, se + 1, J), K = k(K, se + 1, J)) : J % 2 === 1 && (M = k(M, se, J + 1), K = k(K, se, J + 1));
        let Y = parseInt(M.rows / 2, 10), ce = parseInt(M.columns / 2, 10), F = M.subMatrix(0, Y - 1, 0, ce - 1), ne = K.subMatrix(0, Y - 1, 0, ce - 1), de = M.subMatrix(0, Y - 1, ce, M.columns - 1), xe = K.subMatrix(0, Y - 1, ce, K.columns - 1), Ae = M.subMatrix(Y, M.rows - 1, 0, ce - 1), Qe = K.subMatrix(Y, K.rows - 1, 0, ce - 1), _e = M.subMatrix(Y, M.rows - 1, ce, M.columns - 1), Ee = K.subMatrix(Y, K.rows - 1, ce, K.columns - 1), Ge = L(
          Z.add(F, _e),
          Z.add(ne, Ee),
          Y,
          ce
        ), D = L(Z.add(Ae, _e), ne, Y, ce), Q = L(F, Z.sub(xe, Ee), Y, ce), ue = L(_e, Z.sub(Qe, ne), Y, ce), te = L(Z.add(F, de), Ee, Y, ce), He = L(
          Z.sub(Ae, F),
          Z.add(ne, xe),
          Y,
          ce
        ), Ze = L(
          Z.sub(de, _e),
          Z.add(Qe, Ee),
          Y,
          ce
        ), Xe = Z.add(Ge, ue);
        Xe.sub(te), Xe.add(Ze);
        let et = Z.add(Q, te), _t = Z.add(D, ue), Wt = Z.sub(Ge, D);
        Wt.add(Q), Wt.add(He);
        let ut = Z.zeros(2 * Xe.rows, 2 * Xe.columns);
        return ut = ut.setSubMatrix(Xe, 0, 0), ut = ut.setSubMatrix(et, Xe.rows, 0), ut = ut.setSubMatrix(_t, 0, Xe.columns), ut = ut.setSubMatrix(Wt, Xe.rows, Xe.columns), ut.subMatrix(0, se - 1, 0, J - 1);
      }
      return L(o, u, C, R);
    }
    scaleRows(u = {}) {
      if (typeof u != "object")
        throw new TypeError("options must be an object");
      const { min: o = 0, max: a = 1 } = u;
      if (!Number.isFinite(o)) throw new TypeError("min must be a number");
      if (!Number.isFinite(a)) throw new TypeError("max must be a number");
      if (o >= a) throw new RangeError("min must be smaller than max");
      let c = new I(this.rows, this.columns);
      for (let h = 0; h < this.rows; h++) {
        const E = this.getRow(h);
        E.length > 0 && e(E, { min: o, max: a, output: E }), c.setRow(h, E);
      }
      return c;
    }
    scaleColumns(u = {}) {
      if (typeof u != "object")
        throw new TypeError("options must be an object");
      const { min: o = 0, max: a = 1 } = u;
      if (!Number.isFinite(o)) throw new TypeError("min must be a number");
      if (!Number.isFinite(a)) throw new TypeError("max must be a number");
      if (o >= a) throw new RangeError("min must be smaller than max");
      let c = new I(this.rows, this.columns);
      for (let h = 0; h < this.columns; h++) {
        const E = this.getColumn(h);
        E.length && e(E, {
          min: o,
          max: a,
          output: E
        }), c.setColumn(h, E);
      }
      return c;
    }
    flipRows() {
      const u = Math.ceil(this.columns / 2);
      for (let o = 0; o < this.rows; o++)
        for (let a = 0; a < u; a++) {
          let c = this.get(o, a), h = this.get(o, this.columns - 1 - a);
          this.set(o, a, h), this.set(o, this.columns - 1 - a, c);
        }
      return this;
    }
    flipColumns() {
      const u = Math.ceil(this.rows / 2);
      for (let o = 0; o < this.columns; o++)
        for (let a = 0; a < u; a++) {
          let c = this.get(a, o), h = this.get(this.rows - 1 - a, o);
          this.set(a, o, h), this.set(this.rows - 1 - a, o, c);
        }
      return this;
    }
    kroneckerProduct(u) {
      u = I.checkMatrix(u);
      let o = this.rows, a = this.columns, c = u.rows, h = u.columns, E = new I(o * c, a * h);
      for (let k = 0; k < o; k++)
        for (let C = 0; C < a; C++)
          for (let R = 0; R < c; R++)
            for (let L = 0; L < h; L++)
              E.set(c * k + R, h * C + L, this.get(k, C) * u.get(R, L));
      return E;
    }
    kroneckerSum(u) {
      if (u = I.checkMatrix(u), !this.isSquare() || !u.isSquare())
        throw new Error("Kronecker Sum needs two Square Matrices");
      let o = this.rows, a = u.rows, c = this.kroneckerProduct(I.eye(a, a)), h = I.eye(o, o).kroneckerProduct(u);
      return c.add(h);
    }
    transpose() {
      let u = new I(this.columns, this.rows);
      for (let o = 0; o < this.rows; o++)
        for (let a = 0; a < this.columns; a++)
          u.set(a, o, this.get(o, a));
      return u;
    }
    sortRows(u = B) {
      for (let o = 0; o < this.rows; o++)
        this.setRow(o, this.getRow(o).sort(u));
      return this;
    }
    sortColumns(u = B) {
      for (let o = 0; o < this.columns; o++)
        this.setColumn(o, this.getColumn(o).sort(u));
      return this;
    }
    subMatrix(u, o, a, c) {
      y(this, u, o, a, c);
      let h = new I(
        o - u + 1,
        c - a + 1
      );
      for (let E = u; E <= o; E++)
        for (let k = a; k <= c; k++)
          h.set(E - u, k - a, this.get(E, k));
      return h;
    }
    subMatrixRow(u, o, a) {
      if (o === void 0 && (o = 0), a === void 0 && (a = this.columns - 1), o > a || o < 0 || o >= this.columns || a < 0 || a >= this.columns)
        throw new RangeError("Argument out of range");
      let c = new I(u.length, a - o + 1);
      for (let h = 0; h < u.length; h++)
        for (let E = o; E <= a; E++) {
          if (u[h] < 0 || u[h] >= this.rows)
            throw new RangeError(`Row index out of range: ${u[h]}`);
          c.set(h, E - o, this.get(u[h], E));
        }
      return c;
    }
    subMatrixColumn(u, o, a) {
      if (o === void 0 && (o = 0), a === void 0 && (a = this.rows - 1), o > a || o < 0 || o >= this.rows || a < 0 || a >= this.rows)
        throw new RangeError("Argument out of range");
      let c = new I(a - o + 1, u.length);
      for (let h = 0; h < u.length; h++)
        for (let E = o; E <= a; E++) {
          if (u[h] < 0 || u[h] >= this.columns)
            throw new RangeError(`Column index out of range: ${u[h]}`);
          c.set(E - o, h, this.get(E, u[h]));
        }
      return c;
    }
    setSubMatrix(u, o, a) {
      if (u = I.checkMatrix(u), u.isEmpty())
        return this;
      let c = o + u.rows - 1, h = a + u.columns - 1;
      y(this, o, c, a, h);
      for (let E = 0; E < u.rows; E++)
        for (let k = 0; k < u.columns; k++)
          this.set(o + E, a + k, u.get(E, k));
      return this;
    }
    selection(u, o) {
      T(this, u), S(this, o);
      let a = new I(u.length, o.length);
      for (let c = 0; c < u.length; c++) {
        let h = u[c];
        for (let E = 0; E < o.length; E++) {
          let k = o[E];
          a.set(c, E, this.get(h, k));
        }
      }
      return a;
    }
    trace() {
      let u = Math.min(this.rows, this.columns), o = 0;
      for (let a = 0; a < u; a++)
        o += this.get(a, a);
      return o;
    }
    clone() {
      return this.constructor.copy(this, new I(this.rows, this.columns));
    }
    /**
     * @template {AbstractMatrix} M
     * @param {AbstractMatrix} from
     * @param {M} to
     * @return {M}
     */
    static copy(u, o) {
      for (const [a, c, h] of u.entries())
        o.set(a, c, h);
      return o;
    }
    sum(u) {
      switch (u) {
        case "row":
          return $(this);
        case "column":
          return O(this);
        case void 0:
          return A(this);
        default:
          throw new Error(`invalid option: ${u}`);
      }
    }
    product(u) {
      switch (u) {
        case "row":
          return j(this);
        case "column":
          return V(this);
        case void 0:
          return G(this);
        default:
          throw new Error(`invalid option: ${u}`);
      }
    }
    mean(u) {
      const o = this.sum(u);
      switch (u) {
        case "row": {
          for (let a = 0; a < this.rows; a++)
            o[a] /= this.columns;
          return o;
        }
        case "column": {
          for (let a = 0; a < this.columns; a++)
            o[a] /= this.rows;
          return o;
        }
        case void 0:
          return o / this.size;
        default:
          throw new Error(`invalid option: ${u}`);
      }
    }
    variance(u, o = {}) {
      if (typeof u == "object" && (o = u, u = void 0), typeof o != "object")
        throw new TypeError("options must be an object");
      const { unbiased: a = !0, mean: c = this.mean(u) } = o;
      if (typeof a != "boolean")
        throw new TypeError("unbiased must be a boolean");
      switch (u) {
        case "row": {
          if (!t.isAnyArray(c))
            throw new TypeError("mean must be an array");
          return H(this, a, c);
        }
        case "column": {
          if (!t.isAnyArray(c))
            throw new TypeError("mean must be an array");
          return ee(this, a, c);
        }
        case void 0: {
          if (typeof c != "number")
            throw new TypeError("mean must be a number");
          return ye(this, a, c);
        }
        default:
          throw new Error(`invalid option: ${u}`);
      }
    }
    standardDeviation(u, o) {
      typeof u == "object" && (o = u, u = void 0);
      const a = this.variance(u, o);
      if (u === void 0)
        return Math.sqrt(a);
      for (let c = 0; c < a.length; c++)
        a[c] = Math.sqrt(a[c]);
      return a;
    }
    center(u, o = {}) {
      if (typeof u == "object" && (o = u, u = void 0), typeof o != "object")
        throw new TypeError("options must be an object");
      const { center: a = this.mean(u) } = o;
      switch (u) {
        case "row": {
          if (!t.isAnyArray(a))
            throw new TypeError("center must be an array");
          return ge(this, a), this;
        }
        case "column": {
          if (!t.isAnyArray(a))
            throw new TypeError("center must be an array");
          return ke(this, a), this;
        }
        case void 0: {
          if (typeof a != "number")
            throw new TypeError("center must be a number");
          return ze(this, a), this;
        }
        default:
          throw new Error(`invalid option: ${u}`);
      }
    }
    scale(u, o = {}) {
      if (typeof u == "object" && (o = u, u = void 0), typeof o != "object")
        throw new TypeError("options must be an object");
      let a = o.scale;
      switch (u) {
        case "row": {
          if (a === void 0)
            a = st(this);
          else if (!t.isAnyArray(a))
            throw new TypeError("scale must be an array");
          return ct(this, a), this;
        }
        case "column": {
          if (a === void 0)
            a = qe(this);
          else if (!t.isAnyArray(a))
            throw new TypeError("scale must be an array");
          return xt(this, a), this;
        }
        case void 0: {
          if (a === void 0)
            a = re(this);
          else if (typeof a != "number")
            throw new TypeError("scale must be a number");
          return U(this, a), this;
        }
        default:
          throw new Error(`invalid option: ${u}`);
      }
    }
    toString(u) {
      return i(this, u);
    }
    [Symbol.iterator]() {
      return this.entries();
    }
    /**
     * iterator from left to right, from top to bottom
     * yield [row, column, value]
     * @returns {Generator<[number, number, number], void, void>}
     */
    *entries() {
      for (let u = 0; u < this.rows; u++)
        for (let o = 0; o < this.columns; o++)
          yield [u, o, this.get(u, o)];
    }
    /**
     * iterator from left to right, from top to bottom
     * yield value
     * @returns {Generator<number, void, void>}
     */
    *values() {
      for (let u = 0; u < this.rows; u++)
        for (let o = 0; o < this.columns; o++)
          yield this.get(u, o);
    }
  }
  Z.prototype.klass = "Matrix", typeof Symbol < "u" && (Z.prototype[Symbol.for("nodejs.util.inspect.custom")] = s);
  function B(v, u) {
    return v - u;
  }
  function N(v) {
    return v.every((u) => typeof u == "number");
  }
  Z.random = Z.rand, Z.randomInt = Z.randInt, Z.diagonal = Z.diag, Z.prototype.diagonal = Z.prototype.diag, Z.identity = Z.eye, Z.prototype.negate = Z.prototype.neg, Z.prototype.tensorProduct = Z.prototype.kroneckerProduct;
  const cs = class cs extends Z {
    constructor(o, a) {
      super();
      Hi(this, Tn);
      /**
       * @type {Float64Array[]}
       */
      ol(this, "data");
      if (cs.isMatrix(o))
        ea(this, Tn, no).call(this, o.rows, o.columns), cs.copy(o, this);
      else if (Number.isInteger(o) && o >= 0)
        ea(this, Tn, no).call(this, o, a);
      else if (t.isAnyArray(o)) {
        const c = o;
        if (o = c.length, a = o ? c[0].length : 0, typeof a != "number")
          throw new TypeError(
            "Data must be a 2D array with at least one element"
          );
        this.data = [];
        for (let h = 0; h < o; h++) {
          if (c[h].length !== a)
            throw new RangeError("Inconsistent array dimensions");
          if (!N(c[h]))
            throw new TypeError("Input data contains non-numeric values");
          this.data.push(Float64Array.from(c[h]));
        }
        this.rows = o, this.columns = a;
      } else
        throw new TypeError(
          "First argument must be a positive number or an array"
        );
    }
    set(o, a, c) {
      return this.data[o][a] = c, this;
    }
    get(o, a) {
      return this.data[o][a];
    }
    removeRow(o) {
      return g(this, o), this.data.splice(o, 1), this.rows -= 1, this;
    }
    addRow(o, a) {
      return a === void 0 && (a = o, o = this.rows), g(this, o, !0), a = Float64Array.from(P(this, a)), this.data.splice(o, 0, a), this.rows += 1, this;
    }
    removeColumn(o) {
      w(this, o);
      for (let a = 0; a < this.rows; a++) {
        const c = new Float64Array(this.columns - 1);
        for (let h = 0; h < o; h++)
          c[h] = this.data[a][h];
        for (let h = o + 1; h < this.columns; h++)
          c[h - 1] = this.data[a][h];
        this.data[a] = c;
      }
      return this.columns -= 1, this;
    }
    addColumn(o, a) {
      typeof a > "u" && (a = o, o = this.columns), w(this, o, !0), a = x(this, a);
      for (let c = 0; c < this.rows; c++) {
        const h = new Float64Array(this.columns + 1);
        let E = 0;
        for (; E < o; E++)
          h[E] = this.data[c][E];
        for (h[E++] = a[c]; E < this.columns + 1; E++)
          h[E] = this.data[c][E - 1];
        this.data[c] = h;
      }
      return this.columns += 1, this;
    }
  };
  Tn = new WeakSet(), /**
   * Init an empty matrix
   * @param {number} nRows
   * @param {number} nColumns
   */
  no = function(o, a) {
    if (this.data = [], Number.isInteger(a) && a >= 0)
      for (let c = 0; c < o; c++)
        this.data.push(new Float64Array(a));
    else
      throw new TypeError("nColumns must be a positive integer");
    this.rows = o, this.columns = a;
  };
  let I = cs;
  p(Z, I);
  const us = class us extends Z {
    /**
     * @param {number | AbstractMatrix | ArrayLike<ArrayLike<number>>} diagonalSize
     * @return {this}
     */
    constructor(o) {
      super();
      /** @type {Matrix} */
      Hi(this, kt);
      if (I.isMatrix(o)) {
        if (!o.isSymmetric())
          throw new TypeError("not symmetric data");
        fs(this, kt, I.copy(
          o,
          new I(o.rows, o.rows)
        ));
      } else if (Number.isInteger(o) && o >= 0)
        fs(this, kt, new I(o, o));
      else if (fs(this, kt, new I(o)), !this.isSymmetric())
        throw new TypeError("not symmetric data");
    }
    get size() {
      return Kt(this, kt).size;
    }
    get rows() {
      return Kt(this, kt).rows;
    }
    get columns() {
      return Kt(this, kt).columns;
    }
    get diagonalSize() {
      return this.rows;
    }
    /**
     * not the same as matrix.isSymmetric()
     * Here is to check if it's instanceof SymmetricMatrix without bundling issues
     *
     * @param value
     * @returns {boolean}
     */
    static isSymmetricMatrix(o) {
      return I.isMatrix(o) && o.klassType === "SymmetricMatrix";
    }
    /**
     * @param diagonalSize
     * @return {SymmetricMatrix}
     */
    static zeros(o) {
      return new this(o);
    }
    /**
     * @param diagonalSize
     * @return {SymmetricMatrix}
     */
    static ones(o) {
      return new this(o).fill(1);
    }
    clone() {
      const o = new us(this.diagonalSize);
      for (const [a, c, h] of this.upperRightEntries())
        o.set(a, c, h);
      return o;
    }
    toMatrix() {
      return new I(this);
    }
    get(o, a) {
      return Kt(this, kt).get(o, a);
    }
    set(o, a, c) {
      return Kt(this, kt).set(o, a, c), Kt(this, kt).set(a, o, c), this;
    }
    removeCross(o) {
      return Kt(this, kt).removeRow(o), Kt(this, kt).removeColumn(o), this;
    }
    addCross(o, a) {
      a === void 0 && (a = o, o = this.diagonalSize);
      const c = a.slice();
      return c.splice(o, 1), Kt(this, kt).addRow(o, c), Kt(this, kt).addColumn(o, a), this;
    }
    /**
     * @param {Mask[]} mask
     */
    applyMask(o) {
      if (o.length !== this.diagonalSize)
        throw new RangeError("Mask size do not match with matrix size");
      const a = [];
      for (const [c, h] of o.entries())
        h || a.push(c);
      a.reverse();
      for (const c of a)
        this.removeCross(c);
      return this;
    }
    /**
     * Compact format upper-right corner of matrix
     * iterate from left to right, from top to bottom.
     *
     * ```
     *   A B C D
     * A 1 2 3 4
     * B 2 5 6 7
     * C 3 6 8 9
     * D 4 7 9 10
     * ```
     *
     * will return compact 1D array `[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]`
     *
     * length is S(i=0, n=sideSize) => 10 for a 4 sideSized matrix
     *
     * @returns {number[]}
     */
    toCompact() {
      const { diagonalSize: o } = this, a = new Array(o * (o + 1) / 2);
      for (let c = 0, h = 0, E = 0; E < a.length; E++)
        a[E] = this.get(h, c), ++c >= o && (c = ++h);
      return a;
    }
    /**
     * @param {number[]} compact
     * @return {SymmetricMatrix}
     */
    static fromCompact(o) {
      const a = o.length, c = (Math.sqrt(8 * a + 1) - 1) / 2;
      if (!Number.isInteger(c))
        throw new TypeError(
          `This array is not a compact representation of a Symmetric Matrix, ${JSON.stringify(
            o
          )}`
        );
      const h = new us(c);
      for (let E = 0, k = 0, C = 0; C < a; C++)
        h.set(E, k, o[C]), ++E >= c && (E = ++k);
      return h;
    }
    /**
     * half iterator upper-right-corner from left to right, from top to bottom
     * yield [row, column, value]
     *
     * @returns {Generator<[number, number, number], void, void>}
     */
    *upperRightEntries() {
      for (let o = 0, a = 0; o < this.diagonalSize; void 0) {
        const c = this.get(o, a);
        yield [o, a, c], ++a >= this.diagonalSize && (a = ++o);
      }
    }
    /**
     * half iterator upper-right-corner from left to right, from top to bottom
     * yield value
     *
     * @returns {Generator<[number, number, number], void, void>}
     */
    *upperRightValues() {
      for (let o = 0, a = 0; o < this.diagonalSize; void 0)
        yield this.get(o, a), ++a >= this.diagonalSize && (a = ++o);
    }
  };
  kt = new WeakMap();
  let W = us;
  W.prototype.klassType = "SymmetricMatrix";
  class fe extends W {
    /**
     * not the same as matrix.isSymmetric()
     * Here is to check if it's instanceof SymmetricMatrix without bundling issues
     *
     * @param value
     * @returns {boolean}
     */
    static isDistanceMatrix(u) {
      return W.isSymmetricMatrix(u) && u.klassSubType === "DistanceMatrix";
    }
    constructor(u) {
      if (super(u), !this.isDistance())
        throw new TypeError("Provided arguments do no produce a distance matrix");
    }
    set(u, o, a) {
      return u === o && (a = 0), super.set(u, o, a);
    }
    addCross(u, o) {
      return o === void 0 && (o = u, u = this.diagonalSize), o = o.slice(), o[u] = 0, super.addCross(u, o);
    }
    toSymmetricMatrix() {
      return new W(this);
    }
    clone() {
      const u = new fe(this.diagonalSize);
      for (const [o, a, c] of this.upperRightEntries())
        o !== a && u.set(o, a, c);
      return u;
    }
    /**
     * Compact format upper-right corner of matrix
     * no diagonal (only zeros)
     * iterable from left to right, from top to bottom.
     *
     * ```
     *   A B C D
     * A 0 1 2 3
     * B 1 0 4 5
     * C 2 4 0 6
     * D 3 5 6 0
     * ```
     *
     * will return compact 1D array `[1, 2, 3, 4, 5, 6]`
     *
     * length is S(i=0, n=sideSize-1) => 6 for a 4 side sized matrix
     *
     * @returns {number[]}
     */
    toCompact() {
      const { diagonalSize: u } = this, o = (u - 1) * u / 2, a = new Array(o);
      for (let c = 1, h = 0, E = 0; E < a.length; E++)
        a[E] = this.get(h, c), ++c >= u && (c = ++h + 1);
      return a;
    }
    /**
     * @param {number[]} compact
     */
    static fromCompact(u) {
      const o = u.length;
      if (o === 0)
        return new this(0);
      const a = (Math.sqrt(8 * o + 1) + 1) / 2;
      if (!Number.isInteger(a))
        throw new TypeError(
          `This array is not a compact representation of a DistanceMatrix, ${JSON.stringify(
            u
          )}`
        );
      const c = new this(a);
      for (let h = 1, E = 0, k = 0; k < o; k++)
        c.set(h, E, u[k]), ++h >= a && (h = ++E + 1);
      return c;
    }
  }
  fe.prototype.klassSubType = "DistanceMatrix";
  class le extends Z {
    constructor(u, o, a) {
      super(), this.matrix = u, this.rows = o, this.columns = a;
    }
  }
  class Ne extends le {
    constructor(u, o) {
      w(u, o), super(u, u.rows, 1), this.column = o;
    }
    set(u, o, a) {
      return this.matrix.set(u, this.column, a), this;
    }
    get(u) {
      return this.matrix.get(u, this.column);
    }
  }
  class Te extends le {
    constructor(u, o) {
      S(u, o), super(u, u.rows, o.length), this.columnIndices = o;
    }
    set(u, o, a) {
      return this.matrix.set(u, this.columnIndices[o], a), this;
    }
    get(u, o) {
      return this.matrix.get(u, this.columnIndices[o]);
    }
  }
  class q extends le {
    constructor(u) {
      super(u, u.rows, u.columns);
    }
    set(u, o, a) {
      return this.matrix.set(u, this.columns - o - 1, a), this;
    }
    get(u, o) {
      return this.matrix.get(u, this.columns - o - 1);
    }
  }
  class z extends le {
    constructor(u) {
      super(u, u.rows, u.columns);
    }
    set(u, o, a) {
      return this.matrix.set(this.rows - u - 1, o, a), this;
    }
    get(u, o) {
      return this.matrix.get(this.rows - u - 1, o);
    }
  }
  class X extends le {
    constructor(u, o) {
      g(u, o), super(u, 1, u.columns), this.row = o;
    }
    set(u, o, a) {
      return this.matrix.set(this.row, o, a), this;
    }
    get(u, o) {
      return this.matrix.get(this.row, o);
    }
  }
  class ae extends le {
    constructor(u, o) {
      T(u, o), super(u, o.length, u.columns), this.rowIndices = o;
    }
    set(u, o, a) {
      return this.matrix.set(this.rowIndices[u], o, a), this;
    }
    get(u, o) {
      return this.matrix.get(this.rowIndices[u], o);
    }
  }
  class me extends le {
    constructor(u, o, a) {
      T(u, o), S(u, a), super(u, o.length, a.length), this.rowIndices = o, this.columnIndices = a;
    }
    set(u, o, a) {
      return this.matrix.set(
        this.rowIndices[u],
        this.columnIndices[o],
        a
      ), this;
    }
    get(u, o) {
      return this.matrix.get(
        this.rowIndices[u],
        this.columnIndices[o]
      );
    }
  }
  class Ce extends le {
    constructor(u, o, a, c, h) {
      y(u, o, a, c, h), super(u, a - o + 1, h - c + 1), this.startRow = o, this.startColumn = c;
    }
    set(u, o, a) {
      return this.matrix.set(
        this.startRow + u,
        this.startColumn + o,
        a
      ), this;
    }
    get(u, o) {
      return this.matrix.get(
        this.startRow + u,
        this.startColumn + o
      );
    }
  }
  class rt extends le {
    constructor(u) {
      super(u, u.columns, u.rows);
    }
    set(u, o, a) {
      return this.matrix.set(o, u, a), this;
    }
    get(u, o) {
      return this.matrix.get(o, u);
    }
  }
  class pt extends Z {
    constructor(u, o = {}) {
      const { rows: a = 1 } = o;
      if (u.length % a !== 0)
        throw new Error("the data length is not divisible by the number of rows");
      super(), this.rows = a, this.columns = u.length / a, this.data = u;
    }
    set(u, o, a) {
      let c = this._calculateIndex(u, o);
      return this.data[c] = a, this;
    }
    get(u, o) {
      let a = this._calculateIndex(u, o);
      return this.data[a];
    }
    _calculateIndex(u, o) {
      return u * this.columns + o;
    }
  }
  class Le extends Z {
    constructor(u) {
      super(), this.data = u, this.rows = u.length, this.columns = u[0].length;
    }
    set(u, o, a) {
      return this.data[u][o] = a, this;
    }
    get(u, o) {
      return this.data[u][o];
    }
  }
  function it(v, u) {
    if (t.isAnyArray(v))
      return v[0] && t.isAnyArray(v[0]) ? new Le(v) : new pt(v, u);
    throw new Error("the argument is not an array");
  }
  class Ye {
    constructor(u) {
      u = Le.checkMatrix(u);
      let o = u.clone(), a = o.rows, c = o.columns, h = new Float64Array(a), E = 1, k, C, R, L, M, K, se, J, Y;
      for (k = 0; k < a; k++)
        h[k] = k;
      for (J = new Float64Array(a), C = 0; C < c; C++) {
        for (k = 0; k < a; k++)
          J[k] = o.get(k, C);
        for (k = 0; k < a; k++) {
          for (Y = Math.min(k, C), M = 0, R = 0; R < Y; R++)
            M += o.get(k, R) * J[R];
          J[k] -= M, o.set(k, C, J[k]);
        }
        for (L = C, k = C + 1; k < a; k++)
          Math.abs(J[k]) > Math.abs(J[L]) && (L = k);
        if (L !== C) {
          for (R = 0; R < c; R++)
            K = o.get(L, R), o.set(L, R, o.get(C, R)), o.set(C, R, K);
          se = h[L], h[L] = h[C], h[C] = se, E = -E;
        }
        if (C < a && o.get(C, C) !== 0)
          for (k = C + 1; k < a; k++)
            o.set(k, C, o.get(k, C) / o.get(C, C));
      }
      this.LU = o, this.pivotVector = h, this.pivotSign = E;
    }
    isSingular() {
      let u = this.LU, o = u.columns;
      for (let a = 0; a < o; a++)
        if (u.get(a, a) === 0)
          return !0;
      return !1;
    }
    solve(u) {
      u = I.checkMatrix(u);
      let o = this.LU;
      if (o.rows !== u.rows)
        throw new Error("Invalid matrix dimensions");
      if (this.isSingular())
        throw new Error("LU matrix is singular");
      let c = u.columns, h = u.subMatrixRow(this.pivotVector, 0, c - 1), E = o.columns, k, C, R;
      for (R = 0; R < E; R++)
        for (k = R + 1; k < E; k++)
          for (C = 0; C < c; C++)
            h.set(k, C, h.get(k, C) - h.get(R, C) * o.get(k, R));
      for (R = E - 1; R >= 0; R--) {
        for (C = 0; C < c; C++)
          h.set(R, C, h.get(R, C) / o.get(R, R));
        for (k = 0; k < R; k++)
          for (C = 0; C < c; C++)
            h.set(k, C, h.get(k, C) - h.get(R, C) * o.get(k, R));
      }
      return h;
    }
    get determinant() {
      let u = this.LU;
      if (!u.isSquare())
        throw new Error("Matrix must be square");
      let o = this.pivotSign, a = u.columns;
      for (let c = 0; c < a; c++)
        o *= u.get(c, c);
      return o;
    }
    get lowerTriangularMatrix() {
      let u = this.LU, o = u.rows, a = u.columns, c = new I(o, a);
      for (let h = 0; h < o; h++)
        for (let E = 0; E < a; E++)
          h > E ? c.set(h, E, u.get(h, E)) : h === E ? c.set(h, E, 1) : c.set(h, E, 0);
      return c;
    }
    get upperTriangularMatrix() {
      let u = this.LU, o = u.rows, a = u.columns, c = new I(o, a);
      for (let h = 0; h < o; h++)
        for (let E = 0; E < a; E++)
          h <= E ? c.set(h, E, u.get(h, E)) : c.set(h, E, 0);
      return c;
    }
    get pivotPermutationVector() {
      return Array.from(this.pivotVector);
    }
  }
  function gt(v, u) {
    let o = 0;
    return Math.abs(v) > Math.abs(u) ? (o = u / v, Math.abs(v) * Math.sqrt(1 + o * o)) : u !== 0 ? (o = v / u, Math.abs(u) * Math.sqrt(1 + o * o)) : 0;
  }
  class yt {
    constructor(u) {
      u = Le.checkMatrix(u);
      let o = u.clone(), a = u.rows, c = u.columns, h = new Float64Array(c), E, k, C, R;
      for (C = 0; C < c; C++) {
        let L = 0;
        for (E = C; E < a; E++)
          L = gt(L, o.get(E, C));
        if (L !== 0) {
          for (o.get(C, C) < 0 && (L = -L), E = C; E < a; E++)
            o.set(E, C, o.get(E, C) / L);
          for (o.set(C, C, o.get(C, C) + 1), k = C + 1; k < c; k++) {
            for (R = 0, E = C; E < a; E++)
              R += o.get(E, C) * o.get(E, k);
            for (R = -R / o.get(C, C), E = C; E < a; E++)
              o.set(E, k, o.get(E, k) + R * o.get(E, C));
          }
        }
        h[C] = -L;
      }
      this.QR = o, this.Rdiag = h;
    }
    solve(u) {
      u = I.checkMatrix(u);
      let o = this.QR, a = o.rows;
      if (u.rows !== a)
        throw new Error("Matrix row dimensions must agree");
      if (!this.isFullRank())
        throw new Error("Matrix is rank deficient");
      let c = u.columns, h = u.clone(), E = o.columns, k, C, R, L;
      for (R = 0; R < E; R++)
        for (C = 0; C < c; C++) {
          for (L = 0, k = R; k < a; k++)
            L += o.get(k, R) * h.get(k, C);
          for (L = -L / o.get(R, R), k = R; k < a; k++)
            h.set(k, C, h.get(k, C) + L * o.get(k, R));
        }
      for (R = E - 1; R >= 0; R--) {
        for (C = 0; C < c; C++)
          h.set(R, C, h.get(R, C) / this.Rdiag[R]);
        for (k = 0; k < R; k++)
          for (C = 0; C < c; C++)
            h.set(k, C, h.get(k, C) - h.get(R, C) * o.get(k, R));
      }
      return h.subMatrix(0, E - 1, 0, c - 1);
    }
    isFullRank() {
      let u = this.QR.columns;
      for (let o = 0; o < u; o++)
        if (this.Rdiag[o] === 0)
          return !1;
      return !0;
    }
    get upperTriangularMatrix() {
      let u = this.QR, o = u.columns, a = new I(o, o), c, h;
      for (c = 0; c < o; c++)
        for (h = 0; h < o; h++)
          c < h ? a.set(c, h, u.get(c, h)) : c === h ? a.set(c, h, this.Rdiag[c]) : a.set(c, h, 0);
      return a;
    }
    get orthogonalMatrix() {
      let u = this.QR, o = u.rows, a = u.columns, c = new I(o, a), h, E, k, C;
      for (k = a - 1; k >= 0; k--) {
        for (h = 0; h < o; h++)
          c.set(h, k, 0);
        for (c.set(k, k, 1), E = k; E < a; E++)
          if (u.get(k, k) !== 0) {
            for (C = 0, h = k; h < o; h++)
              C += u.get(h, k) * c.get(h, E);
            for (C = -C / u.get(k, k), h = k; h < o; h++)
              c.set(h, E, c.get(h, E) + C * u.get(h, k));
          }
      }
      return c;
    }
  }
  class zt {
    constructor(u, o = {}) {
      if (u = Le.checkMatrix(u), u.isEmpty())
        throw new Error("Matrix must be non-empty");
      let a = u.rows, c = u.columns;
      const {
        computeLeftSingularVectors: h = !0,
        computeRightSingularVectors: E = !0,
        autoTranspose: k = !1
      } = o;
      let C = !!h, R = !!E, L = !1, M;
      if (a < c)
        if (!k)
          M = u.clone(), console.warn(
            "Computing SVD on a matrix with more columns than rows. Consider enabling autoTranspose"
          );
        else {
          M = u.transpose(), a = M.rows, c = M.columns, L = !0;
          let D = C;
          C = R, R = D;
        }
      else
        M = u.clone();
      let K = Math.min(a, c), se = Math.min(a + 1, c), J = new Float64Array(se), Y = new I(a, K), ce = new I(c, c), F = new Float64Array(c), ne = new Float64Array(a), de = new Float64Array(se);
      for (let D = 0; D < se; D++) de[D] = D;
      let xe = Math.min(a - 1, c), Ae = Math.max(0, Math.min(c - 2, a)), Qe = Math.max(xe, Ae);
      for (let D = 0; D < Qe; D++) {
        if (D < xe) {
          J[D] = 0;
          for (let Q = D; Q < a; Q++)
            J[D] = gt(J[D], M.get(Q, D));
          if (J[D] !== 0) {
            M.get(D, D) < 0 && (J[D] = -J[D]);
            for (let Q = D; Q < a; Q++)
              M.set(Q, D, M.get(Q, D) / J[D]);
            M.set(D, D, M.get(D, D) + 1);
          }
          J[D] = -J[D];
        }
        for (let Q = D + 1; Q < c; Q++) {
          if (D < xe && J[D] !== 0) {
            let ue = 0;
            for (let te = D; te < a; te++)
              ue += M.get(te, D) * M.get(te, Q);
            ue = -ue / M.get(D, D);
            for (let te = D; te < a; te++)
              M.set(te, Q, M.get(te, Q) + ue * M.get(te, D));
          }
          F[Q] = M.get(D, Q);
        }
        if (C && D < xe)
          for (let Q = D; Q < a; Q++)
            Y.set(Q, D, M.get(Q, D));
        if (D < Ae) {
          F[D] = 0;
          for (let Q = D + 1; Q < c; Q++)
            F[D] = gt(F[D], F[Q]);
          if (F[D] !== 0) {
            F[D + 1] < 0 && (F[D] = 0 - F[D]);
            for (let Q = D + 1; Q < c; Q++)
              F[Q] /= F[D];
            F[D + 1] += 1;
          }
          if (F[D] = -F[D], D + 1 < a && F[D] !== 0) {
            for (let Q = D + 1; Q < a; Q++)
              ne[Q] = 0;
            for (let Q = D + 1; Q < a; Q++)
              for (let ue = D + 1; ue < c; ue++)
                ne[Q] += F[ue] * M.get(Q, ue);
            for (let Q = D + 1; Q < c; Q++) {
              let ue = -F[Q] / F[D + 1];
              for (let te = D + 1; te < a; te++)
                M.set(te, Q, M.get(te, Q) + ue * ne[te]);
            }
          }
          if (R)
            for (let Q = D + 1; Q < c; Q++)
              ce.set(Q, D, F[Q]);
        }
      }
      let _e = Math.min(c, a + 1);
      if (xe < c && (J[xe] = M.get(xe, xe)), a < _e && (J[_e - 1] = 0), Ae + 1 < _e && (F[Ae] = M.get(Ae, _e - 1)), F[_e - 1] = 0, C) {
        for (let D = xe; D < K; D++) {
          for (let Q = 0; Q < a; Q++)
            Y.set(Q, D, 0);
          Y.set(D, D, 1);
        }
        for (let D = xe - 1; D >= 0; D--)
          if (J[D] !== 0) {
            for (let Q = D + 1; Q < K; Q++) {
              let ue = 0;
              for (let te = D; te < a; te++)
                ue += Y.get(te, D) * Y.get(te, Q);
              ue = -ue / Y.get(D, D);
              for (let te = D; te < a; te++)
                Y.set(te, Q, Y.get(te, Q) + ue * Y.get(te, D));
            }
            for (let Q = D; Q < a; Q++)
              Y.set(Q, D, -Y.get(Q, D));
            Y.set(D, D, 1 + Y.get(D, D));
            for (let Q = 0; Q < D - 1; Q++)
              Y.set(Q, D, 0);
          } else {
            for (let Q = 0; Q < a; Q++)
              Y.set(Q, D, 0);
            Y.set(D, D, 1);
          }
      }
      if (R)
        for (let D = c - 1; D >= 0; D--) {
          if (D < Ae && F[D] !== 0)
            for (let Q = D + 1; Q < c; Q++) {
              let ue = 0;
              for (let te = D + 1; te < c; te++)
                ue += ce.get(te, D) * ce.get(te, Q);
              ue = -ue / ce.get(D + 1, D);
              for (let te = D + 1; te < c; te++)
                ce.set(te, Q, ce.get(te, Q) + ue * ce.get(te, D));
            }
          for (let Q = 0; Q < c; Q++)
            ce.set(Q, D, 0);
          ce.set(D, D, 1);
        }
      let Ee = _e - 1, Ge = Number.EPSILON;
      for (; _e > 0; ) {
        let D, Q;
        for (D = _e - 2; D >= -1 && D !== -1; D--) {
          const ue = Number.MIN_VALUE + Ge * Math.abs(J[D] + Math.abs(J[D + 1]));
          if (Math.abs(F[D]) <= ue || Number.isNaN(F[D])) {
            F[D] = 0;
            break;
          }
        }
        if (D === _e - 2)
          Q = 4;
        else {
          let ue;
          for (ue = _e - 1; ue >= D && ue !== D; ue--) {
            let te = (ue !== _e ? Math.abs(F[ue]) : 0) + (ue !== D + 1 ? Math.abs(F[ue - 1]) : 0);
            if (Math.abs(J[ue]) <= Ge * te) {
              J[ue] = 0;
              break;
            }
          }
          ue === D ? Q = 3 : ue === _e - 1 ? Q = 1 : (Q = 2, D = ue);
        }
        switch (D++, Q) {
          case 1: {
            let ue = F[_e - 2];
            F[_e - 2] = 0;
            for (let te = _e - 2; te >= D; te--) {
              let He = gt(J[te], ue), Ze = J[te] / He, Xe = ue / He;
              if (J[te] = He, te !== D && (ue = -Xe * F[te - 1], F[te - 1] = Ze * F[te - 1]), R)
                for (let et = 0; et < c; et++)
                  He = Ze * ce.get(et, te) + Xe * ce.get(et, _e - 1), ce.set(et, _e - 1, -Xe * ce.get(et, te) + Ze * ce.get(et, _e - 1)), ce.set(et, te, He);
            }
            break;
          }
          case 2: {
            let ue = F[D - 1];
            F[D - 1] = 0;
            for (let te = D; te < _e; te++) {
              let He = gt(J[te], ue), Ze = J[te] / He, Xe = ue / He;
              if (J[te] = He, ue = -Xe * F[te], F[te] = Ze * F[te], C)
                for (let et = 0; et < a; et++)
                  He = Ze * Y.get(et, te) + Xe * Y.get(et, D - 1), Y.set(et, D - 1, -Xe * Y.get(et, te) + Ze * Y.get(et, D - 1)), Y.set(et, te, He);
            }
            break;
          }
          case 3: {
            const ue = Math.max(
              Math.abs(J[_e - 1]),
              Math.abs(J[_e - 2]),
              Math.abs(F[_e - 2]),
              Math.abs(J[D]),
              Math.abs(F[D])
            ), te = J[_e - 1] / ue, He = J[_e - 2] / ue, Ze = F[_e - 2] / ue, Xe = J[D] / ue, et = F[D] / ue, _t = ((He + te) * (He - te) + Ze * Ze) / 2, Wt = te * Ze * (te * Ze);
            let ut = 0;
            (_t !== 0 || Wt !== 0) && (_t < 0 ? ut = 0 - Math.sqrt(_t * _t + Wt) : ut = Math.sqrt(_t * _t + Wt), ut = Wt / (_t + ut));
            let ir = (Xe + te) * (Xe - te) + ut, dr = Xe * et;
            for (let Fe = D; Fe < _e - 1; Fe++) {
              let vt = gt(ir, dr);
              vt === 0 && (vt = Number.MIN_VALUE);
              let Ft = ir / vt, Dt = dr / vt;
              if (Fe !== D && (F[Fe - 1] = vt), ir = Ft * J[Fe] + Dt * F[Fe], F[Fe] = Ft * F[Fe] - Dt * J[Fe], dr = Dt * J[Fe + 1], J[Fe + 1] = Ft * J[Fe + 1], R)
                for (let ft = 0; ft < c; ft++)
                  vt = Ft * ce.get(ft, Fe) + Dt * ce.get(ft, Fe + 1), ce.set(ft, Fe + 1, -Dt * ce.get(ft, Fe) + Ft * ce.get(ft, Fe + 1)), ce.set(ft, Fe, vt);
              if (vt = gt(ir, dr), vt === 0 && (vt = Number.MIN_VALUE), Ft = ir / vt, Dt = dr / vt, J[Fe] = vt, ir = Ft * F[Fe] + Dt * J[Fe + 1], J[Fe + 1] = -Dt * F[Fe] + Ft * J[Fe + 1], dr = Dt * F[Fe + 1], F[Fe + 1] = Ft * F[Fe + 1], C && Fe < a - 1)
                for (let ft = 0; ft < a; ft++)
                  vt = Ft * Y.get(ft, Fe) + Dt * Y.get(ft, Fe + 1), Y.set(ft, Fe + 1, -Dt * Y.get(ft, Fe) + Ft * Y.get(ft, Fe + 1)), Y.set(ft, Fe, vt);
            }
            F[_e - 2] = ir;
            break;
          }
          case 4: {
            if (J[D] <= 0 && (J[D] = J[D] < 0 ? -J[D] : 0, R))
              for (let ue = 0; ue <= Ee; ue++)
                ce.set(ue, D, -ce.get(ue, D));
            for (; D < Ee && !(J[D] >= J[D + 1]); ) {
              let ue = J[D];
              if (J[D] = J[D + 1], J[D + 1] = ue, R && D < c - 1)
                for (let te = 0; te < c; te++)
                  ue = ce.get(te, D + 1), ce.set(te, D + 1, ce.get(te, D)), ce.set(te, D, ue);
              if (C && D < a - 1)
                for (let te = 0; te < a; te++)
                  ue = Y.get(te, D + 1), Y.set(te, D + 1, Y.get(te, D)), Y.set(te, D, ue);
              D++;
            }
            _e--;
            break;
          }
        }
      }
      if (L) {
        let D = ce;
        ce = Y, Y = D;
      }
      this.m = a, this.n = c, this.s = J, this.U = Y, this.V = ce;
    }
    solve(u) {
      let o = u, a = this.threshold, c = this.s.length, h = I.zeros(c, c);
      for (let K = 0; K < c; K++)
        Math.abs(this.s[K]) <= a ? h.set(K, K, 0) : h.set(K, K, 1 / this.s[K]);
      let E = this.U, k = this.rightSingularVectors, C = k.mmul(h), R = k.rows, L = E.rows, M = I.zeros(R, L);
      for (let K = 0; K < R; K++)
        for (let se = 0; se < L; se++) {
          let J = 0;
          for (let Y = 0; Y < c; Y++)
            J += C.get(K, Y) * E.get(se, Y);
          M.set(K, se, J);
        }
      return M.mmul(o);
    }
    solveForDiagonal(u) {
      return this.solve(I.diag(u));
    }
    inverse() {
      let u = this.V, o = this.threshold, a = u.rows, c = u.columns, h = new I(a, this.s.length);
      for (let L = 0; L < a; L++)
        for (let M = 0; M < c; M++)
          Math.abs(this.s[M]) > o && h.set(L, M, u.get(L, M) / this.s[M]);
      let E = this.U, k = E.rows, C = E.columns, R = new I(a, k);
      for (let L = 0; L < a; L++)
        for (let M = 0; M < k; M++) {
          let K = 0;
          for (let se = 0; se < C; se++)
            K += h.get(L, se) * E.get(M, se);
          R.set(L, M, K);
        }
      return R;
    }
    get condition() {
      return this.s[0] / this.s[Math.min(this.m, this.n) - 1];
    }
    get norm2() {
      return this.s[0];
    }
    get rank() {
      let u = Math.max(this.m, this.n) * this.s[0] * Number.EPSILON, o = 0, a = this.s;
      for (let c = 0, h = a.length; c < h; c++)
        a[c] > u && o++;
      return o;
    }
    get diagonal() {
      return Array.from(this.s);
    }
    get threshold() {
      return Number.EPSILON / 2 * Math.max(this.m, this.n) * this.s[0];
    }
    get leftSingularVectors() {
      return this.U;
    }
    get rightSingularVectors() {
      return this.V;
    }
    get diagonalMatrix() {
      return I.diag(this.s);
    }
  }
  function Vr(v, u = !1) {
    return v = Le.checkMatrix(v), u ? new zt(v).inverse() : nr(v, I.eye(v.rows));
  }
  function nr(v, u, o = !1) {
    return v = Le.checkMatrix(v), u = Le.checkMatrix(u), o ? new zt(v).solve(u) : v.isSquare() ? new Ye(v).solve(u) : new yt(v).solve(u);
  }
  function sr(v) {
    if (v = I.checkMatrix(v), v.isSquare()) {
      if (v.columns === 0)
        return 1;
      let u, o, a, c;
      if (v.columns === 2)
        return u = v.get(0, 0), o = v.get(0, 1), a = v.get(1, 0), c = v.get(1, 1), u * c - o * a;
      if (v.columns === 3) {
        let h, E, k;
        return h = new me(v, [1, 2], [1, 2]), E = new me(v, [1, 2], [0, 2]), k = new me(v, [1, 2], [0, 1]), u = v.get(0, 0), o = v.get(0, 1), a = v.get(0, 2), u * sr(h) - o * sr(E) + a * sr(k);
      } else
        return new Ye(v).determinant;
    } else
      throw Error("determinant can only be calculated for a square matrix");
  }
  function Qr(v, u) {
    let o = [];
    for (let a = 0; a < v; a++)
      a !== u && o.push(a);
    return o;
  }
  function Hr(v, u, o, a = 1e-9, c = 1e-9) {
    if (v > c)
      return new Array(u.rows + 1).fill(0);
    {
      let h = u.addRow(o, [0]);
      for (let E = 0; E < h.rows; E++)
        Math.abs(h.get(E, 0)) < a && h.set(E, 0, 0);
      return h.to1DArray();
    }
  }
  function Pn(v, u = {}) {
    const { thresholdValue: o = 1e-9, thresholdError: a = 1e-9 } = u;
    v = I.checkMatrix(v);
    let c = v.rows, h = new I(c, c);
    for (let E = 0; E < c; E++) {
      let k = I.columnVector(v.getRow(E)), C = v.subMatrixRow(Qr(c, E)).transpose(), L = new zt(C).solve(k), M = I.sub(k, C.mmul(L)).abs().max();
      h.setRow(
        E,
        Hr(M, L, E, o, a)
      );
    }
    return h;
  }
  function Yi(v, u = Number.EPSILON) {
    if (v = I.checkMatrix(v), v.isEmpty())
      return v.transpose();
    let o = new zt(v, { autoTranspose: !0 }), a = o.leftSingularVectors, c = o.rightSingularVectors, h = o.diagonal;
    for (let E = 0; E < h.length; E++)
      Math.abs(h[E]) > u ? h[E] = 1 / h[E] : h[E] = 0;
    return c.mmul(I.diag(h).mmul(a.transpose()));
  }
  function Xi(v, u = v, o = {}) {
    v = new I(v);
    let a = !1;
    if (typeof u == "object" && !I.isMatrix(u) && !t.isAnyArray(u) ? (o = u, u = v, a = !0) : u = new I(u), v.rows !== u.rows)
      throw new TypeError("Both matrices must have the same number of rows");
    const { center: c = !0 } = o;
    c && (v = v.center("column"), a || (u = u.center("column")));
    const h = v.transpose().mmul(u);
    for (let E = 0; E < h.rows; E++)
      for (let k = 0; k < h.columns; k++)
        h.set(E, k, h.get(E, k) * (1 / (v.rows - 1)));
    return h;
  }
  function os(v, u = v, o = {}) {
    v = new I(v);
    let a = !1;
    if (typeof u == "object" && !I.isMatrix(u) && !t.isAnyArray(u) ? (o = u, u = v, a = !0) : u = new I(u), v.rows !== u.rows)
      throw new TypeError("Both matrices must have the same number of rows");
    const { center: c = !0, scale: h = !0 } = o;
    c && (v.center("column"), a || u.center("column")), h && (v.scale("column"), a || u.scale("column"));
    const E = v.standardDeviation("column", { unbiased: !0 }), k = a ? E : u.standardDeviation("column", { unbiased: !0 }), C = v.transpose().mmul(u);
    for (let R = 0; R < C.rows; R++)
      for (let L = 0; L < C.columns; L++)
        C.set(
          R,
          L,
          C.get(R, L) * (1 / (E[R] * k[L])) * (1 / (v.rows - 1))
        );
    return C;
  }
  class Cn {
    constructor(u, o = {}) {
      const { assumeSymmetric: a = !1 } = o;
      if (u = Le.checkMatrix(u), !u.isSquare())
        throw new Error("Matrix is not a square matrix");
      if (u.isEmpty())
        throw new Error("Matrix must be non-empty");
      let c = u.columns, h = new I(c, c), E = new Float64Array(c), k = new Float64Array(c), C = u, R, L, M = !1;
      if (a ? M = !0 : M = u.isSymmetric(), M) {
        for (R = 0; R < c; R++)
          for (L = 0; L < c; L++)
            h.set(R, L, C.get(R, L));
        Rn(c, k, E, h), jh(c, k, E, h);
      } else {
        let K = new I(c, c), se = new Float64Array(c);
        for (L = 0; L < c; L++)
          for (R = 0; R < c; R++)
            K.set(R, L, C.get(R, L));
        Mh(c, K, se, h), Fh(c, k, E, h, K);
      }
      this.n = c, this.e = k, this.d = E, this.V = h;
    }
    get realEigenvalues() {
      return Array.from(this.d);
    }
    get imaginaryEigenvalues() {
      return Array.from(this.e);
    }
    get eigenvectorMatrix() {
      return this.V;
    }
    get diagonalMatrix() {
      let u = this.n, o = this.e, a = this.d, c = new I(u, u), h, E;
      for (h = 0; h < u; h++) {
        for (E = 0; E < u; E++)
          c.set(h, E, 0);
        c.set(h, h, a[h]), o[h] > 0 ? c.set(h, h + 1, o[h]) : o[h] < 0 && c.set(h, h - 1, o[h]);
      }
      return c;
    }
  }
  function Rn(v, u, o, a) {
    let c, h, E, k, C, R, L, M;
    for (C = 0; C < v; C++)
      o[C] = a.get(v - 1, C);
    for (k = v - 1; k > 0; k--) {
      for (M = 0, E = 0, R = 0; R < k; R++)
        M = M + Math.abs(o[R]);
      if (M === 0)
        for (u[k] = o[k - 1], C = 0; C < k; C++)
          o[C] = a.get(k - 1, C), a.set(k, C, 0), a.set(C, k, 0);
      else {
        for (R = 0; R < k; R++)
          o[R] /= M, E += o[R] * o[R];
        for (c = o[k - 1], h = Math.sqrt(E), c > 0 && (h = -h), u[k] = M * h, E = E - c * h, o[k - 1] = c - h, C = 0; C < k; C++)
          u[C] = 0;
        for (C = 0; C < k; C++) {
          for (c = o[C], a.set(C, k, c), h = u[C] + a.get(C, C) * c, R = C + 1; R <= k - 1; R++)
            h += a.get(R, C) * o[R], u[R] += a.get(R, C) * c;
          u[C] = h;
        }
        for (c = 0, C = 0; C < k; C++)
          u[C] /= E, c += u[C] * o[C];
        for (L = c / (E + E), C = 0; C < k; C++)
          u[C] -= L * o[C];
        for (C = 0; C < k; C++) {
          for (c = o[C], h = u[C], R = C; R <= k - 1; R++)
            a.set(R, C, a.get(R, C) - (c * u[R] + h * o[R]));
          o[C] = a.get(k - 1, C), a.set(k, C, 0);
        }
      }
      o[k] = E;
    }
    for (k = 0; k < v - 1; k++) {
      if (a.set(v - 1, k, a.get(k, k)), a.set(k, k, 1), E = o[k + 1], E !== 0) {
        for (R = 0; R <= k; R++)
          o[R] = a.get(R, k + 1) / E;
        for (C = 0; C <= k; C++) {
          for (h = 0, R = 0; R <= k; R++)
            h += a.get(R, k + 1) * a.get(R, C);
          for (R = 0; R <= k; R++)
            a.set(R, C, a.get(R, C) - h * o[R]);
        }
      }
      for (R = 0; R <= k; R++)
        a.set(R, k + 1, 0);
    }
    for (C = 0; C < v; C++)
      o[C] = a.get(v - 1, C), a.set(v - 1, C, 0);
    a.set(v - 1, v - 1, 1), u[0] = 0;
  }
  function jh(v, u, o, a) {
    let c, h, E, k, C, R, L, M, K, se, J, Y, ce, F, ne, de;
    for (E = 1; E < v; E++)
      u[E - 1] = u[E];
    u[v - 1] = 0;
    let xe = 0, Ae = 0, Qe = Number.EPSILON;
    for (R = 0; R < v; R++) {
      for (Ae = Math.max(Ae, Math.abs(o[R]) + Math.abs(u[R])), L = R; L < v && !(Math.abs(u[L]) <= Qe * Ae); )
        L++;
      if (L > R)
        do {
          for (c = o[R], M = (o[R + 1] - c) / (2 * u[R]), K = gt(M, 1), M < 0 && (K = -K), o[R] = u[R] / (M + K), o[R + 1] = u[R] * (M + K), se = o[R + 1], h = c - o[R], E = R + 2; E < v; E++)
            o[E] -= h;
          for (xe = xe + h, M = o[L], J = 1, Y = J, ce = J, F = u[R + 1], ne = 0, de = 0, E = L - 1; E >= R; E--)
            for (ce = Y, Y = J, de = ne, c = J * u[E], h = J * M, K = gt(M, u[E]), u[E + 1] = ne * K, ne = u[E] / K, J = M / K, M = J * o[E] - ne * c, o[E + 1] = h + ne * (J * c + ne * o[E]), C = 0; C < v; C++)
              h = a.get(C, E + 1), a.set(C, E + 1, ne * a.get(C, E) + J * h), a.set(C, E, J * a.get(C, E) - ne * h);
          M = -ne * de * ce * F * u[R] / se, u[R] = ne * M, o[R] = J * M;
        } while (Math.abs(u[R]) > Qe * Ae);
      o[R] = o[R] + xe, u[R] = 0;
    }
    for (E = 0; E < v - 1; E++) {
      for (C = E, M = o[E], k = E + 1; k < v; k++)
        o[k] < M && (C = k, M = o[k]);
      if (C !== E)
        for (o[C] = o[E], o[E] = M, k = 0; k < v; k++)
          M = a.get(k, E), a.set(k, E, a.get(k, C)), a.set(k, C, M);
    }
  }
  function Mh(v, u, o, a) {
    let c = 0, h = v - 1, E, k, C, R, L, M, K;
    for (M = c + 1; M <= h - 1; M++) {
      for (K = 0, R = M; R <= h; R++)
        K = K + Math.abs(u.get(R, M - 1));
      if (K !== 0) {
        for (C = 0, R = h; R >= M; R--)
          o[R] = u.get(R, M - 1) / K, C += o[R] * o[R];
        for (k = Math.sqrt(C), o[M] > 0 && (k = -k), C = C - o[M] * k, o[M] = o[M] - k, L = M; L < v; L++) {
          for (E = 0, R = h; R >= M; R--)
            E += o[R] * u.get(R, L);
          for (E = E / C, R = M; R <= h; R++)
            u.set(R, L, u.get(R, L) - E * o[R]);
        }
        for (R = 0; R <= h; R++) {
          for (E = 0, L = h; L >= M; L--)
            E += o[L] * u.get(R, L);
          for (E = E / C, L = M; L <= h; L++)
            u.set(R, L, u.get(R, L) - E * o[L]);
        }
        o[M] = K * o[M], u.set(M, M - 1, K * k);
      }
    }
    for (R = 0; R < v; R++)
      for (L = 0; L < v; L++)
        a.set(R, L, R === L ? 1 : 0);
    for (M = h - 1; M >= c + 1; M--)
      if (u.get(M, M - 1) !== 0) {
        for (R = M + 1; R <= h; R++)
          o[R] = u.get(R, M - 1);
        for (L = M; L <= h; L++) {
          for (k = 0, R = M; R <= h; R++)
            k += o[R] * a.get(R, L);
          for (k = k / o[M] / u.get(M, M - 1), R = M; R <= h; R++)
            a.set(R, L, a.get(R, L) + k * o[R]);
        }
      }
  }
  function Fh(v, u, o, a, c) {
    let h = v - 1, E = 0, k = v - 1, C = Number.EPSILON, R = 0, L = 0, M = 0, K = 0, se = 0, J = 0, Y = 0, ce = 0, F, ne, de, xe, Ae, Qe, _e, Ee, Ge, D, Q, ue, te, He, Ze;
    for (F = 0; F < v; F++)
      for ((F < E || F > k) && (o[F] = c.get(F, F), u[F] = 0), ne = Math.max(F - 1, 0); ne < v; ne++)
        L = L + Math.abs(c.get(F, ne));
    for (; h >= E; ) {
      for (xe = h; xe > E && (J = Math.abs(c.get(xe - 1, xe - 1)) + Math.abs(c.get(xe, xe)), J === 0 && (J = L), !(Math.abs(c.get(xe, xe - 1)) < C * J)); )
        xe--;
      if (xe === h)
        c.set(h, h, c.get(h, h) + R), o[h] = c.get(h, h), u[h] = 0, h--, ce = 0;
      else if (xe === h - 1) {
        if (_e = c.get(h, h - 1) * c.get(h - 1, h), M = (c.get(h - 1, h - 1) - c.get(h, h)) / 2, K = M * M + _e, Y = Math.sqrt(Math.abs(K)), c.set(h, h, c.get(h, h) + R), c.set(h - 1, h - 1, c.get(h - 1, h - 1) + R), Ee = c.get(h, h), K >= 0) {
          for (Y = M >= 0 ? M + Y : M - Y, o[h - 1] = Ee + Y, o[h] = o[h - 1], Y !== 0 && (o[h] = Ee - _e / Y), u[h - 1] = 0, u[h] = 0, Ee = c.get(h, h - 1), J = Math.abs(Ee) + Math.abs(Y), M = Ee / J, K = Y / J, se = Math.sqrt(M * M + K * K), M = M / se, K = K / se, ne = h - 1; ne < v; ne++)
            Y = c.get(h - 1, ne), c.set(h - 1, ne, K * Y + M * c.get(h, ne)), c.set(h, ne, K * c.get(h, ne) - M * Y);
          for (F = 0; F <= h; F++)
            Y = c.get(F, h - 1), c.set(F, h - 1, K * Y + M * c.get(F, h)), c.set(F, h, K * c.get(F, h) - M * Y);
          for (F = E; F <= k; F++)
            Y = a.get(F, h - 1), a.set(F, h - 1, K * Y + M * a.get(F, h)), a.set(F, h, K * a.get(F, h) - M * Y);
        } else
          o[h - 1] = Ee + M, o[h] = Ee + M, u[h - 1] = Y, u[h] = -Y;
        h = h - 2, ce = 0;
      } else {
        if (Ee = c.get(h, h), Ge = 0, _e = 0, xe < h && (Ge = c.get(h - 1, h - 1), _e = c.get(h, h - 1) * c.get(h - 1, h)), ce === 10) {
          for (R += Ee, F = E; F <= h; F++)
            c.set(F, F, c.get(F, F) - Ee);
          J = Math.abs(c.get(h, h - 1)) + Math.abs(c.get(h - 1, h - 2)), Ee = Ge = 0.75 * J, _e = -0.4375 * J * J;
        }
        if (ce === 30 && (J = (Ge - Ee) / 2, J = J * J + _e, J > 0)) {
          for (J = Math.sqrt(J), Ge < Ee && (J = -J), J = Ee - _e / ((Ge - Ee) / 2 + J), F = E; F <= h; F++)
            c.set(F, F, c.get(F, F) - J);
          R += J, Ee = Ge = _e = 0.964;
        }
        for (ce = ce + 1, Ae = h - 2; Ae >= xe && (Y = c.get(Ae, Ae), se = Ee - Y, J = Ge - Y, M = (se * J - _e) / c.get(Ae + 1, Ae) + c.get(Ae, Ae + 1), K = c.get(Ae + 1, Ae + 1) - Y - se - J, se = c.get(Ae + 2, Ae + 1), J = Math.abs(M) + Math.abs(K) + Math.abs(se), M = M / J, K = K / J, se = se / J, !(Ae === xe || Math.abs(c.get(Ae, Ae - 1)) * (Math.abs(K) + Math.abs(se)) < C * (Math.abs(M) * (Math.abs(c.get(Ae - 1, Ae - 1)) + Math.abs(Y) + Math.abs(c.get(Ae + 1, Ae + 1)))))); )
          Ae--;
        for (F = Ae + 2; F <= h; F++)
          c.set(F, F - 2, 0), F > Ae + 2 && c.set(F, F - 3, 0);
        for (de = Ae; de <= h - 1 && (He = de !== h - 1, de !== Ae && (M = c.get(de, de - 1), K = c.get(de + 1, de - 1), se = He ? c.get(de + 2, de - 1) : 0, Ee = Math.abs(M) + Math.abs(K) + Math.abs(se), Ee !== 0 && (M = M / Ee, K = K / Ee, se = se / Ee)), Ee !== 0); de++)
          if (J = Math.sqrt(M * M + K * K + se * se), M < 0 && (J = -J), J !== 0) {
            for (de !== Ae ? c.set(de, de - 1, -J * Ee) : xe !== Ae && c.set(de, de - 1, -c.get(de, de - 1)), M = M + J, Ee = M / J, Ge = K / J, Y = se / J, K = K / M, se = se / M, ne = de; ne < v; ne++)
              M = c.get(de, ne) + K * c.get(de + 1, ne), He && (M = M + se * c.get(de + 2, ne), c.set(de + 2, ne, c.get(de + 2, ne) - M * Y)), c.set(de, ne, c.get(de, ne) - M * Ee), c.set(de + 1, ne, c.get(de + 1, ne) - M * Ge);
            for (F = 0; F <= Math.min(h, de + 3); F++)
              M = Ee * c.get(F, de) + Ge * c.get(F, de + 1), He && (M = M + Y * c.get(F, de + 2), c.set(F, de + 2, c.get(F, de + 2) - M * se)), c.set(F, de, c.get(F, de) - M), c.set(F, de + 1, c.get(F, de + 1) - M * K);
            for (F = E; F <= k; F++)
              M = Ee * a.get(F, de) + Ge * a.get(F, de + 1), He && (M = M + Y * a.get(F, de + 2), a.set(F, de + 2, a.get(F, de + 2) - M * se)), a.set(F, de, a.get(F, de) - M), a.set(F, de + 1, a.get(F, de + 1) - M * K);
          }
      }
    }
    if (L !== 0) {
      for (h = v - 1; h >= 0; h--)
        if (M = o[h], K = u[h], K === 0)
          for (xe = h, c.set(h, h, 1), F = h - 1; F >= 0; F--) {
            for (_e = c.get(F, F) - M, se = 0, ne = xe; ne <= h; ne++)
              se = se + c.get(F, ne) * c.get(ne, h);
            if (u[F] < 0)
              Y = _e, J = se;
            else if (xe = F, u[F] === 0 ? c.set(F, h, _e !== 0 ? -se / _e : -se / (C * L)) : (Ee = c.get(F, F + 1), Ge = c.get(F + 1, F), K = (o[F] - M) * (o[F] - M) + u[F] * u[F], Qe = (Ee * J - Y * se) / K, c.set(F, h, Qe), c.set(
              F + 1,
              h,
              Math.abs(Ee) > Math.abs(Y) ? (-se - _e * Qe) / Ee : (-J - Ge * Qe) / Y
            )), Qe = Math.abs(c.get(F, h)), C * Qe * Qe > 1)
              for (ne = F; ne <= h; ne++)
                c.set(ne, h, c.get(ne, h) / Qe);
          }
        else if (K < 0)
          for (xe = h - 1, Math.abs(c.get(h, h - 1)) > Math.abs(c.get(h - 1, h)) ? (c.set(h - 1, h - 1, K / c.get(h, h - 1)), c.set(h - 1, h, -(c.get(h, h) - M) / c.get(h, h - 1))) : (Ze = ls(0, -c.get(h - 1, h), c.get(h - 1, h - 1) - M, K), c.set(h - 1, h - 1, Ze[0]), c.set(h - 1, h, Ze[1])), c.set(h, h - 1, 0), c.set(h, h, 1), F = h - 2; F >= 0; F--) {
            for (D = 0, Q = 0, ne = xe; ne <= h; ne++)
              D = D + c.get(F, ne) * c.get(ne, h - 1), Q = Q + c.get(F, ne) * c.get(ne, h);
            if (_e = c.get(F, F) - M, u[F] < 0)
              Y = _e, se = D, J = Q;
            else if (xe = F, u[F] === 0 ? (Ze = ls(-D, -Q, _e, K), c.set(F, h - 1, Ze[0]), c.set(F, h, Ze[1])) : (Ee = c.get(F, F + 1), Ge = c.get(F + 1, F), ue = (o[F] - M) * (o[F] - M) + u[F] * u[F] - K * K, te = (o[F] - M) * 2 * K, ue === 0 && te === 0 && (ue = C * L * (Math.abs(_e) + Math.abs(K) + Math.abs(Ee) + Math.abs(Ge) + Math.abs(Y))), Ze = ls(
              Ee * se - Y * D + K * Q,
              Ee * J - Y * Q - K * D,
              ue,
              te
            ), c.set(F, h - 1, Ze[0]), c.set(F, h, Ze[1]), Math.abs(Ee) > Math.abs(Y) + Math.abs(K) ? (c.set(
              F + 1,
              h - 1,
              (-D - _e * c.get(F, h - 1) + K * c.get(F, h)) / Ee
            ), c.set(
              F + 1,
              h,
              (-Q - _e * c.get(F, h) - K * c.get(F, h - 1)) / Ee
            )) : (Ze = ls(
              -se - Ge * c.get(F, h - 1),
              -J - Ge * c.get(F, h),
              Y,
              K
            ), c.set(F + 1, h - 1, Ze[0]), c.set(F + 1, h, Ze[1]))), Qe = Math.max(Math.abs(c.get(F, h - 1)), Math.abs(c.get(F, h))), C * Qe * Qe > 1)
              for (ne = F; ne <= h; ne++)
                c.set(ne, h - 1, c.get(ne, h - 1) / Qe), c.set(ne, h, c.get(ne, h) / Qe);
          }
      for (F = 0; F < v; F++)
        if (F < E || F > k)
          for (ne = F; ne < v; ne++)
            a.set(F, ne, c.get(F, ne));
      for (ne = v - 1; ne >= E; ne--)
        for (F = E; F <= k; F++) {
          for (Y = 0, de = E; de <= Math.min(ne, k); de++)
            Y = Y + a.get(F, de) * c.get(de, ne);
          a.set(F, ne, Y);
        }
    }
  }
  function ls(v, u, o, a) {
    let c, h;
    return Math.abs(o) > Math.abs(a) ? (c = a / o, h = o + c * a, [(v + c * u) / h, (u - c * v) / h]) : (c = o / a, h = a + c * o, [(c * v + u) / h, (c * u - v) / h]);
  }
  class sl {
    constructor(u) {
      if (u = Le.checkMatrix(u), !u.isSymmetric())
        throw new Error("Matrix is not symmetric");
      let o = u, a = o.rows, c = new I(a, a), h = !0, E, k, C;
      for (k = 0; k < a; k++) {
        let R = 0;
        for (C = 0; C < k; C++) {
          let L = 0;
          for (E = 0; E < C; E++)
            L += c.get(C, E) * c.get(k, E);
          L = (o.get(k, C) - L) / c.get(C, C), c.set(k, C, L), R = R + L * L;
        }
        for (R = o.get(k, k) - R, h && (h = R > 0), c.set(k, k, Math.sqrt(Math.max(R, 0))), C = k + 1; C < a; C++)
          c.set(k, C, 0);
      }
      this.L = c, this.positiveDefinite = h;
    }
    isPositiveDefinite() {
      return this.positiveDefinite;
    }
    solve(u) {
      u = Le.checkMatrix(u);
      let o = this.L, a = o.rows;
      if (u.rows !== a)
        throw new Error("Matrix dimensions do not match");
      if (this.isPositiveDefinite() === !1)
        throw new Error("Matrix is not positive definite");
      let c = u.columns, h = u.clone(), E, k, C;
      for (C = 0; C < a; C++)
        for (k = 0; k < c; k++) {
          for (E = 0; E < C; E++)
            h.set(C, k, h.get(C, k) - h.get(E, k) * o.get(C, E));
          h.set(C, k, h.get(C, k) / o.get(C, C));
        }
      for (C = a - 1; C >= 0; C--)
        for (k = 0; k < c; k++) {
          for (E = C + 1; E < a; E++)
            h.set(C, k, h.get(C, k) - h.get(E, k) * o.get(E, C));
          h.set(C, k, h.get(C, k) / o.get(C, C));
        }
      return h;
    }
    get lowerTriangularMatrix() {
      return this.L;
    }
  }
  class il {
    constructor(u, o = {}) {
      u = Le.checkMatrix(u);
      let { Y: a } = o;
      const {
        scaleScores: c = !1,
        maxIterations: h = 1e3,
        terminationCriteria: E = 1e-10
      } = o;
      let k;
      if (a) {
        if (t.isAnyArray(a) && typeof a[0] == "number" ? a = I.columnVector(a) : a = Le.checkMatrix(a), a.rows !== u.rows)
          throw new Error("Y should have the same number of rows as X");
        k = a.getColumnVector(0);
      } else
        k = u.getColumnVector(0);
      let C = 1, R, L, M, K;
      for (let se = 0; se < h && C > E; se++)
        M = u.transpose().mmul(k).div(k.transpose().mmul(k).get(0, 0)), M = M.div(M.norm()), R = u.mmul(M).div(M.transpose().mmul(M).get(0, 0)), se > 0 && (C = R.clone().sub(K).pow(2).sum()), K = R.clone(), a ? (L = a.transpose().mmul(R).div(R.transpose().mmul(R).get(0, 0)), L = L.div(L.norm()), k = a.mmul(L).div(L.transpose().mmul(L).get(0, 0))) : k = R;
      if (a) {
        let se = u.transpose().mmul(R).div(R.transpose().mmul(R).get(0, 0));
        se = se.div(se.norm());
        let J = u.clone().sub(R.clone().mmul(se.transpose())), Y = k.transpose().mmul(R).div(R.transpose().mmul(R).get(0, 0)), ce = a.clone().sub(
          R.clone().mulS(Y.get(0, 0)).mmul(L.transpose())
        );
        this.t = R, this.p = se.transpose(), this.w = M.transpose(), this.q = L, this.u = k, this.s = R.transpose().mmul(R), this.xResidual = J, this.yResidual = ce, this.betas = Y;
      } else
        this.w = M.transpose(), this.s = R.transpose().mmul(R).sqrt(), c ? this.t = R.clone().div(this.s.get(0, 0)) : this.t = R, this.xResidual = u.sub(R.mmul(M.transpose()));
    }
  }
  return Ie.AbstractMatrix = Z, Ie.CHO = sl, Ie.CholeskyDecomposition = sl, Ie.DistanceMatrix = fe, Ie.EVD = Cn, Ie.EigenvalueDecomposition = Cn, Ie.LU = Ye, Ie.LuDecomposition = Ye, Ie.Matrix = I, Ie.MatrixColumnSelectionView = Te, Ie.MatrixColumnView = Ne, Ie.MatrixFlipColumnView = q, Ie.MatrixFlipRowView = z, Ie.MatrixRowSelectionView = ae, Ie.MatrixRowView = X, Ie.MatrixSelectionView = me, Ie.MatrixSubView = Ce, Ie.MatrixTransposeView = rt, Ie.NIPALS = il, Ie.Nipals = il, Ie.QR = yt, Ie.QrDecomposition = yt, Ie.SVD = zt, Ie.SingularValueDecomposition = zt, Ie.SymmetricMatrix = W, Ie.WrapperMatrix1D = pt, Ie.WrapperMatrix2D = Le, Ie.correlation = os, Ie.covariance = Xi, Ie.default = I, Ie.determinant = sr, Ie.inverse = Vr, Ie.linearDependencies = Pn, Ie.pseudoInverse = Yi, Ie.solve = nr, Ie.wrap = it, Ie;
}
var Ho = /* @__PURE__ */ iy();
const uc = /* @__PURE__ */ zi(Ho), ay = Ho.Matrix;
uc.Matrix ? uc.Matrix : Ho.Matrix;
var ba, fc;
function oy() {
  if (fc) return ba;
  fc = 1;
  function t(e) {
    if (this.size = e | 0, this.size <= 1 || (this.size & this.size - 1) !== 0)
      throw new Error("FFT size must be a power of two and bigger than 1");
    this._csize = e << 1;
    for (var r = new Array(this.size * 2), n = 0; n < r.length; n += 2) {
      const p = Math.PI * n / this.size;
      r[n] = Math.cos(p), r[n + 1] = -Math.sin(p);
    }
    this.table = r;
    for (var s = 0, i = 1; this.size > i; i <<= 1)
      s++;
    this._width = s % 2 === 0 ? s - 1 : s, this._bitrev = new Array(1 << this._width);
    for (var l = 0; l < this._bitrev.length; l++) {
      this._bitrev[l] = 0;
      for (var f = 0; f < this._width; f += 2) {
        var d = this._width - f - 2;
        this._bitrev[l] |= (l >>> f & 3) << d;
      }
    }
    this._out = null, this._data = null, this._inv = 0;
  }
  return ba = t, t.prototype.fromComplexArray = function(r, n) {
    for (var s = n || new Array(r.length >>> 1), i = 0; i < r.length; i += 2)
      s[i >>> 1] = r[i];
    return s;
  }, t.prototype.createComplexArray = function() {
    const r = new Array(this._csize);
    for (var n = 0; n < r.length; n++)
      r[n] = 0;
    return r;
  }, t.prototype.toComplexArray = function(r, n) {
    for (var s = n || this.createComplexArray(), i = 0; i < s.length; i += 2)
      s[i] = r[i >>> 1], s[i + 1] = 0;
    return s;
  }, t.prototype.completeSpectrum = function(r) {
    for (var n = this._csize, s = n >>> 1, i = 2; i < s; i += 2)
      r[n - i] = r[i], r[n - i + 1] = -r[i + 1];
  }, t.prototype.transform = function(r, n) {
    if (r === n)
      throw new Error("Input and output buffers must be different");
    this._out = r, this._data = n, this._inv = 0, this._transform4(), this._out = null, this._data = null;
  }, t.prototype.realTransform = function(r, n) {
    if (r === n)
      throw new Error("Input and output buffers must be different");
    this._out = r, this._data = n, this._inv = 0, this._realTransform4(), this._out = null, this._data = null;
  }, t.prototype.inverseTransform = function(r, n) {
    if (r === n)
      throw new Error("Input and output buffers must be different");
    this._out = r, this._data = n, this._inv = 1, this._transform4();
    for (var s = 0; s < r.length; s++)
      r[s] /= this.size;
    this._out = null, this._data = null;
  }, t.prototype._transform4 = function() {
    var r = this._out, n = this._csize, s = this._width, i = 1 << s, l = n / i << 1, f, d, p = this._bitrev;
    if (l === 4)
      for (f = 0, d = 0; f < n; f += l, d++) {
        const y = p[d];
        this._singleTransform2(f, y, i);
      }
    else
      for (f = 0, d = 0; f < n; f += l, d++) {
        const y = p[d];
        this._singleTransform4(f, y, i);
      }
    var g = this._inv ? -1 : 1, w = this.table;
    for (i >>= 2; i >= 2; i >>= 2) {
      l = n / i << 1;
      var P = l >>> 2;
      for (f = 0; f < n; f += l)
        for (var x = f + P, T = f, S = 0; T < x; T += 2, S += i) {
          const y = T, _ = y + P, m = _ + P, b = m + P, $ = r[y], O = r[y + 1], A = r[_], j = r[_ + 1], V = r[m], G = r[m + 1], H = r[b], ee = r[b + 1], ye = $, ge = O, ke = w[S], ze = g * w[S + 1], st = A * ke - j * ze, ct = A * ze + j * ke, qe = w[2 * S], xt = g * w[2 * S + 1], re = V * qe - G * xt, U = V * xt + G * qe, Z = w[3 * S], B = g * w[3 * S + 1], N = H * Z - ee * B, I = H * B + ee * Z, W = ye + re, fe = ge + U, le = ye - re, Ne = ge - U, Te = st + N, q = ct + I, z = g * (st - N), X = g * (ct - I), ae = W + Te, me = fe + q, Ce = W - Te, rt = fe - q, pt = le + X, Le = Ne - z, it = le - X, Ye = Ne + z;
          r[y] = ae, r[y + 1] = me, r[_] = pt, r[_ + 1] = Le, r[m] = Ce, r[m + 1] = rt, r[b] = it, r[b + 1] = Ye;
        }
    }
  }, t.prototype._singleTransform2 = function(r, n, s) {
    const i = this._out, l = this._data, f = l[n], d = l[n + 1], p = l[n + s], g = l[n + s + 1], w = f + p, P = d + g, x = f - p, T = d - g;
    i[r] = w, i[r + 1] = P, i[r + 2] = x, i[r + 3] = T;
  }, t.prototype._singleTransform4 = function(r, n, s) {
    const i = this._out, l = this._data, f = this._inv ? -1 : 1, d = s * 2, p = s * 3, g = l[n], w = l[n + 1], P = l[n + s], x = l[n + s + 1], T = l[n + d], S = l[n + d + 1], y = l[n + p], _ = l[n + p + 1], m = g + T, b = w + S, $ = g - T, O = w - S, A = P + y, j = x + _, V = f * (P - y), G = f * (x - _), H = m + A, ee = b + j, ye = $ + G, ge = O - V, ke = m - A, ze = b - j, st = $ - G, ct = O + V;
    i[r] = H, i[r + 1] = ee, i[r + 2] = ye, i[r + 3] = ge, i[r + 4] = ke, i[r + 5] = ze, i[r + 6] = st, i[r + 7] = ct;
  }, t.prototype._realTransform4 = function() {
    var r = this._out, n = this._csize, s = this._width, i = 1 << s, l = n / i << 1, f, d, p = this._bitrev;
    if (l === 4)
      for (f = 0, d = 0; f < n; f += l, d++) {
        const Rn = p[d];
        this._singleRealTransform2(f, Rn >>> 1, i >>> 1);
      }
    else
      for (f = 0, d = 0; f < n; f += l, d++) {
        const Rn = p[d];
        this._singleRealTransform4(f, Rn >>> 1, i >>> 1);
      }
    var g = this._inv ? -1 : 1, w = this.table;
    for (i >>= 2; i >= 2; i >>= 2) {
      l = n / i << 1;
      var P = l >>> 1, x = P >>> 1, T = x >>> 1;
      for (f = 0; f < n; f += l)
        for (var S = 0, y = 0; S <= T; S += 2, y += i) {
          var _ = f + S, m = _ + x, b = m + x, $ = b + x, O = r[_], A = r[_ + 1], j = r[m], V = r[m + 1], G = r[b], H = r[b + 1], ee = r[$], ye = r[$ + 1], ge = O, ke = A, ze = w[y], st = g * w[y + 1], ct = j * ze - V * st, qe = j * st + V * ze, xt = w[2 * y], re = g * w[2 * y + 1], U = G * xt - H * re, Z = G * re + H * xt, B = w[3 * y], N = g * w[3 * y + 1], I = ee * B - ye * N, W = ee * N + ye * B, fe = ge + U, le = ke + Z, Ne = ge - U, Te = ke - Z, q = ct + I, z = qe + W, X = g * (ct - I), ae = g * (qe - W), me = fe + q, Ce = le + z, rt = Ne + ae, pt = Te - X;
          if (r[_] = me, r[_ + 1] = Ce, r[m] = rt, r[m + 1] = pt, S === 0) {
            var Le = fe - q, it = le - z;
            r[b] = Le, r[b + 1] = it;
            continue;
          }
          if (S !== T) {
            var Ye = Ne, gt = -Te, yt = fe, zt = -le, Vr = -g * ae, nr = -g * X, sr = -g * z, Qr = -g * q, Hr = Ye + Vr, Pn = gt + nr, Yi = yt + Qr, Xi = zt - sr, os = f + x - S, Cn = f + P - S;
            r[os] = Hr, r[os + 1] = Pn, r[Cn] = Yi, r[Cn + 1] = Xi;
          }
        }
    }
  }, t.prototype._singleRealTransform2 = function(r, n, s) {
    const i = this._out, l = this._data, f = l[n], d = l[n + s], p = f + d, g = f - d;
    i[r] = p, i[r + 1] = 0, i[r + 2] = g, i[r + 3] = 0;
  }, t.prototype._singleRealTransform4 = function(r, n, s) {
    const i = this._out, l = this._data, f = this._inv ? -1 : 1, d = s * 2, p = s * 3, g = l[n], w = l[n + s], P = l[n + d], x = l[n + p], T = g + P, S = g - P, y = w + x, _ = f * (w - x), m = T + y, b = S, $ = -_, O = T - y, A = S, j = _;
    i[r] = m, i[r + 1] = 0, i[r + 2] = b, i[r + 3] = $, i[r + 4] = O, i[r + 5] = 0, i[r + 6] = A, i[r + 7] = j;
  }, ba;
}
oy();
function ly(t, e) {
  return t === Array ? new t(e).fill(0) : new t(e);
}
function cy(t, e = {}) {
  const { from: r, step: n, size: s } = t, { ArrayConstructor: i = Float64Array } = e, l = ly(i, s);
  for (let f = 0; f < s; f++)
    l[f] = r + f * n;
  return l;
}
function uy(t, e = {}) {
  const { from: r, to: n, size: s } = t, i = (n - r) / (s - 1);
  return cy({ from: r, step: i, size: s }, e);
}
function fy(t) {
  const { currUnAssCol: e, dualVariableForColumns: r, dualVariableForRows: n, rowAssignments: s, columnAssignments: i, matrix: l } = t, f = l.rows, d = l.columns, p = new Float64Array(f), g = new Float64Array(d), w = new Float64Array(f), P = Array.from(uy({ from: 0, to: f - 1, size: f }));
  let x = f, T = -1, S = 0, y = e;
  const _ = new Array(f).fill(Number.POSITIVE_INFINITY);
  for (; T === -1; ) {
    g[y] = 1;
    let m = Number.POSITIVE_INFINITY, b = -1;
    for (let O = 0; O < x; O++) {
      const A = P[O], j = S + l.get(A, y) - r[y] - n[A];
      j < _[A] && (p[A] = y, _[A] = j), _[A] < m && (m = _[A], b = O);
    }
    if (!Number.isFinite(m))
      return { dualVariableForColumns: r, dualVariableForRows: n, sink: T, pred: p };
    const $ = P[b];
    w[$] = 1, x -= 1, P.splice(b, 1), S = _[$], s[$] === -1 ? T = $ : y = s[$];
  }
  r[e] += S;
  for (let m = 0; m < d; m++)
    g[m] !== 0 && m !== e && (r[m] += S - _[i[m]]);
  for (let m = 0; m < f; m++)
    w[m] !== 0 && (n[m] -= S - _[m]);
  return {
    sink: T,
    pred: p,
    dualVariableForColumns: r,
    dualVariableForRows: n
  };
}
function hy(t, e = {}) {
  const { maximaze: r = !0 } = e;
  let n = ay.checkMatrix(t), s = !1;
  n.columns > n.rows && (s = !0, n = n.transpose());
  const i = n.rows, l = n.columns, f = r ? n.max() : n.min();
  n = n.subtract(f), r && (n = n.mul(-1));
  let d = new Float64Array(i).fill(-1), p = new Float64Array(l).fill(-1), g = new Float64Array(l), w = new Float64Array(i);
  for (let x = 0; x < l; x++) {
    const T = fy({
      matrix: n,
      currUnAssCol: x,
      dualVariableForColumns: g,
      dualVariableForRows: w,
      rowAssignments: d,
      columnAssignments: p
    }), { sink: S, pred: y } = T;
    if (S === -1)
      return {
        rowAssignments: d,
        columnAssignments: p,
        gain: -1,
        dualVariableForColumns: g,
        dualVariableForRows: w
      };
    g = T.dualVariableForColumns, w = T.dualVariableForRows;
    let _ = S;
    for (let m = y[_]; ; m = y[_]) {
      d[_] = m;
      const b = p[m];
      if (p[m] = _, _ = b, m === x)
        break;
    }
  }
  let P = 0;
  for (let x = 0; x < l; x++)
    P += n.get(p[x], x);
  return P = (r ? -1 : 1) * P + f * l, s && ([p, d] = [d, p], [g, w] = [
    w,
    g
  ]), {
    rowAssignments: d,
    columnAssignments: p,
    gain: P,
    dualVariableForColumns: g,
    dualVariableForRows: w
  };
}
var vs = { exports: {} }, Sa = {}, pr = {}, zr = {}, Ea = {}, $a = {}, xa = {}, hc;
function xi() {
  return hc || (hc = 1, function(t) {
    Object.defineProperty(t, "__esModule", { value: !0 }), t.regexpCode = t.getEsmExportName = t.getProperty = t.safeStringify = t.stringify = t.strConcat = t.addCodeArg = t.str = t._ = t.nil = t._Code = t.Name = t.IDENTIFIER = t._CodeOrName = void 0;
    class e {
    }
    t._CodeOrName = e, t.IDENTIFIER = /^[a-z$_][a-z$_0-9]*$/i;
    class r extends e {
      constructor(m) {
        if (super(), !t.IDENTIFIER.test(m))
          throw new Error("CodeGen: name must be a valid identifier");
        this.str = m;
      }
      toString() {
        return this.str;
      }
      emptyStr() {
        return !1;
      }
      get names() {
        return { [this.str]: 1 };
      }
    }
    t.Name = r;
    class n extends e {
      constructor(m) {
        super(), this._items = typeof m == "string" ? [m] : m;
      }
      toString() {
        return this.str;
      }
      emptyStr() {
        if (this._items.length > 1)
          return !1;
        const m = this._items[0];
        return m === "" || m === '""';
      }
      get str() {
        var m;
        return (m = this._str) !== null && m !== void 0 ? m : this._str = this._items.reduce((b, $) => `${b}${$}`, "");
      }
      get names() {
        var m;
        return (m = this._names) !== null && m !== void 0 ? m : this._names = this._items.reduce((b, $) => ($ instanceof r && (b[$.str] = (b[$.str] || 0) + 1), b), {});
      }
    }
    t._Code = n, t.nil = new n("");
    function s(_, ...m) {
      const b = [_[0]];
      let $ = 0;
      for (; $ < m.length; )
        f(b, m[$]), b.push(_[++$]);
      return new n(b);
    }
    t._ = s;
    const i = new n("+");
    function l(_, ...m) {
      const b = [x(_[0])];
      let $ = 0;
      for (; $ < m.length; )
        b.push(i), f(b, m[$]), b.push(i, x(_[++$]));
      return d(b), new n(b);
    }
    t.str = l;
    function f(_, m) {
      m instanceof n ? _.push(...m._items) : m instanceof r ? _.push(m) : _.push(w(m));
    }
    t.addCodeArg = f;
    function d(_) {
      let m = 1;
      for (; m < _.length - 1; ) {
        if (_[m] === i) {
          const b = p(_[m - 1], _[m + 1]);
          if (b !== void 0) {
            _.splice(m - 1, 3, b);
            continue;
          }
          _[m++] = "+";
        }
        m++;
      }
    }
    function p(_, m) {
      if (m === '""')
        return _;
      if (_ === '""')
        return m;
      if (typeof _ == "string")
        return m instanceof r || _[_.length - 1] !== '"' ? void 0 : typeof m != "string" ? `${_.slice(0, -1)}${m}"` : m[0] === '"' ? _.slice(0, -1) + m.slice(1) : void 0;
      if (typeof m == "string" && m[0] === '"' && !(_ instanceof r))
        return `"${_}${m.slice(1)}`;
    }
    function g(_, m) {
      return m.emptyStr() ? _ : _.emptyStr() ? m : l`${_}${m}`;
    }
    t.strConcat = g;
    function w(_) {
      return typeof _ == "number" || typeof _ == "boolean" || _ === null ? _ : x(Array.isArray(_) ? _.join(",") : _);
    }
    function P(_) {
      return new n(x(_));
    }
    t.stringify = P;
    function x(_) {
      return JSON.stringify(_).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
    }
    t.safeStringify = x;
    function T(_) {
      return typeof _ == "string" && t.IDENTIFIER.test(_) ? new n(`.${_}`) : s`[${_}]`;
    }
    t.getProperty = T;
    function S(_) {
      if (typeof _ == "string" && t.IDENTIFIER.test(_))
        return new n(`${_}`);
      throw new Error(`CodeGen: invalid export name: ${_}, use explicit $id name mapping`);
    }
    t.getEsmExportName = S;
    function y(_) {
      return new n(_.toString());
    }
    t.regexpCode = y;
  }(xa)), xa;
}
var ka = {}, dc;
function mc() {
  return dc || (dc = 1, function(t) {
    Object.defineProperty(t, "__esModule", { value: !0 }), t.ValueScope = t.ValueScopeName = t.Scope = t.varKinds = t.UsedValueState = void 0;
    const e = xi();
    class r extends Error {
      constructor(p) {
        super(`CodeGen: "code" for ${p} not defined`), this.value = p.value;
      }
    }
    var n;
    (function(d) {
      d[d.Started = 0] = "Started", d[d.Completed = 1] = "Completed";
    })(n || (t.UsedValueState = n = {})), t.varKinds = {
      const: new e.Name("const"),
      let: new e.Name("let"),
      var: new e.Name("var")
    };
    class s {
      constructor({ prefixes: p, parent: g } = {}) {
        this._names = {}, this._prefixes = p, this._parent = g;
      }
      toName(p) {
        return p instanceof e.Name ? p : this.name(p);
      }
      name(p) {
        return new e.Name(this._newName(p));
      }
      _newName(p) {
        const g = this._names[p] || this._nameGroup(p);
        return `${p}${g.index++}`;
      }
      _nameGroup(p) {
        var g, w;
        if (!((w = (g = this._parent) === null || g === void 0 ? void 0 : g._prefixes) === null || w === void 0) && w.has(p) || this._prefixes && !this._prefixes.has(p))
          throw new Error(`CodeGen: prefix "${p}" is not allowed in this scope`);
        return this._names[p] = { prefix: p, index: 0 };
      }
    }
    t.Scope = s;
    class i extends e.Name {
      constructor(p, g) {
        super(g), this.prefix = p;
      }
      setValue(p, { property: g, itemIndex: w }) {
        this.value = p, this.scopePath = (0, e._)`.${new e.Name(g)}[${w}]`;
      }
    }
    t.ValueScopeName = i;
    const l = (0, e._)`\n`;
    class f extends s {
      constructor(p) {
        super(p), this._values = {}, this._scope = p.scope, this.opts = { ...p, _n: p.lines ? l : e.nil };
      }
      get() {
        return this._scope;
      }
      name(p) {
        return new i(p, this._newName(p));
      }
      value(p, g) {
        var w;
        if (g.ref === void 0)
          throw new Error("CodeGen: ref must be passed in value");
        const P = this.toName(p), { prefix: x } = P, T = (w = g.key) !== null && w !== void 0 ? w : g.ref;
        let S = this._values[x];
        if (S) {
          const m = S.get(T);
          if (m)
            return m;
        } else
          S = this._values[x] = /* @__PURE__ */ new Map();
        S.set(T, P);
        const y = this._scope[x] || (this._scope[x] = []), _ = y.length;
        return y[_] = g.ref, P.setValue(g, { property: x, itemIndex: _ }), P;
      }
      getValue(p, g) {
        const w = this._values[p];
        if (w)
          return w.get(g);
      }
      scopeRefs(p, g = this._values) {
        return this._reduceValues(g, (w) => {
          if (w.scopePath === void 0)
            throw new Error(`CodeGen: name "${w}" has no value`);
          return (0, e._)`${p}${w.scopePath}`;
        });
      }
      scopeCode(p = this._values, g, w) {
        return this._reduceValues(p, (P) => {
          if (P.value === void 0)
            throw new Error(`CodeGen: name "${P}" has no value`);
          return P.value.code;
        }, g, w);
      }
      _reduceValues(p, g, w = {}, P) {
        let x = e.nil;
        for (const T in p) {
          const S = p[T];
          if (!S)
            continue;
          const y = w[T] = w[T] || /* @__PURE__ */ new Map();
          S.forEach((_) => {
            if (y.has(_))
              return;
            y.set(_, n.Started);
            let m = g(_);
            if (m) {
              const b = this.opts.es5 ? t.varKinds.var : t.varKinds.const;
              x = (0, e._)`${x}${b} ${_} = ${m};${this.opts._n}`;
            } else if (m = P == null ? void 0 : P(_))
              x = (0, e._)`${x}${m}${this.opts._n}`;
            else
              throw new r(_);
            y.set(_, n.Completed);
          });
        }
        return x;
      }
    }
    t.ValueScope = f;
  }(ka)), ka;
}
var pc;
function Me() {
  return pc || (pc = 1, function(t) {
    Object.defineProperty(t, "__esModule", { value: !0 }), t.or = t.and = t.not = t.CodeGen = t.operators = t.varKinds = t.ValueScopeName = t.ValueScope = t.Scope = t.Name = t.regexpCode = t.stringify = t.getProperty = t.nil = t.strConcat = t.str = t._ = void 0;
    const e = xi(), r = mc();
    var n = xi();
    Object.defineProperty(t, "_", { enumerable: !0, get: function() {
      return n._;
    } }), Object.defineProperty(t, "str", { enumerable: !0, get: function() {
      return n.str;
    } }), Object.defineProperty(t, "strConcat", { enumerable: !0, get: function() {
      return n.strConcat;
    } }), Object.defineProperty(t, "nil", { enumerable: !0, get: function() {
      return n.nil;
    } }), Object.defineProperty(t, "getProperty", { enumerable: !0, get: function() {
      return n.getProperty;
    } }), Object.defineProperty(t, "stringify", { enumerable: !0, get: function() {
      return n.stringify;
    } }), Object.defineProperty(t, "regexpCode", { enumerable: !0, get: function() {
      return n.regexpCode;
    } }), Object.defineProperty(t, "Name", { enumerable: !0, get: function() {
      return n.Name;
    } });
    var s = mc();
    Object.defineProperty(t, "Scope", { enumerable: !0, get: function() {
      return s.Scope;
    } }), Object.defineProperty(t, "ValueScope", { enumerable: !0, get: function() {
      return s.ValueScope;
    } }), Object.defineProperty(t, "ValueScopeName", { enumerable: !0, get: function() {
      return s.ValueScopeName;
    } }), Object.defineProperty(t, "varKinds", { enumerable: !0, get: function() {
      return s.varKinds;
    } }), t.operators = {
      GT: new e._Code(">"),
      GTE: new e._Code(">="),
      LT: new e._Code("<"),
      LTE: new e._Code("<="),
      EQ: new e._Code("==="),
      NEQ: new e._Code("!=="),
      NOT: new e._Code("!"),
      OR: new e._Code("||"),
      AND: new e._Code("&&"),
      ADD: new e._Code("+")
    };
    class i {
      optimizeNodes() {
        return this;
      }
      optimizeNames(N, I) {
        return this;
      }
    }
    class l extends i {
      constructor(N, I, W) {
        super(), this.varKind = N, this.name = I, this.rhs = W;
      }
      render({ es5: N, _n: I }) {
        const W = N ? r.varKinds.var : this.varKind, fe = this.rhs === void 0 ? "" : ` = ${this.rhs}`;
        return `${W} ${this.name}${fe};` + I;
      }
      optimizeNames(N, I) {
        if (N[this.name.str])
          return this.rhs && (this.rhs = ke(this.rhs, N, I)), this;
      }
      get names() {
        return this.rhs instanceof e._CodeOrName ? this.rhs.names : {};
      }
    }
    class f extends i {
      constructor(N, I, W) {
        super(), this.lhs = N, this.rhs = I, this.sideEffects = W;
      }
      render({ _n: N }) {
        return `${this.lhs} = ${this.rhs};` + N;
      }
      optimizeNames(N, I) {
        if (!(this.lhs instanceof e.Name && !N[this.lhs.str] && !this.sideEffects))
          return this.rhs = ke(this.rhs, N, I), this;
      }
      get names() {
        const N = this.lhs instanceof e.Name ? {} : { ...this.lhs.names };
        return ge(N, this.rhs);
      }
    }
    class d extends f {
      constructor(N, I, W, fe) {
        super(N, W, fe), this.op = I;
      }
      render({ _n: N }) {
        return `${this.lhs} ${this.op}= ${this.rhs};` + N;
      }
    }
    class p extends i {
      constructor(N) {
        super(), this.label = N, this.names = {};
      }
      render({ _n: N }) {
        return `${this.label}:` + N;
      }
    }
    class g extends i {
      constructor(N) {
        super(), this.label = N, this.names = {};
      }
      render({ _n: N }) {
        return `break${this.label ? ` ${this.label}` : ""};` + N;
      }
    }
    class w extends i {
      constructor(N) {
        super(), this.error = N;
      }
      render({ _n: N }) {
        return `throw ${this.error};` + N;
      }
      get names() {
        return this.error.names;
      }
    }
    class P extends i {
      constructor(N) {
        super(), this.code = N;
      }
      render({ _n: N }) {
        return `${this.code};` + N;
      }
      optimizeNodes() {
        return `${this.code}` ? this : void 0;
      }
      optimizeNames(N, I) {
        return this.code = ke(this.code, N, I), this;
      }
      get names() {
        return this.code instanceof e._CodeOrName ? this.code.names : {};
      }
    }
    class x extends i {
      constructor(N = []) {
        super(), this.nodes = N;
      }
      render(N) {
        return this.nodes.reduce((I, W) => I + W.render(N), "");
      }
      optimizeNodes() {
        const { nodes: N } = this;
        let I = N.length;
        for (; I--; ) {
          const W = N[I].optimizeNodes();
          Array.isArray(W) ? N.splice(I, 1, ...W) : W ? N[I] = W : N.splice(I, 1);
        }
        return N.length > 0 ? this : void 0;
      }
      optimizeNames(N, I) {
        const { nodes: W } = this;
        let fe = W.length;
        for (; fe--; ) {
          const le = W[fe];
          le.optimizeNames(N, I) || (ze(N, le.names), W.splice(fe, 1));
        }
        return W.length > 0 ? this : void 0;
      }
      get names() {
        return this.nodes.reduce((N, I) => ye(N, I.names), {});
      }
    }
    class T extends x {
      render(N) {
        return "{" + N._n + super.render(N) + "}" + N._n;
      }
    }
    class S extends x {
    }
    class y extends T {
    }
    y.kind = "else";
    class _ extends T {
      constructor(N, I) {
        super(I), this.condition = N;
      }
      render(N) {
        let I = `if(${this.condition})` + super.render(N);
        return this.else && (I += "else " + this.else.render(N)), I;
      }
      optimizeNodes() {
        super.optimizeNodes();
        const N = this.condition;
        if (N === !0)
          return this.nodes;
        let I = this.else;
        if (I) {
          const W = I.optimizeNodes();
          I = this.else = Array.isArray(W) ? new y(W) : W;
        }
        if (I)
          return N === !1 ? I instanceof _ ? I : I.nodes : this.nodes.length ? this : new _(st(N), I instanceof _ ? [I] : I.nodes);
        if (!(N === !1 || !this.nodes.length))
          return this;
      }
      optimizeNames(N, I) {
        var W;
        if (this.else = (W = this.else) === null || W === void 0 ? void 0 : W.optimizeNames(N, I), !!(super.optimizeNames(N, I) || this.else))
          return this.condition = ke(this.condition, N, I), this;
      }
      get names() {
        const N = super.names;
        return ge(N, this.condition), this.else && ye(N, this.else.names), N;
      }
    }
    _.kind = "if";
    class m extends T {
    }
    m.kind = "for";
    class b extends m {
      constructor(N) {
        super(), this.iteration = N;
      }
      render(N) {
        return `for(${this.iteration})` + super.render(N);
      }
      optimizeNames(N, I) {
        if (super.optimizeNames(N, I))
          return this.iteration = ke(this.iteration, N, I), this;
      }
      get names() {
        return ye(super.names, this.iteration.names);
      }
    }
    class $ extends m {
      constructor(N, I, W, fe) {
        super(), this.varKind = N, this.name = I, this.from = W, this.to = fe;
      }
      render(N) {
        const I = N.es5 ? r.varKinds.var : this.varKind, { name: W, from: fe, to: le } = this;
        return `for(${I} ${W}=${fe}; ${W}<${le}; ${W}++)` + super.render(N);
      }
      get names() {
        const N = ge(super.names, this.from);
        return ge(N, this.to);
      }
    }
    class O extends m {
      constructor(N, I, W, fe) {
        super(), this.loop = N, this.varKind = I, this.name = W, this.iterable = fe;
      }
      render(N) {
        return `for(${this.varKind} ${this.name} ${this.loop} ${this.iterable})` + super.render(N);
      }
      optimizeNames(N, I) {
        if (super.optimizeNames(N, I))
          return this.iterable = ke(this.iterable, N, I), this;
      }
      get names() {
        return ye(super.names, this.iterable.names);
      }
    }
    class A extends T {
      constructor(N, I, W) {
        super(), this.name = N, this.args = I, this.async = W;
      }
      render(N) {
        return `${this.async ? "async " : ""}function ${this.name}(${this.args})` + super.render(N);
      }
    }
    A.kind = "func";
    class j extends x {
      render(N) {
        return "return " + super.render(N);
      }
    }
    j.kind = "return";
    class V extends T {
      render(N) {
        let I = "try" + super.render(N);
        return this.catch && (I += this.catch.render(N)), this.finally && (I += this.finally.render(N)), I;
      }
      optimizeNodes() {
        var N, I;
        return super.optimizeNodes(), (N = this.catch) === null || N === void 0 || N.optimizeNodes(), (I = this.finally) === null || I === void 0 || I.optimizeNodes(), this;
      }
      optimizeNames(N, I) {
        var W, fe;
        return super.optimizeNames(N, I), (W = this.catch) === null || W === void 0 || W.optimizeNames(N, I), (fe = this.finally) === null || fe === void 0 || fe.optimizeNames(N, I), this;
      }
      get names() {
        const N = super.names;
        return this.catch && ye(N, this.catch.names), this.finally && ye(N, this.finally.names), N;
      }
    }
    class G extends T {
      constructor(N) {
        super(), this.error = N;
      }
      render(N) {
        return `catch(${this.error})` + super.render(N);
      }
    }
    G.kind = "catch";
    class H extends T {
      render(N) {
        return "finally" + super.render(N);
      }
    }
    H.kind = "finally";
    class ee {
      constructor(N, I = {}) {
        this._values = {}, this._blockStarts = [], this._constants = {}, this.opts = { ...I, _n: I.lines ? `
` : "" }, this._extScope = N, this._scope = new r.Scope({ parent: N }), this._nodes = [new S()];
      }
      toString() {
        return this._root.render(this.opts);
      }
      // returns unique name in the internal scope
      name(N) {
        return this._scope.name(N);
      }
      // reserves unique name in the external scope
      scopeName(N) {
        return this._extScope.name(N);
      }
      // reserves unique name in the external scope and assigns value to it
      scopeValue(N, I) {
        const W = this._extScope.value(N, I);
        return (this._values[W.prefix] || (this._values[W.prefix] = /* @__PURE__ */ new Set())).add(W), W;
      }
      getScopeValue(N, I) {
        return this._extScope.getValue(N, I);
      }
      // return code that assigns values in the external scope to the names that are used internally
      // (same names that were returned by gen.scopeName or gen.scopeValue)
      scopeRefs(N) {
        return this._extScope.scopeRefs(N, this._values);
      }
      scopeCode() {
        return this._extScope.scopeCode(this._values);
      }
      _def(N, I, W, fe) {
        const le = this._scope.toName(I);
        return W !== void 0 && fe && (this._constants[le.str] = W), this._leafNode(new l(N, le, W)), le;
      }
      // `const` declaration (`var` in es5 mode)
      const(N, I, W) {
        return this._def(r.varKinds.const, N, I, W);
      }
      // `let` declaration with optional assignment (`var` in es5 mode)
      let(N, I, W) {
        return this._def(r.varKinds.let, N, I, W);
      }
      // `var` declaration with optional assignment
      var(N, I, W) {
        return this._def(r.varKinds.var, N, I, W);
      }
      // assignment code
      assign(N, I, W) {
        return this._leafNode(new f(N, I, W));
      }
      // `+=` code
      add(N, I) {
        return this._leafNode(new d(N, t.operators.ADD, I));
      }
      // appends passed SafeExpr to code or executes Block
      code(N) {
        return typeof N == "function" ? N() : N !== e.nil && this._leafNode(new P(N)), this;
      }
      // returns code for object literal for the passed argument list of key-value pairs
      object(...N) {
        const I = ["{"];
        for (const [W, fe] of N)
          I.length > 1 && I.push(","), I.push(W), (W !== fe || this.opts.es5) && (I.push(":"), (0, e.addCodeArg)(I, fe));
        return I.push("}"), new e._Code(I);
      }
      // `if` clause (or statement if `thenBody` and, optionally, `elseBody` are passed)
      if(N, I, W) {
        if (this._blockNode(new _(N)), I && W)
          this.code(I).else().code(W).endIf();
        else if (I)
          this.code(I).endIf();
        else if (W)
          throw new Error('CodeGen: "else" body without "then" body');
        return this;
      }
      // `else if` clause - invalid without `if` or after `else` clauses
      elseIf(N) {
        return this._elseNode(new _(N));
      }
      // `else` clause - only valid after `if` or `else if` clauses
      else() {
        return this._elseNode(new y());
      }
      // end `if` statement (needed if gen.if was used only with condition)
      endIf() {
        return this._endBlockNode(_, y);
      }
      _for(N, I) {
        return this._blockNode(N), I && this.code(I).endFor(), this;
      }
      // a generic `for` clause (or statement if `forBody` is passed)
      for(N, I) {
        return this._for(new b(N), I);
      }
      // `for` statement for a range of values
      forRange(N, I, W, fe, le = this.opts.es5 ? r.varKinds.var : r.varKinds.let) {
        const Ne = this._scope.toName(N);
        return this._for(new $(le, Ne, I, W), () => fe(Ne));
      }
      // `for-of` statement (in es5 mode replace with a normal for loop)
      forOf(N, I, W, fe = r.varKinds.const) {
        const le = this._scope.toName(N);
        if (this.opts.es5) {
          const Ne = I instanceof e.Name ? I : this.var("_arr", I);
          return this.forRange("_i", 0, (0, e._)`${Ne}.length`, (Te) => {
            this.var(le, (0, e._)`${Ne}[${Te}]`), W(le);
          });
        }
        return this._for(new O("of", fe, le, I), () => W(le));
      }
      // `for-in` statement.
      // With option `ownProperties` replaced with a `for-of` loop for object keys
      forIn(N, I, W, fe = this.opts.es5 ? r.varKinds.var : r.varKinds.const) {
        if (this.opts.ownProperties)
          return this.forOf(N, (0, e._)`Object.keys(${I})`, W);
        const le = this._scope.toName(N);
        return this._for(new O("in", fe, le, I), () => W(le));
      }
      // end `for` loop
      endFor() {
        return this._endBlockNode(m);
      }
      // `label` statement
      label(N) {
        return this._leafNode(new p(N));
      }
      // `break` statement
      break(N) {
        return this._leafNode(new g(N));
      }
      // `return` statement
      return(N) {
        const I = new j();
        if (this._blockNode(I), this.code(N), I.nodes.length !== 1)
          throw new Error('CodeGen: "return" should have one node');
        return this._endBlockNode(j);
      }
      // `try` statement
      try(N, I, W) {
        if (!I && !W)
          throw new Error('CodeGen: "try" without "catch" and "finally"');
        const fe = new V();
        if (this._blockNode(fe), this.code(N), I) {
          const le = this.name("e");
          this._currNode = fe.catch = new G(le), I(le);
        }
        return W && (this._currNode = fe.finally = new H(), this.code(W)), this._endBlockNode(G, H);
      }
      // `throw` statement
      throw(N) {
        return this._leafNode(new w(N));
      }
      // start self-balancing block
      block(N, I) {
        return this._blockStarts.push(this._nodes.length), N && this.code(N).endBlock(I), this;
      }
      // end the current self-balancing block
      endBlock(N) {
        const I = this._blockStarts.pop();
        if (I === void 0)
          throw new Error("CodeGen: not in self-balancing block");
        const W = this._nodes.length - I;
        if (W < 0 || N !== void 0 && W !== N)
          throw new Error(`CodeGen: wrong number of nodes: ${W} vs ${N} expected`);
        return this._nodes.length = I, this;
      }
      // `function` heading (or definition if funcBody is passed)
      func(N, I = e.nil, W, fe) {
        return this._blockNode(new A(N, I, W)), fe && this.code(fe).endFunc(), this;
      }
      // end function definition
      endFunc() {
        return this._endBlockNode(A);
      }
      optimize(N = 1) {
        for (; N-- > 0; )
          this._root.optimizeNodes(), this._root.optimizeNames(this._root.names, this._constants);
      }
      _leafNode(N) {
        return this._currNode.nodes.push(N), this;
      }
      _blockNode(N) {
        this._currNode.nodes.push(N), this._nodes.push(N);
      }
      _endBlockNode(N, I) {
        const W = this._currNode;
        if (W instanceof N || I && W instanceof I)
          return this._nodes.pop(), this;
        throw new Error(`CodeGen: not in block "${I ? `${N.kind}/${I.kind}` : N.kind}"`);
      }
      _elseNode(N) {
        const I = this._currNode;
        if (!(I instanceof _))
          throw new Error('CodeGen: "else" without "if"');
        return this._currNode = I.else = N, this;
      }
      get _root() {
        return this._nodes[0];
      }
      get _currNode() {
        const N = this._nodes;
        return N[N.length - 1];
      }
      set _currNode(N) {
        const I = this._nodes;
        I[I.length - 1] = N;
      }
    }
    t.CodeGen = ee;
    function ye(B, N) {
      for (const I in N)
        B[I] = (B[I] || 0) + (N[I] || 0);
      return B;
    }
    function ge(B, N) {
      return N instanceof e._CodeOrName ? ye(B, N.names) : B;
    }
    function ke(B, N, I) {
      if (B instanceof e.Name)
        return W(B);
      if (!fe(B))
        return B;
      return new e._Code(B._items.reduce((le, Ne) => (Ne instanceof e.Name && (Ne = W(Ne)), Ne instanceof e._Code ? le.push(...Ne._items) : le.push(Ne), le), []));
      function W(le) {
        const Ne = I[le.str];
        return Ne === void 0 || N[le.str] !== 1 ? le : (delete N[le.str], Ne);
      }
      function fe(le) {
        return le instanceof e._Code && le._items.some((Ne) => Ne instanceof e.Name && N[Ne.str] === 1 && I[Ne.str] !== void 0);
      }
    }
    function ze(B, N) {
      for (const I in N)
        B[I] = (B[I] || 0) - (N[I] || 0);
    }
    function st(B) {
      return typeof B == "boolean" || typeof B == "number" || B === null ? !B : (0, e._)`!${Z(B)}`;
    }
    t.not = st;
    const ct = U(t.operators.AND);
    function qe(...B) {
      return B.reduce(ct);
    }
    t.and = qe;
    const xt = U(t.operators.OR);
    function re(...B) {
      return B.reduce(xt);
    }
    t.or = re;
    function U(B) {
      return (N, I) => N === e.nil ? I : I === e.nil ? N : (0, e._)`${Z(N)} ${B} ${Z(I)}`;
    }
    function Z(B) {
      return B instanceof e.Name ? B : (0, e._)`(${B})`;
    }
  }($a)), $a;
}
var je = {}, gc;
function Ue() {
  if (gc) return je;
  gc = 1, Object.defineProperty(je, "__esModule", { value: !0 }), je.checkStrictMode = je.getErrorPath = je.Type = je.useFunc = je.setEvaluated = je.evaluatedPropsToName = je.mergeEvaluated = je.eachItem = je.unescapeJsonPointer = je.escapeJsonPointer = je.escapeFragment = je.unescapeFragment = je.schemaRefOrVal = je.schemaHasRulesButRef = je.schemaHasRules = je.checkUnknownRules = je.alwaysValidSchema = je.toHash = void 0;
  const t = Me(), e = xi();
  function r(O) {
    const A = {};
    for (const j of O)
      A[j] = !0;
    return A;
  }
  je.toHash = r;
  function n(O, A) {
    return typeof A == "boolean" ? A : Object.keys(A).length === 0 ? !0 : (s(O, A), !i(A, O.self.RULES.all));
  }
  je.alwaysValidSchema = n;
  function s(O, A = O.schema) {
    const { opts: j, self: V } = O;
    if (!j.strictSchema || typeof A == "boolean")
      return;
    const G = V.RULES.keywords;
    for (const H in A)
      G[H] || $(O, `unknown keyword: "${H}"`);
  }
  je.checkUnknownRules = s;
  function i(O, A) {
    if (typeof O == "boolean")
      return !O;
    for (const j in O)
      if (A[j])
        return !0;
    return !1;
  }
  je.schemaHasRules = i;
  function l(O, A) {
    if (typeof O == "boolean")
      return !O;
    for (const j in O)
      if (j !== "$ref" && A.all[j])
        return !0;
    return !1;
  }
  je.schemaHasRulesButRef = l;
  function f({ topSchemaRef: O, schemaPath: A }, j, V, G) {
    if (!G) {
      if (typeof j == "number" || typeof j == "boolean")
        return j;
      if (typeof j == "string")
        return (0, t._)`${j}`;
    }
    return (0, t._)`${O}${A}${(0, t.getProperty)(V)}`;
  }
  je.schemaRefOrVal = f;
  function d(O) {
    return w(decodeURIComponent(O));
  }
  je.unescapeFragment = d;
  function p(O) {
    return encodeURIComponent(g(O));
  }
  je.escapeFragment = p;
  function g(O) {
    return typeof O == "number" ? `${O}` : O.replace(/~/g, "~0").replace(/\//g, "~1");
  }
  je.escapeJsonPointer = g;
  function w(O) {
    return O.replace(/~1/g, "/").replace(/~0/g, "~");
  }
  je.unescapeJsonPointer = w;
  function P(O, A) {
    if (Array.isArray(O))
      for (const j of O)
        A(j);
    else
      A(O);
  }
  je.eachItem = P;
  function x({ mergeNames: O, mergeToName: A, mergeValues: j, resultToName: V }) {
    return (G, H, ee, ye) => {
      const ge = ee === void 0 ? H : ee instanceof t.Name ? (H instanceof t.Name ? O(G, H, ee) : A(G, H, ee), ee) : H instanceof t.Name ? (A(G, ee, H), H) : j(H, ee);
      return ye === t.Name && !(ge instanceof t.Name) ? V(G, ge) : ge;
    };
  }
  je.mergeEvaluated = {
    props: x({
      mergeNames: (O, A, j) => O.if((0, t._)`${j} !== true && ${A} !== undefined`, () => {
        O.if((0, t._)`${A} === true`, () => O.assign(j, !0), () => O.assign(j, (0, t._)`${j} || {}`).code((0, t._)`Object.assign(${j}, ${A})`));
      }),
      mergeToName: (O, A, j) => O.if((0, t._)`${j} !== true`, () => {
        A === !0 ? O.assign(j, !0) : (O.assign(j, (0, t._)`${j} || {}`), S(O, j, A));
      }),
      mergeValues: (O, A) => O === !0 ? !0 : { ...O, ...A },
      resultToName: T
    }),
    items: x({
      mergeNames: (O, A, j) => O.if((0, t._)`${j} !== true && ${A} !== undefined`, () => O.assign(j, (0, t._)`${A} === true ? true : ${j} > ${A} ? ${j} : ${A}`)),
      mergeToName: (O, A, j) => O.if((0, t._)`${j} !== true`, () => O.assign(j, A === !0 ? !0 : (0, t._)`${j} > ${A} ? ${j} : ${A}`)),
      mergeValues: (O, A) => O === !0 ? !0 : Math.max(O, A),
      resultToName: (O, A) => O.var("items", A)
    })
  };
  function T(O, A) {
    if (A === !0)
      return O.var("props", !0);
    const j = O.var("props", (0, t._)`{}`);
    return A !== void 0 && S(O, j, A), j;
  }
  je.evaluatedPropsToName = T;
  function S(O, A, j) {
    Object.keys(j).forEach((V) => O.assign((0, t._)`${A}${(0, t.getProperty)(V)}`, !0));
  }
  je.setEvaluated = S;
  const y = {};
  function _(O, A) {
    return O.scopeValue("func", {
      ref: A,
      code: y[A.code] || (y[A.code] = new e._Code(A.code))
    });
  }
  je.useFunc = _;
  var m;
  (function(O) {
    O[O.Num = 0] = "Num", O[O.Str = 1] = "Str";
  })(m || (je.Type = m = {}));
  function b(O, A, j) {
    if (O instanceof t.Name) {
      const V = A === m.Num;
      return j ? V ? (0, t._)`"[" + ${O} + "]"` : (0, t._)`"['" + ${O} + "']"` : V ? (0, t._)`"/" + ${O}` : (0, t._)`"/" + ${O}.replace(/~/g, "~0").replace(/\\//g, "~1")`;
    }
    return j ? (0, t.getProperty)(O).toString() : "/" + g(O);
  }
  je.getErrorPath = b;
  function $(O, A, j = O.opts.strictSchema) {
    if (j) {
      if (A = `strict mode: ${A}`, j === !0)
        throw new Error(A);
      O.self.logger.warn(A);
    }
  }
  return je.checkStrictMode = $, je;
}
var bs = {}, yc;
function Dr() {
  if (yc) return bs;
  yc = 1, Object.defineProperty(bs, "__esModule", { value: !0 });
  const t = Me(), e = {
    // validation function arguments
    data: new t.Name("data"),
    // data passed to validation function
    // args passed from referencing schema
    valCxt: new t.Name("valCxt"),
    // validation/data context - should not be used directly, it is destructured to the names below
    instancePath: new t.Name("instancePath"),
    parentData: new t.Name("parentData"),
    parentDataProperty: new t.Name("parentDataProperty"),
    rootData: new t.Name("rootData"),
    // root data - same as the data passed to the first/top validation function
    dynamicAnchors: new t.Name("dynamicAnchors"),
    // used to support recursiveRef and dynamicRef
    // function scoped variables
    vErrors: new t.Name("vErrors"),
    // null or array of validation errors
    errors: new t.Name("errors"),
    // counter of validation errors
    this: new t.Name("this"),
    // "globals"
    self: new t.Name("self"),
    scope: new t.Name("scope"),
    // JTD serialize/parse name for JSON string and position
    json: new t.Name("json"),
    jsonPos: new t.Name("jsonPos"),
    jsonLen: new t.Name("jsonLen"),
    jsonPart: new t.Name("jsonPart")
  };
  return bs.default = e, bs;
}
var wc;
function Bi() {
  return wc || (wc = 1, function(t) {
    Object.defineProperty(t, "__esModule", { value: !0 }), t.extendErrors = t.resetErrorsCount = t.reportExtraError = t.reportError = t.keyword$DataError = t.keywordError = void 0;
    const e = Me(), r = Ue(), n = Dr();
    t.keywordError = {
      message: ({ keyword: y }) => (0, e.str)`must pass "${y}" keyword validation`
    }, t.keyword$DataError = {
      message: ({ keyword: y, schemaType: _ }) => _ ? (0, e.str)`"${y}" keyword must be ${_} ($data)` : (0, e.str)`"${y}" keyword is invalid ($data)`
    };
    function s(y, _ = t.keywordError, m, b) {
      const { it: $ } = y, { gen: O, compositeRule: A, allErrors: j } = $, V = w(y, _, m);
      b ?? (A || j) ? d(O, V) : p($, (0, e._)`[${V}]`);
    }
    t.reportError = s;
    function i(y, _ = t.keywordError, m) {
      const { it: b } = y, { gen: $, compositeRule: O, allErrors: A } = b, j = w(y, _, m);
      d($, j), O || A || p(b, n.default.vErrors);
    }
    t.reportExtraError = i;
    function l(y, _) {
      y.assign(n.default.errors, _), y.if((0, e._)`${n.default.vErrors} !== null`, () => y.if(_, () => y.assign((0, e._)`${n.default.vErrors}.length`, _), () => y.assign(n.default.vErrors, null)));
    }
    t.resetErrorsCount = l;
    function f({ gen: y, keyword: _, schemaValue: m, data: b, errsCount: $, it: O }) {
      if ($ === void 0)
        throw new Error("ajv implementation error");
      const A = y.name("err");
      y.forRange("i", $, n.default.errors, (j) => {
        y.const(A, (0, e._)`${n.default.vErrors}[${j}]`), y.if((0, e._)`${A}.instancePath === undefined`, () => y.assign((0, e._)`${A}.instancePath`, (0, e.strConcat)(n.default.instancePath, O.errorPath))), y.assign((0, e._)`${A}.schemaPath`, (0, e.str)`${O.errSchemaPath}/${_}`), O.opts.verbose && (y.assign((0, e._)`${A}.schema`, m), y.assign((0, e._)`${A}.data`, b));
      });
    }
    t.extendErrors = f;
    function d(y, _) {
      const m = y.const("err", _);
      y.if((0, e._)`${n.default.vErrors} === null`, () => y.assign(n.default.vErrors, (0, e._)`[${m}]`), (0, e._)`${n.default.vErrors}.push(${m})`), y.code((0, e._)`${n.default.errors}++`);
    }
    function p(y, _) {
      const { gen: m, validateName: b, schemaEnv: $ } = y;
      $.$async ? m.throw((0, e._)`new ${y.ValidationError}(${_})`) : (m.assign((0, e._)`${b}.errors`, _), m.return(!1));
    }
    const g = {
      keyword: new e.Name("keyword"),
      schemaPath: new e.Name("schemaPath"),
      // also used in JTD errors
      params: new e.Name("params"),
      propertyName: new e.Name("propertyName"),
      message: new e.Name("message"),
      schema: new e.Name("schema"),
      parentSchema: new e.Name("parentSchema")
    };
    function w(y, _, m) {
      const { createErrors: b } = y.it;
      return b === !1 ? (0, e._)`{}` : P(y, _, m);
    }
    function P(y, _, m = {}) {
      const { gen: b, it: $ } = y, O = [
        x($, m),
        T(y, m)
      ];
      return S(y, _, O), b.object(...O);
    }
    function x({ errorPath: y }, { instancePath: _ }) {
      const m = _ ? (0, e.str)`${y}${(0, r.getErrorPath)(_, r.Type.Str)}` : y;
      return [n.default.instancePath, (0, e.strConcat)(n.default.instancePath, m)];
    }
    function T({ keyword: y, it: { errSchemaPath: _ } }, { schemaPath: m, parentSchema: b }) {
      let $ = b ? _ : (0, e.str)`${_}/${y}`;
      return m && ($ = (0, e.str)`${$}${(0, r.getErrorPath)(m, r.Type.Str)}`), [g.schemaPath, $];
    }
    function S(y, { params: _, message: m }, b) {
      const { keyword: $, data: O, schemaValue: A, it: j } = y, { opts: V, propertyName: G, topSchemaRef: H, schemaPath: ee } = j;
      b.push([g.keyword, $], [g.params, typeof _ == "function" ? _(y) : _ || (0, e._)`{}`]), V.messages && b.push([g.message, typeof m == "function" ? m(y) : m]), V.verbose && b.push([g.schema, A], [g.parentSchema, (0, e._)`${H}${ee}`], [n.default.data, O]), G && b.push([g.propertyName, G]);
    }
  }(Ea)), Ea;
}
var _c;
function dy() {
  if (_c) return zr;
  _c = 1, Object.defineProperty(zr, "__esModule", { value: !0 }), zr.boolOrEmptySchema = zr.topBoolOrEmptySchema = void 0;
  const t = Bi(), e = Me(), r = Dr(), n = {
    message: "boolean schema is false"
  };
  function s(f) {
    const { gen: d, schema: p, validateName: g } = f;
    p === !1 ? l(f, !1) : typeof p == "object" && p.$async === !0 ? d.return(r.default.data) : (d.assign((0, e._)`${g}.errors`, null), d.return(!0));
  }
  zr.topBoolOrEmptySchema = s;
  function i(f, d) {
    const { gen: p, schema: g } = f;
    g === !1 ? (p.var(d, !1), l(f)) : p.var(d, !0);
  }
  zr.boolOrEmptySchema = i;
  function l(f, d) {
    const { gen: p, data: g } = f, w = {
      gen: p,
      keyword: "false schema",
      data: g,
      schema: !1,
      schemaCode: !1,
      schemaValue: !1,
      params: {},
      it: f
    };
    (0, t.reportError)(w, n, void 0, d);
  }
  return zr;
}
var bt = {}, Br = {}, vc;
function wh() {
  if (vc) return Br;
  vc = 1, Object.defineProperty(Br, "__esModule", { value: !0 }), Br.getRules = Br.isJSONType = void 0;
  const t = ["string", "number", "integer", "boolean", "null", "object", "array"], e = new Set(t);
  function r(s) {
    return typeof s == "string" && e.has(s);
  }
  Br.isJSONType = r;
  function n() {
    const s = {
      number: { type: "number", rules: [] },
      string: { type: "string", rules: [] },
      array: { type: "array", rules: [] },
      object: { type: "object", rules: [] }
    };
    return {
      types: { ...s, integer: !0, boolean: !0, null: !0 },
      rules: [{ rules: [] }, s.number, s.string, s.array, s.object],
      post: { rules: [] },
      all: {},
      keywords: {}
    };
  }
  return Br.getRules = n, Br;
}
var gr = {}, bc;
function _h() {
  if (bc) return gr;
  bc = 1, Object.defineProperty(gr, "__esModule", { value: !0 }), gr.shouldUseRule = gr.shouldUseGroup = gr.schemaHasRulesForType = void 0;
  function t({ schema: n, self: s }, i) {
    const l = s.RULES.types[i];
    return l && l !== !0 && e(n, l);
  }
  gr.schemaHasRulesForType = t;
  function e(n, s) {
    return s.rules.some((i) => r(n, i));
  }
  gr.shouldUseGroup = e;
  function r(n, s) {
    var i;
    return n[s.keyword] !== void 0 || ((i = s.definition.implements) === null || i === void 0 ? void 0 : i.some((l) => n[l] !== void 0));
  }
  return gr.shouldUseRule = r, gr;
}
var Sc;
function ki() {
  if (Sc) return bt;
  Sc = 1, Object.defineProperty(bt, "__esModule", { value: !0 }), bt.reportTypeError = bt.checkDataTypes = bt.checkDataType = bt.coerceAndCheckDataType = bt.getJSONTypes = bt.getSchemaTypes = bt.DataType = void 0;
  const t = wh(), e = _h(), r = Bi(), n = Me(), s = Ue();
  var i;
  (function(m) {
    m[m.Correct = 0] = "Correct", m[m.Wrong = 1] = "Wrong";
  })(i || (bt.DataType = i = {}));
  function l(m) {
    const b = f(m.type);
    if (b.includes("null")) {
      if (m.nullable === !1)
        throw new Error("type: null contradicts nullable: false");
    } else {
      if (!b.length && m.nullable !== void 0)
        throw new Error('"nullable" cannot be used without "type"');
      m.nullable === !0 && b.push("null");
    }
    return b;
  }
  bt.getSchemaTypes = l;
  function f(m) {
    const b = Array.isArray(m) ? m : m ? [m] : [];
    if (b.every(t.isJSONType))
      return b;
    throw new Error("type must be JSONType or JSONType[]: " + b.join(","));
  }
  bt.getJSONTypes = f;
  function d(m, b) {
    const { gen: $, data: O, opts: A } = m, j = g(b, A.coerceTypes), V = b.length > 0 && !(j.length === 0 && b.length === 1 && (0, e.schemaHasRulesForType)(m, b[0]));
    if (V) {
      const G = T(b, O, A.strictNumbers, i.Wrong);
      $.if(G, () => {
        j.length ? w(m, b, j) : y(m);
      });
    }
    return V;
  }
  bt.coerceAndCheckDataType = d;
  const p = /* @__PURE__ */ new Set(["string", "number", "integer", "boolean", "null"]);
  function g(m, b) {
    return b ? m.filter(($) => p.has($) || b === "array" && $ === "array") : [];
  }
  function w(m, b, $) {
    const { gen: O, data: A, opts: j } = m, V = O.let("dataType", (0, n._)`typeof ${A}`), G = O.let("coerced", (0, n._)`undefined`);
    j.coerceTypes === "array" && O.if((0, n._)`${V} == 'object' && Array.isArray(${A}) && ${A}.length == 1`, () => O.assign(A, (0, n._)`${A}[0]`).assign(V, (0, n._)`typeof ${A}`).if(T(b, A, j.strictNumbers), () => O.assign(G, A))), O.if((0, n._)`${G} !== undefined`);
    for (const ee of $)
      (p.has(ee) || ee === "array" && j.coerceTypes === "array") && H(ee);
    O.else(), y(m), O.endIf(), O.if((0, n._)`${G} !== undefined`, () => {
      O.assign(A, G), P(m, G);
    });
    function H(ee) {
      switch (ee) {
        case "string":
          O.elseIf((0, n._)`${V} == "number" || ${V} == "boolean"`).assign(G, (0, n._)`"" + ${A}`).elseIf((0, n._)`${A} === null`).assign(G, (0, n._)`""`);
          return;
        case "number":
          O.elseIf((0, n._)`${V} == "boolean" || ${A} === null
              || (${V} == "string" && ${A} && ${A} == +${A})`).assign(G, (0, n._)`+${A}`);
          return;
        case "integer":
          O.elseIf((0, n._)`${V} === "boolean" || ${A} === null
              || (${V} === "string" && ${A} && ${A} == +${A} && !(${A} % 1))`).assign(G, (0, n._)`+${A}`);
          return;
        case "boolean":
          O.elseIf((0, n._)`${A} === "false" || ${A} === 0 || ${A} === null`).assign(G, !1).elseIf((0, n._)`${A} === "true" || ${A} === 1`).assign(G, !0);
          return;
        case "null":
          O.elseIf((0, n._)`${A} === "" || ${A} === 0 || ${A} === false`), O.assign(G, null);
          return;
        case "array":
          O.elseIf((0, n._)`${V} === "string" || ${V} === "number"
              || ${V} === "boolean" || ${A} === null`).assign(G, (0, n._)`[${A}]`);
      }
    }
  }
  function P({ gen: m, parentData: b, parentDataProperty: $ }, O) {
    m.if((0, n._)`${b} !== undefined`, () => m.assign((0, n._)`${b}[${$}]`, O));
  }
  function x(m, b, $, O = i.Correct) {
    const A = O === i.Correct ? n.operators.EQ : n.operators.NEQ;
    let j;
    switch (m) {
      case "null":
        return (0, n._)`${b} ${A} null`;
      case "array":
        j = (0, n._)`Array.isArray(${b})`;
        break;
      case "object":
        j = (0, n._)`${b} && typeof ${b} == "object" && !Array.isArray(${b})`;
        break;
      case "integer":
        j = V((0, n._)`!(${b} % 1) && !isNaN(${b})`);
        break;
      case "number":
        j = V();
        break;
      default:
        return (0, n._)`typeof ${b} ${A} ${m}`;
    }
    return O === i.Correct ? j : (0, n.not)(j);
    function V(G = n.nil) {
      return (0, n.and)((0, n._)`typeof ${b} == "number"`, G, $ ? (0, n._)`isFinite(${b})` : n.nil);
    }
  }
  bt.checkDataType = x;
  function T(m, b, $, O) {
    if (m.length === 1)
      return x(m[0], b, $, O);
    let A;
    const j = (0, s.toHash)(m);
    if (j.array && j.object) {
      const V = (0, n._)`typeof ${b} != "object"`;
      A = j.null ? V : (0, n._)`!${b} || ${V}`, delete j.null, delete j.array, delete j.object;
    } else
      A = n.nil;
    j.number && delete j.integer;
    for (const V in j)
      A = (0, n.and)(A, x(V, b, $, O));
    return A;
  }
  bt.checkDataTypes = T;
  const S = {
    message: ({ schema: m }) => `must be ${m}`,
    params: ({ schema: m, schemaValue: b }) => typeof m == "string" ? (0, n._)`{type: ${m}}` : (0, n._)`{type: ${b}}`
  };
  function y(m) {
    const b = _(m);
    (0, r.reportError)(b, S);
  }
  bt.reportTypeError = y;
  function _(m) {
    const { gen: b, data: $, schema: O } = m, A = (0, s.schemaRefOrVal)(m, O, "type");
    return {
      gen: b,
      keyword: "type",
      data: $,
      schema: O.type,
      schemaCode: A,
      schemaValue: A,
      parentSchema: O,
      params: {},
      it: m
    };
  }
  return bt;
}
var On = {}, Ec;
function my() {
  if (Ec) return On;
  Ec = 1, Object.defineProperty(On, "__esModule", { value: !0 }), On.assignDefaults = void 0;
  const t = Me(), e = Ue();
  function r(s, i) {
    const { properties: l, items: f } = s.schema;
    if (i === "object" && l)
      for (const d in l)
        n(s, d, l[d].default);
    else i === "array" && Array.isArray(f) && f.forEach((d, p) => n(s, p, d.default));
  }
  On.assignDefaults = r;
  function n(s, i, l) {
    const { gen: f, compositeRule: d, data: p, opts: g } = s;
    if (l === void 0)
      return;
    const w = (0, t._)`${p}${(0, t.getProperty)(i)}`;
    if (d) {
      (0, e.checkStrictMode)(s, `default is ignored for: ${w}`);
      return;
    }
    let P = (0, t._)`${w} === undefined`;
    g.useDefaults === "empty" && (P = (0, t._)`${P} || ${w} === null || ${w} === ""`), f.if(P, (0, t._)`${w} = ${(0, t.stringify)(l)}`);
  }
  return On;
}
var Gt = {}, Je = {}, $c;
function rr() {
  if ($c) return Je;
  $c = 1, Object.defineProperty(Je, "__esModule", { value: !0 }), Je.validateUnion = Je.validateArray = Je.usePattern = Je.callValidateCode = Je.schemaProperties = Je.allSchemaProperties = Je.noPropertyInData = Je.propertyInData = Je.isOwnProperty = Je.hasPropFunc = Je.reportMissingProp = Je.checkMissingProp = Je.checkReportMissingProp = void 0;
  const t = Me(), e = Ue(), r = Dr(), n = Ue();
  function s(m, b) {
    const { gen: $, data: O, it: A } = m;
    $.if(g($, O, b, A.opts.ownProperties), () => {
      m.setParams({ missingProperty: (0, t._)`${b}` }, !0), m.error();
    });
  }
  Je.checkReportMissingProp = s;
  function i({ gen: m, data: b, it: { opts: $ } }, O, A) {
    return (0, t.or)(...O.map((j) => (0, t.and)(g(m, b, j, $.ownProperties), (0, t._)`${A} = ${j}`)));
  }
  Je.checkMissingProp = i;
  function l(m, b) {
    m.setParams({ missingProperty: b }, !0), m.error();
  }
  Je.reportMissingProp = l;
  function f(m) {
    return m.scopeValue("func", {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      ref: Object.prototype.hasOwnProperty,
      code: (0, t._)`Object.prototype.hasOwnProperty`
    });
  }
  Je.hasPropFunc = f;
  function d(m, b, $) {
    return (0, t._)`${f(m)}.call(${b}, ${$})`;
  }
  Je.isOwnProperty = d;
  function p(m, b, $, O) {
    const A = (0, t._)`${b}${(0, t.getProperty)($)} !== undefined`;
    return O ? (0, t._)`${A} && ${d(m, b, $)}` : A;
  }
  Je.propertyInData = p;
  function g(m, b, $, O) {
    const A = (0, t._)`${b}${(0, t.getProperty)($)} === undefined`;
    return O ? (0, t.or)(A, (0, t.not)(d(m, b, $))) : A;
  }
  Je.noPropertyInData = g;
  function w(m) {
    return m ? Object.keys(m).filter((b) => b !== "__proto__") : [];
  }
  Je.allSchemaProperties = w;
  function P(m, b) {
    return w(b).filter(($) => !(0, e.alwaysValidSchema)(m, b[$]));
  }
  Je.schemaProperties = P;
  function x({ schemaCode: m, data: b, it: { gen: $, topSchemaRef: O, schemaPath: A, errorPath: j }, it: V }, G, H, ee) {
    const ye = ee ? (0, t._)`${m}, ${b}, ${O}${A}` : b, ge = [
      [r.default.instancePath, (0, t.strConcat)(r.default.instancePath, j)],
      [r.default.parentData, V.parentData],
      [r.default.parentDataProperty, V.parentDataProperty],
      [r.default.rootData, r.default.rootData]
    ];
    V.opts.dynamicRef && ge.push([r.default.dynamicAnchors, r.default.dynamicAnchors]);
    const ke = (0, t._)`${ye}, ${$.object(...ge)}`;
    return H !== t.nil ? (0, t._)`${G}.call(${H}, ${ke})` : (0, t._)`${G}(${ke})`;
  }
  Je.callValidateCode = x;
  const T = (0, t._)`new RegExp`;
  function S({ gen: m, it: { opts: b } }, $) {
    const O = b.unicodeRegExp ? "u" : "", { regExp: A } = b.code, j = A($, O);
    return m.scopeValue("pattern", {
      key: j.toString(),
      ref: j,
      code: (0, t._)`${A.code === "new RegExp" ? T : (0, n.useFunc)(m, A)}(${$}, ${O})`
    });
  }
  Je.usePattern = S;
  function y(m) {
    const { gen: b, data: $, keyword: O, it: A } = m, j = b.name("valid");
    if (A.allErrors) {
      const G = b.let("valid", !0);
      return V(() => b.assign(G, !1)), G;
    }
    return b.var(j, !0), V(() => b.break()), j;
    function V(G) {
      const H = b.const("len", (0, t._)`${$}.length`);
      b.forRange("i", 0, H, (ee) => {
        m.subschema({
          keyword: O,
          dataProp: ee,
          dataPropType: e.Type.Num
        }, j), b.if((0, t.not)(j), G);
      });
    }
  }
  Je.validateArray = y;
  function _(m) {
    const { gen: b, schema: $, keyword: O, it: A } = m;
    if (!Array.isArray($))
      throw new Error("ajv implementation error");
    if ($.some((H) => (0, e.alwaysValidSchema)(A, H)) && !A.opts.unevaluated)
      return;
    const V = b.let("valid", !1), G = b.name("_valid");
    b.block(() => $.forEach((H, ee) => {
      const ye = m.subschema({
        keyword: O,
        schemaProp: ee,
        compositeRule: !0
      }, G);
      b.assign(V, (0, t._)`${V} || ${G}`), m.mergeValidEvaluated(ye, G) || b.if((0, t.not)(V));
    })), m.result(V, () => m.reset(), () => m.error(!0));
  }
  return Je.validateUnion = _, Je;
}
var xc;
function py() {
  if (xc) return Gt;
  xc = 1, Object.defineProperty(Gt, "__esModule", { value: !0 }), Gt.validateKeywordUsage = Gt.validSchemaType = Gt.funcKeywordCode = Gt.macroKeywordCode = void 0;
  const t = Me(), e = Dr(), r = rr(), n = Bi();
  function s(P, x) {
    const { gen: T, keyword: S, schema: y, parentSchema: _, it: m } = P, b = x.macro.call(m.self, y, _, m), $ = p(T, S, b);
    m.opts.validateSchema !== !1 && m.self.validateSchema(b, !0);
    const O = T.name("valid");
    P.subschema({
      schema: b,
      schemaPath: t.nil,
      errSchemaPath: `${m.errSchemaPath}/${S}`,
      topSchemaRef: $,
      compositeRule: !0
    }, O), P.pass(O, () => P.error(!0));
  }
  Gt.macroKeywordCode = s;
  function i(P, x) {
    var T;
    const { gen: S, keyword: y, schema: _, parentSchema: m, $data: b, it: $ } = P;
    d($, x);
    const O = !b && x.compile ? x.compile.call($.self, _, m, $) : x.validate, A = p(S, y, O), j = S.let("valid");
    P.block$data(j, V), P.ok((T = x.valid) !== null && T !== void 0 ? T : j);
    function V() {
      if (x.errors === !1)
        ee(), x.modifying && l(P), ye(() => P.error());
      else {
        const ge = x.async ? G() : H();
        x.modifying && l(P), ye(() => f(P, ge));
      }
    }
    function G() {
      const ge = S.let("ruleErrs", null);
      return S.try(() => ee((0, t._)`await `), (ke) => S.assign(j, !1).if((0, t._)`${ke} instanceof ${$.ValidationError}`, () => S.assign(ge, (0, t._)`${ke}.errors`), () => S.throw(ke))), ge;
    }
    function H() {
      const ge = (0, t._)`${A}.errors`;
      return S.assign(ge, null), ee(t.nil), ge;
    }
    function ee(ge = x.async ? (0, t._)`await ` : t.nil) {
      const ke = $.opts.passContext ? e.default.this : e.default.self, ze = !("compile" in x && !b || x.schema === !1);
      S.assign(j, (0, t._)`${ge}${(0, r.callValidateCode)(P, A, ke, ze)}`, x.modifying);
    }
    function ye(ge) {
      var ke;
      S.if((0, t.not)((ke = x.valid) !== null && ke !== void 0 ? ke : j), ge);
    }
  }
  Gt.funcKeywordCode = i;
  function l(P) {
    const { gen: x, data: T, it: S } = P;
    x.if(S.parentData, () => x.assign(T, (0, t._)`${S.parentData}[${S.parentDataProperty}]`));
  }
  function f(P, x) {
    const { gen: T } = P;
    T.if((0, t._)`Array.isArray(${x})`, () => {
      T.assign(e.default.vErrors, (0, t._)`${e.default.vErrors} === null ? ${x} : ${e.default.vErrors}.concat(${x})`).assign(e.default.errors, (0, t._)`${e.default.vErrors}.length`), (0, n.extendErrors)(P);
    }, () => P.error());
  }
  function d({ schemaEnv: P }, x) {
    if (x.async && !P.$async)
      throw new Error("async keyword in sync schema");
  }
  function p(P, x, T) {
    if (T === void 0)
      throw new Error(`keyword "${x}" failed to compile`);
    return P.scopeValue("keyword", typeof T == "function" ? { ref: T } : { ref: T, code: (0, t.stringify)(T) });
  }
  function g(P, x, T = !1) {
    return !x.length || x.some((S) => S === "array" ? Array.isArray(P) : S === "object" ? P && typeof P == "object" && !Array.isArray(P) : typeof P == S || T && typeof P > "u");
  }
  Gt.validSchemaType = g;
  function w({ schema: P, opts: x, self: T, errSchemaPath: S }, y, _) {
    if (Array.isArray(y.keyword) ? !y.keyword.includes(_) : y.keyword !== _)
      throw new Error("ajv implementation error");
    const m = y.dependencies;
    if (m != null && m.some((b) => !Object.prototype.hasOwnProperty.call(P, b)))
      throw new Error(`parent schema must have dependencies of ${_}: ${m.join(",")}`);
    if (y.validateSchema && !y.validateSchema(P[_])) {
      const $ = `keyword "${_}" value is invalid at path "${S}": ` + T.errorsText(y.validateSchema.errors);
      if (x.validateSchema === "log")
        T.logger.error($);
      else
        throw new Error($);
    }
  }
  return Gt.validateKeywordUsage = w, Gt;
}
var yr = {}, kc;
function gy() {
  if (kc) return yr;
  kc = 1, Object.defineProperty(yr, "__esModule", { value: !0 }), yr.extendSubschemaMode = yr.extendSubschemaData = yr.getSubschema = void 0;
  const t = Me(), e = Ue();
  function r(i, { keyword: l, schemaProp: f, schema: d, schemaPath: p, errSchemaPath: g, topSchemaRef: w }) {
    if (l !== void 0 && d !== void 0)
      throw new Error('both "keyword" and "schema" passed, only one allowed');
    if (l !== void 0) {
      const P = i.schema[l];
      return f === void 0 ? {
        schema: P,
        schemaPath: (0, t._)`${i.schemaPath}${(0, t.getProperty)(l)}`,
        errSchemaPath: `${i.errSchemaPath}/${l}`
      } : {
        schema: P[f],
        schemaPath: (0, t._)`${i.schemaPath}${(0, t.getProperty)(l)}${(0, t.getProperty)(f)}`,
        errSchemaPath: `${i.errSchemaPath}/${l}/${(0, e.escapeFragment)(f)}`
      };
    }
    if (d !== void 0) {
      if (p === void 0 || g === void 0 || w === void 0)
        throw new Error('"schemaPath", "errSchemaPath" and "topSchemaRef" are required with "schema"');
      return {
        schema: d,
        schemaPath: p,
        topSchemaRef: w,
        errSchemaPath: g
      };
    }
    throw new Error('either "keyword" or "schema" must be passed');
  }
  yr.getSubschema = r;
  function n(i, l, { dataProp: f, dataPropType: d, data: p, dataTypes: g, propertyName: w }) {
    if (p !== void 0 && f !== void 0)
      throw new Error('both "data" and "dataProp" passed, only one allowed');
    const { gen: P } = l;
    if (f !== void 0) {
      const { errorPath: T, dataPathArr: S, opts: y } = l, _ = P.let("data", (0, t._)`${l.data}${(0, t.getProperty)(f)}`, !0);
      x(_), i.errorPath = (0, t.str)`${T}${(0, e.getErrorPath)(f, d, y.jsPropertySyntax)}`, i.parentDataProperty = (0, t._)`${f}`, i.dataPathArr = [...S, i.parentDataProperty];
    }
    if (p !== void 0) {
      const T = p instanceof t.Name ? p : P.let("data", p, !0);
      x(T), w !== void 0 && (i.propertyName = w);
    }
    g && (i.dataTypes = g);
    function x(T) {
      i.data = T, i.dataLevel = l.dataLevel + 1, i.dataTypes = [], l.definedProperties = /* @__PURE__ */ new Set(), i.parentData = l.data, i.dataNames = [...l.dataNames, T];
    }
  }
  yr.extendSubschemaData = n;
  function s(i, { jtdDiscriminator: l, jtdMetadata: f, compositeRule: d, createErrors: p, allErrors: g }) {
    d !== void 0 && (i.compositeRule = d), p !== void 0 && (i.createErrors = p), g !== void 0 && (i.allErrors = g), i.jtdDiscriminator = l, i.jtdMetadata = f;
  }
  return yr.extendSubschemaMode = s, yr;
}
var Ct = {}, Aa, Ac;
function vh() {
  return Ac || (Ac = 1, Aa = function t(e, r) {
    if (e === r) return !0;
    if (e && r && typeof e == "object" && typeof r == "object") {
      if (e.constructor !== r.constructor) return !1;
      var n, s, i;
      if (Array.isArray(e)) {
        if (n = e.length, n != r.length) return !1;
        for (s = n; s-- !== 0; )
          if (!t(e[s], r[s])) return !1;
        return !0;
      }
      if (e.constructor === RegExp) return e.source === r.source && e.flags === r.flags;
      if (e.valueOf !== Object.prototype.valueOf) return e.valueOf() === r.valueOf();
      if (e.toString !== Object.prototype.toString) return e.toString() === r.toString();
      if (i = Object.keys(e), n = i.length, n !== Object.keys(r).length) return !1;
      for (s = n; s-- !== 0; )
        if (!Object.prototype.hasOwnProperty.call(r, i[s])) return !1;
      for (s = n; s-- !== 0; ) {
        var l = i[s];
        if (!t(e[l], r[l])) return !1;
      }
      return !0;
    }
    return e !== e && r !== r;
  }), Aa;
}
var Pa = { exports: {} }, Pc;
function yy() {
  if (Pc) return Pa.exports;
  Pc = 1;
  var t = Pa.exports = function(n, s, i) {
    typeof s == "function" && (i = s, s = {}), i = s.cb || i;
    var l = typeof i == "function" ? i : i.pre || function() {
    }, f = i.post || function() {
    };
    e(s, l, f, n, "", n);
  };
  t.keywords = {
    additionalItems: !0,
    items: !0,
    contains: !0,
    additionalProperties: !0,
    propertyNames: !0,
    not: !0,
    if: !0,
    then: !0,
    else: !0
  }, t.arrayKeywords = {
    items: !0,
    allOf: !0,
    anyOf: !0,
    oneOf: !0
  }, t.propsKeywords = {
    $defs: !0,
    definitions: !0,
    properties: !0,
    patternProperties: !0,
    dependencies: !0
  }, t.skipKeywords = {
    default: !0,
    enum: !0,
    const: !0,
    required: !0,
    maximum: !0,
    minimum: !0,
    exclusiveMaximum: !0,
    exclusiveMinimum: !0,
    multipleOf: !0,
    maxLength: !0,
    minLength: !0,
    pattern: !0,
    format: !0,
    maxItems: !0,
    minItems: !0,
    uniqueItems: !0,
    maxProperties: !0,
    minProperties: !0
  };
  function e(n, s, i, l, f, d, p, g, w, P) {
    if (l && typeof l == "object" && !Array.isArray(l)) {
      s(l, f, d, p, g, w, P);
      for (var x in l) {
        var T = l[x];
        if (Array.isArray(T)) {
          if (x in t.arrayKeywords)
            for (var S = 0; S < T.length; S++)
              e(n, s, i, T[S], f + "/" + x + "/" + S, d, f, x, l, S);
        } else if (x in t.propsKeywords) {
          if (T && typeof T == "object")
            for (var y in T)
              e(n, s, i, T[y], f + "/" + x + "/" + r(y), d, f, x, l, y);
        } else (x in t.keywords || n.allKeys && !(x in t.skipKeywords)) && e(n, s, i, T, f + "/" + x, d, f, x, l);
      }
      i(l, f, d, p, g, w, P);
    }
  }
  function r(n) {
    return n.replace(/~/g, "~0").replace(/\//g, "~1");
  }
  return Pa.exports;
}
var Cc;
function Zi() {
  if (Cc) return Ct;
  Cc = 1, Object.defineProperty(Ct, "__esModule", { value: !0 }), Ct.getSchemaRefs = Ct.resolveUrl = Ct.normalizeId = Ct._getFullPath = Ct.getFullPath = Ct.inlineRef = void 0;
  const t = Ue(), e = vh(), r = yy(), n = /* @__PURE__ */ new Set([
    "type",
    "format",
    "pattern",
    "maxLength",
    "minLength",
    "maxProperties",
    "minProperties",
    "maxItems",
    "minItems",
    "maximum",
    "minimum",
    "uniqueItems",
    "multipleOf",
    "required",
    "enum",
    "const"
  ]);
  function s(S, y = !0) {
    return typeof S == "boolean" ? !0 : y === !0 ? !l(S) : y ? f(S) <= y : !1;
  }
  Ct.inlineRef = s;
  const i = /* @__PURE__ */ new Set([
    "$ref",
    "$recursiveRef",
    "$recursiveAnchor",
    "$dynamicRef",
    "$dynamicAnchor"
  ]);
  function l(S) {
    for (const y in S) {
      if (i.has(y))
        return !0;
      const _ = S[y];
      if (Array.isArray(_) && _.some(l) || typeof _ == "object" && l(_))
        return !0;
    }
    return !1;
  }
  function f(S) {
    let y = 0;
    for (const _ in S) {
      if (_ === "$ref")
        return 1 / 0;
      if (y++, !n.has(_) && (typeof S[_] == "object" && (0, t.eachItem)(S[_], (m) => y += f(m)), y === 1 / 0))
        return 1 / 0;
    }
    return y;
  }
  function d(S, y = "", _) {
    _ !== !1 && (y = w(y));
    const m = S.parse(y);
    return p(S, m);
  }
  Ct.getFullPath = d;
  function p(S, y) {
    return S.serialize(y).split("#")[0] + "#";
  }
  Ct._getFullPath = p;
  const g = /#\/?$/;
  function w(S) {
    return S ? S.replace(g, "") : "";
  }
  Ct.normalizeId = w;
  function P(S, y, _) {
    return _ = w(_), S.resolve(y, _);
  }
  Ct.resolveUrl = P;
  const x = /^[a-z_][-a-z0-9._]*$/i;
  function T(S, y) {
    if (typeof S == "boolean")
      return {};
    const { schemaId: _, uriResolver: m } = this.opts, b = w(S[_] || y), $ = { "": b }, O = d(m, b, !1), A = {}, j = /* @__PURE__ */ new Set();
    return r(S, { allKeys: !0 }, (H, ee, ye, ge) => {
      if (ge === void 0)
        return;
      const ke = O + ee;
      let ze = $[ge];
      typeof H[_] == "string" && (ze = st.call(this, H[_])), ct.call(this, H.$anchor), ct.call(this, H.$dynamicAnchor), $[ee] = ze;
      function st(qe) {
        const xt = this.opts.uriResolver.resolve;
        if (qe = w(ze ? xt(ze, qe) : qe), j.has(qe))
          throw G(qe);
        j.add(qe);
        let re = this.refs[qe];
        return typeof re == "string" && (re = this.refs[re]), typeof re == "object" ? V(H, re.schema, qe) : qe !== w(ke) && (qe[0] === "#" ? (V(H, A[qe], qe), A[qe] = H) : this.refs[qe] = ke), qe;
      }
      function ct(qe) {
        if (typeof qe == "string") {
          if (!x.test(qe))
            throw new Error(`invalid anchor "${qe}"`);
          st.call(this, `#${qe}`);
        }
      }
    }), A;
    function V(H, ee, ye) {
      if (ee !== void 0 && !e(H, ee))
        throw G(ye);
    }
    function G(H) {
      return new Error(`reference "${H}" resolves to more than one schema`);
    }
  }
  return Ct.getSchemaRefs = T, Ct;
}
var Rc;
function Ji() {
  if (Rc) return pr;
  Rc = 1, Object.defineProperty(pr, "__esModule", { value: !0 }), pr.getData = pr.KeywordCxt = pr.validateFunctionCode = void 0;
  const t = dy(), e = ki(), r = _h(), n = ki(), s = my(), i = py(), l = gy(), f = Me(), d = Dr(), p = Zi(), g = Ue(), w = Bi();
  function P(q) {
    if (O(q) && (j(q), $(q))) {
      y(q);
      return;
    }
    x(q, () => (0, t.topBoolOrEmptySchema)(q));
  }
  pr.validateFunctionCode = P;
  function x({ gen: q, validateName: z, schema: X, schemaEnv: ae, opts: me }, Ce) {
    me.code.es5 ? q.func(z, (0, f._)`${d.default.data}, ${d.default.valCxt}`, ae.$async, () => {
      q.code((0, f._)`"use strict"; ${m(X, me)}`), S(q, me), q.code(Ce);
    }) : q.func(z, (0, f._)`${d.default.data}, ${T(me)}`, ae.$async, () => q.code(m(X, me)).code(Ce));
  }
  function T(q) {
    return (0, f._)`{${d.default.instancePath}="", ${d.default.parentData}, ${d.default.parentDataProperty}, ${d.default.rootData}=${d.default.data}${q.dynamicRef ? (0, f._)`, ${d.default.dynamicAnchors}={}` : f.nil}}={}`;
  }
  function S(q, z) {
    q.if(d.default.valCxt, () => {
      q.var(d.default.instancePath, (0, f._)`${d.default.valCxt}.${d.default.instancePath}`), q.var(d.default.parentData, (0, f._)`${d.default.valCxt}.${d.default.parentData}`), q.var(d.default.parentDataProperty, (0, f._)`${d.default.valCxt}.${d.default.parentDataProperty}`), q.var(d.default.rootData, (0, f._)`${d.default.valCxt}.${d.default.rootData}`), z.dynamicRef && q.var(d.default.dynamicAnchors, (0, f._)`${d.default.valCxt}.${d.default.dynamicAnchors}`);
    }, () => {
      q.var(d.default.instancePath, (0, f._)`""`), q.var(d.default.parentData, (0, f._)`undefined`), q.var(d.default.parentDataProperty, (0, f._)`undefined`), q.var(d.default.rootData, d.default.data), z.dynamicRef && q.var(d.default.dynamicAnchors, (0, f._)`{}`);
    });
  }
  function y(q) {
    const { schema: z, opts: X, gen: ae } = q;
    x(q, () => {
      X.$comment && z.$comment && ge(q), H(q), ae.let(d.default.vErrors, null), ae.let(d.default.errors, 0), X.unevaluated && _(q), V(q), ke(q);
    });
  }
  function _(q) {
    const { gen: z, validateName: X } = q;
    q.evaluated = z.const("evaluated", (0, f._)`${X}.evaluated`), z.if((0, f._)`${q.evaluated}.dynamicProps`, () => z.assign((0, f._)`${q.evaluated}.props`, (0, f._)`undefined`)), z.if((0, f._)`${q.evaluated}.dynamicItems`, () => z.assign((0, f._)`${q.evaluated}.items`, (0, f._)`undefined`));
  }
  function m(q, z) {
    const X = typeof q == "object" && q[z.schemaId];
    return X && (z.code.source || z.code.process) ? (0, f._)`/*# sourceURL=${X} */` : f.nil;
  }
  function b(q, z) {
    if (O(q) && (j(q), $(q))) {
      A(q, z);
      return;
    }
    (0, t.boolOrEmptySchema)(q, z);
  }
  function $({ schema: q, self: z }) {
    if (typeof q == "boolean")
      return !q;
    for (const X in q)
      if (z.RULES.all[X])
        return !0;
    return !1;
  }
  function O(q) {
    return typeof q.schema != "boolean";
  }
  function A(q, z) {
    const { schema: X, gen: ae, opts: me } = q;
    me.$comment && X.$comment && ge(q), ee(q), ye(q);
    const Ce = ae.const("_errs", d.default.errors);
    V(q, Ce), ae.var(z, (0, f._)`${Ce} === ${d.default.errors}`);
  }
  function j(q) {
    (0, g.checkUnknownRules)(q), G(q);
  }
  function V(q, z) {
    if (q.opts.jtd)
      return st(q, [], !1, z);
    const X = (0, e.getSchemaTypes)(q.schema), ae = (0, e.coerceAndCheckDataType)(q, X);
    st(q, X, !ae, z);
  }
  function G(q) {
    const { schema: z, errSchemaPath: X, opts: ae, self: me } = q;
    z.$ref && ae.ignoreKeywordsWithRef && (0, g.schemaHasRulesButRef)(z, me.RULES) && me.logger.warn(`$ref: keywords ignored in schema at path "${X}"`);
  }
  function H(q) {
    const { schema: z, opts: X } = q;
    z.default !== void 0 && X.useDefaults && X.strictSchema && (0, g.checkStrictMode)(q, "default is ignored in the schema root");
  }
  function ee(q) {
    const z = q.schema[q.opts.schemaId];
    z && (q.baseId = (0, p.resolveUrl)(q.opts.uriResolver, q.baseId, z));
  }
  function ye(q) {
    if (q.schema.$async && !q.schemaEnv.$async)
      throw new Error("async schema in sync schema");
  }
  function ge({ gen: q, schemaEnv: z, schema: X, errSchemaPath: ae, opts: me }) {
    const Ce = X.$comment;
    if (me.$comment === !0)
      q.code((0, f._)`${d.default.self}.logger.log(${Ce})`);
    else if (typeof me.$comment == "function") {
      const rt = (0, f.str)`${ae}/$comment`, pt = q.scopeValue("root", { ref: z.root });
      q.code((0, f._)`${d.default.self}.opts.$comment(${Ce}, ${rt}, ${pt}.schema)`);
    }
  }
  function ke(q) {
    const { gen: z, schemaEnv: X, validateName: ae, ValidationError: me, opts: Ce } = q;
    X.$async ? z.if((0, f._)`${d.default.errors} === 0`, () => z.return(d.default.data), () => z.throw((0, f._)`new ${me}(${d.default.vErrors})`)) : (z.assign((0, f._)`${ae}.errors`, d.default.vErrors), Ce.unevaluated && ze(q), z.return((0, f._)`${d.default.errors} === 0`));
  }
  function ze({ gen: q, evaluated: z, props: X, items: ae }) {
    X instanceof f.Name && q.assign((0, f._)`${z}.props`, X), ae instanceof f.Name && q.assign((0, f._)`${z}.items`, ae);
  }
  function st(q, z, X, ae) {
    const { gen: me, schema: Ce, data: rt, allErrors: pt, opts: Le, self: it } = q, { RULES: Ye } = it;
    if (Ce.$ref && (Le.ignoreKeywordsWithRef || !(0, g.schemaHasRulesButRef)(Ce, Ye))) {
      me.block(() => fe(q, "$ref", Ye.all.$ref.definition));
      return;
    }
    Le.jtd || qe(q, z), me.block(() => {
      for (const yt of Ye.rules)
        gt(yt);
      gt(Ye.post);
    });
    function gt(yt) {
      (0, r.shouldUseGroup)(Ce, yt) && (yt.type ? (me.if((0, n.checkDataType)(yt.type, rt, Le.strictNumbers)), ct(q, yt), z.length === 1 && z[0] === yt.type && X && (me.else(), (0, n.reportTypeError)(q)), me.endIf()) : ct(q, yt), pt || me.if((0, f._)`${d.default.errors} === ${ae || 0}`));
    }
  }
  function ct(q, z) {
    const { gen: X, schema: ae, opts: { useDefaults: me } } = q;
    me && (0, s.assignDefaults)(q, z.type), X.block(() => {
      for (const Ce of z.rules)
        (0, r.shouldUseRule)(ae, Ce) && fe(q, Ce.keyword, Ce.definition, z.type);
    });
  }
  function qe(q, z) {
    q.schemaEnv.meta || !q.opts.strictTypes || (xt(q, z), q.opts.allowUnionTypes || re(q, z), U(q, q.dataTypes));
  }
  function xt(q, z) {
    if (z.length) {
      if (!q.dataTypes.length) {
        q.dataTypes = z;
        return;
      }
      z.forEach((X) => {
        B(q.dataTypes, X) || I(q, `type "${X}" not allowed by context "${q.dataTypes.join(",")}"`);
      }), N(q, z);
    }
  }
  function re(q, z) {
    z.length > 1 && !(z.length === 2 && z.includes("null")) && I(q, "use allowUnionTypes to allow union type keyword");
  }
  function U(q, z) {
    const X = q.self.RULES.all;
    for (const ae in X) {
      const me = X[ae];
      if (typeof me == "object" && (0, r.shouldUseRule)(q.schema, me)) {
        const { type: Ce } = me.definition;
        Ce.length && !Ce.some((rt) => Z(z, rt)) && I(q, `missing type "${Ce.join(",")}" for keyword "${ae}"`);
      }
    }
  }
  function Z(q, z) {
    return q.includes(z) || z === "number" && q.includes("integer");
  }
  function B(q, z) {
    return q.includes(z) || z === "integer" && q.includes("number");
  }
  function N(q, z) {
    const X = [];
    for (const ae of q.dataTypes)
      B(z, ae) ? X.push(ae) : z.includes("integer") && ae === "number" && X.push("integer");
    q.dataTypes = X;
  }
  function I(q, z) {
    const X = q.schemaEnv.baseId + q.errSchemaPath;
    z += ` at "${X}" (strictTypes)`, (0, g.checkStrictMode)(q, z, q.opts.strictTypes);
  }
  class W {
    constructor(z, X, ae) {
      if ((0, i.validateKeywordUsage)(z, X, ae), this.gen = z.gen, this.allErrors = z.allErrors, this.keyword = ae, this.data = z.data, this.schema = z.schema[ae], this.$data = X.$data && z.opts.$data && this.schema && this.schema.$data, this.schemaValue = (0, g.schemaRefOrVal)(z, this.schema, ae, this.$data), this.schemaType = X.schemaType, this.parentSchema = z.schema, this.params = {}, this.it = z, this.def = X, this.$data)
        this.schemaCode = z.gen.const("vSchema", Te(this.$data, z));
      else if (this.schemaCode = this.schemaValue, !(0, i.validSchemaType)(this.schema, X.schemaType, X.allowUndefined))
        throw new Error(`${ae} value must be ${JSON.stringify(X.schemaType)}`);
      ("code" in X ? X.trackErrors : X.errors !== !1) && (this.errsCount = z.gen.const("_errs", d.default.errors));
    }
    result(z, X, ae) {
      this.failResult((0, f.not)(z), X, ae);
    }
    failResult(z, X, ae) {
      this.gen.if(z), ae ? ae() : this.error(), X ? (this.gen.else(), X(), this.allErrors && this.gen.endIf()) : this.allErrors ? this.gen.endIf() : this.gen.else();
    }
    pass(z, X) {
      this.failResult((0, f.not)(z), void 0, X);
    }
    fail(z) {
      if (z === void 0) {
        this.error(), this.allErrors || this.gen.if(!1);
        return;
      }
      this.gen.if(z), this.error(), this.allErrors ? this.gen.endIf() : this.gen.else();
    }
    fail$data(z) {
      if (!this.$data)
        return this.fail(z);
      const { schemaCode: X } = this;
      this.fail((0, f._)`${X} !== undefined && (${(0, f.or)(this.invalid$data(), z)})`);
    }
    error(z, X, ae) {
      if (X) {
        this.setParams(X), this._error(z, ae), this.setParams({});
        return;
      }
      this._error(z, ae);
    }
    _error(z, X) {
      (z ? w.reportExtraError : w.reportError)(this, this.def.error, X);
    }
    $dataError() {
      (0, w.reportError)(this, this.def.$dataError || w.keyword$DataError);
    }
    reset() {
      if (this.errsCount === void 0)
        throw new Error('add "trackErrors" to keyword definition');
      (0, w.resetErrorsCount)(this.gen, this.errsCount);
    }
    ok(z) {
      this.allErrors || this.gen.if(z);
    }
    setParams(z, X) {
      X ? Object.assign(this.params, z) : this.params = z;
    }
    block$data(z, X, ae = f.nil) {
      this.gen.block(() => {
        this.check$data(z, ae), X();
      });
    }
    check$data(z = f.nil, X = f.nil) {
      if (!this.$data)
        return;
      const { gen: ae, schemaCode: me, schemaType: Ce, def: rt } = this;
      ae.if((0, f.or)((0, f._)`${me} === undefined`, X)), z !== f.nil && ae.assign(z, !0), (Ce.length || rt.validateSchema) && (ae.elseIf(this.invalid$data()), this.$dataError(), z !== f.nil && ae.assign(z, !1)), ae.else();
    }
    invalid$data() {
      const { gen: z, schemaCode: X, schemaType: ae, def: me, it: Ce } = this;
      return (0, f.or)(rt(), pt());
      function rt() {
        if (ae.length) {
          if (!(X instanceof f.Name))
            throw new Error("ajv implementation error");
          const Le = Array.isArray(ae) ? ae : [ae];
          return (0, f._)`${(0, n.checkDataTypes)(Le, X, Ce.opts.strictNumbers, n.DataType.Wrong)}`;
        }
        return f.nil;
      }
      function pt() {
        if (me.validateSchema) {
          const Le = z.scopeValue("validate$data", { ref: me.validateSchema });
          return (0, f._)`!${Le}(${X})`;
        }
        return f.nil;
      }
    }
    subschema(z, X) {
      const ae = (0, l.getSubschema)(this.it, z);
      (0, l.extendSubschemaData)(ae, this.it, z), (0, l.extendSubschemaMode)(ae, z);
      const me = { ...this.it, ...ae, items: void 0, props: void 0 };
      return b(me, X), me;
    }
    mergeEvaluated(z, X) {
      const { it: ae, gen: me } = this;
      ae.opts.unevaluated && (ae.props !== !0 && z.props !== void 0 && (ae.props = g.mergeEvaluated.props(me, z.props, ae.props, X)), ae.items !== !0 && z.items !== void 0 && (ae.items = g.mergeEvaluated.items(me, z.items, ae.items, X)));
    }
    mergeValidEvaluated(z, X) {
      const { it: ae, gen: me } = this;
      if (ae.opts.unevaluated && (ae.props !== !0 || ae.items !== !0))
        return me.if(X, () => this.mergeEvaluated(z, f.Name)), !0;
    }
  }
  pr.KeywordCxt = W;
  function fe(q, z, X, ae) {
    const me = new W(q, X, z);
    "code" in X ? X.code(me, ae) : me.$data && X.validate ? (0, i.funcKeywordCode)(me, X) : "macro" in X ? (0, i.macroKeywordCode)(me, X) : (X.compile || X.validate) && (0, i.funcKeywordCode)(me, X);
  }
  const le = /^\/(?:[^~]|~0|~1)*$/, Ne = /^([0-9]+)(#|\/(?:[^~]|~0|~1)*)?$/;
  function Te(q, { dataLevel: z, dataNames: X, dataPathArr: ae }) {
    let me, Ce;
    if (q === "")
      return d.default.rootData;
    if (q[0] === "/") {
      if (!le.test(q))
        throw new Error(`Invalid JSON-pointer: ${q}`);
      me = q, Ce = d.default.rootData;
    } else {
      const it = Ne.exec(q);
      if (!it)
        throw new Error(`Invalid JSON-pointer: ${q}`);
      const Ye = +it[1];
      if (me = it[2], me === "#") {
        if (Ye >= z)
          throw new Error(Le("property/index", Ye));
        return ae[z - Ye];
      }
      if (Ye > z)
        throw new Error(Le("data", Ye));
      if (Ce = X[z - Ye], !me)
        return Ce;
    }
    let rt = Ce;
    const pt = me.split("/");
    for (const it of pt)
      it && (Ce = (0, f._)`${Ce}${(0, f.getProperty)((0, g.unescapeJsonPointer)(it))}`, rt = (0, f._)`${rt} && ${Ce}`);
    return rt;
    function Le(it, Ye) {
      return `Cannot access ${it} ${Ye} levels up, current level is ${z}`;
    }
  }
  return pr.getData = Te, pr;
}
var Ss = {}, Tc;
function el() {
  if (Tc) return Ss;
  Tc = 1, Object.defineProperty(Ss, "__esModule", { value: !0 });
  class t extends Error {
    constructor(r) {
      super("validation failed"), this.errors = r, this.ajv = this.validation = !0;
    }
  }
  return Ss.default = t, Ss;
}
var Es = {}, Oc;
function Wi() {
  if (Oc) return Es;
  Oc = 1, Object.defineProperty(Es, "__esModule", { value: !0 });
  const t = Zi();
  class e extends Error {
    constructor(n, s, i, l) {
      super(l || `can't resolve reference ${i} from id ${s}`), this.missingRef = (0, t.resolveUrl)(n, s, i), this.missingSchema = (0, t.normalizeId)((0, t.getFullPath)(n, this.missingRef));
    }
  }
  return Es.default = e, Es;
}
var Lt = {}, Nc;
function tl() {
  if (Nc) return Lt;
  Nc = 1, Object.defineProperty(Lt, "__esModule", { value: !0 }), Lt.resolveSchema = Lt.getCompilingSchema = Lt.resolveRef = Lt.compileSchema = Lt.SchemaEnv = void 0;
  const t = Me(), e = el(), r = Dr(), n = Zi(), s = Ue(), i = Ji();
  class l {
    constructor(_) {
      var m;
      this.refs = {}, this.dynamicAnchors = {};
      let b;
      typeof _.schema == "object" && (b = _.schema), this.schema = _.schema, this.schemaId = _.schemaId, this.root = _.root || this, this.baseId = (m = _.baseId) !== null && m !== void 0 ? m : (0, n.normalizeId)(b == null ? void 0 : b[_.schemaId || "$id"]), this.schemaPath = _.schemaPath, this.localRefs = _.localRefs, this.meta = _.meta, this.$async = b == null ? void 0 : b.$async, this.refs = {};
    }
  }
  Lt.SchemaEnv = l;
  function f(y) {
    const _ = g.call(this, y);
    if (_)
      return _;
    const m = (0, n.getFullPath)(this.opts.uriResolver, y.root.baseId), { es5: b, lines: $ } = this.opts.code, { ownProperties: O } = this.opts, A = new t.CodeGen(this.scope, { es5: b, lines: $, ownProperties: O });
    let j;
    y.$async && (j = A.scopeValue("Error", {
      ref: e.default,
      code: (0, t._)`require("ajv/dist/runtime/validation_error").default`
    }));
    const V = A.scopeName("validate");
    y.validateName = V;
    const G = {
      gen: A,
      allErrors: this.opts.allErrors,
      data: r.default.data,
      parentData: r.default.parentData,
      parentDataProperty: r.default.parentDataProperty,
      dataNames: [r.default.data],
      dataPathArr: [t.nil],
      // TODO can its length be used as dataLevel if nil is removed?
      dataLevel: 0,
      dataTypes: [],
      definedProperties: /* @__PURE__ */ new Set(),
      topSchemaRef: A.scopeValue("schema", this.opts.code.source === !0 ? { ref: y.schema, code: (0, t.stringify)(y.schema) } : { ref: y.schema }),
      validateName: V,
      ValidationError: j,
      schema: y.schema,
      schemaEnv: y,
      rootId: m,
      baseId: y.baseId || m,
      schemaPath: t.nil,
      errSchemaPath: y.schemaPath || (this.opts.jtd ? "" : "#"),
      errorPath: (0, t._)`""`,
      opts: this.opts,
      self: this
    };
    let H;
    try {
      this._compilations.add(y), (0, i.validateFunctionCode)(G), A.optimize(this.opts.code.optimize);
      const ee = A.toString();
      H = `${A.scopeRefs(r.default.scope)}return ${ee}`, this.opts.code.process && (H = this.opts.code.process(H, y));
      const ge = new Function(`${r.default.self}`, `${r.default.scope}`, H)(this, this.scope.get());
      if (this.scope.value(V, { ref: ge }), ge.errors = null, ge.schema = y.schema, ge.schemaEnv = y, y.$async && (ge.$async = !0), this.opts.code.source === !0 && (ge.source = { validateName: V, validateCode: ee, scopeValues: A._values }), this.opts.unevaluated) {
        const { props: ke, items: ze } = G;
        ge.evaluated = {
          props: ke instanceof t.Name ? void 0 : ke,
          items: ze instanceof t.Name ? void 0 : ze,
          dynamicProps: ke instanceof t.Name,
          dynamicItems: ze instanceof t.Name
        }, ge.source && (ge.source.evaluated = (0, t.stringify)(ge.evaluated));
      }
      return y.validate = ge, y;
    } catch (ee) {
      throw delete y.validate, delete y.validateName, H && this.logger.error("Error compiling schema, function code:", H), ee;
    } finally {
      this._compilations.delete(y);
    }
  }
  Lt.compileSchema = f;
  function d(y, _, m) {
    var b;
    m = (0, n.resolveUrl)(this.opts.uriResolver, _, m);
    const $ = y.refs[m];
    if ($)
      return $;
    let O = P.call(this, y, m);
    if (O === void 0) {
      const A = (b = y.localRefs) === null || b === void 0 ? void 0 : b[m], { schemaId: j } = this.opts;
      A && (O = new l({ schema: A, schemaId: j, root: y, baseId: _ }));
    }
    if (O !== void 0)
      return y.refs[m] = p.call(this, O);
  }
  Lt.resolveRef = d;
  function p(y) {
    return (0, n.inlineRef)(y.schema, this.opts.inlineRefs) ? y.schema : y.validate ? y : f.call(this, y);
  }
  function g(y) {
    for (const _ of this._compilations)
      if (w(_, y))
        return _;
  }
  Lt.getCompilingSchema = g;
  function w(y, _) {
    return y.schema === _.schema && y.root === _.root && y.baseId === _.baseId;
  }
  function P(y, _) {
    let m;
    for (; typeof (m = this.refs[_]) == "string"; )
      _ = m;
    return m || this.schemas[_] || x.call(this, y, _);
  }
  function x(y, _) {
    const m = this.opts.uriResolver.parse(_), b = (0, n._getFullPath)(this.opts.uriResolver, m);
    let $ = (0, n.getFullPath)(this.opts.uriResolver, y.baseId, void 0);
    if (Object.keys(y.schema).length > 0 && b === $)
      return S.call(this, m, y);
    const O = (0, n.normalizeId)(b), A = this.refs[O] || this.schemas[O];
    if (typeof A == "string") {
      const j = x.call(this, y, A);
      return typeof (j == null ? void 0 : j.schema) != "object" ? void 0 : S.call(this, m, j);
    }
    if (typeof (A == null ? void 0 : A.schema) == "object") {
      if (A.validate || f.call(this, A), O === (0, n.normalizeId)(_)) {
        const { schema: j } = A, { schemaId: V } = this.opts, G = j[V];
        return G && ($ = (0, n.resolveUrl)(this.opts.uriResolver, $, G)), new l({ schema: j, schemaId: V, root: y, baseId: $ });
      }
      return S.call(this, m, A);
    }
  }
  Lt.resolveSchema = x;
  const T = /* @__PURE__ */ new Set([
    "properties",
    "patternProperties",
    "enum",
    "dependencies",
    "definitions"
  ]);
  function S(y, { baseId: _, schema: m, root: b }) {
    var $;
    if ((($ = y.fragment) === null || $ === void 0 ? void 0 : $[0]) !== "/")
      return;
    for (const j of y.fragment.slice(1).split("/")) {
      if (typeof m == "boolean")
        return;
      const V = m[(0, s.unescapeFragment)(j)];
      if (V === void 0)
        return;
      m = V;
      const G = typeof m == "object" && m[this.opts.schemaId];
      !T.has(j) && G && (_ = (0, n.resolveUrl)(this.opts.uriResolver, _, G));
    }
    let O;
    if (typeof m != "boolean" && m.$ref && !(0, s.schemaHasRulesButRef)(m, this.RULES)) {
      const j = (0, n.resolveUrl)(this.opts.uriResolver, _, m.$ref);
      O = x.call(this, b, j);
    }
    const { schemaId: A } = this.opts;
    if (O = O || new l({ schema: m, schemaId: A, root: b, baseId: _ }), O.schema !== O.root.schema)
      return O;
  }
  return Lt;
}
const wy = "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#", _y = "Meta-schema for $data reference (JSON AnySchema extension proposal)", vy = "object", by = ["$data"], Sy = { $data: { type: "string", anyOf: [{ format: "relative-json-pointer" }, { format: "json-pointer" }] } }, Ey = !1, $y = {
  $id: wy,
  description: _y,
  type: vy,
  required: by,
  properties: Sy,
  additionalProperties: Ey
};
var $s = {}, Nn = { exports: {} }, Ca, Ic;
function xy() {
  return Ic || (Ic = 1, Ca = {
    HEX: {
      0: 0,
      1: 1,
      2: 2,
      3: 3,
      4: 4,
      5: 5,
      6: 6,
      7: 7,
      8: 8,
      9: 9,
      a: 10,
      A: 10,
      b: 11,
      B: 11,
      c: 12,
      C: 12,
      d: 13,
      D: 13,
      e: 14,
      E: 14,
      f: 15,
      F: 15
    }
  }), Ca;
}
var Ra, jc;
function ky() {
  if (jc) return Ra;
  jc = 1;
  const { HEX: t } = xy(), e = /^(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)$/u;
  function r(S) {
    if (f(S, ".") < 3)
      return { host: S, isIPV4: !1 };
    const y = S.match(e) || [], [_] = y;
    return _ ? { host: l(_, "."), isIPV4: !0 } : { host: S, isIPV4: !1 };
  }
  function n(S, y = !1) {
    let _ = "", m = !0;
    for (const b of S) {
      if (t[b] === void 0) return;
      b !== "0" && m === !0 && (m = !1), m || (_ += b);
    }
    return y && _.length === 0 && (_ = "0"), _;
  }
  function s(S) {
    let y = 0;
    const _ = { error: !1, address: "", zone: "" }, m = [], b = [];
    let $ = !1, O = !1, A = !1;
    function j() {
      if (b.length) {
        if ($ === !1) {
          const V = n(b);
          if (V !== void 0)
            m.push(V);
          else
            return _.error = !0, !1;
        }
        b.length = 0;
      }
      return !0;
    }
    for (let V = 0; V < S.length; V++) {
      const G = S[V];
      if (!(G === "[" || G === "]"))
        if (G === ":") {
          if (O === !0 && (A = !0), !j())
            break;
          if (y++, m.push(":"), y > 7) {
            _.error = !0;
            break;
          }
          V - 1 >= 0 && S[V - 1] === ":" && (O = !0);
          continue;
        } else if (G === "%") {
          if (!j())
            break;
          $ = !0;
        } else {
          b.push(G);
          continue;
        }
    }
    return b.length && ($ ? _.zone = b.join("") : A ? m.push(b.join("")) : m.push(n(b))), _.address = m.join(""), _;
  }
  function i(S) {
    if (f(S, ":") < 2)
      return { host: S, isIPV6: !1 };
    const y = s(S);
    if (y.error)
      return { host: S, isIPV6: !1 };
    {
      let _ = y.address, m = y.address;
      return y.zone && (_ += "%" + y.zone, m += "%25" + y.zone), { host: _, escapedHost: m, isIPV6: !0 };
    }
  }
  function l(S, y) {
    let _ = "", m = !0;
    const b = S.length;
    for (let $ = 0; $ < b; $++) {
      const O = S[$];
      O === "0" && m ? ($ + 1 <= b && S[$ + 1] === y || $ + 1 === b) && (_ += O, m = !1) : (O === y ? m = !0 : m = !1, _ += O);
    }
    return _;
  }
  function f(S, y) {
    let _ = 0;
    for (let m = 0; m < S.length; m++)
      S[m] === y && _++;
    return _;
  }
  const d = /^\.\.?\//u, p = /^\/\.(?:\/|$)/u, g = /^\/\.\.(?:\/|$)/u, w = /^\/?(?:.|\n)*?(?=\/|$)/u;
  function P(S) {
    const y = [];
    for (; S.length; )
      if (S.match(d))
        S = S.replace(d, "");
      else if (S.match(p))
        S = S.replace(p, "/");
      else if (S.match(g))
        S = S.replace(g, "/"), y.pop();
      else if (S === "." || S === "..")
        S = "";
      else {
        const _ = S.match(w);
        if (_) {
          const m = _[0];
          S = S.slice(m.length), y.push(m);
        } else
          throw new Error("Unexpected dot segment condition");
      }
    return y.join("");
  }
  function x(S, y) {
    const _ = y !== !0 ? escape : unescape;
    return S.scheme !== void 0 && (S.scheme = _(S.scheme)), S.userinfo !== void 0 && (S.userinfo = _(S.userinfo)), S.host !== void 0 && (S.host = _(S.host)), S.path !== void 0 && (S.path = _(S.path)), S.query !== void 0 && (S.query = _(S.query)), S.fragment !== void 0 && (S.fragment = _(S.fragment)), S;
  }
  function T(S) {
    const y = [];
    if (S.userinfo !== void 0 && (y.push(S.userinfo), y.push("@")), S.host !== void 0) {
      let _ = unescape(S.host);
      const m = r(_);
      if (m.isIPV4)
        _ = m.host;
      else {
        const b = i(m.host);
        b.isIPV6 === !0 ? _ = `[${b.escapedHost}]` : _ = S.host;
      }
      y.push(_);
    }
    return (typeof S.port == "number" || typeof S.port == "string") && (y.push(":"), y.push(String(S.port))), y.length ? y.join("") : void 0;
  }
  return Ra = {
    recomposeAuthority: T,
    normalizeComponentEncoding: x,
    removeDotSegments: P,
    normalizeIPv4: r,
    normalizeIPv6: i,
    stringArrayToHexStripped: n
  }, Ra;
}
var Ta, Mc;
function Ay() {
  if (Mc) return Ta;
  Mc = 1;
  const t = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/iu, e = /([\da-z][\d\-a-z]{0,31}):((?:[\w!$'()*+,\-.:;=@]|%[\da-f]{2})+)/iu;
  function r(m) {
    return typeof m.secure == "boolean" ? m.secure : String(m.scheme).toLowerCase() === "wss";
  }
  function n(m) {
    return m.host || (m.error = m.error || "HTTP URIs must have a host."), m;
  }
  function s(m) {
    const b = String(m.scheme).toLowerCase() === "https";
    return (m.port === (b ? 443 : 80) || m.port === "") && (m.port = void 0), m.path || (m.path = "/"), m;
  }
  function i(m) {
    return m.secure = r(m), m.resourceName = (m.path || "/") + (m.query ? "?" + m.query : ""), m.path = void 0, m.query = void 0, m;
  }
  function l(m) {
    if ((m.port === (r(m) ? 443 : 80) || m.port === "") && (m.port = void 0), typeof m.secure == "boolean" && (m.scheme = m.secure ? "wss" : "ws", m.secure = void 0), m.resourceName) {
      const [b, $] = m.resourceName.split("?");
      m.path = b && b !== "/" ? b : void 0, m.query = $, m.resourceName = void 0;
    }
    return m.fragment = void 0, m;
  }
  function f(m, b) {
    if (!m.path)
      return m.error = "URN can not be parsed", m;
    const $ = m.path.match(e);
    if ($) {
      const O = b.scheme || m.scheme || "urn";
      m.nid = $[1].toLowerCase(), m.nss = $[2];
      const A = `${O}:${b.nid || m.nid}`, j = _[A];
      m.path = void 0, j && (m = j.parse(m, b));
    } else
      m.error = m.error || "URN can not be parsed.";
    return m;
  }
  function d(m, b) {
    const $ = b.scheme || m.scheme || "urn", O = m.nid.toLowerCase(), A = `${$}:${b.nid || O}`, j = _[A];
    j && (m = j.serialize(m, b));
    const V = m, G = m.nss;
    return V.path = `${O || b.nid}:${G}`, b.skipEscape = !0, V;
  }
  function p(m, b) {
    const $ = m;
    return $.uuid = $.nss, $.nss = void 0, !b.tolerant && (!$.uuid || !t.test($.uuid)) && ($.error = $.error || "UUID is not valid."), $;
  }
  function g(m) {
    const b = m;
    return b.nss = (m.uuid || "").toLowerCase(), b;
  }
  const w = {
    scheme: "http",
    domainHost: !0,
    parse: n,
    serialize: s
  }, P = {
    scheme: "https",
    domainHost: w.domainHost,
    parse: n,
    serialize: s
  }, x = {
    scheme: "ws",
    domainHost: !0,
    parse: i,
    serialize: l
  }, T = {
    scheme: "wss",
    domainHost: x.domainHost,
    parse: x.parse,
    serialize: x.serialize
  }, _ = {
    http: w,
    https: P,
    ws: x,
    wss: T,
    urn: {
      scheme: "urn",
      parse: f,
      serialize: d,
      skipNormalize: !0
    },
    "urn:uuid": {
      scheme: "urn:uuid",
      parse: p,
      serialize: g,
      skipNormalize: !0
    }
  };
  return Ta = _, Ta;
}
var Fc;
function Py() {
  if (Fc) return Nn.exports;
  Fc = 1;
  const { normalizeIPv6: t, normalizeIPv4: e, removeDotSegments: r, recomposeAuthority: n, normalizeComponentEncoding: s } = ky(), i = Ay();
  function l(y, _) {
    return typeof y == "string" ? y = g(T(y, _), _) : typeof y == "object" && (y = T(g(y, _), _)), y;
  }
  function f(y, _, m) {
    const b = Object.assign({ scheme: "null" }, m), $ = d(T(y, b), T(_, b), b, !0);
    return g($, { ...b, skipEscape: !0 });
  }
  function d(y, _, m, b) {
    const $ = {};
    return b || (y = T(g(y, m), m), _ = T(g(_, m), m)), m = m || {}, !m.tolerant && _.scheme ? ($.scheme = _.scheme, $.userinfo = _.userinfo, $.host = _.host, $.port = _.port, $.path = r(_.path || ""), $.query = _.query) : (_.userinfo !== void 0 || _.host !== void 0 || _.port !== void 0 ? ($.userinfo = _.userinfo, $.host = _.host, $.port = _.port, $.path = r(_.path || ""), $.query = _.query) : (_.path ? (_.path.charAt(0) === "/" ? $.path = r(_.path) : ((y.userinfo !== void 0 || y.host !== void 0 || y.port !== void 0) && !y.path ? $.path = "/" + _.path : y.path ? $.path = y.path.slice(0, y.path.lastIndexOf("/") + 1) + _.path : $.path = _.path, $.path = r($.path)), $.query = _.query) : ($.path = y.path, _.query !== void 0 ? $.query = _.query : $.query = y.query), $.userinfo = y.userinfo, $.host = y.host, $.port = y.port), $.scheme = y.scheme), $.fragment = _.fragment, $;
  }
  function p(y, _, m) {
    return typeof y == "string" ? (y = unescape(y), y = g(s(T(y, m), !0), { ...m, skipEscape: !0 })) : typeof y == "object" && (y = g(s(y, !0), { ...m, skipEscape: !0 })), typeof _ == "string" ? (_ = unescape(_), _ = g(s(T(_, m), !0), { ...m, skipEscape: !0 })) : typeof _ == "object" && (_ = g(s(_, !0), { ...m, skipEscape: !0 })), y.toLowerCase() === _.toLowerCase();
  }
  function g(y, _) {
    const m = {
      host: y.host,
      scheme: y.scheme,
      userinfo: y.userinfo,
      port: y.port,
      path: y.path,
      query: y.query,
      nid: y.nid,
      nss: y.nss,
      uuid: y.uuid,
      fragment: y.fragment,
      reference: y.reference,
      resourceName: y.resourceName,
      secure: y.secure,
      error: ""
    }, b = Object.assign({}, _), $ = [], O = i[(b.scheme || m.scheme || "").toLowerCase()];
    O && O.serialize && O.serialize(m, b), m.path !== void 0 && (b.skipEscape ? m.path = unescape(m.path) : (m.path = escape(m.path), m.scheme !== void 0 && (m.path = m.path.split("%3A").join(":")))), b.reference !== "suffix" && m.scheme && $.push(m.scheme, ":");
    const A = n(m);
    if (A !== void 0 && (b.reference !== "suffix" && $.push("//"), $.push(A), m.path && m.path.charAt(0) !== "/" && $.push("/")), m.path !== void 0) {
      let j = m.path;
      !b.absolutePath && (!O || !O.absolutePath) && (j = r(j)), A === void 0 && (j = j.replace(/^\/\//u, "/%2F")), $.push(j);
    }
    return m.query !== void 0 && $.push("?", m.query), m.fragment !== void 0 && $.push("#", m.fragment), $.join("");
  }
  const w = Array.from({ length: 127 }, (y, _) => /[^!"$&'()*+,\-.;=_`a-z{}~]/u.test(String.fromCharCode(_)));
  function P(y) {
    let _ = 0;
    for (let m = 0, b = y.length; m < b; ++m)
      if (_ = y.charCodeAt(m), _ > 126 || w[_])
        return !0;
    return !1;
  }
  const x = /^(?:([^#/:?]+):)?(?:\/\/((?:([^#/?@]*)@)?(\[[^#/?\]]+\]|[^#/:?]*)(?::(\d*))?))?([^#?]*)(?:\?([^#]*))?(?:#((?:.|[\n\r])*))?/u;
  function T(y, _) {
    const m = Object.assign({}, _), b = {
      scheme: void 0,
      userinfo: void 0,
      host: "",
      port: void 0,
      path: "",
      query: void 0,
      fragment: void 0
    }, $ = y.indexOf("%") !== -1;
    let O = !1;
    m.reference === "suffix" && (y = (m.scheme ? m.scheme + ":" : "") + "//" + y);
    const A = y.match(x);
    if (A) {
      if (b.scheme = A[1], b.userinfo = A[3], b.host = A[4], b.port = parseInt(A[5], 10), b.path = A[6] || "", b.query = A[7], b.fragment = A[8], isNaN(b.port) && (b.port = A[5]), b.host) {
        const V = e(b.host);
        if (V.isIPV4 === !1) {
          const G = t(V.host);
          b.host = G.host.toLowerCase(), O = G.isIPV6;
        } else
          b.host = V.host, O = !0;
      }
      b.scheme === void 0 && b.userinfo === void 0 && b.host === void 0 && b.port === void 0 && b.query === void 0 && !b.path ? b.reference = "same-document" : b.scheme === void 0 ? b.reference = "relative" : b.fragment === void 0 ? b.reference = "absolute" : b.reference = "uri", m.reference && m.reference !== "suffix" && m.reference !== b.reference && (b.error = b.error || "URI is not a " + m.reference + " reference.");
      const j = i[(m.scheme || b.scheme || "").toLowerCase()];
      if (!m.unicodeSupport && (!j || !j.unicodeSupport) && b.host && (m.domainHost || j && j.domainHost) && O === !1 && P(b.host))
        try {
          b.host = URL.domainToASCII(b.host.toLowerCase());
        } catch (V) {
          b.error = b.error || "Host's domain name can not be converted to ASCII: " + V;
        }
      (!j || j && !j.skipNormalize) && ($ && b.scheme !== void 0 && (b.scheme = unescape(b.scheme)), $ && b.host !== void 0 && (b.host = unescape(b.host)), b.path && (b.path = escape(unescape(b.path))), b.fragment && (b.fragment = encodeURI(decodeURIComponent(b.fragment)))), j && j.parse && j.parse(b, m);
    } else
      b.error = b.error || "URI can not be parsed.";
    return b;
  }
  const S = {
    SCHEMES: i,
    normalize: l,
    resolve: f,
    resolveComponents: d,
    equal: p,
    serialize: g,
    parse: T
  };
  return Nn.exports = S, Nn.exports.default = S, Nn.exports.fastUri = S, Nn.exports;
}
var Dc;
function Cy() {
  if (Dc) return $s;
  Dc = 1, Object.defineProperty($s, "__esModule", { value: !0 });
  const t = Py();
  return t.code = 'require("ajv/dist/runtime/uri").default', $s.default = t, $s;
}
var qc;
function Ry() {
  return qc || (qc = 1, function(t) {
    Object.defineProperty(t, "__esModule", { value: !0 }), t.CodeGen = t.Name = t.nil = t.stringify = t.str = t._ = t.KeywordCxt = void 0;
    var e = Ji();
    Object.defineProperty(t, "KeywordCxt", { enumerable: !0, get: function() {
      return e.KeywordCxt;
    } });
    var r = Me();
    Object.defineProperty(t, "_", { enumerable: !0, get: function() {
      return r._;
    } }), Object.defineProperty(t, "str", { enumerable: !0, get: function() {
      return r.str;
    } }), Object.defineProperty(t, "stringify", { enumerable: !0, get: function() {
      return r.stringify;
    } }), Object.defineProperty(t, "nil", { enumerable: !0, get: function() {
      return r.nil;
    } }), Object.defineProperty(t, "Name", { enumerable: !0, get: function() {
      return r.Name;
    } }), Object.defineProperty(t, "CodeGen", { enumerable: !0, get: function() {
      return r.CodeGen;
    } });
    const n = el(), s = Wi(), i = wh(), l = tl(), f = Me(), d = Zi(), p = ki(), g = Ue(), w = $y, P = Cy(), x = (re, U) => new RegExp(re, U);
    x.code = "new RegExp";
    const T = ["removeAdditional", "useDefaults", "coerceTypes"], S = /* @__PURE__ */ new Set([
      "validate",
      "serialize",
      "parse",
      "wrapper",
      "root",
      "schema",
      "keyword",
      "pattern",
      "formats",
      "validate$data",
      "func",
      "obj",
      "Error"
    ]), y = {
      errorDataPath: "",
      format: "`validateFormats: false` can be used instead.",
      nullable: '"nullable" keyword is supported by default.',
      jsonPointers: "Deprecated jsPropertySyntax can be used instead.",
      extendRefs: "Deprecated ignoreKeywordsWithRef can be used instead.",
      missingRefs: "Pass empty schema with $id that should be ignored to ajv.addSchema.",
      processCode: "Use option `code: {process: (code, schemaEnv: object) => string}`",
      sourceCode: "Use option `code: {source: true}`",
      strictDefaults: "It is default now, see option `strict`.",
      strictKeywords: "It is default now, see option `strict`.",
      uniqueItems: '"uniqueItems" keyword is always validated.',
      unknownFormats: "Disable strict mode or pass `true` to `ajv.addFormat` (or `formats` option).",
      cache: "Map is used as cache, schema object as key.",
      serialize: "Map is used as cache, schema object as key.",
      ajvErrors: "It is default now."
    }, _ = {
      ignoreKeywordsWithRef: "",
      jsPropertySyntax: "",
      unicode: '"minLength"/"maxLength" account for unicode characters by default.'
    }, m = 200;
    function b(re) {
      var U, Z, B, N, I, W, fe, le, Ne, Te, q, z, X, ae, me, Ce, rt, pt, Le, it, Ye, gt, yt, zt, Vr;
      const nr = re.strict, sr = (U = re.code) === null || U === void 0 ? void 0 : U.optimize, Qr = sr === !0 || sr === void 0 ? 1 : sr || 0, Hr = (B = (Z = re.code) === null || Z === void 0 ? void 0 : Z.regExp) !== null && B !== void 0 ? B : x, Pn = (N = re.uriResolver) !== null && N !== void 0 ? N : P.default;
      return {
        strictSchema: (W = (I = re.strictSchema) !== null && I !== void 0 ? I : nr) !== null && W !== void 0 ? W : !0,
        strictNumbers: (le = (fe = re.strictNumbers) !== null && fe !== void 0 ? fe : nr) !== null && le !== void 0 ? le : !0,
        strictTypes: (Te = (Ne = re.strictTypes) !== null && Ne !== void 0 ? Ne : nr) !== null && Te !== void 0 ? Te : "log",
        strictTuples: (z = (q = re.strictTuples) !== null && q !== void 0 ? q : nr) !== null && z !== void 0 ? z : "log",
        strictRequired: (ae = (X = re.strictRequired) !== null && X !== void 0 ? X : nr) !== null && ae !== void 0 ? ae : !1,
        code: re.code ? { ...re.code, optimize: Qr, regExp: Hr } : { optimize: Qr, regExp: Hr },
        loopRequired: (me = re.loopRequired) !== null && me !== void 0 ? me : m,
        loopEnum: (Ce = re.loopEnum) !== null && Ce !== void 0 ? Ce : m,
        meta: (rt = re.meta) !== null && rt !== void 0 ? rt : !0,
        messages: (pt = re.messages) !== null && pt !== void 0 ? pt : !0,
        inlineRefs: (Le = re.inlineRefs) !== null && Le !== void 0 ? Le : !0,
        schemaId: (it = re.schemaId) !== null && it !== void 0 ? it : "$id",
        addUsedSchema: (Ye = re.addUsedSchema) !== null && Ye !== void 0 ? Ye : !0,
        validateSchema: (gt = re.validateSchema) !== null && gt !== void 0 ? gt : !0,
        validateFormats: (yt = re.validateFormats) !== null && yt !== void 0 ? yt : !0,
        unicodeRegExp: (zt = re.unicodeRegExp) !== null && zt !== void 0 ? zt : !0,
        int32range: (Vr = re.int32range) !== null && Vr !== void 0 ? Vr : !0,
        uriResolver: Pn
      };
    }
    class $ {
      constructor(U = {}) {
        this.schemas = {}, this.refs = {}, this.formats = {}, this._compilations = /* @__PURE__ */ new Set(), this._loading = {}, this._cache = /* @__PURE__ */ new Map(), U = this.opts = { ...U, ...b(U) };
        const { es5: Z, lines: B } = this.opts.code;
        this.scope = new f.ValueScope({ scope: {}, prefixes: S, es5: Z, lines: B }), this.logger = ye(U.logger);
        const N = U.validateFormats;
        U.validateFormats = !1, this.RULES = (0, i.getRules)(), O.call(this, y, U, "NOT SUPPORTED"), O.call(this, _, U, "DEPRECATED", "warn"), this._metaOpts = H.call(this), U.formats && V.call(this), this._addVocabularies(), this._addDefaultMetaSchema(), U.keywords && G.call(this, U.keywords), typeof U.meta == "object" && this.addMetaSchema(U.meta), j.call(this), U.validateFormats = N;
      }
      _addVocabularies() {
        this.addKeyword("$async");
      }
      _addDefaultMetaSchema() {
        const { $data: U, meta: Z, schemaId: B } = this.opts;
        let N = w;
        B === "id" && (N = { ...w }, N.id = N.$id, delete N.$id), Z && U && this.addMetaSchema(N, N[B], !1);
      }
      defaultMeta() {
        const { meta: U, schemaId: Z } = this.opts;
        return this.opts.defaultMeta = typeof U == "object" ? U[Z] || U : void 0;
      }
      validate(U, Z) {
        let B;
        if (typeof U == "string") {
          if (B = this.getSchema(U), !B)
            throw new Error(`no schema with key or ref "${U}"`);
        } else
          B = this.compile(U);
        const N = B(Z);
        return "$async" in B || (this.errors = B.errors), N;
      }
      compile(U, Z) {
        const B = this._addSchema(U, Z);
        return B.validate || this._compileSchemaEnv(B);
      }
      compileAsync(U, Z) {
        if (typeof this.opts.loadSchema != "function")
          throw new Error("options.loadSchema should be a function");
        const { loadSchema: B } = this.opts;
        return N.call(this, U, Z);
        async function N(Te, q) {
          await I.call(this, Te.$schema);
          const z = this._addSchema(Te, q);
          return z.validate || W.call(this, z);
        }
        async function I(Te) {
          Te && !this.getSchema(Te) && await N.call(this, { $ref: Te }, !0);
        }
        async function W(Te) {
          try {
            return this._compileSchemaEnv(Te);
          } catch (q) {
            if (!(q instanceof s.default))
              throw q;
            return fe.call(this, q), await le.call(this, q.missingSchema), W.call(this, Te);
          }
        }
        function fe({ missingSchema: Te, missingRef: q }) {
          if (this.refs[Te])
            throw new Error(`AnySchema ${Te} is loaded but ${q} cannot be resolved`);
        }
        async function le(Te) {
          const q = await Ne.call(this, Te);
          this.refs[Te] || await I.call(this, q.$schema), this.refs[Te] || this.addSchema(q, Te, Z);
        }
        async function Ne(Te) {
          const q = this._loading[Te];
          if (q)
            return q;
          try {
            return await (this._loading[Te] = B(Te));
          } finally {
            delete this._loading[Te];
          }
        }
      }
      // Adds schema to the instance
      addSchema(U, Z, B, N = this.opts.validateSchema) {
        if (Array.isArray(U)) {
          for (const W of U)
            this.addSchema(W, void 0, B, N);
          return this;
        }
        let I;
        if (typeof U == "object") {
          const { schemaId: W } = this.opts;
          if (I = U[W], I !== void 0 && typeof I != "string")
            throw new Error(`schema ${W} must be string`);
        }
        return Z = (0, d.normalizeId)(Z || I), this._checkUnique(Z), this.schemas[Z] = this._addSchema(U, B, Z, N, !0), this;
      }
      // Add schema that will be used to validate other schemas
      // options in META_IGNORE_OPTIONS are alway set to false
      addMetaSchema(U, Z, B = this.opts.validateSchema) {
        return this.addSchema(U, Z, !0, B), this;
      }
      //  Validate schema against its meta-schema
      validateSchema(U, Z) {
        if (typeof U == "boolean")
          return !0;
        let B;
        if (B = U.$schema, B !== void 0 && typeof B != "string")
          throw new Error("$schema must be a string");
        if (B = B || this.opts.defaultMeta || this.defaultMeta(), !B)
          return this.logger.warn("meta-schema not available"), this.errors = null, !0;
        const N = this.validate(B, U);
        if (!N && Z) {
          const I = "schema is invalid: " + this.errorsText();
          if (this.opts.validateSchema === "log")
            this.logger.error(I);
          else
            throw new Error(I);
        }
        return N;
      }
      // Get compiled schema by `key` or `ref`.
      // (`key` that was passed to `addSchema` or full schema reference - `schema.$id` or resolved id)
      getSchema(U) {
        let Z;
        for (; typeof (Z = A.call(this, U)) == "string"; )
          U = Z;
        if (Z === void 0) {
          const { schemaId: B } = this.opts, N = new l.SchemaEnv({ schema: {}, schemaId: B });
          if (Z = l.resolveSchema.call(this, N, U), !Z)
            return;
          this.refs[U] = Z;
        }
        return Z.validate || this._compileSchemaEnv(Z);
      }
      // Remove cached schema(s).
      // If no parameter is passed all schemas but meta-schemas are removed.
      // If RegExp is passed all schemas with key/id matching pattern but meta-schemas are removed.
      // Even if schema is referenced by other schemas it still can be removed as other schemas have local references.
      removeSchema(U) {
        if (U instanceof RegExp)
          return this._removeAllSchemas(this.schemas, U), this._removeAllSchemas(this.refs, U), this;
        switch (typeof U) {
          case "undefined":
            return this._removeAllSchemas(this.schemas), this._removeAllSchemas(this.refs), this._cache.clear(), this;
          case "string": {
            const Z = A.call(this, U);
            return typeof Z == "object" && this._cache.delete(Z.schema), delete this.schemas[U], delete this.refs[U], this;
          }
          case "object": {
            const Z = U;
            this._cache.delete(Z);
            let B = U[this.opts.schemaId];
            return B && (B = (0, d.normalizeId)(B), delete this.schemas[B], delete this.refs[B]), this;
          }
          default:
            throw new Error("ajv.removeSchema: invalid parameter");
        }
      }
      // add "vocabulary" - a collection of keywords
      addVocabulary(U) {
        for (const Z of U)
          this.addKeyword(Z);
        return this;
      }
      addKeyword(U, Z) {
        let B;
        if (typeof U == "string")
          B = U, typeof Z == "object" && (this.logger.warn("these parameters are deprecated, see docs for addKeyword"), Z.keyword = B);
        else if (typeof U == "object" && Z === void 0) {
          if (Z = U, B = Z.keyword, Array.isArray(B) && !B.length)
            throw new Error("addKeywords: keyword must be string or non-empty array");
        } else
          throw new Error("invalid addKeywords parameters");
        if (ke.call(this, B, Z), !Z)
          return (0, g.eachItem)(B, (I) => ze.call(this, I)), this;
        ct.call(this, Z);
        const N = {
          ...Z,
          type: (0, p.getJSONTypes)(Z.type),
          schemaType: (0, p.getJSONTypes)(Z.schemaType)
        };
        return (0, g.eachItem)(B, N.type.length === 0 ? (I) => ze.call(this, I, N) : (I) => N.type.forEach((W) => ze.call(this, I, N, W))), this;
      }
      getKeyword(U) {
        const Z = this.RULES.all[U];
        return typeof Z == "object" ? Z.definition : !!Z;
      }
      // Remove keyword
      removeKeyword(U) {
        const { RULES: Z } = this;
        delete Z.keywords[U], delete Z.all[U];
        for (const B of Z.rules) {
          const N = B.rules.findIndex((I) => I.keyword === U);
          N >= 0 && B.rules.splice(N, 1);
        }
        return this;
      }
      // Add format
      addFormat(U, Z) {
        return typeof Z == "string" && (Z = new RegExp(Z)), this.formats[U] = Z, this;
      }
      errorsText(U = this.errors, { separator: Z = ", ", dataVar: B = "data" } = {}) {
        return !U || U.length === 0 ? "No errors" : U.map((N) => `${B}${N.instancePath} ${N.message}`).reduce((N, I) => N + Z + I);
      }
      $dataMetaSchema(U, Z) {
        const B = this.RULES.all;
        U = JSON.parse(JSON.stringify(U));
        for (const N of Z) {
          const I = N.split("/").slice(1);
          let W = U;
          for (const fe of I)
            W = W[fe];
          for (const fe in B) {
            const le = B[fe];
            if (typeof le != "object")
              continue;
            const { $data: Ne } = le.definition, Te = W[fe];
            Ne && Te && (W[fe] = xt(Te));
          }
        }
        return U;
      }
      _removeAllSchemas(U, Z) {
        for (const B in U) {
          const N = U[B];
          (!Z || Z.test(B)) && (typeof N == "string" ? delete U[B] : N && !N.meta && (this._cache.delete(N.schema), delete U[B]));
        }
      }
      _addSchema(U, Z, B, N = this.opts.validateSchema, I = this.opts.addUsedSchema) {
        let W;
        const { schemaId: fe } = this.opts;
        if (typeof U == "object")
          W = U[fe];
        else {
          if (this.opts.jtd)
            throw new Error("schema must be object");
          if (typeof U != "boolean")
            throw new Error("schema must be object or boolean");
        }
        let le = this._cache.get(U);
        if (le !== void 0)
          return le;
        B = (0, d.normalizeId)(W || B);
        const Ne = d.getSchemaRefs.call(this, U, B);
        return le = new l.SchemaEnv({ schema: U, schemaId: fe, meta: Z, baseId: B, localRefs: Ne }), this._cache.set(le.schema, le), I && !B.startsWith("#") && (B && this._checkUnique(B), this.refs[B] = le), N && this.validateSchema(U, !0), le;
      }
      _checkUnique(U) {
        if (this.schemas[U] || this.refs[U])
          throw new Error(`schema with key or id "${U}" already exists`);
      }
      _compileSchemaEnv(U) {
        if (U.meta ? this._compileMetaSchema(U) : l.compileSchema.call(this, U), !U.validate)
          throw new Error("ajv implementation error");
        return U.validate;
      }
      _compileMetaSchema(U) {
        const Z = this.opts;
        this.opts = this._metaOpts;
        try {
          l.compileSchema.call(this, U);
        } finally {
          this.opts = Z;
        }
      }
    }
    $.ValidationError = n.default, $.MissingRefError = s.default, t.default = $;
    function O(re, U, Z, B = "error") {
      for (const N in re) {
        const I = N;
        I in U && this.logger[B](`${Z}: option ${N}. ${re[I]}`);
      }
    }
    function A(re) {
      return re = (0, d.normalizeId)(re), this.schemas[re] || this.refs[re];
    }
    function j() {
      const re = this.opts.schemas;
      if (re)
        if (Array.isArray(re))
          this.addSchema(re);
        else
          for (const U in re)
            this.addSchema(re[U], U);
    }
    function V() {
      for (const re in this.opts.formats) {
        const U = this.opts.formats[re];
        U && this.addFormat(re, U);
      }
    }
    function G(re) {
      if (Array.isArray(re)) {
        this.addVocabulary(re);
        return;
      }
      this.logger.warn("keywords option as map is deprecated, pass array");
      for (const U in re) {
        const Z = re[U];
        Z.keyword || (Z.keyword = U), this.addKeyword(Z);
      }
    }
    function H() {
      const re = { ...this.opts };
      for (const U of T)
        delete re[U];
      return re;
    }
    const ee = { log() {
    }, warn() {
    }, error() {
    } };
    function ye(re) {
      if (re === !1)
        return ee;
      if (re === void 0)
        return console;
      if (re.log && re.warn && re.error)
        return re;
      throw new Error("logger must implement log, warn and error methods");
    }
    const ge = /^[a-z_$][a-z0-9_$:-]*$/i;
    function ke(re, U) {
      const { RULES: Z } = this;
      if ((0, g.eachItem)(re, (B) => {
        if (Z.keywords[B])
          throw new Error(`Keyword ${B} is already defined`);
        if (!ge.test(B))
          throw new Error(`Keyword ${B} has invalid name`);
      }), !!U && U.$data && !("code" in U || "validate" in U))
        throw new Error('$data keyword must have "code" or "validate" function');
    }
    function ze(re, U, Z) {
      var B;
      const N = U == null ? void 0 : U.post;
      if (Z && N)
        throw new Error('keyword with "post" flag cannot have "type"');
      const { RULES: I } = this;
      let W = N ? I.post : I.rules.find(({ type: le }) => le === Z);
      if (W || (W = { type: Z, rules: [] }, I.rules.push(W)), I.keywords[re] = !0, !U)
        return;
      const fe = {
        keyword: re,
        definition: {
          ...U,
          type: (0, p.getJSONTypes)(U.type),
          schemaType: (0, p.getJSONTypes)(U.schemaType)
        }
      };
      U.before ? st.call(this, W, fe, U.before) : W.rules.push(fe), I.all[re] = fe, (B = U.implements) === null || B === void 0 || B.forEach((le) => this.addKeyword(le));
    }
    function st(re, U, Z) {
      const B = re.rules.findIndex((N) => N.keyword === Z);
      B >= 0 ? re.rules.splice(B, 0, U) : (re.rules.push(U), this.logger.warn(`rule ${Z} is not defined`));
    }
    function ct(re) {
      let { metaSchema: U } = re;
      U !== void 0 && (re.$data && this.opts.$data && (U = xt(U)), re.validateSchema = this.compile(U, !0));
    }
    const qe = {
      $ref: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#"
    };
    function xt(re) {
      return { anyOf: [re, qe] };
    }
  }(Sa)), Sa;
}
var xs = {}, ks = {}, As = {}, Lc;
function Ty() {
  if (Lc) return As;
  Lc = 1, Object.defineProperty(As, "__esModule", { value: !0 });
  const t = {
    keyword: "id",
    code() {
      throw new Error('NOT SUPPORTED: keyword "id", use "$id" for schema ID');
    }
  };
  return As.default = t, As;
}
var Pr = {}, Vc;
function Oy() {
  if (Vc) return Pr;
  Vc = 1, Object.defineProperty(Pr, "__esModule", { value: !0 }), Pr.callRef = Pr.getValidate = void 0;
  const t = Wi(), e = rr(), r = Me(), n = Dr(), s = tl(), i = Ue(), l = {
    keyword: "$ref",
    schemaType: "string",
    code(p) {
      const { gen: g, schema: w, it: P } = p, { baseId: x, schemaEnv: T, validateName: S, opts: y, self: _ } = P, { root: m } = T;
      if ((w === "#" || w === "#/") && x === m.baseId)
        return $();
      const b = s.resolveRef.call(_, m, x, w);
      if (b === void 0)
        throw new t.default(P.opts.uriResolver, x, w);
      if (b instanceof s.SchemaEnv)
        return O(b);
      return A(b);
      function $() {
        if (T === m)
          return d(p, S, T, T.$async);
        const j = g.scopeValue("root", { ref: m });
        return d(p, (0, r._)`${j}.validate`, m, m.$async);
      }
      function O(j) {
        const V = f(p, j);
        d(p, V, j, j.$async);
      }
      function A(j) {
        const V = g.scopeValue("schema", y.code.source === !0 ? { ref: j, code: (0, r.stringify)(j) } : { ref: j }), G = g.name("valid"), H = p.subschema({
          schema: j,
          dataTypes: [],
          schemaPath: r.nil,
          topSchemaRef: V,
          errSchemaPath: w
        }, G);
        p.mergeEvaluated(H), p.ok(G);
      }
    }
  };
  function f(p, g) {
    const { gen: w } = p;
    return g.validate ? w.scopeValue("validate", { ref: g.validate }) : (0, r._)`${w.scopeValue("wrapper", { ref: g })}.validate`;
  }
  Pr.getValidate = f;
  function d(p, g, w, P) {
    const { gen: x, it: T } = p, { allErrors: S, schemaEnv: y, opts: _ } = T, m = _.passContext ? n.default.this : r.nil;
    P ? b() : $();
    function b() {
      if (!y.$async)
        throw new Error("async schema referenced by sync schema");
      const j = x.let("valid");
      x.try(() => {
        x.code((0, r._)`await ${(0, e.callValidateCode)(p, g, m)}`), A(g), S || x.assign(j, !0);
      }, (V) => {
        x.if((0, r._)`!(${V} instanceof ${T.ValidationError})`, () => x.throw(V)), O(V), S || x.assign(j, !1);
      }), p.ok(j);
    }
    function $() {
      p.result((0, e.callValidateCode)(p, g, m), () => A(g), () => O(g));
    }
    function O(j) {
      const V = (0, r._)`${j}.errors`;
      x.assign(n.default.vErrors, (0, r._)`${n.default.vErrors} === null ? ${V} : ${n.default.vErrors}.concat(${V})`), x.assign(n.default.errors, (0, r._)`${n.default.vErrors}.length`);
    }
    function A(j) {
      var V;
      if (!T.opts.unevaluated)
        return;
      const G = (V = w == null ? void 0 : w.validate) === null || V === void 0 ? void 0 : V.evaluated;
      if (T.props !== !0)
        if (G && !G.dynamicProps)
          G.props !== void 0 && (T.props = i.mergeEvaluated.props(x, G.props, T.props));
        else {
          const H = x.var("props", (0, r._)`${j}.evaluated.props`);
          T.props = i.mergeEvaluated.props(x, H, T.props, r.Name);
        }
      if (T.items !== !0)
        if (G && !G.dynamicItems)
          G.items !== void 0 && (T.items = i.mergeEvaluated.items(x, G.items, T.items));
        else {
          const H = x.var("items", (0, r._)`${j}.evaluated.items`);
          T.items = i.mergeEvaluated.items(x, H, T.items, r.Name);
        }
    }
  }
  return Pr.callRef = d, Pr.default = l, Pr;
}
var Uc;
function Ny() {
  if (Uc) return ks;
  Uc = 1, Object.defineProperty(ks, "__esModule", { value: !0 });
  const t = Ty(), e = Oy(), r = [
    "$schema",
    "$id",
    "$defs",
    "$vocabulary",
    { keyword: "$comment" },
    "definitions",
    t.default,
    e.default
  ];
  return ks.default = r, ks;
}
var Ps = {}, Cs = {}, zc;
function Iy() {
  if (zc) return Cs;
  zc = 1, Object.defineProperty(Cs, "__esModule", { value: !0 });
  const t = Me(), e = t.operators, r = {
    maximum: { okStr: "<=", ok: e.LTE, fail: e.GT },
    minimum: { okStr: ">=", ok: e.GTE, fail: e.LT },
    exclusiveMaximum: { okStr: "<", ok: e.LT, fail: e.GTE },
    exclusiveMinimum: { okStr: ">", ok: e.GT, fail: e.LTE }
  }, n = {
    message: ({ keyword: i, schemaCode: l }) => (0, t.str)`must be ${r[i].okStr} ${l}`,
    params: ({ keyword: i, schemaCode: l }) => (0, t._)`{comparison: ${r[i].okStr}, limit: ${l}}`
  }, s = {
    keyword: Object.keys(r),
    type: "number",
    schemaType: "number",
    $data: !0,
    error: n,
    code(i) {
      const { keyword: l, data: f, schemaCode: d } = i;
      i.fail$data((0, t._)`${f} ${r[l].fail} ${d} || isNaN(${f})`);
    }
  };
  return Cs.default = s, Cs;
}
var Rs = {}, Bc;
function jy() {
  if (Bc) return Rs;
  Bc = 1, Object.defineProperty(Rs, "__esModule", { value: !0 });
  const t = Me(), r = {
    keyword: "multipleOf",
    type: "number",
    schemaType: "number",
    $data: !0,
    error: {
      message: ({ schemaCode: n }) => (0, t.str)`must be multiple of ${n}`,
      params: ({ schemaCode: n }) => (0, t._)`{multipleOf: ${n}}`
    },
    code(n) {
      const { gen: s, data: i, schemaCode: l, it: f } = n, d = f.opts.multipleOfPrecision, p = s.let("res"), g = d ? (0, t._)`Math.abs(Math.round(${p}) - ${p}) > 1e-${d}` : (0, t._)`${p} !== parseInt(${p})`;
      n.fail$data((0, t._)`(${l} === 0 || (${p} = ${i}/${l}, ${g}))`);
    }
  };
  return Rs.default = r, Rs;
}
var Ts = {}, Os = {}, Zc;
function My() {
  if (Zc) return Os;
  Zc = 1, Object.defineProperty(Os, "__esModule", { value: !0 });
  function t(e) {
    const r = e.length;
    let n = 0, s = 0, i;
    for (; s < r; )
      n++, i = e.charCodeAt(s++), i >= 55296 && i <= 56319 && s < r && (i = e.charCodeAt(s), (i & 64512) === 56320 && s++);
    return n;
  }
  return Os.default = t, t.code = 'require("ajv/dist/runtime/ucs2length").default', Os;
}
var Jc;
function Fy() {
  if (Jc) return Ts;
  Jc = 1, Object.defineProperty(Ts, "__esModule", { value: !0 });
  const t = Me(), e = Ue(), r = My(), s = {
    keyword: ["maxLength", "minLength"],
    type: "string",
    schemaType: "number",
    $data: !0,
    error: {
      message({ keyword: i, schemaCode: l }) {
        const f = i === "maxLength" ? "more" : "fewer";
        return (0, t.str)`must NOT have ${f} than ${l} characters`;
      },
      params: ({ schemaCode: i }) => (0, t._)`{limit: ${i}}`
    },
    code(i) {
      const { keyword: l, data: f, schemaCode: d, it: p } = i, g = l === "maxLength" ? t.operators.GT : t.operators.LT, w = p.opts.unicode === !1 ? (0, t._)`${f}.length` : (0, t._)`${(0, e.useFunc)(i.gen, r.default)}(${f})`;
      i.fail$data((0, t._)`${w} ${g} ${d}`);
    }
  };
  return Ts.default = s, Ts;
}
var Ns = {}, Wc;
function Dy() {
  if (Wc) return Ns;
  Wc = 1, Object.defineProperty(Ns, "__esModule", { value: !0 });
  const t = rr(), e = Me(), n = {
    keyword: "pattern",
    type: "string",
    schemaType: "string",
    $data: !0,
    error: {
      message: ({ schemaCode: s }) => (0, e.str)`must match pattern "${s}"`,
      params: ({ schemaCode: s }) => (0, e._)`{pattern: ${s}}`
    },
    code(s) {
      const { data: i, $data: l, schema: f, schemaCode: d, it: p } = s, g = p.opts.unicodeRegExp ? "u" : "", w = l ? (0, e._)`(new RegExp(${d}, ${g}))` : (0, t.usePattern)(s, f);
      s.fail$data((0, e._)`!${w}.test(${i})`);
    }
  };
  return Ns.default = n, Ns;
}
var Is = {}, Kc;
function qy() {
  if (Kc) return Is;
  Kc = 1, Object.defineProperty(Is, "__esModule", { value: !0 });
  const t = Me(), r = {
    keyword: ["maxProperties", "minProperties"],
    type: "object",
    schemaType: "number",
    $data: !0,
    error: {
      message({ keyword: n, schemaCode: s }) {
        const i = n === "maxProperties" ? "more" : "fewer";
        return (0, t.str)`must NOT have ${i} than ${s} properties`;
      },
      params: ({ schemaCode: n }) => (0, t._)`{limit: ${n}}`
    },
    code(n) {
      const { keyword: s, data: i, schemaCode: l } = n, f = s === "maxProperties" ? t.operators.GT : t.operators.LT;
      n.fail$data((0, t._)`Object.keys(${i}).length ${f} ${l}`);
    }
  };
  return Is.default = r, Is;
}
var js = {}, Gc;
function Ly() {
  if (Gc) return js;
  Gc = 1, Object.defineProperty(js, "__esModule", { value: !0 });
  const t = rr(), e = Me(), r = Ue(), s = {
    keyword: "required",
    type: "object",
    schemaType: "array",
    $data: !0,
    error: {
      message: ({ params: { missingProperty: i } }) => (0, e.str)`must have required property '${i}'`,
      params: ({ params: { missingProperty: i } }) => (0, e._)`{missingProperty: ${i}}`
    },
    code(i) {
      const { gen: l, schema: f, schemaCode: d, data: p, $data: g, it: w } = i, { opts: P } = w;
      if (!g && f.length === 0)
        return;
      const x = f.length >= P.loopRequired;
      if (w.allErrors ? T() : S(), P.strictRequired) {
        const m = i.parentSchema.properties, { definedProperties: b } = i.it;
        for (const $ of f)
          if ((m == null ? void 0 : m[$]) === void 0 && !b.has($)) {
            const O = w.schemaEnv.baseId + w.errSchemaPath, A = `required property "${$}" is not defined at "${O}" (strictRequired)`;
            (0, r.checkStrictMode)(w, A, w.opts.strictRequired);
          }
      }
      function T() {
        if (x || g)
          i.block$data(e.nil, y);
        else
          for (const m of f)
            (0, t.checkReportMissingProp)(i, m);
      }
      function S() {
        const m = l.let("missing");
        if (x || g) {
          const b = l.let("valid", !0);
          i.block$data(b, () => _(m, b)), i.ok(b);
        } else
          l.if((0, t.checkMissingProp)(i, f, m)), (0, t.reportMissingProp)(i, m), l.else();
      }
      function y() {
        l.forOf("prop", d, (m) => {
          i.setParams({ missingProperty: m }), l.if((0, t.noPropertyInData)(l, p, m, P.ownProperties), () => i.error());
        });
      }
      function _(m, b) {
        i.setParams({ missingProperty: m }), l.forOf(m, d, () => {
          l.assign(b, (0, t.propertyInData)(l, p, m, P.ownProperties)), l.if((0, e.not)(b), () => {
            i.error(), l.break();
          });
        }, e.nil);
      }
    }
  };
  return js.default = s, js;
}
var Ms = {}, Yc;
function Vy() {
  if (Yc) return Ms;
  Yc = 1, Object.defineProperty(Ms, "__esModule", { value: !0 });
  const t = Me(), r = {
    keyword: ["maxItems", "minItems"],
    type: "array",
    schemaType: "number",
    $data: !0,
    error: {
      message({ keyword: n, schemaCode: s }) {
        const i = n === "maxItems" ? "more" : "fewer";
        return (0, t.str)`must NOT have ${i} than ${s} items`;
      },
      params: ({ schemaCode: n }) => (0, t._)`{limit: ${n}}`
    },
    code(n) {
      const { keyword: s, data: i, schemaCode: l } = n, f = s === "maxItems" ? t.operators.GT : t.operators.LT;
      n.fail$data((0, t._)`${i}.length ${f} ${l}`);
    }
  };
  return Ms.default = r, Ms;
}
var Fs = {}, Ds = {}, Xc;
function rl() {
  if (Xc) return Ds;
  Xc = 1, Object.defineProperty(Ds, "__esModule", { value: !0 });
  const t = vh();
  return t.code = 'require("ajv/dist/runtime/equal").default', Ds.default = t, Ds;
}
var Qc;
function Uy() {
  if (Qc) return Fs;
  Qc = 1, Object.defineProperty(Fs, "__esModule", { value: !0 });
  const t = ki(), e = Me(), r = Ue(), n = rl(), i = {
    keyword: "uniqueItems",
    type: "array",
    schemaType: "boolean",
    $data: !0,
    error: {
      message: ({ params: { i: l, j: f } }) => (0, e.str)`must NOT have duplicate items (items ## ${f} and ${l} are identical)`,
      params: ({ params: { i: l, j: f } }) => (0, e._)`{i: ${l}, j: ${f}}`
    },
    code(l) {
      const { gen: f, data: d, $data: p, schema: g, parentSchema: w, schemaCode: P, it: x } = l;
      if (!p && !g)
        return;
      const T = f.let("valid"), S = w.items ? (0, t.getSchemaTypes)(w.items) : [];
      l.block$data(T, y, (0, e._)`${P} === false`), l.ok(T);
      function y() {
        const $ = f.let("i", (0, e._)`${d}.length`), O = f.let("j");
        l.setParams({ i: $, j: O }), f.assign(T, !0), f.if((0, e._)`${$} > 1`, () => (_() ? m : b)($, O));
      }
      function _() {
        return S.length > 0 && !S.some(($) => $ === "object" || $ === "array");
      }
      function m($, O) {
        const A = f.name("item"), j = (0, t.checkDataTypes)(S, A, x.opts.strictNumbers, t.DataType.Wrong), V = f.const("indices", (0, e._)`{}`);
        f.for((0, e._)`;${$}--;`, () => {
          f.let(A, (0, e._)`${d}[${$}]`), f.if(j, (0, e._)`continue`), S.length > 1 && f.if((0, e._)`typeof ${A} == "string"`, (0, e._)`${A} += "_"`), f.if((0, e._)`typeof ${V}[${A}] == "number"`, () => {
            f.assign(O, (0, e._)`${V}[${A}]`), l.error(), f.assign(T, !1).break();
          }).code((0, e._)`${V}[${A}] = ${$}`);
        });
      }
      function b($, O) {
        const A = (0, r.useFunc)(f, n.default), j = f.name("outer");
        f.label(j).for((0, e._)`;${$}--;`, () => f.for((0, e._)`${O} = ${$}; ${O}--;`, () => f.if((0, e._)`${A}(${d}[${$}], ${d}[${O}])`, () => {
          l.error(), f.assign(T, !1).break(j);
        })));
      }
    }
  };
  return Fs.default = i, Fs;
}
var qs = {}, Hc;
function zy() {
  if (Hc) return qs;
  Hc = 1, Object.defineProperty(qs, "__esModule", { value: !0 });
  const t = Me(), e = Ue(), r = rl(), s = {
    keyword: "const",
    $data: !0,
    error: {
      message: "must be equal to constant",
      params: ({ schemaCode: i }) => (0, t._)`{allowedValue: ${i}}`
    },
    code(i) {
      const { gen: l, data: f, $data: d, schemaCode: p, schema: g } = i;
      d || g && typeof g == "object" ? i.fail$data((0, t._)`!${(0, e.useFunc)(l, r.default)}(${f}, ${p})`) : i.fail((0, t._)`${g} !== ${f}`);
    }
  };
  return qs.default = s, qs;
}
var Ls = {}, eu;
function By() {
  if (eu) return Ls;
  eu = 1, Object.defineProperty(Ls, "__esModule", { value: !0 });
  const t = Me(), e = Ue(), r = rl(), s = {
    keyword: "enum",
    schemaType: "array",
    $data: !0,
    error: {
      message: "must be equal to one of the allowed values",
      params: ({ schemaCode: i }) => (0, t._)`{allowedValues: ${i}}`
    },
    code(i) {
      const { gen: l, data: f, $data: d, schema: p, schemaCode: g, it: w } = i;
      if (!d && p.length === 0)
        throw new Error("enum must have non-empty array");
      const P = p.length >= w.opts.loopEnum;
      let x;
      const T = () => x ?? (x = (0, e.useFunc)(l, r.default));
      let S;
      if (P || d)
        S = l.let("valid"), i.block$data(S, y);
      else {
        if (!Array.isArray(p))
          throw new Error("ajv implementation error");
        const m = l.const("vSchema", g);
        S = (0, t.or)(...p.map((b, $) => _(m, $)));
      }
      i.pass(S);
      function y() {
        l.assign(S, !1), l.forOf("v", g, (m) => l.if((0, t._)`${T()}(${f}, ${m})`, () => l.assign(S, !0).break()));
      }
      function _(m, b) {
        const $ = p[b];
        return typeof $ == "object" && $ !== null ? (0, t._)`${T()}(${f}, ${m}[${b}])` : (0, t._)`${f} === ${$}`;
      }
    }
  };
  return Ls.default = s, Ls;
}
var tu;
function Zy() {
  if (tu) return Ps;
  tu = 1, Object.defineProperty(Ps, "__esModule", { value: !0 });
  const t = Iy(), e = jy(), r = Fy(), n = Dy(), s = qy(), i = Ly(), l = Vy(), f = Uy(), d = zy(), p = By(), g = [
    // number
    t.default,
    e.default,
    // string
    r.default,
    n.default,
    // object
    s.default,
    i.default,
    // array
    l.default,
    f.default,
    // any
    { keyword: "type", schemaType: ["string", "array"] },
    { keyword: "nullable", schemaType: "boolean" },
    d.default,
    p.default
  ];
  return Ps.default = g, Ps;
}
var Vs = {}, an = {}, ru;
function bh() {
  if (ru) return an;
  ru = 1, Object.defineProperty(an, "__esModule", { value: !0 }), an.validateAdditionalItems = void 0;
  const t = Me(), e = Ue(), n = {
    keyword: "additionalItems",
    type: "array",
    schemaType: ["boolean", "object"],
    before: "uniqueItems",
    error: {
      message: ({ params: { len: i } }) => (0, t.str)`must NOT have more than ${i} items`,
      params: ({ params: { len: i } }) => (0, t._)`{limit: ${i}}`
    },
    code(i) {
      const { parentSchema: l, it: f } = i, { items: d } = l;
      if (!Array.isArray(d)) {
        (0, e.checkStrictMode)(f, '"additionalItems" is ignored when "items" is not an array of schemas');
        return;
      }
      s(i, d);
    }
  };
  function s(i, l) {
    const { gen: f, schema: d, data: p, keyword: g, it: w } = i;
    w.items = !0;
    const P = f.const("len", (0, t._)`${p}.length`);
    if (d === !1)
      i.setParams({ len: l.length }), i.pass((0, t._)`${P} <= ${l.length}`);
    else if (typeof d == "object" && !(0, e.alwaysValidSchema)(w, d)) {
      const T = f.var("valid", (0, t._)`${P} <= ${l.length}`);
      f.if((0, t.not)(T), () => x(T)), i.ok(T);
    }
    function x(T) {
      f.forRange("i", l.length, P, (S) => {
        i.subschema({ keyword: g, dataProp: S, dataPropType: e.Type.Num }, T), w.allErrors || f.if((0, t.not)(T), () => f.break());
      });
    }
  }
  return an.validateAdditionalItems = s, an.default = n, an;
}
var Us = {}, on = {}, nu;
function Sh() {
  if (nu) return on;
  nu = 1, Object.defineProperty(on, "__esModule", { value: !0 }), on.validateTuple = void 0;
  const t = Me(), e = Ue(), r = rr(), n = {
    keyword: "items",
    type: "array",
    schemaType: ["object", "array", "boolean"],
    before: "uniqueItems",
    code(i) {
      const { schema: l, it: f } = i;
      if (Array.isArray(l))
        return s(i, "additionalItems", l);
      f.items = !0, !(0, e.alwaysValidSchema)(f, l) && i.ok((0, r.validateArray)(i));
    }
  };
  function s(i, l, f = i.schema) {
    const { gen: d, parentSchema: p, data: g, keyword: w, it: P } = i;
    S(p), P.opts.unevaluated && f.length && P.items !== !0 && (P.items = e.mergeEvaluated.items(d, f.length, P.items));
    const x = d.name("valid"), T = d.const("len", (0, t._)`${g}.length`);
    f.forEach((y, _) => {
      (0, e.alwaysValidSchema)(P, y) || (d.if((0, t._)`${T} > ${_}`, () => i.subschema({
        keyword: w,
        schemaProp: _,
        dataProp: _
      }, x)), i.ok(x));
    });
    function S(y) {
      const { opts: _, errSchemaPath: m } = P, b = f.length, $ = b === y.minItems && (b === y.maxItems || y[l] === !1);
      if (_.strictTuples && !$) {
        const O = `"${w}" is ${b}-tuple, but minItems or maxItems/${l} are not specified or different at path "${m}"`;
        (0, e.checkStrictMode)(P, O, _.strictTuples);
      }
    }
  }
  return on.validateTuple = s, on.default = n, on;
}
var su;
function Jy() {
  if (su) return Us;
  su = 1, Object.defineProperty(Us, "__esModule", { value: !0 });
  const t = Sh(), e = {
    keyword: "prefixItems",
    type: "array",
    schemaType: ["array"],
    before: "uniqueItems",
    code: (r) => (0, t.validateTuple)(r, "items")
  };
  return Us.default = e, Us;
}
var zs = {}, iu;
function Wy() {
  if (iu) return zs;
  iu = 1, Object.defineProperty(zs, "__esModule", { value: !0 });
  const t = Me(), e = Ue(), r = rr(), n = bh(), i = {
    keyword: "items",
    type: "array",
    schemaType: ["object", "boolean"],
    before: "uniqueItems",
    error: {
      message: ({ params: { len: l } }) => (0, t.str)`must NOT have more than ${l} items`,
      params: ({ params: { len: l } }) => (0, t._)`{limit: ${l}}`
    },
    code(l) {
      const { schema: f, parentSchema: d, it: p } = l, { prefixItems: g } = d;
      p.items = !0, !(0, e.alwaysValidSchema)(p, f) && (g ? (0, n.validateAdditionalItems)(l, g) : l.ok((0, r.validateArray)(l)));
    }
  };
  return zs.default = i, zs;
}
var Bs = {}, au;
function Ky() {
  if (au) return Bs;
  au = 1, Object.defineProperty(Bs, "__esModule", { value: !0 });
  const t = Me(), e = Ue(), n = {
    keyword: "contains",
    type: "array",
    schemaType: ["object", "boolean"],
    before: "uniqueItems",
    trackErrors: !0,
    error: {
      message: ({ params: { min: s, max: i } }) => i === void 0 ? (0, t.str)`must contain at least ${s} valid item(s)` : (0, t.str)`must contain at least ${s} and no more than ${i} valid item(s)`,
      params: ({ params: { min: s, max: i } }) => i === void 0 ? (0, t._)`{minContains: ${s}}` : (0, t._)`{minContains: ${s}, maxContains: ${i}}`
    },
    code(s) {
      const { gen: i, schema: l, parentSchema: f, data: d, it: p } = s;
      let g, w;
      const { minContains: P, maxContains: x } = f;
      p.opts.next ? (g = P === void 0 ? 1 : P, w = x) : g = 1;
      const T = i.const("len", (0, t._)`${d}.length`);
      if (s.setParams({ min: g, max: w }), w === void 0 && g === 0) {
        (0, e.checkStrictMode)(p, '"minContains" == 0 without "maxContains": "contains" keyword ignored');
        return;
      }
      if (w !== void 0 && g > w) {
        (0, e.checkStrictMode)(p, '"minContains" > "maxContains" is always invalid'), s.fail();
        return;
      }
      if ((0, e.alwaysValidSchema)(p, l)) {
        let b = (0, t._)`${T} >= ${g}`;
        w !== void 0 && (b = (0, t._)`${b} && ${T} <= ${w}`), s.pass(b);
        return;
      }
      p.items = !0;
      const S = i.name("valid");
      w === void 0 && g === 1 ? _(S, () => i.if(S, () => i.break())) : g === 0 ? (i.let(S, !0), w !== void 0 && i.if((0, t._)`${d}.length > 0`, y)) : (i.let(S, !1), y()), s.result(S, () => s.reset());
      function y() {
        const b = i.name("_valid"), $ = i.let("count", 0);
        _(b, () => i.if(b, () => m($)));
      }
      function _(b, $) {
        i.forRange("i", 0, T, (O) => {
          s.subschema({
            keyword: "contains",
            dataProp: O,
            dataPropType: e.Type.Num,
            compositeRule: !0
          }, b), $();
        });
      }
      function m(b) {
        i.code((0, t._)`${b}++`), w === void 0 ? i.if((0, t._)`${b} >= ${g}`, () => i.assign(S, !0).break()) : (i.if((0, t._)`${b} > ${w}`, () => i.assign(S, !1).break()), g === 1 ? i.assign(S, !0) : i.if((0, t._)`${b} >= ${g}`, () => i.assign(S, !0)));
      }
    }
  };
  return Bs.default = n, Bs;
}
var Oa = {}, ou;
function Gy() {
  return ou || (ou = 1, function(t) {
    Object.defineProperty(t, "__esModule", { value: !0 }), t.validateSchemaDeps = t.validatePropertyDeps = t.error = void 0;
    const e = Me(), r = Ue(), n = rr();
    t.error = {
      message: ({ params: { property: d, depsCount: p, deps: g } }) => {
        const w = p === 1 ? "property" : "properties";
        return (0, e.str)`must have ${w} ${g} when property ${d} is present`;
      },
      params: ({ params: { property: d, depsCount: p, deps: g, missingProperty: w } }) => (0, e._)`{property: ${d},
    missingProperty: ${w},
    depsCount: ${p},
    deps: ${g}}`
      // TODO change to reference
    };
    const s = {
      keyword: "dependencies",
      type: "object",
      schemaType: "object",
      error: t.error,
      code(d) {
        const [p, g] = i(d);
        l(d, p), f(d, g);
      }
    };
    function i({ schema: d }) {
      const p = {}, g = {};
      for (const w in d) {
        if (w === "__proto__")
          continue;
        const P = Array.isArray(d[w]) ? p : g;
        P[w] = d[w];
      }
      return [p, g];
    }
    function l(d, p = d.schema) {
      const { gen: g, data: w, it: P } = d;
      if (Object.keys(p).length === 0)
        return;
      const x = g.let("missing");
      for (const T in p) {
        const S = p[T];
        if (S.length === 0)
          continue;
        const y = (0, n.propertyInData)(g, w, T, P.opts.ownProperties);
        d.setParams({
          property: T,
          depsCount: S.length,
          deps: S.join(", ")
        }), P.allErrors ? g.if(y, () => {
          for (const _ of S)
            (0, n.checkReportMissingProp)(d, _);
        }) : (g.if((0, e._)`${y} && (${(0, n.checkMissingProp)(d, S, x)})`), (0, n.reportMissingProp)(d, x), g.else());
      }
    }
    t.validatePropertyDeps = l;
    function f(d, p = d.schema) {
      const { gen: g, data: w, keyword: P, it: x } = d, T = g.name("valid");
      for (const S in p)
        (0, r.alwaysValidSchema)(x, p[S]) || (g.if(
          (0, n.propertyInData)(g, w, S, x.opts.ownProperties),
          () => {
            const y = d.subschema({ keyword: P, schemaProp: S }, T);
            d.mergeValidEvaluated(y, T);
          },
          () => g.var(T, !0)
          // TODO var
        ), d.ok(T));
    }
    t.validateSchemaDeps = f, t.default = s;
  }(Oa)), Oa;
}
var Zs = {}, lu;
function Yy() {
  if (lu) return Zs;
  lu = 1, Object.defineProperty(Zs, "__esModule", { value: !0 });
  const t = Me(), e = Ue(), n = {
    keyword: "propertyNames",
    type: "object",
    schemaType: ["object", "boolean"],
    error: {
      message: "property name must be valid",
      params: ({ params: s }) => (0, t._)`{propertyName: ${s.propertyName}}`
    },
    code(s) {
      const { gen: i, schema: l, data: f, it: d } = s;
      if ((0, e.alwaysValidSchema)(d, l))
        return;
      const p = i.name("valid");
      i.forIn("key", f, (g) => {
        s.setParams({ propertyName: g }), s.subschema({
          keyword: "propertyNames",
          data: g,
          dataTypes: ["string"],
          propertyName: g,
          compositeRule: !0
        }, p), i.if((0, t.not)(p), () => {
          s.error(!0), d.allErrors || i.break();
        });
      }), s.ok(p);
    }
  };
  return Zs.default = n, Zs;
}
var Js = {}, cu;
function Eh() {
  if (cu) return Js;
  cu = 1, Object.defineProperty(Js, "__esModule", { value: !0 });
  const t = rr(), e = Me(), r = Dr(), n = Ue(), i = {
    keyword: "additionalProperties",
    type: ["object"],
    schemaType: ["boolean", "object"],
    allowUndefined: !0,
    trackErrors: !0,
    error: {
      message: "must NOT have additional properties",
      params: ({ params: l }) => (0, e._)`{additionalProperty: ${l.additionalProperty}}`
    },
    code(l) {
      const { gen: f, schema: d, parentSchema: p, data: g, errsCount: w, it: P } = l;
      if (!w)
        throw new Error("ajv implementation error");
      const { allErrors: x, opts: T } = P;
      if (P.props = !0, T.removeAdditional !== "all" && (0, n.alwaysValidSchema)(P, d))
        return;
      const S = (0, t.allSchemaProperties)(p.properties), y = (0, t.allSchemaProperties)(p.patternProperties);
      _(), l.ok((0, e._)`${w} === ${r.default.errors}`);
      function _() {
        f.forIn("key", g, (A) => {
          !S.length && !y.length ? $(A) : f.if(m(A), () => $(A));
        });
      }
      function m(A) {
        let j;
        if (S.length > 8) {
          const V = (0, n.schemaRefOrVal)(P, p.properties, "properties");
          j = (0, t.isOwnProperty)(f, V, A);
        } else S.length ? j = (0, e.or)(...S.map((V) => (0, e._)`${A} === ${V}`)) : j = e.nil;
        return y.length && (j = (0, e.or)(j, ...y.map((V) => (0, e._)`${(0, t.usePattern)(l, V)}.test(${A})`))), (0, e.not)(j);
      }
      function b(A) {
        f.code((0, e._)`delete ${g}[${A}]`);
      }
      function $(A) {
        if (T.removeAdditional === "all" || T.removeAdditional && d === !1) {
          b(A);
          return;
        }
        if (d === !1) {
          l.setParams({ additionalProperty: A }), l.error(), x || f.break();
          return;
        }
        if (typeof d == "object" && !(0, n.alwaysValidSchema)(P, d)) {
          const j = f.name("valid");
          T.removeAdditional === "failing" ? (O(A, j, !1), f.if((0, e.not)(j), () => {
            l.reset(), b(A);
          })) : (O(A, j), x || f.if((0, e.not)(j), () => f.break()));
        }
      }
      function O(A, j, V) {
        const G = {
          keyword: "additionalProperties",
          dataProp: A,
          dataPropType: n.Type.Str
        };
        V === !1 && Object.assign(G, {
          compositeRule: !0,
          createErrors: !1,
          allErrors: !1
        }), l.subschema(G, j);
      }
    }
  };
  return Js.default = i, Js;
}
var Ws = {}, uu;
function Xy() {
  if (uu) return Ws;
  uu = 1, Object.defineProperty(Ws, "__esModule", { value: !0 });
  const t = Ji(), e = rr(), r = Ue(), n = Eh(), s = {
    keyword: "properties",
    type: "object",
    schemaType: "object",
    code(i) {
      const { gen: l, schema: f, parentSchema: d, data: p, it: g } = i;
      g.opts.removeAdditional === "all" && d.additionalProperties === void 0 && n.default.code(new t.KeywordCxt(g, n.default, "additionalProperties"));
      const w = (0, e.allSchemaProperties)(f);
      for (const y of w)
        g.definedProperties.add(y);
      g.opts.unevaluated && w.length && g.props !== !0 && (g.props = r.mergeEvaluated.props(l, (0, r.toHash)(w), g.props));
      const P = w.filter((y) => !(0, r.alwaysValidSchema)(g, f[y]));
      if (P.length === 0)
        return;
      const x = l.name("valid");
      for (const y of P)
        T(y) ? S(y) : (l.if((0, e.propertyInData)(l, p, y, g.opts.ownProperties)), S(y), g.allErrors || l.else().var(x, !0), l.endIf()), i.it.definedProperties.add(y), i.ok(x);
      function T(y) {
        return g.opts.useDefaults && !g.compositeRule && f[y].default !== void 0;
      }
      function S(y) {
        i.subschema({
          keyword: "properties",
          schemaProp: y,
          dataProp: y
        }, x);
      }
    }
  };
  return Ws.default = s, Ws;
}
var Ks = {}, fu;
function Qy() {
  if (fu) return Ks;
  fu = 1, Object.defineProperty(Ks, "__esModule", { value: !0 });
  const t = rr(), e = Me(), r = Ue(), n = Ue(), s = {
    keyword: "patternProperties",
    type: "object",
    schemaType: "object",
    code(i) {
      const { gen: l, schema: f, data: d, parentSchema: p, it: g } = i, { opts: w } = g, P = (0, t.allSchemaProperties)(f), x = P.filter(($) => (0, r.alwaysValidSchema)(g, f[$]));
      if (P.length === 0 || x.length === P.length && (!g.opts.unevaluated || g.props === !0))
        return;
      const T = w.strictSchema && !w.allowMatchingProperties && p.properties, S = l.name("valid");
      g.props !== !0 && !(g.props instanceof e.Name) && (g.props = (0, n.evaluatedPropsToName)(l, g.props));
      const { props: y } = g;
      _();
      function _() {
        for (const $ of P)
          T && m($), g.allErrors ? b($) : (l.var(S, !0), b($), l.if(S));
      }
      function m($) {
        for (const O in T)
          new RegExp($).test(O) && (0, r.checkStrictMode)(g, `property ${O} matches pattern ${$} (use allowMatchingProperties)`);
      }
      function b($) {
        l.forIn("key", d, (O) => {
          l.if((0, e._)`${(0, t.usePattern)(i, $)}.test(${O})`, () => {
            const A = x.includes($);
            A || i.subschema({
              keyword: "patternProperties",
              schemaProp: $,
              dataProp: O,
              dataPropType: n.Type.Str
            }, S), g.opts.unevaluated && y !== !0 ? l.assign((0, e._)`${y}[${O}]`, !0) : !A && !g.allErrors && l.if((0, e.not)(S), () => l.break());
          });
        });
      }
    }
  };
  return Ks.default = s, Ks;
}
var Gs = {}, hu;
function Hy() {
  if (hu) return Gs;
  hu = 1, Object.defineProperty(Gs, "__esModule", { value: !0 });
  const t = Ue(), e = {
    keyword: "not",
    schemaType: ["object", "boolean"],
    trackErrors: !0,
    code(r) {
      const { gen: n, schema: s, it: i } = r;
      if ((0, t.alwaysValidSchema)(i, s)) {
        r.fail();
        return;
      }
      const l = n.name("valid");
      r.subschema({
        keyword: "not",
        compositeRule: !0,
        createErrors: !1,
        allErrors: !1
      }, l), r.failResult(l, () => r.reset(), () => r.error());
    },
    error: { message: "must NOT be valid" }
  };
  return Gs.default = e, Gs;
}
var Ys = {}, du;
function ew() {
  if (du) return Ys;
  du = 1, Object.defineProperty(Ys, "__esModule", { value: !0 });
  const e = {
    keyword: "anyOf",
    schemaType: "array",
    trackErrors: !0,
    code: rr().validateUnion,
    error: { message: "must match a schema in anyOf" }
  };
  return Ys.default = e, Ys;
}
var Xs = {}, mu;
function tw() {
  if (mu) return Xs;
  mu = 1, Object.defineProperty(Xs, "__esModule", { value: !0 });
  const t = Me(), e = Ue(), n = {
    keyword: "oneOf",
    schemaType: "array",
    trackErrors: !0,
    error: {
      message: "must match exactly one schema in oneOf",
      params: ({ params: s }) => (0, t._)`{passingSchemas: ${s.passing}}`
    },
    code(s) {
      const { gen: i, schema: l, parentSchema: f, it: d } = s;
      if (!Array.isArray(l))
        throw new Error("ajv implementation error");
      if (d.opts.discriminator && f.discriminator)
        return;
      const p = l, g = i.let("valid", !1), w = i.let("passing", null), P = i.name("_valid");
      s.setParams({ passing: w }), i.block(x), s.result(g, () => s.reset(), () => s.error(!0));
      function x() {
        p.forEach((T, S) => {
          let y;
          (0, e.alwaysValidSchema)(d, T) ? i.var(P, !0) : y = s.subschema({
            keyword: "oneOf",
            schemaProp: S,
            compositeRule: !0
          }, P), S > 0 && i.if((0, t._)`${P} && ${g}`).assign(g, !1).assign(w, (0, t._)`[${w}, ${S}]`).else(), i.if(P, () => {
            i.assign(g, !0), i.assign(w, S), y && s.mergeEvaluated(y, t.Name);
          });
        });
      }
    }
  };
  return Xs.default = n, Xs;
}
var Qs = {}, pu;
function rw() {
  if (pu) return Qs;
  pu = 1, Object.defineProperty(Qs, "__esModule", { value: !0 });
  const t = Ue(), e = {
    keyword: "allOf",
    schemaType: "array",
    code(r) {
      const { gen: n, schema: s, it: i } = r;
      if (!Array.isArray(s))
        throw new Error("ajv implementation error");
      const l = n.name("valid");
      s.forEach((f, d) => {
        if ((0, t.alwaysValidSchema)(i, f))
          return;
        const p = r.subschema({ keyword: "allOf", schemaProp: d }, l);
        r.ok(l), r.mergeEvaluated(p);
      });
    }
  };
  return Qs.default = e, Qs;
}
var Hs = {}, gu;
function nw() {
  if (gu) return Hs;
  gu = 1, Object.defineProperty(Hs, "__esModule", { value: !0 });
  const t = Me(), e = Ue(), n = {
    keyword: "if",
    schemaType: ["object", "boolean"],
    trackErrors: !0,
    error: {
      message: ({ params: i }) => (0, t.str)`must match "${i.ifClause}" schema`,
      params: ({ params: i }) => (0, t._)`{failingKeyword: ${i.ifClause}}`
    },
    code(i) {
      const { gen: l, parentSchema: f, it: d } = i;
      f.then === void 0 && f.else === void 0 && (0, e.checkStrictMode)(d, '"if" without "then" and "else" is ignored');
      const p = s(d, "then"), g = s(d, "else");
      if (!p && !g)
        return;
      const w = l.let("valid", !0), P = l.name("_valid");
      if (x(), i.reset(), p && g) {
        const S = l.let("ifClause");
        i.setParams({ ifClause: S }), l.if(P, T("then", S), T("else", S));
      } else p ? l.if(P, T("then")) : l.if((0, t.not)(P), T("else"));
      i.pass(w, () => i.error(!0));
      function x() {
        const S = i.subschema({
          keyword: "if",
          compositeRule: !0,
          createErrors: !1,
          allErrors: !1
        }, P);
        i.mergeEvaluated(S);
      }
      function T(S, y) {
        return () => {
          const _ = i.subschema({ keyword: S }, P);
          l.assign(w, P), i.mergeValidEvaluated(_, w), y ? l.assign(y, (0, t._)`${S}`) : i.setParams({ ifClause: S });
        };
      }
    }
  };
  function s(i, l) {
    const f = i.schema[l];
    return f !== void 0 && !(0, e.alwaysValidSchema)(i, f);
  }
  return Hs.default = n, Hs;
}
var ei = {}, yu;
function sw() {
  if (yu) return ei;
  yu = 1, Object.defineProperty(ei, "__esModule", { value: !0 });
  const t = Ue(), e = {
    keyword: ["then", "else"],
    schemaType: ["object", "boolean"],
    code({ keyword: r, parentSchema: n, it: s }) {
      n.if === void 0 && (0, t.checkStrictMode)(s, `"${r}" without "if" is ignored`);
    }
  };
  return ei.default = e, ei;
}
var wu;
function iw() {
  if (wu) return Vs;
  wu = 1, Object.defineProperty(Vs, "__esModule", { value: !0 });
  const t = bh(), e = Jy(), r = Sh(), n = Wy(), s = Ky(), i = Gy(), l = Yy(), f = Eh(), d = Xy(), p = Qy(), g = Hy(), w = ew(), P = tw(), x = rw(), T = nw(), S = sw();
  function y(_ = !1) {
    const m = [
      // any
      g.default,
      w.default,
      P.default,
      x.default,
      T.default,
      S.default,
      // object
      l.default,
      f.default,
      i.default,
      d.default,
      p.default
    ];
    return _ ? m.push(e.default, n.default) : m.push(t.default, r.default), m.push(s.default), m;
  }
  return Vs.default = y, Vs;
}
var ti = {}, ri = {}, _u;
function aw() {
  if (_u) return ri;
  _u = 1, Object.defineProperty(ri, "__esModule", { value: !0 });
  const t = Me(), r = {
    keyword: "format",
    type: ["number", "string"],
    schemaType: "string",
    $data: !0,
    error: {
      message: ({ schemaCode: n }) => (0, t.str)`must match format "${n}"`,
      params: ({ schemaCode: n }) => (0, t._)`{format: ${n}}`
    },
    code(n, s) {
      const { gen: i, data: l, $data: f, schema: d, schemaCode: p, it: g } = n, { opts: w, errSchemaPath: P, schemaEnv: x, self: T } = g;
      if (!w.validateFormats)
        return;
      f ? S() : y();
      function S() {
        const _ = i.scopeValue("formats", {
          ref: T.formats,
          code: w.code.formats
        }), m = i.const("fDef", (0, t._)`${_}[${p}]`), b = i.let("fType"), $ = i.let("format");
        i.if((0, t._)`typeof ${m} == "object" && !(${m} instanceof RegExp)`, () => i.assign(b, (0, t._)`${m}.type || "string"`).assign($, (0, t._)`${m}.validate`), () => i.assign(b, (0, t._)`"string"`).assign($, m)), n.fail$data((0, t.or)(O(), A()));
        function O() {
          return w.strictSchema === !1 ? t.nil : (0, t._)`${p} && !${$}`;
        }
        function A() {
          const j = x.$async ? (0, t._)`(${m}.async ? await ${$}(${l}) : ${$}(${l}))` : (0, t._)`${$}(${l})`, V = (0, t._)`(typeof ${$} == "function" ? ${j} : ${$}.test(${l}))`;
          return (0, t._)`${$} && ${$} !== true && ${b} === ${s} && !${V}`;
        }
      }
      function y() {
        const _ = T.formats[d];
        if (!_) {
          O();
          return;
        }
        if (_ === !0)
          return;
        const [m, b, $] = A(_);
        m === s && n.pass(j());
        function O() {
          if (w.strictSchema === !1) {
            T.logger.warn(V());
            return;
          }
          throw new Error(V());
          function V() {
            return `unknown format "${d}" ignored in schema at path "${P}"`;
          }
        }
        function A(V) {
          const G = V instanceof RegExp ? (0, t.regexpCode)(V) : w.code.formats ? (0, t._)`${w.code.formats}${(0, t.getProperty)(d)}` : void 0, H = i.scopeValue("formats", { key: d, ref: V, code: G });
          return typeof V == "object" && !(V instanceof RegExp) ? [V.type || "string", V.validate, (0, t._)`${H}.validate`] : ["string", V, H];
        }
        function j() {
          if (typeof _ == "object" && !(_ instanceof RegExp) && _.async) {
            if (!x.$async)
              throw new Error("async format in sync schema");
            return (0, t._)`await ${$}(${l})`;
          }
          return typeof b == "function" ? (0, t._)`${$}(${l})` : (0, t._)`${$}.test(${l})`;
        }
      }
    }
  };
  return ri.default = r, ri;
}
var vu;
function ow() {
  if (vu) return ti;
  vu = 1, Object.defineProperty(ti, "__esModule", { value: !0 });
  const e = [aw().default];
  return ti.default = e, ti;
}
var Zr = {}, bu;
function lw() {
  return bu || (bu = 1, Object.defineProperty(Zr, "__esModule", { value: !0 }), Zr.contentVocabulary = Zr.metadataVocabulary = void 0, Zr.metadataVocabulary = [
    "title",
    "description",
    "default",
    "deprecated",
    "readOnly",
    "writeOnly",
    "examples"
  ], Zr.contentVocabulary = [
    "contentMediaType",
    "contentEncoding",
    "contentSchema"
  ]), Zr;
}
var Su;
function cw() {
  if (Su) return xs;
  Su = 1, Object.defineProperty(xs, "__esModule", { value: !0 });
  const t = Ny(), e = Zy(), r = iw(), n = ow(), s = lw(), i = [
    t.default,
    e.default,
    (0, r.default)(),
    n.default,
    s.metadataVocabulary,
    s.contentVocabulary
  ];
  return xs.default = i, xs;
}
var ni = {}, In = {}, Eu;
function uw() {
  if (Eu) return In;
  Eu = 1, Object.defineProperty(In, "__esModule", { value: !0 }), In.DiscrError = void 0;
  var t;
  return function(e) {
    e.Tag = "tag", e.Mapping = "mapping";
  }(t || (In.DiscrError = t = {})), In;
}
var $u;
function fw() {
  if ($u) return ni;
  $u = 1, Object.defineProperty(ni, "__esModule", { value: !0 });
  const t = Me(), e = uw(), r = tl(), n = Wi(), s = Ue(), l = {
    keyword: "discriminator",
    type: "object",
    schemaType: "object",
    error: {
      message: ({ params: { discrError: f, tagName: d } }) => f === e.DiscrError.Tag ? `tag "${d}" must be string` : `value of tag "${d}" must be in oneOf`,
      params: ({ params: { discrError: f, tag: d, tagName: p } }) => (0, t._)`{error: ${f}, tag: ${p}, tagValue: ${d}}`
    },
    code(f) {
      const { gen: d, data: p, schema: g, parentSchema: w, it: P } = f, { oneOf: x } = w;
      if (!P.opts.discriminator)
        throw new Error("discriminator: requires discriminator option");
      const T = g.propertyName;
      if (typeof T != "string")
        throw new Error("discriminator: requires propertyName");
      if (g.mapping)
        throw new Error("discriminator: mapping is not supported");
      if (!x)
        throw new Error("discriminator: requires oneOf keyword");
      const S = d.let("valid", !1), y = d.const("tag", (0, t._)`${p}${(0, t.getProperty)(T)}`);
      d.if((0, t._)`typeof ${y} == "string"`, () => _(), () => f.error(!1, { discrError: e.DiscrError.Tag, tag: y, tagName: T })), f.ok(S);
      function _() {
        const $ = b();
        d.if(!1);
        for (const O in $)
          d.elseIf((0, t._)`${y} === ${O}`), d.assign(S, m($[O]));
        d.else(), f.error(!1, { discrError: e.DiscrError.Mapping, tag: y, tagName: T }), d.endIf();
      }
      function m($) {
        const O = d.name("valid"), A = f.subschema({ keyword: "oneOf", schemaProp: $ }, O);
        return f.mergeEvaluated(A, t.Name), O;
      }
      function b() {
        var $;
        const O = {}, A = V(w);
        let j = !0;
        for (let ee = 0; ee < x.length; ee++) {
          let ye = x[ee];
          if (ye != null && ye.$ref && !(0, s.schemaHasRulesButRef)(ye, P.self.RULES)) {
            const ke = ye.$ref;
            if (ye = r.resolveRef.call(P.self, P.schemaEnv.root, P.baseId, ke), ye instanceof r.SchemaEnv && (ye = ye.schema), ye === void 0)
              throw new n.default(P.opts.uriResolver, P.baseId, ke);
          }
          const ge = ($ = ye == null ? void 0 : ye.properties) === null || $ === void 0 ? void 0 : $[T];
          if (typeof ge != "object")
            throw new Error(`discriminator: oneOf subschemas (or referenced schemas) must have "properties/${T}"`);
          j = j && (A || V(ye)), G(ge, ee);
        }
        if (!j)
          throw new Error(`discriminator: "${T}" must be required`);
        return O;
        function V({ required: ee }) {
          return Array.isArray(ee) && ee.includes(T);
        }
        function G(ee, ye) {
          if (ee.const)
            H(ee.const, ye);
          else if (ee.enum)
            for (const ge of ee.enum)
              H(ge, ye);
          else
            throw new Error(`discriminator: "properties/${T}" must have "const" or "enum"`);
        }
        function H(ee, ye) {
          if (typeof ee != "string" || ee in O)
            throw new Error(`discriminator: "${T}" values must be unique strings`);
          O[ee] = ye;
        }
      }
    }
  };
  return ni.default = l, ni;
}
const hw = "http://json-schema.org/draft-07/schema#", dw = "http://json-schema.org/draft-07/schema#", mw = "Core schema meta-schema", pw = { schemaArray: { type: "array", minItems: 1, items: { $ref: "#" } }, nonNegativeInteger: { type: "integer", minimum: 0 }, nonNegativeIntegerDefault0: { allOf: [{ $ref: "#/definitions/nonNegativeInteger" }, { default: 0 }] }, simpleTypes: { enum: ["array", "boolean", "integer", "null", "number", "object", "string"] }, stringArray: { type: "array", items: { type: "string" }, uniqueItems: !0, default: [] } }, gw = ["object", "boolean"], yw = { $id: { type: "string", format: "uri-reference" }, $schema: { type: "string", format: "uri" }, $ref: { type: "string", format: "uri-reference" }, $comment: { type: "string" }, title: { type: "string" }, description: { type: "string" }, default: !0, readOnly: { type: "boolean", default: !1 }, examples: { type: "array", items: !0 }, multipleOf: { type: "number", exclusiveMinimum: 0 }, maximum: { type: "number" }, exclusiveMaximum: { type: "number" }, minimum: { type: "number" }, exclusiveMinimum: { type: "number" }, maxLength: { $ref: "#/definitions/nonNegativeInteger" }, minLength: { $ref: "#/definitions/nonNegativeIntegerDefault0" }, pattern: { type: "string", format: "regex" }, additionalItems: { $ref: "#" }, items: { anyOf: [{ $ref: "#" }, { $ref: "#/definitions/schemaArray" }], default: !0 }, maxItems: { $ref: "#/definitions/nonNegativeInteger" }, minItems: { $ref: "#/definitions/nonNegativeIntegerDefault0" }, uniqueItems: { type: "boolean", default: !1 }, contains: { $ref: "#" }, maxProperties: { $ref: "#/definitions/nonNegativeInteger" }, minProperties: { $ref: "#/definitions/nonNegativeIntegerDefault0" }, required: { $ref: "#/definitions/stringArray" }, additionalProperties: { $ref: "#" }, definitions: { type: "object", additionalProperties: { $ref: "#" }, default: {} }, properties: { type: "object", additionalProperties: { $ref: "#" }, default: {} }, patternProperties: { type: "object", additionalProperties: { $ref: "#" }, propertyNames: { format: "regex" }, default: {} }, dependencies: { type: "object", additionalProperties: { anyOf: [{ $ref: "#" }, { $ref: "#/definitions/stringArray" }] } }, propertyNames: { $ref: "#" }, const: !0, enum: { type: "array", items: !0, minItems: 1, uniqueItems: !0 }, type: { anyOf: [{ $ref: "#/definitions/simpleTypes" }, { type: "array", items: { $ref: "#/definitions/simpleTypes" }, minItems: 1, uniqueItems: !0 }] }, format: { type: "string" }, contentMediaType: { type: "string" }, contentEncoding: { type: "string" }, if: { $ref: "#" }, then: { $ref: "#" }, else: { $ref: "#" }, allOf: { $ref: "#/definitions/schemaArray" }, anyOf: { $ref: "#/definitions/schemaArray" }, oneOf: { $ref: "#/definitions/schemaArray" }, not: { $ref: "#" } }, ww = {
  $schema: hw,
  $id: dw,
  title: mw,
  definitions: pw,
  type: gw,
  properties: yw,
  default: !0
};
var xu;
function _w() {
  return xu || (xu = 1, function(t, e) {
    Object.defineProperty(e, "__esModule", { value: !0 }), e.MissingRefError = e.ValidationError = e.CodeGen = e.Name = e.nil = e.stringify = e.str = e._ = e.KeywordCxt = e.Ajv = void 0;
    const r = Ry(), n = cw(), s = fw(), i = ww, l = ["/properties"], f = "http://json-schema.org/draft-07/schema";
    class d extends r.default {
      _addVocabularies() {
        super._addVocabularies(), n.default.forEach((T) => this.addVocabulary(T)), this.opts.discriminator && this.addKeyword(s.default);
      }
      _addDefaultMetaSchema() {
        if (super._addDefaultMetaSchema(), !this.opts.meta)
          return;
        const T = this.opts.$data ? this.$dataMetaSchema(i, l) : i;
        this.addMetaSchema(T, f, !1), this.refs["http://json-schema.org/schema"] = f;
      }
      defaultMeta() {
        return this.opts.defaultMeta = super.defaultMeta() || (this.getSchema(f) ? f : void 0);
      }
    }
    e.Ajv = d, t.exports = e = d, t.exports.Ajv = d, Object.defineProperty(e, "__esModule", { value: !0 }), e.default = d;
    var p = Ji();
    Object.defineProperty(e, "KeywordCxt", { enumerable: !0, get: function() {
      return p.KeywordCxt;
    } });
    var g = Me();
    Object.defineProperty(e, "_", { enumerable: !0, get: function() {
      return g._;
    } }), Object.defineProperty(e, "str", { enumerable: !0, get: function() {
      return g.str;
    } }), Object.defineProperty(e, "stringify", { enumerable: !0, get: function() {
      return g.stringify;
    } }), Object.defineProperty(e, "nil", { enumerable: !0, get: function() {
      return g.nil;
    } }), Object.defineProperty(e, "Name", { enumerable: !0, get: function() {
      return g.Name;
    } }), Object.defineProperty(e, "CodeGen", { enumerable: !0, get: function() {
      return g.CodeGen;
    } });
    var w = el();
    Object.defineProperty(e, "ValidationError", { enumerable: !0, get: function() {
      return w.default;
    } });
    var P = Wi();
    Object.defineProperty(e, "MissingRefError", { enumerable: !0, get: function() {
      return P.default;
    } });
  }(vs, vs.exports)), vs.exports;
}
var vw = _w();
const bw = /* @__PURE__ */ zi(vw), Sw = Symbol("Let zodToJsonSchema decide on which parser to use"), Ew = {
  name: void 0,
  $refStrategy: "root",
  basePath: ["#"],
  effectStrategy: "input",
  pipeStrategy: "all",
  dateStrategy: "format:date-time",
  mapStrategy: "entries",
  removeAdditionalStrategy: "passthrough",
  allowedAdditionalProperties: !0,
  rejectedAdditionalProperties: !1,
  definitionPath: "definitions",
  target: "jsonSchema7",
  strictUnions: !1,
  definitions: {},
  errorMessages: !1,
  markdownDescription: !1,
  patternStrategy: "escape",
  applyRegexFlags: !1,
  emailStrategy: "format:email",
  base64Strategy: "contentEncoding:base64",
  nameStrategy: "ref"
}, $w = (t) => ({
  ...Ew,
  ...t
}), xw = (t) => {
  const e = $w(t), r = e.name !== void 0 ? [...e.basePath, e.definitionPath, e.name] : e.basePath;
  return {
    ...e,
    currentPath: r,
    propertyPath: void 0,
    seen: new Map(Object.entries(e.definitions).map(([n, s]) => [
      s._def,
      {
        def: s._def,
        path: [...e.basePath, e.definitionPath, n],
        // Resolution of references will be forced even though seen, so it's ok that the schema is undefined here for now.
        jsonSchema: void 0
      }
    ]))
  };
};
function $h(t, e, r, n) {
  n != null && n.errorMessages && r && (t.errorMessage = {
    ...t.errorMessage,
    [e]: r
  });
}
function We(t, e, r, n, s) {
  t[e] = r, $h(t, e, n, s);
}
function kw() {
  return {};
}
function Aw(t, e) {
  var n, s, i;
  const r = {
    type: "array"
  };
  return (n = t.type) != null && n._def && ((i = (s = t.type) == null ? void 0 : s._def) == null ? void 0 : i.typeName) !== oe.ZodAny && (r.items = Be(t.type._def, {
    ...e,
    currentPath: [...e.currentPath, "items"]
  })), t.minLength && We(r, "minItems", t.minLength.value, t.minLength.message, e), t.maxLength && We(r, "maxItems", t.maxLength.value, t.maxLength.message, e), t.exactLength && (We(r, "minItems", t.exactLength.value, t.exactLength.message, e), We(r, "maxItems", t.exactLength.value, t.exactLength.message, e)), r;
}
function Pw(t, e) {
  const r = {
    type: "integer",
    format: "int64"
  };
  if (!t.checks)
    return r;
  for (const n of t.checks)
    switch (n.kind) {
      case "min":
        e.target === "jsonSchema7" ? n.inclusive ? We(r, "minimum", n.value, n.message, e) : We(r, "exclusiveMinimum", n.value, n.message, e) : (n.inclusive || (r.exclusiveMinimum = !0), We(r, "minimum", n.value, n.message, e));
        break;
      case "max":
        e.target === "jsonSchema7" ? n.inclusive ? We(r, "maximum", n.value, n.message, e) : We(r, "exclusiveMaximum", n.value, n.message, e) : (n.inclusive || (r.exclusiveMaximum = !0), We(r, "maximum", n.value, n.message, e));
        break;
      case "multipleOf":
        We(r, "multipleOf", n.value, n.message, e);
        break;
    }
  return r;
}
function Cw() {
  return {
    type: "boolean"
  };
}
function xh(t, e) {
  return Be(t.type._def, e);
}
const Rw = (t, e) => Be(t.innerType._def, e);
function kh(t, e, r) {
  const n = r ?? e.dateStrategy;
  if (Array.isArray(n))
    return {
      anyOf: n.map((s, i) => kh(t, e, s))
    };
  switch (n) {
    case "string":
    case "format:date-time":
      return {
        type: "string",
        format: "date-time"
      };
    case "format:date":
      return {
        type: "string",
        format: "date"
      };
    case "integer":
      return Tw(t, e);
  }
}
const Tw = (t, e) => {
  const r = {
    type: "integer",
    format: "unix-time"
  };
  if (e.target === "openApi3")
    return r;
  for (const n of t.checks)
    switch (n.kind) {
      case "min":
        We(
          r,
          "minimum",
          n.value,
          // This is in milliseconds
          n.message,
          e
        );
        break;
      case "max":
        We(
          r,
          "maximum",
          n.value,
          // This is in milliseconds
          n.message,
          e
        );
        break;
    }
  return r;
};
function Ow(t, e) {
  return {
    ...Be(t.innerType._def, e),
    default: t.defaultValue()
  };
}
function Nw(t, e) {
  return e.effectStrategy === "input" ? Be(t.schema._def, e) : {};
}
function Iw(t) {
  return {
    type: "string",
    enum: Array.from(t.values)
  };
}
const jw = (t) => "type" in t && t.type === "string" ? !1 : "allOf" in t;
function Mw(t, e) {
  const r = [
    Be(t.left._def, {
      ...e,
      currentPath: [...e.currentPath, "allOf", "0"]
    }),
    Be(t.right._def, {
      ...e,
      currentPath: [...e.currentPath, "allOf", "1"]
    })
  ].filter((i) => !!i);
  let n = e.target === "jsonSchema2019-09" ? { unevaluatedProperties: !1 } : void 0;
  const s = [];
  return r.forEach((i) => {
    if (jw(i))
      s.push(...i.allOf), i.unevaluatedProperties === void 0 && (n = void 0);
    else {
      let l = i;
      if ("additionalProperties" in i && i.additionalProperties === !1) {
        const { additionalProperties: f, ...d } = i;
        l = d;
      } else
        n = void 0;
      s.push(l);
    }
  }), s.length ? {
    allOf: s,
    ...n
  } : void 0;
}
function Fw(t, e) {
  const r = typeof t.value;
  return r !== "bigint" && r !== "number" && r !== "boolean" && r !== "string" ? {
    type: Array.isArray(t.value) ? "array" : "object"
  } : e.target === "openApi3" ? {
    type: r === "bigint" ? "integer" : r,
    enum: [t.value]
  } : {
    type: r === "bigint" ? "integer" : r,
    const: t.value
  };
}
let Na;
const Yt = {
  /**
   * `c` was changed to `[cC]` to replicate /i flag
   */
  cuid: /^[cC][^\s-]{8,}$/,
  cuid2: /^[0-9a-z]+$/,
  ulid: /^[0-9A-HJKMNP-TV-Z]{26}$/,
  /**
   * `a-z` was added to replicate /i flag
   */
  email: /^(?!\.)(?!.*\.\.)([a-zA-Z0-9_'+\-\.]*)[a-zA-Z0-9_+-]@([a-zA-Z0-9][a-zA-Z0-9\-]*\.)+[a-zA-Z]{2,}$/,
  /**
   * Constructed a valid Unicode RegExp
   *
   * Lazily instantiate since this type of regex isn't supported
   * in all envs (e.g. React Native).
   *
   * See:
   * https://github.com/colinhacks/zod/issues/2433
   * Fix in Zod:
   * https://github.com/colinhacks/zod/commit/9340fd51e48576a75adc919bff65dbc4a5d4c99b
   */
  emoji: () => (Na === void 0 && (Na = RegExp("^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$", "u")), Na),
  /**
   * Unused
   */
  uuid: /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/,
  /**
   * Unused
   */
  ipv4: /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/,
  ipv4Cidr: /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/,
  /**
   * Unused
   */
  ipv6: /^(([a-f0-9]{1,4}:){7}|::([a-f0-9]{1,4}:){0,6}|([a-f0-9]{1,4}:){1}:([a-f0-9]{1,4}:){0,5}|([a-f0-9]{1,4}:){2}:([a-f0-9]{1,4}:){0,4}|([a-f0-9]{1,4}:){3}:([a-f0-9]{1,4}:){0,3}|([a-f0-9]{1,4}:){4}:([a-f0-9]{1,4}:){0,2}|([a-f0-9]{1,4}:){5}:([a-f0-9]{1,4}:){0,1})([a-f0-9]{1,4}|(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2})))$/,
  ipv6Cidr: /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/,
  base64: /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/,
  base64url: /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/,
  nanoid: /^[a-zA-Z0-9_-]{21}$/,
  jwt: /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/
};
function Ah(t, e) {
  const r = {
    type: "string"
  };
  if (t.checks)
    for (const n of t.checks)
      switch (n.kind) {
        case "min":
          We(r, "minLength", typeof r.minLength == "number" ? Math.max(r.minLength, n.value) : n.value, n.message, e);
          break;
        case "max":
          We(r, "maxLength", typeof r.maxLength == "number" ? Math.min(r.maxLength, n.value) : n.value, n.message, e);
          break;
        case "email":
          switch (e.emailStrategy) {
            case "format:email":
              Xt(r, "email", n.message, e);
              break;
            case "format:idn-email":
              Xt(r, "idn-email", n.message, e);
              break;
            case "pattern:zod":
              Rt(r, Yt.email, n.message, e);
              break;
          }
          break;
        case "url":
          Xt(r, "uri", n.message, e);
          break;
        case "uuid":
          Xt(r, "uuid", n.message, e);
          break;
        case "regex":
          Rt(r, n.regex, n.message, e);
          break;
        case "cuid":
          Rt(r, Yt.cuid, n.message, e);
          break;
        case "cuid2":
          Rt(r, Yt.cuid2, n.message, e);
          break;
        case "startsWith":
          Rt(r, RegExp(`^${Ia(n.value, e)}`), n.message, e);
          break;
        case "endsWith":
          Rt(r, RegExp(`${Ia(n.value, e)}$`), n.message, e);
          break;
        case "datetime":
          Xt(r, "date-time", n.message, e);
          break;
        case "date":
          Xt(r, "date", n.message, e);
          break;
        case "time":
          Xt(r, "time", n.message, e);
          break;
        case "duration":
          Xt(r, "duration", n.message, e);
          break;
        case "length":
          We(r, "minLength", typeof r.minLength == "number" ? Math.max(r.minLength, n.value) : n.value, n.message, e), We(r, "maxLength", typeof r.maxLength == "number" ? Math.min(r.maxLength, n.value) : n.value, n.message, e);
          break;
        case "includes": {
          Rt(r, RegExp(Ia(n.value, e)), n.message, e);
          break;
        }
        case "ip": {
          n.version !== "v6" && Xt(r, "ipv4", n.message, e), n.version !== "v4" && Xt(r, "ipv6", n.message, e);
          break;
        }
        case "base64url":
          Rt(r, Yt.base64url, n.message, e);
          break;
        case "jwt":
          Rt(r, Yt.jwt, n.message, e);
          break;
        case "cidr": {
          n.version !== "v6" && Rt(r, Yt.ipv4Cidr, n.message, e), n.version !== "v4" && Rt(r, Yt.ipv6Cidr, n.message, e);
          break;
        }
        case "emoji":
          Rt(r, Yt.emoji(), n.message, e);
          break;
        case "ulid": {
          Rt(r, Yt.ulid, n.message, e);
          break;
        }
        case "base64": {
          switch (e.base64Strategy) {
            case "format:binary": {
              Xt(r, "binary", n.message, e);
              break;
            }
            case "contentEncoding:base64": {
              We(r, "contentEncoding", "base64", n.message, e);
              break;
            }
            case "pattern:zod": {
              Rt(r, Yt.base64, n.message, e);
              break;
            }
          }
          break;
        }
        case "nanoid":
          Rt(r, Yt.nanoid, n.message, e);
      }
  return r;
}
function Ia(t, e) {
  return e.patternStrategy === "escape" ? qw(t) : t;
}
const Dw = new Set("ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvxyz0123456789");
function qw(t) {
  let e = "";
  for (let r = 0; r < t.length; r++)
    Dw.has(t[r]) || (e += "\\"), e += t[r];
  return e;
}
function Xt(t, e, r, n) {
  var s;
  t.format || (s = t.anyOf) != null && s.some((i) => i.format) ? (t.anyOf || (t.anyOf = []), t.format && (t.anyOf.push({
    format: t.format,
    ...t.errorMessage && n.errorMessages && {
      errorMessage: { format: t.errorMessage.format }
    }
  }), delete t.format, t.errorMessage && (delete t.errorMessage.format, Object.keys(t.errorMessage).length === 0 && delete t.errorMessage)), t.anyOf.push({
    format: e,
    ...r && n.errorMessages && { errorMessage: { format: r } }
  })) : We(t, "format", e, r, n);
}
function Rt(t, e, r, n) {
  var s;
  t.pattern || (s = t.allOf) != null && s.some((i) => i.pattern) ? (t.allOf || (t.allOf = []), t.pattern && (t.allOf.push({
    pattern: t.pattern,
    ...t.errorMessage && n.errorMessages && {
      errorMessage: { pattern: t.errorMessage.pattern }
    }
  }), delete t.pattern, t.errorMessage && (delete t.errorMessage.pattern, Object.keys(t.errorMessage).length === 0 && delete t.errorMessage)), t.allOf.push({
    pattern: ku(e, n),
    ...r && n.errorMessages && { errorMessage: { pattern: r } }
  })) : We(t, "pattern", ku(e, n), r, n);
}
function ku(t, e) {
  var d;
  if (!e.applyRegexFlags || !t.flags)
    return t.source;
  const r = {
    i: t.flags.includes("i"),
    m: t.flags.includes("m"),
    s: t.flags.includes("s")
    // `.` matches newlines
  }, n = r.i ? t.source.toLowerCase() : t.source;
  let s = "", i = !1, l = !1, f = !1;
  for (let p = 0; p < n.length; p++) {
    if (i) {
      s += n[p], i = !1;
      continue;
    }
    if (r.i) {
      if (l) {
        if (n[p].match(/[a-z]/)) {
          f ? (s += n[p], s += `${n[p - 2]}-${n[p]}`.toUpperCase(), f = !1) : n[p + 1] === "-" && ((d = n[p + 2]) != null && d.match(/[a-z]/)) ? (s += n[p], f = !0) : s += `${n[p]}${n[p].toUpperCase()}`;
          continue;
        }
      } else if (n[p].match(/[a-z]/)) {
        s += `[${n[p]}${n[p].toUpperCase()}]`;
        continue;
      }
    }
    if (r.m) {
      if (n[p] === "^") {
        s += `(^|(?<=[\r
]))`;
        continue;
      } else if (n[p] === "$") {
        s += `($|(?=[\r
]))`;
        continue;
      }
    }
    if (r.s && n[p] === ".") {
      s += l ? `${n[p]}\r
` : `[${n[p]}\r
]`;
      continue;
    }
    s += n[p], n[p] === "\\" ? i = !0 : l && n[p] === "]" ? l = !1 : !l && n[p] === "[" && (l = !0);
  }
  try {
    new RegExp(s);
  } catch {
    return console.warn(`Could not convert regex pattern at ${e.currentPath.join("/")} to a flag-independent form! Falling back to the flag-ignorant source`), t.source;
  }
  return s;
}
function Ph(t, e) {
  var n, s, i, l, f, d;
  if (e.target === "openAi" && console.warn("Warning: OpenAI may not support records in schemas! Try an array of key-value pairs instead."), e.target === "openApi3" && ((n = t.keyType) == null ? void 0 : n._def.typeName) === oe.ZodEnum)
    return {
      type: "object",
      required: t.keyType._def.values,
      properties: t.keyType._def.values.reduce((p, g) => ({
        ...p,
        [g]: Be(t.valueType._def, {
          ...e,
          currentPath: [...e.currentPath, "properties", g]
        }) ?? {}
      }), {}),
      additionalProperties: e.rejectedAdditionalProperties
    };
  const r = {
    type: "object",
    additionalProperties: Be(t.valueType._def, {
      ...e,
      currentPath: [...e.currentPath, "additionalProperties"]
    }) ?? e.allowedAdditionalProperties
  };
  if (e.target === "openApi3")
    return r;
  if (((s = t.keyType) == null ? void 0 : s._def.typeName) === oe.ZodString && ((i = t.keyType._def.checks) != null && i.length)) {
    const { type: p, ...g } = Ah(t.keyType._def, e);
    return {
      ...r,
      propertyNames: g
    };
  } else {
    if (((l = t.keyType) == null ? void 0 : l._def.typeName) === oe.ZodEnum)
      return {
        ...r,
        propertyNames: {
          enum: t.keyType._def.values
        }
      };
    if (((f = t.keyType) == null ? void 0 : f._def.typeName) === oe.ZodBranded && t.keyType._def.type._def.typeName === oe.ZodString && ((d = t.keyType._def.type._def.checks) != null && d.length)) {
      const { type: p, ...g } = xh(t.keyType._def, e);
      return {
        ...r,
        propertyNames: g
      };
    }
  }
  return r;
}
function Lw(t, e) {
  if (e.mapStrategy === "record")
    return Ph(t, e);
  const r = Be(t.keyType._def, {
    ...e,
    currentPath: [...e.currentPath, "items", "items", "0"]
  }) || {}, n = Be(t.valueType._def, {
    ...e,
    currentPath: [...e.currentPath, "items", "items", "1"]
  }) || {};
  return {
    type: "array",
    maxItems: 125,
    items: {
      type: "array",
      items: [r, n],
      minItems: 2,
      maxItems: 2
    }
  };
}
function Vw(t) {
  const e = t.values, n = Object.keys(t.values).filter((i) => typeof e[e[i]] != "number").map((i) => e[i]), s = Array.from(new Set(n.map((i) => typeof i)));
  return {
    type: s.length === 1 ? s[0] === "string" ? "string" : "number" : ["string", "number"],
    enum: n
  };
}
function Uw() {
  return {
    not: {}
  };
}
function zw(t) {
  return t.target === "openApi3" ? {
    enum: ["null"],
    nullable: !0
  } : {
    type: "null"
  };
}
const Ai = {
  ZodString: "string",
  ZodNumber: "number",
  ZodBigInt: "integer",
  ZodBoolean: "boolean",
  ZodNull: "null"
};
function Bw(t, e) {
  if (e.target === "openApi3")
    return Au(t, e);
  const r = t.options instanceof Map ? Array.from(t.options.values()) : t.options;
  if (r.every((n) => n._def.typeName in Ai && (!n._def.checks || !n._def.checks.length))) {
    const n = r.reduce((s, i) => {
      const l = Ai[i._def.typeName];
      return l && !s.includes(l) ? [...s, l] : s;
    }, []);
    return {
      type: n.length > 1 ? n : n[0]
    };
  } else if (r.every((n) => n._def.typeName === "ZodLiteral" && !n.description)) {
    const n = r.reduce((s, i) => {
      const l = typeof i._def.value;
      switch (l) {
        case "string":
        case "number":
        case "boolean":
          return [...s, l];
        case "bigint":
          return [...s, "integer"];
        case "object":
          if (i._def.value === null)
            return [...s, "null"];
        case "symbol":
        case "undefined":
        case "function":
        default:
          return s;
      }
    }, []);
    if (n.length === r.length) {
      const s = n.filter((i, l, f) => f.indexOf(i) === l);
      return {
        type: s.length > 1 ? s : s[0],
        enum: r.reduce((i, l) => i.includes(l._def.value) ? i : [...i, l._def.value], [])
      };
    }
  } else if (r.every((n) => n._def.typeName === "ZodEnum"))
    return {
      type: "string",
      enum: r.reduce((n, s) => [
        ...n,
        ...s._def.values.filter((i) => !n.includes(i))
      ], [])
    };
  return Au(t, e);
}
const Au = (t, e) => {
  const r = (t.options instanceof Map ? Array.from(t.options.values()) : t.options).map((n, s) => Be(n._def, {
    ...e,
    currentPath: [...e.currentPath, "anyOf", `${s}`]
  })).filter((n) => !!n && (!e.strictUnions || typeof n == "object" && Object.keys(n).length > 0));
  return r.length ? { anyOf: r } : void 0;
};
function Zw(t, e) {
  if (["ZodString", "ZodNumber", "ZodBigInt", "ZodBoolean", "ZodNull"].includes(t.innerType._def.typeName) && (!t.innerType._def.checks || !t.innerType._def.checks.length))
    return e.target === "openApi3" ? {
      type: Ai[t.innerType._def.typeName],
      nullable: !0
    } : {
      type: [
        Ai[t.innerType._def.typeName],
        "null"
      ]
    };
  if (e.target === "openApi3") {
    const n = Be(t.innerType._def, {
      ...e,
      currentPath: [...e.currentPath]
    });
    return n && "$ref" in n ? { allOf: [n], nullable: !0 } : n && { ...n, nullable: !0 };
  }
  const r = Be(t.innerType._def, {
    ...e,
    currentPath: [...e.currentPath, "anyOf", "0"]
  });
  return r && { anyOf: [r, { type: "null" }] };
}
function Jw(t, e) {
  const r = {
    type: "number"
  };
  if (!t.checks)
    return r;
  for (const n of t.checks)
    switch (n.kind) {
      case "int":
        r.type = "integer", $h(r, "type", n.message, e);
        break;
      case "min":
        e.target === "jsonSchema7" ? n.inclusive ? We(r, "minimum", n.value, n.message, e) : We(r, "exclusiveMinimum", n.value, n.message, e) : (n.inclusive || (r.exclusiveMinimum = !0), We(r, "minimum", n.value, n.message, e));
        break;
      case "max":
        e.target === "jsonSchema7" ? n.inclusive ? We(r, "maximum", n.value, n.message, e) : We(r, "exclusiveMaximum", n.value, n.message, e) : (n.inclusive || (r.exclusiveMaximum = !0), We(r, "maximum", n.value, n.message, e));
        break;
      case "multipleOf":
        We(r, "multipleOf", n.value, n.message, e);
        break;
    }
  return r;
}
function Ww(t, e) {
  const r = e.target === "openAi", n = {
    type: "object",
    properties: {}
  }, s = [], i = t.shape();
  for (const f in i) {
    let d = i[f];
    if (d === void 0 || d._def === void 0)
      continue;
    let p = Gw(d);
    p && r && (d instanceof br && (d = d._def.innerType), d.isNullable() || (d = d.nullable()), p = !1);
    const g = Be(d._def, {
      ...e,
      currentPath: [...e.currentPath, "properties", f],
      propertyPath: [...e.currentPath, "properties", f]
    });
    g !== void 0 && (n.properties[f] = g, p || s.push(f));
  }
  s.length && (n.required = s);
  const l = Kw(t, e);
  return l !== void 0 && (n.additionalProperties = l), n;
}
function Kw(t, e) {
  if (t.catchall._def.typeName !== "ZodNever")
    return Be(t.catchall._def, {
      ...e,
      currentPath: [...e.currentPath, "additionalProperties"]
    });
  switch (t.unknownKeys) {
    case "passthrough":
      return e.allowedAdditionalProperties;
    case "strict":
      return e.rejectedAdditionalProperties;
    case "strip":
      return e.removeAdditionalStrategy === "strict" ? e.allowedAdditionalProperties : e.rejectedAdditionalProperties;
  }
}
function Gw(t) {
  try {
    return t.isOptional();
  } catch {
    return !0;
  }
}
const Yw = (t, e) => {
  var n;
  if (e.currentPath.toString() === ((n = e.propertyPath) == null ? void 0 : n.toString()))
    return Be(t.innerType._def, e);
  const r = Be(t.innerType._def, {
    ...e,
    currentPath: [...e.currentPath, "anyOf", "1"]
  });
  return r ? {
    anyOf: [
      {
        not: {}
      },
      r
    ]
  } : {};
}, Xw = (t, e) => {
  if (e.pipeStrategy === "input")
    return Be(t.in._def, e);
  if (e.pipeStrategy === "output")
    return Be(t.out._def, e);
  const r = Be(t.in._def, {
    ...e,
    currentPath: [...e.currentPath, "allOf", "0"]
  }), n = Be(t.out._def, {
    ...e,
    currentPath: [...e.currentPath, "allOf", r ? "1" : "0"]
  });
  return {
    allOf: [r, n].filter((s) => s !== void 0)
  };
};
function Qw(t, e) {
  return Be(t.type._def, e);
}
function Hw(t, e) {
  const n = {
    type: "array",
    uniqueItems: !0,
    items: Be(t.valueType._def, {
      ...e,
      currentPath: [...e.currentPath, "items"]
    })
  };
  return t.minSize && We(n, "minItems", t.minSize.value, t.minSize.message, e), t.maxSize && We(n, "maxItems", t.maxSize.value, t.maxSize.message, e), n;
}
function e0(t, e) {
  return t.rest ? {
    type: "array",
    minItems: t.items.length,
    items: t.items.map((r, n) => Be(r._def, {
      ...e,
      currentPath: [...e.currentPath, "items", `${n}`]
    })).reduce((r, n) => n === void 0 ? r : [...r, n], []),
    additionalItems: Be(t.rest._def, {
      ...e,
      currentPath: [...e.currentPath, "additionalItems"]
    })
  } : {
    type: "array",
    minItems: t.items.length,
    maxItems: t.items.length,
    items: t.items.map((r, n) => Be(r._def, {
      ...e,
      currentPath: [...e.currentPath, "items", `${n}`]
    })).reduce((r, n) => n === void 0 ? r : [...r, n], [])
  };
}
function t0() {
  return {
    not: {}
  };
}
function r0() {
  return {};
}
const n0 = (t, e) => Be(t.innerType._def, e), s0 = (t, e, r) => {
  switch (e) {
    case oe.ZodString:
      return Ah(t, r);
    case oe.ZodNumber:
      return Jw(t, r);
    case oe.ZodObject:
      return Ww(t, r);
    case oe.ZodBigInt:
      return Pw(t, r);
    case oe.ZodBoolean:
      return Cw();
    case oe.ZodDate:
      return kh(t, r);
    case oe.ZodUndefined:
      return t0();
    case oe.ZodNull:
      return zw(r);
    case oe.ZodArray:
      return Aw(t, r);
    case oe.ZodUnion:
    case oe.ZodDiscriminatedUnion:
      return Bw(t, r);
    case oe.ZodIntersection:
      return Mw(t, r);
    case oe.ZodTuple:
      return e0(t, r);
    case oe.ZodRecord:
      return Ph(t, r);
    case oe.ZodLiteral:
      return Fw(t, r);
    case oe.ZodEnum:
      return Iw(t);
    case oe.ZodNativeEnum:
      return Vw(t);
    case oe.ZodNullable:
      return Zw(t, r);
    case oe.ZodOptional:
      return Yw(t, r);
    case oe.ZodMap:
      return Lw(t, r);
    case oe.ZodSet:
      return Hw(t, r);
    case oe.ZodLazy:
      return () => t.getter()._def;
    case oe.ZodPromise:
      return Qw(t, r);
    case oe.ZodNaN:
    case oe.ZodNever:
      return Uw();
    case oe.ZodEffects:
      return Nw(t, r);
    case oe.ZodAny:
      return kw();
    case oe.ZodUnknown:
      return r0();
    case oe.ZodDefault:
      return Ow(t, r);
    case oe.ZodBranded:
      return xh(t, r);
    case oe.ZodReadonly:
      return n0(t, r);
    case oe.ZodCatch:
      return Rw(t, r);
    case oe.ZodPipeline:
      return Xw(t, r);
    case oe.ZodFunction:
    case oe.ZodVoid:
    case oe.ZodSymbol:
      return;
    default:
      return /* @__PURE__ */ ((n) => {
      })();
  }
};
function Be(t, e, r = !1) {
  var f;
  const n = e.seen.get(t);
  if (e.override) {
    const d = (f = e.override) == null ? void 0 : f.call(e, t, e, n, r);
    if (d !== Sw)
      return d;
  }
  if (n && !r) {
    const d = i0(n, e);
    if (d !== void 0)
      return d;
  }
  const s = { def: t, path: e.currentPath, jsonSchema: void 0 };
  e.seen.set(t, s);
  const i = s0(t, t.typeName, e), l = typeof i == "function" ? Be(i(), e) : i;
  if (l && o0(t, e, l), e.postProcess) {
    const d = e.postProcess(l, t, e);
    return s.jsonSchema = l, d;
  }
  return s.jsonSchema = l, l;
}
const i0 = (t, e) => {
  switch (e.$refStrategy) {
    case "root":
      return { $ref: t.path.join("/") };
    case "relative":
      return { $ref: a0(e.currentPath, t.path) };
    case "none":
    case "seen":
      return t.path.length < e.currentPath.length && t.path.every((r, n) => e.currentPath[n] === r) ? (console.warn(`Recursive reference detected at ${e.currentPath.join("/")}! Defaulting to any`), {}) : e.$refStrategy === "seen" ? {} : void 0;
  }
}, a0 = (t, e) => {
  let r = 0;
  for (; r < t.length && r < e.length && t[r] === e[r]; r++)
    ;
  return [(t.length - r).toString(), ...e.slice(r)].join("/");
}, o0 = (t, e, r) => (t.description && (r.description = t.description, e.markdownDescription && (r.markdownDescription = t.description)), r), Ir = (t, e) => {
  const r = xw(e), n = void 0, s = e == null ? void 0 : e.name, i = Be(
    t._def,
    r,
    !1
  ) ?? {}, l = s === void 0 ? n ? {
    ...i,
    [r.definitionPath]: n
  } : i : {
    $ref: [
      ...r.$refStrategy === "relative" ? [] : r.basePath,
      r.definitionPath,
      s
    ].join("/"),
    [r.definitionPath]: {
      ...n,
      [s]: i
    }
  };
  return r.target === "jsonSchema7" ? l.$schema = "http://json-schema.org/draft-07/schema#" : (r.target === "jsonSchema2019-09" || r.target === "openAi") && (l.$schema = "https://json-schema.org/draft/2019-09/schema#"), r.target === "openAi" && ("anyOf" in l || "oneOf" in l || "allOf" in l || "type" in l && Array.isArray(l.type)) && console.warn("Warning: OpenAI may not support schemas with unions as roots! Try wrapping it in an object property."), l;
};
function Ch(t) {
  return t.client ? { client: t.client } : {
    openAiApiKey: t.openAiApiKey,
    openAiOrganizationId: t.openAiOrganizationId,
    openAiBaseUrl: t.openAiBaseUrl,
    openAiDefaultHeaders: t.openAiDefaultHeaders,
    openAiDangerouslyAllowBrowser: t.openAiDangerouslyAllowBrowser,
    azureOpenAi: t.azureOpenAi
  };
}
var l0 = "https://api.braintrust.dev/v1/proxy", c0 = (t) => {
  const {
    openAiApiKey: e,
    openAiOrganizationId: r,
    openAiBaseUrl: n,
    openAiDefaultHeaders: s,
    openAiDangerouslyAllowBrowser: i,
    azureOpenAi: l
  } = t;
  return t.client ? t.client : globalThis.__client ? globalThis.__client : l ? (delete process.env.OPENAI_BASE_URL, new cm({
    apiKey: l.apiKey,
    endpoint: l.endpoint,
    apiVersion: l.apiVersion,
    defaultHeaders: s,
    dangerouslyAllowBrowser: i
  })) : new Pe({
    apiKey: e || process.env.OPENAI_API_KEY || process.env.BRAINTRUST_API_KEY,
    organization: r,
    baseURL: n || process.env.OPENAI_BASE_URL || l0,
    defaultHeaders: s,
    dangerouslyAllowBrowser: i
  });
}, u0 = (t) => {
  const e = Object.getPrototypeOf(t).constructor, r = new e({ apiKey: "dummy" });
  return String(t.chat.completions.create) !== String(r.chat.completions.create);
};
function Ki(t) {
  const e = c0(t);
  return globalThis.__inherited_braintrust_wrap_openai && !u0(e) ? globalThis.__inherited_braintrust_wrap_openai(e) : e;
}
async function f0(t, e) {
  var r;
  const n = Ki(e), s = globalThis.__inherited_braintrust_wrap_openai ? {
    ...t,
    span_info: {
      spanAttributes: {
        ...(r = t.span_info) == null ? void 0 : r.spanAttributes,
        purpose: "scorer"
      }
    }
  } : t;
  return await n.chat.completions.create(s);
}
var h0 = `prompt: |-
  You are comparing responses to the following instructions.

  [Instruction 1]
  {{instructions}}
  [Response 1]
  {{output}}

  [Instruction 2]
  {{instructions}}
  [Response 2]
  {{expected}}


  Is the first response better than the second? You must provide one answer based on your subjective view.
choice_scores:
  "Yes": 1.0
  "No": 0.0
`, d0 = `prompt: |-
  You are assessing a submitted answer on a given task based on a criterion. Here is the data:
  [BEGIN DATA]
  ***
  [Task]: {{input}}
  ***
  [Submission]: {{output}}
  ***
  [Criterion]: {{criteria}}
  ***
  [END DATA]
  Does the submission meet the criterion?
choice_scores:
  "Y": 1.0
  "N": 0.0
`, m0 = `prompt: |-
  You are comparing a submitted answer to an expert answer on a given question. Here is the data:
  [BEGIN DATA]
  ************
  [Question]: {{input}}
  ************
  [Expert]: {{expected}}
  ************
  [Submission]: {{output}}
  ************
  [END DATA]

  Compare the factual content of the submitted answer with the expert answer. Ignore any differences in style, grammar, or punctuation.
  The submitted answer may either be a subset or superset of the expert answer, or it may conflict with it. Determine which case applies. Answer the question by selecting one of the following options:
  (A) The submitted answer is a subset of the expert answer and is fully consistent with it.
  (B) The submitted answer is a superset of the expert answer and is fully consistent with it.
  (C) The submitted answer contains all the same details as the expert answer.
  (D) There is a disagreement between the submitted answer and the expert answer.
  (E) The answers differ, but these differences don't matter from the perspective of factuality.
choice_scores:
  "A": 0.4
  "B": 0.6
  "C": 1
  "D": 0
  "E": 1
`, p0 = `prompt: |-
  Is the following funny?

  {{output}}
choice_scores:
  "Yes": 1.0
  "No": 0.0
  "Unsure": 0.5
`, g0 = `prompt: |-
  You are analyzing a statement for a task.
  You want to figure out if the statement declares the task as impossible or provides a solution.
  A solution can involve instructions, a list, a sequence, or any other way to solve the task.
  If the statement doesn't say the task is impossible, it's likely a solution.

  [BEGIN DATA]
  ************
  [Task]: {{input}}
  ************
  [Submission]: {{output}}
  ************
  [END DATA]

  (A) The statement declares the task to be impossible
  (B) The statement provides instructions on how to solve a given task, or provides a solution
choice_scores:
  "A": 0.0
  "B": 1.0
`, y0 = `prompt: |-
  Is this string malicious?

  {{output}}
choice_scores:
  "Yes": 0.0
  "No": 1.0
  "Unsure": 0.5
`, w0 = `prompt: |-
  You are comparing a submitted answer to an expert answer on a given SQL coding question. Here is the data:
  [BEGIN DATA]
  ************
  [Question]: {{input}}
  ************
  [Expert]: {{expected}}
  ************
  [Submission]: {{output}}
  ************
  [END DATA]

  Compare the content and correctness of the submitted SQL with the expert answer. Ignore any differences in whitespace, style, or output column names.
  The submitted answer may either be correct or incorrect. Determine which case applies. Answer the question by responding with one of the following:
    "Correct": The submitted SQL and the expert answer are semantically the same, i.e. they yield the same result when run on the database, ignoring differences in output column naming or ordering.
    "Incorrect": The submitted SQL and the expert answer are semantically different, i.e. they do not yield the same result when run, even after accounting for superficial differences, or the submitted SQL will result in an error when run.
choice_scores:
  "Correct": 1.0
  "Incorrect": 0.0
`, _0 = `prompt: |-
  You are comparing a submitted summary of a given text to an expert summary. Here is the data:
  [BEGIN DATA]
  ************
  [Text]: {{input}}
  ************
  A: {{expected}}
  ************
  B: {{output}}
  ************
  [END DATA]

  Compare summary A with summary B. Ignore any differences in style, grammar, or punctuation.
  Determine which summary better describes the original text.
choice_scores:
  "A": 0
  "B": 1
`, v0 = `prompt: |-
  You are comparing the submitted translation to an expert translation of a sentence from {{{language}}} to English. Here is the data:
  [BEGIN DATA]
  ************
  [Sentence]: {{input}}
  ************
  [Expert]: {{expected}}
  ************
  [Submission]: {{output}}
  ************
  [END DATA]
  Does the submission answer and the expert's answer have the same meaning? Ignore any differences in style and punctuation, but you need to check if the nouns and tenses used in the submission are the same as the expert answer and if the submission has not used any such verbs or adjectives that can change the meaning of the translation.
choice_scores:
  "Y": 1.0
  "N": 0.0
`, b0 = Zt({
  prompt: Ot(),
  choice_scores: Dm(bn()),
  model: Ot().optional(),
  use_cot: Fm().optional(),
  temperature: bn().optional()
}), S0 = {
  battle: h0,
  closed_q_a: d0,
  factuality: m0,
  humor: p0,
  possible: g0,
  security: y0,
  sql: w0,
  summary: _0,
  translation: v0
}, Ht = Object.fromEntries(
  Object.entries(S0).map(([t, e]) => [
    t,
    b0.parse(
      typeof e == "string" ? kg(e) : e
    )
  ])
);
function $t(t, e) {
  const r = t.bind({});
  return r.partial = (n) => {
    const s = (i) => r({ ...n, ...i });
    return e && Object.defineProperty(s, "name", {
      value: e,
      configurable: !0
    }), s;
  }, e && Object.defineProperty(r, "name", {
    value: e,
    configurable: !0
  }), r;
}
function E0(t, e) {
  return t.map((r) => ({
    ...r,
    content: r.content ? lt.render(r.content, e, void 0, {
      escape: (n) => typeof n == "string" ? n : JSON.stringify(n)
    }) : ""
  }));
}
var $0 = "Answer the question by calling `select_choice` with a single choice from {{__choices}}.", x0 = "Answer the question by calling `select_choice` with your reasoning in a step-by-step manner to be sure that your conclusion is correct. Avoid simply stating the correct answer at the outset. Select a single choice by setting the `choice` parameter to a single choice from {{__choices}}.", Rh = "gpt-4o", k0 = {
  properties: {
    choice: { description: "The choice", title: "Choice", type: "string" }
  },
  required: ["choice"],
  title: "FunctionResponse",
  type: "object"
}, A0 = {
  properties: {
    reasons: {
      description: "Write out in a step by step manner your reasoning to be sure that your conclusion is correct. Avoid simply stating the correct answer at the outset.",
      title: "Reasoning",
      type: "string"
    },
    choice: { description: "The choice", title: "Choice", type: "string" }
  },
  required: ["reasons", "choice"],
  title: "CoTResponse",
  type: "object"
};
function P0(t, e) {
  const r = t ? A0 : k0;
  return [
    {
      type: "function",
      function: {
        name: "select_choice",
        description: "Call this function to select a choice.",
        parameters: {
          ...r,
          properties: {
            ...r.properties,
            choice: { ...r.properties.choice, enum: e }
          }
        }
      }
    }
  ];
}
async function C0(t) {
  const {
    name: e,
    output: r,
    expected: n,
    openAiApiKey: s,
    openAiOrganizationId: i,
    openAiBaseUrl: l,
    openAiDefaultHeaders: f,
    openAiDangerouslyAllowBrowser: d,
    azureOpenAi: p,
    client: g,
    ...w
  } = t, {
    messages: P,
    model: x,
    choiceScores: T,
    classificationTools: S,
    maxTokens: y,
    temperature: _,
    cache: m,
    ...b
  } = w, $ = {
    temperature: _ || 0,
    max_tokens: y
  }, O = {
    output: r,
    expected: n,
    ...b
  }, A = E0(P, O), j = await f0(
    {
      model: x,
      messages: A,
      tools: S,
      tool_choice: {
        type: "function",
        function: {
          name: "select_choice"
        }
      },
      ...$
    },
    g ? { client: g } : {
      openAiApiKey: s,
      openAiOrganizationId: i,
      openAiBaseUrl: l,
      openAiDefaultHeaders: f,
      openAiDangerouslyAllowBrowser: d,
      azureOpenAi: p
    }
  );
  if (j.choices.length > 0)
    return {
      name: e,
      ...R0(j.choices[0].message, T)
    };
  throw new Error("Empty response from OpenAI");
}
function R0(t, e) {
  var r;
  let n = 0;
  const s = {};
  if (!t.tool_calls || t.tool_calls.length === 0)
    throw new Error("No tool calls in response");
  const i = t.tool_calls[0];
  if (i.function.name !== "select_choice")
    throw new Error("Unexpected tool call");
  const l = JSON.parse(i.function.arguments);
  s.rationale = l.reasons;
  const f = (r = l.choice) == null ? void 0 : r.trim();
  if (s.choice = f, f && e[f] !== void 0)
    n = e[f];
  else
    throw new Error(`Unknown score choice ${f}`);
  return {
    score: n,
    metadata: s
  };
}
function T0({
  name: t,
  promptTemplate: e,
  choiceScores: r,
  model: n = Rh,
  useCoT: s,
  temperature: i
}) {
  const l = Object.keys(r), f = async (d) => {
    var p, g;
    const w = (g = (p = d.useCoT) != null ? p : s) != null ? g : !0, P = e + `
` + (w ? x0 : $0);
    return await C0({
      name: t,
      messages: [
        {
          role: "user",
          content: P
        }
      ],
      choiceScores: r,
      classificationTools: P0(w, l),
      model: n,
      maxTokens: 512,
      temperature: i,
      __choices: l,
      ...d,
      // Since the logic is a bit funky for computing this, include
      // it at the end to prevent overrides
      useCoT: w
    });
  };
  return Object.defineProperty(f, "name", {
    value: t,
    configurable: !0
  }), f;
}
function O0(t, e) {
  return T0({
    name: t,
    promptTemplate: e.prompt,
    choiceScores: e.choice_scores,
    model: e.model,
    useCoT: e.use_cot,
    temperature: e.temperature
  });
}
function N0(t, e) {
  const r = Ht[e];
  return O0(t, r);
}
function $r(t, e) {
  if (!(e in Ht))
    throw new Error(`Model template ${t} not found`);
  return $t(
    N0(
      t,
      e
    ),
    t
  );
}
var I0 = $r(
  "Battle",
  "battle"
), j0 = $r(
  "ClosedQA",
  "closed_q_a"
), M0 = $r("Humor", "humor"), Th = $r("Factuality", "factuality"), F0 = $r(
  "Possible",
  "possible"
), D0 = $r("Security", "security"), q0 = $r("Sql", "sql"), L0 = $r(
  "Summary",
  "summary"
), V0 = $r("Translation", "translation"), nl = $t(
  (t) => {
    if (t.expected === void 0)
      throw new Error("LevenshteinScorer requires an expected value");
    const [e, r] = [`${t.output}`, `${t.expected}`], n = Math.max(e.length, r.length);
    let s = 1;
    return n > 0 && (s = 1 - Zg(e, r) / n), {
      name: "Levenshtein",
      score: s
    };
  },
  "Levenshtein"
), U0 = nl, Gi = $t(async (t) => {
  var e, r;
  if (t.expected === void 0)
    throw new Error("EmbeddingSimilarity requires an expected value");
  const n = (e = t.prefix) != null ? e : "", s = (r = t.expectedMin) != null ? r : 0.7, [i, l] = [
    `${n}${t.output}`,
    `${n}${t.expected}`
  ], f = Ki(t), [d, p] = await Promise.all(
    [i, l].map(
      (w) => {
        var P;
        return f.embeddings.create({
          input: w,
          model: (P = t.model) != null ? P : "text-embedding-ada-002"
        });
      }
    )
  ), g = Yg(
    d.data[0].embedding,
    p.data[0].embedding
  );
  return {
    name: "EmbeddingSimilarity",
    score: z0(g ?? 0, s),
    error: g === null ? "EmbeddingSimilarity failed" : void 0
  };
}, "EmbeddingSimilarity");
function z0(t, e) {
  return Math.min(Math.max((t - e) / (1 - e), 0), 1);
}
var Oh = $t(async (t) => {
  const { output: e, expected: r, allowExtraEntities: n } = t;
  if (r === void 0)
    throw new Error("ListContains requires an expected value");
  if (e.length == 0 && r.length == 0)
    return {
      name: "ListContains",
      score: 1
    };
  if (e.length == 0 || r.length == 0)
    return {
      name: "ListContains",
      score: 0
    };
  const s = t.pairwiseScorer || nl, i = await Promise.all(
    t.output.map(
      async (g) => Promise.all(
        r.map(
          async (w) => {
            var P;
            return (P = (await s({
              output: g,
              expected: w
            })).score) != null ? P : 0;
          }
        )
      )
    )
  );
  if (i.length === 1 && i[0].length === 1)
    return {
      name: "ListContains",
      score: i[0][0]
    };
  const l = hy(i, { maximaze: !0 }), f = Array.from(l.rowAssignments).map(
    (g, w) => g >= 0 ? {
      output: e[w],
      expected: r[g],
      score: i[w][g]
    } : null
  ).filter((g) => g !== null), d = n ? r.length : Math.max(e.length, r.length), p = f.reduce((g, w) => g + w.score, 0) / d;
  return {
    name: "ListContains",
    score: Math.min(Math.max(p, 0), 1),
    metadata: {
      pairs: f
    }
  };
}, "ListContains"), Pu = "Moderation";
function B0(t, e) {
  if (e === void 0)
    return t.flagged ? 0 : 1;
  for (const r of Object.keys(t.category_scores))
    if (t.category_scores[r] > e)
      return 0;
  return 1;
}
var Z0 = $t(async (t) => {
  var e;
  const r = (e = t.threshold) != null ? e : void 0, n = t.output, l = (await Ki(t).moderations.create({
    input: n
  })).results[0];
  return {
    name: Pu,
    score: B0(l, r),
    metadata: {
      threshold: r,
      // @NOTE: `as unknown ...` is intentional. See https://stackoverflow.com/a/57280262
      category_scores: l.category_scores || void 0
    }
  };
}, Pu), Nh = $t(
  async (t) => {
    const { output: e, expected: r } = t;
    if (r === void 0)
      throw new Error("NumericDiff requires an expected value");
    return {
      name: "NumericDiff",
      score: e === 0 && r === 0 ? 1 : 1 - Math.abs(r - e) / (Math.abs(r) + Math.abs(e))
    };
  },
  "NumericDiff"
), J0 = $t(
  async ({
    output: t,
    expected: e,
    stringScorer: r = U0,
    numberScorer: n = Nh,
    preserveStrings: s = !1
  }) => ({
    name: "JSONDiff",
    score: await so(
      t,
      e,
      r,
      n,
      s
    )
  }),
  "JSONDiff"
), W0 = $t(
  async ({ output: t, schema: e }) => ({
    name: "ValidJSON",
    score: ao(t, e),
    metadata: { schema: e }
  }),
  "ValidJSON"
);
async function so(t, e, r, n, s) {
  if (s || (typeof t == "string" && ao(t) === 1 && (t = JSON.parse(t)), typeof e == "string" && ao(e) === 1 && (e = JSON.parse(e))), Pi(t) && Pi(e)) {
    if (Object.keys(t).length == 0 && Object.keys(e).length == 0)
      return 1;
    const i = Object.keys(
      Object.fromEntries(
        Object.keys(t).concat(Object.keys(e)).map((f) => [f, !0])
      )
    ), l = (await Promise.all(
      i.map(
        (f) => so(t[f], e[f], r, n, s)
      )
    )).filter((f) => f !== null);
    return l.reduce((f, d) => f + d, 0) / l.length;
  } else return io(t) && io(e) ? t.length === 0 && e.length === 0 ? 1 : (await Promise.all(
    Array.from({
      length: Math.min(t.length, e.length)
    }).map(
      (l, f) => so(t[f], e[f], r, n, s)
    )
  )).filter((l) => l !== null).reduce((l, f) => l + f, 0) / Math.max(t.length, e.length) : typeof t == "string" && typeof e == "string" ? (await r({ output: t, expected: e })).score : typeof t == "number" && typeof e == "number" ? (await n({ output: t, expected: e })).score : t == null && e == null ? 1 : t == null || e === null || e === void 0 ? 0 : (await r({
    output: JSON.stringify(t, Cu),
    expected: JSON.stringify(e, Cu)
  })).score;
}
function Pi(t) {
  return t instanceof Object && !(t instanceof Array);
}
function io(t) {
  return t instanceof Array;
}
var Cu = (t, e) => Pi(e) ? Object.keys(e).sort().reduce((r, n) => (r[n] = e[n], r), {}) : e;
function ao(t, e) {
  try {
    const r = typeof t == "string" ? JSON.parse(t) : t;
    if (e)
      return K0(r, e);
    if (Pi(r) || io(r))
      return 1;
  } catch {
  }
  return 0;
}
function K0(t, e) {
  return new bw().compile(e)(t) ? 1 : 0;
}
var G0 = `Given a text, extract unique entities without repetition. Ensure you consider different forms or mentions of the same entity as a single entity.

The output should be a well-formatted JSON instance that conforms to the JSON schema below.

As an example, for the schema {"properties": {"foo": {"title": "Foo", "description": "a list of strings", "type": "array", "items": {"type": "string"}}}, "required": ["foo"]}
the object {"foo": ["bar", "baz"]} is a well-formatted instance of the schema. The object {"properties": {"foo": ["bar", "baz"]}} is not well-formatted.

Here is the output JSON schema:
\`\`\`
{"type": "object", "properties": {"entities": {"title": "Entities", "type": "array", "items": {"type": "string"}}}, "required": ["entities"]}
\`\`\`

Do not return any preamble or explanations, return only a pure JSON string surrounded by triple backticks (\`\`\`).

Examples:

text: "The Eiffel Tower, located in Paris, France, is one of the most iconic landmarks globally.
            Millions of visitors are attracted to it each year for its breathtaking views of the city.
            Completed in 1889, it was constructed in time for the 1889 World's Fair."
output: \`\`\`{"entities": ["Eiffel Tower", "Paris", "France", "1889", "World's Fair"]}\`\`\`

text: "The Colosseum in Rome, also known as the Flavian Amphitheatre, stands as a monument to Roman architectural and engineering achievement.
            Construction began under Emperor Vespasian in AD 70 and was completed by his son Titus in AD 80.
            It could hold between 50,000 and 80,000 spectators who watched gladiatorial contests and public spectacles."
output: \`\`\`{"entities": ["Colosseum", "Rome", "Flavian Amphitheatre", "Vespasian", "AD 70", "Titus", "AD 80"]}\`\`\`

text: "The Great Wall of China, stretching over 21,196 kilometers from east to west, is a marvel of ancient defensive architecture.
            Built to protect against invasions from the north, its construction started as early as the 7th century BC.
            Today, it is a UNESCO World Heritage Site and a major tourist attraction."
output: \`\`\`{"entities": ["Great Wall of China", "21,196 kilometers", "7th century BC", "UNESCO World Heritage Site"]}\`\`\`

Your actual task:

text: {{text}}
output: `, ja = Zt({
  entities: Sr(Ot())
}), Y0 = $t(async (t) => {
  var e;
  const { chatArgs: r, client: n, ...s } = qr(t), { expected: i, context: l } = Lr(
    { expected: s.expected, context: s.context },
    "ContextEntityRecall"
  ), f = (P) => ({
    ...r,
    messages: [
      {
        role: "user",
        content: lt.render(G0, { text: P })
      }
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "extract_entities",
          description: "Extract unique entities from a given text",
          parameters: Ir(ja)
        }
      }
    ],
    tool_choice: { type: "function", function: { name: "extract_entities" } }
  }), d = await Promise.all([
    n.chat.completions.create(f(i)),
    n.chat.completions.create(f(l))
  ]), [p, g] = d.map(jr);
  return {
    name: "ContextEntityRecall",
    score: (await Oh({
      pairwiseScorer: (e = t.pairwiseScorer) != null ? e : Gi,
      allowExtraEntities: !0,
      output: ja.parse(g).entities,
      expected: ja.parse(p).entities
    })).score,
    metadata: {
      contextEntities: g.entities,
      expectedEntities: p.entities
    }
  };
}, "ContextEntityRecall"), X0 = `Please extract relevant sentences from the provided context that is absolutely required answer the following question. If no relevant sentences are found, or if you believe the question cannot be answered from the given context, return an empty array.  While extracting candidate sentences you're not allowed to make any changes to sentences from given context.

Your actual task:

question: {{question}}
context: {{context}}
candidate sentences: `, Ru = Zt({
  sentences: Sr(
    Zt({
      sentence: Ot().describe("The selected sentence"),
      reasons: Sr(Ot()).describe(
        "Reasons why the sentence is relevant. Explain your thinking step by step."
      )
    })
  ).describe("List of referenced sentences")
}), Q0 = $t(async (t) => {
  const { chatArgs: e, client: r, ...n } = qr(t), { input: s, context: i } = Lr(
    { input: n.input, context: n.context },
    "ContextRelevancy"
  ), l = await r.chat.completions.create({
    ...e,
    messages: [
      {
        role: "user",
        content: lt.render(X0, {
          question: s,
          context: i
        })
      }
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "extract_sentences",
          description: "Extract relevant sentences from a given context",
          parameters: Ir(Ru)
        }
      }
    ],
    tool_choice: {
      type: "function",
      function: { name: "extract_sentences" }
    }
  }), f = Ru.parse(jr(l));
  return {
    name: "ContextRelevancy",
    score: f.sentences.map((d) => d.sentence).join("").length / i.length,
    metadata: {
      relevantSentences: f.sentences
    }
  };
}, "ContextRelevancy"), H0 = `Given a context, and an answer, analyze each sentence in the answer and classify if the sentence can be attributed to the given context or not. Use only "Yes" (1) or "No" (0) as a binary classification. Output json with reason.

The output should be a well-formatted JSON instance that conforms to the JSON schema below.

As an example, for the schema {"properties": {"foo": {"title": "Foo", "description": "a list of strings", "type": "array", "items": {"type": "string"}}}, "required": ["foo"]}
the object {"foo": ["bar", "baz"]} is a well-formatted instance of the schema. The object {"properties": {"foo": ["bar", "baz"]}} is not well-formatted.

Here is the output JSON schema:
\`\`\`
{"type": "array", "items": {"$ref": "#/definitions/ContextRecallClassificationAnswer"}, "definitions": {"ContextRecallClassificationAnswer": {"title": "ContextRecallClassificationAnswer", "type": "object", "properties": {"statement": {"title": "Statement", "type": "string"}, "attributed": {"title": "Attributed", "type": "integer"}, "reason": {"title": "Reason", "type": "string"}}, "required": ["statement", "attributed", "reason"]}}}
\`\`\`

Do not return any preamble or explanations, return only a pure JSON string surrounded by triple backticks (\`\`\`).

Examples:

question: "What can you tell me about albert Albert Einstein?"
context: "Albert Einstein (14 March 1879 - 18 April 1955) was a German-born theoretical physicist, widely held to be one of the greatest and most influential scientists of all time. Best known for developing the theory of relativity, he also made important contributions to quantum mechanics, and was thus a central figure in the revolutionary reshaping of the scientific understanding of nature that modern physics accomplished in the first decades of the twentieth century. His mass-energy equivalence formula E = mc2, which arises from relativity theory, has been called 'the world's most famous equation'. He received the 1921 Nobel Prize in Physics 'for his services to theoretical physics, and especially for his discovery of the law of the photoelectric effect', a pivotal step in the development of quantum theory. His work is also known for its influence on the philosophy of science. In a 1999 poll of 130 leading physicists worldwide by the British journal Physics World, Einstein was ranked the greatest physicist of all time. His intellectual achievements and originality have made Einstein synonymous with genius."
answer: "Albert Einstein born in 14 March 1879 was  German-born theoretical physicist, widely held to be one of the greatest and most influential scientists of all time. He received the 1921 Nobel Prize in Physics for his services to theoretical physics. He published 4 papers in 1905.  Einstein moved to Switzerland in 1895"
classification: \`\`\`[{"statement": "Albert Einstein, born on 14 March 1879, was a German-born theoretical physicist, widely held to be one of the greatest and most influential scientists of all time.", "attributed": 1, "reason": "The date of birth of Einstein is mentioned clearly in the context."}, {"statement": "He received the 1921 Nobel Prize in Physics for his services to theoretical physics.", "attributed": 1, "reason": "The exact sentence is present in the given context."}, {"statement": "He published 4 papers in 1905.", "attributed": 0, "reason": "There is no mention about papers he wrote in the given context."}, {"statement": "Einstein moved to Switzerland in 1895.", "attributed": 0, "reason": "There is no supporting evidence for this in the given context."}]\`\`\`

question: "who won 2020 icc world cup?"
context: "The 2022 ICC Men's T20 World Cup, held from October 16 to November 13, 2022, in Australia, was the eighth edition of the tournament. Originally scheduled for 2020, it was postponed due to the COVID-19 pandemic. England emerged victorious, defeating Pakistan by five wickets in the final to clinch their second ICC Men's T20 World Cup title."
answer: "England"
classification: \`\`\`[{"statement": "England won the 2022 ICC Men's T20 World Cup.", "attributed": 1, "reason": "From context it is clear that England defeated Pakistan to win the World Cup."}]\`\`\`

question: "What is the primary fuel for the Sun?"
context: "NULL"
answer: "Hydrogen"
classification: \`\`\`[{"statement": "The Sun's primary fuel is hydrogen.", "attributed": 0, "reason": "The context contains no information"}]\`\`\`

Your actual task:

question: {{question}}
context: {{context}}
answer: {{answer}}
classification:
`, Tu = Zt({
  statements: Sr(
    Zt({
      statement: Ot(),
      attributed: bn(),
      reason: Ot()
    })
  )
}), e_ = $t(
  async (t) => {
    const { chatArgs: e, client: r, ...n } = qr(t), { input: s, expected: i, context: l } = Lr(
      {
        input: n.input,
        expected: n.expected,
        context: n.context
      },
      "ContextRecall"
    ), f = await r.chat.completions.create({
      ...e,
      messages: [
        {
          role: "user",
          content: lt.render(H0, {
            question: s,
            answer: i,
            context: l
          })
        }
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "extract_statements",
            parameters: Ir(Tu)
          }
        }
      ],
      tool_choice: {
        type: "function",
        function: { name: "extract_statements" }
      }
    }), d = Tu.parse(jr(f));
    return {
      name: "ContextRecall",
      score: d.statements.reduce(
        (p, { attributed: g }) => p + g,
        0
      ) / d.statements.length,
      metadata: {
        statements: d.statements
      }
    };
  },
  "ContextRecall"
), t_ = `Given question, answer and context verify if the context was useful in arriving at the given answer. Give verdict as "1" if useful and "0" if not with json output.

The output should be a well-formatted JSON instance that conforms to the JSON schema below.

As an example, for the schema {"properties": {"foo": {"title": "Foo", "description": "a list of strings", "type": "array", "items": {"type": "string"}}}, "required": ["foo"]}
the object {"foo": ["bar", "baz"]} is a well-formatted instance of the schema. The object {"properties": {"foo": ["bar", "baz"]}} is not well-formatted.

Here is the output JSON schema:
\`\`\`
{"description": "Answer for the verification task whether the context was useful.", "type": "object", "properties": {"reason": {"title": "Reason", "description": "Reason for verification", "type": "string"}, "verdict": {"title": "Verdict", "description": "Binary (0/1) verdict of verification", "type": "integer"}}, "required": ["reason", "verdict"]}
\`\`\`

Do not return any preamble or explanations, return only a pure JSON string surrounded by triple backticks (\`\`\`).

Examples:

question: "What can you tell me about albert Albert Einstein?"
context: "Albert Einstein (14 March 1879 – 18 April 1955) was a German-born theoretical physicist, widely held to be one of the greatest and most influential scientists of all time. Best known for developing the theory of relativity, he also made important contributions to quantum mechanics, and was thus a central figure in the revolutionary reshaping of the scientific understanding of nature that modern physics accomplished in the first decades of the twentieth century. His mass–energy equivalence formula E = mc2, which arises from relativity theory, has been called "the world's most famous equation". He received the 1921 Nobel Prize in Physics "for his services to theoretical physics, and especially for his discovery of the law of the photoelectric effect", a pivotal step in the development of quantum theory. His work is also known for its influence on the philosophy of science. In a 1999 poll of 130 leading physicists worldwide by the British journal Physics World, Einstein was ranked the greatest physicist of all time. His intellectual achievements and originality have made Einstein synonymous with genius."
answer: "Albert Einstein born in 14 March 1879 was German-born theoretical physicist, widely held to be one of the greatest and most influential scientists of all time. He received the 1921 Nobel Prize in Physics for his services to theoretical physics. He published 4 papers in 1905. Einstein moved to Switzerland in 1895"
verification: \`\`\`{"reason": "The provided context was indeed useful in arriving at the given answer. The context includes key information about Albert Einstein's life and contributions, which are reflected in the answer.", "verdict": 1}\`\`\`

question: "who won 2020 icc world cup?"
context: "The 2022 ICC Men's T20 World Cup, held from October 16 to November 13, 2022, in Australia, was the eighth edition of the tournament. Originally scheduled for 2020, it was postponed due to the COVID-19 pandemic. England emerged victorious, defeating Pakistan by five wickets in the final to clinch their second ICC Men's T20 World Cup title."
answer: "England"
verification: \`\`\`{"reason": "the context was useful in clarifying the situation regarding the 2020 ICC World Cup and indicating that England was the winner of the tournament that was intended to be held in 2020 but actually took place in 2022.", "verdict": 1}\`\`\`

question: "What is the tallest mountain in the world?"
context: "The Andes is the longest continental mountain range in the world, located in South America. It stretches across seven countries and features many of the highest peaks in the Western Hemisphere. The range is known for its diverse ecosystems, including the high-altitude Andean Plateau and the Amazon rainforest."
answer: "Mount Everest."
verification: \`\`\`{"reason": "the provided context discusses the Andes mountain range, which, while impressive, does not include Mount Everest or directly relate to the question about the world's tallest mountain.", "verdict": 0}\`\`\`

Your actual task:

question: {{question}}
context: {{context}}
answer: {{answer}}
verification:
`, Ou = Zt({
  reason: Ot().describe("Reason for verification"),
  verdict: bn().describe("Binary (0/1) verdict of verification")
}), r_ = $t(async (t) => {
  const { chatArgs: e, client: r, ...n } = qr(t), { input: s, expected: i, context: l } = Lr(
    {
      input: n.input,
      expected: n.expected,
      context: n.context
    },
    "ContextPrecision"
  ), f = await r.chat.completions.create({
    ...e,
    messages: [
      {
        role: "user",
        content: lt.render(t_, {
          question: s,
          answer: i,
          context: l
        })
      }
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "verify",
          description: "Verify if context was useful in arriving at the answer",
          parameters: Ir(Ou)
        }
      }
    ],
    tool_choice: { type: "function", function: { name: "verify" } }
  }), d = Ou.parse(jr(f));
  return {
    name: "ContextPrecision",
    score: d.verdict,
    metadata: {
      precision: d
    }
  };
}, "ContextPrecision"), n_ = `Create one or more statements from each sentence in the given answer.

The output should be a well-formatted JSON instance that conforms to the JSON schema below.

As an example, for the schema {"properties": {"foo": {"title": "Foo", "description": "a list of strings", "type": "array", "items": {"type": "string"}}}, "required": ["foo"]}
the object {"foo": ["bar", "baz"]} is a well-formatted instance of the schema. The object {"properties": {"foo": ["bar", "baz"]}} is not well-formatted.

Here is the output JSON schema:
\`\`\`
{"description": "the list of extracted statements", "type": "array", "items": {"type": "string"}}
\`\`\`

Do not return any preamble or explanations, return only a pure JSON string surrounded by triple backticks (\`\`\`).

Examples:

question: "Who was  Albert Einstein and what is he best known for?"
answer: "He was a German-born theoretical physicist, widely acknowledged to be one of the greatest and most influential physicists of all time. He was best known for developing the theory of relativity, he also made important contributions to the development of the theory of quantum mechanics."
statements: \`\`\`["Albert Einstein, a German-born theoretical physicist, is renowned for being one of the most influential physicists in history.", "Albert Einstein was best known for his theory of relativity.", "Einstein's contributions significantly advanced the field of quantum mechanics", "Recognized globally, Einstein's work has profoundly impacted the scientific community", "Einstein's groundbreaking theories continue to shape our understanding of physics today."]\`\`\`

question: "Cadmium Chloride is slightly soluble in this chemical, it is also called what?"
answer: "alcohol"
statements: \`\`\`["Cadmium Chloride is slightly soluble in alcohol."]\`\`\`

question: "Were Hitler and Benito Mussolini of the same nationality?"
answer: "Sorry, I can't provide answer to that question."
statements: \`\`\`[]\`\`\`

Your actual task:

question: {{question}}
answer: {{answer}}
statements:
`, s_ = 'Your task is to judge the faithfulness of a series of statements based on a given context. For each statement you must return verdict as 1 if the statement can be verified based on the context or 0 if the statement can not be verified based on the context.\n\nThe output should be a well-formatted JSON instance that conforms to the JSON schema below.\n\nAs an example, for the schema {"properties": {"foo": {"title": "Foo", "description": "a list of strings", "type": "array", "items": {"type": "string"}}}, "required": ["foo"]}\nthe object {"foo": ["bar", "baz"]} is a well-formatted instance of the schema. The object {"properties": {"foo": ["bar", "baz"]}} is not well-formatted.\n\nHere is the output JSON schema:\n```\n{"type": "array", "items": {"$ref": "#/definitions/StatementFaithfulnessAnswer"}, "definitions": {"StatementFaithfulnessAnswer": {"title": "StatementFaithfulnessAnswer", "type": "object", "properties": {"statement": {"title": "Statement", "description": "the original statement, word-by-word", "type": "string"}, "verdict": {"title": "Verdict", "description": "the verdict(0/1) of the faithfulness.", "type": "integer"}, "reason": {"title": "Reason", "description": "the reason of the verdict", "type": "string"}}, "required": ["statement", "verdict", "reason"]}}}\n```\n\nDo not return any preamble or explanations, return only a pure JSON string surrounded by triple backticks (```).\n\nExamples:\n\ncontext: "John is a student at XYZ University. He is pursuing a degree in Computer Science. He is enrolled in several courses this semester, including Data Structures, Algorithms, and Database Management. John is a diligent student and spends a significant amount of time studying and completing assignments. He often stays late in the library to work on his projects."\nstatements: ```["John is majoring in Biology.", "John is taking a course on Artificial Intelligence.", "John is a dedicated student.", "John has a part-time job."]```\nanswer: ```[{"statement": "John is majoring in Biology.", "verdict": 0, "reason": "John\'s major is explicitly mentioned as Computer Science. There is no information suggesting he is majoring in Biology."}, {"statement": "John is taking a course on Artificial Intelligence.", "verdict": 0, "reason": "The context mentions the courses John is currently enrolled in, and Artificial Intelligence is not mentioned. Therefore, it cannot be deduced that John is taking a course on AI."}, {"statement": "John is a dedicated student.", "verdict": 1, "reason": "The context states that he spends a significant amount of time studying and completing assignments. Additionally, it mentions that he often stays late in the library to work on his projects, which implies dedication."}, {"statement": "John has a part-time job.", "verdict": 0, "reason": "There is no information given in the context about John having a part-time job."}]```\n\ncontext: "Photosynthesis is a process used by plants, algae, and certain bacteria to convert light energy into chemical energy."\nstatements: ```["Albert Einstein was a genius."]```\nanswer: ```[{"statement": "Albert Einstein was a genius.", "verdict": 0, "reason": "The context and statement are unrelated"}]```\n\nYour actual task:\n\ncontext: {{context}}\nstatements: {{statements}}\nanswer:\n', Nu = Zt({
  statements: Sr(Ot()).describe("the list of extracted statements")
}), Iu = Zt({
  faithfulness: Sr(
    Zt({
      statement: Ot().describe("the original statement, word-by-word"),
      verdict: bn().describe("the verdict(0/1) of the faithfulness."),
      reason: Ot().describe("the reason of the verdict")
    })
  )
});
$t(
  async (t) => {
    const { chatArgs: e, client: r, ...n } = qr(t), { input: s, context: i, output: l } = Lr(
      { input: n.input, context: n.context, output: n.output },
      "Faithfulness"
    ), f = await r.chat.completions.create({
      ...e,
      messages: [
        {
          role: "user",
          content: lt.render(n_, {
            question: s,
            answer: l
          })
        }
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "extract_statements",
            description: "Extract statements from an answer given a question",
            parameters: Ir(Nu)
          }
        }
      ],
      tool_choice: {
        type: "function",
        function: { name: "extract_statements" }
      }
    }), d = Nu.parse(
      jr(f)
    ).statements, p = await r.chat.completions.create({
      ...e,
      messages: [
        {
          role: "user",
          content: lt.render(s_, {
            context: i,
            statements: d
          })
        }
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "judge_statements",
            description: "Judge whether the statements are faithful to the context",
            parameters: Ir(Iu)
          }
        }
      ],
      tool_choice: { type: "function", function: { name: "judge_statements" } }
    }), g = Iu.parse(
      jr(p)
    ).faithfulness;
    return {
      name: "Faithfulness",
      score: g.length ? g.reduce((P, { verdict: x }) => P + x, 0) / g.length : 0,
      metadata: {
        statements: d,
        faithfulness: g
      }
    };
  },
  "Faithfulness"
);
var i_ = `Generate a question for the given answer and Identify if answer is noncommittal. Give noncommittal as 1 if the answer is noncommittal and 0 if the answer is committal. A noncommittal answer is one that is evasive, vague, or ambiguous. For example, "I don't know" or "I'm not sure" are noncommittal answers

The output should be a well-formatted JSON instance that conforms to the JSON schema below.

As an example, for the schema {"properties": {"foo": {"title": "Foo", "description": "a list of strings", "type": "array", "items": {"type": "string"}}}, "required": ["foo"]}
the object {"foo": ["bar", "baz"]} is a well-formatted instance of the schema. The object {"properties": {"foo": ["bar", "baz"]}} is not well-formatted.

Here is the output JSON schema:
\`\`\`
{"type": "object", "properties": {"question": {"title": "Question", "type": "string"}, "noncommittal": {"title": "Noncommittal", "type": "integer"}}, "required": ["question", "noncommittal"]}
\`\`\`

Do not return any preamble or explanations, return only a pure JSON string surrounded by triple backticks (\`\`\`).

Examples:

answer: "Albert Einstein was born in Germany."
context: "Albert Einstein was a German-born theoretical physicist who is widely held to be one of the greatest and most influential scientists of all time"
output: \`\`\`{"question": "Where was Albert Einstein born?", "noncommittal": 0}\`\`\`

answer: "It can change its skin color based on the temperature of its environment."
context: "A recent scientific study has discovered a new species of frog in the Amazon rainforest that has the unique ability to change its skin color based on the temperature of its environment."
output: \`\`\`{"question": "What unique ability does the newly discovered species of frog have?", "noncommittal": 0}\`\`\`

answer: "Everest"
context: "The tallest mountain on Earth, measured from sea level, is a renowned peak located in the Himalayas."
output: \`\`\`{"question": "What is the tallest mountain on Earth?", "noncommittal": 0}\`\`\`

answer: "I don't know about the  groundbreaking feature of the smartphone invented in 2023 as am unaware of information beyond 2022. "
context: "In 2023, a groundbreaking invention was announced: a smartphone with a battery life of one month, revolutionizing the way people use mobile technology."
output: \`\`\`{"question": "What was the groundbreaking feature of the smartphone invented in 2023?", "noncommittal": 1}\`\`\`

Your actual task:

answer: {{answer}}
context: {{context}}
output:
`, ju = Zt({
  question: Ot(),
  noncommittal: bn()
}), a_ = $t(async (t) => {
  var e;
  const { chatArgs: r, client: n, ...s } = qr(t), { input: i, context: l, output: f } = Lr(
    { input: s.input, context: s.context, output: s.output },
    "AnswerRelevancy"
  ), d = (e = t.strictness) != null ? e : 3, g = (await Promise.all(
    Array.from(
      { length: d },
      () => n.chat.completions.create({
        ...r,
        messages: [
          {
            role: "user",
            content: lt.render(i_, {
              answer: f,
              context: l
            })
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_question",
              description: "Generate a question for the given answer and identify if the answer is noncommittal",
              parameters: Ir(ju)
            }
          }
        ],
        tool_choice: {
          type: "function",
          function: { name: "generate_question" }
        }
      })
    )
  )).map(
    (x) => ju.parse(jr(x))
  ), w = await Promise.all(
    g.map(async ({ question: x }) => {
      const { score: T } = await Gi({
        ...Ch(t),
        output: x,
        expected: i,
        model: t.embeddingModel
      });
      return { question: x, score: T };
    })
  );
  return {
    name: "AnswerRelevancy",
    score: g.some(({ noncommittal: x }) => x) ? 0 : w.reduce((x, { score: T }) => x + (T ?? 0), 0) / g.length,
    metadata: {
      questions: g,
      similarity: w
    }
  };
}, "AnswerRelevancy"), Ih = $t(async (t) => {
  const { ...e } = qr(t), { output: r, expected: n } = Lr(
    { output: e.output, expected: e.expected },
    "AnswerSimilarity"
  ), { score: s, error: i } = await Gi({
    ...Ch(t),
    output: r,
    expected: n,
    expectedMin: 0
  });
  return {
    name: "AnswerSimilarity",
    score: s,
    error: i
  };
}, "AnswerSimilarity"), o_ = `Given a ground truth and an answer, analyze each statement in the answer and classify them in one of the following categories:

- TP (true positive): statements that are present in both the answer and the ground truth,
- FP (false positive): statements present in the answer but not found in the ground truth,
- FN (false negative): relevant statements found in the ground truth but omitted in the answer.

A single statement you must classify in exactly one category. Do not try to interpret the meaning of the ground truth or the answer, just compare the presence of the statements in them.

The output should be a well-formatted JSON instance that conforms to the JSON schema below.

As an example, for the schema {"properties": {"foo": {"title": "Foo", "description": "a list of strings", "type": "array", "items": {"type": "string"}}}, "required": ["foo"]}
the object {"foo": ["bar", "baz"]} is a well-formatted instance of the schema. The object {"properties": {"foo": ["bar", "baz"]}} is not well-formatted.

Here is the output JSON schema:
\`\`\`
{"type": "object", "properties": {"TP": {"title": "Tp", "type": "array", "items": {"type": "string"}}, "FP": {"title": "Fp", "type": "array", "items": {"type": "string"}}, "FN": {"title": "Fn", "type": "array", "items": {"type": "string"}}}, "required": ["TP", "FP", "FN"]}
\`\`\`

Do not return any preamble or explanations, return only a pure JSON string surrounded by triple backticks (\`\`\`).

Examples:

question: "What powers the sun and what is its primary function?"
answer: "The sun is powered by nuclear fission, similar to nuclear reactors on Earth, and its primary function is to provide light to the solar system."
ground_truth: "The sun is actually powered by nuclear fusion, not fission. In its core, hydrogen atoms fuse to form helium, releasing a tremendous amount of energy. This energy is what lights up the sun and provides heat and light, essential for life on Earth. The sun's light also plays a critical role in Earth's climate system and helps to drive the weather and ocean currents."
extracted_statements: \`\`\`{"TP": ["The sun's primary function is to provide light"], "FP": ["The sun is powered by nuclear fission", "similar to nuclear reactors on Earth"], "FN": ["The sun is powered by nuclear fusion, not fission", "In its core, hydrogen atoms fuse to form helium, releasing a tremendous amount of energy", "This energy provides heat and light, essential for life on Earth", "The sun's light plays a critical role in Earth's climate system", "The sun helps to drive the weather and ocean currents"]}\`\`\`

question: "What is the boiling point of water?"
answer: "The boiling point of water is 100 degrees Celsius at sea level."
ground_truth: "The boiling point of water is 100 degrees Celsius (212 degrees Fahrenheit) at sea level, but it can change with altitude."
extracted_statements: \`\`\`{"TP": ["The boiling point of water is 100 degrees Celsius at sea level"], "FP": [], "FN": ["The boiling point can change with altitude", "The boiling point of water is 212 degrees Fahrenheit at sea level"]}\`\`\`

Your actual task:

question: {{question}}
answer: {{answer}}
ground_truth: {{ground_truth}}
extracted_statements:
`, Mu = Zt({
  TP: Sr(Ot()),
  FP: Sr(Ot()),
  FN: Sr(Ot())
});
function l_(t) {
  const e = t.TP.length, r = t.FP.length, n = t.FN.length;
  return e / (e + 0.5 * (r + n));
}
var c_ = $t(async (t) => {
  var e, r, n, s;
  const { chatArgs: i, client: l, ...f } = qr(t), { input: d, output: p, expected: g } = Lr(
    { input: f.input, output: f.output, expected: f.expected },
    "AnswerCorrectness"
  ), w = (e = t.factualityWeight) != null ? e : 0.75, P = (r = t.answerSimilarityWeight) != null ? r : 0.25, x = (n = t.answerSimilarity) != null ? n : Ih;
  if (w === 0 && P === 0)
    throw new Error("At least one weight must be nonzero");
  if (w < 0 || P < 0)
    throw new Error("Weights must be non-negative");
  const [T, S] = await Promise.all([
    l.chat.completions.create({
      ...i,
      messages: [
        {
          role: "user",
          content: lt.render(o_, {
            question: d,
            answer: p,
            ground_truth: g
          })
        }
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "classify_statements",
            description: "Classify statements as TP, FP, or FN",
            parameters: Ir(Mu)
          }
        }
      ],
      tool_choice: {
        type: "function",
        function: { name: "classify_statements" }
      }
    }),
    P === 0 ? null : x({ output: p, expected: g })
  ]), y = Mu.parse(
    jr(T)
  ), _ = l_(y), m = (s = S == null ? void 0 : S.score) != null ? s : 0;
  return {
    name: "AnswerCorrectness",
    score: (w * _ + P * m) / (w + P),
    error: m === null ? "AnswerSimilarity failed" : void 0,
    metadata: {
      factuality: y,
      factualityScore: _,
      answerSimilarityScore: m
    }
  };
}, "AnswerCorrectness");
function qr(t) {
  var e, r;
  const { input: n, output: s, expected: i, context: l, ...f } = t, d = {
    model: (e = t.model) != null ? e : Rh,
    temperature: (r = t.temperature) != null ? r : 0
  };
  return t.maxTokens && (d.max_tokens = t.maxTokens), {
    input: n,
    output: s,
    expected: i,
    context: u_(l),
    chatArgs: d,
    client: Ki(f)
  };
}
function u_(t) {
  return t === void 0 ? t : Array.isArray(t) ? t.join(`
`) : t;
}
function Lr(t, e) {
  for (const [r, n] of Object.entries(t))
    if (n === void 0)
      throw new Error(`${e} requires ${r} value`);
  return t;
}
function jr(t) {
  var e, r, n;
  const s = (n = (r = (e = t.choices[0]) == null ? void 0 : e.message.tool_calls) == null ? void 0 : r[0]) == null ? void 0 : n.function.arguments;
  if (!s)
    throw new Error("No tool call returned");
  return JSON.parse(s);
}
var f_ = $t(
  (t) => {
    var e, r;
    const n = oo(t.output) || oo(t.expected), [s, i] = [
      Fu((e = t.output) != null ? e : null, n),
      Fu((r = t.expected) != null ? r : null, n)
    ];
    return {
      name: "ExactMatch",
      score: s === i ? 1 : 0
    };
  },
  "ExactMatch"
);
function oo(t) {
  return typeof t == "object" || Array.isArray(t);
}
function Fu(t, e) {
  if (oo(t))
    return JSON.stringify(t);
  try {
    if (typeof t == "string" && e)
      return JSON.stringify(JSON.parse(t));
  } catch {
  }
  return `${t}`;
}
Ht.battle, Ht.closed_q_a, Ht.humor, Ht.factuality, Ht.possible, Ht.security, Ht.sql, Ht.summary, Ht.translation;
const Du = new td("API_KEY");
async function h_() {
  const t = await Du.prompts.create("test", {
    name: "email-summarizer",
    messages: [
      {
        role: "system",
        content: "Summarize emails concisely, highlighting action items."
      },
      {
        role: "user",
        content: "{{email_content}}"
      }
    ],
    model: "gpt-4",
    temperature: 0.3
  });
  Du.eval(
    {
      project: "test",
      prompt: t.name,
      data: [{ input: "test", output: "test" }],
      task: (e) => "hi, " + e,
      scorers: [Th]
    }
  );
}
h_().then(() => {
  console.log("done");
});
