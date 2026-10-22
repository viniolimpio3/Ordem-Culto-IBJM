import { NextRequest, NextResponse } from "next/server";
import {
  carregarBase,
  obterCultoPorData,
  obterProximoCulto,
} from "@/lib/dados/base";
import enviarMensagem from "@/app/api/services/meta";
import { formatarFuncao } from "@/lib/utils/formato";
import sendMail from "../services/mail";

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

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (req.method !== "GET") {
    return NextResponse.json(
      { error: "Método não permitido" },
      { status: 405 }
    );
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: "Não autorizado" },
      { status: 401 }
    );
  }

  const url = new URL(req.url ?? "", `http://${req.headers.get("host")}`);

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
    return NextResponse.json(
      { error: "Nenhuma escala encontrada" },
      { status: 404 }
    );
  }

  let bypassOnlyReturnData = url.searchParams.get("bypass");
  if (bypassOnlyReturnData) {
    return NextResponse.json(
      {
        success: true,
        message: "Escala encontrada",
        escala,
      },
      { status: 200 }
    );
  }

  // Agrupar dados por pessoa
  let escalaPorPessoa: Record<string, PessoaEscala> = {};
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

    let metaResponses : any[] = []
    // Enviar mensagens via Meta API - para cada pessoa nas escalas escalaPorPessoa, envia 1 mensagem por pessoa, concatenando funções com "; "
    for (const pessoaId in escalaPorPessoa) {
      const pessoaData = escalaPorPessoa[pessoaId];

      const funcoesConcatenadas = pessoaData.escalas.map(e => e.funcao).join("; ");
      const data = pessoaData.escalas[0].dataCulto; // Considera a primeira data da escala somente.

      if (pessoaData && pessoaData.isCelular) {
        let response = await enviarMensagem({
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
        metaResponses.push({ pessoaId, status: "sent", response });
      }

    }

    // Enviar e-mails com as escalas e respostas do Meta API
    sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_TO,
      subject: "Escalas e respostas do Meta API - " + new Date().toLocaleDateString(),
      text: JSON.stringify({ escalaPorPessoa, metaResponses }, null, 2)
    });


    return NextResponse.json(
      {
        success: true,
        message: "Mensagens enviadas com sucesso",
        escalaPorPessoa
      },
      { status: 200 }
    );
    
  } catch (error) {

    return NextResponse.json(
      { error: "Erro ao enviar mensagens", details: error },
      { status: 500 }
    );
  }
}