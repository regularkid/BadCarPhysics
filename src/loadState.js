var music = null;
var sfxMove = null;
var sfxRotate = null;
var sfxTouchDown = null;
var sfxClear = null;
var sfxClearFour = null;
var sfxGameOver = null;

var loadState =
{
    preload: function()
    {
        game.load.image("Logo", "assets/Logo_512x32.png");
        game.load.image("ClickToStart", "assets/ClickToStart.png");
        game.load.image("Square", "assets/Square.png");
        game.load.image("Car_01", "assets/Car_01.png");
        game.load.image("Car_02", "assets/Car_02.png");
        game.load.image("Car_01_Keys", "assets/Car_01_Keys.png");
        game.load.image("Car_02_Keys", "assets/Car_02_Keys.png");
        game.load.image("GameBackground", "assets/GameBackground.png");
    },

    create: function()
    {
        var keyStart = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
        keyStart.onDown.add(this.onStartPressed, this);

        var background = game.add.sprite(0, 0, "GameBackground");

        var logo = game.add.sprite(this.game.world.centerX, this.game.world.centerY, "Logo");
        logo.anchor.setTo(0.5, 0.5);
        logo.tint = 0x848484;

        var logo = game.add.sprite(this.game.world.centerX, this.game.world.centerY + 40.0, "ClickToStart");
        logo.anchor.setTo(0.5, 0.5);
        logo.tint = 0x848484;
    },

    update: function()
    {
        //if (game.input.activePointer.leftButton.isDown || game.input.activePointer.isDown)
        if (game.input.activePointer.isDown)
        {
            game.state.start("play");
        }
    },

    onStartPressed: function()
    {
        game.state.start("play");
    },
};