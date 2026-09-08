import { list } from "@vercel/blob";
import { readFile } from "node:fs/promises";
import path from "node:path";

const caminhoBaseLocal = path.resolve(process.cwd(), "..", "database");

let cacheUrlsBlobs: Map<string, string> | null = null;
let expiracaoCache = 0;
let promessaListagemEmAndamento: Promise<Map<string, string>> | null = null;

const TTL_CACHE_MS = 60 * 1000; // 1 minuto de cache da lista de URLs

async function obterMapaUrlsBlobs(token: string): Promise<Map<string, string>> {
  const agora = Date.now();
  if (cacheUrlsBlobs && agora < expiracaoCache) {
    return cacheUrlsBlobs;
  }

  if (promessaListagemEmAndamento) {
    return promessaListagemEmAndamento;
  }

  promessaListagemEmAndamento = (async () => {
    try {
      const { blobs } = await list({ token });
      const mapa = new Map<string, string>();
      for (const blob of blobs) {
        mapa.set(blob.pathname, blob.downloadUrl || blob.url);
      }
      cacheUrlsBlobs = mapa;
      expiracaoCache = Date.now() + TTL_CACHE_MS;
      return mapa;
    } finally {
      promessaListagemEmAndamento = null;
    }
  })();

  return promessaListagemEmAndamento;
}

export function invalidarCacheBlobs() {
  cacheUrlsBlobs = null;
  expiracaoCache = 0;
}

export async function lerArquivoBase(nomeArquivo: string): Promise<string> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (token) {
    const mapa = await obterMapaUrlsBlobs(token);
    const url = mapa.get(nomeArquivo);

    if (!url) {
      throw new Error(`Arquivo "${nomeArquivo}" não foi encontrado no Vercel Blob.`);
    }

    const resposta = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!resposta.ok) {
      throw new Error(
        `Erro ao baixar "${nomeArquivo}" do Vercel Blob: status ${resposta.status} ${resposta.statusText}`,
      );
    }

    return await resposta.text();
  }

  // Fallback caso BLOB_READ_WRITE_TOKEN não esteja definido (ex: desenvolvimento offline)
  const caminhoLocal = path.join(caminhoBaseLocal, nomeArquivo);
  return await readFile(caminhoLocal, "utf8");
}
