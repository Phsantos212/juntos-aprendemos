export type LessonCheck = {
  prompt: string;
  options: [string, string, string];
};

export const lessonChecks: Record<string, LessonCheck> = {
  "alfabetizacao-digital:0": {
    prompt: "Qual exemplo representa corretamente a diferença entre hardware e software?",
    options: [
      "Teclado e tela são hardware; o navegador e o editor de texto são software.",
      "Teclado e navegador são hardware; apenas a internet é software.",
      "Hardware são os arquivos salvos e software são os cabos do computador.",
    ],
  },
  "alfabetizacao-digital:1": {
    prompt: "Qual prática ajuda a proteger suas contas contra golpes na internet?",
    options: [
      "Usar a mesma senha curta em todos os sites para não esquecer.",
      "Usar senhas fortes, ativar verificação em duas etapas e desconfiar de links urgentes.",
      "Informar o código recebido por SMS sempre que alguém pedir por mensagem.",
    ],
  },
  "alfabetizacao-digital:2": {
    prompt: "Qual cuidado ajuda a encontrar e proteger um documento importante depois de escrevê-lo?",
    options: [
      "Salvar com nome claro em uma pasta organizada e manter uma cópia de segurança.",
      "Deixar o texto aberto sem salvar para não ocupar espaço no aparelho.",
      "Usar nomes genéricos como 'novo1' para todos os arquivos.",
    ],
  },
  "alfabetizacao-digital:3": {
    prompt: "O que fazer antes de compartilhar uma notícia recebida em grupos ou redes sociais?",
    options: [
      "Repassar imediatamente se o título chamar atenção.",
      "Conferir a fonte, a data e se veículos confiáveis confirmam a informação.",
      "Compartilhar apenas se tiver muitas curtidas ou encaminhamentos.",
    ],
  },
  "matematica-basica:0": {
    prompt: "Se uma compra tem 3 cadernos de R$ 12 cada, qual operação encontra o valor total mais rapidamente?",
    options: [
      "Multiplicação (3 × 12 = 36).",
      "Divisão (12 ÷ 3 = 4).",
      "Subtração (12 − 3 = 9).",
    ],
  },
  "matematica-basica:1": {
    prompt: "Um livro custa R$ 80 e recebe 25% de desconto. Qual é o valor do desconto?",
    options: [
      "R$ 10.",
      "R$ 20.",
      "R$ 25.",
    ],
  },
  "matematica-basica:2": {
    prompt: "Qual é o primeiro passo para organizar um orçamento mensal?",
    options: [
      "Registrar todas as receitas e despesas antes de decidir novos gastos.",
      "Gastar primeiro e anotar apenas o que sobrar no fim do mês.",
      "Ignorar pequenos gastos diários porque eles não alteram o total.",
    ],
  },
  "matematica-basica:3": {
    prompt: "Por que vale a pena conferir o resultado de um problema matemático por outro caminho?",
    options: [
      "Para verificar se a unidade e o valor final fazem sentido na situação proposta.",
      "Para substituir os dados originais por números mais fáceis.",
      "Porque toda conta precisa ter um número decimal na resposta.",
    ],
  },
  "redacao:0": {
    prompt: "O que define principalmente um gênero textual no dia a dia?",
    options: [
      "Apenas o número de parágrafos que ele possui.",
      "A finalidade comunicativa e o contexto em que o texto circula.",
      "O uso obrigatório de linguagem formal em todas as situações.",
    ],
  },
  "redacao:1": {
    prompt: "Como coesão e coerência trabalham juntas em um texto?",
    options: [
      "A coesão conecta frases e ideias; a coerência garante sentido lógico ao conjunto.",
      "A coesão corrige apenas ortografia e a coerência define o tamanho da fonte.",
      "Elas substituem a necessidade de planejar o tema antes de escrever.",
    ],
  },
  "redacao:2": {
    prompt: "Em um texto argumentativo, qual é o papel da tese?",
    options: [
      "Listar referências bibliográficas no final da página.",
      "Apresentar o ponto de vista central que será defendido com argumentos.",
      "Repetir o título com outras palavras sem justificar a ideia.",
    ],
  },
  "redacao:3": {
    prompt: "O que deve ser observado primeiro durante a revisão de um texto?",
    options: [
      "A clareza das ideias, a progressão lógica e se o texto cumpre seu objetivo.",
      "Apenas trocar todas as palavras curtas por sinônimos difíceis.",
      "Apagar o último parágrafo para deixar o texto menor.",
    ],
  },
  "sustentabilidade:0": {
    prompt: "Qual é a ideia central dos Objetivos de Desenvolvimento Sustentável (Agenda 2030)?",
    options: [
      "Tratar apenas da economia, sem relação com educação ou meio ambiente.",
      "Integrar metas sociais, ambientais e econômicas para pessoas e planeta.",
      "Aplicar regras válidas somente para grandes indústrias.",
    ],
  },
  "sustentabilidade:1": {
    prompt: "Qual relação existe entre ação climática e proteção da biodiversidade?",
    options: [
      "Conservar ecossistemas ajuda a regular o clima e protege espécies e comunidades.",
      "A biodiversidade não sofre efeitos das mudanças climáticas.",
      "Ações climáticas dependem apenas de reduzir o uso de papel.",
    ],
  },
  "sustentabilidade:2": {
    prompt: "O que caracteriza o consumo mais consciente no cotidiano?",
    options: [
      "Avaliar a necessidade real antes da compra e descartar ou reaproveitar corretamente depois do uso.",
      "Comprar sempre em maior quantidade, mesmo sem utilidade imediata.",
      "Descartar todos os materiais juntos para economizar tempo.",
    ],
  },
  "sustentabilidade:3": {
    prompt: "Por que uma ação comunitária precisa de objetivo claro e indicador de acompanhamento?",
    options: [
      "Para medir se a iniciativa está funcionando e ajustar o plano quando necessário.",
      "Para impedir que novos moradores participem do projeto.",
      "Porque indicadores substituem a execução das atividades.",
    ],
  },
  "historia-brasil:0": {
    prompt: "O que é essencial considerar ao estudar o período colonial no Brasil?",
    options: [
      "Que o território já era habitado por diversos povos indígenas e envolveu relações de poder e trabalho.",
      "Que o território estava completamente desabitado antes de 1500.",
      "Que a colonização ocorreu de forma igual e sem conflitos em todo o país.",
    ],
  },
  "historia-brasil:1": {
    prompt: "O que marcou o Brasil logo após a independência em 1822?",
    options: [
      "A adoção imediata do regime republicano sem conflitos regionais.",
      "A continuidade da monarquia sob o Império, com permanências sociais e disputas políticas.",
      "O fim imediato do trabalho escravizado no mesmo ano.",
    ],
  },
  "historia-brasil:2": {
    prompt: "Qual mudança estrutural veio com a Proclamação da República em 1889?",
    options: [
      "A substituição da monarquia por um regime republicano e federativo.",
      "O retorno do Brasil à condição de colônia de Portugal.",
      "A extinção das constituições escritas no país.",
    ],
  },
  "historia-brasil:3": {
    prompt: "Como a Constituição de 1988 trata a educação no Brasil?",
    options: [
      "Como um serviço opcional sem responsabilidade do Estado.",
      "Como direito de todos e dever do Estado e da família.",
      "Como direito restrito apenas ao ensino superior.",
    ],
  },
  "ingles:0": {
    prompt: "Qual frase em inglês é adequada para se apresentar em um primeiro contato?",
    options: [
      "Hello! My name is Ana. Nice to meet you.",
      "Yesterday I went to school.",
      "How much is this book?",
    ],
  },
  "ingles:1": {
    prompt: "Qual frase descreve corretamente uma atividade de rotina com expressão de tempo?",
    options: [
      "I study English every morning.",
      "I am blue tomorrow.",
      "She table at night.",
    ],
  },
  "ingles:2": {
    prompt: "Qual pergunta está correta no present simple para perguntar sobre um hábito?",
    options: [
      "Do you read every day?",
      "Does you reads every day?",
      "Are you read every day?",
    ],
  },
  "ingles:3": {
    prompt: "Qual sequência combina apresentação e pergunta sobre rotina em um diálogo simples?",
    options: [
      "Hi, I'm Lucas. What time do you usually study?",
      "Goodbye, Lucas. Blue notebook.",
      "Where is the station? Red pen.",
    ],
  },
};