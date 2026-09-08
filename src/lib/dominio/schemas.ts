import { z } from "zod";

export const tipoCultoSchema = z.enum(["domingo", "quarta", "pg"]);
export const statusCultoSchema = z.enum([
  "rascunho",
  "revisado",
  "aprovado",
  "notificado",
]);

export const pessoaSchema = z.object({
  id: z.string().min(1),
  nome: z.string().min(1),
  telefone: z.string(),
  ativa: z.enum(["true", "false"]).transform((valor) => valor === "true"),
  ministerios: z.string().transform((valor) =>
    valor ? valor.split(";").map((item) => item.trim()).filter(Boolean) : [],
  ),
});

export const cultoSchema = z.object({
  id: z.string().min(1),
  data: z.iso.date(),
  tipo: tipoCultoSchema,
  status: statusCultoSchema,
});

export const escalacaoSchema = z.object({
  id: z.string().min(1),
  data_culto: z.iso.date(),
  funcao: z.string().min(1),
  pessoa_ids: z.string().transform((valor) =>
    valor ? valor.split(";").map((item) => item.trim()).filter(Boolean) : [],
  ),
  grupo: z.string(),
  observacao: z.string(),
});

export const aniversarianteSchema = z.object({
  id: z.string().min(1),
  pessoa_ids: z.string().transform((valor) =>
    valor ? valor.split(";").map((item) => item.trim()).filter(Boolean) : [],
  ),
  nome: z.string().min(1),
  dia: z.coerce.number().int().min(1).max(31),
  mes: z.coerce.number().int().min(1).max(12),
  ano_nascimento: z.string().transform((valor) => (valor ? Number(valor) : undefined)),
  categoria: z.enum(["membro", "crianca", "casamento"]),
  status: z.string(),
  ativo: z.enum(["true", "false"]).transform((valor) => valor === "true"),
});

export type PessoaLinha = z.input<typeof pessoaSchema>;
export type CultoLinha = z.input<typeof cultoSchema>;
export type EscalacaoLinha = z.input<typeof escalacaoSchema>;
export type AniversarianteLinha = z.input<typeof aniversarianteSchema>;

// Tabela de referência fixa (hinario-hcc.csv). Números podem se repetir na
// planilha de origem (falha de cadastro do hinário) — isso é reportado como
// pendência, não corrigido silenciosamente aqui.
export const hinoSchema = z.object({
  numero: z.coerce.number().int().positive(),
  titulo: z.string().trim().min(1),
});

export type HinoLinha = z.input<typeof hinoSchema>;