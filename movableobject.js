//A model can be tied to this class to make it move
//nicely in a grid. This class sends events
//whenever something interesting happens.
export class MovingObject
{
  //Constructor
  constructor(model,grid,pos_x,pos_y,speed)
  {
    this.grid=grid
    this.model=model;
    this.dir="none";
    this.dirQueue="none";
    this.pos_x=pos_x;
    this.pos_y=pos_y;
    this.offset_x=0;
    this.offset_y=0;
    this.speed=speed;
    this.position=model.position;
    var pos=this.grid.getTilePosition(pos_x,pos_y);
    this.model.position.x=pos[0];
    this.model.position.y=pos[1];
    this.callbacks=[]
  }

  //Callbacks are functions that are called whenever
  //this objects posts an event. This function
  //is used to add a callback. So far the events are:
  //stopped_moving - called when object hits a wall and must stop
  //new_tile - called when object has moved to a new tile (and not in between tiles)
  registerCallback(callback)
  {
    this.callbacks.push(callback);
  }

  //Checks if  object can move in direction
  canMove(dir)
  {
    var move=false;
    if(dir=="up")
    {
      if(this.offset_y!=0 || (this.offset_y==0 && this.grid.canMove(this.pos_x,this.pos_y,dir))){
        move=true;
      }
    }
    if(dir=="down")
    {
      if(this.offset_y!=0 || (this.offset_y==0 && this.grid.canMove(this.pos_x,this.pos_y,dir))){
        move=true;
      }
    }
    if(dir=="right")
    {
      if(this.offset_x!=0 || (this.offset_x==0 && this.grid.canMove(this.pos_x,this.pos_y,dir))){
        move=true;
      }
    }
    if(dir=="left")
    {
      if(this.offset_x!=0 || (this.offset_x==0 && this.grid.canMove(this.pos_x,this.pos_y,dir))){
        move=true;
      }
    }
    return move;
  }

  //Moves object in direction
  move(dir)
  {
    var temp_x=this.offset_x;
    var temp_y=this.offset_y;
    if(dir=="up")
    {
      this.offset_y+=this.speed;
    }
    if(dir=="down")
    {
      this.offset_y-=this.speed;
    }
    if(dir=="right")
    {
      this.offset_x+=this.speed;
    }
    if(dir=="left")
    {
      this.offset_x-=this.speed;
    }

    if(this.offset_y>=1){
      this.offset_y=0;
      this.pos_y+=1;
    }
    if(this.offset_y<=-1){
      this.offset_y=0;
      this.pos_y-=1;
    }
    if(temp_y!=0 && Math.sign(this.offset_y)!=Math.sign(temp_y)){
      this.offset_y=0;
    }
    if(this.offset_x>=1){
      this.offset_x=0;
      this.pos_x+=1;
    }
    if(this.offset_x<=-1){
      this.offset_x=0;
      this.pos_x-=1;
    }
    if(temp_x!=0 && Math.sign(this.offset_x)!=Math.sign(temp_x)){
      this.offset_x=0;
    }
  }

  //Posts an event to all callbacks
  postEvent(event)
  {
    for(var i=0; i<this.callbacks.length; i++)
    {
      this.callbacks[i](this,event);
    }
  }

  //Queue a direction to move in
  queueDirection(direction)
  {
    this.dirQueue = direction;
  }

  //Updates the position and speed of object
  update()
  {
    var temp_dir=this.dir;
    var temp_x=this.pos_x;
    var temp_y=this.pos_y;
    var temp_offset_x=this.offset_x;
    var temp_offset_y=this.offset_y;
    
    //Check if can turn in queued direction
    if(this.dirQueue!=this.dir)
    {
      if(this.dirQueue=="right" || this.dirQueue=="left")
      {
        if(this.offset_y==0 && (this.grid.canMove(this.pos_x,this.pos_y,this.dirQueue) || this.offset_x!=0))
        {
          this.dir=this.dirQueue;
        }
      }
      if(this.dirQueue=="up" || this.dirQueue=="down")
      {
        if(this.offset_x==0 && (this.grid.canMove(this.pos_x,this.pos_y,this.dirQueue) || this.offset_y!=0))
        {
          this.dir=this.dirQueue;
        }
      }
      if(this.offset_x==0 && this.offset_y==0 && this.dirQueue=="none")
      {
        this.dir="none";
      }
    }
    if(this.canMove(this.dir))
    {
      this.move(this.dir);
    }
    else
    {
      this.dir="none";
    }


    //Check if movement stopped
    if(temp_dir!=this.dir && this.dir=="none")
    {
      var event={type:"stopped_moving", prev_x:temp_x, prev_x:temp_y, prev_dir:temp_dir}
      this.postEvent(event);
    }
    else if(temp_x!=this.pos_x || temp_y!=this.pos_y) //Check if new tile
    {
      var event={type:"new_tile", prev_x:temp_x, prev_x:temp_y, prev_dir: temp_dir}
      this.postEvent(event);
    }
    //Get the real world position of the object
    //and move it there
    var pos=this.grid.getTilePosition(this.pos_x+this.offset_x,this.pos_y+this.offset_y);
    this.position.x=pos[0];
    this.position.y=pos[1];
    this.model.position.x=this.position.x
    this.model.position.y=this.position.y
  }
}