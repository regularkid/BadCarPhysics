var game = null;
var gameBoard = null;

window.onload = function()
{
    game = new Phaser.Game(800, 600, Phaser.AUTO, "game");

    game.rnd.sow([new Date().getTime()]);

    game.state.add("load", loadState);
    game.state.add("play", playState);

    game.state.start("load");
};