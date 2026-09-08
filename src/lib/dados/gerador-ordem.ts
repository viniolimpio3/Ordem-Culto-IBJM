import type {
  Aniversariante,
  Culto,
  Escalacao,
  Hino,
  Pessoa,
} from "@/lib/dominio/tipos";
import type { OverrideCulto, OrdemTexto } from "@/lib/dominio/overrides";

// Roteiro padrão dos cultos de domingo (temporário; virá de configuracao-ordem.json).
const ROTEIRO_PADRAO = [
  { passo: 1, titulo: "Prelúdio", descricao: "Saudar a Igreja, pedir para os irmãos tomarem seus assentos. Esperar até a música encerrar para iniciar." },
  { passo: 2, titulo: "Ler um salmo", descricao: "Projetar no Datashow e ler todos juntos. Sem comentário após leitura." },
  { passo: 3, titulo: "Oração Inicial", descricao: "Rogando que o Senhor aceite nosso culto." },
  { passo: 4, titulo: "Hino", descricao: "(número será preenchido a partir da seleção)" },
  { passo: 5, titulo: "Momento de Oração", descricao: "País, liderança, enfermos, missionários." },
  { passo: 6, titulo: "Hino", descricao: "(número será preenchido a partir da seleção)" },
  { passo: 7, titulo: "Avisos", descricao: "(será preenchido com avisos customizados)" },
  { passo: 8, titulo: "Momento Missionário", descricao: "" },
  { passo: 9, titulo: "Cânticos", descricao: "4 Cânticos dirigidos pela equipe de música." },
  { passo: 10, titulo: "Oração pelas crianças", descricao: "Pelo culto infantil, professores e pais." },
  { passo: 11, titulo: "Mensagem", descricao: "" },
  { passo: 12, titulo: "Oração final", descricao: "" },
  { passo: 13, titulo: "Poslúdio", descricao: "" },
];

export function gerarOrdemTexto(
  culto: Culto,
  escalacoes: Escalacao[],
  aniversariantes: Aniversariante[],
  pessoas: Pessoa[],
  hinos: Hino[],
  override?: OverrideCulto,
): OrdemTexto {
  const pessoasPorId = new Map(pessoas.map((p) => [p.id, p.nome]));
  const hinosPorNumero = new Map(hinos.map((h) => [h.numero, h]));

  // Dirigente: override > escalação base > padrão
  let dirigente = override?.dirigente || "";
  if (!dirigente) {
    const dirEscalacao = escalacoes.find((e) => e.funcao === "dirigente");
    if (dirEscalacao && dirEscalacao.pessoaIds.length > 0) {
      dirigente = dirEscalacao.pessoaIds
        .map((id) => pessoasPorId.get(id) || id)
        .join(" e ");
    }
  }

  // Escalações: ordena por funcao, aplica overrides
  const escalacoesFinal: Array<{ funcao: string; responsavel: string }> = [];
  const funcoes = new Set(escalacoes.map((e) => e.funcao));
  for (const funcao of funcoes) {
    const override_responsavel = override?.escalacoes?.[funcao];
    if (override_responsavel) {
      escalacoesFinal.push({ funcao, responsavel: override_responsavel });
    } else {
      const escala = escalacoes.find((e) => e.funcao === funcao);
      if (escala) {
        const responsavel =
          escala.pessoaIds.map((id) => pessoasPorId.get(id) || id).join(" e ") || escala.grupo || "(sem responsável)";
        escalacoesFinal.push({ funcao, responsavel });
      }
    }
  }

  // Hinos: override > nenhum (será preenchido manual no roteiro)
  const hinosSelecionados = override?.hinos || [];
  const hinosFinais = hinosSelecionados.map((num) => hinosPorNumero.get(num)).filter(Boolean) as Hino[];

  // Aniversariantes (já vêm filtrados pela semana)
  const dataBr = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
    .format(new Date(`${culto.data}T12:00:00`))
    .split(" ")
    .slice(1)
    .join(" ");
  const diaBr = new Date(`${culto.data}T12:00:00`).getDate();

  return {
    data: culto.data,
    dataBr: `${diaBr}/${culto.data.slice(5, 7)}/${culto.data.slice(0, 4)}`,
    dirigente,
    escalacoes: escalacoesFinal,
    aniversariantes,
    hinos: hinosFinais,
    avisos: override?.avisos || "(avisos serão definidos no roteiro)",
    roteiro: ROTEIRO_PADRAO,
  };
}

export function ordemTextoParaString(ordem: OrdemTexto): string {
  const linhas: string[] = [];

  // Cabeçalho
  linhas.push(``);
  linhas.push(`Ordem de culto para domingo dia ${ordem.dataBr} – Dirigente: ${ordem.dirigente || "(a confirmar)"}`);
  linhas.push(``);

  // Escalações em colunas (máx 2 por linha, espaçadas)
  const escalacoesSemDirigente = ordem.escalacoes.filter((e) => e.funcao !== "dirigente");
  for (let i = 0; i < escalacoesSemDirigente.length; i += 2) {
    const e1 = escalacoesSemDirigente[i];
    const e2 = escalacoesSemDirigente[i + 1];
    const linha1 = `${e1.funcao.replaceAll("_", " ")}: ${e1.responsavel}`;
    if (e2) {
      const espacos = Math.max(0, 40 - linha1.length);
      const linha2 = `${e2.funcao.replaceAll("_", " ")}: ${e2.responsavel}`;
      linhas.push(`${linha1}${" ".repeat(espacos)}${linha2}`);
    } else {
      linhas.push(linha1);
    }
  }
  linhas.push(``);

  // Aniversariantes
  if (ordem.aniversariantes.length > 0) {
    const aniversarioTexto = ordem.aniversariantes
      .map((a) => {
        const prefixo = a.categoria === "casamento" ? "Casam. " : "";
        return `${String(a.dia).padStart(2, "0")} ${prefixo}${a.nome}`;
      })
      .join("; ");
    linhas.push(`Aniversariantes: ${aniversarioTexto};`);
    linhas.push(``);
  }

  // Roteiro com hinos substituídos
  let indexHino = 0;
  for (const passo of ordem.roteiro) {
    let titulo: string;
    if (passo.titulo === "Hino") {
      const hino = ordem.hinos[indexHino];
      titulo = hino ? `${passo.passo}-Hino: ${hino.numero} hcc` : `${passo.passo}-Hino: (a selecionar)`;
      indexHino++;
    } else {
      titulo = `${passo.passo}-${passo.titulo}`;
    }
    linhas.push(``);
    linhas.push(titulo + (passo.descricao ? `: ${passo.descricao}` : ":"));
  }

  linhas.push(``);
  return linhas.join("\n");
}
