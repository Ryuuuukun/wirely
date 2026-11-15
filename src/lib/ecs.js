export class ComponentInstance {
    constructor(value, tag) {
        this.value = value;
        this.tag = tag;
    }
}

export class EntityInstance {
    constructor(components) {
        this.id = crypto.randomUUID();
        this.components = Object.fromEntries(components
            .map(component => [component.tag, component]));
    }

    has(tag) {
        return tag in this.components;
    }

    get(tag) {
        return this.components[tag]?.value;
    }

    add(component) {
        this.components[component.tag] = component;
    }

    remove(tag) {
        this.components[tag] = undefined;
    }
}

export class Engine3 {
    constructor(context) {
        this.entities = new Map();
        this.systems  = new Map();
        this.context = context || {};

        this.entitiesToRemove = new Set();
        this.systemsToRemove = new Set();
    }

    addEntity(entity) {
        if (!this.entities.has(entity.id)) {
            this.entities.set(entity.id, entity);
            this.systems
                .forEach(system => {
                    if (system.match?.(entity)) {
                        system.entityAdded?.(entity);
                    }
                });
        }
    }

    addEntities(...entities) {
        entities.forEach(entity => this.addEntity(entity));
    }

    removeEntity(id) {
        if (this.entities.has(id)) {
            this.entitiesToRemove.add(this.entities.get(id));
        }
    }

    getEntities(predicate) {
        return [...this.entities.values()].filter(entity => predicate(entity));
    }

    addSystem(system) {
        this.systems.set(system.id, system);
    }

    addSystems(...systems) {
        systems.forEach(system => this.addSystem(system));
    }

    removeSystem(id) {
        if (this.systems.has(id)) {
            this.systemsToRemove.add(this.systems.get(id));
        }
    }

    getSystem(id) {
        return this.systems.get(id);
    }

    update(time, delta) {
        this.systems
            .forEach(system => {
                if (this.systemsToRemove.has(system)) return;

                system.preprocess?.(time, delta);
                this.entities
                    .forEach(entity => {
                        if (this.entitiesToRemove.has(entity)) return;

                        if (system.match?.(entity)) {
                            system.process?.(entity, time, delta);
                        }
                    });
                system.postprocess?.(time, delta);
            });
        this._flushEntitiesToRemove();
        this._flushSystemsToRemove();
    }

    _flushEntitiesToRemove() {
        if (this.entitiesToRemove.size === 0) return;

        this.entitiesToRemove
            .forEach(entity => {
                this.entities.delete(entity.id);
                this.systems.forEach(system => {
                    if (system.match?.(entity)) {
                        system.entityRemoved?.(entity);
                    }
                });
            });
        this.entitiesToRemove.clear();
    }

    _flushSystemsToRemove() {
        if (this.systemsToRemove.size === 0) return;

        this.systemsToRemove
            .forEach(system => {
                system.dispose?.(this);
            });
        this.systemsToRemove.clear();
    }

    launch() {
        this.runnnig = true;

        let timestamp = performance.now();
        const frame = time => {
            this.update(time, time - timestamp);
            timestamp = time;

            requestAnimationFrame(frame);
        };

        this.systems.forEach(system => system.init?.(this));
        requestAnimationFrame(frame);
    }

    dispose() {
        this.running = false;
        this.systems.forEach(system => system.dispose?.(this));
    }
}

export class Engine2 {
    constructor(context) {
        this.entities = new Map();
        this.systems = new Map();
        this.context = context || {};

        this.running = true;
        this.toRemove = new Set();
    }

    addSystem(system) {
        this.systems.set(system.id, system);
    }

    addEntity(entity) {
        if (!this.entities.has(entity.id)) {
            this.entities.set(entity.id, entity);
            this.systems
                .forEach(system => {
                    if (system.match?.(entity)) {
                        system.entityAdded?.(entity);
                    }
                });
        }
    }

    addEntities(...entities) {
        entities.forEach(entity => this.addEntity(entity));
    }

    removeEntity(id) {
        if (this.entities.has(id)) {
            this.toRemove.add(this.entities.get(id));
        }
    }

    update(delta) {
        this.systems
            .forEach(system => {
                system.preprocess?.();
                this.entities.forEach(entity => {
                    if (this.toRemove.has(entity.id)) return;

                    if (!system.native && system.match?.(entity)) {
                        system.process(entity, delta);
                    }
                });
                system.postprocess?.();
            });
        this._flushToRemove();
    }

    launch() {
        this.runnnig = true;

        let timestamp = performance.now();
        const frame = time => {
            this.update(time - timestamp);
            timestamp = time;

            requestAnimationFrame(frame);
        };

        this.systems.forEach(system => system.init?.(this));
        requestAnimationFrame(frame);
    }

    dispose() {
        this.running = false;
        this.systems.forEach(system => system.dispose?.(this));
    }

    _flushToRemove() {
        if (this.toRemove.size === 0) return;

        this.toRemove
            .forEach(entity => {
                this.entities.delete(entity.id);
                this.systems.forEach(system => {
                    if (system.match?.(entity)) {
                        system.entityRemoved?.(entity);
                    }
                });
            });
        this.toRemove.clear();
    }
}

export function Component({ schema, tag }) {
    return (...args) => new ComponentInstance(schema?.(...args), tag);
}

export function Entity(schema) {
    return (...args) => new Proxy(new EntityInstance(schema(...args)), {
        set(target, prop, value) {
            if (prop in target) {
                target[prop] = value;
                return true;
            }

            target.components.set(prop, value);
            return true;
        },
        get(target, prop) {
            if (typeof prop === 'symbol' || prop.startsWith?.('__v_') || prop in target) {
                return typeof target[prop] === 'function' ? target[prop].bind(target) : target[prop];
            }
            return target.get(prop);
        }
    });
}

export const Tick = Component({ schema: callback => ({ callback }), tag: 'tick' });

export class TickSystem {
    constructor() {
        this.id = crypto.randomUUID();
    }

    match(e) {
        return e.has('tick');
    }

    process(entity, time, delta) {
        entity.get('tick').callback(entity, time, delta);
    }
}
