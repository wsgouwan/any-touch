import {
    isDisabled,
    resetState,
    TYPE_END, flow, getStatusName, createPluginContext, isRecognized, TYPE_CANCEL
} from '@any-touch/shared';
import type { PluginContext, AnyTouchEvent } from '@any-touch/shared';
import { ComputeDistance, ComputeDeltaXY, ComputeVAndDir } from '@any-touch/compute';
import Core from '@any-touch/core';

const DEFAULT_OPTIONS = { name: 'pan', threshold: 10, pointLength: 1 };

/**
 * 实例
 */
export type PanContext = PluginContext & typeof DEFAULT_OPTIONS;

/**
 * 扩展插件映射
 */
declare module '@any-touch/core' {
    interface PluginContextMap {
        pan: PanContext;
    }

    interface EventMap {
        pan: AnyTouchEvent;
        panstart: AnyTouchEvent;
        panmove: AnyTouchEvent;
        panend: AnyTouchEvent;
        pancancel: AnyTouchEvent;
        panup: AnyTouchEvent;
        pandown: AnyTouchEvent;
        panright: AnyTouchEvent;
        panleft: AnyTouchEvent;
    }
}

/**
 * "拖拽"识别器
 * @param at AnyTouch实例
 * @param options 识别器选项
 * @returns  识别器实例
 */
export default function (at: Core, options?: Partial<typeof DEFAULT_OPTIONS>): PanContext {
    const context = createPluginContext(DEFAULT_OPTIONS, options);

    // 加载计算方法
    at.compute([ComputeVAndDir, ComputeDistance, ComputeDeltaXY], computed => {
        // 重置status
        resetState(context);
        // 禁止
        if (isDisabled(context)) return;
        const isValid = test();

        context.state = flow(isValid, context.state, computed.phase);

        if (isValid) {
            const { name } = context;
            at.emit2(name, computed, context);
            at.emit2(name + getStatusName(context.state), computed, context);
            if (![TYPE_END, TYPE_CANCEL].includes(computed.phase) && computed.direction) {
                at.emit2(name + computed.direction, computed, context);
            }
        }

        // 是否满足条件
        function test() {
            const { pointLength, distance, direction, phase } = computed;
            const { state } = context;
            return (
                ((isRecognized(state) || (context.threshold <= distance)) &&
                    context.pointLength === pointLength &&
                    void 0 !== direction) ||
                (isRecognized(state) && [TYPE_CANCEL, TYPE_END].includes(phase))
            );
        }
    });
    return context;
}

