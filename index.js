$(document).ready(function() {

    const cvs = document.getElementById('tetrisSpace');
    const ctx = cvs.getContext('2d');
    const nCVS = document.getElementById('nextPiece');
    const nCTX = nCVS.getContext('2d');
    const SQ = 20;
    const row = 20;
    const column = 10;
    const vacant = '#1c1259';
    let score = 0;
    let scoreMultiplier = 1;
    let level = 1;
    let dropStart = Date.now();
    let gameOver = false;
    let dropPiece;
    let timeInterval = 600;
    var isPaused = false;
    let board = new Array(row).fill(vacant).map(() => new Array(column).fill(vacant));
    const pieces = [
        [Z,"red"],
        [S,"green"],
        [T,"yellow"],
        [O,"blue"],
        [L,"purple"],
        [I,"cyan"],
        [J,"orange"]
    ];

    function tetrisPiece(layouts, color, localBoard,context){ //tetromino constructor
        this.layouts = layouts;
        this.color = color;
        this.activeLayoutIndex = 0;
        this.activeLayout = this.layouts[this.activeLayoutIndex];
        this.x = 3;
        this.y = -2;
        this.localBoard = localBoard;
        this.context = context;
    }

    let nextPiece = generateRandomPiece();
      let currentPiece = generateRandomPiece(board, ctx);

    function drawBoard(r,c){ //recursive function which renders the canvas based on given board matrix
        if (r>=row)
            return;
        else if(c>=column)
            drawBoard(r+1, 0);
        else{
            drawSquare(c, r, currentPiece.localBoard[r][c],ctx);
            drawBoard(r,c+1);
        }
    }

    function drawRect(context,x,y,color,stroke,xLength=1,yLength=1,xAdd=0,yAdd=0){ //general function which draws a rectangle of a given size to a given canvas
        context.fillStyle = color;
        context.fillRect(x*xLength+xAdd,y*yLength+yAdd,xLength,yLength);
        context.strokeStyle = stroke;
        context.strokeRect(x*xLength+xAdd,y*yLength+yAdd,xLength,yLength);
    }

    function drawSquare(x, y, color, context){ //updates board matrix and draws a new square to the main canvas when y>=0 (must be on canvas)
        let xAdd = context == nCTX ? 30 : 0;
        let yAdd = context == nCTX ? 30 : 0;

        if (y>=0 && context == ctx){ 
            currentPiece.localBoard[y][x] = color;
            drawRect(context,x,y,color,"#1c1259",SQ,SQ, xAdd, yAdd);
        }else if(context == nCTX){
            drawRect(context,x,y,color,"#1c1259",SQ,SQ, xAdd, yAdd);
        }
    }

    tetrisPiece.prototype.fill = function(color){ //loops thru a tetromino's NxN activeLayout matrix and writes existing (1's) parts to the board & canvas by calling drawSquare
        this.activeLayout.forEach((r, i) => 
            r.forEach((c, k) => 
                this.activeLayout[i][k] ? drawSquare(this.x + k, this.y + i, color, this.context) : null));
    }

    tetrisPiece.prototype.draw = function(){ //draws tetromino to the board & canvas
        this.fill(this.color);
    }

    tetrisPiece.prototype.undraw = function(){//undraws tetromino to the board & canvas 
        this.fill(vacant);
    }

    tetrisPiece.prototype.collision = function(x,y,pattern){
        this.undraw();
        for (let r=0;r< pattern.length;r++){
            for (let c=0;c< pattern.length;c++){
              if(!pattern[r][c])
                  continue;
              let newX = this.x + x + c;
              let newY = this.y + y + r;
              if (newX < 0||newX>=column||newY>=row) //checks for edges (left, right, bottom)
                  return true;
              if (newY <= 0)
                  continue;
              if(this.localBoard[newY][newX]!= vacant /* && !pattern[r+y][c] && !pattern[r][c+x]*/)
                  return true;
                
            }
        }
        return false;
    }

    tetrisPiece.prototype.moveDown = function(){
        if (!this.collision(0,1,this.activeLayout)){
            undrawThenDraw(true,'y',this);
        }else {
            //lock, gen newpiece
            //this is a crucial spot
            //if i add an active board attr to the tetromino object
            //then i can switch it from null or whatever it is when its
            //in the 'next piece' realm 
            //to the real main board via the last 'currentPiece' passing it over 
            this.lock();
            let tempBoard = this.localBoard;
            let tempContext = this.context;
            $.extend(currentPiece, nextPiece);
            currentPiece.localBoard = tempBoard;
            currentPiece.context = tempContext;
            /* undrawNextPiece(nextPiece); */
            nextPiece.undraw();
            nextPiece = generateRandomPiece();
            nextPiece.draw();
            /* drawNextPiece(nextPiece) */
        }
    }

    /// i notice repeation here i could just use fill and pass thru the nCTX to tetrisPiece.fill
    /* function undrawNextPiece({activeLayout}){
        for(let x=0;x<activeLayout.length;x++){
            for(let y=0;y<activeLayout[x].length;y++){
                if(activeLayout[x][y]){
                    drawRect(nCTX,y,x,vacant,vacant,SQ,SQ,30,20);
                }
            }
        }
    }
    function drawNextPiece({color, activeLayout}){
        for(let x=0;x<activeLayout.length;x++){
            for(let y=0;y<activeLayout[x].length;y++){
                if(activeLayout[x][y]){
                    drawRect(nCTX,y,x,color,"#1c1259",SQ,SQ,30,20);
                }
            }
        }
    } */

    tetrisPiece.prototype.moveRight = function(){
        if (!this.collision(1,0,this.activeLayout)){
            undrawThenDraw(true,'x',this);
        }else{
            this.draw();
        }
    }

    tetrisPiece.prototype.moveLeft = function(){
        if (!this.collision(-1,0,this.activeLayout)){
            undrawThenDraw(false,'x',this);
        }else{
            this.draw();
        }
    }

    function undrawThenDraw(increment,variable, user){
        user.undraw();
        increment ? user[variable]++:user[variable]--;
        user.draw();
    }

    tetrisPiece.prototype.rotate = function(){
        let nextPattern = this.layouts[(this.activeLayoutIndex+1)%this.layouts.length];
        let kick = 0;
        if(this.collision(0,0,nextPattern)){
            if(this.x > column/2){
                kick = -1;
            }else{
                kick = 1;
            }
        }
        if (!this.collision(kick,0,nextPattern)){
            this.undraw();
            this.x+=kick;
            this.activeLayoutIndex = (this.activeLayoutIndex+1)%this.layouts.length;
            this.activeLayout = this.layouts[this.activeLayoutIndex];
            this.draw();
        }
    }

      function generateRandomPiece(localBoard = null, context = nCTX){
        let randomPiece = {
            ...pieces[Math.floor(Math.random() * pieces.length)]
        };
          return new tetrisPiece(randomPiece[0],randomPiece[1], localBoard, context);
      }
    tetrisPiece.prototype.lock = function(){
        for (let r=0;r< this.activeLayout.length;r++){
            for (let c=0;c< this.activeLayout[r].length;c++){
                if(!this.activeLayout[r][c])
                    continue;
                if (this.y + r <= 0){
                    gameOver = true;
                    break;
                }
                this.localBoard[this.y+r][this.x+c] = this.color;
            }
        }
        for(r = 0; r < row; r++){
            let isRowFull = true;
            for( c = 0; c < column; c++){
                isRowFull = isRowFull && (this.localBoard[r][c] != vacant);
            }
            if(isRowFull){
                for( y = r; y > 1; y--){
                    for( c = 0; c < column; c++){
                        this.localBoard[y][c] = this.localBoard[y-1][c];
                    }
                }
                for( c = 0; c < column; c++){
                    this.localBoard[0][c] = vacant;
                }
                score += 10*scoreMultiplier;
                $('#score').text(score);
                if (score % 50 == 0){
                    level++;
                    $('#level').text(level);
                    timeInterval-=50;
                }
                //once score reaches something then add level & shorten time
                //develop a scoring and leveling up algorithm
            }
        }
        drawBoard(0,0);
    }

     function drop(){
        let now = Date.now();
        let delta = now - dropStart;
        if(delta > timeInterval){
            currentPiece.moveDown();
            dropStart = Date.now();
        }
        !gameOver ? continueDropping():endGame();

    } 

    function continueDropping(){
        dropPiece = requestAnimationFrame(drop);
    }

    function endGame(){
        cancelAnimationFrame(dropPiece);
            currentPiece.localBoard = new Array(row).fill(vacant).map(() => new Array(column).fill(vacant));
            $(document).off("keydown");
            drawRect(ctx,0,0,"black","black",200,400);
            ctx.fillStyle = "white";
            ctx.font = "30px Arial";
            ctx.fillText(`Game`, 30, 150);
            ctx.fillText(`Over`, 35, 180);

        }

    function writeScore(){
        ctx.font = '30px serif';
        ctx.textAlign = 'center';
        ctx.fillText("Game Over",0,0)
    }

    $(document).on("keydown",function(e) {
        switch (e.which) {
          case 37:
            currentPiece.moveLeft(); // left
            dropStart = Date.now();
            break;
          case 38:
            currentPiece.rotate(); // up
            dropStart = Date.now();
            break;
          case 39:
            currentPiece.moveRight(); // right
            dropStart = Date.now();
            break;
          case 40:
            currentPiece.moveDown();
            break;
          case 80:
            isPaused ? drop(): cancelAnimationFrame(dropPiece);
            isPaused = !isPaused;
            break;
          default:
            return; 
        }
        e.preventDefault(); // prevent the default action (scroll / move caret)
      });

      drawBoard(0,0);
      
      drop();
      nextPiece.draw();
});
