import type { PluginContext, AnyTouchEvent } from '@any-touch/shared';
import {
    TYPE_END,
    TYPE_CANCEL,
    isDisabled,
    flow,
    getStatusName,
    resetState,
    isRecognized,
    createPluginContext,
} from '@any-touch/shared';
import { ComputeScale, ComputeVectorForMutli } from '@any-touch/compute';
import Core from '@any-touch/core';

/**
 * 默认选项
 */
const DEFAULT_OPTIONS = {
    name: 'pinch',
    // 触发事件所需要的最小缩放比例
    threshold: 0,
    pointLength: 2,
};

/**
 * 实例
 */
type PinchContext = PluginContext & typeof DEFAULT_OPTIONS;

/**
 * 扩展插件映射
 */
declare module '@any-touch/core' {
    interface PluginContextMap {
        pinch: PinchContext;

    }

    interface EventMap {
        pinch: AnyTouchEvent;
        pinchstart: AnyTouchEvent;
        pinchmove: AnyTouchEvent;
        pinchend: AnyTouchEvent;
        pinchcancel: AnyTouchEvent;
        pinchin: AnyTouchEvent;
        pinchout: AnyTouchEvent;
    }
}

/**
 * "啮合"识别器
 * @param at AnyTouch实例
 * @param options 识别器选项
 * @returns
 */
export default function (at: Core, options?: Partial<typeof DEFAULT_OPTIONS>): PinchContext {
    const context = createPluginContext(DEFAULT_OPTIONS, options);
    // 加载计算方法, 有前后顺序
    at.compute([ComputeVectorForMutli, ComputeScale], (computed) => {
        // 重置status
        resetState(context);

        // 禁止
        if (isDisabled(context)) return;
        const isValid = test();

        context.state = flow(isValid, context.state, computed.phase);
        // console.log(computed.scale,computed.phase,context.state);

        const { name } = context;
        if (isValid) {
            at.emit2(name, computed, context);
            // pinchin | pinchout
            const { deltaScale } = computed;
            if (1 !== deltaScale) {
                at.emit2(name + (1 < deltaScale ? 'in' : 'out'), computed, context);
            }
        }

        const stateName = getStatusName(context.state);
        if (stateName) {
            at.emit2(name + stateName, computed, context);
        }

        // 是否满足条件
        function test() {
            // context.state 是上一个状态
            const { pointLength, scale, deltaScale, phase } = computed;

            return (
                (context.pointLength === pointLength &&
                    ((void 0 !== scale && void 0 !== deltaScale && context.threshold < Math.abs(scale - 1)) ||
                        isRecognized(context.state))) ||
                // pinchend | pinchcancel
                (isRecognized(context.state) && [TYPE_END, TYPE_CANCEL].includes(phase))
            );
        }
    });

    return context;
}

