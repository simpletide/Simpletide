/**
 * Gzips responses from the local production server.
 *
 * Nitro's node-server preset serves uncompressed, but Vercel compresses every
 * text response. Measuring through this proxy keeps the Lighthouse numbers
 * representative of production instead of overstating transfer by ~3x.
 */
import { createServer } from "node:http";
import { request } from "node:http";
import { createGzip } from "node:zlib";

const UPSTREAM = process.env.UPSTREAM_PORT ?? 3000;
const PORT = process.env.PROXY_PORT ?? 3100;
const COMPRESSIBLE = /text\/|application\/(javascript|json|xml)|image\/svg/;

createServer((req, res) => {
  const proxyReq = request(
    { hostname: "127.0.0.1", port: UPSTREAM, path: req.url, method: req.method, headers: { ...req.headers, host: `127.0.0.1:${UPSTREAM}`, "accept-encoding": "identity" } },
    (upstream) => {
      const type = upstream.headers["content-type"] ?? "";
      const headers = { ...upstream.headers };
      delete headers["content-length"];

      if (COMPRESSIBLE.test(type)) {
        headers["content-encoding"] = "gzip";
        res.writeHead(upstream.statusCode ?? 200, headers);
        upstream.pipe(createGzip()).pipe(res);
      } else {
        res.writeHead(upstream.statusCode ?? 200, headers);
        upstream.pipe(res);
      }
    },
  );
  proxyReq.on("error", () => {
    res.writeHead(502);
    res.end("upstream error");
  });
  req.pipe(proxyReq);
}).listen(PORT, () => console.log(`gzip proxy on http://localhost:${PORT} -> ${UPSTREAM}`));
