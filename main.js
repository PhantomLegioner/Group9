import {Grid} from './grid.js';
import {MovingObject} from './movableobject.js';

//GLOBAL VARIABLES

	//For the menus and game logic
  var state="menu";
  var typing=false;
  var score=0;
  var timeStart=0;
  var timeCurr=0;
  var timeElapsed=0;
  const message = document.getElementById("loading");
  const menu = document.getElementById("menuContainer");
  const userNotifications = document.getElementById("userNotification");

  //Sounds and background music
  var AUDIO_CONTEXT;
  var audioEat = new Audio('https://lasonotheque.org/UPLOAD/mp3/0945.mp3');
  var audioClash = new Audio('https://lasonotheque.org/UPLOAD/mp3/2284.mp3');
  var audioWon = document.createElement("audio");
  audioWon.src = "sounds/Won.mp3";
  var backgroundMusic = document.getElementById("backgroundMusic");

  //player can stop the sounds or the music if he wants
  var sound = true; 
  var music = false;

  //Game objects
  var pacman=null;
  var movingObjects=[];
  var ghosts=[]
  var ghostAI=null;
  var allCollectables=[];
  
  //Maze is stored as a Grid object from grid.js
  var grid=null;

  //Three.js variables
  var renderer = null;
  var loader = null;
  var bgTextures=[];
  var floorTexture=null;
  var wallTexture=null;
  var scene = null;
	var camera = null;
  var level = null;

  //Database variables
  var levelName = null;
  var username = null;
  var scoreSaved=false;
  let db; //database variable
  const btnSave = document.getElementById("btnSave");
  btnSave.disabled = false;
  const listContainer = document.getElementById("displayContainer");
  listContainer.display = "";
  const list = document.getElementById("displayDataList");

//GLOBAL VARIABLES END

//GHOST AI CLASSES

//Default "dumb" GhostAI
class GhostAI
{
  //ghostCallback gets called when ghost moves to a new tile
  //or when it stops moving. This default implementation
  //moves the ghost in a random direction
  ghostCallback(obj, event)
  {
    const dirs=["up","down","right","left"];
    const rand=Math.floor(Math.random() * dirs.length);
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
}

//TargetAI targets a tile and moves along the shortest
//path to it
class TargetAI extends GhostAI
{

  //Which tile to target
  targetTile()
  {
    return [pacman.pos_x, pacman.pos_y];
  }

  ghostCallback(obj, event)
  {
    if((event==null && obj.dir=="none") || (event!=null))
    {
      
      var targetTile=this.targetTile(obj)
      var targetTileIndex=grid.encodeTile(targetTile[0],targetTile[1]);
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
      }
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
}

//AmbusAI targets a tile that is 4 tiles from
//pacman in the direction pacman is moving
//unless ghost is close enough to pacman
class AmbushAI extends TargetAI
{
  targetTile(obj)
  {
    var target_x=pacman.pos_x;
    var target_y=pacman.pos_y;
    var dist=Math.abs(target_x-obj.pos_x)+Math.abs(target_y-obj.pos_y)
    if(dist>=2)
    {
      var dir=pacman.dir;
      if(dir=="up")
      {
        target_y+=4;
      }
      if(dir=="down")
      {
        target_y-=4;
      }
      if(dir=="left")
      {
        target_x-=4;
      }
      if(dir=="right")
      {
        target_x+=4;
      }
    }
    target_x=Math.max(0, Math.min(target_x, grid.width-1));
    target_y=Math.max(0, Math.min(target_y, grid.height-1));
    return [target_x, target_y];
  }
}

//GHOST AI CLASSES END

//This gets called when index.html is loaded
//Sets up renderer, loads images/textures,
//sets up menus and some menu controls
function main()
{
  //Setup Three.js renderer
  renderer = new THREE.WebGLRenderer();
  renderer.setSize( window.innerWidth, window.innerHeight);
  var threejsContainer=document.getElementById("threejsContainer");
  threejsContainer.appendChild(renderer.domElement);

  //Update renderer(and camera) on resize
	document.body.onresize=updateRenderer;

  //Load backgrounds and textures
  loader = new THREE.TextureLoader();

  //Backgrounds
  bgTextures.push(loader.load('images/Volcano_eruption.jpg'));
  bgTextures.push(loader.load('images/Ice.jpg'));
  bgTextures.push(loader.load('images/Space.jpg'));

  //Texture for maze floor
  floorTexture=loader.load('images/Tile.jpg');
  floorTexture.wrapS = THREE.RepeatWrapping; 
  floorTexture.wrapT = THREE.RepeatWrapping;
  floorTexture.repeat.set(10, 10);

  //Texture for maze walls
  wallTexture=loader.load('images/Wall.jpg');

  //Bind r-key to play/restart button
  document.body.addEventListener("keyup", function(event) 
  {
    if (event.key == 'r' && state!="play" && !typing) {
      event.preventDefault();
      document.getElementById("btnPlay").click();
    }
  });

  //Bind 1-key to music button
  document.body.addEventListener("keyup", function(event) 
  {
    if (event.key == '1' && !typing) {
      event.preventDefault();
      document.getElementById("backgroundMusicIcon").click();
    }
  });

  //Bind 2-key to sound effect button
  document.body.addEventListener("keyup", function(event) 
  {
    if (event.key == '2' && !typing) {
      event.preventDefault();
      document.getElementById("soundEffectIcon").click();
    }
  });

  //Show menu
	showMenus();
}

//If window is rescaled, this event corrects the renderer and camera
function updateRenderer()
{
  //Resize renderer
	renderer.setSize( window.innerWidth, window.innerHeight);

  //Resize camera if it exists
	if(camera!=null)
	{
		camera.aspect=window.innerWidth/ window.innerHeight;
		camera.updateProjectionMatrix();
	}
}

//Starts the game assuming the previous game is cleared
//Initializes game-loop. Game-logic is in the internal method
//called animate()
function initGame()
{    
    scoreSaved=false;

    //Create scene and camera
    scene = new THREE.Scene();
    scene.background = bgTextures[level];
    camera = new THREE.PerspectiveCamera( 100, window.innerWidth/ window.innerHeight, 0.1, 1000);

    //Place camera
    camera.position.z = 5;
    camera.rotation.x += 0.2;

    //Create the maze with Grid-class from grid.js
    grid=new Grid(10,10,10,floorTexture,wallTexture);
    scene.add(grid.plane)
    for(var i=0;i<grid.walls.length;i++)
    {
        scene.add(grid.walls[i]);
    }
  
    //Set up lighting for scene
    {
        const color = 0xFFFFFF;
        const intensity = 1;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(-1, -1, 1);
        light.target.position.set(1, 1, -2);
        scene.add(light);
        scene.add(light.target);
    }

    //Create pacman (see the function createPacman() below)
    var pacmanModel=createPacman(grid.cubeSize/2,scene);
    pacman=new MovingObject(pacmanModel,grid,0,0,0.05);
    movingObjects.push(pacman);

    //Create ghost AIs
    ghostAI=new TargetAI();
    var ambushAI=new AmbushAI();

    //Create ghost 1
    var ghostModel=createGhost(grid.cubeSize/2,scene,0xFF00FF);
    var ghost=new MovingObject(ghostModel,grid,9,8,0.04);
    ghost.registerCallback((obj,event)=>ghostAI.ghostCallback(obj,event));
    ghostAI.ghostCallback(ghost,null);
    movingObjects.push(ghost);
    ghosts.push(ghost);

    //Create ghost 2
    ghostModel=createGhost(grid.cubeSize/2,scene,0x00FF00);
    ghost=new MovingObject(ghostModel,grid,9,9,0.04);
    ghost.registerCallback((obj,event)=>ambushAI.ghostCallback(obj,event));
    ambushAI.ghostCallback(ghost,null);
    movingObjects.push(ghost);
    ghosts.push(ghost);
	
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

    //Reset game state and score
    state="play";
    score=0;

    //Get starting time
    timeStart=new Date();

    //Update scene and render it repeatedly
    const animate = function () 
    {
      //Get current time and calculate elapsed time
      timeCurr=new Date();
      timeElapsed=Math.trunc((timeCurr-timeStart)/1000);

      //Update score
      uploadCurrentScore(score, timeElapsed);

      //If state is still "play", then update scene
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
  
        //Handle ghosts
        for(var i = 0; i<ghosts.length; i++)
        {
          //If ghost doesn't have a movement order
          //then make it move toward pacman
          var ghost=ghosts[i];
          if(ghost.dir=="none")
          {
              ghostAI.ghostCallback(ghost,null);
          }

          //Check if ghost touches pacman
          //and end game and show "you lost" screen
          //if it does
          var dist=Math.sqrt(Math.pow(ghost.model.position.x-pacman.model.position.x,2)+
            Math.pow(ghost.model.position.y-pacman.model.position.y,2));
          if(dist<grid.cubeSize/2)
          {
            if(sound)
            {
              playSound(audioClash);
            }
            state="lost";
            showMenus();
          }
        }
        
        //Eat collectables and see if all are collected
        eatCollectables(pacman.pos_x, pacman.pos_y, scene);
        if(score == 100)
        {
          if(sound)
          {
            playSound(audioWon);
          }
          state="won";
          showMenus();
        }

        //Render scene
        renderer.render(scene, camera);
      }
    };
    
    //Call animate
    animate();	
}

//AUDIO

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

//Stops music
function stopMusic()
{
  backgroundMusic.pause();
}

//AUDIO END

//GAME OBJECT MANAGEMENT

//Clear game in order to restart it
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
//Clears a Three.js scene of geometries and materials
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

//GAME OBJECT MANAGEMENT END

//COLLECTABLES

//Makes pacman eat collectables that it touches
function eatCollectables(posX, posY, scene)
{
  //Find all collectables that touch pacman
  //Uses a collision model for performance
  var index = allCollectables.findIndex(x => x.positionX === posX && x.positionY === posY);
  var indexChildren = scene.children.findIndex(x => x.id === allCollectables[index].childrenNumber);

  //Handle eaten collectables
  if(!allCollectables[index].wasEaten)
  {
      allCollectables[index].wasEaten = true;

      //Increment score
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

//COLLECTABLES END

//MODELS

//This creates the model for pacman
function createPacman(size,scene)
{
    //Get a cylinder mesh
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
function createGhost(size,scene,color)
{
    //Get a cylinder mesh
    const geometry = new THREE.CylinderGeometry(size/2, size/2, size/2, 32);
  
    //Get a yellow solid material
    const material = new THREE.MeshPhongMaterial({color: color, side: THREE.DoubleSide,});
  
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

//MODELS END

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
        if(state.keys.w)
        {
          pacman.queueDirection("up");
        }
        if(state.keys.s)
        {
          pacman.queueDirection("down");
        }
        if(state.keys.a)
        {
          pacman.queueDirection("left");
        }
        if(state.keys.d)
        {
          pacman.queueDirection("right");
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
    };

    //Have 'keyHandler' be called when key is pressed down
    //or when key is let go
    window.addEventListener('keydown', keyHandler);
    window.addEventListener('keyup', keyHandler);   
}

//To show the current score in the left window
function uploadCurrentScore(currentScore, currentElapsed)
{
  document.getElementById("currentScore").innerHTML="Score : " + currentScore+", Time: "+currentElapsed;
}

//CONTROLS END

//MENUS
function showMenus()
{
    var SIZE=1000;
  
    //Show the menus
    let canvas=document.getElementById("myCanvas");
    let ctx=canvas.getContext("2d");
    canvas.width=SIZE;
	  canvas.height=SIZE; 

    //let menu=document.getElementById("menuContainer");
    menu.style.display='';
  
    //To show the start menu or the lost menu
    if(state=="menu")
		{
      btnSave.disabled = true;
      document.getElementById("LevelHeader");
      selectLevel();
      document.getElementById("title").innerHTML="3D PAC-MAN";
      document.getElementById("btnPlay").innerHTML="Play(R)";
      document.getElementById("btnDisplay").innerHTML="High scores";
      document.getElementById("btnSave").innerHTML="Save data";
      
      ctx.beginPath();
	    ctx.fillStyle="yellow";
      ctx.lineWidth=10;
	    ctx.arc(500, 400, 150, 0, Math.PI * 2);	
	    ctx.stroke();
	    ctx.fill();
    } 
		else if(state=="lost")
		{
      document.getElementById("LevelHeader");
      selectLevel();
      document.getElementById("title").innerHTML="You lost!";
      document.getElementById("btnPlay").innerHTML="Replay(R)";
      btnSave.disabled = false;
      document.getElementById("playerName").innerHTML="Your username : " + username ;
      document.getElementById("levelType").innerHTML="Your level : " + levelName ;
      document.getElementById("score").innerHTML="Your score : " + score + " points"; 
      document.getElementById("seconds").innerHTML="Your time : " +  timeElapsed + " seconds";      
    }
    else if(state=="won")
		{
      document.getElementById("LevelHeader");
      selectLevel();
      document.getElementById("title").innerHTML="You won!";
      document.getElementById("btnPlay").innerHTML="Replay(R)";
      btnSave.disabled = false;
      document.getElementById("playerName").innerHTML="Your username : " + username ;
      document.getElementById("levelType").innerHTML="Your level : " + levelName ;
      document.getElementById("score").innerHTML="Your score : " + score + " points"; 
      document.getElementById("seconds").innerHTML="Your time : " +  timeElapsed + " seconds";      
    }
}

var levelChoice = document.getElementById("level");
levelChoice.addEventListener('change', selectLevel)

function selectLevel() 
{
  var levelText = levelChoice.options[levelChoice.selectedIndex].text;
  if (levelText == "Fire")
    {
      level = 0;
      levelName = "Fire";
      console.log("Fire Level selected!")
    
    }
  if(levelText == "Ice")
    {
      level = 1;
      levelName = "Ice";
      console.log("Ice Level selected!")
    }

  if(levelText == "Space")
    {
      level = 2;
      levelName = "Space";
      console.log("Space Level selected!")
    }
  console.log(level, " returned!");
  return level, levelName;

}

//Display message for user
function displayMessage(msg)
{
  console.log(msg)
  message.innerHTML=msg;
  message.style.opacity=1;
  setTimeout(function(){
    message.style.opacity=0;
  }, 1000);
}

//selecting user's username
var usernameChoice = document.getElementById("inputUsername");
usernameChoice.addEventListener('change', selectUsername);

function selectUsername() 
{
  var str=usernameChoice.value;
  if(str.length>0)
  {
    username = usernameChoice.value;
    displayMessage("New username: "+username);
    userNotifications.innerHTML = "New username selected!";
  }
  else displayMessage("Invalid username");

  //Unfocus text field
  typing=false;
  usernameChoice.blur();
}

//Prevent key events when typing in text field
usernameChoice.addEventListener('focusin',function(){
  typing=true;
});

//Prevent key events when typing in text field
usernameChoice.addEventListener('focusout',function(){
  typing=false;
});

var soundEffectIcon = document.getElementById('soundEffectIcon');
soundEffectIcon.addEventListener('click', controlSounds);
function controlSounds()
{
  if(sound)
  {
    sound = false;
    document.getElementById("soundEffectIcon").innerHTML="Play effects(2)";
  } 
  else 
  {
    sound = true;
    document.getElementById("soundEffectIcon").innerHTML="Stop effects(2)";
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
    document.getElementById("backgroundMusicIcon").innerHTML="Play music(1)";
  } 
  else 
  {
    music = true;
    playSound(backgroundMusic);
    document.getElementById("backgroundMusicIcon").innerHTML="Stop music(1)";
  }
}

//Setup play/replay button
var btnPlay = document.getElementById('btnPlay');
btnPlay.addEventListener('click',startGame);
function startGame() 
{
  message.innerHTML="Loading..."
  message.style.opacity=1;

  setTimeout(function(){ 
    destroyGame();
    initGame();
    menu.style.display='none';
    message.style.opacity=0;
  }, 10);

  
}

//MENUS END

listContainer.addEventListener('click', hideScores);

//hiding high scores
function hideScores() 
{
  listContainer.style.display='none';
}

//DATABASE

//Database within the browser
//Done with the help of Mozilla tutorial from: https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Client-side_web_APIs/Client-side_storage

window.onload = function() 
{
//Open database, version 1
let request = window.indexedDB.open('scores_db', 1);

// if an error happens when trying to open connection to database
request.onerror = function() {
  console.log('Database failed to open');
};

// Successful connection
request.onsuccess = function() {
  console.log('Database was opened succesfully');
  // Store the opened database object in the db variable.
  db = request.result;
  // Showing information from the database
  //displayScores();
};

//Setup database initially or upgrade with a bigger version number
request.onupgradeneeded = function(e) {
  //get the reference to the opened database
  let db = e.target.result;
  //Create table in the database
  let highScores = db.createObjectStore('scores_os', { keyPath: 'id', autoIncrement: true});
  //What columns we will have in the table
  highScores.createIndex('username', 'username', {unique: false});
  highScores.createIndex('level', 'level', {unique: false});
  highScores.createIndex('score', 'score', {unique: false});
  highScores.createIndex('time', 'time', {unique: false});

  console.log('Database setup completed');

}

//Function for adding, saving to the database
btnSave.addEventListener('click',saveStats);
function saveStats(e) 
{
  if(scoreSaved)
  {
    displayMessage("Game already saved!");
    return;
  }

  if(username==null || username.length<=0)
  {
    displayMessage("Invalid username!");
    return;
  }
  scoreSaved=true;
  btnSave.disabled = true;

  //Destroy previous game and save information to database
  e.preventDefault();
  //Store username, level type, score and time of completion into an object
  let newItem = {username: username, level: levelName, score: score, time: timeElapsed };
  //Transaction to the database for adding
  let transaction = db.transaction(['scores_os'], 'readwrite');
  //Call object score that's already added to the database
  let highScores = transaction.objectStore('scores_os');
  //request to add newItem
  let request = highScores.add(newItem);
  request.onsuccess = function () {
    console.log('Success');
  } 
  //transaction was completed
  transaction.oncomplete = function () 
  {
    userNotifications.innerHTML = "Your data was saved successfully!";
    displayMessage("Score saved!");
  };
  transaction.onerror = function() 
  {
    alert("An error occurred! Data wasn't saved! properly");
  };

}


var btnDisplay = document.getElementById('btnDisplay');
btnDisplay.addEventListener('click',displayScores);

//Displaying scores from the database
function displayScores() 
{
  if(listContainer.style.display=="")
  {
    listContainer.style.display="none";
  }
  else
  {
    listContainer.style.display="";
    while (list.firstChild) 
    {
      list.removeChild(list.firstChild);
    }
    var entries=[];
    let objectStore = db.transaction('scores_os').objectStore('scores_os');
    objectStore.openCursor().onsuccess = function(e) 
    {
      let cursor = e.target.result;
      
      if (cursor) 
      {
        var entry={
          username : cursor.value.username,
          level : cursor.value.level,
          score : cursor.value.score,
          time : cursor.value.time,
        };

        entries.push(entry);

        //next
        cursor.continue();
      }
      else 
      {
        //Sort entries w.r.t score and time
        entries.sort(function(a,b){
          var diff=b.score-a.score;
          if(diff!=0) return b.score-a.score;
          else return a.time-b.time;
        });

        //Display entries
        for(var i=0; i<entries.length; i++)
        {
          var entry=entries[i];

          const listItem = document.createElement('li');
          const name = document.createElement('username');
          const level = document.createElement('leveltype');
          const score = document.createElement('score');
          const time = document.createElement('time');
  
          listItem.appendChild(name);
          listItem.appendChild(level);
          listItem.appendChild(score);
          listItem.appendChild(time);
  
          list.appendChild(listItem);
  
          //put data in
          name.textContent = entry.username + "\t | \t";
          name.style.fontSize="2vmin";
          level.textContent = entry.level + "\t | \t";
          level.style.fontSize="2vmin";
          score.textContent = entry.score + "p\t | \t";
          score.style.fontSize="2vmin";
          time.textContent = entry.time +"s";
          time.style.fontSize="2vmin";
        }
        userNotifications.innerHTML = "Your data was displayed successfully!";
      }
    }   
  }
};

//Delete data
var btndel = document.getElementById('btnDelete');
btndel.addEventListener('click',deleteData)
function deleteData(){
  var choice = confirm("Note! Clicking OK will delete all data!");
  if (choice == true) {

  let transaction = db.transaction(['scores_os'], 'readwrite');
  // report on the success of the transaction completing, when everything is done
  transaction.oncomplete = function() {
    console.log("Transaction completed");
  };

  transaction.onerror = function() {
    alert("Transaction not opened due to error: " + transaction.error);
  };

  var objectstore = transaction.objectStore("scores_os");

  var objectstoreClearRequest = objectstore.clear();

  objectstoreClearRequest.onsuccess = function() {
    //notify user
    userNotifications.innerHTML = "Your data was deleted successfully!";
    console.log("Saving successful!");
  }
  objectstoreClearRequest.onerror = function () {
    alert("An error occurred! Data wasn't deleted properly!");
  }
}

else {
  console.log("Clearing database cancelled");
  //notify user
  userNotifications.innerHTML = "Clearing database cancelled";
  //document.getElementById("loading").innerHTML="Cancelled";
}

}


};

//DATABASE END

//Call main() when index.html is loaded
main();
