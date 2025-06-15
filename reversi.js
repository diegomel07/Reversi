
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
