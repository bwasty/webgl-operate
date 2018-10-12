/// WebXR playground - to be refactored into a reasonable file structure later

import { assert } from './auxiliaries';
import { Canvas } from './canvas';
import { Controllable } from './controller';
import { Renderer } from './renderer';

export function supportsXR(): boolean {
    return navigator.xr !== undefined;
}

/**
 * Helper class to hold render configuration per XRView,
 * i.e. per eye for standard VR/AR
 */
export class RenderView {
    constructor(
        public projectionMatrix: Float32Array,
        public viewMatrix: Float32Array,
        public viewport: XRViewport) {
    }
}

// tslint:disable-next-line:max-classes-per-file
export class XRController {
    // Configuration options for setting up and XR session.

    sessionCreationOptions?: XRSessionCreationOptions;
    /**
     * Attributes for WebGL context creation. `compatibleXRDevice` will be set
     * automatically after session creation.
     */
    contextAttributes: WebGLContextAttributes = {};
    webGLLayerInit?: XRWebGLLayerInit;
    frameOfRefType: XRFrameOfReferenceType = 'eye-level';
    frameOfRefOptions?: XRFrameOfReferenceOptions;

    device: XRDevice;
    session: XRSession | undefined;
    gl: any;
    frameOfRef: XRFrameOfReference | undefined;

    renderer: Renderer;

    constructor(sessionOpts?: XRSessionCreationOptions) {
        this.sessionCreationOptions = sessionOpts;
    }

    /**
     * Initializes `this.device` and checks if it supports sessions with the configured creation options.
     * @throws {NotFoundError} - No devices found.
     * @returns - whether initialization was successful
     */
    async initialize(): Promise<void> {
        assert(supportsXR(), 'WebXR not supported by browser');
        this.device = await navigator.xr.requestDevice();
        this.contextAttributes.compatibleXRDevice = this.device;
    }

    /**
     * Checks whether device supports a session with `this.sessionCreationOptions`.
     * Must call `initialize` before.
     */
    async supportsSession(): Promise<boolean> {
        assert(this.device !== undefined, 'this.device not initialized');
        try {
            await this.device.supportsSession(this.sessionCreationOptions);
            return true;
        } catch (e) { // === null
            return false;
        }
    }

    /**
     * Request an XR session (`this.session`) using `this.sessionCreationOptions`
     * and initialize WebGL context and `frameOfRef`.
     * May fail with:
     * - NotSupportedError if the options are not supported
     * - InvalidStateError if options.immersive is true and the device already has an immersive session
     * - SecurityError if options.immersive is true and the algorithm is not triggered by user activation
     */
    async requestSession(): Promise<void> {
        this.session = await this.device.requestSession(this.sessionCreationOptions);

        const canvasEl = document.createElement('canvas');
        // TODO!: external canvas?
        const canvas = new Canvas(canvasEl, this.contextAttributes);
        this.gl = canvas.context.gl;

        this.session.baseLayer = new XRWebGLLayer(this.session, this.gl, this.webGLLayerInit);
        this.frameOfRef = await this.session.requestFrameOfReference(this.frameOfRefType, this.frameOfRefOptions);

        this.session.requestAnimationFrame(() => this.onXRFrame);

        this.session.addEventListener('end', () => this.onEndSession());
    }

    async endSession(): Promise<void> {
        await this.session!.end();
    }

    onEndSession() {
        this.session = undefined;
        this.gl = undefined;
        this.frameOfRef = undefined;
    }

    onXRFrame(time: number, frame: XRFrame) {
        this.session!.requestAnimationFrame(() => this.onXRFrame);
        const gl = this.gl;

        const pose = frame.getDevicePose(this.frameOfRef!);
        // Getting the pose may fail if, for example, tracking is lost.
        if (pose) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.session!.baseLayer.framebuffer);

            const renderViews = [];
            for (const view of frame.views) {
                renderViews.push(new RenderView(
                    view.projectionMatrix,
                    pose.getViewMatrix(view),
                    this.session!.baseLayer.getViewport(view)!,
                ));
            }

            this.renderer.frame(0, renderViews);
        } else {
            // TODO!: how to handle?
        }
    }

    // TODO!!: stub other controller methods/properties
    block() {
        // TODO!?
    }
    get blocked() {
        return false;
    }
    unblock() {
        // TODO!?
    }
    set controllable(c: Controllable) {
        this.renderer = c as Renderer;
    }
    update(force: boolean = false): void {
        // TODO:!?
    }
}
