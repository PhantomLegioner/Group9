export class Grid
{
  constructor(height, width, size, floorTexture, wallTexture) 
  { 
    //Initialize parameters
		this.width=width;
		this.height=height;
    this.mazeSize=size;
    this.planeSize=size;
    this.cubeSize=this.planeSize/this.mazeSize;
    this.wallWidth=0.1;
    this.wallHeight=0.5;

    //Make a mesh for the maze floor
    {
        const planeGeo = new THREE.PlaneBufferGeometry(this.planeSize, this.planeSize);
        var planeMat=null;
        if(floorTexture!=null)
        {
          planeMat = new THREE.MeshPhongMaterial({map: floorTexture, color: 0xAAAAAA, side: THREE.DoubleSide,});
        }
        else
        {
          planeMat = new THREE.MeshPhongMaterial({color: 0x444444, side: THREE.DoubleSide,});
        }
        this.plane = new THREE.Mesh(planeGeo, planeMat);
    }
    
    //Generate a random maze
    const cells=newMaze(this.mazeSize,this.mazeSize)

    //Create an easier to read representation for the maze
    //(this is left over from an earlier version)
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
    
    //Generate a 3D model of the maze
    this.generateMazeMesh(wallTexture);
  }
  
  //Get real-world position of tile (w,h)
  getTilePosition(w,h)
  {
    var pos=[(w+0.5)*this.cubeSize-this.planeSize/2, (h+0.5)*this.cubeSize-this.planeSize/2];
    return pos;
  }
  
  //Check if can move in direction from (w0,h0)
  canMove(w0,h0,dir)
  {
    if(w0>=0 && w0<this.width && h0>=0 && h0<this.height)
    {
      if(dir=="up")
      {
        return !this.grid[Math.floor(h0)][Math.floor(w0)].top;
      }
      if(dir=="right")
      {
        return !this.grid[Math.floor(h0)][Math.floor(w0)].right;
      }
      if(dir=="down")
      {
        return !this.grid[Math.ceil(h0)][Math.floor(w0)].bottom;
      }
      if(dir=="left")
      {
        return !this.grid[Math.floor(h0)][Math.ceil(w0)].left;
      }
    }
    else return false;
  }
  
  //This generates the actual 3D model of the maze
  generateMazeMesh(wallTexture)
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
        var cubeMat=null;
        if(wallTexture==null)
        {
          cubeMat = new THREE.MeshPhongMaterial( { color: 0x0000ff, vertexColors: true } );
        }
        else
        {
          cubeMat = new THREE.MeshPhongMaterial( {map: wallTexture, color: 0xffffff, vertexColors: true } );
        }
      
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

  //Encode tile position as integer
  encodeTile(w,h)
  {
    return h*this.width+w;
  }

  //Decode tile position from integer
  decodeTile(i)
  {
    var h=Math.floor(i/this.width);
    var w=i-h*this.width;
    return [w,h];
  }


  //Djikstra's algorithm inspired by the implementation in
  //https://www.baeldung.com/java-dijkstra
  djikstraAlgorithm(w,h) 
  {
    let distances = {};
    let prev = {};
    let settled=new Set();
    let unsettled=new Set();

    var tileIndex=this.encodeTile(w,h);
    unsettled.add(tileIndex);
    distances[tileIndex]=0;
    for(var i=0;i<this.width;i++)
    {
      for(var j=0;j<this.height;j++)
      {
        var tileIndex2=this.encodeTile(i,j);
        if(tileIndex2!=tileIndex)
        {
          distances[tileIndex2]=Infinity;
        }
        prev[tileIndex2]=null;
      }
    }
 
    //Iterate the algorithm
    while(unsettled.size!=0) 
    {

      //Find lowest distance tile
      let minDist=Infinity;
      let minTile=0;
      for(var tile of unsettled)
      {
        if(distances[tile]<minDist)
        {
          minDist=distances[tile];
          minTile=tile;
        }
      }
      unsettled.delete(minTile);
      settled.add(minTile);

      //Handle neighboring tiles
      var temp=this.decodeTile(minTile);
      let w0=temp[0];
      let h0=temp[1];
      const dirs=["up","down","right","left"];
      for(var i=0;i<4;i++)
      {    
        var dir=dirs[i];
        if(this.canMove(w0,h0,dir))
        {
          var w1=w0;
          var h1=h0;
          if(dir=="up")
          {
            h1+=1;
          }
          if(dir=="down")
          {
            h1-=1;
          }
          if(dir=="left")
          {
            w1-=1;
          }
          if(dir=="right")
          {
            w1+=1;
          }
          var neighborTile=this.encodeTile(w1,h1);
          if(!settled.has(neighborTile))
          {
            var dist=minDist+1;
            distances[neighborTile]=dist;
            prev[neighborTile]=minTile;
            unsettled.add(neighborTile);
          }
        }
      }
    }
    return prev;
 }
}

//This generates a 3D array called cells
//cells contains information about the walls
function newMaze(x, y) 
{
  var cells = new Array();

  //Make the outer walls
  for (var i = 0; i < y; i++) 
  {
    cells[i] = new Array();
    for (var j = 0; j < x; j++) 
    {
      cells[i][j] = [1,1,1,1];
    }
  }
  for (var j = 0; j < x; j++) 
  {
    cells[0][j][0] = 0;
    cells[y-1][j][2] = 0;
  }
  for (var i = 0; i < y; i++) 
  {
    cells[i][0][3] = 0;
    cells[i][y-1][1] = 0;
  }

  //Start divide and conquer algorithm
  newMaze_r(cells,0,x,0,y,0,0,0,0);

  //Return finalized maze
  return cells;
}

//Divides the maze by a horizontal or vertical wall
//with one or multiple doors and repeat for both halves
//until room is 1 cell wide or tall.
//This ensures all tiles are accessible.
function newMaze_r(cells, lo_x, hi_x, lo_y, hi_y, prev_wallPos, prev_vertical, depth)
{
  //Check that remaining half is more than 1 wide and tall
  //and that it is not a 2x2 square
  if(hi_x-lo_x>1 && hi_y-lo_y>1 && !(hi_x-lo_x==2 && hi_y-lo_y==2))
  {
    //Use vertical wall if room is wider than it is taller;
    //horizontal otherwise
    const vertical=(hi_x-lo_x>hi_y-lo_y);

    //Build vertical wall
    if(vertical==true)
    {

      //Wall y-position is randomized
      const wallPos=1+lo_x+Math.floor(Math.random()*(hi_x-lo_x-1));

      //Number of doors depends on the length of the wall
      //Positions of doors are randomized
      //var numberDoors=1+Math.floor((hi_y-lo_y)/2);
      var numberDoors=1;
      var doorPos=[];
      for(var i=0; i<numberDoors; i++)
      {
        doorPos.push(1+lo_y+Math.floor(Math.random()*(hi_y-lo_y-1)));
      }

      //Fill in the wall with doors excluded
      for (var i = lo_y; i < hi_y; i++)
      {
        if(!doorPos.includes(i))
        {
          cells[i][wallPos][3] = 0;
          cells[i][wallPos-1][1] = 0;
        }
      }

      //Create a door from both new halves into previous half
      //if possible. This makes multiple escape routes (hopefully)
      if(!prev_vertical && prev_wallPos!=0)
      {
        var doorPos1=lo_x+Math.floor((wallPos-lo_x)/2);
        var doorPos2=wallPos+Math.floor((hi_x-wallPos)/2);
        cells[prev_wallPos][doorPos1][0] = 1;
        cells[prev_wallPos-1][doorPos1][2] = 1;
        cells[prev_wallPos][doorPos2][0] = 1;
        cells[prev_wallPos-1][doorPos2][2] = 1;
      }
      //Repeat algorithm for both halves
      newMaze_r(cells,lo_x,wallPos,lo_y,hi_y,wallPos,vertical,depth+1);
      newMaze_r(cells,wallPos,hi_x,lo_y,hi_y,wallPos,vertical,depth+1);
    }
    //Build horizontal wall (works almost the same way as vertical walls)
    else
    {
      const wallPos=1+lo_y+Math.floor(Math.random()*(hi_y-lo_y-1)); 
      //var numberDoors=1+Math.floor((hi_x-lo_x)/2);
      var numberDoors=1;
      var doorPos=[];
      for(var i=0; i<numberDoors; i++)
      {
        doorPos.push(1+lo_x+Math.floor(Math.random()*(hi_x-lo_x-1)));
      }
      for (var j = lo_x; j < hi_x; j++)
      {
        if(!doorPos.includes(j))
        {
          cells[wallPos][j][0] = 0;
          cells[wallPos-1][j][2] = 0;
        }
      }
      if(prev_vertical && prev_wallPos!=0)
      {
        var doorPos1=lo_y+Math.floor((wallPos-lo_y)/2);
        var doorPos2=wallPos+Math.floor((hi_y-wallPos)/2);
        cells[doorPos1][prev_wallPos][3] = 1;
        cells[doorPos1][prev_wallPos-1][1] = 1;
        cells[doorPos2][prev_wallPos][3] = 1;
        cells[doorPos2][prev_wallPos-1][1] = 1;
      }
      newMaze_r(cells,lo_x,hi_x,lo_y,wallPos,wallPos,vertical,depth+1);
      newMaze_r(cells,lo_x,hi_x,wallPos,hi_y,wallPos,vertical,depth+1);
    }
  }
}