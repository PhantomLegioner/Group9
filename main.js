import {Grid} from './grid.js';
import {MovingObject} from './movableobject.js';

//GLOBAL VARIABLES

	//For the menus
  var lost=false;
  var score=0;

  //Sounds and background music
  var AUDIO_CONTEXT;
  //player can stop the sounds or the music if he wants
  var sound = true; 
  var music = true;

  //To manage collectables
  var allCollectables = [];

  //Game objects
  var pacman=null;
  var movingObjects=[];
  var ghosts=[]
  
  //Maze is stored as a Grid object from grid.js
  var grid=[];

  var renderer= null;


//This gets called when index.html is loaded
//First shows menu
function main()
{
  renderer = new THREE.WebGLRenderer();
  renderer.setSize( window.innerWidth, window.innerHeight);
  var threejsContainer=document.getElementById("threejsContainer");
  threejsContainer.appendChild(renderer.domElement);

	showMenus();
}

//Starts the game
function initGame()
{
    ///INITIALIZING THREE.JS SCENE AND CAMERA

    //Create scene and camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera( 65, window.innerWidth / window.innerHeight, 0.1, 1000 );

    ///CREATING OBJECTS TO BE ADDED TO THE SCENE
  
    //Create the maze with Grid-class from grid.js
    grid=new Grid(10,10,0,0,10)
    scene.add(grid.plane)
    for(var i=0;i<grid.walls.length;i++){
        scene.add(grid.walls[i]);
    }
  
    //Set up lighting
    {
        const color = 0xFFFFFF;
        const intensity = 1;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(0, 0, 5);
        light.target.position.set(0, 0, -1);
        scene.add(light);
        scene.add(light.target);
    }


    //Create pacman (see the function createPacman() below)
    var pacmanModel=createPacman(grid.cubeSize/2,scene);
    pacman=new MovingObject(pacmanModel,grid,0,0,0.05);

    //Add pacman to collection of moving objects
    movingObjects.push(pacman);

    //Create ghost 
    var ghostModel=createGhost(grid.cubeSize/2,scene);
    var ghost=new MovingObject(ghostModel,grid,5,5,0.05);

    //This function defines how the ghost "AI" works
    const ghostCallback=function(obj, event)
    {
      const dirs=["up","down","right","left"];
      const rand=Math.floor(Math.random() * dirs.length);
      //console.log("ghostCallback called")
      for(var i=0;i<4;i++)
      {
        //If we moved to new tile, then don't move in 
        //the opposite direction
        var dir=dirs[(rand+i)%4];
        if(event!=null)
        {
          if(event.type=="new_tile")
          {
            if(dir=="up" && event.prev_dir=="down") continue;
            if(dir=="down" && event.prev_dir=="up") continue;
            if(dir=="left" && event.prev_dir=="right") continue;
            if(dir=="right" && event.prev_dir=="left") continue;
          }
        }
        if(obj.canMove(dir))
        {
          obj.queueDirection(dir);
          break;
        }
      }
    }
    ghost.registerCallback(ghostCallback);
    ghostCallback(ghost,null);

    //Add ghost to moving objects and the collection of ghosts
    movingObjects.push(ghost);
    ghosts.push(ghost);
  
    //Place camera in front of box
    camera.position.z = 5;
		camera.rotation.x += 0.5;
	
    //Create collectables
    for(var i = 0; i<grid.height; i++){
      for (var j = 0; j<grid.width; j++){
        var collectables=createCollectables(grid.cubeSize/2,scene);

        var pos2=grid.getTilePosition(i,j);
        collectables.position.x=pos2[0];
        collectables.position.y=pos2[1];
        allCollectables.push(new Collectable(false,i,j,scene.children[scene.children.length-1].id));
      }
    }

    //Set up controls
    setupControls()

    //ANIMATE AND RUN GAME
  
    //Render scene repeatedly
    const animate = function () 
    {
      requestAnimationFrame(animate);
			
      for(var i = 0; i<movingObjects.length; i++)
      {
        movingObjects[i].update();
      }
    
      //Move camera to pacman
      camera.position.x=pacman.position.x;
      camera.position.y=pacman.position.y-2;

      eatCollectables(pacman.pos_x, pacman.pos_y, scene);
    
      //Render scene
      renderer.render( scene, camera );
    };

		//showMenus();
	
    //Call animate
    animate();	
}

function playSounds(freq, duration=0.1){

	if(AUDIO_CONTEXT==null){
		AUDIO_CONTEXT = new (AudioContext || webkitAudioContext || window.webkitAudioContext)()
	}

	var osc=AUDIO_CONTEXT.createOscillator();
	var gainNode=AUDIO_CONTEXT.createGain();
	gainNode.gain.setValueAtTime(0,AUDIO_CONTEXT.currentTime);
	gainNode.gain.linearRampToValueAtTime(1,AUDIO_CONTEXT.currentTime+0.07);
	gainNode.gain.linearRampToValueAtTime(0,AUDIO_CONTEXT.currentTime+
		duration);

	osc.type="triangle";
	osc.frequency.value=freq;
	osc.start(AUDIO_CONTEXT.currentTime);
	osc.stop(AUDIO_CONTEXT.currentTime+duration);
	osc.connect(gainNode);

	gainNode.connect(AUDIO_CONTEXT.destination);

}


//Create a collectable
function createCollectables(size,scene)
{
    //Get a cylinder mesh
    const geometry = new THREE.SphereGeometry(size/5, 32, 32);
  
    //Get a yellow solid material
    const material = new THREE.MeshPhongMaterial({color: 0xFFFF00, side: THREE.DoubleSide,});
  
    //Make a yellow cylinder
    const cylinder = new THREE.Mesh(geometry, material);
  
    //Rotate and place at the right height
    cylinder.position.z=size/4;
    cylinder.rotation.x=Math.PI/2;
  
    //Add to scene
    scene.add(cylinder);
    return cylinder;
}

function eatCollectables(posX, posY, scene){
  var index = allCollectables.findIndex(x => x.positionX === posX && x.positionY === posY);
  var indexChildren = scene.children.findIndex(x => x.id === allCollectables[index].childrenNumber);
  if(!allCollectables[index].wasEaten){
      allCollectables[index].wasEaten = true;
      score += 1;
      console.log("Score : " + score);
      if(sound){
        playSounds(200);
      }
      //Delete the collectable
      scene.remove(scene.children[indexChildren]);
      //Check if all collectables was eaten, if yes the player win
      if(score == 100){
        console.log("Won");
      }
  }
}

//Objects to push in allCollectables list and to manage collectables
function Collectable(wasEaten, positionX, positionY, childrenNumber){
  this.wasEaten = wasEaten;
  this.positionX = positionX;
  this.positionY = positionY;
  //To know the position in the children list of the scene
  this.childrenNumber = childrenNumber;
}

//PACMAN MODEL

//This creates the model for pacman
//You can design pacman here
function createPacman(size,scene)
{
    //Get a cylinder mesh
    const geometry = new THREE.CylinderGeometry(size/2, size/2, size/2, 32);
  
    //Get a yellow solid material
    const material = new THREE.MeshPhongMaterial({color: 0xFFFF00, side: THREE.DoubleSide,});
  
    //Make a yellow cylinder
    const cylinder = new THREE.Mesh(geometry, material);
  
    //Rotate and place at the right height
    cylinder.position.z=size/4;
    cylinder.rotation.x=Math.PI/2;
  
    //Add to scene
    scene.add(cylinder);
    return cylinder;
}

//This creates the model for ghosts
function createGhost(size,scene)
{
    //Get a cylinder mesh
    const geometry = new THREE.CylinderGeometry(size/2, size/2, size/2, 32);
  
    //Get a yellow solid material
    const material = new THREE.MeshPhongMaterial({color: 0xFF00FF, side: THREE.DoubleSide,});
  
    //Make a yellow cylinder
    const cylinder = new THREE.Mesh(geometry, material);
  
    //Rotate and place at the right height
    cylinder.position.z=size/4;
    cylinder.rotation.x=Math.PI/2;
  
    //Add to scene
    scene.add(cylinder);
    return cylinder;
}

//CONTROLS

//This makes program react to keypresses
function setupControls()
{
    //This array will collect all the keys pressed by user.
    //The value of a key is false if it is not pressed currently
    //and true if it is pressed currently
    var state = 
    {
        keys: {},
    };

    //This function will be called when a key is pressed or released
    //Here we read which key was pressed or released and act accordingly
    var setDir = function () 
    {
			
        if(state.keys.w || state.keys.ArrowUp)
        {
          pacman.queueDirection("up");
        }
        if(state.keys.s || state.keys.ArrowDown)
        {
          pacman.queueDirection("down");
        }
        if(state.keys.a || state.keys.ArrowLeft)
        {
          pacman.queueDirection("left");
        }
        if(state.keys.d || state.keys.ArrowRight)
        {
          pacman.queueDirection("right");
        }
        if(state.keys.t)
        {
          const dirs=["up","down","right","left"];
          for(var i=0;i<4;i++)
          {
            var dir=dirs[i];
            console.log(dir+": "+pacman.canMove(dir))
          }
        }
    };

    //This function function handles key presses
    //e = keypressed event
    var keyHandler = function (e)
    {
        //Toggle a boolean for the pressed key
        state.keys[e.key] = e.type === 'keyup' ? false : true;
      
        //React to pressed key
        setDir();
      
        //Log key press in console (for debugging)
        console.log("Keypress: "+e.key);
    };

    //Have 'keyHandler' be called when key is pressed down
    //or when key is let go
    window.addEventListener('keydown', keyHandler);
    window.addEventListener('keyup', keyHandler);   
}

//MENUS
function showMenus()
{
    var SIZE=1000;
  
    //Show the menus
    let canvas=document.getElementById("myCanvas");
    let ctx=canvas.getContext("2d");
    canvas.width=SIZE;
	  canvas.height=SIZE; 
  
    //To show the start menu or the lost menu
    if(!lost)
		{
      document.getElementById("title").innerHTML="3D PAC-MAN";
      document.getElementById("btnPlay").innerHTML="Play";

      ctx.beginPath();
	    ctx.fillStyle="yellow";
      ctx.lineWidth=10;
	    ctx.arc(500, 400, 150, 0, Math.PI * 2);	
	    ctx.stroke();
	    ctx.fill();
    } 
		else 
		{
      document.getElementById("title").innerHTML="Lost !";
      document.getElementById("btnPlay").innerHTML="Replay";
      document.getElementById("score").innerHTML="Your score : " + score ;      
    }
}

var btnPlay = document.getElementById('btnPlay');
btnPlay.addEventListener('click',startGame);
function startGame() 
{
	let menu=document.getElementById("menuContainer");
  menu.style.display='none';
	initGame();
}

//Call main() when index.html is loaded
main();
