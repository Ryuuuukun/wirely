import { Drawable } from "../base/drawable";
import { Entity } from "../ecs";

export class StackSystem {
    static stack = Entity(({ lineWidth = 1, baseSpace = 20, gridColor = [255, 255, 255] }) => [
        Drawable((ctx, cnv, e, time, delta, context) => {
            ctx.save();
            ctx.resetTransform();

            const scale = context.scale;

            const logBase = 5;
            const logScale = Math.log(0.6 / scale) / Math.log(logBase);
            const floorLog = Math.floor(logScale);

            const step1 = baseSpace * Math.pow(logBase, floorLog) * scale;
            const step2 = step1 * logBase;


            const progress = logScale - floorLog;
            const alpha2 = progress;
            const alpha1 = 1 - progress;

            const minAlpha = 0.3;

            const drawGrid = (step, alphaMultiplier) => {
                if (alphaMultiplier < minAlpha || step < 2) return;

                const startx = ((context.dx % step) + step) % step;
                const starty = ((context.dy % step) + step) % step;

                ctx.lineWidth = lineWidth;
                ctx.fillStyle = `rgba(${gridColor.join(',')}, ${0.15 * alphaMultiplier})`;


                ctx.beginPath();
                for (let x = startx; x < cnv.width; x += step) {
                    for (let y = starty; y < cnv.height; y += step) {
                        ctx.moveTo(x, y);
                        ctx.arc(x, y, 1 * alphaMultiplier + 1, 0, Math.PI * 2);
                    }
                }
                ctx.fill();
            };

            drawGrid(step1, alpha1);
            drawGrid(step2, alpha2);

            ctx.restore();
        })
    ]);

    constructor() {
        this.id = crypto.randomUUID();
        this.grid = StackSystem.stack({
            baseSpace: 40, gridColor: [255, 255, 255]
        });
    }

    init(engine) {
        engine.addEntity(this.grid);
    }

    dispose(engine) {
        engine.removeEntity(this.grid.id);
    }
}
