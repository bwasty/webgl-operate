// tslint:disable:member-ordering
// tslint:disable:max-classes-per-file

// TODO!: publish interfaces derived from spec on npm (@types)?

/// All types are derived from the WebXR WebIDL:
/// https://immersive-web.github.io/webxr/#idl-index
/// Last sync with the spec: 2018-07-21

export type EventHandler = (ev: Event) => void;

/**
 * Reference: https://immersive-web.github.io/webxr-reference/webxr-device-api/xr
 * Specification: https://immersive-web.github.io/webxr/#xr
 */
export interface XR extends EventTarget {
    requestDevice(): Promise<XRDevice>;
    ondevicechange: EventHandler;
}

declare global {
    export interface Navigator {
        readonly xr: XR;
    }
}

/**
 * Reference: https://immersive-web.github.io/webxr-reference/webxr-device-api/xrdevice
 * Specification: https://immersive-web.github.io/webxr/#xrdevice
 */
export interface XRDevice {
    supportsSession(options?: XRSessionCreationOptions): Promise<void>;
    requestSession(options?: XRSessionCreationOptions): Promise<XRSession>;
}

/** Specification: https://immersive-web.github.io/webxr/#dictdef-xrsessioncreationoptions */
export interface XRSessionCreationOptions {
    /** Defaults to false. */
    immersive?: boolean;
    outputContext?: XRPresentationContext;
}

/** Specification: https://immersive-web.github.io/webxr/#enumdef-xrenvironmentblendmode */
export type XREnvironmentBlendMode = 'opaque' | 'additive' | 'alpha-blend';

/**
 * Reference: https://immersive-web.github.io/webxr-reference/webxr-device-api/xrsession
 * Specification: https://immersive-web.github.io/webxr/#xrsession-interface
 */
export interface XRSession extends EventTarget {
    // Attributes
    readonly device: XRDevice;
    readonly immersive: boolean;
    readonly outputContext: XRPresentationContext;
    readonly environmentBlendMode: XREnvironmentBlendMode;

    depthNear: number;
    depthFar: number;
    baseLayer: XRWebGLLayer;

    // Methods
    requestFrameOfReference(type: XRFrameOfReferenceType, options?: XRFrameOfReferenceOptions):
        Promise<XRFrameOfReference>;

    getInputSources(): Array<XRInputSource>;

    requestAnimationFrame(callback: XRFrameRequestCallback): number;
    cancelAnimationFrame(handle: number): void;

    end(): Promise<void>;

    // Events
    onblur: XRSessionEventHandler;
    onfocus: XRSessionEventHandler;
    onresetpose: XRSessionEventHandler;
    onend: XRSessionEventHandler;
    onselect: XRInputSourceEventHandler;
    onselectstart: XRInputSourceEventHandler;
    onselectend: XRInputSourceEventHandler;
}

export type XRFrameRequestCallback = (time: number, frame: XRFrame) => void;

export interface XRFrame {
    readonly session: XRSession;
    readonly views: Array<XRView>;

    getDevicePose(coordinateSystem: XRCoordinateSystem): XRDevicePose | null;
    getInputPose(inputSource: XRInputSource, coordinateSystem: XRCoordinateSystem): XRInputPose | null;
}

export interface XRCoordinateSystem extends EventTarget {
    getTransformTo(other: XRCoordinateSystem): Float32Array | null;
}

export type XRFrameOfReferenceType = 'head-model' | 'eye-level' | 'stage';

export interface XRFrameOfReferenceOptions {
    /** Defaults to false */
    disableStageEmulation: boolean;
    /** Defaults to 0.0 */
    stageEmulationHeight: number;
}

export interface XRFrameOfReference extends XRCoordinateSystem {
    readonly bounds: XRStageBounds | null;
    readonly emulatedHeight: number;

    onboundschange: (ev: XRCoordinateSystemEvent) => void;
}

export interface XRStageBounds {
    readonly geometry: Array<XRStageBoundsPoint>;
}

export interface XRStageBoundsPoint {
    readonly x: number;
    readonly z: number;
}

export type XREye = 'left' | 'right';

export interface XRView {
    readonly eye: XREye;
    readonly projectionMatrix: Float32Array;
}

export interface XRViewport {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
}

export interface XRDevicePose {
    readonly poseModelMatrix: Float32Array;
    getViewMatrix(view: XRView): Float32Array;
}

export type XRHandedness = '' | 'left' | 'right';

export type XRTargetRayMode = 'gaze' | 'tracked-pointer' | 'screen';

export interface XRInputSource {
    readonly handedness: XRHandedness;
    readonly targetRayMode: XRTargetRayMode;
}

export interface XRInputPose {
    readonly emulatedPosition: boolean;
    readonly targetRayMatrix: Float32Array;
    readonly gripMatrix: Float32Array | null;
}

// tslint:disable-next-line:no-empty-interface
export interface XRLayer { }

export type XRWebGLRenderingContext = WebGLRenderingContext | WebGL2RenderingContext;

export interface XRWebGLLayerInit {
    /** Default: true */
    antialias: boolean;
    /** Default: false */
    depth: boolean;
    /** Default: false */
    stencil: boolean;
    /** Default: true */
    alpha: boolean;
    /** Default: false */
    multiview: boolean;
    /** Default: 1.0 */
    framebufferScaleFactor: number;
}

export interface XRWebGLLayer extends XRLayer {
    // Attributes
    readonly context: XRWebGLRenderingContext;

    readonly antialias: boolean;
    readonly depth: boolean;
    readonly stencil: boolean;
    readonly alpha: boolean;
    readonly multiview: boolean;

    readonly framebuffer: WebGLFramebuffer;
    readonly framebufferWidth: number;
    readonly framebufferHeight: number;

    // Methods
    getViewport(view: XRView): XRViewport | null;
    requestViewportScaling(viewportScaleFactor: number): void;
}

export interface XRWebGLLayerConstructor {
    new(session: XRSession, context: XRWebGLRenderingContext, layerInit?: XRWebGLLayerInit): XRWebGLLayer;
    getNativeFramebufferScaleFactor(session: XRSession): number;
}

declare global {
    export interface WebGLContextAttributes {
        /** Default: null */
        compatibleXRDevice?: XRDevice | null;
    }

    // tslint:disable-next-line:variable-name
    var XRWebGLLayer: XRWebGLLayerConstructor;
}


export interface WebGLRenderingContextBase {
    setCompatibleXRDevice(device: XRDevice): Promise<void>;
}

export interface XRPresentationContext {
    readonly canvas: HTMLCanvasElement;
}

// NOTE: ignoring constructors for events

export interface XRSessionEvent extends Event {
    readonly frame: XRFrame;
    readonly inputSource: XRInputSource;
}

export type XRSessionEventHandler = (ev: XRSessionEvent) => void;


export interface XRInputSourceEvent extends Event {
    readonly frame: XRFrame;
    readonly inputSource: XRInputSource;
}

export type XRInputSourceEventHandler = (ev: XRInputSourceEvent) => void;

export interface XRCoordinateSystemEvent extends Event {
    readonly coordinateSystem: XRCoordinateSystem;
}
