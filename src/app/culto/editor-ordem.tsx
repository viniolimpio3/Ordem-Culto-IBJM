"use client";

import { useState, useMemo } from "react";
import { formatarFuncao, formatarListaNomes } from "@/lib/utils/formato";
import type { Pessoa, Escalacao, Aniversariante, Hino } from "@/lib/dominio/tipos";

type Props = {
  dataCulto: string;
  escalacoes: Escalacao[];
  aniversariantes: Aniversariante[];
  pessoas: Pessoa[];
  hinos: Hino[];
};

type BlocoEscalacao = {
  id: string;
  funcao: string;
  pessoaIds: string[];
  grupo: string;
  observacao: string;
};

type BlocoAniversariante = {
  id: string;
  pessoaIds: string[];
  nome: string;
  dia: number;
  mes: number;
  categoria: "membro" | "crianca" | "casamento";
  ativo: boolean;
};

type BlocoRoteiro = {
  id: string;
  passo: number;
  titulo: string;
  tipo: "roteiro" | "hino" | "avisos" | "missionario" | "custom";
  conteudo: string;
  hinoNumero?: number;
  ordem: number;
};

type BlocoCustom = {
  id: string;
  passo?: number;
  titulo: string;
  tipo: "custom";
  conteudo: string;
  hinoNumero?: number;
  ordem: number;
};

type EstadoEditor = {
  dirigente: string;
  escalacoes: BlocoEscalacao[];
  aniversariantes: BlocoAniversariante[];
  blocos: BlocoRoteiro[];
  custom: BlocoCustom[];
};

export function EditorOrdem({ dataCulto, escalacoes, aniversariantes, pessoas, hinos }: Props) {
  const roteiroPadrao: BlocoRoteiro[] = [
    { id: "rot1", passo: 1, titulo: "Prelúdio", tipo: "roteiro", conteudo: "Saudar a Igreja.", ordem: 1 },
    { id: "rot2", passo: 2, titulo: "Leitura devocional", tipo: "roteiro", conteudo: "", ordem: 2 },
    { id: "rot3", passo: 3, titulo: "Oração Inicial", tipo: "roteiro", conteudo: "", ordem: 3 },
    { id: "rot4", passo: 4, titulo: "Hino", tipo: "hino", conteudo: "", ordem: 4 },
    { id: "rot5", passo: 5, titulo: "Momento de Oração", tipo: "roteiro", conteudo: "Pela liderança e membros da igreja e aqueles que nos visitam, pelos enfermos e desempregados. Aniversariantes", ordem: 5 },
    { id: "rot6", passo: 6, titulo: "Hino - Dízimos e ofertas", tipo: "hino", conteudo: "", ordem: 6 },
    { id: "rot7", passo: 7, titulo: "Avisos", tipo: "avisos", conteudo: "Será projetado:\n- Segunda: Folga Pastoral\n- Terça: Correndo para o Alvo no Parque da Juventude às 20h\n- Quarta: Culto de Oração às 19h30\n- Quinta: Ministério de Esporte às 19h\n- Dom: EBD às 17h\n- Dom: Sala de Oração às 18h10, ao lado do salão social.", ordem: 7 },
    { id: "rot8", passo: 8, titulo: "Momento Missionário", tipo: "missionario", conteudo: "Oração pelos missionários: \n- Jonny e Thais (Áustria)\n- Alexandre Conde (Tocantins)\n- Alexandre Takao (Assai)\n- Igreja sobre Rodas (Giovane e equipe)\n- Pr. Eliel (Mexico).\n- Pr. Zacarias (Moçambique). \n- Pelo Victor, Rafael, Armando e Pr. Marcos e suas famílias e estudos do Vinicius.", ordem: 8 },
    { id: "rot9", passo: 9, titulo: "Cânticos", tipo: "roteiro", conteudo: "4 Cânticos. Quero convidar a equipe de música da igreja para dirigir os cânticos.", ordem: 9 },
    { id: "rot10", passo: 10, titulo: "Oração pelas crianças", tipo: "roteiro", conteudo: "Pelo culto infantil (não é cultinho), pelos professores e pais.", ordem: 10 },
    { id: "rot11", passo: 11, titulo: "Mensagem", tipo: "roteiro", conteudo: "", ordem: 11 },
    { id: "rot12", passo: 12, titulo: "Oração final", tipo: "roteiro", conteudo: "", ordem: 12 },
    { id: "rot13", passo: 13, titulo: "Poslúdio", tipo: "roteiro", conteudo: "", ordem: 13 },
  ];

  const [estado, setEstado] = useState<EstadoEditor>({
    dirigente: "",
    escalacoes: escalacoes.map((e) => ({ 
      ...e,
      pessoaIds: Array.isArray(e.pessoaIds) ? e.pessoaIds : [],
    })),
    aniversariantes: aniversariantes.map((a) => ({ ...a })),
    blocos: roteiroPadrao,
    custom: [],
  });

  const [resetKeyEscalacoes, setResetKeyEscalacoes] = useState(0);
  const [expandido, setExpandido] = useState({
    escalacoes: true,
    aniversariantes: true,
    roteiro: true,
  });

  const pessoasPorId = useMemo(
    () => new Map(pessoas.map((p) => [p.id, p.nome])),
    [pessoas]
  );

  const hinosPorNumero = useMemo(
    () => new Map(hinos.map((h) => [h.numero, h.titulo])),
    [hinos]
  );

  // Formata grupo de Cantina com display customizado
  const formatarGrupo = (grupo: string): string => {
    let dexPara: Record<string, string> = {
      "insight_jovens_e_adolescentes": "Insight (Jovens e Adolescentes)",
      "recepcao": "Recepção",
      "clube_biblico_juniores": "Clube Bíblico Juniores",
      "homens": "Homens",
      "ministerio_homens": "Homens",
      "min_paulo": "Ministério Paulo",
      "soldadinhos_de_jesus": "Soldadinhos de Jesus",
      "desperta_debora": "Desperta Débora"
    };
  
    return dexPara[grupo] || grupo;
  };

  // Converte markdown simples (*bold*) para HTML
  const converterMarkdownParaHtml = (texto: string): string => {
    return texto.replace(/\*(.*?)\*/g, "<strong>$1</strong>");
  };

  // Gerar preview de texto
  const previewOrdem = useMemo(() => {
    const linhas: string[] = [];
    const dataBr = new Date(`${dataCulto}T12:00:00`);
    const dia = dataBr.getDate();
    const mes = String(dataBr.getMonth() + 1).padStart(2, "0");
    const ano = dataBr.getFullYear();

    linhas.push("");
    const dirigenteLinha = estado.dirigente 
      ? `*Ordem de culto para domingo dia ${dia}/${mes}/${ano} – Dirigente:* ${estado.dirigente}`
      : `*Ordem de culto para domingo dia ${dia}/${mes}/${ano}*`;
    linhas.push(dirigenteLinha);

    // Escalações
    for (const escala of estado.escalacoes) {
      const nomes = escala.pessoaIds.map((id) => pessoasPorId.get(id) || id);
      const grupoFormatado = escala.grupo ? formatarGrupo(escala.grupo) : "";
      const responsavel = nomes.length > 0 ? formatarListaNomes(nomes) : grupoFormatado || "(sem responsável)";
      linhas.push(`*${formatarFuncao(escala.funcao)}:* ${responsavel}`);
    }
    linhas.push("");

    // Aniversariantes
    if (estado.aniversariantes.length > 0) {
      const bday = estado.aniversariantes
        .map((a) => {
          const prefixo = a.categoria === "casamento" ? "Casam. " : "";
          return `${String(a.dia).padStart(2, "0")} ${prefixo}${a.nome}`;
        })
        .join("; ");
      linhas.push(`*Aniversariantes:* ${bday};`);
      linhas.push("");
    }

    // Blocos de roteiro ordenados
    const blocos = [...estado.blocos, ...estado.custom].sort((a, b) => a.ordem - b.ordem);
    
    blocos.forEach((bloco, idx) => {
      const isRoteiro = !bloco.id.startsWith("custom-");
      const numeroSequencial = idx + 1; // Número baseado na posição atual
      
      if (isRoteiro && (bloco as BlocoRoteiro).tipo === "hino" && (bloco as BlocoRoteiro).hinoNumero) {
        const hinoNumero = (bloco as BlocoRoteiro).hinoNumero!;
        const titulo = hinosPorNumero.get(hinoNumero);
        linhas.push(`*${numeroSequencial} - ${bloco.titulo}:* ${hinoNumero} hcc${titulo ? ` - ${titulo}` : ""}`);
      } else {
        const conteudoLinhas = bloco.conteudo ? bloco.conteudo.split("\n").filter(l => l.trim()) : [];
        if (conteudoLinhas.length > 0) {
          linhas.push(`*${numeroSequencial} - ${bloco.titulo}:* ${conteudoLinhas[0]}`);
          for (let i = 1; i < conteudoLinhas.length; i++) {
            linhas.push(conteudoLinhas[i]);
          }
        } else {
          linhas.push(`*${numeroSequencial} - ${bloco.titulo}:*`);
        }
      }
    });

    linhas.push("");
    return linhas.join("\n");
  }, [estado, dataCulto, pessoasPorId, hinosPorNumero]);

  const copiarOrdem = () => {
    navigator.clipboard.writeText(previewOrdem);
    alert("Ordem copiada para a área de transferência!");
  };

  const reordenarBloco = (id: string, direcao: "cima" | "baixo") => {
    setEstado((prev) => {
      // Trabalhar com lista unificada de blocos (padrão + custom) ordenados
      let todos = [...prev.blocos, ...prev.custom].sort((a, b) => a.ordem - b.ordem);
      const idx = todos.findIndex((b) => b.id === id);
      if (idx === -1) return prev;

      // Mover o bloco para a nova posição
      const novaPos = direcao === "cima" ? Math.max(0, idx - 1) : Math.min(todos.length - 1, idx + 1);
      
      // Se a posição não mudou, retornar
      if (novaPos === idx) return prev;

      // Remover e reinserir na nova posição
      const [bloco] = todos.splice(idx, 1);
      todos.splice(novaPos, 0, bloco);

      // Re-atribuir ordem sequencial (1, 2, 3, ...)
      todos = todos.map((b, i) => ({ ...b, ordem: i + 1 }));

      // Retornar com blocos separados
      const blocosPadrao = todos.filter((b) => !b.id.startsWith("custom-")) as BlocoRoteiro[];
      const custom = todos.filter((b) => b.id.startsWith("custom-")) as BlocoCustom[];

      return { ...prev, blocos: blocosPadrao, custom };
    });
  };

  const atualizarHino = (id: string, numero: number) => {
    setEstado((prev) => ({
      ...prev,
      blocos: prev.blocos.map((b) => (b.id === id ? { ...b, hinoNumero: numero } : b)),
      custom: prev.custom.map((c) => (c.id === id ? { ...c, conteudo: String(numero) } : c)),
    }));
  };

  const adicionarBlocoAniversariante = () => {
    const novoId = `aniv-${Date.now()}`;
    setEstado((prev) => ({
      ...prev,
      aniversariantes: [
        ...prev.aniversariantes,
        {
          id: novoId,
          pessoaIds: [],
          nome: "(novo)",
          dia: 1,
          mes: 1,
          categoria: "membro",
          ativo: true,
        },
      ],
    }));
  };

  const removerBlocoAniversariante = (id: string) => {
    setEstado((prev) => ({
      ...prev,
      aniversariantes: prev.aniversariantes.filter((a) => a.id !== id),
    }));
  };

  const adicionarBlocoCustom = () => {
    const novoId = `custom-${Date.now()}`;
    const maxOrdem = Math.max(...estado.blocos.map((b) => b.ordem), ...estado.custom.map((c) => c.ordem), 0);
    const nextPasso = Math.max(...estado.blocos.map((b) => b.passo), ...estado.custom.map((c) => c.passo || 0), 0) + 1;
    setEstado((prev) => ({
      ...prev,
      custom: [
        ...prev.custom,
        {
          id: novoId,
          passo: nextPasso,
          titulo: "Novo bloco",
          tipo: "custom",
          conteudo: "",
          ordem: maxOrdem + 1,
        },
      ],
    }));
  };

  const removerBlocoCustom = (id: string) => {
    setEstado((prev) => ({
      ...prev,
      custom: prev.custom.filter((c) => c.id !== id),
    }));
  };

  const atualizarBlocoCustom = (id: string, titulo: string, conteudo: string) => {
    setEstado((prev) => ({
      ...prev,
      custom: prev.custom.map((c) => (c.id === id ? { ...c, titulo, conteudo } : c)),
    }));
};

  return (
    <div className="editor-ordem-inline">
      {/* Blocos de Escalações */}
      <section className="bloco-edicao">
        <button
          className="bloco-header"
          onClick={() => setExpandido({ ...expandido, escalacoes: !expandido.escalacoes })}
        >
          <h3>Escalações ({estado.escalacoes.length})</h3>
          <span className="toggle-icon">{expandido.escalacoes ? "▼" : "▶"}</span>
        </button>

        {expandido.escalacoes && (
          <div className="bloco-conteudo">
            {estado.escalacoes.map((escala) => (
              <div key={escala.id} className="escalacao-card">
                <div className="escalacao-header">
                  <strong>{formatarFuncao(escala.funcao)}</strong>
                </div>

                <div className="escalacao-pessoas">
                  <div className="pessoas-selecionadas">
                    {escala.pessoaIds.length > 0 ? (
                      <div className="tags">
                        {escala.pessoaIds.map((id) => (
                          <span key={id} className="tag">
                            {pessoasPorId.get(id) || id}
                            <button
                              type="button"
                              onClick={() =>
                                setEstado((prev) => ({
                                  ...prev,
                                  escalacoes: prev.escalacoes.map((e) =>
                                    e.id === escala.id
                                      ? { ...e, pessoaIds: e.pessoaIds.filter((pid) => pid !== id) }
                                      : e
                                  ),
                                }))
                              }
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="vazio">{escala.grupo ? formatarGrupo(escala.grupo) : "(sem responsável)"}</p>
                    )}
                  </div>

                  {escala.funcao.toLowerCase().includes("cantina") ? (
                    // Para Cantina: mostrar dropdown de ministérios/grupos
                    <select
                      key={`cantina-${escala.id}-${resetKeyEscalacoes}`}
                      onChange={(e) => {
                        if (e.target.value) {
                          setEstado((prev) => ({
                            ...prev,
                            escalacoes: prev.escalacoes.map((esc) =>
                              esc.id === escala.id
                                ? { ...esc, grupo: e.target.value }
                                : esc
                            ),
                          }));
                          setResetKeyEscalacoes((k) => k + 1);
                        }
                      }}
                    >
                      <option value="">Selecionar 
                        ministério...</option>
                      {[
                        "soldadinhos_de_jesus",
                        "clube_biblico_juniores",
                        "homens",
                        "insight_jovens_e_adolescentes",
                        "desperta_debora",
                        "min_paulo",
                      ]
                        .filter((grupo) => grupo) // Filtrar grupos válidos
                        .map((grupo) => (
                          <option key={grupo} value={grupo}>
                            {formatarGrupo(grupo)}
                          </option>
                        ))}
                    </select>
                  ) : (
                    // Para outras funções: mostrar dropdown de pessoas
                    <select
                      key={`pessoas-${escala.id}-${resetKeyEscalacoes}`}
                      onChange={(e) => {
                        if (e.target.value) {
                          setEstado((prev) => ({
                            ...prev,
                            escalacoes: prev.escalacoes.map((esc) =>
                              esc.id === escala.id
                                ? {
                                    ...esc,
                                    pessoaIds: [...new Set([...esc.pessoaIds, e.target.value])],
                                  }
                                : esc
                            ),
                          }));
                          setResetKeyEscalacoes((k) => k + 1);
                        }
                      }}
                    >
                      <option value="">+ Adicionar pessoa</option>
                      {pessoas.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nome}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Blocos de Aniversariantes */}
      <section className="bloco-edicao">
        <button
          className="bloco-header"
          onClick={() => setExpandido({ ...expandido, aniversariantes: !expandido.aniversariantes })}
        >
          <h3>Aniversariantes da semana ({estado.aniversariantes.length})</h3>
          <span className="toggle-icon">{expandido.aniversariantes ? "▼" : "▶"}</span>
        </button>

        {expandido.aniversariantes && (
          <div className="bloco-conteudo">
            {estado.aniversariantes.map((aniv) => (
              <div key={aniv.id} className="aniversariante-card-compact">
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={aniv.dia}
                  onChange={(e) =>
                    setEstado((prev) => ({
                      ...prev,
                      aniversariantes: prev.aniversariantes.map((a) =>
                        a.id === aniv.id ? { ...a, dia: parseInt(e.target.value) || 1 } : a
                      ),
                    }))
                  }
                  className="input-data-dia"
                  placeholder="DD"
                />
                <span className="data-separator">/</span>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={aniv.mes}
                  onChange={(e) =>
                    setEstado((prev) => ({
                      ...prev,
                      aniversariantes: prev.aniversariantes.map((a) =>
                        a.id === aniv.id ? { ...a, mes: parseInt(e.target.value) || 1 } : a
                      ),
                    }))
                  }
                  className="input-data-mes"
                  placeholder="MM"
                />
                <input
                  type="text"
                  value={aniv.nome}
                  onChange={(e) =>
                    setEstado((prev) => ({
                      ...prev,
                      aniversariantes: prev.aniversariantes.map((a) =>
                        a.id === aniv.id ? { ...a, nome: e.target.value } : a
                      ),
                    }))
                  }
                  placeholder="Nome"
                  className="input-nome"
                />
                <select
                  value={aniv.categoria}
                  onChange={(e) =>
                    setEstado((prev) => ({
                      ...prev,
                      aniversariantes: prev.aniversariantes.map((a) =>
                        a.id === aniv.id ? { ...a, categoria: e.target.value as any } : a
                      ),
                    }))
                  }
                  className="select-categoria"
                >
                  <option value="membro">Membro</option>
                  <option value="crianca">Criança</option>
                  <option value="casamento">Casamento</option>
                </select>
                <button
                  type="button"
                  onClick={() => removerBlocoAniversariante(aniv.id)}
                  className="btn-remover"
                >
                  ✕
                </button>
              </div>
            ))}
            <button type="button" onClick={adicionarBlocoAniversariante} className="btn-adicionar">
              + Adicionar aniversariante
            </button>
          </div>
        )}
      </section>

      {/* Blocos de Roteiro */}
      <section className="bloco-edicao">
        <button
          className="bloco-header"
          onClick={() => setExpandido({ ...expandido, roteiro: !expandido.roteiro })}
        >
          <h3>Roteiro do Culto ({estado.blocos.length + estado.custom.length})</h3>
          <span className="toggle-icon">{expandido.roteiro ? "▼" : "▶"}</span>
        </button>

        {expandido.roteiro && (
          <div className="bloco-conteudo">
            {[...estado.blocos, ...estado.custom]
              .sort((a, b) => a.ordem - b.ordem)
              .map((bloco, idx, arr) => {
                const isRoteiro = !bloco.id.startsWith("custom-");
                const blocoTipo = isRoteiro ? (bloco as BlocoRoteiro).tipo : "custom";
                const numeroSequencial = idx + 1; // Número baseado na posição atual
                return (
                  <div key={bloco.id} className="bloco-roteiro-card">
                    <div className="bloco-roteiro-header">
                      <span className="bloco-numero">{numeroSequencial}</span>
                      <input
                        type="text"
                        value={bloco.titulo}
                        onChange={(e) => {
                          if (isRoteiro) {
                            // Bloco de roteiro padrão
                            setEstado((prev) => ({
                              ...prev,
                              blocos: prev.blocos.map((b) => (b.id === bloco.id ? { ...b, titulo: e.target.value } : b)),
                            }));
                          } else {
                            // Bloco custom
                            atualizarBlocoCustom(bloco.id, e.target.value, bloco.conteudo);
                          }
                        }}
                        className="bloco-titulo-input"
                      />
                    </div>
                    <div className="bloco-body">

                      {blocoTipo === "hino" ? (
                        <div className="hino-control">
                          {(bloco as any).hinoNumero ? (
                            <div className="hino-selecionado">
                              <span className="hino-info">
                                Hino: <strong>{(bloco as any).hinoNumero}</strong> - {hinosPorNumero.get((bloco as any).hinoNumero) || "Desconhecido"}
                              </span>
                              <button
                                type="button"
                                onClick={() => atualizarHino(bloco.id, 0)}
                                className="btn-limpar-hino"
                                title="Limpar hino"
                              >
                                ✕
                              </button>
                            </div>
                          ) : null}
                          <select
                            value={(bloco as any).hinoNumero || ""}
                            onChange={(e) => atualizarHino(bloco.id, parseInt(e.target.value) || 0)}
                            className="hino-dropdown"
                          >
                            <option value="">Selecionar hino...</option>
                            {hinos.map((h) => (
                              <option key={h.numero} value={h.numero}>
                                {h.numero} - {h.titulo}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <textarea
                          value={bloco.conteudo}
                          onChange={(e) => {
                            if (isRoteiro) {
                              setEstado((prev) => ({
                                ...prev,
                                blocos: prev.blocos.map((b) => (b.id === bloco.id ? { ...b, conteudo: e.target.value } : b)),
                              }));
                            } else {
                              atualizarBlocoCustom(bloco.id, bloco.titulo, e.target.value);
                            }
                          }}
                          placeholder="Conteúdo (opcional)"
                          className="bloco-conteudo-textarea"
                        />
                      )}
                      <div className="bloco-roteiro-controls">
                        <button
                          type="button"
                          onClick={() => reordenarBloco(bloco.id, "cima")}
                          disabled={idx === 0}
                          className="btn-reorder"
                          title="Mover para cima"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => reordenarBloco(bloco.id, "baixo")}
                          disabled={idx === arr.length - 1}
                          className="btn-reorder"
                          title="Mover para baixo"
                        >
                          ↓
                        </button>
                        {bloco.id.startsWith("custom-") && (
                          <button
                            type="button"
                            onClick={() => removerBlocoCustom(bloco.id)}
                            className="btn-remover"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

            <button type="button" onClick={adicionarBlocoCustom} className="btn-adicionar">
              + Adicionar bloco customizado
            </button>
          </div>
        )}
      </section>

      {/* Preview de Texto */}
      <section className="bloco-preview">
        <h3>Prévia da Ordem</h3>
        <pre dangerouslySetInnerHTML={{ __html: converterMarkdownParaHtml(previewOrdem) }} />
        <button onClick={copiarOrdem} className="btn-copiar">
          📋 Copiar ordem
        </button>
      </section>
    </div>
  );
}
