import type { Escalacao, Hino } from "@/lib/dominio/tipos";

// Edições pontuais do pastor para um culto específico, nunca persistidas
// em cultos.csv. Cada campo sobrescreve a base se presente.
export type OverrideCulto = {
  data: string; // ISO data
  dirigente?: string; // nome customizado (sobrescreve escalação de dirigente)
  escalacoes?: Record<string, string>; // funcao → nome/grupo customizado
  hinos?: number[]; // hinos selecionados para este culto
  observacoes?: string; // observações livres do pastor
  avisos?: string; // avisos customizados (sobrescreve configuracao-ordem.json)
};

export type OrdemTexto = {
  data: string;
  dataBr: string;
  dirigente: string;
  escalacoes: Array<{
    funcao: string;
    responsavel: string;
  }>;
  aniversariantes: Array<{
    dia: number;
    mes: number;
    nome: string;
    categoria: "membro" | "crianca" | "casamento";
  }>;
  hinos: Hino[];
  avisos: string;
  roteiro: Array<{
    passo: number;
    titulo: string;
    descricao?: string;
  }>;
};
