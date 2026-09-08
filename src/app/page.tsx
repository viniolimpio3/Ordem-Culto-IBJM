import {
  carregarBase,
  obterCultoPorData,
  obterCultosDomingoOrdenados,
  obterProximoCulto,
  aniversariantesNaSemana,
} from "@/lib/dados/base";
import { carregarHinario } from "@/lib/dados/hinario";
import { EditorOrdem } from "@/app/culto/editor-ordem";
import { formatarFuncao } from "@/lib/utils/formato";

type Props = {
  searchParams: Promise<{ data?: string }>;
};

export default async function Home({ searchParams }: Props) {
  const { data: dataSelecionada } = await searchParams;
  const [base, hinario] = await Promise.all([carregarBase(), carregarHinario()]);
  const cultosDomingo = obterCultosDomingoOrdenados(base.cultos);
  const culto = dataSelecionada
    ? (obterCultoPorData(base.cultos, dataSelecionada) ?? obterProximoCulto(base.cultos))
    : obterProximoCulto(base.cultos);

  const escalacoes = culto
    ? base.escalacoes.filter((escala) => escala.dataCulto === culto.data)
    : [];
  const pessoasPorId = new Map(base.pessoas.map((pessoa) => [pessoa.id, pessoa.nome]));
  const aniversariantes = culto ? aniversariantesNaSemana(base.aniversariantes, culto.data) : [];

  if (!culto) return <main className="shell"><p>Nenhum próximo culto encontrado na base.</p></main>;

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <h1>Ordem de Culto | IBJM</h1>
        </div>
        <span className={`status status-${culto.status}`}>{culto.status}</span>
      </header>

      <form className="date-picker" method="get">
        <label htmlFor="data">Ver programação de outra data</label>
        <select id="data" name="data" defaultValue={culto.data}>
          {cultosDomingo.map((item) => (
            <option key={item.id} value={item.data}>
              {new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date(`${item.data}T12:00:00`))}
            </option>
          ))}
        </select>
        <button type="submit">Ver</button>
      </form>

      <section className="hero-panel">
        <div>
          <h2>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "full" }).format(new Date(`${culto.data}T12:00:00`))}</h2>
          <p className="muted">Edite os detalhes abaixo para gerar a ordem do culto.</p>
        </div>
      </section>

      {/* Editor Inline */}
      <EditorOrdem
        dataCulto={culto.data}
        escalacoes={escalacoes}
        aniversariantes={aniversariantes}
        pessoas={base.pessoas}
        hinos={hinario.hinos}
      />
    </main>
  );
}
