function Projection(min, max)
{
    this.min = min;
    this.max = max;

    this.Overlaps = function(projOther)
    {
        if (min > projOther.max || max < projOther.min)
        {
            return false;
        }

        return true;
    };
}

function CollisionInfo()
{
    this.projectionAxis = new Phaser.Point(1, 0);
    this.projectionLength = Number.MAX_VALUE;
}

function IsColliding(shape1, shape2, collisionInfo)
{
    // Using SAT (Separating Axis Theorem):
    // http://www.dyn4j.org/2010/01/sat/
    // https://gamedevelopment.tutsplus.com/tutorials/collision-detection-using-the-separating-axis-theorem--gamedev-169

    // Combine axes from both shapes into a single array
    var axes = shape1.GetCollisionAxes(shape2);
    shape2.GetCollisionAxes(shape1).forEach(function(axis)
    {
        axes.push(axis);
    });

    for (var j = 0; j < axes.length; j++)
    {
        var axis = axes[j];
        var proj1 = shape1.ProjectToAxis(axis);
        var proj2 = shape2.ProjectToAxis(axis);
        if (!proj1.Overlaps(proj2))
        {
            return false;
        }
        else if (collisionInfo != undefined)
        {
            if (proj1.min < proj2.min)
            {
                var overlap = proj1.max - proj2.min;
                if (overlap < collisionInfo.projectionLength)
                {
                    collisionInfo.projectionLength = overlap;
                    collisionInfo.projectionAxis.x = -axis.x;
                    collisionInfo.projectionAxis.y = -axis.y;
                }
            }
            else
            {
                var overlap = proj2.max - proj1.min;
                if (overlap < collisionInfo.projectionLength)
                {
                    collisionInfo.projectionLength = overlap;
                    collisionInfo.projectionAxis.x = axis.x;
                    collisionInfo.projectionAxis.y = axis.y;
                }
            }
        }
    }

    return true;
}