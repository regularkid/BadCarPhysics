var cars = new Array();

function Car(x, y, rotation, keyFwd, keyBack, keyLeft, keyRight)
{
    this.LENGTH = 60.0;
    this.WIDTH = 30.0;
    
    this.MAX_SPEED_PER_SEC = 350.0;
    this.MAX_SPEED_PER_SEC_REVERSE = -this.MAX_SPEED_PER_SEC * 0.5;
    this.ACCELERATION_PER_SEC = 500.0;
    this.DECELERATION_PER_SEC = 150.0;
    this.HIDE_KEYS_SPEED_PER_SEC = this.MAX_SPEED_PER_SEC * 0.35;

    this.BOOST_SPEED_PER_SEC = this.MAX_SPEED_PER_SEC * 2.0;
    this.BOOST_INPUT_DELAY_THRESHOLD_MS = 200;

    this.MAX_STEER = game.math.degToRad(30.0);
    this.MAX_STEER_REVRESE = this.MAX_STEER * 2.0;
    this.STEER_ACCELERATION_PER_SEC = 3.0;
    this.ALLOW_STEERING_SPEED_THRESHOLD = this.MAX_SPEED_PER_SEC * 1.5;

    this.DRIFT_SPEED_FACTOR = 3.0;
    this.DRIFT_HEADING_ROTATION_LERP_PER_SEC = 6.0;

    this.COLLISION_FORCE_SPEED_FACTOR = 0.55;
    this.COLLISION_FORCE_DECELERATION_PER_SEC = 275.0;
    this.COLLISION_SPEED_MULTIPLIER = 0.35;
    this.COLLISION_ROTATION_DECELERATION_PER_SEC = 4.0;
    this.COLLISION_ROTATION_SPEED_FACTOR = 0.5;
    this.MAX_COLLISION_ROTATION = Math.PI * 1.0;
    this.COLLISION_WALL_RESPONSE_MOVE_FACTOR = 50.0;

    // We render 4 wheels, but internally we use a bicycle physics model (2 wheels)
    this.posFrontWheel = new Phaser.Point(0, 0);
    this.posBackWheel = new Phaser.Point(0, 0);
    this.curRotationDir = new Phaser.Point(Math.cos(rotation), Math.sin(rotation));
    this.speed = 0.0;
    this.steer = 0.0;
    this.driftHeading = rotation;
    this.collisionForce = new Phaser.Point(0, 0);
    this.collisionRotation = 0.0;
    this.moveAmount = new Phaser.Point(0, 0);

    this.InitDisplay(x, y, rotation);
    this.InitInput(keyFwd, keyBack, keyLeft, keyRight);
}

Car.prototype.InitDisplay = function(x, y, rotation)
{
    this.group = game.add.group();
    this.group.x = x;
    this.group.y = y;
    this.group.rotation = rotation;
    this.carRenderer = new CarRenderer(this);
}

Car.prototype.InitInput = function(keyFwd, keyBack, keyLeft, keyRight)
{
    this.keyFwd = game.input.keyboard.addKey(keyFwd);
    this.keyBack = game.input.keyboard.addKey(keyBack);
    this.keyLeft = game.input.keyboard.addKey(keyLeft);
    this.keyRight = game.input.keyboard.addKey(keyRight);

    this.keyFwd.onDown.add(this.OnFwdKeyDown, this);
    this.lastFwdKeyDownTime = 0.0;
}

Car.prototype.Update = function()
{
    var dt = game.time.physicsElapsed;
    var posOld = new Phaser.Point(this.group.x, this.group.y);

    this.UpdateInput(dt);
    this.UpdateWheelPositions();
    this.MoveWheels(dt);
    this.UpdatePosition(dt);
    this.ProcessCollisions(dt);

    this.moveAmount.x = this.group.x - posOld.x;
    this.moveAmount.y = this.group.y - posOld.y;
}

Car.prototype.UpdateInput = function(dt)
{
    // Speed
    var desiredSpeed = 0.0;
    var desiredAcc = this.DECELERATION_PER_SEC;
    if (this.keyFwd.isDown || this.keyBack.isDown)
    {
        desiredSpeed = this.keyFwd.isDown ? this.MAX_SPEED_PER_SEC : this.MAX_SPEED_PER_SEC_REVERSE;
        desiredAcc = this.ACCELERATION_PER_SEC;
    }
    this.speed = MoveToward(this.speed, desiredSpeed, desiredAcc * dt);

    // Hide instructions once we're at a high enough speed
    if (Math.abs(this.speed) >= this.HIDE_KEYS_SPEED_PER_SEC)
    {
        this.carRenderer.HideKeys();
    }

    // Steering (don't allow steering during the beginning of a boost)
    if (this.speed <= this.ALLOW_STEERING_SPEED_THRESHOLD)
    {
        var maxSteer = this.speed >= 0.0 ? this.MAX_STEER : this.MAX_STEER_REVRESE;
        var desiredSteer = 0.0;
        if (this.keyLeft.isDown || this.keyRight.isDown)
        {
            desiredSteer = this.keyRight.isDown ? maxSteer : -maxSteer;
        }
        this.steer = MoveToward(this.steer, desiredSteer, this.STEER_ACCELERATION_PER_SEC * dt);
    }
}

Car.prototype.OnFwdKeyDown = function()
{
    // Boost if we press FwdKey twice quickly
    if (game.time.now - this.lastFwdKeyDownTime < this.BOOST_INPUT_DELAY_THRESHOLD_MS)
    {
        this.StartBoost();
    }

    this.lastFwdKeyDownTime = game.time.now
}

Car.prototype.StartBoost = function()
{
    // Forcibly increase speed and reset steering/drift
    this.speed = this.BOOST_SPEED_PER_SEC;
    this.steer = 0.0;
    this.driftHeading = this.group.rotation;
}

Car.prototype.UpdateWheelPositions = function()
{
    var xWheelOffset = this.curRotationDir.x * this.LENGTH * 0.5;
    var yWheelOffset = this.curRotationDir.y * this.LENGTH * 0.5;

    this.posFrontWheel.x = this.group.x + xWheelOffset;
    this.posFrontWheel.y = this.group.y + yWheelOffset;
    this.posBackWheel.x = this.group.x - xWheelOffset;
    this.posBackWheel.y = this.group.y - yWheelOffset;

    // Steer angle is doubled when reversing (can be larger than maxSteer), so always
    // clamp display rotation to maxSteer. This looks better
    var wheelRotation = Math.max(-this.MAX_STEER, Math.min(this.MAX_STEER, this.steer));
    this.carRenderer.SetFrontWheelRotation(wheelRotation);
}

Car.prototype.MoveWheels = function(dt)
{
    var moveAmount = this.speed * dt;

    this.posBackWheel.x += this.curRotationDir.x * moveAmount;
    this.posBackWheel.y += this.curRotationDir.y * moveAmount;
    this.posFrontWheel.x += Math.cos(this.group.rotation + this.steer) * moveAmount;
    this.posFrontWheel.y += Math.sin(this.group.rotation + this.steer) * moveAmount;
}

Car.prototype.UpdatePosition = function(dt)
{
    var xDesired = (this.posFrontWheel.x + this.posBackWheel.x) * 0.5;
    var yDesired = (this.posFrontWheel.y + this.posBackWheel.y) * 0.5;

    // Drift:
    // 1. Drift heading is always rotating towards current rotation, but is slightly delayed.
    // 2. Project that onto right/lateral vector.
    // 3. Apply that direction to position based on current speed and drift factor.
    var xLateral = this.curRotationDir.y;
    var yLateral = -this.curRotationDir.x;
    var xDrift = Math.cos(this.driftHeading);
    var yDrift = Math.sin(this.driftHeading);
    var dot = xLateral*xDrift + yLateral*yDrift;
    xDesired += this.speed * xLateral * dot * this.DRIFT_SPEED_FACTOR * dt;
    yDesired += this.speed * yLateral * dot * this.DRIFT_SPEED_FACTOR * dt;

    // Collision force:
    // 1. ProcessCollisions() will calculate and add to collisionForce amount per collision.
    // 2. We apply that collision force here and continually decrease it over time.
    xDesired += this.collisionForce.x * dt;
    yDesired += this.collisionForce.y * dt;
    this.collisionForce.x = MoveToward(this.collisionForce.x, 0.0, this.COLLISION_FORCE_DECELERATION_PER_SEC * dt);
    this.collisionForce.y = MoveToward(this.collisionForce.y, 0.0, this.COLLISION_FORCE_DECELERATION_PER_SEC * dt);

    // Apply our final position
    this.group.x = xDesired;
    this.group.y = yDesired;

    // New heading is back wheels -> front wheels direction
    // Also add forced rotation from collision
    this.group.rotation = Math.atan2(this.posFrontWheel.y - this.posBackWheel.y , this.posFrontWheel.x - this.posBackWheel.x);
    this.group.rotation = game.math.normalizeAngle(this.group.rotation + (this.collisionRotation * dt));
    this.curRotationDir.x = Math.cos(this.group.rotation);
    this.curRotationDir.y = Math.sin(this.group.rotation);

    // Collision rotation:
    // 1. ProcessCollisions() will calculate and add to collision rotation amount per collision.
    // 2. We apply this rotation additively above and continually decrease it over time.
    this.collisionRotation = MoveToward(this.collisionRotation, 0.0, this.COLLISION_ROTATION_DECELERATION_PER_SEC * dt);

    // Lerp drift heading towards actual heading so it's delayed and represents "old" heading values
    this.driftHeading = LerpRotationToward(this.driftHeading, this.group.rotation, this.DRIFT_HEADING_ROTATION_LERP_PER_SEC * dt);
}

Car.prototype.ProcessCollisions = function(dt)
{
    for (var i = 0; i < cars.length; i++)
    {
        var otherCar = cars[i];
        if (otherCar != this)
        {
            var collisionInfo = new CollisionInfo();
            if (IsColliding(this, otherCar, collisionInfo))
            {
                this.OnCarCollision(otherCar, collisionInfo);
            }
        }
    }

    this.BounceOffWalls();
}

Car.prototype.OnCarCollision = function(otherCar, collisionInfo)
{
    // Move ourselves out of collision with the other car
    this.group.x += collisionInfo.projectionAxis.x * collisionInfo.projectionLength;
    this.group.y += collisionInfo.projectionAxis.y * collisionInfo.projectionLength;

    // Apply force to the other car based on our current speed
    var collisionSpeed = Math.abs(this.speed) * this.COLLISION_FORCE_SPEED_FACTOR;
    otherCar.collisionForce.x -= collisionInfo.projectionAxis.x * collisionSpeed;
    otherCar.collisionForce.y -= collisionInfo.projectionAxis.y * collisionSpeed;

    // Calculate information about where we are relative to the other car
    var toOtherCar = new Phaser.Point(otherCar.group.x - this.group.x, otherCar.group.y - this.group.y);
    var movingTowardsOtherCar = (toOtherCar.x*this.moveAmount.x) + (toOtherCar.y*this.moveAmount.y) >= 0.0;
    var otherCarToMeDir = new Phaser.Point(this.group.x - otherCar.group.x, this.group.y - otherCar.group.y);
    otherCarToMeDir.normalize();
    var otherCarFwd = otherCar.curRotationDir;
    var otherCarRight = new Phaser.Point(otherCarFwd.y, -otherCarFwd.x);
    var dotFront = (otherCarToMeDir.x*otherCarFwd.x) + (otherCarToMeDir.y*otherCarFwd.y);
    var dotRight = (otherCarToMeDir.x*otherCarRight.x) + (otherCarToMeDir.y*otherCarRight.y);

    // Apply rotational force to the other car based on where we hit it
    if (movingTowardsOtherCar)
    {
        var hitOtherCarFront = dotFront >= 0.0;
        var hitOtherCarRight = dotRight >= 0.0;
        var rotateClockwise = (hitOtherCarFront && hitOtherCarRight) || (!hitOtherCarFront && !hitOtherCarRight);
        var collisionRotationSpeed = rotateClockwise ? Math.abs(this.speed) : -Math.abs(this.speed);

        otherCar.collisionRotation += collisionRotationSpeed * this.COLLISION_ROTATION_SPEED_FACTOR;
        otherCar.collisionRotation = Math.max(-this.MAX_COLLISION_ROTATION, Math.min(this.MAX_COLLISION_ROTATION, otherCar.collisionRotation));
    }

    // Reduce our speed
    this.speed *= this.COLLISION_SPEED_MULTIPLIER;
}

Car.prototype.BounceOffWalls = function()
{
    var verts = this.GetCollisionVerts();
    for (var i = 0; i < verts.length; i++)
    {
        var vert = verts[i];

        // If this vert is outside of our game window, then:
        // 1. Project back so we're within the game window
        // 2. Reset speed and drift
        // 3. Apply collision force based on our current movement so we bounce off
        var xDelta = GetClampDelta(vert.x, 0.0, game.width);
        var yDelta = GetClampDelta(vert.y, 0.0, game.height);
        if (xDelta != 0.0 || yDelta != 0.0)
        {
            this.group.x += xDelta;
            this.group.y += yDelta;
            this.speed = 0.0;
            this.driftHeading = this.group.rotation;

            if (xDelta != 0.0)
            {
                this.collisionForce.x = -this.moveAmount.x * this.COLLISION_WALL_RESPONSE_MOVE_FACTOR;
            }
            if (yDelta != 0.0)
            {
                this.collisionForce.y = -this.moveAmount.y * this.COLLISION_WALL_RESPONSE_MOVE_FACTOR;
            }
        }
    }
}

Car.prototype.GetCollisionAxes = function(otherShape)
{
    // We only care about 2 axes for collision: forward and right
    var heading = new Phaser.Point(Math.cos(this.group.rotation), Math.sin(this.group.rotation));
    var axes = new Array();
    axes.push(heading);
    axes.push(new Phaser.Point(heading.y, -heading.x));
    
    return axes;
}

Car.prototype.GetCollisionVerts = function()
{
    // Collsion verts are simply each corner of our bounding box
    var fwd = new Phaser.Point(Math.cos(this.group.rotation), Math.sin(this.group.rotation));
    var right = new Phaser.Point(fwd.y, -fwd.x);
    var halfLength = this.LENGTH * 0.5;
    var halfWidth = this.WIDTH * 0.5;
    var fwdOffset = new Phaser.Point(fwd.x*halfLength, fwd.y*halfLength);
    var rightOffset = new Phaser.Point(right.x*halfWidth, right.y*halfWidth);

    var verts = new Array();
    verts.push(new Phaser.Point(this.group.x + fwdOffset.x + rightOffset.x, this.group.y + fwdOffset.y + rightOffset.y));
    verts.push(new Phaser.Point(this.group.x + fwdOffset.x - rightOffset.x, this.group.y + fwdOffset.y - rightOffset.y));
    verts.push(new Phaser.Point(this.group.x - fwdOffset.x + rightOffset.x, this.group.y - fwdOffset.y + rightOffset.y));
    verts.push(new Phaser.Point(this.group.x - fwdOffset.x - rightOffset.x, this.group.y - fwdOffset.y - rightOffset.y));

    return verts;
}

Car.prototype.ProjectToAxis = function(axis)
{
    var verts = this.GetCollisionVerts();
    var dot = verts[0].x * axis.x + verts[0].y * axis.y;
    var min = dot;
    var max = dot;

    for (var i = 1; i < verts.length; i++)
    {
        dot = verts[i].x * axis.x + verts[i].y * axis.y;
        min = Math.min(min, dot);
        max = Math.max(max, dot);
    }

    return new Projection(min, max);
}