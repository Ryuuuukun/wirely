import { AnimateSystem } from "./base/anime";
import { DrawSystem } from "./base/drawable";
import { EventSystem } from "./base/interactive";
import { Engine3, TickSystem } from "./ecs";
import { StackSystem } from "./node/stack";
import { PipeSystem, WirelySystem } from "./node/wirely";

export class Wirely {
    constructor(context) {
        this.context = context || { };
    }

    init(canvas, context) {
        this.engine = new Engine3();
        this.engine.context = this.context;

        this.events = new EventSystem();
        this.wirely = new WirelySystem();

        this.engine.addSystems(
            new TickSystem(),
            this.events,
            new DrawSystem(canvas, context, this.engine),
            new AnimateSystem(),

            this.wirely,
            new StackSystem(),
            new PipeSystem()
        );
    }

    dispose() {
        this.engine.dispose();
    }

    launch() {
        this.engine.launch();
    }

    // api

    serialize() {
        return this.wirely.serialize();
    }

    deserialize(data) {
        this.wirely.deserialize(data);
    }

    addElement(element) {

        this.wirely.addElement(element);
    }

    deleteSelected() {
        this.wirely.deleteSelected();
    }

    deleteAll() {
        this.wirely.deleteAll();
    }

    setRunning(value) {
        this.context.running = value;
    }

    setTickrate(value) {
        this.context.tickrate = value;
    }

    setWindowScale(value, x, y) {
        x = x || this.context.cnv.width / 2;
        y = y || this.context.cnv.height / 2;

        value = Math.max(this.context.MIN_SCALE, Math.min(this.context.MAX_SCALE, value));

        this.context.dx = x - (x - this.context.dx) * (value / this.context.scale);
        this.context.dy = y - (y - this.context.dy) * (value / this.context.scale);

        this.context.scale = value;
    }

    setWindowPosition(x, y) {
        this.context.dx = x;
        this.context.dy = y;
    }

    getCenterSchema() {
        if (!this.engine) return;

        const elements = this.engine.getEntities(e => e.has('element'));

        let x = 0;
        let y = 0;
        elements.forEach(e => {
            x += e.position.x;
            y += e.position.y;
        });

        return { x: x / elements.length, y: y / elements.length };
    }

    getRectSchema() {
        if (!this.engine) return;

        const elements = this.engine.getEntities(e => e.has('element'));

        let min = { x: +Infinity, y: +Infinity };
        let max = { x: -Infinity, y: -Infinity };
        elements.forEach(e => {
            min.x = Math.min(e.position.x, min.x);
            min.y = Math.min(e.position.y, min.y);
            max.x = Math.max(e.position.x, max.x);
            max.y = Math.max(e.position.y, max.y);
        });

        return { min, max };
    }

    getCountElements() {
        return this.engine?.getEntities(e => e.has('element')).length;
    }
}
