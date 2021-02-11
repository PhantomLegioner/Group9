export class Grid
{
  constructor(height, width, x0, y0, size) 
  { 
    //Initialize parameters
		this.width=width;
		this.height=height;
    this.mazeSize=size;
    this.planeSize=size;
    this.cubeSize=this.planeSize/this.mazeSize;
    this.wallWidth=0.1;
    this.wallHeight=0.5;
    {
        const planeGeo = new THREE.PlaneBufferGeometry(this.planeSize, this.planeSize);
        const planeMat = new THREE.MeshPhongMaterial({color: 0x444444, side: THREE.DoubleSide,});
        this.plane = new THREE.Mesh(planeGeo, planeMat);
    }
    
    //Create walls and add to scene
    const cells=newMaze(this.mazeSize,this.mazeSize)
    this.grid=[]
    for(var h=0;h<cells.length;h++)
    {
      var row=[]
      for(var w=0;w<cells[0].length;w++)
      {
        row.push({bottom:!cells[h][w][0],right:!cells[h][w][1],top:!cells[h][w][2],left:!cells[h][w][3]})
      }
      this.grid.push(row);
    }
    //this.walls=Grid.generateMazeMesh(cells,this.mazeSize,this.planeSize,this.cubeSize,0.1);
    this.generateMazeMesh();
  }
  
  //Get the tile from real-world position
  getPositionTile(x,y)
  {
    var pos=[(x+0.5)*this.cubeSize-this.planeSize/2, (y+0.5)*this.cubeSize-this.planeSize/2];
  }
  
  //Get real-world position of tile
  getTilePosition(w,h)
  {
    var pos=[(w+0.5)*this.cubeSize-this.planeSize/2, (h+0.5)*this.cubeSize-this.planeSize/2];
    return pos;
  }
  
  canMove(w0,h0,dir,speed)
  {
    if(dir=="up")
    {
      return !this.grid[Math.floor(h0+0.01)][Math.floor(w0)].top;
    }
    if(dir=="right")
    {
      return !this.grid[Math.floor(h0)][Math.floor(w0+0.01)].right;
    }
    if(dir=="down")
    {
      return !this.grid[Math.ceil(h0-0.01)][Math.floor(w0)].bottom;
    }
    if(dir=="left")
    {
      return !this.grid[Math.floor(h0)][Math.ceil(w0-0.01)].left;
    }
  }
  
  //This generates the actual 3D model of the maze
  generateMazeMesh()
  {
    //Generate a grid of wall positions
    //grid[i][j][0]="boolean of is there an empty space 
    //at the top of tile (i,j)"
    
    //Iterate through grid
    this.walls=[];
    for(var i=0;i<this.grid.length;i++)
    {
        for(var j=0;j<this.grid[0].length;j++)
        {
            //Material is the same for all walls
            const cubeMat = new THREE.MeshPhongMaterial( { color: 0x0000ff, vertexColors: true } );
          
            //Check if tile has bottom wall
            if(this.grid[i][j].bottom)
            {
                const cubeGeo = new THREE.BoxGeometry(this.cubeSize,this.cubeSize*this.wallWidth,this.cubeSize*this.wallHeight);
                var cube = new THREE.Mesh(cubeGeo, cubeMat);
                cube.position.x=(j+0.5)*this.cubeSize-this.planeSize/2;
                cube.position.y=(i+this.wallWidth/2)*this.cubeSize-this.planeSize/2;
                cube.position.z=this.cubeSize/4
                this.walls.push(cube);
            }
            //Check if tile has right wall
            if(this.grid[i][j].right)
            {
                const cubeGeo = new THREE.BoxGeometry(this.cubeSize*this.wallWidth,this.cubeSize,this.cubeSize*this.wallHeight);
                var cube = new THREE.Mesh( cubeGeo, cubeMat);
                cube.position.x=(j+1-this.wallWidth/2)*this.cubeSize-this.planeSize/2;
                cube.position.y=(i+0.5)*this.cubeSize-this.planeSize/2;
                cube.position.z=this.cubeSize/4
                this.walls.push(cube);
            }
          
            //Check if tile has top wall
            if(this.grid[i][j].top)
            {
                const cubeGeo = new THREE.BoxGeometry(this.cubeSize,this.cubeSize*this.wallWidth,this.cubeSize*this.wallHeight);
                var cube = new THREE.Mesh(cubeGeo, cubeMat);
                cube.position.x=(j+0.5)*this.cubeSize-this.planeSize/2;
                cube.position.y=(i+1-this.wallWidth/2)*this.cubeSize-this.planeSize/2;
                cube.position.z=this.cubeSize/4
                this.walls.push(cube);
            }
          
            //Check if tile has left wall
            if(this.grid[i][j].left)
            {
                const cubeGeo = new THREE.BoxGeometry(this.cubeSize*this.wallWidth,this.cubeSize,this.cubeSize*this.wallHeight);
                var cube = new THREE.Mesh( cubeGeo, cubeMat);
                cube.position.x=(j+this.wallWidth/2)*this.cubeSize-this.planeSize/2;
                cube.position.y=(i+0.5)*this.cubeSize-this.planeSize/2;
                cube.position.z=this.cubeSize/4
                this.walls.push(cube);
            }
        }
    }
  }
  
//This generates the actual 3D model of the maze
static generateMazeMeshOld(grid,mazeSize,planeSize,cubeSize,wallWidth)
{
    //Generate a grid of wall positions
    //grid[i][j][0]="boolean of is there an empty space 
    //at the top of tile (i,j)"
    
    //Iterate through grid
    var walls=[];
    for(var i=0;i<grid.length;i++)
    {
        for(var j=0;j<grid[0].length;j++)
        {
            //Material is the same for all walls
            const cubeMat = new THREE.MeshPhongMaterial( { color: 0x0000ff, vertexColors: true } );
          
            //Check if tile has top wall
            if(grid[i][j][0]==0)
            {
                const cubeGeo = new THREE.BoxGeometry(cubeSize,cubeSize*wallWidth,cubeSize*0.5);
                var cube = new THREE.Mesh( cubeGeo, cubeMat);
                cube.position.x=(j+0.5)*cubeSize-planeSize/2;
                cube.position.y=(i+wallWidth/2)*cubeSize-planeSize/2;
                cube.position.z=cubeSize/4
                walls.push(cube);
            }
            //Check if tile has right wall
            if(grid[i][j][1]==0)
            {
                const cubeGeo = new THREE.BoxGeometry(cubeSize*wallWidth,cubeSize,cubeSize*0.5);
                var cube = new THREE.Mesh( cubeGeo, cubeMat);
                cube.position.x=(j+1-wallWidth/2)*cubeSize-planeSize/2;
                cube.position.y=(i+0.5)*cubeSize-planeSize/2;
                cube.position.z=cubeSize/4
                walls.push(cube);
            }
          
            //Check if tile has bottom wall
            if(grid[i][j][2]==0)
            {
                const cubeGeo = new THREE.BoxGeometry(cubeSize,cubeSize*wallWidth,cubeSize*0.5);
                var cube = new THREE.Mesh( cubeGeo, cubeMat);
                cube.position.x=(j+0.5)*cubeSize-planeSize/2;
                cube.position.y=(i+1-wallWidth/2)*cubeSize-planeSize/2;
                cube.position.z=cubeSize/4
                walls.push(cube);
            }
          
            //Check if tile has left wall
            if(grid[i][j][3]==0)
            {
                const cubeGeo = new THREE.BoxGeometry(cubeSize*wallWidth,cubeSize,cubeSize*0.5);
                var cube = new THREE.Mesh( cubeGeo, cubeMat);
                cube.position.x=(j+wallWidth/2)*cubeSize-planeSize/2;
                cube.position.y=(i+0.5)*cubeSize-planeSize/2;
                cube.position.z=cubeSize/4
                walls.push(cube);
            }
        }
    }
    return walls;
  }
}


//This generates a 3D array called cells
//The map is divided into tiles, where tile (0,0)
//is the top left corner. Then we have
//cells[i][j][0]=[i][j][0]="boolean of is there no top wall
//in tile (i,j)", cells[i][j][1] ... right wall ... etc.

//From https://dstromberg.com/2013/07/tutorial-random-maze-generation-algorithm-in-javascript/
function newMaze(x, y) 
{
  // Establish variables and starting grid
  var totalCells = x*y;
  var cells = new Array();
  var unvis = new Array();
  for (var i = 0; i < y; i++) 
  {
    cells[i] = new Array();
    unvis[i] = new Array();
    for (var j = 0; j < x; j++) 
    {
      cells[i][j] = [0,0,0,0];
      unvis[i][j] = true;
    }
  }

  // Set a random position to start from
  var currentCell = [Math.floor(Math.random()*y), Math.floor(Math.random()*x)];
  var path = [currentCell];
  unvis[currentCell[0]][currentCell[1]] = false;
  var visited = 1;

  // Loop through all available cell positions
  while (visited < totalCells) 
  {
    // Determine neighboring cells
    var pot = [[currentCell[0]-1, currentCell[1], 0, 2],
               [currentCell[0], currentCell[1]+1, 1, 3],
               [currentCell[0]+1, currentCell[1], 2, 0],
               [currentCell[0], currentCell[1]-1, 3, 1]];
    var neighbors = new Array();

    // Determine if each neighboring cell is in game grid, and whether it has already been checked
    for (var l = 0; l < 4; l++) 
    {
      if (pot[l][0] > -1 && pot[l][0] < y && pot[l][1] > -1 && pot[l][1] < x && unvis[pot[l][0]][pot[l][1]]) { neighbors.push(pot[l]); }
    }

    // If at least one active neighboring cell has been found
    if (neighbors.length) 
    {
      // Choose one of the neighbors at random
      var next = neighbors[Math.floor(Math.random()*neighbors.length)];

      // Remove the wall between the current cell and the chosen neighboring cell
      cells[currentCell[0]][currentCell[1]][next[2]] = 1;
      cells[next[0]][next[1]][next[3]] = 1;

      // Mark the neighbor as visited, and set it as the current cell
      unvis[next[0]][next[1]] = false;
      visited++;
      currentCell = [next[0], next[1]];
      path.push(currentCell);
    }
    // Otherwise go back up a step and keep going
    else 
    {
      currentCell = path.pop();
    }
  }
  return cells;
}