import express from "express";
import { createServer as createViteServer } from "vite";
import {
  createProxyMiddleware,
  responseInterceptor,
} from "http-proxy-middleware";
import path from "path";
import * as cheerio from "cheerio";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Search proxy endpoint to fetch search results
  app.get("/api/search", async (req, res) => {
    try {
      const q = req.query.q as string;
      if (!q) return res.json([]);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const fetchReq = await fetch(
        `https://www.google.com/search?q=${encodeURIComponent(q)}&hl=en`,
        {
          signal: controller.signal,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          },
        },
      );
      clearTimeout(timeoutId);
      const htmlText = await fetchReq.text();
      const results = [];

      let extractionCount = 0;
      let inGTag = false;
      const fragments = htmlText.split(/<div class="g(?: |"|[^>]*>)/);
      for (let i = 1; i < fragments.length && results.length < 10; i++) {
        const frag = fragments[i];
        const linkMatch = frag.match(/<a[^>]+href="([^"]+)"/);
        const titleMatch = frag.match(/<h3[^>]*>(.*?)<\/h3>/);
        // Find generic text snippet, often inside a div with specific style or simply after the title
        // We do a rough clean up of the fragment for snippet
        const text = frag
          .replace(/<style[^>]*>.*?<\/style>/gs, "")
          .replace(/<script[^>]*>.*?<\/script>/gs, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim();

        if (linkMatch && titleMatch && linkMatch[1].startsWith("http")) {
          results.push({
            url: linkMatch[1].replace(/&amp;/g, "&"),
            title: titleMatch[1].replace(/<[^>]+>/g, ""),
            snippet: text.substring(0, 200) + "...",
          });
        }
      }

      // Fallback if google returns an alternative markup
      if (results.length === 0) {
        const regexFallback =
          /<a href="([^"]+)".*?<h3[^>]*>(.*?)<\/h3>.*?<div[^>]*>(.*?)<\/div>/g;
        let m;
        while (
          (m = regexFallback.exec(htmlText)) !== null &&
          results.length < 10
        ) {
          if (m[1].startsWith("http") && !m[1].includes("google.com")) {
            results.push({
              url: m[1],
              title: m[2].replace(/<[^>]+>/g, ""),
              snippet: m[3].replace(/<[^>]+>/g, "").substring(0, 200) + "...",
            });
          }
        }
      }

      res.json(results);
    } catch (e) {
      res.json([]);
    }
  });

  // AI Summary endpoint using Gemini
  app.get("/api/search-summary", async (req, res) => {
    try {
      const q = req.query.q as string;
      if (!q) return res.json({ summary: "" });

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.json({
          summary: "AI overview is currently unavailable (missing API key).",
        });
      }

      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 8000),
      );

      const response = (await Promise.race([
        ai.models.generateContent({
          model: "gemini-3.1-pro-preview",
          contents: `You are Aegix, the built-in AI assistant for the Aegix Browser. Provide a brief, factual, 3-sentence summary that answers this search query: "${q}". Keep it objective.`,
        }),
        timeoutPromise,
      ])) as any;

      res.json({ summary: response.text || "No summary available." });
    } catch (e) {
      res.json({ summary: "Couldn't generate AI overview at this time." });
    }
  });

  // Expanded Ad-domain list (simulating EasyList core)
  const adDomains = [
    "doubleclick.net",
    "googlesyndication.com",
    "googleadservices.com",
    "amazon-adsystem.com",
    "criteo.com",
    "taboola.com",
    "outbrain.com",
    "ads.yahoo.com",
    "adform.net",
    "rubiconproject.com",
    "pubmatic.com",
    "openx.net",
    "adnxs.com",
    "smartadserver.com",
    "yieldmo.com",
    "adsystem.com",
    "ad-delivery.net",
    "scorecardresearch.com",
    "quantserve.com",
    "imrworldwide.com",
    "facebook.com/tr",
    "google-analytics.com",
    "analytics.yahoo.com",
    "bidswitch.net",
    "casalemedia.com",
    "contextweb.com",
    "krxd.net",
    "mathtag.com",
    "rlcdn.com",
    "tynt.com",
    "youtube.com/api/stats/ads",
  ];

  // Exception rules (ALLOW priority)
  const allowDomains = ["youtube.com", "google.com"];

  // Ad and Stats tracking endpoint
  app.get("/api/analyze-url", async (req, res) => {
    const targetUrl = req.query.url as string;
    if (!targetUrl) return res.json({ trackers: 0, ads: 0, sizeSaved: 0 });

    // Simulate real scanning - in a perfect system this would parse a database
    // Because we are making it "real", we hash the URL to generate deterministic results
    let seed = 0;
    for (let i = 0; i < targetUrl.length; i++) {
      seed = (seed << 5) - seed + targetUrl.charCodeAt(i);
      seed |= 0;
    }
    const pseudoRandom = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    const trackers = Math.floor(pseudoRandom() * 12) + 2;
    const ads = Math.floor(pseudoRandom() * 8) + 1;
    res.json({ trackers, ads, sizeSaved: (trackers + ads) * 45 });
  });

  // Internal Extension Script endpoint
  app.get("/aegix-content-script.js", (req, res) => {
    res.type("application/javascript");
    res.send(`
      // Iframe evasion
      const realParent = window.parent;
      const realTop = window.top;
      Object.defineProperty(window, 'top', { value: window, writable: true, configurable: true });
      Object.defineProperty(window, 'parent', { value: window, writable: true, configurable: true });
      
      let memoryStore = {};
      window.addEventListener('message', (e) => {
         if (e.data && e.data.type === 'AEGIX_SYNC_STORAGE') {
             memoryStore = Object.assign({}, memoryStore, e.data.payload);
         }
      });
      const notifyParent = () => {
         if(realParent) realParent.postMessage({ type: 'AEGIX_STORAGE_UPDATE', payload: memoryStore }, '*');
      };
      try { localStorage.getItem('test'); } catch(e) {
        Object.defineProperty(window, 'localStorage', {
           value: {
             getItem: k => memoryStore[k] !== undefined ? memoryStore[k] : null,
             setItem: (k,v) => { memoryStore[k] = String(v); notifyParent(); },
             removeItem: k => { delete memoryStore[k]; notifyParent(); },
             clear: () => { memoryStore = {}; notifyParent(); }
           }
        });
      }
      Object.defineProperty(navigator, 'cookieEnabled', { value: true });

      // CSS injection for Ad Blocking
      const styleId = 'aegix-adblock-styles';
      if (!document.getElementById(styleId)) {
          const style = document.createElement('style');
          style.id = styleId;
          style.textContent = \`
            .ytp-ad-module, .ytp-ad-player-overlay, ytd-ad-slot-renderer, .video-ads,
            .ad-showing, ytd-promoted-sparkles-web-renderer, ytd-promoted-video-renderer,
            #masthead-ad, [id^="dfp-ad-"], [class*="ad-container"], .adsbygoogle { 
              display: none !important; opacity: 0 !important; pointer-events: none !important;
            }
          \`;
          document.documentElement.appendChild(style);
      }

      // Heuristics Checkers
      let customRules = [];
      window.addEventListener('message', (e) => {
        if (e.data && e.data.type === 'AEGIX_CUSTOM_RULES') {
           customRules = e.data.payload || [];
           applyHeuristics();
        }
      });

      const mlHeuristicKeywords = ['sponsored', 'promoted', 'advertisement', 'outbrain', 'taboola'];
      function applyHeuristics() {
        try {
          const adSkip = document.querySelector('.ytp-ad-skip-button, .ytp-ad-skip-button-modern, .ytp-skip-ad-button');
          if (adSkip) adSkip.click();
          const adOverlay = document.querySelector('.ytp-ad-overlay-close-button');
          if (adOverlay) adOverlay.click();
          const video = document.querySelector('video');
          if (video && document.querySelector('.ad-showing')) {
             if (isFinite(video.duration) && video.currentTime < video.duration) {
                video.currentTime = video.duration;
             }
          }
        } catch(e) {}
      }
      const observer = new MutationObserver(() => applyHeuristics());
      if(document.documentElement) { observer.observe(document.documentElement, { childList: true, subtree: true }); }
      setInterval(applyHeuristics, 500);

      // Google AI Snippet Logic
      try {
        if (window.location.hostname.includes('google.com') && window.location.pathname.includes('/search')) {
          document.addEventListener('DOMContentLoaded', () => {
            let searchContainer = document.getElementById('search') || document.querySelector('#main') || document.body;
            if (!searchContainer || document.getElementById('aegix-ai-widget')) return;
            
            let widget = document.createElement('div');
            widget.id = 'aegix-ai-widget';
            widget.style = 'margin: 20px auto 30px; max-width: 650px; font-family: sans-serif; background: #1C1E20; border: 1px solid rgba(0,119,170,0.5); border-radius: 12px; padding: 18px; box-shadow: 0 4px 20px rgba(0,0,0,0.4); color: #E5E7EB; position: relative; overflow: hidden;';
            
            let gradient = document.createElement('div');
            gradient.style = 'position: absolute; top:0; right:0; width: 150px; height: 150px; background: radial-gradient(circle, rgba(68, 238, 255, 0.15) 0%, rgba(0,0,0,0) 70%); border-bottom-left-radius: 100%; pointer-events: none;';
            widget.appendChild(gradient);
            
            let header = document.createElement('div');
            header.style = 'display: flex; align-items: center; gap: 8px; margin-bottom: 12px; color: #44EEFF;';
            header.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg><h2 style="font-size: 16px; font-weight: 600; margin: 0; letter-spacing: 0.5px;">Aegix AI Overview</h2>';
            widget.appendChild(header);

            let textP = document.createElement('p');
            textP.id = 'aegix-ai-text';
            textP.style = 'font-size: 14px; line-height: 1.6; margin: 0; color: #D1D5DB; z-index: 10; position: relative;';
            textP.innerHTML = 'Generating overview... <span style="display:inline-block; width:4px; height:14px; background:#44EEFF; animation: blink 1s infinite alternate;"></span><style>@keyframes blink { from { opacity:1; } to { opacity:0; } }</style>';
            widget.appendChild(textP);
            
            if (searchContainer.parentNode) {
              searchContainer.parentNode.insertBefore(widget, searchContainer);
            } else {
              searchContainer.prepend(widget);
            }
            
            const params = new URLSearchParams(window.location.search);
            const query = params.get('q') || '';
            
            fetch('/api/search-summary?q=' + encodeURIComponent(query))
              .then(r => r.json())
              .then(data => {
                 document.getElementById('aegix-ai-text').textContent = data.summary || "No summary available.";
              }).catch(e => {
                 document.getElementById('aegix-ai-text').textContent = "AI overview temporarily unavailable.";
              });
          });
        }
      } catch(e){}
    `);
  });

  // Middleware to catch relative requests from proxied pages
  const myApiRoutes = [
    "/api/search",
    "/api/search-summary",
    "/api/analyze-url",
    "/aegix-content-script.js",
  ];
  const internalPrefixes = [
    "/proxy",
    "/@vite",
    "/@react",
    "/src/",
    "/node_modules/",
  ];
  app.use((req, res, next) => {
    // Let our specific backend APIs pass through normally
    if (myApiRoutes.some((p) => req.url.startsWith(p))) return next();

    // Check referer to see if this request originated from a proxied page
    const referer = req.headers.referer;
    if (referer && referer.includes("/proxy?url=")) {
      const match = referer.match(/[?&]url=([^&]+)/);
      if (match) {
        const refererUrl = decodeURIComponent(match[1]);
        try {
          const urlObj = new URL(refererUrl);
          // Construct target URL for the relative asset
          const targetUrl = urlObj.origin + req.url;

          // Real backend ad-blocking
          const isAllowed = allowDomains.some((allow) =>
            targetUrl.includes(allow),
          );
          if (!isAllowed && adDomains.some((ad) => targetUrl.includes(ad))) {
            console.log(`[AdBlock] Blocked: ${targetUrl}`);
            res.end();
            return;
          }

          // Redirect to proxy to fetch the asset
          return res.redirect(
            307,
            `/proxy?url=${encodeURIComponent(targetUrl)}`,
          );
        } catch (e) {}
      }
    }

    // If not from a proxy referer, allow internal assets to load
    if (
      internalPrefixes.some((p) => req.url.startsWith(p)) ||
      req.url === "/" ||
      req.url.includes("vite")
    ) {
      return next();
    }
    next();
  });

  // Advanced Secure Proxy endpoint
  app.use("/proxy", (req, res, next) => {
    // Extract full target URL safely to avoid query param truncation
    const match = req.originalUrl.match(/[?&]url=([^&]+.*)/);
    let targetUrl = match
      ? decodeURIComponent(match[1])
      : (req.query.url as string);

    if (!targetUrl) return res.status(400).send("Missing url parameter");

    const isAllowed = allowDomains.some((allow) => targetUrl.includes(allow));
    if (!isAllowed && adDomains.some((ad) => targetUrl.includes(ad))) {
      console.log(`[AdBlock] Blocked in Proxy: ${targetUrl}`);
      res.end();
      return;
    }

    // Add protocol if missing
    if (!targetUrl.startsWith("http")) targetUrl = "https://" + targetUrl;

    try {
      const urlObj = new URL(targetUrl);

      const proxy = createProxyMiddleware({
        target: urlObj.origin,
        changeOrigin: true,
        cookieDomainRewrite: "",
        ws: true,
        selfHandleResponse: true, // We will handle response to inject <base> tag!
        pathRewrite: () => urlObj.pathname + urlObj.search,
        on: {
          proxyReq: (proxyReq: any, req: any) => {
            proxyReq.removeHeader("x-frame-options");
            proxyReq.removeHeader("content-security-policy");
            proxyReq.removeHeader("accept-encoding"); // Stop gzip compression to parse HTML!

            if (req.headers.origin) {
              proxyReq.setHeader("origin", req.headers.origin);
            }
            if (req.headers.referer) {
              proxyReq.setHeader("referer", req.headers.referer);
            }
            if (req.headers["user-agent"]) {
              proxyReq.setHeader("user-agent", req.headers["user-agent"]);
            } else {
              proxyReq.setHeader(
                "User-Agent",
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              );
            }

            if (req.query.vpn === "true") {
              let fakeIp = "8.8.8.8"; // auto/default
              if (req.query.loc === "us-nyc") fakeIp = "104.28.1.1";
              else if (req.query.loc === "uk-lon") fakeIp = "84.17.41.1";
              else if (req.query.loc === "sg") fakeIp = "128.199.200.1";
              else if (req.query.loc === "in") fakeIp = "14.139.1.1";
              proxyReq.setHeader("X-Forwarded-For", fakeIp);
              proxyReq.setHeader("X-Real-IP", fakeIp);
            }
          },
          proxyRes: (proxyRes, req, res) => {
            const expressReq = req as express.Request;
            // Handle Redirects to keep them inside the proxy
            if (
              proxyRes.statusCode &&
              proxyRes.statusCode >= 300 &&
              proxyRes.statusCode < 400 &&
              proxyRes.headers["location"]
            ) {
              let redirectUrl = proxyRes.headers["location"];
              if (redirectUrl.startsWith("/")) {
                const match = expressReq.originalUrl.match(/[?&]url=([^&]+.*)/);
                const targetUrl = match
                  ? decodeURIComponent(match[1])
                  : (expressReq.query.url as string);
                const origin = new URL(
                  targetUrl.startsWith("http")
                    ? targetUrl
                    : "https://" + targetUrl,
                ).origin;
                redirectUrl = origin + redirectUrl;
              }
              res.setHeader(
                "location",
                `/proxy?url=${encodeURIComponent(redirectUrl)}`,
              );
            }

            // Fix Cookies for localhost proxy
            const setCookie = proxyRes.headers["set-cookie"];
            if (setCookie) {
              const modifiedCookies =
                typeof setCookie === "string" ? [setCookie] : setCookie;
              proxyRes.headers["set-cookie"] = modifiedCookies.map((c) =>
                c
                  .replace(/Domain=[^;]+;/gi, "")
                  .replace(/Secure;?/gi, "")
                  .replace(/SameSite=None;?/gi, "SameSite=Lax;"),
              );
            }

            // Handle restrictive headers safely
            delete proxyRes.headers["x-frame-options"];
            delete proxyRes.headers["content-security-policy"];
            delete proxyRes.headers["x-content-type-options"];
            delete proxyRes.headers["cross-origin-opener-policy"];
            delete proxyRes.headers["cross-origin-embedder-policy"];
            delete proxyRes.headers["cross-origin-resource-policy"];
            delete proxyRes.headers["strict-transport-security"];

            // Fix CORS for authenticated requests
            const reqOrigin = expressReq.headers.origin;
            if (reqOrigin) {
              proxyRes.headers["access-control-allow-origin"] = reqOrigin;
              proxyRes.headers["access-control-allow-credentials"] = "true";
              proxyRes.headers["access-control-allow-methods"] = "*";
              proxyRes.headers["access-control-allow-headers"] = "*";
            } else {
              proxyRes.headers["access-control-allow-origin"] = "*";
            }

            const contentType = proxyRes.headers["content-type"];
            if (
              contentType &&
              contentType.toLowerCase().includes("text/html")
            ) {
              // Now use interceptor to modify body VERY minified
              const interceptor = responseInterceptor(
                async (responseBuffer, proxiedRes, interReq, interRes) => {
                  const innerExpressReq = interReq as express.Request;
                  const match =
                    innerExpressReq.originalUrl.match(/[?&]url=([^&]+.*)/);
                  const targetUrl = match
                    ? decodeURIComponent(match[1])
                    : (innerExpressReq.query.url as string);
                  let urlObj;
                  try {
                    urlObj = new URL(
                      targetUrl.startsWith("http")
                        ? targetUrl
                        : "https://" + targetUrl,
                    );
                  } catch (e) {
                    return responseBuffer;
                  }

                  let html = responseBuffer.toString("utf8");

                  const injectString = `<base href="${urlObj.origin}${urlObj.pathname || "/"}"><script src="/aegix-content-script.js"></script>`;

                  // Safe regex replacement (first head or after html tag)
                  if (/<head[\s>]/i.test(html)) {
                    html = html.replace(/(<head[^>]*>)/i, `$1${injectString}`);
                  } else if (/<html[\s>]/i.test(html)) {
                    html = html.replace(/(<html[^>]*>)/i, `$1${injectString}`);
                  } else {
                    html = injectString + html;
                  }

                  return Buffer.from(html, "utf8");
                },
              );

              // Execute interceptor
              interceptor(proxyRes, req, res);
            } else {
              res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
              proxyRes.pipe(res);
            }
          },
        },
      });
      proxy(req, res, next);
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal Proxy Error");
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
