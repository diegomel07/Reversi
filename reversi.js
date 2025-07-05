class Agent{
    constructor(){}

    /**
      * Must return a JSON object representing the row and column to put a piece
      *   {'x':column, 'y':row}
      * Receives a JSON object with the perception information
      * {
      *  'color': Color of the pieces the player is playing with 
      *  'board': A matrix with the current position of the board:
      *            ' ': Represents empty cell
      *            'W': Represents a cell with a white piece
      *            'B': Represents a cell with a black piece
      *  'W': Remaining time of the white pieces
      *  'B': Remaining time of the black pieces
      * }
      */
    compute( percept ){ return {'x':0, 'y':0} }
}

/**
  * Player's Code (Must inherit from Agent)
  * This is an example of a rangom player agent
  */
class RandomAgent extends Agent{
    constructor(){
        super()
    }

    compute(percept){
        var color = percept['color'] // Gets player's color
        var wtime = percept['W'] // Gets remaining time of whites color player
        var btime = percept['B'] // Gets remaining time of blacks color player
        var board = percept['board'] // Gets the current board's position
        var moves = board.valid_moves(color)
        var index = Math.floor(moves.length * Math.random())
        for(var i=0; i<50000000; i++){} // Making it very slow to test time restriction
        return moves[index]
    }
}


class Agent404 {
    constructor() {
        this.transpositionTable = new Map();
        this.zobristTable = this.initZobristTable(64); 
    }

    compute(percept) {
        const color = percept.color;
        const board = percept.board;
        const size = board.board.length;


        // Killer Move: corner grab
        const corners = [
            [0, 0], [0, size - 1],
            [size - 1, 0], [size - 1, size - 1]
        ];
        const valid = board.valid_moves(color);
        for (const move of valid) {
            for (const [cy, cx] of corners) {
                if (move.x === cx && move.y === cy) {
                    return { x: move.x, y: move.y };
                }
            }
        }

        // Killer Move: block opponent
        const opponent = color === 'W' ? 'B' : 'W';
        for (const move of valid) {
            const clone = board.clone();
            clone.move(move.x, move.y, color);
            if (!clone.can_play(opponent)) {
                return { x: move.x, y: move.y };
            }
        }

        // MTD(f)
        const [x, y] = this.mtdf(board, color, 5);
        return { x, y };
    }

    // mtdf(root, color, depth) {
    //     let guess = 0;
    //     let lowerBound = -Infinity;
    //     let upperBound = Infinity;
    //     let bestMove = null;
    //     let firstGuessMove = null;

    //     while (lowerBound < upperBound) {
    //         const beta = (guess === lowerBound) ? guess + 1 : guess;
    //         const result = this.alphaBetaWithMove(root, depth, beta - 1, beta, color, true, firstGuessMove);
    //         guess = result.value;
    //         bestMove = result.move;
    //         firstGuessMove = result.move;  // Prioriza en siguientes iteraciones

    //         if (guess < beta) {
    //             upperBound = guess;
    //         } else {
    //             lowerBound = guess;
    //         }
    //     }

    //     return bestMove || [0, 0];
    // }

    mtdf(root, color, maxDepth) {
        let bestMove = null;
        for (let depth = 1; depth <= maxDepth; depth++) {
            let guess = bestMove ? this.evaluate(root, color) : 0;
            let lowerBound = -Infinity;
            let upperBound = Infinity;
            
            while (lowerBound < upperBound) {
                const beta = (guess === lowerBound) ? guess + 1 : guess;
                const result = this.alphaBetaWithMove(root, depth, beta - 1, beta, color, true, bestMove);
                guess = result.value;
                bestMove = result.move;
                
                if (guess < beta) upperBound = guess;
                else lowerBound = guess;
            }
        }
        return bestMove || [0, 0];
    }


    alphaBetaWithMove(board, depth, alpha, beta, color, isRoot = false, firstMove = null) {

        //const hash = board.board.toString();
        const hash = this.computeHash(board);
        const ttEntry = this.transpositionTable.get(hash);

        if (ttEntry && ttEntry.depth >= depth) {
            if (ttEntry.flag === "EXACT") return isRoot ? { value: ttEntry.value, move: ttEntry.bestMove } : { value: ttEntry.value };
            if (ttEntry.flag === "LOWERBOUND" && ttEntry.value > alpha) alpha = ttEntry.value;
            if (ttEntry.flag === "UPPERBOUND" && ttEntry.value < beta) beta = ttEntry.value;
            if (alpha >= beta) return isRoot ? { value: ttEntry.value, move: ttEntry.bestMove } : { value: ttEntry.value };
        }

        if (depth === 0 || (!board.can_play('W') && !board.can_play('B'))) {
            const val = this.evaluate(board, color);
            return { value: val, move: null };
        }

        const moves = board.valid_moves(color);
        if (moves.length === 0) {
            const opponent = color === 'W' ? 'B' : 'W';
            return this.alphaBetaWithMove(board.clone(), depth - 1, alpha, beta, opponent, false, null);
        }

        // Ordenamiento de movimientos
        if (firstMove) {
            moves.sort((a, b) => {
                if (a.x === firstMove[0] && a.y === firstMove[1]) return -1;
                if (b.x === firstMove[0] && b.y === firstMove[1]) return 1;
                return this.evalMoveStatic(b, board, color) - this.evalMoveStatic(a, board, color);
            });
        } else {
            moves.sort((a, b) => this.evalMoveStatic(b, board, color) - this.evalMoveStatic(a, board, color));
        }

        let bestValue = -Infinity;
        let bestMove = null;
        const opponent = color === 'W' ? 'B' : 'W';

        for (const move of moves) {
            const y = move.y;
            const x = move.x;
            const clone = board.clone();

            if (!clone.move(x, y, color)) continue;

            const result = this.alphaBetaWithMove(clone, depth - 1, -beta, -alpha, opponent);
            const value = -result.value;

            if (value > bestValue) {
                bestValue = value;
                bestMove = [x, y];
            }

            alpha = Math.max(alpha, value);
            if (alpha >= beta) break;
        }

        // Guardar en tabla de transposición
        let flag = "EXACT";
        if (bestValue <= alpha) flag = "UPPERBOUND";
        else if (bestValue >= beta) flag = "LOWERBOUND";

        this.transpositionTable.set(hash, {
            value: bestValue,
            depth: depth,
            flag: flag,
            bestMove: bestMove
        });

        return isRoot ? { value: bestValue, move: bestMove } : { value: bestValue };
    }

    initZobristTable(size) {
        const table = Array(size).fill().map(() => 
            Array(size).fill().map(() => ({
                'W': Math.floor(Math.random() * 2**32),
                'B': Math.floor(Math.random() * 2**32)
            }))
        );
        return table;
    }
    
    computeHash(board) {
        let hash = 0;
        for (let y = 0; y < board.board.length; y++) {
            for (let x = 0; x < board.board[y].length; x++) {
                const cell = board.board[y][x];
                if (cell !== ' ') {
                    hash ^= this.zobristTable[y][x][cell];
                }
            }
        }
        return hash;
    }

    evaluate(board, color) {
        
        const size = board.board.length;
        const positionWeights = this.generatePositionWeights(size);
        const opponent = color === 'W' ? 'B' : 'W';

        let myDiscs = 0, oppDiscs = 0;
        let myMoves = board.valid_moves(color).length;
        let oppMoves = board.valid_moves(opponent).length;
        let myFrontier = 0, oppFrontier = 0;
        let myStable = 0, oppStable = 0;
        let myPlacement = 0, oppPlacement = 0;
        let myCorners = 0, oppCorners = 0;

        const dirs = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],          [0, 1],
            [1, -1], [1, 0], [1, 1]
        ];

        let filled = 0;

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const cell = board.board[y][x];
                if (cell === ' ') continue;
                filled++;

                const weight = positionWeights[y][x] || 0;
                if (cell === color) {
                    myDiscs++;
                    myPlacement += weight;

                    // Stable if in corner or full edge
                    if ((y === 0 || y === size - 1 || x === 0 || x === size - 1))
                        myStable++;
                } else if (cell === opponent) {
                    oppDiscs++;
                    oppPlacement += weight;

                    if ((y === 0 || y === size - 1 || x === 0 || x === size - 1))
                        oppStable++;
                }

                // Frontier
                for (const [dy, dx] of dirs) {
                    const ny = y + dy, nx = x + dx;
                    if (ny >= 0 && ny < size && nx >= 0 && nx < size && board.board[ny][nx] === ' ') {
                        if (cell === color) myFrontier++;
                        else if (cell === opponent) oppFrontier++;
                        break;
                    }
                }
            }
        }

        const progress = filled / (size * size);  // 0.0 a 1.0

        // Interpolated weights (early to late game)
        const w = {
            corner: 100,
            stability: 25,
            mobility: 50 * (1 - progress),
            placement: 15,
            frontier: 10,
            discs: 100 * progress
        };

        //Final weighted score
        const score =
            w.corner * (myCorners - oppCorners) +
            w.stability * (myStable - oppStable) +
            w.mobility * (myMoves - oppMoves) +
            w.placement * (myPlacement - oppPlacement) -
            w.frontier * (myFrontier - oppFrontier) +
            w.discs * (myDiscs - oppDiscs);

        return score;
    }

    generatePositionWeights(size) {
        const weights = Array(size).fill(0).map(() => Array(size).fill(0));
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                // Ejemplo básico: esquinas valen más, cercanas valen menos
                const isCorner = (y === 0 || y === size - 1) && (x === 0 || x === size - 1);
                const isNearCorner = 
                    (y <= 1 || y >= size - 2) &&
                    (x <= 1 || x >= size - 2) &&
                    !isCorner;

                if (isCorner) weights[y][x] = 100;
                else if (isNearCorner) weights[y][x] = -25;
                else weights[y][x] = 5;
            }
        }
        return weights;
    }



    // Evaluación rápida para ordenar movimientos (prioriza esquinas)
    // evalMoveStatic(move, board, color) {
    //     const size = board.board.length;
    //     const x = move.x, y = move.y;

    //     if ((x === 0 || x === size - 1) && (y === 0 || y === size - 1)) return 100; // esquina
    //     if ((x === 1 || x === size - 2) && (y === 1 || y === size - 2)) return -50; // cerca esquina (peligro)
    //     return 0; // neutro
    // }

        // Evaluación rápida para ordenar movimientos (prioriza esquinas)
    evalMoveStatic(move, board, color) {
        const size = board.board.length;
        const x = move.x, y = move.y;
        const opponent = color === 'W' ? 'B' : 'W';
        
        // Esquinas son las mejores
        if ((x === 0 || x === size - 1) && (y === 0 || y === size - 1)) return 1000;
        
        // Cerca de esquinas son malas
        if ((x === 1 || x === size - 2) && (y === 1 || y === size - 2)) return -500;
        
        // Bordes son buenos
        if (x === 0 || x === size - 1 || y === 0 || y === size - 1) return 50;
        
        // Movimientos que reducen movilidad del oponente
        const clone = board.clone();
        clone.move(x, y, color);
        const oppMobility = clone.valid_moves(opponent).length;
        const mobilityDiff = board.valid_moves(opponent).length - oppMobility;
        
        return mobilityDiff * 10;
    }
}





class DynamicSmartAgent extends Agent {
    constructor() {
        super();
        // Pesos optimizados para uso con valid_moves
        this.weights = {
            corner: 120,
            nearCorner: -80,
            edge: 60,
            mobility: 30,
            stability: 40,
            frontier: -20,
            potential: 15
        };
        this.size = 0; // Se establecerá dinámicamente
    }

    compute(percept) {
        try {
            const startTime = Date.now();
            const color = percept['color'];
            const board = percept['board'];
            this.size = board.board.length;
            const opponentColor = color === 'W' ? 'B' : 'W';
            
            // Obtener movimientos válidos actuales
            const currentMoves = board.valid_moves(color);
            if (currentMoves.length === 0) return {'x': -1, 'y': -1};
            if (currentMoves.length === 1) return currentMoves[0];

            // 1. Priorizar esquinas directamente accesibles
            const cornerMoves = this.getCornerMoves(currentMoves);
            if (cornerMoves.length > 0) return cornerMoves[0];

            // 2. Analizar movimientos que limitan al oponente
            const restrictiveMoves = this.getRestrictiveMoves(board, color, currentMoves);
            if (restrictiveMoves.length > 0) return restrictiveMoves[0];

            // 3. Evaluación estratégica completa
            return this.evaluateStrategicMoves(board, color, currentMoves, startTime);
            
        } catch (error) {
            console.error("Error en compute:", error);
            return this.getFallbackMove(percept);
        }
    }

    getCornerMoves(moves) {
        const corners = [
            {x: 0, y: 0}, {x: 0, y: this.size-1},
            {x: this.size-1, y: 0}, {x: this.size-1, y: this.size-1}
        ];
        return moves.filter(move => 
            corners.some(corner => corner.x === move.x && corner.y === move.y)
        );
    }

    getRestrictiveMoves(board, color, moves) {
        const opponentColor = color === 'W' ? 'B' : 'W';
        let bestMoves = [];
        let minOpponentMoves = Infinity;

        // Buscar movimientos que minimicen las opciones del oponente
        for (const move of moves) {
            const simBoard = board.clone();
            simBoard.move(move.x, move.y, color);
            const opponentMoves = simBoard.valid_moves(opponentColor).length;
            
            if (opponentMoves < minOpponentMoves) {
                minOpponentMoves = opponentMoves;
                bestMoves = [move];
            } else if (opponentMoves === minOpponentMoves) {
                bestMoves.push(move);
            }
        }

        // Filtrar por bordes si hay empate
        if (bestMoves.length > 1) {
            const edgeMoves = bestMoves.filter(m => 
                m.x === 0 || m.x === this.size-1 || m.y === 0 || m.y === this.size-1
            );
            if (edgeMoves.length > 0) return edgeMoves;
        }

        return bestMoves;
    }

    evaluateStrategicMoves(board, color, moves, startTime) {
        const opponentColor = color === 'W' ? 'B' : 'W';
        let bestMove = moves[0];
        let bestScore = -Infinity;
        const maxTime = 1500; // 1.5 segundos máximo

        for (const move of moves) {
            // Verificar tiempo restante
            if (Date.now() - startTime > maxTime) {
                console.log("Tiempo límite alcanzado, devolviendo mejor movimiento encontrado");
                break;
            }

            const simBoard = board.clone();
            if (!simBoard.move(move.x, move.y, color)) continue;

            // Calcular puntuación basada en múltiples factores
            let score = 0;

            // 1. Valor posicional
            score += this.getPositionalScore(move);

            // 2. Movilidad diferencial
            const myNewMoves = simBoard.valid_moves(color).length;
            const oppNewMoves = simBoard.valid_moves(opponentColor).length;
            score += (myNewMoves - oppNewMoves) * this.weights.mobility;

            // 3. Potencial de movimientos futuros
            score += this.calculatePotential(simBoard, color) * this.weights.potential;

            // 4. Estabilidad de bordes
            if (this.isEdgeMove(move)) {
                score += this.weights.edge;
            }

            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }

        return bestMove;
    }

    getPositionalScore(move) {
        // Esquina
        if ((move.x === 0 || move.x === this.size-1) && 
            (move.y === 0 || move.y === this.size-1)) {
            return this.weights.corner;
        }
        
        // Posición adyacente a esquina (mala)
        if (this.isNearCorner(move.x, move.y)) {
            return this.weights.nearCorner;
        }
        
        // Borde
        if (move.x === 0 || move.x === this.size-1 || 
            move.y === 0 || move.y === this.size-1) {
            return this.weights.edge;
        }
        
        return 0;
    }

    isNearCorner(x, y) {
        const cornerDist = Math.max(2, Math.floor(this.size/10));
        const corners = [
            [0, 0], [0, this.size-1],
            [this.size-1, 0], [this.size-1, this.size-1]
        ];
        return corners.some(([cx, cy]) => 
            Math.abs(x-cx) <= cornerDist && Math.abs(y-cy) <= cornerDist
        );
    }

    isEdgeMove(move) {
        return move.x === 0 || move.x === this.size-1 || 
               move.y === 0 || move.y === this.size-1;
    }

    calculatePotential(board, color) {
        // Calcular casillas vacías adyacentes a fichas del oponente
        const opponentColor = color === 'W' ? 'B' : 'W';
        let potential = 0;
        
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                if (board.board[y][x] === ' ' && this.isAdjacentTo(board, x, y, opponentColor)) {
                    potential++;
                }
            }
        }
        
        return potential;
    }

    isAdjacentTo(board, x, y, color) {
        const directions = [[-1,-1], [-1,0], [-1,1], [0,-1], [0,1], [1,-1], [1,0], [1,1]];
        return directions.some(([dx, dy]) => {
            const nx = x + dx, ny = y + dy;
            return nx >= 0 && nx < this.size && ny >= 0 && ny < this.size && 
                   board.board[ny][nx] === color;
        });
    }

    getFallbackMove(percept) {
        // Estrategia de emergencia cuando hay errores
        const board = percept['board'];
        const color = percept['color'];
        const moves = board.valid_moves(color);
        
        if (moves.length === 0) return {'x': -1, 'y': -1};
        
        // Priorizar bordes si es posible
        const edgeMoves = moves.filter(m => 
            m.x === 0 || m.x === board.board.length-1 || 
            m.y === 0 || m.y === board.board.length-1
        );
        
        return edgeMoves.length > 0 ? edgeMoves[0] : moves[0];
    }
}

class Agent2 extends Agent {
  constructor() {
    super();
    this.maxDepth = 3;
  }

  compute(percept) {
    const color = percept.color;
    const board = percept.board;
    // arrancamos con α = -∞, β = +∞
    const result = this.minmax(board, color, 0, -Infinity, +Infinity, true);
    if (result.move) {
      return { x: result.move.x, y: result.move.y };
    }
    return null;
  }

  
  minmax(board, maxColor, depth, alpha, beta, isMax) {
    // Caso base: profundidad o fin de juego
    if (depth >= this.maxDepth || this.isGameOver(board)) {
      const score = this.evaluateBoard(board, maxColor);
      return { score: score, move: null };
    }

    // determino quién juega en este nivel
    let currentColor = isMax ? maxColor : this.opponentColor(maxColor);
    const moves = board.valid_moves(currentColor);

    // sin movimientos → evaluar
    if (moves.length === 0) {
      const score = this.evaluateBoard(board, maxColor);
      return { score: score, move: null };
    }

    let bestMove = null;

    if (isMax) {
      let bestScore = -Infinity;
      for (let mv of moves) {
        const next = board.clone();
        next.move(mv.x, mv.y, currentColor);

        // recursión en modo minimizador
        const { score } = this.minmax(next, maxColor, depth + 1, alpha, beta, false);

        if (score > bestScore) {
          bestScore = score;
          bestMove  = mv;
        }
        alpha = Math.max(alpha, bestScore);
        if (alpha >= beta) break;  // poda β
      }
      return { score: bestScore, move: bestMove };

    } else {
      let bestScore = +Infinity;
      for (let mv of moves) {
        const next = board.clone();
        next.move(mv.x, mv.y, currentColor);

        // recursión en modo maximizador
        const { score } = this.minmax(next, maxColor, depth + 1, alpha, beta, true);

        if (score < bestScore) {
          bestScore = score;
          bestMove  = mv;
        }
        beta = Math.min(beta, bestScore);
        if (beta <= alpha) break;  // poda α
      }
      return { score: bestScore, move: bestMove };
    }
  }

  // Primer algoritmo para evaluar
  
    evaluateNumberPieces(board, maxColor) {
    const b = board.board;
    const n = b.length;
    let cntMax = 0, cntOpp = 0;
    const opp = this.opponentColor(maxColor);

    for (let y = 0; y < n; y++) {
        for (let x = 0; x < n; x++) {
        if (b[y][x] === maxColor) cntMax++;
        else if (b[y][x] === opp) cntOpp++;
        }
    }
    
    const totalPieces = cntMax + cntOpp;
    if (totalPieces === 0) return 0;  // tablero vacío

    if (cntMax > cntOpp)  return 100 * (cntMax / totalPieces);
    if (cntMax < cntOpp)  return -100 * (cntOpp / totalPieces);
    return 0;
    }

    // 2) Movilidad
    evaluateMov(board, maxColor) {
    const opp     = this.opponentColor(maxColor);
    const movMax  = board.valid_moves(maxColor).length;
    const movOpp  = board.valid_moves(opp)     .length;
    const total   = movMax + movOpp;
    if (total === 0) return 0;  // sin movimientos a ambos

    if (movMax > movOpp)  return 100 * (movMax / total);
    if (movMax < movOpp)  return -100 * (movOpp / total);
    return 0;
    }

    
    evaluateCorner(board, maxColor) {
    const opp = this.opponentColor(maxColor);
    const b   = board.board;
    const n   = b.length;
    const last = n - 1;
    
    if (last < 1) return 0;

    const corners = [
        b[0][0],
        b[0][last],
        b[last][0],
        b[last][last]
    ];

    let maxCount = 0, oppCount = 0;
    for (const c of corners) {
        if      (c === maxColor) maxCount++;
        else if (c === opp)      oppCount++;
    }
    return 25 * (maxCount - oppCount);
    }


    evaluateAdjacencyCorner(board, maxColor) {
    const opp = this.opponentColor(maxColor);
    const b   = board.board;
    const n   = b.length;
    const last = n - 1;
    if (last < 1) return 0;

    
    const cells = [
        b[0][1],   b[1][0],   b[1][1],               // UL
        b[0][last-1], b[1][last], b[1][last-1],     // UR
        b[last-1][0], b[last][1], b[last-1][1],     // LL
        b[last-1][last], b[last][last-1], b[last][last] // LR diag, but LR corner is at [last][last]
    ];

    let maxCount = 0, oppCnt = 0;
    for (const d of cells) {
        if      (d === maxColor) maxCount++;
        else if (d === opp)      oppCnt++;
    }
    return -12.5 * maxCount + 12.5 * oppCnt;
    }

    

    
    evaluateBoard(board, maxColor) {
    const p  = this.evaluateNumberPieces    (board, maxColor);
    const c  = this.evaluateCorner          (board, maxColor);
    const aC = this.evaluateAdjacencyCorner (board, maxColor);
    

    //console.log({ pieces: p, corner: c, adjacency: aC });
    return p + c + aC ;
    }



  isGameOver(board) {
    const wCan = board.can_play('W');
    const bCan = board.can_play('B');
    return !wCan && !bCan;
  }

  opponentColor(color) {
    return color === 'W' ? 'B' : 'W';
  }
}

/////////////////// ENVIRONMENT CLASSES AND DEFINITION /////////////////////////
/*
* Board class (Cannot be modified )
*/
class Board{
    /**
     * Creates a board of size*size 
     * @param {*} size Size of the board
     */
    constructor(size){
        var board = []
        for(var i=0; i<size; i++){
            board[i] = []
            for(var j=0; j<size; j++)
                board[i][j] = ' '
        }
        var m = Math.floor(size/2) - 1
        board[m][m] = 'W'
        board[m][m+1] = 'B'
        board[m+1][m+1] = 'W'
        board[m+1][m] = 'B'
        this.board = board
    }

    // Deep clone of a board the reduce risk of damaging the real board
    clone(){
        var board = this.board
        var size = board.length
        var b = []
        for(var i=0; i<size; i++){
            b[i] = []
            for(var j=0; j<size; j++)
                b[i][j] = board[i][j]
        }
        var nb = new Board(2)
        nb.board = b
        return nb
    }

    // Determines if a piece of the given color can be set at position  y, x (row, column, respectively)
    check(color, x, y){
        var board = this.board
        var size = board.length
        if(board[y][x]!=' ') return false
        var rcolor = color=='W'?'B':'W'
        //left
        var k=x-1
        while(k>=0 && board[y][k]==rcolor) k--
        if(k>=0 && Math.abs(k-x)>1 && board[y][k]==color) return true
        //right
        k=x+1
        while(k<size && board[y][k]==rcolor) k++
        if(k<size && Math.abs(k-x)>1 && board[y][k]==color) return true
        //up
        k=y-1
        while(k>=0 && board[k][x]==rcolor) k--
        if(k>=0 && Math.abs(k-y)>1 && board[k][x]==color) return true
        //down
        k=y+1
        while(k<size && board[k][x]==rcolor) k++
        if(k<size && Math.abs(k-y)>1 && board[k][x]==color) return true
        //left-top
        k=y-1
        var l=x-1
        while(k>=0 && l>=0 && board[k][l]==rcolor){
            k--
            l--
        }
        if(k>=0 && l>=0 && Math.abs(k-y)>1 && Math.abs(l-x)>1 && board[k][l]==color) return true
        //left-bottom
        k=y+1
        l=x-1
        while(k<size && l>=0 && board[k][l]==rcolor){
            k++
            l--
        }
        if(k<size && l>=0 && Math.abs(k-y)>1 && Math.abs(l-x)>1 && board[k][l]==color) return true
        //right-top
        k=y-1
        l=x+1
        while(k>=0 && l<size && board[k][l]==rcolor){
            k--
            l++
        }
        if(k>=0 && l<size && Math.abs(k-y)>1 && Math.abs(l-x)>1 && board[k][l]==color) return true
        //right-bottom
        k=y+1
        l=x+1
        while(k<size && l<size && board[k][l]==rcolor){
            k++
            l++
        }
        if(k<size && l<size && Math.abs(k-y)>1 && Math.abs(l-x)>1 && board[k][l]==color) return true
        return false
    }

    // Computes all the valid moves for the given 'color'
    valid_moves(color){
        var moves = []
        var size = this.board.length
        for(var i=0; i<size; i++){
            for( var j=0; j<size; j++)
            if(this.check(color, j, i)) moves.push({'y':i, 'x':j})
        }
        return moves
    }

    // Determines if a piece of 'color' can be set
    can_play(color){
        var board = this.board
        var size = board.length
        var i=0
        while(i<size){
            var j=0
            while(j<size && !this.check(color, j, i)) j++
            if(j<size) return true
            i++
        }
        return false
    }

    // Computes the new board when a piece of 'color' is set at position y, x (row, column respectively)
    // If it is an invalid movement stops the game and declares the other 'color' as winner
    move(x, y, color){
        var board = this.board
        var size = board.length
        if(x<0 || x>=size || y<0 || y>=size || board[y][x]!=' ') return false
        board[y][x] = color
        var rcolor = color=='W'?'B':'W'
        var flag = false
        var i = y
        var j = x
        //left
        var k=j-1
        while(k>=0 && board[i][k]==rcolor) k--
        if(k>=0 && Math.abs(k-j)>1 && board[i][k]==color){
            flag = true
            k=j-1
            while(k>0 && board[i][k]==rcolor){
                board[i][k]=color
                k--
            }
        }
        //right
        k=j+1
        while(k<size && board[i][k]==rcolor) k++
        if(k<size && Math.abs(k-j)>1 && board[i][k]==color){
            flag = true
            k=j+1
            while(k<size && board[i][k]==rcolor){
                board[i][k]=color
                k++
            }
        }
        //up
        k=i-1
        while(k>=0 && board[k][j]==rcolor) k--
        if(k>=0 && Math.abs(k-i)>1 && board[k][j]==color){
            flag = true
            k=i-1
            while(k>=0 && board[k][j]==rcolor){
                board[k][j]=color
                k--
            }
        }
        //down
        k=i+1
        while(k<size && board[k][j]==rcolor) k++
        if(k<size && Math.abs(k-i)>1 && board[k][j]==color){
            flag = true
            k=i+1
            while(k<size && board[k][j]==rcolor){
                board[k][j]=color
                k++
            }
        }
        //left-top
        k=i-1
        l=j-1
        while(k>=0 && l>=0 && board[k][l]==rcolor){
            k--
            l--
        }
        if(k>=0 && l>=0 && Math.abs(k-i)>1 && Math.abs(l-j)>1 && board[k][l]==color){
            flag = true
            k=i-1
            l=j-1
            while(k>=0 && l>=0 && board[k][l]==rcolor){
                board[k][l]=color
                k--
                l--
            }
        }
        //left-bottom
        var k=i+1
        var l=j-1
        while(k<size && l>=0 && board[k][l]==rcolor){
            k++
            l--
        }
        if(k<size && l>=0 && Math.abs(k-i)>1 && Math.abs(l-j)>1 && board[k][l]==color){
            flag = true
            var k=i+1
            var l=j-1
            while(k<size && l>=0 && board[k][l]==rcolor){
                board[k][l]=color
                k++
                l--
            }
        }
        //right-top
        var k=i-1
        var l=j+1
        while(k>=0 && l<size && board[k][l]==rcolor){
            k--
            l++
        }
        if(k>=0 && l<size && Math.abs(k-i)>1 && Math.abs(l-j)>1 && board[k][l]==color){
            flag = true
            var k=i-1
            var l=j+1
            while(k>=0 && l<size && board[k][l]==rcolor){
                board[k][l]=color
                k--
                l++
            }
        }
        //right-bottom
        var k=i+1
        var l=j+1
        while(k<size && l<size && board[k][l]==rcolor){
            k++
            l++
        }
        if(k<size && l<size && Math.abs(k-i)>1 && Math.abs(l-j)>1 && board[k][l]==color){
            flag = true
            var k=i+1
            var l=j+1
            while(k<size && l<size && board[k][l]==rcolor){
                board[k][l]=color
                k++
                l++
            }
        }
        return flag
    }

    // Computes the winner in terms of number of pieces in the board
    winner(white, black){
        var board = this.board
        var size = board.length
        var W = 0
        var B = 0
        for( var i=0; i<size; i++)
            for(var j=0; j<size; j++)
                if(board[i][j]=='W') W++
                else if(board[i][j]=='B') B++
        var msg = ' Pieces count W:' + W + ' B:' + B
        if(W==B) return 'Draw ' + msg
        return ((W>B)?white:black) + msg
    }

    // Draw the board on the canvas
    print(){
        var board = this.board
        var size = board.length
        // Commands to be run (left as string to show them into the editor)
        var grid = []
        for(var i=0; i<size; i++){
            for(var j=0; j<size; j++)
                grid.push({"command":"translate", "y":i, "x":j, "commands":[{"command":"-"}, {"command":board[i][j]}]})
        }
        var commands = {"r":true,"x":1.0/size,"y":1.0/size,"command":"fit", "commands":grid}
        Konekti.client['canvas'].setText(commands)
    }
}

/**
 * Player class . Encapsulates all the behaviour of a hardware/software agent. (Cannot be modified or any of its attributes accesed directly)
 */
class Player{
    constructor(id, agent, color, time){
        this.id = id
        this.agent = agent
        this.color = color
        this.time = time
        this.end = this.start = -1
    }

    reduce(){ 
        this.time -= (this.end-this.start)
        this.start = this.end = -1
        return (this.time > 0) 
    }

    thinking(){ return this.start != -1 }

    compute( percept ){
        this.start = Date.now()
        var action = this.agent.compute(percept)
        this.end = Date.now()
        if(this.reduce()) return action
        return null 
    }
    
    remainingTime(end){
        return this.time + this.start - end
    }
}

/**
 * Game class. A Reversi game class (Cannot be modified or any of its attributes accesed directly)
 */
class Game{
    constructor(player1, player2, N, time){
        this.player1 = new Player(player1, players[player1], 'W', time)
        this.player2 = new Player(player2, players[player2], 'B', time)
        this.board = new Board(N)
        this.active = this.player1
        this.inactive = this.player2
        this.winner = ''
    }

    swap(){
        var t = this.active
        this.active = this.inactive
        this.inactive = t
    }

    play(){
        if(!this.board.can_play('W') && !this.board.can_play('B')){
            this.winner = this.board.winner(this.player1.id, this.player2.id)
            return this.winner
        }
        if(!this.board.can_play(this.active.color)) this.swap()
        var action = this.active.compute({'board':this.board.clone(), 'color': this.active.color, 'W':this.player1.time, 'B':this.player2.time})
        if(action!=null && 'x' in action && 'y' in action && Number.isInteger(action['x']) && Number.isInteger(action['y']) && this.board.move(action['x'], action['y'], this.active.color)){
            this.swap()
        }else{
            this.winner = this.inactive.id + ' since ' + this.active.id + ' produces a wrong move  ' 
        }
        return this.winner
    }
}

/*
* Environment (Cannot be modified or any of its attributes accesed directly)
*/
class Environment extends MainClient{
    constructor(){ super() }

    // Initializes the game
    init(){
        var white = Konekti.vc('W').value // Name of competitor with white pieces
        var black = Konekti.vc('B').value // Name of competitor with black pieces
        var time = 1000*parseInt(Konekti.vc('time').value) // Maximum playing time assigned to a competitor (milliseconds)
        var size = parseInt(Konekti.vc('size').value) // Size of the reversi board

        this.game = new Game(white, black, size, time)

        Konekti.vc('W_time').innerHTML = ''+time
        Konekti.vc('B_time').innerHTML = ''+time
    }

    // Listen to play button
    play(){
        var TIME = 50
        Konekti.vc('log').innerHTML = 'The winner is...'

        this.init()
        var game = this.game
 
        function clock(){          
            if(game.winner!='') return
            if(game.active.thinking()){
                var remaining = game.active.remainingTime(Date.now())
                Konekti.vc(game.active.color+'_time').innerHTML = remaining
                Konekti.vc(game.inactive.color+'_time').innerHTML = game.inactive.time

                if(remaining <= 0) game.winner = game.inactive.id + ' since ' + game.active.id + ' got time out'
                else setTimeout(clock,TIME)
            }else{
                Konekti.vc(game.active.color+'_time').innerHTML = game.active.time
                Konekti.vc(game.inactive.color+'_time').innerHTML = game.inactive.time
                setTimeout(clock,TIME)
            }
        }

        function print(){
            game.board.print()
            if(game.winner == '')
                setTimeout(print, 50)
        }

        function run(){
            if(game.winner =='' ){
                game.play()
                setTimeout(run,50)
            }else Konekti.vc('log').innerHTML = 'The winner is...' + game.winner
        }
        
        setTimeout(clock, 50)
        setTimeout(print,50)
        setTimeout(run,50)
    }
}

// Drawing commands
function custom_commands(){
    return [
        {
            "command":" ", "commands":[
                {
                    "command":"fillStyle",
                    "color":{"red":255, "green":255, "blue":255, "alpha":255}
                },
                {
                    "command":"polygon",
                    "x":[0.2,0.2,0.8,0.8],
                    "y":[0.2,0.8,0.8,0.2]
                }

            ]
        },
        {
            "command":"-", "commands":[
                {
                    "command":"strokeStyle",
                    "color":{"red":0, "green":0, "blue":0, "alpha":255}
                },
                {
                    "command":"polyline",
                    "x":[0,0,1,1,0],
                    "y":[0,1,1,0,0]
                }
            ]
        },
        {
            "command":"B", "commands":[
                {
                    "command":"fillStyle",
                    "color":{"red":0, "green":0, "blue":0, "alpha":255}
                },
                {
                    "command":"polygon",
                    "x":[0.2,0.2,0.8,0.8],
                    "y":[0.2,0.8,0.8,0.2]
                }
            ]
        },
        {
            "command":"W", "commands":[
                {
                    "command":"fillStyle",
                    "color":{"red":255, "green":255, "blue":0, "alpha":255}
                },
                {
                    "command":"polygon",
                    "x":[0.2,0.2,0.8,0.8],
                    "y":[0.2,0.8,0.8,0.2]
                }
            ]
        }
    ]
}
