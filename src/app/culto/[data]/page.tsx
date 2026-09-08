import {
  carregarBase,
  obterCultoPorData,
  aniversariantesNaSemana,
} from "@/lib/dados/base";
import { carregarHinario } from "@/lib/dados/hinario";
import { EditorOrdem } from "@/app/culto/editor-ordem";

type Props = {
  params: Promise<{ data: string }>;
};

export default async function PaginaCulto({ params }: Props) {
  const { data } = await params;
  const [base, hinario] = await Promise.all([carregarBase(), carregarHinario()]);

  const culto = obterCultoPorData(base.cultos, data);
  if (!culto) {
    return (
      <main className="shell">
        <a href="/" className="back-link">← Voltar</a>
        <p>Culto de {data} não encontrado na base.</p>
      </main>
    );
  }

  const escalacoes = base.escalacoes.filter((escala) => escala.dataCulto === culto.data);
  const aniversariantes = aniversariantesNaSemana(base.aniversariantes, culto.data);

  return (
    <main className="shell">
      <a href="/" className="back-link">← Voltar</a>
      <header className="topbar">
        <div>
          <p className="eyebrow">IBJM · editar ordem</p>
          <h1>
            {new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(
              new Date(`${culto.data}T12:00:00`),
            )}
          </h1>
        </div>
      </header>

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
