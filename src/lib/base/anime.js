import { Component } from "../ecs";

export const Animate = Component({
    schema: animators => ({
        animators: new Map(Object.entries(animators)),
        get(tag) {
            return this.animators.get(tag);
        }
    }), tag: 'animate'
});

export class NumberAnimate {
    constructor(value) {
        this.value = value;
    }

    to({
        from = this.value,
        to,

        duration = 100,
        wait = 0,

        timing = time => time,

        pre,
        post
    }) {
        this.stop();
        this.timeout = setTimeout(() => {
            this.start = from;
            this.delta = to - from;

            this.starttime = performance.now();
            this.duration = duration;
            this.timing = timing;
            this.progress = 0;
            this.post = post;
            this.run = true;

            pre?.();
        }, wait);
    }

    stop() {
        clearTimeout(this.timeout);
        this.run = false;
    }

    update(time, delta) {
        if (this.run) {
            this.progress = (time - this.starttime) / this.duration;
            if (this.progress > 1) {
                this.progress = 1;
            }

            this.value = this.start + this.delta * this.timing(this.progress);
            if (this.progress >= 1) {
                this.run = false;
                this.post?.();
            }
        }
    }
}

export class AnimateSystem {
    constructor() {
        this.id = 'animate-system';
    }

    match(e) {
        return e.has('animate');
    }

    process(entity, time, delta) {
        entity.animate.animators
            .forEach(value => value.update(time, delta));
    }
}
