import Papa from "papaparse";
import { lerArquivoBase } from "@/lib/dados/blob";
import { hinoSchema } from "@/lib/dominio/schemas";
import type { Hino } from "@/lib/dominio/tipos";

// Hinário HCC: tabela fixa de referência (não muda por atualização de agenda).
// Validado linha a linha porque a planilha de origem tem defeitos conhecidos
// (números repetidos, uma linha com aspas malformadas no título) — cada linha
// inválida vira uma pendência reportada ao pastor, em vez de ser descartada
// ou "corrigida" silenciosamente pelo app.
export async function carregarHinario() {
  const conteudo = await lerArquivoBase("hinario-hcc.csv");
  const resultado = Papa.parse<Record<string, string>>(conteudo, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (cabecalho) => cabecalho.trim(),
  });

  const hinos: Hino[] = [];
  const problemas: string[] = [];

  resultado.data.forEach((linha, indice) => {
    const validado = hinoSchema.safeParse(linha);
    if (!validado.success) {
      problemas.push(`Hinário: linha ${indice + 2} inválida (${JSON.stringify(linha)}).`);
      return;
    }
    hinos.push(validado.data);
  });

  const contagemPorNumero = new Map<number, number>();
  for (const hino of hinos) {
    contagemPorNumero.set(hino.numero, (contagemPorNumero.get(hino.numero) ?? 0) + 1);
  }
  for (const [numero, quantidade] of contagemPorNumero) {
    if (quantidade > 1) {
      problemas.push(`Hinário: número ${numero} aparece ${quantidade} vezes com títulos possivelmente diferentes.`);
    }
  }

  return { hinos, problemas };
}
