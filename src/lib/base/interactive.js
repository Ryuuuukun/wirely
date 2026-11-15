import { Component, Entity } from '../ecs.js';
import { Drawable } from './drawable.js';

export const Position = Component({ schema: (x, y) => ({ x, y }), tag: 'position' });
export const Size = Component({ schema: (x, y) => ({ x, y }), tag: 'size' });

export const Shape = Component({ schema: callback => ({ callback }), tag: 'shape' });

export const RectangleShape = () => Shape((entity, event) => {
    const pos = entity.get('position');
    const size = entity.get('size');

    return Math.abs(pos.x - event.mouseX) <= size.x / 2 &&
        Math.abs(pos.y - event.mouseY) <= size.y / 2;
});
export const CircleShape = () => Shape((entity, event) => {
    const pos = entity.get('position');
    const size = entity.get('size');

    const dx = pos.x - event.mouseX;
    const dy = pos.y - event.mouseY;

    return dx * dx + dy * dy <= size.x * size.x / 4;
});

const EventCallback = tag => Component({ schema: callback => ({ callback }), tag });
const EventState = tag => Component({ schema: (index = 0) => ({ state: false, index }), tag });

export const Click = EventCallback('click');
export const ClickOn = EventCallback('click-on');
export const ClickOff = EventCallback('click-off');

export const Hover = EventState('hover');
export const HoverOn = EventCallback('hover-on');
export const HoverOff = EventCallback('hover-off');

export const Drag = EventState('drag');
export const DragOn = EventCallback('drag-on');
export const DragOff = EventCallback('drag-off');

export const Select = EventState('select');
export const SelectOn = EventCallback('select-on');
export const SelectOff = EventCallback('select-off');

export const SelectAreaStyle = {
    backgroundColor: `#427af5${Math.floor(0.15 * 255).toString(16)}`,
    strokeColor: '#427af5',

    lineDash: [10, 5],
    dotSize: 2,

    lineWidth0: 2,
    lineWidth1: 5
};

export const SelectArea = Entity(({ x, y, sx, sy }) => [
    Position(x, y),
    Size(sx, sy),

    Drawable(function (ctx, cnv, e, time) {
        ctx.save();

        const pos = e.position;
        const size = e.size;

        ctx.lineWidth   = SelectAreaStyle.lineWidth0;
        ctx.fillStyle   = SelectAreaStyle.backgroundColor;
        ctx.strokeStyle = SelectAreaStyle.strokeColor;

        ctx.setLineDash(SelectAreaStyle.lineDash);
        ctx.lineDashOffset = time / 50;

        const offset = SelectAreaStyle.lineWidth0;
        const mulx = size.x < 0 ? 1 : -1;
        const muly = size.y < 0 ? 1 : -1;

        ctx.strokeRect(pos.x, pos.y, size.x, size.y);
        ctx.fillRect(pos.x + offset / 2 * mulx, pos.y + offset / 2 * muly,
            size.x - offset * mulx, size.y - offset * muly);

        ctx.setLineDash([]);
        ctx.lineWidth = SelectAreaStyle.lineWidth1;
        ctx.fillStyle = 'black';

        const dotsize = SelectAreaStyle.dotSize;

        ctx.beginPath();

        ctx.arc(pos.x, pos.y, dotsize, 0, Math.PI * 2);

        ctx.moveTo(pos.x + size.x, pos.y);
        ctx.arc(pos.x + size.x, pos.y, dotsize, 0, Math.PI * 2);

        ctx.moveTo(pos.x, pos.y + size.y);
        ctx.arc(pos.x, pos.y + size.y, dotsize, 0, Math.PI * 2);

        ctx.moveTo(pos.x + size.x, pos.y + size.y);
        ctx.arc(pos.x + size.x, pos.y + size.y, dotsize, 0, Math.PI * 2);

        ctx.stroke();
        ctx.fill();

        ctx.restore();
    }, 20)
]);

export class EventSystem {
    constructor() {
        this.id = 'event-system';
    }

    static convertCoordinates(event, canvas, context) {
        const rect = canvas.getBoundingClientRect();
        const canvasX = event.clientX - rect.left;
        const canvasY = event.clientY - rect.top;

        return {
            x: (canvasX - context.dx) / context.scale,
            y: (canvasY - context.dy) / context.scale
        };
    }

    static revertCoordinates(point, canvas, context) {
        const rect = canvas.getBoundingClientRect();

        const canvasX = point.x * context.scale + context.dx;
        const canvasY = point.y * context.scale + context.dy;

        return {
            x: canvasX + rect.left,
            y: canvasY + rect.top
        };
    }

    init(engine) {
        const context = engine.context;
        const cnv = engine.context.cnv;

        this.context = context;
        this.cnv = cnv;

        this.isCanClick  = true;
        this.isCanHover  = true;
        this.isCanSelect = true;
        this.isCanDrag   = true;

        this.controller = new AbortController();

        // click event
        this.clickable = [];
        this.clicking = undefined;
        document.addEventListener('mousedown', e => {
            if (document.elementFromPoint(e.clientX, e.clientY) !== cnv || e.button !== 0 || !this.isCanClick) return;

            const { x, y } = EventSystem.convertCoordinates(e, cnv, context);
            e.mouseX = x;
            e.mouseY = y;

            const entity = this.clickable
                .find(entity => entity.get('shape').callback(entity, e));
            if (entity) {
                this.clicking = entity;

                entity.get('click').callback(entity, e);
                entity.get('click-on')?.callback(entity, e);
            }
        }, { signal: this.controller.signal });
        document.addEventListener('mouseup', e => {
            if (!this.clicking) return;

            const { x, y } = EventSystem.convertCoordinates(e, cnv, context);
            e.mouseX = x;
            e.mouseY = y;

            this.clicking.get('click-off')?.callback(this.clicking, e);
            this.clicking = undefined;
        }, { signal: this.controller.signal });

        // hover event
        this.hoverable = [];
        document.addEventListener('mousemove', e => {
            if (!this.isCanHover) return;

            const { x, y } = EventSystem.convertCoordinates(e, cnv, context);
            e.mouseX = x;
            e.mouseY = y;

            this.hoverable
                .forEach(entity => {
                    let inside = entity.get('shape').callback(entity, e);
                    if (inside !== entity.get('hover').state) {
                        entity.get('hover').state = inside;
                        entity.get(inside ? 'hover-on' : 'hover-off')?.callback(entity, e);
                    }
                });
        }, { signal: this.controller.signal });

        // select event
        this.selectable = [];
        this.selected = new Set();
        this.selectArea = undefined;
        document.addEventListener('mousedown', e => {
            if (e.button !== 0 || !this.isCanSelect) return;

            const { x, y } = EventSystem.convertCoordinates(e, cnv, context);
            e.mouseX = x;
            e.mouseY = y;

            const entity = this.selectable
                .find(entity => entity.get('shape').callback(entity, e));
            if (entity) {
                if (!e.shiftKey && !entity.get('select').state) {
                    this.selected.forEach(entity => entity.get('select').state = false);
                    this.selected.clear();
                }

                e.shiftKey ?
                    entity.get('select').state = !entity.get('select').state :
                    entity.get('select').state = true;

                entity.get('select').state ?
                    this.selected.add(entity) :
                    this.selected.delete(entity);

                entity.get(entity.get('select').state ? 'select-on' : 'select-off')?.callback(entity, e);
            } else {
                this.selected.forEach(entity => {
                    entity.select.state = false;
                    entity['select-off']?.callback(entity, e);
                });
                this.selected.clear();

                if (!this.selectArea) {
                    this.selectArea = SelectArea({ x, y, sx: 1, sy: 1 });
                    engine.addEntity(this.selectArea);
                }
            }
        }, { signal: this.controller.signal });
        document.addEventListener('mousemove', e => {
            if (this.selectArea) {
                const { x, y } = EventSystem.convertCoordinates(e, cnv, context);

                const pos = this.selectArea.position;
                const size = this.selectArea.size;

                size.x = x - pos.x;
                size.y = y - pos.y;

                this.selected.forEach(e => e.select.state = false);
                this.selected.clear();

                engine.getEntities(e => e.has('element'))
                    .forEach(element => {
                        const dx = element.position.x - pos.x;
                        const dy = element.position.y - pos.y;


                    });
            }
        }, { signal: this.controller.signal });
        document.addEventListener('mouseup', e => {
            if (this.selectArea) {
                engine.removeEntity(this.selectArea.id);
                this.selectArea = undefined;
            }
        }, { signal: this.controller.signal });

        // drag event
        this.draggable = new Set();
        document.addEventListener('mousedown', e => {
            if (document.elementFromPoint(e.clientX, e.clientY) !== cnv) return;
            if (e.button === 0 || !this.isCanDrag) this.pressed = true;
        }, { signal: this.controller.signal });
        document.addEventListener('mouseup', e => {
            this.pressed = false;
            this.selected
                .forEach(entity => {
                    if (!entity.has('drag')) return;

                    if (entity.get('drag').state) {
                        entity.get('drag-off')?.callback();
                    }
                    entity.get('drag').state = false;
                });
        }, { signal: this.controller.signal });
        document.addEventListener('mousemove', e => {
            if (e.button !== 0 || !this.isCanDrag) return;

            const { x, y } = EventSystem.convertCoordinates(e, cnv, context);
            e.mouseX = x;
            e.mouseY = y;

            if (!this.lastMouseMoveX) this.lastMouseMoveX = x;
            if (!this.lastMouseMoveY) this.lastMouseMoveY = y;
            if (this.pressed && this.selected.size !== 0) {
                const dx = x - this.lastMouseMoveX;
                const dy = y - this.lastMouseMoveY;
                this.selected
                    .forEach(entity => {
                        if (!entity.has('drag')) return;

                        if (!entity.get('drag').state) {
                            entity.get('drag-on')?.callback(entity, e);
                        }

                        entity.get('drag').state = true;

                        const pos = entity.get('position');
                        pos.x += dx;
                        pos.y += dy;
                    });
            }

            this.lastMouseMoveX = x;
            this.lastMouseMoveY = y;
        }, { signal: this.controller.signal });
    }

    dispose() {
        this.controller.abort();
    }

    match(e) {
        return e.has('shape');
    }

    entityAdded(entity) {
        if (entity.has('position') && entity.has('size')) {
            if (entity.has('click')) {
                this.clickable.push(entity);
                this.clickable.sort((a, b) => a.select.index - b.select.index);
            }
            if (entity.has('hover')) {
                this.hoverable.push(entity);
                this.hoverable.sort((a, b) => a.select.index - b.select.index);
            }
            if (entity.has('select')) {
                this.selectable.push(entity);
                this.selectable.sort((a, b) => a.select.index - b.select.index);
            }
        }
    }

    entityRemoved(entity) {
        this.clickable = this.clickable.filter(e => e !== entity);
        this.hoverable = this.hoverable.filter(e => e !== entity);
        this.selectable = this.selectable.filter(e => e !== entity);
        this.selected.delete(entity);
    }

    setWindowScale(scale, x, y) {

        x = x || this.cnv.width / 2;
        y = y || this.cnv.height / 2;

        scale = Math.max(this.context.MIN_SCALE, Math.min(this.context.MAX_SCALE, scale));

        this.context.dx = x - (x - this.context.dx) * (scale / this.context.scale);
        this.context.dy = y - (y - this.context.dy) * (scale / this.context.scale);

        this.context.scale = scale;
    }
}
