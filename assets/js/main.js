/*
 * A simple chess AI, by someone who doesn't know how to play chess.
 * Uses the chessboard.js and chess.js libraries.
 *
 * Copyright (c) 2022 XiaoXi
 */

var STACK_SIZE = 100; // 步历史记录堆栈的大小

var board = null;
var $board = $('#myBoard');
var game = new Chess();
var globalSum = 0; // 总是从黑方的角度判断，白方为负
var whiteSquareGrey = '#a9a9a9';
var blackSquareGrey = '#696969';

var squareClass = 'square-55d63';
var squareToHighlight = null;
var colorToHighlight = null;
var positionCount;

var config = {
  draggable: true,
  position: 'start',
  onDragStart: onDragStart,
  onDrop: onDrop,
  onMouseoutSquare: onMouseoutSquare,
  onMouseoverSquare: onMouseoverSquare,
  onSnapEnd: onSnapEnd,
};
board = Chessboard('myBoard', config);

timer = null;

/*
 * 改编自 Sunfish.py 的 棋子-格子数组(Piece-Square Tables)：
 * https://github.com/thomasahle/sunfish/blob/master/sunfish.py
 */

var weights = { p: 100, n: 280, b: 320, r: 479, q: 929, k: 60000, k_e: 60000 };
var pst_w = {
  p: [
    [100, 100, 100, 100, 105, 100, 100, 100],
    [78, 83, 86, 73, 102, 82, 85, 90],
    [7, 29, 21, 44, 40, 31, 44, 7],
    [-17, 16, -2, 15, 14, 0, 15, -13],
    [-26, 3, 10, 9, 6, 1, 0, -23],
    [-22, 9, 5, -11, -10, -2, 3, -19],
    [-31, 8, -7, -37, -36, -14, 3, -31],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  n: [
    [-66, -53, -75, -75, -10, -55, -58, -70],
    [-3, -6, 100, -36, 4, 62, -4, -14],
    [10, 67, 1, 74, 73, 27, 62, -2],
    [24, 24, 45, 37, 33, 41, 25, 17],
    [-1, 5, 31, 21, 22, 35, 2, 0],
    [-18, 10, 13, 22, 18, 15, 11, -14],
    [-23, -15, 2, 0, 2, 0, -23, -20],
    [-74, -23, -26, -24, -19, -35, -22, -69],
  ],
  b: [
    [-59, -78, -82, -76, -23, -107, -37, -50],
    [-11, 20, 35, -42, -39, 31, 2, -22],
    [-9, 39, -32, 41, 52, -10, 28, -14],
    [25, 17, 20, 34, 26, 25, 15, 10],
    [13, 10, 17, 23, 17, 16, 0, 7],
    [14, 25, 24, 15, 8, 25, 20, 15],
    [19, 20, 11, 6, 7, 6, 20, 16],
    [-7, 2, -15, -12, -14, -15, -10, -10],
  ],
  r: [
    [35, 29, 33, 4, 37, 33, 56, 50],
    [55, 29, 56, 67, 55, 62, 34, 60],
    [19, 35, 28, 33, 45, 27, 25, 15],
    [0, 5, 16, 13, 18, -4, -9, -6],
    [-28, -35, -16, -21, -13, -29, -46, -30],
    [-42, -28, -42, -25, -25, -35, -26, -46],
    [-53, -38, -31, -26, -29, -43, -44, -53],
    [-30, -24, -18, 5, -2, -18, -31, -32],
  ],
  q: [
    [6, 1, -8, -104, 69, 24, 88, 26],
    [14, 32, 60, -10, 20, 76, 57, 24],
    [-2, 43, 32, 60, 72, 63, 43, 2],
    [1, -16, 22, 17, 25, 20, -13, -6],
    [-14, -15, -2, -5, -1, -10, -20, -22],
    [-30, -6, -13, -11, -16, -11, -16, -27],
    [-36, -18, 0, -19, -15, -15, -21, -38],
    [-39, -30, -31, -13, -31, -36, -34, -42],
  ],
  k: [
    [4, 54, 47, -99, -99, 60, 83, -62],
    [-32, 10, 55, 56, 56, 55, 10, 3],
    [-62, 12, -57, 44, -67, 28, 37, -31],
    [-55, 50, 11, -4, -19, 13, 0, -49],
    [-55, -43, -52, -28, -51, -47, -8, -50],
    [-47, -42, -43, -79, -64, -32, -29, -32],
    [-4, 3, -14, -50, -57, -18, 13, 4],
    [17, 30, -3, -14, 6, -1, 40, 18],
  ],

  // 终局王冠桌面
  k_e: [
    [-50, -40, -30, -20, -20, -30, -40, -50],
    [-30, -20, -10, 0, 0, -10, -20, -30],
    [-30, -10, 20, 30, 30, 20, -10, -30],
    [-30, -10, 30, 40, 40, 30, -10, -30],
    [-30, -10, 30, 40, 40, 30, -10, -30],
    [-30, -10, 20, 30, 30, 20, -10, -30],
    [-30, -30, 0, 0, 0, 0, -30, -30],
    [-50, -30, -30, -30, -30, -30, -30, -50],
  ],
};
var pst_b = {
  p: pst_w['p'].slice().reverse(),
  n: pst_w['n'].slice().reverse(),
  b: pst_w['b'].slice().reverse(),
  r: pst_w['r'].slice().reverse(),
  q: pst_w['q'].slice().reverse(),
  k: pst_w['k'].slice().reverse(),
  k_e: pst_w['k_e'].slice().reverse(),
};

var pstOpponent = { w: pst_b, b: pst_w };
var pstSelf = { w: pst_w, b: pst_b };

/*
 * 使用材质权重和棋子-格子数组实时判断局势
 */
function evaluateBoard(game, move, prevSum, color) {

  if (game.in_checkmate()) {

    // 对方被「将死」 (我方优势)
    if (move.color === color) {
      return 10 ** 10;
    }
    // 我方被「将死」 (我方劣势)
    else {
      return -(10 ** 10);
    }
  }

  if (game.in_draw() || game.in_threefold_repetition() || game.in_stalemate())
  {
    return 0;
  }

  if (game.in_check()) {
    // 对方被「将军」 (我方优势)
    if (move.color === color) {
      prevSum += 50;
    }
    // 我方被「将军」 (我方劣势)
    else {
      prevSum -= 50;
    }
  }

  var from = [
    8 - parseInt(move.from[1]),
    move.from.charCodeAt(0) - 'a'.charCodeAt(0),
  ];
  var to = [
    8 - parseInt(move.to[1]),
    move.to.charCodeAt(0) - 'a'.charCodeAt(0),
  ];

  // 改变终局行为
  if (prevSum < -1500) {
    if (move.piece === 'k') {
      move.piece = 'k_e';
    }
    // 国王永远不被捕获
    // else if (move.captured === 'k') {
    //   move.captured = 'k_e';
    // }
  }

  if ('captured' in move) {
    // 对方的棋子被捕获 (我方优势)
    if (move.color === color) {
      prevSum +=
        weights[move.captured] +
        pstOpponent[move.color][move.captured][to[0]][to[1]];
    }
    // 对方的棋子被捕获 (我方劣势)
    else {
      prevSum -=
        weights[move.captured] +
        pstSelf[move.color][move.captured][to[0]][to[1]];
    }
  }

  if (move.flags.includes('p')) {
    // NOTE: 为了简单起见，晋升为女王
    move.promotion = 'q';

    // 我方棋子被晋升 (我方优势)
    if (move.color === color) {
      prevSum -=
        weights[move.piece] + pstSelf[move.color][move.piece][from[0]][from[1]];
      prevSum +=
        weights[move.promotion] +
        pstSelf[move.color][move.promotion][to[0]][to[1]];
    }
    // 对方的棋子被晋升 (我方劣势)
    else {
      prevSum +=
        weights[move.piece] + pstSelf[move.color][move.piece][from[0]][from[1]];
      prevSum -=
        weights[move.promotion] +
        pstSelf[move.color][move.promotion][to[0]][to[1]];
    }
  } else {
    // 被移动的棋子仍然存在于更新的棋盘上，所以我们只需要更新其的位置值
    if (move.color !== color) {
      prevSum += pstSelf[move.color][move.piece][from[0]][from[1]];
      prevSum -= pstSelf[move.color][move.piece][to[0]][to[1]];
    } else {
      prevSum -= pstSelf[move.color][move.piece][from[0]][from[1]];
      prevSum += pstSelf[move.color][move.piece][to[0]][to[1]];
    }
  }

  return prevSum;
}

/*
 * 执行 Minimax 算法以获得最佳的移动：
 * https://zh.wikipedia.org/wiki/%E6%9E%81%E5%B0%8F%E5%8C%96%E6%9E%81%E5%A4%A7%E7%AE%97%E6%B3%95 (提供了伪代码)
 * 递归地探索到给定深度的所有可能移动，并在叶处评估游戏棋盘
 *
 * 基本思想：最大化对手可能的后续动作所产生的位置最小值
 * 优化：α-β 剪枝：
 * https://zh.wikipedia.org/wiki/Alpha-beta%E5%89%AA%E6%9E%9D (提供了伪代码)
 *
 * 输入：
 *  - game:                 游戏对象
 *  - depth:                所有可能移动的递归树的深度（深度限制）
 *  - isMaximizingPlayer:   如果当前层最大化，则为 true，否则为 false
 *  - sum:                  到目前为止在当前层的总和（评估）
 *  - color:                当前玩家的颜色
 *
 * 输出：
 *  位于当前子树的根的最佳移动
 */
function minimax(game, depth, alpha, beta, isMaximizingPlayer, sum, color) {
  positionCount++;
  var children = game.ugly_moves({ verbose: true });

  // 随机排序移动，因此在相同的关系下不会总是选择相同的移动
  children.sort(function (a, b) {
    return 0.5 - Math.random();
  });

  var currMove;
  // 超过最大深度或节点是终端节点 (无子节点)
  if (depth === 0 || children.length === 0) {
    return [null, sum];
  }

  // 从 'children' 列表中查找最大 / 最小值 (可能的移动)
  var maxValue = Number.NEGATIVE_INFINITY;
  var minValue = Number.POSITIVE_INFINITY;
  var bestMove;
  for (var i = 0; i < children.length; i++) {
    currMove = children[i];

    // 注意：在我们的例子中，'children' 只是经过简单修改的游戏状态
    var currPrettyMove = game.ugly_move(currMove);
    var newSum = evaluateBoard(game, currPrettyMove, sum, color);
    var [childBestMove, childValue] = minimax(
      game,
      depth - 1,
      alpha,
      beta,
      !isMaximizingPlayer,
      newSum,
      color
    );

    game.undo();

    if (isMaximizingPlayer) {
      if (childValue > maxValue) {
        maxValue = childValue;
        bestMove = currPrettyMove;
      }
      if (childValue > alpha) {
        alpha = childValue;
      }
    } else {
      if (childValue < minValue) {
        minValue = childValue;
        bestMove = currPrettyMove;
      }
      if (childValue < beta) {
        beta = childValue;
      }
    }

    // α-β 剪枝
    if (alpha >= beta) {
      break;
    }
  }

  if (isMaximizingPlayer) {
    return [bestMove, maxValue];
  } else {
    return [bestMove, minValue];
  }
}

function checkStatus(color) {
  if (color == 'black') {
    colorName = '黑方';
  } else {
    colorName = '白方';
  }
  if (game.in_checkmate()) {
    $('#status').html(`<b>将死！</b><b>${colorName}</b>失败`);
  } else if (game.insufficient_material()) {
    $('#status').html(`<b>和棋！</b> (子力不足)`);
  } else if (game.in_threefold_repetition()) {
    $('#status').html(`<b>和棋！</b> (三次重复局面)`);
  } else if (game.in_stalemate()) {
    $('#status').html(`<b>和棋！</b> (逼和)`);
  } else if (game.in_draw()) {
    $('#status').html(`<b>和棋！</b> (五十回合规则)`);
  } else if (game.in_check()) {
    $('#status').html(`<b>${colorName}</b>已被<b>将军！</b>`);
    return false;
  } else {
    $('#status').html(`当前无「将军」、「将死」、「和棋」状态`);
    return false;
  }
  return true;
}

function updateAdvantage() {
  if (globalSum > 0) {
    $('#advantageColor').text('黑方');
    $('#advantageNumber').text(globalSum);
  } else if (globalSum < 0) {
    $('#advantageColor').text('白方');
    $('#advantageNumber').text(-globalSum);
  } else {
    $('#advantageColor').text('双方均没有');
    $('#advantageNumber').text(globalSum);
  }
  $('#advantageBar').attr({
    'aria-valuenow': `${-globalSum}`,
    style: `width: ${((-globalSum + 2000) / 4000) * 100}%`,
  });
}

/*
 * 计算给定颜色的最佳合法移动
 */
function getBestMove(game, color, currSum) {
  positionCount = 0;

  if (color === 'b') {
    var depth = parseInt($('#search-depth').find(':selected').text());
  } else {
    var depth = parseInt($('#search-depth-white').find(':selected').text());
  }

  var d = new Date().getTime();
  var [bestMove, bestMoveValue] = minimax(
    game,
    depth,
    Number.NEGATIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    true,
    currSum,
    color
  );
  var d2 = new Date().getTime();
  var moveTime = d2 - d;
  var positionsPerS = (positionCount * 1000) / moveTime;

  $('#position-count').text(positionCount);
  $('#time').text(moveTime / 1000);
  $('#positions-per-s').text(Math.round(positionsPerS));

  return [bestMove, bestMoveValue];
}

/*
 * 对给定颜色执行最佳合法移动
 */
function makeBestMove(color) {
  if (color === 'b') {
    var move = getBestMove(game, color, globalSum)[0];
  } else {
    var move = getBestMove(game, color, -globalSum)[0];
  }

  globalSum = evaluateBoard(game, move, globalSum, 'b');
  updateAdvantage();

  game.move(move);
  board.position(game.fen());

  if (color === 'b') {
    checkStatus('black');

    // 突出黑方移动
    $board.find('.' + squareClass).removeClass('highlight-black');
    $board.find('.square-' + move.from).addClass('highlight-black');
    squareToHighlight = move.to;
    colorToHighlight = 'black';

    $board
      .find('.square-' + squareToHighlight)
      .addClass('highlight-' + colorToHighlight);
  } else {
    checkStatus('white');

    // 突出白方移动
    $board.find('.' + squareClass).removeClass('highlight-white');
    $board.find('.square-' + move.from).addClass('highlight-white');
    squareToHighlight = move.to;
    colorToHighlight = 'white';

    $board
      .find('.square-' + squareToHighlight)
      .addClass('highlight-' + colorToHighlight);
  }
}

/*
 * 从给定的颜色开始执行机器对局
 */
function compVsComp(color) {
  if (!checkStatus({ w: 'white', b: 'black' }[color])) {
    timer = window.setTimeout(function () {
      makeBestMove(color);
      if (color === 'w') {
        color = 'b';
      } else {
        color = 'w';
      }
      compVsComp(color);
    }, 250);
  }
}

/*
 * 将游戏重置为初始状态
 */
function reset() {
  game.reset();
  globalSum = 0;
  $board.find('.' + squareClass).removeClass('highlight-white');
  $board.find('.' + squareClass).removeClass('highlight-black');
  $board.find('.' + squareClass).removeClass('highlight-hint');
  board.position(game.fen());
  $('#advantageColor').text('双方均没有');
  $('#advantageNumber').text(globalSum);

  // 清除机器对局回调
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}

/*
 * 各种按钮的事件侦听器
 */
$('#ruyLopezBtn').on('click', function () {
  reset();
  game.load(
    'r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 1'
  );
  board.position(game.fen());
  window.setTimeout(function () {
    makeBestMove('b');
  }, 250);
  mdui.snackbar({
    message: '西班牙开局',
    buttonText: '重置',
    onButtonClick: function(){
      reset();
    }
  });
});

$('#italianGameBtn').on('click', function () {
  reset();
  game.load(
    'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 1'
  );
  board.position(game.fen());
  window.setTimeout(function () {
    makeBestMove('b');
  }, 250);
  mdui.snackbar({
    message: '意大利开局',
    buttonText: '重置',
    onButtonClick: function(){
      reset();
    }
  });
});

$('#sicilianDefenseBtn').on('click', function () {
  reset();
  game.load('rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1');
  board.position(game.fen());
  mdui.snackbar({
    message: '西西里防御开局',
    buttonText: '重置',
    onButtonClick: function(){
      reset();
    }
  });
});

$('#startBtn').on('click', function () {
  reset();
  mdui.snackbar({
    message: '初始位置开局'
  });
});

$('#compVsCompBtn').on('click', function () {
  reset();
  compVsComp('w');
  mdui.snackbar({
    message: '机器对局开始',
    buttonText: '停止并重置',
    onButtonClick: function(){
      $('#resetBtn').click();
    }
  });
});

$('#resetBtn').on('click', function () {
  reset();
  mdui.snackbar({
    message: '已重置'
  });
});

$('#reloadBtn').on('click', function () {
  reset();
  mdui.snackbar({
    message: '已重置'
  });
});

var undo_stack = [];

function undo() {
  var move = game.undo();
  undo_stack.push(move);

  // 保持最大堆栈大小
  if (undo_stack.length > STACK_SIZE) {
    undo_stack.shift();
  }
  board.position(game.fen());
}

$('#undoBtn').on('click', function () {
  if (game.history().length >= 2) {
    $board.find('.' + squareClass).removeClass('highlight-white');
    $board.find('.' + squareClass).removeClass('highlight-black');
    $board.find('.' + squareClass).removeClass('highlight-hint');

    // 悔棋两次：对手的最新一步，然后是玩家的最新一步
    undo();
    window.setTimeout(function () {
      undo();
      window.setTimeout(function () {
        showHint();
      }, 250);
      mdui.snackbar({
        message: '已悔棋',
        buttonText: '还原',
        onButtonClick: function(){
          $('#redoBtn').click();
        }
      });
    }, 250);
  } else {
    mdui.snackbar({
      message: '没有可以悔棋的步'
    });
  }
});

function redo() {
  game.move(undo_stack.pop());
  board.position(game.fen());
}

$('#redoBtn').on('click', function () {
  if (undo_stack.length >= 2) {
    // 还原两次：玩家的最后一步，然后是对手的最后一步
    redo();
    window.setTimeout(function () {
      redo();
      window.setTimeout(function () {
        showHint();
      }, 250);
      mdui.snackbar({
        message: '已还原'
      });
    }, 250);
  } else {
    mdui.snackbar({
      message: '没有可以还原的步'
    });
  }
});

$('#showHint').change(function () {
  window.setTimeout(showHint, 250);
});

function showHint() {
  var showHint = document.getElementById('showHint');
  $board.find('.' + squareClass).removeClass('highlight-hint');

  // 显示建议 (白方的最佳移动)
  if (showHint.checked) {
    var move = getBestMove(game, 'w', -globalSum)[0];

    $board.find('.square-' + move.from).addClass('highlight-hint');
    $board.find('.square-' + move.to).addClass('highlight-hint');
  }
}

$('#linkShareBtn').on('click', function () {
  window.open('https://minimaxchessai.soraharu.com', '_blank');
});

$('#codeShareBtn').on('click', function () {
  window.open('https://gitlab.soraharu.com/XiaoXi/Minimax-with-Alpha-Beta-Pruning-Chess-AI', '_blank');
});

$('#homeShareBtn').on('click', function () {
  window.open('https://soraharu.com', '_blank');
});

/*
 * 余下的代码改编自 chessboard.js 例程 #5000 到 #5005：
 * https://chessboardjs.com/examples#5000
 */
function removeGreySquares() {
  $('#myBoard .square-55d63').css('background', '');
}

function greySquare(square) {
  var $square = $('#myBoard .square-' + square);

  var background = whiteSquareGrey;
  if ($square.hasClass('black-3c85d')) {
    background = blackSquareGrey;
  }

  $square.css('background', background);
}

function onDragStart(source, piece) {
  // do not pick up pieces if the game is over
  if (game.game_over()) return false;

  // or if it's not that side's turn
  if (
    (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
    (game.turn() === 'b' && piece.search(/^w/) !== -1)
  ) {
    return false;
  }
}

function onDrop(source, target) {
  undo_stack = [];
  removeGreySquares();

  // see if the move is legal
  var move = game.move({
    from: source,
    to: target,
    promotion: 'q', // NOTE: always promote to a queen for example simplicity
  });

  // illegal move
  if (move === null) return 'snapback';

  globalSum = evaluateBoard(game, move, globalSum, 'b');
  updateAdvantage();

  // highlight latest move
  $board.find('.' + squareClass).removeClass('highlight-white');

  $board.find('.square-' + move.from).addClass('highlight-white');
  squareToHighlight = move.to;
  colorToHighlight = 'white';

  $board
    .find('.square-' + squareToHighlight)
    .addClass('highlight-' + colorToHighlight);

  if (!checkStatus('black'));
  {
    // make the best move for black
    window.setTimeout(function () {
      makeBestMove('b');
      window.setTimeout(function () {
        showHint();
      }, 250);
    }, 250);
  }
}

function onMouseoverSquare(square, piece) {
  // get list of possible moves for this square
  var moves = game.moves({
    square: square,
    verbose: true,
  });

  // exit if there are no moves available for this square
  if (moves.length === 0) return;

  // highlight the square they moused over
  greySquare(square);

  // highlight the possible squares for this piece
  for (var i = 0; i < moves.length; i++) {
    greySquare(moves[i].to);
  }
}

function onMouseoutSquare(square, piece) {
  removeGreySquares();
}

function onSnapEnd() {
  board.position(game.fen());
}
