var playState =
{
    preload: function()
    {
        game.add.sprite(0, 0, "GameBackground");
    },

    create: function()
    {
        cars.push(new Car(100, 300, 0, Phaser.Keyboard.W, Phaser.Keyboard.S, Phaser.Keyboard.A, Phaser.Keyboard.D));
        cars.push(new Car(700, 300, Math.PI, Phaser.Keyboard.UP, Phaser.Keyboard.DOWN, Phaser.Keyboard.LEFT, Phaser.Keyboard.RIGHT));

        game.time.advancedTiming = true;
    },

    CreateTextObj: function(x, y, text, fontSize, align)
    {
    },

    update: function()
    {
        cars.forEach(function(car)
        {
            car.Update();
        });
    },

    render: function()
    {
        //game.debug.text(game.time.fps, 2, 14, "#00ff00");
    },
};