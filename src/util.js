function MoveToward(from, to, amount)
{
    if (from < to)
    {
        from = Math.min(from + amount, to);
    }
    else
    {
        from = Math.max(from - amount, to);
    }

    return from;
}

function LerpRotationToward(from, to, lerpFactor)
{
    var delta = to - from;
    if (delta >= Math.PI)
    {
        delta -= game.math.PI2;
    }
    else if (delta <= -Math.PI)
    {
        delta += game.math.PI2;
    }
    return game.math.normalizeAngle(from + delta*lerpFactor);
}

function GetClampDelta(value, min, max)
{
    if (value < min)
    {
        return min - value;
    }
    else if (value > max)
    {
        return max - value;
    }

    return 0.0;
}