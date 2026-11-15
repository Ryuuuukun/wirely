import { CircleShape, Click, ClickOff, ClickOn, Drag, DragOn, EventSystem, Hover, HoverOff, HoverOn, Position, RectangleShape, Select, Shape, Size } from "../base/interactive";
import { Component, Entity, Tick } from "../ecs";
import { Drawable } from "../base/drawable";
import { Animate, NumberAnimate } from "../base/anime";

export const BaseStyle = {
    space: 8,

    socketHoverScale: 1.5,

    defaultSocketColor: '#AFAFAF',
    activeSocketColor: '',
    hoverSocketColor: '#386AD7',

    lineWidth0: 3,
    lineWidth1: 4,
    lineWidth2: 4,

    defaultBackgroundColor: '#000000',

    defaultStrokeColor1: '#404040',
    defaultStrokeColor2: '#080808',

    activeBackgroundColor: '#445C54',

    activeStrokeColor1: '#334E45',
    activeStrokeColor2: '#445C54',

    aberrationWidth: 4,
    aberrationRadius: 6,
    aberrationColor1: '#386AD7',
    aberrationColor2: '#1F386E',
};

export const Meta = Component({ schema: obj => ({ ...obj }), tag: 'meta' });

export const SocketMark = Component({ schema: (element, type) => ({ element, type }), tag: 'socket' });
export const Socket = Entity(({ element, type }) => [
    SocketMark(element, type),
    Meta({ element, type }),

    CircleShape(),

    Position(0, 0),
    Size(12),

    Click(() => { }),
    Select(-1),
    Hover(),
    Drag(),

    HoverOn(e => e.animate.get('scale')
        .to({ to: 1.75, duration: 150 })),
    HoverOff(e => e.animate.get('scale')
        .to({ to: 1, duration: 150 })),

    Animate({
        'scale': new NumberAnimate(1)
    }),

    Tick(function (entity, time, delta) {
        const follow = entity.meta.element.position;
        const pos = entity.position;

        entity.size.x = 12 * entity.animate.get('scale').value;

        pos.x = follow.x + (type === 'input' ? -35 : 35);
        pos.y = follow.y;
    }),
    Drawable(function (ctx, cnv, e) {
        const style = e.meta.element.meta.style;
        const state = e.meta.element.state.value;

        ctx.fillStyle = style.defaultSocketColor;
        if (state) ctx.fillStyle = style.activeSocketColor;
        if (e.hover.state || e.drag.state) ctx.fillStyle = style.hoverSocketColor;

        ctx.beginPath();
        ctx.arc(e.position.x, e.position.y, e.size.x / 2, 0, Math.PI * 2);
        ctx.fill();
    }, 10)
]);

function Point(x, y) {
    return { x, y };
}

export const PipeStyle = {
    dotSize: 4,

    defaultLineWidth: 3,
    aberrationLineWidth: 3,

    defaultBackgroundColor: '#000000',
    aberrationBackgroundColor: '#000000',

    defaultStrokeColor: '#505050',
    aberrationStrokeColor: '#1F386E'
};

export const PipeMarker = Component({ tag: 'pipe' });
export const Pipe = Entity(({ start, end, posstart, posend }) => [
    PipeMarker(),
    Meta({
        start, end, posstart, posend,
        route: []
    }),

    Shape((e, event) => {
        const route = e.meta.route;
        const distance = (a, b) => {
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const length = dx * dx + dy * dy;
            const t = length === 0 ? 0 : Math.max(0, Math.min(1,
                ((event.mouseX - a.x) * dx + (event.mouseY - a.y) * dy) / length
            ));

            const x = a.x + t * dx;
            const y = a.y + t * dy;
            const dx2 = event.mouseX - x;
            const dy2 = event.mouseY - y;

            return dx2 * dx2 + dy2 * dy2;
        };

        for (let i = 1; i < route.length; ++i) {
            if (distance(route[i - 1], route[i]) <= 36) return true;
        }

        return false;
    }),
    Position(0, 0),
    Size(0, 0),
    Select(),

    Tick(function (e, time, delta) {
        const start = e.meta.start?.position || e.meta.posstart;
        const end = e.meta.end?.position || e.meta.posend;

        if (start.x + 50 < end.x) {
            if (Math.abs(start.y - end.y) < 10e-2) {
                e.meta.route = [start, end];
            } else {
                e.meta.route = [start, Point((start.x + end.x) / 2, start.y), Point((start.x + end.x) / 2, end.y), end];
            }
        } else {
            if (Math.abs(start.y - end.y) >= 100) {
                e.meta.route = [
                    start,
                    Point(start.x + 25, start.y),
                    Point(start.x + 25, (start.y + end.y) / 2),
                    Point(end.x   - 25, (start.y + end.y) / 2),
                    Point(end.x   - 25, end.y),
                    end
                ];
            } else {
                e.meta.route = [
                    start,
                    Point(start.x + 25, start.y),
                    Point(start.x + 25, Math.min(start.y, end.y) - 80),
                    Point(end.x   - 25, Math.min(start.y, end.y) - 80),
                    Point(end.x   - 25, end.y),
                    end
                ];
            }
        }
    })
]);


function drawBaseShape(ctx, cnv, e) {
    const startx = e.position.x - e.size.y / 2;
    const starty = e.position.y - e.size.y / 2;

    const style = e.meta.style;
    const state = e.state.value;

    if (state) {
        ctx.shadowColor = `${style.activeBackgroundColor}${Math.floor(255 * 0.5).toString(16)}`;
        ctx.shadowBlur = 75;
    }

    ctx.fillStyle = state ? style.activeBackgroundColor : style.defaultBackgroundColor;
    ctx.fillRect(startx, starty, e.size.x, e.size.y);

    ctx.shadowColor = 'transparent';

    ctx.strokeStyle = state ? style.activeStrokeColor1 : style.defaultStrokeColor2;
    ctx.lineWidth = style.lineWidth2;

    const count = Math.floor(e.size.x / style.space);

    ctx.beginPath();
    for (let i = 0; i <= count; ++i) {
        ctx.moveTo(startx + i * style.space, starty);
        ctx.lineTo(startx + e.size.x, starty + e.size.y - i * style.space);
        ctx.moveTo(startx, starty + i * style.space);
        ctx.lineTo(startx + e.size.x - i * style.space, starty + e.size.y);
    }
    ctx.stroke();

    ctx.strokeStyle = state ? style.activeStrokeColor2 : style.defaultStrokeColor1;
    ctx.lineWidth = style.lineWidth0;

    ctx.strokeRect(startx, starty, e.size.x, e.size.y);

    if (!state) {
        ctx.beginPath();

        ctx.arc(startx, starty, 4, 0, Math.PI * 2);

        ctx.moveTo(startx + e.size.x, starty);
        ctx.arc(startx + e.size.x, starty, 4, 0, Math.PI * 2);

        ctx.moveTo(startx, starty + e.size.y);
        ctx.arc(startx, starty + e.size.y, 4, 0, Math.PI * 2);

        ctx.moveTo(startx + e.size.x, starty + e.size.y);
        ctx.arc(startx + e.size.x, starty + e.size.y, 4, 0, Math.PI * 2);

        ctx.fillStyle = state ? style.activeStrokeColor2 : style.defaultStrokeColor1;

        ctx.fill();
    }
}

function drawAberrationHover(ctx, cnv, e) {
    const style = e.meta.style;
    const state = e.state.value;

    const scale = e.select.state ? 1 : e.animate.get('aberration-scale').value;
    const radius = style.aberrationRadius * Math.abs(scale);

    const startx = e.position.x - e.size.x / 2;
    const starty = e.position.y - e.size.y / 2;

    ctx.fillStyle = style.aberrationColor1;

    ctx.beginPath();

    ctx.arc(startx, starty, radius, 0, Math.PI * 2);

    ctx.moveTo(startx + e.size.x, starty);
    ctx.arc(startx + e.size.x, starty, radius, 0, Math.PI * 2);

    ctx.moveTo(startx, starty + e.size.y);
    ctx.arc(startx, starty + e.size.y, radius, 0, Math.PI * 2);

    ctx.moveTo(startx + e.size.x, starty + e.size.y);
    ctx.arc(startx + e.size.x, starty + e.size.y, radius, 0, Math.PI * 2);

    ctx.fill();
}

function drawAberrationSelect(ctx, cnv, e, time) {
    const style = e.meta.style;
    const state = e.state.value;

    ctx.lineWidth = style.aberrationWidth;
    ctx.strokeStyle = state ? style.activeBackgroundColor : style.defaultBackgroundColor;
    ctx.strokeRect(e.position.x - e.size.x / 2, e.position.y - e.size.y / 2, e.size.x, e.size.y);

    ctx.strokeStyle = state ? `${style.aberrationColor1}${Math.floor(255 * 0.75).toString(16)}` :  style.aberrationColor2;
    ctx.lineDashOffset = time / 50;
    ctx.setLineDash([10, 5]);
    ctx.strokeRect(e.position.x - e.size.x / 2, e.position.y - e.size.y / 2, e.size.x, e.size.y);

    drawAberrationHover(ctx, cnv, e);
}

function drawName(ctx, cnv, e, time) {
    ctx.font = '16px JetBrains Mono';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.textAlign = 'center';

    ctx.fillText(e.meta.name, e.position.x, e.position.y + e.size.y / 2 + 20);
}

function drawSymbol(ctx, cnv, e, time) {
    ctx.font = 'bold 28px JetBrains Mono';
    ctx.fillStyle = 'rgba(255, 255, 255, 1)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillText(e.meta.symbol, e.position.x, e.position.y);
}

export const ElementMarker = Component({ tag: 'element' });

export const Input = Component({ tag: 'input' });
export const Output = Component({ tag: 'output' });


export const StaticState = Component({ schema: () => ({ value: false }), tag: 'state' });
export const DynamicState = Component({
    schema: (expr) => ({
        expr,
        value: false,
        laststate: false,
        evaluate(args, time) {
            let state = args.length === 0 ? false : this.expr(args, time);
            if (state !== this.laststate) {
                setTimeout(() => this.value = state, 75);
                this.laststate = state;
            }
        }
    }), tag: 'state'
});

const ElementBase = ({ x, y, style = BaseStyle, addMeta = { } }) => [
    ElementMarker(),
    Meta({
        style,
        hoverAbberation: false,
        ...addMeta
    }),

    RectangleShape(),

    Position(x, y),
    Size(70, 70),

    Select(),
    Hover(),
    Drag(),

    HoverOn(e => e.animate.get('aberration-scale')
            .to({ to: 1, duration: 150 })),
    HoverOff(e => e.animate.get('aberration-scale')
            .to({ to: 0, duration: 100 })),

    Animate({
        'aberration-scale': new NumberAnimate(0)
    }),

    Drawable(function (ctx, cnv, e, time, delta) {
        ctx.save();

        drawBaseShape(ctx, cnv, e, time, delta);
        if (e.select.state) drawAberrationSelect(ctx, cnv, e, time, delta);
        if (e.meta.name)    drawName(ctx, cnv, e, time, delta);
        if (e.meta.symbol)  drawSymbol(ctx, cnv, e, time, delta);

        drawAberrationHover(ctx, cnv, e, time, delta);

        ctx.restore();
    }, 10)
];

export const OtherBaseStyle = {
    ...BaseStyle,

    activeBackgroundColor: '#6B632B',

    activeStrokeColor1: '#EDDB5E',
    activeStrokeColor2: '#6B632B',

    activeSocketColor: '#FFEB60'
};

export const Switch = Entity(({ x, y }) => [
    ...ElementBase({
        x, y,
        style: OtherBaseStyle,
        addMeta: {
            name: 'switch',
            tag: 'switch'
        },
    }),

    Output(),

    Click(e => e.state.value = !e.state.value),
    StaticState()
]);

export const Button = Entity(({ x, y }) => [
    ...ElementBase({
        x, y,
        style: OtherBaseStyle,
        addMeta: {
            name: 'button',
            tag: 'button'
        },
    }),

    Output(),

    Click(() => { }),
    ClickOn(e => e.state.value = true),
    ClickOff(e => e.state.value = false),

    StaticState()
]);

export const Lamp = Entity(({ x, y }) => [
    ...ElementBase({
        x, y,
        style: OtherBaseStyle,
        addMeta: {
            name: 'lamp',
            tag: 'lamp'
        },
    }),

    Input(),
    DynamicState(args => args.every(e => e))
]);

export const GateAnd = Entity(({ x, y }) => [
    ...ElementBase({
        x, y,
        style: {
            ...BaseStyle,

            activeBackgroundColor: '#5EA475',

            activeStrokeColor1: '#457254',
            activeStrokeColor2: '#5EA475',

            activeSocketColor: '#74D393'
        },
        addMeta: {
            name: 'and',
            symbol: '&',
            tag: 'gate-and'
        }
    }),

    Output(),
    Input(),
    DynamicState(args => args.every(e => e))
]);

export const GateOr = Entity(({ x, y }) => [
    ...ElementBase({
        x, y,
        style: {
            ...BaseStyle,

            activeBackgroundColor: '#674C9E',

            activeStrokeColor1: '#4E4080',
            activeStrokeColor2: '#674C9E',

            activeSocketColor: '#9A74DE'
        },
        addMeta: {
            name: 'or',
            symbol: '|',
            tag: 'gate-or'
        },
    }),

    Output(),
    Input(),
    DynamicState(args => args.some(e => e))
]);

export const GateNot = Entity(({ x, y }) => [
    ...ElementBase({
        x, y,
        style: {
            ...BaseStyle,

            activeBackgroundColor: '#AA3274',

            activeStrokeColor1: '#9C125E',
            activeStrokeColor2: '#AA3274',

            activeSocketColor: '#DA1580'
        },
        addMeta: {
            name: 'not',
            symbol: '~',
            tag: 'gate-not'
        },
    }),

    Output(),
    Input(),
    DynamicState(args => !args.some(e => e))
]);

export const GateXor = Entity(({ x, y }) => [
    ...ElementBase({
        x, y,
        style: {
            ...BaseStyle,

            activeBackgroundColor: '#2AA3A3',

            activeStrokeColor1: '#247C7C',
            activeStrokeColor2: '#2AA3A3',

            activeSocketColor: '#38CECE'
        },
        addMeta: {
            name: 'xor',
            symbol: '+',
            tag: 'gate-xor'
        },
    }),

    Output(),
    Input(),
    DynamicState(args => args.reduce((a, b) => a ^ b))
]);

export const GateNand = Entity(({ x, y }) => [
    ...ElementBase({
        x, y,
        style: {
            ...BaseStyle,

            activeBackgroundColor: '#C7973F',

            activeStrokeColor1: '#99742F',
            activeStrokeColor2: '#C7973F',

            activeSocketColor: '#E5AD43'
        },
        addMeta: {
            name: 'nand',
            symbol: '!',
            tag: 'gate-nand'
        },
    }),

    Output(),
    Input(),
    DynamicState(args => !args.every(e => e))
]);

export function getElementByTag(tag, args) {
    return {
        'gate-nand': GateNand(args),
        'gate-xor': GateXor(args),
        'gate-and': GateAnd(args),
        'gate-not': GateNot(args),
        'gate-or':  GateOr(args),
        'lamp':     Lamp(args),
        'switch':   Switch(args),
        'button':   Button(args)
    }[tag];
}

export class WirelySystem {
    constructor() {
        this.id = 'wirely-system';
    }

    init(engine) {
        this.engine = engine;

        this.pipes = [];
        this.connections = new Map();

        this.elementToSocket = new Map();
        this.elementsToPipes = new Map();


        this.controller = new AbortController();
        document.addEventListener('keydown', e => {
            if (e.key === 'Delete') this.deleteSelected();
        });

        document.addEventListener('mousemove', e => {
            if (!this.newpipe) return;

            const { x, y } = EventSystem.convertCoordinates(e, engine.context.cnv, engine.context);
            const socket = engine.getEntities(entity => entity.has('socket'))
                .find(socket => {
                    const dx = socket.position.x - x;
                    const dy = socket.position.y - y;

                    return dx * dx + dy * dy <= 64;
                });

            const finalX = socket ? socket.position.x : x;
            const finalY = socket ? socket.position.y : y;

            const meta = this.newpipe.meta;
            if (meta.start) {
                meta.posend.x = finalX;
                meta.posend.y = finalY;
            } else {
                meta.posstart.x = finalX;
                meta.posstart.y = finalY;
            }
        }, { signal: this.controller.signal });
        this._startPipeBuild = (socket, e) => {
            const meta = socket.get('socket');
            meta.type === 'output' ?
                this.newpipe = Pipe({ start: socket, posstart: socket.get('position'), posend: { x: e.mouseX, y: e.mouseY } }) :
                this.newpipe = Pipe({ end: socket, posstart: { x: e.mouseX, y: e.mouseY }, posend: socket.get('position') });
            this.engine.addEntity(this.newpipe);
        };
        this._endPipeBuild = (socket, e) => {
            const { x, y } = EventSystem.convertCoordinates(e, engine.context.cnv, engine.context);
            const find = engine.getEntities(entity => entity.has('socket'))
                .find(socket => {
                    const dx = socket.position.x - x;
                    const dy = socket.position.y - y;

                    return dx * dx + dy * dy <= 64;
                });
            if (find) {
                const startSocket = this.newpipe.meta.start || find;
                const endSocket = this.newpipe.meta.end || find;

                if (startSocket.meta.type !== endSocket.meta.type) {
                    this.linking(startSocket.meta.element, endSocket.meta.element);
                }
            }

            this.engine.removeEntity(this.newpipe.id);
            this.newpipe = undefined;
        };
    }

    dispose() {
        this.controller.abort();
    }

    preprocess(time, delta) {
        if (this.engine.context.running) {
            const evals = new Set();
            const next = element => {
                if (!evals.has(element)) {
                    evals.add(element);

                    const connect = this.connections.get(element);
                    if (connect) {
                        element.state.evaluate?.([...connect].map(e => e.state.value), time, delta);
                    }
                }
            };

            this.engine.getEntities(entity => entity.has('element'))
                .forEach(element => next(element));
        }
    }

    // api

    serialize() {
        const elements = this.engine
            .getEntities(entity => entity.has('element'))
            .map(element => ({
                id: element.id,
                tag: element.meta.tag,
                x: element.position.x,
                y: element.position.y
            }));

        const connections = { };
        for (const [end, connection] of this.connections) {
            connections[end.id] = [...connection].map(element => element.id);
        }

        return { elements, connections };
    }

    deserialize(data) {
        const { elements, connections } = data;
        if (!elements || !connections) {
            throw new Error('The elements and connections were not found.');
        }

        this.deleteAll();

        const mapIds = new Map();
        const idToElements = new Map();
        for (const element of elements) {
            const e = getElementByTag(element.tag, { x: element.x, y: element.y });
            this.addElement(e);

            mapIds.set(element.id, e.id);
            idToElements.set(e.id, e);
        }

        for (const end in connections) {
            for (const start of connections[end]) {
                const idStart = mapIds.get(start);
                const idEnd = mapIds.get(end);

                this.linking(idToElements.get(idStart), idToElements.get(idEnd));
            }
        }
    }

    linking(startElement, endElement) {
        if (startElement === endElement) return;

        const startSocket = this.elementToSocket.get(startElement).output;
        const endSocket = this.elementToSocket.get(endElement).input;

        if (!startSocket || !endSocket) return;

        const connection = this.connections.get(endElement) || new Set();
        if (!connection.has(startElement)) {
            connection.add(startElement);
            this.connections.set(endElement, connection);

            const pipe = Pipe({ start: startSocket, end: endSocket });
            if (!this.elementsToPipes.get(startElement)) {
                this.elementsToPipes.set(startElement, new WeakMap());
            }
            this.elementsToPipes.get(startElement).set(endElement, pipe);
            this.engine.addEntity(pipe);
        }
    }

    unlink(startElement, endElement) {
        const pipe = this.elementsToPipes.get(startElement)?.get(endElement);
        if (pipe) {
            this.connections.get(endElement).delete(startElement);
            if (this.connections.get(endElement).size === 0) {
                this.connections.delete(endElement);
            }

            this.engine.removeEntity(pipe.id);
        }
    }

    addElement(element) {
        this.engine.addEntity(element);
        this.elementToSocket.set(element, { input: undefined, output: undefined });

        if (element.has('input'))  this._bindSocket(element, 'input');
        if (element.has('output')) this._bindSocket(element, 'output');
    }

    deleteElement(element) {
        [...this.connections.entries()].forEach(([endElement, connection]) => {
            if (element === endElement) {
                connection.forEach((startElement) => this.unlink(startElement, endElement));
            } else if (connection.has(element)) {
                this.unlink(element, endElement);
            }
        });

        const sockets = this.elementToSocket.get(element);
        this.elementToSocket.delete(element);

        this.engine.removeEntity(element.id);
        this.engine.removeEntity(sockets.input?.id);
        this.engine.removeEntity(sockets.output?.id);
    }

    deleteSelected() {
        const eventSystem = this.engine.getSystem('event-system');

        const selected = [...eventSystem.selected];

        selected.filter(entity => entity.has('element'))
            .forEach(element => this.deleteElement(element));

        selected.filter(entity => entity.has('pipe'))
            .forEach(pipe => {
                this.unlink(pipe.meta.start.meta.element, pipe.meta.end.meta.element);
            });
    }

    deleteAll() {
        [...this.engine.getEntities(entity => entity.has('element'))]
            .forEach(element => this.deleteElement(element));
    }

    // utility

    _bindSocket(element, type) {
        const socket = Socket({ element, type });

        socket.add(ClickOn(this._startPipeBuild));
        socket.add(ClickOff(this._endPipeBuild));

        this.engine.addEntity(socket);
        this.elementToSocket.get(element)[type] = socket;
    }
}

export class PipeSystem {
    constructor() {
        this.id = 'pipe-system';
    }

    init(engine) {
        this.engine = engine;
        this.pipes = [];

        this.controller = Entity(() => [
            Drawable((ctx, cnv, _, time, delta) => {
                this.pipes.sort((a, b) => a.meta.start?.meta.element.state.value - b.meta.start?.meta.element.state.value);

                this.pipes.forEach(e => {
                    ctx.save();

                    const route = e.meta.route;

                    const start = e.meta.start;
                    const end = e.meta.end;

                    ctx.beginPath();
                    ctx.moveTo(route[0].x, route[0].y);
                    for (let i = 1; i < route.length; ++i) {
                        ctx.lineTo(route[i].x, route[i].y);
                    }

                    const aberration = (!start || !end || e.select.state);
                    const enable = start?.meta.element.state.value;

                    let lineWidth       = aberration ? PipeStyle.aberrationLineWidth : PipeStyle.defaultLineWidth;
                    let strokeColor     = aberration ? PipeStyle.aberrationStrokeColor : PipeStyle.defaultStrokeColor;
                    let backgroundColor = aberration ? PipeStyle.aberrationBackgroundColor : PipeStyle.defaultBackgroundColor;

                    if (enable && !aberration) {
                        strokeColor = start.meta.element.meta.style.activeStrokeColor1;
                        backgroundColor = start.meta.element.meta.style.activeStrokeColor2;
                    }

                    ctx.lineWidth = lineWidth;
                    ctx.strokeStyle = backgroundColor;

                    ctx.stroke();

                    ctx.strokeStyle = strokeColor;
                    ctx.setLineDash([10, 5]);
                    if ((aberration || enable) && engine.context.running) ctx.lineDashOffset = -time / 25;

                    ctx.stroke();

                    ctx.restore();
                });

                this.pipes.forEach(e => {
                    ctx.save();

                    const route = e.meta.route;

                    const start = e.meta.start;
                    const end = e.meta.end;

                    const aberration = (!start || !end || e.select.state);
                    const enable = start?.meta.element.state.value;

                    if (aberration) {
                        ctx.lineWidth = PipeStyle.aberrationLineWidth;
                        ctx.strokeStyle = PipeStyle.aberrationStrokeColor;
                    } else if (enable) {
                        ctx.lineWidth = PipeStyle.defaultLineWidth;
                        ctx.strokeStyle = start.meta.element.meta.style.activeStrokeColor1;
                    } else {
                        ctx.lineWidth = PipeStyle.defaultLineWidth;
                        ctx.strokeStyle = PipeStyle.defaultStrokeColor;
                    }

                    ctx.fillStyle = 'black';

                    for (let i = 0; i < route.length; ++i) {
                        ctx.beginPath()
                        ctx.arc(route[i].x, route[i].y, PipeStyle.dotSize, 0, Math.PI * 2);

                        ctx.fill();
                        ctx.stroke();
                    }

                    ctx.restore();
                });

            }, 5)
        ])();
        this.engine.addEntity(this.controller);
    }

    dispose() {
        this.pipes = [];
        this.engine.removeEntity(this.controller.id);
    }

    match(e) {
        return e.has('pipe');
    }

    entityAdded(entity) {
        this.pipes.push(entity);
    }

    entityRemoved(entity) {
        this.pipes = this.pipes.filter(e => e !== entity);
    }
}
