/// WebXR playground - to be refactored into a reasonable file structure later

import { assert } from './auxiliaries';
import { Canvas } from './canvas';
import { Controllable } from './controller';
import { Renderer } from './renderer';
import { RenderView } from './renderview';
import {
    XRDevice,
    XRFrame,
    XRFrameOfReference, XRFrameOfReferenceOptions, XRFrameOfReferenceType,
    XRSession, XRSessionCreationOptions,
    XRWebGLLayerInit,
} from './webxr';

export function supportsXR(): boolean {
    return navigator.xr !== undefined;
}

// tslint:disable-next:member-ordering
export class XRController {
    private onXRFrameCallback = this.onXRFrame.bind(this);
    private renderViews: RenderView[] = [new RenderView()];

    // Configuration options for setting up and XR session.

    sessionCreationOptions: XRSessionCreationOptions;
    /**
     * Attributes for WebGL context creation. `compatibleXRDevice` will be set
     * automatically after session creation.
     */
    contextAttributes: WebGLContextAttributes = {};
    webGLLayerInit?: XRWebGLLayerInit;
    frameOfRefType: XRFrameOfReferenceType = 'eye-level';
    frameOfRefOptions?: XRFrameOfReferenceOptions;

    device: XRDevice | undefined;
    session: XRSession | undefined;
    canvas: Canvas | undefined;
    gl: any;
    frameOfRef: XRFrameOfReference | undefined;

    renderer: Renderer;

    /**
     * Hints:
     * To mirror the content of an immersive session to a canvas on the page:
     *
     * ```
     * let mirrorCanvas = document.createElement('canvas');
     * document.body.appendChild(mirrorCanvas);
     * let ctx = mirrorCanvas.getContext('xrpresent');
     * let xrc = new XRController({
     *     immersive: true,
     *     outputContext: ctx;
     * })
     * ```
     * To create a 'magic window', do the same, but with `immersive` set to `false`.
     */
    constructor(sessionOpts?: XRSessionCreationOptions) {
        this.sessionCreationOptions = sessionOpts || {};
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
            await this.device!.supportsSession(this.sessionCreationOptions);
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
        this.session = await this.device!.requestSession(this.sessionCreationOptions);

        const canvasEl = document.createElement('canvas');
        // TODO!: external canvas?
        // TODO!!: check what happens to old canvas when switching from magic window to immersive
        this.canvas = new Canvas(canvasEl, this.contextAttributes, this);
        this.gl = this.canvas.context.gl;

        this.session.baseLayer = new XRWebGLLayer(this.session, this.gl, this.webGLLayerInit);
        this.frameOfRef = await this.session.requestFrameOfReference(this.frameOfRefType, this.frameOfRefOptions);

        this.session.requestAnimationFrame(this.onXRFrameCallback);

        this.session.addEventListener('end', () => this.onEndSession());
    }

    async endSession(): Promise<void> {
        await this.session!.end();
    }

    onEndSession() {
        this.session = undefined;
        this.canvas = undefined;
        this.gl = undefined;
        this.frameOfRef = undefined;
    }

    onXRFrame(time: number, frame: XRFrame) {
        // TODO!!!: handle undefined after session end
        this.session!.requestAnimationFrame(this.onXRFrameCallback);
        const gl = this.gl;

        const pose = frame.getDevicePose(this.frameOfRef!);
        // Getting the pose may fail if, for example, tracking is lost.
        if (pose) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.session!.baseLayer.framebuffer);

            for (let i = 0; i < frame.views.length; ++i) {
                const view = frame.views[i];
                if (!this.renderViews[i]) {
                    this.renderViews[i] = new RenderView();
                }
                this.renderViews[i].set(
                    view.projectionMatrix,
                    pose.getViewMatrix(view),
                    this.session!.baseLayer.getViewport(view)!,
                );
            }

            this.renderer.frame(0, this.renderViews);
        } else {
            // TODO!: how to handle?
            console.warn('no pose - this is not handled yet.');
        }
    }

    // TODO!!: stub other controller methods/properties
    // tslint:disable-next-line:member-ordering
    _block = false;
    block() {
        this._block = true;
    }
    get blocked() {
        // TODO!?
        return this._block;
    }
    unblock() {
        // TODO!?
        this._block = false;
    }
    set controllable(c: Controllable) {
        this.renderer = c as Renderer;
    }
    update(force: boolean = false): void {
        // TODO:!?
    }
}
