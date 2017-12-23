function CarRenderer(car)
{
    this.CreateBody(car);
    this.CreateWheels(car);
    this.CreateKeys(car);
}

CarRenderer.prototype.CreateBody = function(car)
{
    var bodySize = new Phaser.Point(car.LENGTH * 1.3, car.WIDTH * 3.5);

    this.body = game.add.sprite(0, 0, car.group.x < game.width * 0.5 ? "Car_01" : "Car_02");
    this.body.width = bodySize.x;
    this.body.height = bodySize.y;
    this.body.anchor.setTo(0.5, 0.5);
    car.group.add(this.body);
}

CarRenderer.prototype.CreateWheels = function(car)
{
    this.wheels = new Array();
    var wheelSize = new Phaser.Point(car.LENGTH * 0.3, car.LENGTH * 0.15)
    var wheelOffset = new Phaser.Point(car.LENGTH * 0.3, car.WIDTH * 0.5)

    for (var i = 0; i < 4; i++)
    {
        var xPos = i < 2 ? wheelOffset.x : -wheelOffset.x;
        var yPos = i % 2 ? wheelOffset.y : -wheelOffset.y;
        var wheel = game.add.sprite(xPos, yPos, "Square");
        wheel.width = wheelSize.x;
        wheel.height = wheelSize.y;
        wheel.anchor.setTo(0.5, 0.5);
        wheel.tint = 0x000000;
        car.group.add(wheel);
        this.wheels.push(wheel);
        wheel.sendToBack();
    }
}

CarRenderer.prototype.CreateKeys = function(car)
{
    var keysSize = new Phaser.Point(181, 75);
    var keysOffset = new Phaser.Point(car.group.x + 0, car.group.y - 75);

    this.keys = game.add.sprite(keysOffset.x, keysOffset.y, car.group.x < game.width * 0.5 ? "Car_01_Keys" : "Car_02_Keys");
    this.keys.width = keysSize.x;
    this.keys.height = keysSize.y;
    this.keys.anchor.setTo(0.5, 0.5);
}

CarRenderer.prototype.HideKeys = function(visible)
{
    if (this.keys != undefined)
    {
        this.keys.destroy();
        this.keys = undefined;
    }
}

CarRenderer.prototype.SetFrontWheelRotation = function(rotation)
{
    this.wheels[0].rotation = rotation;
    this.wheels[1].rotation = rotation;
}