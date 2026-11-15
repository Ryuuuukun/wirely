import { Component } from "../ecs";

export const Drawable = Component({ schema: (callback, zindex) => ({ callback, zindex }), tag: 'drawable' });

export class DrawSystem {
    constructor(canvas, context, engine) {
        this.id = crypto.randomUUID();
        this.native = true;

        this.context = engine.context;
        this.ctx = context;
        this.cnv = canvas;

        this.entities = [];
    }

    match(entity) {
        return entity.has('drawable');
    }

    entityAdded(entity) {
        this.entities.push(entity);
    }

    entityRemoved(entity) {
        this.entities = this.entities.filter(e => e !== entity);
    }

    preprocess(time, delta) {
        this.ctx.resetTransform();
        this.ctx.clearRect(0, 0, this.cnv.width, this.cnv.height);

        this.ctx.translate(this.context.dx, this.context.dy);
        this.ctx.scale(this.context.scale, this.context.scale);

        this.entities.sort((a, b) =>
            a.get('drawable').zindex - b.get('drawable').zindex);
        this.entities.forEach(entity => {
            entity.get('drawable').callback(this.ctx, this.cnv, entity, time, delta, this.context);
        });
    }
}
