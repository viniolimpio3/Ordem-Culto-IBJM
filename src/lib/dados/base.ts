import Papa from "papaparse";
import { lerArquivoBase } from "@/lib/dados/blob";
import {
  aniversarianteSchema,
  cultoSchema,
  escalacaoSchema,
  pessoaSchema,
} from "@/lib/dominio/schemas";
import type {
  Aniversariante,
  Culto,
  Escalacao,
  Pessoa,
} from "@/lib/dominio/tipos";

async function lerCsv<T>(nome: string): Promise<T[]> {
  const conteudo = await lerArquivoBase(nome);
  const resultado = Papa.parse<T>(conteudo, { header: true, skipEmptyLines: true });
  if (resultado.errors.length > 0) {
    throw new Error(`Não foi possível ler ${nome}: ${resultado.errors[0].message}`);
  }
  return resultado.data;
}

function validarReferencias(
  pessoas: Pessoa[],
  cultos: Culto[],
  escalacoes: Escalacao[],
) {
  const idsPessoas = new Set(pessoas.map((pessoa) => pessoa.id));
  const datasCultos = new Set(cultos.map((culto) => culto.data));
  const problemas: string[] = [];

  for (const escalacao of escalacoes) {
    if (!datasCultos.has(escalacao.dataCulto)) {
      problemas.push(`Escalação ${escalacao.id} aponta para culto inexistente.`);
    }
    for (const pessoaId of escalacao.pessoaIds) {
      if (!idsPessoas.has(pessoaId)) {
        problemas.push(`Escalação ${escalacao.id} aponta para pessoa inexistente.`);
      }
    }
  }
  return problemas;
}

export async function carregarBase() {
  const [pessoasBrutas, cultosBrutos, escalacoesBrutas, aniversariantesBrutos] =
    await Promise.all([
      lerCsv("pessoas.csv"),
      lerCsv("cultos.csv"),
      lerCsv("escalacoes.csv"),
      lerCsv("aniversariantes.csv"),
    ]);

  const pessoas = pessoasBrutas.map((linha) => pessoaSchema.parse(linha)) as Pessoa[];
  const cultos = cultosBrutos.map((linha) => cultoSchema.parse(linha)) as Culto[];
  const escalacoes = escalacoesBrutas.map((linha) => {
    const escala = escalacaoSchema.parse(linha);
    return {
      ...escala,
      dataCulto: escala.data_culto,
      pessoaIds: escala.pessoa_ids,
    } as Escalacao;
  });
  const aniversariantes = aniversariantesBrutos.map((linha) => {
    const aniv = aniversarianteSchema.parse(linha);
    return {
      ...aniv,
      pessoaIds: aniv.pessoa_ids,
    } as Aniversariante;
  });
  const problemas = validarReferencias(pessoas, cultos, escalacoes);

  return { pessoas, cultos, escalacoes, aniversariantes, problemas };
}

export function obterProximoCulto(cultos: Culto[], hoje = new Date()) {
  const dataHoje = hoje.toISOString().slice(0, 10);
  return cultos
    .filter((culto) => culto.data >= dataHoje && culto.tipo === "domingo")
    .sort((a, b) => a.data.localeCompare(b.data))[0];
}

export function obterCultoPorData(cultos: Culto[], data: string) {
  return cultos.find((culto) => culto.data === data);
}

export function obterCultosDomingoOrdenados(cultos: Culto[]) {
  return cultos
    .filter((culto) => culto.tipo === "domingo")
    .sort((a, b) => a.data.localeCompare(b.data));
}

// Regra de negócio: no culto de domingo, os aniversariantes anunciados vão
// do próprio domingo (data do culto) até o sábado seguinte (janela de 7 dias),
// não do mês inteiro. Cobre também aniversários de casamento (mesma janela).
export function aniversariantesNaSemana(
  aniversariantes: Aniversariante[],
  dataCultoIso: string,
) {
  const inicio = new Date(`${dataCultoIso}T12:00:00`);
  const chaves = new Set<string>();
  for (let deslocamento = 0; deslocamento < 7; deslocamento++) {
    const dia = new Date(inicio);
    dia.setDate(inicio.getDate() + deslocamento);
    chaves.add(`${dia.getMonth() + 1}-${dia.getDate()}`);
  }
  return aniversariantes
    .filter((item) => item.ativo && chaves.has(`${item.mes}-${item.dia}`))
    .sort((a, b) => a.dia - b.dia);
}