export const TIPOS_CULTO = ["domingo", "quarta", "pg"] as const;
export type TipoCulto = (typeof TIPOS_CULTO)[number];

export const STATUS_CULTO = [
  "rascunho",
  "revisado",
  "aprovado",
  "notificado",
] as const;
export type StatusCulto = (typeof STATUS_CULTO)[number];

export type Pessoa = {
  id: string;
  nome: string;
  telefone: string;
  ativa: boolean;
  ministerios: string[];
};

export type Culto = {
  id: string;
  data: string;
  tipo: TipoCulto;
  status: StatusCulto;
};

export type Escalacao = {
  id: string;
  dataCulto: string;
  funcao: string;
  pessoaIds: string[];
  grupo: string;
  observacao: string;
};

export type Hino = {
  numero: number;
  titulo: string;
};

export type Aniversariante = {
  id: string;
  pessoaIds: string[];
  nome: string;
  dia: number;
  mes: number;
  anoNascimento?: number;
  categoria: "membro" | "crianca" | "casamento";
  status: string;
  ativo: boolean;
};