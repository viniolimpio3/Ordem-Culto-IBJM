// api/culto/proximo.ts

import {
  carregarBase,
  obterCultoPorData,
  obterProximoCulto
} from "../../src/lib/dados/base";

import enviarMensagem from "../services/meta";

import { formatarFuncao } from "../../src/lib/utils/formato";

import type { IncomingMessage, ServerResponse } from "http";

interface PessoaEscalaItem {
  funcao: string;
  dataCulto: string;
  observacao?: string;
}

interface PessoaEscala {
  nome: string;
  telefone: string;
  isCelular: boolean | undefined;
  escalas: PessoaEscalaItem[];
}

interface PessoaEscalaPessoa {
  id: string;
  nome: string;
  telefone: string;
  isCelular: boolean | undefined;
}

interface Escala {
  funcao: string;
  dataCulto: string;
  pessoas: (PessoaEscalaPessoa | null)[];
  observacao?: string;
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
) {
  if (req.method !== "GET") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");

    res.end(
      JSON.stringify({
        error: "Método não permitido",
      })
    );

    return;
  }

  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: "Não autorizado" }));
    return;
  }

  const url = new URL(req.url ?? "", `http://${req.headers.host}`);

  const dataSelecionada = url.searchParams.get("data");
  const base = await Promise.resolve(carregarBase());

  const culto = dataSelecionada
    ? (obterCultoPorData(base.cultos, dataSelecionada) ?? obterProximoCulto(base.cultos))
    : obterProximoCulto(base.cultos);

  const escalacoes = culto
    ? base.escalacoes.filter((escala) => escala.dataCulto === culto.data)
    : [];
  const pessoas = base.pessoas;

  let escala: Escala[] = escalacoes.map((escala): Escala => {
    return {
      "funcao": formatarFuncao(escala.funcao),
      "dataCulto": escala.dataCulto.split("-").reverse().join("/"), // Data formatada de yyyy-mm-dd para dd/mm/yyyy
      "pessoas": escala.pessoaIds.map((id) => {
        const pessoa = pessoas.find((p) => p.id === id);
        const isCelular = pessoa?.telefone.length === 11 || pessoa?.telefone.length === 13;

        const telefone = pessoa?.telefone.startsWith("55") ? pessoa.telefone : `55${pessoa?.telefone}`;

        return pessoa ? {
          id: pessoa.id,
          nome: pessoa.nome.split(" ")[0],
          telefone: telefone,
          isCelular: isCelular
        } : null;
      }),
      "observacao": escala.observacao
    }
  });

  if (escala.length === 0) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        error: "Nenhuma escala encontrada",
      })
    );
    return;
  }

  let bypassOnlyReturnData = url.searchParams.get("bypass");
  if (bypassOnlyReturnData) {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");

    res.end(JSON.stringify({
      success: true,
      message: "Escala encontrada",
      escala,
    }));
    return;
  }

  // Agrupar dados por pessoa
  const escalaPorPessoa: Record<string, PessoaEscala> = {};
  for (const item of escala) {

    // Verificar se o item possui pessoas
    if (!item.pessoas || item.pessoas.length === 0) {
      continue;
    }

    for (const pessoa of item.pessoas) {
      if (!pessoa) {
        continue;
      }

      if (!escalaPorPessoa[pessoa.id]) {
        escalaPorPessoa[pessoa.id] = {
          nome: pessoa.nome,
          telefone: pessoa.telefone,
          isCelular: pessoa.isCelular,
          escalas: []
        };
      }
      escalaPorPessoa[pessoa.id].escalas.push({
        funcao: item.funcao,
        dataCulto: item.dataCulto,
        observacao: item.observacao,
      });
    }
  }

  try {

    // Enviar mensagens via Meta API - para cada pessoa nas escalas escalaPorPessoa, envia 1 mensagem por pessoa, concatenando funções com "; "
    for (const pessoaId in escalaPorPessoa) {
      const pessoaData = escalaPorPessoa[pessoaId];

      const funcoesConcatenadas = pessoaData.escalas.map(e => e.funcao).join("; ");
      const data = pessoaData.escalas[0].dataCulto; // Considera a primeira data da escala somente.

      if (pessoaData && pessoaData.isCelular) {
        await enviarMensagem({
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": pessoaData.telefone,
            "type": "template",
            "template": {
              "name": "avisos_escala",
              "language": {
                "code": "pt_BR"
              },
              "components": [
                {
                  "type": "body",
                  "parameters": [
                    {
                      "type": "text",
                      "parameter_name": "nome",
                      "text": pessoaData.nome
                    },
                    {
                      "type": "text",
                      "parameter_name": "data",
                      "text": data
                    },
                    {
                      "type": "text",
                      "parameter_name": "escala",
                      "text": funcoesConcatenadas
                    }
                  ]
                }
              ]
            }
          });
        }
      
    }
    

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");

    res.end(JSON.stringify({
      success: true,
      message: "Mensagens enviadas com sucesso",
      escala,
    }));
  } catch (error) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        error: "Erro ao enviar mensagens",
        details: error
      })
    );
  }
}