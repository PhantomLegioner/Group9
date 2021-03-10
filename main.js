import {Grid} from './grid.js';
import {MovingObject} from './movableobject.js';

//GLOBAL VARIABLES

	//For the menus and game logic
  var state="menu";
  var score=0;

  //Sounds and background music
  var AUDIO_CONTEXT;
  var audioEat = new Audio('https://lasonotheque.org/UPLOAD/mp3/0945.mp3');
  var audioClash = new Audio('https://lasonotheque.org/UPLOAD/mp3/2284.mp3');
  var audioWon = document.createElement("audio");
  audioWon.src = "sounds/Won.mp3";
  var backgroundMusic = document.getElementById("backgroundMusic");

  //player can stop the sounds or the music if he wants
  var sound = true; 
  var music = true;

  //Game objects
  var pacman=null;
  var movingObjects=[];
  var ghosts=[]
  var allCollectables=[];
  
  //Maze is stored as a Grid object from grid.js
  var grid=null;

  //Three.js variables
  var renderer = null;
  var loader = null;
  var bgTextures=[];
  var scene = null;
	var camera = null;

  //This function defines how the ghost "AI" works
  const ghostCallback=function(obj, event)
  {
    if((event==null && obj.dir=="none") || (event!=null))
    {
      var targetTileIndex=grid.encodeTile(pacman.pos_x,pacman.pos_y);
      var currentTileIndex=grid.encodeTile(obj.pos_x,obj.pos_y);
      var path=grid.djikstraAlgorithm(obj.pos_x,obj.pos_y);
      var w=pacman.pos_x;
      var h=pacman.pos_y;
      while(path[targetTileIndex]!=null)
      {
        var temp=grid.decodeTile(path[targetTileIndex]);
        targetTileIndex=path[targetTileIndex];
        if(currentTileIndex==targetTileIndex)
        {
          break;
        }
        w=temp[0];
        h=temp[1];
        console.log(w+", "+h);
      }
      console.log("Current: "+obj.pos_x+", "+obj.pos_y);
      console.log("Next: "+w+", "+h);
      if(h>obj.pos_y)
      {
        obj.queueDirection("up");
      }
      else if(h<obj.pos_y)
      {
        obj.queueDirection("down");
      }
      else if(w>obj.pos_x)
      {
        obj.queueDirection("right");
      }
      else if(w<obj.pos_x)
      {
        obj.queueDirection("left");
      }
    }
  }


//This gets called when index.html is loaded
//First shows menu
function main()
{
  renderer = new THREE.WebGLRenderer();
  renderer.setSize( window.innerWidth, window.innerHeight);

  loader = new THREE.TextureLoader();

  //Volcano Background
  bgTextures.push(loader.load('images/Volcano_eruption.jpg'));
  //Ice Background
  bgTextures.push(loader.load('images/Ice.jpg'));
  //Space Background
  bgTextures.push(loader.load('images/Space.jpg'));

  var threejsContainer=document.getElementById("threejsContainer");
  threejsContainer.appendChild(renderer.domElement);
	document.body.onresize=updateRenderer;
	showMenus();
}

//If window is rescaled, this event corrects the renderer and camera
function updateRenderer()
{
	renderer.setSize( window.innerWidth, window.innerHeight);
	if(camera!=null)
	{
		camera.aspect=window.innerWidth/ window.innerHeight;
		camera.updateProjectionMatrix();
	}
	console.log("test");
}

//Starts the game
function initGame()
{
    if(music)
    {
      playSound(backgroundMusic);
    }
    
    ///INITIALIZING THREE.JS SCENE AND CAMERA
    //Create scene and camera
    scene = new THREE.Scene();
    scene.background = bgTextures[1];
    camera = new THREE.PerspectiveCamera( 100, window.innerWidth/ window.innerHeight, 0.1, 1000 );
    //65, window.innerWidth/ window.innerHeight, 0.1, 1000, Original

    ///CREATING OBJECTS TO BE ADDED TO THE SCENE
  
    //Create the maze with Grid-class from grid.js
    //You can now apply a texture on the grid floor
    //for now the texture is null
    grid=new Grid(10,10,0,0,10,null)
    scene.add(grid.plane)
    for(var i=0;i<grid.walls.length;i++)
    {
        scene.add(grid.walls[i]);
    }
  
    //Set up lighting
    {
        const color = 0xFFFFFF;
        const intensity = 1;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(0, 0, 1);
        light.target.position.set(0, 0, -1);
        scene.add(light);
        scene.add(light.target);
    }

    //Create pacman (see the function createPacman() below)
    var pacmanModel=createPacman(grid.cubeSize/2,scene);
    pacman=new MovingObject(pacmanModel,grid,0,0,0.05);

    //Add pacman to collection of moving objects
    movingObjects.push(pacman);

    //Create 4 ghosts
    //Perhaps eventually different ghost have different AI

    //Create ghost 
    var ghostModel=createGhost(grid.cubeSize/2,scene);
    var ghost=new MovingObject(ghostModel,grid,5,5,0.05);
    ghost.registerCallback(ghostCallback);
    ghostCallback(ghost,null);
    movingObjects.push(ghost);
    ghosts.push(ghost);

    /*
    //Create ghost 2
    ghostModel=createGhost(grid.cubeSize/2,scene);
    ghost=new MovingObject(ghostModel,grid,9,5,0.05);
    ghost.registerCallback(ghostCallback);
    ghostCallback(ghost,null);
    movingObjects.push(ghost);
    ghosts.push(ghost);

    //Create ghost 3
    ghostModel=createGhost(grid.cubeSize/2,scene);
    ghost=new MovingObject(ghostModel,grid,5,9,0.05);
    ghost.registerCallback(ghostCallback);
    ghostCallback(ghost,null);
    movingObjects.push(ghost);
    ghosts.push(ghost);

    //Create ghost 4
    ghostModel=createGhost(grid.cubeSize/2,scene);
    ghost=new MovingObject(ghostModel,grid,9,9,0.05);
    ghost.registerCallback(ghostCallback);
    ghostCallback(ghost,null);
    movingObjects.push(ghost);
    ghosts.push(ghost);
    */
  
    //Place camera in front of box
    camera.position.z = 5;
		camera.rotation.x += 0.2;
	
    //Create collectables
    for(var i = 0; i<grid.height; i++)
    {
      for (var j = 0; j<grid.width; j++)
      {
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
    state="play";
    score=0;

    //Render scene repeatedly
    const animate = function () 
    {
      uploadCurrentScore(score);
      if(state=="play")
      {
        requestAnimationFrame(animate);

        //Update moving objects
        for(var i = 0; i<movingObjects.length; i++)
        {
          movingObjects[i].update();
        }

        //Move camera to pacman
        camera.position.x=pacman.position.x;
        camera.position.y=pacman.position.y-1;
  
        //See if a ghost touches pacman
        for(var i = 0; i<ghosts.length; i++)
        {
          var ghost=ghosts[i];
          if(ghost.dir=="none")
          {
              ghostCallback(ghost,null);
          }
          var dist=Math.sqrt(Math.pow(ghost.model.position.x-pacman.model.position.x,2)+
            Math.pow(ghost.model.position.y-pacman.model.position.y,2));
          if(dist<grid.cubeSize/2)
          {
            if(sound)
            {
              playSound(audioClash);
            }
            stopMusic();
            state="lost";
            showMenus();
          }
        }
        
        //Eat collectables and see if all are collected
        eatCollectables(pacman.pos_x, pacman.pos_y, scene);
        if(score == 100)
        {
          stopMusic();
          playSound(audioWon);
          state="won";
          showMenus();
        }

        //Render scene
        renderer.render( scene, camera );
      }
    };
    
    //Call animate
    animate();	
}

//Clones sound from an Audio object
//and plays the sound
function playSound(sound)
{
  if(sound == backgroundMusic)
  {
    backgroundMusic.play();
  } 
  else 
  {
    var newSound=sound.cloneNode();
    newSound.play()
  }
}

function stopMusic()
{
  backgroundMusic.pause();
}

//Clear game to restart
function destroyGame()
{
  while(movingObjects.length > 0) {
    movingObjects.pop();
  }
  while(allCollectables.length > 0) {
    allCollectables.pop();
  }
  while(ghosts.length > 0) {
    ghosts.pop();
    console.log(ghosts.length)
  }
	camera=null;
  pacman=null;
  grid=null;
  if(scene!=null)
  {
    clearThree(scene);
    scene=null;
  }
}


//FROM: https://stackoverflow.com/questions/30359830/how-do-i-clear-three-js-scene
//Clears a scene of geometries and materials
function clearThree(obj)
{
  while(obj.children.length > 0)
  { 
    clearThree(obj.children[0]);
    obj.remove(obj.children[0]);
  }
  if(obj.geometry) obj.geometry.dispose()
  if(obj.material)
  { 
    //in case of map, bumpMap, normalMap, envMap ...
    Object.keys(obj.material).forEach(prop => {
      if(!obj.material[prop])
        return         
      if(obj.material[prop] !== null && typeof obj.material[prop].dispose === 'function')                                  
        obj.material[prop].dispose()                                                        
    })
    obj.material.dispose()
  }
}   

//Makes pacman eat collectables that it touches
function eatCollectables(posX, posY, scene)
{
  var index = allCollectables.findIndex(x => x.positionX === posX && x.positionY === posY);
  var indexChildren = scene.children.findIndex(x => x.id === allCollectables[index].childrenNumber);
  if(!allCollectables[index].wasEaten)
  {
      allCollectables[index].wasEaten = true;
      score += 1;
      if(sound){
        playSound(audioEat);
      }
      //Delete the collectable
      allCollectables[index].wasEaten = true;
      scene.remove(scene.children[indexChildren]);
  }
}

//Objects to push in allCollectables list and to manage collectables
function Collectable(wasEaten, positionX, positionY, childrenNumber)
{
  this.wasEaten = wasEaten;
  this.positionX = positionX;
  this.positionY = positionY;
  //To know the position in the children list of the scene
  this.childrenNumber = childrenNumber;
}

//MODELS

//This creates the model for pacman
//You can design pacman here
function createPacman(size,scene)
{
    //Get a cylinder mesh
    //const geometry = new THREE.CylinderGeometry(size/2, size/2, size/2, 32);
    const geometry =  new THREE.SphereGeometry(size/2, 32, 32);
  
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

        //THIS IS JUST FOR DEBUGGING
        //YOU CAN ADD WHATEVER INFORMATION YOU WANT TO DISPLAY
        //FOR TESTING
        if(state.keys.t)
        {
          console.log(pacman.model.position.x+", "+pacman.model.position.y);
          console.log("Ghosts: "+ghosts.length);
          console.log(ghosts[0].model.position.x+", "+ghosts[0].model.position.y);
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

//To show the current score in the left window
function uploadCurrentScore(currentScore){
  console.log(currentScore);
  document.getElementById("currentScore").innerHTML="Score : " + currentScore;
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

    let menu=document.getElementById("menuContainer");
    menu.style.display='';
  
    //To show the start menu or the lost menu
    if(state=="menu")
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
		else if(state=="lost")
		{
      document.getElementById("title").innerHTML="Lost !";
      document.getElementById("btnPlay").innerHTML="Replay";
      document.getElementById("score").innerHTML="Your score : " + score ;      
    }
    else if(state=="won")
		{
      document.getElementById("title").innerHTML="Won !";
      document.getElementById("btnPlay").innerHTML="Replay";
      document.getElementById("score").innerHTML="Your score : " + score ;      
    }
}

var soundEffectIcon = document.getElementById('soundEffectIcon');
soundEffectIcon.addEventListener('click', controlSounds);
function controlSounds()
{
  if(sound)
  {
    sound = false;
    document.getElementById("soundEffectIcon").innerHTML="Play sounds effects";
  } 
  else 
  {
    sound = true;
    document.getElementById("soundEffectIcon").innerHTML="Stop sounds effects";
  }
}

var backgroundMusicIcon = document.getElementById('backgroundMusicIcon');
backgroundMusicIcon.addEventListener('click', controlMusic);
function controlMusic()
{
  if(music)
  {
    music = false;
    stopMusic();
    document.getElementById("backgroundMusicIcon").innerHTML="Play background music";
  } 
  else 
  {
    music = true;
    playSound(backgroundMusic);
    document.getElementById("backgroundMusicIcon").innerHTML="Stop background music";
  }
}

//Setup play/replay button
var btnPlay = document.getElementById('btnPlay');
btnPlay.addEventListener('click',startGame);
function startGame() 
{
  //Destroy previous game and initialize new
  destroyGame();
	initGame();
  let menu=document.getElementById("menuContainer");
  menu.style.display='none';
}

//Call main() when index.html is loaded
main();
