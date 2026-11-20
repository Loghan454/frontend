// Cada desenho ocupa 8 linhas. O caractere # representa um pixel colorido.
const simbolos = [
  { nome: 'Alien', cor: '#6ff8c4', pixels: ['.#....#.','..#..#..','.######.','##.##.##','########','#.####.#','#.#..#.#','...##...'] },
  { nome: 'Coração', cor: '#ff76bc', pixels: ['........','.##..##.','#######.','#######.','.#####..','..###...','...#....','........'] },
  { nome: 'Foguete', cor: '#ff9167', pixels: ['...##...','..####..','..#..#..','..####..','..####..','.######.','.#.##.#.','...##...'] },
  { nome: 'Controle', cor: '#ad9aff', pixels: ['........','..####..','.######.','##.###.#','#...#.##','##.#####','##....##','........'] },
  { nome: 'Estrela', cor: '#ffda76', pixels: ['...##...','...##...','########','.######.','..####..','..####..','..#..#..','........'] },
  { nome: 'Cerejas', cor: '#ff6581', pixels: ['....###.','...#.#..','...#..#.','..#...#.','.###.###','####.###','####.###','.##...#.'] },
  { nome: 'Fantasma', cor: '#7ad9ff', pixels: ['..####..','.######.','##.##.##','##.##.##','########','########','##.##.##','........'] },
  { nome: 'Raio', cor: '#ecfd7c', pixels: ['....###.','...###..','..###...','.######.','...###..','..###...','..##....','..#.....'] },
];

const tabuleiro = document.querySelector('#board');
const mensagem = document.querySelector('#status');
const progresso = document.querySelector('#progress');
const botaoReiniciar = document.querySelector('#reset');
const abertura = document.querySelector('#opening');
const menu = document.querySelector('#menu');
const jogo = document.querySelector('#game');
const botaoIniciar = document.querySelector('#start');
const botaoContinuar = document.querySelector('#resume');
const paineis = [document.querySelector('#player-1'), document.querySelector('#player-2')];
const placares = [document.querySelector('#score-1'), document.querySelector('#score-2')];
const tempoPrevia = 650;
let pontos, jogadorAtual, cartasViradas, paresEncontrados, timerPrevia, timerJogada;

function mostrarTela(tela, foco) {
  for (const secao of [abertura, menu, jogo]) {
    secao.hidden = secao !== tela;
  }
  foco.focus();
}

function embaralharCartas() {
  const cartas = [...simbolos, ...simbolos];
  for (let indice = cartas.length - 1; indice > 0; indice--) {
    const sorteado = Math.floor(Math.random() * (indice + 1));
    const guardada = cartas[indice];
    cartas[indice] = cartas[sorteado];
    cartas[sorteado] = guardada;
  }
  return cartas;
}

function desenharSimbolo(simbolo) {
  const desenho = document.createElement('canvas');
  desenho.width = 8;
  desenho.height = 8;
  desenho.setAttribute('aria-hidden', 'true');
  const pincel = desenho.getContext('2d');
  pincel.fillStyle = simbolo.cor;
  simbolo.pixels.forEach((linha, y) => {
    for (let x = 0; x < linha.length; x++) {
      if (linha[x] === '#') {
        pincel.fillRect(x, y, 1, 1);
      }
    }
  });
  return desenho;
}

function atualizarPlacar() {
  const terminou = paresEncontrados === simbolos.length;
  placares.forEach((placar, indice) => {
    placar.textContent = String(pontos[indice]).padStart(2, '0');
    paineis[indice].classList.toggle('active', !terminou && indice === jogadorAtual);
  });
  progresso.textContent = `${paresEncontrados} / ${simbolos.length} pares`;
  mensagem.classList.toggle('second', jogadorAtual === 1);
  mensagem.classList.toggle('finished', terminou);

  if (!terminou) {
    mensagem.textContent = `Vez do Jogador ${jogadorAtual + 1}`;
    return;
  }

  let resultado = 'Empate!';
  if (pontos[0] !== pontos[1]) {
    const vencedor = pontos[0] > pontos[1] ? 1 : 2;
    resultado = `Jogador ${vencedor} venceu!`;
  }
  mensagem.textContent = `${resultado} (${pontos.join(' × ')})`;
  botaoReiniciar.textContent = 'Jogar novamente';
  botaoReiniciar.classList.add('replay');
}

function abrirCarta(carta) {
  carta.botao.classList.add('open');
  carta.botao.setAttribute('aria-disabled', 'true');
  carta.botao.setAttribute('aria-label', `Carta ${carta.posicao}, ${carta.simbolo.nome}`);
  carta.botao.replaceChildren(desenharSimbolo(carta.simbolo));
}

function fecharCarta(carta) {
  carta.botao.classList.remove('open');
  carta.botao.removeAttribute('aria-disabled');
  carta.botao.setAttribute('aria-label', `Carta ${carta.posicao}, virada para baixo`);
  carta.botao.textContent = '?';
}

function virarCarta(carta) {
  if (cartasViradas.length === 2 || carta.botao.hasAttribute('aria-disabled')) {
    return;
  }
  abrirCarta(carta);
  cartasViradas.push(carta);
  if (cartasViradas.length < 2) {
    return;
  }

  const [primeira, segunda] = cartasViradas;
  if (primeira.simbolo === segunda.simbolo) {
    for (const par of cartasViradas) {
      par.botao.classList.add('found');
      par.botao.classList.toggle('second', jogadorAtual === 1);
      par.botao.setAttribute('aria-label', `Carta ${par.posicao}, ${par.simbolo.nome}, par do Jogador ${jogadorAtual + 1}`);
    }
    pontos[jogadorAtual]++;
    paresEncontrados++;
    cartasViradas = [];
    atualizarPlacar();
    return;
  }

  // O próximo jogador só assume depois que as duas cartas fecham.
  timerJogada = setTimeout(() => {
    cartasViradas.forEach(fecharCarta);
    cartasViradas = [];
    jogadorAtual = 1 - jogadorAtual;
    atualizarPlacar();
  }, 1000);
}

function iniciarPartida() {
  clearTimeout(timerJogada);
  clearTimeout(timerPrevia);
  pontos = [0, 0];
  jogadorAtual = 0;
  cartasViradas = [];
  paresEncontrados = 0;
  botaoReiniciar.textContent = 'Nova partida';
  botaoReiniciar.classList.remove('replay');

  const cartas = embaralharCartas().map((simbolo, indice) => {
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'card';
    const carta = { botao, simbolo, posicao: indice + 1 };
    botao.addEventListener('click', () => virarCarta(carta));
    return carta;
  });

  tabuleiro.replaceChildren(...cartas.map(carta => carta.botao));
  atualizarPlacar();
  mensagem.textContent = 'Memorize a posição das cartas';
  tabuleiro.classList.add('preview');
  cartas.forEach(abrirCarta);

  timerPrevia = setTimeout(() => {
    cartas.forEach(fecharCarta);
    tabuleiro.classList.remove('preview');
    atualizarPlacar();
  }, tempoPrevia);
}

const reduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
setTimeout(() => mostrarTela(menu, botaoIniciar), reduzirMovimento ? 500 : 1650);
botaoIniciar.addEventListener('click', () => {
  iniciarPartida();
  mostrarTela(jogo, mensagem);
});
botaoReiniciar.addEventListener('click', () => {
  iniciarPartida();
  mensagem.focus();
});
botaoContinuar.addEventListener('click', () => mostrarTela(jogo, mensagem));
document.querySelector('#back').addEventListener('click', () => {
  botaoContinuar.hidden = paresEncontrados === simbolos.length;
  mostrarTela(menu, botaoContinuar.hidden ? botaoIniciar : botaoContinuar);
});
