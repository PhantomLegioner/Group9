export class MovingObject
{
  constructor(model,grid,pos_x,pos_y,speed)
  {
    this.grid=grid
    this.model=model;
    this.dir="none";
    this.dirQueue="none";
    this.pos_x=0;
    this.pos_y=0;
    this.offset_x=pos_x;
    this.offset_y=pos_y;
    this.speed=speed;
    this.position=model.position;
    var pos=this.grid.getTilePosition(pos_x,pos_y);
    this.model.position.x=pos[0];
    this.model.position.y=pos[1];
  }

  queueDirection(direction)
  {
    this.dirQueue = direction;
  }

  update()
  {
    var temp_x=this.offset_x;
    var temp_y=this.offset_y;
    
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
    }
  
    //Move in current direction if possible
    if(this.dir=="up"){
      if(this.offset_y!=0 || (this.offset_y==0 && this.grid.canMove(this.pos_x,this.pos_y,this.dir))){
        this.offset_y+=this.speed;
      }
      else{
        this.dir="none";
      }
    }
    if(this.dir=="down"){
      if(this.offset_y!=0 || (this.offset_y==0 && this.grid.canMove(this.pos_x,this.pos_y,this.dir))){
        this.offset_y-=this.speed;
      }
      else{
        this.dir="none";
      }
    }
    if(this.dir=="right"){
      if(this.offset_x!=0 || (this.offset_x==0 && this.grid.canMove(this.pos_x,this.pos_y,this.dir))){
        this.offset_x+=this.speed;
      }
      else{
        this.dir="none";
      }
    }
    if(this.dir=="left"){
      if(this.offset_x!=0 || (this.offset_x==0 && this.grid.canMove(this.pos_x,this.pos_y,this.dir))){
        this.offset_x-=this.speed;
      }
      else{
        this.dir="none";
      }
    }
  
    //If we have moved an entire tile
    //then set new position
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

    //Get the real world position of the object
    //and move it there
    var pos=this.grid.getTilePosition(this.pos_x+this.offset_x,this.pos_y+this.offset_y);
    this.position.x=pos[0];
    this.position.y=pos[1];
    this.model.position.x=this.position.x
    this.model.position.y=this.position.y
  }
}